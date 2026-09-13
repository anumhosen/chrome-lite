# Chrome Lite 🚀

> **A high-performance, lightweight developer and research browser built with Electron, React 19, and TypeScript.**

Chrome Lite combines the familiar, authentic look and feel of **Google Chrome (Refresh 2024)** with an integrated suite of built-in developer tools, automation engines, and privacy subsystems—eliminating the need for dozens of external extensions.

---

## ✨ Key Features

### 🌐 Authentic Google Chrome Interface
- **Chrome Refresh 2024 Tab Strip**: Rounded tab curves, active tab elevation, circular `+` button (`Ctrl+T`), and smooth tab management.
- **Pill Omnibox**: Universal navigation bar supporting search queries, HTTPS lock indicators, AdBlock shields, and bookmark stars.
- **Extension Action Cluster**: Pinned extensions with live badge notifications, puzzle piece extensions menu, profile avatar, and the authentic 3-dots app menu (`⋮`).
- **Collapsible Bookmarks Bar**: Quick links bar (`Ctrl+Shift+B`) with custom favicons and an apps launcher.
- **Native Right Side Panel**: Dockable side panel hosting developer tools, history, bookmarks, or API inspector with instant popout into dedicated windows.
- **Frameless Window Controls**: Custom minimize, maximize/restore, and close buttons integrated into the title bar.

---

### 🧩 Built-in Power Extensions & Tools
All features are implemented as modular built-in extensions with pinned toolbar icons, dropdown popups, and dedicated views:

1. 🛡️ **Chrome Shield**: Built-in ad and telemetry blocker with live blocked request counters.
2. 🍪 **Cookie Jar Manager**: Inspect, search, filter, and purge cookies per domain in real time.
3. 📜 **Userscript Engine**: Inject and manage custom JavaScript user scripts directly into web pages.
4. 🛰️ **API & Network Interceptor**:
   - Intercept and inspect live HTTP/HTTPS traffic.
   - Configure custom **Mock Rules** (mock response body, headers, status codes, simulate network failure).
   - Export traffic sessions to **HAR 1.2** format.
   - Infer and export **OpenAPI 3.0** specifications from recorded traffic.
5. 🤖 **Browser Macro & Automation**:
   - **Action Recorder**: Record user interactions (clicks, typing, scrolls, navigation) live on any tab.
   - **Control Flow**: Conditional branching (`if_element_exists`, `if_text_contains`) and element iteration loops (`loop_elements`).
   - **Playwright Test Export**: Export any recorded or configured flow directly to a TypeScript Playwright test script (`.spec.ts`).
   - **Autonomous Cron Scheduler**: Schedule automated workflows with interval timers and webhook notifications.
   - **Headless Mode**: Run flows in background hidden windows without UI interruption.
6. 📓 **Interactive Dev Notebook**: Live JavaScript execution notebook connected to any active web tab with ultra-fast, lightweight CodeMirror 6 integration.
7. 🔍 **Visual Web Scraper**: Element selector picker and data table extractor with export to JSON/CSV.
8. 📦 **Media & Asset Grabber**: Deep scan page assets (images, videos, audio, fonts) with one-click batch download.

---

## 📚 Documentation & User Guides

