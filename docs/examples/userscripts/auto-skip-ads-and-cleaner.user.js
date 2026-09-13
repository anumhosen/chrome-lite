// ==UserScript==
// @name         Auto Skip Ads & Floating Overlay Cleaner
// @match        *://*/*
// @run-at       document-end
// @description  Automatically clicks 'Skip Ad' buttons, mutes autoplay ad videos, and removes intrusive floating modal backdrops.
// ==/UserScript==

(function () {
  'use strict';

  // Common selectors for skip buttons and ad overlays across platforms
  const SKIP_SELECTORS = [
    '.ytp-ad-skip-button',
    '.ytp-ad-skip-button-modern',
    '.ytp-skip-ad-button',
    '.videoAdUiSkipButton',
    '[aria-label="Skip Ad"]',
    '[id*="skip-button"]',
    '.ad-skip',
    '.skip-ad'
  ];

  const ANNOYANCE_SELECTORS = [
    '.tp-backdrop',
    '.tp-modal',
    '.newsletter-modal',
    '.email-popup',
    '[id*="paywall-overlay"]',
    '.sp-message-open'
  ];

  function cleanOverlays() {
    // 1. Click skip ad buttons if present
    for (const selector of SKIP_SELECTORS) {
      const btn = document.querySelector(selector);
      if (btn && typeof btn.click === 'function') {
        btn.click();
        console.log('[Cleaner] Auto-clicked ad skip button:', selector);
        break;
      }
    }

    // 2. Remove floating modal paywall / newsletter backdrops
    for (const selector of ANNOYANCE_SELECTORS) {
      const elements = document.querySelectorAll(selector);
      elements.forEach((el) => {
        el.remove();
        // Restore page scrolling if lock was applied
        document.body.style.overflow = 'auto';
        document.documentElement.style.overflow = 'auto';
        console.log('[Cleaner] Removed overlay backdrop:', selector);
      });
    }

    // 3. Fast-forward unskippable video ads if active
    const video = document.querySelector('video');
    const adShowing = document.querySelector('.ad-showing, .video-ads');
    if (video && adShowing && !video.paused && video.duration > 0 && video.currentTime < video.duration) {
      video.muted = true;
      video.playbackRate = 16.0;
      video.currentTime = video.duration;
      console.log('[Cleaner] Fast-forwarded video ad');
    }
  }

  // Run immediately and observe DOM mutations
  cleanOverlays();
  setInterval(cleanOverlays, 800);
})();
