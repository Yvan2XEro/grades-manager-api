import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
	Check,
	ClipboardList,
	MoreHorizontal,
	Pencil,
	Plus,
	RefreshCw,
	RotateCcw,
	Send,
	Trash2,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import { confirmAction } from "@/components/callable/confirm";
import {
	AcademicYearSelect,
	ClassSelect,
	DebouncedSearchField,
	SemesterSelect,
} from "@/components/inputs";
import {
	ContextMenuItem,
	ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { DatePicker } from "@/components/ui/date-picker";
import { FilterBar } from "@/components/ui/filter-bar";
import { TablePagination } from "@/components/ui/table-pagination";
import { toast } from "@/lib/toast";
import { Badge } from "../../components/ui/badge";
import { BulkActionBar } from "../../components/ui/bulk-action-bar";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Checkbox } from "../../components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "../../components/ui/empty";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "../../components/ui/table";
import { TableSkeleton } from "../../components/ui/table-skeleton";
import { useRowSelection } from "../../hooks/useRowSelection";
import { trpc, trpcClient } from "../../utils/trpc";
import {
	ExamFormDialog,
	RejectExamDialog,
	RetakeExamDialog,
} from "./exams/ExamDialogs";

interface Exam {
	id: string;
	name: string;
	type: string;
	date: string;
	percentage: number;
	classCourse: string;
	isLocked: boolean;
	classCourseCode?: string | null;
	className?: string | null;
	courseName?: string | null;
	sessionType?: "normal" | "retake";
	parentExamId?: string | null;
	status?: string;
}

interface ClassCourse {
	id: string;
	class: string;
	course: string;
}

interface Class {
	id: string;
	name: string;
}

interface Course {
	id: string;
	name: string;
}

