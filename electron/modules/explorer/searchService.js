class SearchService {
  filterAssets(assets = [], filters = {}) {
    const { query = "", type = "all", domain = "all" } = filters;
    const lowerQuery = (query || "").toLowerCase();

    return assets.filter((ast) => {
      if (type !== "all" && ast.type !== type) return false;
      if (domain !== "all" && ast.domain !== domain) return false;

      if (lowerQuery) {
        const matchUrl = ast.url.toLowerCase().includes(lowerQuery);
        const matchName = (ast.filename || "").toLowerCase().includes(lowerQuery);
        return matchUrl || matchName;
      }
      return true;
    });
  }

  getAvailableDomains(assets = []) {
    return Array.from(new Set(assets.map((a) => a.domain).filter(Boolean)));
  }

  getAssetCountsByType(assets = []) {
    const counts = { all: assets.length };
    for (const a of assets) {
      counts[a.type] = (counts[a.type] || 0) + 1;
    }
    return counts;
  }
}

module.exports = new SearchService();
