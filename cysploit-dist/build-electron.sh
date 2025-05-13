#!/bin/bash

# This script builds the Electron desktop application for CySploit

echo "Starting Electron build process..."

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo "Script running from: $SCRIPT_DIR"

# Change to the script directory to ensure all paths are relative
cd "$SCRIPT_DIR"

# Make sure the script is executable
chmod +x ./build-electron.sh

# Update database schema
echo "Updating database schema..."
npm run db:push

# Build the React frontend
echo "Building frontend..."
npm run build

# Create the server build directory if it doesn't exist
mkdir -p server-build

# Build the server with esbuild
echo "Building server..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=cjs --outdir=server-build

# Make sure the client directory is copied to the electron resources
echo "Copying client directory..."
mkdir -p electron/client
cp -r client/* electron/client/

# Build the Electron app
echo "Building Electron app..."
npx electron-builder build --publish never

echo "Build completed! Check the /dist directory for your packaged application."
echo ""
echo "If you want to build for a specific platform, run one of the following commands:"
echo "- Linux: npx electron-builder build --linux --publish never"
echo "- Windows: npx electron-builder build --win --publish never" 
echo "- macOS: npx electron-builder build --mac --publish never"
echo ""
echo "To run the Electron app in development mode:"
echo "npx concurrently \"npm run dev\" \"npx wait-on http://localhost:5000 && npx electron electron/main.js\""