import { afterAll, beforeAll, beforeEach, mock } from "bun:test";
import { config } from "dotenv";
import { requireDefaultInstitution } from "./institution";
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
	const institution = await requireDefaultInstitution();
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
