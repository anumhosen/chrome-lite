import React, { useState } from 'react';
import { VscInfo, VscCheck, VscSync, VscBook, VscGithub } from 'react-icons/vsc';
import { ChromeSettingsCard, ChromeSettingsRow } from './ChromeSettingsCard';
import { useTabStore } from '../../../stores/useTabStore';

export const AboutSettings: React.FC = () => {
  const { createTab } = useTabStore();
  const [isChecking, setIsChecking] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<string>('Chrome Lite is up to date');

  const handleCheckUpdate = () => {
    setIsChecking(true);
    setUpdateStatus('Checking for updates...');
    setTimeout(() => {
      setIsChecking(false);
      setUpdateStatus('Chrome Lite is up to date (v0.2.0)');
    }, 1200);
  };

  const handleOpenDocs = () => {
    createTab('https://github.com/anumhosen/chrome-lite');
  };

  return (
    <ChromeSettingsCard
      id="section-about"
      title="About Chrome Lite"
      icon={<VscInfo />}
      description="Version information, updates, and open-source licenses."
    >
      {/* Chrome Lite Header & Version */}
      <div className="flex items-center gap-4 p-4 bg-gray-50/70 dark:bg-neutral-850/50">
        <img
          src="./icon.png"
          alt="Chrome Lite"
          className="w-12 h-12 object-contain rounded-xl shadow-xs"
          onError={(e) => {
            if (!e.currentTarget.src.endsWith('/icon.png')) {
              e.currentTarget.src = '/icon.png';
            }
          }}
        />
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-neutral-100 text-sm">
              Chrome Lite
            </h3>
            <span className="text-[10px] bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 font-mono font-medium px-1.5 py-0.5 rounded">
              v0.2.0
            </span>
          </div>
          <p className="text-[11.5px] text-gray-500 dark:text-neutral-400 mt-0.5">
            Electron 30 &bull; Chromium 124 &bull; React 19 &bull; Windows (x64)
          </p>
        </div>
      </div>

      {/* Check for Updates */}
      <ChromeSettingsRow
        icon={
          isChecking ? (
            <VscSync className="animate-spin text-sky-500" />
          ) : (
            <VscCheck className="text-emerald-500" />
          )
        }
        label={updateStatus}
        description="Version 0.2.0 (Official Developer Build)"
        control={
          <button
            onClick={handleCheckUpdate}
            disabled={isChecking}
            className="flex items-center gap-1 px-3 py-1 rounded-lg border border-gray-300 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-750 font-medium text-xs transition-colors disabled:opacity-50"
          >
            <VscSync size={12} className={isChecking ? 'animate-spin' : ''} />
            <span>Check for update</span>
          </button>
        }
      />

      {/* Documentation & Guides */}
      <ChromeSettingsRow
        icon={<VscBook />}
        label="Documentation & User Guides"
        description="Explore tutorials on Dev Notebook, Userscripts, Network Mocking, and Scrapers."
        control={
          <button
            onClick={handleOpenDocs}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-gray-300 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-750 font-medium text-xs transition-colors"
          >
            <VscBook size={13} />
            <span>Open Guides</span>
          </button>
        }
      />

      {/* GitHub Repository */}
      <ChromeSettingsRow
        icon={<VscGithub />}
        label="Open Source Repository"
        description="Licensed under the MIT License. Copyright © 2026 Anum Hosen."
        control={
          <button
            onClick={() => createTab('https://github.com/anumhosen/chrome-lite')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-gray-300 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-750 font-medium text-xs transition-colors"
          >
            <VscGithub size={13} />
            <span>GitHub</span>
          </button>
        }
      />
    </ChromeSettingsCard>
  );
};
