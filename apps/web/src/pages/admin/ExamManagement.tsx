import { zodResolver } from "@hookform/resolvers/zod";
import {
	useInfiniteQuery,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { format } from "date-fns";
import type { TFunction } from "i18next";
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
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import { z } from "zod";
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
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { toast } from "@/lib/toast";
import ConfirmModal from "../../components/modals/ConfirmModal";
import FormModal from "../../components/modals/FormModal";
import { Badge } from "../../components/ui/badge";
import { BulkActionBar } from "../../components/ui/bulk-action-bar";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Checkbox } from "../../components/ui/checkbox";
import { DialogFooter } from "../../components/ui/dialog";
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
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "../../components/ui/form";
import { Input } from "../../components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../components/ui/select";
import { Spinner } from "../../components/ui/spinner";
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
import { type RouterOutputs, trpc, trpcClient } from "../../utils/trpc";

const buildExamSchema = (t: TFunction) =>
	z.object({
		name: z.string().min(2, t("admin.exams.validation.name")),
		type: z.string().min(2, t("admin.exams.validation.type")),
		date: z.string().min(1, t("admin.exams.validation.date")),
		percentage: z
			.number()
			.min(1, t("admin.exams.validation.percentage.min"))
			.max(100, t("admin.exams.validation.percentage.max")),
		classCourseId: z.string({
			required_error: t("admin.exams.validation.classCourse"),
		}),
	});

type ExamFormData = z.infer<ReturnType<typeof buildExamSchema>>;

const buildRetakeSchema = (t: TFunction) =>
	z.object({
		name: z.string().optional(),
		date: z.string().min(1, t("admin.exams.validation.date")),
		scoringPolicy: z.enum(["replace", "best_of"]).default("replace"),
	});

