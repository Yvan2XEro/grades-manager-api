import { useMutation } from "@tanstack/react-query";
import { Download, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { getServerUrl } from "@/lib/runtime-config";
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";
import { PreviewTable } from "./PreviewTable";

type ImportType =
	| "academic-structure"
	| "people"
	| "enrollments"
	| "grades-bulk";

interface Props {
	type: ImportType;
	prereqHint?: string;
}

type PreviewSummary = {
	errors?: Array<{ row: number; col?: string; message: string }>;
	warnings?: Array<{ row: number; col?: string; message: string }>;
	[key: string]: unknown;
};

const batchJobType = {
	"academic-structure": "import.academicStructure",
	people: "import.people",
	enrollments: "import.enrollments",
	"grades-bulk": "import.gradesBulk",
} as const;

export function ImportSection({ type, prereqHint }: Props) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const inputRef = useRef<HTMLInputElement>(null);
	const [fileId, setFileId] = useState<string | null>(null);
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
			setFileId(data.fileId);
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
			navigate(`/admin/batch-jobs/${jobId}`);
		},
		onError: (err) => toast.error((err as Error).message),
	});

	function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;
		setFileName(file.name);
		setFileId(null);
		setJobId(null);
		setPreviewSummary(null);
		uploadMutation.mutate(file);
	}

	function handleDrop(e: React.DragEvent) {
		e.preventDefault();
		const file = e.dataTransfer.files[0];
		if (!file) return;
		setFileName(file.name);
		setFileId(null);
		setJobId(null);
		setPreviewSummary(null);
		uploadMutation.mutate(file);
	}

	function reset() {
		setFileId(null);
		setFileName(null);
		setJobId(null);
		setPreviewSummary(null);
		if (inputRef.current) inputRef.current.value = "";
	}

	const errors = previewSummary?.errors ?? [];
	const warnings = previewSummary?.warnings ?? [];
	const hasBlockingErrors = errors.length > 0;
	const isLoading = uploadMutation.isPending || previewMutation.isPending;

	const summaryEntries = previewSummary
		? Object.entries(previewSummary).filter(
				([k]) => k !== "errors" && k !== "warnings",
			)
		: [];

	return (
		<div className="space-y-5">
			{prereqHint && (
				<p className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-blue-800 text-sm dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
					{prereqHint}
				</p>
			)}

			{/* Template download */}
			<div className="flex items-center justify-between rounded-lg border p-4">
				<div>
					<p className="font-medium text-sm">Modèle Excel</p>
					<p className="text-muted-foreground text-xs">
						{t("admin.dataImport.uploadZoneAccept")}
					</p>
				</div>
				<Button variant="outline" size="sm" asChild>
					<a href={templateUrl} download>
						<Download className="mr-2 h-4 w-4" />
						{t("admin.dataImport.downloadTemplate")}
					</a>
				</Button>
			</div>

			{/* Drop zone */}
			<div
				className="cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors hover:border-primary hover:bg-accent/30"
				onClick={() => inputRef.current?.click()}
				onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
				role="button"
				tabIndex={0}
				onDragOver={(e) => e.preventDefault()}
				onDrop={handleDrop}
			>
				<Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
				<p className="text-sm">
					{fileName ? (
						<span className="font-medium">{fileName}</span>
					) : (
						t("admin.dataImport.uploadZone")
					)}
				</p>
				<p className="mt-1 text-muted-foreground text-xs">
					{t("admin.dataImport.uploadZoneAccept")}
				</p>
				<input
					ref={inputRef}
					type="file"
					accept=".xlsx,.csv"
					className="hidden"
					onChange={handleFileChange}
				/>
			</div>

			{/* Loading */}
			{isLoading && (
				<p className="animate-pulse text-center text-muted-foreground text-sm">
					{uploadMutation.isPending
						? t("admin.dataImport.uploading")
						: t("admin.dataImport.previewing")}
				</p>
			)}

			{/* Preview results */}
			{previewSummary && !isLoading && (
				<div className="space-y-3">
					{summaryEntries.length > 0 && (
						<div className="flex flex-wrap gap-2">
							{summaryEntries.map(([k, v]) => (
								<span
									key={k}
									className="rounded-full border bg-muted px-3 py-0.5 text-xs"
								>
									{k}: <strong>{String(v)}</strong>
								</span>
							))}
						</div>
					)}
					<PreviewTable
						rows={errors}
						label={t("admin.dataImport.preview.errors", {
							count: errors.length,
						})}
						variant="error"
					/>
					<PreviewTable
						rows={warnings}
						label={t("admin.dataImport.preview.warnings", {
							count: warnings.length,
						})}
						variant="warning"
					/>
					{!hasBlockingErrors && (
						<p className="text-green-700 text-sm dark:text-green-400">
							✓ {t("admin.dataImport.preview.noErrors")}
						</p>
					)}
				</div>
			)}

			{/* Actions */}
			{previewSummary && !isLoading && (
				<div className="flex gap-2">
					<Button variant="outline" onClick={reset} size="sm">
						{t("admin.dataImport.newFile")}
					</Button>
					<Button
						onClick={() => runMutation.mutate()}
						disabled={hasBlockingErrors || runMutation.isPending || !jobId}
						size="sm"
					>
						{hasBlockingErrors
							? t("admin.dataImport.errorBlocker")
							: t("admin.dataImport.confirm")}
					</Button>
				</div>
			)}
		</div>
	);
}
