const history = require("./history");
const logger = require("../../services/logger").forSubsystem("ScriptRunner");

class ScriptRunner {
  async runScript(webContents, code, options = {}) {
    if (!webContents) {
      throw new Error("No active webContents provided to execute script");
    }

    const { notebookId = null, tabId = null } = options;
    const currentUrl = webContents.getURL ? webContents.getURL() : "";
    const startTime = Date.now();

    // Wrap script execution safely in async IIFE with error and return capture
    const wrappedCode = `
      (async () => {
        try {
          const result = await (async () => {
            ${code}
          })();

          if (result === undefined) return { __chrome_type: "undefined" };
          if (result === null) return { __chrome_type: "null" };
          if (typeof result === "object") {
            try {
              return JSON.parse(JSON.stringify(result));
            } catch {
              return String(result);
            }
          }
          return result;
        } catch (err) {
          return { __chrome_error: err.message || String(err), stack: err.stack };
        }
      })()
    `;

    try {
      const evalResult = await webContents.executeJavaScript(wrappedCode, true);
      const durationMs = Date.now() - startTime;

      if (evalResult && evalResult.__chrome_error) {
        await history.recordRun({
          notebookId,
          tabId,
          url: currentUrl,
          status: "error",
          output: "",
          error: evalResult.__chrome_error,
          durationMs
        });
        return {
          success: false,
          error: evalResult.__chrome_error,
          stack: evalResult.stack,
          durationMs,
          url: currentUrl
        };
      }

      let finalOutput = evalResult;
      if (evalResult && evalResult.__chrome_type === "undefined") finalOutput = "undefined";
      if (evalResult && evalResult.__chrome_type === "null") finalOutput = null;

      const outputStr = typeof finalOutput === "object" ? JSON.stringify(finalOutput, null, 2) : String(finalOutput);

      await history.recordRun({
        notebookId,
        tabId,
        url: currentUrl,
        status: "success",
        output: outputStr,
        error: null,
        durationMs
      });

      return {
        success: true,
        result: finalOutput,
        outputStr,
        durationMs,
        url: currentUrl
      };
    } catch (execErr) {
      const durationMs = Date.now() - startTime;
      logger.error("Execution failed:", execErr.message);

      await history.recordRun({
        notebookId,
        tabId,
        url: currentUrl,
        status: "error",
        output: "",
        error: execErr.message,
        durationMs
      });

      return {
        success: false,
        error: execErr.message,
        durationMs,
        url: currentUrl
      };
    }
  }

  matchesPattern(url, pattern) {
    if (!url || !pattern) return false;
    try {
      const trimmed = pattern.trim();
      if (trimmed === "*" || trimmed === "<all_urls>") return true;

      const escaped = trimmed
        .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
        .replace(/\*/g, ".*");
      const regex = new RegExp("^" + escaped + "$", "i");

      // Check against full URL or just hostname
      const parsed = new URL(url);
      return regex.test(url) || regex.test(parsed.hostname);
    } catch {
      return false;
    }
  }
}

module.exports = new ScriptRunner();
