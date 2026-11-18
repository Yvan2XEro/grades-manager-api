/**
 * TKAMS Secondaire — E2E Test Seed
 *
 * Creates the exact deterministic dataset required by the Cypress spec.
 * Run once before `bun cy:run` (or in CI before the test step).
 *
 * Usage:
 *   bun run seed:e2e             # idempotent — safe to re-run
 *   bun run seed:e2e --reset     # wipe PGlite data then re-seed
 *
 * Guarantees (mirrors docs/specs/cypress-e2e-spec.md §1.4):
 *   sysadmin@tkams.local / Admin1234!         (user.role = "admin")
 *   admin@lycee-bilingue.local / Admin1234!   (org role = admin)
 *   teacher@lycee-bilingue.local / Teacher1234!
 *   Institution  : "Lycée Bilingue de Yaoundé"  slug lycee-bilingue-yaounde
 *   Academic year: 2025-2026 (active)
 *   Track        : "Série D – Sciences"
 *   Subject      : "Mathématiques" coeff 4
 *   Class        : "4ème D"  level "4e"
 *   Student      : "Alima Mbarga" enrolled in 4ème D
 *   Staff        : "M. Nkemdirim" teacher, assigned to Maths in 4ème D
 */

import { randomUUID } from "node:crypto";
import { rmSync } from "node:fs";
import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import { account, member, organization, user } from "./src/db/auth";
import { db, pushSchema } from "./src/db/index";
import {
	academicYears,
	classCouncils,
	classes,
	enrollments,
	institutions,
	reportCards,
	staff,
	students,
	subjectAssignments,
	subjects,
	terms,
	trackSubjectCoefficients,
	tracks,
} from "./src/db/schema";

function log(msg: string) {
	console.log(`  ▸ ${msg}`);
}

