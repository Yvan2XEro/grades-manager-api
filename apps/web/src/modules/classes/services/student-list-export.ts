import type { TFunction } from "i18next";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { downloadBase64, fileDateStamp } from "@/lib/download";
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";
import type { ClassRow } from "../types";

/** Institution header and alphabetical student rows of a class list. */
async function loadStudentList(cls: ClassRow, t: TFunction) {
	const [institution, students] = await Promise.all([
		trpcClient.institutions.get.query(),
		trpcClient.students.list.query({ classId: cls.id, limit: 1000 }),
	]);
	const sorted = [...students.items].sort(
		(a, b) =>
			(a.profile.lastName ?? "").localeCompare(b.profile.lastName ?? "") ||
			(a.profile.firstName ?? "").localeCompare(b.profile.firstName ?? ""),
	);
	const gender = (value?: string | null) =>
		value === "male"
			? t("common.gender.male", { defaultValue: "M" })
			: value === "female"
				? t("common.gender.female", { defaultValue: "F" })
				: "-";
	return {
		institutionName:
			institution?.nameFr || institution?.nameEn || "Institution",
		shortName: institution?.shortName ?? "",
		head: [
			"#",
			t("admin.students.table.registrationNumber", {
				defaultValue: "Reg. Number",
			}),
			t("admin.students.table.lastName", { defaultValue: "Last Name" }),
			t("admin.students.table.firstName", { defaultValue: "First Name" }),
			t("admin.students.table.dateOfBirth", { defaultValue: "Birth Date" }),
			t("admin.students.table.gender", { defaultValue: "Gender" }),
		],
		rows: sorted.map((student, index) => [
			index + 1,
			student.registrationNumber || "-",
			student.profile.lastName,
			student.profile.firstName,
			student.profile.dateOfBirth
				? new Date(student.profile.dateOfBirth).toLocaleDateString()
				: "-",
			gender(student.profile.gender),
		]),
		info: [
			`${t("admin.classes.table.name")}: ${cls.name}`,
			`${t("admin.classes.table.code")}: ${cls.code}`,
			`${t("admin.classes.table.program")}: ${cls.program.name}`,
			`${t("admin.classes.table.academicYear")}: ${cls.academicYear.name}`,
			`${t("admin.classes.export.totalStudents", { defaultValue: "Total students" })}: ${sorted.length}`,
		],
	};
}

/** Basic jsPDF list, used when the institution's template cannot be rendered. */
async function exportBasicPdf(cls: ClassRow, t: TFunction) {
	const list = await loadStudentList(cls, t);
	const doc = new jsPDF();
	doc.setFontSize(16);
	doc.setFont("helvetica", "bold");
	doc.text(list.institutionName, 105, 20, { align: "center" });
	doc.setFontSize(10);
	doc.setFont("helvetica", "normal");
	if (list.shortName) doc.text(list.shortName, 105, 27, { align: "center" });
	doc.setFontSize(14);
	doc.setFont("helvetica", "bold");
	doc.text(
		t("admin.classes.export.title", { defaultValue: "Student List" }),
		105,
		40,
		{
			align: "center",
		},
	);
	doc.setFontSize(11);
	doc.setFont("helvetica", "normal");
	list.info.forEach((line, i) => doc.text(line, 14, 50 + i * 6));
	autoTable(doc, {
		head: [list.head],
		body: list.rows,
		startY: 82,
		styles: { fontSize: 9, cellPadding: 2 },
		headStyles: { fillColor: [41, 128, 185], fontStyle: "bold" },
		alternateRowStyles: { fillColor: [245, 245, 245] },
	});
	const pageCount = doc.getNumberOfPages();
	for (let i = 1; i <= pageCount; i++) {
		doc.setPage(i);
		doc.setFontSize(8);
		doc.text(
			`${t("admin.classes.export.page", { defaultValue: "Page" })} ${i}/${pageCount}`,
			105,
			290,
			{ align: "center" },
		);
		doc.text(
			`${t("admin.classes.export.generatedOn", { defaultValue: "Generated on" })}: ${new Date().toLocaleString()}`,
			14,
			290,
		);
	}
	doc.save(`students_${cls.code}_${fileDateStamp()}.pdf`);
}

/**
 * Renders the class list through the institution's `student_list` template
 * (centre variant when the program belongs to a centre); falls back to a
 * basic jsPDF list when the template pipeline fails.
 */
export async function exportStudentListPdf(cls: ClassRow, t: TFunction) {
	try {
		const result =
			await trpcClient.academicDocuments.generateStudentList.mutate({
				classId: cls.id,
				format: "pdf",
				demoMode: false,
			});
		downloadBase64(result.data, result.filename, result.mimeType);
		const template = (
			result as {
				usedTemplate?: { name: string; variant: "standard" | "center" };
			}
		).usedTemplate;
		toast.success(
			template
				? `Modèle utilisé : ${template.name}${template.variant === "center" ? " (centre)" : ""}`
				: t("admin.classes.export.success", {
						defaultValue: "Student list exported successfully",
					}),
		);
		return;
	} catch (err) {
		console.warn(
			"[exportStudentListPdf] template pipeline failed, using jsPDF",
			err,
		);
		toast.warning(
			`Le modèle officiel n'a pas pu être rendu (${err instanceof Error ? err.message : "erreur inconnue"}). Génération basique via jsPDF.`,
		);
	}
	try {
		await exportBasicPdf(cls, t);
		toast.success(
			t("admin.classes.export.success", {
				defaultValue: "Student list exported successfully",
			}),
		);
	} catch (error) {
		console.error("Error exporting PDF:", error);
		toast.error(
			t("admin.classes.export.error", {
				defaultValue: "Failed to export student list",
			}),
		);
	}
}

export async function exportStudentListExcel(cls: ClassRow, t: TFunction) {
	try {
		const list = await loadStudentList(cls, t);
		const header = [
			[list.institutionName],
			[list.shortName],
			[],
			[t("admin.classes.export.title", { defaultValue: "Student List" })],
			[],
			...list.info.map((line) => [line]),
			[],
			list.head,
		];
		const worksheet = XLSX.utils.aoa_to_sheet([...header, ...list.rows]);
		worksheet["!cols"] = [
			{ wch: 5 },
			{ wch: 15 },
			{ wch: 20 },
			{ wch: 20 },
			{ wch: 12 },
			{ wch: 8 },
		];
		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(
			workbook,
			worksheet,
			t("admin.classes.export.sheetName", { defaultValue: "Students" }),
		);
		XLSX.writeFile(workbook, `students_${cls.code}_${fileDateStamp()}.xlsx`);
		toast.success(
			t("admin.classes.export.excelSuccess", {
				defaultValue: "Student list exported successfully",
			}),
		);
	} catch (error) {
		console.error("Error exporting Excel:", error);
		toast.error(
			t("admin.classes.export.excelError", {
				defaultValue: "Failed to export student list",
			}),
		);
	}
}
