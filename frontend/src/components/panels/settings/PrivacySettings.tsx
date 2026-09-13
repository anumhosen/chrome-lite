import React from 'react';
import { VscShield, VscTrash, VscDatabase, VscLinkExternal } from 'react-icons/vsc';
import { ChromeSettingsCard, ChromeSettingsRow } from './ChromeSettingsCard';
import { ChromeToggle } from './ChromeToggle';
import { chromeApi } from '../../../services/chromeApi';
import { useTabStore } from '../../../stores/useTabStore';

interface PrivacySettingsProps {
  features: Record<string, boolean>;
  onToggleFeature: (name: string, enabled: boolean) => Promise<void> | void;
  onNotify?: (msg: string) => void;
}

export const PrivacySettings: React.FC<PrivacySettingsProps> = ({
  features,
  onToggleFeature,
  onNotify,
}) => {
  const { createTab } = useTabStore();

  const clearCache = async () => {
    try {
      await chromeApi.history.clearCache();
      onNotify?.('Browser cache purged successfully');
    } catch {}
  };

  const clearStorage = async () => {
    try {
      await chromeApi.history.clearStorage();
      onNotify?.('Cookies and web storage cleared');
    } catch {}
  };

  const clearHistory = async () => {
    if (confirm('Clear all browsing history permanently?')) {
      try {
        await chromeApi.history.clear();
        onNotify?.('Browsing history wiped');
      } catch {}
    }
  };

  return (
    <ChromeSettingsCard
      id="section-privacy"
      title="Privacy and security"
      icon={<VscShield />}
      description="Manage Chrome Shield protection, site tracking blockers, and browsing data."
    >
      {/* Chrome Shield Ad & Tracker Blocker */}
      <ChromeSettingsRow
        icon={<VscShield className="text-emerald-500" />}
        label="Chrome Shield (Ad & Tracker Blocker)"
        description="Blocks advertising networks, telemetry trackers, and cryptominers natively before requests leave your browser."
        control={
          <ChromeToggle
            checked={features.blocker !== false}
            onChange={(c) => {
              onToggleFeature('blocker', c);
              onNotify?.(`Chrome Shield ${c ? 'enabled' : 'disabled'}`);
            }}
            title="Toggle Chrome Shield"
          />
        }
      />

      {/* SQLite History Recording */}
      <ChromeSettingsRow
        icon={<VscDatabase className="text-amber-500" />}
        label="History & Visit Logging"
        description="Records page visits and timestamps locally in your encrypted SQLite database."
        control={
          <ChromeToggle
            checked={features.history !== false}
            onChange={(c) => {
              onToggleFeature('history', c);
              onNotify?.(`History recording ${c ? 'enabled' : 'disabled'}`);
            }}
            title="Toggle History Recording"
          />
        }
      />

      {/* Cookie Jar Link */}
      <ChromeSettingsRow
        label="Cookie Jar & Site Permissions"
        description="Inspect, search, and purge cookies on a per-domain basis."
        control={
          <button
            onClick={() => createTab('chrome://cookies')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-gray-300 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-750 font-medium text-xs transition-colors"
          >
            <VscLinkExternal size={13} />
            <span>Manage Cookies</span>
          </button>
        }
      />

      {/* Clear Browsing Data Group */}
      <div className="p-4 flex flex-col gap-3 bg-gray-50/50 dark:bg-neutral-850/30">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-medium text-gray-900 dark:text-neutral-200 text-xs">
              Clear browsing data
            </span>
            <span className="text-[11.5px] text-gray-500 dark:text-neutral-400">
              Clear your history, cookies, and cached images and files.
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={clearCache}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 font-medium text-xs transition-colors shadow-xs"
          >
            <VscTrash size={13} className="text-amber-500" />
            <span>Clear Cache</span>
          </button>

          <button
            onClick={clearStorage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 font-medium text-xs transition-colors shadow-xs"
          >
            <VscTrash size={13} className="text-red-500" />
            <span>Clear Cookies & Storage</span>
          </button>

          <button
            onClick={clearHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 font-medium text-xs transition-colors shadow-xs"
          >
            <VscTrash size={13} className="text-rose-600 dark:text-rose-400" />
            <span>Wipe Browsing History</span>
          </button>
        </div>
      </div>
    </ChromeSettingsCard>
  );
};
