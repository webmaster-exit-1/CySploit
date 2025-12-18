import { Express, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { Server } from 'http';
import { networkInterfaces } from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { db } from './db';
import { hosts, nmapScans, captureSession, vulnerabilities, packets, ports, settings } from '@shared/schema';
import { eq } from 'drizzle-orm';

const execAsync = promisify(execFile);

async function upsertHostByIp(params: {
  scanId: number;
  ipAddress: string;
  name?: string | null;
  macAddress?: string | null;
}): Promise<typeof hosts.$inferSelect> {
  const { scanId, ipAddress, name = null, macAddress = null } = params;

  const [existing] = await db.select().from(hosts).where(eq(hosts.ipAddress, ipAddress));
  if (existing) {
    const [updated] = await db
      .update(hosts)
      .set({
        scanId,
        name,
        macAddress,
        lastSeen: new Date(),
      })
      .where(eq(hosts.id, existing.id))
      .returning();

    return updated ?? existing;
  }

  const [inserted] = await db
    .insert(hosts)
    .values({
      scanId,
      ipAddress,
      name,
      macAddress,
      lastSeen: new Date(),
    })
    .returning();

  return inserted;
}

function severityFromCvssScore(score: number | null): 'critical' | 'high' | 'medium' | 'low' {
  if (score === null || Number.isNaN(score)) return 'medium';
  if (score >= 9) return 'critical';
  if (score >= 7) return 'high';
  if (score >= 4) return 'medium';
  return 'low';
}

function extractCvesWithContext(nmapOutput: string): Array<{ cveId: string; context: string }> {
  const lines = nmapOutput.split(/\r?\n/);
  const results: Array<{ cveId: string; context: string }> = [];

  for (const line of lines) {
    const matches = line.match(/CVE-\d{4}-\d{4,7}/g);
    if (!matches) continue;
    for (const cveId of matches) {
      results.push({ cveId, context: line.trim() });
    }
  }

  return results;
}

// API router helper function
function apiRouter(path: string): string {
  return `/api${path}`;
}

// Active capture sessions by ID

/**
 * Register all API routes
 */
export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = new Server(app);

  // Define rate limiter: maximum of 100 requests per 15 minutes
  const scanNetworkLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: { message: 'Too many requests, please try again later.' }
  });

  // ===== Network Scanner Routes =====

  // Scan a network range
  app.post(apiRouter('/scan/network'), scanNetworkLimiter, async (req: Request, res: Response) => {
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
        const { stdout: nmapOutput } = await execAsync(
          'nmap',
          ['-sn', '-T4', cidr]
        );

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
                  await execAsync('ping', ['-c', '1', '-W', '1', ipAddress]);
                } catch {
                  console.log(`Device ${ipAddress} is not reachable. Skipping.`);
                  continue;
                }

                // Run a basic port scan
                const { stdout: portScanOutput } = await execAsync('nmap', ['-T4', '-F', '--open', ipAddress]);

                // Parse the scan output for open ports
                const openPorts = [];
                const portDetails: { portNumber: number, service: string }[] = [];
                const portMatches = portScanOutput.matchAll(/(\d+)\/tcp\s+open\s+(\w+)/g);
                for (const match of Array.from(portMatches)) {
                  const portNumber = parseInt(match[1]);
                  const service = match[2];
                  openPorts.push(portNumber);
                  portDetails.push({ portNumber, service });
                }

                // Determine device type based on ports
                // Note: Device type detection logic can be enhanced in the future
                if (ipAddress.endsWith('.1') || openPorts.includes(53)) {
                  // Potential router or DNS server
                } else if (openPorts.includes(22) && openPorts.includes(80)) {
                  // Potential web server
                } else if (openPorts.includes(3389)) {
                  // Potential Windows RDP server
                }

                // Try to get MAC address
                let macAddress = null;
                try {
                  await execAsync('ping', ['-c', '1', '-W', '1', ipAddress]);
                  const { stdout: neighOutput } = await execAsync('ip', ['neigh', 'show', ipAddress]);
                  const match = neighOutput.match(/\blladdr\s+([0-9a-f:]{17})\b/i);
                  macAddress = match?.[1] ?? null;
                } catch {
                  // Ignore ARP errors
                }

                // Try to get OS detection
                try {
                  const { stdout: osDetectionOutput } = await execAsync('nmap', ['-O', '--osscan-guess', '-T4', ipAddress]);
                  const osMatches = osDetectionOutput.match(/OS details: (.+)/);
                  if (osMatches && osMatches[1]) {
                    // OS detection successful - can be used in future enhancement
                  }
                } catch {
                  // Ignore OS detection errors
                }

                // Create or update the host in the database
                const host = await upsertHostByIp({
                  scanId: nmapScan.id,
                  ipAddress,
                  name: hostname || null,
                  macAddress,
                });

                // Replace prior port records for this host (keeps latest scan view clean)
                await db.delete(ports).where(eq(ports.hostId, host.id));

                // Store ports in database, now that host.id is available
                for (const { portNumber, service } of portDetails) {
                  await db.insert(ports).values({
                    hostId: host.id, // Use the correct property and type as per your schema
                    portNumber: portNumber,
                    protocol: 'tcp',
                    service: service,
                    state: 'open'
                  });
                }

                discoveredHosts.push(host);
              } catch (hostScanError) {
                console.error(`Error scanning host ${ipAddress}:`, hostScanError);
              }
            }
          }
        }

        // Add local interfaces to the scan results
        const interfaces = getLocalInterfaces();
        const seenIps = new Set<string>(discoveredHosts.map((h) => h.ipAddress));
        for (const iface of interfaces) {
          if (seenIps.has(iface.address)) {
            continue;
          }
          console.log(`Adding local interface ${iface.name} (${iface.address}) to results`);

          // Create or update the host entry for this interface
          const host = await upsertHostByIp({
            scanId: nmapScan.id,
            ipAddress: iface.address,
            name: `localhost-${iface.name}`,
            macAddress: null,
          });

          discoveredHosts.push(host);
          seenIps.add(iface.address);
        }

        // Update the nmap scan with the results
        await db.update(nmapScans)
          .set({
            status: 'completed',
            rawOutput: nmapOutput,
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
            rawOutput: String(scanError),
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

  // Scan a device for vulnerabilities (best-effort via nmap vuln scripts)
  app.post(apiRouter('/scan/vulnerabilities'), scanNetworkLimiter, async (req: Request, res: Response) => {
    try {
      const { deviceId, level } = req.body as { deviceId?: unknown; level?: unknown };
      const parsedDeviceId = typeof deviceId === 'number' ? deviceId : Number(deviceId);

      if (!Number.isFinite(parsedDeviceId) || parsedDeviceId <= 0) {
        return res.status(400).json({ message: 'deviceId is required' });
      }

      const [host] = await db.select().from(hosts).where(eq(hosts.id, parsedDeviceId));
      if (!host) {
        return res.status(404).json({ message: 'Device not found' });
      }

      const ipAddress = host.ipAddress;
      const scanLevel = typeof level === 'string' ? level : 'basic';
      const args = scanLevel === 'deep'
        ? ['-sV', '--script', 'vuln', '-T4', '--version-all', ipAddress]
        : ['-sV', '--script', 'vuln', '-T4', ipAddress];

      const [nmapScan] = await db.insert(nmapScans).values({
        command: `nmap ${args.join(' ')}`,
        target: ipAddress,
        status: 'running',
        startTime: new Date(),
      }).returning();

      let stdout = '';
      let stderr = '';
      try {
        const result = await execAsync('nmap', args);
        stdout = result.stdout ?? '';
        stderr = result.stderr ?? '';

        await db.update(nmapScans)
          .set({
            status: 'completed',
            rawOutput: `${stdout}${stderr ? `\n\nSTDERR:\n${stderr}` : ''}`,
            endTime: new Date(),
          })
          .where(eq(nmapScans.id, nmapScan.id));
      } catch (scanError) {
        await db.update(nmapScans)
          .set({
            status: 'error',
            rawOutput: String(scanError),
            endTime: new Date(),
          })
          .where(eq(nmapScans.id, nmapScan.id));

        return res.status(500).json({
          message: 'Failed to run vulnerability scan (nmap)',
          error: scanError instanceof Error ? scanError.message : String(scanError),
        });
      }

      // Replace existing vulns for this host with the latest scan results
      await db.delete(vulnerabilities).where(eq(vulnerabilities.hostId, host.id));

      const cvesWithContext = extractCvesWithContext(stdout);
      const uniqueByCve = new Map<string, string>();
      for (const item of cvesWithContext) {
        if (!uniqueByCve.has(item.cveId)) uniqueByCve.set(item.cveId, item.context);
      }

      // Best-effort CVSS extraction (some nmap scripts print 'CVSS: X.Y')
      const cvssMatch = stdout.match(/\bCVSS:?\s*(\d+(?:\.\d+)?)\b/i);
      const cvssScore = cvssMatch ? Number(cvssMatch[1]) : null;
      const severity = severityFromCvssScore(cvssScore);

      const insertValues = Array.from(uniqueByCve.entries()).map(([cveId, context]) => ({
        hostId: host.id,
        cveId,
        cvssScore: cvssScore === null ? null : String(cvssScore),
        severity,
        title: `Detected ${cveId}`,
        description: context || null,
        scanId: nmapScan.id,
        discoveredAt: new Date(),
      }));

      const inserted = insertValues.length > 0
        ? await db.insert(vulnerabilities).values(insertValues).returning()
        : [];

      res.json({
        sessionId: nmapScan.id,
        vulnerabilitiesFound: inserted.length,
        vulnerabilities: inserted.map((v) => ({
          id: v.id,
          deviceId: v.hostId,
          cveId: v.cveId ?? undefined,
          severity: (v.severity as 'critical' | 'high' | 'medium' | 'low'),
          title: v.title,
          description: v.description ?? undefined,
          status: 'detected',
          discoveredAt: (v.discoveredAt ? new Date(v.discoveredAt).toISOString() : new Date().toISOString()),
        })),
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to scan vulnerabilities', error: String(error) });
    }
  });

  // Get local network interfaces
  app.get(apiRouter('/network/interfaces'), (_req: Request, res: Response) => {
    try {
      const interfaces = getLocalInterfaces();
      res.json(interfaces);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get network interfaces', error: String(error) });
    }
  });

  // Get current Wi-Fi SSID (best-effort; may be null if not connected or tooling unavailable)
  app.get(apiRouter('/network/ssid'), async (_req: Request, res: Response) => {
    try {
      const ssid = await getCurrentWifiSsid();
      res.json({ ssid });
    } catch (error) {
      res.status(500).json({ message: 'Failed to get Wi-Fi SSID', error: String(error) });
    }
  });

  // Get current network connection info (best-effort)
  app.get(apiRouter('/network/connection'), async (_req: Request, res: Response) => {
    try {
      const info = await getNetworkConnectionInfo();
      res.json(info);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get network connection info', error: String(error) });
    }
  });

  // Get all devices (hosts)
  app.get(apiRouter('/devices'), async (_req: Request, res: Response) => {
    try {
      const allHosts = await db.select().from(hosts);

      // Dedupe by IP address so repeated scans don't create overlapping devices in UI.
      // Keep the most recently seen host per IP.
      const byIp = new Map<string, (typeof hosts.$inferSelect)>();
      for (const host of allHosts) {
        const ip = host.ipAddress;
        const existing = byIp.get(ip);
        if (!existing) {
          byIp.set(ip, host);
          continue;
        }

        const existingTime = existing.lastSeen ? new Date(existing.lastSeen).getTime() : 0;
        const hostTime = host.lastSeen ? new Date(host.lastSeen).getTime() : 0;
        if (hostTime >= existingTime) {
          byIp.set(ip, host);
        }
      }

      res.json(Array.from(byIp.values()));
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
      const hostPorts = await db.select().from(ports).where(eq(ports.hostId, host.id));

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
  app.get(apiRouter('/sessions'), async (_req: Request, res: Response) => {
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
  app.get(apiRouter('/vulnerabilities'), async (_req: Request, res: Response) => {
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

        const data = await response.json() as unknown;
        const record = (typeof data === 'object' && data !== null) ? (data as Record<string, unknown>) : undefined;
        const total = typeof record?.total === 'number' ? record.total : 0;
        const matches = Array.isArray(record?.matches) ? record?.matches : [];

        // Process the results
        res.json({
          query,
          total,
          matches
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
  app.get(apiRouter('/settings'), async (_req: Request, res: Response) => {
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

async function getCurrentWifiSsid(): Promise<string | null> {
  // Linux best-effort: prefer NetworkManager (nmcli), fallback to iwgetid.
  try {
    const { stdout } = await execAsync('nmcli', ['-t', '-f', 'active,ssid', 'dev', 'wifi']);
    const lines = stdout
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    for (const line of lines) {
      // Format: yes:<ssid> or no:<ssid>
      const [active, ...rest] = line.split(':');
      if (active === 'yes') {
        const ssid = rest.join(':').trim();
        if (ssid) return ssid;
      }
    }
  } catch {
    // Ignore (nmcli not installed or not running under NetworkManager)
  }

  try {
    const { stdout } = await execAsync('iwgetid', ['-r']);
    const ssid = stdout.trim();
    if (ssid) return ssid;
  } catch {
    // Ignore (iwgetid not installed or not connected)
  }

  return null;
}

type NetworkConnectionInfo = {
  type: 'wifi' | 'ethernet' | 'unknown';
  device: string | null;
  ssid: string | null;
};

async function getNetworkConnectionInfo(): Promise<NetworkConnectionInfo> {
  // Linux best-effort: use NetworkManager (nmcli) if present.
  try {
    const { stdout } = await execAsync('nmcli', ['-t', '-f', 'DEVICE,TYPE,STATE,CONNECTION', 'dev', 'status']);
    const lines = stdout
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    for (const line of lines) {
      const [device, type, state, connection] = line.split(':');
      if (state !== 'connected') continue;

      if (type === 'wifi') {
        // Prefer a precise SSID lookup if possible.
        const ssid = (await getCurrentWifiSsid()) ?? (connection?.trim() || null);
        return { type: 'wifi', device: device || null, ssid };
      }

      if (type === 'ethernet') {
        return { type: 'ethernet', device: device || null, ssid: null };
      }
    }
  } catch {
    // Ignore (nmcli not installed)
  }

  // Fallback: if we can read an SSID, assume Wi‑Fi; otherwise unknown.
  const ssid = await getCurrentWifiSsid();
  if (ssid) {
    return { type: 'wifi', device: null, ssid };
  }

  return { type: 'unknown', device: null, ssid: null };
}

/**
 * Validate IP address format
 */
function isValidIp(ip: string): boolean {
  // Simple regex for IPv4 validation
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipv4Regex.test(ip);
}
