import { afterAll, beforeAll, beforeEach, mock } from "bun:test";
import { config } from "dotenv";
import { close, db, pushSchema, reset, seed } from "./test-db";

try {
	config({ path: ".env.test" });
} catch {}

const dbMock = () => ({ db });
mock.module("../db", dbMock);
mock.module("../../db", dbMock);
mock.module("@/db", dbMock);

beforeAll(async () => {
	await pushSchema();
	await reset();
	await seed();
});

beforeEach(async () => {
	await reset();
	await seed();
});

afterAll(async () => {
	await close();
});
