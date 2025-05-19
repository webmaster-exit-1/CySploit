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

    console.log('Starting Electron application with --no-sandbox...'); // Updated log

    // Get the directory where this script is located
    const scriptDir = process.cwd();

    // Path to electron executable in node_modules
    // On some systems, 'electron.cmd' might be needed for Windows if '.bin/electron' doesn't resolve
    const electronExecutable = process.platform === 'win32' ? 'electron.cmd' : 'electron';
    const electronPath = path.join(scriptDir, 'node_modules', '.bin', electronExecutable);


    // Path to main.cjs (Electron's main process entry point)
    const mainPath = path.join(scriptDir, 'electron', 'main.cjs');

    // Check if main.cjs exists. If not, try to find main.js and copy it (as per your original script's logic)
    import('fs').then(fs => {
      if (!fs.existsSync(mainPath)) {
        const mainJsPath = path.join(scriptDir, 'electron', 'main.js');
        if (fs.existsSync(mainJsPath)) {
          console.log('Copying main.js to main.cjs for Electron entry point...');
          try {
            fs.copyFileSync(mainJsPath, mainPath);
            console.log('Successfully copied main.js to main.cjs.');
          } catch (copyErr) {
            console.error('Error copying main.js to main.cjs:', copyErr);
            process.exit(1);
          }
        } else {
          console.error(`Error: Electron entry point not found. Looked for ${mainPath} and ${mainJsPath}`);
          process.exit(1);
        }
      }

      const electronArgs = [
        '--no-sandbox', // Add the --no-sandbox flag
        mainPath
      ];

      console.log(`Spawning Electron: ${electronPath} ${electronArgs.join(' ')}`);

      // Spawn Electron process
      const electronProcess = spawn(electronPath, electronArgs, {
        stdio: 'inherit', // Show output from Electron process in current terminal
        env: {
          ...process.env,
          ELECTRON_NO_ASAR: '1',  // Disable ASAR for easier debugging if needed
          // DATABASE_URL is already set by your start-app.sh or should be in your .env
        }
      });

      // Handle Electron process events
      electronProcess.on('close', (code) => {
        console.log(`Electron process exited with code ${code}`);
        // process.exit(code); // Optional: exit this script when Electron closes
      });

      electronProcess.on('error', (err) => {
        console.error('Failed to start Electron process:', err);
        process.exit(1); // Exit if Electron fails to start
      });
    }).catch(err => {
        console.error('Failed to import fs module:', err);
        process.exit(1);
    });
  }).catch(err => {
    console.error('Failed to import child_process module:', err);
    process.exit(1);
  });
}).catch(err => {
    console.error('Failed to import path module:', err);
    process.exit(1);
});
