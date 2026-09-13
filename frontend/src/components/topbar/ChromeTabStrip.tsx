import React from 'react';
import { VscAdd, VscClose, VscGlobe } from 'react-icons/vsc';
import { useTabStore } from '../../stores/useTabStore';
import { WindowControls } from '../window/WindowControls';
import { getPanelIcon } from '../panels/PanelRenderer';

export const ChromeTabStrip: React.FC = () => {
  const { tabs, activeTabId, activateTab, closeTab, createTab } = useTabStore();

  return (
    <header
      className="h-[38px] bg-gray-200/90 dark:bg-neutral-950 flex items-center justify-between pl-2 pr-0 select-none flex-shrink-0 app-drag border-b border-gray-300/60 dark:border-neutral-800"
      style={{ WebkitAppRegion: 'drag' } as any}
    >
      {/* Tabs and New Tab Button Container */}
      <div
        className="flex items-end h-full pt-1.5 gap-0.5 max-w-[calc(100%-140px)] overflow-x-auto no-scrollbar app-drag"
        style={{ WebkitAppRegion: 'drag' } as any}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const isInternal = tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome://'));

          return (
            <div
              key={tab.id}
              onClick={() => activateTab(tab.id)}
              className={`group relative flex items-center gap-2 h-[32px] max-w-[220px] min-w-[130px] px-3 rounded-t-lg text-xs cursor-pointer select-none transition-all app-no-drag ${
                isActive
                  ? 'bg-white dark:bg-neutral-900 text-gray-900 dark:text-neutral-100 font-medium shadow-sm z-10'
                  : 'text-gray-600 dark:text-neutral-400 hover:bg-gray-300/50 dark:hover:bg-neutral-800/60 hover:text-gray-900 dark:hover:text-neutral-200'
              }`}
              style={{ WebkitAppRegion: 'no-drag' } as any}
              title={tab.title || (tab.url ? tab.url : 'New Tab')}
            >
              {/* Tab Icon / Favicon */}
              <div className="w-4 h-4 flex items-center justify-center flex-shrink-0 text-gray-500 dark:text-neutral-400">
                {tab.isLoading ? (
                  <div className="w-3.5 h-3.5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                ) : tab.favicon ? (
                  <img src={tab.favicon} alt="" className="w-3.5 h-3.5 object-contain" />
                ) : isInternal ? (
                  getPanelIcon(tab.url, 13)
                ) : (
                  <VscGlobe size={13} />
                )}
              </div>

              {/* Tab Title */}
              <span className="truncate flex-1 text-[11.5px] leading-tight pointer-events-none">
                {tab.title || (isInternal ? 'Internal Page' : 'New Tab')}
              </span>

              {/* Close Tab Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
                className={`w-4 h-4 rounded-full flex items-center justify-center text-gray-400 dark:text-neutral-500 hover:text-gray-900 dark:hover:text-neutral-100 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors app-no-drag ${
                  isActive ? 'opacity-70 hover:opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
                style={{ WebkitAppRegion: 'no-drag' } as any}
                title="Close tab (Ctrl+W)"
              >
                <VscClose size={12} />
              </button>

              {/* Divider between inactive tabs */}
              {!isActive && (
                <span className="absolute right-0 top-2 bottom-2 w-[1px] bg-gray-300/70 dark:bg-neutral-800 group-hover:hidden pointer-events-none" />
              )}
            </div>
          );
        })}

        {/* New Tab Button */}
        <button
          onClick={() => createTab()}
          title="New tab (Ctrl+T)"
          className="w-7 h-7 mb-0.5 rounded-full flex items-center justify-center text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-100 hover:bg-gray-300/70 dark:hover:bg-neutral-800 transition-colors flex-shrink-0 app-no-drag"
          style={{ WebkitAppRegion: 'no-drag' } as any}
        >
          <VscAdd size={15} />
        </button>
      </div>

      {/* Draggable Titlebar Spacer */}
      <div
        className="flex-1 h-full min-w-[20px] app-drag cursor-default"
        style={{ WebkitAppRegion: 'drag' } as any}
      />

      {/* Window Controls */}
      <div className="flex-none app-no-drag" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <WindowControls />
      </div>
    </header>
  );
};
