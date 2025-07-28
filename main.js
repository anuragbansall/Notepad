import { app, BrowserWindow, ipcMain, dialog } from "electron";
import fs from "fs";
import path from "path";

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile("index.html");
}

ipcMain.on("open-file-dialog", async (event) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    filters: [
      { name: "Text Files", extensions: ["txt", "md"] },
      { name: "All Files", extensions: ["*"] },
    ],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0];
    const fileContent = fs.readFileSync(filePath, "utf-8");

    event.sender.send("file-opened", {
      filePath,
      fileContent,
    });
  }
});

ipcMain.on("save-file-dialog", async (event, content, title) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: title.replace("Notepad - ", ""),
    filters: [
      { name: "Text Files", extensions: ["txt", "md"] },
      { name: "All Files", extensions: ["*"] },
    ],
  });

  if (!result.canceled && result.filePath) {
    fs.writeFileSync(result.filePath, content, "utf-8");
    event.sender.send("file-saved", result.filePath);
  }
});

app.whenReady().then(createWindow);
