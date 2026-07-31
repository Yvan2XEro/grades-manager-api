import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogBody,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	currentYearId: string | null;
	currentYearName?: string | null;
}

type PreviewData = {
	jobId: string;
	steps: Array<{ name: string; itemsTotal: number }>;
	summary: {
		sourceYearName: string;
		targetYearName: string;
		sessionCount: number;
	};
};

export function CopyTimetableDialog({
	open,
	onOpenChange,
	currentYearId,
	currentYearName,
}: Props) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [sourceYearId, setSourceYearId] = useState<string | null>(null);
	const [previewData, setPreviewData] = useState<PreviewData | null>(null);

	const previewMutation = useMutation({
		mutationFn: () =>
			trpcClient.batchJobs.preview.mutate({
				type: "timetable.copyFromYear",
				params: {
					sourceAcademicYearId: sourceYearId!,
					targetAcademicYearId: currentYearId!,
				},
			}),
		onSuccess: (data) => {
			setPreviewData({
				jobId: data.id,
				steps: data.steps.map((s) => ({
					name: s.name,
					itemsTotal: s.itemsTotal ?? 0,
				})),
				summary: (data.previewResult ?? {}) as PreviewData["summary"],
			});
		},
		onError: (err) => toast.error((err as Error).message),
	});

	const runMutation = useMutation({
		mutationFn: (jobId: string) => trpcClient.batchJobs.run.mutate({ jobId }),
		onSuccess: () => {
			toast.success(t("admin.timetable.copyDialog.success"));
			handleClose();
			navigate(`/admin/batch-jobs/${previewData?.jobId}`);
		},
		onError: (err) => toast.error((err as Error).message),
	});

	function handleClose() {
		setSourceYearId(null);
		setPreviewData(null);
		onOpenChange(false);
	}

	return (
		<Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>{t("admin.timetable.copyDialog.title")}</DialogTitle>
					<DialogDescription>
						{t("admin.timetable.copyDialog.description")}
					</DialogDescription>
				</DialogHeader>

				<DialogBody className="px-6 pb-4">
					{!previewData ? (
						<div className="space-y-4">
							<div className="space-y-2">
								<Label>{t("admin.timetable.copyDialog.sourceYear")}</Label>
								<AcademicYearSelect
									value={sourceYearId}
									onChange={setSourceYearId}
									autoSelectActive={false}
									placeholder={t(
										"admin.timetable.copyDialog.sourceYearPlaceholder",
									)}
									excludeIds={currentYearId ? [currentYearId] : []}
								/>
							</div>
							{currentYearName && (
								<p className="text-muted-foreground text-sm">
									→ {currentYearName}
								</p>
							)}
						</div>
					) : (
						<div className="space-y-4">
							<p className="text-sm">
								{t("admin.timetable.copyDialog.previewSummary", {
									count: previewData.summary.sessionCount,
									sourceYearName: previewData.summary.sourceYearName,
									targetYearName: previewData.summary.targetYearName,
								})}
							</p>
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
					)}
				</DialogBody>

				<DialogFooter>
					<Button variant="outline" onClick={handleClose}>
						{t("common.actions.cancel")}
					</Button>
					{!previewData ? (
						<Button
							onClick={() => previewMutation.mutate()}
							disabled={
								!sourceYearId || !currentYearId || previewMutation.isPending
							}
						>
							{previewMutation.isPending && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							{t("admin.batchJobs.actions.preview")}
						</Button>
					) : (
						<Button
							onClick={() => runMutation.mutate(previewData.jobId)}
							disabled={runMutation.isPending}
						>
							{runMutation.isPending && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							{t("admin.timetable.copyDialog.confirm")}
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
