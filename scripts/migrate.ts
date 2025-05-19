import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import 'dotenv/config'; // To load DATABASE_URL from .env file (npm install dotenv)

async function runMigrations() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set. Please ensure it's in your .env file or environment.");
  }

  console.log('Attempting to connect to database for migrations...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL); // For debugging, ensure it's not showing undefined

  // Use a short-lived connection for migrations
  const migrationClient = postgres(process.env.DATABASE_URL, { max: 1 });
  const db = drizzle(migrationClient);

  console.log("Applying migrations from './migrations' folder...");
  try {
    await migrate(db, { migrationsFolder: './migrations' }); // Ensure this path is correct relative to where you run the script
    console.log("Migrations applied successfully!");
  } catch (error) {
    console.error("Error applying migrations:", error);
    process.exit(1); // Exit with an error code if migrations fail
  } finally {
    // Ensure the connection is closed after migrations
    await migrationClient.end();
    console.log("Migration client connection closed.");
  }
}

runMigrations().catch(error => {
  console.error("Unhandled error during migration process:", error);
  process.exit(1);
});
