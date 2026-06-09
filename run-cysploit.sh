#!/bin/bash

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo "Script running from: $SCRIPT_DIR"

# Change to the script directory to ensure all paths are relative
cd "$SCRIPT_DIR" || exit 1

# Set PostgreSQL connection string
export DATABASE_URL="${DATABASE_URL:-postgresql://cysploit:cysploit@localhost:5432/cysploit}"

# Electron-builder places packaged artifacts in ./release/
RELEASE_DIR="./release"

# Try to locate the AppImage in the release directory
APPIMAGE=""

if [ -f "${RELEASE_DIR}/CySploit-x86_64.AppImage" ]; then
    APPIMAGE="${RELEASE_DIR}/CySploit-x86_64.AppImage"
elif [ -f "${RELEASE_DIR}/CySploit-$(uname -m).AppImage" ]; then
    APPIMAGE="${RELEASE_DIR}/CySploit-$(uname -m).AppImage"
else
    # Search for CySploit AppImage files in release directory
    APPIMAGE=$(find "${RELEASE_DIR}" -maxdepth 1 -name "CySploit*.AppImage" -print -quit 2>/dev/null)

    # Fallback: case-insensitive search
    if [ -z "$APPIMAGE" ]; then
        APPIMAGE=$(find "${RELEASE_DIR}" -maxdepth 1 -iname "*cysploit*.AppImage" -print -quit 2>/dev/null)
    fi
fi

if [ -z "$APPIMAGE" ] || [ ! -f "$APPIMAGE" ]; then
    echo "Error: Could not find CySploit AppImage file in ${RELEASE_DIR}."
    echo "Please build the AppImage first:"
    echo "  ./build-appimage.sh"
    exit 1
fi

echo "Found CySploit AppImage: $APPIMAGE"
echo "Using database connection: $DATABASE_URL"

# Make sure the AppImage is executable
chmod +x "$APPIMAGE"

echo "Starting CySploit application..."
"$APPIMAGE"
