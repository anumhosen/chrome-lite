const fs = require("fs");
const path = require("path");
const db = require("../../services/database");
const storage = require("../../services/storage");
const logger = require("../../services/logger").forSubsystem("Automation");
const scheduler = require("./scheduler");
const headlessRunner = require("./headlessRunner");

class AutomationService {
  async saveFlow({ id, name, description = "", steps = [] }) {
    const flowId = id || "flow_" + Date.now().toString(36);
    try {
      const existing = await db.get("SELECT id FROM automation_flows WHERE id = ?", [flowId]);
      if (existing) {
        await db.run(
          `UPDATE automation_flows SET name = ?, description = ?, steps = ? WHERE id = ?`,
          [name, description, JSON.stringify(steps), flowId]
        );
      } else {
        await db.run(
          `INSERT INTO automation_flows (id, name, description, steps, created_at)
           VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [flowId, name, description, JSON.stringify(steps)]
        );
      }
      logger.info(`Saved automation flow: ${name} (${flowId})`);
      return { id: flowId, name, description, steps };
    } catch (err) {
      logger.error("Failed to save flow:", err.message);
      throw err;
    }
  }

  async getFlows() {
    try {
      const rows = await db.all(`SELECT * FROM automation_flows ORDER BY created_at DESC`);
      return rows.map((r) => ({
        ...r,
        steps: JSON.parse(r.steps || "[]")
      }));
    } catch (err) {
      logger.error("Failed to get flows:", err.message);
      return [];
    }
  }

  async getFlow(id) {
    try {
      const row = await db.get(`SELECT * FROM automation_flows WHERE id = ?`, [id]);
      if (!row) return null;
      return {
        ...row,
        steps: JSON.parse(row.steps || "[]")
      };
    } catch (err) {
      logger.error("Failed to get flow:", err.message);
      return null;
    }
  }

  async deleteFlow(id) {
    try {
      await db.run(`DELETE FROM automation_flows WHERE id = ?`, [id]);
      logger.info(`Deleted flow: ${id}`);
      return true;
    } catch (err) {
      logger.error("Failed to delete flow:", err.message);
      throw err;
    }
  }

  async runStep(webContents, step, flowId = null) {
    if (!webContents) throw new Error("No active webContents provided");

    switch (step.type) {
      case "navigate": {
        await webContents.loadURL(step.url);
        await new Promise((resolve) => {
          const timeout = setTimeout(resolve, 8000);
          webContents.once("did-finish-load", () => {
            clearTimeout(timeout);
            resolve();
          });
        });
        return { navigated: step.url };
      }

      case "click": {
        return await webContents.executeJavaScript(`
          new Promise((resolve, reject) => {
            const start = Date.now();
            const check = () => {
              const el = document.querySelector(${JSON.stringify(step.selector)});
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.click();
                return resolve({ clicked: ${JSON.stringify(step.selector)} });
              }
              if (Date.now() - start > 6000) {
                return reject(new Error('Selector timeout: ' + ${JSON.stringify(step.selector)}));
              }
              setTimeout(check, 100);
            };
            check();
          })
        `);
      }

      case "type": {
        return await webContents.executeJavaScript(`
          new Promise((resolve, reject) => {
            const start = Date.now();
            const check = () => {
              const el = document.querySelector(${JSON.stringify(step.selector)});
              if (el) {
                el.focus();
                el.value = ${JSON.stringify(step.value || "")};
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
                return resolve({ typed: ${JSON.stringify(step.value || "")} });
              }
              if (Date.now() - start > 6000) {
                return reject(new Error('Selector timeout: ' + ${JSON.stringify(step.selector)}));
              }
              setTimeout(check, 100);
            };
            check();
          })
        `);
      }

      case "wait": {
        const ms = step.ms || 1000;
        await new Promise((resolve) => setTimeout(resolve, ms));
        return { waitedMs: ms };
      }

      case "scroll": {
        return await webContents.executeJavaScript(`
          (() => {
            if (${JSON.stringify(step.selector || "")}) {
              const el = document.querySelector(${JSON.stringify(step.selector)});
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            } else {
              window.scrollBy({ top: ${step.y || 600}, behavior: 'smooth' });
            }
            return { scrolled: true };
          })()
        `);
      }

      case "screenshot": {
        const image = await webContents.capturePage();
        const exportsDir = path.join(storage.getBaseDir(), "exports");
        if (!fs.existsSync(exportsDir)) {
          fs.mkdirSync(exportsDir, { recursive: true });
        }
        const filename = `screenshot_${Date.now()}.png`;
        const filePath = path.join(exportsDir, filename);
        fs.writeFileSync(filePath, image.toPNG());
        logger.info(`Screenshot saved to: ${filePath}`);
        return { filePath, filename };
      }

      case "extract": {
        const results = await webContents.executeJavaScript(`
          (() => {
            const els = Array.from(document.querySelectorAll(${JSON.stringify(step.selector)}));
            return els.slice(0, 100).map((el, i) => ({
              index: i + 1,
              text: el.innerText ? el.innerText.trim() : '',
              href: el.getAttribute('href') || null,
              src: el.getAttribute('src') || null
            }));
          })()
        `);

        if (results && results.length > 0) {
          const currentUrl = webContents.getURL();
          const scrapeId = "scrape_" + Date.now().toString(36);
          await db.run(
            `INSERT INTO scraped_data (id, flow_id, url, selector, extracted_data, created_at)
             VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            [scrapeId, flowId || "manual", currentUrl, step.selector, JSON.stringify(results)]
          );
        }
        return { count: results.length, data: results };
      }

