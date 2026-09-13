import React from 'react';
import { VscColorMode } from 'react-icons/vsc';
import { useThemeStore } from '../../../stores/useThemeStore';
import { useSettingsStore } from '../../../stores/useSettingsStore';

export const AppearanceSettings: React.FC = () => {
  const { theme, setTheme } = useThemeStore();
  const {
    showStatusBar,
    setShowStatusBar,
    showBookmarksBar,
    setShowBookmarksBar,
    showDeveloperSidebar,
    setShowDeveloperSidebar,
  } = useSettingsStore();

  return (
    <div className="p-3 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-md flex flex-col gap-2.5">
      <span className="font-semibold text-gray-700 dark:text-neutral-300 uppercase tracking-wider text-[10.5px]">
        Appearance & Interface
      </span>

      <div className="flex flex-col gap-1.5">
        <label className="text-gray-600 dark:text-neutral-400 text-[11px] flex items-center gap-1.5">
          <VscColorMode size={13} />
          <span>Theme Mode</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setTheme('dark')}
            className={`py-1.5 px-3 rounded flex items-center justify-center gap-2 border text-xs font-medium transition-colors ${
              theme === 'dark'
                ? 'bg-sky-500/15 border-sky-500 text-sky-400'
                : 'bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-200'
            }`}
          >
            <span>Dark Theme</span>
          </button>
          <button
            onClick={() => setTheme('light')}
            className={`py-1.5 px-3 rounded flex items-center justify-center gap-2 border text-xs font-medium transition-colors ${
              theme === 'light'
                ? 'bg-sky-500/15 border-sky-500 text-sky-600 dark:text-sky-400'
                : 'bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-200'
            }`}
          >
            <span>Light Theme</span>
          </button>
        </div>
      </div>

      <label className="flex items-center justify-between cursor-pointer text-gray-800 dark:text-neutral-300 pt-1">
        <span className="text-[11.5px]">Show Bookmarks bar (Ctrl+Shift+B)</span>
        <input
          type="checkbox"
          checked={showBookmarksBar}
          onChange={(e) => setShowBookmarksBar(e.target.checked)}
          className="accent-sky-500 rounded"
        />
      </label>

      <label className="flex items-center justify-between cursor-pointer text-gray-800 dark:text-neutral-300 pt-1">
        <span className="text-[11.5px]">Show Developer Sidebar (VS Code style activity bar)</span>
        <input
          type="checkbox"
          checked={showDeveloperSidebar}
          onChange={(e) => setShowDeveloperSidebar(e.target.checked)}
          className="accent-sky-500 rounded"
        />
      </label>

      <label className="flex items-center justify-between cursor-pointer text-gray-800 dark:text-neutral-300 pt-1">
        <span className="text-[11.5px]">Show bottom status bar</span>
        <input
          type="checkbox"
          checked={showStatusBar}
          onChange={(e) => setShowStatusBar(e.target.checked)}
          className="accent-sky-500 rounded"
        />
      </label>
    </div>
  );
};
