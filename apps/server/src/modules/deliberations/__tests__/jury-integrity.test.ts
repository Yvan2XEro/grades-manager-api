import {
	afterAll,
	beforeAll,
	describe,
	expect,
	it,
	setDefaultTimeout,
} from "bun:test";

setDefaultTimeout(120_000);

import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import {
	createAcademicYear,
	createClass,
	createClassCourse,
	createCourse,
	createCycleLevel,
	createDomainUser,
	createProgram,
	createStudent,
	createStudyCycle,
	createTeachingUnit,
	ensureStudentCourseEnrollment,
	makeTestContext,
} from "@/lib/test-utils";
import { checkDocumentEligibility } from "../../academic-documents/academic-documents.eligibility";
import {
	adminContext,
	caller,
	enrollmentsOf,
} from "../../academic-year-transitions/__tests__/journey-helpers";
import { juryHistoryBefore } from "../deliberation-facts";
import { getStudentYearResults } from "../student-year-results";

/*
 * What happens to the marks once a jury has deliberated, through the public
 * procedures: frozen marks under a closed/signed jury, irreversible exam
 * locking, the audited correction path (super admin reopens the jury, then
 * corrects the mark), the audit trail; then the retake session (annual jury
 * → retake exams → retake jury → promotion and documents) and semester
 * juries feeding the annual one.
 */

async function superAdminContext() {
	const profile = await createDomainUser();
	return makeTestContext({
		role: "super_admin",
		profileOverrides: { id: profile.id },
	});
}

let seq = 0;
/** A CC (40%) and a final exam (60%) with marks; returns both exams. */
async function examsWithMarks(
	classCourseId: string,
	institutionId: string,
	scores: Array<{ studentId: string; cc: number; ex: number }>,
) {
	const [cc, ex] = await db
		.insert(schema.exams)
		.values(
			(["CC", "EXAMEN"] as const).map((type) => ({
				name: `${type}-integrity-${++seq}`,
				type,
				date: new Date(),
				percentage: type === "CC" ? "40" : "60",
				classCourse: classCourseId,
				status: "approved" as const,
				isLocked: false,
				scheduledAt: new Date(),
				validatedAt: new Date(),
				institutionId,
			})),
		)
		.returning();
	if (scores.length > 0) {
		await db.insert(schema.grades).values(
			scores.flatMap((s) => [
				{ student: s.studentId, exam: cc.id, score: s.cc.toString() },
				{ student: s.studentId, exam: ex.id, score: s.ex.toString() },
			]),
		);
	}
	for (const s of scores) {
		await ensureStudentCourseEnrollment(s.studentId, classCourseId);
	}
	return { cc, ex };
}

/** One UE with one course in the class (optionally for one semester). */
async function ueCourse(
	programId: string,
	classId: string,
	credits: number,
	semesterId?: string,
) {
	const ue = await createTeachingUnit({ programId, credits });
	const course = await createCourse({
		program: programId,
		teachingUnitId: ue.id,
	});
	return createClassCourse({
		class: classId,
		course: course.id,
		coefficient: "1",
		...(semesterId ? { semesterId } : {}),
	});
}

async function twoLevelCycle(institutionId: string) {
	const cycle = await createStudyCycle({ institutionId });
	const l1 = await createCycleLevel({
		cycleId: cycle.id,
		orderIndex: 1,
		code: "L1",
	});
	const l2 = await createCycleLevel({
		cycleId: cycle.id,
		orderIndex: 2,
		code: "L2",
	});
	const program = await createProgram({ institutionId, cycleId: cycle.id });
	const startYear = 2200 + Math.floor(Math.random() * 700);
	const yearA = await createAcademicYear({
		institutionId,
		name: `${startYear}-${startYear + 1}`,
		startDate: `${startYear}-09-01`,
		endDate: `${startYear + 1}-06-30`,
	});
	const l1A = await createClass({
		program: program.id,
		academicYear: yearA.id,
		cycleLevelId: l1.id,
	});
	return { cycle, l1, l2, program, yearA, l1A };
}

