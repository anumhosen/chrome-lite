import React, { useEffect } from 'react';
import { ChromeTabStrip } from '../topbar/ChromeTabStrip';
import { ChromeToolbar } from '../omnibox/ChromeToolbar';
import { BookmarksBar } from '../bookmarks/BookmarksBar';
import { Sidebar } from '../sidebar/Sidebar';
import { Viewport } from './Viewport';
import { ChromeSidePanel } from '../sidepanel/ChromeSidePanel';
import { StatusBar } from '../statusbar/StatusBar';
import { useTabStore } from '../../stores/useTabStore';
import { usePanelStore } from '../../stores/usePanelStore';
import { useThemeStore } from '../../stores/useThemeStore';
import { useSettingsStore } from '../../stores/useSettingsStore';

export const AppLayout: React.FC = () => {
  const { initTabs, createTab, closeTab } = useTabStore();
  const { togglePanel } = usePanelStore();
  const { initTheme } = useThemeStore();
  const { showStatusBar, showBookmarksBar, showDeveloperSidebar, toggleBookmarksBar, initSettings } = useSettingsStore();

  useEffect(() => {
    initTheme();
    initSettings();
    initTabs();
  }, [initTheme, initSettings, initTabs]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+T: New Tab
      if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        createTab('chrome://newtab');
      }
      // Ctrl+W: Close Tab
      else if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        const currentActive = useTabStore.getState().activeTabId;
        if (currentActive) closeTab(currentActive);
      }
      // Ctrl+Shift+B: Toggle Bookmarks Bar
      else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleBookmarksBar();
      }
      // Ctrl+H: History
      else if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        createTab('chrome://history');
      }
      // Ctrl+J: Downloads
      else if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        createTab('chrome://downloads');
      }
      // Ctrl+Shift+O: Bookmark Manager
      else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        createTab('chrome://bookmarks');
      }
      // Ctrl+`: Toggle Console Side Panel
      else if (e.ctrlKey && e.key === '`') {
        e.preventDefault();
        togglePanel('console');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [createTab, closeTab, togglePanel, toggleBookmarksBar]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-white dark:bg-neutral-900 text-gray-900 dark:text-neutral-100">
      {/* Chrome Tab Strip (Title bar) */}
      <ChromeTabStrip />

      {/* Chrome Navigation Toolbar */}
      <ChromeToolbar />

      {/* Toggleable Chrome Bookmarks Bar */}
      {showBookmarksBar && <BookmarksBar />}

      {/* Main Workspace Area */}
      <div className="flex-1 relative flex min-w-0 overflow-hidden">
        {/* Optional Developer Activity Bar (Toggleable in Settings or 3-dots menu) */}
        {showDeveloperSidebar && <Sidebar />}

        {/* Viewport for Webviews and Internal Chrome Pages */}
        <Viewport />

        {/* Chrome Native Right-Hand Side Panel */}
        <ChromeSidePanel />
      </div>

      {/* Optional Status Bar */}
      {showStatusBar && <StatusBar />}
    </div>
  );
};
