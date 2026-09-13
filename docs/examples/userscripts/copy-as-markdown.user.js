// ==UserScript==
// @name         Copy as Markdown Link & Quote
// @match        *://*/*
// @run-at       document-end
// @description  Press Alt+M to copy the current page title and URL formatted as a clean Markdown link [Title](URL), or selection as a blockquote.
// ==/UserScript==

(function () {
  'use strict';

  function showToast(message) {
    const existing = document.getElementById('chrome-lite-md-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'chrome-lite-md-toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999999;
      background: #0f172a;
      color: #38bdf8;
      border: 1px solid #0284c7;
      padding: 8px 16px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 12px;
      font-weight: 500;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      opacity: 0;
      transform: translateY(-8px);
      transition: all 0.2s ease;
    `;

    document.body.appendChild(toast);
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    });

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-8px)';
      setTimeout(() => toast.remove(), 250);
    }, 2000);
  }

  function copyMarkdown() {
    const selection = window.getSelection() ? window.getSelection().toString().trim() : '';
    const title = document.title.trim() || 'Link';
    const url = window.location.href;

    let markdown = '';

    if (selection) {
      markdown = `> ${selection.split('\n').join('\n> ')}\n>\n> — [${title}](${url})`;
      navigator.clipboard.writeText(markdown).then(() => {
        showToast('✓ Copied selection as Markdown Quote!');
      });
    } else {
      markdown = `[${title}](${url})`;
      navigator.clipboard.writeText(markdown).then(() => {
        showToast('✓ Copied page as Markdown Link!');
      });
    }
  }

  // Hotkey Alt+M
  window.addEventListener('keydown', (e) => {
    if (e.altKey && e.key.toLowerCase() === 'm') {
      e.preventDefault();
      copyMarkdown();
    }
  });

  console.log('[Chrome Lite] Copy as Markdown ready (Press Alt+M)');
})();
