# Metasploit Database Integration

## Overview
CySploit uses a shared PostgreSQL instance to support both the CySploit application and Metasploit Framework. This setup allows seamless integration between the two tools.

## Database Architecture

### PostgreSQL Container
The Docker Compose configuration creates a single PostgreSQL 17.4 instance with two separate databases:

1. **cysploit_db** - Main CySploit application database
   - User: `cysploit`
   - Password: `cysploit`
   - Contains tables: devices, sessions, packets, settings, users, vulnerabilities

2. **msf_db** - Metasploit Framework database
   - User: `msf_user`
   - Password: `msf_password`
   - Metasploit will create its own tables when initialized

### Database URLs

```bash
# CySploit Database
DATABASE_URL=postgresql://cysploit:cysploit@localhost:5432/cysploit_db

# Metasploit Database
MSF_DATABASE_URL=postgresql://msf_user:msf_password@localhost:5432/msf_db
```

## Initial Setup

### 1. Start PostgreSQL Container
The container automatically initializes both databases:

```bash
docker compose up -d
```

The initialization script (`scripts/init-metasploit-db.sh`) runs automatically and:
- Creates the `msf_db` database
- Creates the `msf_user` with appropriate permissions
- Grants necessary privileges for Metasploit operations

### 2. Verify Database Creation

Check that both databases exist:
```bash
docker exec cysploit-db-1 psql -U cysploit -d cysploit_db -c "\l"
```

Expected output should show:
- `cysploit_db`
- `msf_db`

### 3. Test Database Connections

**CySploit Database:**
```bash
docker exec cysploit-db-1 psql -U cysploit -d cysploit_db -c "SELECT 1;"
```

**Metasploit Database:**
```bash
docker exec cysploit-db-1 psql -U msf_user -d msf_db -c "SELECT 1;"
```

## Metasploit Framework Configuration

### Automated Installation (Recommended)

We provide an automated installation script that handles all dependencies and configuration:

```bash
# Run the automated installation script
./scripts/install-metasploit.sh
```

This script will:
- Install all required dependencies (Ruby, build tools, libraries)
- Clone Metasploit Framework from GitHub
- Install all required Ruby gems
- Create symbolic links for easy access
- Configure the database connection

### Verify Installation

After installation, run the verification script:

```bash
# Verify Metasploit installation and database connectivity
./scripts/verify-metasploit.sh
```

### Manual Installation (Alternative)

If you prefer to install manually:

```bash
# Install dependencies
sudo apt-get install -y ruby ruby-dev build-essential libpq-dev \
  libpcap-dev autoconf bison libssl-dev libyaml-dev libreadline-dev \
  zlib1g-dev libncurses5-dev libffi-dev libgdbm-dev libsqlite3-dev

# Install bundler
sudo gem install bundler

# Clone Metasploit Framework
cd /opt
sudo git clone --depth=1 https://github.com/rapid7/metasploit-framework.git
cd metasploit-framework

# Install gems
sudo bundle install

# Create symbolic links
sudo ln -sf /opt/metasploit-framework/msfconsole /usr/local/bin/msfconsole
sudo ln -sf /opt/metasploit-framework/msfvenom /usr/local/bin/msfvenom
sudo ln -sf /opt/metasploit-framework/msfrpcd /usr/local/bin/msfrpcd
```

### Configure Metasploit to Use PostgreSQL

Create the Metasploit database configuration file:

```bash
mkdir -p ~/.msf4
cat > ~/.msf4/database.yml << EOF
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
```

### Initialize Metasploit Database

Start msfconsole to initialize the database schema:

```bash
msfconsole
```

Metasploit will automatically:
- Connect to the PostgreSQL database
- Create all necessary tables (hosts, services, vulns, notes, loot, creds, etc.)
- Set up the workspace structure

### Verify Metasploit Database Connection

Inside msfconsole:
```
msf6 > db_status
[*] Connected to msf_db
```

## Database Schema

### CySploit Tables
- `devices` - Network devices discovered
- `sessions` - Scan/capture sessions
- `packets` - Network packet data
- `settings` - Application settings (API keys, configurations)
- `users` - User accounts
- `vulnerabilities` - Vulnerability findings