async function jury(
	api: ReturnType<typeof caller>,
	input: {
		classId: string;
		academicYearId: string;
		type: "annual" | "retake" | "semester";
		semesterId?: string;
	},
) {
	const created = await api.deliberations.create(input);
	await api.deliberations.transition({ id: created.id, action: "open" });
	const computed = await api.deliberations.compute({ id: created.id });
	return { id: created.id, computed };
}

const resultOf = (
	computed: { results: Array<{ studentId: string }> },
	studentId: string,
) =>
	computed.results.find((r) => r.studentId === studentId) as
		| (Record<string, unknown> & {
				studentId: string;
				autoDecision: string;
				generalAverage: number | null;
				ueResults: Array<{
					ueId: string;
					ueAverage: number | null;
					courseResults: Array<{ exIsRetake: boolean; ex: number | null }>;
				}>;
		  })
		| undefined;

describe("marks after the jury", () => {
	it("freezes the marks of a closed jury, keeps locking irreversible and audits corrections", async () => {
		const admin = await adminContext();
		const superAdmin = await superAdminContext();
		const api = caller(admin);
		const root = caller(superAdmin);
		const institutionId = admin.institution.id;
		const { program, yearA, l1A } = await twoLevelCycle(institutionId);
		const ue1 = await ueCourse(program.id, l1A.id, 6);
		const ue2 = await ueCourse(program.id, l1A.id, 4);
		const alice = await createStudent({ class: l1A.id });
		const bob = await createStudent({ class: l1A.id });
		const e1 = await examsWithMarks(ue1.id, institutionId, [
			{ studentId: alice.id, cc: 14, ex: 14 },
			{ studentId: bob.id, cc: 12, ex: 12 },
		]);
		const e2 = await examsWithMarks(ue2.id, institutionId, [
			{ studentId: alice.id, cc: 13, ex: 13 },
			{ studentId: bob.id, cc: 9, ex: 9 },
		]);
		// A draft exam still being prepared in UE 1
		const [draft] = await db
			.insert(schema.exams)
			.values({
				name: `TP-integrity-${++seq}`,
				type: "TP",
				date: new Date(),
				percentage: "0",
				classCourse: ue1.id,
				status: "draft",
				institutionId,
			})
			.returning();

		// --- Audit trail of an ordinary edit (before the jury) --------------
		await api.grades.upsertNote({
			studentId: bob.id,
			examId: e2.ex.id,
			score: 8,
		});
		const [log] = await db.query.gradeEditLogs.findMany({
			where: and(
				eq(schema.gradeEditLogs.examId, e2.ex.id),
				eq(schema.gradeEditLogs.studentId, bob.id),
			),
		});
		expect(log).toMatchObject({
			action: "write",
			actorProfileId: admin.profile!.id,
			scoreBefore: "9.00",
			scoreAfter: "8.00",
		});
		// A session whose profile has no row (system/legacy) is still audited
		const ghost = caller(makeTestContext({ role: "administrator" }));
		await ghost.grades.upsertNote({
			studentId: bob.id,
			examId: e2.ex.id,
			score: 9,
		});
		const ghostLogs = await db.query.gradeEditLogs.findMany({
			where: eq(schema.gradeEditLogs.examId, e2.ex.id),
		});
		expect(ghostLogs).toHaveLength(2);
		const ghostLog = ghostLogs.find((l) => l.actorProfileId === null);
		expect(ghostLog?.scoreBefore).toBe("8.00");
		expect(ghostLog?.metadata).toHaveProperty("unresolvedActorId");

		// --- The annual jury deliberates and closes -------------------------
		const annual = await jury(api, {
			classId: l1A.id,
			academicYearId: yearA.id,
			type: "annual",
		});
		const bobAverage = resultOf(annual.computed, bob.id)?.generalAverage;
		// (12×6 + 9×4) / 10
		expect(bobAverage).toBeCloseTo(10.8, 5);
		await api.deliberations.transition({ id: annual.id, action: "close" });

		// No mark of the jury can change through any entry path
		const juryClosed = { code: "PRECONDITION_FAILED" };
		await expect(
			api.grades.upsertNote({ studentId: bob.id, examId: e2.ex.id, score: 15 }),
		).rejects.toMatchObject(juryClosed);
		const bobMark = await db.query.grades.findFirst({
			where: and(
				eq(schema.grades.student, bob.id),
				eq(schema.grades.exam, e2.ex.id),
			),
		});
		await expect(
			api.grades.updateNote({ id: bobMark!.id, score: 15 }),
		).rejects.toMatchObject(juryClosed);
		await expect(
			api.grades.deleteNote({ id: bobMark!.id }),
		).rejects.toMatchObject(juryClosed);
		await expect(
			api.grades.importCsv({
				examId: e2.ex.id,
				csv: `registrationNumber,score\n${bob.registrationNumber},15`,
			}),
		).rejects.toMatchObject(juryClosed);
		// ...nor the weight or existence of an exam of the deliberated courses
		await expect(
			api.exams.update({ id: draft.id, percentage: 10 }),
		).rejects.toMatchObject(juryClosed);
		await expect(api.exams.delete({ id: draft.id })).rejects.toMatchObject(
			juryClosed,
		);
		expect(
			(
				await db.query.grades.findFirst({
					where: eq(schema.grades.id, bobMark!.id),
				})
			)?.score,
		).toBe("9.00");

		// --- Locking is irreversible ----------------------------------------
		await api.exams.lock({ examId: e2.ex.id, lock: true });
		await expect(
			api.exams.lock({ examId: e2.ex.id, lock: false }),
		).rejects.toMatchObject({ code: "FORBIDDEN" });

		// --- The jury signs; its figures are the official ones --------------
		await api.deliberations.transition({ id: annual.id, action: "sign" });
		const signedFigures = await getStudentYearResults(institutionId, bob.id, {
			academicYearId: yearA.id,
		});
		expect(signedFigures).toMatchObject({
			source: "jury",
			jury: { id: annual.id, status: "signed" },
		});
		expect(signedFigures?.generalAverage).toBeCloseTo(10.8, 5);

		// A mark changed behind the jury's back (legacy data, direct DB
		// write): the documents keep the signed figures and the jury says
		// its results are outdated.
		await db
			.update(schema.grades)
			.set({ score: "9.50", updatedAt: new Date(Date.now() + 1000) })
			.where(eq(schema.grades.id, bobMark!.id));
		const afterDrift = await getStudentYearResults(institutionId, bob.id, {
			academicYearId: yearA.id,
		});
		expect(afterDrift?.generalAverage).toBeCloseTo(10.8, 5);
		const drifted = await api.deliberations.getById({ id: annual.id });
		expect(drifted.staleness).toMatchObject({ isOutdated: true });
		await db
			.update(schema.grades)
			.set({ score: "9.00" })
			.where(eq(schema.grades.id, bobMark!.id));

		// --- Correcting a mark after signing: the explicit, audited path ----
		// Only a super admin can correct a locked exam, never under a closed jury
		await expect(
			api.grades.correctLocked({
				examId: e2.ex.id,
				studentId: bob.id,
				score: 11,
				reason: "Transcription error on the exam sheet",
			}),
		).rejects.toMatchObject({ code: "FORBIDDEN" });
		await expect(
			root.grades.correctLocked({
				examId: e2.ex.id,
				studentId: bob.id,
				score: 11,
				reason: "Transcription error on the exam sheet",
			}),
		).rejects.toMatchObject(juryClosed);
		// The signed jury is reopened by a super admin, with a reason
		await expect(
			api.deliberations.transition({
				id: annual.id,
				action: "reopen",
				reason: "Mark to correct",
			}),
		).rejects.toMatchObject({ code: "FORBIDDEN" });
		await expect(
			root.deliberations.transition({ id: annual.id, action: "reopen" }),
		).rejects.toMatchObject({ code: "BAD_REQUEST" });
		const reopened = await root.deliberations.transition({
			id: annual.id,
			action: "reopen",
			reason: "Transcription error on Bob's UE 2 exam sheet",
		});
		expect(reopened).toMatchObject({
			status: "open",
			signedAt: null,
			signedBy: null,
		});
		const reopenLog = await db.query.deliberationLogs.findFirst({
			where: and(
				eq(schema.deliberationLogs.deliberationId, annual.id),
				eq(schema.deliberationLogs.action, "reopened"),
			),
		});
		expect(reopenLog?.details).toMatchObject({
			fromStatus: "signed",
			reason: "Transcription error on Bob's UE 2 exam sheet",
		});
		// The locked exam still refuses ordinary entry...
		await expect(
			api.grades.upsertNote({ studentId: bob.id, examId: e2.ex.id, score: 11 }),
		).rejects.toMatchObject({ code: "FORBIDDEN" });
		// ...the super admin corrects it, with a reason kept in the audit trail
		await root.grades.correctLocked({
			examId: e2.ex.id,
			studentId: bob.id,
			score: 11,
			reason: "Transcription error on the exam sheet",
		});
		const audit = await api.grades.editLogs({ examId: e2.ex.id });
		expect(audit[0]).toMatchObject({
			action: "correction",
			studentId: bob.id,
			scoreBefore: "9.00",
			scoreAfter: "11.00",
			actorProfileId: superAdmin.profile!.id,
			metadata: { reason: "Transcription error on the exam sheet" },
		});

		// The jury now says its results are outdated and cannot be closed as is
		const outdated = await api.deliberations.getById({ id: annual.id });
		expect(outdated.staleness).toMatchObject({
			isOutdated: true,
			changedMarks: 1,
		});
		await expect(
			api.deliberations.transition({ id: annual.id, action: "close" }),
		).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
		// While the jury is reopened there are no official figures: the
		// transcript shows the live marks
		const meanwhile = await getStudentYearResults(institutionId, bob.id, {
			academicYearId: yearA.id,
		});
		expect(meanwhile?.source).toBe("live");

		const recomputed = await api.deliberations.compute({ id: annual.id });
		// (12×6 + (0.4×9 + 0.6×11)×4) / 10 = (72 + 10.2×4) / 10
		expect(resultOf(recomputed, bob.id)?.generalAverage).toBeCloseTo(11.28, 5);
		expect(
			(await api.deliberations.getById({ id: annual.id })).staleness,
		).toMatchObject({ isOutdated: false });
		await api.deliberations.transition({ id: annual.id, action: "close" });
		await api.deliberations.transition({ id: annual.id, action: "sign" });
		const corrected = await getStudentYearResults(institutionId, bob.id, {
			academicYearId: yearA.id,
		});
		expect(corrected?.source).toBe("jury");
		expect(corrected?.generalAverage).toBeCloseTo(11.28, 5);

		// The PV reads the jury's stored figures too
		const pv = await api.deliberations.exportDiplomation({ id: annual.id });
		expect(
			pv.students.find((s) => s.registrationNumber === bob.registrationNumber)
				?.generalAverage,
		).toBeCloseTo(11.28, 5);
		void e1;
	});
});

