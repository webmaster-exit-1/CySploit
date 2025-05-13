#!/bin/bash

# Build script for creating an AppImage of CySploit

echo "Building CySploit AppImage..."

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo "Script running from: $SCRIPT_DIR"

# Change to the script directory to ensure all paths are relative
cd "$SCRIPT_DIR"

# Step 1: Update database schema, build the React app and server bundle
echo "Updating database schema..."
npm run db:push

echo "Building React application and server bundle..."
npm run build

# Step 2: Create the AppDir structure
echo "Creating AppDir structure..."
mkdir -p AppDir/usr/bin
mkdir -p AppDir/usr/lib
mkdir -p AppDir/usr/share/applications
mkdir -p AppDir/usr/share/icons/hicolor/256x256/apps
mkdir -p AppDir/usr/share/metasploit-framework

# Step 3: Copy application files
echo "Copying application files..."
cp -r dist AppDir/usr/bin/
cp -r electron AppDir/usr/bin/
cp -r node_modules AppDir/usr/lib/node_modules
cp -r client AppDir/usr/bin/client

# Step 4: Create the AppRun script
echo "Creating AppRun script..."
cat > AppDir/AppRun << 'EOF'
#!/bin/bash
SELF=$(readlink -f "$0")
HERE=${SELF%/*}
export PATH="${HERE}/usr/bin:${PATH}"
export NODE_PATH="${HERE}/usr/lib/node_modules"
export ELECTRON_DISABLE_SECURITY_WARNINGS=true
export DATABASE_URL=${DATABASE_URL:-"postgresql://neondb_owner:npg_mSZTyIlN86ts@ep-plain-cake-a6piux6n.us-west-2.aws.neon.tech/neondb?sslmode=require"}

# Make sure we have all directories needed
mkdir -p "${HERE}/usr/bin/client"

# Start the Electron app
cd "${HERE}/usr/bin"
ELECTRON_DIR="${HERE}/usr/bin/electron"

# Debug information - remove this in production
echo "Starting application from: ${HERE}"
echo "Electron directory: ${ELECTRON_DIR}"
ls -la "${ELECTRON_DIR}"

electron "${ELECTRON_DIR}/main.js" "$@"
EOF

chmod +x AppDir/AppRun

# Step 5: Create desktop file
echo "Creating .desktop file..."
cat > AppDir/cysploit.desktop << EOF
[Desktop Entry]
Name=CySploit
Comment=A cutting-edge cybersecurity platform
Exec=AppRun
Terminal=false
Type=Application
Icon=cysploit
Categories=Security;Development;
StartupWMClass=cysploit
EOF

# Symlink the desktop file to the standard location
ln -sf ../../../cysploit.desktop AppDir/usr/share/applications/cysploit.desktop

# Step 6: Handle icon
echo "Setting up icon..."
# If SVG icon exists, convert it to PNG for the AppImage
if [ -f electron/icons/icon.svg ]; then
    echo "Using SVG icon..."
    cp electron/icons/icon.svg AppDir/usr/share/icons/hicolor/scalable/apps/cysploit.svg
    # Use the svg icon as the main icon too
    ln -sf usr/share/icons/hicolor/scalable/apps/cysploit.svg AppDir/cysploit.svg
elif [ -f electron/icons/icon.png ]; then
    echo "Using PNG icon..."
    cp electron/icons/icon.png AppDir/usr/share/icons/hicolor/256x256/apps/cysploit.png
    ln -sf usr/share/icons/hicolor/256x256/apps/cysploit.png AppDir/cysploit.png
else
    # If no icon is available, create a simple icon
    echo "No icon found. Creating a placeholder icon..."
    cat > AppDir/usr/share/icons/hicolor/256x256/apps/cysploit.png << EOF
iVBORw0KGgoAAAANSUhEUgAAAQAAAAEAAQMAAABmvDolAAAAA1BMVEUAAACnej3aAAAAAXRSTlMAQObYZgAAACJJREFUaIHtwTEBAAAAwqD1T20ND6AAAAAAAAAAAAAA4N8AKvgAAUFIrrEAAAAASUVORK5CYII=
EOF
    ln -sf usr/share/icons/hicolor/256x256/apps/cysploit.png AppDir/cysploit.png
fi

# Step 7: Install appimagetool if not already installed
if [ ! -f appimagetool-x86_64.AppImage ]; then
    echo "Downloading appimagetool..."
    wget "https://github.com/AppImage/AppImageKit/releases/download/continuous/appimagetool-x86_64.AppImage"
    chmod +x appimagetool-x86_64.AppImage
fi

# Step 8: Copy entitlements for PostgreSQL integration
cat > AppDir/usr/bin/database-init.sh << 'EOF'
#!/bin/bash
# Check if PostgreSQL is installed and available
if command -v psql &> /dev/null; then
    echo "PostgreSQL client found, checking connection..."
    
    if psql -c "SELECT 1" $DATABASE_URL &> /dev/null; then
        echo "Database connection successful. Running migrations..."
        npx drizzle-kit push
        echo "Migrations completed successfully."
    else
        echo "Warning: Could not connect to PostgreSQL database. Please ensure PostgreSQL is running and DATABASE_URL is set correctly."
    fi
else
    echo "Warning: PostgreSQL client not found. Database features may not work properly."
fi
EOF
chmod +x AppDir/usr/bin/database-init.sh

# Step 9: Build the AppImage
echo "Building AppImage..."
ARCH=$(uname -m) ./appimagetool-x86_64.AppImage AppDir CySploit-$ARCH.AppImage

echo "AppImage created: CySploit-$ARCH.AppImage"
echo "To run, use the included run-cysploit.sh script which sets up the proper environment:"
echo "    ./run-cysploit.sh"
echo ""
echo "The script automatically sets DATABASE_URL to the PostgreSQL connection string."
echo "If you need to use a different database, edit run-cysploit.sh or run the AppImage directly with:"
echo "    DATABASE_URL=\"your-connection-string\" ./CySploit-$ARCH.AppImage"