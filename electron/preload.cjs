// preload.cjs - CommonJS version for Electron
const { contextBridge, ipcRenderer } = require('electron');
const os = require('os');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

/**
 * Preload script for CySploit
 * 
 * Manages IPC communication between the renderer process and main process
 * Provides additional system information needed for security tools
 * Enables direct access to network scanning tools when running as desktop app
 */

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    // Send messages to the main process
    send: (channel, data) => {
      // Whitelist valid channels for security
      const validChannels = [
        'toMain', 
        'checkDatabase', 
        'runScan',
        'runNmap',
        'capturePackets',
        'stopPacketCapture',
        'connectMetasploit',
        'executeShodanSearch',
        'saveSettings',
        'runVulnerabilityScan'
      ];
      
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },
    
    // Receive messages from the main process
    receive: (channel, func) => {
      const validChannels = [
        'fromMain',
        'databaseStatus',
        'scanResults',
        'nmapResults',
        'packetCaptureStarted',
        'packetCaptureStopped',
        'packetData',
        'metasploitConnected',
        'metasploitOutput',
        'shodanResults',
        'vulnerabilityScanResults',
        'settingsSaved',
        'errorOccurred'
      ];
      
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender` 
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },
    
    // Get current environment information needed by the app
    getEnvironment: () => {
      return {
        platform: process.platform,
        arch: process.arch,
        hostname: os.hostname(),
        interfaces: os.networkInterfaces(),
        isElectron: true,
        isDesktop: true,
        isDevelopment: process.env.NODE_ENV === 'development',
        dbConnected: process.env.DB_CONNECTED === 'true'
      };
    },
    
    // Check if database is connected
    checkDatabaseConnection: () => {
      return process.env.DB_CONNECTED === 'true';
    },
    
    // Get system details for network scanning
    getNetworkInterfaces: () => {
      return os.networkInterfaces();
    },
    
    // Get local IP address
    getLocalIpAddress: () => {
      const interfaces = os.networkInterfaces();
      for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
          // Skip over non-IPv4 and internal (loopback) addresses
          if (iface.family !== 'IPv4' || iface.internal !== false) {
            continue;
          }
          return iface.address;
        }
      }
      return '127.0.0.1';
    },
    
    // Check if tools are available in the system
    checkToolAvailability: async () => {
      const tools = {
        nmap: false,
        tcpdump: false,
        metasploit: false
      };
      
      try {
        // Check for nmap
        await execPromise('which nmap');
        tools.nmap = true;
      } catch (e) {
        tools.nmap = false;
      }
      
      try {
        // Check for tcpdump
        await execPromise('which tcpdump');
        tools.tcpdump = true;
      } catch (e) {
        tools.tcpdump = false;
      }
      
      try {
        // Check for metasploit
        await execPromise('which msfconsole');
        tools.metasploit = true;
      } catch (e) {
        tools.metasploit = false;
      }
      
      return tools;
    },
    
    // Get version information
    getVersions: () => {
      return {
        app: '2.0.1', // App version
        electron: process.versions.electron,
        node: process.versions.node,
        chrome: process.versions.chrome
      };
    }
  }
);