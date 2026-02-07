# Database Setup Guide

This guide will help you set up the PostgreSQL database for CySploit.

## Prerequisites

- PostgreSQL 12 or later
- Node.js 18 or later
- npm or yarn

## Automated Setup

The easiest way to set up the database is using our setup script:

```bash
./scripts/setup-database.sh
```

This script will:
1. Check if PostgreSQL is installed
2. Start the PostgreSQL service if needed
3. Create a database user (default: `cysploit`)
4. Create a database (default: `cysploit`)
5. Grant necessary privileges
6. Create a `.env` file with the database connection string

### Custom Configuration

You can customize the database setup by setting environment variables:

```bash
DB_NAME=mycustomdb DB_USER=myuser DB_PASSWORD=mypass ./scripts/setup-database.sh
```

## Manual Setup

If you prefer to set up the database manually:

### 1. Install PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
```

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Fedora/RHEL:**
```bash
sudo dnf install postgresql-server postgresql-contrib
sudo postgresql-setup --initdb
sudo systemctl start postgresql
```

### 2. Create Database and User

Connect to PostgreSQL as the postgres user:

```bash
sudo -u postgres psql
```

Run the following SQL commands:

```sql
-- Create user
CREATE USER cysploit WITH PASSWORD 'cysploit';

-- Create database
CREATE DATABASE cysploit OWNER cysploit;

-- Grant privileges
\c cysploit
GRANT ALL PRIVILEGES ON SCHEMA public TO cysploit;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO cysploit;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO cysploit;

-- Exit
\q
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```bash
# Database Configuration
DATABASE_URL=postgresql://cysploit:cysploit@localhost:5432/cysploit

# Server Configuration
PORT=5000
NODE_ENV=development
```

### 4. Run Migrations

Apply the database schema:

```bash
npm run db:migrate
```

## Database Schema

CySploit uses the following tables:

### Core Tables

- **settings** - Application settings and API keys
- **users** - User accounts (for future authentication)
- **devices** - Discovered network devices (legacy)
- **sessions** - Network scanning sessions (legacy)
- **packets** - Captured network packets

### Scanning Tables

- **nmap_scans** - Nmap scan metadata and results
- **hosts** - Discovered hosts from scans
- **ports** - Open ports found on hosts
- **vulnerabilities** - Detected vulnerabilities

### External Integration Tables

- **shodan_searches** - Shodan search results
- **capture_sessions** - Packet capture session metadata

## Verifying the Setup

After setup, verify the database is working:

```bash
# Check database tables
psql -U cysploit -d cysploit -c "\dt"

# Test database connection
npm run server
```

You should see output indicating the server connected to the database successfully.

## Troubleshooting

### Connection Refused

If you get "connection refused" errors:

1. Check if PostgreSQL is running:
   ```bash
   sudo service postgresql status
   ```

2. Start PostgreSQL if needed:
   ```bash
   sudo service postgresql start
   ```

3. Check PostgreSQL is listening on the correct port:
   ```bash
   sudo netstat -plnt | grep 5432
   ```

### Permission Denied

If you get "permission denied" errors:

1. Ensure the database owner is correct:
   ```bash
   sudo -u postgres psql -c "ALTER DATABASE cysploit OWNER TO cysploit;"
   ```

2. Grant schema privileges:
   ```bash
   sudo -u postgres psql cysploit -c "GRANT ALL PRIVILEGES ON SCHEMA public TO cysploit;"
   ```

### Migration Errors

If migrations fail:

1. Check the DATABASE_URL in your `.env` file
2. Verify the user has CREATE permissions on the database
3. Try resetting the migrations:
   ```bash
   # Drop and recreate (WARNING: destroys all data)
   sudo -u postgres psql -c "DROP DATABASE cysploit;"
   sudo -u postgres psql -c "CREATE DATABASE cysploit OWNER cysploit;"
   npm run db:migrate
   ```

## Docker Setup (Alternative)

If you prefer using Docker for PostgreSQL:

```bash
docker run -d \
  --name cysploit-db \
  -e POSTGRES_DB=cysploit \
  -e POSTGRES_USER=cysploit \
  -e POSTGRES_PASSWORD=cysploit \
  -p 5432:5432 \
  postgres:16
```

Then use this DATABASE_URL in your `.env`:
```
DATABASE_URL=postgresql://cysploit:cysploit@localhost:5432/cysploit
```

## Production Considerations

For production deployments:

1. **Use strong passwords** - Change the default password
2. **Use SSL connections** - Configure PostgreSQL to require SSL
3. **Regular backups** - Set up automated database backups
4. **Connection pooling** - Configure appropriate connection pool sizes
5. **Monitoring** - Monitor database performance and connections

Example production DATABASE_URL with SSL:
```
DATABASE_URL=postgresql://cysploit:strongpassword@dbhost:5432/cysploit?sslmode=require
```

## Database Management Commands

```bash
# Generate new migrations after schema changes
npm run db:generate

# Apply migrations
npm run db:migrate

# Push schema directly (development only)
npm run db:push

# Connect to database
psql -U cysploit -d cysploit

# Backup database
pg_dump -U cysploit cysploit > backup.sql

# Restore database
psql -U cysploit cysploit < backup.sql
```

## Support

If you encounter issues not covered here, please:

1. Check the [GitHub Issues](https://github.com/webmaster-exit-1/CySploit/issues)
2. Review the PostgreSQL logs: `sudo journalctl -u postgresql`
3. Open a new issue with details about your setup and error messages
