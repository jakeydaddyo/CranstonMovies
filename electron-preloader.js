const { contextBridge, ipcRenderer } = require("electron");
   
contextBridge.exposeInMainWorld("ipcRenderer", {ipcRenderer, on: (channel, func) => ipcRenderer.on (channel, func)});
