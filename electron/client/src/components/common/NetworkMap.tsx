import React, { useEffect, useRef } from 'react';
import { NetworkGraph, NetworkNode, NetworkLink } from '@/lib/types';
import { ForceGraph2D } from 'react-force-graph';
import { useToast } from '@/hooks/use-toast';

interface NetworkMapProps {
  data: NetworkGraph;
  height?: number;
  width?: number;
  onNodeClick?: (node: NetworkNode) => void;
}

const NetworkMap: React.FC<NetworkMapProps> = ({
  data,
  height = 500,
  width = 800,
  onNodeClick
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Adjust graph size based on container
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current) {
        // Force graph redraw
        window.dispatchEvent(new Event('resize'));
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, []);

  // Node colors based on type
  const getNodeColor = (node: NetworkNode) => {
    if (!node.isOnline) return 'rgba(150, 150, 150, 0.6)';

    switch (node.type) {
      case 'router':
        return 'rgba(0, 255, 255, 1)'; // Cyan
      case 'server':
        return 'rgba(255, 0, 255, 1)'; // Magenta
      case 'computer':
        return 'rgba(157, 0, 255, 1)'; // Purple
      case 'iot':
        return 'rgba(0, 255, 102, 1)'; // Green
      default:
        return 'rgba(255, 204, 0, 1)'; // Yellow
    }
  };

  // Node icon based on type
  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'router':
        return 'ri-router-line';
      case 'server':
        return 'ri-server-line';
      case 'computer':
        return 'ri-computer-line';
      case 'iot':
        return 'ri-device-line';
      default:
        return 'ri-question-line';
    }
  };

  // Link color based on value
  const getLinkColor = (link: NetworkLink) => {
    const value = link.value;
    if (value > 8) return 'rgba(255, 0, 255, 0.5)'; // Heavy traffic - magenta
    if (value > 4) return 'rgba(157, 0, 255, 0.5)'; // Medium traffic - purple
    return 'rgba(0, 255, 255, 0.5)'; // Light traffic - cyan
  };

  // Custom node rendering
  const nodeCanvasObject = (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.label || node.id;
    const fontSize = 12/globalScale;
    const nodeSize = 8/globalScale;
    
    // Draw node circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI);
    ctx.fillStyle = getNodeColor(node);
    ctx.fill();
    
    // Draw node border
    ctx.strokeStyle = 'rgba(30, 37, 46, 1)';
    ctx.lineWidth = 1.5/globalScale;
    ctx.stroke();
    
    // Draw label below node
    ctx.font = `${fontSize}px Rajdhani`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'white';
    ctx.fillText(label, node.x, node.y + nodeSize + 2/globalScale);
    
    // Draw IP address below label
    const ipAddress = node.ipAddress;
    if (ipAddress) {
      ctx.font = `${fontSize * 0.8}px Space Mono`;
      ctx.fillStyle = 'rgba(200, 200, 200, 0.8)';
      ctx.fillText(ipAddress, node.x, node.y + nodeSize + fontSize + 4/globalScale);
    }
  };

  // Handle node click
  const handleNodeClick = (node: any) => {
    if (onNodeClick) {
      onNodeClick(node);
    } else {
      toast({
        title: node.label || node.id,
        description: `IP: ${node.ipAddress}, Type: ${node.type}`,
      });
    }
  };

  return (
    <div className="relative w-full" style={{ height }} ref={containerRef}>
      <ForceGraph2D
        graphData={data}
        nodeCanvasObject={nodeCanvasObject}
        linkColor={link => getLinkColor(link as NetworkLink)}
        linkWidth={2}
        linkDirectionalParticles={4}
        linkDirectionalParticleWidth={2}
        linkDirectionalParticleSpeed={0.005}
        backgroundColor="rgba(0,0,0,0)"
        onNodeClick={handleNodeClick}
        width={width}
        height={height}
        nodeRelSize={6}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.2}
        warmupTicks={50}
        cooldownTicks={50}
      />
    </div>
  );
};

export default NetworkMap;
