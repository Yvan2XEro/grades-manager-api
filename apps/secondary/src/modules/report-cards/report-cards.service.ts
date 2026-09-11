import { and, eq, inArray } from "drizzle-orm";
import { db } from "../../db";
import {
	academicYears,
	assessments,
	attendanceRecords,
	attendanceSessions,
	classes,
	enrollments,
	institutions,
	students,
	subjects,
	termAverages,
	terms,
	trackSubjectCoefficients,
} from "../../db/schema";
import { notFound } from "../../lib/errors";
import { htmlToPdf } from "../../lib/pdf";
import { buildReportCardTemplateData } from "../../lib/template-data-builders/report-card";
import { resolveAndRender } from "../../lib/template-resolver";
import * as repo from "./report-cards.repo";

export async function list(
	institutionId: string,
	academicYearId: string,
	termId?: string,
	classId?: string,
	opts: { page?: number; pageSize?: number } = {},
) {
	const { rows, total } = await repo.findAll(
		institutionId,
		academicYearId,
		termId,
		classId,
		opts,
	);
	return {
		items: rows.map((row) => row.report_cards),
		total,
		page: opts.page ?? 1,
		pageSize: opts.pageSize ?? 25,
	};
}

export async function get(id: string, institutionId: string) {
	const card = await repo.findById(id, institutionId);
	if (!card) throw notFound("Report card not found");
	return card;
}

export async function updateStatus(
	id: string,
	status: string,
	institutionId: string,
) {
	const card = await repo.findById(id, institutionId);
	if (!card) throw notFound("Report card not found");
	const updated = await repo.updateStatus(id, status, institutionId);
	if (!updated) throw notFound("Report card not found");
	return updated;
}

function mentionCodeFromAvg(avg: number): string {
	if (avg >= 18) return "outstanding";
	if (avg >= 16) return "excellent";
	if (avg >= 14) return "very_good";
	if (avg >= 12) return "good";
	if (avg >= 10) return "passing";
	return "below_average";
}

/**
 * Generate a report card for a student in a specific term.
 * Computes coefficient-weighted averages and class rank.
 */
