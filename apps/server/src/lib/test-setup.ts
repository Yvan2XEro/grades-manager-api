import { afterAll, beforeAll, beforeEach, mock } from "bun:test";
import { asc } from "drizzle-orm";
import { config } from "dotenv";
import * as schema from "../db/schema/app-schema";
import { setTestInstitution } from "./test-context-state";
import { close, db, pushSchema, reset, seed } from "./test-db";

try {
	config({ path: ".env.test" });
} catch {}

const dbMock = () => ({ db });
mock.module("../db", dbMock);
mock.module("../../db", dbMock);
mock.module("@/db", dbMock);

async function refreshTestInstitution() {
	// Get the first institution created by seed()
	const institution = await db.query.institutions.findFirst({
		orderBy: asc(schema.institutions.createdAt),
	});
	if (!institution) {
		throw new Error(
			"No institution found after seeding. Ensure test-db seed() creates an institution.",
		);
	}
	setTestInstitution(institution);
}

beforeAll(async () => {
	await pushSchema();
	await reset();
	await seed();
	await refreshTestInstitution();
});

beforeEach(async () => {
	await reset();
	await seed();
	await refreshTestInstitution();
});

afterAll(async () => {
	await close();
});
