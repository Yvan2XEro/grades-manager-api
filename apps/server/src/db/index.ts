import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { Pool } from "pg";
import * as schema from "./schema/app-schema";
import * as authSchema from "./schema/auth";

const USE_PGLITE = process.env.USE_PGLITE === "true";

type DbInstance =
	| ReturnType<typeof drizzlePg>
	| ReturnType<typeof drizzlePglite>;

let db: DbInstance;
let pgliteInstance: import("@electric-sql/pglite").PGlite | null = null;

if (USE_PGLITE) {
	// Dynamic import to avoid loading PGlite in production
	const { PGlite } = await import("@electric-sql/pglite");

	// Use file-based storage for persistence across restarts
	const dataDir = process.env.PGLITE_DATA_DIR || "./data/pglite";
	pgliteInstance = new PGlite(dataDir);

	db = drizzlePglite(pgliteInstance, { schema: { ...schema, ...authSchema } });

	console.log(`[DB] Using PGlite (data: ${dataDir})`);
} else {
	const pool = new Pool({ connectionString: process.env.DATABASE_URL });
	db = drizzlePg(pool, { schema: { ...schema, ...authSchema } });

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
