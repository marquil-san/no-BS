const { app, BrowserWindow, globalShortcut } = require("electron");

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // ❌ remove top menu bar
  win.setMenu(null);

  win.loadURL("http://localhost:5173");

  // F11 = maximize toggle
  globalShortcut.register("F11", () => {
    if (!win) return;

    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  });
}

app.whenReady().then(() => {
  createWindow();
});

// cleanup
app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});