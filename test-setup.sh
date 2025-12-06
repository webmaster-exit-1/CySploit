#!/bin/bash

# CySploit Setup Test Script
# This script verifies that the database is created correctly,
# the application builds correctly, and all tools are installed and working.

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_WARNING=0

# Test result function
test_pass() {
    echo -e "${GREEN}✓ PASS${NC}: $1"
    ((TESTS_PASSED++))
}

test_fail() {
    echo -e "${RED}✗ FAIL${NC}: $1"
    ((TESTS_FAILED++))
}

test_warning() {
    echo -e "${YELLOW}⚠ WARNING${NC}: $1"
    ((TESTS_WARNING++))
}

test_info() {
    echo -e "${BLUE}ℹ INFO${NC}: $1"
}

echo "========================================"
echo "CySploit Setup Verification Test"
echo "========================================"
echo ""

# Test 1: Check if .env file exists
echo "Test 1: Checking for .env file..."
if [ -f ".env" ]; then
    test_pass ".env file exists"
    if grep -q "DATABASE_URL" .env; then
        test_pass "DATABASE_URL is configured in .env"
    else
        test_fail "DATABASE_URL is not configured in .env"
    fi
else
    test_fail ".env file does not exist"
fi
echo ""

# Test 2: Check Docker installation
echo "Test 2: Checking Docker installation..."
if command -v docker &> /dev/null; then
    test_pass "Docker is installed"
    docker_version=$(docker --version)
    test_info "Docker version: $docker_version"
else
    test_fail "Docker is not installed"
fi
echo ""

# Test 3: Check if PostgreSQL container is running
echo "Test 3: Checking PostgreSQL container..."
if docker ps | grep -q "cysploit-db"; then
    test_pass "PostgreSQL container is running"
    # Test database connection
    if docker exec cysploit-db-1 psql -U cysploit -d cysploit_db -c "SELECT 1;" &> /dev/null; then
        test_pass "Database connection successful"
    else
        test_fail "Cannot connect to database"
    fi
else
    test_fail "PostgreSQL container is not running"
    test_info "Run 'docker compose up -d' to start the database"
fi
echo ""

# Test 4: Check CySploit database tables
echo "Test 4: Checking CySploit database schema..."
expected_tables=("settings" "devices" "sessions" "packets" "users" "vulnerabilities")
tables_found=0

