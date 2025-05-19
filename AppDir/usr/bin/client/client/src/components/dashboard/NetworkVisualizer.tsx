import React, { useEffect, useState } from 'react';
import { NetworkNode, NetworkLink, NetworkGraph } from '@/lib/types';
import NeonBorder from '@/components/common/NeonBorder';
import NetworkMap from '@/components/common/NetworkMap';
import { Button } from '@/components/ui/button';
import { useNetworkScanner } from '@/lib/hooks/useNetworkScanner';
import { useToast } from '@/hooks/use-toast';

interface Device {
  id: string | number;
  deviceName?: string;
  deviceType?: string;
  ipAddress: string;
  isOnline: boolean;
  [key: string]: any;
}

const NetworkVisualizer: React.FC = () => {
  const { devices, isLoadingDevices } = useNetworkScanner() as { devices: Device[], isLoadingDevices: boolean };
  const { toast } = useToast();
  const [graphData, setGraphData] = useState<NetworkGraph>({ nodes: [], links: [] });

  // Generate network graph data from devices
  useEffect(() => {
    if (devices && devices.length > 0) {
      // Find the router device or use the first device as the central node
      const routerDevice = devices.find((device: any) =>
        device.deviceType === 'router' || device.ipAddress.endsWith('.1')
      ) || devices[0];

      const nodes: NetworkNode[] = [];
      const links: NetworkLink[] = [];

      // Add router as the central node
      nodes.push({
        id: `device-${routerDevice.id}`,
        label: routerDevice.deviceName || `Router`,
        type: (routerDevice.deviceType as 'router' | 'computer' | 'iot' | 'server' | 'unknown') || 'router',
        ipAddress: routerDevice.ipAddress,
        isOnline: routerDevice.isOnline,
        data: routerDevice
      });

      // Add all other devices and link to the router
      devices.forEach((device: any) => {
        if (device.id === routerDevice.id) return;

        nodes.push({
          id: `device-${device.id}`,
          label: device.deviceName || `Device-${device.id}`,
          type: (device.deviceType as 'router' | 'computer' | 'iot' | 'server' | 'unknown') || 'unknown',
          ipAddress: device.ipAddress,
          isOnline: device.isOnline,
          data: device
        });

        // Create link with random traffic value (1-10)
        links.push({
          id: `link-${routerDevice.id}-${device.id}`,
          source: `device-${routerDevice.id}`,
          target: `device-${device.id}`,
          value: 1 + Math.floor(Math.random() * 9)
        });

        // Add some extra links between devices for a more complex network
        if (Math.random() > 0.7) {
          // Find another random device to link to
          const otherDevices = devices.filter(d =>
            d.id !== device.id && d.id !== routerDevice.id
          );

          if (otherDevices.length > 0) {
            const randomDevice = otherDevices[Math.floor(Math.random() * otherDevices.length)];
            links.push({
              id: `link-${device.id}-${randomDevice.id}`,
              source: `device-${device.id}`,
              target: `device-${randomDevice.id}`,
              value: 1 + Math.floor(Math.random() * 5)
            });
          }
        }
      });

      setGraphData({ nodes, links });
    }
  }, [devices]);

  const handleRefresh = () => {
    toast({
      title: "Network Visualization",
      description: "Refreshing network map...",
    });
  };

  const handleExport = () => {
    toast({
      title: "Export",
      description: "Exporting network map...",
    });
  };

  const handleExpand = () => {
    toast({
      title: "Network Visualization",
      description: "Expanding to full screen...",
    });
  };

  const handleNodeClick = (node: NetworkNode) => {
    toast({
      title: node.label,
      description: `IP: ${node.ipAddress}, Type: ${node.type}`,
    });
  };

  return (
    <NeonBorder color="purple" className="mb-8">
      <div className="p-5 border-b border-gray-800 flex justify-between items-center">
        <h2 className="text-xl font-bold font-rajdhani text-white flex items-center">
          <i className="ri-radar-line mr-2 text-accent"></i>
          Network Visualization
        </h2>
        <div className="flex space-x-3">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="text-gray-400 hover:text-white flex items-center"
          >
            <i className="ri-refresh-line mr-1"></i> Refresh
          </Button>
          <Button
            onClick={handleExport}
            variant="outline"
            size="sm"
            className="text-gray-400 hover:text-white flex items-center"
          >
            <i className="ri-download-line mr-1"></i> Export
          </Button>
          <Button
            onClick={handleExpand}
            variant="outline"
            size="sm"
            className="text-gray-400 hover:text-white flex items-center"
          >
            <i className="ri-fullscreen-line mr-1"></i> Expand
          </Button>
        </div>
      </div>

      <div className="p-4 h-96 relative bg-black bg-opacity-70 overflow-hidden">
        {isLoadingDevices ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-primary animate-pulse">Loading network data...</div>
          </div>
        ) : (
          <NetworkMap
            data={graphData}
            height={360}
            onNodeClick={handleNodeClick}
          />
        )}

        {/* Network details overlay */}
        <div className="absolute bottom-4 left-4 bg-background bg-opacity-80 p-3 rounded-lg border border-gray-800 w-56">
          <div className="text-xs text-gray-400 mb-1">Network Details</div>
          <div className="text-primary text-sm font-medium font-mono mb-1">SSID: CyberNet_5GHz</div>
          <div className="flex justify-between text-xs text-gray-300">
            <span>IP Range: 192.168.1.0/24</span>
            <span>{devices?.length || 0} Devices</span>
          </div>
        </div>

        {/* Controls overlay */}
        <div className="absolute top-4 right-4 bg-background bg-opacity-80 p-2 rounded-lg border border-gray-800 flex space-x-2">
          <button className="text-gray-400 hover:text-primary text-lg">
            <i className="ri-zoom-in-line"></i>
          </button>
          <button className="text-gray-400 hover:text-primary text-lg">
            <i className="ri-zoom-out-line"></i>
          </button>
          <button className="text-gray-400 hover:text-primary text-lg">
            <i className="ri-refresh-line"></i>
          </button>
        </div>
      </div>
    </NeonBorder>
  );
};

export default NetworkVisualizer;
