#!/usr/bin/env bash

# Test script to verify CySploit database and build functionality

set -euo pipefail

echo "CySploit Database and Build Verification"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print success
success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Function to print error
error() {
    echo -e "${RED}✗${NC} $1"
}

# Function to print warning
warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if PostgreSQL is installed
echo "Checking prerequisites..."
if command -v psql >/dev/null 2>&1; then
    success "PostgreSQL is installed"
else
    error "PostgreSQL is not installed"
    exit 1
fi

# Check if Node.js is installed
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    success "Node.js is installed ($NODE_VERSION)"
else
    error "Node.js is not installed"
    exit 1
fi

# Check if npm is installed
if command -v npm >/dev/null 2>&1; then
    NPM_VERSION=$(npm --version)
    success "npm is installed ($NPM_VERSION)"
else
    error "npm is not installed"
    exit 1
fi

# Check if .env file exists
echo ""
echo "Checking configuration..."
if [ -f .env ]; then
    success ".env file exists"
    
    # Check if DATABASE_URL is set
    if grep -q "DATABASE_URL=" .env; then
        success "DATABASE_URL is configured"
    else
        error "DATABASE_URL is not set in .env"
        exit 1
    fi
else
    error ".env file does not exist"
    echo "Please create a .env file with DATABASE_URL"
    exit 1
fi

# Source .env file
export $(cat .env | grep -v '^#' | xargs)

# Check if PostgreSQL is running
echo ""
echo "Checking PostgreSQL service..."
if sudo service postgresql status >/dev/null 2>&1; then
    success "PostgreSQL service is running"
else
    warning "PostgreSQL service is not running"
    echo "Attempting to start PostgreSQL..."
    sudo service postgresql start
    sleep 2
    if sudo service postgresql status >/dev/null 2>&1; then
        success "PostgreSQL service started"
    else
        error "Failed to start PostgreSQL service"
        exit 1
    fi
fi

# Extract database details from DATABASE_URL
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

# Check if database exists
echo ""
echo "Checking database..."
if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    success "Database '$DB_NAME' exists"
else
    error "Database '$DB_NAME' does not exist"
    echo "Run: ./scripts/setup-database.sh"
    exit 1
fi

# Check if database tables exist
echo ""
echo "Checking database schema..."
TABLE_COUNT=$(sudo -u postgres psql -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';")

if [ "$TABLE_COUNT" -gt 0 ]; then
    success "Database has $TABLE_COUNT tables"
    
    # List tables
    echo "  Tables:"
    sudo -u postgres psql -d "$DB_NAME" -tAc "SELECT tablename FROM pg_tables WHERE schemaname='public';" | while read table; do
        echo "    - $table"
    done
else
    warning "Database has no tables"
    echo "Run: npm run db:migrate"
fi

# Check if node_modules exists
echo ""
echo "Checking dependencies..."
if [ -d node_modules ]; then
    success "Dependencies are installed"
else
    error "Dependencies are not installed"
    echo "Run: npm install"
    exit 1
fi

# Test build
echo ""
echo "Testing build process..."
if npm run build >/dev/null 2>&1; then
    success "Build successful"
    
    # Check if build artifacts exist
    if [ -d dist/public ] && [ -f dist/server/index.js ]; then
        success "Build artifacts created"
    else
        error "Build artifacts missing"
        exit 1
    fi
else
    error "Build failed"
    exit 1
fi

# Test Electron build capability (don't actually build, just check if it would work)
echo ""
echo "Checking Electron build capability..."
if [ -f electron/main.js ]; then
    success "Electron main file exists"
else
    error "Electron main file missing"
    exit 1
fi

if [ -f electron-builder.yml ]; then
    success "electron-builder config exists"
else
    error "electron-builder config missing"
    exit 1
fi

# Final summary
echo ""
echo "========================================="
success "All checks passed!"
echo ""
echo "Next steps:"
echo "  1. Start development server: npm run dev"
echo "  2. Build Electron app: npm run build:electron"
echo "  3. Build AppImage: ./build-appimage.sh"
echo ""
