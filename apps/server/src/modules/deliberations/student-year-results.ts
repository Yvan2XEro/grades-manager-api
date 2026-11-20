import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import type {
	DeliberationDecision,
	DeliberationStatus,
	DeliberationType,
	EnrollmentStatus,
} from "@/db/schema/app-schema";
import * as schema from "@/db/schema/app-schema";
import * as gradeScalesService from "../grade-scales/grade-scales.service";
import type { DeliberationUeResult } from "./deliberations.types";
import {
	computeStudentUeResults,
	loadClassUeInputs,
	type UeSemester,
} from "./ue-results";

/**
 * A student's results for one academic year (or one semester of it): the
 * figures of the closed/signed jury when there is one, otherwise the live
 * computation with the jury's formula. Shared by the transcript and the
 * student file so they always show the same numbers.
 */
export type StudentYearResults = {
	academicYear: { id: string; name: string };
	class: {
		id: string;
		name: string;
		code: string;
		/** Program and cycle, to name what a graduate earned. */
		programName: string | null;
		cycleName: string | null;
	};
	enrollmentStatus: EnrollmentStatus | null;
	scope: "annual" | "semester";
	semester: { id: string; name: string } | null;
	/** "jury": figures of a closed/signed jury; "live": computed from the marks. */
	source: "jury" | "live";
	jury: {
		id: string;
		type: DeliberationType;
		status: DeliberationStatus;
		openedAt: Date | null;
		deliberationDate: Date | null;
		signedAt: Date | null;
		juryNumber: string | null;
		isOverridden: boolean;
	} | null;
	/** General average of complete results (null while marks are missing). */
	generalAverage: number | null;
	/** Credit-weighted average of the UEs that have one (live results only). */
	partialAverage: number | null;
	isComplete: boolean;
	totalCreditsEarned: number;
	totalCreditsPossible: number;
	/** Jury decision; null for live results (not deliberated yet). */
	decision: DeliberationDecision | null;
	mention: string | null;
	rank: number | null;
	ueResults: Array<DeliberationUeResult & { semester: UeSemester | null }>;
};

const FINAL_STATUSES: DeliberationStatus[] = ["closed", "signed"];

type YearEnrollment = {
	classId: string;
	className: string;
	classCode: string;
	programName: string | null;
	cycleName: string | null;
	academicYearId: string;
	academicYearName: string;
	startDate: string;
	status: EnrollmentStatus;
};

/** The student's enrollments, most recent year first (withdrawn last). */
async function listYearEnrollments(
	institutionId: string,
	studentId: string,
): Promise<YearEnrollment[]> {
	const rows = await db
		.select({
			classId: schema.enrollments.classId,
			className: schema.classes.name,
			classCode: schema.classes.code,
			programName: schema.programs.name,
			cycleName: schema.studyCycles.name,
			academicYearId: schema.enrollments.academicYearId,
			academicYearName: schema.academicYears.name,
			startDate: schema.academicYears.startDate,
			status: schema.enrollments.status,
		})
		.from(schema.enrollments)
		.innerJoin(
			schema.classes,
			eq(schema.classes.id, schema.enrollments.classId),
		)
		.innerJoin(
			schema.academicYears,
			eq(schema.academicYears.id, schema.enrollments.academicYearId),
		)
		.leftJoin(schema.programs, eq(schema.programs.id, schema.classes.program))
		.leftJoin(
			schema.cycleLevels,
			eq(schema.cycleLevels.id, schema.classes.cycleLevelId),
		)
		.leftJoin(
			schema.studyCycles,
			eq(schema.studyCycles.id, schema.cycleLevels.cycleId),
		)
		.where(
			and(
				eq(schema.enrollments.institutionId, institutionId),
				eq(schema.enrollments.studentId, studentId),
			),
		)
		.orderBy(
			desc(schema.academicYears.startDate),
			sql`case when ${schema.enrollments.status} = 'withdrawn' then 1 else 0 end`,
			desc(schema.enrollments.enrolledAt),
		);
	return rows as YearEnrollment[];
}

export type StudentResultYear = {
	academicYearId: string;
	academicYearName: string;
	classId: string;
	className: string;
	enrollmentStatus: EnrollmentStatus;
	/** A closed or signed jury has results for the student this year. */
	hasJury: boolean;
	/** At least one mark was entered for the student in the class. */
	hasGrades: boolean;
};

/**
 * The years a student has results for (one entry per year, the enrollment
 * that counts), most recent first, and the year to show by default: the most
 * recent with a closed/signed jury, else with marks, else the most recent.
 */
