import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { createCallable } from "react-call";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { DIALOG_EXIT_MS } from "@/components/callable/callable-dialog";
import { toast } from "@/lib/toast";
import { AcademicYearSelect } from "../../components/inputs/AcademicYearSelect";
import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";
import {
	Dialog,
	DialogBody,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { trpcClient } from "../../utils/trpc";

interface Props {
	targetYear: { id: string; name: string };
}

type PreviewData = {
	jobId: string;
	steps: Array<{ name: string; itemsTotal: number }>;
	summary: {
		sourceYearName: string;
		targetYearName: string;
		classCount: number;
		classCourseCount: number;
		sessionCount: number;
	};
};

/**
 * Previews then runs the "academic year setup" batch job that copies classes
 * (and optionally the timetable) from a source year. Resolves with the job id
 * once started, or `undefined` when dismissed.
 */
export const AcademicYearSetupDialog = createCallable<
	Props,
	string | undefined
>(({ call, targetYear }) => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [sourceYearId, setSourceYearId] = useState<string | null>(null);
	const [includeTimetable, setIncludeTimetable] = useState(false);
	const [previewData, setPreviewData] = useState<PreviewData | null>(null);

	const previewMutation = useMutation({
		mutationFn: () =>
			trpcClient.batchJobs.preview.mutate({
				type: "academicYear.setup",
				params: {
					sourceAcademicYearId: sourceYearId!,
					targetAcademicYearId: targetYear.id,
					includeTimetable,
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
			toast.success(t("admin.academicYears.setup.success"));
			queryClient.invalidateQueries({ queryKey: ["batchJobs"] });
			call.end(previewData?.jobId);
			navigate(`/admin/batch-jobs/${previewData?.jobId}`);
		},
		onError: (err) => toast.error((err as Error).message),
	});

	const busy = previewMutation.isPending || runMutation.isPending;

	return (
		<Dialog
			open={!call.ended}
			onOpenChange={(o) => !o && !busy && call.end(undefined)}
		>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>{t("admin.academicYears.setup.title")}</DialogTitle>
					<DialogDescription>
						{t("admin.academicYears.setup.description")}
					</DialogDescription>
				</DialogHeader>

				<DialogBody className="px-6 pb-4">
					{!previewData ? (
						<div className="space-y-4">
							<div className="space-y-2">
								<Label>{t("admin.academicYears.setup.sourceYear")}</Label>
								<AcademicYearSelect
									value={sourceYearId}
									onChange={setSourceYearId}
									autoSelectActive={false}
									placeholder={t(
										"admin.academicYears.setup.sourceYearPlaceholder",
									)}
									excludeIds={[targetYear.id]}
								/>
							</div>
							<div className="flex items-center gap-2 pt-1">
								<Checkbox
									id="include-timetable"
									checked={includeTimetable}
									onCheckedChange={(v) => setIncludeTimetable(!!v)}
								/>
								<label
									htmlFor="include-timetable"
									className="cursor-pointer text-sm"
								>
									{t("admin.academicYears.setup.includeTimetable")}
								</label>
							</div>
						</div>
					) : (
						<div className="space-y-4">
							<p className="text-sm">
								{t("admin.academicYears.setup.previewSummary", {
									classCount: previewData.summary.classCount,
									classCourseCount: previewData.summary.classCourseCount,
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

							{includeTimetable && previewData.summary.sessionCount > 0 && (
								<p className="text-muted-foreground text-sm">
									{t("admin.academicYears.setup.timetableSummary", {
										count: previewData.summary.sessionCount,
									})}
								</p>
							)}
						</div>
					)}
				</DialogBody>

				<DialogFooter>
					<Button
						variant="outline"
						disabled={busy}
						onClick={() => call.end(undefined)}
					>
						{t("common.actions.cancel")}
					</Button>
					{!previewData ? (
						<Button
							onClick={() => previewMutation.mutate()}
							disabled={!sourceYearId || previewMutation.isPending}
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
							{t("admin.academicYears.setup.confirm")}
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}, DIALOG_EXIT_MS);
