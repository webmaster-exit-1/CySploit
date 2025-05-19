import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useNetworkScanner } from '@/lib/hooks/useNetworkScanner';
import { Device } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Helmet } from 'react-helmet';
import NeonBorder from '@/components/common/NeonBorder';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { isDesktopMode } from '@/lib/electronBridge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Laptop, Info } from 'lucide-react';

const NetworkDiscovery: React.FC = () => {
  const {
    networkInterfaces,
    isLoadingInterfaces,
    scanNetworkMutation,
    scanDeviceMutation,
    devices,
    isLoadingDevices,
    scanInProgress,
    getSuggestedCidrRange
  } = useNetworkScanner();

  // Ensure networkInterfaces is treated as an array
  const interfaces = Array.isArray(networkInterfaces) ? networkInterfaces : [];

  const { toast } = useToast();
  const [selectedInterface, setSelectedInterface] = useState<string>('');
  const [cidrRange, setCidrRange] = useState<string>('192.168.1.0/24');
  const [singleIpToScan, setSingleIpToScan] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>("network");
  const [scanResults, setScanResults] = useState<any>(null);

  // Update CIDR range when interface is selected
  useEffect(() => {
    if (interfaces && interfaces.length > 0) {
      if (selectedInterface) {
        const iface = interfaces.find((i: any) => i.name === selectedInterface);
        if (iface) {
          setCidrRange(getSuggestedCidrRange(iface));
        }
      }
    }
  }, [selectedInterface, interfaces, getSuggestedCidrRange]);

  // Set page title
  useEffect(() => {
    document.title = 'Network Discovery | CySploit';
  }, []);

  const handleScanNetwork = async () => {
    if (!cidrRange) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid CIDR range",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await scanNetworkMutation.mutateAsync(cidrRange);
      setScanResults(result);

      toast({
        title: "Network Scan Complete",
        description: `Found ${result.devicesFound} devices`
      });
    } catch (error) {
      toast({
        title: "Scan Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    }
  };

  const handleScanSingleDevice = async () => {
    if (!singleIpToScan) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid IP address",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await scanDeviceMutation.mutateAsync(singleIpToScan);

      if (result.isOnline) {
        toast({
          title: "Device Scan Complete",
          description: `Device is online: ${result.device?.deviceName || result.device?.ipAddress}`
        });
      } else {
        toast({
          title: "Device Offline",
          description: `Device at ${singleIpToScan} is not responding`,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Scan Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    }
  };

  const renderDeviceType = (type?: string) => {
    const types: Record<string, { icon: string, color: string }> = {
      router: { icon: 'ri-router-line', color: 'text-primary' },
      computer: { icon: 'ri-computer-line', color: 'text-secondary' },
      server: { icon: 'ri-server-line', color: 'text-accent' },
      iot: { icon: 'ri-device-line', color: 'text-green-500' },
      smartphone: { icon: 'ri-smartphone-line', color: 'text-yellow-500' }
    };

    const device = types[type || ''] || { icon: 'ri-question-line', color: 'text-gray-400' };

    return (
      <div className="flex items-center">
        <i className={cn(device.icon, device.color, "mr-2")}></i>
        <span>{type || 'Unknown'}</span>
      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>Network Discovery | CySploit</title>
        <meta name="description" content="Scan and discover devices on your network with detailed information about each device" />
      </Helmet>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-rajdhani text-white mb-2">Network <span className="text-primary">Discovery</span></h1>
        <p className="text-gray-400">Scan your network to discover and identify connected devices</p>

        {/* Desktop Mode Indicator */}
        {isDesktopMode() && (
          <Alert className="mt-4 border-green-500 bg-green-500/10">
            <Laptop className="h-4 w-4 text-green-500" />
            <AlertTitle className="text-green-500">Desktop Mode Enabled</AlertTitle>
            <AlertDescription>
              You're running in desktop mode with access to local network scanning tools.
              This allows you to scan your actual network directly.
            </AlertDescription>
          </Alert>
        )}

        {!isDesktopMode() && (
          <Alert className="mt-4 border-orange-500 bg-orange-500/10">
            <Info className="h-4 w-4 text-orange-500" />
            <AlertTitle className="text-orange-500">Web Preview Mode</AlertTitle>
            <AlertDescription>
              You're running in web preview mode. Network scanning is limited to the Replit environment.
              For full network scanning capabilities, download and run the desktop application.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Scan Controls */}
      <NeonBorder color="cyan" className="mb-8">
        <Tabs defaultValue="network" value={activeTab} onValueChange={setActiveTab}>
          <div className="p-4 border-b border-gray-800">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="network">Network Scan</TabsTrigger>
              <TabsTrigger value="device">Device Scan</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="network">
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  {isLoadingInterfaces ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select value={selectedInterface} onValueChange={setSelectedInterface}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an interface" />
                      </SelectTrigger>
                      <SelectContent>
                        {interfaces && interfaces.map((iface: any) => (
                          <SelectItem key={iface.name} value={iface.name}>
                            {iface.name} ({iface.address})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">CIDR Range</label>
                  <Input
                    value={cidrRange}
                    onChange={(e) => setCidrRange(e.target.value)}
                    placeholder="e.g. 192.168.1.0/24"
                  />
                </div>
              </div>

              <Button
                onClick={handleScanNetwork}
                disabled={!cidrRange || scanInProgress}
                className="w-full mt-2"
              >
                {scanInProgress ? (
                  <>
                    <i className="ri-loader-4-line animate-spin mr-2"></i>
                    Scanning Network...
                  </>
                ) : (
                  <>
                    <i className="ri-radar-line mr-2"></i>
                    Scan Network
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="device">
            <div className="p-4">
              <div className="mb-4">
                <label className="text-sm text-gray-400 mb-2 block">IP Address</label>
                <Input
                  value={singleIpToScan}
                  onChange={(e) => setSingleIpToScan(e.target.value)}
                  placeholder="e.g. 192.168.1.5"
                />
              </div>

              <Button
                onClick={handleScanSingleDevice}
                disabled={!singleIpToScan || scanInProgress}
                className="w-full"
              >
                {scanInProgress ? (
                  <>
                    <i className="ri-loader-4-line animate-spin mr-2"></i>
                    Scanning Device...
                  </>
                ) : (
                  <>
                    <i className="ri-device-line mr-2"></i>
                    Scan Device
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </NeonBorder>

      {/* Devices Table */}
      <NeonBorder color="purple" className="mb-8">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
          <h2 className="text-xl font-bold font-rajdhani text-white flex items-center">
            <i className="ri-device-line mr-2 text-accent"></i>
            Discovered Devices
          </h2>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              size="sm"
              className="text-gray-400 hover:text-white flex items-center"
            >
              <i className="ri-filter-3-line mr-1"></i> Filter
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-gray-400 hover:text-white flex items-center"
            >
              <i className="ri-file-download-line mr-1"></i> Export
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoadingDevices ? (
            <div className="p-8 text-center">
              <Skeleton className="h-4 w-3/4 mx-auto mb-4" />
              <Skeleton className="h-4 w-1/2 mx-auto" />
            </div>
          ) : Array.isArray(devices) && devices.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IP Address</TableHead>
                  <TableHead>MAC Address</TableHead>
                  <TableHead>Device Type</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>OS</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Open Ports</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device: Device) => (
                  <TableRow key={device.id} className="hover:bg-background transition-colors">
                    <TableCell>
                      <div className="font-medium">{device.ipAddress}</div>
                      <div className="text-xs text-gray-500">{device.deviceName || '-'}</div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{device.macAddress}</TableCell>
                    <TableCell>{renderDeviceType(device.deviceType)}</TableCell>
                    <TableCell>{device.vendor || 'Unknown'}</TableCell>
                    <TableCell>{device.vendor || 'Unknown'}</TableCell>
                    <TableCell>{device.osType || 'Unknown'}</TableCell>
                    <TableCell>
                      <Badge variant={device.isOnline ? "default" : "destructive"}>
                        {device.isOnline ? 'Online' : 'Offline'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                        {device.openPorts && device.openPorts.length > 0 ? (
                          device.openPorts.map((port) => (
                            <Badge key={port} variant="outline" className="text-xs">
                              {port}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-gray-500 text-sm">None</span>
                        )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="ghost">
                          <i className="ri-information-line"></i>
                        </Button>
                        <Button size="sm" variant="ghost">
                          <i className="ri-shield-check-line"></i>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-8 text-center text-gray-400">
              No devices discovered yet. Run a network scan to discover devices.
            </div>
          )}
        </div>
      </NeonBorder>

      {/* Scan Summary Card */}
      {scanResults && (
        <NeonBorder color="magenta" className="mb-8">
          <CardHeader>
            <CardTitle className="font-rajdhani">Last Scan Results</CardTitle>
            <CardDescription>
              Network scan results for {scanResults.cidr || cidrRange}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-background p-4 rounded-lg">
                <p className="text-sm text-gray-400">Devices Found</p>
                <p className="text-2xl font-bold text-white">{scanResults.devicesFound}</p>
              </div>
              <div className="bg-background p-4 rounded-lg">
                <p className="text-sm text-gray-400">Session ID</p>
                <p className="text-2xl font-bold text-white">{scanResults.sessionId}</p>
              </div>
              <div className="bg-background p-4 rounded-lg">
                <p className="text-sm text-gray-400">Scan Time</p>
                <p className="text-2xl font-bold text-white">
                  {new Date().toLocaleTimeString()}
                </p>
              </div>
              <div className="bg-background p-4 rounded-lg">
                <p className="text-sm text-gray-400">Status</p>
                <p className="text-2xl font-bold text-primary">Completed</p>
              </div>
            </div>
          </CardContent>
        </NeonBorder>
      )}

      {/* Desktop Application Download Card */}
      {!isDesktopMode() && (
        <NeonBorder color="cyan" className="mb-8">
          <CardHeader>
            <CardTitle className="font-rajdhani flex items-center">
              <Laptop className="mr-2 h-5 w-5" />
              Desktop Application
            </CardTitle>
            <CardDescription>
              Download the desktop application for enhanced network scanning capabilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-background border-green-800/50 shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Windows</CardTitle>
                </CardHeader>
                <CardContent className="pb-2">
                  <p className="text-sm text-gray-400">Scan your actual home network</p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">
                    <i className="ri-windows-fill mr-2"></i>
                    Download for Windows
                  </Button>
                </CardFooter>
              </Card>

              <Card className="bg-background border-gray-800/50 shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">macOS</CardTitle>
                </CardHeader>
                <CardContent className="pb-2">
                  <p className="text-sm text-gray-400">Full access to native scanning tools</p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">
                    <i className="ri-apple-fill mr-2"></i>
                    Download for macOS
                  </Button>
                </CardFooter>
              </Card>

              <Card className="bg-background border-blue-800/50 shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Linux</CardTitle>
                </CardHeader>
                <CardContent className="pb-2">
                  <p className="text-sm text-gray-400">AppImage for all major distros</p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">
                    <i className="ri-ubuntu-fill mr-2"></i>
                    Download AppImage
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </CardContent>
        </NeonBorder>
      )}
    </>
  );
};

export default NetworkDiscovery;
