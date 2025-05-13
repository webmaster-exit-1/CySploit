#!/usr/bin/env node

/**
 * This script serves as a bridge between ES modules and CommonJS for Electron
 * It allows running the Electron app in an environment with "type": "module" in package.json
 */

// Using dynamic import for path since we're in an ES module
import('path').then(pathModule => {
  const path = pathModule.default;
  
  // Using child_process.spawn to launch Electron
  import('child_process').then(childProcess => {
    const { spawn } = childProcess;
    
    console.log('Starting Electron application...');
    
    // Get the directory where this script is located
    const scriptDir = process.cwd();
    
    // Path to electron executable in node_modules
    const electronPath = path.join(scriptDir, 'node_modules', '.bin', 'electron');
    
    // Path to main.js or main.cjs
    let mainPath = path.join(scriptDir, 'electron', 'main.cjs');
    
    // Check if main.cjs exists, otherwise use main.js
    import('fs').then(fs => {
      // If main.cjs doesn't exist, try to find main.js and copy it
      if (!fs.existsSync(mainPath)) {
        const mainJsPath = path.join(scriptDir, 'electron', 'main.js');
        
        if (fs.existsSync(mainJsPath)) {
          // Copy main.js to main.cjs
          console.log('Copying main.js to main.cjs...');
          fs.copyFileSync(mainJsPath, mainPath);
        } else {
          console.error('Error: Could not find electron/main.js or electron/main.cjs');
          process.exit(1);
        }
      }
      
      // Spawn Electron process
      const electronProcess = spawn(electronPath, [mainPath], {
        stdio: 'inherit',
        env: {
          ...process.env,
          ELECTRON_NO_ASAR: '1',  // Disable ASAR for easier debugging
          DATABASE_URL: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_mSZTyIlN86ts@ep-plain-cake-a6piux6n.us-west-2.aws.neon.tech/neondb?sslmode=require'
        }
      });
      
      // Handle Electron process events
      electronProcess.on('close', (code) => {
        console.log(`Electron process exited with code ${code}`);
        process.exit(code);
      });
      
      electronProcess.on('error', (err) => {
        console.error('Failed to start Electron process:', err);
        process.exit(1);
      });
    });
  });
});