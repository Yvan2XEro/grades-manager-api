import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "../db/schema/app-schema";
import * as authSchema from "../db/schema/auth";
import { sql } from "drizzle-orm";
import path from "node:path";
import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { adminRoles } from "./auth";

const pg = new PGlite();
export const db = drizzle(pg, { schema: { ...schema, ...authSchema } });

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: authSchema,
  }),
  plugins: [admin({ adminRoles: adminRoles })],
  trustedOrigins: [process.env.CORS_ORIGIN || ""],
  emailAndPassword: {
    enabled: true,
  },
  advanced: {
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
      httpOnly: true,
    },
  },
});

export async function pushSchema() {
  const migrationsFolder = path.resolve(import.meta.dir, "../db/migrations");
  await migrate(db, { migrationsFolder });
}

export async function seed() {
  const firstName = "Seed",
    lastName = "Teacher";
  await auth.api.createUser({
    body: {
      name: `${firstName} ${lastName}`,
      email: "seed.teacher@example.com",
      role: "admin",
      password: "password",
    },
  });
  const [faculty] = await db
    .insert(schema.faculties)
    .values({ name: "Seed Faculty" })
    .returning();
  const [year] = await db
    .insert(schema.academicYears)
    .values({
      name: "2024",
      startDate: new Date("2024-01-01").toISOString(),
      endDate: new Date("2024-12-31").toISOString(),
    })
    .returning();
  const [program] = await db
    .insert(schema.programs)
    .values({ name: "Seed Program", faculty: faculty.id })
    .returning();
  await db.insert(schema.classes).values({
    name: "Seed Class",
    program: program.id,
    academicYear: year.id,
  });
}

export async function reset() {
  await db.execute(sql`
    TRUNCATE TABLE
     grades,
     exams,
     class_courses,
     courses,
     classes,
     programs,
     faculties,
     academic_years,
     students,
     account,
     session,
     verification,
     "user"
    RESTART IDENTITY CASCADE
  `);
}

export async function close() {
  await pg.close();
}
