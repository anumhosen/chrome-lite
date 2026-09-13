import React, { useState, useRef, useEffect } from 'react';
import {
  VscClose,
  VscLinkExternal,
  VscBrowser,
  VscChevronDown,
  VscBookmark,
  VscHistory,
  VscPulse,
  VscTerminal,
  VscFolderOpened,
  VscBook,
} from 'react-icons/vsc';
import { usePanelStore, type PanelType } from '../../stores/usePanelStore';
import { useTabStore } from '../../stores/useTabStore';
import { PanelRenderer, PANEL_TITLES, normalizePanelName } from '../panels/PanelRenderer';

const SIDE_PANEL_OPTIONS: { id: PanelType; title: string; icon: React.ReactNode }[] = [
  { id: 'bookmarks', title: 'Bookmarks', icon: <VscBookmark size={14} /> },
  { id: 'history', title: 'History', icon: <VscHistory size={14} /> },
  { id: 'interceptor', title: 'API Inspector', icon: <VscPulse size={14} /> },
  { id: 'console', title: 'Developer Console', icon: <VscTerminal size={14} /> },
  { id: 'explorer', title: 'Resource Explorer', icon: <VscFolderOpened size={14} /> },
  { id: 'notebook', title: 'Dev Notebook', icon: <VscBook size={14} /> },
];

export const ChromeSidePanel: React.FC = () => {
  const { currentPanel, isOpen, closePanel, openPanel, width, setWidth } = usePanelStore();
  const { tabs, activeTabId, createTab } = useTabStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(width);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const delta = startXRef.current - e.clientX;
      setWidth(startWidthRef.current + delta);
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
        document.body.style.cursor = '';
      }
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, setWidth]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;
    document.body.style.cursor = 'col-resize';
  };

  if (!isOpen || !currentPanel) return null;

  const norm = normalizePanelName(currentPanel);

  const getActiveWebTabId = (): string | undefined => {
    const activeWeb = tabs.find(
      (t) => t.id === activeTabId && !t.url.startsWith('chrome://') && t.url !== 'about:blank'
    );
    if (activeWeb) return activeWeb.id;
    const anyWeb = tabs.find(
      (t) => !t.url.startsWith('chrome://') && t.url !== 'about:blank'
    );
    return anyWeb?.id;
  };

  const handlePopout = () => {
    const targetTabId = getActiveWebTabId();
    if (window.chrome?.window?.openFloating) {
      window.chrome.window.openFloating(norm, targetTabId);
    } else if (norm === 'notebook' && window.chrome?.notebook?.openFloating) {
      window.chrome.notebook.openFloating();
    }
  };

  const handleOpenTab = () => {
    const targetTabId = getActiveWebTabId();
    const query = targetTabId ? `?targetTab=${encodeURIComponent(targetTabId)}` : '';
    createTab(`chrome://${norm}${query}`);
    closePanel();
  };

  const activeOption = SIDE_PANEL_OPTIONS.find((o) => o.id === norm) || {
    id: norm as any,
    title: PANEL_TITLES[norm] || currentPanel,
    icon: <VscBookmark size={14} />,
  };

  return (
    <aside
      className="chrome-side-panel absolute top-0 right-0 h-full bg-white dark:bg-neutral-900 border-l border-gray-200 dark:border-neutral-800 shadow-xl flex flex-col z-40 select-none transition-none"
      style={{ width: `${width}px` }}
    >
      {/* Resizing Edge */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute top-0 -left-1 w-2 h-full cursor-col-resize hover:bg-sky-500 active:bg-sky-500 transition-colors z-50"
        title="Drag to resize side panel"
      />

      {/* Chrome Side Panel Header */}
      <div className="h-[40px] px-3 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between">
        {/* Dropdown Selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-800 dark:text-neutral-200 font-medium text-xs transition-colors"
          >
            <span className="text-gray-500 dark:text-neutral-400">{activeOption.icon}</span>
            <span>{activeOption.title}</span>
            <VscChevronDown size={13} className="text-gray-400" />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-8 left-0 w-[190px] bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-gray-200 dark:border-neutral-800 py-1.5 z-50 text-xs animate-in fade-in">
              <div className="px-3 py-1 text-[10px] font-semibold text-gray-400 dark:text-neutral-500 uppercase tracking-wider">
                Side panel
              </div>
              {SIDE_PANEL_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    openPanel(opt.id);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-left hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors ${
                    opt.id === norm ? 'text-sky-600 dark:text-sky-400 font-medium bg-sky-50/50 dark:bg-neutral-800/40' : 'text-gray-700 dark:text-neutral-300'
                  }`}
                >
                  <span className="text-gray-500 dark:text-neutral-400">{opt.icon}</span>
                  <span>{opt.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Panel Action Buttons */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={handleOpenTab}
            title="Open in new tab (chrome://)"
            className="w-7 h-7 rounded-full flex items-center justify-center text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-100 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <VscBrowser size={14} />
          </button>
          <button
            onClick={handlePopout}
            title="Pop out into separate window"
            className="w-7 h-7 rounded-full flex items-center justify-center text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-100 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <VscLinkExternal size={14} />
          </button>
          <button
            onClick={closePanel}
            title="Close side panel"
            className="w-7 h-7 rounded-full flex items-center justify-center text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-100 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <VscClose size={15} />
          </button>
        </div>
      </div>

      {/* Side Panel Content Body */}
      <div className="flex-1 overflow-y-auto p-3 text-gray-800 dark:text-neutral-200 text-xs">
        <PanelRenderer panel={norm} mode="drawer" />
      </div>
    </aside>
  );
};