      case "if_element_exists": {
        const timeout = step.timeoutMs || 1500;
        const exists = await webContents.executeJavaScript(`
          new Promise((resolve) => {
            const start = Date.now();
            const check = () => {
              if (document.querySelector(${JSON.stringify(step.selector || "body")})) {
                return resolve(true);
              }
              if (Date.now() - start > ${timeout}) {
                return resolve(false);
              }
              setTimeout(check, 100);
            };
            check();
          })
        `);

        if (exists) {
          if (step.thenAction === "click") {
            const targetSel = step.thenSelector || step.selector;
            return await this.runStep(webContents, { type: "click", selector: targetSel }, flowId);
          } else if (step.thenAction === "wait") {
            return await this.runStep(webContents, { type: "wait", ms: 1000 }, flowId);
          } else if (step.thenAction === "extract") {
            const targetSel = step.thenSelector || step.selector;
            return await this.runStep(webContents, { type: "extract", selector: targetSel }, flowId);
          } else if (step.thenAction === "scroll") {
            return await this.runStep(webContents, { type: "scroll", y: 400 }, flowId);
          }
          return { condition: "if_element_exists", exists: true, executed: true };
        } else {
          return { condition: "if_element_exists", exists: false, skipped: true };
        }
      }

      case "if_text_contains": {
        const matched = await webContents.executeJavaScript(`
          (() => {
            const root = document.querySelector(${JSON.stringify(step.selector || "body")});
            if (!root) return false;
            const text = (root.innerText || root.textContent || "").toLowerCase();
            return text.includes(${JSON.stringify((step.text || "").toLowerCase())});
          })()
        `);

        if (matched) {
          if (step.thenAction === "click" && step.thenSelector) {
            return await this.runStep(webContents, { type: "click", selector: step.thenSelector }, flowId);
          }
          return { condition: "if_text_contains", matched: true, text: step.text };
        } else {
          return { condition: "if_text_contains", matched: false, text: step.text, skipped: true };
        }
      }

      case "loop_elements": {
        const count = await webContents.executeJavaScript(`
          document.querySelectorAll(${JSON.stringify(step.selector || "")}).length
        `);
        const max = Math.min(count, step.maxIterations || 5);
        const results = [];

        for (let i = 0; i < max; i++) {
          if (step.loopAction === "click") {
            await webContents.executeJavaScript(`
              (() => {
                const els = document.querySelectorAll(${JSON.stringify(step.selector)});
                if (els[${i}]) {
                  els[${i}].scrollIntoView({ behavior: 'smooth', block: 'center' });
                  els[${i}].click();
                }
              })()
            `);
            results.push({ index: i, action: "click" });
          } else if (step.loopAction === "extract") {
            const text = await webContents.executeJavaScript(`
              (() => {
                const els = document.querySelectorAll(${JSON.stringify(step.selector)});
                return els[${i}] ? (els[${i}].innerText || '').trim() : '';
              })()
            `);
            results.push({ index: i, action: "extract", text });
          } else if (step.loopAction === "scroll") {
            await webContents.executeJavaScript(`
              (() => {
                const els = document.querySelectorAll(${JSON.stringify(step.selector)});
                if (els[${i}]) els[${i}].scrollIntoView({ behavior: 'smooth', block: 'center' });
              })()
            `);
            results.push({ index: i, action: "scroll" });
          }
          await new Promise((r) => setTimeout(r, 300));
        }

        return { loop: "loop_elements", selector: step.selector, iterations: max, results };
      }