type RetakeFormData = z.infer<ReturnType<typeof buildRetakeSchema>>;

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
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const [isRetakeFormOpen, setIsRetakeFormOpen] = useState(false);
	const [editingExam, setEditingExam] = useState<Exam | null>(null);
	const [retakeParentExam, setRetakeParentExam] = useState<Exam | null>(null);
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [academicYearId, setAcademicYearId] = useState<string | null>(null);
	const [classId, setClassId] = useState<string | null>(null);
	const [semesterId, setSemesterId] = useState<string | null>(null);
	const [dateFrom, setDateFrom] = useState<Date | null>(null);
	const [dateTo, setDateTo] = useState<Date | null>(null);
	useEffect(() => {
		setClassId(null);
		setSemesterId(null);
	}, [academicYearId]);

	const yearsQuery = useQuery({
		...trpc.academicYears.list.queryOptions({}),
	});
	useEffect(() => {
		if (!academicYearId && yearsQuery.data?.items) {
			const active = yearsQuery.data.items.find((y) => y.isActive);
			if (active) setAcademicYearId(active.id);
		}
	}, [yearsQuery.data, academicYearId]);

	const queryClient = useQueryClient();
	const { t } = useTranslation();
	const navigate = useNavigate();
	const examSchema = useMemo(() => buildExamSchema(t), [t]);
	const retakeSchema = useMemo(() => buildRetakeSchema(t), [t]);

	const examsQuery = useInfiniteQuery({
		queryKey: [
			"exams",
			academicYearId,
			searchTerm,
			classId,
			semesterId,
			dateFrom,
			dateTo,
		],
		queryFn: async ({ pageParam }) => {
			if (!academicYearId) {
				return {
					items: [] as Exam[],
					nextCursor: undefined as string | undefined,
				};
			}
			const { items, nextCursor } = await trpcClient.exams.list.query({
				academicYearId,
				query: searchTerm.trim() ? searchTerm.trim() : undefined,
				classId: classId ?? undefined,
				semesterId: semesterId ?? undefined,
				dateFrom: dateFrom ?? undefined,
				dateTo: dateTo ?? undefined,
				cursor: pageParam,
				limit: 20,
			});
			return {
				items: items.map(
					(exam) =>
						({
							...exam,
							percentage: Number(exam.percentage),
						}) as Exam,
				),
				nextCursor,
			};
		},
		initialPageParam: undefined as string | undefined,
		getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
		enabled: Boolean(academicYearId),
	});
	const exams = examsQuery.data?.pages.flatMap((page) => page.items) ?? [];
	const isLoadingExams =
		examsQuery.isLoading || (!academicYearId && yearsQuery.isLoading);
	const isFetchingNextPage = examsQuery.isFetchingNextPage;
	const hasNextPage = Boolean(examsQuery.hasNextPage);
	const fetchNextPage = examsQuery.fetchNextPage;
	const sentinelRef = useInfiniteScroll(fetchNextPage, {
		enabled: hasNextPage && !isFetchingNextPage,
	});

	const semestersQuery = useQuery({
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

	const form = useForm<ExamFormData>({
		resolver: zodResolver(examSchema),
	});

	const retakeForm = useForm<RetakeFormData>({
		resolver: zodResolver(retakeSchema),
		defaultValues: {
			scoringPolicy: "replace",
		},
	});

	const classMap = new Map((classes ?? []).map((c) => [c.id, c.name]));
	const courseMap = new Map((courses ?? []).map((c) => [c.id, c.name]));
	const classCourseMap = new Map((classCourses ?? []).map((cc) => [cc.id, cc]));

	const createMutation = useMutation({
		mutationFn: async (data: ExamFormData) => {
			await trpcClient.exams.create.mutate({
				...data,
				date: new Date(data.date),
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["exams"] });
			toast.success(t("admin.exams.toast.createSuccess"));
			setIsFormOpen(false);
			form.reset();
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error && error.message
					? error.message
					: t("admin.exams.toast.createError");
			toast.error(message);
		},
	});

	const updateMutation = useMutation({
		mutationFn: async (data: ExamFormData & { id: string }) => {
			const { id, ...updateData } = data;
			await trpcClient.exams.update.mutate({
				id,
				...updateData,
				date: new Date(updateData.date),
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["exams"] });
			toast.success(t("admin.exams.toast.updateSuccess"));
			setIsFormOpen(false);
			setEditingExam(null);
			form.reset();
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error && error.message
					? error.message
					: t("admin.exams.toast.updateError");
			toast.error(message);
		},
	});

	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			await trpcClient.exams.delete.mutate({ id });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["exams"] });
			toast.success(t("admin.exams.toast.deleteSuccess"));
			setIsDeleteOpen(false);
			setDeleteId(null);
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
			queryClient.invalidateQueries({ queryKey: ["exams"] });
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

	const createRetakeMutation = useMutation({
		mutationFn: async (data: RetakeFormData & { parentExamId: string }) => {
			await trpcClient.exams.createRetake.mutate({
				parentExamId: data.parentExamId,
				name: data.name || undefined,
				date: new Date(data.date),
				scoringPolicy: data.scoringPolicy,
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["exams"] });
			toast.success(t("admin.exams.toast.retakeSuccess"));
			setIsRetakeFormOpen(false);
			setRetakeParentExam(null);
			retakeForm.reset();
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error && error.message
					? error.message
					: t("admin.exams.toast.retakeError");
			toast.error(message);
		},
	});

	const submitExamMutation = useMutation({
		mutationFn: async (examId: string) => {
			await trpcClient.exams.submit.mutate({ examId });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["exams"] });
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
		}: {
			examId: string;
			status: "approved" | "rejected";
		}) => {
			await trpcClient.exams.validate.mutate({ examId, status });
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: ["exams"] });
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

	const onSubmit = async (data: ExamFormData) => {
		if (editingExam) {
			updateMutation.mutate({ ...data, id: editingExam.id });
		} else {
			createMutation.mutate(data);
		}
	};

	const onRetakeSubmit = async (data: RetakeFormData) => {
		if (retakeParentExam) {
			createRetakeMutation.mutate({
				...data,
				parentExamId: retakeParentExam.id,
			});
		}
	};

	const openRetakeModal = (exam: Exam) => {
		setRetakeParentExam(exam);
		retakeForm.reset({
			name: `${exam.name} - ${t("retakes.badge.retake")}`,
			date: "",
			scoringPolicy: "replace",
		});
		setIsRetakeFormOpen(true);
	};

	const openDeleteModal = (id: string) => {
		setDeleteId(id);
		setIsDeleteOpen(true);
	};

	const handleDelete = () => {
		if (deleteId) {
			deleteMutation.mutate(deleteId);
		}
	};

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
				<Button
					onClick={() => {
						setEditingExam(null);
						form.reset();
						setIsFormOpen(true);
					}}
					data-testid="add-exam-button"
				>
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
				}}
			>
				<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
					<div className="space-y-1.5">
						<p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
							{t("admin.exams.filters.search")}
						</p>
						<DebouncedSearchField
							value={searchTerm}
							onChange={setSearchTerm}
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
							onChange={(value) => setAcademicYearId(value)}
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
							onChange={setClassId}
							disabled={!academicYearId}
						/>
					</div>
					<div className="space-y-1.5">
						<p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
							{t("admin.exams.filters.semester")}
						</p>
						<SemesterSelect value={semesterId} onChange={setSemesterId} />
					</div>
					<div className="space-y-1.5">
						<p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
							{t("admin.exams.filters.dateFrom")}
						</p>
						<DatePicker
							value={dateFrom ?? undefined}
							onChange={(d) => setDateFrom(d ?? null)}
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
							onChange={(d) => setDateTo(d ?? null)}
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
									onClick={() => {
										setEditingExam(null);
										form.reset();
										setIsFormOpen(true);
									}}
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
									onClick={() => {
										if (
											window.confirm(
												t("common.bulkActions.confirmDelete", {
													defaultValue:
														"Are you sure you want to delete the selected items?",
												}),
											)
										) {
											bulkDeleteMutation.mutate([...selection.selectedIds]);
										}
									}}
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
																onSelect={() => {
																	setEditingExam(exam);
																}}
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
																	onClick={() => {
																		setEditingExam(exam);
																		form.reset({
																			name: exam.name,
																			type: exam.type,
																			date: exam.date.split("T")[0],
																			percentage: exam.percentage,
																			classCourseId: exam.classCourse,
																		});
																		setIsFormOpen(true);
																	}}
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
																				validateExamMutation.mutate({
																					examId: exam.id,
																					status: "rejected",
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
							<div ref={sentinelRef} className="h-1" />
							{hasNextPage ? (
								<div className="mt-4 flex justify-center">
									<Button
										variant="outline"
										onClick={() => fetchNextPage()}
										disabled={isFetchingNextPage}
									>
										{isFetchingNextPage
											? t("common.loading")
											: t("admin.exams.pagination.loadMore")}
									</Button>
								</div>
							) : null}
						</>
					)}
				</CardContent>
			</Card>

			<FormModal
				isOpen={isFormOpen}
				onClose={() => {
					setIsFormOpen(false);
					setEditingExam(null);
					form.reset();
				}}
				title={
					editingExam
						? t("admin.exams.form.editTitle")
						: t("admin.exams.form.createTitle")
				}
			>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="classCourseId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("admin.exams.form.courseLabel")}</FormLabel>
									<Select onValueChange={field.onChange} value={field.value}>
										<FormControl>
											<SelectTrigger
												id="classCourseId"
												data-testid="class-course-select"
											>
												<SelectValue
													placeholder={t("admin.exams.form.coursePlaceholder")}
												/>
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{classCourses?.map((cc) => (
												<SelectItem key={cc.id} value={cc.id}>
													{courseMap.get(cc.course)} - {classMap.get(cc.class)}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("admin.exams.form.nameLabel")}</FormLabel>
									<FormControl>
										<Input
											{...field}
											placeholder={t("admin.exams.form.namePlaceholder")}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="type"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("admin.exams.form.typeLabel")}</FormLabel>
									<FormControl>
										<Input
											{...field}
											id="examType"
											data-testid="exam-type-select"
											placeholder={t("admin.exams.form.typePlaceholder")}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="date"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("admin.exams.form.dateLabel")}</FormLabel>
									<FormControl>
										<DatePicker
											value={field.value ?? ""}
											onChange={field.onChange}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="percentage"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("admin.exams.form.percentageLabel")}</FormLabel>
									<FormControl>
										<Input
											type="number"
											value={field.value ?? ""}
											onChange={(event) =>
												field.onChange(
													event.target.value === ""
														? undefined
														: Number(event.target.value),
												)
											}
											placeholder={t("admin.exams.form.percentagePlaceholder")}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<DialogFooter className="gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => {
									setIsFormOpen(false);
									setEditingExam(null);
									form.reset();
								}}
							>
								{t("common.actions.cancel")}
							</Button>
							<Button type="submit" disabled={form.formState.isSubmitting}>
								{form.formState.isSubmitting ? (
									<Spinner className="mr-2 h-4 w-4" />
								) : editingExam ? (
									t("common.actions.saveChanges")
								) : (
									t("admin.exams.form.submit")
								)}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</FormModal>

			<ConfirmModal
				isOpen={isDeleteOpen}
				onClose={() => {
					setIsDeleteOpen(false);
					setDeleteId(null);
				}}
				onConfirm={handleDelete}
				title={t("admin.exams.delete.title")}
				message={t("admin.exams.delete.message")}
				confirmText={t("common.actions.delete")}
				isLoading={deleteMutation.isPending}
			/>

			{/* Retake Creation Modal */}
			<FormModal
				isOpen={isRetakeFormOpen}
				onClose={() => {
					setIsRetakeFormOpen(false);
					setRetakeParentExam(null);
					retakeForm.reset();
				}}
				title={t("retakes.form.title")}
			>
				<Form {...retakeForm}>
					<form
						onSubmit={retakeForm.handleSubmit(onRetakeSubmit)}
						className="space-y-4"
					>
						{retakeParentExam && (
							<div className="rounded-md border bg-muted/50 p-4">
								<p className="text-muted-foreground text-xs">
									{t("retakes.form.parentExamLabel")}
								</p>
								<p className="font-medium">{retakeParentExam.name}</p>
								<p className="text-muted-foreground text-xs">
									{retakeParentExam.courseName} - {retakeParentExam.className}
								</p>
							</div>
						)}

						<FormField
							control={retakeForm.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("retakes.form.nameLabel")}</FormLabel>
									<FormControl>
										<Input
											{...field}
											placeholder={
												retakeParentExam
													? `${retakeParentExam.name} - ${t("retakes.badge.retake")}`
													: t("retakes.form.namePlaceholder")
											}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={retakeForm.control}
							name="date"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("retakes.form.dateLabel")}</FormLabel>
									<FormControl>
										<DatePicker
											value={field.value ?? ""}
											onChange={field.onChange}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={retakeForm.control}
							name="scoringPolicy"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("retakes.form.scoringPolicyLabel")}</FormLabel>
									<Select onValueChange={field.onChange} value={field.value}>
										<FormControl>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="replace">
												{t("retakes.scoringPolicy.replace")}
											</SelectItem>
											<SelectItem value="best_of">
												{t("retakes.scoringPolicy.best_of")}
											</SelectItem>
										</SelectContent>
									</Select>
									<p className="text-muted-foreground text-xs">
										{field.value === "replace"
											? t("retakes.scoringPolicy.replaceDescription")
											: t("retakes.scoringPolicy.best_ofDescription")}
									</p>
									<FormMessage />
								</FormItem>
							)}
						/>

						<DialogFooter className="gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => {
									setIsRetakeFormOpen(false);
									setRetakeParentExam(null);
									retakeForm.reset();
								}}
							>
								{t("common.actions.cancel")}
							</Button>
							<Button
								type="submit"
								disabled={retakeForm.formState.isSubmitting}
							>
								{retakeForm.formState.isSubmitting ? (
									<Spinner className="mr-2 h-4 w-4" />
								) : (
									t("retakes.form.submit")
								)}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</FormModal>
		</div>
	);
}
