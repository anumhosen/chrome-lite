import React, { useState } from 'react';
import { VscColorMode, VscBookmark, VscLayoutSidebarLeft, VscHome } from 'react-icons/vsc';
import { ChromeSettingsCard, ChromeSettingsRow } from './ChromeSettingsCard';
import { ChromeToggle } from './ChromeToggle';
import { useThemeStore } from '../../../stores/useThemeStore';
import { useSettingsStore } from '../../../stores/useSettingsStore';

interface AppearanceSettingsProps {
  onNotify?: (msg: string) => void;
}

export const AppearanceSettings: React.FC<AppearanceSettingsProps> = ({ onNotify }) => {
  const { theme, setTheme } = useThemeStore();
  const {
    showStatusBar,
    setShowStatusBar,
    showBookmarksBar,
    setShowBookmarksBar,
    showDeveloperSidebar,
    setShowDeveloperSidebar,
  } = useSettingsStore();

  const [showHomeButton, setShowHomeButton] = useState<boolean>(() => {
    try {
      return localStorage.getItem('chrome_show_home_button') !== 'false';
    } catch {
      return true;
    }
  });

  const handleToggleHomeButton = (checked: boolean) => {
    setShowHomeButton(checked);
    try {
      localStorage.setItem('chrome_show_home_button', String(checked));
    } catch {}
    onNotify?.(`Home button ${checked ? 'enabled' : 'disabled'}`);
  };

  return (
    <ChromeSettingsCard
      id="section-appearance"
      title="Appearance"
      icon={<VscColorMode />}
      description="Customize Chrome Lite colors, theme mode, and toolbar controls."
    >
      {/* Theme Mode Selector */}
      <ChromeSettingsRow
        icon={<VscColorMode />}
        label="Theme"
        description="Choose between Chrome Dark Mode and Light Mode with instant visual preview."
        control={
          <div className="flex items-center gap-1.5 p-0.5 rounded-xl bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700">
            <button
              onClick={() => {
                setTheme('light');
                onNotify?.('Switched to Light theme');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                theme === 'light'
                  ? 'bg-white text-sky-600 shadow-xs border border-gray-200'
                  : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900'
              }`}
            >
              Light
            </button>
            <button
              onClick={() => {
                setTheme('dark');
                onNotify?.('Switched to Dark theme');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                theme === 'dark'
                  ? 'bg-neutral-900 text-sky-400 shadow-xs border border-neutral-700'
                  : 'text-gray-600 dark:text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Dark
            </button>
          </div>
        }
      />

      {/* Show Bookmarks Bar */}
      <ChromeSettingsRow
        icon={<VscBookmark />}
        label="Show bookmarks bar"
        description="Displays quick-access bookmarks directly under the address bar (Ctrl+Shift+B)."
        control={
          <ChromeToggle
            checked={showBookmarksBar}
            onChange={(c) => {
              setShowBookmarksBar(c);
              onNotify?.(`Bookmarks bar ${c ? 'shown' : 'hidden'}`);
            }}
            title="Show bookmarks bar"
          />
        }
      />

      {/* Show Home Button */}
      <ChromeSettingsRow
        icon={<VscHome />}
        label="Show home button"
        description="Displays the home button on the toolbar to quickly return to your homepage or New Tab."
        control={
          <ChromeToggle
            checked={showHomeButton}
            onChange={handleToggleHomeButton}
            title="Show home button"
          />
        }
      />

      {/* Developer Sidebar */}
      <ChromeSettingsRow
        icon={<VscLayoutSidebarLeft />}
        label="Show Developer Activity Bar"
        description="Displays the VS Code-style quick navigation sidebar on the far left edge."
        control={
          <ChromeToggle
            checked={showDeveloperSidebar}
            onChange={(c) => {
              setShowDeveloperSidebar(c);
              onNotify?.(`Developer sidebar ${c ? 'shown' : 'hidden'}`);
            }}
            title="Show Developer Activity Bar"
          />
        }
      />

      {/* Status Bar */}
      <ChromeSettingsRow
        label="Show status bar"
        description="Displays URL hover targets and zoom levels at the bottom edge."
        control={
          <ChromeToggle
            checked={showStatusBar}
            onChange={(c) => {
              setShowStatusBar(c);
              onNotify?.(`Status bar ${c ? 'shown' : 'hidden'}`);
            }}
            title="Show status bar"
          />
        }
      />
    </ChromeSettingsCard>
  );
};