async function upsertAccountPassword(
	userId: string,
	email: string,
	password: string,
): Promise<void> {
	const hashed = await hashPassword(password);
	const existing = await db
		.select({ id: account.id })
		.from(account)
		.where(eq(account.userId, userId))
		.limit(1);
	if (existing[0]) {
		await db
			.update(account)
			.set({
				password: hashed,
				providerId: "credential",
				issuer: "credential",
				accountId: userId,
			})
			.where(eq(account.userId, userId));
	} else {
		await db.insert(account).values({
			id: randomUUID(),
			userId,
			accountId: userId,
			providerId: "credential",
			issuer: "credential",
			password: hashed,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
	}
}

// ─── 1. Sysadmin (platform-level admin, user.role = "admin") ─────────────────

async function ensureSysadmin(): Promise<string> {
	const EMAIL = "sysadmin@tkams.local";
	const PASSWORD = "Admin1234!";
	const existing = await db
		.select({ id: user.id })
		.from(user)
		.where(eq(user.email, EMAIL))
		.limit(1);
	if (existing[0]) {
		log(`Sysadmin already exists: ${EMAIL} — refreshing password`);
		await upsertAccountPassword(existing[0].id, EMAIL, PASSWORD);
		return existing[0].id;
	}
	const userId = randomUUID();
	await db.insert(user).values({
		id: userId,
		name: "Système Admin",
		email: EMAIL,
		emailVerified: true,
		role: "admin", // Better-Auth admin plugin role
		createdAt: new Date(),
		updatedAt: new Date(),
	});
	await upsertAccountPassword(userId, EMAIL, PASSWORD);
	log(`Created sysadmin: ${EMAIL}`);
	return userId;
}

// ─── 2. Institution admin ─────────────────────────────────────────────────────

async function ensureInstitutionAdmin(): Promise<string> {
	const EMAIL = "admin@lycee-bilingue.local";
	const PASSWORD = "Admin1234!";
	const existing = await db
		.select({ id: user.id })
		.from(user)
		.where(eq(user.email, EMAIL))
		.limit(1);
	if (existing[0]) {
		log(`Institution admin already exists: ${EMAIL} — refreshing password`);
		await upsertAccountPassword(existing[0].id, EMAIL, PASSWORD);
		return existing[0].id;
	}
	const userId = randomUUID();
	await db.insert(user).values({
		id: userId,
		name: "Admin Lycée",
		email: EMAIL,
		emailVerified: true,
		createdAt: new Date(),
		updatedAt: new Date(),
	});
	await upsertAccountPassword(userId, EMAIL, PASSWORD);
	log(`Created institution admin: ${EMAIL}`);
	return userId;
}

// ─── 3. Teacher user ──────────────────────────────────────────────────────────

async function ensureTeacher(): Promise<string> {
	const EMAIL = "teacher@lycee-bilingue.local";
	const PASSWORD = "Teacher1234!";
	const existing = await db
		.select({ id: user.id })
		.from(user)
		.where(eq(user.email, EMAIL))
		.limit(1);
	if (existing[0]) {
		log(`Teacher already exists: ${EMAIL} — refreshing password`);
		await upsertAccountPassword(existing[0].id, EMAIL, PASSWORD);
		return existing[0].id;
	}
	const userId = randomUUID();
	await db.insert(user).values({
		id: userId,
		name: "M. Nkemdirim",
		email: EMAIL,
		emailVerified: true,
		createdAt: new Date(),
		updatedAt: new Date(),
	});
	await upsertAccountPassword(userId, EMAIL, PASSWORD);
	log(`Created teacher: ${EMAIL}`);
	return userId;
}

// ─── 4. Institution + Better-Auth org ────────────────────────────────────────

async function ensureInstitution(
	adminUserId: string,
	teacherUserId: string,
): Promise<{
	institutionId: string;
	adminStaffId: string;
	teacherStaffId: string;
}> {
	const SLUG = "lycee-bilingue-yaounde";
	const NAME = "Lycée Bilingue de Yaoundé";

	const existingOrg = await db
		.select({ id: organization.id })
		.from(organization)
		.where(eq(organization.slug, SLUG))
		.limit(1);

	if (existingOrg[0]) {
		const institutionId = existingOrg[0].id;
		const adminStaffRow = await db
			.select({ id: staff.id })
			.from(staff)
			.where(eq(staff.authUserId, adminUserId))
			.limit(1);
		const teacherStaffRow = await db
			.select({ id: staff.id })
			.from(staff)
			.where(eq(staff.authUserId, teacherUserId))
			.limit(1);
		log(`Institution already exists (id=${institutionId})`);
		return {
			institutionId,
			adminStaffId: adminStaffRow[0]?.id ?? institutionId,
			teacherStaffId: teacherStaffRow[0]?.id ?? institutionId,
		};
	}

	// Use same UUID for both org and institution (convention in this codebase)
	const orgId = randomUUID();

	await db.insert(organization).values({
		id: orgId,
		name: NAME,
		slug: SLUG,
		createdAt: new Date(),
	});

	await db.insert(institutions).values({
		id: orgId,
		orgId,
		name: NAME,
		city: "Yaoundé",
		type: "lycee",
		assessmentMode: "six_sequence",
		suspended: false,
	});

	// Staff record for institution admin
	const [adminStaff] = await db
		.insert(staff)
		.values({
			institutionId: orgId,
			authUserId: adminUserId,
			firstName: "Admin",
			lastName: "Lycée",
			email: "admin@lycee-bilingue.local",
			role: "admin",
		})
		.returning();

	// Staff record for teacher
	const [teacherStaff] = await db
		.insert(staff)
		.values({
			institutionId: orgId,
			authUserId: teacherUserId,
			firstName: "M.",
			lastName: "Nkemdirim",
			email: "teacher@lycee-bilingue.local",
			role: "teacher",
		})
		.returning();

	// Better-Auth members
	await db.insert(member).values([
		{
			id: randomUUID(),
			organizationId: orgId,
			userId: adminUserId,
			role: "admin",
			createdAt: new Date(),
		},
		{
			id: randomUUID(),
			organizationId: orgId,
			userId: teacherUserId,
			role: "member",
			createdAt: new Date(),
		},
	]);

	log(`Created institution: ${NAME} (id=${orgId})`);
	return {
		institutionId: orgId,
		adminStaffId: adminStaff?.id,
		teacherStaffId: teacherStaff?.id,
	};
}

// ─── 5. Academic year ─────────────────────────────────────────────────────────

async function ensureAcademicYear(institutionId: string): Promise<string> {
	const existing = await db
		.select({ id: academicYears.id })
		.from(academicYears)
		.where(eq(academicYears.institutionId, institutionId))
		.limit(1);
	if (existing[0]) {
		log("Academic year already exists");
		return existing[0].id;
	}
	const [year] = await db
		.insert(academicYears)
		.values({
			institutionId,
			name: "2025-2026",
			startDate: new Date("2025-09-01"),
			endDate: new Date("2026-07-31"),
			status: "active",
			assessmentMode: "six_sequence",
		})
		.returning();
	log("Created academic year: 2025-2026 (active)");
	return year?.id;
}

// ─── 6. Terms ─────────────────────────────────────────────────────────────────

async function ensureTerms(
	institutionId: string,
	academicYearId: string,
): Promise<string[]> {
	const existing = await db
		.select({ id: terms.id })
		.from(terms)
		.where(eq(terms.academicYearId, academicYearId));
	if (existing.length >= 3) {
		log("Terms already exist");
		return existing.map((t) => t.id);
	}
	const TERMS = [
		{ n: 1, start: "2025-09-01", end: "2025-12-20", status: "closed" },
		{ n: 2, start: "2026-01-05", end: "2026-04-10", status: "open" },
		{ n: 3, start: "2026-04-20", end: "2026-07-10", status: "open" },
	] as const;
	const inserted = await db
		.insert(terms)
		.values(
			TERMS.map((t) => ({
				institutionId,
				academicYearId,
				termNumber: t.n,
				startDate: new Date(t.start),
				endDate: new Date(t.end),
				status: t.status,
			})),
		)
		.returning();
	log("Created 3 terms");
	return inserted.map((t) => t.id);
}

// ─── 7. Track ─────────────────────────────────────────────────────────────────

async function ensureTrack(institutionId: string): Promise<string> {
	const existing = await db
		.select({ id: tracks.id })
		.from(tracks)
		.where(eq(tracks.institutionId, institutionId))
		.limit(1);
	if (existing[0]) {
		log("Track already exists");
		return existing[0].id;
	}
	const [track] = await db
		.insert(tracks)
		.values({
			institutionId,
			name: "Série D – Sciences",
			code: "SERIE-D",
			cycleLevel: "first_cycle",
			isOfficial: true,
		})
		.returning();
	log("Created track: Série D – Sciences");
	return track?.id;
}

// ─── 8. Subject ───────────────────────────────────────────────────────────────

async function ensureSubject(institutionId: string): Promise<string> {
	const existing = await db
		.select({ id: subjects.id })
		.from(subjects)
		.where(eq(subjects.institutionId, institutionId))
		.limit(1);
	if (existing[0]) {
		log("Subject already exists");
		return existing[0].id;
	}
	const [subject] = await db
		.insert(subjects)
		.values({
			institutionId,
			name: "Mathematics",
			nameFr: "Mathématiques",
			code: "MATH",
			subjectGroup: "sciences",
		})
		.returning();
	log("Created subject: Mathématiques (coeff 4)");
	return subject?.id;
}

// ─── 9. Class ─────────────────────────────────────────────────────────────────

async function ensureClass(
	institutionId: string,
	academicYearId: string,
	trackId: string,
): Promise<string> {
	const existing = await db
		.select({ id: classes.id })
		.from(classes)
		.where(eq(classes.academicYearId, academicYearId))
		.limit(1);
	if (existing[0]) {
		log("Class already exists");
		return existing[0].id;
	}
	const [cls] = await db
		.insert(classes)
		.values({
			institutionId,
			academicYearId,
			trackId,
			name: "4ème D",
			code: "4EME-D",
			level: "4e",
			maxCapacity: 40,
		})
		.returning();
	log("Created class: 4ème D");
	return cls?.id;
}

// ─── 10. Student + enrollment ─────────────────────────────────────────────────

async function ensureStudent(
	institutionId: string,
	academicYearId: string,
	classId: string,
): Promise<void> {
	const existing = await db
		.select({ id: enrollments.id })
		.from(enrollments)
		.where(eq(enrollments.classId, classId))
		.limit(1);
	if (existing[0]) {
		log("Student + enrollment already exist");
		return;
	}
	const [student] = await db
		.insert(students)
		.values({
			institutionId,
			firstName: "Alima",
			lastName: "Mbarga",
			gender: "F",
			reportCardLanguage: "fr",
		})
		.returning();
	await db.insert(enrollments).values({
		institutionId,
		studentId: student?.id,
		academicYearId,
		classId,
		status: "active",
		admissionType: "new",
	});
	log("Created student: Alima Mbarga + enrollment in 4ème D");
}

// ─── 11. Track coefficient ────────────────────────────────────────────────────

async function ensureTrackCoefficient(
	trackId: string,
	subjectId: string,
): Promise<void> {
	await db
		.insert(trackSubjectCoefficients)
		.values({
			trackId,
			subjectId,
			coefficient: 4,
			isOfficialExamSubject: true,
		})
		.onConflictDoNothing();
	log("Ensured track coefficient: Mathématiques coeff=4 in Série D");
}

// ─── 12. Class council ────────────────────────────────────────────────────────

async function ensureClassCouncil(
	institutionId: string,
	classId: string,
	termId: string,
): Promise<void> {
	await db
		.insert(classCouncils)
		.values({
			institutionId,
			classId,
			termId,
			status: "draft",
		})
		.onConflictDoNothing();
	log("Ensured class council: 4ème D term 1 (draft/pending)");
}

// ─── 13. Subject assignment ───────────────────────────────────────────────────

async function ensureSubjectAssignment(
	institutionId: string,
	academicYearId: string,
	classId: string,
	teacherStaffId: string,
	subjectId: string,
): Promise<void> {
	const existing = await db
		.select({ id: subjectAssignments.id })
		.from(subjectAssignments)
		.where(eq(subjectAssignments.classId, classId))
		.limit(1);
	if (existing[0]) {
		log("Subject assignment already exists");
		return;
	}
	await db.insert(subjectAssignments).values({
		institutionId,
		academicYearId,
		classId,
		subjectId,
		staffId: teacherStaffId,
	});
	log("Assigned M. Nkemdirim → Mathématiques → 4ème D");
}

// ─── 14. Report card ─────────────────────────────────────────────────────────

async function ensureReportCard(
	institutionId: string,
	classId: string,
	termId: string,
	subjectId: string,
): Promise<void> {
	// Find enrollment for Alima Mbarga in 4ème D
	const enrollmentRows = await db
		.select({ id: enrollments.id, studentId: enrollments.studentId })
		.from(enrollments)
		.where(eq(enrollments.classId, classId))
		.limit(1);
	if (!enrollmentRows[0]) {
		log("No enrollment found — skipping report card seed");
		return;
	}
	const { id: enrollmentId, studentId } = enrollmentRows[0];

	// Check if report card already exists
	const existing = await db
		.select({ id: reportCards.id })
		.from(reportCards)
		.where(eq(reportCards.enrollmentId, enrollmentId))
		.limit(1);
	if (existing[0]) {
		log("Report card already exists");
		return;
	}

	const snapshotData = {
		studentId,
		enrollmentId,
		termId,
		generatedAt: new Date().toISOString(),
		subjectAverages: {
			[subjectId]: {
				subjectId,
				subjectName: "Mathematics",
				subjectNameFr: "Mathématiques",
				avg: 14.5,
				assessmentCount: 3,
				coeff: 4,
			},
		},
		overallAverage: 14.5,
		assessmentCount: 3,
		totalCoefficients: 4,
		rank: 1,
		classSize: 1,
		absentSessions: 0,
		mentionCode: "bien",
	};

	await db.insert(reportCards).values({
		institutionId,
		enrollmentId,
		termId,
		status: "generated",
		snapshotData,
		language: "fr",
	});
	log("Created report card for Alima Mbarga (Mathématiques 14.5/20)");
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
	console.log("\n🌱  TKAMS Secondaire — E2E Seed\n");

	if (Bun.argv.includes("--reset")) {
		const dataDir = process.env.PGLITE_DATA_DIR ?? "./data/pglite";
		try {
			rmSync(dataDir, { recursive: true, force: true });
			log(`Wiped PGlite data dir: ${dataDir}`);
		} catch {
			// ignore if not present
		}
	}

	await pushSchema();

	const sysadminId = await ensureSysadmin();
	const adminId = await ensureInstitutionAdmin();
	const teacherId = await ensureTeacher();

	const { institutionId, adminStaffId, teacherStaffId } =
		await ensureInstitution(adminId, teacherId);

	const academicYearId = await ensureAcademicYear(institutionId);
	const termIds = await ensureTerms(institutionId, academicYearId);
	const trackId = await ensureTrack(institutionId);
	const subjectId = await ensureSubject(institutionId);
	const classId = await ensureClass(institutionId, academicYearId, trackId);
	await ensureStudent(institutionId, academicYearId, classId);
	await ensureSubjectAssignment(
		institutionId,
		academicYearId,
		classId,
		teacherStaffId,
		subjectId,
	);
	await ensureTrackCoefficient(trackId, subjectId);
	await ensureClassCouncil(institutionId, classId, termIds[0]!);
	await ensureReportCard(institutionId, classId, termIds[0]!, subjectId);

	console.log(`
✅  E2E Seed complete!

  Sysadmin      : sysadmin@tkams.local / Admin1234!
  Admin          : admin@lycee-bilingue.local / Admin1234!
  Teacher        : teacher@lycee-bilingue.local / Teacher1234!
  Institution    : Lycée Bilingue de Yaoundé
  Academic year  : 2025-2026 (active)
  Track          : Série D – Sciences
  Subject        : Mathématiques
  Class          : 4ème D
  Student        : Alima Mbarga (enrolled)
  Staff          : M. Nkemdirim (teacher, assigned to Maths)

  Unused in this seed (sysadmin id): ${sysadminId}
  Admin staff id : ${adminStaffId}

  Run the app then: bun cy:run
`);
}

main().catch((err) => {
	console.error("❌  E2E Seed failed:", err);
	process.exit(1);
});
