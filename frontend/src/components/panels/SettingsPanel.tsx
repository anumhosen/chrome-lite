import React, { useEffect, useState, useRef } from 'react';
import {
  VscSearch,
  VscClose,
  VscAccount,
  VscColorMode,
  VscPlay,
  VscShield,
  VscDashboard,
  VscCloudDownload,
  VscTools,
  VscInfo,
} from 'react-icons/vsc';
import { ProfilesSettings } from './settings/ProfilesSettings';
import { AppearanceSettings } from './settings/AppearanceSettings';
import { SearchSettings } from './settings/SearchSettings';
import { StartupSettings } from './settings/StartupSettings';
import { PrivacySettings } from './settings/PrivacySettings';
import { PerformanceSettings } from './settings/PerformanceSettings';
import { DownloadsSettings } from './settings/DownloadsSettings';
import { DeveloperSubsystemsSettings } from './settings/DeveloperSubsystemsSettings';
import { AboutSettings } from './settings/AboutSettings';
import { chromeApi } from '../../services/chromeApi';

interface SettingsPanelProps {
  mode?: 'drawer' | 'tab' | 'popout';
}

interface SettingsCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
}

const CATEGORIES: SettingsCategory[] = [
  { id: 'section-you', name: 'You and Chrome', icon: <VscAccount size={15} /> },
  { id: 'section-appearance', name: 'Appearance', icon: <VscColorMode size={15} /> },
  { id: 'section-search', name: 'Search engine', icon: <VscSearch size={15} /> },
  { id: 'section-startup', name: 'On startup', icon: <VscPlay size={15} /> },
  { id: 'section-privacy', name: 'Privacy and security', icon: <VscShield size={15} /> },
  { id: 'section-performance', name: 'Performance', icon: <VscDashboard size={15} /> },
  { id: 'section-downloads', name: 'Downloads', icon: <VscCloudDownload size={15} /> },
  { id: 'section-developer', name: 'Developer Tools', icon: <VscTools size={15} /> },
  { id: 'section-about', name: 'About Chrome Lite', icon: <VscInfo size={15} /> },
];

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ mode = 'tab' }) => {
  const isDrawer = mode === 'drawer';

  const [config, setConfig] = useState<any>({});
  const [notification, setNotification] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSection, setActiveSection] = useState<string>('section-you');

  const contentRef = useRef<HTMLDivElement>(null);

  const loadConfig = async () => {
    let currentConfig: any = {};
    try {
      const rawConfig = await chromeApi.system.getConfig();
      currentConfig = {
        ...rawConfig,
        ...(rawConfig.settings || {}),
      };
    } catch {}

    try {
      let localEngine = localStorage.getItem('chrome_default_search_engine');
      let localHome = localStorage.getItem('chrome_homepage');
      let localNewTab = localStorage.getItem('chrome_new_tab_url');
      if (localHome && localHome.includes('duckduckgo.com')) {
        try { localStorage.removeItem('chrome_homepage'); } catch {}
        localHome = null;
      }
      if (localNewTab && localNewTab.includes('duckduckgo.com')) {
        try { localStorage.removeItem('chrome_new_tab_url'); } catch {}
        localNewTab = null;
      }
      if (localEngine && !currentConfig.defaultSearchEngine) currentConfig.defaultSearchEngine = localEngine;
      if (localHome && !currentConfig.homepage) currentConfig.homepage = localHome;
      if (localNewTab && !currentConfig.newTabUrl) currentConfig.newTabUrl = localNewTab;
      if (currentConfig.homepage && currentConfig.homepage.includes('duckduckgo.com')) {
        currentConfig.homepage = 'chrome://newtab';
      }
      if (currentConfig.newTabUrl && currentConfig.newTabUrl.includes('duckduckgo.com')) {
        currentConfig.newTabUrl = 'chrome://newtab';
      }
    } catch {}

    setConfig(currentConfig);
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleUpdateSetting = async (key: string, value: any) => {
    setConfig((prev: any) => ({ ...prev, [key]: value }));
    try {
      await chromeApi.system.setSetting(key, value);
    } catch {}
    try {
      if (key === 'homepage') localStorage.setItem('chrome_homepage', String(value));
      if (key === 'newTabUrl') localStorage.setItem('chrome_new_tab_url', String(value));
      if (key === 'defaultSearchEngine') localStorage.setItem('chrome_default_search_engine', String(value));
    } catch {}
  };

  const handleToggleFeature = async (name: string, enabled: boolean) => {
    setConfig((prev: any) => ({
      ...prev,
      features: { ...prev.features, [name]: enabled },
    }));
    try {
      await chromeApi.system.setFeature(name, enabled);
      showNotification(`Feature "${name}" ${enabled ? 'enabled' : 'disabled'}`);
    } catch {}
  };

  const showNotification = (text: string) => {
    setNotification(text);
    setTimeout(() => setNotification(''), 2500);
  };

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Scroll-spy to update active section based on scroll position
  useEffect(() => {
    const container = contentRef.current;
    if (!container || isDrawer || searchQuery) return;

    const handleScroll = () => {
      const scrollPos = container.scrollTop + 120;
      for (const cat of CATEGORIES) {
        const el = document.getElementById(cat.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(cat.id);
            break;
          }
        }
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [isDrawer, searchQuery]);

  const features = config.features || {};

  // Simple search filter helper
  const matchesSearch = (title: string, keywords: string[] = []) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return title.toLowerCase().includes(q) || keywords.some((k) => k.toLowerCase().includes(q));
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-50 dark:bg-neutral-950 text-gray-900 dark:text-neutral-200 select-none overflow-hidden">
      {/* Top Search & Header Bar (Authentic Chrome Style) */}
      <div className="h-14 min-h-14 px-6 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between gap-4 z-20 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm tracking-tight text-gray-900 dark:text-neutral-100 hidden sm:inline">
            Settings
          </span>
        </div>

        {/* Omnibox Search Bar */}
        <div className="flex-1 max-w-md relative flex items-center">
          <VscSearch className="absolute left-3 text-gray-400 text-sm pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search settings"
            className="w-full h-9 pl-9 pr-8 rounded-full bg-gray-100 dark:bg-neutral-800/80 border border-transparent focus:border-sky-500 focus:bg-white dark:focus:bg-neutral-950 text-xs text-gray-900 dark:text-neutral-100 placeholder-gray-400 dark:placeholder-neutral-500 outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 text-gray-400 hover:text-gray-700 dark:hover:text-neutral-200 p-1"
            >
              <VscClose size={13} />
            </button>
          )}
        </div>

        {/* Notification Toast in Top Header */}
        <div className="flex items-center min-w-[120px] justify-end">
          {notification && (
            <div className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-medium animate-in fade-in duration-150 truncate max-w-[220px]">
              {notification}
            </div>
          )}
        </div>
      </div>

      {/* Drawer Mode: Horizontal Category Pill Strip */}
      {isDrawer && (
        <div className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-shrink-0 z-10">
          {CATEGORIES.map((cat) => {
            const isActive = activeSection === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => scrollToSection(cat.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400 hover:bg-gray-200 dark:hover:bg-neutral-700'
                }`}
              >
                {cat.icon}
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Workspace: Left Sidebar + Center Scrollable Canvas */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Left Navigation Sidebar (Hidden in narrow drawer mode) */}
        {!isDrawer && (
          <aside className="w-60 min-w-60 h-full py-4 px-3 bg-white/70 dark:bg-neutral-900/60 border-r border-gray-200/80 dark:border-neutral-800/80 overflow-y-auto flex flex-col gap-1 select-none flex-shrink-0">
            {CATEGORIES.map((cat) => {
              const isActive = activeSection === cat.id && !searchQuery;
              return (
                <button
                  key={cat.id}
                  onClick={() => scrollToSection(cat.id)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-full text-xs transition-all text-left ${
                    isActive
                      ? 'bg-sky-100 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 font-semibold shadow-2xs'
                      : 'text-gray-700 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800/60 font-medium'
                  }`}
                >
                  <span className={isActive ? 'text-sky-600 dark:text-sky-400' : 'text-gray-500 dark:text-neutral-500'}>
                    {cat.icon}
                  </span>
                  <span className="truncate">{cat.name}</span>
                </button>
              );
            })}
          </aside>
        )}

        {/* Center Main Scrollable Settings Content Canvas */}
        <main
          ref={contentRef}
          className="flex-1 h-full overflow-y-auto overflow-x-hidden p-4 sm:p-6"
        >
          <div className="max-w-3xl mx-auto flex flex-col gap-6 pb-20">
            {/* 1. You and Chrome */}
            {matchesSearch('You and Chrome Lite', ['profiles', 'account', 'workspaces', 'user', 'sync']) && (
              <ProfilesSettings />
            )}

            {/* 2. Appearance */}
            {matchesSearch('Appearance', ['theme', 'dark', 'light', 'bookmarks', 'sidebar', 'home', 'status']) && (
              <AppearanceSettings onNotify={showNotification} />
            )}

            {/* 3. Search Engine */}
            {matchesSearch('Search engine', ['google', 'duckduckgo', 'bing', 'brave', 'omnibox', 'shortcuts']) && (
              <SearchSettings
                config={config}
                onUpdateSetting={handleUpdateSetting}
                onNotify={showNotification}
              />
            )}

            {/* 4. On Startup */}
            {matchesSearch('On startup', ['restore', 'newtab', 'homepage', 'launch', 'resume', 'session']) && (
              <StartupSettings
                config={config}
                onUpdateSetting={handleUpdateSetting}
                onNotify={showNotification}
              />
            )}

            {/* 5. Privacy and Security */}
            {matchesSearch('Privacy and security', ['shield', 'adblock', 'cookies', 'cache', 'history', 'wipe']) && (
              <PrivacySettings
                features={features}
                onToggleFeature={handleToggleFeature}
                onNotify={showNotification}
              />
            )}

            {/* 6. Performance */}
            {matchesSearch('Performance', ['ram', 'memory', 'hibernate', 'sleep', 'inactive', 'dashboard']) && (
              <PerformanceSettings
                config={config}
                onUpdateSetting={handleUpdateSetting}
                onNotify={showNotification}
              />
            )}

            {/* 7. Downloads */}
            {matchesSearch('Downloads', ['folder', 'location', 'save as', 'files']) && (
              <DownloadsSettings
                config={config}
                onUpdateSetting={handleUpdateSetting}
                onNotify={showNotification}
              />
            )}

            {/* 8. Developer Tools */}
            {matchesSearch('Developer Tools & Subsystems', ['interceptor', 'userscripts', 'automation', 'scraper', 'notebook', 'console']) && (
              <DeveloperSubsystemsSettings
                features={features}
                onToggleFeature={handleToggleFeature}
              />
            )}

            {/* 9. About Chrome Lite */}
            {matchesSearch('About Chrome Lite', ['version', 'update', 'chromium', 'electron', 'docs', 'github']) && (
              <AboutSettings />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
