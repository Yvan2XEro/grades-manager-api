import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { getServerUrl } from "@/lib/runtime-config";
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";
import { batchJobType, type ImportType, type PreviewSummary } from "../types";

/** Upload → preview (batch job dry-run) → run, for one import type. */
export function useImportFlow(type: ImportType) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const inputRef = useRef<HTMLInputElement>(null);
	const [fileName, setFileName] = useState<string | null>(null);
	const [jobId, setJobId] = useState<string | null>(null);
	const [previewSummary, setPreviewSummary] = useState<PreviewSummary | null>(
		null,
	);

	const templateUrl = `${getServerUrl()}/api/import/template/${type}`;

	const uploadMutation = useMutation({
		mutationFn: async (file: File) => {
			const form = new FormData();
			form.append("file", file);
			const res = await fetch(`${getServerUrl()}/api/import/upload`, {
				method: "POST",
				body: form,
				credentials: "include",
			});
			if (!res.ok) {
				const err = await res.json().catch(() => ({ error: "Upload failed" }));
				throw new Error((err as { error?: string }).error ?? "Upload failed");
			}
			return res.json() as Promise<{ fileId: string }>;
		},
		onSuccess: (data) => {
			toast.success(t("admin.dataImport.toast.uploadOk"));
			previewMutation.mutate(data.fileId);
		},
		onError: (err) => toast.error((err as Error).message),
	});

	const previewMutation = useMutation({
		mutationFn: (fId: string) =>
			trpcClient.batchJobs.preview.mutate({
				type: batchJobType[type],
				params: { fileId: fId },
			}),
		onSuccess: (data) => {
			setJobId(data.id);
			setPreviewSummary((data.previewResult ?? {}) as PreviewSummary);
		},
		onError: (err) => toast.error((err as Error).message),
	});

	const runMutation = useMutation({
		mutationFn: () => trpcClient.batchJobs.run.mutate({ jobId: jobId! }),
		onSuccess: () => {
			toast.success(t("admin.dataImport.toast.importStarted"));
			navigate(`/batch-jobs/${jobId}`);
		},
		onError: (err) => toast.error((err as Error).message),
	});

	const selectFile = (file: File | undefined) => {
		if (!file) return;
		setFileName(file.name);
		setJobId(null);
		setPreviewSummary(null);
		uploadMutation.mutate(file);
	};

	const reset = () => {
		setFileName(null);
		setJobId(null);
		setPreviewSummary(null);
		if (inputRef.current) inputRef.current.value = "";
	};

	const errors = previewSummary?.errors ?? [];
	const warnings = previewSummary?.warnings ?? [];
	const summaryEntries = previewSummary
		? Object.entries(previewSummary).filter(
				([k]) => k !== "errors" && k !== "warnings",
			)
		: [];

	return {
		inputRef,
		templateUrl,
		fileName,
		jobId,
		previewSummary,
		errors,
		warnings,
		summaryEntries,
		hasBlockingErrors: errors.length > 0,
		isUploading: uploadMutation.isPending,
		isLoading: uploadMutation.isPending || previewMutation.isPending,
		isRunning: runMutation.isPending,
		selectFile,
		reset,
		run: () => runMutation.mutate(),
	};
}
