import React from 'react';
import { VscLink, VscRefresh, VscLinkExternal } from 'react-icons/vsc';
import { useTabStore } from '../../stores/useTabStore';
import { useTabBindingStore } from '../../stores/useTabBindingStore';

interface TabBindingBarProps {
  className?: string;
  onTabChange?: (tabId: string) => void;
}

export const TabBindingBar: React.FC<TabBindingBarProps> = ({ className = '', onTabChange }) => {
  const { createTab, activateTab } = useTabStore();
  const { boundTabId, setBoundTabId, getBoundTab, getAvailableWebTabs } = useTabBindingStore();

  const webTabs = getAvailableWebTabs();
  const boundTab = getBoundTab();
  const effectiveTabId = boundTab?.id || boundTabId || '';

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val) {
      setBoundTabId(val);
      if (onTabChange) onTabChange(val);
    }
  };

  const handleFocusTab = () => {
    if (effectiveTabId) {
      activateTab(effectiveTabId);
    }
  };

  const handleReloadTab = () => {
    if (effectiveTabId && window.chrome?.tabs?.reload) {
      window.chrome.tabs.reload(effectiveTabId);
    }
  };

  const getDomain = (url?: string) => {
    if (!url) return '';
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  return (
    <div
      className={`h-[28px] min-h-[28px] bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded px-2 flex items-center justify-between gap-2 text-xs select-none ${className}`}
    >
      {/* Left: Link Icon & Tab Selector */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <div className="text-sky-600 dark:text-sky-400 flex-shrink-0 flex items-center">
          <VscLink size={13} />
        </div>
        <span className="text-[10.5px] font-semibold text-gray-500 dark:text-neutral-400 flex-shrink-0 uppercase tracking-wider">
          Target Tab:
        </span>

        {webTabs.length > 0 ? (
          <select
            value={effectiveTabId}
            onChange={handleSelect}
            className="flex-1 min-w-0 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded px-1.5 py-0.5 text-xs text-gray-800 dark:text-neutral-200 outline-none hover:border-sky-500 focus:border-sky-500 truncate cursor-pointer transition-colors"
          >
            {webTabs.map((tab) => (
              <option key={tab.id} value={tab.id}>
                {tab.title || getDomain(tab.url) || 'Untitled Tab'} ({getDomain(tab.url)})
              </option>
            ))}
          </select>
        ) : (
          <div className="flex items-center gap-2 flex-1">
            <span className="text-amber-600 dark:text-amber-400 text-[11px] italic">No active web pages</span>
            <button
              onClick={() => createTab('chrome://newtab')}
              className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20 font-medium"
            >
              + Open Web Page
            </button>
          </div>
        )}
      </div>

      {/* Right: Status Indicator & Quick Actions */}
      {boundTab && (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Bound</span>
          </div>

          <button
            onClick={handleReloadTab}
            title="Reload target page"
            className="w-5 h-5 rounded flex items-center justify-center text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-neutral-800 transition-colors"
          >
            <VscRefresh size={11} />
          </button>

          <button
            onClick={handleFocusTab}
            title="Focus this tab in main window"
            className="w-5 h-5 rounded flex items-center justify-center text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-neutral-800 transition-colors"
          >
            <VscLinkExternal size={11} />
          </button>
        </div>
      )}
    </div>
  );
};
