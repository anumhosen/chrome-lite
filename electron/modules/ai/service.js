const http = require("http");
const defaultConfig = require("./config");
const logger = require("../../services/logger").forSubsystem("AI");

class AIService {
  constructor() {
    this.config = { ...defaultConfig };
  }

  async requestOllama(prompt, model = this.config.defaultModel) {
    return new Promise((resolve, reject) => {
      const payload = JSON.stringify({
        model,
        prompt,
        stream: false
      });

      const url = new URL(this.config.ollamaEndpoint + "/api/generate");
      const req = http.request(
        {
          hostname: url.hostname,
          port: url.port || 11434,
          path: url.pathname,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(payload)
          },
          timeout: this.config.timeoutMs
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            try {
              const parsed = JSON.parse(data);
              resolve(parsed.response || "");
            } catch (err) {
              reject(new Error("Failed to parse Ollama response"));
            }
          });
        }
      );

      req.on("error", (err) => {
        logger.warn("Ollama connection error:", err.message);
        reject(err);
      });

      req.on("timeout", () => {
        req.destroy();
        reject(new Error("Ollama request timed out"));
      });

      req.write(payload);
      req.end();
    });
  }

  async summarizePage(content) {
    const truncated = content.substring(0, 4000);
    const prompt = `Summarize the following web page content concisely for a developer:\n\n${truncated}`;
    return await this.requestOllama(prompt);
  }

  async generateSelector(htmlSnippet, targetText) {
    const prompt = `Given this HTML snippet:\n${htmlSnippet}\n\nProvide the most reliable CSS selector to extract: "${targetText}". Return ONLY the CSS selector string.`;
    return await this.requestOllama(prompt);
  }
}

module.exports = new AIService();
