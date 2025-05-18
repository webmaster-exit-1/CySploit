# CySploit - Cybersecurity Analysis Platform
![cysploit_dashboard](cysploit_dashboard.jpg)

*"A cutting-edge cybersecurity platform designed to simplify network security assessment through advanced, interactive scanning and analysis tools."* - Anonymous User

## Features

- **Network Discovery**: Scan and map your network to identify all connected devices
- **Vulnerability Scanning**: Detect vulnerabilities in network devices
- **Packet Analysis**: Capture and analyze network traffic
- **3D Visualization**: Visualize security data in interactive 3D maps
- **Shodan Integration**: Enhance reconnaissance with Shodan API data
- **Metasploit Integration**: Connect directly to Metasploit for penetration testing
![packet_capture](packet_capture.jpg)
![Shodan](Shodan.jpg)
![metasploit](metasploit.jpg)
## Technology Stack

- React.js with TypeScript for the frontend
- Express.js backend
- PostgreSQL database with Drizzle ORM
- Electron for cross-platform desktop support
- Shodan API integration
- Custom nmap services database support
- Metasploit Framework integration

## Installation

### Running from Source

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/cysploit.git
   cd cysploit
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:5000`

### Running as Desktop Application (Development)

To run the application as an Electron desktop app in development mode:

1. Make sure all dependencies are installed:
   ```bash
   npm install
   ```

2. Run the development server and Electron app simultaneously:
   ```bash
   npx concurrently "npm run dev" "npx wait-on http://localhost:5000 && npx electron electron/main.js"
   ```

### Building as Desktop Application

You can build CySploit as a standalone desktop application for Linux, Windows, or Mac:

1. Make the build script executable:
   ```bash
   chmod +x build-electron.sh
   ```

2. Run the build script:
   ```bash
   ./build-electron.sh
   ```

3. The packaged application will be created in the `/dist` directory

#### Platform-Specific Builds

- **Linux (AppImage, Deb, RPM)**:
  ```bash
  npx electron-builder build --linux --publish never
  ```

- **Windows (Installer, Portable)**:
  ```bash
  npx electron-builder build --win --publish never
  ```

- **macOS (DMG, ZIP)**:
  ```bash
  npx electron-builder build --mac --publish never
  ```

**Note:** When running the desktop version, you'll have full access to scan your actual local network, unlike the web preview version which is limited to the Replit environment.

## Configuration

### Shodan API

1. Obtain a Shodan API key from [https://shodan.io](https://shodan.io)
2. Enter the API key in the Settings → API Keys section of CySploit

### Metasploit Integration

1. Ensure Metasploit Framework is installed on your system
2. Configure the Metasploit connection settings in the Settings section
3. The shared PostgreSQL database will be used by both CySploit and Metasploit

## Usage

### Network Discovery

1. Navigate to the Network Discovery page
2. Enter the network range to scan (e.g., 192.168.1.0/24)
3. Click "Start Scan" to begin discovering devices

### Vulnerability Scanning

1. Select a device from the discovered list
2. Navigate to the Vulnerability Scanner page
3. Click "Scan Device" to detect vulnerabilities

### Data Visualization

1. After collecting data from scans, navigate to the Network Mapping page
2. The 3D visualization will display your network topology and security findings
3. Export reports for further analysis in other tools

## License

Copyright © 2024 CySploit Team - All rights reserved

## Acknowledgments

- Icons created using SVG
- Visualization capabilities inspired by SandDance and Jok3r
- Network scanning components adapted from open-source security tools
