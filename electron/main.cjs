const { app, BrowserWindow, Menu, shell, dialog, ipcMain } = require('electron');
const path = require('path');
const { spawn, exec, fork } = require('child_process');
const isDev = require('electron-is-dev');
const fs = require('fs');
const os = require('os');

let mainWindow;
let serverProcess;

function checkDatabase() {
  return new Promise((resolve) => {
    const dbUrl = process.env.DATABASE_URL || 'postgresql://cysploit:cysploit@localhost:5432/cysploit_db';
    console.log(`[Electron Main] Checking database with URL: ${dbUrl}`);
    exec(`node -e "const { Client } = require('pg'); const client = new Client('${dbUrl}'); client.connect().then(() => { console.log('[DB Check] Connected'); client.end(); process.exit(0); }).catch(err => { console.error('[DB Check Error]', err.message); process.exit(1); })"`, (error, stdout, stderr) => {
      if (error) {
        console.error('[Electron Main] Database connection failed via check:', stderr.trim() || error.message);
        resolve(false);
      } else {
        console.log('[Electron Main] Database connection successful via check.');
        resolve(true);
      }
    });
  });
}

function startBackendServer() {
  return new Promise(async (resolve, reject) => {
    console.log('[Electron Main] Attempting to start backend server...');

    const dbIsAvailable = await checkDatabase();
    if (!dbIsAvailable) {
      console.warn('[Electron Main] Database not available, server might have issues connecting.');
    }

    if (isDev) {
      console.log('[Electron Main] In development, server is expected to be running via "npm run dev".');
      setTimeout(resolve, 3000);
    } else {
      const serverScriptPath = path.join(__dirname, '..', 'server', 'index.js');
      console.log(`[Electron Main] Production mode. Forking server script: ${serverScriptPath}`);

      if (!fs.existsSync(serverScriptPath)) {
        console.error(`[Electron Main] Server script not found at: ${serverScriptPath}`);
        dialog.showErrorBox("Server Error", `Packaged server script not found: ${serverScriptPath}`);
        return reject(new Error('Server script not found.'));
      }

      serverProcess = fork(
        serverScriptPath,
        [],
        {
          stdio: 'inherit',
          env: {
            ...process.env,
            NODE_ENV: 'production',
          }
        }
      );

      serverProcess.on('error', (err) => {
        console.error('[Electron Main] Failed to start backend server process:', err);
        dialog.showErrorBox("Server Error", `Failed to start backend server: ${err.message}`);
        reject(err);
      });

      serverProcess.on('message', (message) => {
        console.log('[Electron Main] Message from server process:', message);
        if (message && message.ready && message.port) {
          console.log(`[Electron Main] Backend server reported ready on port ${message.port}`);
          resolve();
        }
      });

      serverProcess.on('exit', (code) => {
        console.log(`[Electron Main] Backend server process exited with code ${code}`);
        if (code !== 0 && !app.isQuitting) {
            dialog.showErrorBox("Server Stopped", `The backend server stopped unexpectedly (code: ${code}).`);
        }
      });

      const serverReadyTimeout = setTimeout(() => {
        console.log('[Electron Main] Assuming backend server started after timeout (no ready message received).');
        resolve();
      }, 7000);

      serverProcess.on('message', (message) => {
        if (message && message.ready) {
          clearTimeout(serverReadyTimeout);
          resolve();
        }
      });

    }
  });
}

async function createWindow() {
  try {
    await startBackendServer();
    console.log('[Electron Main] Backend server start process initiated/resolved.');
  } catch (error) {
    console.error('[Electron Main] Failed to start backend server, app might not function correctly:', error);
  }

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'CySploit - Cybersecurity Analysis Platform',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.cjs')
    }
  });

  let startUrl;
  const serverBaseUrl = `http://localhost:${process.env.PORT || 5000}`;

  if (isDev) {
    startUrl = serverBaseUrl;
    console.log(`[Electron Main] Development mode. Loading URL: ${startUrl}`);
  } else {
    const clientIndexPath = path.join(__dirname, '..', 'dist', 'public', 'index.html');
    console.log(`[Electron Main] Production mode. Checking for client index.html at: ${clientIndexPath}`);

    if (fs.existsSync(clientIndexPath)) {
      startUrl = `file://${clientIndexPath}`;
      console.log(`[Electron Main] Loading app from file: ${startUrl}`);
    } else {
      console.error(`[Electron Main] Client index.html not found at: ${clientIndexPath}. Falling back to server URL.`);
      startUrl = serverBaseUrl;
      dialog.showErrorBox("Client Files Missing", `Could not find client/index.html at ${clientIndexPath}. Attempting to load from server.`);
    }
  }

  mainWindow.loadURL(startUrl).catch(err => {
    console.error(`[Electron Main] Failed to load URL ${startUrl}:`, err);
    dialog.showErrorBox("Load URL Error", `Failed to load URL: ${startUrl}\nError: ${err.message}\n\nEnsure the backend server is running and accessible.`);
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  const template = [
    {
      label: 'File',
      submenu: [{ label: 'Exit', accelerator: 'CmdOrCtrl+Q', click() { app.quit(); }} ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' }, { role: 'redo' }, { type: 'separator' },
        { role: 'cut' }, { role: 'copy' }, { role: 'paste' },
        { role: 'delete' }, { type: 'separator' }, { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' }, { role: 'forceReload' }, { role: 'toggleDevTools' },
        { type: 'separator' }, { role: 'resetZoom' }, { role: 'zoomIn' },
        { role: 'zoomOut' }, { type: 'separator' }, { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        { label: 'Documentation', click: async () => { await shell.openExternal('https://github.com/webmaster-exit-1/CySploit/wiki'); }},
        { label: 'Report Issue', click: async () => { await shell.openExternal('https://github.com/webmaster-exit-1/CySploit/issues'); }},
        { type: 'separator' },
        {
          label: 'About CySploit',
          click() {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About CySploit',
              message: 'CySploit - Cybersecurity Analysis Platform',
              detail: `Version: ${app.getVersion()}\nElectron: ${process.versions.electron}\nNode: ${process.versions.node}\nChrome: ${process.versions.chrome}\n\n© ${new Date().getFullYear()} CySploit Team`
            });
          }
        }
      ]
    }
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  if (serverProcess) {
    console.log('[Electron Main] Terminating backend server process on app quit.');
    serverProcess.kill();
    serverProcess = null;
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

process.on('SIGTERM', () => {
  console.log('[Electron Main] SIGTERM received, quitting app.');
  app.quit();
});

ipcMain.on('runNmap', (event, options) => {
  console.log('[Electron Main] Received runNmap request:', options);
  const target = String(options.target || '').replace(/[;&|`$(){}[\]<>\\]/g, '');
  if (!target) {
    event.sender.send('nmapResults', { type: 'error', data: 'Invalid or missing target for nmap.' });
    return;
  }
  let nmapArgs = [];
  if (options.scanType === 'quick') { /* ... */ }
  const nmapProcess = spawn('nmap', nmapArgs, { shell: true });
});

ipcMain.on('capturePackets', (event, options) => {
  console.log('[Electron Main] Received capturePackets request:', options);
});

ipcMain.on('stopPacketCapture', (event) => {
  console.log('[Electron Main] Received stopPacketCapture request.');
});

ipcMain.on('runVulnerabilityScan', (event, options) => {
  console.log('[Electron Main] Received runVulnerabilityScan request:', options);
});

ipcMain.on('connectMetasploit', (event, options) => {
  console.log('[Electron Main] Received connectMetasploit request:', options);
});
