import {
	AlertTriangle,
	ArrowRight,
	GraduationCap,
	Loader2,
} from "lucide-react";
import { createCallable } from "react-call";
import { useTranslation } from "react-i18next";
import { DIALOG_EXIT_MS } from "@/components/callable/callable-dialog";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useGraduationCredits } from "../hooks/use-graduation-credits";
import { usePromoteAdmitted } from "../hooks/use-promote-admitted";
import type { DecisionGroups } from "../services/decision-groups";
import { PromoteDecisionGroups } from "./promote-decision-groups";
import { PromoteNoTargetFound } from "./promote-no-target-found";

interface Props {
	deliberationId: string;
	/** classId of the source class (from the deliberation) */
	sourceClassId: string;
	groups: DecisionGroups;
}

/**
 * Applies the jury's decisions: promotes (or graduates, on the last level) the
 * admitted students, re-enrols repeaters in the same level, closes the
 * enrollment of excluded students. Students without a decision are listed and
 * left as they are.
 */
export const PromoteAdmittedDialog = createCallable<Props, void>(
	({ call, deliberationId, sourceClassId, groups }) => {
		const { t } = useTranslation();
		const promote = usePromoteAdmitted({
			deliberationId,
			sourceClassId,
			groups,
			onDone: () => call.end(),
		});
		const {
			targetYearId,
			setTargetYearId,
			baseLoading,
			targetLoading,
			availableYears,
			isLastLevel,
			sourceClass,
			nextLevel,
			promoteMutation,
			close,
		} = promote;
		const yearName = availableYears.find((y) => y.id === targetYearId)?.name;

		return (
			<Dialog open={!call.ended} onOpenChange={(o) => !o && close()}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<ArrowRight className="h-5 w-5 text-primary" />
							{t("admin.deliberations.promote.title")}
						</DialogTitle>
						<DialogDescription>
							{t("admin.deliberations.promote.dialogDescription")}
						</DialogDescription>
					</DialogHeader>

					<DialogBody className="space-y-4 py-1">
						<PromoteDecisionGroups
							groups={groups}
							isLastLevel={isLastLevel}
							nextLevelName={nextLevel?.name}
							levelName={sourceClass?.cycleLevel?.name}
						/>

						{/* Last-level note */}
						{!baseLoading && isLastLevel && groups.admitted > 0 && (
							<div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800/40 dark:bg-amber-900/20">
								<GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
								<div className="text-sm">
									<p className="font-medium text-amber-800 dark:text-amber-300">
										{t("admin.deliberations.promote.lastLevelTitle")}
									</p>
									<p className="mt-0.5 text-amber-700 dark:text-amber-400/80">
										{t("admin.deliberations.promote.lastLevelHint")}
									</p>
								</div>
							</div>
						)}

						{!baseLoading && isLastLevel && groups.admitted > 0 && (
							<GraduationCreditsCheck deliberationId={deliberationId} />
						)}

						{/* Target academic year: needed to place promoted or repeating students */}
						{promote.needsYear && (
							<div className="space-y-2">
								<label className="font-medium text-sm">
									{t("admin.deliberations.promote.targetAcademicYear")}
								</label>
								{baseLoading ? (
									<Skeleton className="h-9 w-full" />
								) : (
									<Select value={targetYearId} onValueChange={setTargetYearId}>
										<SelectTrigger>
											<SelectValue
												placeholder={t(
													"admin.deliberations.promote.targetAcademicYearPlaceholder",
												)}
											/>
										</SelectTrigger>
										<SelectContent>
											{availableYears.map((year) => (
												<SelectItem key={year.id} value={year.id}>
													{year.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								)}
							</div>
						)}

						{targetYearId && promote.needsTargetClass && (
							<ClassChoice
								label={t("admin.deliberations.promote.targetClass")}
								hint={t("admin.deliberations.promote.targetClassHint", {
									count: groups.admitted,
								})}
								loading={targetLoading}
								classes={promote.targetClasses}
								value={promote.targetClassId}
								onChange={promote.setTargetClassId}
								missing={
									promote.showNoClassFound ? (
										<PromoteNoTargetFound
											level="next"
											programName={sourceClass?.programInfo?.name}
											levelName={nextLevel?.name}
											yearName={yearName}
											creating={promote.creatingTarget}
											onCreateClass={() => promote.createTargetClass("next")}
										/>
									) : null
								}
							/>
						)}

						{targetYearId && promote.needsRepeatClass && (
							<ClassChoice
								label={t("admin.deliberations.promote.repeatClass")}
								hint={t("admin.deliberations.promote.repeatClassHint", {
									count: groups.repeat,
								})}
								loading={targetLoading}
								classes={promote.repeatClasses}
								value={promote.repeatClassId}
								onChange={promote.setRepeatClassId}
								missing={
									promote.showNoRepeatClassFound ? (
										<PromoteNoTargetFound
											level="same"
											programName={sourceClass?.programInfo?.name}
											levelName={sourceClass?.cycleLevel?.name}
											yearName={yearName}
											creating={promote.creatingTarget}
											onCreateClass={() => promote.createTargetClass("same")}
										/>
									) : null
								}
							/>
						)}
					</DialogBody>

					<DialogFooter>
						<Button variant="outline" onClick={close}>
							{t("common.actions.cancel")}
						</Button>
						<Button
							onClick={() => promoteMutation.mutate()}
							disabled={!promote.canConfirm}
						>
							{promoteMutation.isPending ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<ArrowRight className="mr-2 h-4 w-4" />
							)}
							{t("admin.deliberations.promote.confirm")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		);
	},
	DIALOG_EXIT_MS,
);

/**
 * Graduation check on the last level: per graduate, the credits earned over
 * the cycle against the credits it requires. Warns, never blocks — the jury
 * decided.
 */
function GraduationCreditsCheck({
	deliberationId,
}: {
	deliberationId: string;
}) {
	const { t } = useTranslation();
	const { data, isLoading } = useGraduationCredits(deliberationId, true);
	if (isLoading) return <Skeleton className="h-16 w-full" />;
	if (!data?.cycle || data.students.length === 0) return null;
	const required = data.cycle.totalCreditsRequired;
	const below = data.students.filter((s) => s.belowRequired);
	return (
		<div className="space-y-2 rounded-lg border p-3">
			<p className="font-medium text-sm">
				{t("admin.deliberations.promote.cycleCredits.title", {
					cycle: data.cycle.name,
					required,
				})}
			</p>
			{below.length > 0 && (
				<div className="flex items-start gap-2 text-amber-700 text-xs dark:text-amber-400">
					<AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
					<span>
						{t("admin.deliberations.promote.cycleCredits.warning", {
							count: below.length,
							required,
						})}
					</span>
				</div>
			)}
			<ul className="max-h-40 space-y-1 overflow-y-auto text-xs">
				{data.students.map((s) => (
					<li
						key={s.studentId}
						className="flex items-center justify-between gap-2"
					>
						<span className="truncate">
							{`${s.lastName ?? ""} ${s.firstName ?? ""}`.trim()}
						</span>
						<span
							className={
								s.belowRequired
									? "shrink-0 font-semibold text-amber-700 tabular-nums dark:text-amber-400"
									: "shrink-0 text-muted-foreground tabular-nums"
							}
						>
							{t("admin.deliberations.promote.cycleCredits.value", {
								earned: s.creditsEarned,
								required,
							})}
						</span>
					</li>
				))}
			</ul>
		</div>
	);
}

/** Destination class select, or what to do when the class is missing. */
function ClassChoice({
	label,
	hint,
	loading,
	classes,
	value,
	onChange,
	missing,
}: {
	label: string;
	hint: string;
	loading: boolean;
	classes: Array<{
		id: string;
		name: string;
		cycleLevel?: { code?: string | null } | null;
	}>;
	value: string;
	onChange: (id: string) => void;
	missing: React.ReactNode;
}) {
	const { t } = useTranslation();
	return (
		<div className="space-y-2">
			<label className="font-medium text-sm">{label}</label>
			{loading ? (
				<Skeleton className="h-9 w-full" />
			) : missing ? (
				missing
			) : (
				<Select value={value} onValueChange={onChange}>
					<SelectTrigger>
						<SelectValue
							placeholder={t(
								"admin.deliberations.promote.targetClassPlaceholder",
							)}
						/>
					</SelectTrigger>
					<SelectContent>
						{classes.map((cls) => (
							<SelectItem key={cls.id} value={cls.id}>
								<span className="flex items-center gap-2">
									{cls.cycleLevel?.code && (
										<span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono font-semibold text-primary text-xs">
											{cls.cycleLevel.code}
										</span>
									)}
									<span>{cls.name}</span>
								</span>
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			)}
			{value && !missing && (
				<p className="text-muted-foreground text-xs">{hint}</p>
			)}
		</div>
	);
}
