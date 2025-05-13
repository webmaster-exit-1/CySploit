import { Express, Request, Response } from 'express';
import { db } from '../db';
import { settings, shodanSearches } from '@shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Register all Shodan-related routes
 */
export function registerShodanRoutes(app: Express) {
  // Get Shodan API key info (without revealing the key)
  app.get('/api/shodan/info', async (_req: Request, res: Response) => {
    try {
      // Check if Shodan API key is configured
      const [apiKeySetting] = await db.select().from(settings).where(eq(settings.key, 'SHODAN_API_KEY'));
      
      if (!apiKeySetting || !apiKeySetting.value) {
        return res.status(400).json({ 
          configured: false,
          message: 'Shodan API key not configured'
        });
      }
      
      // Test the API key with a simple API call
      try {
        const response = await fetch(`https://api.shodan.io/api-info?key=${apiKeySetting.value}`);
        
        if (!response.ok) {
          return res.status(400).json({
            configured: true,
            valid: false,
            message: 'API key is configured but appears to be invalid'
          });
        }
        
        const data = await response.json();
        
        res.json({
          configured: true,
          valid: true,
          plan: data.plan,
          https: data.https,
          unlocked: data.unlocked,
          queriesRemaining: data.query_credits,
          scanCredits: data.scan_credits
        });
      } catch (apiError) {
        console.error('Error testing Shodan API key:', apiError);
        res.status(500).json({ 
          configured: true,
          valid: false,
          message: 'Error testing Shodan API key',
          error: String(apiError)
        });
      }
    } catch (error) {
      console.error('Error checking Shodan API key:', error);
      res.status(500).json({ 
        message: 'Error checking Shodan API key configuration',
        error: String(error)
      });
    }
  });
  
  // Get host information from Shodan
  app.get('/api/shodan/host/:ip', async (req: Request, res: Response) => {
    try {
      const { ip } = req.params;
      
      // Validate IP format
      if (!isValidIp(ip)) {
        return res.status(400).json({ message: 'Invalid IP address format' });
      }
      
      // Check if Shodan API key is configured
      const [apiKeySetting] = await db.select().from(settings).where(eq(settings.key, 'SHODAN_API_KEY'));
      
      if (!apiKeySetting || !apiKeySetting.value) {
        return res.status(400).json({ 
          message: 'Shodan API key not configured. Please add your SHODAN_API_KEY in settings.'
        });
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
        
        // Store the search result in the database
        await db.insert(shodanSearches).values({
          query: `host:${ip}`,
          resultCount: 1,
          rawResults: data
        });
        
        res.json(data);
      } catch (fetchError) {
        console.error('Error fetching from Shodan API:', fetchError);
        res.status(500).json({ 
          message: 'Error fetching from Shodan API',
          error: String(fetchError)
        });
      }
    } catch (error) {
      console.error('Error getting host information from Shodan:', error);
      res.status(500).json({ 
        message: 'Failed to get host information',
        error: String(error)
      });
    }
  });
  
  // Search Shodan
  app.post('/api/shodan/search', async (req: Request, res: Response) => {
    try {
      const { query } = req.body;
      
      if (!query) {
        return res.status(400).json({ message: 'Search query is required' });
      }
      
      // Check if Shodan API key is configured
      const [apiKeySetting] = await db.select().from(settings).where(eq(settings.key, 'SHODAN_API_KEY'));
      
      if (!apiKeySetting || !apiKeySetting.value) {
        return res.status(400).json({ 
          message: 'Shodan API key not configured. Please add your SHODAN_API_KEY in settings.'
        });
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
        
        // Store the search result in the database
        await db.insert(shodanSearches).values({
          query,
          resultCount: data.total || 0,
          rawResults: data
        });
        
        // Process the results
        res.json({
          query,
          total: data.total || 0,
          matches: data.matches || []
        });
      } catch (fetchError) {
        console.error('Error fetching from Shodan API:', fetchError);
        res.status(500).json({ 
          message: 'Error fetching from Shodan API',
          error: String(fetchError)
        });
      }
    } catch (error) {
      console.error('Error searching Shodan:', error);
      res.status(500).json({ 
        message: 'Failed to search Shodan',
        error: String(error)
      });
    }
  });
  
  // Get CVE details from Shodan
  app.get('/api/shodan/cve/:cveId', async (req: Request, res: Response) => {
    try {
      const { cveId } = req.params;
      
      // Validate CVE ID format
      if (!isValidCveId(cveId)) {
        return res.status(400).json({ message: 'Invalid CVE ID format' });
      }
      
      // Check if Shodan API key is configured
      const [apiKeySetting] = await db.select().from(settings).where(eq(settings.key, 'SHODAN_API_KEY'));
      
      if (!apiKeySetting || !apiKeySetting.value) {
        return res.status(400).json({ 
          message: 'Shodan API key not configured. Please add your SHODAN_API_KEY in settings.'
        });
      }
      
      // Use the actual Shodan API to get CVE details
      const apiKey = apiKeySetting.value;
      const url = `https://api.shodan.io/shodan/exploit/search?key=${apiKey}&query=cve:${cveId}`;
      
      try {
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Shodan API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.matches || data.matches.length === 0) {
          return res.status(404).json({ message: 'No information available for this CVE' });
        }
        
        // Return the found exploits
        res.json({
          cveId,
          total: data.total || 0,
          exploits: data.matches || []
        });
      } catch (fetchError) {
        console.error('Error fetching CVE details from Shodan API:', fetchError);
        res.status(500).json({ 
          message: 'Error fetching CVE details from Shodan API',
          error: String(fetchError)
        });
      }
    } catch (error) {
      console.error('Error getting CVE details:', error);
      res.status(500).json({ 
        message: 'Failed to get CVE details',
        error: String(error)
      });
    }
  });
}

/**
 * Validate IP address format
 */
function isValidIp(ip: string): boolean {
  // Simple regex for IPv4 validation
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipv4Regex.test(ip);
}

/**
 * Validate CVE ID format
 */
function isValidCveId(cveId: string): boolean {
  // Format: CVE-YYYY-NNNNN (where YYYY is year and NNNNN is a sequence number)
  const cveRegex = /^CVE-\d{4}-\d{4,}$/i;
  return cveRegex.test(cveId);
}