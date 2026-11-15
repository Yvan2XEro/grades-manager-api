import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { downloadBase64 } from "@/lib/download";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";
import { issueText } from "../components/issues-table";
import { G } from "../services/import-steps";
import type { StepPreview } from "../types";

export type WizardPhase = "prepare" | "review" | "done";

const readAsBase64 = (file: File) =>
	new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
		reader.onerror = () => reject(reader.error);
		reader.readAsDataURL(file);
	});

/**
 * One step of the guided import: download the pre-filled template, upload the
 * filled workbook, review the validation, then import the valid rows.
 */
export function useImportStep(step: string, academicYearId?: string) {
	const queryClient = useQueryClient();
	const { t } = useTranslation();
	const [phase, setPhase] = useState<WizardPhase>("prepare");
	const [fileName, setFileName] = useState<string | null>(null);
	const [fileId, setFileId] = useState<string | null>(null);
	const [jobId, setJobId] = useState<string | null>(null);
	const [preview, setPreview] = useState<StepPreview | null>(null);

	const definition = useQuery(trpc.dataImport.step.queryOptions({ step }));

	const template = useMutation({
		mutationFn: () =>
			trpcClient.dataImport.template.query({ step, academicYearId }),
		onSuccess: (file) =>
			downloadBase64(file.data, file.filename, file.mimeType),
		onError: (error) => toast.error(error.message),
	});

	const analyze = useMutation({
		mutationFn: async (file: File) => {
			const { fileId } = await trpcClient.dataImport.upload.mutate({
				name: file.name,
				data: await readAsBase64(file),
			});
			setFileId(fileId);
			return trpcClient.batchJobs.preview.mutate({
				type: "import.step",
				params: { step, fileId, academicYearId },
			});
		},
		onSuccess: (job) => {
			setJobId(job.id);
			setPreview(job.previewResult as unknown as StepPreview);
			setPhase("review");
		},
		onError: (error) => toast.error(error.message),
	});

	const run = useMutation({
		mutationFn: () => trpcClient.batchJobs.run.mutate({ jobId: jobId! }),
		onSuccess: (job) => {
			if (job?.status !== "completed") {
				toast.error(t(`${G}runFailed`));
				return;
			}
			setPhase("done");
			queryClient.invalidateQueries(trpc.dataImport.overview.queryFilter());
		},
		onError: (error) => toast.error(error.message),
	});

	const annotate = useMutation({
		mutationFn: () =>
			trpcClient.dataImport.annotate.mutate({
				fileId: fileId!,
				notes: (preview?.issues ?? [])
					.filter((issue) => issue.row > 0)
					.map((issue) => ({
						sheet: issue.sheet,
						row: issue.row,
						column: issue.column,
						level: issue.level,
						text: issueText(issue, t),
					})),
			}),
		onSuccess: (file) =>
			downloadBase64(
				file.data,
				t(`${G}review.annotatedName`, {
					name: (fileName ?? "import.xlsx").replace(/\.xlsx$/i, ""),
				}),
				file.mimeType,
			),
		onError: (error) => toast.error(error.message),
	});

	const selectFile = (file: File) => {
		setFileName(file.name);
		analyze.mutate(file);
	};

	const restart = () => {
		setPhase("prepare");
		setFileName(null);
		setJobId(null);
		setPreview(null);
	};

	const issues = preview?.issues ?? [];
	const errorRows = new Set(
		issues.filter((i) => i.level === "error").map((i) => `${i.sheet}|${i.row}`),
	);
	const toImport =
		preview?.sheets.reduce((n, s) => n + s.create + s.update, 0) ?? 0;

	return {
		phase,
		definition: definition.data,
		fileName,
		jobId,
		preview,
		issues,
		errorRowCount: errorRows.size,
		toImport,
		downloadTemplate: () => template.mutate(),
		isDownloading: template.isPending,
		selectFile,
		isAnalyzing: analyze.isPending,
		run: () => run.mutate(),
		isRunning: run.isPending,
		restart,
		downloadAnnotated: () => annotate.mutate(),
		isAnnotating: annotate.isPending,
	};
}
