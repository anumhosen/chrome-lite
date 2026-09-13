import React from 'react';
import {
  VscTools,
  VscPulse,
  VscCode,
  VscPlay,
  VscSearch,
  VscBook,
  VscTerminal,
  VscLinkExternal,
} from 'react-icons/vsc';
import { ChromeSettingsCard, ChromeSettingsRow } from './ChromeSettingsCard';
import { ChromeToggle } from './ChromeToggle';
import { useTabStore } from '../../../stores/useTabStore';

interface DeveloperSubsystemsSettingsProps {
  features: Record<string, boolean>;
  onToggleFeature: (name: string, enabled: boolean) => void;
}

export const DeveloperSubsystemsSettings: React.FC<DeveloperSubsystemsSettingsProps> = ({
  features,
  onToggleFeature,
}) => {
  const { createTab } = useTabStore();

  const handleLaunch = (url: string) => {
    createTab(url);
  };

  return (
    <ChromeSettingsCard
      id="section-developer"
      title="Developer Tools & Subsystems"
      icon={<VscTools />}
      description="Configure built-in browser developer utilities and automation engines."
    >
      {/* API Inspector */}
      <ChromeSettingsRow
        icon={<VscPulse className="text-sky-500" />}
        label="API & Network Interceptor"
        description="Inspects live HTTP/HTTPS traffic, configures mock response rules, and exports HAR / OpenAPI 3.0 specs."
        control={
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleLaunch('chrome://interceptor')}
              title="Open API Inspector"
              className="p-1 text-gray-500 hover:text-sky-500 transition-colors"
            >
              <VscLinkExternal size={14} />
            </button>
            <ChromeToggle
              checked={features.interceptor !== false}
              onChange={(c) => onToggleFeature('interceptor', c)}
            />
          </div>
        }
      />

      {/* Userscripts Engine */}
      <ChromeSettingsRow
        icon={<VscCode className="text-amber-500" />}
        label="Userscript Engine"
        description="Injects Greasemonkey/Tampermonkey compatible custom scripts directly into web pages."
        control={
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleLaunch('chrome://userscripts')}
              title="Open Userscripts Manager"
              className="p-1 text-gray-500 hover:text-amber-500 transition-colors"
            >
              <VscLinkExternal size={14} />
            </button>
            <ChromeToggle
              checked={features.userscripts !== false}
              onChange={(c) => onToggleFeature('userscripts', c)}
            />
          </div>
        }
      />

      {/* Macro Automation */}
      <ChromeSettingsRow
        icon={<VscPlay className="text-pink-500" />}
        label="Browser Macro & Automation"
        description="Visually records user interactions, sets up conditional flows, and exports to TypeScript Playwright tests."
        control={
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleLaunch('chrome://automation')}
              title="Open Automation Manager"
              className="p-1 text-gray-500 hover:text-pink-500 transition-colors"
            >
              <VscLinkExternal size={14} />
            </button>
            <ChromeToggle
              checked={features.automation !== false}
              onChange={(c) => onToggleFeature('automation', c)}
            />
          </div>
        }
      />

      {/* Web Scraper */}
      <ChromeSettingsRow
        icon={<VscSearch className="text-indigo-500" />}
        label="Visual Web Scraper & Asset Grabber"
        description="Point-and-click DOM element picker, HTML table extractor, and deep page media asset grabber."
        control={
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleLaunch('chrome://scraper')}
              title="Open Web Scraper"
              className="p-1 text-gray-500 hover:text-indigo-500 transition-colors"
            >
              <VscLinkExternal size={14} />
            </button>
            <ChromeToggle
              checked={features.scraper !== false}
              onChange={(c) => onToggleFeature('scraper', c)}
            />
          </div>
        }
      />

      {/* Dev Notebook */}
      <ChromeSettingsRow
        icon={<VscBook className="text-teal-500" />}
        label="Interactive Dev Notebook"
        description="Live JavaScript evaluation notebook powered by CodeMirror 6 with tabular data visualization."
        control={
          <button
            onClick={() => handleLaunch('chrome://notebook')}
            title="Open Dev Notebook"
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-gray-300 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-750 font-medium text-xs transition-colors"
          >
            <VscLinkExternal size={13} />
            <span>Launch</span>
          </button>
        }
      />

      {/* Dev Console */}
      <ChromeSettingsRow
        icon={<VscTerminal className="text-gray-500" />}
        label="Developer Console"
        description="View real-time IPC messages, webview logs, and system events (Shortcut: Ctrl+`)."
        control={
          <button
            onClick={() => handleLaunch('chrome://console')}
            title="Open Developer Console"
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-gray-300 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-750 font-medium text-xs transition-colors"
          >
            <VscLinkExternal size={13} />
            <span>Launch</span>
          </button>
        }
      />
    </ChromeSettingsCard>
  );
};
