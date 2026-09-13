const { BrowserWindow } = require("electron");
const logger = require("../../services/logger").forSubsystem("HeadlessRunner");

/**
 * Executes an automation flow headlessly in a hidden background BrowserWindow
 * without disrupting active tabs or windows.
 */
class HeadlessRunner {
  async runFlow(automationService, flowData, initialUrl = null, onProgress = null) {
    let win = null;
    const startTime = Date.now();

    try {
      logger.info(`Launching headless execution context for flow: "${flowData.name || flowData.id || 'Flow'}"`);

      win = new BrowserWindow({
        show: false,
        width: 1280,
        height: 800,
        webPreferences: {
          offscreen: false,
          contextIsolation: true,
          nodeIntegration: false,
          backgroundThrottling: false, // Maintain full JS execution speed when hidden
        }
      });

      // Navigate to initial target URL if specified
      if (initialUrl && initialUrl.startsWith("http")) {
        logger.info(`Headless navigating to initial URL: ${initialUrl}`);
        await win.loadURL(initialUrl);
        await new Promise((resolve) => {
          const timeout = setTimeout(resolve, 10000);
          win.webContents.once("did-finish-load", () => {
            clearTimeout(timeout);
            resolve();
          });
        });
      }

      // Execute the flow steps using automationService
      const result = await automationService.runFlow(win.webContents, flowData, onProgress);

      logger.info(
        `Headless flow finished: ${result.success ? "SUCCESS" : "FAILED"} (${result.completedSteps}/${result.totalSteps} steps in ${result.durationMs}ms)`
      );

      return {
        ...result,
        durationMs: Date.now() - startTime
      };
    } catch (err) {
      logger.error("Headless execution error:", err.message);
      return {
        success: false,
        error: err.message,
        durationMs: Date.now() - startTime,
        completedSteps: 0,
        totalSteps: flowData.steps?.length || 0,
        log: []
      };
    } finally {
      if (win && !win.isDestroyed()) {
        try {
          win.destroy();
        } catch {}
      }
    }
  }
}

module.exports = new HeadlessRunner();
