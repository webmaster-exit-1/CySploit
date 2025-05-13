/**
 * This script handles the notarization process for macOS builds.
 * It's only used when building the app for macOS.
 * 
 * Notarization is Apple's process of verifying that an app is free of malware.
 * For distribution outside the Mac App Store, notarization is required.
 * 
 * To use this in production, set the following environment variables:
 * - APPLE_ID: Your Apple Developer ID
 * - APPLE_ID_PASSWORD: An app-specific password for your Apple ID
 * - APPLE_TEAM_ID: Your Apple Developer Team ID
 */

const { notarize } = require('@electron/notarize');
const { build } = require('../electron-builder.json');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  
  // Only notarize macOS builds
  if (electronPlatformName !== 'darwin') {
    return;
  }
  
  // Skip notarization in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Skipping notarization in development mode');
    return;
  }
  
  // Check if required environment variables are set
  if (!process.env.APPLE_ID || !process.env.APPLE_ID_PASSWORD || !process.env.APPLE_TEAM_ID) {
    console.log('Skipping notarization: Required environment variables not set');
    console.log('Set APPLE_ID, APPLE_ID_PASSWORD, and APPLE_TEAM_ID for production builds');
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  
  console.log(`Notarizing ${appName}...`);

  try {
    await notarize({
      appBundleId: build.appId,
      appPath: `${appOutDir}/${appName}.app`,
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_ID_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID,
    });
    
    console.log(`Notarization complete for ${appName}`);
  } catch (error) {
    console.error('Notarization failed:', error);
    // Don't fail the build if notarization fails
  }
};