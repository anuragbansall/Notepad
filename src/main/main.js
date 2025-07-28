import { app, BrowserWindow, ipcMain, dialog } from "electron";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    icon: path.join(__dirname, "../assets/icon.png"), // Add icon when available
  });

  // Load the HTML file from the renderer directory
  mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));

  // Optional: Open DevTools in development
  // mainWindow.webContents.openDevTools();
}

ipcMain.on("open-file-dialog", async (event) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    filters: [
      {
        name: "Text Files",
        extensions: ["txt", "md", "js", "css", "html", "json"],
      },
      { name: "All Files", extensions: ["*"] },
    ],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0];
    try {
      const fileContent = fs.readFileSync(filePath, "utf-8");
      event.sender.send("file-opened", {
        filePath,
        fileContent,
      });
    } catch (error) {
      console.error("Error reading file:", error);
      event.sender.send("file-error", {
        message: "Failed to open file",
        error: error.message,
      });
    }
  }
});

ipcMain.on("save-file-dialog", async (event, content, title) => {
  const defaultName = title
    .replace("Padman - ", "")
    .replace("New File", "untitled.txt");

  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName,
    filters: [
      {
        name: "Text Files",
        extensions: ["txt", "md", "js", "css", "html", "json"],
      },
      { name: "All Files", extensions: ["*"] },
    ],
  });

  if (!result.canceled && result.filePath) {
    try {
      fs.writeFileSync(result.filePath, content, "utf-8");
      event.sender.send("file-saved", result.filePath);
    } catch (error) {
      console.error("Error saving file:", error);
      event.sender.send("file-error", {
        message: "Failed to save file",
        error: error.message,
      });
    }
  }
});

// App event handlers
app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
