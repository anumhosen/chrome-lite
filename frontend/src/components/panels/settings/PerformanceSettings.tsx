import React from 'react';

interface PerformanceSettingsProps {
  config: any;
  onUpdateSetting: (key: string, value: any) => Promise<void>;
}

export const PerformanceSettings: React.FC<PerformanceSettingsProps> = ({
  config,
  onUpdateSetting,
}) => {
  return (
    <div className="p-3 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-md flex flex-col gap-2.5">
      <span className="font-semibold text-gray-700 dark:text-neutral-300 uppercase tracking-wider text-[10.5px]">
        Performance & RAM
      </span>

      <label className="flex items-center gap-2 cursor-pointer text-gray-800 dark:text-neutral-300">
        <input
          type="checkbox"
          checked={config.lowRamMode !== false}
          onChange={(e) => onUpdateSetting('lowRamMode', e.target.checked)}
          className="accent-sky-500 rounded"
        />
        <span>Auto-hibernate inactive background tabs</span>
      </label>

      <div className="flex flex-col gap-1">
        <label className="text-gray-600 dark:text-neutral-400 text-[11px]">Tab Inactivity Threshold</label>
        <select
          value={config.maxInactiveTabMinutes || 15}
          onChange={(e) => onUpdateSetting('maxInactiveTabMinutes', parseInt(e.target.value, 10))}
          className="bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-800 rounded px-2 py-1 text-gray-900 dark:text-neutral-200 outline-none focus:border-sky-500"
        >
          <option value={5}>5 Minutes</option>
          <option value={15}>15 Minutes (Default)</option>
          <option value={30}>30 Minutes</option>
          <option value={60}>1 Hour</option>
        </select>
      </div>

      <label className="flex items-center gap-2 cursor-pointer text-gray-800 dark:text-neutral-300">
        <input
          type="checkbox"
          checked={config.restoreSession !== false}
          onChange={(e) => onUpdateSetting('restoreSession', e.target.checked)}
          className="accent-sky-500 rounded"
        />
        <span>Restore open workspace tabs on launch</span>
      </label>
    </div>
  );
};
