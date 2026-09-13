const fs = require("fs");
const path = require("path");
const db = require("../../services/database");
const storage = require("../../services/storage");
const logger = require("../../services/logger").forSubsystem("Scraper");

class ScraperService {
  async extractSelector(webContents, selector) {
    if (!webContents) throw new Error("No active webContents provided");

    const code = `
      (() => {
        const elements = document.querySelectorAll(${JSON.stringify(selector)});
        const results = [];
        elements.forEach((el, index) => {
          if (index < 250) {
            results.push({
              index: index + 1,
              text: el.innerText ? el.innerText.trim() : "",
              href: el.getAttribute("href") || el.querySelector("a")?.getAttribute("href") || null,
              src: el.getAttribute("src") || el.querySelector("img")?.getAttribute("src") || null,
              tag: el.tagName.toLowerCase(),
              className: el.className || "",
              html: el.innerHTML ? el.innerHTML.trim().substring(0, 500) : ""
            });
          }
        });
        return results;
      })();
    `;

    try {
      const data = await webContents.executeJavaScript(code);
      logger.info(`Extracted ${data.length} items for selector: "${selector}"`);
      return data;
    } catch (err) {
      logger.error("Extraction error:", err.message);
      throw err;
    }
  }

  async extractTable(webContents, tableSelector = "table") {
    if (!webContents) throw new Error("No active webContents provided");

    const code = `
      (() => {
        const table = document.querySelector(${JSON.stringify(tableSelector)});
        if (!table) return [];

        const headers = [];
        table.querySelectorAll("th").forEach((th, i) => {
          headers.push(th.innerText.trim() || ("Col_" + (i + 1)));
        });

        const rows = [];
        table.querySelectorAll("tbody tr, tr").forEach((tr) => {
          const cells = tr.querySelectorAll("td");
          if (cells.length > 0) {
            const rowData = {};
            cells.forEach((td, i) => {
              const colName = headers[i] || ("Col_" + (i + 1));
              rowData[colName] = td.innerText.trim();
            });
            rows.push(rowData);
          }
        });

        return rows;
      })();
    `;

    try {
      const rows = await webContents.executeJavaScript(code);
      logger.info(`Extracted ${rows.length} rows from table: "${tableSelector}"`);
      return rows;
    } catch (err) {
      logger.error("Table extraction error:", err.message);
      throw err;
    }
  }

