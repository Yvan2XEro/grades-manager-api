import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	BookOpen,
	FileDown,
	Layers,
	Pencil,
	Plus,
	Trash2,
	Users,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { confirmAction } from "@/components/callable/confirm";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import { SemesterSelect } from "@/components/inputs/SemesterSelect";
import { BulkActionBar } from "@/components/ui/bulk-action-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ClipboardCopy } from "@/components/ui/clipboard-copy";
import {
	ContextMenuItem,
	ContextMenuSeparator,
} from "@/components/ui/context-menu";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { useRowSelection } from "@/hooks/useRowSelection";
import { toast } from "@/lib/toast";
import type { RouterOutputs } from "@/utils/trpc";
import { trpc, trpcClient } from "@/utils/trpc";
import {
	AssignTeachingUnitDialog,
	AutoEnrollClassDialog,
	CLASSES_KEY,
	ClassCourseFormDialog,
	CourseCatalogExportDialog,
	fetchClassOptions,
} from "./ClassCourseDialogs";

interface ClassCourse {
	id: string;
	code: string;
	class: string;
	course: string;
	teacher: string;
	semesterId: string | null;
	courseName?: string | null;
	courseCode?: string | null;
	ueSemester?: string | null;
	coefficient: number;
}

interface Program {
	id: string;
	name: string;
	code?: string | null;
}

type Teacher = RouterOutputs["users"]["list"]["items"][number];

