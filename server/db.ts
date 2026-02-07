import { neonConfig, Pool as NeonPool } from '@neondatabase/serverless';
import { Pool as PgPool } from 'pg';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import ws from 'ws';
import * as schema from '../shared/schema';

if (!process.env.DATABASE_URL) {
  console.warn(
    'WARNING: DATABASE_URL is not set. Database features will be unavailable.\n' +
    'Set DATABASE_URL in your .env file to enable database connectivity.\n' +
    'Example: DATABASE_URL=postgresql://cysploit:cysploit@localhost:5432/cysploit'
  );
}

function isNeonDatabaseUrl(databaseUrl: string): boolean {
  try {
    const url = new URL(databaseUrl);
    const host = url.hostname.toLowerCase();
    return host.endsWith('neon.tech') || host.includes('neon');
  } catch {
    // If URL parsing fails, assume it's not Neon and use standard pg.
    return false;
  }
}

const databaseUrl = process.env.DATABASE_URL ?? '';

function createPoolAndDb() {
  if (!databaseUrl) {
    return { pool: null, db: null };
  }

  if (isNeonDatabaseUrl(databaseUrl)) {
    neonConfig.webSocketConstructor = ws;
    const neonPool = new NeonPool({ connectionString: databaseUrl });
    return { pool: neonPool, db: drizzleNeon(neonPool, { schema }) };
  }

  const pgPool = new PgPool({ connectionString: databaseUrl });
  return { pool: pgPool, db: drizzlePg(pgPool, { schema }) };
}

const { pool: _pool, db: _db } = createPoolAndDb();

export const pool = _pool;

// Export db — always non-null at the type level so existing code compiles.
// When DATABASE_URL is missing, API routes will fail at query time with a
// descriptive error caught by the Express error handler.
export const db = _db as NonNullable<typeof _db>;