Explore our complete documentation suite, guides, and pre-built scripts in the [docs/ directory](file:///d:/Development/electron/Chrome%20Lite/docs/README.md):

- **[01 - Getting Started](file:///d:/Development/electron/Chrome%20Lite/docs/guides/01-getting-started.md)**: Navigation, Omnibox, Tabs, Workspaces, and Profiles.
- **[02 - Interactive Dev Notebook](file:///d:/Development/electron/Chrome%20Lite/docs/guides/02-dev-notebook.md)**: CodeMirror 6 live JavaScript execution, DOM evaluation, and data tables.
- **[03 - Userscripts Engine](file:///d:/Development/electron/Chrome%20Lite/docs/guides/03-userscripts.md)**: Greasemonkey/Tampermonkey script injection, `GM_*` APIs, and matching.
- **[04 - API Interceptor & Mocking](file:///d:/Development/electron/Chrome%20Lite/docs/guides/04-api-interceptor-and-mocking.md)**: Live network inspection, mock rules, HAR 1.2, and OpenAPI 3.0.
- **[05 - Macro Automation & Playwright](file:///d:/Development/electron/Chrome%20Lite/docs/guides/05-macro-automation-and-playwright.md)**: Visual recorder, condition loops, and test export.
- **[06 - Web Scraper & Site Mirroring](file:///d:/Development/electron/Chrome%20Lite/docs/guides/06-web-scraper-and-mirroring.md)**: Visual element picker, table scraper, media asset grabber, and site mirroring.
- **[07 - Privacy & System Performance](file:///d:/Development/electron/Chrome%20Lite/docs/guides/07-privacy-and-system-performance.md)**: Chrome Shield ad/tracker blocker, Cookie Jar, and low-RAM tab hibernation.
- **[Example Userscripts](file:///d:/Development/electron/Chrome%20Lite/docs/examples/userscripts/)** & **[Example JavaScript Notebooks](file:///d:/Development/electron/Chrome%20Lite/docs/examples/notebooks/)**.

### 🖥️ Internal Chrome Apps (`chrome://` Pages)
Navigate to internal pages via the Omnibox or the 3-dots menu:
- `chrome://newtab` — Chrome Lite start page with search and top site shortcuts.
- `chrome://extensions` — Extension management page with developer mode and permission inspection.
- `chrome://apps` — Visual grid launcher for all internal browser applications.
- `chrome://settings` — Search engine selection, appearance theme (Dark/Light), RAM hibernation thresholds, and privacy toggles.
- `chrome://history` — SQLite-backed browsing history with search and cleanup.
- `chrome://bookmarks` — Bookmarks organizer.
- `chrome://downloads` — Downloads queue with file reveal and open shortcuts.

---

### ⚡ Performance & Memory Optimization
- **Auto-Hibernate Background Tabs**: Automatically puts inactive background tabs to sleep after a configurable inactivity threshold (5, 15, 30, or 60 minutes) to minimize RAM and CPU usage.
- **Lightweight Architecture**: Decoupled renderer and modular IPC bridge.
- **Session Restoration**: Restores open tabs across browser restarts.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| <kbd>Ctrl</kbd> + <kbd>T</kbd> | Open New Tab |
| <kbd>Ctrl</kbd> + <kbd>W</kbd> | Close Current Tab |
| <kbd>Ctrl</kbd> + <kbd>H</kbd> | Open History (`chrome://history`) |
| <kbd>Ctrl</kbd> + <kbd>J</kbd> | Open Downloads (`chrome://downloads`) |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>O</kbd> | Open Bookmarks (`chrome://bookmarks`) |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>B</kbd> | Toggle Bookmarks Bar |
| <kbd>Ctrl</kbd> + <kbd>`</kbd> | Toggle Developer Console |
| <kbd>F12</kbd> | Toggle Chrome DevTools |

---

## 🏗️ Architecture & Codebase Organization

The codebase follows a modular desktop architecture:

```text
Chrome Lite/
├── electron/                  # Electron Main Process & Native Backend
│   ├── assets/                # App icons and window resources
│   ├── ipc/                   # Typed IPC communication handlers
│   ├── modules/               # Subsystems (AdBlocker, Automation, SQLite DB)
│   ├── services/              # Config, profile, and session management
│   ├── main.js                # Electron application entrypoint
│   └── preload.js             # Context bridge exposing safe chromeLite IPC
│
├── frontend/                  # React 19 Frontend Shell
│   ├── src/
│   │   ├── components/
│   │   │   ├── bookmarks/     # BookmarksBar & Bookmark manager
│   │   │   ├── extensions/    # Extensions menu & popup cards (Shield, Cookies)
│   │   │   ├── layout/        # AppLayout, Viewport, and Popout window containers
│   │   │   ├── menu/          # Authentic 3-dots Chrome menu
│   │   │   ├── omnibox/       # ChromeToolbar & pill omnibox
│   │   │   ├── pages/         # Internal chrome:// pages (New Tab, Extensions, Apps)
│   │   │   ├── panels/        # Side panel views (Automation, Interceptor, Settings, etc.)
│   │   │   │   ├── automation/# StepEditor, PlaywrightGenerator, Scheduler
│   │   │   │   ├── interceptor/# TrafficView, MockRulesView
│   │   │   │   └── settings/  # GeneralSettings, Appearance, Privacy, Performance
│   │   │   ├── sidepanel/     # ChromeSidePanel dockable container
│   │   │   ├── topbar/        # ChromeTabStrip & tab curve rendering
│   │   │   └── window/        # Frameless WindowControls
│   │   ├── services/
│   │   │   └── chromeApi.ts   # Centralized strongly-typed API client
│   │   ├── stores/            # Zustand state stores (tabs, extensions, theme, downloads)
│   │   └── types/             # TypeScript definitions for IPC and browser contracts
│   └── vite.config.ts         # Vite build configuration
│
└── package.json               # Root scripts and workspace configuration
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0 (or yarn / pnpm)
- C++ build tools (required for native `sqlite3` compilation)

### Installation
Clone the repository and install root and package dependencies:

```bash
# Clone the repository
git clone https://github.com/anumhosen/chrome-lite.git
cd chrome-lite

# Install root dependencies
npm install

# Install frontend and electron dependencies
npm install --prefix frontend
npm install --prefix electron
```

### Development Mode
Launch the Vite dev server with hot reload alongside Electron:

```bash
npm run dev
```

### Production Build
Build the optimized frontend bundle and start the packaged Electron app:

```bash
# Build frontend bundle into electron/dist
npm run build

# Start Electron in production mode
npm start
```

### Packaging & Distribution
To package standalone installers (`.exe`, `.AppImage`, `.deb`, `.dmg`):

```bash
# Windows installer (NSIS & Portable)
npm run dist:win

# Linux package (AppImage & DEB)
npm run dist:linux

# macOS package (DMG)
npm run dist:mac
```

---

## 🛠️ Tech Stack
- **Desktop Runtime**: [Electron](https://www.electronjs.org/) (v30)
- **UI Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Bundler**: [Vite](https://vitejs.dev/) (v6)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Editor**: Lightweight [CodeMirror 6](https://codemirror.net/) (@uiw/react-codemirror)
- **Database**: Embedded [SQLite3](https://github.com/TryGhost/node-sqlite3)

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
Copyright © 2026 Anum Hosen.