describe("retake session", () => {
	const originalFlag = process.env.RETAKES_FEATURE_FLAG;
	beforeAll(() => {
		process.env.RETAKES_FEATURE_FLAG = "true";
	});
	afterAll(() => {
		process.env.RETAKES_FEATURE_FLAG = originalFlag;
	});

	it("annual jury → retake exams → retake jury → promotion, documents and history", async () => {
		const admin = await adminContext();
		const api = caller(admin);
		const institutionId = admin.institution.id;
		const { program, yearA, l1A, l2 } = await twoLevelCycle(institutionId);
		const ue1 = await ueCourse(program.id, l1A.id, 6);
		const ue2 = await ueCourse(program.id, l1A.id, 4);

		const admitted = await createStudent({ class: l1A.id });
		const rescued = await createStudent({ class: l1A.id });
		const failing = await createStudent({ class: l1A.id });
		await examsWithMarks(ue1.id, institutionId, [
			{ studentId: admitted.id, cc: 14, ex: 14 },
			{ studentId: rescued.id, cc: 12, ex: 12 },
			{ studentId: failing.id, cc: 4, ex: 4 },
		]);
		const ue2Exams = await examsWithMarks(ue2.id, institutionId, [
			{ studentId: admitted.id, cc: 13, ex: 13 },
			{ studentId: rescued.id, cc: 5, ex: 5 },
			{ studentId: failing.id, cc: 4, ex: 4 },
		]);

		// The retake jury follows a closed annual jury
		await expect(
			api.deliberations.create({
				classId: l1A.id,
				academicYearId: yearA.id,
				type: "retake",
			}),
		).rejects.toMatchObject({ code: "BAD_REQUEST" });
		// ...and covers the whole year, like the annual one
		await expect(
			api.deliberations.create({
				classId: l1A.id,
				academicYearId: yearA.id,
				type: "annual",
				semesterId: l1A.semesterId!,
			}),
		).rejects.toMatchObject({ code: "BAD_REQUEST" });

		// --- 1. Annual jury -------------------------------------------------
		const annual = await jury(api, {
			classId: l1A.id,
			academicYearId: yearA.id,
			type: "annual",
		});
		expect(resultOf(annual.computed, admitted.id)?.autoDecision).toBe(
			"admitted",
		);
		// (12×6 + 5×4) / 10 = 9.2: UE 2 failed, not compensable
		expect(resultOf(annual.computed, rescued.id)?.autoDecision).toBe(
			"deferred",
		);
		expect(resultOf(annual.computed, failing.id)?.autoDecision).toBe(
			"deferred",
		);
		await api.deliberations.transition({ id: annual.id, action: "close" });
		await api.deliberations.transition({ id: annual.id, action: "sign" });

		// --- 2. Retake exam of UE 2 (replace policy) ------------------------
		const retakeExam = await api.exams.createRetake({
			parentExamId: ue2Exams.ex.id,
			date: new Date(),
			scoringPolicy: "replace",
		});
		await ensureStudentCourseEnrollment(rescued.id, ue2.id);
		// Retake marks are entered after the annual jury signed: they do not
		// feed it. The normal session's marks stay frozen.
		await api.grades.upsertNote({
			studentId: rescued.id,
			examId: retakeExam.id,
			score: 16,
		});
		await expect(
			api.grades.upsertNote({
				studentId: rescued.id,
				examId: ue2Exams.ex.id,
				score: 16,
			}),
		).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });

		// --- 3. Retake jury -------------------------------------------------
		const retake = await jury(api, {
			classId: l1A.id,
			academicYearId: yearA.id,
			type: "retake",
		});
		// Only the students the annual jury did not admit are deliberated
		expect(retake.computed.results.map((r) => r.studentId).sort()).toEqual(
			[rescued.id, failing.id].sort(),
		);
		const rescuedResult = resultOf(retake.computed, rescued.id);
		expect(rescuedResult?.autoDecision).toBe("admitted");
		// UE 2 course: 0.4×5 + 0.6×16 = 11.6 → (12×6 + 11.6×4) / 10
		expect(rescuedResult?.generalAverage).toBeCloseTo(11.84, 5);
		const ue2Result = rescuedResult?.ueResults.find(
			(ue) => ue.courseResults[0]?.exIsRetake,
		);
		expect(ue2Result?.courseResults[0]).toMatchObject({
			ex: 16,
			exIsRetake: true,
		});
		// UE 1 was not retaken: original marks
		expect(
			rescuedResult?.ueResults.filter((ue) => ue.courseResults[0]?.exIsRetake),
		).toHaveLength(1);
		expect(resultOf(retake.computed, failing.id)?.autoDecision).toBe(
			"deferred",
		);
		await api.deliberations.transition({ id: retake.id, action: "close" });
		await api.deliberations.transition({ id: retake.id, action: "sign" });
		// The retake jury signed: retake marks are frozen too
		await expect(
			api.grades.upsertNote({
				studentId: rescued.id,
				examId: retakeExam.id,
				score: 18,
			}),
		).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });

		// --- 4. Promotion ---------------------------------------------------
		const yearB = await api.academicYears.createNextYear({
			sourceYearId: yearA.id,
		});
		const { klass: l2B } = await api.classes.createPromotionTarget({
			sourceClassId: l1A.id,
			targetAcademicYearId: yearB.id,
		});
		expect(l2B.cycleLevelId).toBe(l2.id);
		const l1B = await createClass({
			program: program.id,
			academicYear: yearB.id,
			cycleLevelId: l1A.cycleLevelId,
			programOptionId: l1A.programOptionId,
		});
		// The annual jury promotes its admitted student; the deferred ones
		// wait for the retake jury instead of being made to repeat.
		const fromAnnual = await api.deliberations.promoteAdmitted({
			deliberationId: annual.id,
			targetClassId: l2B.id,
			repeatClassId: l1B.id,
		});
		expect(fromAnnual).toMatchObject({
			promotedCount: 1,
			repeatCount: 0,
			awaitingRetakeCount: 2,
		});
		expect(await enrollmentsOf(rescued.id)).toHaveLength(1);
		// The retake jury promotes the rescued student, the other repeats
		const fromRetake = await api.deliberations.promoteAdmitted({
			deliberationId: retake.id,
			targetClassId: l2B.id,
			repeatClassId: l1B.id,
		});
		expect(fromRetake).toMatchObject({ promotedCount: 1, repeatCount: 1 });
		const rescuedB = (await enrollmentsOf(rescued.id)).find(
			(e) => e.academicYearId === yearB.id,
		);
		expect(rescuedB?.classId).toBe(l2B.id);
		const failingB = (await enrollmentsOf(failing.id)).find(
			(e) => e.academicYearId === yearB.id,
		);
		expect(failingB?.classId).toBe(l1B.id);

		// --- 5. Documents ---------------------------------------------------
		// The transcript of year A shows the retake figures for a retaken
		// student, the annual ones for the others.
		const rescuedTranscript = await getStudentYearResults(
			institutionId,
			rescued.id,
			{ academicYearId: yearA.id },
		);
		expect(rescuedTranscript).toMatchObject({
			source: "jury",
			jury: { id: retake.id, type: "retake" },
			decision: "admitted",
		});
		expect(rescuedTranscript?.generalAverage).toBeCloseTo(11.84, 5);
		expect(
			rescuedTranscript?.ueResults.some((ue) =>
				ue.courseResults.some((c) => c.exIsRetake),
			),
		).toBe(true);
		const admittedTranscript = await getStudentYearResults(
			institutionId,
			admitted.id,
			{ academicYearId: yearA.id },
		);
		expect(admittedTranscript?.jury?.id).toBe(annual.id);

		// The pass certificate follows the retake decision
		const rescuedAttestation = await checkDocumentEligibility(
			institutionId,
			"attestation",
			rescued.id,
		);
		expect(rescuedAttestation).toMatchObject({
			eligible: true,
			deliberationId: retake.id,
		});
		const failingAttestation = await checkDocumentEligibility(
			institutionId,
			"attestation",
			failing.id,
		);
		expect(failingAttestation).toMatchObject({
			eligible: false,
			reason: "decision_unfavourable",
			deliberationId: retake.id,
		});

		// --- 6. Jury history: the retake is the year's final decision -------
		const history = await juryHistoryBefore(
			[rescued.id, failing.id],
			yearB.id,
			institutionId,
		);
		expect(history.get(rescued.id)).toMatchObject({
			previousDeliberationDecision: "admitted",
			consecutiveRepeats: 0,
		});
		expect(history.get(failing.id)).toMatchObject({
			previousDeliberationDecision: "deferred",
			consecutiveRepeats: 1,
		});
	});
});

