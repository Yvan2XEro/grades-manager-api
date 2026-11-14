import { Loader2, Play, RefreshCcw } from "lucide-react";
import { createCallable } from "react-call";
import { useTranslation } from "react-i18next";
import { DIALOG_EXIT_MS } from "@/components/callable/callable-dialog";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useScheduleExams } from "../hooks/use-exam-scheduler";
import type { SessionMode } from "../types";
import { ScheduleClassesPanel } from "./schedule-classes-panel";
import { ScheduleExamsSettings } from "./schedule-exams-settings";
import { ScheduleRetakeExamsPanel } from "./schedule-retake-exams-panel";

/**
 * Schedules a normal exam session (one exam per class course of the selected
 * classes) or a retake session. A missing exam type can be created in place.
 * Resolves `true` once scheduled.
 */
export const ScheduleExamsDialog = createCallable<
	{ mode: SessionMode },
	boolean
>(({ call, mode }) => {
	const { t } = useTranslation();
	const state = useScheduleExams(mode, () => call.end(true));
	const { sessionMode, isPending } = state;

	return (
		<Dialog
			open={!call.ended}
			onOpenChange={(open) => !open && !isPending && call.end(false)}
		>
			<DialogContent className="flex max-h-[90vh] w-[90vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-[90vw]">
				{/* ── Header ── */}
				<div className="shrink-0 border-b px-6 py-4">
					<DialogHeader>
						<DialogTitle>{t("admin.examScheduler.form.title")}</DialogTitle>
						<p className="text-muted-foreground text-xs">
							{t("admin.examScheduler.form.description")}
						</p>
					</DialogHeader>
					<div className="mt-4 px-6 pb-4">
						<Tabs
							value={sessionMode}
							onValueChange={(v) => state.setSessionMode(v as SessionMode)}
						>
							<TabsList className="grid w-full grid-cols-2">
								<TabsTrigger value="normal" className="gap-2">
									<Play className="h-4 w-4" />
									{t("admin.examScheduler.sessionMode.normal")}
								</TabsTrigger>
								<TabsTrigger value="retake" className="gap-2">
									<RefreshCcw className="h-4 w-4" />
									{t("admin.examScheduler.sessionMode.retake")}
								</TabsTrigger>
							</TabsList>
						</Tabs>
						<p className="mt-1.5 text-muted-foreground text-xs">
							{sessionMode === "normal"
								? t("admin.examScheduler.sessionMode.normalDescription")
								: t("admin.examScheduler.sessionMode.retakeDescription")}
						</p>
					</div>
				</div>

				{/* ── Body ── */}
				<div className="grid min-h-0 flex-1 grid-cols-[1fr_3fr] overflow-hidden">
					<ScheduleExamsSettings state={state} />
					<div className="flex flex-col overflow-hidden">
						{sessionMode === "normal" ? (
							<ScheduleClassesPanel
								classes={state.previewClasses}
								isLoading={state.previewLoading}
								selection={state.classSelection}
							/>
						) : (
							<ScheduleRetakeExamsPanel
								exams={state.retakeExams}
								isLoading={state.retakePreviewLoading}
								selection={state.examSelection}
							/>
						)}
					</div>
				</div>

				{/* ── Footer ── */}
				<div className="flex shrink-0 items-center justify-between border-t bg-background px-6 py-3">
					<Button variant="ghost" type="button" onClick={state.resetForm}>
						{t("common.actions.reset")}
					</Button>
					<div className="flex items-center gap-3">
						{sessionMode === "normal" &&
							state.classSelection.selected.size > 0 && (
								<span className="text-muted-foreground text-xs">
									{state.classSelection.selected.size}{" "}
									{t("admin.examScheduler.classes.title", {
										defaultValue: "classes",
									})}
								</span>
							)}
						{sessionMode === "retake" &&
							state.examSelection.selected.size > 0 && (
								<span className="text-muted-foreground text-xs">
									{state.examSelection.selected.size}{" "}
									{t("admin.examScheduler.retakeExams.title", {
										defaultValue: "examens sélectionnés",
									})}
								</span>
							)}
						<Button onClick={state.submit} disabled={!state.canSubmit}>
							{isPending ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : null}
							{sessionMode === "normal"
								? t("admin.examScheduler.actions.schedule")
								: t("admin.examScheduler.actions.scheduleRetakes")}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}, DIALOG_EXIT_MS);
