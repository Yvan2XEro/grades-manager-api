import { describe, expect, it, setDefaultTimeout } from "bun:test";

setDefaultTimeout(60_000);

import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import {
	createAcademicYear,
	createClass,
	createDomainUser,
	createStudent,
	makeTestContext,
} from "@/lib/test-utils";
import { appRouter } from "@/routers";

/**
 * Build an admin context whose profile.id exists in domain_users.
 * Deliberation tables have FK constraints on createdBy, so we need a real profile.
 */
async function adminWithRealProfile() {
	const profile = await createDomainUser();
	return makeTestContext({
		role: "administrator",
		profileOverrides: { id: profile.id },
	});
}

/**
 * Minimal fixture: class + student + deliberation (draft).
 * Does NOT compute grades — we insert results directly to test visibility only.
 */
async function setupFixture() {
	const academicYear = await createAcademicYear({
		name: "2023-2024",
		startDate: "2023-09-01",
		endDate: "2024-07-31",
	});
	const klass = await createClass({ academicYear: academicYear.id });
	const student = await createStudent({ class: klass.id });

	return { academicYear, klass, student };
}

describe("workflows — myDecisions publication model (JVL-7)", () => {
	it("student cannot see results when deliberation is open (not closed)", async () => {
		const { academicYear, klass, student } = await setupFixture();
		const adminCtx = await adminWithRealProfile();
		const admin = appRouter.createCaller(adminCtx);

		// Create deliberation (starts as draft)
		const delib = await admin.deliberations.create({
			classId: klass.id,
			academicYearId: academicYear.id,
			type: "annual",
		});

		// Transition to open
		await admin.deliberations.transition({ id: delib.id, action: "open" });

		// Insert a student result directly (bypasses compute, tests visibility filter)
		await db.insert(schema.deliberationStudentResults).values({
			deliberationId: delib.id,
			studentId: student.id,
			finalDecision: "admitted",
			autoDecision: "admitted",
			totalCreditsEarned: 30,
			totalCreditsPossible: 30,
			generalAverage: 14.5,
		});

		// Student calls myDecisions — deliberation is open (closedAt = null), so hidden
		const studentCtx = makeTestContext({
			role: "student",
			profileOverrides: { id: student.domainUserId! },
		});
		const studentCaller = appRouter.createCaller(studentCtx);

		const decisions = await studentCaller.workflows.myDecisions();
		expect(decisions).toHaveLength(0);
	});

	it("student CAN see results after deliberation is closed", async () => {
		const { academicYear, klass, student } = await setupFixture();
		const adminCtx = await adminWithRealProfile();
		const admin = appRouter.createCaller(adminCtx);

		const delib = await admin.deliberations.create({
			classId: klass.id,
			academicYearId: academicYear.id,
			type: "annual",
		});
		await admin.deliberations.transition({ id: delib.id, action: "open" });

		await db.insert(schema.deliberationStudentResults).values({
			deliberationId: delib.id,
			studentId: student.id,
			finalDecision: "admitted",
			autoDecision: "admitted",
			totalCreditsEarned: 30,
			totalCreditsPossible: 30,
			generalAverage: 14.5,
		});

		// Close the deliberation → closedAt is set
		await admin.deliberations.transition({ id: delib.id, action: "close" });

		const studentCtx = makeTestContext({
			role: "student",
			profileOverrides: { id: student.domainUserId! },
		});
		const studentCaller = appRouter.createCaller(studentCtx);

		const decisions = await studentCaller.workflows.myDecisions();
		expect(decisions).toHaveLength(1);
		expect(decisions[0].finalDecision).toBe("admitted");
		expect(decisions[0].generalAverage).toBeCloseTo(14.5);
		expect(decisions[0].closedAt).toBeDefined();
	});

	it("student CANNOT see results after deliberation is reopened", async () => {
		const { academicYear, klass, student } = await setupFixture();
		const adminCtx = await adminWithRealProfile();
		const admin = appRouter.createCaller(adminCtx);

		const delib = await admin.deliberations.create({
			classId: klass.id,
			academicYearId: academicYear.id,
			type: "annual",
		});
		await admin.deliberations.transition({ id: delib.id, action: "open" });

		await db.insert(schema.deliberationStudentResults).values({
			deliberationId: delib.id,
			studentId: student.id,
			finalDecision: "admitted",
			autoDecision: "admitted",
			totalCreditsEarned: 30,
			totalCreditsPossible: 30,
			generalAverage: 14.5,
		});

		// Close → results visible
		await admin.deliberations.transition({ id: delib.id, action: "close" });

		// Reopen → closedAt = null → results hidden again
		await admin.deliberations.transition({ id: delib.id, action: "reopen" });

		const studentCtx = makeTestContext({
			role: "student",
			profileOverrides: { id: student.domainUserId! },
		});
		const studentCaller = appRouter.createCaller(studentCtx);

		const decisions = await studentCaller.workflows.myDecisions();
		expect(decisions).toHaveLength(0);
	});

	it("student with no enrolled class returns empty decisions", async () => {
		// A domain user with no linked student record
		const orphanProfile = await createDomainUser();
		const studentCtx = makeTestContext({
			role: "student",
			profileOverrides: { id: orphanProfile.id },
		});
		const studentCaller = appRouter.createCaller(studentCtx);

		const decisions = await studentCaller.workflows.myDecisions();
		expect(decisions).toHaveLength(0);
	});
});
