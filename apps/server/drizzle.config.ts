import { defineConfig } from "drizzle-kit";

const USE_PGLITE = process.env.USE_PGLITE === "true";

export default defineConfig({
	schema: "./src/db/schema",
	out: "./src/db/migrations",
	dialect: "postgresql",
	...(USE_PGLITE
		? {
				driver: "pglite",
				dbCredentials: {
					url: process.env.PGLITE_DATA_DIR || "./data/pglite",
				},
			}
		: {
				dbCredentials: {
					url: process.env.DATABASE_URL || "",
				},
			}),
});
