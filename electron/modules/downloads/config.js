const path = require("path");
const { app } = require("electron");

module.exports = {
  enabled: true,
  downloadPath: app ? app.getPath("downloads") : path.join(process.cwd(), "downloads")
};
