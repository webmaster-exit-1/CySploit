import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { NetworkInterface, NetworkScanResult, Device } from '@/lib/types';
import { queryClient } from '@/lib/queryClient';
import electronBridge, { isDesktopMode } from '@/lib/electronBridge';

export const useNetworkScanner = () => {
  const [scanInProgress, setScanInProgress] = useState(false);

  // Get all network interfaces
  const { data: networkInterfaces, isLoading: isLoadingInterfaces } = useQuery({
    queryKey: ['/api/network/interfaces'],
    refetchOnWindowFocus: false,
  });

  // Scan the entire network
  const scanNetworkMutation = useMutation({
    mutationFn: async (cidr: string): Promise<NetworkScanResult> => {
      setScanInProgress(true);
      try {
        // If in desktop mode, use Electron's native nmap
        if (isDesktopMode()) {
          console.log('Running network scan in desktop mode with native nmap');

          // Run native nmap scan
          const results = await electronBridge.runNmapScan({
            scanType: 'quick',
            target: cidr,
          });

          // Parse the nmap output properly to extract real device information
          const nmapOutput = results.data;
          const devices: Device[] = [];
          
          // Parse nmap output to extract host information
          const hostBlocks = nmapOutput.split(/Nmap scan report for /);
          
          for (const block of hostBlocks) {
            if (!block.trim()) continue;
            
            // Extract IP address and hostname
            const ipMatch = block.match(/^(?:([^\s]+) \()?([0-9.]+)\)?/);
            if (!ipMatch) continue;
            
            const hostname = ipMatch[1] || null;
            const ipAddress = ipMatch[2];
            
            // Extract MAC address
            const macMatch = block.match(/MAC Address: ([0-9A-F:]{17})/i);
            const macAddress = macMatch ? macMatch[1] : null;
            
            // Extract vendor info from MAC line
            const vendorMatch = block.match(/MAC Address: [0-9A-F:]+ \(([^)]+)\)/i);
            const vendor = vendorMatch ? vendorMatch[1] : 'Unknown';
            
            // Extract open ports
            const portMatches = block.matchAll(/(\d+)\/tcp\s+open\s+(\S+)/g);
            const ports: number[] = [];
            for (const match of portMatches) {
              ports.push(parseInt(match[1]));
            }
            
            // Check if host is up
            const isUp = block.includes('Host is up') || !block.includes('Host seems down');
            
            devices.push({
              id: devices.length + 1,
              ipAddress,
              macAddress,
              name: hostname || `Device at ${ipAddress}`,
              lastSeen: new Date(),
              deviceType: 'unknown',
              vendor,
              osType: null,
              ports,
              status: isUp ? 'online' : 'offline',
              details: { nmapOutput: block.trim() }
            });
          }

          // Send to server to store in database - let server handle this
          const response = await apiRequest('POST', '/api/scan/network', { cidr });
          return await response.json();
        }

        // Web mode: use server-side scanning
        const response = await apiRequest('POST', '/api/scan/network', { cidr });
        return await response.json();
      } finally {
        setScanInProgress(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/devices'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
    }
  });

  // Scan a single device
  const scanDeviceMutation = useMutation({
    mutationFn: async (ipAddress: string): Promise<{ isOnline: boolean, device?: Device }> => {
      setScanInProgress(true);
      try {
        // If in desktop mode, use Electron's native nmap
        if (isDesktopMode()) {
          console.log('Running device scan in desktop mode with native nmap');

          // Run native nmap scan
          const results = await electronBridge.runNmapScan({
            scanType: 'comprehensive',
            target: ipAddress,
          });

          // Parse the nmap results to determine if device is online
          const nmapOutput = results.data;
          const isOnline = nmapOutput.includes('Host is up') ||
                           !nmapOutput.includes('Host seems down');

          if (!isOnline) {
            return {
              isOnline: false
            };
          }

          // Extract detailed device information from comprehensive scan
          
          // Extract MAC address
          const macMatch = nmapOutput.match(/MAC Address: ([0-9A-F:]{17})/i);
          const macAddress = macMatch ? macMatch[1] : null;
          
          // Extract vendor info
          const vendorMatch = nmapOutput.match(/MAC Address: [0-9A-F:]+ \(([^)]+)\)/i);
          const vendor = vendorMatch ? vendorMatch[1] : 'Unknown';
          
          // Extract open ports with service names
          const ports: number[] = [];
          const portMatches = nmapOutput.matchAll(/(\d+)\/tcp\s+open\s+(\S+)/g);
          for (const match of portMatches) {
            ports.push(parseInt(match[1]));
          }
          
          // Extract OS detection results
          let osType = null;
          const osMatch = nmapOutput.match(/OS details:\s*(.+?)(?:\n|$)/i);
          if (osMatch) {
            osType = osMatch[1].trim();
          } else {
            // Try alternate OS detection format
            const osGuessMatch = nmapOutput.match(/Aggressive OS guesses:\s*(.+?)(?:\n|$)/i);
            if (osGuessMatch) {
              osType = osGuessMatch[1].split(',')[0].trim();
            }
          }
          
          // Extract hostname if available
          const hostnameMatch = nmapOutput.match(/Nmap scan report for ([^\s(]+)/);
          const hostname = hostnameMatch ? hostnameMatch[1] : null;

          const deviceInfo = {
            ipAddress,
            macAddress,
            name: hostname && hostname !== ipAddress ? hostname : `Device at ${ipAddress}`,
            lastSeen: new Date(),
            deviceType: 'unknown',
            vendor,
            osType,
            ports,
            status: 'online',
            details: { nmapOutput }
          };

          // Use the standard network scan endpoint which handles persistence
          // Note: The server's /api/scan/network endpoint handles individual hosts too
          const networkScanResult = await apiRequest('POST', '/api/scan/network', {
            cidr: `${ipAddress}/32` // Single host scan
          });

          const scanResponse = await networkScanResult.json();
          const device = scanResponse.devices?.[0] || deviceInfo;

          return {
            isOnline: true,
            device
          };
        }

        // Web mode: use server-side scanning
        const response = await apiRequest('POST', '/api/scan/device', { ipAddress });
        return await response.json();
      } finally {
        setScanInProgress(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/devices'] });
    }
  });

  // Get all detected devices
  const { data: devices, isLoading: isLoadingDevices } = useQuery({
    queryKey: ['/api/devices'],
    refetchOnWindowFocus: false,
  });

  // Get details of a single device
  const getDeviceDetails = (id: number) => {
    return useQuery({
      queryKey: [`/api/devices/${id}`],
      refetchOnWindowFocus: false,
    });
  };

  // Helper function to get suggested CIDR range
  const getSuggestedCidrRange = (selectedInterface?: NetworkInterface): string => {
    if (!selectedInterface) {
      return '192.168.1.0/24';
    }

    // Extract the IP address and netmask
    const ipParts = selectedInterface.address.split('.');
    // For simplicity, assume a /24 network
    return `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}.0/24`;
  };

  return {
    networkInterfaces,
    isLoadingInterfaces,
    scanNetworkMutation,
    scanDeviceMutation,
    devices,
    isLoadingDevices,
    getDeviceDetails,
    scanInProgress,
    getSuggestedCidrRange,
  };
};
