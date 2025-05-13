import { Express, Request, Response } from 'express';
import { Server } from 'http';
import { networkInterfaces } from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import { db } from './db';
import { hosts, nmapScans, captureSession, vulnerabilities, packets, ports, settings } from '@shared/schema';
import { eq } from 'drizzle-orm';

const execAsync = promisify(exec);

// API router helper function
function apiRouter(path: string): string {
  return `/api${path}`;
}

// Active capture sessions by ID
const activeCaptureSession: Record<string, any> = {};

/**
 * Register all API routes
 */
export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = new Server(app);

  // ===== Network Scanner Routes =====

  // Scan a network range
  app.post(apiRouter('/scan/network'), async (req: Request, res: Response) => {
    try {
      const { cidr } = req.body;
      
      if (!cidr) {
        return res.status(400).json({ message: 'CIDR network range is required' });
      }
      
      console.log(`Starting nmap network scan on ${cidr}...`);
      
      // Create a new nmap scan entry
      const [nmapScan] = await db.insert(nmapScans).values({
        command: `nmap -sn -T4 ${cidr}`,
        target: cidr,
        status: 'running',
        startTime: new Date()
      }).returning();
      
      // Create a capture session
      const [session] = await db.insert(captureSession).values({
        interface: 'any',
        filter: `net ${cidr}`,
        status: 'running',
        startTime: new Date()
      }).returning();
      
      try {
        // Run an actual nmap ping scan to discover hosts
        console.log(`Running nmap ping scan on ${cidr}...`);
        const { stdout: nmapOutput } = await execAsync(`nmap -sn -T4 ${cidr}`);
        
        // Parse nmap output to find hosts
        const hostLines = nmapOutput.split('\n').filter(line => line.includes('Nmap scan report for'));
        console.log(`Found ${hostLines.length} hosts in nmap scan`);
        
        const discoveredHosts = [];
        
        // Process each discovered host
        for (const hostLine of hostLines) {
          // Extract IP address from nmap output
          const ipMatch = hostLine.match(/Nmap scan report for (?:([^\s]+) \(([0-9.]+)\)|([0-9.]+))/);
          if (ipMatch) {
            const hostname = ipMatch[1];
            const ipAddress = ipMatch[2] || ipMatch[3];
            
            if (ipAddress) {
              console.log(`Scanning discovered host: ${ipAddress}${hostname ? ` (${hostname})` : ''}`);
              
              // Run a more detailed scan on this host
              try {
                console.log(`Starting comprehensive scan of ${ipAddress}...`);
                
                // Check if device is reachable
                try {
                  await execAsync(`ping -c 1 -W 1 ${ipAddress}`);
                } catch (pingError) {
                  console.log(`Device ${ipAddress} is not reachable. Skipping.`);
                  continue;
                }
                
                // Run a basic port scan
                const { stdout: portScanOutput } = await execAsync(`nmap -T4 -F --open ${ipAddress}`);
                
                // Parse the scan output for open ports
                const openPorts = [];
                const portMatches = portScanOutput.matchAll(/(\d+)\/tcp\s+open\s+(\w+)/g);
                for (const match of portMatches) {
                  const portNumber = parseInt(match[1]);
                  const service = match[2];
                  openPorts.push(portNumber);
                  
                  // Store port in database
                  await db.insert(ports).values({
                    hostIp: ipAddress,
                    port: portNumber,
                    protocol: 'tcp',
                    service: service,
                    state: 'open'
                  });
                }
                
                // Determine device type based on ports
                let deviceType = 'unknown';
                if (ipAddress.endsWith('.1') || openPorts.includes(53)) {
                  deviceType = 'router';
                } else if (openPorts.includes(22) && openPorts.includes(80)) {
                  deviceType = 'server';
                } else if (openPorts.includes(3389)) {
                  deviceType = 'computer';
                }
                
                // Try to get MAC address
                let macAddress = null;
                try {
                  await execAsync(`ping -c 1 -W 1 ${ipAddress}`);
                  const { stdout: arpOutput } = await execAsync(`arp -n ${ipAddress} | grep -v Address | awk '{print $3}'`);
                  macAddress = arpOutput.trim();
                  if (macAddress === '(incomplete)') macAddress = null;
                } catch (arpError) {
                  // Ignore ARP errors
                }
                
                // Try to get OS detection
                let osType = 'Unknown';
                try {
                  const { stdout: osDetectionOutput } = await execAsync(`nmap -O --osscan-guess -T4 ${ipAddress}`);
                  const osMatches = osDetectionOutput.match(/OS details: (.+)/);
                  if (osMatches && osMatches[1]) {
                    osType = osMatches[1].split(',')[0].trim();
                  }
                } catch (osError) {
                  // Ignore OS detection errors
                }
                
                // Create or update the host in the database
                const [host] = await db.insert(hosts).values({
                  ipAddress,
                  macAddress: macAddress || null,
                  hostname: hostname || null,
                  osType,
                  status: 'up',
                  lastSeen: new Date(),
                  scanId: nmapScan.id,
                  details: {
                    deviceType,
                    openPorts
                  }
                }).returning();
                
                discoveredHosts.push(host);
              } catch (hostScanError) {
                console.error(`Error scanning host ${ipAddress}:`, hostScanError);
              }
            }
          }
        }
        
        // Add local interfaces to the scan results
        const interfaces = getLocalInterfaces();
        for (const iface of interfaces) {
          console.log(`Adding local interface ${iface.name} (${iface.address}) to results`);
          
          // Create or update the host entry for this interface
          const [host] = await db.insert(hosts).values({
            ipAddress: iface.address,
            macAddress: null, // We'd need to get MAC from OS
            hostname: `localhost-${iface.name}`,
            osType: 'Self',
            status: 'up',
            lastSeen: new Date(),
            scanId: nmapScan.id,
            details: {
              deviceType: 'self',
              interface: iface.name,
              netmask: iface.netmask,
              isLocalInterface: true
            }
          }).returning();
          
          discoveredHosts.push(host);
        }
        
        // Update the nmap scan with the results
        await db.update(nmapScans)
          .set({
            status: 'completed',
            output: nmapOutput,
            xmlOutput: JSON.stringify(discoveredHosts),
            endTime: new Date()
          })
          .where(eq(nmapScans.id, nmapScan.id));
        
        // Update the capture session
        await db.update(captureSession)
          .set({
            status: 'completed',
            endTime: new Date(),
            packetCount: discoveredHosts.length
          })
          .where(eq(captureSession.id, session.id));
        
        console.log(`Network scan complete. Found ${discoveredHosts.length} devices.`);
        
        res.json({
          sessionId: session.id,
          devicesFound: discoveredHosts.length,
          devices: discoveredHosts
        });
      } catch (scanError) {
        console.error('Error during network scan:', scanError);
        
        // Update the nmap scan with error status
        await db.update(nmapScans)
          .set({
            status: 'error',
            output: String(scanError),
            endTime: new Date()
          })
          .where(eq(nmapScans.id, nmapScan.id));
        
        // Update the capture session
        await db.update(captureSession)
          .set({
            status: 'error',
            endTime: new Date()
          })
          .where(eq(captureSession.id, session.id));
        
        throw scanError;
      }
    } catch (error) {
      console.error('Failed to scan network:', error);
      res.status(500).json({ message: 'Failed to scan network', error: String(error) });
    }
  });

  // Get local network interfaces
  app.get(apiRouter('/network/interfaces'), (req: Request, res: Response) => {
    try {
      const interfaces = getLocalInterfaces();
      res.json(interfaces);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get network interfaces', error: String(error) });
    }
  });

  // Get all devices (hosts)
  app.get(apiRouter('/devices'), async (req: Request, res: Response) => {
    try {
      const allHosts = await db.select().from(hosts);
      res.json(allHosts);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get devices', error: String(error) });
    }
  });

  // Get a specific device
  app.get(apiRouter('/devices/:id'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const [host] = await db.select().from(hosts).where(eq(hosts.id, id));
      
      if (!host) {
        return res.status(404).json({ message: 'Device not found' });
      }
      
      // Get ports for this host
      const hostPorts = await db.select().from(ports).where(eq(ports.hostIp, host.ipAddress));
      
      res.json({
        ...host,
        ports: hostPorts
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to get device', error: String(error) });
    }
  });

  // Get vulnerabilities for a device
  app.get(apiRouter('/devices/:id/vulnerabilities'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const [host] = await db.select().from(hosts).where(eq(hosts.id, id));
      
      if (!host) {
        return res.status(404).json({ message: 'Device not found' });
      }
      
      const deviceVulns = await db.select().from(vulnerabilities).where(eq(vulnerabilities.hostId, id));
      res.json(deviceVulns);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get vulnerabilities', error: String(error) });
    }
  });

  // Get all capture sessions
  app.get(apiRouter('/sessions'), async (req: Request, res: Response) => {
    try {
      const sessions = await db.select().from(captureSession);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get sessions', error: String(error) });
    }
  });

  // Get a specific session
  app.get(apiRouter('/sessions/:id'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const [session] = await db.select().from(captureSession).where(eq(captureSession.id, id));
      
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }
      
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get session', error: String(error) });
    }
  });

  // Get packets for a session
  app.get(apiRouter('/sessions/:id/packets'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const sessionPackets = await db.select().from(packets).where(eq(packets.sessionId, id));
      res.json(sessionPackets);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get packets', error: String(error) });
    }
  });

  // Get all vulnerabilities
  app.get(apiRouter('/vulnerabilities'), async (req: Request, res: Response) => {
    try {
      const allVulns = await db.select().from(vulnerabilities);
      res.json(allVulns);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get vulnerabilities', error: String(error) });
    }
  });

  // ===== Shodan Routes =====

  // Search Shodan
  app.post(apiRouter('/shodan/search'), async (req: Request, res: Response) => {
    try {
      const { query } = req.body;
      
      if (!query) {
        return res.status(400).json({ message: 'Search query is required' });
      }
      
      // First check if we have an API key
      const [apiKeySetting] = await db.select().from(settings).where(eq(settings.key, 'SHODAN_API_KEY'));
      
      if (!apiKeySetting || !apiKeySetting.value) {
        return res.status(400).json({ message: 'Shodan API key not configured. Please add your SHODAN_API_KEY in settings.' });
      }
      
      // Use the actual Shodan API 
      const apiKey = apiKeySetting.value;
      const encodedQuery = encodeURIComponent(query);
      const url = `https://api.shodan.io/shodan/host/search?key=${apiKey}&query=${encodedQuery}`;
      
      try {
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Shodan API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Process the results
        res.json({
          query,
          total: data.total || 0,
          matches: data.matches || []
        });
      } catch (fetchError) {
        console.error('Error fetching from Shodan API:', fetchError);
        res.status(500).json({ message: 'Error fetching from Shodan API', error: String(fetchError) });
      }
    } catch (error) {
      res.status(500).json({ message: 'Failed to search Shodan', error: String(error) });
    }
  });
  
  // Get Shodan host information
  app.get(apiRouter('/shodan/host/:ip'), async (req: Request, res: Response) => {
    try {
      const { ip } = req.params;
      
      // Validate IP format
      if (!isValidIp(ip)) {
        return res.status(400).json({ message: 'Invalid IP address format' });
      }
      
      // First check if we have an API key
      const [apiKeySetting] = await db.select().from(settings).where(eq(settings.key, 'SHODAN_API_KEY'));
      
      if (!apiKeySetting || !apiKeySetting.value) {
        return res.status(400).json({ message: 'Shodan API key not configured. Please add your SHODAN_API_KEY in settings.' });
      }
      
      // Use the actual Shodan API
      const apiKey = apiKeySetting.value;
      const url = `https://api.shodan.io/shodan/host/${ip}?key=${apiKey}`;
      
      try {
        const response = await fetch(url);
        
        if (response.status === 404) {
          return res.status(404).json({ message: 'No information available for this IP' });
        }
        
        if (!response.ok) {
          throw new Error(`Shodan API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        res.json(data);
      } catch (fetchError) {
        console.error('Error fetching from Shodan API:', fetchError);
        res.status(500).json({ message: 'Error fetching from Shodan API', error: String(fetchError) });
      }
    } catch (error) {
      res.status(500).json({ message: 'Failed to get host information', error: String(error) });
    }
  });

  // ===== Settings Routes =====
  
  // Get all settings
  app.get(apiRouter('/settings'), async (req: Request, res: Response) => {
    try {
      const allSettings = await db.select().from(settings);
      
      // Hide secret values
      const sanitizedSettings = allSettings.map(setting => {
        if (setting.isSecret && setting.value) {
          return { ...setting, value: '********' };
        }
        return setting;
      });
      
      res.json(sanitizedSettings);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get settings', error: String(error) });
    }
  });
  
  // Get a specific setting
  app.get(apiRouter('/settings/:key'), async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      const [setting] = await db.select().from(settings).where(eq(settings.key, key));
      
      if (!setting) {
        return res.status(404).json({ message: 'Setting not found' });
      }
      
      // Hide secret value
      if (setting.isSecret && setting.value) {
        return res.json({ ...setting, value: '********' });
      }
      
      res.json(setting);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get setting', error: String(error) });
    }
  });
  
  // Create or update a setting
  app.post(apiRouter('/settings'), async (req: Request, res: Response) => {
    try {
      const { key, value, isSecret = false } = req.body;
      
      if (!key || value === undefined) {
        return res.status(400).json({ message: 'Key and value are required' });
      }
      
      // Check if setting exists
      const [existingSetting] = await db.select().from(settings).where(eq(settings.key, key));
      
      if (existingSetting) {
        // Update existing setting
        const [updatedSetting] = await db.update(settings)
          .set({ value, isSecret })
          .where(eq(settings.key, key))
          .returning();
        
        // Hide secret value in response
        if (updatedSetting.isSecret && updatedSetting.value) {
          return res.json({ ...updatedSetting, value: '********' });
        }
        
        res.json(updatedSetting);
      } else {
        // Create new setting
        const [newSetting] = await db.insert(settings)
          .values({ key, value, isSecret })
          .returning();
        
        // Hide secret value in response
        if (newSetting.isSecret && newSetting.value) {
          return res.status(201).json({ ...newSetting, value: '********' });
        }
        
        res.status(201).json(newSetting);
      }
    } catch (error) {
      res.status(500).json({ message: 'Failed to create/update setting', error: String(error) });
    }
  });
  
  return httpServer;
}

/**
 * Get the local machine's network interfaces
 */
function getLocalInterfaces(): { name: string, address: string, netmask: string }[] {
  const interfaces = networkInterfaces();
  const results: { name: string, address: string, netmask: string }[] = [];
  
  Object.entries(interfaces).forEach(([name, nets]) => {
    if (nets) {
      nets.forEach(net => {
        // Only include IPv4 addresses
        if (net.family === 'IPv4' && !net.internal) {
          results.push({
            name,
            address: net.address,
            netmask: net.netmask
          });
        }
      });
    }
  });
  
  return results;
}

/**
 * Validate IP address format
 */
function isValidIp(ip: string): boolean {
  // Simple regex for IPv4 validation
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipv4Regex.test(ip);
}