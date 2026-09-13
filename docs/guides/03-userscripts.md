# 03 - Userscripts Engine 📜

## Overview
Chrome Lite includes a built-in **Userscript Engine** compatible with Greasemonkey and Tampermonkey scripts, allowing you to modify web page behavior, automate repeated tasks, inject custom CSS styles, and bypass annoyances without installing third-party browser extensions.

Navigate to `chrome://userscripts` or open **Userscripts** in the side panel.

---

## 📝 Anatomy of a Userscript

Every userscript begins with metadata comments (`==UserScript==` block) telling Chrome Lite when and where to execute:

```javascript
// ==UserScript==
// @name         My Custom Script
// @match        *://*.example.com/*
// @run-at       document-end
// @description  Custom modifications for example.com
// ==/UserScript==

console.log("Userscript active on:", window.location.href);
```

### Supported Metadata Directives:
- `@name`: Human-readable name of the script.
- `@match`: URL pattern specifying which websites trigger this script (e.g. `*://*/*` for all sites, `https://github.com/*` for GitHub).
- `@run-at`:
  - `document-end` (default): Runs after the DOM content has fully loaded.
  - `document-start`: Runs before any page scripts or images load.
- `@description`: Short summary of the script's purpose.

---

## 🛠️ Supported GM_* APIs

Chrome Lite natively injects standard Greasemonkey convenience APIs into the userscript scope:

| API | Description | Example |
|---|---|---|
| `GM_addStyle(css)` | Injects custom CSS rules into `<head>` | `GM_addStyle("body { background: #121212 !important; }");` |
| `GM_setValue(key, val)` | Persists arbitrary data across visits | `GM_setValue("last_visit", Date.now());` |
| `GM_getValue(key, def)` | Retrieves stored data | `const count = GM_getValue("visit_count", 0);` |
| `GM_deleteValue(key)` | Deletes a stored key | `GM_deleteValue("temp_token");` |
| `GM_listValues()` | Returns an array of all saved keys | `const keys = GM_listValues();` |
| `GM_log(...args)` | Pretty-prints logs with script name prefix | `GM_log("Element found:", el);` |

---

## ⚡ Managing Scripts in Chrome Lite

1. **Creating a Script**: Click **+ New Script**, enter your name, and write your JavaScript using the lightweight **CodeMirror 6** editor.
2. **Quick Save**: Press <kbd>Ctrl</kbd> + <kbd>S</kbd> (or <kbd>Cmd</kbd>+<kbd>S</kbd>) to save immediately.
3. **Toggle Active State**: Use the checkbox on each script tile to enable or disable it on the fly.
4. **Immediate Test Run**: Click the **Run** button to inject and execute the script instantly into the active tab without reloading.

---

## 🧭 Next Step
Proceed to **[04 - API Interceptor & Mocking](file:///d:/Development/electron/Chrome%20Lite/docs/guides/04-api-interceptor-and-mocking.md)** to learn how to monitor network traffic and mock HTTP responses.
