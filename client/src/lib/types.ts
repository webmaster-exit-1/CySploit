// Device types
export interface Device {
  id: number;
  ipAddress: string;
  macAddress: string;
  deviceType?: string;
  deviceName?: string;
  vendor?: string;
  osType?: string;
  isOnline: boolean;
  lastSeen: string;
  openPorts?: number[];
  details?: Record<string, any>;
}

// Vulnerability types
export interface Vulnerability {
  id: number;
  deviceId: number;
  cveId?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description?: string;
  status: 'detected' | 'unpatched' | 'mitigated' | 'ignored';
  discoveredAt: string;
}

// Session types
export interface Session {
  id: number;
  name: string;
  startedAt: string;
  endedAt: string | null;
  isActive: boolean;
  networkData?: Record<string, any>;
}

// Packet types
export interface Packet {
  id: number;
  sessionId: number | null;
  sourceIp: string;
  destinationIp: string;
  protocol?: string;
  sourcePort?: number;
  destinationPort?: number;
  size?: number;
  timestamp: string;
  data?: Record<string, any>;
}

// Network scanner types
export interface NetworkScanResult {
  sessionId: number;
  devicesFound: number;
  devices: Device[];
}

export interface VulnerabilityScanResult {
  sessionId: number;
  vulnerabilitiesFound: number;
  vulnerabilities: Vulnerability[];
}

export interface NetworkInterface {
  name: string;
  address: string;
  netmask: string;
}

// Traffic analysis types
export interface TrafficAnalysis {
  anomalies: string[];
  statistics: {
    packetCount: number;
    totalSize: number;
    protocolDistribution: Record<string, number>;
    topPorts: { port: number, count: number }[];
    topDestinations: { ip: string, count: number }[];
  };
}

// Terminal types
export interface TerminalCommand {
  id: string;
  command: string;
  output: string;
  isError: boolean;
  timestamp: string;
}

// Network map types
export interface NetworkNode {
  id: string;
  label: string;
  type: 'router' | 'computer' | 'iot' | 'server' | 'unknown';
  ipAddress: string;
  isOnline: boolean;
  data?: Record<string, any>;
}

export interface NetworkLink {
  id: string;
  source: string;
  target: string;
  value: number;
}

export interface NetworkGraph {
  nodes: NetworkNode[];
  links: NetworkLink[];
}

// Dashboard types
export interface StatusCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  colorClass?: string;
  changeValue?: string;
  changeLabel?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}

// Packet capture types
export interface CaptureSession {
  id: number;
  interface: string;
  filter?: string;
  isActive: boolean;
  startTime: string;
}