export default function ExamManagement() {
	const [searchTerm, setSearchTerm] = useState("");
	const [academicYearId, setAcademicYearId] = useState<string | null>(null);
	const [classId, setClassId] = useState<string | null>(null);
	const [semesterId, setSemesterId] = useState<string | null>(null);
	const [dateFrom, setDateFrom] = useState<Date | null>(null);
	const [dateTo, setDateTo] = useState<Date | null>(null);
	useEffect(() => {
		setClassId(null);
		setSemesterId(null);
	}, []);

	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);

	const handleFilter =
		<T,>(setter: (v: T) => void) =>
		(value: T) => {
			setter(value);
			setPage(1);
		};

	const yearsQuery = useQuery({
		...trpc.academicYears.list.queryOptions({}),
	});
	useEffect(() => {
		if (!academicYearId && yearsQuery.data?.items) {
			const active = yearsQuery.data.items.find((y) => y.isActive);
			if (active) {
				setAcademicYearId(active.id);
				setPage(1);
			}
		}
	}, [yearsQuery.data, academicYearId]);

	const queryClient = useQueryClient();
	const { t } = useTranslation();
	const navigate = useNavigate();

	const { data: examsData, isLoading: isLoadingExamsQuery } = useQuery(
		trpc.exams.listPaged.queryOptions(
			{
				page,
				pageSize,
				academicYearId: academicYearId ?? undefined,
				query: searchTerm.trim() ? searchTerm.trim() : undefined,
				classId: classId ?? undefined,
				dateFrom: dateFrom ?? undefined,
				dateTo: dateTo ?? undefined,
			},
			{ enabled: Boolean(academicYearId) },
		),
	);
	const exams: Exam[] = (examsData?.items ?? []).map((exam) => ({
		...exam,
		percentage: Number(exam.percentage),
	}));
	const isLoadingExams =
		isLoadingExamsQuery || (!academicYearId && yearsQuery.isLoading);

	const _semestersQuery = useQuery({
		...trpc.semesters.list.queryOptions({}),
	});
	const { data: classCourses } = useQuery({
		queryKey: ["classCourses"],
		queryFn: async () => {
			const { items } = await trpcClient.classCourses.list.query({});
			return items as ClassCourse[];
		},
	});

	const { data: classes } = useQuery({
		queryKey: ["classes"],
		queryFn: async () => {
			const { items } = await trpcClient.classes.list.query({});
			return items as Class[];
		},
	});

	const { data: courses } = useQuery({
		queryKey: ["courses"],
		queryFn: async () => {
			const { items } = await trpcClient.courses.list.query({});
			return items as Course[];
		},
	});

	const classMap = new Map((classes ?? []).map((c) => [c.id, c.name]));
	const courseMap = new Map((courses ?? []).map((c) => [c.id, c.name]));
	const classCourseMap = new Map((classCourses ?? []).map((cc) => [cc.id, cc]));

	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			await trpcClient.exams.delete.mutate({ id });
		},
		onSuccess: () => {
			queryClient.invalidateQueries(trpc.exams.listPaged.queryKey());
			toast.success(t("admin.exams.toast.deleteSuccess"));
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error && error.message
					? error.message
					: t("admin.exams.toast.deleteError");
			toast.error(message);
		},
	});

	const selection = useRowSelection(exams);

	const bulkDeleteMutation = useMutation({
		mutationFn: async (ids: string[]) => {
			await Promise.all(
				ids.map((id) => trpcClient.exams.delete.mutate({ id })),
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries(trpc.exams.listPaged.queryKey());
			selection.clear();
			toast.success(
				t("common.bulkActions.deleteSuccess", {
					defaultValue: "Items deleted successfully",
				}),
			);
		},
		onError: () =>
			toast.error(
				t("common.bulkActions.deleteError", {
					defaultValue: "Failed to delete items",
				}),
			),
	});

	const submitExamMutation = useMutation({
		mutationFn: async (examId: string) => {
			await trpcClient.exams.submit.mutate({ examId });
		},
		onSuccess: () => {
			queryClient.invalidateQueries(trpc.exams.listPaged.queryKey());
			toast.success(t("admin.exams.toast.submitSuccess"));
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error && error.message
					? error.message
					: t("admin.exams.toast.submitError");
			toast.error(message);
		},
	});

	const validateExamMutation = useMutation({
		mutationFn: async ({
			examId,
			status,
			rejectionReason,
		}: {
			examId: string;
			status: "approved" | "rejected";
			rejectionReason?: string;
		}) => {
			await trpcClient.exams.validate.mutate({
				examId,
				status,
				rejectionReason,
			});
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries(trpc.exams.listPaged.queryKey());
			if (variables.status === "approved") {
				toast.success(t("admin.exams.toast.approveSuccess"));
			} else {
				toast.success(t("admin.exams.toast.rejectSuccess"));
			}
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error && error.message
					? error.message
					: t("admin.exams.toast.validateError");
			toast.error(message);
		},
	});

	const openExamForm = (exam?: Exam) => ExamFormDialog.call({ exam });

	const openRetakeModal = (exam: Exam) =>
		RetakeExamDialog.call({ parentExam: exam });

	const openDeleteModal = (id: string) =>
		confirmAction({
			title: t("admin.exams.delete.title"),
			message: t("admin.exams.delete.message"),
			confirmText: t("common.actions.delete"),
			onConfirm: () => deleteMutation.mutateAsync(id).catch(() => undefined),
		});

	// Check if exam can have a retake created (must be normal, approved, and not already have a retake)
	const canCreateRetake = (exam: Exam) => {
		return (
			exam.sessionType !== "retake" &&
			exam.status === "approved" &&
			!exams.some((e) => e.parentExamId === exam.id)
		);
	};

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div>
					<h1 className="text-foreground">{t("admin.exams.title")}</h1>
					<p className="text-muted-foreground">{t("admin.exams.subtitle")}</p>
				</div>
				<Button onClick={() => openExamForm()} data-testid="add-exam-button">
					<Plus className="mr-2 h-5 w-5" />
					{t("admin.exams.actions.add")}
				</Button>
			</div>

			<FilterBar
				className="mb-4"
				activeCount={
					[
						!!searchTerm,
						!!academicYearId,
						!!classId,
						!!semesterId,
						!!dateFrom,
						!!dateTo,
					].filter(Boolean).length
				}
				onReset={() => {
					setSearchTerm("");
					setAcademicYearId(null);
					setClassId(null);
					setSemesterId(null);
					setDateFrom(null);
					setDateTo(null);
					setPage(1);
				}}
			>
				<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
					<div className="space-y-1.5">
						<p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
							{t("admin.exams.filters.search")}
						</p>
						<DebouncedSearchField
							value={searchTerm}
							onChange={handleFilter(setSearchTerm)}
							placeholder={t("admin.exams.filters.searchPlaceholder")}
							disabled={!academicYearId}
						/>
					</div>
					<div className="space-y-1.5">
						<p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
							{t("admin.exams.filters.academicYear")}
						</p>
						<AcademicYearSelect
							value={academicYearId}
							onChange={handleFilter(setAcademicYearId)}
							disabled={isLoadingExams}
						/>
					</div>
					<div className="space-y-1.5">
						<p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
							{t("admin.exams.filters.class")}
						</p>
						<ClassSelect
							academicYearId={academicYearId}
							value={classId}
							onChange={handleFilter(setClassId)}
							disabled={!academicYearId}
						/>
					</div>
					<div className="space-y-1.5">
						<p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
							{t("admin.exams.filters.semester")}
						</p>
						<SemesterSelect
							value={semesterId}
							onChange={handleFilter(setSemesterId)}
						/>
					</div>
					<div className="space-y-1.5">
						<p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
							{t("admin.exams.filters.dateFrom")}
						</p>
						<DatePicker
							value={dateFrom ?? undefined}
							onChange={(d) => handleFilter(setDateFrom)(d ?? null)}
							placeholder={t("admin.exams.filters.dateFromPlaceholder")}
							disabled={!academicYearId}
						/>
					</div>
					<div className="space-y-1.5">
						<p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
							{t("admin.exams.filters.dateTo")}
						</p>
						<DatePicker
							value={dateTo ?? undefined}
							onChange={(d) => handleFilter(setDateTo)(d ?? null)}
							placeholder={t("admin.exams.filters.dateToPlaceholder")}
							disabled={!academicYearId}
						/>
					</div>
				</div>
			</FilterBar>

			<Card>
				<CardContent className="pt-4">
					{isLoadingExams ? (
						<TableSkeleton columns={9} rows={8} />
					) : !exams.length ? (
						<Empty className="border border-dashed">
							<EmptyHeader>
								<EmptyMedia variant="icon">
									<ClipboardList className="h-8 w-8 text-muted-foreground" />
								</EmptyMedia>
								<EmptyTitle>{t("admin.exams.empty.title")}</EmptyTitle>
								<EmptyDescription>
									{t("admin.exams.empty.description")}
								</EmptyDescription>
							</EmptyHeader>
							<EmptyContent>
								<Button
									onClick={() => openExamForm()}
									data-testid="add-exam-button-empty"
								>
									<Plus className="mr-2 h-4 w-4" />
									{t("admin.exams.actions.add")}
								</Button>
							</EmptyContent>
						</Empty>
					) : (
						<>
							<BulkActionBar
								selectedCount={selection.selectedCount}
								onClear={selection.clear}
							>
								<Button
									variant="destructive"
									size="sm"
									onClick={() =>
										confirmAction({
											title: t("common.bulkActions.confirmDeleteTitle", {
												defaultValue: "Delete selected items?",
											}),
											message: t("common.bulkActions.confirmDelete", {
												defaultValue:
													"Are you sure you want to delete the selected items?",
											}),
											confirmText: t("common.actions.delete"),
											onConfirm: () =>
												bulkDeleteMutation.mutate([...selection.selectedIds]),
										})
									}
									disabled={bulkDeleteMutation.isPending}
								>
									<Trash2 className="mr-1 h-3.5 w-3.5" />
									{t("common.actions.delete")}
								</Button>
							</BulkActionBar>
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="w-10">
												<Checkbox
													checked={
														selection.isAllSelected
															? true
															: selection.isSomeSelected
																? "indeterminate"
																: false
													}
													onCheckedChange={(checked) =>
														selection.toggleAll(Boolean(checked))
													}
												/>
											</TableHead>
											<TableHead>{t("admin.exams.table.name")}</TableHead>
											<TableHead>{t("admin.exams.table.course")}</TableHead>
											<TableHead>{t("admin.exams.table.class")}</TableHead>
											<TableHead className="w-28">
												{t("admin.exams.table.type")}
											</TableHead>
											<TableHead className="w-28">
												{t("admin.exams.table.date")}
											</TableHead>
											<TableHead className="w-16">
												{t("admin.exams.table.percentage")}
											</TableHead>
											<TableHead className="w-28">
												{t("admin.exams.table.status")}
											</TableHead>
											<TableHead className="w-[100px] text-right">
												{t("common.table.actions")}
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{exams.map((exam) => {
											const classCourse = classCourseMap.get(exam.classCourse);
											const resolvedCourse =
												exam.courseName ??
												(classCourse
													? courseMap.get(classCourse.course)
													: null) ??
												t("common.labels.notAvailable");
											const resolvedClass =
												exam.className ??
												(classCourse
													? classMap.get(classCourse.class)
													: null) ??
												t("common.labels.notAvailable");
											const isRetake = exam.sessionType === "retake";
											return (
												<TableRow
													key={exam.id}
													actions={
														<>
															<ContextMenuItem
																onSelect={() => openExamForm(exam)}
																disabled={exam.isLocked}
															>
																<span>
																	{t("common.actions.edit", {
																		defaultValue: "Edit",
																	})}
																</span>
															</ContextMenuItem>
															<ContextMenuItem
																onSelect={() =>
																	navigate(
																		`/teacher/grades/${exam.classCourse}?examId=${exam.id}`,
																	)
																}
															>
																<ClipboardList className="h-4 w-4" />
																<span>
																	{t("admin.exams.actions.reviewGrades", {
																		defaultValue: "Review grades",
																	})}
																</span>
															</ContextMenuItem>
															<ContextMenuItem
																onSelect={() => openRetakeModal(exam)}
															>
																<RotateCcw className="h-4 w-4" />
																<span>
																	{t("admin.exams.actions.retake", {
																		defaultValue: "Add retake",
																	})}
																</span>
															</ContextMenuItem>
															<ContextMenuSeparator />
															<ContextMenuItem
																variant="destructive"
																onSelect={() => openDeleteModal(exam.id)}
															>
																<span>{t("common.actions.delete")}</span>
															</ContextMenuItem>
														</>
													}
												>
													<TableCell className="w-10">
														<Checkbox
															checked={selection.isSelected(exam.id)}
															onCheckedChange={() => selection.toggle(exam.id)}
														/>
													</TableCell>
													<TableCell className="font-medium">
														<div className="flex items-center gap-2">
															{exam.name}
															{isRetake && (
																<Badge
																	variant="outline"
																	className="border-amber-500 text-amber-600"
																>
																	{t("retakes.badge.retake")}
																</Badge>
															)}
														</div>
													</TableCell>
													<TableCell>{resolvedCourse}</TableCell>
													<TableCell>{resolvedClass}</TableCell>
													<TableCell>{exam.type}</TableCell>
													<TableCell>
														{format(new Date(exam.date), "MMM d, yyyy")}
													</TableCell>
													<TableCell>{exam.percentage}%</TableCell>
													<TableCell>
														<Badge
															variant="outline"
															className={
																exam.status === "approved"
																	? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-100"
																	: exam.status === "submitted"
																		? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-400/20 dark:text-blue-100"
																		: exam.status === "rejected"
																			? "border-red-500 bg-red-50 text-red-700 dark:bg-red-400/20 dark:text-red-100"
																			: "border-gray-400 bg-muted/50 text-foreground dark:bg-gray-400/20 dark:text-gray-100"
															}
														>
															{t(
																`admin.exams.status.${exam.status || "draft"}`,
															)}
														</Badge>
														{exam.isLocked && (
															<Badge
																variant="secondary"
																className="ml-1 bg-amber-100 text-amber-900 dark:bg-amber-400/20 dark:text-amber-100"
															>
																{t("admin.exams.status.locked")}
															</Badge>
														)}
													</TableCell>
													<TableCell className="text-right">
														<DropdownMenu>
															<DropdownMenuTrigger asChild>
																<Button
																	variant="ghost"
																	size="icon-sm"
																	className="row-action-fade"
																>
																	<MoreHorizontal className="h-4 w-4" />
																	<span className="sr-only">
																		{t("common.table.actions")}
																	</span>
																</Button>
															</DropdownMenuTrigger>
															<DropdownMenuContent align="end">
																{/* Review Grades */}
																<DropdownMenuItem asChild>
																	<Link
																		to={`/teacher/grades/${exam.classCourse}?examId=${exam.id}`}
																	>
																		<ClipboardList className="mr-2 h-4 w-4" />
																		{t("admin.exams.actions.reviewGrades")}
																	</Link>
																</DropdownMenuItem>

																{/* Edit */}
																<DropdownMenuItem
																	onClick={() => openExamForm(exam)}
																	disabled={exam.isLocked}
																>
																	<Pencil className="mr-2 h-4 w-4" />
																	{t("common.actions.edit")}
																</DropdownMenuItem>

																<DropdownMenuSeparator />

																{/* Workflow actions */}
																{(exam.status === "draft" ||
																	exam.status === "scheduled") && (
																	<DropdownMenuItem
																		onClick={() =>
																			submitExamMutation.mutate(exam.id)
																		}
																		disabled={submitExamMutation.isPending}
																	>
																		<Send className="mr-2 h-4 w-4" />
																		{t("admin.exams.actions.submit")}
																	</DropdownMenuItem>
																)}

																{exam.status === "submitted" && (
																	<>
																		<DropdownMenuItem
																			onClick={() =>
																				validateExamMutation.mutate({
																					examId: exam.id,
																					status: "approved",
																				})
																			}
																			disabled={validateExamMutation.isPending}
																			className="text-emerald-600 focus:text-emerald-600"
																		>
																			<Check className="mr-2 h-4 w-4" />
																			{t("admin.exams.actions.approve")}
																		</DropdownMenuItem>
																		<DropdownMenuItem
																			onClick={() =>
																				RejectExamDialog.call({
																					examId: exam.id,
																				})
																			}
																			disabled={validateExamMutation.isPending}
																			className="text-red-600 focus:text-red-600"
																		>
																			<X className="mr-2 h-4 w-4" />
																			{t("admin.exams.actions.reject")}
																		</DropdownMenuItem>
																	</>
																)}

																{/* Create Retake */}
																{canCreateRetake(exam) && (
																	<DropdownMenuItem
																		onClick={() => openRetakeModal(exam)}
																	>
																		<RefreshCw className="mr-2 h-4 w-4" />
																		{t("retakes.actions.createRetake")}
																	</DropdownMenuItem>
																)}

																<DropdownMenuSeparator />

																{/* Delete */}
																<DropdownMenuItem
																	onClick={() => openDeleteModal(exam.id)}
																	disabled={exam.isLocked}
																	className="text-destructive focus:text-destructive"
																>
																	<Trash2 className="mr-2 h-4 w-4" />
																	{t("common.actions.delete")}
																</DropdownMenuItem>
															</DropdownMenuContent>
														</DropdownMenu>
													</TableCell>
												</TableRow>
											);
										})}
									</TableBody>
								</Table>
							</div>
							<TablePagination
								page={page}
								pageCount={examsData?.pageCount ?? 1}
								total={examsData?.total ?? 0}
								pageSize={pageSize}
								onPageChange={setPage}
								onPageSizeChange={(s) => {
									setPageSize(s);
									setPage(1);
								}}
							/>
						</>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
