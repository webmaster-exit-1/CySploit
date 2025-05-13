#!/bin/bash

# Simple launcher script for CySploit
# This script handles the module system conflict issues

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo "Script running from: $SCRIPT_DIR"

# Change to the script directory to ensure all paths are relative
cd "$SCRIPT_DIR"

# Make sure we have the main.cjs file by copying main.js if needed
if [ ! -f "electron/main.cjs" ] && [ -f "electron/main.js" ]; then
  echo "Creating electron/main.cjs from electron/main.js..."
  cp electron/main.js electron/main.cjs
fi

# Make sure we have the preload.cjs file by copying preload.js if needed
if [ ! -f "electron/preload.cjs" ] && [ -f "electron/preload.js" ]; then
  echo "Creating electron/preload.cjs from preload.js..."
  cp electron/preload.js electron/preload.cjs
fi

# Update the main.cjs file to use preload.cjs instead of preload.js
if [ -f "electron/main.cjs" ]; then
  echo "Updating main.cjs to use preload.cjs..."
  sed -i 's/preload\.js/preload\.cjs/g' electron/main.cjs
fi

# Set database URL if not already set
if [ -z "$DATABASE_URL" ]; then
  export DATABASE_URL="postgresql://neondb_owner:npg_mSZTyIlN86ts@ep-plain-cake-a6piux6n.us-west-2.aws.neon.tech/neondb?sslmode=require"
  echo "Setting database connection to: $DATABASE_URL"
fi

# Try different launch methods
echo "Attempting to launch CySploit..."

# Method 1: Using the wrapper script
if [ -f "start-electron.js" ]; then
  echo "Using start-electron.js launcher..."
  node start-electron.js
  exit $?
fi

# Method 2: Using npx electron directly
if command -v npx &> /dev/null; then
  if [ -f "electron/main.cjs" ]; then
    echo "Using npx electron with main.cjs..."
    npx electron electron/main.cjs
    exit $?
  elif [ -f "electron/main.js" ]; then
    echo "Using npx electron with main.js..."
    ELECTRON_NODE_INTEGRATION=true npx electron electron/main.js
    exit $?
  fi
fi

# Method 3: Direct electron command
if command -v electron &> /dev/null; then
  if [ -f "electron/main.cjs" ]; then
    echo "Using electron command with main.cjs..."
    electron electron/main.cjs
    exit $?
  elif [ -f "electron/main.js" ]; then
    echo "Using electron command with main.js..."
    ELECTRON_NODE_INTEGRATION=true electron electron/main.js
    exit $?
  fi
fi

# If we get here, all launch methods have failed
echo "Error: Could not launch CySploit. Please check that Electron is installed."
echo "Try running 'npm install' first."
exit 1