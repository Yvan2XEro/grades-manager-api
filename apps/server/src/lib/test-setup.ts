import { config } from "dotenv";
import { beforeAll, beforeEach, afterAll, mock } from "bun:test";
import { db, pushSchema, seed, reset, close } from "./test-db";

try {
  config({ path: ".env.test" });
} catch { }

mock.module("../db", () => ({ db }));

beforeAll(async () => {
  await reset();
  await pushSchema();
  await seed();
});

beforeEach(async () => {
  await reset();
  await seed();
});

afterAll(async () => {
  await close();
});
