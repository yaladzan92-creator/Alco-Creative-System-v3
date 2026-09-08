const { contextBridge, ipcRenderer } = require('electron');

// Safe, minimal IPC exposure for ALCO License System
contextBridge.exposeInMainWorld('alcoLicense', {
  getStatus: () => ipcRenderer.invoke('alco-license-get-status'),
  getDeviceId: () => ipcRenderer.invoke('alco-license-get-device-id'),
  getRequestCode: (options) => ipcRenderer.invoke('alco-license-get-request-code', options),
  activate: (licenseKey) => ipcRenderer.invoke('alco-license-activate', licenseKey),
  removeLicense: () => ipcRenderer.invoke('alco-license-remove'),
  isElectron: true,
});

contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,
  isElectron: true,
});
