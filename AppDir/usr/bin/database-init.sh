#!/bin/bash
# Check if PostgreSQL is installed and available
if command -v psql &> /dev/null; then
    echo "PostgreSQL client found, checking connection..."
    
    if psql -c "SELECT 1" $DATABASE_URL &> /dev/null; then
        echo "Database connection successful. Running migrations..."
        npx drizzle-kit push
        echo "Migrations completed successfully."
    else
        echo "Warning: Could not connect to PostgreSQL database. Please ensure PostgreSQL is running and DATABASE_URL is set correctly."
    fi
else
    echo "Warning: PostgreSQL client not found. Database features may not work properly."
fi
