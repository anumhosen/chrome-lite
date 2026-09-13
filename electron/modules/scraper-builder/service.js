const db = require("../../services/database");
const logger = require("../../services/logger").forSubsystem("ScraperBuilder");

class ScraperBuilderService {
  async detectPagination(webContents) {
    if (!webContents) return null;

    const code = `
      (() => {
        const nextSelectors = [
          'a[rel="next"]',
          'link[rel="next"]',
          '.pagination .next a',
          '.pagination a:contains("Next")',
          'button:contains("Next")',
          'a.next',
          '.next-page',
          'a[aria-label="Next"]',
          'a[title="Next"]'
        ];

        for (const sel of nextSelectors) {
          try {
            const el = document.querySelector(sel);
            if (el && el.offsetParent !== null) {
              return { selector: sel, text: el.innerText.trim(), href: el.href || null };
            }
          } catch {}
        }

        // Search text content of buttons and links for "next" or ">"
        const links = Array.from(document.querySelectorAll("a, button"));
        for (const el of links) {
          const t = el.innerText.trim().toLowerCase();
          if (t === "next" || t === "next >" || t === "›" || t === "»" || t === "more") {
            let genSel = el.id ? "#" + el.id : (el.className ? el.tagName.toLowerCase() + "." + el.className.split(" ")[0] : "");
            return { selector: genSel || el.tagName.toLowerCase(), text: el.innerText.trim(), href: el.href || null };
          }
        }
        return null;
      })();
    `;

    try {
      return await webContents.executeJavaScript(code);
    } catch {
      return null;
    }
  }

  async saveScraperWorkflow({ name, selector, paginationSelector = null, maxPages = 5 }) {
    const id = "flow_sc_" + Date.now().toString(36);
    const steps = [];

    // Step 1: Wait for content
    steps.push({ type: "wait", ms: 1500 });

    // Step 2: Extract data
    steps.push({ type: "extract", selector });

    // Step 3: Pagination loop if detected
    if (paginationSelector) {
      steps.push({
        type: "click",
        selector: paginationSelector,
        delayMs: 2500
      });
      steps.push({ type: "extract", selector });
    }

    const flowData = {
      id,
      name: name || `Scraper for ${selector}`,
      description: `Visual scraper for "${selector}" (pagination: ${paginationSelector || 'None'})`,
      steps: JSON.stringify(steps)
    };

    await db.run(
      `INSERT INTO automation_flows (id, name, description, steps, created_at)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [flowData.id, flowData.name, flowData.description, flowData.steps]
    );

    logger.info(`Saved scraper flow: ${flowData.name} (${id})`);
    return flowData;
  }
}

module.exports = new ScraperBuilderService();