      default:
        throw new Error(`Unknown automation step type: ${step.type}`);
    }
  }

  async runFlow(webContents, flowData, onProgress = null) {
    if (!webContents) throw new Error("No active webContents provided");

    let flow = flowData;
    if (typeof flowData === "string") {
      flow = await this.getFlow(flowData);
      if (!flow) throw new Error(`Flow not found: ${flowData}`);
    }

    const steps = flow.steps || [];
    const log = [];
    const startTime = Date.now();
    let completedSteps = 0;

    logger.info(`Starting flow execution: "${flow.name || 'Untitled'}" (${steps.length} steps)`);

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (onProgress) {
        onProgress({ stepIndex: i, totalSteps: steps.length, step, status: "running" });
      }

      try {
        const stepResult = await this.runStep(webContents, step, flow.id);
        completedSteps++;
        log.push({ stepIndex: i, type: step.type, status: "success", result: stepResult });

        if (onProgress) {
          onProgress({ stepIndex: i, totalSteps: steps.length, step, status: "completed", result: stepResult });
        }

        // Brief delay between steps
        await new Promise((r) => setTimeout(r, step.delayMs || 400));
      } catch (err) {
        logger.error(`Error at step ${i + 1} (${step.type}):`, err.message);
        log.push({ stepIndex: i, type: step.type, status: "error", error: err.message });

        if (onProgress) {
          onProgress({ stepIndex: i, totalSteps: steps.length, step, status: "failed", error: err.message });
        }

        return {
          success: false,
          totalSteps: steps.length,
          completedSteps,
          durationMs: Date.now() - startTime,
          failedStep: i,
          error: err.message,
          log
        };
      }
    }

    return {
      success: true,
      totalSteps: steps.length,
      completedSteps,
      durationMs: Date.now() - startTime,
      log
    };
  }

  async startRecorder(webContents) {
    if (!webContents) throw new Error("No active webContents provided");

    const code = `
      (() => {
        window.__chrome_recorded_events = [];

        function getOptimalSelector(el) {
          if (!el || el === document.body || el === document.documentElement) return "body";
          if (el.id) return "#" + el.id;
          if (el.className && typeof el.className === "string") {
            const first = el.className.trim().split(/\\s+/)[0];
            if (first) return el.tagName.toLowerCase() + "." + first;
          }
          return el.tagName.toLowerCase();
        }

        window.__chrome_clickHandler = (e) => {
          const sel = getOptimalSelector(e.target);
          window.__chrome_recorded_events.push({
            type: "click",
            selector: sel,
            tagName: e.target.tagName.toLowerCase(),
            timestamp: Date.now()
          });
        };

        window.__chrome_changeHandler = (e) => {
          const sel = getOptimalSelector(e.target);
          window.__chrome_recorded_events.push({
            type: "type",
            selector: sel,
            value: e.target.value || "",
            timestamp: Date.now()
          });
        };

        document.addEventListener("click", window.__chrome_clickHandler, true);
        document.addEventListener("change", window.__chrome_changeHandler, true);
        return true;
      })();
    `;

    await webContents.executeJavaScript(code);
    logger.info("Recorder started on active page");
    return true;
  }

  async stopRecorder(webContents) {
    if (!webContents) throw new Error("No active webContents provided");

    const code = `
      (() => {
        const events = window.__chrome_recorded_events || [];
        if (window.__chrome_clickHandler) {
          document.removeEventListener("click", window.__chrome_clickHandler, true);
        }
        if (window.__chrome_changeHandler) {
          document.removeEventListener("change", window.__chrome_changeHandler, true);
        }
        delete window.__chrome_recorded_events;
        delete window.__chrome_clickHandler;
        delete window.__chrome_changeHandler;
        return events;
      })();
    `;

    const events = await webContents.executeJavaScript(code);
    logger.info(`Recorder stopped. Captured ${events.length} user actions.`);

    // Convert raw events into normalized flow steps
    const steps = events.map((ev) => {
      if (ev.type === "click") {
        return { type: "click", selector: ev.selector };
      }
      if (ev.type === "type") {
        return { type: "type", selector: ev.selector, value: ev.value };
      }
      return ev;
    });

    return steps;
  }

  async exportFlow(flow) {
    const exportsDir = path.join(storage.getBaseDir(), "exports");
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }
    const safeName = (flow.name || "flow").toLowerCase().replace(/[^a-z0-9]/g, "_");
    const filename = `${safeName}_${Date.now()}.json`;
    const filePath = path.join(exportsDir, filename);
    fs.writeFileSync(filePath, JSON.stringify(flow, null, 2), "utf-8");
    logger.info(`Exported flow to: ${filePath}`);
    return { filePath, filename };
  }

  exportToPlaywright(flow) {
    const name = (flow.name || "Chrome Automation Flow").replace(/'/g, "\\'");
    const steps = flow.steps || [];

    let script = `import { test, expect } from '@playwright/test';\n\n`;
    script += `/**\n * Generated by Chrome Lite Automation Engine\n * Flow: ${name}\n * Steps: ${steps.length}\n */\n`;
    script += `test('${name}', async ({ page }) => {\n`;

    for (let i = 0; i < steps.length; i++) {
      const s = steps[i];
      script += `  // Step ${i + 1}: ${s.type}\n`;
      switch (s.type) {
        case "navigate":
          script += `  await page.goto('${s.url || "https://google.com"}', { waitUntil: 'domcontentloaded' });\n`;
          break;
        case "click":
          script += `  await page.locator('${s.selector || "body"}').first().click();\n`;
          break;
        case "type":
          script += `  await page.locator('${s.selector || "input"}').first().fill('${(s.value || "").replace(/'/g, "\\'")}');\n`;
          break;
        case "wait":
          script += `  await page.waitForTimeout(${s.ms || 1000});\n`;
          break;
        case "scroll":
          if (s.selector) {
            script += `  await page.locator('${s.selector}').first().scrollIntoViewIfNeeded();\n`;
          } else {
            script += `  await page.evaluate(() => window.scrollBy(0, ${s.y || 600}));\n`;
          }
          break;
        case "screenshot":
          script += `  await page.screenshot({ path: 'screenshot-${i + 1}.png', fullPage: false });\n`;
          break;
        case "extract":
          script += `  const extracted_${i + 1} = await page.locator('${s.selector || "body"}').allInnerTexts();\n`;
          script += `  console.log('Extracted items:', extracted_${i + 1});\n`;
          break;
        case "if_element_exists":
          script += `  if (await page.locator('${s.selector}').count() > 0) {\n`;
          if (s.thenAction === "click") {
            script += `    await page.locator('${s.thenSelector || s.selector}').first().click();\n`;
          } else if (s.thenAction === "wait") {
            script += `    await page.waitForTimeout(1000);\n`;
          } else if (s.thenAction === "extract") {
            script += `    const condData = await page.locator('${s.thenSelector || s.selector}').allInnerTexts();\n`;
            script += `    console.log('Condition met, extracted:', condData);\n`;
          } else {
            script += `    await page.evaluate(() => window.scrollBy(0, 400));\n`;
          }
          script += `  }\n`;
          break;
        case "if_text_contains":
          script += `  const content_${i + 1} = await page.locator('${s.selector || "body"}').innerText();\n`;
          script += `  if (content_${i + 1}.toLowerCase().includes('${(s.text || "").toLowerCase().replace(/'/g, "\\'")}')) {\n`;
          if (s.thenAction === "click" && s.thenSelector) {
            script += `    await page.locator('${s.thenSelector}').first().click();\n`;
          } else {
            script += `    console.log('Target text found on page');\n`;
          }
          script += `  }\n`;
          break;
        case "loop_elements":
          script += `  const elements_${i + 1} = page.locator('${s.selector}');\n`;
          script += `  const count_${i + 1} = Math.min(await elements_${i + 1}.count(), ${s.maxIterations || 5});\n`;
          script += `  for (let idx = 0; idx < count_${i + 1}; idx++) {\n`;
          script += `    const item = elements_${i + 1}.nth(idx);\n`;
          script += `    await item.scrollIntoViewIfNeeded();\n`;
          if (s.loopAction === "click") {
            script += `    await item.click();\n`;
          } else if (s.loopAction === "extract") {
            script += `    console.log('Item ' + idx + ':', await item.innerText());\n`;
          }
          script += `    await page.waitForTimeout(300);\n`;
          script += `  }\n`;
          break;
      }
      script += `\n`;
    }

    script += `});\n`;
    return script;
  }

  // --- Headless Execution & Scheduling ---

  async runFlowHeadless(flowData, initialUrl = null, onProgress = null) {
    return await headlessRunner.runFlow(this, flowData, initialUrl, onProgress);
  }

  async getScheduledTasks() {
    return await scheduler.getTasks();
  }

  async getScheduledTask(id) {
    return await scheduler.getTask(id);
  }

  async saveScheduledTask(task) {
    return await scheduler.saveTask(task);
  }

  async deleteScheduledTask(id) {
    return await scheduler.deleteTask(id);
  }

  async runScheduledTaskNow(id) {
    const task = await scheduler.getTask(id);
    if (!task) throw new Error(`Scheduled task not found: ${id}`);
    return await scheduler.executeTask(task);
  }

  async getTaskLogs(taskId, limit = 50) {
    return await scheduler.getTaskLogs(taskId, limit);
  }

  async testWebhook(webhookUrl) {
    return await scheduler.testWebhook(webhookUrl);
  }
}

module.exports = new AutomationService();
