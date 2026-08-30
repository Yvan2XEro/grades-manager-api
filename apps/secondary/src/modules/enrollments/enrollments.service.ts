import { and, eq } from "drizzle-orm";
import { db } from "../../db";
import { academicYears, classes, institutions } from "../../db/schema";
import { conflict, notFound } from "../../lib/errors";
import { htmlToPdf } from "../../lib/pdf";
import { buildClassRosterHtml } from "../../lib/pdf-templates";
import * as repo from "./enrollments.repo";

export async function list(
	institutionId: string,
	academicYearId: string,
	classId?: string,
	opts: { search?: string; page?: number; pageSize?: number } = {},
) {
	const { items, total } = await repo.findAll(
		institutionId,
		academicYearId,
		classId,
		opts,
	);
	return { items, total, page: opts.page ?? 1, pageSize: opts.pageSize ?? 25 };
}

export async function create(
	data: {
		studentId: string;
		academicYearId: string;
		classId: string;
		admissionType?: string;
	},
	institutionId: string,
) {
	const existing = await repo.findByStudentAndYear(
		data.studentId,
		data.academicYearId,
		institutionId,
	);
	if (existing)
		throw conflict("Student already enrolled in this academic year");
	return repo.insert({
		institutionId,
		studentId: data.studentId,
		academicYearId: data.academicYearId,
		classId: data.classId,
		admissionType: data.admissionType ?? "new",
		status: "active",
	});
}

export async function updateStatus(
	id: string,
	institutionId: string,
	status: string,
) {
	const existing = await repo.findById(id, institutionId);
	if (!existing) throw notFound("Enrollment not found");
	const updated = await repo.updateStatus(id, institutionId, status);
	return updated!;
}

export async function countActive(
	institutionId: string,
	academicYearId?: string,
) {
	return repo.countActive(institutionId, academicYearId);
}

export async function printClassRoster(
	classId: string,
	academicYearId: string,
	institutionId: string,
): Promise<{ pdfBase64: string; filename: string }> {
	const [{ items }, institutionRows, classRows, yearRows] = await Promise.all([
		repo.findAll(institutionId, academicYearId, classId, { pageSize: 500 }),
		db
			.select()
			.from(institutions)
			.where(eq(institutions.id, institutionId))
			.limit(1),
		db
			.select()
			.from(classes)
			.where(
				and(eq(classes.id, classId), eq(classes.institutionId, institutionId)),
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

	const institution = institutionRows[0];
	if (!institution) throw notFound("Institution not found");
	const classRow = classRows[0];
	if (!classRow) throw notFound("Class not found");

	const html = buildClassRosterHtml({
		institution: {
			name: institution.name,
			city: institution.city,
			minesecCode: institution.minesecCode,
		},
		className: classRow.name,
		yearName: yearRows[0]?.name ?? academicYearId,
		students: items.map((row) => ({
			firstName: row.student.firstName,
			lastName: row.student.lastName,
			mnu: row.student.mnu,
			registrationNumber: row.student.registrationNumber,
		})),
	});

	const pdf = await htmlToPdf(html);
	const pdfBase64 = pdf.toString("base64");
	const filename = `liste_eleves_${classRow.name.toLowerCase().replace(/\s+/g, "_")}.pdf`;
	return { pdfBase64, filename };
}
