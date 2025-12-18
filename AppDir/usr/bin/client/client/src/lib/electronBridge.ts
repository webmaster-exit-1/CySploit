/**
 * Bridge to Electron APIs for desktop mode
 * Provides access to native network scanning features
 */

// Define the Electron API types
type NetworkInterfaceInfo = {
  address: string;
  netmask: string;
  family: string;
  mac: string;
  internal: boolean;
  cidr: string | null;
  scopeid?: number;
};

type NmapResultsEvent =
  | { type: 'progress'; data: string; percent?: number }
  | { type: 'complete'; data: string }
  | { type: 'error'; data: string };

type PacketCaptureStartedEvent = { success: true } | { success: false; error: string };
type PacketCaptureStoppedEvent = { success: true } | { success: false; error: string };
type MetasploitConnectedEvent = { success: boolean };

interface ElectronAPI {
  send: (channel: string, data: unknown) => void;
  receive: <T = unknown>(channel: string, func: (payload: T) => void) => void;
  getEnvironment: () => {
    platform: string;
    arch: string;
    hostname: string;
    interfaces: Record<string, NetworkInterfaceInfo[]>;
    isElectron: boolean;
    isDesktop: boolean;
    isDevelopment: boolean;
    dbConnected: boolean;
  };
  checkDatabaseConnection: () => boolean;
  getNetworkInterfaces: () => Record<string, NetworkInterfaceInfo[]>;
  getLocalIpAddress: () => string;
  checkToolAvailability: () => Promise<{
    nmap: boolean;
    tcpdump: boolean;
    metasploit: boolean;
  }>;
  getVersions: () => {
    app: string;
    electron: string;
    node: string;
    chrome: string;
  };
}

// Check if we're running in Electron
const isElectron = (): boolean => {
  return !!(window as unknown as { api?: unknown }).api;
};

// Get the Electron API if available
const getElectronAPI = (): ElectronAPI | null => {
  if (isElectron()) {
    return (window as unknown as { api?: ElectronAPI }).api ?? null;
  }
  return null;
};

// Utilities for running nmap scans in desktop mode
export const runNmapScan = (options: {
  scanType: 'quick' | 'full' | 'os' | 'ports' | 'comprehensive';
  target: string;
  ports?: string;
}): Promise<{ type: 'complete'; data: string }> => {
  return new Promise((resolve, reject) => {
    const api = getElectronAPI();

    if (!api) {
      reject(new Error('Not running in desktop mode'));
      return;
    }

    let resultsReceived = false;

    // Set up result handler
    api.receive<NmapResultsEvent>('nmapResults', (results) => {
      if (results.type === 'complete') {
        resultsReceived = true;
        resolve(results);
      } else if (results.type === 'error' && !resultsReceived) {
        // Only reject if we haven't already resolved
        reject(new Error(results.data));
      }
      // Progress updates are ignored in the promise
    });

    // Send the scan request
    api.send('runNmap', options);
  });
};

// Capture network packets
export const capturePackets = (options: {
  interface: string;
  filter?: string;
  count?: number;
}): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const api = getElectronAPI();

    if (!api) {
      reject(new Error('Not running in desktop mode'));
      return;
    }

    api.receive<PacketCaptureStartedEvent>('packetCaptureStarted', (result) => {
      if (result.success) {
        resolve(true);
      } else {
        reject(new Error(result.error));
      }
    });

    api.send('capturePackets', options);
  });
};

// Stop packet capture
export const stopPacketCapture = (): Promise<PacketCaptureStoppedEvent> => {
  return new Promise((resolve, reject) => {
    const api = getElectronAPI();

    if (!api) {
      reject(new Error('Not running in desktop mode'));
      return;
    }

    api.receive<PacketCaptureStoppedEvent>('packetCaptureStopped', (result) => {
      if (result.success) {
        resolve(result);
      } else {
        reject(new Error(result.error));
      }
    });

    api.send('stopPacketCapture', {});
  });
};

// Run vulnerability scan
export const runVulnerabilityScan = (options: {
  target: string;
}): Promise<{ type: 'complete'; data: string }> => {
  return new Promise((resolve, reject) => {
    const api = getElectronAPI();

    if (!api) {
      reject(new Error('Not running in desktop mode'));
      return;
    }

    let resultsReceived = false;

    api.receive<NmapResultsEvent>('vulnerabilityScanResults', (results) => {
      if (results.type === 'complete') {
        resultsReceived = true;
        resolve(results);
      } else if (results.type === 'error' && !resultsReceived) {
        // Only reject if we haven't already resolved
        reject(new Error(results.data));
      }
      // Progress updates are ignored in the promise
    });

    api.send('runVulnerabilityScan', options);
  });
};

// Check if Metasploit is available
export const checkMetasploitAvailability = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const api = getElectronAPI();

    if (!api) {
      // If not in desktop mode, we assume Metasploit is not available locally
      // But can still be available via API
      resolve(false);
      return;
    }

    api.receive<MetasploitConnectedEvent>('metasploitConnected', (result) => {
      resolve(result.success);
    });

    api.send('connectMetasploit', {});
  });
};

// Check if we're running in desktop mode
export const isDesktopMode = (): boolean => {
  const api = getElectronAPI();
  return api?.getEnvironment().isDesktop || false;
};

// Get available network interfaces
export const getNetworkInterfaces = (): Record<string, NetworkInterfaceInfo[]> => {
  const api = getElectronAPI();

  if (!api) {
    return {};
  }

  return api.getNetworkInterfaces();
};

// Get version information
export const getVersionInfo = () => {
  const api = getElectronAPI();

  if (!api) {
    return {
      app: '2.0.1',
      isDesktop: false
    };
  }

  const versions = api.getVersions();
  return {
    ...versions,
    isDesktop: true
  };
};

// Check if required tools are installed
export const checkToolsAvailability = async (): Promise<{
  nmap: boolean;
  tcpdump: boolean;
  metasploit: boolean;
}> => {
  const api = getElectronAPI();

  if (!api) {
    // In web mode, tools are on the server
    return {
      nmap: true,
      tcpdump: true,
      metasploit: true
    };
  }

  return await api.checkToolAvailability();
};

// Export utilities
export default {
  isElectron,
  isDesktopMode,
  runNmapScan,
  capturePackets,
  stopPacketCapture,
  runVulnerabilityScan,
  checkMetasploitAvailability,
  getNetworkInterfaces,
  getVersionInfo,
  checkToolsAvailability
};