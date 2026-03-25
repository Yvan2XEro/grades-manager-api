import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { AcademicYearSelect } from "../../../components/inputs/AcademicYearSelect";
import { Button } from "../../../components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../../../components/ui/dialog";
import { Label } from "../../../components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../../components/ui/select";
import { trpcClient } from "../../../utils/trpc";

interface CreateBatchJobDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const JOB_TYPES = [
	"creditLedger.recompute",
	"studentFacts.refreshClass",
] as const;

export function CreateBatchJobDialog({
	open,
	onOpenChange,
}: CreateBatchJobDialogProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	const [jobType, setJobType] = useState<string>("");
	const [academicYearId, setAcademicYearId] = useState("");
	const [classId, setClassId] = useState("");
	const [previewData, setPreviewData] = useState<{
		jobId: string;
		steps: Array<{ name: string; itemsTotal: number }>;
		previewResult: Record<string, unknown>;
	} | null>(null);

	const classesQuery = useQuery({
		queryKey: ["classes"],
		queryFn: async () => {
			const { items } = await trpcClient.classes.list.query({});
			return items;
		},
		enabled: open,
	});

	const previewMutation = useMutation({
		mutationFn: (params: { type: string; params: Record<string, unknown> }) =>
			trpcClient.batchJobs.preview.mutate({
				type: params.type as
					| "creditLedger.recompute"
					| "studentFacts.refreshClass",
				params: params.params,
			}),
		onSuccess: (data) => {
			toast.success(t("admin.batchJobs.toast.previewSuccess"));
			setPreviewData({
				jobId: data.id,
				steps: data.steps.map((s) => ({
					name: s.name,
					itemsTotal: s.itemsTotal ?? 0,
				})),
				previewResult: (data.previewResult ?? {}) as Record<string, unknown>,
			});
		},
		onError: (err) => toast.error((err as Error).message),
	});

	const runMutation = useMutation({
		mutationFn: (jobId: string) => trpcClient.batchJobs.run.mutate({ jobId }),
		onSuccess: () => {
			toast.success(t("admin.batchJobs.toast.runSuccess"));
			queryClient.invalidateQueries({ queryKey: ["batchJobs"] });
			handleClose();
		},
		onError: (err) => toast.error((err as Error).message),
	});

	function handleClose() {
		setJobType("");
		setAcademicYearId("");
		setClassId("");
		setPreviewData(null);
		onOpenChange(false);
	}

	function buildParams(): Record<string, unknown> {
		const params: Record<string, unknown> = {};
		if (academicYearId) params.academicYearId = academicYearId;
		if (classId) params.classId = classId;
		return params;
	}

	function handlePreview() {
		if (!jobType) return;
		previewMutation.mutate({ type: jobType, params: buildParams() });
	}

	function handleRun() {
		if (!previewData) return;
		runMutation.mutate(previewData.jobId);
	}

	const classes = classesQuery.data ?? [];

	return (
		<Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>
						{previewData
							? t("admin.batchJobs.preview.title")
							: t("admin.batchJobs.actions.create")}
					</DialogTitle>
				</DialogHeader>

				<div className="px-6 pb-4">
					{!previewData ? (
						<div className="space-y-4">
							{/* Job type selection */}
							<div className="space-y-2">
								<Label>{t("admin.batchJobs.fields.jobType")}</Label>
								<Select value={jobType} onValueChange={setJobType}>
									<SelectTrigger>
										<SelectValue placeholder="Select a job type..." />
									</SelectTrigger>
									<SelectContent>
										{JOB_TYPES.map((type) => (
											<SelectItem key={type} value={type}>
												{t(`admin.batchJobs.types.${type}`, {
													defaultValue: type,
												})}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							{/* Academic year */}
							{jobType && (
								<div className="space-y-2">
									<Label>{t("admin.batchJobs.fields.academicYear")}</Label>
									<AcademicYearSelect
										value={academicYearId || null}
										onChange={setAcademicYearId}
										autoSelectActive
									/>
								</div>
							)}

							{/* Class (optional for creditLedger, required for studentFacts) */}
							{jobType && (
								<div className="space-y-2">
									<Label>
										{t("admin.batchJobs.fields.class")}{" "}
										{jobType !== "studentFacts.refreshClass" &&
											`(${t("common.optional")})`}
									</Label>
									<Select value={classId} onValueChange={setClassId}>
										<SelectTrigger>
											<SelectValue placeholder="Select class..." />
										</SelectTrigger>
										<SelectContent>
											{classes.map((c) => (
												<SelectItem key={c.id} value={c.id}>
													{c.name} ({c.code})
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							)}
						</div>
					) : (
						/* Preview result */
						<div className="space-y-4">
							{/* Summary */}
							<div className="rounded-lg border bg-muted/50 p-4">
								<h4 className="mb-2 font-medium text-sm">
									{t("admin.batchJobs.preview.summary")}
								</h4>
								<dl className="space-y-1 text-sm">
									{Object.entries(previewData.previewResult).map(
										([key, value]) => (
											<div key={key} className="flex justify-between">
												<dt className="text-muted-foreground">{key}</dt>
												<dd className="font-medium">{String(value)}</dd>
											</div>
										),
									)}
								</dl>
							</div>

							{/* Steps */}
							<div>
								<h4 className="mb-2 font-medium text-sm">
									{t("admin.batchJobs.preview.steps")}
								</h4>
								<div className="space-y-2">
									{previewData.steps.map((step, i) => (
										<div
											key={i}
											className="flex items-center justify-between rounded-lg border p-3"
										>
											<span className="text-sm">
												{i + 1}. {step.name}
											</span>
											<span className="text-muted-foreground text-xs">
												{step.itemsTotal} items
											</span>
										</div>
									))}
								</div>
							</div>

							<p className="text-amber-600 text-sm">
								{t("admin.batchJobs.preview.confirmRun")}
							</p>
						</div>
					)}
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={handleClose}>
						{t("common.actions.cancel")}
					</Button>
					{!previewData ? (
						<Button
							onClick={handlePreview}
							disabled={
								!jobType ||
								!academicYearId ||
								(jobType === "studentFacts.refreshClass" && !classId) ||
								previewMutation.isPending
							}
						>
							{previewMutation.isPending && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							{t("admin.batchJobs.actions.preview")}
						</Button>
					) : (
						<Button onClick={handleRun} disabled={runMutation.isPending}>
							{runMutation.isPending && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							{t("admin.batchJobs.actions.confirm")}
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
