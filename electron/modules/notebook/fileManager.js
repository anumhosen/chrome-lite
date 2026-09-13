const storage = require("./storage");
const logger = require("../../services/logger").forSubsystem("NotebookFileManager");

class NotebookFileManager {
  listLibrary() {
    return storage.listFiles();
  }

  open(filename) {
    try {
      const content = storage.readFile(filename);
      return { filename, content, success: true };
    } catch (err) {
      logger.error(`Open error for ${filename}:`, err.message);
      throw err;
    }
  }

  openFile(filePath) {
    return this.open(filePath);
  }

  save(filename, content) {
    try {
      const savedPath = storage.writeFile(filename, content);
      return { filename, path: savedPath, success: true };
    } catch (err) {
      logger.error(`Save error for ${filename}:`, err.message);
      throw err;
    }
  }

  saveFile(filePath, content) {
    return this.save(filePath, content);
  }

  saveAs(newFilename, content) {
    let name = newFilename.trim();
    if (!name.includes(".")) {
      name += ".ijsnb";
    }
    return this.save(name, content);
  }

  async chooseAndOpenFile(parentWindow) {
    const { dialog } = require("electron");
    const result = await dialog.showOpenDialog(parentWindow, {
      title: "Open Notebook (*.ijsnb, *.ipynb)",
      properties: ["openFile"],
      filters: [
        { name: "Supported Notebooks (*.ijsnb, *.ipynb, *.json)", extensions: ["ijsnb", "ipynb", "json", "js", "txt"] },
        { name: "JavaScript Notebook (*.ijsnb)", extensions: ["ijsnb"] },
        { name: "Jupyter Notebook (*.ipynb)", extensions: ["ipynb"] },
        { name: "All Files", extensions: ["*"] }
      ]
    });
    if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      const res = this.open(filePath);
      return { filePath, content: res.content, success: true };
    }
    return { canceled: true };
  }

  async chooseAndSaveFile(parentWindow, content, defaultPath = "notebook.ijsnb") {
    const { dialog } = require("electron");
    const result = await dialog.showSaveDialog(parentWindow, {
      title: "Save Notebook",
      defaultPath: defaultPath || "notebook.ijsnb",
      filters: [
        { name: "JavaScript Notebook (*.ijsnb)", extensions: ["ijsnb"] },
        { name: "Jupyter Notebook (*.ipynb)", extensions: ["ipynb"] },
        { name: "HTML Report (*.html)", extensions: ["html"] },
        { name: "JSON Notebook (*.json)", extensions: ["json"] },
        { name: "All Files", extensions: ["*"] }
      ]
    });
    if (!result.canceled && result.filePath) {
      const savedPath = storage.writeFile(result.filePath, content);
      return { filePath: savedPath, success: true };
    }
    return { canceled: true };
  }
}

module.exports = new NotebookFileManager();
