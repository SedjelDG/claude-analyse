const { app, BrowserWindow, Menu } = require("electron");
const path = require("path");

// Determine if we are in dev mode or production
const isDev = !app.isPackaged;
const DEV_URL = "http://127.0.0.1:8080";

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: "Antigravity POS",
    icon: path.join(__dirname, "../public/favicon.ico"),
    backgroundColor: "#0f1729",
    show: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Remove the default menu bar for a cleaner native look
  Menu.setApplicationMenu(null);

  // Error handling — log and retry on failures
  win.webContents.on("did-fail-load", (event, errorCode, errorDescription, validatedURL) => {
    console.error(`Failed to load ${validatedURL}: ${errorDescription} (${errorCode})`);
    if (isDev) {
      console.log("Retrying in 2 seconds...");
      setTimeout(() => win.loadURL(DEV_URL), 2000);
    }
  });

  win.webContents.on("render-process-gone", (event, details) => {
    console.error("Render process gone:", details.reason);
  });

  // Load the app
  if (isDev) {
    win.loadURL(DEV_URL);
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  // Open DevTools with F12
  win.webContents.on("before-input-event", (event, input) => {
    if (input.key === "F12") {
      win.webContents.toggleDevTools();
    }
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