### Metasploit Tables (Auto-created)
Metasploit creates these tables when first initialized:
- `hosts` - Discovered hosts
- `services` - Services on hosts
- `vulns` - Vulnerabilities
- `notes` - Notes and annotations
- `loot` - Collected data/files
- `creds` - Credentials
- `events` - Event log
- `workspaces` - Project workspaces
- And many more...

## Integration Points

### Sharing Host Data
CySploit can query Metasploit's host database to:
- Import discovered hosts from Metasploit scans
- Cross-reference vulnerability data
- Enrich network mapping with Metasploit data

Example query to get hosts from Metasploit:
```sql
-- From msf_db
SELECT address, name, os_name, state 
FROM hosts 
WHERE workspace_id = (SELECT id FROM workspaces WHERE name = 'default');
```

### RPC Integration
CySploit also uses Metasploit's RPC API for:
- Running exploits
- Managing sessions
- Executing modules
- Real-time command execution

The RPC connection is configured separately in the application settings.

## Maintenance

### Backup Both Databases

```bash
# Backup CySploit database
docker exec cysploit-db-1 pg_dump -U cysploit cysploit_db > cysploit_backup.sql

# Backup Metasploit database
docker exec cysploit-db-1 pg_dump -U msf_user msf_db > msf_backup.sql
```

### Restore Databases

```bash
# Restore CySploit database
docker exec -i cysploit-db-1 psql -U cysploit -d cysploit_db < cysploit_backup.sql

# Restore Metasploit database
docker exec -i cysploit-db-1 psql -U msf_user -d msf_db < msf_backup.sql
```

### Reset Metasploit Database

If you need to reset the Metasploit database:

```bash
# Drop and recreate the database
docker exec cysploit-db-1 psql -U cysploit -d postgres -c "DROP DATABASE msf_db;"
docker exec cysploit-db-1 psql -U cysploit -d postgres -c "CREATE DATABASE msf_db;"
docker exec cysploit-db-1 psql -U cysploit -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE msf_db TO msf_user;"

# Reinitialize by starting msfconsole
msfconsole
```

## Troubleshooting

### Connection Issues

**Problem:** Cannot connect to database
```bash
# Check if PostgreSQL is running
docker ps | grep cysploit-db

# Check PostgreSQL logs
docker logs cysploit-db-1

# Verify port is exposed
netstat -tulpn | grep 5432
```

**Problem:** Authentication failed
```bash
# Verify credentials in .env file
cat .env | grep DATABASE

# Test connection manually
psql -h localhost -U msf_user -d msf_db
```

### Metasploit Tables Not Created

**Problem:** Metasploit database is empty

**Solution:** Start msfconsole to trigger automatic table creation:
```bash
msfconsole
```

### Permission Errors

**Problem:** Permission denied for schema public

**Solution:** Grant proper permissions:
```sql
-- Connect as cysploit user
GRANT ALL ON SCHEMA public TO msf_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO msf_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO msf_user;
```

## Environment Variables

Add these to your `.env` file:

```bash
# CySploit Database
DATABASE_URL=postgresql://cysploit:cysploit@localhost:5432/cysploit_db

# Metasploit Database
MSF_DATABASE_URL=postgresql://msf_user:msf_password@localhost:5432/msf_db
MSF_DATABASE_HOST=localhost
MSF_DATABASE_PORT=5432
MSF_DATABASE_NAME=msf_db
MSF_DATABASE_USER=msf_user
MSF_DATABASE_PASSWORD=msf_password
```

## Security Considerations

1. **Change Default Passwords**: In production, use strong passwords
2. **Network Access**: Limit PostgreSQL port exposure (5432) to localhost only
3. **SSL/TLS**: Enable SSL for database connections in production
4. **User Separation**: Keep separate users for CySploit and Metasploit
5. **Regular Backups**: Implement automated backup strategy

## Testing the Setup

Run the automated test script to verify everything is configured correctly:

```bash
./test-setup.sh
```

The script will verify:
- ✓ Both databases exist
- ✓ Both users can connect
- ✓ Proper permissions are set
- ✓ CySploit tables are created
- ✓ Metasploit database is ready

## References

- [Metasploit Database Setup](https://docs.metasploit.com/docs/using-metasploit/basics/using-a-database.html)
- [PostgreSQL Docker Configuration](https://hub.docker.com/_/postgres)
- [Metasploit Framework GitHub](https://github.com/rapid7/metasploit-framework)
