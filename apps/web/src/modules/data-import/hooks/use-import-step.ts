import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { downloadBase64 } from "@/lib/download";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";
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
export function useImportStep(step: string) {
	const queryClient = useQueryClient();
	const [phase, setPhase] = useState<WizardPhase>("prepare");
	const [fileName, setFileName] = useState<string | null>(null);
	const [jobId, setJobId] = useState<string | null>(null);
	const [preview, setPreview] = useState<StepPreview | null>(null);

	const definition = useQuery(trpc.dataImport.step.queryOptions({ step }));

	const template = useMutation({
		mutationFn: () => trpcClient.dataImport.template.query({ step }),
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
			return trpcClient.batchJobs.preview.mutate({
				type: "import.step",
				params: { step, fileId },
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
				toast.error(
					"L'import ne s'est pas terminé correctement. Consultez le détail du traitement.",
				);
				return;
			}
			setPhase("done");
			queryClient.invalidateQueries(trpc.dataImport.overview.queryFilter());
		},
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
	};
}
