import React from 'react';
import { VscDashboard, VscHistory, VscLinkExternal } from 'react-icons/vsc';
import { ChromeSettingsCard, ChromeSettingsRow } from './ChromeSettingsCard';
import { ChromeToggle } from './ChromeToggle';
import { useTabStore } from '../../../stores/useTabStore';

interface PerformanceSettingsProps {
  config: any;
  onUpdateSetting: (key: string, value: any) => Promise<void> | void;
  onNotify?: (msg: string) => void;
}

export const PerformanceSettings: React.FC<PerformanceSettingsProps> = ({
  config,
  onUpdateSetting,
  onNotify,
}) => {
  const { createTab } = useTabStore();
  const lowRamMode = config.lowRamMode !== false;
  const inactivityMinutes = config.maxInactiveTabMinutes || 15;

  const handleToggleLowRam = async (checked: boolean) => {
    await onUpdateSetting('lowRamMode', checked);
    onNotify?.(checked ? 'Memory Saver enabled' : 'Memory Saver disabled');
  };

  const handleMinutesChange = async (minutes: number) => {
    await onUpdateSetting('maxInactiveTabMinutes', minutes);
    onNotify?.(`Hibernation threshold set to ${minutes}m`);
  };

  return (
    <ChromeSettingsCard
      id="section-performance"
      title="Performance"
      icon={<VscDashboard />}
      description="Manage memory saver modes and background tab inactivity thresholds."
    >
      {/* Memory Saver Mode */}
      <ChromeSettingsRow
        icon={<VscDashboard className="text-emerald-500" />}
        label="Memory Saver (Auto-Hibernate Tabs)"
        description="Frees up system memory and CPU cycles by suspending background tabs that have not been viewed recently."
        control={
          <ChromeToggle
            checked={lowRamMode}
            onChange={handleToggleLowRam}
            title="Toggle Memory Saver"
          />
        }
      />

      {/* Tab Inactivity Threshold */}
      <ChromeSettingsRow
        icon={<VscHistory />}
        label="Inactivity threshold before sleeping"
        description="How long a background tab remains idle before its memory is gracefully released."
        control={
          <select
            value={inactivityMinutes}
            disabled={!lowRamMode}
            onChange={(e) => handleMinutesChange(parseInt(e.target.value, 10))}
            className="bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-gray-900 dark:text-neutral-100 focus:outline-none focus:border-sky-500 disabled:opacity-40"
          >
            <option value={5}>5 Minutes</option>
            <option value={15}>15 Minutes (Default)</option>
            <option value={30}>30 Minutes</option>
            <option value={60}>1 Hour</option>
          </select>
        }
      />

      {/* System Dashboard Link */}
      <ChromeSettingsRow
        label="System Dashboard & RAM Monitor"
        description="Inspect real-time system performance, process memory footprint, and force hibernate all inactive tabs."
        control={
          <button
            onClick={() => createTab('chrome://memory')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-gray-300 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-750 font-medium text-xs transition-colors"
          >
            <VscLinkExternal size={13} />
            <span>Open Dashboard</span>
          </button>
        }
      />
    </ChromeSettingsCard>
  );
};
