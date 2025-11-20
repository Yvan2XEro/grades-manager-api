import { config } from "dotenv";
import { beforeAll, beforeEach, afterAll, mock } from "bun:test";
import { db, pushSchema, seed, reset, close } from "./test-db";

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
