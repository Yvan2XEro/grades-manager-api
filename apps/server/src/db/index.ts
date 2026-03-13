import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { Pool } from "pg";
import * as schema from "./schema/app-schema";
import * as authSchema from "./schema/auth";

const IS_TEST = process.env.NODE_ENV === "test";
const USE_PGLITE = IS_TEST || process.env.USE_PGLITE === "true";

const allSchema = { ...schema, ...authSchema };
type AppDb = ReturnType<typeof drizzlePg<typeof allSchema>>;

let db: AppDb;
let pgliteInstance: import("@electric-sql/pglite").PGlite | null = null;

if (USE_PGLITE) {
	const { PGlite } = await import("@electric-sql/pglite");

	if (IS_TEST) {
		// Tests: always use in-memory PGlite, isolated from dev data.
		// Most test files never reach here (the module mock in test-setup.ts
		// redirects @/db to test-db.ts). This branch is a safety net for code
		// that bypasses the mock (e.g. seed/runner.ts imported for its types).
		pgliteInstance = new PGlite();
		console.warn(
			"[DB] Test fallback: in-memory PGlite (module mock was bypassed)",
		);
	} else {
		// Dev: file-based storage for persistence across restarts
		const dataDir = process.env.PGLITE_DATA_DIR || "./data/pglite";
		pgliteInstance = new PGlite(dataDir);
		console.log(`[DB] Using PGlite (data: ${dataDir})`);
	}

	db = drizzlePglite(pgliteInstance, {
		schema: allSchema,
	}) as unknown as AppDb;
} else {
	const pool = new Pool({ connectionString: process.env.DATABASE_URL });
	db = drizzlePg(pool, { schema: allSchema });

	console.log("[DB] Using PostgreSQL");
}

/**
 * Close the database connection.
 * Important for PGlite to properly flush data.
 */
export async function closeDatabase(): Promise<void> {
	if (pgliteInstance) {
		await pgliteInstance.close();
		pgliteInstance = null;
		console.log("[DB] PGlite connection closed");
	}
}

/**
 * Check if PGlite is being used.
 */
export function isUsingPGlite(): boolean {
	return USE_PGLITE;
}

/**
 * Get the raw PGlite instance (for schema push scripts).
 */
export function getPGliteInstance():
	| import("@electric-sql/pglite").PGlite
	| null {
	return pgliteInstance;
}

export { db };
