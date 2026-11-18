import { ArrowRight, GraduationCap, Loader2 } from "lucide-react";
import { createCallable } from "react-call";
import { useTranslation } from "react-i18next";
import { DIALOG_EXIT_MS } from "@/components/callable/callable-dialog";
import { QuickCreate } from "@/components/callable/quick-create";
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
import { usePromoteAdmitted } from "../hooks/use-promote-admitted";
import { PromoteNoTargetFound } from "./promote-no-target-found";

interface Props {
	deliberationId: string;
	/** classId of the source class (from the deliberation) */
	sourceClassId: string;
	admittedCount: number;
}

/** Promotes (or graduates, on the last level) the admitted students of a deliberation. */
export const PromoteAdmittedDialog = createCallable<Props, void>(
	({ call, deliberationId, sourceClassId, admittedCount }) => {
		const { t } = useTranslation();
		const {
			targetYearId,
			setTargetYearId,
			targetClassId,
			setTargetClassId,
			baseLoading,
			targetLoading,
			availableYears,
			isLastLevel,
			sourceClass,
			targetClasses,
			showNoClassFound,
			createTargetClass,
			promoteMutation,
			close,
		} = usePromoteAdmitted({
			deliberationId,
			sourceClassId,
			onDone: () => call.end(),
		});

		return (
			<Dialog open={!call.ended} onOpenChange={(o) => !o && close()}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<ArrowRight className="h-5 w-5 text-primary" />
							{t("admin.deliberations.promote.title")}
						</DialogTitle>
						<DialogDescription>
							{t("admin.deliberations.promote.description", {
								count: admittedCount,
							})}
						</DialogDescription>
					</DialogHeader>

					<DialogBody className="space-y-4 py-1">
						{/* Last-level warning */}
						{!baseLoading && isLastLevel && (
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

						{/* Step 1: Target academic year — only needed when there's a next level */}
						{!isLastLevel && (
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

						{/* Step 2: Target class — only shown once a year is selected */}
						{targetYearId && !isLastLevel && (
							<div className="space-y-2">
								<label className="font-medium text-sm">
									{t("admin.deliberations.promote.targetClass")}
								</label>

								{targetLoading ? (
									<Skeleton className="h-9 w-full" />
								) : showNoClassFound ? (
									<PromoteNoTargetFound
										programName={sourceClass?.programInfo?.name}
										levelCode={sourceClass?.cycleLevel?.code}
										levelOrderIndex={sourceClass?.cycleLevel?.orderIndex}
										onCreateClass={createTargetClass}
									/>
								) : (
									<QuickCreate
										onCreate={createTargetClass}
										label={t("admin.classes.actions.add")}
									>
										<Select
											value={targetClassId}
											onValueChange={setTargetClassId}
										>
											<SelectTrigger>
												<SelectValue
													placeholder={t(
														"admin.deliberations.promote.targetClassPlaceholder",
													)}
												/>
											</SelectTrigger>
											<SelectContent>
												{targetClasses.map((cls) => (
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
									</QuickCreate>
								)}

								{targetClassId && !showNoClassFound && (
									<p className="text-muted-foreground text-xs">
										{t("admin.deliberations.promote.targetClassHint", {
											count: admittedCount,
										})}
									</p>
								)}
							</div>
						)}
					</DialogBody>

					<DialogFooter>
						<Button variant="outline" onClick={close}>
							{t("common.actions.cancel")}
						</Button>
						<Button
							onClick={() => promoteMutation.mutate()}
							disabled={
								(!isLastLevel && (!targetYearId || !targetClassId)) ||
								promoteMutation.isPending
							}
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
