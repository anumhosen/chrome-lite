import React from 'react';
import {
  VscBookmark,
  VscHistory,
  VscCloudDownload,
  VscFolderOpened,
  VscPulse,
  VscDatabase,
  VscTerminal,
  VscBook,
  VscSearch,
  VscCode,
  VscSettingsGear,
  VscDashboard,
  VscPlay,
  VscExtensions,
  VscGlobe,
  VscPackage,
} from 'react-icons/vsc';

import { HistoryPanel } from './HistoryPanel';
import { DownloadsPanel } from './DownloadsPanel';
import { NotebookPanel } from './NotebookPanel';
import { ExplorerPanel } from './ExplorerPanel';
import { BookmarksPanel } from './BookmarksPanel';
import { SystemDashboardPanel } from './SystemDashboardPanel';
import { SettingsPanel } from './SettingsPanel';
import { UserscriptsPanel } from './UserscriptsPanel';
import { ScraperBuilderPanel } from './ScraperBuilderPanel';
import { CookieJarPanel } from './CookieJarPanel';
import { ApiInspectorPanel } from './ApiInspectorPanel';
import { ConsolePanel } from './ConsolePanel';
import { AutomationPanel } from './AutomationPanel';
import { GenericPanel } from './GenericPanel';
import { NewTabPage } from '../pages/NewTabPage';
import { ExtensionsPage } from '../pages/ExtensionsPage';
import { AppsPage } from '../pages/AppsPage';

export const PANEL_TITLES: Record<string, string> = {
  newtab: 'New Tab',
  extensions: 'Extensions',
  apps: 'Chrome Apps',
  notebook: 'Notebook',
  automation: 'Automation & Macros',
  downloads: 'Batch Download Manager',
  history: 'History',
  bookmarks: 'Bookmarks',
  explorer: 'Resource Explorer',
  interceptor: 'API Inspector & Network',
  userscripts: 'Userscripts Manager',
  scraperBuilder: 'Visual Scraper Builder',
  cookies: 'Cookie Jar',
  settings: 'Settings & Preferences',
  memory: 'RAM & System Dashboard',
  console: 'Developer Console',
};

export const normalizePanelName = (rawName: string): string => {
  if (!rawName) return '';
  let cleaned = rawName.trim();
  // Strip schemes
  cleaned = cleaned.replace(/^(chrome|chrome):\/\//i, '');
  // Extract path / name
  cleaned = cleaned.split('/')[0].split('?')[0].toLowerCase();

  switch (cleaned) {
    case 'new-tab':
    case 'newtab':
    case 'home':
      return 'newtab';
    case 'extension':
    case 'extensions':
      return 'extensions';
    case 'app':
    case 'apps':
      return 'apps';
    case 'scraper-builder':
    case 'scrapper-builder':
    case 'scraper':
    case 'scrapper':
    case 'scraperbuilder':
    case 'scrapperbuilder':
      return 'scraperBuilder';
    case 'api-inspector':
    case 'network':
      return 'interceptor';
    case 'system':
    case 'ram':
    case 'performance':
      return 'memory';
    default:
      return cleaned;
  }
};

export const getPanelIcon = (panel: string, size = 16) => {
  const norm = normalizePanelName(panel);
  switch (norm) {
    case 'newtab':
      return <VscGlobe size={size} />;
    case 'extensions':
      return <VscExtensions size={size} />;
    case 'apps':
      return <VscPackage size={size} />;
    case 'bookmarks':
      return <VscBookmark size={size} />;
    case 'history':
      return <VscHistory size={size} />;
    case 'downloads':
      return <VscCloudDownload size={size} />;
    case 'explorer':
      return <VscFolderOpened size={size} />;
    case 'interceptor':
      return <VscPulse size={size} />;
    case 'cookies':
      return <VscDatabase size={size} />;
    case 'console':
      return <VscTerminal size={size} />;
    case 'notebook':
      return <VscBook size={size} />;
    case 'automation':
      return <VscPlay size={size} />;
    case 'scraperBuilder':
      return <VscSearch size={size} />;
    case 'userscripts':
      return <VscCode size={size} />;
    case 'settings':
      return <VscSettingsGear size={size} />;
    case 'memory':
      return <VscDashboard size={size} />;
    default:
      return <VscTerminal size={size} />;
  }
};

export const PanelRenderer: React.FC<{ panel: string; mode?: 'drawer' | 'tab' | 'popout' }> = ({
  panel,
  mode = 'drawer',
}) => {
  const norm = normalizePanelName(panel);

  const renderInner = () => {
    switch (norm) {
      case 'newtab':
        return <NewTabPage />;
      case 'extensions':
        return <ExtensionsPage />;
      case 'apps':
        return <AppsPage />;
      case 'history':
        return <HistoryPanel />;
      case 'downloads':
        return <DownloadsPanel mode={mode} />;
      case 'notebook':
        return <NotebookPanel />;
      case 'explorer':
        return <ExplorerPanel />;
      case 'bookmarks':
        return <BookmarksPanel />;
      case 'memory':
        return <SystemDashboardPanel />;
      case 'settings':
        return <SettingsPanel />;
      case 'userscripts':
        return <UserscriptsPanel />;
      case 'scraperBuilder':
        return <ScraperBuilderPanel />;
      case 'automation':
        return <AutomationPanel />;
      case 'cookies':
        return <CookieJarPanel />;
      case 'interceptor':
        return <ApiInspectorPanel />;
      case 'console':
        return <ConsolePanel />;
      default:
        return <GenericPanel panel={norm} title={PANEL_TITLES[norm] || norm} />;
    }
  };

  const isFormPanel = norm === 'settings' || norm === 'memory' || norm === 'scraperBuilder';

  return (
    <div
      className={`theme-panel-container w-full h-full min-h-0 ${
        mode === 'drawer'
          ? isFormPanel
            ? 'overflow-y-auto overflow-x-hidden p-3'
            : 'overflow-hidden flex flex-col p-3'
          : 'h-full w-full'
      }`}
    >
      {renderInner()}
    </div>
  );
};
