# Chrome Lite Documentation 📚

Welcome to the **Chrome Lite** documentation suite. This index provides a recommended reading sequence to help you master Chrome Lite—from core browser navigation and developer extensions to automated scripting and offline web data extraction.

---

## 🧭 Recommended Learning Path

| Step | Guide | Description | Target Audience |
|---|---|---|---|
| **01** | [Getting Started](file:///d:/Development/electron/Chrome%20Lite/docs/guides/01-getting-started.md) | Authentic Chrome UI, Omnibox, tabs, workspaces, and profiles. | All Users |
| **02** | [Interactive Dev Notebook](file:///d:/Development/electron/Chrome%20Lite/docs/guides/02-dev-notebook.md) | CodeMirror 6 live JavaScript execution, DOM analysis, and data tables. | Developers & Analysts |
| **03** | [Userscripts Engine](file:///d:/Development/electron/Chrome%20Lite/docs/guides/03-userscripts.md) | Greasemonkey/Tampermonkey script injection, `GM_*` APIs, and matching. | Power Users & Modders |
| **04** | [API Interceptor & Mocking](file:///d:/Development/electron/Chrome%20Lite/docs/guides/04-api-interceptor-and-mocking.md) | Live HTTP/HTTPS traffic inspection, mock rules, HAR 1.2, and OpenAPI 3.0. | Backend & Frontend Engineers |
| **05** | [Macro Automation & Playwright](file:///d:/Development/electron/Chrome%20Lite/docs/guides/05-macro-automation-and-playwright.md) | Visual action recording, conditional loops, cron scheduling, and test export. | QA & Automation Engineers |
| **06** | [Web Scraper & Site Mirroring](file:///d:/Development/electron/Chrome%20Lite/docs/guides/06-web-scraper-and-mirroring.md) | Element picker, table scraper, media asset grabber, and site mirroring. | Data Scientists & Researchers |
| **07** | [Privacy & System Performance](file:///d:/Development/electron/Chrome%20Lite/docs/guides/07-privacy-and-system-performance.md) | Chrome Shield ad/tracker blocker, Cookie Jar, and low-RAM tab hibernation. | Security & Efficiency |

---

## 🛠️ Ready-to-Use Examples

We provide pre-built, tested examples that you can import or copy-paste directly into Chrome Lite:

### 📜 Userscripts (`docs/examples/userscripts/`)
- [Universal Dark Mode](file:///d:/Development/electron/Chrome%20Lite/docs/examples/userscripts/universal-dark-mode.user.js): Intelligent contrast-preserving dark theme injector.
- [Auto Skip Ads & Clean Overlays](file:///d:/Development/electron/Chrome%20Lite/docs/examples/userscripts/auto-skip-ads-and-cleaner.user.js): Removes intrusive floating banners, video ad popups, and paywall overlays.
- [Distraction-Free Reading Mode](file:///d:/Development/electron/Chrome%20Lite/docs/examples/userscripts/page-reading-mode.user.js): Converts cluttered web pages into a minimalist readable layout.
- [Table to CSV/JSON Exporter](file:///d:/Development/electron/Chrome%20Lite/docs/examples/userscripts/table-to-csv-exporter.user.js): Injects an instant export button on any HTML table.
- [Copy as Markdown Link](file:///d:/Development/electron/Chrome%20Lite/docs/examples/userscripts/copy-as-markdown.user.js): Quickly formats active tab title and URL or selection for GitHub/Notion.

### 📓 Interactive JavaScript Notebooks (`docs/examples/notebooks/`)
- [SEO & Web Page Auditor](file:///d:/Development/electron/Chrome%20Lite/docs/examples/notebooks/seo-and-page-auditor.ijsnb): Analyzes page metadata, OpenGraph tags, headings hierarchy, and broken links.
- [API Fetch & Table Visualizer](file:///d:/Development/electron/Chrome%20Lite/docs/examples/notebooks/api-fetch-and-table-visualizer.ijsnb): Fetches external REST APIs, extracts nested JSON, and renders interactive data tables.
- [DOM Data & Product Extractor](file:///d:/Development/electron/Chrome%20Lite/docs/examples/notebooks/dom-data-extractor.ijsnb): Scrapes listings, articles, and product catalogs directly from the active tab.

---

## ❓ Frequently Asked Questions

### Does Chrome Lite support Site Mirroring?
**Currently**: Chrome Lite supports **single-page asset extraction** through the built-in Scraper (`scanPageAssets`), allowing you to grab all images, fonts, stylesheets, audio/video, and scripts on any page with one click. 
**Full Recursive Mirroring**: Full offline recursive crawling (`wget -m` style or self-contained `.mhtml` multi-page archives) is detailed with complete implementation blueprints in [Guide 06: Web Scraper & Site Mirroring](file:///d:/Development/electron/Chrome%20Lite/docs/guides/06-web-scraper-and-mirroring.md).