export async function generate(
	studentId: string,
	termId: string,
	institutionId: string,
) {
	// Find the enrollment (with class and track info)
	const enrollmentResult = await db
		.select()
		.from(enrollments)
		.innerJoin(classes, eq(enrollments.classId, classes.id))
		.where(
			and(
				eq(enrollments.institutionId, institutionId),
				eq(enrollments.studentId, studentId),
			),
		)
		.limit(1);

	const enrollmentRow = enrollmentResult[0];
	if (!enrollmentRow) throw notFound("Student enrollment not found");

	const enrollment = enrollmentRow.enrollments;
	const classRow = enrollmentRow.classes;
	const trackId = classRow.trackId;

	// Fetch coefficients for this track (empty if no track)
	const coeffRows = trackId
		? await db
				.select()
				.from(trackSubjectCoefficients)
				.where(eq(trackSubjectCoefficients.trackId, trackId))
		: [];
	const coeffMap = new Map(coeffRows.map((r) => [r.subjectId, r.coefficient]));

	// Fetch all assessments for this student in this term
	const allAssessments = await db
		.select()
		.from(assessments)
		.where(
			and(
				eq(assessments.institutionId, institutionId),
				eq(assessments.studentId, studentId),
				eq(assessments.termId, termId),
			),
		);

	// Fetch subjects for reference
	const allSubjects = await db
		.select()
		.from(subjects)
		.where(eq(subjects.institutionId, institutionId));
	const subjectMap = new Map(allSubjects.map((s) => [s.id, s]));

	// Accumulate per-subject sums
	const subjectSums: Record<
		string,
		{ sum: number; count: number; subjectId: string }
	> = {};

	for (const a of allAssessments) {
		if (!a.value) continue;
		const v = Number.parseFloat(a.value.toString());
		if (Number.isNaN(v)) continue;
		if (!subjectSums[a.subjectId]) {
			subjectSums[a.subjectId] = { sum: 0, count: 0, subjectId: a.subjectId };
		}
		subjectSums[a.subjectId]!.sum += v;
		subjectSums[a.subjectId]!.count += 1;
	}

	// Build subject averages with coefficients
	let totalWeightedPoints = 0;
	let totalCoeff = 0;

	const subjectAverages: Record<
		string,
		{
			subjectId: string;
			subjectName: string;
			subjectNameFr: string;
			avg: number;
			assessmentCount: number;
			coeff: number;
		}
	> = {};

	for (const [subjectId, sums] of Object.entries(subjectSums)) {
		const avg = Math.round((sums.sum / sums.count) * 100) / 100;
		const subject = subjectMap.get(subjectId);
		const coeff = coeffMap.get(subjectId) ?? 1;

		subjectAverages[subjectId] = {
			subjectId,
			subjectName: subject?.name ?? "Unknown",
			subjectNameFr: subject?.nameFr ?? "Unknown",
			avg,
			assessmentCount: sums.count,
			coeff,
		};

		totalWeightedPoints += avg * coeff;
		totalCoeff += coeff;
	}

	const weightedAverage =
		totalCoeff > 0
			? Math.round((totalWeightedPoints / totalCoeff) * 100) / 100
			: null;
	const mention =
		weightedAverage !== null ? mentionCodeFromAvg(weightedAverage) : null;

	// Compute class rank: fetch all enrollments in same class+term, compute their weighted avg
	const classEnrollments = await db
		.select({ id: enrollments.id, studentId: enrollments.studentId })
		.from(enrollments)
		.where(
			and(
				eq(enrollments.institutionId, institutionId),
				eq(enrollments.classId, classRow.id),
			),
		);

	const peerEnrollmentIds = classEnrollments.map((e) => e.id);
	const peerAvgRows =
		peerEnrollmentIds.length > 1
			? await db
					.select({
						enrollmentId: termAverages.enrollmentId,
						weightedAverage: termAverages.weightedAverage,
					})
					.from(termAverages)
					.where(
						and(
							eq(termAverages.termId, termId),
							inArray(termAverages.enrollmentId, peerEnrollmentIds),
						),
					)
			: [];

	// Build a map of enrollmentId → average for ranking (include current student)
	const peerAvgMap = new Map<string, number>();
	for (const r of peerAvgRows) {
		if (r.weightedAverage !== null && r.weightedAverage !== undefined) {
			peerAvgMap.set(r.enrollmentId, Number(r.weightedAverage));
		}
	}
	// Overwrite with the freshly computed value for this student
	if (weightedAverage !== null) {
		peerAvgMap.set(enrollment.id, weightedAverage);
	}

	// Rank = count of peers with strictly higher average + 1
	const rank =
		weightedAverage !== null
			? Array.from(peerAvgMap.values()).filter((v) => v > weightedAverage)
					.length + 1
			: null;

	const classSize = classEnrollments.length;

	// Compute class-wide per-subject stats (avg, min, max)
	const peerStudentIds = classEnrollments.map((e) => e.studentId);
	const classAssessments =
		peerStudentIds.length > 1
			? await db
					.select()
					.from(assessments)
					.where(
						and(
							eq(assessments.institutionId, institutionId),
							eq(assessments.termId, termId),
							inArray(assessments.studentId, peerStudentIds),
						),
					)
			: allAssessments;

	// Per subject: collect all student averages (mean of their assessments for that subject)
	const classSubjectVals: Record<string, number[]> = {};
	const peerSubjectSums: Record<
		string,
		Record<string, { sum: number; count: number }>
	> = {};
	for (const a of classAssessments) {
		if (!a.value) continue;
		const v = Number.parseFloat(a.value.toString());
		if (Number.isNaN(v)) continue;
		if (!peerSubjectSums[a.studentId]) peerSubjectSums[a.studentId] = {};
		if (!peerSubjectSums[a.studentId]?.[a.subjectId])
			peerSubjectSums[a.studentId]![a.subjectId] = { sum: 0, count: 0 };
		peerSubjectSums[a.studentId][a.subjectId].sum += v;
		peerSubjectSums[a.studentId][a.subjectId].count += 1;
	}
	for (const studentSums of Object.values(peerSubjectSums)) {
		for (const [subjectId, s] of Object.entries(studentSums)) {
			const avg = s.sum / s.count;
			if (!classSubjectVals[subjectId]) classSubjectVals[subjectId] = [];
			classSubjectVals[subjectId]?.push(avg);
		}
	}
	const classSubjectStats: Record<
		string,
		{ classAvg: number; classMin: number; classMax: number; classCount: number }
	> = {};
	for (const [subjectId, vals] of Object.entries(classSubjectVals)) {
		if (vals.length === 0) continue;
		classSubjectStats[subjectId] = {
			classAvg:
				Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100,
			classMin: Math.round(Math.min(...vals) * 100) / 100,
			classMax: Math.round(Math.max(...vals) * 100) / 100,
			classCount: vals.length,
		};
	}

	// Count absence sessions for this student in the class+term
	const absentSessionRows = await db
		.select({ sessionId: attendanceRecords.sessionId })
		.from(attendanceRecords)
		.innerJoin(
			attendanceSessions,
			eq(attendanceRecords.sessionId, attendanceSessions.id),
		)
		.where(
			and(
				eq(attendanceRecords.institutionId, institutionId),
				eq(attendanceRecords.studentId, studentId),
				eq(attendanceSessions.termId, termId),
				eq(attendanceSessions.classId, classRow.id),
				eq(attendanceRecords.status, "absent"),
			),
		);
	const absentSessions = absentSessionRows.length;

	// Upsert termAverages record
	await upsertTermAverage({
		institutionId,
		enrollmentId: enrollment.id,
		termId,
		weightedAverage,
		totalPoints: totalWeightedPoints,
		totalCoefficients: totalCoeff,
		subjectAverages,
		rank,
		mentionCode: mention,
	});

	const snapshotData = {
		studentId,
		termId,
		enrollmentId: enrollment.id,
		generatedAt: new Date().toISOString(),
		subjectAverages,
		overallAverage: weightedAverage,
		assessmentCount: allAssessments.length,
		totalCoefficients: totalCoeff,
		rank,
		classSize,
		classSubjectStats,
		absentSessions,
		mentionCode: mention,
	};

	const card = await repo.upsert({
		institutionId,
		enrollmentId: enrollment.id,
		termId,
		status: "generated",
		snapshotData,
		language: "fr",
	});

	return card;
}

