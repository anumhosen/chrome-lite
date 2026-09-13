import React, { useEffect } from 'react';
import { VscColorMode } from 'react-icons/vsc';
import { useThemeStore } from '../../stores/useThemeStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useTabStore } from '../../stores/useTabStore';
import { PanelRenderer, PANEL_TITLES, getPanelIcon, normalizePanelName } from '../panels/PanelRenderer';
import { WindowControls } from '../window/WindowControls';

interface PopoutLayoutProps {
  panel: string;
}

export const PopoutLayout: React.FC<PopoutLayoutProps> = ({ panel }) => {
  const { theme, initTheme, toggleTheme } = useThemeStore();
  const { initSettings } = useSettingsStore();
  const { initTabs } = useTabStore();

  const norm = normalizePanelName(panel);
  const title = PANEL_TITLES[norm] || `${norm.charAt(0).toUpperCase() + norm.slice(1)}`;

  useEffect(() => {
    initTheme();
    initSettings();
    initTabs();
    document.title = `Chrome Lite - ${title}`;
  }, [initTheme, initSettings, initTabs, title]);

  const isFullWidthPanel = ['notebook', 'explorer', 'interceptor', 'console', 'scraperBuilder'].includes(norm);

  return (
    <div className="popout-window-container flex flex-col h-screen w-screen overflow-hidden bg-gray-100 dark:bg-neutral-900 text-gray-900 dark:text-neutral-200">
      {/* Frameless Window TopBar with same UI & controls as main window */}
      <header
        className="h-[32px] min-h-[32px] max-h-[32px] bg-gray-100 dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between pl-2 select-none flex-shrink-0 app-drag"
        style={{ WebkitAppRegion: 'drag' } as any}
      >
        {/* Left: Personal Badge */}
        <div className="flex items-center gap-2 mr-2 app-no-drag" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/30 text-sky-500 dark:text-sky-400 text-[10.5px] font-semibold tracking-wide uppercase">
            <span>Personal</span>
          </div>
        </div>

        {/* Center: Window Title & Drag Area */}
        <div className="flex-1 flex items-center gap-2 h-full min-w-0 app-drag" style={{ WebkitAppRegion: 'drag' } as any}>
          <div className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-neutral-300 font-medium truncate">
            <div className="text-sky-600 dark:text-sky-400 flex items-center">
              {getPanelIcon(norm, 13)}
            </div>
            <span className="truncate">{title}</span>
            <span className="text-[10px] text-gray-400 dark:text-neutral-500 font-mono bg-gray-200/60 dark:bg-neutral-800 px-1.5 py-0.5 rounded uppercase tracking-wider">
              Floating
            </span>
          </div>
        </div>

        {/* Right: Theme Toggle & Window Controls */}
        <div className="flex items-center h-full app-no-drag" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            className="h-full px-2.5 text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-100 hover:bg-gray-200 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center text-xs"
          >
            <VscColorMode size={14} />
          </button>
          <WindowControls />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        <div className={`h-full overflow-y-auto ${isFullWidthPanel ? 'p-3' : 'max-w-4xl mx-auto p-4'}`}>
          <PanelRenderer panel={norm} mode="popout" />
        </div>
      </main>
    </div>
  );
};

