import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format bytes to a human-readable format
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Format date to locale string
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleString();
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Format IP address range from CIDR
 */
export function formatCidrRange(cidr: string): string {
  const [baseIp, prefixLength] = cidr.split('/');
  
  if (!baseIp || !prefixLength) {
    return cidr;
  }
  
  return `${baseIp}/${prefixLength}`;
}

/**
 * Truncate text if it's too long
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Get severity color for vulnerabilities
 */
export function getSeverityColor(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'critical':
      return 'text-destructive';
    case 'high':
      return 'text-destructive';
    case 'medium':
      return 'text-yellow-500';
    case 'low':
      return 'text-gray-400';
    default:
      return 'text-gray-400';
  }
}

/**
 * Get badge variant for vulnerability severity
 */
export function getSeverityVariant(severity: string): "default" | "secondary" | "destructive" | "outline" {
  switch (severity.toLowerCase()) {
    case 'critical':
      return 'destructive';
    case 'high':
      return 'destructive';
    case 'medium':
      return 'secondary';
    case 'low':
      return 'outline';
    default:
      return 'outline';
  }
}

/**
 * Get icon for device type
 */
export function getDeviceTypeIcon(type?: string): string {
  switch (type?.toLowerCase()) {
    case 'router':
      return 'ri-router-line';
    case 'server':
      return 'ri-server-line';
    case 'computer':
      return 'ri-computer-line';
    case 'iot':
      return 'ri-device-line';
    case 'smartphone':
      return 'ri-smartphone-line';
    default:
      return 'ri-question-line';
  }
}
