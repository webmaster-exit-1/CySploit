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

// When DATABASE_URL is missing _db is null.  We export a Proxy so that any
// property access (e.g. db.select(), db.insert()) throws a descriptive error
// at the call‑site rather than a cryptic "Cannot read properties of null".
// The proxy is typed as NonNullable so existing code compiles unchanged.
const dbProxy = _db ?? new Proxy({} as NonNullable<typeof _db>, {
  get(_target, prop) {
    throw new Error(
      `Database is not configured (DATABASE_URL is not set). ` +
      `Cannot access db.${String(prop)}. ` +
      `Set DATABASE_URL in your .env file to enable database features.`
    );
  },
});

export const db: NonNullable<typeof _db> = dbProxy as NonNullable<typeof _db>;