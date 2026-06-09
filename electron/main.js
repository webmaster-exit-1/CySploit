const { app, BrowserWindow, Menu, shell, dialog, ipcMain } = require('electron');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { spawn } = require('child_process');
const isDev = require('electron-is-dev');
const fs = require('fs');
const os = require('os');
const net = require('net');
const { Client } = require('pg');
const { version: APP_VERSION } = require('../package.json');

// Keep a global reference of the window object to avoid garbage collection
let mainWindow;
let serverProcess;
let dbConnected = false;
const APP_PORT = Number(process.env.PORT) || 5000;
const SERVER_BASE_URL = `http://localhost:${APP_PORT}`;

console.log(`[env] DATABASE_URL ${process.env.DATABASE_URL ? 'set' : 'missing'}`);

// Check if PostgreSQL is available and connected
function checkDatabase() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.warn('DATABASE_URL is not set. Skipping DB connectivity check.');
    dbConnected = false;
    return Promise.resolve(false);
  }

  const client = new Client({ connectionString: dbUrl });
  return client.connect()
    .then(() => client.end())
    .then(() => {
      dbConnected = true;
      return true;
    })
    .catch((error) => {
      console.error('Database connection failed:', error?.message || error);
      dbConnected = false;
      return false;
    });
}

// Start Express server
function startServer() {
  return new Promise(async (resolve, reject) => {
    console.log('Starting Express server...');

    // In development, if the server is already running (e.g. started by `npm run dev`),
    // do not spawn a second instance.
    if (isDev) {
      const probe = net.createConnection({ host: '127.0.0.1', port: APP_PORT });
      const alreadyRunning = await new Promise((r) => {
        probe.once('connect', () => {
          probe.end();
          r(true);
        });
        probe.once('error', () => r(false));
      });

      if (alreadyRunning) {
        console.log(`Express server already running on port ${APP_PORT}.`);
        // Still check DB so UI can reflect status
        await checkDatabase();
        return resolve();
      }
    }

    // Check database connection first
    await checkDatabase();

    // In production, we use the bundled server
    // In development, we use the development server
    if (isDev) {
      // Development: start the server (Express + Vite middleware)
      serverProcess = spawn('npm', ['run', 'server'], {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit',
        env: { ...process.env, DB_CONNECTED: dbConnected ? 'true' : 'false' }
      });
    } else {
      // Production: use the bundled server from extraResources
      const serverPath = app.isPackaged
        ? path.join(process.resourcesPath, 'server')
        : path.join(__dirname, '..', 'dist', 'server');

      const serverScript = path.join(serverPath, 'index.js');

      if (!fs.existsSync(serverScript)) {
        console.error('Server script not found at:', serverScript);
        return resolve();
      }

      serverProcess = spawn('node', [serverScript], {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'production', DB_CONNECTED: dbConnected ? 'true' : 'false' }
      });
    }

    // Wait for server to start
    setTimeout(() => {
      console.log('Express server started');
      resolve();
    }, 3000); // Give it 3 seconds to start
  });
}

