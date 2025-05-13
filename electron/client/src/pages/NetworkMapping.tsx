import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNetworkScanner } from '@/lib/hooks/useNetworkScanner';
import { Device, NetworkNode, NetworkLink, NetworkGraph } from '@/lib/types';
import NeonBorder from '@/components/common/NeonBorder';
import NetworkMap from '@/components/common/NetworkMap';
import { Helmet } from 'react-helmet';
import { useToast } from '@/hooks/use-toast';
import { TabsContent, Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn, getDeviceTypeIcon } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { useVulnerabilityScanner } from '@/lib/hooks/useVulnerabilityScanner';

const NetworkMapping: React.FC = () => {
  const { devices, isLoadingDevices, scanNetworkMutation } = useNetworkScanner();
  const { vulnerabilities } = useVulnerabilityScanner();
  const [graphData, setGraphData] = useState<NetworkGraph>({ nodes: [], links: [] });
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [mapLayout, setMapLayout] = useState<string>('force-directed');
  const [cidrRange, setCidrRange] = useState<string>('192.168.1.0/24');
  const [scanInProgress, setScanInProgress] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const { toast } = useToast();

  // Generate network graph data from devices
  useEffect(() => {
    if (devices && devices.length > 0) {
      generateNetworkGraph(devices);
    }
  }, [devices, vulnerabilities, mapLayout]);

  const generateNetworkGraph = (devicesData: any[]) => {
    // Find the router device or use the first device as the central node
    const routerDevice = devicesData.find((device: any) => 
      device.deviceType === 'router' || device.ipAddress.endsWith('.1')
    ) || devicesData[0];
    
    const nodes: NetworkNode[] = [];
    const links: NetworkLink[] = [];
    
    // Add router as the central node
    nodes.push({
      id: `device-${routerDevice.id}`,
      label: routerDevice.deviceName || 'Router',
      type: routerDevice.deviceType || 'router',
      ipAddress: routerDevice.ipAddress,
      isOnline: routerDevice.isOnline,
      data: routerDevice
    });
    
    // Add all other devices and link to the router or other devices based on layout
    devicesData.forEach((device: any) => {
      if (device.id === routerDevice.id) return;
      
      nodes.push({
        id: `device-${device.id}`,
        label: device.deviceName || `Device-${device.id}`,
        type: device.deviceType || 'unknown',
        ipAddress: device.ipAddress,
        isOnline: device.isOnline,
        data: device
      });
      
      if (mapLayout === 'force-directed') {
        // Force-directed layout: Create more complex connections
        links.push({
          id: `link-${routerDevice.id}-${device.id}`,
          source: `device-${routerDevice.id}`,
          target: `device-${device.id}`,
          value: 1 + Math.floor(Math.random() * 9)
        });
        
        // Add some extra links between devices based on IP address proximity
        const deviceIpParts = device.ipAddress.split('.');
        devicesData.forEach((otherDevice: any) => {
          if (otherDevice.id === device.id || otherDevice.id === routerDevice.id) return;
          
          const otherIpParts = otherDevice.ipAddress.split('.');
          // If they're in the same subnet, maybe connect them
          if (deviceIpParts[0] === otherIpParts[0] && 
              deviceIpParts[1] === otherIpParts[1] && 
              deviceIpParts[2] === otherIpParts[2] &&
              Math.abs(parseInt(deviceIpParts[3]) - parseInt(otherIpParts[3])) < 5) {
                
            // Only create some connections (not all possible ones)
            if (Math.random() > 0.7) {
              links.push({
                id: `link-${device.id}-${otherDevice.id}`,
                source: `device-${device.id}`,
                target: `device-${otherDevice.id}`,
                value: 1 + Math.floor(Math.random() * 5)
              });
            }
          }
        });
      } else {
        // Star layout: Just connect to router
        links.push({
          id: `link-${routerDevice.id}-${device.id}`,
          source: `device-${routerDevice.id}`,
          target: `device-${device.id}`,
          value: 1 + Math.floor(Math.random() * 9)
        });
      }
    });
    
    setGraphData({ nodes, links });
  };

  const handleNodeClick = (node: NetworkNode) => {
    // Find the device from the devices array
    if (devices) {
      const device = devices.find((d: any) => d.id === parseInt(node.id.replace('device-', '')));
      setSelectedDevice(device || null);
    }
  };

  const handleScanNetwork = async () => {
    if (!cidrRange) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid CIDR range",
        variant: "destructive"
      });
      return;
    }
    
    setScanInProgress(true);
    setScanProgress(0);
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 5;
      });
    }, 300);
    
    try {
      const result = await scanNetworkMutation.mutateAsync(cidrRange);
      
      clearInterval(progressInterval);
      setScanProgress(100);
      
      toast({
        title: "Network Scan Complete",
        description: `Found ${result.devicesFound} devices`
      });
      
      // Reset progress after a delay
      setTimeout(() => {
        setScanInProgress(false);
        setScanProgress(0);
      }, 1000);
      
    } catch (error) {
      clearInterval(progressInterval);
      setScanInProgress(false);
      setScanProgress(0);
      
      toast({
        title: "Scan Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    }
  };

  // Get device vulnerability count
  const getDeviceVulnerabilityCount = (deviceId: number) => {
    if (!vulnerabilities) return 0;
    return vulnerabilities.filter((v: any) => v.deviceId === deviceId).length;
  };
  
  // Get device critical vulnerability count
  const getDeviceCriticalVulnerabilityCount = (deviceId: number) => {
    if (!vulnerabilities) return 0;
    return vulnerabilities.filter((v: any) => 
      v.deviceId === deviceId && v.severity === 'critical'
    ).length;
  };

  return (
    <>
      <Helmet>
        <title>Network Mapping | CySploit</title>
        <meta name="description" content="Visualize network topology and connections between devices with interactive mapping" />
      </Helmet>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-rajdhani text-white mb-2">Network <span className="text-accent">Mapping</span></h1>
        <p className="text-gray-400">Visualize and explore your network topology and connections</p>
      </div>
      
      {/* Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        {/* Scan Controls */}
        <NeonBorder color="purple" className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="font-rajdhani">Network Map</CardTitle>
            <CardDescription>
              Interactive visualization of your network topology
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-4">
              <div className="flex justify-between mb-4">
                <div className="flex space-x-2">
                  <Select value={mapLayout} onValueChange={setMapLayout}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Layout Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="force-directed">Force Directed</SelectItem>
                      <SelectItem value="star">Star Topology</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button variant="outline" size="sm" className="flex items-center">
                    <i className="ri-zoom-in-line mr-2"></i>
                    Zoom
                  </Button>
                  
                  <Button variant="outline" size="sm" className="flex items-center">
                    <i className="ri-file-download-line mr-2"></i>
                    Export
                  </Button>
                </div>
                
                <div className="text-sm text-gray-400">
                  {devices?.length || 0} devices
                </div>
              </div>
              
              <div className="h-[500px] bg-black bg-opacity-70 rounded-lg overflow-hidden relative border border-gray-800">
                {isLoadingDevices ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-primary animate-pulse">Loading network data...</div>
                  </div>
                ) : devices && devices.length > 0 ? (
                  <NetworkMap 
                    data={graphData} 
                    height={500} 
                    onNodeClick={handleNodeClick} 
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="text-gray-400 mb-4">No network data available</div>
                    <Button onClick={handleScanNetwork} disabled={scanInProgress}>
                      {scanInProgress ? "Scanning..." : "Scan Network Now"}
                    </Button>
                  </div>
                )}
                
                {/* Legend overlay */}
                <div className="absolute bottom-4 right-4 bg-background bg-opacity-80 p-3 rounded-lg border border-gray-800">
                  <div className="text-xs text-gray-400 mb-2">Legend</div>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-primary mr-2"></div>
                      <span className="text-xs">Router</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-secondary mr-2"></div>
                      <span className="text-xs">Server</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-accent mr-2"></div>
                      <span className="text-xs">Computer</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                      <span className="text-xs">IoT Device</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                      <span className="text-xs">Unknown</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </NeonBorder>
        
        {/* Device Info */}
        <NeonBorder color="cyan">
          <CardHeader>
            <CardTitle className="font-rajdhani">Device Details</CardTitle>
            <CardDescription>
              {selectedDevice ? selectedDevice.ipAddress : "Select a device on the map"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedDevice ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mr-3">
                      <i className={cn(getDeviceTypeIcon(selectedDevice.deviceType), "text-xl")}></i>
                    </div>
                    <div>
                      <h3 className="font-medium">{selectedDevice.deviceName || "Unknown Device"}</h3>
                      <p className="text-sm text-gray-400">{selectedDevice.ipAddress}</p>
                    </div>
                  </div>
                  <div className={cn(
                    "px-2 py-1 rounded-full text-xs",
                    selectedDevice.isOnline ? "bg-green-500 bg-opacity-20 text-green-500" : "bg-destructive bg-opacity-20 text-destructive"
                  )}>
                    {selectedDevice.isOnline ? "Online" : "Offline"}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-400">MAC Address</p>
                    <p className="font-mono">{selectedDevice.macAddress}</p>
                  </div>
                  
                  <div>
                    <p className="text-gray-400">Vendor</p>
                    <p>{selectedDevice.vendor || "Unknown"}</p>
                  </div>
                  
                  <div>
                    <p className="text-gray-400">Device Type</p>
                    <p>{selectedDevice.deviceType || "Unknown"}</p>
                  </div>
                  
                  <div>
                    <p className="text-gray-400">OS</p>
                    <p>{selectedDevice.osType || "Unknown"}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-gray-400 text-sm mb-1">Open Ports</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedDevice.openPorts && selectedDevice.openPorts.length > 0 ? (
                      selectedDevice.openPorts.map((port, i) => (
                        <span key={i} className="px-2 py-0.5 bg-background text-xs rounded-md border border-gray-800">
                          {port}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500">None detected</span>
                    )}
                  </div>
                </div>
                
                <div>
                  <p className="text-gray-400 text-sm mb-1">Vulnerabilities</p>
                  <div className="flex items-center space-x-2">
                    <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full",
                          getDeviceCriticalVulnerabilityCount(selectedDevice.id) > 0
                            ? "bg-destructive" 
                            : getDeviceVulnerabilityCount(selectedDevice.id) > 0
                              ? "bg-yellow-500"
                              : "bg-green-500"
                        )}
                        style={{ width: `${getDeviceVulnerabilityCount(selectedDevice.id) > 0 ? 100 : 0}%` }}
                      ></div>
                    </div>
                    <span className="text-sm">
                      {getDeviceVulnerabilityCount(selectedDevice.id)}
                    </span>
                  </div>
                </div>
                
                <div className="flex space-x-2 pt-2">
                  <Button size="sm" variant="outline" className="w-1/2">
                    <i className="ri-shield-check-line mr-2"></i>
                    Scan
                  </Button>
                  <Button size="sm" variant="outline" className="w-1/2">
                    <i className="ri-information-line mr-2"></i>
                    Details
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <i className="ri-router-line text-4xl text-gray-500 mb-3"></i>
                <p className="text-gray-400">Select a device on the map to view its details</p>
              </div>
            )}
          </CardContent>
        </NeonBorder>
      </div>
      
      {/* Scan Controls */}
      <NeonBorder color="magenta" className="mb-8">
        <Tabs defaultValue="network-scan">
          <div className="p-4 border-b border-gray-800">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="network-scan">Network Scan</TabsTrigger>
              <TabsTrigger value="mitm-detection">MITM Detection</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="network-scan" className="p-4">
            <CardDescription className="mb-4">
              Run a network scan to discover devices and update the network map
            </CardDescription>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="md:col-span-2">
                <label className="text-sm text-gray-400 mb-2 block">Network CIDR Range</label>
                <Input 
                  value={cidrRange} 
                  onChange={(e) => setCidrRange(e.target.value)} 
                  placeholder="e.g. 192.168.1.0/24" 
                  disabled={scanInProgress}
                />
              </div>
              
              <div className="flex items-end">
                <Button 
                  onClick={handleScanNetwork} 
                  disabled={!cidrRange || scanInProgress}
                  className="w-full"
                >
                  {scanInProgress ? (
                    <>
                      <i className="ri-loader-4-line animate-spin mr-2"></i>
                      Scanning...
                    </>
                  ) : (
                    <>
                      <i className="ri-radar-line mr-2"></i>
                      Scan Network
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {scanInProgress && (
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Scanning network...</span>
                  <span className="text-primary">{scanProgress}%</span>
                </div>
                <Progress value={scanProgress} />
                
                <div className="mt-2 text-xs text-gray-500 font-mono">
                  <p>Scanning IP range: {cidrRange}</p>
                  <div className="mt-1 terminal-output max-h-32 overflow-y-auto p-2 bg-black rounded">
                    <p className="text-gray-400">Discovering devices on network...</p>
                    <p className="text-gray-400">Identifying device types and operating systems...</p>
                    <p className="text-gray-400">Detecting open ports...</p>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="mitm-detection" className="p-4">
            <CardDescription className="mb-4">
              Detect potential Man-in-the-Middle attacks on your network
            </CardDescription>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm text-gray-400 mb-2 block">Target Device (Optional)</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="All devices" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All devices</SelectItem>
                    {devices && devices.map((device: Device) => (
                      <SelectItem key={device.id} value={device.id.toString()}>
                        {device.ipAddress} - {device.deviceName || device.deviceType || "Unknown"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button className="w-full">
                  <i className="ri-shield-check-line mr-2"></i>
                  Start Detection
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </NeonBorder>
    </>
  );
};

export default NetworkMapping;
