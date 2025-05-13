import * as net from 'net';
import msgpackLite from 'msgpack-lite';
import crypto from 'crypto';

const msgpack = msgpackLite;

// Metasploit RPC API implementation
let rpcClient: net.Socket | null = null;
let rpcToken: string | null = null;
let rpcConfig: MetasploitConfig | null = null;

interface MetasploitConfig {
  host: string;
  port: number;
  username: string;
  password: string;
}

/**
 * Initialize the metasploit database connection
 */
export async function initializeMetasploitDbConnection(config: MetasploitConfig): Promise<boolean> {
  try {
    rpcConfig = config;
    const result = await connectToMetasploit(config);
    return result.success;
  } catch (error) {
    console.error('Failed to initialize Metasploit database connection:', error);
    throw error;
  }
}

/**
 * Connect to the Metasploit RPC server
 */
export async function connectToMetasploit(config: MetasploitConfig): Promise<{ success: boolean; message?: string }> {
  try {
    // If already connected with the same config, reuse the connection
    if (rpcClient && rpcClient.connecting === false && rpcClient.destroyed === false && 
        rpcToken && rpcConfig &&
        rpcConfig.host === config.host && 
        rpcConfig.port === config.port) {
      return { success: true, message: 'Already connected to Metasploit RPC' };
    }

    // Close existing connection if any
    if (rpcClient && !rpcClient.destroyed) {
      rpcClient.destroy();
      rpcClient = null;
    }

    rpcConfig = config;
    
    // Connect to Metasploit RPC
    rpcClient = new net.Socket();
    
    return new Promise((resolve, reject) => {
      if (!rpcClient) {
        return reject(new Error('RPC client not initialized'));
      }
      
      rpcClient.connect(config.port, config.host, async () => {
        try {
          // Authenticate to get a token
          const authResult = await makeRpcCall('auth.login', [config.username, config.password]);
          
          if (authResult && authResult.token) {
            rpcToken = authResult.token;
            console.log('Successfully connected to Metasploit RPC');
            resolve({ success: true, message: 'Connected to Metasploit RPC' });
          } else {
            reject(new Error('Failed to authenticate with Metasploit RPC'));
          }
        } catch (authError) {
          console.error('Authentication failed:', authError);
          reject(authError);
        }
      });
      
      rpcClient.on('error', (error) => {
        console.error('Metasploit RPC connection error:', error);
        rpcClient = null;
        rpcToken = null;
        reject(error);
      });
      
      rpcClient.on('close', () => {
        console.log('Metasploit RPC connection closed');
        rpcClient = null;
        rpcToken = null;
      });
    });
  } catch (error) {
    console.error('Failed to connect to Metasploit RPC:', error);
    return { 
      success: false, 
      message: `Failed to connect to Metasploit RPC: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

/**
 * Make an RPC call to the Metasploit server
 */
export async function makeRpcCall(method: string, params: any[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!rpcClient || rpcClient.destroyed) {
      return reject(new Error('Not connected to Metasploit RPC'));
    }
    
    // Prepare the RPC call
    let rpcCall: any;
    
    if (method === 'auth.login') {
      // Authentication call doesn't need a token
      rpcCall = {
        method,
        params,
        id: crypto.randomBytes(16).toString('hex')
      };
    } else {
      // All other calls need the token
      if (!rpcToken) {
        return reject(new Error('Not authenticated with Metasploit RPC'));
      }
      
      rpcCall = {
        method,
        params: [rpcToken, ...params],
        id: crypto.randomBytes(16).toString('hex')
      };
    }
    
    // Use msgpack to encode the request
    const packedData = msgpack.encode(rpcCall);
    
    // Add a data handler for this specific call
    const dataHandler = (data: Buffer) => {
      try {
        // Decode the response with msgpack
        const response = msgpack.decode(data);
        
        // Remove the handler
        rpcClient?.removeListener('data', dataHandler);
        
        if (response.error) {
          // Handle RPC error
          console.error('Metasploit RPC error:', response.error);
          reject(new Error(`Metasploit RPC error: ${response.error}`));
        } else {
          // Return the result
          resolve(response.result);
        }
      } catch (error) {
        console.error('Error processing Metasploit RPC response:', error);
        reject(error);
      }
    };
    
    // Listen for the response
    rpcClient.once('data', dataHandler);
    
    // Send the request
    rpcClient.write(packedData);
  });
}

/**
 * Run a Metasploit scan on a target
 */
export async function runMetasploitScan(target: string, scanType: string): Promise<any> {
  try {
    if (!rpcClient || !rpcToken) {
      await reconnectIfNeeded();
    }
    
    // Create a console session
    const consoleId = await makeRpcCall('console.create');
    
    // Determine the scan command based on the scan type
    let scanCommand: string;
    switch (scanType) {
      case 'tcp':
        scanCommand = `db_nmap -sS -sV ${target}`;
        break;
      case 'udp':
        scanCommand = `db_nmap -sU -sV ${target}`;
        break;
      case 'all':
        scanCommand = `db_nmap -sS -sU -sV ${target}`;
        break;
      case 'vuln':
        scanCommand = `db_nmap --script vuln ${target}`;
        break;
      default:
        scanCommand = `db_nmap -sS ${target}`;
    }
    
    // Execute the scan
    await makeRpcCall('console.write', [consoleId, `${scanCommand}\n`]);
    
    // Wait for scan to complete
    let complete = false;
    let output = '';
    let retries = 0;
    const maxRetries = 60; // 30 seconds timeout
    
    while (!complete && retries < maxRetries) {
      const response = await makeRpcCall('console.read', [consoleId]);
      
      output += response.data;
      complete = response.busy === false && response.data.includes('completed');
      
      if (!complete) {
        await new Promise(resolve => setTimeout(resolve, 500));
        retries++;
      }
    }
    
    if (retries >= maxRetries) {
      console.log('Scan is taking too long, returning partial results');
    }
    
    // Get the hosts discovered by the scan
    const hosts = await makeRpcCall('db.hosts', [{}]);
    
    // Get the services discovered by the scan
    const services = await makeRpcCall('db.services', [{}]);
    
    // Get the vulnerabilities discovered by the scan
    const vulns = await makeRpcCall('db.vulns', [{}]);
    
    return {
      success: true,
      scan: {
        type: scanType,
        target,
        output
      },
      results: {
        hosts,
        services,
        vulns
      }
    };
  } catch (error) {
    console.error('Failed to run Metasploit scan:', error);
    return {
      success: false,
      error: String(error)
    };
  }
}

/**
 * Execute a Metasploit module
 */
export async function executeMetasploitModule(moduleType: string, moduleName: string, options: Record<string, any>): Promise<any> {
  try {
    if (!rpcClient || !rpcToken) {
      await reconnectIfNeeded();
    }
    
    // Check if the module exists
    const moduleInfo = await makeRpcCall('module.info', [moduleType, moduleName]);
    
    if (!moduleInfo) {
      return {
        success: false,
        error: `Module ${moduleType}/${moduleName} not found`
      };
    }
    
    // Get the module options
    const moduleOptions = await makeRpcCall('module.options', [moduleType, moduleName]);
    
    // Create a console to execute the module
    const consoleId = await makeRpcCall('console.create');
    
    // Build the command to execute the module
    let command = `use ${moduleType}/${moduleName}\n`;
    
    // Set the options
    for (const [key, value] of Object.entries(options)) {
      command += `set ${key} ${value}\n`;
    }
    
    // Add the execute command
    command += 'run\n';
    
    // Execute the module
    await makeRpcCall('console.write', [consoleId, command]);
    
    // Wait for execution to complete
    let complete = false;
    let output = '';
    let retries = 0;
    const maxRetries = 60; // 30 seconds timeout
    
    while (!complete && retries < maxRetries) {
      const response = await makeRpcCall('console.read', [consoleId]);
      
      output += response.data;
      complete = response.busy === false;
      
      if (!complete) {
        await new Promise(resolve => setTimeout(resolve, 500));
        retries++;
      }
    }
    
    if (retries >= maxRetries) {
      console.log('Module execution is taking too long, returning partial results');
    }
    
    return {
      success: true,
      module: {
        type: moduleType,
        name: moduleName,
        options
      },
      output
    };
  } catch (error) {
    console.error('Failed to execute Metasploit module:', error);
    return {
      success: false,
      error: String(error)
    };
  }
}

/**
 * Get a list of available Metasploit modules by type
 */
export async function getMetasploitModules(moduleType: string): Promise<any> {
  try {
    if (!rpcClient || !rpcToken) {
      await reconnectIfNeeded();
    }
    
    const modules = await makeRpcCall('module.compatible_payloads', [moduleType]);
    
    return {
      success: true,
      modules
    };
  } catch (error) {
    console.error('Failed to get Metasploit modules:', error);
    return {
      success: false,
      error: String(error)
    };
  }
}

/**
 * Get a list of active Metasploit sessions
 */
export async function getMetasploitSessions(): Promise<any> {
  try {
    if (!rpcClient || !rpcToken) {
      await reconnectIfNeeded();
    }
    
    const sessions = await makeRpcCall('session.list');
    
    return {
      success: true,
      sessions
    };
  } catch (error) {
    console.error('Failed to get Metasploit sessions:', error);
    return {
      success: false,
      error: String(error)
    };
  }
}

/**
 * Reconnect to Metasploit if needed and possible
 */
async function reconnectIfNeeded(): Promise<void> {
  if ((!rpcClient || rpcClient.destroyed) && rpcConfig) {
    await connectToMetasploit(rpcConfig);
  }
}