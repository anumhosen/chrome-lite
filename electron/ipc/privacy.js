const { ipcMain, session: electronSession } = require("electron");

function registerPrivacyIpc({ modules, session }) {
  const getTargetSession = () => session || electronSession.defaultSession;

  // Blocker
  ipcMain.handle("chrome:blocker:get-stats", () => modules.blocker.service.getStats());
  ipcMain.handle("chrome:blocker:toggle", (e, enabled) => modules.blocker.service.toggle(enabled));

  // Network / Interceptor
  ipcMain.handle("chrome:interceptor:get-requests", (e, limit) => modules.interceptor.service.getRecentRequests(limit));
  ipcMain.handle("chrome:interceptor:replay", (e, requestId) => modules.interceptor.service.replayRequest(requestId));
  ipcMain.handle("chrome:interceptor:clear", () => modules.interceptor.service.clearRequests());
  ipcMain.handle("chrome:interceptor:get-mock-rules", () => modules.interceptor.service.getMockRules());
  ipcMain.handle("chrome:interceptor:save-mock-rule", (e, rule) => modules.interceptor.service.saveMockRule(rule));
  ipcMain.handle("chrome:interceptor:delete-mock-rule", (e, id) => modules.interceptor.service.deleteMockRule(id));
  ipcMain.handle("chrome:interceptor:toggle-mock-rule", (e, { id, enabled }) => modules.interceptor.service.toggleMockRule(id, enabled));
  ipcMain.handle("chrome:interceptor:generate-openapi", (e, domainFilter) => modules.interceptor.service.generateOpenApi(domainFilter));

  // Cookies
  ipcMain.handle("chrome:cookies:get", (e, filter) => modules.cookies.service.getCookies(getTargetSession(), filter));
  ipcMain.handle("chrome:cookies:export", () => modules.cookies.service.exportCookies(getTargetSession()));
  ipcMain.handle("chrome:cookies:remove", (e, { url, name }) => modules.cookies.service.removeCookie(getTargetSession(), url, name));
}

module.exports = registerPrivacyIpc;
