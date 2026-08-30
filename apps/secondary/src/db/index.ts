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
	// Use a file-based data dir when provided so data survives restarts.
	// Tests always use in-memory (no PGLITE_DATA_DIR in test env).
	const dataDir = IS_TEST ? undefined : process.env.PGLITE_DATA_DIR;
	_pglite = dataDir ? new PGlite(dataDir) : new PGlite();
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
	// Allow overriding the migrations folder via env (needed when running from a bundle).
	const migrationsFolder =
		process.env.MIGRATIONS_DIR ?? path.resolve(import.meta.dir, "./migrations");

	if (_pglite) {
		const { migrate } = await import("drizzle-orm/pglite/migrator");
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		await migrate(db as any, { migrationsFolder });
	} else {
		const { migrate } = await import("drizzle-orm/node-postgres/migrator");
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		await migrate(db as any, { migrationsFolder });
	}
}
