import { describe, expect, it, setDefaultTimeout } from "bun:test";

setDefaultTimeout(60_000);

import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import {
	createDomainUser,
	createStudent,
	makeTestContext,
} from "@/lib/test-utils";
import { appRouter } from "@/routers";
import {
	enrollmentEligibility,
	resultEligibility,
} from "../academic-documents.eligibility";
import * as repo from "../academic-documents.repo";
import { formatDocumentReference } from "../academic-documents.service";

async function adminCaller() {
	const profile = await createDomainUser();
	return {
		profile,
		caller: appRouter.createCaller(
			makeTestContext({
				role: "administrator",
				profileOverrides: { id: profile.id },
			}),
		),
	};
}

async function errorOf(promise: Promise<unknown>) {
	try {
		await promise;
	} catch (err) {
		return err as { code?: string; message: string };
	}
	throw new Error("expected an error");
}

describe("document eligibility rules", () => {
	const row = (
		status: schema.DeliberationStatus,
		decision: schema.DeliberationDecision | null,
	) => ({
		finalDecision: decision,
		autoDecision: decision,
		deliberationId: "d",
		deliberationStatus: status,
		classId: "c",
		academicYearId: "y",
	});

	it("needs a favourable decision of a closed jury for a pass certificate", () => {
		expect(resultEligibility([]).reason).toBe("no_deliberation");
		expect(resultEligibility([row("open", "admitted")]).reason).toBe(
			"deliberation_not_closed",
		);
		expect(resultEligibility([row("closed", "pending")]).reason).toBe(
			"decision_pending",
		);
		expect(resultEligibility([row("signed", "deferred")]).reason).toBe(
			"decision_unfavourable",
		);
		expect(resultEligibility([row("signed", "compensated")]).eligible).toBe(
			true,
		);
	});

	it("needs a validated enrollment for an enrollment certificate", () => {
		const e = (status: schema.EnrollmentStatus) => ({
			classId: "c",
			academicYearId: "y",
			status,
		});
		expect(enrollmentEligibility([], "c").reason).toBe("not_enrolled");
		expect(enrollmentEligibility([e("pending")], "c").reason).toBe(
			"enrollment_pending",
		);
		expect(enrollmentEligibility([e("withdrawn")], "c").reason).toBe(
			"enrollment_withdrawn",
		);
		expect(enrollmentEligibility([e("completed")], "c").eligible).toBe(true);
	});
});

describe("official documents", () => {
	it("renders an enrollment certificate with the institution and the student", async () => {
		const { caller } = await adminCaller();
		const student = await createStudent({
			profile: { firstName: "Awa", lastName: "Nkolo" },
		});
		await db
			.update(schema.institutions)
			.set({
				contactPhone: "+237 600 00 00 00",
				sloganFr: "Savoir et servir",
				metadata: {
					document_params: {
						signatoryName: "Dr Jean Ekane",
						signatoryTitle: "Directeur Général",
						city: "Douala",
					},
				},
			})
			.where(eq(schema.institutions.id, student.institutionId));

		const { html } = await caller.academicDocuments.preview({
			kind: "enrollment_certificate",
			studentId: student.id,
		});
		expect(html).toContain("CERTIFICAT DE SCOLARITÉ");
		expect(html).toContain("NKOLO");
		expect(html).toContain(student.registrationNumber);
		expect(html).toContain("+237 600 00 00 00");
		expect(html).toContain("Savoir et servir");
		expect(html).toContain("Dr Jean Ekane");
		expect(html).toContain("Fait à Douala");
		// A preview never consumes a register number.
		expect(html).toContain("XXXX/");
	});

	it("refuses a pass certificate without a favourable decision of a closed jury", async () => {
		const { caller, profile } = await adminCaller();
		const student = await createStudent();
		const klass = await db.query.classes.findFirst({
			where: eq(schema.classes.id, student.class),
		});
		if (!klass) throw new Error("class missing");

		const noJury = await errorOf(
			caller.academicDocuments.preview({
				kind: "attestation",
				studentId: student.id,
			}),
		);
		expect(noJury.message).toBe("DOCUMENT_NOT_ELIGIBLE:no_deliberation");

		const [delib] = await db
			.insert(schema.deliberations)
			.values({
				institutionId: student.institutionId,
				classId: klass.id,
				academicYearId: klass.academicYear,
				type: "annual",
				status: "closed",
				juryNumber: "J-042",
				createdBy: profile.id,
			})
			.returning();
		const [result] = await db
			.insert(schema.deliberationStudentResults)
			.values({
				deliberationId: delib.id,
				studentId: student.id,
				totalCreditsEarned: 0,
				totalCreditsPossible: 60,
				autoDecision: "pending",
				finalDecision: "pending",
			})
			.returning();

		const pending = await errorOf(
			caller.academicDocuments.preview({
				kind: "attestation",
				studentId: student.id,
			}),
		);
		expect(pending.message).toBe("DOCUMENT_NOT_ELIGIBLE:decision_pending");

		const roster = await caller.academicDocuments.classRoster({
			kind: "attestation",
			classId: klass.id,
		});
		expect(roster.find((r) => r.studentId === student.id)?.reason).toBe(
			"decision_pending",
		);

		await db
			.update(schema.deliberationStudentResults)
			.set({ finalDecision: "admitted", totalCreditsEarned: 60 })
			.where(eq(schema.deliberationStudentResults.id, result.id));

		const { html } = await caller.academicDocuments.preview({
			kind: "attestation",
			studentId: student.id,
		});
		expect(html).toContain("J-042");
		const rosterAfter = await caller.academicDocuments.classRoster({
			kind: "attestation",
			classId: klass.id,
		});
		expect(rosterAfter.find((r) => r.studentId === student.id)?.eligible).toBe(
			true,
		);
	});

	it("gives every issued document its own reference number", async () => {
		const student = await createStudent();
		const issue = () =>
			repo.registerIssuedDocument({
				institutionId: student.institutionId,
				studentId: student.id,
				kind: "enrollment_certificate",
				formatReference: (seq, year) =>
					formatDocumentReference("enrollment_certificate", "INS", seq, year),
			});
		const first = await issue();
		const second = await issue();
		expect(second.sequence).toBe(first.sequence + 1);
		expect(second.referenceNumber).not.toBe(first.referenceNumber);
		expect(first.referenceNumber).toMatch(/^\d{4}\/\d{4}\/INS\/SCOL$/);
	});
});
