import React, { useState, useEffect } from 'react';
import { VscShield, VscClose } from 'react-icons/vsc';
import { useTabStore } from '../../../stores/useTabStore';
import { useExtensionStore } from '../../../stores/useExtensionStore';

export const ShieldPopup: React.FC = () => {
  const { tabs, activeTabId, blockedCount } = useTabStore();
  const { closePopup } = useExtensionStore();
  const [isEnabled, setIsEnabled] = useState(true);

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const activeUrl = activeTab?.url || '';

  let hostname = 'Current Page';
  try {
    if (activeUrl && !activeUrl.startsWith('chrome://') && !activeUrl.startsWith('about:')) {
      hostname = new URL(activeUrl).hostname;
    } else if (activeUrl.startsWith('chrome://')) {
      hostname = 'Chrome Lite Internal';
    }
  } catch { }

  useEffect(() => {
    if (window.chrome?.blocker?.getStats) {
      window.chrome.blocker.getStats().then((stats: any) => {
        if (stats && stats.enabled !== undefined) {
          setIsEnabled(stats.enabled);
        }
      }).catch(() => { });
    }
  }, []);

  const handleToggle = async () => {
    const next = !isEnabled;
    setIsEnabled(next);
    if (window.chrome?.blocker?.toggle) {
      await window.chrome.blocker.toggle(next);
    }
  };

  return (
    <div className="w-[280px] bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-gray-200 dark:border-neutral-800 p-4 select-none text-xs text-gray-800 dark:text-neutral-200 z-50">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <VscShield size={16} />
          </div>
          <span className="font-semibold text-sm text-gray-900 dark:text-neutral-100">Chrome Shield</span>
        </div>
        <button
          onClick={closePopup}
          className="w-5 h-5 rounded hover:bg-gray-100 dark:hover:bg-neutral-800 flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-neutral-200 transition-colors"
        >
          <VscClose size={14} />
        </button>
      </div>

      {/* Target Domain Info */}
      <div className="py-3">
        <div className="text-[11px] text-gray-500 dark:text-neutral-400 mb-0.5">Protection status for:</div>
        <div className="font-medium text-gray-800 dark:text-neutral-200 truncate" title={hostname}>
          {hostname}
        </div>
      </div>

      {/* Main Toggle Banner */}
      <div className="p-3 rounded-lg bg-gray-50 dark:bg-neutral-950 border border-gray-200/80 dark:border-neutral-800/80 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="font-medium text-xs">Shield Protection</span>
          <span className="text-[10.5px] text-gray-500 dark:text-neutral-400">
            {isEnabled ? 'Blocking trackers & ads' : 'Protection paused'}
          </span>
        </div>
        <button
          onClick={handleToggle}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            isEnabled ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-neutral-700'
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
              isEnabled ? 'translate-x-4.5' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Blocked stats */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-center">
        <div className="p-2 rounded-lg bg-gray-50 dark:bg-neutral-950 border border-gray-200/80 dark:border-neutral-800/80">
          <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">{blockedCount}</div>
          <div className="text-[10px] text-gray-500 dark:text-neutral-400">Ads & Trackers Blocked</div>
        </div>
        <div className="p-2 rounded-lg bg-gray-50 dark:bg-neutral-950 border border-gray-200/80 dark:border-neutral-800/80">
          <div className="text-base font-bold text-sky-600 dark:text-sky-400">
            {isEnabled ? 'ACTIVE' : 'OFF'}
          </div>
          <div className="text-[10px] text-gray-500 dark:text-neutral-400">Filter Engine</div>
        </div>
      </div>
    </div>
  );
};
