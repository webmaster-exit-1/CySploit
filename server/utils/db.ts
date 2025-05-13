/**
 * Database utility functions
 */

/**
 * Get a database connection URL based on environment variables
 */
export function getConnectionUrl(): string {
  const {
    PGHOST,
    PGPORT,
    PGDATABASE,
    PGUSER,
    PGPASSWORD,
    DATABASE_URL
  } = process.env;
  
  // If DATABASE_URL is defined, use it
  if (DATABASE_URL) {
    return DATABASE_URL;
  }
  
  // Otherwise, construct the URL from individual parts
  if (!PGHOST || !PGPORT || !PGDATABASE || !PGUSER || !PGPASSWORD) {
    throw new Error('Missing database connection parameters');
  }
  
  return `postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}`;
}