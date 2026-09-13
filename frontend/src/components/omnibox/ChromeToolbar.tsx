import React, { useState, useEffect } from 'react';
import {
  VscArrowLeft,
  VscArrowRight,
  VscRefresh,
  VscHome,
  VscLock,
  VscSearch,
  VscStarEmpty,
  VscStarFull,
  VscExtensions,
  VscLayoutSidebarRight,
  VscKebabVertical,
} from 'react-icons/vsc';
import { useTabStore } from '../../stores/useTabStore';
import { useHistoryBookmarkStore } from '../../stores/useHistoryBookmarkStore';
import { useExtensionStore } from '../../stores/useExtensionStore';
import { usePanelStore } from '../../stores/usePanelStore';
import { ExtensionsMenu, getExtensionIcon } from '../extensions/ExtensionsMenu';
import { ChromeMenu } from '../menu/ChromeMenu';
import { ShieldPopup } from '../extensions/popups/ShieldPopup';
import { CookiePopup } from '../extensions/popups/CookiePopup';
import { UserscriptsPopup } from '../extensions/popups/UserscriptsPopup';
import { getChromeAPI } from '../../lib/chrome';

export const ChromeToolbar: React.FC = () => {
  const { urlInput, setUrlInput, navigate, goBack, goForward, reload, activeTabId, tabs, blockedCount } = useTabStore();
  const { bookmarks, addBookmark, removeBookmark } = useHistoryBookmarkStore();
  const {
    extensions,
    activePopup,
    popupAnchorRect,
    openPopup,
    closePopup,
    isExtensionsMenuOpen,
    toggleExtensionsMenu,
  } = useExtensionStore();
  const { togglePanel, isOpen: isSidePanelOpen } = usePanelStore();

  const [isOmniboxFocused, setIsOmniboxFocused] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const currentUrl = activeTab?.url || '';

  // Synchronize URL input with active tab URL when not actively editing
  useEffect(() => {
    if (!isOmniboxFocused && currentUrl && currentUrl !== 'about:blank') {
      setUrlInput(currentUrl);
    }
  }, [currentUrl, isOmniboxFocused, setUrlInput]);

  const isBookmarked = bookmarks.some((b) => b.url === currentUrl && currentUrl !== 'about:blank');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsOmniboxFocused(false);
      navigate(urlInput);
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'Escape') {
      setIsOmniboxFocused(false);
      if (currentUrl) setUrlInput(currentUrl);
      (e.target as HTMLInputElement).blur();
    }
  };

  const toggleBookmark = () => {
    if (!currentUrl || currentUrl === 'about:blank' || currentUrl.startsWith('chrome://')) return;
    if (isBookmarked) {
      const match = bookmarks.find((b) => b.url === currentUrl);
      if (match) removeBookmark(match.id);
    } else {
      addBookmark(activeTab?.title || currentUrl, currentUrl);
    }
  };

  const handleGoHome = async () => {
    let target = localStorage.getItem('chrome_homepage');
    const api = getChromeAPI();
    if (!target && api?.system?.getConfig) {
      try {
        const cfg = await api.system.getConfig();
        const remote = cfg?.settings?.homepage;
        if (remote) target = remote;
      } catch { }
    }
    navigate(target || 'chrome://newtab');
  };

  const pinnedExtensions = extensions.filter((ext) => ext.pinned && ext.enabled);

  const handlePinnedExtensionClick = (e: React.MouseEvent<HTMLButtonElement>, ext: any) => {
    if (ext.hasPopup) {
      if (activePopup === ext.id) {
        closePopup();
      } else {
        openPopup(ext.id as any, e.currentTarget);
      }
    } else {
      navigate(`chrome://${ext.id}`);
    }
  };

  const isInternalUrl = currentUrl.startsWith('chrome://');
  const isSecure = currentUrl.startsWith('https://');

  return (
    <nav className="relative h-[40px] bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 flex items-center px-2.5 gap-2 select-none flex-shrink-0 z-30">
      {/* Navigation Buttons */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={goBack}
          disabled={!activeTab?.canGoBack}
          title="Click to go back (Alt+Left Arrow)"
          className="w-7 h-7 flex items-center justify-center text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-100 hover:bg-gray-100 dark:hover:bg-neutral-800 disabled:opacity-35 disabled:hover:bg-transparent rounded-full transition-colors"
        >
          <VscArrowLeft size={15} />
        </button>
        <button
          onClick={goForward}
          disabled={!activeTab?.canGoForward}
          title="Click to go forward (Alt+Right Arrow)"
          className="w-7 h-7 flex items-center justify-center text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-100 hover:bg-gray-100 dark:hover:bg-neutral-800 disabled:opacity-35 disabled:hover:bg-transparent rounded-full transition-colors"
        >
          <VscArrowRight size={15} />
        </button>
        <button
          onClick={reload}
          title="Reload this page (Ctrl+R)"
          className="w-7 h-7 flex items-center justify-center text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-100 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
        >
          <VscRefresh size={15} />
        </button>
        <button
          onClick={handleGoHome}
          title="Open homepage"
          className="w-7 h-7 flex items-center justify-center text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-100 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
        >
          <VscHome size={15} />
        </button>
      </div>

      {/* Pill Omnibox Address Bar */}
      <div
        className={`flex-1 flex items-center h-[30px] rounded-full px-3.5 transition-all ${
          isOmniboxFocused
            ? 'bg-white dark:bg-neutral-950 ring-2 ring-sky-500/80 shadow-sm border border-transparent'
            : 'bg-gray-100/90 dark:bg-neutral-950/80 hover:bg-gray-200/70 dark:hover:bg-neutral-950 border border-transparent'
        }`}
      >
        {/* Left Security / Search Icon */}
        <div className="flex items-center justify-center mr-2 text-gray-500 dark:text-neutral-400">
          {isInternalUrl ? (
            <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
              chrome
            </span>
          ) : isSecure ? (
            <VscLock size={13} className="text-gray-500 dark:text-neutral-400" title="Connection is secure" />
          ) : (
            <VscSearch size={13} className="text-gray-400 dark:text-neutral-500" />
          )}
        </div>

        {/* URL Input */}
        <input
          type="text"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onFocus={(e) => {
            setIsOmniboxFocused(true);
            e.target.select();
          }}
          onBlur={() => {
            setIsOmniboxFocused(false);
            if (currentUrl && currentUrl !== 'about:blank') setUrlInput(currentUrl);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search Google or type a URL"
          spellCheck={false}
          className="flex-1 bg-transparent border-none outline-none text-xs text-gray-900 dark:text-neutral-100 placeholder-gray-400 dark:placeholder-neutral-500"
        />

        {/* Right Action Icons in Omnibox */}
        <div className="flex items-center gap-1.5 ml-2">
          {/* AdBlock Shield Quick Badge */}
          {blockedCount > 0 && (
            <button
              onClick={(e) => {
                if (activePopup === 'shield') closePopup();
                else openPopup('shield', e.currentTarget);
              }}
              title={`Chrome Shield: ${blockedCount} items blocked`}
              className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium px-1.5 py-0.5 rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
            >
              <span>{blockedCount}</span>
            </button>
          )}

          {/* Bookmark Star */}
          {!isInternalUrl && currentUrl && currentUrl !== 'about:blank' && (
            <button
              onClick={toggleBookmark}
              title={isBookmarked ? 'Bookmark this tab (Ctrl+D)' : 'Bookmark this tab (Ctrl+D)'}
              className="text-gray-400 dark:text-neutral-400 hover:text-amber-500 dark:hover:text-amber-400 p-0.5 transition-colors"
            >
              {isBookmarked ? (
                <VscStarFull size={14} className="text-amber-500 dark:text-amber-400" />
              ) : (
                <VscStarEmpty size={14} />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Toolbar Extension Actions & Menu Icons */}
      <div className="flex items-center gap-0.5">
        {/* Pinned Extensions */}
        {pinnedExtensions.map((ext) => {
          const isActive = activePopup === ext.id;
          return (
            <button
              key={ext.id}
              onClick={(e) => handlePinnedExtensionClick(e, ext)}
              title={ext.name}
              className={`relative w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
                isActive
                  ? 'bg-sky-100 dark:bg-neutral-800 text-sky-600 dark:text-sky-400'
                  : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-100 hover:bg-gray-100 dark:hover:bg-neutral-800'
              }`}
            >
              {getExtensionIcon(ext.id, 15)}
              {ext.id === 'shield' && blockedCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-emerald-600 text-white font-bold text-[8.5px] rounded-full min-w-[13px] h-[13px] flex items-center justify-center px-0.5 leading-none">
                  {blockedCount > 99 ? '99+' : blockedCount}
                </span>
              )}
            </button>
          );
        })}

        {/* Extensions Puzzle Piece Menu Button */}
        <button
          onClick={toggleExtensionsMenu}
          title="Extensions"
          className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
            isExtensionsMenuOpen
              ? 'bg-sky-100 dark:bg-neutral-800 text-sky-600 dark:text-sky-400'
              : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-100 hover:bg-gray-100 dark:hover:bg-neutral-800'
          }`}
        >
          <VscExtensions size={16} />
        </button>

        {/* Side Panel Toggle Button */}
        <button
          onClick={() => togglePanel('bookmarks')}
          title="Side panel"
          className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
            isSidePanelOpen
              ? 'bg-sky-100 dark:bg-neutral-800 text-sky-600 dark:text-sky-400'
              : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-100 hover:bg-gray-100 dark:hover:bg-neutral-800'
          }`}
        >
          <VscLayoutSidebarRight size={15} />
        </button>

        {/* Profile Avatar */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen((prev) => !prev)}
            title="Current Profile: Default"
            className="w-6 h-6 rounded-full bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold flex items-center justify-center transition-colors ml-0.5 shadow-sm"
          >
            D
          </button>
          {isProfileOpen && (
            <div
              className="absolute top-9 right-0 w-[200px] bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-gray-200 dark:border-neutral-800 p-3 select-none text-xs text-gray-800 dark:text-neutral-200 z-50 animate-in fade-in"
              onMouseLeave={() => setIsProfileOpen(false)}
            >
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-neutral-800">
                <div className="w-7 h-7 rounded-full bg-sky-600 text-white font-bold flex items-center justify-center text-xs">
                  D
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-gray-900 dark:text-neutral-100 truncate">Default Profile</span>
                  <span className="text-[10.5px] text-gray-400 truncate">Personal Workspace</span>
                </div>
              </div>
              <div className="pt-2 text-[11px] text-gray-500 dark:text-neutral-400">
                Sync is off
              </div>
            </div>
          )}
        </div>

        {/* Chrome 3-Dots Menu Button */}
        <button
          onClick={() => setIsMenuOpen((prev) => !prev)}
          title="Customize and control Chrome Lite"
          className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
            isMenuOpen
              ? 'bg-gray-200 dark:bg-neutral-800 text-gray-900 dark:text-neutral-100'
              : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-100 hover:bg-gray-100 dark:hover:bg-neutral-800'
          }`}
        >
          <VscKebabVertical size={16} />
        </button>
      </div>

      {/* Extension Dropdown Menu */}
      {isExtensionsMenuOpen && <ExtensionsMenu />}

      {/* Extension Action Popups */}
      {activePopup === 'shield' && (
        <div
          className="absolute top-10 z-50"
          style={{ right: popupAnchorRect ? `${window.innerWidth - popupAnchorRect.right}px` : '60px' }}
        >
          <ShieldPopup />
        </div>
      )}

      {activePopup === 'cookies' && (
        <div
          className="absolute top-10 z-50"
          style={{ right: popupAnchorRect ? `${window.innerWidth - popupAnchorRect.right}px` : '60px' }}
        >
          <CookiePopup />
        </div>
      )}

      {activePopup === 'userscripts' && (
        <div
          className="absolute top-10 z-50"
          style={{ right: popupAnchorRect ? `${window.innerWidth - popupAnchorRect.right}px` : '60px' }}
        >
          <UserscriptsPopup />
        </div>
      )}

      {/* 3-Dots Chrome Menu */}
      <ChromeMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </nav>
  );
};
