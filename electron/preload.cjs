const { contextBridge } = require('electron');

// Expose a safe bridge to the renderer process
contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,
  isElectron: true
});
