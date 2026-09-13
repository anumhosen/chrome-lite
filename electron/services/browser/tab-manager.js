const { v4: uuidv4 } = require("crypto");
const logger = require("../logger").forSubsystem("TabManager");
const config = require("../config");

class TabManager {
  constructor() {
    this.tabs = new Map(); // tabId -> Tab object
    this.activeTabId = null;
    this.activeWorkspaceId = "personal";
  }

  generateId() {
    return "tab_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 6);
  }

  createTab({ url, workspaceId, profileId = "default", active = true } = {}) {
    let targetUrl = url || config.get("newTabUrl") || config.get("homepage", "https://duckduckgo.com");
    if (targetUrl.startsWith("chrome://")) {
      targetUrl = "chrome://" + targetUrl.slice(9);
    }
    const wsId = workspaceId || this.activeWorkspaceId;
    const id = this.generateId();

    let initialTitle = "New Tab";
    if (targetUrl.startsWith("chrome://")) {
      const page = targetUrl.replace("chrome://", "").split("/")[0].toLowerCase();
      const TITLES = {
        settings: "Settings",
        history: "History",
        downloads: "Downloads",
        bookmarks: "Bookmarks",
        notebook: "Chrome Notebook",
        explorer: "Resource Explorer",
        interceptor: "API Inspector",
        userscripts: "Userscripts Manager",
        scraper: "Scraper Builder",
        "scraper-builder": "Scraper Builder",
        scrapper: "Scraper Builder",
        "scrapper-builder": "Scraper Builder",
        scraperbuilder: "Scraper Builder",
        scrapperbuilder: "Scraper Builder",
        memory: "System Performance",
        system: "System Performance",
        console: "Developer Console"
      };
      initialTitle = TITLES[page] || (page.charAt(0).toUpperCase() + page.slice(1));
    }

    const tab = {
      id,
      url: targetUrl,
      title: initialTitle,
      favicon: null,
      workspaceId: wsId,
      profileId,
      partition: `persist:profile_${profileId}`,
      isLoading: false,
      canGoBack: false,
      canGoForward: false,
      isMuted: false,
      createdAt: Date.now(),
      lastActive: Date.now(),
      isHibernated: false
    };

    this.tabs.set(id, tab);
    logger.info(`Created tab ${id} in workspace ${wsId} with URL ${url}`);

    if (active) {
      this.activeTabId = id;
    }

    return tab;
  }

  getTab(id) {
    return this.tabs.get(id) || null;
  }

  getActiveTab() {
    return this.tabs.get(this.activeTabId) || null;
  }

  getTabsForWorkspace(workspaceId) {
    const list = [];
    for (const tab of this.tabs.values()) {
      if (tab.workspaceId === workspaceId) {
        list.push(tab);
      }
    }
    return list;
  }

  activateTab(id) {
    const tab = this.tabs.get(id);
    if (!tab) return null;

    tab.lastActive = Date.now();
    tab.isHibernated = false;
    this.activeTabId = id;
    this.activeWorkspaceId = tab.workspaceId;
    return tab;
  }

  updateTab(id, updates) {
    const tab = this.tabs.get(id);
    if (!tab) return null;

    Object.assign(tab, updates);
    return tab;
  }

  closeTab(id) {
    const tab = this.tabs.get(id);
    if (!tab) return null;

    const wsId = tab.workspaceId;
    this.tabs.delete(id);
    logger.info(`Closed tab ${id}`);

    if (this.activeTabId === id) {
      const remaining = this.getTabsForWorkspace(wsId);
      if (remaining.length > 0) {
        this.activeTabId = remaining[remaining.length - 1].id;
      } else {
        const newTab = this.createTab({ workspaceId: wsId, active: true });
        this.activeTabId = newTab.id;
      }
    }

    return { closedId: id, activeTabId: this.activeTabId };
  }

  hibernateInactiveTabs(maxAgeMs = 15 * 60 * 1000) {
    const now = Date.now();
    let hibernatedCount = 0;

    for (const [id, tab] of this.tabs.entries()) {
      if (id !== this.activeTabId && !tab.isHibernated && now - tab.lastActive > maxAgeMs) {
        tab.isHibernated = true;
        hibernatedCount++;
      }
    }

    if (hibernatedCount > 0) {
      logger.info(`Hibernated ${hibernatedCount} inactive tabs to preserve RAM`);
    }
    return hibernatedCount;
  }

  serializeState(workspaceId) {
    const tabs = this.getTabsForWorkspace(workspaceId);
    return JSON.stringify({
      activeTabId: this.activeTabId,
      tabs: tabs.map(t => ({
        id: t.id,
        url: t.url,
        title: t.title,
        workspaceId: t.workspaceId,
        profileId: t.profileId
      }))
    });
  }

  restoreState(serializedState) {
    try {
      const parsed = JSON.parse(serializedState);
      if (!parsed || !Array.isArray(parsed.tabs)) return [];

      const restoredTabs = [];
      for (const t of parsed.tabs) {
        const restored = this.createTab({
          url: t.url || "https://duckduckgo.com",
          workspaceId: t.workspaceId || "personal",
          profileId: t.profileId || "default",
          active: false
        });
        restored.title = t.title || "Restored Tab";
        restoredTabs.push(restored);
      }

      if (restoredTabs.length > 0) {
        this.activeTabId = restoredTabs[0].id;
      }
      return restoredTabs;
    } catch (err) {
      logger.error("Failed to restore tab state:", err.message);
      return [];
    }
  }
}

module.exports = new TabManager();
