module.exports = {
  enabled: true,
  defaultWorkspaceId: "personal",
  workspaces: [
    { id: "personal", name: "Personal", icon: "compass", type: "personal" },
    { id: "research", name: "Research", icon: "book", type: "research" },
    { id: "dev", name: "Development", icon: "code", type: "dev" },
    { id: "scraping", name: "Scraping", icon: "database", type: "scraping" }
  ]
};
