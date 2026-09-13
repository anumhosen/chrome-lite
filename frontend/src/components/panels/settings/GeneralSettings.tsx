import React, { useState } from 'react';

const ENGINE_HOMEPAGES: Record<string, string> = {
  'https://duckduckgo.com/?q=': 'https://duckduckgo.com',
  'https://www.google.com/search?q=': 'https://www.google.com',
  'https://www.bing.com/search?q=': 'https://www.bing.com',
  'https://search.brave.com/search?q=': 'https://search.brave.com',
};

interface GeneralSettingsProps {
  config: any;
  onUpdateSetting: (key: string, value: any) => Promise<void>;
  onNotify: (message: string) => void;
}

export const GeneralSettings: React.FC<GeneralSettingsProps> = ({
  config,
  onUpdateSetting,
  onNotify,
}) => {
  const [homepageInput, setHomepageInput] = useState(
    config.homepage && !config.homepage.includes('duckduckgo.com')
      ? config.homepage
      : 'chrome://newtab'
  );
  const [newTabInput, setNewTabInput] = useState(
    config.newTabUrl && !config.newTabUrl.includes('duckduckgo.com')
      ? config.newTabUrl
      : 'chrome://newtab'
  );

  const handleSearchEngineChange = async (engineUrl: string) => {
    const newUrl = ENGINE_HOMEPAGES[engineUrl] || 'chrome://newtab';
    setHomepageInput(newUrl);
    setNewTabInput(newUrl);

    await onUpdateSetting('defaultSearchEngine', engineUrl);
    await onUpdateSetting('homepage', newUrl);
    await onUpdateSetting('newTabUrl', newUrl);

    onNotify('Search engine, homepage & new tab URL updated');
  };

  const handleHomepageSave = async () => {
    const trimmed = homepageInput.trim() || 'chrome://newtab';
    setHomepageInput(trimmed);
    setNewTabInput(trimmed);
    await onUpdateSetting('homepage', trimmed);
    await onUpdateSetting('newTabUrl', trimmed);
    onNotify(`Homepage & new tab URL updated to "${trimmed}"`);
  };

  const handleNewTabSave = async () => {
    const trimmed = newTabInput.trim() || 'chrome://newtab';
    setNewTabInput(trimmed);
    await onUpdateSetting('newTabUrl', trimmed);
    onNotify(`New tab URL saved as "${trimmed}"`);
  };

  return (
    <div className="p-3 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-md flex flex-col gap-2.5">
      <span className="font-semibold text-gray-700 dark:text-neutral-300 uppercase tracking-wider text-[10.5px]">
        General Navigation
      </span>

      <div className="flex flex-col gap-1">
        <label className="text-gray-600 dark:text-neutral-400 text-[11px]">Default Search Engine</label>
        <select
          value={config.defaultSearchEngine || 'https://www.google.com/search?q='}
          onChange={(e) => handleSearchEngineChange(e.target.value)}
          className="bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-800 rounded px-2 py-1 text-gray-900 dark:text-neutral-200 outline-none focus:border-sky-500"
        >
          <option value="https://www.google.com/search?q=">Google (Default)</option>
          <option value="https://duckduckgo.com/?q=">DuckDuckGo</option>
          <option value="https://www.bing.com/search?q=">Bing</option>
          <option value="https://search.brave.com/search?q=">Brave Search</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-gray-600 dark:text-neutral-400 text-[11px]">Homepage URL</label>
        <input
          type="text"
          value={homepageInput}
          onChange={(e) => setHomepageInput(e.target.value)}
          onBlur={handleHomepageSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleHomepageSave();
              (e.target as HTMLInputElement).blur();
            }
          }}
          placeholder="chrome://newtab"
          className="bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-800 rounded px-2 py-1 text-gray-900 dark:text-neutral-200 outline-none focus:border-sky-500 text-xs"
        />
        <span className="text-[10px] text-gray-500 dark:text-neutral-500">
          Automatically aligns with your search engine, or enter any custom URL.
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-gray-600 dark:text-neutral-400 text-[11px]">New Tab URL</label>
        <input
          type="text"
          value={newTabInput}
          onChange={(e) => setNewTabInput(e.target.value)}
          onBlur={handleNewTabSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleNewTabSave();
              (e.target as HTMLInputElement).blur();
            }
          }}
          placeholder="chrome://newtab"
          className="bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-800 rounded px-2 py-1 text-gray-900 dark:text-neutral-200 outline-none focus:border-sky-500 text-xs"
        />
        <span className="text-[10px] text-gray-500 dark:text-neutral-500">
          Opens when a new tab is created (+ button or Ctrl+T).
        </span>
      </div>
    </div>
  );
};
