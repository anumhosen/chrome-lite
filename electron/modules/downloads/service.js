const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https");
const { app, shell, BrowserWindow } = require("electron");
const db = require("../../services/database");
const config = require("./config");
const storage = require("../../services/storage");
const logger = require("../../services/logger").forSubsystem("Downloads");

class DownloadsService {
  constructor() {
    this.activeDownloads = new Map();
    this.mainWindow = null;
    this.isProcessingQueue = false;
    this.attachedSessions = new WeakSet();
  }

  init(mainWindow) {
    this.mainWindow = mainWindow;
  }

  getDefaultDownloadDir() {
    let dir;
    try {
      dir = app.getPath("downloads");
    } catch {
      dir = path.join(storage.getBaseDir(), "downloads");
    }
    if (!fs.existsSync(dir)) {
      try { fs.mkdirSync(dir, { recursive: true }); } catch { }
    }
    return dir;
  }

  getDomainDownloadDir(domain = "general") {
    const base = path.join(this.getDefaultDownloadDir(), domain.replace(/[^a-z0-9.-]/gi, "_"));
    if (!fs.existsSync(base)) fs.mkdirSync(base, { recursive: true });
    return base;
  }

  attachSession(session) {
    if (!session || this.attachedSessions.has(session)) return;
    this.attachedSessions.add(session);

    session.on("will-download", async (event, item) => {
      const id = "dl_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 6);
      const filename = item.getFilename() || "download";
      let domain = "web";
      try { domain = new URL(item.getURL()).hostname || "web"; } catch { }

      const defaultDir = this.getDefaultDownloadDir();
      const defaultSavePath = path.join(defaultDir, filename);

      // Prompt the user with native Save As dialog pre-filled to user's Downloads folder
      item.setSaveDialogOptions({
        title: `Save ${filename}`,
        defaultPath: defaultSavePath
      });

      const downloadRecord = {
        id,
        filename,
        url: item.getURL(),
        domain,
        savePath: defaultSavePath,
        save_path: defaultSavePath,
        totalBytes: item.getTotalBytes(),
        total_bytes: item.getTotalBytes(),
        receivedBytes: item.getReceivedBytes(),
        received_bytes: item.getReceivedBytes(),
        state: "progressing",
        started_at: new Date().toISOString()
      };

      this.activeDownloads.set(id, { item, record: downloadRecord });

      try {
        await db.run(
          `INSERT INTO downloads (id, filename, url, save_path, total_bytes, received_bytes, state, started_at)
           VALUES (?, ?, ?, ?, ?, ?, 'progressing', CURRENT_TIMESTAMP)`,
          [id, filename, item.getURL(), defaultSavePath, item.getTotalBytes(), item.getReceivedBytes()]
        );
      } catch (err) {
        logger.error("Failed to insert download row:", err.message);
      }

      this.notify("chrome:download-started", downloadRecord);

      item.on("updated", (e, state) => {
        const currentPath = item.getSavePath() || downloadRecord.save_path;
        if (item.getSavePath()) {
          downloadRecord.filename = path.basename(item.getSavePath());
        }
        downloadRecord.savePath = currentPath;
        downloadRecord.save_path = currentPath;
        downloadRecord.receivedBytes = item.getReceivedBytes();
        downloadRecord.received_bytes = item.getReceivedBytes();
        downloadRecord.totalBytes = item.getTotalBytes();
        downloadRecord.total_bytes = item.getTotalBytes();
        downloadRecord.state = state;

        db.run(
          `UPDATE downloads SET save_path = ?, filename = ?, received_bytes = ?, state = ? WHERE id = ?`,
          [currentPath, downloadRecord.filename, item.getReceivedBytes(), state, id]
        ).catch(() => {});

        this.notify("chrome:download-progress", downloadRecord);
      });

      item.once("done", async (e, state) => {
        const finalPath = item.getSavePath() || (state === 'cancelled' ? '' : downloadRecord.save_path);
        if (item.getSavePath()) {
          downloadRecord.filename = path.basename(item.getSavePath());
        }
        downloadRecord.savePath = finalPath;
        downloadRecord.save_path = finalPath;
        downloadRecord.receivedBytes = item.getReceivedBytes();
        downloadRecord.received_bytes = item.getReceivedBytes();
        downloadRecord.state = state;
        this.activeDownloads.delete(id);

        try {
          await db.run(
            `UPDATE downloads SET save_path = ?, filename = ?, received_bytes = ?, state = ? WHERE id = ?`,
            [finalPath, downloadRecord.filename, item.getReceivedBytes(), state, id]
          );
        } catch (err) {
          logger.error("Failed to update download done row:", err.message);
        }

        this.notify("chrome:download-done", downloadRecord);
      });
    });
  }

  async queueAsset(url, domain = "general", type = "asset") {
    const id = "q_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    let filename = "file";
    try {
      const pathname = new URL(url).pathname;
      filename = pathname.split("/").filter(Boolean).pop() || `file_${Date.now()}`;
    } catch { }

    const saveDir = this.getDomainDownloadDir(domain);
    const savePath = path.join(saveDir, filename);

    await db.run(
      `INSERT INTO download_queue (id, url, filename, domain, save_path, type, state, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'queued', CURRENT_TIMESTAMP)`,
      [id, url, filename, domain, savePath, type]
    );

    this.processQueue();
    return { id, filename, savePath, status: "queued" };
  }

