#!/usr/bin/env bash

# Database setup script for CySploit
# This script sets up PostgreSQL database for CySploit

set -euo pipefail

echo "CySploit Database Setup Script"
echo "================================"
echo ""

# Check if PostgreSQL is installed
if ! command -v psql >/dev/null 2>&1; then
  echo "Error: PostgreSQL is not installed."
  echo "Please install PostgreSQL first:"
  echo "  Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib"
  echo "  macOS: brew install postgresql"
  echo "  Fedora: sudo dnf install postgresql-server postgresql-contrib"
  exit 1
fi

# Configuration
DB_NAME="${DB_NAME:-cysploit}"
DB_USER="${DB_USER:-cysploit}"
DB_PASSWORD="${DB_PASSWORD:-cysploit}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

echo "Database Configuration:"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo ""

# Check if PostgreSQL service is running
if ! sudo service postgresql status >/dev/null 2>&1; then
  echo "Starting PostgreSQL service..."
  sudo service postgresql start
  sleep 2
fi

# Check if database already exists
DB_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" || echo "")

if [ "$DB_EXISTS" = "1" ]; then
  echo "Database '$DB_NAME' already exists."
  read -p "Do you want to drop and recreate it? (y/N): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Dropping database '$DB_NAME'..."
    sudo -u postgres psql -c "DROP DATABASE IF EXISTS $DB_NAME;"
  else
    echo "Keeping existing database."
    exit 0
  fi
fi

# Check if user already exists
USER_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" || echo "")

if [ "$USER_EXISTS" = "1" ]; then
  echo "User '$DB_USER' already exists."
else
  echo "Creating database user '$DB_USER'..."
  sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
fi

# Create database
echo "Creating database '$DB_NAME'..."
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

# Grant privileges
echo "Granting privileges..."
sudo -u postgres psql $DB_NAME -c "GRANT ALL PRIVILEGES ON SCHEMA public TO $DB_USER;"
sudo -u postgres psql $DB_NAME -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;"
sudo -u postgres psql $DB_NAME -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
  echo "Creating .env file..."
  cat > .env << EOF
# Database Configuration
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME

# Server Configuration
PORT=5000
NODE_ENV=development
EOF
  echo ".env file created."
else
  echo ".env file already exists. Please update DATABASE_URL manually if needed:"
  echo "  DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
fi

echo ""
echo "Database setup completed successfully!"
echo ""
echo "Next steps:"
echo "  1. Run migrations: npm run db:migrate"
echo "  2. Start the development server: npm run dev"
echo ""
