const logger = require("../../services/logger").forSubsystem("Cookies");

class CookiesService {
  async getCookies(session, filter = {}) {
    if (!session) return [];
    try {
      return await session.cookies.get(filter);
    } catch (err) {
      logger.error("Failed to get cookies:", err.message);
      return [];
    }
  }

  async exportCookies(session) {
    if (!session) return [];
    try {
      const cookies = await session.cookies.get({});
      logger.info(`Exported ${cookies.length} cookies`);
      return cookies;
    } catch (err) {
      logger.error("Failed to export cookies:", err.message);
      return [];
    }
  }

  async importCookies(session, cookies = []) {
    if (!session || !Array.isArray(cookies)) return 0;
    let imported = 0;
    for (const cookie of cookies) {
      try {
        const url = (cookie.secure ? "https://" : "http://") + (cookie.domain ? cookie.domain.replace(/^\./, "") : "localhost") + (cookie.path || "/");
        await session.cookies.set({
          url,
          name: cookie.name,
          value: cookie.value,
          domain: cookie.domain,
          path: cookie.path,
          secure: cookie.secure,
          httpOnly: cookie.httpOnly,
          expirationDate: cookie.expirationDate
        });
        imported++;
      } catch (err) {
        logger.debug(`Failed to set cookie ${cookie.name}:`, err.message);
      }
    }
    logger.info(`Successfully imported ${imported}/${cookies.length} cookies`);
    return imported;
  }

  async removeCookie(session, url, name) {
    if (!session) return false;
    try {
      await session.cookies.remove(url, name);
      return true;
    } catch (err) {
      logger.error(`Failed to remove cookie ${name}:`, err.message);
      return false;
    }
  }
}

module.exports = new CookiesService();
