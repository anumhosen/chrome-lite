const logger = require("../../services/logger").forSubsystem("UserscriptsEngine");

class UserscriptsEngine {
  parseMetadata(code = "") {
    const meta = {
      name: "Untitled Script",
      match: ["*"],
      runAt: "document-end",
      description: ""
    };

    const headerMatch = code.match(/\/\/\s*==UserScript==([\s\S]*?)\/\/\s*==\/UserScript==/);
    if (!headerMatch) return meta;

    const lines = headerMatch[1].split("\n");
    const matches = [];

    for (const line of lines) {
      const matchName = line.match(/\/\/\s*@name\s+(.*)/);
      if (matchName) meta.name = matchName[1].trim();

      const matchRule = line.match(/\/\/\s*@match\s+(.*)/);
      if (matchRule) matches.push(matchRule[1].trim());

      const matchRunAt = line.match(/\/\/\s*@run-at\s+(.*)/);
      if (matchRunAt) meta.runAt = matchRunAt[1].trim();

      const matchDesc = line.match(/\/\/\s*@description\s+(.*)/);
      if (matchDesc) meta.description = matchDesc[1].trim();
    }

    if (matches.length > 0) meta.match = matches;
    return meta;
  }

  matchesUrl(url, pattern) {
    if (!url || !pattern) return false;
    try {
      if (pattern === "*" || pattern === "<all_urls>") return true;
      const escaped = pattern
        .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
        .replace(/\*/g, ".*");
      const regex = new RegExp("^" + escaped + "$", "i");
      return regex.test(url);
    } catch {
      return false;
    }
  }

  async injectScript(webContents, script) {
    if (!webContents || !script.code) return;
    const scriptId = (script.id || "script").replace(/[^a-zA-Z0-9_]/g, "_");
    const scriptName = (script.name || "Userscript").replace(/"/g, '\\"');

    const wrapper = `
      (() => {
        // Chrome Tampermonkey / Greasemonkey Polyfill Bridge
        const GM_info = {
          script: {
            name: "${scriptName}",
            version: "1.0.0"
          }
        };

        function GM_addStyle(css) {
          const style = document.createElement("style");
          style.textContent = css;
          (document.head || document.documentElement).appendChild(style);
          return style;
        }

        function GM_setValue(key, value) {
          try {
            localStorage.setItem("__chrome_gm_${scriptId}_" + key, JSON.stringify(value));
          } catch (e) {}
        }

        function GM_getValue(key, defaultValue) {
          try {
            const val = localStorage.getItem("__chrome_gm_${scriptId}_" + key);
            return val !== null ? JSON.parse(val) : defaultValue;
          } catch (e) {
            return defaultValue;
          }
        }

        function GM_deleteValue(key) {
          try {
            localStorage.removeItem("__chrome_gm_${scriptId}_" + key);
          } catch (e) {}
        }

        function GM_listValues() {
          const prefix = "__chrome_gm_${scriptId}_";
          const keys = [];
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith(prefix)) keys.push(k.slice(prefix.length));
          }
          return keys;
        }

        function GM_log(...args) {
          console.log("[GM:${scriptName}]", ...args);
        }

        function GM_setClipboard(text) {
          if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
          }
        }

        function GM_xmlhttpRequest(details) {
          const { method = "GET", url, headers = {}, data, onload, onerror } = details;
          fetch(url, {
            method,
            headers,
            body: data
          }).then(async (res) => {
            const text = await res.text();
            if (onload) {
              onload({
                status: res.status,
                statusText: res.statusText,
                responseText: text,
                responseHeaders: Object.fromEntries(res.headers.entries())
              });
            }
          }).catch((err) => {
            if (onerror) onerror(err);
          });
        }

        try {
          ${script.code}
        } catch (err) {
          console.error("[Userscript Error: ${scriptName}]", err);
        }
      })();
    `;

    try {
      await webContents.executeJavaScript(wrapper);
      logger.info(`Injected userscript "${script.name}" with GM polyfill into ${webContents.getURL()}`);
    } catch (err) {
      logger.error(`Failed to inject userscript "${script.name}":`, err.message);
    }
  }
}

module.exports = new UserscriptsEngine();
