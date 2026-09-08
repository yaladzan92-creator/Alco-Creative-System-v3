const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { fork } = require('child_process');
const http = require('http');
const net = require('net');
const {
  evaluateStoredLicense,
  generateDeviceId,
  generateRequestCode,
  saveLicenseKey,
  removeStoredLicense,
} = require('./licenseVerifier.cjs');

let mainWindow = null;
let serverProcess = null;

// Register IPC handlers for ALCO License System
ipcMain.handle('alco-license-get-status', async () => {
  const userDataDir = app.getPath('userData');
  return evaluateStoredLicense(userDataDir);
});

ipcMain.handle('alco-license-get-device-id', async () => {
  return generateDeviceId();
});

ipcMain.handle('alco-license-get-request-code', async () => {
  const deviceId = generateDeviceId();
  return generateRequestCode(deviceId);
});

ipcMain.handle('alco-license-activate', async (_event, licenseKey) => {
  const userDataDir = app.getPath('userData');
  return saveLicenseKey(userDataDir, licenseKey);
});

ipcMain.handle('alco-license-remove', async () => {
  const userDataDir = app.getPath('userData');
  return removeStoredLicense(userDataDir);
});

function getFreePort(callback) {
  const server = net.createServer();
  server.listen(0, '127.0.0.1', () => {
    const port = server.address().port;
    server.close(() => {
      callback(port);
    });
  });
}

function checkServerReady(port, callback) {
  // Try calling the health endpoint (or any endpoint) to check if Express is listening
  const req = http.get(`http://127.0.0.1:${port}/api/bootstrap`, (res) => {
    if (res.statusCode >= 200 && res.statusCode < 500) {
      callback(true);
    } else {
      callback(false);
    }
  });
  req.on('error', () => callback(false));
  req.end();
}

function pollServer(port, callback) {
  let attempts = 0;
  const maxAttempts = 100; // 100 attempts * 100ms = 10 seconds
  const interval = setInterval(() => {
    checkServerReady(port, (ready) => {
      attempts++;
      if (ready) {
        clearInterval(interval);
        callback(true);
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        callback(false);
      }
    });
  }, 100);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "ALCO Creative System",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const isDev = !app.isPackaged || process.env.NODE_ENV === 'development';

  if (isDev) {
    const port = process.env.PORT || 3000;
    console.log(`[Electron] Development mode detected. Loading http://127.0.0.1:${port}`);
    mainWindow.loadURL(`http://127.0.0.1:${port}`);
  } else {
    console.log(`[Electron] Production mode detected. Selecting a dynamic available port...`);
    getFreePort((port) => {
      console.log(`[Electron] Selected port ${port}. Launching background Express server...`);
      const unpackedDir = path.join(process.resourcesPath, 'app.asar.unpacked');
      const distDir = path.join(unpackedDir, 'dist');
      const serverPath = path.join(distDir, 'server.cjs');
      const firebaseConfigPath = path.join(unpackedDir, 'firebase-applet-config.json');

      serverProcess = fork(serverPath, [], {
        cwd: distDir,
        env: {
          ...process.env,
          NODE_ENV: 'production',
          PORT: String(port),
          ELECTRON_RUN: 'true',
          APP_SERVER_DIR: distDir,
          FIREBASE_CONFIG_PATH: firebaseConfigPath
        }
      });

      serverProcess.on('error', (err) => {
        console.error('[Electron] Failed to start production express server:', err);
      });

      pollServer(port, (success) => {
        if (success) {
          console.log(`[Electron] Server is ready on port ${port}. Loading URL...`);
          mainWindow.loadURL(`http://127.0.0.1:${port}`);
        } else {
          console.error('[Electron] Local server did not respond in time.');
          const errorHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <title>ALCO Creative System Error</title>
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                  background-color: #f8fafc;
                  color: #0f172a;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  height: 100vh;
                  margin: 0;
                  text-align: center;
                }
                .container {
                  max-width: 480px;
                  padding: 32px;
                  background: white;
                  border-radius: 16px;
                  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
                  border: 1px solid #e2e8f0;
                }
                h1 { font-size: 20px; font-weight: 700; margin-bottom: 12px; color: #e11d48; }
                p { font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 24px; }
                button {
                  background-color: #0284c7;
                  color: white;
                  border: none;
                  padding: 10px 20px;
                  font-size: 14px;
                  font-weight: 600;
                  border-radius: 8px;
                  cursor: pointer;
                }
                button:hover { background-color: #0369a1; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>Koneksi Gagal</h1>
                <p>Gagal memulai server lokal untuk ALCO Creative System. Silakan coba buka kembali aplikasi ini atau hubungi tim teknis.</p>
                <button onclick="window.location.reload()">Muat Ulang</button>
              </div>
            </body>
            </html>
          `;
          mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(errorHtml)}`);
        }
      });
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
});
