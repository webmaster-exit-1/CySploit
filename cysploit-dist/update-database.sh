#!/bin/bash

# Script to update the CySploit database schema
# Use this script if you encounter any database-related errors

echo "Starting CySploit database schema update..."

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo "Script running from: $SCRIPT_DIR"

# Change to the script directory to ensure all paths are relative
cd "$SCRIPT_DIR"

# Set PostgreSQL connection string if not already set
if [ -z "$DATABASE_URL" ]; then
  export DATABASE_URL="postgresql://neondb_owner:npg_mSZTyIlN86ts@ep-plain-cake-a6piux6n.us-west-2.aws.neon.tech/neondb?sslmode=require"
  echo "Setting database connection to: $DATABASE_URL"
fi

# Run the database schema update
echo "Updating database schema..."
npm run db:push

echo "Database schema update completed."
echo ""
echo "If you continue to experience database errors, please try the following:"
echo "1. Make sure you have the latest version of the application"
echo "2. Check your database connection"
echo "3. Restart the application"
echo ""