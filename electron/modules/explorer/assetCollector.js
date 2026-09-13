const db = require("../../services/database");
const logger = require("../../services/logger").forSubsystem("AssetCollector");

class AssetCollector {
  constructor() {
    this.tabAssets = new Map(); // tabId -> Map(url, asset)
  }

  getAssetsForTab(tabId) {
    const map = this.tabAssets.get(tabId);
    return map ? Array.from(map.values()) : [];
  }

  clearTab(tabId) {
    this.tabAssets.delete(tabId);
  }

  detectType(url, mimeType = "", resourceType = "") {
    const lowerUrl = (url || "").toLowerCase();
    const lowerMime = (mimeType || "").toLowerCase();
    const lowerRes = (resourceType || "").toLowerCase();

    if (lowerRes === "image" || lowerMime.startsWith("image/") || /\.(png|jpg|jpeg|gif|webp|svg|ico)(\?.*)?$/i.test(lowerUrl)) {
      return "image";
    }
    if (lowerRes === "media" || lowerMime.startsWith("video/") || /\.(mp4|webm|ogv|mov)(\?.*)?$/i.test(lowerUrl)) {
      return "video";
    }
    if (lowerMime.startsWith("audio/") || /\.(mp3|wav|ogg|aac)(\?.*)?$/i.test(lowerUrl)) {
      return "audio";
    }
    if (lowerRes === "font" || lowerMime.includes("font") || /\.(woff2?|ttf|otf|eot)(\?.*)?$/i.test(lowerUrl)) {
      return "font";
    }
    if (lowerRes === "stylesheet" || lowerMime.includes("css") || /\.css(\?.*)?$/i.test(lowerUrl)) {
      return "css";
    }
    if (lowerRes === "script" || lowerMime.includes("javascript") || /\.js(\?.*)?$/i.test(lowerUrl)) {
      return "js";
    }
    if (lowerRes === "document" || lowerMime.includes("html") || /\.(html?|php|asp)(\?.*)?$/i.test(lowerUrl)) {
      return "html";
    }
    if (lowerMime.includes("json") || /\.json(\?.*)?$/i.test(lowerUrl)) {
      return "json";
    }
    if (lowerRes === "xhr" || lowerRes === "fetch") {
      return lowerUrl.includes("graphql") ? "graphql" : "xhr";
    }
    if (lowerRes === "websocket" || lowerUrl.startsWith("ws://") || lowerUrl.startsWith("wss://")) {
      return "websocket";
    }
    return "other";
  }

  recordAsset(tabId, assetData) {
    if (!tabId || !assetData || !assetData.url) return null;

    const url = typeof assetData.url === "string" ? assetData.url.trim() : "";
    if (!url || url.startsWith("data:") || url.startsWith("blob:") || url.startsWith("about:") || url.startsWith("javascript:")) {
      return null;
    }

    const strTabId = String(tabId);
    let map = this.tabAssets.get(strTabId) || this.tabAssets.get(tabId);
    if (!map) {
      map = new Map();
      this.tabAssets.set(strTabId, map);
      if (typeof tabId === "number") {
        this.tabAssets.set(tabId, map);
      }
    }

    let domain = "unknown";
    let pathname = "";
    try {
      const parsed = new URL(url);
      if (parsed.protocol === "file:") {
        domain = "local-file";
      } else {
        domain = parsed.hostname || "local";
      }
      pathname = parsed.pathname || "";
    } catch {
      domain = "unknown";
      pathname = url;
    }

    const type = this.detectType(url, assetData.mimeType, assetData.resourceType);
    const filename = pathname.split("/").filter(Boolean).pop() || "asset";

    const asset = {
      id: "ast_" + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
      tabId: strTabId,
      url,
      domain,
      filename,
      type,
      mimeType: assetData.mimeType || "",
      size: assetData.size || 0,
      status: assetData.status || 200,
      timestamp: Date.now()
    };

    map.set(url, asset);

    // Asynchronously save to SQLite assets table
    db.run(
      `INSERT OR REPLACE INTO assets (id, tab_id, domain, url, type, mime_type, size, status, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [asset.id, strTabId, domain, url, type, asset.mimeType, asset.size, asset.status]
    ).catch(() => {});

    return asset;
  }
}

module.exports = new AssetCollector();
