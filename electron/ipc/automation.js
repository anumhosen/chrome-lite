const { ipcMain } = require("electron");
const webviewBridge = require("../services/browser/webview-bridge");

function registerAutomationIpc({ modules, getMainWindow }) {
  ipcMain.handle("chrome:automation:get-flows", async () => {
    return await modules.automation.service.getFlows();
  });

  ipcMain.handle("chrome:automation:save-flow", async (e, flow) => {
    return await modules.automation.service.saveFlow(flow);
  });

  ipcMain.handle("chrome:automation:delete-flow", async (e, id) => {
    return await modules.automation.service.deleteFlow(id);
  });

  ipcMain.handle("chrome:automation:run-flow", async (e, { tabId, flow }) => {
    const contents = webviewBridge.getContents(tabId);
    return await modules.automation.service.runFlow(contents, flow, (progress) => {
      const win = getMainWindow ? getMainWindow() : null;
      if (win && !win.isDestroyed()) {
        win.webContents.send("chrome:automation:progress", progress);
      }
    });
  });

  ipcMain.handle("chrome:automation:start-recorder", async (e, tabId) => {
    const contents = webviewBridge.getContents(tabId);
    return await modules.automation.service.startRecorder(contents);
  });

  ipcMain.handle("chrome:automation:stop-recorder", async (e, tabId) => {
    const contents = webviewBridge.getContents(tabId);
    return await modules.automation.service.stopRecorder(contents);
  });

  ipcMain.handle("chrome:automation:export-flow", async (e, flow) => {
    return await modules.automation.service.exportFlow(flow);
  });

  ipcMain.handle("chrome:automation:export-playwright", async (e, flow) => {
    return modules.automation.service.exportToPlaywright(flow);
  });

  // Scheduled Tasks & Headless Execution
  ipcMain.handle("chrome:automation:get-tasks", async () => {
    return await modules.automation.service.getScheduledTasks();
  });

  ipcMain.handle("chrome:automation:save-task", async (e, task) => {
    return await modules.automation.service.saveScheduledTask(task);
  });

  ipcMain.handle("chrome:automation:delete-task", async (e, id) => {
    return await modules.automation.service.deleteScheduledTask(id);
  });

  ipcMain.handle("chrome:automation:run-task-now", async (e, id) => {
    return await modules.automation.service.runScheduledTaskNow(id);
  });

  ipcMain.handle("chrome:automation:run-flow-headless", async (e, { flow, initialUrl }) => {
    return await modules.automation.service.runFlowHeadless(flow, initialUrl, (progress) => {
      const win = getMainWindow ? getMainWindow() : null;
      if (win && !win.isDestroyed()) {
        win.webContents.send("chrome:automation:progress", progress);
      }
    });
  });

  ipcMain.handle("chrome:automation:get-task-logs", async (e, { taskId, limit }) => {
    return await modules.automation.service.getTaskLogs(taskId, limit);
  });

  ipcMain.handle("chrome:automation:test-webhook", async (e, url) => {
    return await modules.automation.service.testWebhook(url);
  });
}

module.exports = registerAutomationIpc;