async function upsertTermAverage(data: {
	institutionId: string;
	enrollmentId: string;
	termId: string;
	weightedAverage: number | null;
	totalPoints: number;
	totalCoefficients: number;
	subjectAverages: Record<string, unknown>;
	rank: number | null;
	mentionCode: string | null;
}) {
	const existing = await db
		.select({ id: termAverages.id })
		.from(termAverages)
		.where(
			and(
				eq(termAverages.enrollmentId, data.enrollmentId),
				eq(termAverages.termId, data.termId),
			),
		)
		.limit(1);

	if (existing[0]) {
		await db
			.update(termAverages)
			.set({
				weightedAverage:
					data.weightedAverage !== null
						? data.weightedAverage.toString()
						: null,
				totalPoints: data.totalPoints.toString(),
				totalCoefficients: data.totalCoefficients,
				subjectAverages: data.subjectAverages,
				rank: data.rank,
				mentionCode: data.mentionCode,
				updatedAt: new Date(),
			})
			.where(eq(termAverages.id, existing[0].id));
	} else {
		await db.insert(termAverages).values({
			institutionId: data.institutionId,
			enrollmentId: data.enrollmentId,
			termId: data.termId,
			weightedAverage:
				data.weightedAverage !== null ? data.weightedAverage.toString() : null,
			totalPoints: data.totalPoints.toString(),
			totalCoefficients: data.totalCoefficients,
			subjectAverages: data.subjectAverages,
			rank: data.rank,
			mentionCode: data.mentionCode,
		});
	}
}

type SubjectAvgEntry = {
	subjectId: string;
	subjectName: string;
	subjectNameFr: string;
	avg: number;
	assessmentCount: number;
	coeff?: number;
};

type SnapshotData = {
	studentId?: string;
	termId?: string;
	enrollmentId?: string;
	generatedAt?: string;
	subjectAverages?: Record<string, SubjectAvgEntry>;
	overallAverage?: number | null;
	assessmentCount?: number;
	totalCoefficients?: number;
	rank?: number | null;
	mentionCode?: string | null;
};

export async function generatePdf(
	id: string,
	institutionId: string,
): Promise<{ pdfBase64: string; filename: string }> {
	const card = await repo.findById(id, institutionId);
	if (!card) throw notFound("Report card not found");

	const snapshot = (card.snapshotData ?? {}) as SnapshotData;
	const studentId = snapshot.studentId;
	if (!studentId) throw notFound("Report card has no snapshot data");

	const [enrollmentRows, termRows, institutionRows] = await Promise.all([
		db
			.select()
			.from(enrollments)
			.innerJoin(classes, eq(enrollments.classId, classes.id))
			.innerJoin(students, eq(enrollments.studentId, students.id))
			.innerJoin(
				academicYears,
				eq(enrollments.academicYearId, academicYears.id),
			)
			.where(
				and(
					eq(enrollments.id, card.enrollmentId),
					eq(enrollments.institutionId, institutionId),
				),
			)
			.limit(1),
		db
			.select()
			.from(terms)
			.where(
				and(eq(terms.id, card.termId), eq(terms.institutionId, institutionId)),
			)
			.limit(1),
		db
			.select()
			.from(institutions)
			.where(eq(institutions.id, institutionId))
			.limit(1),
	]);

	const row = enrollmentRows[0];
	if (!row) throw notFound("Enrollment not found");

	const term = termRows[0];
	if (!term) throw notFound("Term not found");

	const institution = institutionRows[0];
	if (!institution) throw notFound("Institution not found");

	const lang = (card.language ?? "fr") as "fr" | "en";
	const templateData = await buildReportCardTemplateData({
		snapshot,
		student: {
			firstName: row.students.firstName,
			lastName: row.students.lastName,
			gender: row.students.gender,
			mnu: row.students.mnu,
			dateOfBirth: row.students.dateOfBirth,
		},
		institution: {
			name: institution.name,
			city: institution.city,
			minesecCode: institution.minesecCode,
			logoUrl: institution.logoUrl,
		},
		className: row.classes.name,
		yearName: row.academic_years.name,
		termNumber: term.termNumber,
		language: lang,
		rank: typeof snapshot.rank === "number" ? snapshot.rank : null,
	});
	const html = await resolveAndRender(
		institutionId,
		"report_card",
		lang,
		templateData,
	);

	const pdf = await htmlToPdf(html);
	const pdfBase64 = pdf.toString("base64");
	const filename = `bulletin_${row.students.lastName.toLowerCase()}_${row.students.firstName.toLowerCase()}_t${term.termNumber}.pdf`;
	return { pdfBase64, filename };
}

