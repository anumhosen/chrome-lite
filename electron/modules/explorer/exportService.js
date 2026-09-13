const fs = require("fs");
const path = require("path");
const storage = require("../../services/storage");
const logger = require("../../services/logger").forSubsystem("ExplorerExport");

class ExportService {
  async exportAssetList(assets, format = "json", filename = "assets_export") {
    const exportsDir = path.join(storage.getBaseDir(), "exports");
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    const safeName = filename.toLowerCase().replace(/[^a-z0-9]/g, "_");
    const timestamp = Date.now();
    let filePath = "";
    let content = "";

    if (format === "csv") {
      filePath = path.join(exportsDir, `${safeName}_${timestamp}.csv`);
      const headers = ["id", "type", "domain", "filename", "size", "url"];
      const rows = [headers.join(",")];
      for (const a of assets) {
        rows.push([
          JSON.stringify(a.id),
          JSON.stringify(a.type),
          JSON.stringify(a.domain),
          JSON.stringify(a.filename),
          a.size || 0,
          JSON.stringify(a.url)
        ].join(","));
      }
      content = rows.join("\n");
    } else {
      filePath = path.join(exportsDir, `${safeName}_${timestamp}.json`);
      content = JSON.stringify(assets, null, 2);
    }

    fs.writeFileSync(filePath, content, "utf-8");
    logger.info(`Exported ${assets.length} assets to ${filePath}`);
    return { filePath, count: assets.length };
  }
}

module.exports = new ExportService();
