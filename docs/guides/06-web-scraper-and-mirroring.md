# 06 - Web Scraper, Media Grabber & Site Mirroring 🔍

## Overview
Chrome Lite comes equipped with built-in data harvesting and asset extraction tools designed for researchers, analysts, and developers. You can visually select page elements, parse HTML tables into spreadsheets, and grab all page assets without writing scrapers from scratch.

Navigate to `chrome://scraper` or open **Scraper** in the side panel.

---

## 🎯 Visual Element Picker & Selector Extraction

1. Open the **Scraper Builder** panel.
2. Click **Start Visual Picker**.
3. Hover over elements on the active web page—Chrome Lite highlights DOM nodes with a real-time blue bounding overlay and displays their CSS selector.
4. Click on the desired element (e.g. product titles, prices, articles).
5. The picker automatically generates an optimized CSS selector (e.g. `.product-card .price-tag`).
6. Click **Extract** to scrape all matching elements into a clean data view:
   - Node text contents.
   - Link `href` attributes.
   - Image `src` attributes.
   - Class names and tag names.

---

## 📊 Table Scraping & Export

Chrome Lite can automatically parse structured `<table>` elements on any web page:

1. In the Scraper panel, select the **Table Scraper** mode.
2. Enter a table selector or leave default (`table`).
3. Click **Extract Table**.
4. Chrome Lite parses `<th>` headers and `<tr><td>` rows into an interactive preview grid.
5. Export with one click:
   - **Download CSV**: Ready for Excel, Google Sheets, or Pandas.
   - **Download JSON**: Structured array of objects ready for APIs or databases.

---

## 📦 Deep Page Asset Extraction (Asset Grabber)

Chrome Lite's **Asset Grabber** inspects all resources loaded by the current web page:

- **Images**: PNG, JPEG, WebP, SVG, GIF.
- **Videos & Audio**: MP4, WebM, MP3, OGG.
- **Stylesheets & Scripts**: CSS stylesheets and JS bundles.
- **Fonts**: WOFF, WOFF2, TTF.

Click **Scan Page Assets** in the Scraper or Downloads tool. Chrome Lite compiles all found asset URLs and adds them into the **Batch Downloads Manager** (`chrome://downloads`), allowing you to download all media assets to your disk in one click.

---

## 🌐 Site Mirroring in Chrome Lite

### Current Status: Single-Page Asset Grabbing
- **Supported Today**: Chrome Lite can extract and download all resources associated with a single page via the Scraper's asset grabber.
- **Not Yet Native**: Full recursive site mirroring (crawling an entire domain, following links, and rewriting internal links into local file paths like `wget --mirror` or `httrack`) is not yet built into the core UI.

### Workarounds Available Today
1. **Saving Full Offline Pages**:
   You can press <kbd>Ctrl</kbd> + <kbd>S</kbd> while viewing any web page to trigger Chromium's native "Save Page As" dialog:
   - **Webpage, Complete (`.html` + files folder)**: Saves the complete HTML and all associated images/scripts in a local folder with rewritten paths.
   - **Webpage, Single File (`.mhtml`)**: Archives the entire webpage and all embedded assets into a single self-contained file readable offline by Chrome Lite.
2. **Notebook Recursive Link Crawler**:
   You can run an automated script in the **Interactive Dev Notebook** (`chrome://notebook`) to collect all internal links from a domain and download their HTML into local files.

### Architectural Roadmap for Native Site Mirroring
To add first-class recursive site mirroring to Chrome Lite:
1. **Chromium `savePage` API Integration**:
   Electron provides `webContents.savePage(fullPath, 'HTMLComplete' | 'MHTML')`. We can expose `chrome.mirror.saveCurrentPage(filePath, format)` to archive any page with 1 click.
2. **Recursive Domain Crawler Engine**:
   A lightweight BFS (breadth-first-search) background crawler that:
   - Queues starting URL `https://example.com/`.
   - Discovers internal links matching `https://example.com/*`.
   - Downloads pages and rewrites `<a href="/about">` to `./about.html`.
   - Stores the mirror directory in `Downloads/Mirrors/<domain>/`.

---

## 🧭 Next Step
Proceed to **[07 - Privacy & System Performance](file:///d:/Development/electron/Chrome%20Lite/docs/guides/07-privacy-and-system-performance.md)** to learn about Chrome Shield, Cookie Jar, and low-RAM tab management.