/**
 * Generate all report cards for every student in a class+term in one server call.
 * Returns a count of successfully generated cards.
 */
export async function batchGenerate(
	classId: string,
	termId: string,
	academicYearId: string,
	institutionId: string,
): Promise<{ generated: number; errors: number }> {
	const enrollmentRows = await repo.findEnrollmentsByClass(
		classId,
		academicYearId,
		institutionId,
	);
	let generated = 0;
	let errors = 0;
	for (const row of enrollmentRows) {
		try {
			await generate(row.student.id, termId, institutionId);
			generated++;
		} catch {
			errors++;
		}
	}
	return { generated, errors };
}

/**
 * Generate a single PDF containing all bulletin cards for the class+term,
 * with page breaks between students.
 */
export async function batchPdf(
	classId: string,
	termId: string,
	academicYearId: string,
	institutionId: string,
): Promise<{ pdfBase64: string; filename: string; count: number }> {
	const [cards, termRows, institutionRows, classRows, yearRows] =
		await Promise.all([
			repo.findByClassAndTerm(classId, termId, academicYearId, institutionId),
			db
				.select()
				.from(terms)
				.where(
					and(eq(terms.id, termId), eq(terms.institutionId, institutionId)),
				)
				.limit(1),
			db
				.select()
				.from(institutions)
				.where(eq(institutions.id, institutionId))
				.limit(1),
			db
				.select()
				.from(classes)
				.where(
					and(
						eq(classes.id, classId),
						eq(classes.institutionId, institutionId),
					),
				)
				.limit(1),
			db
				.select()
				.from(academicYears)
				.where(
					and(
						eq(academicYears.id, academicYearId),
						eq(academicYears.institutionId, institutionId),
					),
				)
				.limit(1),
		]);

	const term = termRows[0];
	if (!term) throw notFound("Term not found");
	const institution = institutionRows[0];
	if (!institution) throw notFound("Institution not found");
	const classRow = classRows[0];
	if (!classRow) throw notFound("Class not found");
	const yearRow = yearRows[0];

	if (cards.length === 0) {
		throw notFound("No report cards found for this class and term");
	}

	const pages = await Promise.all(
		cards.map(async (row) => {
			const snapshot = (row.reportCard.snapshotData ?? {}) as SnapshotData;
			const lang = (row.reportCard.language ?? "fr") as "fr" | "en";
			const templateData = await buildReportCardTemplateData({
				snapshot,
				student: {
					firstName: row.student.firstName,
					lastName: row.student.lastName,
					gender: row.student.gender,
					mnu: row.student.mnu,
					dateOfBirth: row.student.dateOfBirth,
				},
				institution: {
					name: institution.name,
					city: institution.city,
					minesecCode: institution.minesecCode,
					logoUrl: institution.logoUrl,
				},
				className: classRow.name,
				yearName: yearRow?.name ?? academicYearId,
				termNumber: term.termNumber,
				language: lang,
				rank: typeof snapshot.rank === "number" ? snapshot.rank : null,
			});
			return resolveAndRender(institutionId, "report_card", lang, templateData);
		}),
	);

	// Merge individual bulletin HTMLs into one printable document with page breaks
	const mergedHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<style>* { margin:0; padding:0; box-sizing:border-box; }
.bulletin-page { page-break-after: always; }
.bulletin-page:last-child { page-break-after: avoid; }</style>
</head><body>
${pages.map((h) => `<div class="bulletin-page">${h.replace(/<!DOCTYPE html>[\s\S]*?<body>/, "").replace(/<\/body>[\s\S]*$/, "")}</div>`).join("\n")}
</body></html>`;

	const pdf = await htmlToPdf(mergedHtml);
	const pdfBase64 = pdf.toString("base64");
	const filename = `bulletins_${classRow.name.toLowerCase().replace(/\s+/g, "_")}_t${term.termNumber}.pdf`;
	return { pdfBase64, filename, count: cards.length };
}
