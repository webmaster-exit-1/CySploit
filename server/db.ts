import { neonConfig, Pool as NeonPool } from '@neondatabase/serverless';
import { Pool as PgPool } from 'pg';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import ws from 'ws';
import * as schema from '@shared/schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set. Did you forget to provision a database?');
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

const databaseUrl = process.env.DATABASE_URL;

// Drizzle driver selection:
// - Neon serverless driver for Neon-hosted databases (WebSocket transport)
// - node-postgres for local/docker/self-hosted Postgres
export const pool = isNeonDatabaseUrl(databaseUrl)
  ? (() => {
      neonConfig.webSocketConstructor = ws;
      return new NeonPool({ connectionString: databaseUrl });
    })()
  : new PgPool({ connectionString: databaseUrl });

export const db = isNeonDatabaseUrl(databaseUrl)
  ? drizzleNeon(pool as NeonPool, { schema })
  : drizzlePg(pool as PgPool, { schema });