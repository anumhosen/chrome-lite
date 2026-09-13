import React, { useState } from 'react';
import {
  VscSearch,
  VscAdd,
  VscBook,
  VscPulse,
  VscPlay,
  VscSearch as VscScraper,
  VscExtensions,
  VscSettingsGear,
} from 'react-icons/vsc';
import { useTabStore } from '../../stores/useTabStore';

interface Shortcut {
  title: string;
  url: string;
  iconBg: string;
  initial: string;
}

const DEFAULT_SHORTCUTS: Shortcut[] = [
  { title: 'Google', url: 'https://www.google.com', iconBg: 'bg-red-500', initial: 'G' },
  { title: 'YouTube', url: 'https://www.youtube.com', iconBg: 'bg-red-600', initial: 'Y' },
  { title: 'GitHub', url: 'https://github.com', iconBg: 'bg-neutral-800', initial: 'G' },
  { title: 'Reddit', url: 'https://www.reddit.com', iconBg: 'bg-orange-500', initial: 'R' },
  { title: 'Wikipedia', url: 'https://en.wikipedia.org', iconBg: 'bg-gray-600', initial: 'W' },
  { title: 'X (Twitter)', url: 'https://x.com', iconBg: 'bg-neutral-900', initial: 'X' },
];

export const NewTabPage: React.FC = () => {
  const { navigate, createTab } = useTabStore();
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(query.trim());
  };

  const handleOpenApp = (path: string) => {
    createTab(`chrome://${path}`);
  };

  return (
    <div className="w-full h-full min-h-screen bg-white dark:bg-neutral-900 flex flex-col items-center justify-center px-4 py-8 select-none text-gray-900 dark:text-neutral-100 overflow-y-auto">
      {/* Chrome Logo & Title */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative w-20 h-20 mb-4 flex items-center justify-center">
          {/* Chrome Tri-Color Ring Style */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-400 via-emerald-500 to-sky-500 p-1.5 shadow-md">
            <div className="w-full h-full rounded-full bg-white dark:bg-neutral-900 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center shadow-inner">
                <div className="w-4 h-4 rounded-full bg-white dark:bg-neutral-900" />
              </div>
            </div>
          </div>
        </div>
        <h1 className="text-3xl font-light tracking-tight text-gray-800 dark:text-neutral-100">
          Chrome <span className="font-semibold text-sky-500">Lite</span>
        </h1>
      </div>

      {/* Pill Search Input */}
      <form
        onSubmit={handleSearch}
        className="w-full max-w-xl h-11 px-4 rounded-full bg-gray-100/90 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 hover:shadow-md focus-within:shadow-lg focus-within:bg-white dark:focus-within:bg-neutral-950 focus-within:border-sky-500/80 transition-all flex items-center gap-3 mb-8"
      >
        <VscSearch size={17} className="text-gray-400 dark:text-neutral-500 flex-shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Google or type a URL"
          autoFocus
          className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 dark:text-neutral-100 placeholder-gray-400 dark:placeholder-neutral-500"
        />
      </form>

      {/* Quick Shortcuts Grid */}
      <div className="w-full max-w-xl grid grid-cols-4 sm:grid-cols-7 gap-3 mb-10">
        {DEFAULT_SHORTCUTS.map((s) => (
          <button
            key={s.title}
            onClick={() => navigate(s.url)}
            className="flex flex-col items-center gap-2 p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors group"
          >
            <div
              className={`w-11 h-11 rounded-full ${s.iconBg} text-white font-semibold text-sm flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}
            >
              {s.initial}
            </div>
            <span className="text-[11px] text-gray-700 dark:text-neutral-300 font-medium truncate max-w-[70px]">
              {s.title}
            </span>
          </button>
        ))}

        {/* Add shortcut tile */}
        <button
          onClick={() => {
            const url = prompt('Enter website URL (e.g. https://example.com):');
            if (url) navigate(url);
          }}
          className="flex flex-col items-center gap-2 p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors group"
        >
          <div className="w-11 h-11 rounded-full bg-gray-100 dark:bg-neutral-800 border border-dashed border-gray-300 dark:border-neutral-700 flex items-center justify-center text-gray-400 group-hover:text-gray-700 dark:group-hover:text-neutral-200 group-hover:scale-105 transition-transform">
            <VscAdd size={16} />
          </div>
          <span className="text-[11px] text-gray-500 dark:text-neutral-400">Add</span>
        </button>
      </div>

      {/* Built-in Developer Apps Bar */}
      <div className="w-full max-w-xl pt-6 border-t border-gray-200 dark:border-neutral-800 flex flex-col items-center">
        <span className="text-xs font-semibold text-gray-400 dark:text-neutral-500 uppercase tracking-wider mb-4">
          Built-in Developer Apps
        </span>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => handleOpenApp('notebook')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 hover:border-sky-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors text-xs font-medium"
          >
            <VscBook size={14} className="text-teal-500" />
            <span>Dev Notebook</span>
          </button>
          <button
            onClick={() => handleOpenApp('interceptor')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 hover:border-sky-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors text-xs font-medium"
          >
            <VscPulse size={14} className="text-sky-500" />
            <span>API Inspector</span>
          </button>
          <button
            onClick={() => handleOpenApp('scraper')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 hover:border-sky-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors text-xs font-medium"
          >
            <VscScraper size={14} className="text-indigo-500" />
            <span>Web Scraper</span>
          </button>
          <button
            onClick={() => handleOpenApp('automation')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 hover:border-sky-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors text-xs font-medium"
          >
            <VscPlay size={14} className="text-pink-500" />
            <span>Macro Automation</span>
          </button>
          <button
            onClick={() => handleOpenApp('extensions')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 hover:border-sky-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors text-xs font-medium"
          >
            <VscExtensions size={14} className="text-amber-500" />
            <span>Extensions</span>
          </button>
          <button
            onClick={() => handleOpenApp('settings')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 hover:border-sky-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors text-xs font-medium"
          >
            <VscSettingsGear size={14} className="text-gray-500" />
            <span>Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
