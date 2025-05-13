#!/bin/bash

# Complete build script for CySploit that handles dependencies and all build steps

echo "Starting complete CySploit build process..."

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo "Script running from: $SCRIPT_DIR"

# Change to the script directory to ensure all paths are relative
cd "$SCRIPT_DIR"

# Step 1: Install dependencies if they're not already installed
echo "Checking and installing dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Installing Node.js dependencies..."
    npm install
else
    echo "Node modules already installed, skipping npm install."
fi

# Create necessary directories
mkdir -p build-resources/icons/hicolor/scalable/apps

# Create a basic icon if one doesn't exist
if [ ! -f "build-resources/icons/hicolor/scalable/apps/cysploit.svg" ]; then
    echo "Creating placeholder icon..."
    echo '<?xml version="1.0" encoding="UTF-8" standalone="no"?>
    <svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <rect width="256" height="256" fill="#000033"/>
      <circle cx="128" cy="128" r="100" fill="none" stroke="#00ffff" stroke-width="4"/>
      <circle cx="128" cy="128" r="60" fill="none" stroke="#ff00ff" stroke-width="3"/>
      <text x="128" y="135" font-family="Arial" font-size="32" fill="#ffffff" text-anchor="middle">CySploit</text>
    </svg>' > build-resources/icons/hicolor/scalable/apps/cysploit.svg
fi

# Step 2: Update database schema 
echo "Updating database schema..."
npx drizzle-kit push

# Step 3: Build the application
echo "Building React application and server bundle..."
npx vite build && npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "Error: Build failed! The dist directory was not created."
    exit 1
fi

# Step 4: Create the AppDir structure
echo "Creating AppDir structure..."
mkdir -p AppDir/usr/bin
mkdir -p AppDir/usr/lib
mkdir -p AppDir/usr/share/applications
mkdir -p AppDir/usr/share/icons/hicolor/scalable/apps
mkdir -p AppDir/usr/share/metasploit-framework

# Step 5: Copy application files
echo "Copying application files..."
cp -r dist AppDir/usr/bin/
cp -r electron AppDir/usr/bin/
cp -r node_modules AppDir/usr/lib/node_modules
cp -r client AppDir/usr/bin/client

# Copy the icon
cp build-resources/icons/hicolor/scalable/apps/cysploit.svg AppDir/usr/share/icons/hicolor/scalable/apps/

# Step 6: Create the AppRun script
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

# Step 7: Create the desktop file
echo "Creating .desktop file..."
cat > AppDir/cysploit.desktop << EOF
[Desktop Entry]
Name=CySploit
Comment=Cybersecurity Analysis Platform
Exec=AppRun
Icon=cysploit
Type=Application
Categories=Development;Security;
Terminal=false
StartupWMClass=cysploit
EOF

# Step 8: Install appimagetool if not already installed
if [ ! -f appimagetool-x86_64.AppImage ]; then
    echo "Downloading appimagetool..."
    wget "https://github.com/AppImage/AppImageKit/releases/download/continuous/appimagetool-x86_64.AppImage"
    chmod +x appimagetool-x86_64.AppImage
fi

# Step 9: Copy entitlements for PostgreSQL integration
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

# Step 10: Build the AppImage
echo "Building AppImage..."
ARCH=$(uname -m) 
./appimagetool-x86_64.AppImage AppDir CySploit-$ARCH.AppImage

if [ -f "CySploit-$ARCH.AppImage" ]; then
    echo "AppImage created successfully: CySploit-$ARCH.AppImage"
    echo "To run, use the included run-cysploit.sh script which sets up the proper environment:"
    echo "    ./run-cysploit.sh"
    echo ""
    echo "The script automatically sets DATABASE_URL to the PostgreSQL connection string."
    echo "If you need to use a different database, edit run-cysploit.sh or run the AppImage directly with:"
    echo "    DATABASE_URL=\"your-connection-string\" ./CySploit-$ARCH.AppImage"
else
    echo "Error: AppImage creation failed. Check the error messages above."
    exit 1
fi