const { ipcMain } = require("electron");

function registerWorkspacesIpc({ modules, browserService }) {
  ipcMain.handle("chrome:workspace:get-all", () => modules.workspaces.service.getWorkspaces());
  ipcMain.handle("chrome:workspace:create", (e, data) => modules.workspaces.service.createWorkspace(data));
  ipcMain.handle("chrome:workspace:switch", async (e, workspaceId) => {
    const currentWs = modules.workspaces.service.getActiveWorkspace();
    await browserService.saveSession(currentWs);
    modules.workspaces.service.setActiveWorkspace(workspaceId);
    let restored = await browserService.restoreSession(workspaceId);
    if (!restored || restored.length === 0) {
      browserService.createTab({ workspaceId, active: true });
    }
    return browserService.getTabs(workspaceId);
  });

  ipcMain.handle("chrome:profile:get-all", () => modules.profiles.service.getProfiles());
  ipcMain.handle("chrome:profile:create", (e, data) => modules.profiles.service.createProfile(data));
}

module.exports = registerWorkspacesIpc;