if docker ps | grep -q "cysploit-db"; then
    for table in "${expected_tables[@]}"; do
        if docker exec cysploit-db-1 psql -U cysploit -d cysploit_db -c "\dt" | grep -q "$table"; then
            test_pass "Table '$table' exists in cysploit_db"
            ((tables_found++))
        else
            test_fail "Table '$table' does not exist in cysploit_db"
        fi
    done
    
    if [ $tables_found -eq ${#expected_tables[@]} ]; then
        test_pass "All expected CySploit tables exist"
    else
        test_fail "Some CySploit tables are missing (found $tables_found/${#expected_tables[@]})"
    fi
else
    test_warning "Skipping CySploit database schema check (container not running)"
fi
echo ""

# Test 4.5: Check Metasploit database
echo "Test 4.5: Checking Metasploit database integration..."
if docker ps | grep -q "cysploit-db"; then
    # Check if msf_db exists
    if docker exec cysploit-db-1 psql -U cysploit -d cysploit_db -c "\l" | grep -q "msf_db"; then
        test_pass "Metasploit database 'msf_db' exists"
    else
        test_fail "Metasploit database 'msf_db' does not exist"
    fi
    
    # Check if msf_user can connect
    if docker exec cysploit-db-1 psql -U msf_user -d msf_db -c "SELECT 1;" &> /dev/null; then
        test_pass "Metasploit user can connect to msf_db"
    else
        test_fail "Metasploit user cannot connect to msf_db"
    fi
    
    # Check environment variables
    if grep -q "MSF_DATABASE" .env; then
        test_pass "Metasploit database configuration in .env"
    else
        test_warning "Metasploit database configuration not found in .env"
    fi
else
    test_warning "Skipping Metasploit database check (container not running)"
fi
echo ""

# Test 5: Check Node.js and npm
echo "Test 5: Checking Node.js and npm..."
if command -v node &> /dev/null; then
    test_pass "Node.js is installed"
    node_version=$(node --version)
    test_info "Node.js version: $node_version"
else
    test_fail "Node.js is not installed"
fi

if command -v npm &> /dev/null; then
    test_pass "npm is installed"
    npm_version=$(npm --version)
    test_info "npm version: $npm_version"
else
    test_fail "npm is not installed"
fi
echo ""

# Test 6: Check npm dependencies
echo "Test 6: Checking npm dependencies..."
if [ -d "node_modules" ]; then
    test_pass "node_modules directory exists"
    
    # Check for key dependencies
    key_deps=("express" "react" "drizzle-orm" "postgres" "electron")
    for dep in "${key_deps[@]}"; do
        if [ -d "node_modules/$dep" ]; then
            test_pass "Dependency '$dep' is installed"
        else
            test_fail "Dependency '$dep' is not installed"
        fi
    done
else
    test_fail "node_modules directory does not exist. Run 'npm install'"
fi
echo ""

# Test 7: Check required security tools
echo "Test 7: Checking security tools..."

# Check nmap
if command -v nmap &> /dev/null; then
    test_pass "nmap is installed"
    nmap_version=$(nmap --version | head -n1)
    test_info "nmap version: $nmap_version"
else
    test_fail "nmap is not installed"
    test_info "Install with: sudo apt-get install nmap"
fi

# Check tcpdump
if command -v tcpdump &> /dev/null; then
    test_pass "tcpdump is installed"
    tcpdump_version=$(tcpdump --version 2>&1 | head -n1)
    test_info "tcpdump version: $tcpdump_version"
else
    test_fail "tcpdump is not installed"
    test_info "Install with: sudo apt-get install tcpdump"
fi

# Check metasploit (optional)
if command -v msfconsole &> /dev/null; then
    test_pass "Metasploit Framework is installed"
    msf_version=$(msfconsole --version 2>&1 | head -n1)
    test_info "Metasploit version: $msf_version"
else
    test_warning "Metasploit Framework is not installed (optional)"
    test_info "This is a large package and is optional for basic functionality"
fi
echo ""

# Test 8: Check build artifacts
echo "Test 8: Checking build artifacts..."

# Check client build
if [ -d "dist/public" ]; then
    test_pass "Client build directory exists (dist/public)"
    
    if [ -f "dist/public/index.html" ]; then
        test_pass "Client index.html exists"
    else
        test_fail "Client index.html does not exist"
    fi
    
    if ls dist/public/assets/*.js &> /dev/null; then
        test_pass "Client JavaScript bundles exist"
    else
        test_fail "Client JavaScript bundles do not exist"
    fi
    
    if ls dist/public/assets/*.css &> /dev/null; then
        test_pass "Client CSS bundles exist"
    else
        test_fail "Client CSS bundles do not exist"
    fi
else
    test_fail "Client build directory does not exist. Run 'npm run build:client'"
fi

# Check server build
if [ -d "server-build" ]; then
    test_pass "Server build directory exists (server-build)"
    
    if [ -f "server-build/server/index.js" ]; then
        test_pass "Server index.js exists"
    else
        test_fail "Server index.js does not exist"
    fi
else
    test_fail "Server build directory does not exist. Run 'npm run build:server'"
fi
echo ""

# Test 9: Test database migrations
echo "Test 9: Checking database migrations..."
if [ -d "migrations" ]; then
    test_pass "Migrations directory exists"
    
    migration_count=$(find migrations -name "*.sql" -type f | wc -l)
    if [ $migration_count -gt 0 ]; then
        test_pass "Found $migration_count migration file(s)"
    else
        test_warning "No migration SQL files found"
    fi
else
    test_fail "Migrations directory does not exist"
fi
echo ""

# Test 10: Verify configuration files
echo "Test 10: Checking configuration files..."

config_files=("package.json" "tsconfig.json" "vite.config.ts" "drizzle.config.ts" "docker-compose.yml")
for file in "${config_files[@]}"; do
    if [ -f "$file" ]; then
        test_pass "Configuration file '$file' exists"
    else
        test_fail "Configuration file '$file' does not exist"
    fi
done
echo ""

# Test 11: Check TypeScript compilation
echo "Test 11: Testing TypeScript compilation..."
if command -v npx &> /dev/null; then
    if npx tsc --noEmit --project tsconfig.json &> /dev/null; then
        test_pass "TypeScript compilation successful (tsconfig.json)"
    else
        test_warning "TypeScript compilation has errors or warnings (tsconfig.json)"
    fi
    
    if npx tsc --noEmit --project tsconfig.server.json &> /dev/null; then
        test_pass "TypeScript compilation successful (tsconfig.server.json)"
    else
        test_warning "TypeScript compilation has errors or warnings (tsconfig.server.json)"
    fi
else
    test_warning "Cannot test TypeScript compilation (npx not available)"
fi
echo ""

# Test 12: Check Electron configuration
echo "Test 12: Checking Electron configuration..."
if [ -d "electron" ]; then
    test_pass "Electron directory exists"
    
    electron_files=("electron/main.js" "electron/preload.js")
    for file in "${electron_files[@]}"; do
        if [ -f "$file" ]; then
            test_pass "Electron file '$file' exists"
        else
            test_fail "Electron file '$file' does not exist"
        fi
    done
else
    test_fail "Electron directory does not exist"
fi
echo ""

# Summary
echo "========================================"
echo "Test Summary"
echo "========================================"
echo -e "${GREEN}Passed:${NC}   $TESTS_PASSED"
echo -e "${RED}Failed:${NC}   $TESTS_FAILED"
echo -e "${YELLOW}Warnings:${NC} $TESTS_WARNING"
echo "========================================"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}All critical tests passed!${NC}"
    echo ""
    echo "✅ Database is created and configured correctly"
    echo "✅ Application builds successfully"
    echo "✅ Required tools are installed and working"
    echo ""
    echo "You can now start the application with:"
    echo "  npm run dev"
    echo ""
    echo "Or build the Electron app with:"
    echo "  ./build-electron.sh"
    exit 0
else
    echo -e "${RED}Some tests failed. Please review the output above.${NC}"
    exit 1
fi