export async function listStudentResultYears(
	institutionId: string,
	studentId: string,
): Promise<{
	years: StudentResultYear[];
	defaultAcademicYearId: string | null;
}> {
	const enrollments = await listYearEnrollments(institutionId, studentId);
	const byYear = new Map<string, YearEnrollment>();
	for (const e of enrollments) {
		if (!byYear.has(e.academicYearId)) byYear.set(e.academicYearId, e);
	}
	const picked = Array.from(byYear.values());
	if (picked.length === 0) return { years: [], defaultAcademicYearId: null };

	const classIds = picked.map((e) => e.classId);
	const [juryRows, gradeRows] = await Promise.all([
		db
			.select({
				classId: schema.deliberations.classId,
				academicYearId: schema.deliberations.academicYearId,
			})
			.from(schema.deliberationStudentResults)
			.innerJoin(
				schema.deliberations,
				eq(
					schema.deliberations.id,
					schema.deliberationStudentResults.deliberationId,
				),
			)
			.where(
				and(
					eq(schema.deliberations.institutionId, institutionId),
					eq(schema.deliberationStudentResults.studentId, studentId),
					inArray(schema.deliberations.classId, classIds),
					inArray(schema.deliberations.status, FINAL_STATUSES),
				),
			),
		db
			.selectDistinct({ classId: schema.classCourses.class })
			.from(schema.grades)
			.innerJoin(schema.exams, eq(schema.exams.id, schema.grades.exam))
			.innerJoin(
				schema.classCourses,
				eq(schema.classCourses.id, schema.exams.classCourse),
			)
			.where(
				and(
					eq(schema.grades.student, studentId),
					inArray(schema.classCourses.class, classIds),
				),
			),
	]);
	const juryKeys = new Set(
		juryRows.map((r) => `${r.classId}:${r.academicYearId}`),
	);
	const gradedClasses = new Set(gradeRows.map((r) => r.classId));

	const years = picked.map((e) => ({
		academicYearId: e.academicYearId,
		academicYearName: e.academicYearName,
		classId: e.classId,
		className: e.className,
		enrollmentStatus: e.status,
		hasJury: juryKeys.has(`${e.classId}:${e.academicYearId}`),
		hasGrades: gradedClasses.has(e.classId),
	}));
	const defaultYear =
		years.find((y) => y.hasJury) ?? years.find((y) => y.hasGrades) ?? years[0];
	return { years, defaultAcademicYearId: defaultYear.academicYearId };
}

/**
 * Results of a student for one year: pin the year (`academicYearId`), the
 * class (`classId`) or the jury (`deliberationId`); with none, the default
 * year of `listStudentResultYears`. Returns null when the student has no
 * enrollment matching the request.
 */
