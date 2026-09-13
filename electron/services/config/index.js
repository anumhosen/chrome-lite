const fs = require("fs");
const path = require("path");

class ConfigService {
  constructor() {
    this.configPath = path.join(__dirname, "../../data/config.json");
    this.defaultConfig = require("./default-config.json");
    this.config = this.loadConfig();
  }

  loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const raw = fs.readFileSync(this.configPath, "utf-8");
        const parsed = JSON.parse(raw);
        return {
          features: { ...this.defaultConfig.features, ...(parsed.features || {}) },
          settings: { ...this.defaultConfig.settings, ...(parsed.settings || {}) }
        };
      }
    } catch (err) {
      console.error("[ConfigService] Failed to read user config, using defaults:", err.message);
    }
    return JSON.parse(JSON.stringify(this.defaultConfig));
  }

  saveConfig() {
    try {
      const dataDir = path.dirname(this.configPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), "utf-8");
    } catch (err) {
      console.error("[ConfigService] Failed to save config:", err.message);
    }
  }

  isFeatureEnabled(featureName) {
    if (!this.config.features) return false;
    return Boolean(this.config.features[featureName]);
  }

  get(key, defaultValue = null) {
    if (this.config.settings && key in this.config.settings) {
      return this.config.settings[key];
    }
    return defaultValue;
  }

  set(key, value) {
    if (!this.config.settings) {
      this.config.settings = {};
    }
    this.config.settings[key] = value;
    this.saveConfig();
  }

  setFeature(featureName, enabled) {
    if (!this.config.features) {
      this.config.features = {};
    }
    this.config.features[featureName] = Boolean(enabled);
    this.saveConfig();
  }

  getAll() {
    return JSON.parse(JSON.stringify(this.config));
  }
}

module.exports = new ConfigService();
