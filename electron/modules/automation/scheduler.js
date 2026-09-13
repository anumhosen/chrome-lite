const { Notification } = require("electron");
const db = require("../../services/database");
const logger = require("../../services/logger").forSubsystem("Scheduler");
const headlessRunner = require("./headlessRunner");

class AutomationScheduler {
  constructor() {
    this.timer = null;
    this.automationService = null;
    this.getMainWindow = null;
    this.runningTaskIds = new Set();
  }

  init(automationService, getMainWindow) {
    this.automationService = automationService;
    this.getMainWindow = getMainWindow;
    this.start();
    logger.info("Automation Scheduler initialized and background timer started");
  }

  start() {
    if (this.timer) clearInterval(this.timer);
    // Tick every 20 seconds
    this.timer = setInterval(() => this.tick(), 20000);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  // --- Cron & Interval Matching ---

  parseIntervalMs(val) {
    if (!val) return 15 * 60 * 1000;
    const str = String(val).trim().toLowerCase();
    const match = str.match(/^(\d+)([mhd]?)$/);
    if (!match) {
      const num = parseInt(str, 10);
      return isNaN(num) ? 15 * 60 * 1000 : num * 60 * 1000;
    }
    const count = parseInt(match[1], 10);
    const unit = match[2] || 'm';
    if (unit === 'h') return count * 3600 * 1000;
    if (unit === 'd') return count * 86400 * 1000;
    return count * 60 * 1000; // minutes
  }

  matchCronField(field, value, min, max) {
    if (field === "*") return true;
    if (field.includes("/")) {
      const [range, step] = field.split("/");
      const stepNum = parseInt(step, 10);
      if (isNaN(stepNum) || stepNum <= 0) return false;
      const start = range === "*" ? min : parseInt(range, 10);
      return (value - start) % stepNum === 0 && value >= start && value <= max;
    }
    if (field.includes(",")) {
      return field.split(",").map((s) => parseInt(s.trim(), 10)).includes(value);
    }
    if (field.includes("-")) {
      const [from, to] = field.split("-").map((s) => parseInt(s.trim(), 10));
      return value >= from && value <= to;
    }
    return parseInt(field, 10) === value;
  }

  isCronDue(cronExpr, lastRunDate = null, now = new Date()) {
    // Avoid double running within the same minute
    if (lastRunDate && (now.getTime() - lastRunDate.getTime()) < 58000) {
      return false;
    }

    const parts = (cronExpr || "").trim().split(/\s+/);
    if (parts.length !== 5) return false;
    const [mField, hField, domField, monField, dowField] = parts;

    const m = now.getMinutes();
    const h = now.getHours();
    const dom = now.getDate();
    const mon = now.getMonth() + 1;
    const dow = now.getDay(); // 0 is Sunday

    return (
      this.matchCronField(mField, m, 0, 59) &&
      this.matchCronField(hField, h, 0, 23) &&
      this.matchCronField(domField, dom, 1, 31) &&
      this.matchCronField(monField, mon, 1, 12) &&
      this.matchCronField(dowField, dow, 0, 6)
    );
  }

  isTaskDue(task, now = new Date()) {
    if (!task.enabled) return false;
    const lastRunDate = task.last_run ? new Date(task.last_run) : null;

    if (task.schedule_type === "cron") {
      return this.isCronDue(task.schedule_value, lastRunDate, now);
    } else {
      // Default: interval
      const intervalMs = this.parseIntervalMs(task.schedule_value);
      if (!lastRunDate) return true;
      return (now.getTime() - lastRunDate.getTime()) >= intervalMs;
    }
  }

  // --- Background Scheduler Tick ---

  async tick() {
    try {
      const tasks = await this.getTasks();
      const now = new Date();

      for (const task of tasks) {
        if (this.runningTaskIds.has(task.id)) continue;
        if (this.isTaskDue(task, now)) {
          logger.info(`Task "${task.name}" (${task.id}) is due for execution`);
          this.executeTask(task).catch((err) => {
            logger.error(`Error executing scheduled task "${task.name}":`, err.message);
          });
        }
      }
    } catch (err) {
      logger.error("Error in scheduler tick:", err.message);
    }
  }

  // --- Execution & Notifications ---

  async executeTask(task) {
    if (this.runningTaskIds.has(task.id)) return;
    this.runningTaskIds.add(task.id);

    const taskId = task.id;
    logger.info(`Starting scheduled execution of task: ${task.name} (${taskId})`);

    let result = null;
    let flow = null;

    try {
      // 1. Fetch flow data
      if (task.flow_id) {
        flow = await this.automationService.getFlow(task.flow_id);
      }

      if (!flow) {
        throw new Error(`Flow not found for ID: ${task.flow_id}`);
      }

      // 2. Run headlessly
      result = await headlessRunner.runFlow(
        this.automationService,
        flow,
        task.target_url || null,
        (progress) => {
          this.broadcastProgress({ taskId, ...progress });
        }
      );
    } catch (err) {
      result = {
        success: false,
        error: err.message,
        durationMs: 0,
        completedSteps: 0,
        totalSteps: 0,
        log: []
      };
    } finally {
      this.runningTaskIds.delete(taskId);
    }

    const durationMs = result.durationMs || 0;
    const statusStr = result.success ? "success" : "failed";
    const resultSummary = result.success
      ? `Completed ${result.completedSteps}/${result.totalSteps} steps in ${durationMs}ms`
      : `Failed at step ${(result.failedStep || 0) + 1}: ${result.error}`;

    // 3. Update task status in database
    try {
      await db.run(
        `UPDATE scheduled_tasks
         SET last_run = CURRENT_TIMESTAMP, last_status = ?, last_result = ?
         WHERE id = ?`,
        [statusStr, resultSummary, taskId]
      );
    } catch (dbErr) {
      logger.error("Failed to update task state:", dbErr.message);
    }

    // 4. Send Desktop Notification
    const shouldNotify = (result.success && task.notify_on_complete) || (!result.success && task.notify_on_error);
    if (shouldNotify) {
      this.sendDesktopAlert({
        title: `Chrome Automation: ${task.name}`,
        body: resultSummary,
        isError: !result.success
      });
    }

    // 5. Dispatch Webhook
    let webhookStatus = null;
    if (task.webhook_url) {
      const webhookRes = await this.dispatchWebhook(task.webhook_url, {
        event: "automation.completed",
        taskId: task.id,
        taskName: task.name,
        flowId: task.flow_id,
        flowName: flow?.name || "",
        success: result.success,
        durationMs,
        completedSteps: result.completedSteps,
        totalSteps: result.totalSteps,
        error: result.error || null,
        summary: resultSummary,
        timestamp: new Date().toISOString()
      });
      webhookStatus = webhookRes.success ? `Delivered (${webhookRes.status})` : `Failed: ${webhookRes.error}`;
    }

    // 6. Record run log in database
    try {
      const logId = "log_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 6);
      await db.run(
        `INSERT INTO task_run_logs (id, task_id, flow_id, status, duration_ms, completed_steps, total_steps, error, webhook_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          logId,
          taskId,
          task.flow_id,
          statusStr,
          durationMs,
          result.completedSteps || 0,
          result.totalSteps || 0,
          result.error || null,
          webhookStatus
        ]
      );
    } catch (logErr) {
      logger.error("Failed to write task run log:", logErr.message);
    }

    // 7. Broadcast task update to frontend
    this.broadcastUpdate({ taskId, status: statusStr, result: resultSummary });
    return result;
  }

  sendDesktopAlert({ title, body, isError = false }) {
    try {
      if (Notification.isSupported()) {
        const notification = new Notification({
          title,
          body,
          silent: false
        });
        notification.show();
        logger.info(`Desktop notification sent: "${title}"`);
      }
    } catch (err) {
      logger.warn("Desktop notification trigger failed:", err.message);
    }
  }

  async dispatchWebhook(webhookUrl, payload) {
    if (!webhookUrl) return { success: false, error: "No URL" };
    try {
      logger.info(`Dispatching webhook to: ${webhookUrl}`);
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "ChromeBrowser-Automation/1.0"
        },
        body: JSON.stringify(payload)
      });
      logger.info(`Webhook returned status: ${res.status}`);
      return { success: res.ok, status: res.status };
    } catch (err) {
      logger.error("Webhook dispatch error:", err.message);
      return { success: false, error: err.message };
    }
  }

  async testWebhook(webhookUrl) {
    return await this.dispatchWebhook(webhookUrl, {
      event: "chrome.webhook.test",
      message: "Test webhook dispatch from Chrome Lite Automation Engine",
      timestamp: new Date().toISOString()
    });
  }

  broadcastProgress(data) {
    const win = this.getMainWindow ? this.getMainWindow() : null;
    if (win && !win.isDestroyed()) {
      win.webContents.send("chrome:automation:progress", data);
    }
  }

  broadcastUpdate(data) {
    const win = this.getMainWindow ? this.getMainWindow() : null;
    if (win && !win.isDestroyed()) {
      win.webContents.send("chrome:automation:task-updated", data);
    }
  }

  // --- CRUD Operations ---

  async getTasks() {
    try {
      const rows = await db.all(`SELECT * FROM scheduled_tasks ORDER BY created_at DESC`);
      return rows.map((r) => ({
        ...r,
        notify_on_complete: Boolean(r.notify_on_complete),
        notify_on_error: Boolean(r.notify_on_error),
        enabled: Boolean(r.enabled)
      }));
    } catch (err) {
      logger.error("Failed to get scheduled tasks:", err.message);
      return [];
    }
  }

  async getTask(id) {
    try {
      const row = await db.get(`SELECT * FROM scheduled_tasks WHERE id = ?`, [id]);
      if (!row) return null;
      return {
        ...row,
        notify_on_complete: Boolean(row.notify_on_complete),
        notify_on_error: Boolean(row.notify_on_error),
        enabled: Boolean(row.enabled)
      };
    } catch (err) {
      logger.error("Failed to get task:", err.message);
      return null;
    }
  }

  async saveTask(task) {
    const id = task.id || "task_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 6);
    const {
      name,
      flow_id,
      schedule_type = "interval",
      schedule_value = "15m",
      target_url = "",
      webhook_url = "",
      notify_on_complete = true,
      notify_on_error = true,
      enabled = true
    } = task;

    try {
      const existing = await db.get(`SELECT id FROM scheduled_tasks WHERE id = ?`, [id]);
      if (existing) {
        await db.run(
          `UPDATE scheduled_tasks
           SET name = ?, flow_id = ?, schedule_type = ?, schedule_value = ?,
               target_url = ?, webhook_url = ?, notify_on_complete = ?,
               notify_on_error = ?, enabled = ?
           WHERE id = ?`,
          [
            name,
            flow_id,
            schedule_type,
            schedule_value,
            target_url,
            webhook_url,
            notify_on_complete ? 1 : 0,
            notify_on_error ? 1 : 0,
            enabled ? 1 : 0,
            id
          ]
        );
      } else {
        await db.run(
          `INSERT INTO scheduled_tasks (id, name, flow_id, schedule_type, schedule_value, target_url, webhook_url, notify_on_complete, notify_on_error, enabled, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [
            id,
            name,
            flow_id,
            schedule_type,
            schedule_value,
            target_url,
            webhook_url,
            notify_on_complete ? 1 : 0,
            notify_on_error ? 1 : 0,
            enabled ? 1 : 0
          ]
        );
      }
      logger.info(`Saved scheduled task: "${name}" (${id})`);
      return await this.getTask(id);
    } catch (err) {
      logger.error("Failed to save scheduled task:", err.message);
      throw err;
    }
  }

  async deleteTask(id) {
    try {
      await db.run(`DELETE FROM scheduled_tasks WHERE id = ?`, [id]);
      await db.run(`DELETE FROM task_run_logs WHERE task_id = ?`, [id]);
      logger.info(`Deleted scheduled task: ${id}`);
      return true;
    } catch (err) {
      logger.error("Failed to delete scheduled task:", err.message);
      throw err;
    }
  }

  async getTaskLogs(taskId, limit = 50) {
    try {
      const rows = await db.all(
        `SELECT * FROM task_run_logs WHERE task_id = ? ORDER BY created_at DESC LIMIT ?`,
        [taskId, limit]
      );
      return rows;
    } catch (err) {
      logger.error("Failed to get task logs:", err.message);
      return [];
    }
  }
}

module.exports = new AutomationScheduler();