  async startVisualPicker(webContents) {
    if (!webContents) throw new Error("No active webContents provided");

    const pickerCode = `
      new Promise((resolve) => {
        const existing = document.getElementById("chrome-picker-overlay");
        if (existing) existing.remove();

        const overlay = document.createElement("div");
        overlay.id = "chrome-picker-overlay";
        overlay.style.position = "fixed";
        overlay.style.pointerEvents = "none";
        overlay.style.border = "2px solid #007acc";
        overlay.style.backgroundColor = "rgba(0, 122, 204, 0.15)";
        overlay.style.zIndex = "99999999";
        overlay.style.transition = "all 0.05s ease";
        overlay.style.display = "none";

        const tooltip = document.createElement("div");
        tooltip.id = "chrome-picker-tooltip";
        tooltip.style.position = "fixed";
        tooltip.style.background = "#1e1e1e";
        tooltip.style.color = "#ffffff";
        tooltip.style.padding = "4px 8px";
        tooltip.style.borderRadius = "4px";
        tooltip.style.fontFamily = "monospace";
        tooltip.style.fontSize = "11px";
        tooltip.style.boxShadow = "0 2px 8px rgba(0,0,0,0.5)";
        tooltip.style.zIndex = "100000000";
        tooltip.style.pointerEvents = "none";
        tooltip.style.display = "none";

        document.body.appendChild(overlay);
        document.body.appendChild(tooltip);

        let currentEl = null;

        function getOptimalSelector(el) {
          if (el.id) return "#" + el.id;
          if (el.className && typeof el.className === "string") {
            const classes = el.className.trim().split(/\\s+/).filter(c => c && !c.includes("chrome-"));
            if (classes.length > 0) return el.tagName.toLowerCase() + "." + classes[0];
          }
          return el.tagName.toLowerCase();
        }

        function onMouseMove(e) {
          const target = document.elementFromPoint(e.clientX, e.clientY);
          if (!target || target === overlay || target === tooltip) return;
          currentEl = target;

          const rect = target.getBoundingClientRect();
          overlay.style.display = "block";
          overlay.style.left = rect.left + "px";
          overlay.style.top = rect.top + "px";
          overlay.style.width = rect.width + "px";
          overlay.style.height = rect.height + "px";

          const sel = getOptimalSelector(target);
          tooltip.style.display = "block";
          tooltip.style.left = Math.min(rect.left, window.innerWidth - 200) + "px";
          tooltip.style.top = Math.max(10, rect.top - 28) + "px";
          tooltip.textContent = sel + " (" + Math.round(rect.width) + "x" + Math.round(rect.height) + ")";
        }

        function onClick(e) {
          e.preventDefault();
          e.stopPropagation();

          cleanup();

          if (currentEl) {
            const selector = getOptimalSelector(currentEl);
            const textPreview = (currentEl.innerText || "").substring(0, 100);
            resolve({ selector, tagName: currentEl.tagName.toLowerCase(), textPreview });
          } else {
            resolve(null);
          }
        }

        function onKeyDown(e) {
          if (e.key === "Escape") {
            cleanup();
            resolve(null);
          }
        }

        function cleanup() {
          window.removeEventListener("mousemove", onMouseMove, true);
          window.removeEventListener("click", onClick, true);
          window.removeEventListener("keydown", onKeyDown, true);
          if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
          if (tooltip.parentNode) tooltip.parentNode.removeChild(tooltip);
        }

        window.addEventListener("mousemove", onMouseMove, true);
        window.addEventListener("click", onClick, true);
        window.addEventListener("keydown", onKeyDown, true);
      });
    `;

    try {
      const result = await webContents.executeJavaScript(pickerCode);
      logger.info("Visual element picker result:", result);
      return result;
    } catch (err) {
      logger.error("Visual picker error:", err.message);
      return null;
    }
  }

  async saveScrapedData(flowId, url, selector, extractedData) {
    const id = "scr_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 6);
    try {
      await db.run(
        `INSERT INTO scraped_data (id, flow_id, url, selector, extracted_data, created_at)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [id, flowId || "manual", url, selector, JSON.stringify(extractedData)]
      );
      logger.info(`Saved scraped dataset ${id} (${extractedData.length} items)`);
      return id;
    } catch (err) {
      logger.error("Failed to persist scraped data:", err.message);
      throw err;
    }
  }

  async exportToFile(data, format = "json", filenameBase = "scrape") {
    const safeBase = filenameBase.replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `${safeBase}_${Date.now()}.${format}`;
    const exportPath = storage.getPath("exports", filename);

    let content = "";
    if (format === "csv") {
      content = this.formatAsCsv(data);
    } else {
      content = JSON.stringify(data, null, 2);
    }

    fs.writeFileSync(exportPath, content, "utf-8");
    logger.info(`Exported ${data.length} records to ${exportPath}`);
    return { success: true, filePath: exportPath, filename, count: data.length };
  }

  async getScrapedHistory(limit = 30) {
    try {
      const rows = await db.all(
        `SELECT id, flow_id, url, selector, created_at, length(extracted_data) as data_size 
         FROM scraped_data ORDER BY created_at DESC LIMIT ?`,
        [limit]
      );
      return rows;
    } catch (err) {
      logger.error("Failed to query scraped history:", err.message);
      return [];
    }
  }

  formatAsCsv(data) {
    if (!Array.isArray(data) || data.length === 0) return "";
    const keys = Object.keys(data[0]);
    const header = keys.join(",");
    const rows = data.map((item) =>
      keys.map((k) => `"${String(item[k] || "").replace(/"/g, '""').replace(/\n/g, " ")}"`).join(",")
    );
    return [header, ...rows].join("\n");
  }
}

module.exports = new ScraperService();
