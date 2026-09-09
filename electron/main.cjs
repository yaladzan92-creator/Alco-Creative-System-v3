const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
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
let logFilePath = null;

function writeStartupLog(message, error) {
  const details = error ? ` ${error.stack || error.message || String(error)}` : '';
  const line = `[${new Date().toISOString()}] ${message}${details}`;
  console.log(line);

  if (!logFilePath) {
    return;
  }

  try {
    fs.appendFileSync(logFilePath, `${line}\n`, 'utf8');
  } catch (logError) {
    console.error('[Electron] Failed to write startup log:', logError);
  }
}

// Register IPC handlers for ALCO License System
ipcMain.handle('alco-license-get-status', async () => {
  const userDataDir = app.getPath('userData');
  return evaluateStoredLicense(userDataDir);
});

ipcMain.handle('alco-license-get-device-id', async () => {
  return generateDeviceId();
});

ipcMain.handle('alco-license-get-request-code', async (_event, options = {}) => {
  const deviceId = generateDeviceId();
  return generateRequestCode(deviceId, options);
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
  server.on('error', (err) => {
    writeStartupLog('[Electron] Failed to allocate a free local port.', err);
    callback(null);
  });
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
    writeStartupLog(`[Electron] Health check returned HTTP ${res.statusCode}.`);
    if (res.statusCode >= 200 && res.statusCode < 500) {
      callback(true);
    } else {
      callback(false);
    }
  });
  req.on('error', (err) => {
    writeStartupLog(`[Electron] Health check failed on port ${port}.`, err);
    callback(false);
  });
  req.end();
}

function pollServer(port, callback) {
  let attempts = 0;
  const maxAttempts = 200; // 200 attempts * 100ms = 20 seconds
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
  logFilePath = path.join(app.getPath('userData'), 'startup.log');
  writeStartupLog('[Electron] Starting ALCO Creative System.');
  writeStartupLog(`[Electron] executable=${process.execPath}`);
  writeStartupLog(`[Electron] appPath=${app.getAppPath()}`);
  writeStartupLog(`[Electron] resourcesPath=${process.resourcesPath}`);

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
    writeStartupLog(`[Electron] Development mode detected. Loading http://127.0.0.1:${port}`);
    mainWindow.loadURL(`http://127.0.0.1:${port}`);
  } else {
    writeStartupLog('[Electron] Production mode detected. Selecting a dynamic available port...');
    getFreePort((port) => {
      if (!port) {
        loadStartupError('Port lokal tidak tersedia untuk menjalankan server aplikasi.');
        return;
      }

      writeStartupLog(`[Electron] Selected port ${port}. Launching background Express server...`);
      const unpackedDir = path.join(process.resourcesPath, 'app.asar.unpacked');
      const distDir = path.join(unpackedDir, 'dist');
      const serverPath = path.join(distDir, 'server.cjs');
      const firebaseConfigPath = path.join(unpackedDir, 'firebase-applet-config.json');

      writeStartupLog(`[Electron] unpackedDir=${unpackedDir}`);
      writeStartupLog(`[Electron] distDir=${distDir}`);
      writeStartupLog(`[Electron] serverPath=${serverPath}`);
      writeStartupLog(`[Electron] firebaseConfigPath=${firebaseConfigPath}`);
      writeStartupLog(`[Electron] serverExists=${fs.existsSync(serverPath)}`);
      writeStartupLog(`[Electron] firebaseConfigExists=${fs.existsSync(firebaseConfigPath)}`);

      if (!fs.existsSync(serverPath)) {
        writeStartupLog('[Electron] Production server file is missing.');
        loadStartupError(`File server tidak ditemukan: ${serverPath}`);
        return;
      }

      serverProcess = spawn(process.execPath, [serverPath], {
        cwd: distDir,
        env: {
          ...process.env,
          ELECTRON_RUN_AS_NODE: '1',
          NODE_ENV: 'production',
          PORT: String(port),
          ELECTRON_RUN: 'true',
          APP_SERVER_DIR: distDir,
          FIREBASE_CONFIG_PATH: firebaseConfigPath
        },
        stdio: ['ignore', 'pipe', 'pipe']
      });

      writeStartupLog(`[Electron] Spawned server process pid=${serverProcess.pid}.`);

      serverProcess.stdout.on('data', (data) => {
        writeStartupLog(`[Server stdout] ${String(data).trimEnd()}`);
      });

      serverProcess.stderr.on('data', (data) => {
        writeStartupLog(`[Server stderr] ${String(data).trimEnd()}`);
      });

      serverProcess.on('error', (err) => {
        writeStartupLog('[Electron] Failed to start production express server:', err);
      });

      serverProcess.on('exit', (code, signal) => {
        writeStartupLog(`[Electron] Server process exited with code=${code} signal=${signal}.`);
      });

      pollServer(port, (success) => {
        if (success) {
          writeStartupLog(`[Electron] Server is ready on port ${port}. Loading URL...`);
          mainWindow.loadURL(`http://127.0.0.1:${port}`);
        } else {
          writeStartupLog('[Electron] Local server did not respond in time.');
          loadStartupError('Server lokal tidak merespons dalam batas waktu yang ditentukan.');
        }
      });
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function loadStartupError(reason) {
  writeStartupLog(`[Electron] Showing startup fallback. reason=${reason}`);
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