export default function ClassCourseManagement() {
	const [filterYear, setFilterYear] = useState<string | null>(null);
	const [filterSemester, setFilterSemester] = useState<string | null>(null);
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);

	// Auto-enroll state

	const handleFilter =
		<T,>(setter: (v: T) => void) =>
		(value: T) => {
			setter(value);
			setPage(1);
		};

	const queryClient = useQueryClient();
	const { t } = useTranslation();

	const { data: classes = [] } = useQuery({
		queryKey: CLASSES_KEY,
		queryFn: fetchClassOptions,
	});

	// Same key and shape as the class/course forms (raw rows, cached once)
	const { data: programs } = useQuery({
		queryKey: ["programs"],
		queryFn: async () => {
			const { items } = await trpcClient.programs.list.query({ limit: 100 });
			return items as Program[];
		},
	});

	const { data: teachers } = useQuery({
		queryKey: ["teachers"],
		queryFn: async () => {
			const { items } = await trpcClient.users.list.query({
				role: "teacher",
				limit: 100,
			});
			return items;
		},
	});

	const { data: classCoursesData, isLoading } = useQuery(
		trpc.classCourses.listPaged.queryOptions({
			page,
			pageSize,
			academicYearId: filterYear || undefined,
			semesterId: filterSemester || undefined,
		}),
	);
	const classCourses: ClassCourse[] = (classCoursesData?.items ?? []).map(
		(cc) => ({
			id: cc.id,
			code: cc.code,
			class: cc.class,
			course: cc.course,
			teacher: cc.teacher,
			semesterId: cc.semesterId ?? null,
			courseName: cc.courseName,
			courseCode: cc.courseCode,
			ueSemester: cc.ueSemester ?? null,
			coefficient: Number(cc.coefficient) ?? 1,
		}),
	);

	const formatTeacherName = (teacher: Teacher) =>
		[teacher.firstName, teacher.lastName].filter(Boolean).join(" ") ||
		teacher.email;

	const teacherOptions = teachers ?? [];

	const classMap = new Map((classes ?? []).map((c) => [c.id, c]));
	const programMap = new Map((programs ?? []).map((p) => [p.id, p]));
	const teacherMap = new Map(
		teacherOptions.map((teacher: Teacher) => [
			teacher.id,
			formatTeacherName(teacher),
		]),
	);
	const classCourseCodes = classCourses.map((cc) => cc.code).filter(Boolean);

	const selection = useRowSelection(classCourses);

	const bulkDeleteMutation = useMutation({
		mutationFn: async (ids: string[]) => {
			await Promise.all(
				ids.map((id) => trpcClient.classCourses.delete.mutate({ id })),
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries(trpc.classCourses.listPaged.queryKey());
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

	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			await trpcClient.classCourses.delete.mutate({ id });
		},
		onSuccess: () => {
			queryClient.invalidateQueries(trpc.classCourses.listPaged.queryKey());
			toast.success(t("admin.classCourses.toast.deleteSuccess"));
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error && error.message
					? error.message
					: t("admin.classCourses.toast.deleteError");
			toast.error(message);
		},
	});

	const startCreate = () =>
		ClassCourseFormDialog.call({
			existingCodes: classCourseCodes,
			academicYearId: filterYear,
		});

	const startEdit = (classCourse: ClassCourse) =>
		ClassCourseFormDialog.call({
			classCourse,
			existingCodes: classCourseCodes,
			academicYearId: filterYear,
		});

	const confirmDelete = (id: string) =>
		confirmAction({
			title: t("admin.classCourses.delete.title"),
			message: t("admin.classCourses.delete.message"),
			confirmText: t("common.actions.delete"),
			onConfirm: () => deleteMutation.mutateAsync(id).catch(() => undefined),
		});

	if (isLoading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<Spinner className="h-8 w-8" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div>
					<h1 className="text-foreground">{t("admin.classCourses.title")}</h1>
					<p className="text-muted-foreground">
						{t("admin.classCourses.subtitle")}
					</p>
				</div>
				<div className="flex gap-2">
					<Button
						variant="outline"
						onClick={() =>
							CourseCatalogExportDialog.call({ academicYearId: filterYear })
						}
					>
						<FileDown className="mr-2 h-4 w-4" />
						{t("admin.classCourses.actions.exportPdf", {
							defaultValue: "Exporter PDF",
						})}
					</Button>
					<Button
						variant="outline"
						onClick={() => AutoEnrollClassDialog.call()}
					>
						<Users className="mr-2 h-4 w-4" />
						{t("admin.classCourses.actions.autoEnroll", {
							defaultValue: "Inscrire les étudiants",
						})}
					</Button>
					<Button
						variant="outline"
						onClick={() =>
							AssignTeachingUnitDialog.call({
								existingCodes: classCourseCodes,
								academicYearId: filterYear,
							})
						}
					>
						<Layers className="mr-2 h-4 w-4" />
						{t("admin.classCourses.actions.assignUe", {
							defaultValue: "Assigner un UE",
						})}
					</Button>
					<Button onClick={startCreate}>
						<Plus className="mr-2 h-4 w-4" />
						{t("admin.classCourses.actions.assign")}
					</Button>
				</div>
			</div>

			<Card className="mb-4">
				<CardHeader className="pb-3">
					<CardTitle className="font-medium text-muted-foreground text-sm">
						{t("admin.classes.filters.title", { defaultValue: "Filters" })}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex flex-wrap items-end gap-4">
						<div className="w-56">
							<Label className="mb-1 block font-medium text-sm">
								{t("admin.classes.filters.academicYear", {
									defaultValue: "Academic Year",
								})}
							</Label>
							<AcademicYearSelect
								value={filterYear}
								onChange={handleFilter(setFilterYear)}
							/>
						</div>
						<div className="w-56">
							<Label className="mb-1 block font-medium text-sm">
								{t("admin.classes.filters.semester", {
									defaultValue: "Semester",
								})}
							</Label>
							<SemesterSelect
								value={filterSemester}
								onChange={handleFilter(setFilterSemester)}
							/>
						</div>
					</div>
				</CardContent>
			</Card>

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
					<Trash2 className="mr-1.5 h-3.5 w-3.5" />
					{t("common.actions.delete")}
				</Button>
			</BulkActionBar>

			<Card>
				<CardContent>
					{isLoading ? (
						<TableSkeleton columns={8} rows={8} />
					) : classCourses.length > 0 ? (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="w-10">
										<Checkbox
											checked={selection.isAllSelected}
											onCheckedChange={(checked) =>
												selection.toggleAll(!!checked)
											}
											aria-label="Select all"
										/>
									</TableHead>
									<TableHead>
										{t("admin.classCourses.table.code", {
											defaultValue: "Code",
										})}
									</TableHead>
									<TableHead>{t("admin.classCourses.table.class")}</TableHead>
									<TableHead>{t("admin.classCourses.table.program")}</TableHead>
									<TableHead>{t("admin.classCourses.table.course")}</TableHead>
									<TableHead>
										{t("admin.classCourses.table.semester", {
											defaultValue: "Semester",
										})}
									</TableHead>
									<TableHead>{t("admin.classCourses.table.teacher")}</TableHead>
									<TableHead className="text-right">
										{t("common.table.actions")}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{classCourses.map((classCourse) => (
									<TableRow
										key={classCourse.id}
										actions={
											<>
												<ContextMenuItem
													onSelect={() => startEdit(classCourse)}
												>
													{t("common.actions.edit")}
												</ContextMenuItem>
												<ContextMenuSeparator />
												<ContextMenuItem
													className="text-destructive"
													onSelect={() => confirmDelete(classCourse.id)}
												>
													{t("common.actions.delete")}
												</ContextMenuItem>
											</>
										}
									>
										<TableCell>
											<Checkbox
												checked={selection.isSelected(classCourse.id)}
												onCheckedChange={() => selection.toggle(classCourse.id)}
												aria-label={`Select ${classCourse.code}`}
											/>
										</TableCell>
										<TableCell>
											<ClipboardCopy
												value={classCourse.code}
												label={t("admin.classCourses.table.code", {
													defaultValue: "Code",
												})}
											/>
										</TableCell>
										<TableCell className="font-medium">
											{classMap.get(classCourse.class)?.name}
										</TableCell>
										<TableCell>
											{programMap.get(
												classMap.get(classCourse.class)?.program ?? "",
											)?.name ??
												t("common.labels.notAvailable", {
													defaultValue: "N/A",
												})}
										</TableCell>
										<TableCell>
											{classCourse.courseName ? (
												<div className="space-y-0.5">
													<p className="font-medium text-sm">
														{classCourse.courseName}
													</p>
													{classCourse.courseCode && (
														<p className="text-muted-foreground text-xs">
															{classCourse.courseCode}
														</p>
													)}
												</div>
											) : (
												t("common.labels.notAvailable", { defaultValue: "N/A" })
											)}
										</TableCell>
										<TableCell>
											{classCourse.ueSemester
												? t(
														`admin.teachingUnits.semesters.${classCourse.ueSemester}`,
														{
															defaultValue: classCourse.ueSemester,
														},
													)
												: t("common.labels.notAvailable", {
														defaultValue: "N/A",
													})}
										</TableCell>
										<TableCell>{teacherMap.get(classCourse.teacher)}</TableCell>
										<TableCell>
											<div className="flex justify-end gap-2">
												<Button
													variant="ghost"
													size="icon-sm"
													onClick={() => startEdit(classCourse)}
													aria-label={t("admin.classCourses.form.editTitle")}
												>
													<Pencil className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon-sm"
													className="text-destructive hover:text-destructive"
													onClick={() => confirmDelete(classCourse.id)}
													aria-label={t("admin.classCourses.delete.title")}
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					) : (
						<Empty className="border border-dashed">
							<EmptyHeader>
								<BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
								<EmptyTitle>{t("admin.classCourses.empty.title")}</EmptyTitle>
								<EmptyDescription>
									{t("admin.classCourses.empty.description")}
								</EmptyDescription>
							</EmptyHeader>
							<EmptyContent>
								<Button onClick={startCreate}>
									<Plus className="mr-2 h-4 w-4" />
									{t("admin.classCourses.actions.assign")}
								</Button>
							</EmptyContent>
						</Empty>
					)}
				</CardContent>
			</Card>

			<TablePagination
				page={page}
				pageCount={classCoursesData?.pageCount ?? 1}
				total={classCoursesData?.total ?? 0}
				pageSize={pageSize}
				onPageChange={setPage}
				onPageSizeChange={(s) => {
					setPageSize(s);
					setPage(1);
				}}
			/>
		</div>
	);
}
