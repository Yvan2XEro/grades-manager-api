import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, PlusIcon, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { confirmAction } from "@/components/callable/confirm";
import { BulkActionBar } from "@/components/ui/bulk-action-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
	CourseFormDialog,
	fetchTeachers,
	formatTeacherName,
	TEACHERS_KEY,
	type Teacher,
} from "./CourseFormDialog";

interface Course {
	id: string;
	code: string;
	name: string;
	hours: number;
	program: string;
	teachingUnitId?: string | null;
	defaultTeacher: string;
}

type ProgramOption = RouterOutputs["programs"]["list"]["items"][number];

export default function CourseManagement() {
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);

	const queryClient = useQueryClient();
	const { t } = useTranslation();

	const { data, isLoading } = useQuery(
		trpc.courses.listPaged.queryOptions({
			page,
			pageSize,
		}),
	);

	const courseItems = data?.items ?? [];
	const selection = useRowSelection(courseItems);

	const { data: programs = [] } = useQuery({
		queryKey: ["programs"],
		queryFn: async () => {
			const { items } = await trpcClient.programs.list.query({ limit: 100 });
			return items as ProgramOption[];
		},
	});

	const { data: teachers } = useQuery({
		queryKey: TEACHERS_KEY,
		queryFn: fetchTeachers,
	});

	const teacherOptions = teachers ?? [];
	const programMap = useMemo(
		() => new Map((programs ?? []).map((program) => [program.id, program])),
		[programs],
	);
	const teacherMap = new Map(
		teacherOptions.map((teacher: Teacher) => [
			teacher.id,
			formatTeacherName(teacher),
		]),
	);

	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			await trpcClient.courses.delete.mutate({ id });
		},
		onSuccess: () => {
			queryClient.invalidateQueries(trpc.courses.listPaged.queryKey());
			toast.success(t("admin.courses.toast.deleteSuccess"));
		},
		onError: (error: any) => {
			toast.error(error.message || t("admin.courses.toast.deleteError"));
		},
	});

	const bulkDeleteMutation = useMutation({
		mutationFn: async (ids: string[]) => {
			await Promise.all(
				ids.map((id) => trpcClient.courses.delete.mutate({ id })),
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries(trpc.courses.listPaged.queryKey());
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

	const startCreate = () => CourseFormDialog.call({});

	const startEdit = (course: Course) => CourseFormDialog.call({ course });

	const confirmDelete = (id: string) =>
		confirmAction({
			title: t("admin.courses.delete.title"),
			message: t("admin.courses.delete.message"),
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
					<h1 className="text-foreground">
						{t("admin.courses.title", { defaultValue: "Course management" })}
					</h1>
					<p className="text-muted-foreground">
						{t("admin.courses.subtitle", {
							defaultValue: "Manage courses, workloads, and default teachers.",
						})}
					</p>
				</div>
				<Button onClick={startCreate}>
					<PlusIcon className="mr-2 h-4 w-4" />
					{t("admin.courses.actions.add")}
				</Button>
			</div>

			<Card>
				<CardContent>
					{courseItems.length > 0 ? (
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
									<Trash2 className="mr-1.5 h-3.5 w-3.5" />
									{t("common.actions.delete")}
								</Button>
							</BulkActionBar>
							{isLoading ? (
								<TableSkeleton columns={7} rows={8} />
							) : (
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
											<TableHead className="w-20">
												{t("admin.courses.table.code", {
													defaultValue: "Code",
												})}
											</TableHead>
											<TableHead>{t("admin.courses.table.name")}</TableHead>
											<TableHead>{t("admin.courses.table.program")}</TableHead>
											<TableHead className="w-16">
												{t("admin.courses.table.hours")}
											</TableHead>
											<TableHead className="w-36">
												{t("admin.courses.table.teacher")}
											</TableHead>
											<TableHead className="text-right">
												{t("common.table.actions")}
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{courseItems.map((course) => (
											<TableRow
												key={course.id}
												actions={
													<>
														<ContextMenuItem onSelect={() => startEdit(course)}>
															<span>
																{t("common.actions.edit", {
																	defaultValue: "Edit",
																})}
															</span>
														</ContextMenuItem>
														<ContextMenuSeparator />
														<ContextMenuItem
															variant="destructive"
															onSelect={() => confirmDelete(course.id)}
														>
															<span>{t("common.actions.delete")}</span>
														</ContextMenuItem>
													</>
												}
											>
												<TableCell>
													<Checkbox
														checked={selection.isSelected(course.id)}
														onCheckedChange={() => selection.toggle(course.id)}
														aria-label={`Select ${course.name}`}
													/>
												</TableCell>
												<TableCell>
													<ClipboardCopy
														value={course.code}
														label={t("admin.courses.table.code", {
															defaultValue: "Code",
														})}
													/>
												</TableCell>
												<TableCell>{course.name}</TableCell>
												<TableCell>
													{(() => {
														const programInfo = programMap.get(course.program);
														if (!programInfo) {
															return t("common.labels.notAvailable", {
																defaultValue: "N/A",
															});
														}
														return (
															<div className="space-y-0.5">
																<p>{programInfo.name}</p>
															</div>
														);
													})()}
												</TableCell>
												<TableCell>{course.hours}</TableCell>
												<TableCell>
													{teacherMap.get(course.defaultTeacher) ??
														t("admin.courses.form.teacherPlaceholder")}
												</TableCell>
												<TableCell>
													<div className="flex justify-end gap-2">
														<Button
															variant="ghost"
															size="icon-sm"
															onClick={() => startEdit(course)}
															aria-label={t("admin.courses.form.editTitle")}
														>
															<Pencil className="h-4 w-4" />
														</Button>
														<Button
															variant="ghost"
															size="icon-sm"
															className="text-destructive hover:text-destructive"
															onClick={() => confirmDelete(course.id)}
															aria-label={t("admin.courses.delete.title")}
														>
															<Trash2 className="h-4 w-4" />
														</Button>
													</div>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							)}
						</>
					) : (
						<Empty className="border border-dashed">
							<EmptyHeader>
								<EmptyTitle>
									{t("admin.courses.empty.title", {
										defaultValue: "No courses available",
									})}
								</EmptyTitle>
								<EmptyDescription>
									{t("admin.courses.empty.description", {
										defaultValue: "Create a course to populate the catalog.",
									})}
								</EmptyDescription>
							</EmptyHeader>
							<EmptyContent>
								<Button onClick={startCreate}>
									<PlusIcon className="mr-2 h-4 w-4" />
									{t("admin.courses.actions.add")}
								</Button>
							</EmptyContent>
						</Empty>
					)}
				</CardContent>
			</Card>

			<TablePagination
				page={page}
				pageCount={data?.pageCount ?? 1}
				total={data?.total ?? 0}
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
