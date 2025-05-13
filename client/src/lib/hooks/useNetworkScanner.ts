import { useState, useEffect } from 'react';
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
          
          // Parse CIDR to get target range
          const target = cidr.split('/')[0].replace(/\.\d+$/, '.0');
          
          // Run native nmap scan
          const results = await electronBridge.runNmapScan({
            scanType: 'quick',
            target: cidr,
          });
          
          // Parse the nmap results
          // This is a simplified example - in a real app, you'd want to parse
          // the nmap output more thoroughly
          const foundIPs = results.data
            .match(/\d+\.\d+\.\d+\.\d+/g) || [];
          
          // Create a mock result similar to what the server would return
          const mockDevices = foundIPs.map((ip, index) => ({
            id: index + 1,
            ipAddress: ip,
            macAddress: '00:00:00:00:00:00', // Placeholder
            lastSeen: new Date(),
            deviceType: 'unknown',
            deviceName: `Device at ${ip}`,
            vendor: 'Unknown',
            osType: null,
            ports: [],
            status: 'online',
            details: {}
          }));
          
          // Send to server to store in database
          const response = await apiRequest('POST', '/api/scan/network', { 
            cidr,
            scannedDevices: mockDevices 
          });
          
          return {
            sessionId: 1,
            devicesFound: mockDevices.length,
            devices: mockDevices
          };
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
          const isOnline = results.data.includes('Host is up') || 
                           !results.data.includes('Host seems down');
          
          if (!isOnline) {
            return { 
              isOnline: false 
            };
          }
          
          // Try to extract details from comprehensive scan
          // This is simplified - you would want much more thorough parsing
          const ports = (results.data.match(/(\d+)\/tcp\s+open/g) || [])
            .map(p => parseInt(p.split('/')[0]));
            
          const osMatches = results.data.match(/OS:\s*(.*?)(?:\n|$)/);
          const osType = osMatches ? osMatches[1].trim() : null;
          
          const deviceInfo = {
            ipAddress,
            macAddress: '00:00:00:00:00:00', // Placeholder
            lastSeen: new Date(),
            deviceType: 'unknown',
            deviceName: `Device at ${ipAddress}`,
            vendor: 'Unknown',
            osType,
            ports,
            status: 'online',
            details: { nmapOutput: results.data }
          };
          
          // Send to server to store in database
          const response = await apiRequest('POST', '/api/scan/device', { 
            ipAddress,
            deviceInfo 
          });
          
          const serverResponse = await response.json();
          
          return {
            isOnline: true,
            device: serverResponse.device || deviceInfo
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
