#!/usr/bin/env bash

# Build script for creating a self-contained CySploit AppImage via electron-builder.

set -euo pipefail

echo "Building CySploit AppImage (electron-builder)..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if ! command -v node >/dev/null 2>&1; then
  echo "Error: node is required." >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm is required." >&2
  exit 1
fi

echo "Installing dependencies (if needed)..."
if [ ! -d node_modules ]; then
  npm install
fi

echo "Building client + server bundles..."
npm run build

echo "Packaging Linux AppImage..."
# Uses electron-builder.yml for configuration and outputs to ./dist
npx electron-builder build --linux AppImage --publish never

echo ""
echo "Done. Check the ./dist directory for the generated .AppImage."
