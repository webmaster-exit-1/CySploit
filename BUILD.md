# Building CySploit

This guide covers building CySploit for various platforms and formats.

## Prerequisites

- Node.js 18 or later
- npm 9 or later
- PostgreSQL 12 or later (for database functionality)
- Git

## Quick Start

```bash
# Install dependencies
npm install

# Build for development
npm run build

# Build Electron app
npm run build:electron
```

## Build Targets

### 1. Web Application Build

Build the web application (client + server):

```bash
npm run build
```

This command:
- Builds the React frontend with Vite → `dist/public/`
- Compiles the TypeScript server → `dist/server/`

The built application can be served with:

```bash
node dist/server/index.js
```

### 2. Electron Desktop Application

Build the desktop application:

```bash
npm run build:electron
```

This creates:
- **AppImage** (Linux): `dist/CySploit-{version}.AppImage`
- **deb package** (Debian/Ubuntu): `dist/cysploit_{version}_amd64.deb`

The builds are created in the `release/` directory.

### 3. AppImage Only

To build only the AppImage:

```bash
./build-appimage.sh
```

Or use electron-builder directly:

```bash
npx electron-builder build --linux AppImage --publish never
```

### 4. Platform-Specific Builds

**Linux:**
```bash
npx electron-builder build --linux --publish never
```

**Windows:** (requires Windows or cross-compilation tools)
```bash
npx electron-builder build --win --publish never
```

**macOS:** (requires macOS)
```bash
npx electron-builder build --mac --publish never
```

## Build Configuration

### electron-builder Configuration

The Electron build is configured in `electron-builder.yml`:

```yaml
appId: com.pentools.cysploit
productName: CySploit
directories:
  output: release
  buildResources: build-resources
files:
  - dist/public/**/*
  - electron/**/*
  - node_modules/**/*
  - package.json
linux:
  target:
    - AppImage
    - deb
    - rpm
  category: Development;Security
```

### Build Resources

Icons and assets should be placed in `build-resources/`:

```
build-resources/
├── icon.png          # Linux icon (512x512 or larger)
├── icon.icns         # macOS icon
└── icon.ico          # Windows icon
```

## Development Builds

For development with live reload:

```bash
# Start development server
npm run dev

# Or run client and server separately
npm run dev:split
```

### Electron Development

Run Electron in development mode:

```bash
npm run electron:dev
```

This will:
1. Start the development server
2. Wait for it to be ready
3. Launch Electron pointing to http://localhost:5000

## Build Scripts

### build-appimage.sh

The AppImage build script provides a streamlined way to build Linux AppImages:

```bash
./build-appimage.sh
```

Features:
- Checks for required dependencies (node, npm)
- Validates build artifacts
- Builds client and server
- Packages with electron-builder
- Creates self-contained AppImage

### build-electron.sh

The Electron build script supports all platforms:

```bash
./build-electron.sh
```

Features:
- Updates database schema (optional)
- Builds frontend and backend
- Creates platform-specific packages
- Supports Linux, Windows, and macOS

## Build Output

After a successful build, you'll find:

```
release/
├── CySploit-2.0.5.AppImage          # Linux AppImage (portable)
├── cysploit_2.0.5_amd64.deb         # Debian/Ubuntu package
├── linux-unpacked/                  # Unpacked Linux build
├── public/                          # Built web application
│   ├── index.html
│   └── assets/
└── server/                          # Built server code
    └── index.js
```

## Installation

### AppImage (Linux)

```bash
# Make executable
chmod +x CySploit-2.0.5.AppImage

# Run directly
./CySploit-2.0.5.AppImage

# Optional: Integrate with desktop environment
./CySploit-2.0.5.AppImage --appimage-extract
# Move to appropriate location
sudo mv squashfs-root /opt/cysploit
```

### Deb Package (Debian/Ubuntu)

```bash
sudo dpkg -i cysploit_2.0.5_amd64.deb

# If there are dependency issues:
sudo apt-get install -f
```

## Troubleshooting

### Build Fails with "vite: not found"

Ensure dependencies are installed:

```bash
rm -rf node_modules package-lock.json
npm install
```

### Native Module Build Errors

Some dependencies require native compilation:

```bash
# Install build tools (Ubuntu/Debian)
sudo apt-get install build-essential

# Rebuild native modules
npm rebuild
```

### Electron Builder Permission Errors

If electron-builder fails with permission errors:

```bash
# Fix ownership of node_modules
sudo chown -R $USER:$USER node_modules

# Or clean and reinstall
sudo rm -rf node_modules
npm install
```

### Large Bundle Size Warning

Vite may warn about large chunks. This is expected for a complex application. To reduce size:

1. Implement code splitting with dynamic imports
2. Analyze bundle: `npm run build -- --analyze`
3. Configure manual chunks in `vite.config.ts`

### Database Connection in Built App

The Electron app requires PostgreSQL. Ensure:

1. PostgreSQL is installed and running
2. `.env` file exists with DATABASE_URL
3. Database migrations have been applied

See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for details.

## Cross-Platform Building

### Building Windows from Linux

Install Wine and Windows build tools:

```bash
# Ubuntu/Debian
sudo dpkg --add-architecture i386
sudo apt-get update
sudo apt-get install wine64 wine32

# Build for Windows
npx electron-builder build --win --publish never
```

### Building macOS from Linux

Building macOS apps from Linux requires:
- Xcode Command Line Tools
- A macOS certificate (for signing)
- macOS SDK

This is complex and typically requires building on actual macOS hardware.

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build CySploit

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build application
        run: npm run build
        
      - name: Build Electron
        run: npm run build:electron
        
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: CySploit-builds
          path: |
            release/*.AppImage
            release/*.deb
```

## Performance Optimization

### Build Performance

- **Use npm ci** instead of npm install for CI/CD
- **Cache node_modules** in CI pipelines
- **Parallel builds** - electron-builder builds targets in parallel by default
- **Exclude unnecessary files** - Configure `files` in electron-builder.yml

### Runtime Performance

- **Bundle analysis** - Use Vite's bundle analyzer
- **Lazy loading** - Implement code splitting
- **Tree shaking** - Ensure proper ES module imports
- **Minification** - Enabled by default in production builds

## Release Process

1. **Update version** in `package.json`
2. **Test build** locally
3. **Create git tag**: `git tag -a v2.0.5 -m "Release v2.0.5"`
4. **Build for all platforms**
5. **Create GitHub release** with built artifacts
6. **Publish release notes**

## Build Customization

### Custom Electron Main Process

Edit `electron/main.js` to customize:
- Window size and properties
- Application menu
- IPC handlers
- System integrations

### Custom Vite Configuration

Edit `vite.config.ts` to customize:
- Build output paths
- Plugins and transformations
- Asset handling
- Development server

### Custom TypeScript Configuration

Edit `tsconfig.json` and `tsconfig.server.json` for:
- Compiler options
- Type checking strictness
- Module resolution

## Support and Resources

- **Documentation**: [README.md](./README.md)
- **Database Setup**: [DATABASE_SETUP.md](./DATABASE_SETUP.md)
- **Issues**: [GitHub Issues](https://github.com/webmaster-exit-1/CySploit/issues)
- **electron-builder**: https://www.electron.build/
- **Vite**: https://vitejs.dev/
