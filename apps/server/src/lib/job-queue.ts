import { PgBoss } from "pg-boss";
import { isUsingPGlite } from "../db";

let boss: PgBoss | null = null;

/**
 * Initialize and start the pg-boss job queue.
 * Only available when using real PostgreSQL (not PGlite).
 */
export async function startJobQueue(): Promise<PgBoss | null> {
	if (isUsingPGlite()) {
		console.log("[JobQueue] PGlite detected — pg-boss disabled (dev mode)");
		return null;
	}

	const connectionString = process.env.DATABASE_URL;
	if (!connectionString) {
		console.warn("[JobQueue] DATABASE_URL not set — pg-boss disabled");
		return null;
	}

	boss = new PgBoss({
		connectionString,
		schema: "pgboss",
		monitorIntervalSeconds: 30,
	});

	boss.on("error", (error) => {
		console.error("[JobQueue] pg-boss error:", error);
	});

	await boss.start();
	console.log("[JobQueue] pg-boss started");

	return boss;
}

/**
 * Get the pg-boss instance.
 * Returns null when running with PGlite or if not started.
 */
export function getJobQueue(): PgBoss | null {
	return boss;
}

/**
 * Gracefully stop the job queue.
 */
export async function stopJobQueue(): Promise<void> {
	if (boss) {
		await boss.stop({ graceful: true, timeout: 10_000 });
		boss = null;
		console.log("[JobQueue] pg-boss stopped");
	}
}
