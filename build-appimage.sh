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

# electron-builder rebuilds native deps (node-gyp). If any build artifacts are root-owned
# (often caused by running npm with sudo), the rebuild can fail with EACCES.
if [ -e node_modules/node-libcurl/build/Makefile ]; then
  OWNER_UID=$(stat -c '%u' node_modules/node-libcurl/build/Makefile 2>/dev/null || echo "")
  if [ -n "$OWNER_UID" ] && [ "$OWNER_UID" -eq 0 ]; then
    echo ""
    echo "Error: node_modules/node-libcurl/build contains root-owned files (will break electron-builder rebuild)." >&2
    echo "Fix it by running:" >&2
    echo "  sudo chown -R $USER:$USER node_modules/node-libcurl" >&2
    echo "Or, for a full cleanup:" >&2
    echo "  sudo rm -rf node_modules && npm install" >&2
    exit 1
  fi
fi

echo "Building client + server bundles..."
npm run build

echo "Packaging Linux AppImage..."
# Uses electron-builder.yml for configuration and outputs to ./release
npx electron-builder build --linux AppImage --publish never

echo ""
echo "Done. Check the ./release directory for the generated .AppImage."
