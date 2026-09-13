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
      { id: 'bookmarks', label: 'Bookmarks', icon: <VscBookmark size={15} /> },
      { id: 'history', label: 'History', icon: <VscHistory size={15} /> },
      { id: 'downloads', label: 'Downloads', icon: <VscCloudDownload size={15} /> },
    ],
  },
  {
    title: 'TOOLS',
    items: [
      { id: 'explorer', label: 'Explorer', icon: <VscFolderOpened size={15} /> },
      { id: 'interceptor', label: 'API Inspector', icon: <VscPulse size={15} /> },
      { id: 'cookies', label: 'Cookie Jar', icon: <VscDatabase size={15} /> },
      { id: 'console', label: 'Console', icon: <VscTerminal size={15} /> },
    ],
  },
  {
    title: 'AUTOMATION',
    items: [
      { id: 'notebook', label: 'Notebook', icon: <VscBook size={15} /> },
      { id: 'automation', label: 'Macros', icon: <VscPlay size={15} /> },
      { id: 'scraperBuilder', label: 'Scraper', icon: <VscSearch size={15} /> },
      { id: 'userscripts', label: 'Userscripts', icon: <VscCode size={15} /> },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { id: 'settings', label: 'Settings', icon: <VscSettingsGear size={15} /> },
      { id: 'memory', label: 'RAM Dashboard', icon: <VscDashboard size={15} /> },
    ],
  },
];

export const Sidebar: React.FC = () => {
  const { currentPanel, isOpen, togglePanel } = usePanelStore();
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    try {
      return localStorage.getItem('chrome_sidebar_expanded') === 'true';
    } catch {
      return false; // Bar mode by default
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
      className={`bg-white dark:bg-neutral-900 border-r border-gray-200 dark:border-neutral-800 flex flex-col justify-between select-none flex-shrink-0 transition-all duration-200 ${isExpanded ? 'w-[190px]' : 'w-[42px]'
        }`}
    >
      <div className="flex flex-col overflow-y-auto">
        {/* Toggle Header (VS Code Activity Bar Top) */}
        <div className={`h-[32px] flex items-center border-b border-gray-200 dark:border-neutral-800/80 ${isExpanded ? 'px-3 justify-between' : 'justify-center'}`}>
          {isExpanded && <span className="text-[11px] font-bold text-gray-500 dark:text-neutral-400 tracking-wider">NAVIGATOR</span>}
          <button
            onClick={toggleExpanded}
            title={isExpanded ? 'Collapse to Activity Bar' : 'Expand Sidebar'}
            className="w-7 h-7 rounded flex items-center justify-center text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-100 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <VscMenu size={16} />
          </button>
        </div>

        {/* Navigation Sections */}
        <div className={`flex flex-col py-2 ${isExpanded ? 'gap-3 px-2' : 'gap-1 items-center'}`}>
          {SECTIONS.map((section, sIdx) => (
            <div key={section.title} className={`flex flex-col w-full ${isExpanded ? 'gap-0.5' : 'items-center'}`}>
              {isExpanded ? (
                <span className="text-[9.5px] font-bold text-gray-400 dark:text-neutral-500 tracking-wider px-2 py-1 uppercase">
                  {section.title}
                </span>
              ) : sIdx > 0 ? (
                <div className="w-6 h-[1px] bg-gray-200 dark:bg-neutral-800 my-1" />
              ) : null}

              {section.items.map((item) => {
                const isActive = isOpen && currentPanel === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => togglePanel(item.id)}
                    title={item.label}
                    className={`relative flex items-center rounded transition-colors ${isExpanded
                        ? `w-full gap-2 px-2.5 py-1.5 text-xs text-left ${isActive
                          ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 font-medium'
                          : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-800/60'
                        }`
                        : `w-9 h-9 justify-center my-0.5 ${isActive
                          ? 'text-sky-600 dark:text-sky-400 bg-gray-100 dark:bg-neutral-800/80'
                          : 'text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-800/50'
                        }`
                      }`}
                  >
                    {/* VS Code active indicator bar on left */}
                    {!isExpanded && isActive && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-[2.5px] bg-sky-500 rounded-r" />
                    )}
                    <span className="flex items-center justify-center flex-shrink-0">{item.icon}</span>
                    {isExpanded && <span className="text-[11.5px] truncate">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Profile Footer */}
      <div className={`py-2 border-t border-gray-200 dark:border-neutral-800/80 flex items-center ${isExpanded ? 'px-3 gap-2' : 'justify-center'}`}>
        <div
          title="Default Profile"
          className="w-6 h-6 rounded-full bg-sky-600 flex items-center justify-center text-[11px] text-white font-bold flex-shrink-0 cursor-pointer"
        >
          D
        </div>
        {isExpanded && <span className="text-xs text-gray-700 dark:text-neutral-300 font-medium truncate">Default Profile</span>}
      </div>
    </aside>
  );
};
