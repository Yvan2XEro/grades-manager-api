import { randomUUID } from "node:crypto";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, organization } from "better-auth/plugins";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "../db/schema/app-schema";
import * as authSchema from "../db/schema/auth";
import { adminRoles } from "./auth";
import {
	organizationAccessControl,
	organizationRoles,
} from "./organization-roles";

const pg = new PGlite();
export const db = drizzle(pg, { schema: { ...schema, ...authSchema } });

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: authSchema,
	}),
	plugins: [
		admin({ adminRoles: adminRoles }),
		organization({
			allowUserToCreateOrganization: true,
			ac: organizationAccessControl,
			roles: organizationRoles,
		}),
	],
	trustedOrigins: process.env.CORS_ORIGINS?.split(",") || [],
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
	// Create organization first
	const orgId = randomUUID();
	const [org] = await db
		.insert(authSchema.organization)
		.values({
			id: orgId,
			name: "Test Institution",
			slug: "test-institution",
			createdAt: new Date(),
		})
		.returning();

	// Create institution linked to organization
	const [institution] = await db
		.insert(schema.institutions)
		.values({
			code: "TEST",
			shortName: "TEST",
			nameFr: "Institution de test",
			nameEn: "Test Institution",
			organizationId: org.id,
		})
		.returning();

	// Create teacher user
	const firstName = "Seed";
	const lastName = "Administrator";
	const teacher = await auth.api.createUser({
		body: {
			name: `${firstName} ${lastName}`,
			email: "seed.teacher@example.com",
			role: "administrator",
			password: "password",
		},
	});

	// Create member linking user to organization
	const [member] = await db
		.insert(authSchema.member)
		.values({
			id: randomUUID(),
			organizationId: org.id,
			userId: teacher.user.id,
			role: "administrator",
			createdAt: new Date(),
		})
		.returning();

	// Create domain user profile linked to member
	await db.insert(schema.domainUsers).values({
		authUserId: teacher.user.id,
		memberId: member.id,
		businessRole: "administrator",
		firstName,
		lastName,
		primaryEmail: "seed.teacher@example.com",
		phone: null,
		dateOfBirth: new Date("1990-01-01"),
		placeOfBirth: "Seed City",
		gender: "other",
		nationality: null,
		status: "active",
	});

	const [faculty] = await db
		.insert(schema.faculties)
		.values({
			code: "FAC-SEED",
			name: "Seed Faculty",
			institutionId: institution.id,
		})
		.returning();
	const [semester] = await db
		.insert(schema.semesters)
		.values({ code: "S1", name: "Semester 1", orderIndex: 1 })
		.returning();
	const [year] = await db
		.insert(schema.academicYears)
		.values({
			name: "2024",
			startDate: new Date("2024-01-01").toISOString(),
			endDate: new Date("2024-12-31").toISOString(),
			institutionId: institution.id,
		})
		.returning();
	const [cycle] = await db
		.insert(schema.studyCycles)
		.values({
			facultyId: faculty.id,
			code: "default",
			name: "Default Cycle",
			totalCreditsRequired: 180,
			durationYears: 3,
		})
		.returning();
	const [level] = await db
		.insert(schema.cycleLevels)
		.values({
			cycleId: cycle.id,
			orderIndex: 1,
			code: "L1",
			name: "Level 1",
			minCredits: 60,
		})
		.returning();
	const [program] = await db
		.insert(schema.programs)
		.values({
			code: "PRG-SEED",
			name: "Seed Program",
			slug: "seed-program",
			faculty: faculty.id,
			institutionId: institution.id,
		})
		.returning();
	const [option] = await db
		.insert(schema.programOptions)
		.values({
			programId: program.id,
			name: "Default option",
			code: "default",
			institutionId: institution.id,
		})
		.returning();
	await db.insert(schema.teachingUnits).values({
		name: "Seed UE",
		code: "UE-SEED",
		programId: program.id,
		credits: 3,
		semester: "annual",
	});
	await db.insert(schema.classes).values({
		code: "CLS-SEED",
		name: "Seed Class",
		program: program.id,
		academicYear: year.id,
		cycleLevelId: level.id,
		programOptionId: option.id,
		semesterId: semester.id,
		institutionId: institution.id,
	});
}

export async function reset() {
	await db.execute(sql`
    TRUNCATE TABLE
     course_prerequisites,
     domain_users,
     student_course_enrollments,
     student_credit_ledgers,
     grades,
     exams,
     class_courses,
     enrollments,
     courses,
     teaching_units,
     classes,
     programs,
     exam_schedule_runs,
     faculties,
     academic_years,
     students,
     semesters,
     cycle_levels,
     study_cycles,
     account,
     invitation,
     member,
     organization,
     session,
     verification,
     "user"
    RESTART IDENTITY CASCADE
  `);
}

export async function close() {
	await pg.close();
}
