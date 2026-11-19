import { describe, expect, it, setDefaultTimeout } from "bun:test";

setDefaultTimeout(60_000);

import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import {
	createAcademicYear,
	createClass,
	createClassCourse,
	createCourse,
	createDomainUser,
	createProgram,
	createStudent,
	createTeachingUnit,
	makeTestContext,
} from "@/lib/test-utils";
import {
	getStudentYearResults,
	listStudentResultYears,
} from "@/modules/deliberations/student-year-results";
import { appRouter } from "@/routers";
import * as repo from "../academic-documents.repo";
import {
	buildRenderData,
	documentResultsFromYear,
	upgradeLegacyTranscriptBody,
} from "../academic-documents.service";

async function adminCaller() {
	const profile = await createDomainUser();
	return appRouter.createCaller(
		makeTestContext({
			role: "administrator",
			profileOverrides: { id: profile.id },
		}),
	);
}

async function addExam(
	classCourseId: string,
	institutionId: string,
	type: "CC" | "EXAMEN",
	percentage: number,
	marks: Array<[string, number]>,
) {
	const [exam] = await db
		.insert(schema.exams)
		.values({
			name: `${type}-${Math.random().toString(36).slice(2, 8)}`,
			type,
			date: new Date(),
			percentage: percentage.toString(),
			classCourse: classCourseId,
			status: "approved",
			isLocked: false,
			scheduledAt: new Date(),
			validatedAt: new Date(),
			institutionId,
		})
		.returning();
	if (marks.length) {
		await db.insert(schema.grades).values(
			marks.map(([student, score]) => ({
				student,
				exam: exam.id,
				score: score.toString(),
			})),
		);
	}
	return exam;
}

/**
 * A 1st-year class of 2025-2026 with one UE (6 credits, 2 courses) and one
 * UE (4 credits, 1 course), CC 40 % + final 60 %; the student then moves to
 * a 2nd-year class of 2026-2027 (her current class).
 */
async function setupYearEnd() {
	const program = await createProgram();
	const year1 = await createAcademicYear({
		name: `2025-2026-${Math.random().toString(36).slice(2, 6)}`,
		startDate: "2025-09-01",
		endDate: "2026-07-31",
	});
	const year2 = await createAcademicYear({
		name: `2026-2027-${Math.random().toString(36).slice(2, 6)}`,
		startDate: "2026-09-01",
		endDate: "2027-07-31",
	});
	const class1 = await createClass({
		program: program.id,
		academicYear: year1.id,
		name: `First year ${Math.random().toString(36).slice(2, 6)}`,
	});
	const class2 = await createClass({
		program: program.id,
		academicYear: year2.id,
		name: `Second year ${Math.random().toString(36).slice(2, 6)}`,
	});
	const ue1 = await createTeachingUnit({ programId: program.id, credits: 6 });
	const ue2 = await createTeachingUnit({ programId: program.id, credits: 4 });
	const [c1a, c1b, c2] = await Promise.all([
		createCourse({ program: program.id, teachingUnitId: ue1.id }),
		createCourse({ program: program.id, teachingUnitId: ue1.id }),
		createCourse({ program: program.id, teachingUnitId: ue2.id }),
	]);
	const cc1a = await createClassCourse({ class: class1.id, course: c1a.id });
	const cc1b = await createClassCourse({ class: class1.id, course: c1b.id });
	const cc2 = await createClassCourse({ class: class1.id, course: c2.id });

	const student = await createStudent({ class: class1.id });
	const inst = class1.institutionId;
	// UE1: (8×.4 + 14×.6 = 11.6) and (12×.4 + 13×.6 = 12.6) → 12.1
	await addExam(cc1a.id, inst, "CC", 40, [[student.id, 8]]);
	await addExam(cc1a.id, inst, "EXAMEN", 60, [[student.id, 14]]);
	await addExam(cc1b.id, inst, "CC", 40, [[student.id, 12]]);
	await addExam(cc1b.id, inst, "EXAMEN", 60, [[student.id, 13]]);
	// UE2: 7.63×.4 + 12.47×.6 = 10.534 (the final alone would read 12.47)
	await addExam(cc2.id, inst, "CC", 40, [[student.id, 7.63]]);
	await addExam(cc2.id, inst, "EXAMEN", 60, [[student.id, 12.47]]);

	// Promoted: 2025-2026 completed, now in the 2nd-year class of 2026-2027
	await db
		.update(schema.enrollments)
		.set({ status: "completed" })
		.where(eq(schema.enrollments.studentId, student.id));
	await db.insert(schema.enrollments).values({
		studentId: student.id,
		classId: class2.id,
		academicYearId: year2.id,
		institutionId: inst,
		status: "active",
	});
	await db
		.update(schema.students)
		.set({ class: class2.id })
		.where(eq(schema.students.id, student.id));

	return { program, year1, year2, class1, class2, student, c2 };
}