describe("semester juries", () => {
	it("S1 and S2 juries, then the annual jury combining both", async () => {
		const admin = await adminContext();
		const api = caller(admin);
		const institutionId = admin.institution.id;
		const { program, yearA, l1A } = await twoLevelCycle(institutionId);
		const [s1, s2] = await db
			.insert(schema.semesters)
			.values([
				{
					code: `S1-${randomUUID().slice(0, 8)}`,
					name: "Semestre 1",
					orderIndex: 101,
				},
				{
					code: `S2-${randomUUID().slice(0, 8)}`,
					name: "Semestre 2",
					orderIndex: 102,
				},
			])
			.returning();
		const ueS1 = await ueCourse(program.id, l1A.id, 6, s1.id);
		const ueS2 = await ueCourse(program.id, l1A.id, 4, s2.id);
		const student = await createStudent({ class: l1A.id });
		await examsWithMarks(ueS1.id, institutionId, [
			{ studentId: student.id, cc: 14, ex: 14 },
		]);
		const s2Exams = await examsWithMarks(ueS2.id, institutionId, [
			{ studentId: student.id, cc: 9, ex: 9 },
		]);

		// A semester jury needs a semester ("all semesters" is no semester)
		await expect(
			api.deliberations.create({
				classId: l1A.id,
				academicYearId: yearA.id,
				type: "semester",
			}),
		).rejects.toMatchObject({ code: "BAD_REQUEST" });

		const juryS1 = await jury(api, {
			classId: l1A.id,
			academicYearId: yearA.id,
			type: "semester",
			semesterId: s1.id,
		});
		const s1Result = resultOf(juryS1.computed, student.id);
		expect(s1Result?.ueResults).toHaveLength(1);
		expect(s1Result?.generalAverage).toBeCloseTo(14, 5);
		await api.deliberations.transition({ id: juryS1.id, action: "close" });

		// The S1 jury froze S1 marks only
		await expect(
			api.grades.upsertNote({
				studentId: student.id,
				examId: s2Exams.cc.id,
				score: 10,
			}),
		).resolves.toBeDefined();

		const juryS2 = await jury(api, {
			classId: l1A.id,
			academicYearId: yearA.id,
			type: "semester",
			semesterId: s2.id,
		});
		const s2Result = resultOf(juryS2.computed, student.id);
		expect(s2Result?.ueResults).toHaveLength(1);
		// 0.4×10 + 0.6×9 = 9.4
		expect(s2Result?.generalAverage).toBeCloseTo(9.4, 5);
		await api.deliberations.transition({ id: juryS2.id, action: "close" });

		// A semester jury does not promote
		await expect(
			api.deliberations.promoteAdmitted({ deliberationId: juryS1.id }),
		).rejects.toMatchObject({ code: "BAD_REQUEST" });

		// The annual jury combines both semesters: (14×6 + 9.4×4) / 10
		const annual = await jury(api, {
			classId: l1A.id,
			academicYearId: yearA.id,
			type: "annual",
		});
		const annualResult = resultOf(annual.computed, student.id);
		expect(annualResult?.ueResults).toHaveLength(2);
		expect(annualResult?.generalAverage).toBeCloseTo(12.16, 5);
		// LMD compensation: UE of S2 compensated by the annual average
		expect(annualResult?.autoDecision).toBe("admitted");
		await api.deliberations.transition({ id: annual.id, action: "close" });

		// The semester transcript reads the semester jury, the annual one
		// the annual jury.
		const s1Transcript = await getStudentYearResults(
			institutionId,
			student.id,
			{
				academicYearId: yearA.id,
				semesterId: s1.id,
			},
		);
		expect(s1Transcript).toMatchObject({
			scope: "semester",
			source: "jury",
			jury: { id: juryS1.id, type: "semester" },
		});
		const yearTranscript = await getStudentYearResults(
			institutionId,
			student.id,
			{ academicYearId: yearA.id },
		);
		expect(yearTranscript).toMatchObject({
			scope: "annual",
			source: "jury",
			jury: { id: annual.id },
		});
	});
});
