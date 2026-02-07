import { describe, it, expect } from 'vitest';
import {
  cn,
  formatBytes,
  formatDate,
  generateId,
  formatCidrRange,
  truncateText,
  getSeverityColor,
  getSeverityVariant,
  getDeviceTypeIcon
} from '@/lib/utils';

describe('cn (className utility)', () => {
  it('should merge class names correctly', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
  });

  it('should handle conditional classes', () => {
    expect(cn('class1', false && 'class2', 'class3')).toBe('class1 class3');
  });

  it('should merge Tailwind classes correctly', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });
});

describe('formatBytes', () => {
  it('should format 0 bytes correctly', () => {
    expect(formatBytes(0)).toBe('0 Bytes');
  });

  it('should format bytes correctly', () => {
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1024 * 1024)).toBe('1 MB');
    expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
  });

  it('should handle decimal precision', () => {
    expect(formatBytes(1536, 2)).toBe('1.5 KB');
    expect(formatBytes(1536, 0)).toBe('2 KB');
  });

  it('should handle large numbers', () => {
    const oneTerabyte = 1024 * 1024 * 1024 * 1024;
    expect(formatBytes(oneTerabyte)).toBe('1 TB');
  });
});

describe('formatDate', () => {
  it('should format Date object', () => {
    const date = new Date('2024-01-01T12:00:00Z');
    const formatted = formatDate(date);
    expect(formatted).toContain('2024');
  });

  it('should format date string', () => {
    const dateStr = '2024-01-01T12:00:00Z';
    const formatted = formatDate(dateStr);
    expect(formatted).toContain('2024');
  });
});

describe('generateId', () => {
  it('should generate a unique ID', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).toBeTruthy();
    expect(id2).toBeTruthy();
    expect(id1).not.toBe(id2);
  });

  it('should generate ID with correct length', () => {
    const id = generateId();
    expect(id.length).toBe(7);
  });

  it('should generate alphanumeric ID', () => {
    const id = generateId();
    expect(id).toMatch(/^[a-z0-9]+$/);
  });
});

describe('formatCidrRange', () => {
  it('should format valid CIDR notation', () => {
    expect(formatCidrRange('192.168.1.0/24')).toBe('192.168.1.0/24');
    expect(formatCidrRange('10.0.0.0/8')).toBe('10.0.0.0/8');
  });

  it('should return original string if invalid format', () => {
    expect(formatCidrRange('invalid')).toBe('invalid');
    expect(formatCidrRange('192.168.1.0')).toBe('192.168.1.0');
  });
});

describe('truncateText', () => {
  it('should not truncate short text', () => {
    expect(truncateText('hello', 10)).toBe('hello');
  });

  it('should truncate long text', () => {
    const longText = 'This is a very long text that should be truncated';
    expect(truncateText(longText, 20)).toBe('This is a very long ...');
  });

  it('should handle exact length', () => {
    expect(truncateText('hello', 5)).toBe('hello');
  });

  it('should handle empty string', () => {
    expect(truncateText('', 10)).toBe('');
  });
});

describe('getSeverityColor', () => {
  it('should return correct color for critical severity', () => {
    expect(getSeverityColor('critical')).toBe('text-destructive');
    expect(getSeverityColor('Critical')).toBe('text-destructive');
    expect(getSeverityColor('CRITICAL')).toBe('text-destructive');
  });

  it('should return correct color for high severity', () => {
    expect(getSeverityColor('high')).toBe('text-destructive');
  });

  it('should return correct color for medium severity', () => {
    expect(getSeverityColor('medium')).toBe('text-yellow-500');
  });

  it('should return correct color for low severity', () => {
    expect(getSeverityColor('low')).toBe('text-gray-400');
  });

  it('should return default color for unknown severity', () => {
    expect(getSeverityColor('unknown')).toBe('text-gray-400');
  });
});

describe('getSeverityVariant', () => {
  it('should return correct variant for critical severity', () => {
    expect(getSeverityVariant('critical')).toBe('destructive');
  });

  it('should return correct variant for high severity', () => {
    expect(getSeverityVariant('high')).toBe('destructive');
  });

  it('should return correct variant for medium severity', () => {
    expect(getSeverityVariant('medium')).toBe('secondary');
  });

  it('should return correct variant for low severity', () => {
    expect(getSeverityVariant('low')).toBe('outline');
  });

  it('should return default variant for unknown severity', () => {
    expect(getSeverityVariant('unknown')).toBe('outline');
  });

  it('should handle case insensitivity', () => {
    expect(getSeverityVariant('CRITICAL')).toBe('destructive');
    expect(getSeverityVariant('Medium')).toBe('secondary');
  });
});

describe('getDeviceTypeIcon', () => {
  it('should return correct icon for router', () => {
    expect(getDeviceTypeIcon('router')).toBe('ri-router-line');
    expect(getDeviceTypeIcon('Router')).toBe('ri-router-line');
  });

  it('should return correct icon for server', () => {
    expect(getDeviceTypeIcon('server')).toBe('ri-server-line');
  });

  it('should return correct icon for computer', () => {
    expect(getDeviceTypeIcon('computer')).toBe('ri-computer-line');
  });

  it('should return correct icon for IoT device', () => {
    expect(getDeviceTypeIcon('iot')).toBe('ri-device-line');
    expect(getDeviceTypeIcon('IoT')).toBe('ri-device-line');
  });

  it('should return correct icon for smartphone', () => {
    expect(getDeviceTypeIcon('smartphone')).toBe('ri-smartphone-line');
  });

  it('should return default icon for unknown type', () => {
    expect(getDeviceTypeIcon('unknown')).toBe('ri-question-line');
    expect(getDeviceTypeIcon()).toBe('ri-question-line');
  });
});
