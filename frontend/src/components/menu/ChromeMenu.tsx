import React, { useRef, useEffect } from 'react';
import {
  VscAdd,
  VscHistory,
  VscCloudDownload,
  VscBookmark,
  VscExtensions,
  VscSettingsGear,
  VscTerminal,
  VscDashboard,
  VscColorMode,
  VscLayoutSidebarLeft,
  VscBook,
  VscPulse,
  VscCheck,
} from 'react-icons/vsc';
import { useTabStore } from '../../stores/useTabStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useThemeStore } from '../../stores/useThemeStore';

interface ChromeMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChromeMenu: React.FC<ChromeMenuProps> = ({ isOpen, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const { createTab } = useTabStore();
  const { showBookmarksBar, toggleBookmarksBar, showDeveloperSidebar, toggleDeveloperSidebar } = useSettingsStore();
  const { theme, toggleTheme } = useThemeStore();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAction = (url?: string, callback?: () => void) => {
    if (url) createTab(url);
    if (callback) callback();
    onClose();
  };

  const handleDevTools = () => {
    if (window.chrome?.window?.toggleDevTools) {
      window.chrome.window.toggleDevTools();
    }
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="absolute top-10 right-2 w-[270px] bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-gray-200 dark:border-neutral-800 py-1.5 select-none text-xs text-gray-700 dark:text-neutral-200 z-50 animate-in fade-in zoom-in-95 duration-100"
    >
      {/* Navigation Group */}
      <div className="py-1">
        <button
          onClick={() => handleAction(undefined, () => createTab('chrome://newtab'))}
          className="w-full px-3.5 py-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 flex items-center justify-between text-left transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <VscAdd size={14} className="text-gray-500 dark:text-neutral-400" />
            <span>New tab</span>
          </div>
          <span className="text-[10px] text-gray-400 dark:text-neutral-500 font-mono">Ctrl+T</span>
        </button>

        <button
          onClick={() => handleAction('chrome://history')}
          className="w-full px-3.5 py-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 flex items-center justify-between text-left transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <VscHistory size={14} className="text-gray-500 dark:text-neutral-400" />
            <span>History</span>
          </div>
          <span className="text-[10px] text-gray-400 dark:text-neutral-500 font-mono">Ctrl+H</span>
        </button>

        <button
          onClick={() => handleAction('chrome://downloads')}
          className="w-full px-3.5 py-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 flex items-center justify-between text-left transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <VscCloudDownload size={14} className="text-gray-500 dark:text-neutral-400" />
            <span>Downloads</span>
          </div>
          <span className="text-[10px] text-gray-400 dark:text-neutral-500 font-mono">Ctrl+J</span>
        </button>

        <button
          onClick={() => handleAction('chrome://bookmarks')}
          className="w-full px-3.5 py-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 flex items-center justify-between text-left transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <VscBookmark size={14} className="text-gray-500 dark:text-neutral-400" />
            <span>Bookmark manager</span>
          </div>
          <span className="text-[10px] text-gray-400 dark:text-neutral-500 font-mono">Ctrl+Shift+O</span>
        </button>
      </div>

      <div className="h-[1px] bg-gray-100 dark:bg-neutral-800 my-1" />

      {/* Bookmarks Bar Toggle */}
      <div className="py-1">
        <button
          onClick={() => {
            toggleBookmarksBar();
            onClose();
          }}
          className="w-full px-3.5 py-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 flex items-center justify-between text-left transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-4 flex items-center justify-center">
              {showBookmarksBar && <VscCheck size={14} className="text-sky-600 dark:text-sky-400" />}
            </div>
            <span>Show bookmarks bar</span>
          </div>
          <span className="text-[10px] text-gray-400 dark:text-neutral-500 font-mono">Ctrl+Shift+B</span>
        </button>

        <button
          onClick={() => handleAction('chrome://extensions')}
          className="w-full px-3.5 py-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 flex items-center justify-between text-left transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <VscExtensions size={14} className="text-gray-500 dark:text-neutral-400" />
            <span>Extensions</span>
          </div>
        </button>
      </div>

      <div className="h-[1px] bg-gray-100 dark:bg-neutral-800 my-1" />

      {/* Developer Tools & Apps */}
      <div className="py-1">
        <div className="px-3.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-neutral-500">
          Developer Tools
        </div>

        <button
          onClick={handleDevTools}
          className="w-full px-3.5 py-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 flex items-center justify-between text-left transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <VscTerminal size={14} className="text-gray-500 dark:text-neutral-400" />
            <span>Inspect element / DevTools</span>
          </div>
          <span className="text-[10px] text-gray-400 dark:text-neutral-500 font-mono">F12</span>
        </button>

        <button
          onClick={() => handleAction('chrome://system')}
          className="w-full px-3.5 py-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 flex items-center justify-between text-left transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <VscDashboard size={14} className="text-gray-500 dark:text-neutral-400" />
            <span>Task Manager (RAM)</span>
          </div>
          <span className="text-[10px] text-gray-400 dark:text-neutral-500 font-mono">Shift+Esc</span>
        </button>

        <button
          onClick={() => handleAction('chrome://notebook')}
          className="w-full px-3.5 py-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 flex items-center gap-2.5 text-left transition-colors"
        >
          <VscBook size={14} className="text-gray-500 dark:text-neutral-400" />
          <span>Dev Notebook</span>
        </button>

        <button
          onClick={() => handleAction('chrome://interceptor')}
          className="w-full px-3.5 py-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 flex items-center gap-2.5 text-left transition-colors"
        >
          <VscPulse size={14} className="text-gray-500 dark:text-neutral-400" />
          <span>API Inspector</span>
        </button>

        {/* User feedback: Toggle developer sidebar */}
        <button
          onClick={() => {
            toggleDeveloperSidebar();
            onClose();
          }}
          className="w-full px-3.5 py-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 flex items-center justify-between text-left transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-4 flex items-center justify-center">
              {showDeveloperSidebar && <VscCheck size={14} className="text-sky-600 dark:text-sky-400" />}
            </div>
            <span>Show Developer Sidebar</span>
          </div>
          <VscLayoutSidebarLeft size={13} className="text-gray-400" />
        </button>
      </div>

      <div className="h-[1px] bg-gray-100 dark:bg-neutral-800 my-1" />

      {/* Settings & Theme */}
      <div className="py-1">
        <button
          onClick={() => {
            toggleTheme();
            onClose();
          }}
          className="w-full px-3.5 py-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 flex items-center justify-between text-left transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <VscColorMode size={14} className="text-gray-500 dark:text-neutral-400" />
            <span>Toggle Theme</span>
          </div>
          <span className="text-[10px] text-gray-400 dark:text-neutral-500 capitalize">{theme}</span>
        </button>

        <button
          onClick={() => handleAction('chrome://settings')}
          className="w-full px-3.5 py-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 flex items-center gap-2.5 text-left transition-colors"
        >
          <VscSettingsGear size={14} className="text-gray-500 dark:text-neutral-400" />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
};
