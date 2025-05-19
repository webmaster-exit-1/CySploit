#!/bin/bash

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo "Script running from: $SCRIPT_DIR"

# Change to the script directory to ensure all paths are relative
cd "$SCRIPT_DIR" || exit 1

# Set PostgreSQL connection string
export DATABASE_URL="${DATABASE_URL:-postgresql://cysploit:cysploit@localhost:5432/cysploit_db}"

# Try to locate the AppImage
APPIMAGE=""

# Check for the default name
if [ -f "./CySploit-x86_64.AppImage" ]; then
    APPIMAGE="./CySploit-x86_64.AppImage"
elif [ -f "./CySploit-$(uname -m).AppImage" ]; then
    APPIMAGE="./CySploit-$(uname -m).AppImage"
else
    # Search for CySploit AppImage files specifically
    APPIMAGE=$(find . -maxdepth 1 -name "CySploit*.AppImage" -print -quit 2>/dev/null)

    # If still not found, try any AppImage with "cysploit" in the name (case insensitive)
    if [ -z "$APPIMAGE" ]; then
        APPIMAGE=$(find . -maxdepth 1 -iname "*cysploit*.AppImage" -print -quit 2>/dev/null)
    fi

    # Last resort - match any AppImage except known tools
    if [ -z "$APPIMAGE" ]; then
        APPIMAGE=$(find . -maxdepth 1 -name "*.AppImage" -print -quit 2>/dev/null | grep -v "appimagetool" | grep -v "linuxdeploy" || true)
    fi
fi

if [ -z "$APPIMAGE" ] || [ ! -f "$APPIMAGE" ]; then
    echo "Error: Could not find CySploit AppImage file in $SCRIPT_DIR."
    echo "Please make sure the AppImage is in the current directory or build it first."
    exit 1
fi

echo "Found CySploit AppImage: $APPIMAGE"
echo "Using database connection: $DATABASE_URL"

# Make sure the AppImage is executable
chmod +x "$APPIMAGE"

# Check if this is actually appimagetool or another tool (basic check)
if [[ "$(basename "$APPIMAGE")" == "appimagetool"* ]]; then
    echo "Error: The file '$APPIMAGE' appears to be appimagetool, not CySploit."
    echo "Please build the CySploit AppImage first."
    exit 1
fi

# Basic validation - make sure it's really an AppImage
if ! file "$APPIMAGE" | grep -q "AppImage"; then
    echo "Error: The file '$APPIMAGE' does not appear to be a valid AppImage."
    echo "Please build the CySploit AppImage first."
    exit 1
fi

echo "Starting CySploit application with --no-sandbox..."
# Run the CySploit AppImage with the --no-sandbox flag and the database URL
"$APPIMAGE" --no-sandbox
# The DATABASE_URL is an environment variable and should be inherited by the AppImage process.
# No need to pass it as "DATABASE_URL=$DATABASE_URL" before the command if it's already exported or set for the script.

