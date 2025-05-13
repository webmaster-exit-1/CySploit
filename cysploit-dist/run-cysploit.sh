#!/bin/bash

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo "Script running from: $SCRIPT_DIR"

# Change to the script directory to ensure all paths are relative
cd "$SCRIPT_DIR"

# Set PostgreSQL connection string
DATABASE_URL="postgresql://neondb_owner:npg_mSZTyIlN86ts@ep-plain-cake-a6piux6n.us-west-2.aws.neon.tech/neondb?sslmode=require"

# Try to locate the AppImage
APPIMAGE=""

# Check for the default name
if [ -f "./CySploit-x86_64.AppImage" ]; then
    APPIMAGE="./CySploit-x86_64.AppImage"
elif [ -f "./CySploit-$(uname -m).AppImage" ]; then
    APPIMAGE="./CySploit-$(uname -m).AppImage"
else
    # Search for CySploit AppImage files specifically
    APPIMAGE=$(find . -maxdepth 1 -name "CySploit*.AppImage" | head -n 1)
    
    # If still not found, try any AppImage with "cysploit" in the name (case insensitive)
    if [ -z "$APPIMAGE" ]; then
        APPIMAGE=$(find . -maxdepth 1 -name "*[cC][yY][sS][pP][lL][oO][iI][tT]*.AppImage" | head -n 1)
    fi
    
    # Last resort - match any AppImage except known tools
    if [ -z "$APPIMAGE" ]; then
        APPIMAGE=$(find . -maxdepth 1 -name "*.AppImage" | grep -v "appimagetool" | grep -v "linuxdeploy" | head -n 1)
    fi
fi

if [ -z "$APPIMAGE" ]; then
    echo "Error: Could not find CySploit AppImage file."
    echo "Please make sure the AppImage is in the current directory."
    exit 1
fi

echo "Running CySploit from: $APPIMAGE"
echo "With database connection: $DATABASE_URL"

# Make sure the AppImage is executable
chmod +x "$APPIMAGE"

# Check if this is actually appimagetool or another tool
if file "$APPIMAGE" | grep -q "appimagetool"; then
    echo "Error: The file '$APPIMAGE' appears to be appimagetool, not CySploit."
    echo "Please build the CySploit AppImage first using ./build-appimage.sh"
    exit 1
fi

# Basic validation - make sure it's really an AppImage
if ! file "$APPIMAGE" | grep -q "AppImage"; then
    echo "Error: The file '$APPIMAGE' does not appear to be a valid AppImage."
    echo "Please build the CySploit AppImage first using ./build-appimage.sh"
    exit 1
fi

echo "Starting CySploit application..."
# Run the CySploit AppImage with the correct PostgreSQL connection string
DATABASE_URL="$DATABASE_URL" "$APPIMAGE"