import type { TFunction } from "i18next";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { formatDate } from "@/lib/date-format";
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
			? t("common.gender.male")
			: value === "female"
				? t("common.gender.female")
				: "-";
	return {
		institutionName:
			institution?.nameFr ||
			institution?.nameEn ||
			t("admin.classes.export.institutionFallback"),
		shortName: institution?.shortName ?? "",
		head: [
			"#",
			t("admin.students.table.registrationNumber"),
			t("admin.students.table.lastName"),
			t("admin.students.table.firstName"),
			t("admin.students.table.dateOfBirth"),
			t("admin.students.table.gender"),
		],
		rows: sorted.map((student, index) => [
			index + 1,
			student.registrationNumber || "-",
			student.profile.lastName,
			student.profile.firstName,
			student.profile.dateOfBirth
				? formatDate(student.profile.dateOfBirth, "P")
				: "-",
			gender(student.profile.gender),
		]),
		info: [
			`${t("admin.classes.table.name")}: ${cls.name}`,
			`${t("admin.classes.table.code")}: ${cls.code}`,
			`${t("admin.classes.table.program")}: ${cls.program.name}`,
			`${t("admin.classes.table.academicYear")}: ${cls.academicYear.name}`,
			`${t("admin.classes.export.totalStudents")}: ${sorted.length}`,
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
	doc.text(t("admin.classes.export.title"), 105, 40, {
		align: "center",
	});
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
		doc.text(`${t("admin.classes.export.page")} ${i}/${pageCount}`, 105, 290, {
			align: "center",
		});
		doc.text(
			`${t("admin.classes.export.generatedOn")}: ${formatDate(new Date(), "Pp")}`,
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
				? t(
						template.variant === "center"
							? "admin.classes.export.templateUsedCenter"
							: "admin.classes.export.templateUsed",
						{ name: template.name },
					)
				: t("admin.classes.export.success"),
		);
		return;
	} catch (err) {
		console.warn(
			"[exportStudentListPdf] template pipeline failed, using jsPDF",
			err,
		);
		toast.warning(
			t("admin.classes.export.templateFallback", {
				error: err instanceof Error ? err.message : t("common.errors.unknown"),
			}),
		);
	}
	try {
		await exportBasicPdf(cls, t);
		toast.success(t("admin.classes.export.success"));
	} catch (error) {
		console.error("Error exporting PDF:", error);
		toast.error(t("admin.classes.export.error"));
	}
}

export async function exportStudentListExcel(cls: ClassRow, t: TFunction) {
	try {
		const list = await loadStudentList(cls, t);
		const header = [
			[list.institutionName],
			[list.shortName],
			[],
			[t("admin.classes.export.title")],
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
			t("admin.classes.export.sheetName"),
		);
		XLSX.writeFile(workbook, `students_${cls.code}_${fileDateStamp()}.xlsx`);
		toast.success(t("admin.classes.export.excelSuccess"));
	} catch (error) {
		console.error("Error exporting Excel:", error);
		toast.error(t("admin.classes.export.excelError"));
	}
}
