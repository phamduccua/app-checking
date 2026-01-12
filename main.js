const { app, BrowserWindow, ipcMain, session } = require("electron");
const path = require("path");
const activeWin = require("active-win");

const APP_TOKEN = "app-checking-token";

let mainWindow;
let subject = null;
let shrinkSent = false;
let allowClose = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true
    }
  });

  mainWindow.loadFile("index.html");

  /* ===== FULLSCREEN ===== */
  mainWindow.on("enter-full-screen", () => {
    shrinkSent = false;
    mainWindow.webContents.send("fullscreen-changed", true);
  });

  mainWindow.on("leave-full-screen", () => {
    mainWindow.webContents.send("fullscreen-changed", false);
    checkWindowState();
  });

  /* ===== MAXIMIZE / RESIZE ===== */
  mainWindow.on("maximize", () => shrinkSent = false);
  mainWindow.on("unmaximize", checkWindowState);
  mainWindow.on("resize", checkWindowState);

  /* ===== CLICK ===== */
  mainWindow.on("close", (e) => {
    if (allowClose || !subject) return;
    e.preventDefault();
    mainWindow.webContents.send("clicked-x", { subject });
  });
}

function checkWindowState() {
  if (!mainWindow || !subject || shrinkSent) return;

  const isFullscreen = mainWindow.isFullScreen();
  const isMaximized = mainWindow.isMaximized();

  if (!isFullscreen && !isMaximized) {
    shrinkSent = true;
    mainWindow.webContents.send("window-shrinked", { subject });
  }
}

/* ===== APP ===== */
app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

/* ===== IPC ===== */
ipcMain.handle("get-active-window", async () => {
  try {
    const win = await activeWin();
    if (!win || !win.title) return null;
    return win;
  } catch {
    return null;
  }
});

ipcMain.on("set-fullscreen", (_, v) => mainWindow?.setFullScreen(v));
ipcMain.on("set-maximize", (_, v) => v ? mainWindow?.maximize() : mainWindow?.unmaximize());

ipcMain.on("set-subject", (_, v) => {
  subject = v;
  shrinkSent = false;
});

ipcMain.on("allow-close", () => {
  allowClose = true;
  app.quit();
});

/* ===== WEBVIEW TOKEN ===== */
app.whenReady().then(() => {
  const s = session.fromPartition("persist:exam");
  s.webRequest.onBeforeSendHeaders((details, cb) => {
    details.requestHeaders["X-App-Token"] = APP_TOKEN;
    cb({ requestHeaders: details.requestHeaders });
  });
});
