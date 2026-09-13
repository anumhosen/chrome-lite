import React, { useEffect } from 'react';
import { VscLinkExternal } from 'react-icons/vsc';
import { PanelRenderer, PANEL_TITLES, getPanelIcon, normalizePanelName } from '../panels/PanelRenderer';
import { useTabBindingStore } from '../../stores/useTabBindingStore';

interface InternalTabPageProps {
  url: string;
}

export const InternalTabPage: React.FC<InternalTabPageProps> = ({ url }) => {
  const norm = normalizePanelName(url);
  const title = PANEL_TITLES[norm] || `${norm.charAt(0).toUpperCase() + norm.slice(1)}`;
  const isNativeChromePage = ['newtab', 'extensions', 'apps', 'settings'].includes(norm);
  const isFullWidth = ['notebook', 'explorer', 'interceptor', 'console', 'scraperBuilder', 'newtab', 'extensions', 'apps', 'settings'].includes(norm);

  let targetTabFromUrl: string | null = null;
  try {
    const qIndex = url.indexOf('?');
    if (qIndex !== -1) {
      const sp = new URLSearchParams(url.substring(qIndex));
      targetTabFromUrl = sp.get('targetTab');
    }
  } catch { }

  const { setBoundTabId, boundTabId, getBoundTab } = useTabBindingStore();

  useEffect(() => {
    if (targetTabFromUrl) {
      setBoundTabId(targetTabFromUrl);
    }
  }, [targetTabFromUrl, setBoundTabId]);

  const handlePopout = () => {
    const effectiveTabId = targetTabFromUrl || boundTabId || getBoundTab()?.id;
    if (window.chrome?.window?.openFloating) {
      window.chrome.window.openFloating(norm, effectiveTabId || undefined);
    } else if (norm === 'notebook' && window.chrome?.notebook?.openFloating) {
      window.chrome.notebook.openFloating();
    }
  };

  if (isNativeChromePage) {
    return (
      <div className={`w-full h-full bg-white dark:bg-neutral-900 ${['newtab', 'settings'].includes(norm) ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        <PanelRenderer panel={norm} mode="tab" />
      </div>
    );
  }

  return (
    <div className="internal-page-container w-full h-full flex flex-col bg-gray-50 dark:bg-neutral-900 text-gray-900 dark:text-neutral-200 select-none overflow-hidden">
      {/* Top Banner (Chrome-Style Internal Page Sub-Header) */}
      <div className="h-[38px] min-h-[38px] px-6 bg-white dark:bg-neutral-950 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="text-sky-600 dark:text-sky-400">
            {getPanelIcon(norm, 16)}
          </div>
          <h1 className="text-xs font-semibold text-gray-800 dark:text-neutral-200 tracking-tight">
            {title}
          </h1>
          <span className="text-[10px] font-mono text-gray-400 dark:text-neutral-500 bg-gray-100 dark:bg-neutral-800/80 px-1.5 py-0.5 rounded">
            chrome://{norm}
          </span>
        </div>

        <button
          onClick={handlePopout}
          title="Pop out into separate window"
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-neutral-300 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded transition-colors border border-gray-200 dark:border-neutral-700"
        >
          <VscLinkExternal size={13} />
          <span>Pop out Window</span>
        </button>
      </div>

      {/* Internal Page Body */}
      <div className="flex-1 overflow-y-auto">
        <div className={`h-full ${isFullWidth ? 'p-3' : 'max-w-4xl mx-auto py-6 px-4'}`}>
          <PanelRenderer panel={norm} mode="tab" />
        </div>
      </div>
    </div>
  );
};
