# 01 - Getting Started with Chrome Lite 🌐

## Introduction
**Chrome Lite** is an advanced developer and research browser combining the authentic design of **Google Chrome (Refresh 2024)** with an integrated suite of developer tools, user scripting engines, API traffic inspection, and web automation.

---

## 🎨 User Interface Anatomy

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ [Tab 1: Google] [Tab 2: GitHub] [+]                        [─] [□] [✕]     │
├─────────────────────────────────────────────────────────────────────────────┤
│ [<] [>] [↻] [⌂]  [🔒 https://github.com/                    ⭐ 🛡️ 3] [🧩] [⋮] │
├─────────────────────────────────────────────────────────────────────────────┤
│ [★ Dev Docs] [★ Localhost:3000] [★ API Spec]                                │
├──────────────────────────────────────────────────────┬──────────────────────┤
│                                                      │                      │
│                                                      │   Right Side Panel   │
│                 Active Web Page                      │   (Notebook /        │
│              (Sandboxed Webview)                     │    Interceptor /     │
│                                                      │    Scraper / etc.)   │
│                                                      │                      │
└──────────────────────────────────────────────────────┴──────────────────────┘
```

1. **Tab Strip (Refresh 2024)**: Rounded tab curves, active tab elevation, quick close button, and circular `+` button (`Ctrl+T`).
2. **Pill Omnibox**: Universal navigation bar for URLs and search queries, with HTTPS lock icon, AdBlock shield counter, and bookmark star.
3. **Extensions & Menu Cluster**: Pinned built-in tools (Shield, Cookies), Extensions puzzle menu, and the 3-dots app menu (`⋮`).
4. **Bookmarks Bar**: Fast access to favorite links (`Ctrl+Shift+B` to toggle).
5. **Right Side Panel**: Expandable tool drawer for developer utilities. Can be resized, docked, or popped out into floating windows.

---

## 🚀 Navigation & Shortcuts

| Action | Shortcut | Description |
|---|---|---|
| **New Tab** | <kbd>Ctrl</kbd> + <kbd>T</kbd> | Opens a new tab with the Chrome Lite Start Page (`chrome://newtab`). |
| **Close Tab** | <kbd>Ctrl</kbd> + <kbd>W</kbd> | Closes the currently active tab. |
| **Reopen Closed Tab** | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>T</kbd> | Restores the most recently closed tab. |
| **Reload Page** | <kbd>Ctrl</kbd> + <kbd>R</kbd> or <kbd>F5</kbd> | Reloads active web page or internal tool tab. |
| **Toggle Bookmarks Bar**| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>B</kbd> | Shows or hides the bookmarks bar under the omnibox. |
| **Developer Console** | <kbd>Ctrl</kbd> + <kbd>`</kbd> | Toggles the internal developer console drawer. |
| **Chrome DevTools** | <kbd>F12</kbd> or <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>I</kbd> | Opens native Chromium developer tools. |

---

## ⚙️ Settings & Customization (`chrome://settings`)

Navigate to `chrome://settings` in the omnibox or via the 3-dots menu:

1. **Appearance**:
   - **Theme**: Toggle between Dark Mode and Light Mode with instant sync across all windows.
   - **Show Bookmarks Bar**: Keep favorite sites always visible.
   - **Show Developer Sidebar**: Enable or disable the left quick-switch bar.
2. **General**:
   - **Search Engine**: Choose Google, DuckDuckGo, Bing, or Brave.
   - **Homepage & New Tab URL**: Set custom default URLs.
3. **Performance & Memory**:
   - **Low RAM Mode**: Automatically hibernates inactive background tabs after 5, 15, 30, or 60 minutes.
   - **Restore Last Session**: Reopens previous tabs on browser startup.
4. **Privacy**:
   - **Chrome Shield**: Native blocking of ad networks, tracking telemetry, and malicious domains.
   - **Storage Cleanup**: Clear browsing history, cached web files, and cookies in one click.

---

## 🧭 Next Step
Proceed to **[02 - Interactive Dev Notebook](file:///d:/Development/electron/Chrome%20Lite/docs/guides/02-dev-notebook.md)** to learn how to execute live JavaScript directly against active web pages.