async function createWindow() {
  // Start the Express server
  await startServer();

  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'CySploit - Cybersecurity Analysis Platform',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load the app
  const startUrl = SERVER_BASE_URL;
  if (!isDev) {
    console.log('Loading app from server:', startUrl);
  }

  mainWindow.loadURL(startUrl);

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Create application menu
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click() {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'delete' },
        { type: 'separator' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          click: async () => {
            await shell.openExternal('https://github.com/webmaster-exit-1/CySploit/wiki');
          }
        },
        {
          label: 'Report Issue',
          click: async () => {
            await shell.openExternal('https://github.com/webmaster-exit-1/CySploit/issues');
          }
        },
        { type: 'separator' },
        {
          label: 'About CySploit',
          click() {
            // Show a simple about dialog
            const { dialog } = require('electron');
            dialog.showMessageBox(mainWindow, {
              title: 'About CySploit',
              message: 'CySploit - Cybersecurity Analysis Platform',
              detail: `Version: ${APP_VERSION}\nElectron: ${process.versions.electron}\nNode: ${process.versions.node}\nChrome: ${process.versions.chrome}\n\n© ${new Date().getFullYear()} CySploit Team`
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(createWindow);

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }

  // Kill the server process if it exists
  if (serverProcess) {
    serverProcess.kill();
  }
});

app.on('activate', () => {
  // On macOS, recreate the window when the dock icon is clicked
  if (mainWindow === null) {
    createWindow();
  }
});

// Exit cleanly on request from parent process
process.on('SIGTERM', () => {
  app.quit();
});

// Set up IPC handlers for network scanning operations
let nmapProcess = null;
let tcpdumpProcess = null;
let metasploitProcess = null;

function sanitizeByPattern(value, pattern) {
  const candidate = String(value ?? '').trim();
  return pattern.test(candidate) ? candidate : '';
}

/**
 * Allow only host/domain/IP-safe scan targets.
 * This blocks shell metacharacters and unexpected delimiters.
 */
function sanitizeTarget(value) {
  return sanitizeByPattern(value, /^[a-zA-Z0-9:._/-]+$/);
}

// Handle nmap scanning requests
ipcMain.on('runNmap', (event, options) => {
  if (nmapProcess) {
    // Kill any existing nmap process
    nmapProcess.kill();
  }

  console.log('Starting nmap scan with options:', options);

  // Validate the target IP/range to prevent command injection
  const target = sanitizeTarget(options?.target);
  if (!target) {
    event.sender.send('nmapResults', { type: 'error', data: 'Invalid scan target.' });
    return;
  }

  // Build the nmap command with appropriate options
  let nmapArgs = [];

  if (options.scanType === 'quick') {
    nmapArgs = ['-T4', '-F', target];
  } else if (options.scanType === 'full') {
    nmapArgs = ['-T4', '-A', '-v', target];
  } else if (options.scanType === 'os') {
    nmapArgs = ['-O', target];
  } else if (options.scanType === 'ports') {
    const ports = sanitizeByPattern(options?.ports, /^[0-9,\-]+$/);
    if (!ports) {
      event.sender.send('nmapResults', { type: 'error', data: 'Invalid port list.' });
      return;
    }
    nmapArgs = ['-p', ports, target];
  } else if (options.scanType === 'comprehensive') {
    nmapArgs = ['-sS', '-sU', '-T4', '-A', '-v', '-PE', '-PP', '-PS80,443', '-PA3389', '-PU40125', '-PY', '-g', '53', '--script', 'default or vuln', target];
  } else {
    // Default scan
    nmapArgs = ['-sV', target];
  }

  // If sudo is needed, check if we're root or have sudo access
  // For security reasons, we don't automatically use sudo
  nmapProcess = spawn('nmap', nmapArgs);

  let output = '';
  let errorOutput = '';

  nmapProcess.stdout.on('data', (data) => {
    const text = data.toString();
    output += text;
    event.sender.send('nmapResults', { type: 'progress', data: text });
  });

  nmapProcess.stderr.on('data', (data) => {
    const text = data.toString();
    errorOutput += text;
    event.sender.send('nmapResults', { type: 'error', data: text });
  });

  nmapProcess.on('close', (code) => {
    console.log(`nmap process exited with code ${code}`);
    event.sender.send('nmapResults', {
      type: 'complete',
      data: output,
      error: errorOutput,
      exitCode: code
    });
    nmapProcess = null;
  });
});

// Handle tcpdump packet capture
ipcMain.on('capturePackets', (event, options) => {
  if (tcpdumpProcess) {
    // Kill any existing tcpdump process
    tcpdumpProcess.kill();
    tcpdumpProcess = null;
  }

  console.log('Starting packet capture with options:', options);

  // Validate the interface and filter to prevent command injection
  const iface = sanitizeByPattern(options?.interface, /^[a-zA-Z0-9_.:-]+$/);
  if (!iface) {
    event.sender.send('packetCaptureStarted', {
      success: false,
      error: 'Invalid network interface'
    });
    return;
  }
  const filter = options?.filter
    ? sanitizeByPattern(options.filter, /^[a-zA-Z0-9_.:/\-\s()&|=<>!]+$/)
    : '';

  // Create a temporary file to store the captured packets
  const captureFile = path.join(os.tmpdir(), `capture_${Date.now()}.pcap`);

  // Build the tcpdump command
  const tcpdumpArgs = ['-i', iface];

  // Add capture file
  tcpdumpArgs.push('-w', captureFile);

  // Add packet count limit if specified
  if (options.count) {
    tcpdumpArgs.push('-c', options.count.toString());
  }

  // Add filter if specified
  if (filter) {
    tcpdumpArgs.push(filter);
  }

  // Check platform - tcpdump often requires admin/root privileges
  const isWindows = process.platform === 'win32';
  const isElevated = process.getuid && process.getuid() === 0;

  if (isWindows) {
    // On Windows, we'd typically use WinPcap/Npcap
    // For simplicity, assume it's installed and accessible
    tcpdumpProcess = spawn('tcpdump', tcpdumpArgs);
  } else if (isElevated) {
    // If we're running as root, no sudo needed
    tcpdumpProcess = spawn('tcpdump', tcpdumpArgs);
  } else {
    // For Linux/macOS, we need sudo but should verify permissions first
    // We don't automatically use sudo for security reasons
    // Instead, show a dialog informing user to run with elevated privileges
    dialog.showMessageBox(mainWindow, {
      type: 'warning',
      title: 'Elevated Privileges Required',
      message: 'Packet capture requires administrator/root privileges.',
      detail: 'Please run CySploit as administrator/root to enable this feature.',
      buttons: ['OK']
    });

    event.sender.send('packetCaptureStarted', {
      success: false,
      error: 'Elevated privileges required'
    });
    return;
  }

  let errorOutput = '';

  tcpdumpProcess.stdout.on('data', (data) => {
    const text = data.toString();
    event.sender.send('packetData', { type: 'info', data: text });
  });

  tcpdumpProcess.stderr.on('data', (data) => {
    const text = data.toString();
    errorOutput += text;
    event.sender.send('packetData', { type: 'info', data: text });
  });

  tcpdumpProcess.on('close', (code) => {
    console.log(`tcpdump process exited with code ${code}`);

    if (code === 0) {
      // Read the capture file and send it to the renderer
      fs.readFile(captureFile, (err, data) => {
        if (err) {
          event.sender.send('packetCaptureStopped', {
            success: false,
            error: `Failed to read capture file: ${err.message}`
          });
        } else {
          event.sender.send('packetCaptureStopped', {
            success: true,
            captureFile: captureFile,
            fileSize: data.length,
            packets: data.toString('base64')
          });

          // Remove the capture file after sending it
          fs.unlink(captureFile, (err) => {
            if (err) {
              console.error(`Failed to remove capture file: ${err.message}`);
            }
          });
        }
      });
    } else {
      event.sender.send('packetCaptureStopped', {
        success: false,
        error: errorOutput || `tcpdump exited with code ${code}`
      });
    }

    tcpdumpProcess = null;
  });

  event.sender.send('packetCaptureStarted', {
    success: true,
    captureFile: captureFile
  });
});

// Handle stopping packet capture
ipcMain.on('stopPacketCapture', (event) => {
  if (tcpdumpProcess) {
    tcpdumpProcess.kill();
    event.sender.send('packetData', { type: 'info', data: 'Packet capture stopped by user' });
  } else {
    event.sender.send('packetData', { type: 'error', data: 'No packet capture in progress' });
  }
});

// Handle vulnerability scanning
ipcMain.on('runVulnerabilityScan', (event, options) => {
  console.log('Starting vulnerability scan with options:', options);

  // Validate the target to prevent command injection
  const target = sanitizeTarget(options?.target);
  if (!target) {
    event.sender.send('vulnerabilityScanResults', { type: 'error', data: 'Invalid scan target.' });
    return;
  }

  // Use nmap NSE scripts for vulnerability scanning
  const nmapArgs = ['-sV', '--script', 'vuln', target];

  const nmapProcess = spawn('nmap', nmapArgs);

  let output = '';
  let errorOutput = '';

  nmapProcess.stdout.on('data', (data) => {
    const text = data.toString();
    output += text;
    event.sender.send('vulnerabilityScanResults', { type: 'progress', data: text });
  });

  nmapProcess.stderr.on('data', (data) => {
    const text = data.toString();
    errorOutput += text;
    event.sender.send('vulnerabilityScanResults', { type: 'error', data: text });
  });

  nmapProcess.on('close', (code) => {
    console.log(`Vulnerability scan process exited with code ${code}`);
    event.sender.send('vulnerabilityScanResults', {
      type: 'complete',
      data: output,
      error: errorOutput,
      exitCode: code
    });
  });
});

// Handle Metasploit connection
ipcMain.on('connectMetasploit', (event, options) => {
  console.log('Connecting to Metasploit RPC:', options);

  // This is just a check to see if Metasploit is installed and available
  const checkProcess = spawn('which', ['msfconsole']);

  checkProcess.on('close', (code) => {
    if (code === 0) {
      event.sender.send('metasploitConnected', {
        success: true,
        message: 'Metasploit is available on this system'
      });
    } else {
      event.sender.send('metasploitConnected', {
        success: false,
        message: 'Metasploit is not installed or not found in PATH'
      });
    }
  });
});