const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https");
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

  init(mainWindow) { this.mainWindow = mainWindow; }

  getDomainDownloadDir(domain = "general") {
    const base = path.join(storage.getBaseDir(), "downloads", domain.replace(/[^a-z0-9.-]/gi, "_"));
    if (!fs.existsSync(base)) fs.mkdirSync(base, { recursive: true });
    return base;
  }

  attachSession(session) {
    if (!session || this.attachedSessions.has(session)) return;
    this.attachedSessions.add(session);

    session.on("will-download", async (event, item) => {
      const id = "dl_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 6);
      const filename = item.getFilename();
      let domain = "general";
      try { domain = new URL(item.getURL()).hostname; } catch { }

      const saveDir = this.getDomainDownloadDir(domain);
      const savePath = path.join(saveDir, filename);
      item.setSavePath(savePath);

      const downloadRecord = {
        id, filename, url: item.getURL(), domain, savePath,
        totalBytes: item.getTotalBytes(), receivedBytes: item.getReceivedBytes(), state: "progressing"
      };
      this.activeDownloads.set(id, { item, record: downloadRecord });

      try {
        await db.run(
          `INSERT INTO downloads (id, filename, url, save_path, total_bytes, received_bytes, state, started_at)
           VALUES (?, ?, ?, ?, ?, ?, 'progressing', CURRENT_TIMESTAMP)`,
          [id, filename, item.getURL(), savePath, item.getTotalBytes(), item.getReceivedBytes()]
        );
      } catch (err) {
        logger.error("Failed to insert download row:", err.message);
      }

      this.notify("chrome:download-started", downloadRecord);

      item.on("updated", (e, state) => {
        downloadRecord.receivedBytes = item.getReceivedBytes();
        downloadRecord.state = state;
        this.notify("chrome:download-progress", downloadRecord);
      });

      item.once("done", async (e, state) => {
        downloadRecord.state = state;
        this.activeDownloads.delete(id);
        try {
          await db.run(
            `UPDATE downloads SET received_bytes = ?, state = ? WHERE id = ?`,
            [item.getReceivedBytes(), state, id]
          );
        } catch { }
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
            id: dlId, filename: filename || "file", url, savePath: save_path, state: "completed", receivedBytes: received
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

  async getQueue() { return await db.all(`SELECT * FROM download_queue ORDER BY created_at DESC LIMIT 100`); }
  async clearQueue() { await db.run(`DELETE FROM download_queue WHERE state IN ('completed', 'failed')`); return true; }
  async getDownloads(limit = 50) {
    try {
      return await db.all(
        `SELECT id, filename, url, save_path, total_bytes, received_bytes, state, started_at,
                COALESCE((SELECT domain FROM download_queue WHERE download_queue.save_path = downloads.save_path LIMIT 1), 'web') as domain
         FROM downloads ORDER BY started_at DESC LIMIT ?`, [limit]
      );
    } catch {
      return await db.all(`SELECT * FROM downloads ORDER BY started_at DESC LIMIT ?`, [limit]);
    }
  }

  notify(channel, data) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data);
    }
  }
}

module.exports = new DownloadsService();
