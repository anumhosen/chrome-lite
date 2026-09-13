import React from 'react';
import {
  VscBook,
  VscPulse,
  VscSearch,
  VscPlay,
  VscDatabase,
  VscFolderOpened,
  VscCode,
  VscDashboard,
  VscHistory,
  VscCloudDownload,
  VscBookmark,
  VscExtensions,
  VscSettingsGear,
} from 'react-icons/vsc';
import { useTabStore } from '../../stores/useTabStore';

interface AppItem {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
}

const APPS: AppItem[] = [
  {
    id: 'notebook',
    name: 'Dev Notebook',
    category: 'Developer Tools',
    description: 'Code scratchpad with live JavaScript execution against web pages.',
    icon: <VscBook size={24} />,
    iconBg: 'bg-teal-500/15 text-teal-600 dark:text-teal-400',
  },
  {
    id: 'interceptor',
    name: 'API Inspector',
    category: 'Developer Tools',
    description: 'Intercept, replay, and mock HTTP requests with live OpenAPI export.',
    icon: <VscPulse size={24} />,
    iconBg: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
  },
  {
    id: 'scraper',
    name: 'Web Scraper Builder',
    category: 'Automation',
    description: 'Extract tables, articles, and paginated content from any website.',
    icon: <VscSearch size={24} />,
    iconBg: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
  },
  {
    id: 'automation',
    name: 'Macro Automation',
    category: 'Automation',
    description: 'Record user interactions and schedule headless automated tasks.',
    icon: <VscPlay size={24} />,
    iconBg: 'bg-pink-500/15 text-pink-600 dark:text-pink-400',
  },
  {
    id: 'cookies',
    name: 'Cookie Jar',
    category: 'Tools',
    description: 'Inspect, modify, and delete cookies across all domains.',
    icon: <VscDatabase size={24} />,
    iconBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  },
  {
    id: 'explorer',
    name: 'Resource Explorer',
    category: 'Tools',
    description: 'Discover and batch-download images, media, and stylesheets.',
    icon: <VscFolderOpened size={24} />,
    iconBg: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
  },
  {
    id: 'userscripts',
    name: 'Userscripts',
    category: 'Extensions',
    description: 'Run custom Tampermonkey-compatible scripts and CSS injections.',
    icon: <VscCode size={24} />,
    iconBg: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
  },
  {
    id: 'system',
    name: 'Task Manager (RAM)',
    category: 'System',
    description: 'Monitor memory and CPU consumption across browser tabs.',
    icon: <VscDashboard size={24} />,
    iconBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  },
  {
    id: 'history',
    name: 'History',
    category: 'Browser',
    description: 'Search and manage your browsing history.',
    icon: <VscHistory size={24} />,
    iconBg: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  },
  {
    id: 'downloads',
    name: 'Downloads',
    category: 'Browser',
    description: 'View and manage active and finished file downloads.',
    icon: <VscCloudDownload size={24} />,
    iconBg: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400',
  },
  {
    id: 'bookmarks',
    name: 'Bookmarks',
    category: 'Browser',
    description: 'Organize and search your saved bookmarks.',
    icon: <VscBookmark size={24} />,
    iconBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  },
  {
    id: 'extensions',
    name: 'Extensions',
    category: 'System',
    description: 'Configure and manage Chrome Lite extensions.',
    icon: <VscExtensions size={24} />,
    iconBg: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
  },
  {
    id: 'settings',
    name: 'Settings',
    category: 'System',
    description: 'Preferences, search engine, appearance, and privacy.',
    icon: <VscSettingsGear size={24} />,
    iconBg: 'bg-gray-500/15 text-gray-600 dark:text-gray-400',
  },
];

export const AppsPage: React.FC = () => {
  const { createTab } = useTabStore();

  const handleLaunch = (id: string) => {
    createTab(`chrome://${id}`);
  };

  return (
    <div className="w-full h-full min-h-screen bg-gray-50 dark:bg-neutral-900 text-gray-900 dark:text-neutral-100 flex flex-col select-none overflow-y-auto p-8">
      <div className="max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="mb-8 pb-4 border-b border-gray-200 dark:border-neutral-800">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-neutral-100 mb-1">
            Chrome Lite Apps
          </h1>
          <p className="text-xs text-gray-500 dark:text-neutral-400">
            Internal applications and developer modules running within the browser.
          </p>
        </div>

        {/* Apps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {APPS.map((app) => (
            <button
              key={app.id}
              onClick={() => handleLaunch(app.id)}
              className="bg-white dark:bg-neutral-950 rounded-2xl border border-gray-200 dark:border-neutral-800 p-5 shadow-sm hover:shadow-md hover:border-sky-500/70 transition-all text-left flex flex-col justify-between group"
            >
              <div>
                <div
                  className={`w-12 h-12 rounded-xl ${app.iconBg} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}
                >
                  {app.icon}
                </div>
                <div className="text-[10.5px] font-semibold text-gray-400 dark:text-neutral-500 uppercase tracking-wider mb-1">
                  {app.category}
                </div>
                <h3 className="font-semibold text-sm text-gray-900 dark:text-neutral-100 mb-1.5 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                  {app.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-neutral-400 line-clamp-2">
                  {app.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-neutral-900 flex items-center justify-between">
                <span className="text-[11px] font-mono text-gray-400">chrome://{app.id}</span>
                <span className="text-xs font-semibold text-sky-600 dark:text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  Launch &rarr;
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
