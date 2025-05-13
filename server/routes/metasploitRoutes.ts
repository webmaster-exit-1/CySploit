import { Express, Request, Response } from 'express';
import { db } from '../db';
import { settings } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { 
  initializeMetasploitDbConnection, 
  connectToMetasploit, 
  runMetasploitScan, 
  executeMetasploitModule, 
  getMetasploitModules, 
  getMetasploitSessions,
  makeRpcCall
} from '../services/metasploitService';

/**
 * Register all Metasploit-related routes
 */
export function registerMetasploitRoutes(app: Express) {
  // Initialize Metasploit database connection
  app.post('/api/metasploit/init-db', async (req: Request, res: Response) => {
    try {
      const { host, port, username, password } = req.body;
      
      if (!host || !port || !username || !password) {
        return res.status(400).json({ 
          success: false, 
          message: 'Missing required connection parameters'
        });
      }
      
      // Save settings first
      await db.insert(settings).values({ key: 'metasploit.host', value: host }).onConflictDoUpdate({
        target: settings.key,
        set: { value: host }
      });
      
      await db.insert(settings).values({ key: 'metasploit.port', value: port.toString() }).onConflictDoUpdate({
        target: settings.key,
        set: { value: port.toString() }
      });
      
      await db.insert(settings).values({ key: 'metasploit.username', value: username }).onConflictDoUpdate({
        target: settings.key,
        set: { value: username }
      });
      
      await db.insert(settings).values({ key: 'metasploit.password', value: password, isSecret: true }).onConflictDoUpdate({
        target: settings.key,
        set: { value: password, isSecret: true }
      });
      
      const config = { host, port, username, password };
      const result = await initializeMetasploitDbConnection(config);
      
      if (result) {
        res.json({ success: true, message: 'Metasploit database connection initialized' });
      } else {
        res.status(500).json({ 
          success: false, 
          message: 'Failed to initialize Metasploit database connection'
        });
      }
    } catch (error) {
      console.error('Error initializing Metasploit DB:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to initialize Metasploit database connection',
        error: String(error)
      });
    }
  });
  
  // Get Metasploit connection status
  app.get('/api/metasploit/status', async (_req: Request, res: Response) => {
    try {
      // Check if we have connection settings
      const [hostSetting] = await db.select().from(settings).where(eq(settings.key, 'metasploit.host'));
      const [portSetting] = await db.select().from(settings).where(eq(settings.key, 'metasploit.port'));
      const [usernameSetting] = await db.select().from(settings).where(eq(settings.key, 'metasploit.username'));
      const [passwordSetting] = await db.select().from(settings).where(eq(settings.key, 'metasploit.password'));
      
      if (!hostSetting || !portSetting || !usernameSetting || !passwordSetting) {
        return res.json({
          configured: false,
          connected: false,
          message: 'Metasploit RPC not configured. Please configure in settings.'
        });
      }
      
      // Try to connect
      const config = {
        host: hostSetting.value,
        port: parseInt(portSetting.value),
        username: usernameSetting.value,
        password: passwordSetting.value
      };
      
      const result = await connectToMetasploit(config);
      
      if (result.success) {
        // Try to get version info to confirm connection is working
        try {
          const versionInfo = await makeRpcCall('core.version');
          
          res.json({
            configured: true,
            connected: true,
            version: versionInfo,
            message: 'Connected to Metasploit RPC'
          });
        } catch (versionError) {
          res.json({
            configured: true,
            connected: true,
            message: 'Connected to Metasploit RPC but could not get version info'
          });
        }
      } else {
        res.json({
          configured: true,
          connected: false,
          message: result.message || 'Failed to connect to Metasploit RPC'
        });
      }
    } catch (error) {
      console.error('Error checking Metasploit connection:', error);
      res.status(500).json({
        configured: false,
        connected: false,
        message: `Error checking Metasploit connection: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  });
  
  // Connect to Metasploit RPC
  app.post('/api/metasploit/connect', async (req: Request, res: Response) => {
    try {
      const { host, port, username, password } = req.body;
      
      if (!host || !port || !username || !password) {
        return res.status(400).json({ 
          success: false, 
          message: 'Missing required connection parameters'
        });
      }
      
      const config = { host, port, username, password };
      const result = await connectToMetasploit(config);
      
      if (result.success) {
        res.json({
          success: true,
          message: result.message || 'Connected to Metasploit RPC'
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message || 'Failed to connect to Metasploit RPC'
        });
      }
    } catch (error) {
      console.error('Error connecting to Metasploit:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to connect to Metasploit',
        error: String(error)
      });
    }
  });
  
  // Run Metasploit scan
  app.post('/api/metasploit/scan', async (req: Request, res: Response) => {
    try {
      const { target, scanType } = req.body;
      
      if (!target || !scanType) {
        return res.status(400).json({ 
          success: false, 
          message: 'Target and scan type are required'
        });
      }
      
      const result = await runMetasploitScan(target, scanType);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error running Metasploit scan:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to run Metasploit scan',
        error: String(error)
      });
    }
  });
  
  // Execute Metasploit module
  app.post('/api/metasploit/execute', async (req: Request, res: Response) => {
    try {
      // Handle both direct command execution and module execution
      const { command, moduleName, moduleType, options } = req.body;
      
      // If command is provided, execute it directly
      if (command) {
        try {
          // First ensure we're connected to Metasploit
          // We'll try to use saved settings if they exist
          const [hostSetting] = await db.select().from(settings).where(eq(settings.key, 'metasploit.host'));
          const [portSetting] = await db.select().from(settings).where(eq(settings.key, 'metasploit.port'));
          const [usernameSetting] = await db.select().from(settings).where(eq(settings.key, 'metasploit.username'));
          const [passwordSetting] = await db.select().from(settings).where(eq(settings.key, 'metasploit.password'));
          
          if (!hostSetting || !portSetting || !usernameSetting || !passwordSetting) {
            return res.status(400).json({
              success: false,
              error: 'Metasploit connection settings not configured. Please configure in Settings.'
            });
          }
          
          // Connect to Metasploit if not already connected
          const config = {
            host: hostSetting.value,
            port: parseInt(portSetting.value),
            username: usernameSetting.value,
            password: passwordSetting.value
          };
          
          // Connect to Metasploit
          await connectToMetasploit(config);
          
          // Create a console if needed and execute the command
          const consoleId = await makeRpcCall('console.create');
          await makeRpcCall('console.write', [consoleId, `${command}\n`]);
          
          // Wait for output (with timeout)
          let complete = false;
          let output = '';
          let retries = 0;
          
          while (!complete && retries < 30) {
            const response = await makeRpcCall('console.read', [consoleId]);
            
            output += response.data;
            complete = response.busy === false;
            
            if (!complete) {
              await new Promise(resolve => setTimeout(resolve, 500));
              retries++;
            }
          }
          
          return res.json({
            success: true,
            data: {
              output,
              consoleId
            }
          });
        } catch (error: any) {
          console.error('Error executing Metasploit command:', error);
          
          return res.status(500).json({
            success: false,
            error: error.message || 'Failed to execute Metasploit command'
          });
        }
      } 
      // Otherwise, handle module execution
      else if (moduleName && moduleType) {
        const result = await executeMetasploitModule(moduleType, moduleName, options || {});
        
        if (result.success) {
          return res.json(result);
        } else {
          return res.status(400).json(result);
        }
      } else {
        return res.status(400).json({ 
          success: false, 
          error: 'Either command or (moduleName and moduleType) must be provided'
        });
      }
    } catch (error) {
      console.error('Error executing Metasploit operation:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to execute Metasploit operation',
        message: String(error)
      });
    }
  });
  
  // Get Metasploit modules
  app.get('/api/metasploit/modules', async (req: Request, res: Response) => {
    try {
      const moduleType = req.query.type as string;
      const result = await getMetasploitModules(moduleType);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error getting Metasploit modules:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to get Metasploit modules',
        error: String(error)
      });
    }
  });
  
  // Get Metasploit sessions
  app.get('/api/metasploit/sessions', async (_req: Request, res: Response) => {
    try {
      const result = await getMetasploitSessions();
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error getting Metasploit sessions:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to get Metasploit sessions',
        error: String(error)
      });
    }
  });
}