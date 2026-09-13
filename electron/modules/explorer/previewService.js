const http = require("http");
const https = require("https");
const logger = require("../../services/logger").forSubsystem("PreviewService");

class PreviewService {
  async getPreview(url, type) {
    if (!url) throw new Error("No URL provided");

    if (type === "image" || type === "video" || type === "audio") {
      return { type, url, canEmbedDirectly: true };
    }

    // For text/json/html/css/js: fetch snippet content
    return new Promise((resolve) => {
      try {
        const client = url.startsWith("https") ? https : http;
        const req = client.get(url, { timeout: 8000 }, (res) => {
          let data = "";
          res.setEncoding("utf8");
          res.on("data", (chunk) => {
            if (data.length < 50000) data += chunk;
          });
          res.on("end", () => {
            resolve({
              type,
              url,
              content: data,
              size: Buffer.byteLength(data),
              isTruncated: data.length >= 50000
            });
          });
        });

        req.on("error", (err) => {
          resolve({ type, url, content: `// Failed to load preview: ${err.message}`, error: true });
        });
      } catch (err) {
        resolve({ type, url, content: `// Preview error: ${err.message}`, error: true });
      }
    });
  }
}

module.exports = new PreviewService();
