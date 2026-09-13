const db = require("../../services/database");
const assetCollector = require("./assetCollector");
const resourceTree = require("./resourceTree");
const previewService = require("./previewService");
const searchService = require("./searchService");
const exportService = require("./exportService");
const logger = require("../../services/logger").forSubsystem("ExplorerService");

class ExplorerService {
  async getAssets(filter = {}) {
    try {
      const normalizedFilter = typeof filter === "string" ? { tabId: filter } : (filter || {});
      const { tabId, type, search } = normalizedFilter;
      let query = `SELECT * FROM assets WHERE 1=1`;
      const params = [];

      if (tabId) {
        const webviewBridge = require("../../services/browser/webview-bridge");
        const ids = new Set([String(tabId)]);
        const wc = webviewBridge.getContents(tabId);
        if (wc) ids.add(String(wc.id));
        const mappedTabId = webviewBridge.contentsToTabMap.get(Number(tabId));
        if (mappedTabId) ids.add(String(mappedTabId));

        const idList = Array.from(ids);
        const placeholders = idList.map(() => "?").join(",");
        query += ` AND tab_id IN (${placeholders})`;
        params.push(...idList);
      }
      if (type && type !== "all") {
        query += ` AND type = ?`;
        params.push(type);
      }
      if (search) {
        query += ` AND (url LIKE ? OR domain LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`);
      }

      query += ` ORDER BY timestamp DESC LIMIT 200`;
      const rows = await db.all(query, params);

      // If DB has records, return them, else fallback to in-memory tab assets
      if (rows && rows.length > 0) {
        return rows;
      }
      if (tabId) {
        let memAssets = assetCollector.getAssetsForTab(tabId);
        if (!memAssets || memAssets.length === 0) {
          const webviewBridge = require("../../services/browser/webview-bridge");
          const wc = webviewBridge.getContents(tabId);
          if (wc) memAssets = assetCollector.getAssetsForTab(wc.id);
        }
        return searchService.filterAssets(memAssets || [], { type, search });
      }
      return [];
    } catch (err) {
      logger.error("Failed to query assets:", err.message);
      return [];
    }
  }

  async scanPage(webContents, explicitTabId = null) {
    if (!webContents || webContents.isDestroyed()) return [];

    const webviewBridge = require("../../services/browser/webview-bridge");
    const targetTabId = explicitTabId || webviewBridge.contentsToTabMap.get(webContents.id) || String(webContents.id);

    const script = `
      (() => {
        const results = [];
        const seen = new Set();

        const cleanString = (val) => {
          if (!val) return "";
          if (typeof val === "string") return val.trim();
          if (typeof val === "object") {
            if (typeof val.animVal === "string") return val.animVal.trim();
            if (typeof val.baseVal === "string") return val.baseVal.trim();
            if (typeof val.href === "string") return val.href.trim();
          }
          return String(val || "").trim();
        };

        const toAbsolute = (raw) => {
          const str = cleanString(raw);
          if (!str) return "";
          if (str.startsWith("data:") || str.startsWith("blob:") || str.startsWith("javascript:")) return "";
          try {
            return new URL(str, document.baseURI || window.location.href).href;
          } catch {
            return str;
          }
        };

        const add = (url, type, mimeType = "") => {
          const abs = toAbsolute(url);
          if (!abs || seen.has(abs)) return;
          seen.add(abs);
          results.push({ url: abs, resourceType: type, mimeType });
        };

        try {
          // Standard and lazy-loaded images
          document.querySelectorAll("img").forEach(el => {
            add(el.src, "image");
            if (el.dataset?.src) add(el.dataset.src, "image");
            if (el.dataset?.original) add(el.dataset.original, "image");
            if (el.dataset?.lazySrc) add(el.dataset.lazySrc, "image");
          });

          // Picture sources & srcset
          document.querySelectorAll("picture source[srcset], img[srcset]").forEach(el => {
            const srcset = el.getAttribute("srcset") || "";
            srcset.split(",").forEach(part => {
              const u = part.trim().split(/\\s+/)[0];
              if (u) add(u, "image");
            });
          });

          // SVG images
          document.querySelectorAll("svg image, image").forEach(el => {
            const href = el.getAttribute("href") || el.getAttribute("xlink:href") || el.href;
            if (href) add(href, "image");
          });

          // Scripts
          document.querySelectorAll("script[src]").forEach(el => add(el.src, "script", "application/javascript"));

          // Stylesheets
          document.querySelectorAll("link[rel*='stylesheet']").forEach(el => add(el.href, "stylesheet", "text/css"));

          // Videos and audio
          document.querySelectorAll("video, audio").forEach(el => {
            if (el.src) add(el.src, "media");
            if (el.poster) add(el.poster, "image");
          });
          document.querySelectorAll("video source, audio source").forEach(el => {
            if (el.src) add(el.src, "media");
          });

          // Favicon and icons
          document.querySelectorAll("link[rel*='icon'], link[rel*='apple-touch-icon']").forEach(el => add(el.href, "image"));

          // Preloaded fonts and styles
          document.querySelectorAll("link[rel*='preload'][as='font']").forEach(el => add(el.href, "font"));
          document.querySelectorAll("link[rel*='preload'][as='image']").forEach(el => add(el.href, "image"));

          // CSS background-image scanning (safe query targeting only elements with inline background)
          const bgElements = document.querySelectorAll('[style*="background" i], [style*="url(" i]');
          bgElements.forEach(el => {
            try {
              const inline = el.style && el.style.backgroundImage;
              const bg = inline || (bgElements.length < 50 ? window.getComputedStyle(el).backgroundImage : "");
              if (bg && bg !== "none") {
                const matches = bg.match(/url\\(['"]?(.*?)['"]?\\)/g);
                if (matches) {
                  matches.forEach(m => {
                    const raw = m.replace(/^url\\(['"]?/, "").replace(/['"]?\\)$/, "");
                    if (raw) add(raw, "image");
                  });
                }
              }
            } catch {}
          });

          // Safe stylesheets scan for font & background rules (up to 10 stylesheets)
          try {
            const sheets = Array.from(document.styleSheets || []).slice(0, 10);
            sheets.forEach(sheet => {
              try {
                if (sheet.href) add(sheet.href, "stylesheet", "text/css");
                const rules = sheet.cssRules || sheet.rules;
                if (rules) {
                  Array.from(rules).slice(0, 60).forEach(rule => {
                    if (rule.href) add(rule.href, "stylesheet", "text/css");
                    if (rule.style && rule.style.backgroundImage) {
                      const matches = rule.style.backgroundImage.match(/url\\(['"]?(.*?)['"]?\\)/g);
                      if (matches) {
                        matches.forEach(m => {
                          const raw = m.replace(/^url\\(['"]?/, "").replace(/['"]?\\)$/, "");
                          if (raw) add(raw, "image");
                        });
                      }
                    }
                  });
                }
              } catch {}
            });
          } catch {}
        } catch (e) {
          console.error("DOM asset extraction error:", e);
        }

        return results;
      })();
    `;

    try {
      const rawAssets = await webContents.executeJavaScript(script);
      const recorded = [];

      if (Array.isArray(rawAssets)) {
        for (const item of rawAssets) {
          const res = assetCollector.recordAsset(targetTabId, item);
          if (res) recorded.push(res);
        }
      }

      logger.info(`Scanned page: found ${recorded.length} assets on tab ${targetTabId}`);
      return recorded;
    } catch (err) {
      logger.error("Scan page error:", err.message);
      return [];
    }
  }

  async getAssetPreview(assetIdOrUrl, type = "other") {
    let url = assetIdOrUrl;
    let assetType = type;

    if (!assetIdOrUrl.startsWith("http")) {
      const row = await db.get(`SELECT url, type FROM assets WHERE id = ?`, [assetIdOrUrl]);
      if (row) {
        url = row.url;
        assetType = row.type;
      }
    }

    return await previewService.getPreview(url, assetType);
  }

  async exportAssets(format = "json", filter = {}) {
    const assets = await this.getAssets(filter);
    return await exportService.exportAssetList(assets, format, "chrome_assets");
  }
}

module.exports = new ExplorerService();
