import { useMutation, useQuery } from "@tanstack/react-query";
import {
	ArrowRight,
	CheckCheck,
	GraduationCap,
	Loader2,
	Trophy,
	Users,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PaginationBar } from "@/components/ui/pagination-bar";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useCursorPagination } from "@/hooks/useCursorPagination";
import { trpcClient } from "../../utils/trpc";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DecisionVariant =
	| "success"
	| "warning"
	| "destructive"
	| "muted"
	| "secondary";
type Decision =
	| "admitted"
	| "compensated"
	| "deferred"
	| "repeat"
	| "excluded"
	| "pending";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PROMOTABLE_DECISIONS: Decision[] = ["admitted", "compensated"];

function decisionVariant(
	decision: Decision | null | undefined,
): DecisionVariant {
	switch (decision) {
		case "admitted":
			return "success";
		case "compensated":
			return "warning";
		case "deferred":
			return "info" as DecisionVariant;
		case "repeat":
		case "excluded":
			return "destructive";
		default:
			return "muted";
	}
}

function decisionLabel(
	decision: Decision | null | undefined,
	t: (key: string) => string,
): string {
	if (!decision) return t("teacher.promotion.decision.noData");
	return t(`teacher.promotion.decision.${decision}`);
}

function mentionLabel(mention: string | null | undefined): string {
	if (!mention) return "—";
	const labels: Record<string, string> = {
		excellent: "Excellent",
		tres_bien: "Très bien",
		bien: "Bien",
		assez_bien: "Assez bien",
		passable: "Passable",
	};
	return labels[mention] ?? mention;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ClassOption({
	name,
	levelCode,
	programName,
}: {
	name: string;
	levelCode?: string | null;
	programName?: string | null;
}) {
	return (
		<span className="flex items-center gap-2">
			{levelCode && (
				<span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono font-semibold text-primary text-xs">
					{levelCode}
				</span>
			)}
			<span>{name}</span>
			{programName && (
				<span className="text-muted-foreground text-xs">· {programName}</span>
			)}
		</span>
	);
}

function StudentRowSkeleton() {
	return (
		<TableRow>
			{Array.from({ length: 6 }).map((_, i) => (
				<TableCell key={i}>
					<Skeleton className="h-4 w-full" />
				</TableCell>
			))}
		</TableRow>
	);
}

function EmptyStudents({
	sourceClassSelected,
}: {
	sourceClassSelected: boolean;
}) {
	const { t } = useTranslation();
	if (!sourceClassSelected) return null;
	return (
		<div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-12 text-center">
			<div className="rounded-full bg-muted p-3">
				<Users className="h-6 w-6 text-muted-foreground" />
			</div>
			<div>
				<p className="font-medium text-sm">
					{t("teacher.promotion.emptyStudents.title")}
				</p>
				<p className="mt-1 text-muted-foreground text-sm">
					{t("teacher.promotion.emptyStudents.description")}
				</p>
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function StudentManagement() {
	const [sourceClassId, setSourceClassId] = useState<string>("");
	const [targetClassId, setTargetClassId] = useState<string>("");
	const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(
		new Set(),
	);
	const pagination = useCursorPagination({ pageSize: 30 });
	const { t } = useTranslation();

	// Get previous academic year classes (source)
	const { data: sourceClasses, isLoading: sourceLoading } = useQuery({
		queryKey: ["promotion-source-classes"],
		queryFn: async () => {
			const allYears = await trpcClient.academicYears.list.query({});
			const activeYear = allYears.items.find((y) => y.isActive);
			if (!activeYear) return [];
			const previousYear = allYears.items
				.filter((y) => new Date(y.startDate) < new Date(activeYear.startDate))
				.sort(
					(a, b) =>
						new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
				)[0];
			if (!previousYear) return [];
			const { items } = await trpcClient.classes.list.query({
				academicYearId: previousYear.id,
				limit: 200,
			});
			return items;
		},
	});

	// Get promotion targets (filtered: same program, next level, active year)
	const { data: promoData, isLoading: targetsLoading } = useQuery({
		queryKey: ["promo-targets", sourceClassId],
		queryFn: () => trpcClient.classes.promoTargets.query({ sourceClassId }),
		enabled: !!sourceClassId,
	});

	// Students with deliberation results
	const { data: preview, isLoading: studentsLoading } = useQuery({
		queryKey: ["promotion-preview", sourceClassId, pagination.cursor],
		queryFn: () =>
			trpcClient.classes.promotionPreview.query({
				sourceClassId,
				cursor: pagination.cursor,
				limit: 30,
			}),
		enabled: !!sourceClassId,
	});

	const bulkTransferMutation = useMutation({
		mutationFn: () =>
			trpcClient.classes.bulkTransfer.mutate({
				studentIds: Array.from(selectedStudentIds),
				toClassId: targetClassId,
			}),
		onSuccess: (data) => {
			toast.success(
				t("teacher.promotion.toast.success", { count: data.transferred }),
			);
			setSelectedStudentIds(new Set());
			pagination.reset();
		},
		onError: (err) => toast.error((err as Error).message),
	});

	// ---------------------------------------------------------------------------
	// Selection helpers
	// ---------------------------------------------------------------------------

	const students = preview?.items ?? [];
	const allIds = students.map((s) => s.student.id);
	const allSelected =
		allIds.length > 0 && allIds.every((id) => selectedStudentIds.has(id));
	const someSelected = allIds.some((id) => selectedStudentIds.has(id));

	function toggleAll(checked: boolean) {
		setSelectedStudentIds((prev) => {
			const next = new Set(prev);
			if (checked) {
				for (const id of allIds) next.add(id);
			} else {
				for (const id of allIds) next.delete(id);
			}
			return next;
		});
	}

	function toggleStudent(id: string, checked: boolean) {
		setSelectedStudentIds((prev) => {
			const next = new Set(prev);
			if (checked) next.add(id);
			else next.delete(id);
			return next;
		});
	}

	function handleAutoSelect() {
		const promotable = students
			.filter((s) =>
				PROMOTABLE_DECISIONS.includes(
					s.deliberationResult?.finalDecision as Decision,
				),
			)
			.map((s) => s.student.id);
		setSelectedStudentIds(new Set(promotable));
	}

	function handleSourceChange(value: string) {
		setSourceClassId(value);
		setTargetClassId("");
		setSelectedStudentIds(new Set());
		pagination.reset();
	}

	// ---------------------------------------------------------------------------
	// Derived state
	// ---------------------------------------------------------------------------

	const sourceClass = sourceClasses?.find((c) => c.id === sourceClassId);
	const isLastLevel = promoData?.isLastLevel ?? false;
	const targetClasses = promoData?.targetClasses ?? [];
	const canPromote =
		selectedStudentIds.size > 0 &&
		!!targetClassId &&
		!bulkTransferMutation.isPending;

	// ---------------------------------------------------------------------------
	// Render
	// ---------------------------------------------------------------------------

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h2 className="font-bold font-heading text-2xl text-foreground">
					{t("teacher.promotion.title")}
				</h2>
				<p className="mt-1 text-muted-foreground text-sm">
					{t("teacher.promotion.subtitle")}
				</p>
			</div>

			{/* Class selectors */}
			<div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr]">
				{/* Source class */}
				<div className="space-y-1.5">
					<label className="font-medium text-sm">
						{t("teacher.promotion.sourceClassLabel")}
					</label>
					<Select
						value={sourceClassId}
						onValueChange={handleSourceChange}
						disabled={sourceLoading}
					>
						<SelectTrigger className="w-full">
							{sourceLoading ? (
								<span className="text-muted-foreground">
									{t("common.loading")}
								</span>
							) : (
								<SelectValue
									placeholder={t("teacher.promotion.sourceClassPlaceholder")}
								/>
							)}
						</SelectTrigger>
						<SelectContent>
							{sourceClasses?.map((cls) => (
								<SelectItem key={cls.id} value={cls.id}>
									<ClassOption
										name={cls.name}
										levelCode={cls.cycleLevel?.code}
										programName={cls.programInfo?.name}
									/>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					{sourceClass && (
						<p className="text-muted-foreground text-xs">
							{sourceClass.academicYearInfo?.name}
						</p>
					)}
				</div>

				{/* Arrow separator */}
				<div className="flex items-end justify-center pb-2">
					<ArrowRight className="h-5 w-5 text-muted-foreground" />
				</div>

				{/* Target class */}
				<div className="space-y-1.5">
					<label className="flex items-center gap-2 font-medium text-sm">
						{t("teacher.promotion.targetClassLabel")}
						{isLastLevel && sourceClassId && (
							<Badge variant="warning" className="gap-1">
								<GraduationCap className="h-3 w-3" />
								{t("teacher.promotion.lastLevel")}
							</Badge>
						)}
					</label>
					<Select
						value={targetClassId}
						onValueChange={setTargetClassId}
						disabled={
							!sourceClassId || targetsLoading || targetClasses.length === 0
						}
					>
						<SelectTrigger className="w-full">
							{targetsLoading && sourceClassId ? (
								<span className="text-muted-foreground">
									{t("common.loading")}
								</span>
							) : (
								<SelectValue
									placeholder={
										!sourceClassId
											? t("teacher.promotion.selectSourceFirst")
											: targetClasses.length === 0
												? t("teacher.promotion.noTargetAvailable")
												: t("teacher.promotion.targetClassPlaceholder")
									}
								/>
							)}
						</SelectTrigger>
						<SelectContent>
							{targetClasses.map((cls) => (
								<SelectItem key={cls.id} value={cls.id}>
									<ClassOption
										name={cls.name}
										levelCode={cls.cycleLevel?.code}
										programName={cls.programInfo?.name}
									/>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					{isLastLevel && sourceClassId && (
						<p className="text-muted-foreground text-xs">
							{t("teacher.promotion.lastLevelHint")}
						</p>
					)}
				</div>
			</div>

			{/* Student list */}
			{sourceClassId && (
				<div className="space-y-3">
					{/* Toolbar */}
					<div className="flex flex-wrap items-center justify-between gap-3">
						<div className="flex items-center gap-2 text-muted-foreground text-sm">
							<Users className="h-4 w-4" />
							{selectedStudentIds.size > 0 ? (
								<span>
									<span className="font-semibold text-foreground">
										{selectedStudentIds.size}
									</span>{" "}
									{t("teacher.promotion.students.selectedCount", {
										count: selectedStudentIds.size,
									})}
								</span>
							) : (
								<span>{t("teacher.promotion.students.listTitle")}</span>
							)}
						</div>
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={handleAutoSelect}
								disabled={studentsLoading || students.length === 0}
							>
								<CheckCheck className="mr-1.5 h-4 w-4" />
								{t("teacher.promotion.students.autoSelect")}
							</Button>
							<Button
								size="sm"
								onClick={() => bulkTransferMutation.mutate()}
								disabled={!canPromote}
							>
								{bulkTransferMutation.isPending ? (
									<Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
								) : (
									<ArrowRight className="mr-1.5 h-4 w-4" />
								)}
								{t("teacher.promotion.actions.promoteSelected")}
								{selectedStudentIds.size > 0 && (
									<span className="ml-1.5 rounded-full bg-primary-foreground/20 px-1.5 py-0.5 text-xs">
										{selectedStudentIds.size}
									</span>
								)}
							</Button>
						</div>
					</div>

					{/* Table */}
					<div className="overflow-hidden rounded-xl border">
						<Table>
							<TableHeader>
								<TableRow className="bg-muted/40 hover:bg-muted/40">
									<TableHead className="w-10">
										<Checkbox
											checked={
												someSelected
													? allSelected
														? true
														: "indeterminate"
													: false
											}
											onCheckedChange={(v) => toggleAll(!!v)}
											aria-label="Select all"
										/>
									</TableHead>
									<TableHead>
										{t("teacher.promotion.table.registration")}
									</TableHead>
									<TableHead>{t("teacher.promotion.table.name")}</TableHead>
									<TableHead className="text-center">
										{t("teacher.promotion.table.overallAverage")}
									</TableHead>
									<TableHead className="text-center">
										{t("teacher.promotion.table.credits")}
									</TableHead>
									<TableHead className="text-center">
										{t("teacher.promotion.table.decision")}
									</TableHead>
									<TableHead className="text-center">
										{t("teacher.promotion.table.mention")}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{studentsLoading
									? Array.from({ length: 5 }).map((_, i) => (
											<StudentRowSkeleton key={i} />
										))
									: students.map(({ student, deliberationResult }) => {
											const isSelected = selectedStudentIds.has(student.id);
											const decision =
												deliberationResult?.finalDecision as Decision | null;
											const isPromotable = PROMOTABLE_DECISIONS.includes(
												decision as Decision,
											);

											return (
												<TableRow
													key={student.id}
													className={isSelected ? "bg-primary/5" : undefined}
												>
													<TableCell>
														<Checkbox
															checked={isSelected}
															onCheckedChange={(v) =>
																toggleStudent(student.id, !!v)
															}
															aria-label={`Select ${student.profile?.firstName}`}
														/>
													</TableCell>
													<TableCell className="font-mono text-muted-foreground text-xs">
														{student.registrationNumber}
													</TableCell>
													<TableCell className="font-medium">
														{student.profile?.lastName},{" "}
														{student.profile?.firstName}
													</TableCell>
													<TableCell className="text-center">
														{deliberationResult?.generalAverage != null ? (
															<span
																className={
																	(deliberationResult.generalAverage ?? 0) >= 10
																		? "font-semibold text-emerald-600 dark:text-emerald-400"
																		: "font-semibold text-rose-600 dark:text-rose-400"
																}
															>
																{Number(
																	deliberationResult.generalAverage,
																).toFixed(2)}
																<span className="font-normal text-muted-foreground">
																	/20
																</span>
															</span>
														) : (
															<span className="text-muted-foreground">—</span>
														)}
													</TableCell>
													<TableCell className="text-center text-sm">
														{deliberationResult ? (
															<span>
																<span className="font-semibold">
																	{deliberationResult.totalCreditsEarned}
																</span>
																<span className="text-muted-foreground">
																	/{deliberationResult.totalCreditsPossible}
																</span>
															</span>
														) : (
															<span className="text-muted-foreground">—</span>
														)}
													</TableCell>
													<TableCell className="text-center">
														{decision ? (
															<Badge
																variant={decisionVariant(decision)}
																className={isPromotable ? "gap-1" : undefined}
															>
																{isPromotable && <Trophy className="h-3 w-3" />}
																{decisionLabel(decision, t)}
															</Badge>
														) : (
															<Badge variant="muted">
																{t("teacher.promotion.decision.noData")}
															</Badge>
														)}
													</TableCell>
													<TableCell className="text-center text-muted-foreground text-sm">
														{mentionLabel(deliberationResult?.mention)}
													</TableCell>
												</TableRow>
											);
										})}
							</TableBody>
						</Table>
					</div>

					{/* Empty state */}
					{!studentsLoading && students.length === 0 && (
						<EmptyStudents sourceClassSelected={!!sourceClassId} />
					)}

					{/* Pagination */}
					{students.length > 0 && (
						<PaginationBar
							hasPrev={pagination.hasPrev}
							hasNext={!!preview?.nextCursor}
							onPrev={pagination.handlePrev}
							onNext={() => pagination.handleNext(preview?.nextCursor)}
							isLoading={studentsLoading}
						/>
					)}
				</div>
			)}

			{/* Empty state when no source class selected */}
			{!sourceClassId && (
				<div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-12 text-center">
					<div className="rounded-full bg-muted p-3">
						<GraduationCap className="h-6 w-6 text-muted-foreground" />
					</div>
					<div>
						<p className="font-medium text-sm">
							{t("teacher.promotion.emptyState.title")}
						</p>
						<p className="mt-1 text-muted-foreground text-sm">
							{t("teacher.promotion.emptyState.description")}
						</p>
					</div>
				</div>
			)}
		</div>
	);
}
