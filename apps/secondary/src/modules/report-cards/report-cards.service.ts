import { and, eq, inArray } from "drizzle-orm";
import puppeteer from "puppeteer";
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

function buildBulletinHtml(data: {
	institution: {
		name: string;
		city?: string | null;
		minesecCode?: string | null;
		logoUrl?: string | null;
	};
	student: {
		firstName: string;
		lastName: string;
		gender?: string | null;
		mnu?: string | null;
		dateOfBirth?: Date | null;
	};
	className: string;
	yearName: string;
	termNumber: number;
	language: string;
	subjectRows: SubjectAvgEntry[];
	overallAverage: number | null;
	rank?: number | null;
	mentionCode?: string | null;
}): string {
	const lang = data.language === "en" ? "en" : "fr";
	const labels =
		lang === "fr"
			? {
					title: "BULLETIN DE NOTES",
					term: `TRIMESTRE ${data.termNumber}`,
					student: "Élève",
					class: "Classe",
					year: "Année scolaire",
					mnu: "Matricule",
					subject: "Matière",
					coeff: "Coeff.",
					average: "Moy. /20",
					appreciation: "Appréc.",
					overall: "Moyenne générale",
					rank: "Rang",
					classRank: "Rang",
				}
			: {
					title: "REPORT CARD",
					term: `TERM ${data.termNumber}`,
					student: "Student",
					class: "Class",
					year: "Academic year",
					mnu: "ID",
					subject: "Subject",
					coeff: "Coeff.",
					average: "Avg /20",
					appreciation: "Grade",
					overall: "Overall average",
					rank: "Rank",
					classRank: "Rank",
				};

	const appreciation = (avg: number): string => {
		if (avg >= 16) return lang === "fr" ? "Très bien" : "Excellent";
		if (avg >= 14) return lang === "fr" ? "Bien" : "Good";
		if (avg >= 12) return lang === "fr" ? "Assez bien" : "Fair";
		if (avg >= 10) return lang === "fr" ? "Passable" : "Pass";
		return lang === "fr" ? "Insuffisant" : "Fail";
	};

	const subjectName = (row: SubjectAvgEntry) =>
		lang === "fr" ? row.subjectNameFr || row.subjectName : row.subjectName;

	const rows = data.subjectRows
		.map(
			(row) => `
		<tr>
			<td class="subject">${subjectName(row)}</td>
			<td class="num coeff-col">${row.coeff ?? 1}</td>
			<td class="num">${row.avg.toFixed(2).replace(".", ",")}</td>
			<td class="appr">${appreciation(row.avg)}</td>
		</tr>`,
		)
		.join("");

	const overallRow =
		data.overallAverage !== null && data.overallAverage !== undefined
			? `
		<tr class="total-row">
			<td class="subject total-label">${labels.overall}</td>
			<td class="num coeff-col total-label"></td>
			<td class="num total-num">${data.overallAverage.toFixed(2).replace(".", ",")}</td>
			<td class="appr total-appr">${appreciation(data.overallAverage)}</td>
		</tr>`
			: "";

	const logoHtml = data.institution.logoUrl
		? `<img src="${data.institution.logoUrl}" alt="Logo" class="logo" />`
		: "";

	const dob = data.student.dateOfBirth
		? data.student.dateOfBirth.toLocaleDateString(
				lang === "fr" ? "fr-FR" : "en-US",
			)
		: "—";

	const rankDisplay =
		data.rank !== null && data.rank !== undefined
			? `${data.rank}${lang === "fr" ? (data.rank === 1 ? "er" : "e") : data.rank === 1 ? "st" : data.rank === 2 ? "nd" : data.rank === 3 ? "rd" : "th"}`
			: "—";

	return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #111; background: #fff; padding: 20mm; }
  .header { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; border-bottom: 2px solid #1a56db; padding-bottom: 12px; }
  .logo { height: 60px; width: auto; }
  .header-text { flex: 1; }
  .school-name { font-size: 16px; font-weight: bold; text-transform: uppercase; color: #1a56db; }
  .school-meta { font-size: 10px; color: #555; margin-top: 2px; }
  .doc-title { text-align: right; }
  .doc-title h2 { font-size: 14px; font-weight: bold; text-transform: uppercase; color: #1a56db; }
  .doc-title .term-label { font-size: 12px; font-weight: bold; margin-top: 2px; }
  .doc-title .year-label { font-size: 10px; color: #555; }
  .student-info { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; margin-bottom: 16px; padding: 10px; background: #f3f6ff; border-radius: 4px; }
  .info-row { display: flex; gap: 6px; }
  .info-label { font-weight: bold; color: #333; min-width: 80px; }
  .info-value { color: #111; }
  table { width: 100%; border-collapse: collapse; margin-top: 4px; }
  thead th { background: #1a56db; color: #fff; padding: 7px 10px; text-align: left; font-size: 11px; font-weight: bold; }
  tbody tr:nth-child(even) { background: #f8f9fb; }
  tbody tr td { padding: 6px 10px; border-bottom: 1px solid #e5e7eb; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .coeff-col { text-align: center; color: #6b7280; font-size: 11px; }
  .appr { color: #374151; font-style: italic; }
  .total-row { background: #e0e7ff !important; font-weight: bold; }
  .total-label { font-weight: bold; }
  .total-num { text-align: right; font-weight: bold; }
  .total-appr { font-weight: bold; font-style: normal; }
  .footer { margin-top: 20px; font-size: 10px; color: #888; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 8px; }
</style>
</head>
<body>
<div class="header">
  ${logoHtml}
  <div class="header-text">
    <div class="school-name">${data.institution.name}</div>
    <div class="school-meta">${[data.institution.city, data.institution.minesecCode].filter(Boolean).join(" · ")}</div>
  </div>
  <div class="doc-title">
    <h2>${labels.title}</h2>
    <div class="term-label">${labels.term}</div>
    <div class="year-label">${data.yearName}</div>
  </div>
</div>

<div class="student-info">
  <div class="info-row"><span class="info-label">${labels.student} :</span> <span class="info-value">${data.student.lastName.toUpperCase()} ${data.student.firstName}</span></div>
  <div class="info-row"><span class="info-label">${labels.class} :</span> <span class="info-value">${data.className}</span></div>
  <div class="info-row"><span class="info-label">${labels.mnu} :</span> <span class="info-value">${data.student.mnu ?? "—"}</span></div>
  <div class="info-row"><span class="info-label">Né(e) le :</span> <span class="info-value">${dob}</span></div>
  <div class="info-row"><span class="info-label">${labels.classRank} :</span> <span class="info-value" style="font-weight:bold;color:#1a56db">${rankDisplay}</span></div>
</div>

<table>
  <thead>
    <tr>
      <th>${labels.subject}</th>
      <th class="num" style="text-align:center;width:50px">${labels.coeff}</th>
      <th class="num" style="text-align:right">${labels.average}</th>
      <th>${labels.appreciation}</th>
    </tr>
  </thead>
  <tbody>
    ${rows}
    ${overallRow}
  </tbody>
</table>

<div class="footer">
  ${data.institution.name} — ${lang === "fr" ? "Document généré automatiquement" : "Auto-generated document"}
</div>
</body>
</html>`;
}

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

	const subjectRows = Object.values(
		snapshot.subjectAverages ?? {},
	) as SubjectAvgEntry[];

	const html = buildBulletinHtml({
		institution: {
			name: institution.name,
			city: institution.city,
			minesecCode: institution.minesecCode,
			logoUrl: institution.logoUrl,
		},
		student: {
			firstName: row.students.firstName,
			lastName: row.students.lastName,
			gender: row.students.gender,
			mnu: row.students.mnu,
			dateOfBirth: row.students.dateOfBirth,
		},
		className: row.classes.name,
		yearName: row.academic_years.name,
		termNumber: term.termNumber,
		language: card.language ?? "fr",
		subjectRows,
		overallAverage:
			typeof snapshot.overallAverage === "number"
				? snapshot.overallAverage
				: null,
		rank: typeof snapshot.rank === "number" ? snapshot.rank : null,
		mentionCode: snapshot.mentionCode ?? null,
	});

	const browser = await puppeteer.launch({
		headless: true,
		args: ["--no-sandbox", "--disable-setuid-sandbox"],
		executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
	});

	try {
		const page = await browser.newPage();
		await page.setContent(html, {
			waitUntil: "domcontentloaded",
			timeout: 30_000,
		});
		const pdf = await page.pdf({
			format: "A4",
			printBackground: true,
			margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
		});
		const pdfBase64 = Buffer.from(pdf).toString("base64");
		const filename = `bulletin_${row.students.lastName.toLowerCase()}_${row.students.firstName.toLowerCase()}_t${term.termNumber}.pdf`;
		return { pdfBase64, filename };
	} finally {
		await browser.close();
	}
}
