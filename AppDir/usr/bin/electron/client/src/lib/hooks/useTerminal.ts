import { useState, useCallback, useEffect, useRef } from 'react';
import { TerminalCommand } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { useNetworkScanner } from '@/lib/hooks/useNetworkScanner';
import { useVulnerabilityScanner } from '@/lib/hooks/useVulnerabilityScanner';
import { usePacketAnalyzer } from '@/lib/hooks/usePacketAnalyzer';

const COMMAND_HISTORY_SIZE = 100;

export const useTerminal = () => {
  const [commands, setCommands] = useState<TerminalCommand[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const commandsEndRef = useRef<HTMLDivElement>(null);

  // Import hooks for network operations
  const networkScanner = useNetworkScanner();
  const vulnerabilityScanner = useVulnerabilityScanner();
  const packetAnalyzer = usePacketAnalyzer();

  // Helper to add a new command to history
  const addCommand = useCallback((command: string, output: string = '', isError: boolean = false) => {
    const newCommand: TerminalCommand = {
      id: uuidv4(),
      command,
      output,
      isError,
      timestamp: new Date().toISOString()
    };
    
    setCommands(prev => [...prev, newCommand]);
    
    // Update command history
    if (command.trim()) {
      setCommandHistory(prev => {
        // Remove duplicates and keep most recent commands
        const filteredHistory = prev.filter(cmd => cmd !== command);
        return [command, ...filteredHistory].slice(0, COMMAND_HISTORY_SIZE);
      });
    }
    
    // Reset history index
    setHistoryIndex(-1);
  }, []);

  // Scroll to the bottom when commands change
  useEffect(() => {
    if (commandsEndRef.current) {
      commandsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [commands]);

  // Focus input when the component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Helper to clear the terminal
  const clearTerminal = useCallback(() => {
    setCommands([]);
  }, []);

  // Command processor
  const processCommand = useCallback(async (input: string) => {
    setIsProcessing(true);
    
    try {
      const trimmedInput = input.trim();
      if (!trimmedInput) return;
      
      // Add the command to the terminal
      addCommand(trimmedInput);
      
      // Split the command and arguments
      const parts = trimmedInput.split(' ');
      const command = parts[0].toLowerCase();
      const args = parts.slice(1);
      
      // Process the command
      switch (command) {
        case 'help':
          addCommand('', `Available commands:
  scan [options] - Scan the network or specific devices
    -target <ip/cidr> - Target IP or CIDR range
    -port <port/range> - Port or port range to scan
  
  vuln-scan [options] - Scan for vulnerabilities
    -target <ip> - Target IP to scan
    -level <basic|deep> - Scan depth level
  
  packet-capture [options] - Capture network packets
    -i <interface> - Network interface
    -f <filter> - Packet filter
  
  network-map - Generate network map
  
  show [options] - Show various information
    devices - Show detected devices
    vulns - Show vulnerabilities
    interfaces - Show network interfaces
  
  clear - Clear the terminal
  help - Show this help message`);
          break;
          
        case 'clear':
          clearTerminal();
          break;
          
        case 'scan': {
          let target = '';
          let port = '';
          
          // Parse arguments
          for (let i = 0; i < args.length; i++) {
            if (args[i] === '-target' && i + 1 < args.length) {
              target = args[i + 1];
              i++;
            } else if (args[i] === '-port' && i + 1 < args.length) {
              port = args[i + 1];
              i++;
            }
          }
          
          if (!target) {
            addCommand('', 'Error: Target is required. Use -target <ip/cidr>', true);
            break;
          }
          
          // Check if target is a CIDR range or a single IP
          if (target.includes('/')) {
            // Network scan
            addCommand('', `Scanning network ${target}...`);
            
            try {
              const result = await networkScanner.scanNetworkMutation.mutateAsync(target);
              addCommand('', `[+] Scan completed successfully
[+] Found ${result.devicesFound} devices on network
[+] Session ID: ${result.sessionId}`);
            } catch (error) {
              addCommand('', `Error scanning network: ${error instanceof Error ? error.message : String(error)}`, true);
            }
          } else {
            // Single device scan
            addCommand('', `Scanning device ${target}...`);
            
            try {
              const result = await networkScanner.scanDeviceMutation.mutateAsync(target);
              
              if (result.isOnline) {
                addCommand('', `[+] Device is online
[+] IP: ${result.device?.ipAddress}
[+] MAC: ${result.device?.macAddress}
[+] Type: ${result.device?.deviceType}
[+] OS: ${result.device?.osType}
[+] Open ports: ${result.device?.openPorts?.join(', ') || 'None detected'}`);
              } else {
                addCommand('', `[-] Device ${target} is not responding`, true);
              }
            } catch (error) {
              addCommand('', `Error scanning device: ${error instanceof Error ? error.message : String(error)}`, true);
            }
          }
          break;
        }
          
        case 'vuln-scan': {
          let target = '';
          let level = 'basic';
          
          // Parse arguments
          for (let i = 0; i < args.length; i++) {
            if (args[i] === '-target' && i + 1 < args.length) {
              target = args[i + 1];
              i++;
            } else if (args[i] === '-level' && i + 1 < args.length) {
              level = args[i + 1];
              i++;
            }
          }
          
          if (!target) {
            addCommand('', 'Error: Target is required. Use -target <ip>', true);
            break;
          }
          
          addCommand('', `Scanning ${target} for vulnerabilities (${level} scan)...`);
          
          try {
            // First, find the device ID
            const devices = networkScanner.devices || [];
            const device = devices.find((d: any) => d.ipAddress === target);
            
            if (!device) {
              addCommand('', `Error: Device ${target} not found. Run a network scan first.`, true);
              break;
            }
            
            const result = await vulnerabilityScanner.scanVulnerabilitiesMutation.mutateAsync(device.id);
            
            if (result.vulnerabilitiesFound > 0) {
              let output = `[+] Found ${result.vulnerabilitiesFound} vulnerabilities\n`;
              
              // Count vulnerabilities by severity
              const severityCounts = { critical: 0, high: 0, medium: 0, low: 0 };
              
              result.vulnerabilities.forEach(vuln => {
                if (vuln.severity === 'critical') severityCounts.critical++;
                else if (vuln.severity === 'high') severityCounts.high++;
                else if (vuln.severity === 'medium') severityCounts.medium++;
                else if (vuln.severity === 'low') severityCounts.low++;
              });
              
              if (severityCounts.critical > 0) {
                output += `[!] CRITICAL: ${severityCounts.critical} vulnerabilities found\n`;
              }
              
              if (severityCounts.high > 0) {
                output += `[!] HIGH: ${severityCounts.high} vulnerabilities found\n`;
              }
              
              // List critical vulnerabilities
              const criticalVulns = result.vulnerabilities.filter(v => v.severity === 'critical');
              if (criticalVulns.length > 0) {
                criticalVulns.forEach(vuln => {
                  output += `[!] ${vuln.cveId}: ${vuln.title}\n`;
                });
              }
              
              output += `[+] Scan completed`;
              addCommand('', output);
            } else {
              addCommand('', '[+] No vulnerabilities found');
            }
          } catch (error) {
            addCommand('', `Error scanning for vulnerabilities: ${error instanceof Error ? error.message : String(error)}`, true);
          }
          break;
        }
          
        case 'packet-capture': {
          let interface_ = '';
          let filter = '';
          
          // Parse arguments
          for (let i = 0; i < args.length; i++) {
            if (args[i] === '-i' && i + 1 < args.length) {
              interface_ = args[i + 1];
              i++;
            } else if (args[i] === '-f' && i + 1 < args.length) {
              filter = args[i + 1];
              i++;
            }
          }
          
          if (!interface_) {
            addCommand('', 'Error: Interface is required. Use -i <interface>', true);
            break;
          }
          
          addCommand('', `Starting packet capture on interface ${interface_}${filter ? ` with filter "${filter}"` : ''}...`);
          
          try {
            const result = await packetAnalyzer.startCaptureMutation.mutateAsync({
              interface_,
              filter,
              sessionName: `Terminal Capture - ${interface_}`
            });
            
            addCommand('', `[+] Packet capture started
[+] Session ID: ${result.sessionId}
[+] Use 'stop-capture -s ${result.sessionId}' to stop`);
          } catch (error) {
            addCommand('', `Error starting packet capture: ${error instanceof Error ? error.message : String(error)}`, true);
          }
          break;
        }
          
        case 'stop-capture': {
          let sessionId = 0;
          
          // Parse arguments
          for (let i = 0; i < args.length; i++) {
            if (args[i] === '-s' && i + 1 < args.length) {
              sessionId = parseInt(args[i + 1]);
              i++;
            }
          }
          
          if (!sessionId) {
            addCommand('', 'Error: Session ID is required. Use -s <session_id>', true);
            break;
          }
          
          addCommand('', `Stopping packet capture session ${sessionId}...`);
          
          try {
            const result = await packetAnalyzer.stopCaptureMutation.mutateAsync(sessionId);
            addCommand('', `[+] Packet capture stopped
[+] Session ID: ${result.sessionId}`);
          } catch (error) {
            addCommand('', `Error stopping packet capture: ${error instanceof Error ? error.message : String(error)}`, true);
          }
          break;
        }
          
        case 'show': {
          const subCommand = args[0]?.toLowerCase();
          
          switch (subCommand) {
            case 'devices': {
              const devices = networkScanner.devices || [];
              
              if (devices.length === 0) {
                addCommand('', 'No devices found. Run a network scan first.');
                break;
              }
              
              let output = `Found ${devices.length} devices:\n`;
              
              devices.forEach((device: any) => {
                output += `
[+] IP: ${device.ipAddress}
    MAC: ${device.macAddress}
    Type: ${device.deviceType || 'Unknown'}
    Name: ${device.deviceName || 'Unknown'}
    Vendor: ${device.vendor || 'Unknown'}
    OS: ${device.osType || 'Unknown'}
    Status: ${device.isOnline ? 'Online' : 'Offline'}
    Open Ports: ${device.openPorts?.join(', ') || 'None detected'}
`;
              });
              
              addCommand('', output);
              break;
            }
              
            case 'vulns': {
              const vulnerabilities = vulnerabilityScanner.vulnerabilities || [];
              
              if (vulnerabilities.length === 0) {
                addCommand('', 'No vulnerabilities found. Run a vulnerability scan first.');
                break;
              }
              
              let output = `Found ${vulnerabilities.length} vulnerabilities:\n`;
              
              vulnerabilities.forEach((vuln: any) => {
                output += `
[+] ID: ${vuln.id}
    Device ID: ${vuln.deviceId}
    CVE: ${vuln.cveId || 'N/A'}
    Title: ${vuln.title}
    Severity: ${vuln.severity.toUpperCase()}
    Status: ${vuln.status}
    Discovered: ${new Date(vuln.discoveredAt).toLocaleString()}
`;
              });
              
              addCommand('', output);
              break;
            }
              
            case 'interfaces': {
              const interfaces = networkScanner.networkInterfaces || [];
              
              if (interfaces.length === 0) {
                addCommand('', 'No network interfaces found.');
                break;
              }
              
              let output = `Found ${interfaces.length} network interfaces:\n`;
              
              interfaces.forEach((iface: any) => {
                output += `
[+] Name: ${iface.name}
    Address: ${iface.address}
    Netmask: ${iface.netmask}
`;
              });
              
              addCommand('', output);
              break;
            }
              
            default:
              addCommand('', `Unknown show command: ${subCommand}. Available: devices, vulns, interfaces`, true);
          }
          break;
        }
          
        case 'network-map': {
          addCommand('', 'Generating network map...');
          
          const devices = networkScanner.devices || [];
          
          if (devices.length === 0) {
            addCommand('', 'No devices found. Run a network scan first.', true);
            break;
          }
          
          addCommand('', `[+] Network map generated with ${devices.length} devices
[+] Network map available in visualization tab`);
          break;
        }
          
        default:
          addCommand('', `Unknown command: ${command}. Type 'help' for available commands.`, true);
      }
    } catch (error) {
      addCommand('', `Error processing command: ${error instanceof Error ? error.message : String(error)}`, true);
    } finally {
      setIsProcessing(false);
    }
  }, [addCommand, clearTerminal, networkScanner, vulnerabilityScanner, packetAnalyzer]);

  // Handle input submission
  const handleSubmit = useCallback((e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (isProcessing) return;
    
    const command = inputValue.trim();
    if (command) {
      processCommand(command);
      setInputValue('');
    }
  }, [inputValue, isProcessing, processCommand]);

  // Handle keyboard navigation through history
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      
      if (commandHistory.length === 0) return;
      
      const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
      setHistoryIndex(newIndex);
      setInputValue(commandHistory[newIndex] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      
      if (historyIndex <= 0) {
        setHistoryIndex(-1);
        setInputValue('');
        return;
      }
      
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setInputValue(commandHistory[newIndex] || '');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      
      // Simple command completion
      const currentInput = inputValue.toLowerCase();
      
      const completions = [
        'help', 'clear', 'scan', 'vuln-scan', 'packet-capture', 'stop-capture',
        'show devices', 'show vulns', 'show interfaces', 'network-map'
      ];
      
      for (const completion of completions) {
        if (completion.startsWith(currentInput) && completion !== currentInput) {
          setInputValue(completion);
          break;
        }
      }
    }
  }, [commandHistory, historyIndex, inputValue]);

  // Helper to focus the input
  const focusInput = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return {
    commands,
    inputValue,
    setInputValue,
    handleSubmit,
    handleKeyDown,
    inputRef,
    commandsEndRef,
    clearTerminal,
    focusInput,
    isProcessing
  };
};