const round2 = (n: number | null | undefined) =>
	n == null ? null : Math.round(n * 100) / 100;

describe("transcript results", () => {
	it("prints the course mark weighted by the exam percentages, the real credit total and an annual label", async () => {
		const { student, year1, c2 } = await setupYearEnd();
		const results = await getStudentYearResults(
			student.institutionId,
			student.id,
			{ academicYearId: year1.id },
		);
		if (!results) throw new Error("no results");
		expect(results.source).toBe("live");

		const studentCtx = await repo.loadStudentContext(
			student.institutionId,
			student.id,
			results.class.id,
		);
		if (!studentCtx) throw new Error("no student context");
		const data = (await buildRenderData({
			kind: "transcript",
			studentCtx,
			deliberation: documentResultsFromYear(results),
			theme: {},
			demoMode: true,
		})) as any;

		const courses = data.semesters.flatMap((s: any) =>
			s.ues.flatMap((u: any) => u.courses),
		);
		const course2 = courses.find((c: any) => c.code === c2.code);
		// NOTE/20 is the course average, not the final-exam mark
		expect(round2(course2.average)).toBe(10.53);
		expect(course2.exam).toBe(12.47);
		// The UE average agrees with the course marks
		const ue2 = data.semesters
			.flatMap((s: any) => s.ues)
			.find((u: any) => u.courses.some((c: any) => c.code === c2.code));
		expect(round2(ue2.average)).toBe(10.53);
		// General average: (12.1 × 6 + 10.534 × 4) / 10
		expect(round2(data.summary.generalAverage)).toBe(11.47);
		expect(data.summary.creditsTotal).toBe(10);
		expect(data.summary.creditsEarned).toBe(10);
		expect(data.summary.averageLabel).toBe("MOYENNE ANNUELLE");
		// The GRADE column gets the letter, the mention stays a mention
		expect(data.summary.gradeLetter).toBe("E");
		expect(data.summary.mention).toBe("Passable");
		// Header of the year the transcript is about
		expect(data.document.academicYear).toBe(year1.name);
	});

	it("labels a semester transcript as such", async () => {
		const { student, class1, year1 } = await setupYearEnd();
		const klass = await db.query.classes.findFirst({
			where: (c, { eq }) => eq(c.id, class1.id),
		});
		const results = await getStudentYearResults(
			student.institutionId,
			student.id,
			{ academicYearId: year1.id, semesterId: klass?.semesterId },
		);
		if (!results) throw new Error("no results");
		expect(results.scope).toBe("semester");
		const studentCtx = await repo.loadStudentContext(
			student.institutionId,
			student.id,
			class1.id,
		);
		if (!studentCtx) throw new Error("no student context");
		const data = (await buildRenderData({
			kind: "transcript",
			studentCtx,
			deliberation: documentResultsFromYear(results),
			theme: {},
			demoMode: true,
			period: "semester",
		})) as any;
		expect(data.summary.averageLabel).toBe("MOYENNE SEMESTRIELLE");
		expect(data.summary.semesterLabel).not.toBe("—");
	});

	it("uses the signed jury's figures and the jury year's class, not the current class", async () => {
		const caller = await adminCaller();
		const { student, year1, year2, class1, class2 } = await setupYearEnd();

		const delib = await caller.deliberations.create({
			classId: class1.id,
			academicYearId: year1.id,
			type: "annual",
		});
		await caller.deliberations.transition({ id: delib.id, action: "open" });
		const computed = await caller.deliberations.compute({ id: delib.id });
		const juryResult = computed.results.find((r) => r.studentId === student.id);
		await caller.deliberations.transition({ id: delib.id, action: "close" });
		await caller.deliberations.transition({ id: delib.id, action: "sign" });

		// Default year: the one with the signed jury, not the active one
		const { years, defaultAcademicYearId } = await listStudentResultYears(
			student.institutionId,
			student.id,
		);
		expect(years.map((y) => y.academicYearId)).toEqual([year2.id, year1.id]);
		expect(defaultAcademicYearId).toBe(year1.id);

		const results = await getStudentYearResults(
			student.institutionId,
			student.id,
		);
		expect(results?.source).toBe("jury");
		expect(results?.class.id).toBe(class1.id);
		expect(results?.generalAverage).toBe(juryResult?.generalAverage ?? null);
		expect(results?.decision).toBe("admitted");

		const { html } = await caller.academicDocuments.preview({
			kind: "transcript",
			studentId: student.id,
			academicYearId: year1.id,
		});
		expect(html).toContain(year1.name);
		expect(html).not.toContain(year2.name);
		expect(html).toContain(class1.name);
		expect(html).not.toContain(class2.name);
		// The jury's general average and the course mark of 10.53
		const avg = (juryResult?.generalAverage ?? 0).toFixed(2).replace(".", ",");
		expect(html).toContain(avg);
		expect(html).toContain("10,53");
		expect(html).toContain("/10");
		expect(html).not.toContain("/30");

		// A year without an enrollment is refused in words the UI translates
		const other = await createAcademicYear();
		const err = await caller.academicDocuments
			.preview({
				kind: "transcript",
				studentId: student.id,
				academicYearId: other.id,
			})
			.then(
				() => null,
				(e: Error) => e,
			);
		expect(err?.message).toBe("DOCUMENT_NOT_ELIGIBLE:not_enrolled");
	});

	it("shows the year's results on the student file", async () => {
		const caller = await adminCaller();
		const { student, year1, year2 } = await setupYearEnd();
		const domainUserId = student.domainUserId;

		const res = await caller.profiles.results({ profileId: domainUserId });
		// No jury: the year with marks comes first, not the active one
		expect(res.results?.academicYear.id).toBe(year1.id);
		expect(res.results?.source).toBe("live");
		expect(
			round2(res.results?.partialAverage ?? res.results?.generalAverage),
		).toBe(11.47);
		expect(res.results?.totalCreditsEarned).toBe(10);

		const next = await caller.profiles.results({
			profileId: domainUserId,
			academicYearId: year2.id,
		});
		expect(next.results?.academicYear.id).toBe(year2.id);
		expect(next.results?.totalCreditsEarned).toBe(0);
	});
});

describe("stored transcript templates", () => {
	it("are upgraded to print the course mark and the real labels", () => {
		const legacy = `<td class="table-note">{{formatNumber this.exam}}</td>
<td class="summary-label">TOTAL CREDITS /30</td>
<td colspan="3" class="summary-label">MOYENNE SEMESTRIELLE/20</td>
<td class="summary-value"><strong>{{class.name}}</strong></td>
					<td class="summary-value"><strong>—</strong></td>
<td class="summary-value"><strong>{{getAppreciation summary.generalAverage}}</strong></td>`;
		const html = upgradeLegacyTranscriptBody(legacy);
		expect(html).toContain("{{formatNumber this.average}}");
		expect(html).not.toContain("this.exam");
		expect(html).toContain("TOTAL CREDITS /{{summary.creditsTotal}}");
		expect(html).toContain("{{summary.averageLabel}}/20");
		expect(html).toContain("{{summary.gradeLetter}}");
		expect(html).toContain("<strong>{{summary.semesterLabel}}</strong>");
	});
});
