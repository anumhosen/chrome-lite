import React, { useState, useEffect } from 'react';
import { VscSearch } from 'react-icons/vsc';
import { ChromeSettingsCard, ChromeSettingsRow } from './ChromeSettingsCard';

interface SearchSettingsProps {
  config: any;
  onUpdateSetting: (key: string, value: any) => void;
  onNotify?: (msg: string) => void;
}

const SEARCH_ENGINES = [
  { id: 'google', name: 'Google', url: 'https://www.google.com/search?q=', shortcut: ':g' },
  { id: 'duckduckgo', name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=', shortcut: ':d' },
  { id: 'bing', name: 'Microsoft Bing', url: 'https://www.bing.com/search?q=', shortcut: ':b' },
  { id: 'brave', name: 'Brave Search', url: 'https://search.brave.com/search?q=', shortcut: ':br' },
];

export const SearchSettings: React.FC<SearchSettingsProps> = ({
  config,
  onUpdateSetting,
  onNotify,
}) => {
  const currentEngineUrl = config?.defaultSearchEngine || 'https://www.google.com/search?q=';
  const [selectedId, setSelectedId] = useState<string>('google');

  useEffect(() => {
    const found = SEARCH_ENGINES.find((e) => e.url === currentEngineUrl);
    if (found) {
      setSelectedId(found.id);
    } else {
      setSelectedId('custom');
    }
  }, [currentEngineUrl]);

  const handleSelectEngine = (id: string) => {
    setSelectedId(id);
    const engine = SEARCH_ENGINES.find((e) => e.id === id);
    if (engine) {
      onUpdateSetting('defaultSearchEngine', engine.url);
      onNotify?.(`Default search engine set to ${engine.name}`);
    }
  };

  return (
    <ChromeSettingsCard
      id="section-search"
      title="Search engine"
      icon={<VscSearch />}
      description="Choose the search engine used when searching from the address bar (Omnibox)."
    >
      {/* Search Engine Dropdown */}
      <ChromeSettingsRow
        label="Search engine used in the address bar"
        description="Type search keywords directly in the omnibox to execute queries."
        control={
          <select
            value={selectedId}
            onChange={(e) => handleSelectEngine(e.target.value)}
            className="bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-gray-900 dark:text-neutral-100 focus:outline-none focus:border-sky-500 min-w-[140px]"
          >
            {SEARCH_ENGINES.map((eng) => (
              <option key={eng.id} value={eng.id}>
                {eng.name}
              </option>
            ))}
          </select>
        }
      />

      {/* Engine Shortcuts Table */}
      <div className="p-4 flex flex-col gap-2">
        <span className="text-[11px] font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
          Available Search Shortcuts
        </span>
        <div className="rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden divide-y divide-gray-100 dark:divide-neutral-800">
          {SEARCH_ENGINES.map((eng) => (
            <div
              key={eng.id}
              className="flex items-center justify-between px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-neutral-850/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-800 dark:text-neutral-200">{eng.name}</span>
                {eng.url === currentEngineUrl && (
                  <span className="text-[10px] bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 px-1.5 py-0.5 rounded font-medium">
                    Default
                  </span>
                )}
              </div>
              <span className="font-mono text-[10.5px] text-gray-400 dark:text-neutral-500 bg-gray-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
                {eng.shortcut}
              </span>
            </div>
          ))}
        </div>
      </div>
    </ChromeSettingsCard>
  );
};
