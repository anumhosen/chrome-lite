import React, { useState, useEffect } from 'react';
import { VscPlay, VscGlobe } from 'react-icons/vsc';
import { ChromeSettingsCard } from './ChromeSettingsCard';

interface StartupSettingsProps {
  config: any;
  onUpdateSetting: (key: string, value: any) => void;
  onNotify?: (msg: string) => void;
}

export const StartupSettings: React.FC<StartupSettingsProps> = ({
  config,
  onUpdateSetting,
  onNotify,
}) => {
  const restoreSession = Boolean(config?.restoreSession);
  const customUrl = config?.homepage || '';

  const [mode, setMode] = useState<'newtab' | 'restore' | 'custom'>('newtab');
  const [customInput, setCustomInput] = useState(customUrl);

  useEffect(() => {
    if (restoreSession) {
      setMode('restore');
    } else if (
      customUrl &&
      customUrl !== 'chrome://newtab' &&
      customUrl !== 'chrome://home' &&
      !customUrl.includes('duckduckgo.com')
    ) {
      setMode('custom');
      setCustomInput(customUrl);
    } else {
      setMode('newtab');
    }
  }, [restoreSession, customUrl]);

  const handleModeChange = (newMode: 'newtab' | 'restore' | 'custom') => {
    setMode(newMode);
    if (newMode === 'newtab') {
      onUpdateSetting('restoreSession', false);
      onUpdateSetting('homepage', 'chrome://newtab');
      onUpdateSetting('newTabUrl', 'chrome://newtab');
      onNotify?.('On startup: Open New Tab page');
    } else if (newMode === 'restore') {
      onUpdateSetting('restoreSession', true);
      onNotify?.('On startup: Continue where you left off');
    } else if (newMode === 'custom') {
      onUpdateSetting('restoreSession', false);
      const urlToSet = customInput.trim() && !customInput.includes('duckduckgo.com') ? customInput.trim() : 'https://';
      onUpdateSetting('homepage', urlToSet);
      onUpdateSetting('newTabUrl', urlToSet);
      onNotify?.('On startup: Open specific page');
    }
  };

  const handleCustomInputSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    const url = customInput.trim();
    onUpdateSetting('homepage', url);
    onUpdateSetting('newTabUrl', url);
    onNotify?.(`Startup page updated to ${url}`);
  };

  return (
    <ChromeSettingsCard
      id="section-startup"
      title="On startup"
      icon={<VscPlay />}
      description="Choose what Chrome Lite displays when launching the browser."
    >
      <div className="p-4 flex flex-col gap-3">
        {/* Option 1: Open New Tab page */}
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="radio"
            name="startup-mode"
            checked={mode === 'newtab'}
            onChange={() => handleModeChange('newtab')}
            className="mt-0.5 accent-sky-600"
          />
          <div className="flex flex-col">
            <span className="text-xs font-medium text-gray-900 dark:text-neutral-200">
              Open the New Tab page
            </span>
            <span className="text-[11px] text-gray-500 dark:text-neutral-400">
              Displays Google search, daily wallpapers, and 2-row site shortcuts.
            </span>
          </div>
        </label>

        {/* Option 2: Continue where you left off */}
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="radio"
            name="startup-mode"
            checked={mode === 'restore'}
            onChange={() => handleModeChange('restore')}
            className="mt-0.5 accent-sky-600"
          />
          <div className="flex flex-col">
            <span className="text-xs font-medium text-gray-900 dark:text-neutral-200">
              Continue where you left off
            </span>
            <span className="text-[11px] text-gray-500 dark:text-neutral-400">
              Restores all open tabs and active workspace from your previous browsing session.
            </span>
          </div>
        </label>

        {/* Option 3: Open a specific page */}
        <div className="flex flex-col gap-2">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="radio"
              name="startup-mode"
              checked={mode === 'custom'}
              onChange={() => handleModeChange('custom')}
              className="mt-0.5 accent-sky-600"
            />
            <div className="flex flex-col">
              <span className="text-xs font-medium text-gray-900 dark:text-neutral-200">
                Open a specific page or set of pages
              </span>
              <span className="text-[11px] text-gray-500 dark:text-neutral-400">
                Specify a custom default URL to open automatically on browser launch.
              </span>
            </div>
          </label>

          {mode === 'custom' && (
            <form onSubmit={handleCustomInputSave} className="flex items-center gap-2 ml-7 mt-1">
              <div className="flex-1 relative flex items-center">
                <VscGlobe className="absolute left-2.5 text-gray-400 text-xs" />
                <input
                  type="text"
                  placeholder="https://example.com"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-300 dark:border-neutral-700 rounded-lg pl-7 pr-3 py-1.5 text-xs text-gray-900 dark:text-neutral-100 focus:outline-none focus:border-sky-500"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs transition-colors shrink-0"
              >
                Save
              </button>
            </form>
          )}
        </div>
      </div>
    </ChromeSettingsCard>
  );
};
