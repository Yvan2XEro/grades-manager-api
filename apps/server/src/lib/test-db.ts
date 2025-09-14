import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "../db/schema/app-schema";
import * as authSchema from "../db/schema/auth";
import { sql } from "drizzle-orm";
import path from "node:path";

const pg = new PGlite();
export const db = drizzle(pg, { schema: { ...schema, ...authSchema } });

export async function pushSchema() {
  const migrationsFolder = path.resolve(import.meta.dir, "../db/migrations");
  await migrate(db, { migrationsFolder });
}

export async function seed() {
  await db.insert(schema.profiles).values({
    id: "seed-teacher",
    firstName: "Seed",
    lastName: "Teacher",
    email: "seed.teacher@example.com",
    role: "ADMIN",
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
  await db.execute(
    sql`TRUNCATE TABLE grades, exams, class_courses, courses, classes, programs, faculties, academic_years, profiles, students RESTART IDENTITY CASCADE`,
  );
}

export async function close() {
  await pg.close();
}
