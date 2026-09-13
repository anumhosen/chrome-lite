import React, { useEffect, useRef } from 'react';
import { useTabStore } from '../../stores/useTabStore';
import { InternalTabPage } from './InternalTabPage';
import { getChromeAPI, isElectronApp } from '../../lib/chrome';

export const Viewport: React.FC = () => {
  const { tabs, activeTabId } = useTabStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const viewsRef = useRef<Map<string, HTMLElement>>(new Map());

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const isInternalPage = Boolean(
    activeTab?.url && (activeTab.url.startsWith('chrome://') || activeTab.url.startsWith('chrome://'))
  );

  // Synchronize webview DOM nodes with tabs state
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const currentTabIds = new Set(tabs.map((t) => t.id));

    // Remove views for closed tabs
    for (const [id, el] of viewsRef.current.entries()) {
      if (!currentTabIds.has(id)) {
        try { el.remove(); } catch { }
        viewsRef.current.delete(id);
      }
    }

    // Mount views for newly opened tabs
    tabs.forEach((tab) => {
      if (viewsRef.current.has(tab.id)) return;

      const isElectron = isElectronApp();
      const isTabInternal = tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome://'));
      const initialSrc = isTabInternal ? 'about:blank' : (tab.url || 'https://www.google.com');

      if (isElectron) {
        const webview = document.createElement('webview') as any;
        webview.id = `view-${tab.id}`;
        webview.setAttribute('src', initialSrc);
        if (tab.partition) webview.setAttribute('partition', tab.partition);
        webview.setAttribute('allowpopups', 'true');
        webview.style.width = '100%';
        webview.style.height = '100%';
        webview.style.border = 'none';
        webview.style.display = tab.id === activeTabId && !isInternalPage ? 'flex' : 'none';

        const handleNav = (e: any) => {
          const navUrl = e?.url;
          if (navUrl && navUrl !== 'about:blank') {
            useTabStore.getState().updateTab({
              id: tab.id,
              url: navUrl,
              canGoBack: typeof webview.canGoBack === 'function' ? webview.canGoBack() : false,
              canGoForward: typeof webview.canGoForward === 'function' ? webview.canGoForward() : false,
            });
          }
        };

        webview.addEventListener('did-navigate', handleNav);
        webview.addEventListener('did-navigate-in-page', handleNav);
        webview.addEventListener('page-title-updated', (e: any) => {
          if (e.title) useTabStore.getState().updateTab({ id: tab.id, title: e.title });
        });
        webview.addEventListener('page-favicon-updated', (e: any) => {
          if (e.favicons?.[0]) useTabStore.getState().updateTab({ id: tab.id, favicon: e.favicons[0] });
        });
        webview.addEventListener('did-start-loading', () => {
          useTabStore.getState().updateTab({ id: tab.id, isLoading: true });
        });
        webview.addEventListener('did-stop-loading', () => {
          const cur = typeof webview.getURL === 'function' ? webview.getURL() : undefined;
          useTabStore.getState().updateTab({
            id: tab.id,
            isLoading: false,
            ...(cur && cur !== 'about:blank' ? { url: cur } : {}),
            canGoBack: typeof webview.canGoBack === 'function' ? webview.canGoBack() : false,
            canGoForward: typeof webview.canGoForward === 'function' ? webview.canGoForward() : false,
          });
        });

        webview.addEventListener('dom-ready', () => {
          try {
            const contentsId = webview.getWebContentsId?.();
            const api = getChromeAPI();
            if (contentsId && api?.tabs?.bindContents) {
              api.tabs.bindContents(tab.id, contentsId);
            }
          } catch (err) {
            console.debug('Failed to bind webContentsId:', err);
          }
          const cur = typeof webview.getURL === 'function' ? webview.getURL() : undefined;
          if (cur && cur !== 'about:blank') {
            useTabStore.getState().updateTab({ id: tab.id, url: cur });
          }
        });

        container.appendChild(webview);
        viewsRef.current.set(tab.id, webview);
      } else {
        const iframe = document.createElement('iframe');
        iframe.id = `view-${tab.id}`;
        iframe.src = initialSrc;
        iframe.className = 'w-full h-full border-none bg-white';
        iframe.style.display = tab.id === activeTabId && !isInternalPage ? 'block' : 'none';
        iframe.sandbox.add('allow-scripts', 'allow-same-origin', 'allow-forms');
        container.appendChild(iframe);
        viewsRef.current.set(tab.id, iframe);
      }
    });
  }, [tabs, activeTabId, isInternalPage]);

  // Update visibility when active tab or internal page status changes
  useEffect(() => {
    for (const [id, el] of viewsRef.current.entries()) {
      el.style.display = id === activeTabId && !isInternalPage ? 'flex' : 'none';
    }
  }, [activeTabId, isInternalPage]);

  // Handle direct tab navigation IPC events (fallback if not already loaded by main process WebContents)
  useEffect(() => {
    const api = getChromeAPI();
    if (!api?.on) return;

    const unsub = api.on('chrome:tab-navigated', (data: any) => {
      const tabId = data?.tabId;
      const url = data?.url;
      if (!tabId || !url || url.startsWith('chrome://')) return;

      const view = viewsRef.current.get(tabId) as any;
      if (view && !data?.navigatedViaContents) {
        try {
          const currentUrl = typeof view.getURL === 'function' ? view.getURL() : view.src;
          if (currentUrl !== url) {
            if (typeof view.loadURL === 'function') {
              view.loadURL(url).catch(() => {});
            } else {
              view.src = url;
            }
          }
        } catch {
          view.src = url;
        }
      }
    });

    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  return (
    <main className="flex-1 relative bg-white dark:bg-neutral-950 overflow-hidden flex flex-col min-w-0">
      <div
        ref={containerRef}
        id="webview-container"
        className={`w-full h-full relative ${isInternalPage ? 'hidden' : 'block'}`}
      />
      {isInternalPage && activeTab?.url && (
        <div className="absolute inset-0 z-10 w-full h-full">
          <InternalTabPage url={activeTab.url} />
        </div>
      )}
    </main>
  );
};

