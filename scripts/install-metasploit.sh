#!/bin/bash

# Metasploit Framework Installation Script for CySploit
# This script installs Metasploit Framework and configures it to use the msf_db database

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "========================================"
echo "Metasploit Framework Installation"
echo "========================================"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${RED}Error: Do not run this script as root${NC}"
    exit 1
fi

# Check if Metasploit is already installed
if command -v msfconsole &> /dev/null; then
    echo -e "${YELLOW}Metasploit Framework is already installed${NC}"
    msfconsole --version
    echo ""
    read -p "Do you want to reinstall? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Installation cancelled."
        exit 0
    fi
fi

echo -e "${BLUE}Step 1/6: Installing dependencies...${NC}"
sudo apt-get update
sudo apt-get install -y ruby ruby-dev build-essential libpq-dev git curl \
    autoconf bison libssl-dev libyaml-dev libreadline-dev zlib1g-dev \
    libncurses5-dev libffi-dev libgdbm-dev libsqlite3-dev libpcap-dev

echo ""
echo -e "${BLUE}Step 2/6: Installing Bundler...${NC}"
sudo gem install bundler

echo ""
echo -e "${BLUE}Step 3/6: Cloning Metasploit Framework...${NC}"
if [ -d "/opt/metasploit-framework" ]; then
    echo "Removing existing Metasploit installation..."
    sudo rm -rf /opt/metasploit-framework
fi
cd /opt
sudo git clone --depth=1 https://github.com/rapid7/metasploit-framework.git

echo ""
echo -e "${BLUE}Step 4/6: Installing Metasploit gems (this may take several minutes)...${NC}"
cd /opt/metasploit-framework
sudo bundle install

echo ""
echo -e "${BLUE}Step 5/6: Creating symbolic links...${NC}"
sudo ln -sf /opt/metasploit-framework/msfconsole /usr/local/bin/msfconsole
sudo ln -sf /opt/metasploit-framework/msfvenom /usr/local/bin/msfvenom
sudo ln -sf /opt/metasploit-framework/msfrpcd /usr/local/bin/msfrpcd

echo ""
echo -e "${BLUE}Step 6/6: Creating database configuration...${NC}"
mkdir -p ~/.msf4
# Note: This password matches the one configured in docker-compose.yml and scripts/init-metasploit-db.sh
# For production environments, use strong passwords and store them securely
cat > ~/.msf4/database.yml << 'EOF'
production:
  adapter: postgresql
  database: msf_db
  username: msf_user
  password: msf_password
  host: localhost
  port: 5432
  pool: 75
  timeout: 5
EOF

echo ""
echo -e "${GREEN}========================================"
echo "Installation Complete!"
echo "========================================${NC}"
echo ""
echo "Metasploit Framework has been installed successfully."
echo ""
echo "Version:"
msfconsole --version 2>&1 | grep "Framework Version"
echo ""
echo "Database configuration: ~/.msf4/database.yml"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Make sure the PostgreSQL database is running:"
echo "   docker compose up -d"
echo ""
echo "2. Initialize the Metasploit database (first time only):"
echo "   echo 'db_status' | msfconsole"
echo ""
echo "3. Start using Metasploit:"
echo "   msfconsole"
echo ""
echo -e "${GREEN}Done!${NC}"
