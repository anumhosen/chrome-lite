// ==UserScript==
// @name         Distraction-Free Reading Mode
// @match        *://*/*
// @run-at       document-end
// @description  Adds a floating book icon (or press Alt+R) to strip headers, ads, and sidebars into a clean reader view.
// ==/UserScript==

(function () {
  'use strict';

  let isReadingMode = false;
  let originalStyles = null;

  const READER_CSS = `
    .chrome-lite-reader-active header,
    .chrome-lite-reader-active nav,
    .chrome-lite-reader-active footer,
    .chrome-lite-reader-active aside,
    .chrome-lite-reader-active [class*="sidebar"],
    .chrome-lite-reader-active [id*="sidebar"],
    .chrome-lite-reader-active [class*="ad-"],
    .chrome-lite-reader-active [id*="ad-"] {
      display: none !important;
    }

    .chrome-lite-reader-active article,
    .chrome-lite-reader-active main,
    .chrome-lite-reader-active .content,
    .chrome-lite-reader-active #content {
      max-width: 760px !important;
      margin: 40px auto !important;
      padding: 24px !important;
      font-size: 18px !important;
      line-height: 1.8 !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Georgia, serif !important;
      background: transparent !important;
      float: none !important;
    }

    #chrome-lite-reader-btn {
      position: fixed;
      bottom: 58px;
      right: 18px;
      z-index: 999999;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #0f766e;
      color: #ffffff;
      border: 1px solid #14b8a6;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 15px;
      opacity: 0.4;
      transition: opacity 0.2s, transform 0.2s;
    }

    #chrome-lite-reader-btn:hover {
      opacity: 1;
      transform: scale(1.1);
    }
  `;

  if (typeof GM_addStyle === 'function') {
    GM_addStyle(READER_CSS);
  } else {
    const s = document.createElement('style');
    s.textContent = READER_CSS;
    document.head.appendChild(s);
  }

  function toggleReaderMode() {
    isReadingMode = !isReadingMode;
    if (isReadingMode) {
      document.body.classList.add('chrome-lite-reader-active');
      document.documentElement.classList.add('chrome-lite-reader-active');
    } else {
      document.body.classList.remove('chrome-lite-reader-active');
      document.documentElement.classList.remove('chrome-lite-reader-active');
    }
    const btn = document.getElementById('chrome-lite-reader-btn');
    if (btn) btn.style.opacity = isReadingMode ? '1' : '0.4';
  }

  function createButton() {
    if (document.getElementById('chrome-lite-reader-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'chrome-lite-reader-btn';
    btn.title = 'Toggle Distraction-Free Reading Mode (Alt+R)';
    btn.innerHTML = '📖';
    btn.addEventListener('click', toggleReaderMode);
    document.body.appendChild(btn);
  }

  // Keyboard shortcut Alt+R
  window.addEventListener('keydown', (e) => {
    if (e.altKey && e.key.toLowerCase() === 'r') {
      e.preventDefault();
      toggleReaderMode();
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createButton);
  } else {
    createButton();
  }
})();
