import React, { useEffect, useState } from 'react';
import { GeneralSettings } from './settings/GeneralSettings';
import { AppearanceSettings } from './settings/AppearanceSettings';
import { PerformanceSettings } from './settings/PerformanceSettings';
import { PrivacySettings } from './settings/PrivacySettings';
import { chromeApi } from '../../services/chromeApi';

export const SettingsPanel: React.FC = () => {
  const [config, setConfig] = useState<any>({});
  const [msg, setMsg] = useState('');

  const loadConfig = async () => {
    let currentConfig: any = {};
    try {
      const rawConfig = await chromeApi.system.getConfig();
      currentConfig = {
        ...rawConfig,
        ...(rawConfig.settings || {}),
      };
    } catch { }

    if (!currentConfig.defaultSearchEngine) {
      try {
        const localEngine = localStorage.getItem('chrome_default_search_engine');
        const localHome = localStorage.getItem('chrome_homepage');
        const localNewTab = localStorage.getItem('chrome_new_tab_url');
        if (localEngine) currentConfig.defaultSearchEngine = localEngine;
        if (localHome) currentConfig.homepage = localHome;
        if (localNewTab) currentConfig.newTabUrl = localNewTab;
      } catch { }
    }

    setConfig(currentConfig);
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleUpdateSetting = async (key: string, value: any) => {
    setConfig((prev: any) => ({ ...prev, [key]: value }));
    try {
      await chromeApi.system.setSetting(key, value);
    } catch { }
    try {
      if (key === 'homepage') localStorage.setItem('chrome_homepage', String(value));
      if (key === 'newTabUrl') localStorage.setItem('chrome_new_tab_url', String(value));
      if (key === 'defaultSearchEngine') localStorage.setItem('chrome_default_search_engine', String(value));
    } catch { }
  };

  const handleToggleFeature = async (name: string, enabled: boolean) => {
    setConfig((prev: any) => ({
      ...prev,
      features: { ...prev.features, [name]: enabled },
    }));
    try {
      await chromeApi.system.setFeature(name, enabled);
      setMsg(`Feature "${name}" ${enabled ? 'enabled' : 'disabled'}`);
      setTimeout(() => setMsg(''), 2000);
    } catch { }
  };

  const showNotification = (text: string) => {
    setMsg(text);
    setTimeout(() => setMsg(''), 2500);
  };

  const features = config.features || {};

  return (
    <div className="flex flex-col gap-4 text-xs">
      {msg && (
        <div className="text-[11px] px-2.5 py-1 rounded bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300">
          {msg}
        </div>
      )}

      {/* Appearance & Interface */}
      <AppearanceSettings />

      {/* General Navigation */}
      <GeneralSettings
        config={config}
        onUpdateSetting={handleUpdateSetting}
        onNotify={showNotification}
      />

      {/* Performance & Memory */}
      <PerformanceSettings
        config={config}
        onUpdateSetting={handleUpdateSetting}
      />

      {/* Subsystems & Privacy */}
      <PrivacySettings
        features={features}
        onToggleFeature={handleToggleFeature}
      />
    </div>
  );
};
