import React, { useEffect, useState } from 'react';
import { VscAccount, VscBriefcase, VscCheck, VscSync } from 'react-icons/vsc';
import { ChromeSettingsCard, ChromeSettingsRow } from './ChromeSettingsCard';
import { getChromeAPI } from '../../../lib/chrome';

export const ProfilesSettings: React.FC = () => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('default');

  useEffect(() => {
    const api = getChromeAPI() as any;
    if (api?.profiles?.getAll) {
      api.profiles.getAll().then((res: any) => {
        if (Array.isArray(res) && res.length > 0) setProfiles(res);
      }).catch(() => {});
    }
    if (api?.workspaces?.getAll) {
      api.workspaces.getAll().then((res: any) => {
        if (Array.isArray(res) && res.length > 0) {
          setWorkspaces(res);
          const active = res.find((w: any) => w.active || w.is_active);
          if (active) setActiveWorkspaceId(active.id);
        }
      }).catch(() => {});
    }
  }, []);

  const handleSwitchWorkspace = async (id: string) => {
    setActiveWorkspaceId(id);
    const api = getChromeAPI() as any;
    if (api?.workspaces?.switch) {
      try {
        await api.workspaces.switch(id);
      } catch {}
    }
  };

  const primaryProfile = profiles[0] || { name: 'Default User', email: 'local.user@chromelite.app' };

  return (
    <ChromeSettingsCard
      id="section-you"
      title="You and Chrome Lite"
      icon={<VscAccount />}
      description="Manage your local profile identity and isolated tab workspaces."
    >
      {/* Profile Overview Card Header */}
      <div className="flex items-center gap-4 px-4 py-3.5 bg-gray-50/70 dark:bg-neutral-850/50">
        <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-semibold text-lg flex items-center justify-center shadow-xs shrink-0">
          {(primaryProfile.name || 'U').charAt(0).toUpperCase()}
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="font-semibold text-gray-900 dark:text-neutral-100 text-xs truncate">
            {primaryProfile.name}
          </span>
          <span className="text-[11px] text-gray-500 dark:text-neutral-400 truncate">
            {primaryProfile.email || 'Local Offline Profile'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 text-[10.5px] font-medium shrink-0">
          <VscCheck size={12} />
          <span>Local Storage</span>
        </div>
      </div>

      {/* Workspaces Switcher */}
      <ChromeSettingsRow
        icon={<VscBriefcase />}
        label="Active Workspace"
        description="Switch between separate tab sessions and project environments."
        control={
          <select
            value={activeWorkspaceId}
            onChange={(e) => handleSwitchWorkspace(e.target.value)}
            className="bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-gray-900 dark:text-neutral-100 focus:outline-none focus:border-sky-500"
          >
            <option value="default">Personal / Default</option>
            {workspaces.map((w: any) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        }
      />

      {/* Sync & Encryption Status */}
      <ChromeSettingsRow
        icon={<VscSync />}
        label="Data Protection & Sync"
        description="Your history, bookmarks, and cookies are securely encrypted in an embedded local SQLite database."
        control={
          <span className="text-[11px] font-medium text-gray-400 dark:text-neutral-500">
            Encrypted
          </span>
        }
      />
    </ChromeSettingsCard>
  );
};
