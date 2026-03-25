import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema/app-schema";
import * as authSchema from "./schema/auth";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzlePg(pool, { schema: { ...schema, ...authSchema } });

export type DbInstance = typeof db;
