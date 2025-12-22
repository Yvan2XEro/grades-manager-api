import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as appSchema from "../../db/schema/app-schema";
import * as authSchema from "../../db/schema/auth";
import { runSeed } from "../runner";
import { scaffoldSampleSeeds } from "../sample-data";

const silentLogger = {
	log: () => {},
	error: console.error,
};

describe("seed runner", () => {
	let pg: PGlite;
	let db: ReturnType<typeof drizzle>;

	beforeAll(async () => {
		pg = new PGlite();
		db = drizzle(pg, { schema: { ...appSchema, ...authSchema } });
		const migrationsFolder = path.resolve(
			import.meta.dir,
			"../../db/migrations",
		);
		await migrate(db, { migrationsFolder });
	});

	afterAll(async () => {
		await pg.close();
	});

	test("loads the default dataset", async () => {
		const tmpDir = await mkdtemp(path.join(tmpdir(), "seed-runner-"));
		await scaffoldSampleSeeds(tmpDir, { force: true, logger: silentLogger });
		await runSeed({
			db,
			logger: silentLogger,
			baseDir: tmpDir,
		});

		const faculty = await db.query.institutions.findFirst({
			where: eq(appSchema.institutions.code, "ENG"),
		});
		expect(faculty?.nameEn).toBe("Faculty of Engineering");

		const klass = await db.query.classes.findFirst({
			where: eq(appSchema.classes.code, "ENG24-L1A"),
		});
		expect(klass).not.toBeNull();

		const classCourse = await db.query.classCourses.findFirst({
			where: eq(appSchema.classCourses.code, "CC-ENG101-L1A"),
		});
		expect(classCourse?.teacher).not.toBeNull();

		const student = await db.query.students.findFirst({
			where: eq(appSchema.students.registrationNumber, "ENG24-0001"),
		});
		expect(student).not.toBeNull();

		const enrollment = await db.query.enrollments.findFirst({
			where: eq(appSchema.enrollments.studentId, student!.id),
		});
		expect(enrollment?.status).toBe("active");

		const courseAttempt = await db.query.studentCourseEnrollments.findFirst({
			where: eq(appSchema.studentCourseEnrollments.studentId, student!.id),
		});
		expect(courseAttempt?.status).toBe("active");

		const admin = await db.query.user.findFirst({
			where: eq(authSchema.user.email, "admin@example.com"),
		});
		expect(admin?.role).toBe("admin");
	});
});