export async function getStudentYearResults(
	institutionId: string,
	studentId: string,
	opts: {
		academicYearId?: string | null;
		classId?: string | null;
		deliberationId?: string | null;
		semesterId?: string | null;
	} = {},
): Promise<StudentYearResults | null> {
	const enrollments = await listYearEnrollments(institutionId, studentId);

	let pinnedJury: typeof schema.deliberations.$inferSelect | undefined;
	if (opts.deliberationId) {
		pinnedJury = await db.query.deliberations.findFirst({
			where: and(
				eq(schema.deliberations.id, opts.deliberationId),
				eq(schema.deliberations.institutionId, institutionId),
			),
		});
		if (!pinnedJury) return null;
	}

	const classId = pinnedJury?.classId ?? opts.classId ?? null;
	let academicYearId = pinnedJury?.academicYearId ?? opts.academicYearId;
	if (!classId && !academicYearId) {
		academicYearId = (await listStudentResultYears(institutionId, studentId))
			.defaultAcademicYearId;
	}

	const enrollment = classId
		? enrollments.find(
				(e) =>
					e.classId === classId &&
					(!academicYearId || e.academicYearId === academicYearId),
			)
		: enrollments.find((e) => e.academicYearId === academicYearId);

	// A jury pins its class even without an enrollment row (legacy data)
	let klass: StudentYearResults["class"] | null = enrollment
		? {
				id: enrollment.classId,
				name: enrollment.className,
				code: enrollment.classCode,
				programName: enrollment.programName ?? null,
				cycleName: enrollment.cycleName ?? null,
			}
		: null;
	let year = enrollment
		? { id: enrollment.academicYearId, name: enrollment.academicYearName }
		: null;
	if (!enrollment && classId) {
		const row = await db.query.classes.findFirst({
			where: and(
				eq(schema.classes.id, classId),
				eq(schema.classes.institutionId, institutionId),
			),
			with: { academicYear: true },
		});
		if (row && pinnedJury) {
			klass = {
				id: row.id,
				name: row.name,
				code: row.code,
				programName: null,
				cycleName: null,
			};
			year = { id: row.academicYear.id, name: row.academicYear.name };
		}
	}
	if (!klass || !year) return null;

	const semesterId = pinnedJury
		? (pinnedJury.semesterId ?? null)
		: (opts.semesterId ?? null);
	const scope: "annual" | "semester" = semesterId ? "semester" : "annual";

	// The jury whose figures are authoritative: the pinned one, else the most
	// recent closed/signed one of the class and year for this scope (a retake
	// jury comes after the annual one).
	const juryRow = await (async () => {
		const conditions = [
			eq(schema.deliberations.institutionId, institutionId),
			eq(schema.deliberationStudentResults.studentId, studentId),
		];
		if (pinnedJury) {
			conditions.push(eq(schema.deliberations.id, pinnedJury.id));
		} else {
			conditions.push(
				eq(schema.deliberations.classId, klass.id),
				eq(schema.deliberations.academicYearId, year.id),
				inArray(schema.deliberations.status, FINAL_STATUSES),
			);
			if (semesterId) {
				conditions.push(
					eq(schema.deliberations.type, "semester"),
					eq(schema.deliberations.semesterId, semesterId),
				);
			} else {
				conditions.push(
					inArray(schema.deliberations.type, ["annual", "retake"]),
				);
			}
		}
		const [row] = await db
			.select({
				result: schema.deliberationStudentResults,
				deliberation: schema.deliberations,
			})
			.from(schema.deliberationStudentResults)
			.innerJoin(
				schema.deliberations,
				eq(
					schema.deliberations.id,
					schema.deliberationStudentResults.deliberationId,
				),
			)
			.where(and(...conditions))
			// The retake jury, when the student went through it, is the year's
			// final word; then the most recent jury.
			.orderBy(
				sql`case when ${schema.deliberations.type} = 'retake' then 0 else 1 end`,
				desc(schema.deliberations.createdAt),
			)
			.limit(1);
		return row ?? null;
	})();

	const { ues, ueSemesters } = await loadClassUeInputs(klass.id, {
		studentIds: [studentId],
		semesterId,
	});
	const semester = semesterId
		? await db.query.semesters.findFirst({
				where: eq(schema.semesters.id, semesterId),
			})
		: null;

	const base = {
		academicYear: year,
		class: klass,
		enrollmentStatus: enrollment?.status ?? null,
		scope,
		semester: semester ? { id: semester.id, name: semester.name } : null,
	};

	if (juryRow) {
		const r = juryRow.result;
		const d = juryRow.deliberation;
		return {
			...base,
			source: "jury",
			jury: {
				id: d.id,
				type: d.type,
				status: d.status,
				openedAt: d.openedAt,
				deliberationDate: d.deliberationDate,
				signedAt: d.signedAt,
				juryNumber: d.juryNumber,
				isOverridden: r.isOverridden,
			},
			generalAverage: r.generalAverage,
			partialAverage: null,
			isComplete: (r.ueResults ?? []).every((ue) => ue.isComplete),
			totalCreditsEarned: r.totalCreditsEarned,
			totalCreditsPossible: r.totalCreditsPossible,
			decision: r.finalDecision ?? r.autoDecision ?? null,
			mention: r.mention ?? null,
			rank: r.rank,
			ueResults: (r.ueResults ?? []).map((ue) => ({
				...ue,
				semester: ueSemesters.get(ue.ueId) ?? null,
			})),
		};
	}

	const gradeScale = await gradeScalesService.getForInstitution(institutionId);
	const computed = computeStudentUeResults(ues, studentId, {
		includeRetakes: true,
		passThreshold: gradeScale.passThreshold,
		compensationThreshold: gradeScale.compensationThreshold,
	});
	const generalAverage = computed.allComplete ? computed.average : null;
	return {
		...base,
		source: "live",
		jury: null,
		generalAverage,
		partialAverage: computed.allComplete ? null : computed.average,
		isComplete: computed.allComplete,
		totalCreditsEarned: computed.totalCreditsEarned,
		totalCreditsPossible: computed.totalCreditsPossible,
		decision: null,
		mention: gradeScalesService.computeMention(
			generalAverage,
			gradeScale.mentionRanges,
		),
		rank: null,
		ueResults: computed.ueResults.map((ue) => ({
			...ue,
			semester: ueSemesters.get(ue.ueId) ?? null,
		})),
	};
}
