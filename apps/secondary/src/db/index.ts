import path from "node:path";
import * as schema from "./schema";

const IS_TEST = process.env.NODE_ENV === "test";
const USE_PGLITE = IS_TEST || process.env.USE_PGLITE === "true";

type AnyDrizzle = ReturnType<
	typeof import("drizzle-orm/node-postgres").drizzle<typeof schema>
>;

let db: AnyDrizzle;
let _pglite: import("@electric-sql/pglite").PGlite | null = null;

if (USE_PGLITE) {
	const { PGlite } = await import("@electric-sql/pglite");
	const { drizzle } = await import("drizzle-orm/pglite");
	_pglite = new PGlite();
	// @ts-expect-error — PGlite and pg-core share the same Drizzle API surface
	db = drizzle(_pglite, { schema });
} else {
	const { Pool } = await import("pg");
	const { drizzle } = await import("drizzle-orm/node-postgres");
	const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
	db = drizzle(pool, { schema });
}

export { db };
export type DB = typeof db;

export async function pushSchema(): Promise<void> {
	if (!_pglite) return;
	const { migrate } = await import("drizzle-orm/pglite/migrator");
	const migrationsFolder = path.resolve(import.meta.dir, "./migrations");
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	await migrate(db as any, { migrationsFolder });
	// Better-Auth tables (not in Drizzle schema)
	await _pglite.exec(`
		CREATE TABLE IF NOT EXISTS "user" (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			email TEXT NOT NULL UNIQUE,
			email_verified BOOLEAN NOT NULL DEFAULT false,
			image TEXT,
			created_at TIMESTAMP NOT NULL DEFAULT now(),
			updated_at TIMESTAMP NOT NULL DEFAULT now()
		);
		CREATE TABLE IF NOT EXISTS organization (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			slug TEXT UNIQUE,
			logo TEXT,
			metadata TEXT,
			created_at TIMESTAMP NOT NULL DEFAULT now()
		);
		CREATE TABLE IF NOT EXISTS member (
			id TEXT PRIMARY KEY,
			organization_id TEXT NOT NULL,
			user_id TEXT NOT NULL,
			role TEXT NOT NULL DEFAULT 'member',
			created_at TIMESTAMP NOT NULL DEFAULT now()
		);
		CREATE TABLE IF NOT EXISTS session (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL,
			token TEXT NOT NULL UNIQUE,
			expires_at TIMESTAMP NOT NULL,
			ip_address TEXT,
			user_agent TEXT,
			active_organization_id TEXT,
			created_at TIMESTAMP NOT NULL DEFAULT now(),
			updated_at TIMESTAMP NOT NULL DEFAULT now()
		);
		CREATE TABLE IF NOT EXISTS account (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL,
			account_id TEXT NOT NULL,
			provider_id TEXT NOT NULL,
			access_token TEXT,
			refresh_token TEXT,
			id_token TEXT,
			access_token_expires_at TIMESTAMP,
			refresh_token_expires_at TIMESTAMP,
			scope TEXT,
			password TEXT,
			created_at TIMESTAMP NOT NULL DEFAULT now(),
			updated_at TIMESTAMP NOT NULL DEFAULT now()
		);
		CREATE TABLE IF NOT EXISTS verification (
			id TEXT PRIMARY KEY,
			identifier TEXT NOT NULL,
			value TEXT NOT NULL,
			expires_at TIMESTAMP NOT NULL,
			created_at TIMESTAMP,
			updated_at TIMESTAMP
		);
	`);
}
