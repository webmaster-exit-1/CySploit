#!/bin/bash

# This script builds the Electron desktop application for CySploit

echo "Starting Electron build process..."

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo "Script running from: $SCRIPT_DIR"

# Change to the script directory to ensure all paths are relative
cd "$SCRIPT_DIR" || exit 1 # Exit if cd fails

# It's good practice to ensure the script itself is executable,
# but this line chmod'ing itself is a bit redundant if you've already run it.
# chmod +x ./build-electron.sh

# Optional: Update database schema (using db:push as in your original script)
# For production, `npm run db:migrate` is often preferred over `db:push`.
# Consider if this step is truly needed every time you build the Electron app,
# or if it's more of a development/setup step.
echo "Ensuring database schema is up-to-date (using db:push)..."
if ! npm run db:push; then
    echo "Error: db:push failed. Please check your database connection and Drizzle setup."
    # exit 1 # Optionally exit if this is critical for the build
fi

# Build the frontend (Vite) and server (esbuild via npm scripts)
# This relies on "build:client" and "build:server" in your package.json
echo "Building frontend and server..."
if ! npm run build; then
    echo "Error: npm run build failed. Please check your Vite and esbuild configurations."
    exit 1
fi

# The `npm run build` (specifically `npm run build:server`) should have created
# the `server-build/index.js` file as ESM.
# electron-builder will pick this up based on `extraResources` in electron-builder.yml.

# The `npm run build` (specifically `npm run build:client`) should have created
# the client assets. Ensure electron-builder.yml's `files` directive
# correctly includes the output directory of `vite build`.
# For example, if Vite outputs to `dist/public`, electron-builder.yml needs:
# files:
#   - dist/public/**/*
#   - electron/**/*
#   - node_modules/**/*
#   - package.json
# (Or if Vite outputs to `build/`, then `build/**/*` is correct)

# Build the Electron app using electron-builder
echo "Building Electron app with electron-builder..."
# The command `npx electron-builder build --publish never` is fine.
# The more specific platform commands are also good documentation.
if ! npx electron-builder build --publish never; then
    echo "Error: electron-builder failed."
    exit 1
fi

echo ""
echo "Build completed! Check the /dist directory (or your configured output directory in electron-builder.yml) for your packaged application."
echo ""
echo "To build for a specific platform, you can use commands like:"
echo "  npx electron-builder build --linux --publish never"
echo "  npx electron-builder build --win --publish never"
echo "  npx electron-builder build --mac --publish never"
echo ""
echo "Reminder for development:"
echo "  npx concurrently \"npm run dev\" \"npx wait-on http://localhost:5000 && npx electron electron/main.js\"" # Adjust port if needed
