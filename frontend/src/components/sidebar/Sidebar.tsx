import React, { useState } from 'react';
import {
  VscBookmark,
  VscHistory,
  VscCloudDownload,
  VscFolderOpened,
  VscPulse,
  VscDatabase,
  VscTerminal,
  VscBook,
  VscSearch,
  VscCode,
  VscSettingsGear,
  VscDashboard,
  VscMenu,
  VscPlay,
} from 'react-icons/vsc';
import { usePanelStore, type PanelType } from '../../stores/usePanelStore';

interface NavItem {
  id: PanelType;
  label: string;
  icon: React.ReactNode;
}

const SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: 'HISTORY & DOWNLOADS',
    items: [
      { id: 'bookmarks', label: 'Bookmarks', icon: <VscBookmark size={14} /> },
      { id: 'history', label: 'History', icon: <VscHistory size={14} /> },
      { id: 'downloads', label: 'Downloads', icon: <VscCloudDownload size={14} /> },
    ],
  },
  {
    title: 'TOOLS',
    items: [
      { id: 'explorer', label: 'Explorer', icon: <VscFolderOpened size={14} /> },
      { id: 'interceptor', label: 'API Inspector', icon: <VscPulse size={14} /> },
      { id: 'cookies', label: 'Cookie Jar', icon: <VscDatabase size={14} /> },
      { id: 'console', label: 'Console', icon: <VscTerminal size={14} /> },
    ],
  },
  {
    title: 'AUTOMATION',
    items: [
      { id: 'notebook', label: 'Notebook', icon: <VscBook size={14} /> },
      { id: 'automation', label: 'Macros', icon: <VscPlay size={14} /> },
      { id: 'scraperBuilder', label: 'Scraper', icon: <VscSearch size={14} /> },
      { id: 'userscripts', label: 'Userscripts', icon: <VscCode size={14} /> },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { id: 'settings', label: 'Settings', icon: <VscSettingsGear size={14} /> },
      { id: 'memory', label: 'RAM Dashboard', icon: <VscDashboard size={14} /> },
    ],
  },
];

export const Sidebar: React.FC = () => {
  const { currentPanel, isOpen, togglePanel } = usePanelStore();
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    try {
      return localStorage.getItem('chrome_sidebar_expanded') === 'true';
    } catch {
      return false; // Collapsed bar mode by default
    }
  });

  const toggleExpanded = () => {
    setIsExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('chrome_sidebar_expanded', String(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  return (
    <aside
      className={`h-full bg-white dark:bg-neutral-900 border-r border-gray-200 dark:border-neutral-800 flex flex-col justify-between select-none flex-shrink-0 transition-all duration-200 overflow-hidden ${
        isExpanded ? 'w-[172px]' : 'w-[38px]'
      }`}
    >
      <div className="flex-1 min-h-0 flex flex-col overflow-y-auto overflow-x-hidden no-scrollbar">
        {/* Compact Toggle Header */}
        <div
          className={`h-[28px] min-h-[28px] flex items-center border-b border-gray-200 dark:border-neutral-800/80 ${
            isExpanded ? 'px-2.5 justify-between' : 'justify-center'
          }`}
        >
          {isExpanded && (
            <span className="text-[10px] font-bold text-gray-500 dark:text-neutral-400 tracking-wider uppercase">
              Navigator
            </span>
          )}
          <button
            onClick={toggleExpanded}
            title={isExpanded ? 'Collapse to Activity Bar' : 'Expand Sidebar'}
            className="w-6 h-6 rounded flex items-center justify-center text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-100 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <VscMenu size={14} />
          </button>
        </div>

        {/* Navigation Sections with tight, compact spacing */}
        <div className={`flex flex-col py-1 ${isExpanded ? 'gap-1.5 px-1.5' : 'gap-0.5 items-center'}`}>
          {SECTIONS.map((section, sIdx) => (
            <div key={section.title} className={`flex flex-col w-full ${isExpanded ? 'gap-0.5' : 'items-center'}`}>
              {isExpanded ? (
                <span className="text-[9px] font-bold text-gray-400 dark:text-neutral-500 tracking-wider px-1.5 pt-1 pb-0.5 uppercase">
                  {section.title}
                </span>
              ) : sIdx > 0 ? (
                <div className="w-5 h-[1px] bg-gray-200 dark:bg-neutral-800 my-0.5" />
              ) : null}

              {section.items.map((item) => {
                const isActive = isOpen && currentPanel === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => togglePanel(item.id)}
                    title={item.label}
                    className={`relative flex items-center rounded transition-colors ${
                      isExpanded
                        ? `w-full gap-2 px-2 py-1 text-[11px] text-left ${
                            isActive
                              ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 font-medium'
                              : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-800/60'
                          }`
                        : `w-7 h-7 justify-center my-[1px] ${
                            isActive
                              ? 'text-sky-600 dark:text-sky-400 bg-sky-500/15 dark:bg-neutral-800/80'
                              : 'text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-800/50'
                          }`
                    }`}
                  >
                    {/* Active indicator bar on left for collapsed mode */}
                    {!isExpanded && isActive && (
                      <span className="absolute left-0 top-1 bottom-1 w-[2px] bg-sky-500 rounded-r" />
                    )}
                    <span className="flex items-center justify-center flex-shrink-0">{item.icon}</span>
                    {isExpanded && <span className="text-[11px] truncate leading-tight">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Compact Profile Footer */}
      <div
        className={`h-[30px] min-h-[30px] border-t border-gray-200 dark:border-neutral-800/80 flex items-center ${
          isExpanded ? 'px-2.5 gap-2' : 'justify-center'
        }`}
      >
        <div
          title="Default Profile"
          className="w-5 h-5 rounded-full bg-sky-600 flex items-center justify-center text-[10px] text-white font-bold flex-shrink-0 cursor-pointer"
        >
          D
        </div>
        {isExpanded && (
          <span className="text-[11px] text-gray-700 dark:text-neutral-300 font-medium truncate leading-none">
            Default Profile
          </span>
        )}
      </div>
    </aside>
  );
};
