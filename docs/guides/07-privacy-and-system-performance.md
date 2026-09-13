# 07 - Privacy & System Performance 🛡️

## Overview
Chrome Lite is engineered from the ground up to protect user privacy and maximize device performance. It eliminates intrusive tracking networks without relying on memory-heavy third-party extensions, and intelligently manages RAM to keep your system responsive even with dozens of tabs open.

---

## 🛡️ Chrome Shield (Built-in Ad & Tracker Blocker)

Chrome Shield blocks advertisements, analytics trackers, and malicious domains before network requests leave your machine.

- **Pinned Badge Counter**: The green shield badge on the omnibox displays the real-time count of blocked trackers for the active page.
- **Popup Inspector**: Click the shield badge to inspect blocked tracking scripts, advertising domains, and beacon telemetry.
- **Toggle Per Tab**: Temporarily disable blocking on trusted sites with a single click.
- **Privacy Settings**: Enable or disable global blocking in `chrome://settings`.

---

## 🍪 Cookie Jar Manager

The **Cookie Jar** (`chrome://cookies` or side panel) provides fine-grained control over site cookies:

- **Per-Domain Search & Filter**: View all cookies grouped by hostname.
- **Secure Attributes**: Inspect `HttpOnly`, `Secure`, `SameSite`, `Domain`, `Path`, and `Expires` timestamps.
- **Selective Purging**: Delete individual tracking cookies or wipe all cookies for a specific domain.
- **Export Cookies**: Export session cookies in Netscape or JSON format for developer testing.

---

## ⚡ Low-RAM Mode & Tab Hibernation

Modern web apps (like social networks, video platforms, and documentation hubs) frequently consume hundreds of megabytes of RAM per tab. Chrome Lite includes an autonomous background hibernation engine to prevent browser slowdowns.

### How Tab Hibernation Works:
1. When **Low RAM Mode** is enabled in `chrome://settings`, Chrome Lite monitors background tabs for inactivity.
2. If a tab has not been viewed for a configured threshold (**5m, 15m, 30m, or 60m**), the background tab's renderer process is gracefully hibernated:
   - Webview memory is freed.
   - Background timers and animation loops are paused.
   - Tab title, URL, favicon, and scroll positions are safely preserved.
3. **Instant Wakeup**: Clicking back on a hibernated tab restores it immediately.

### Manual Memory Optimization:
Navigate to `chrome://memory` to view real-time system CPU and RAM usage, and click **Force Hibernate Inactive Tabs** to free memory on demand.

---

## 🧭 Further Reading & Resources
- Check out the ready-to-use **[Example Userscripts](file:///d:/Development/electron/Chrome%20Lite/docs/examples/userscripts/)** to enhance your daily browsing.
- Explore the **[Example JavaScript Notebooks](file:///d:/Development/electron/Chrome%20Lite/docs/examples/notebooks/)** for interactive data extraction workflows.
