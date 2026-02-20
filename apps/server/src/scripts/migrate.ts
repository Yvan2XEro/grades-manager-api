#!/usr/bin/env bun
import { existsSync } from "node:fs";
import { join } from "node:path";
/**
 * Database migration script for production
 * Runs Drizzle migrations programmatically
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

const MIGRATIONS_FOLDER = join(import.meta.dir, "../db/migrations");

async function runMigrations() {
	const DATABASE_URL = process.env.DATABASE_URL;

	if (!DATABASE_URL) {
		console.error("❌ DATABASE_URL environment variable is not set");
		process.exit(1);
	}

	// Check if migrations folder exists and has migrations
	if (!existsSync(MIGRATIONS_FOLDER)) {
		console.log("⚠️  No migrations folder found, skipping migrations");
		return;
	}

	const pool = new Pool({ connectionString: DATABASE_URL });
	const db = drizzle(pool);

	try {
		console.log("🔄 Running database migrations...");
		await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
		console.log("✅ Migrations completed successfully");
	} catch (error) {
		console.error("❌ Migration failed:", error);
		process.exit(1);
	} finally {
		await pool.end();
	}
}

runMigrations();
