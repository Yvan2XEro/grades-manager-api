import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, CircleAlert, GraduationCap, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { toast } from "@/lib/toast";
import { Button } from "../../../components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../../../components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../../components/ui/select";
import { Skeleton } from "../../../components/ui/skeleton";
import { trpcClient } from "../../../utils/trpc";

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	deliberationId: string;
	/** classId of the source class (from the deliberation) */
	sourceClassId: string;
	admittedCount: number;
}

export default function PromoteAdmittedDialog({
	open,
	onOpenChange,
	deliberationId,
	sourceClassId,
	admittedCount,
}: Props) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [targetYearId, setTargetYearId] = useState<string>("");
	const [targetClassId, setTargetClassId] = useState<string>("");

	// Step 1: load source class info + available years (no year selected yet)
	const { data: baseData, isLoading: baseLoading } = useQuery({
		queryKey: ["promo-targets-base", sourceClassId],
		queryFn: () => trpcClient.classes.promoTargets.query({ sourceClassId }),
		enabled: open && !!sourceClassId,
	});

	// Step 2: load matching target classes once a year is chosen
	const { data: targetData, isLoading: targetLoading } = useQuery({
		queryKey: ["promo-targets", sourceClassId, targetYearId],
		queryFn: () =>
			trpcClient.classes.promoTargets.query({
				sourceClassId,
				targetAcademicYearId: targetYearId,
			}),
		enabled: open && !!sourceClassId && !!targetYearId,
	});

	const availableYears = baseData?.availableYears ?? [];
	const isLastLevel = baseData?.isLastLevel ?? false;
	const sourceClass = baseData?.sourceClass;
	const targetClasses = targetData?.targetClasses ?? [];

	// Auto-select when exactly one class matches
	useEffect(() => {
		if (targetClasses.length === 1) {
			setTargetClassId(targetClasses[0].id);
		} else if (targetClasses.length === 0) {
			setTargetClassId("");
		}
	}, [targetClasses]);

	// Reset class when year changes
	useEffect(() => {
		setTargetClassId("");
	}, [targetYearId]);

	const promoteMutation = useMutation({
		mutationFn: () =>
			trpcClient.deliberations.promoteAdmitted.mutate({
				deliberationId,
				// omit targetClassId for graduation (last level)
				...(isLastLevel ? {} : { targetClassId }),
			}),
		onSuccess: (data) => {
			toast.success(
				t("admin.deliberations.promote.success", {
					count: data.promotedCount,
				}),
			);
			queryClient.invalidateQueries({
				queryKey: ["deliberation", deliberationId],
			});
			queryClient.invalidateQueries({
				queryKey: ["deliberation-logs", deliberationId],
			});
			handleClose();
		},
		onError: (err) => toast.error((err as Error).message),
	});

	function handleClose() {
		setTargetYearId("");
		setTargetClassId("");
		onOpenChange(false);
	}

	const showNoClassFound =
		!!targetYearId &&
		!targetLoading &&
		targetClasses.length === 0 &&
		!isLastLevel;

	return (
		<Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
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

				<div className="space-y-4 py-1">
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
								<div className="space-y-3 rounded-lg border border-dashed p-4">
									<div className="flex items-center gap-2 font-medium text-foreground text-sm">
										<CircleAlert className="h-4 w-4 shrink-0 text-muted-foreground" />
										{t("admin.deliberations.promote.noTargetFound.title")}
									</div>
									<div className="space-y-1.5 text-muted-foreground text-xs">
										<p>
											{t("admin.deliberations.promote.noTargetFound.searched")}
										</p>
										<ul className="ml-4 list-disc space-y-1">
											<li>
												{t(
													"admin.deliberations.promote.noTargetFound.criteriaProgram",
													{
														program: sourceClass?.programInfo?.name ?? "—",
													},
												)}
											</li>
											<li>
												{t(
													"admin.deliberations.promote.noTargetFound.criteriaLevel",
													{
														level: sourceClass?.cycleLevel?.code ?? "—",
														nextIndex:
															(sourceClass?.cycleLevel?.orderIndex ?? 0) + 1,
													},
												)}
											</li>
											<li>
												{t(
													"admin.deliberations.promote.noTargetFound.criteriaYear",
												)}
											</li>
										</ul>
									</div>
									<p className="text-muted-foreground text-xs">
										{t("admin.deliberations.promote.noTargetFound.fix", {
											program: sourceClass?.programInfo?.name ?? "—",
											level: sourceClass?.cycleLevel?.code ?? "—",
										})}
									</p>
									<Link
										to="/admin/classes"
										className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 font-medium text-xs transition-colors hover:bg-accent"
									>
										<ArrowRight className="h-3.5 w-3.5" />
										{t("admin.deliberations.promote.noTargetFound.goToClasses")}
									</Link>
								</div>
							) : (
								<Select value={targetClassId} onValueChange={setTargetClassId}>
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
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={handleClose}>
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
}
