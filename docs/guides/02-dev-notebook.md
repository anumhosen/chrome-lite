# 02 - Interactive Dev Notebook 📓

## Overview
The **Chrome Lite Dev Notebook** (`chrome://notebook`) is an interactive computational environment inspired by Jupyter and Google Colab, designed specifically for web developers and security researchers.

Unlike standard developer consoles, the Dev Notebook:
- Connects directly to the execution context of the **active browser tab**.
- Uses ultra-lightweight **CodeMirror 6** for instant zero-lag typing, auto-height expansion, and syntax highlighting.
- Automatically visualizes JSON arrays as interactive, sortable **data tables**.
- Saves and loads notebooks in native `.ijsnb` and standard `.ipynb` (Jupyter) formats.

---

## ⚡ Keybindings & Cell Controls

| Action | Shortcut | Description |
|---|---|---|
| **Run Cell in Place** | <kbd>Ctrl</kbd> + <kbd>Enter</kbd> (or <kbd>Cmd</kbd>+<kbd>Enter</kbd>) | Executes the current cell and updates the output below it. |
| **Run & Advance** | <kbd>Shift</kbd> + <kbd>Enter</kbd> | Executes the cell and selects the next cell (or creates a new code cell). |
| **Switch Cell Type** | Top Header Button | Toggle between **Code (JS)** and **Markdown (Text)**. |
| **Edit Markdown** | Double Click | Double click any rendered Markdown cell to edit text. Click "Done Editing" when finished. |
| **Move Cell Up/Down** | Hover Arrows | Reorder cells within the notebook document. |

---

## 💻 Writing Code Against Active Web Pages

Every code cell runs inside the active tab's DOM and JavaScript context. Whatever value you `return` from the cell will be serialized and displayed in the output box:

### 1. Extracting Page Information
```javascript
return {
  title: document.title,
  url: window.location.href,
  metaDescription: document.querySelector('meta[name="description"]')?.content || 'N/A',
  totalImages: document.images.length,
  totalLinks: document.links.length,
  viewport: `${window.innerWidth}x${window.innerHeight}`
};
```

### 2. Tabular Data Visualization
When your cell returns an **array of objects**, Chrome Lite automatically renders an interactive table view with column headers, row numbering, and data type badges:

```javascript
// Scrape all links on the active page and view as a table
const links = Array.from(document.querySelectorAll("a[href]"))
  .map((a, i) => ({
    id: i + 1,
    text: a.innerText.trim() || "(No text)",
    href: a.href,
    isExternal: a.hostname !== window.location.hostname
  }))
  .filter(item => item.text.length > 0)
  .slice(0, 50);

return links;
```

You can toggle between the **Table** view and raw **JSON** view anytime using the top output switcher.

### 3. Asynchronous & Fetch Requests
Cells support Promises and `async/await` seamlessly:

```javascript
const response = await fetch("https://api.github.com/repos/anumhosen/chrome-lite");
const data = await response.json();

return {
  name: data.name,
  stars: data.stargazers_count,
  forks: data.forks_count,
  openIssues: data.open_issues_count,
  license: data.license?.name
};
```

---

## 💾 Saving, Loading & Library
- **Save (`Ctrl+S` / Save icon)**: Saves the notebook to local disk as `.ijsnb` or `.ipynb`.
- **Open**: Loads existing notebooks from disk.
- **Notebook Library**: Access built-in templates and saved project workflows from the library drawer.
- **Pop Out**: Click **Pop out Window** in the top header to run your notebook in a dual-monitor side-by-side workflow.

---

## 🧭 Next Step
Proceed to **[03 - Userscripts Engine](file:///d:/Development/electron/Chrome%20Lite/docs/guides/03-userscripts.md)** to learn how to write and inject persistent custom scripts into web pages.
