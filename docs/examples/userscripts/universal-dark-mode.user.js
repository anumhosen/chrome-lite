// ==UserScript==
// @name         Universal Dark Mode & Contrast Protector
// @match        *://*/*
// @run-at       document-end
// @description  Intelligently applies a smooth dark theme and protects against high-contrast flashbangs on any website.
// ==/UserScript==

(function () {
  'use strict';

  const STORAGE_KEY = 'chrome_lite_dark_mode_enabled';

  // Respect stored user preference per domain or default to active
  let isEnabled = GM_getValue ? GM_getValue(STORAGE_KEY, true) : true;

  const DARK_CSS = `
    html.chrome-lite-dark-mode {
      background-color: #121212 !important;
      color: #e0e0e0 !important;
      color-scheme: dark !important;
    }

    html.chrome-lite-dark-mode body {
      background-color: #121212 !important;
      color: #e0e0e0 !important;
    }

    html.chrome-lite-dark-mode input,
    html.chrome-lite-dark-mode textarea,
    html.chrome-lite-dark-mode select {
      background-color: #1e1e1e !important;
      color: #ffffff !important;
      border-color: #333333 !important;
    }

    html.chrome-lite-dark-mode a {
      color: #38bdf8 !important;
    }

    html.chrome-lite-dark-mode a:visited {
      color: #a855f7 !important;
    }

    /* Preserve media colors from inverted hue filters */
    html.chrome-lite-dark-mode img,
    html.chrome-lite-dark-mode video,
    html.chrome-lite-dark-mode canvas,
    html.chrome-lite-dark-mode svg {
      filter: none !important;
    }

    #chrome-lite-dark-toggle-btn {
      position: fixed;
      bottom: 18px;
      right: 18px;
      z-index: 999999;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #1e293b;
      color: #f8fafc;
      border: 1px solid #475569;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 14px;
      opacity: 0.35;
      transition: opacity 0.2s, transform 0.2s;
    }

    #chrome-lite-dark-toggle-btn:hover {
      opacity: 1;
      transform: scale(1.1);
    }
  `;

  if (typeof GM_addStyle === 'function') {
    GM_addStyle(DARK_CSS);
  } else {
    const styleEl = document.createElement('style');
    styleEl.textContent = DARK_CSS;
    document.head.appendChild(styleEl);
  }

  function applyTheme() {
    if (isEnabled) {
      document.documentElement.classList.add('chrome-lite-dark-mode');
    } else {
      document.documentElement.classList.remove('chrome-lite-dark-mode');
    }
  }

  function createToggleButton() {
    if (document.getElementById('chrome-lite-dark-toggle-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'chrome-lite-dark-toggle-btn';
    btn.title = 'Toggle Universal Dark Mode';
    btn.innerHTML = isEnabled ? '🌙' : '☀️';

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      isEnabled = !isEnabled;
      if (typeof GM_setValue === 'function') {
        GM_setValue(STORAGE_KEY, isEnabled);
      }
      btn.innerHTML = isEnabled ? '🌙' : '☀️';
      applyTheme();
    });

    document.body.appendChild(btn);
  }

  applyTheme();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createToggleButton);
  } else {
    createToggleButton();
  }
})();
