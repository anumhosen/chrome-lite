import React from 'react';
import { VscShield, VscPulse, VscHistory, VscTrash } from 'react-icons/vsc';
import { chromeApi } from '../../../services/chromeApi';

interface PrivacySettingsProps {
  features: Record<string, boolean>;
  onToggleFeature: (name: string, enabled: boolean) => Promise<void>;
}

export const PrivacySettings: React.FC<PrivacySettingsProps> = ({
  features,
  onToggleFeature,
}) => {
  const clearCache = async () => {
    await chromeApi.history.clearCache();
    alert('Browser cache cleared.');
  };

  const clearStorage = async () => {
    await chromeApi.history.clearStorage();
    alert('Cookies & storage cleared.');
  };

  const clearHistory = async () => {
    if (confirm('Clear all browsing history permanently?')) {
      await chromeApi.history.clear();
      alert('Browsing history wiped.');
    }
  };

  return (
    <>
      {/* Subsystems & Privacy */}
      <div className="p-3 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-md flex flex-col gap-2.5">
        <span className="font-semibold text-gray-700 dark:text-neutral-300 uppercase tracking-wider text-[10.5px]">
          Subsystems & Privacy
        </span>

        <label className="flex items-center justify-between cursor-pointer text-gray-800 dark:text-neutral-300">
          <div className="flex items-center gap-2">
            <VscShield size={14} className="text-emerald-500 dark:text-emerald-400" />
            <span>Ad & Telemetry Blocker</span>
          </div>
          <input
            type="checkbox"
            checked={features.blocker !== false}
            onChange={(e) => onToggleFeature('blocker', e.target.checked)}
            className="accent-sky-500 rounded"
          />
        </label>

        <label className="flex items-center justify-between cursor-pointer text-gray-800 dark:text-neutral-300">
          <div className="flex items-center gap-2">
            <VscPulse size={14} className="text-sky-500 dark:text-sky-400" />
            <span>API & Network Interceptor</span>
          </div>
          <input
            type="checkbox"
            checked={features.interceptor !== false}
            onChange={(e) => onToggleFeature('interceptor', e.target.checked)}
            className="accent-sky-500 rounded"
          />
        </label>

        <label className="flex items-center justify-between cursor-pointer text-gray-800 dark:text-neutral-300">
          <div className="flex items-center gap-2">
            <VscHistory size={14} className="text-amber-500 dark:text-amber-400" />
            <span>SQLite History Recording</span>
          </div>
          <input
            type="checkbox"
            checked={features.history !== false}
            onChange={(e) => onToggleFeature('history', e.target.checked)}
            className="accent-sky-500 rounded"
          />
        </label>
      </div>

      {/* Maintenance */}
      <div className="p-3 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-md flex flex-col gap-2">
        <span className="font-semibold text-gray-700 dark:text-neutral-300 uppercase tracking-wider text-[10.5px]">
          Data & Maintenance
        </span>
        <button
          onClick={clearCache}
          className="flex items-center gap-2 px-3 py-1.5 rounded bg-white dark:bg-neutral-900 hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-800 dark:text-neutral-300 border border-gray-200 dark:border-neutral-800 transition-colors"
        >
          <VscTrash size={13} className="text-amber-500 dark:text-amber-400" />
          <span>Purge Browser Cache</span>
        </button>
        <button
          onClick={clearStorage}
          className="flex items-center gap-2 px-3 py-1.5 rounded bg-white dark:bg-neutral-900 hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-800 dark:text-neutral-300 border border-gray-200 dark:border-neutral-800 transition-colors"
        >
          <VscTrash size={13} className="text-red-500 dark:text-red-400" />
          <span>Clear Cookies & Web Storage</span>
        </button>
        <button
          onClick={clearHistory}
          className="flex items-center gap-2 px-3 py-1.5 rounded bg-white dark:bg-neutral-900 hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-800 dark:text-neutral-300 border border-gray-200 dark:border-neutral-800 transition-colors"
        >
          <VscTrash size={13} className="text-rose-500" />
          <span>Wipe All Browsing History</span>
        </button>
      </div>
    </>
  );
};
