export interface Vulnerability {
  id: string;
  deviceId: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  cve?: string;
  remediation?: string;
  timestamp: number;
}