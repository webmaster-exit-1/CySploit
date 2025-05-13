# CySploit Distribution Guide

This document provides instructions for building and running CySploit from the distributed source code.

## Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)
- For AppImage build: Linux environment with `appimagetool`
- For Electron build: Compatible with Windows, macOS, or Linux

## Building from Source

### 1. Extract the Zip Archive

Extract the `cysploit-project.zip` file to a directory of your choice.

```bash
unzip cysploit-project.zip
cd cysploit-dist
```

### 2. Building the Application

#### Recommended: All-In-One Build Script (Linux only)

The easiest way to build CySploit is to use the complete build script:

```bash
./build-complete.sh
```

This script will:
1. Install all dependencies automatically
2. Create necessary icons and resources
3. Build the application
4. Create the AppImage package

#### Alternative Build Options

If you prefer to build step-by-step or need a different format:

##### Option 1: Manual Steps for AppImage (Linux only)

```bash
npm install
npm run db:push
npm run build
./build-appimage.sh
```

##### Option 2: Build Electron App (Cross-platform)

```bash
npm install
npm run db:push
./build-electron.sh
```

This will create platform-specific packages in the `dist` directory.

## Running CySploit

### AppImage (Linux)

After building the AppImage, run:

```bash
./run-cysploit.sh
```

This script will automatically locate and run the AppImage with the correct environment variables.

### Electron App

After building with Electron, the packaged applications will be in the `dist` directory:

- Windows: `dist/CySploit-x.x.x.exe` or `dist/CySploit Setup x.x.x.exe`
- macOS: `dist/CySploit-x.x.x.dmg`
- Linux: `dist/cysploit_x.x.x_amd64.deb` or other distribution packages

## Troubleshooting

If you encounter issues:

1. Make sure all scripts have execution permissions:
   ```bash
   chmod +x *.sh
   ```

2. Check that you have the correct Node.js version:
   ```bash
   node --version
   ```

3. Verify database connection:
   The application uses a PostgreSQL database hosted at Neon. The connection string is:
   ```
   postgresql://neondb_owner:npg_mSZTyIlN86ts@ep-plain-cake-a6piux6n.us-west-2.aws.neon.tech/neondb?sslmode=require
   ```

4. If you see database errors (like `null value in column violates not-null constraint`), run the database update script:
   ```bash
   ./update-database.sh
   ```
   This will update your database schema to be compatible with the latest version of the application.

5. For Electron/AppImage issues, check console output for detailed error messages.

## Support

If you encounter any issues or have questions, please reach out to the development team or create an issue on our repository.