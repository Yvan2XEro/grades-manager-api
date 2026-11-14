import { DocumentPreviewDialog } from "@/components/callable/DocumentPreviewDialog";
import { downloadBase64 } from "@/lib/download";
import { trpcClient } from "@/utils/trpc";
import type { ExamItem, TeachingUnitItem } from "../types";
import type { ExportFilters, ExportTask } from "./use-export-task";

const openPreview = (title: string, html: string) =>
	DocumentPreviewDialog.call({
		title,
		description: "Prévisualisation HTML avant génération PDF",
		html,
	});

const downloadPdf = (result: { data: string; filename: string }) =>
	downloadBase64(result.data, result.filename, "application/pdf");

/** Small delay between downloads */
const pause = () => new Promise((resolve) => setTimeout(resolve, 500));

/**
 * Server-rendered documents (PV, evaluation, EC, UE): HTML preview in a
 * dialog, or PDF download.
 */
export function useGradePdfExports(
	{
		selectedYear,
		selectedClass,
		selectedSemester,
		includeRetakes,
	}: ExportFilters,
	{ run }: ExportTask,
) {
	const pvReady = !!selectedClass && !!selectedSemester && !!selectedYear;
	const pvInput = {
		classId: selectedClass,
		semesterId: selectedSemester,
		academicYearId: selectedYear,
	};
	// EC documents only need the class; year and semester narrow them down.
	const ecInput = (classCourseId: string) => ({
		classCourseId,
		classId: selectedClass,
		...(selectedSemester ? { semesterId: selectedSemester } : {}),
		...(selectedYear ? { academicYearId: selectedYear } : {}),
	});

	const previewPV = () => {
		if (!pvReady) return;
		return run(
			"preview-pv",
			async () => {
				const html = await trpcClient.exports.previewPV.query({
					...pvInput,
					includeRetakes,
				});
				openPreview(
					includeRetakes
						? "Prévisualisation - Procès-Verbal (avec rattrapages)"
						: "Prévisualisation - Procès-Verbal (sans rattrapages)",
					html,
				);
			},
			{
				log: "PV preview error",
				key: "admin.gradeExport.toast.pvPreviewError",
				defaultValue: "Could not generate PV preview",
			},
		);
	};

	const generatePV = () => {
		if (!pvReady) return;
		return run(
			"generate-pv",
			async () => {
				downloadPdf(
					await trpcClient.exports.generatePV.mutate({
						...pvInput,
						format: "pdf",
						includeRetakes,
					}),
				);
			},
			{
				log: "PV generation error",
				key: "admin.gradeExport.toast.pvGenerateError",
				defaultValue: "PV generation failed",
			},
		);
	};

	const previewEvaluation = (examId: string) =>
		run(
			`preview-eval-${examId}`,
			async () => {
				const html = await trpcClient.exports.previewEvaluation.query({
					examId,
				});
				openPreview("Prévisualisation - Publication Évaluation", html);
			},
			{
				log: "Evaluation preview error",
				key: "admin.gradeExport.toast.evaluationPreviewError",
				defaultValue: "Could not generate evaluation preview",
			},
		);

	const generateEvaluation = (examId: string) =>
		run(
			`generate-eval-${examId}`,
			async () => {
				downloadPdf(
					await trpcClient.exports.generateEvaluation.mutate({
						examId,
						format: "pdf",
					}),
				);
			},
			{
				log: "Evaluation generation error",
				key: "admin.gradeExport.toast.evaluationGenerateError",
				defaultValue: "Evaluation generation failed",
			},
		);

	const previewUE = (ueId: string) => {
		if (!pvReady) return;
		return run(
			`preview-ue-${ueId}`,
			async () => {
				const html = await trpcClient.exports.previewUE.query({
					teachingUnitId: ueId,
					...pvInput,
				});
				openPreview("Prévisualisation - Publication UE", html);
			},
			{
				log: "UE preview error",
				key: "admin.gradeExport.toast.uePreviewError",
				defaultValue: "Could not generate UE preview",
			},
		);
	};

	const generateUE = (ueId: string) => {
		if (!pvReady) return;
		return run(
			`generate-ue-${ueId}`,
			async () => {
				downloadPdf(
					await trpcClient.exports.generateUE.mutate({
						teachingUnitId: ueId,
						...pvInput,
						format: "pdf",
					}),
				);
			},
			{
				log: "UE generation error",
				key: "admin.gradeExport.toast.ueGenerateError",
				defaultValue: "UE generation failed",
			},
		);
	};

	// EC preview — calls exports.previewEc with the class_course context.
	// Eligibility (sum of percentages = 100%) is enforced server-side; if
	// the EC isn't fully evaluated, the toast surfaces the precise message.
	const previewEc = (classCourseId: string) => {
		if (!selectedClass) return;
		return run(
			`preview-ec-${classCourseId}`,
			async () => {
				const html = await trpcClient.exports.previewEc.query(
					ecInput(classCourseId),
				);
				openPreview("Prévisualisation - Publication EC", html);
			},
			{
				log: "EC preview error",
				key: "admin.gradeExport.toast.ecPreviewError",
				defaultValue: "Could not generate EC preview",
			},
		);
	};

	// EC PDF generation — same eligibility rule as the preview. On success
	// the PDF blob is materialized and downloaded with the server-suggested
	// filename (EC_<date>.pdf).
	const generateEc = (classCourseId: string) => {
		if (!selectedClass) return;
		return run(
			`generate-ec-${classCourseId}`,
			async () => {
				downloadPdf(
					await trpcClient.exports.generateEc.mutate({
						...ecInput(classCourseId),
						format: "pdf",
					}),
				);
			},
			{
				log: "EC generation error",
				key: "admin.gradeExport.toast.ecGenerateError",
				defaultValue: "EC generation failed",
			},
		);
	};

	const generateEvaluations = (exams: ExamItem[]) => {
		if (exams.length === 0) return;
		return run(
			"bulk-evaluations",
			async () => {
				for (const exam of exams) {
					downloadPdf(
						await trpcClient.exports.generateEvaluation.mutate({
							examId: exam.id,
							format: "pdf",
						}),
					);
					await pause();
				}
			},
			{
				log: "Bulk evaluations generation error",
				key: "admin.gradeExport.toast.bulkEvaluationsError",
				defaultValue: "Bulk evaluations generation failed",
			},
		);
	};

	const generateUEs = (teachingUnits: TeachingUnitItem[] | undefined) => {
		if (!teachingUnits || teachingUnits.length === 0 || !pvReady) return;
		return run(
			"bulk-ues",
			async () => {
				for (const ue of teachingUnits) {
					downloadPdf(
						await trpcClient.exports.generateUE.mutate({
							teachingUnitId: ue.id,
							...pvInput,
							format: "pdf",
						}),
					);
					await pause();
				}
			},
			{
				log: "Bulk UEs generation error",
				key: "admin.gradeExport.toast.bulkUesError",
				defaultValue: "Bulk UE generation failed",
			},
		);
	};

	return {
		pvReady,
		previewPV,
		generatePV,
		previewEvaluation,
		generateEvaluation,
		previewUE,
		generateUE,
		previewEc,
		generateEc,
		generateEvaluations,
		generateUEs,
	};
}
