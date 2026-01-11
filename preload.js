const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  /* window control */
  setFullscreen: (v) => ipcRenderer.send("set-fullscreen", v),
  setMaximize: (v) => ipcRenderer.send("set-maximize", v),
  setSubject: (s) => ipcRenderer.send("set-subject", s),
  allowClose: () => ipcRenderer.send("allow-close"),

  /* system info */
  getActiveWindow: () => ipcRenderer.invoke("get-active-window"),

  /* events */
  onFullscreenChange: (cb) =>
    ipcRenderer.on("fullscreen-changed", (_, v) => cb(v)),

  onWindowShrinked: (cb) =>
    ipcRenderer.on("window-shrinked", (_, d) => cb(d)),

  onClickedX: (cb) =>
    ipcRenderer.on("clicked-x", (_, d) => cb(d))
});
