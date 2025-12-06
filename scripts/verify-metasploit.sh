#!/bin/bash

# Metasploit Framework Verification Script for CySploit
# This script verifies that Metasploit Framework is properly installed and configured

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "========================================"
echo "Metasploit Framework Verification"
echo "========================================"
echo ""

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

test_pass() {
    echo -e "${GREEN}✓ PASS${NC}: $1"
    ((TESTS_PASSED++))
}

test_fail() {
    echo -e "${RED}✗ FAIL${NC}: $1"
    ((TESTS_FAILED++))
}

# Test 1: Check if msfconsole is available
echo "Test 1: Checking msfconsole installation..."
if command -v msfconsole &> /dev/null; then
    test_pass "msfconsole is installed"
    version=$(msfconsole --version 2>&1 | grep "Framework Version" || echo "Unknown")
    echo -e "${BLUE}ℹ INFO${NC}: $version"
else
    test_fail "msfconsole is not installed"
fi
echo ""

# Test 2: Check if database.yml exists
echo "Test 2: Checking database configuration..."
if [ -f ~/.msf4/database.yml ]; then
    test_pass "database.yml exists at ~/.msf4/database.yml"
else
    test_fail "database.yml does not exist at ~/.msf4/database.yml"
fi
echo ""

# Test 3: Check if msf_db database exists
echo "Test 3: Checking Metasploit database..."
# Get the container name dynamically
CONTAINER_NAME=$(docker ps --format "{{.Names}}" | grep cysploit-db | head -1)
if [ -n "$CONTAINER_NAME" ]; then
    if docker exec "$CONTAINER_NAME" psql -U cysploit -d cysploit_db -c "\l" 2>/dev/null | grep -q "msf_db"; then
        test_pass "msf_db database exists"
    else
        test_fail "msf_db database does not exist"
    fi
    
    # Test database connection
    if docker exec "$CONTAINER_NAME" psql -U msf_user -d msf_db -c "SELECT 1;" &> /dev/null; then
        test_pass "msf_user can connect to msf_db"
    else
        test_fail "msf_user cannot connect to msf_db"
    fi
else
    test_fail "PostgreSQL container is not running"
    echo -e "${BLUE}ℹ INFO${NC}: Start with: docker compose up -d"
fi
echo ""

# Test 4: Check if Metasploit tables exist
echo "Test 4: Checking Metasploit database tables..."
if [ -n "$CONTAINER_NAME" ]; then
    table_count=$(docker exec "$CONTAINER_NAME" psql -U msf_user -d msf_db -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')
    
    if [ "$table_count" -gt 0 ]; then
        test_pass "Metasploit database has $table_count tables"
    else
        test_fail "Metasploit database has no tables (not initialized)"
        echo -e "${BLUE}ℹ INFO${NC}: Initialize with: echo 'db_status' | msfconsole"
    fi
else
    echo -e "${YELLOW}⚠ WARNING${NC}: Skipping (database container not running)"
fi
echo ""

# Test 5: Check critical Metasploit tables
echo "Test 5: Checking critical Metasploit tables..."
if [ -n "$CONTAINER_NAME" ]; then
    critical_tables=("hosts" "services" "vulns" "workspaces")
    
    for table in "${critical_tables[@]}"; do
        if docker exec "$CONTAINER_NAME" psql -U msf_user -d msf_db -t -c "\dt" 2>/dev/null | grep -q "$table"; then
            test_pass "Table '$table' exists"
        else
            test_fail "Table '$table' does not exist"
        fi
    done
else
    echo -e "${YELLOW}⚠ WARNING${NC}: Skipping (database container not running)"
fi
echo ""

# Test 6: Test Metasploit database connection
echo "Test 6: Testing Metasploit console database connection..."
if command -v msfconsole &> /dev/null; then
    if [ -n "$CONTAINER_NAME" ]; then
        # Run msfconsole with db_status and capture output
        db_status=$(echo "db_status" | timeout 30 msfconsole -q 2>&1 | grep -i "connected\|database" | head -1)
        
        if echo "$db_status" | grep -qi "connected"; then
            test_pass "Metasploit can connect to database"
            echo -e "${BLUE}ℹ INFO${NC}: $db_status"
        else
            test_fail "Metasploit cannot connect to database"
        fi
    else
        echo -e "${YELLOW}⚠ WARNING${NC}: Skipping (database container not running)"
    fi
else
    echo -e "${YELLOW}⚠ WARNING${NC}: Skipping (msfconsole not installed)"
fi
echo ""

# Summary
echo "========================================"
echo "Verification Summary"
echo "========================================"
echo -e "${GREEN}Passed:${NC}   $TESTS_PASSED"
echo -e "${RED}Failed:${NC}   $TESTS_FAILED"
echo "========================================"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    echo ""
    echo "✅ Metasploit Framework is properly installed and configured"
    echo "✅ Database connection is working"
    echo "✅ All critical tables are present"
    echo ""
    echo "You can start using Metasploit with:"
    echo "  msfconsole"
    exit 0
else
    echo -e "${RED}Some tests failed. Please review the output above.${NC}"
    exit 1
fi
