#!/bin/bash
set -e

# This script creates a separate database for Metasploit Framework
# It runs automatically when the PostgreSQL container is first initialized

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Create Metasploit database
    CREATE DATABASE msf_db;
    
    -- Grant all privileges to the cysploit user for Metasploit database
    GRANT ALL PRIVILEGES ON DATABASE msf_db TO cysploit;
    
    -- Create a dedicated metasploit user (optional, but recommended)
    CREATE USER msf_user WITH PASSWORD 'msf_password';
    GRANT ALL PRIVILEGES ON DATABASE msf_db TO msf_user;
EOSQL

echo "Metasploit database 'msf_db' created successfully"

# Connect to msf_db and set up initial privileges
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "msf_db" <<-EOSQL
    -- Grant schema privileges
    GRANT ALL ON SCHEMA public TO cysploit;
    GRANT ALL ON SCHEMA public TO msf_user;
    
    -- Note: Metasploit will create its own tables when it first connects
    -- The tables include: hosts, services, vulns, notes, loot, creds, etc.
EOSQL

echo "Metasploit database privileges configured"