  async queueDownload(assetOrUrl, domain = "general", type = "asset") {
    if (typeof assetOrUrl === "object" && assetOrUrl !== null) {
      return await this.queueAsset(assetOrUrl.url, assetOrUrl.domain, assetOrUrl.type);
    }
    return await this.queueAsset(assetOrUrl, domain, type);
  }

  async batchQueue(assets = []) {
    const results = [];
    for (const a of assets) {
      if (a.url) results.push(await this.queueAsset(a.url, a.domain, a.type));
    }
    return results;
  }

  async processQueue() {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;
    try {
      const queued = await db.all(`SELECT * FROM download_queue WHERE state = 'queued' LIMIT 5`);
      for (const item of queued) {
        await this.downloadDirect(item);
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  async downloadDirect(queueItem) {
    return new Promise((resolve) => {
      const { id, url, save_path, filename } = queueItem;
      const client = url.startsWith("https") ? https : http;

      db.run(`UPDATE download_queue SET state = 'downloading' WHERE id = ?`, [id]).catch(() => { });

      const fileStream = fs.createWriteStream(save_path);
      const req = client.get(url, { timeout: 15000 }, (res) => {
        const total = parseInt(res.headers["content-length"] || 0);
        let received = 0;

        res.on("data", (chunk) => {
          received += chunk.length;
          fileStream.write(chunk);
        });

        res.on("end", async () => {
          fileStream.end();
          await db.run(`UPDATE download_queue SET state = 'completed', received_bytes = ? WHERE id = ?`, [received, id]).catch(() => { });
          const dlId = "dl_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 6);
          await db.run(
            `INSERT INTO downloads (id, filename, url, save_path, total_bytes, received_bytes, state, started_at)
             VALUES (?, ?, ?, ?, ?, ?, 'completed', CURRENT_TIMESTAMP)`,
            [dlId, filename || "file", url, save_path, total || received, received]
          ).catch(() => { });
          this.notify("chrome:download-done", {
            id: dlId, filename: filename || "file", url, savePath: save_path, save_path, state: "completed", receivedBytes: received, received_bytes: received
          });
          resolve();
        });
      });

      req.on("error", async () => {
        fileStream.close();
        await db.run(`UPDATE download_queue SET state = 'failed' WHERE id = ?`, [id]).catch(() => { });
        resolve();
      });
    });
  }

  async getQueue() {
    return await db.all(`SELECT * FROM download_queue ORDER BY created_at DESC LIMIT 100`);
  }

  async clearQueue() {
    await db.run(`DELETE FROM download_queue WHERE state IN ('completed', 'failed')`);
    return true;
  }

  async clearDownloads() {
    await db.run(`DELETE FROM downloads WHERE state IN ('completed', 'cancelled', 'failed')`);
    return true;
  }

  async removeDownload(id) {
    const active = this.activeDownloads.get(id);
    if (active && active.item) {
      try {
        if (typeof active.item.cancel === "function") active.item.cancel();
      } catch { }
    }
    this.activeDownloads.delete(id);
    await db.run(`DELETE FROM downloads WHERE id = ?`, [id]).catch(() => {});
    return true;
  }

  openFolder() {
    try {
      const dir = this.getDefaultDownloadDir();
      shell.openPath(dir);
      return true;
    } catch (err) {
      logger.error("Failed to open downloads folder:", err.message);
      return false;
    }
  }

  async getDownloads(limit = 100) {
    try {
      const rows = await db.all(
        `SELECT id, filename, url, save_path, total_bytes, received_bytes, state, started_at,
                COALESCE((SELECT domain FROM download_queue WHERE download_queue.save_path = downloads.save_path LIMIT 1), 'web') as domain
         FROM downloads ORDER BY started_at DESC LIMIT ?`,
        [limit]
      );

      // Merge active downloads from memory to give immediate live feedback
      const activeList = Array.from(this.activeDownloads.values()).map((v) => v.record);
      const activeIds = new Set(activeList.map((a) => a.id));
      const filteredRows = (rows || []).filter((r) => !activeIds.has(r.id));
      const normalizedRows = filteredRows.map((r) => ({
        ...r,
        savePath: r.save_path,
        totalBytes: r.total_bytes,
        receivedBytes: r.received_bytes,
      }));
      return [...activeList, ...normalizedRows];
    } catch {
      const rows = await db.all(`SELECT * FROM downloads ORDER BY started_at DESC LIMIT ?`, [limit]);
      return (rows || []).map((r) => ({
        ...r,
        savePath: r.save_path,
        totalBytes: r.total_bytes,
        receivedBytes: r.received_bytes,
      }));
    }
  }

  notify(channel, data) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data);
    }
    try {
      for (const win of BrowserWindow.getAllWindows()) {
        if (win !== this.mainWindow && !win.isDestroyed() && win.webContents) {
          win.webContents.send(channel, data);
        }
      }
    } catch { }
  }
}

module.exports = new DownloadsService();
