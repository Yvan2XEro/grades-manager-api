import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { confirmAction } from "@/components/callable/confirm";
import { BulkActionBar } from "@/components/ui/bulk-action-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { trpc, trpcClient } from "@/utils/trpc";
import type { ExamType } from "@/utils/type";
import { ExamTypeFormDialog } from "./ExamTypeFormDialog";

export default function ExamTypes() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);
	const { data, isLoading } = useQuery(
		trpc.examTypes.listPaged.queryOptions({ page, pageSize }),
	);

	const examTypes = data?.items ?? [];
	const selection = useRowSelection(examTypes);

	const handleOpenCreate = () => ExamTypeFormDialog.call({});

	const handleOpenEdit = (examType: ExamType) =>
		ExamTypeFormDialog.call({ examType });

	const confirmDelete = (id: string) =>
		confirmAction({
			title: t("admin.examTypes.delete.title"),
			message: t("admin.examTypes.delete.message"),
			onConfirm: () => deleteMutation.mutateAsync(id).catch(() => undefined),
		});

	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			await trpcClient.examTypes.delete.mutate({ id });
		},
		onSuccess: () => {
			toast.success(t("admin.examTypes.toast.deleteSuccess"));
			queryClient.invalidateQueries(trpc.examTypes.listPaged.queryKey());
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error && error.message
					? error.message
					: t("admin.examTypes.toast.deleteError");
			toast.error(message);
		},
	});

	const bulkDeleteMutation = useMutation({
		mutationFn: async (ids: string[]) => {
			await Promise.all(
				ids.map((id) => trpcClient.examTypes.delete.mutate({ id })),
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries(trpc.examTypes.listPaged.queryKey());
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

	return (
		<div className="space-y-5">
			<div className="flex justify-end">
				<Button onClick={handleOpenCreate}>
					<Plus className="mr-2 h-4 w-4" />
					{t("admin.examTypes.actions.add")}
				</Button>
			</div>

			<Card>
				<CardContent>
					{isLoading ? (
						<TableSkeleton columns={5} rows={8} />
					) : examTypes.length > 0 ? (
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
										<TableHead>{t("admin.examTypes.table.name")}</TableHead>
										<TableHead>
											{t("admin.examTypes.table.descriptionColumn")}
										</TableHead>
										<TableHead className="w-20">
											{t("admin.examTypes.table.defaultPercentage")}
										</TableHead>
										<TableHead className="w-[100px] text-right">
											{t("common.table.actions")}
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{examTypes.map((type) => (
										<TableRow
											key={type.id}
											actions={
												<>
													<ContextMenuItem
														onSelect={() => handleOpenEdit(type)}
													>
														<span>
															{t("common.actions.edit", {
																defaultValue: "Edit",
															})}
														</span>
													</ContextMenuItem>
													<ContextMenuSeparator />
													<ContextMenuItem
														variant="destructive"
														onSelect={() => confirmDelete(type.id)}
													>
														<span>{t("common.actions.delete")}</span>
													</ContextMenuItem>
												</>
											}
										>
											<TableCell>
												<Checkbox
													checked={selection.isSelected(type.id)}
													onCheckedChange={() => selection.toggle(type.id)}
													aria-label={`Select ${type.name}`}
												/>
											</TableCell>
											<TableCell className="font-medium">{type.name}</TableCell>
											<TableCell>{type.description || "\u2014"}</TableCell>
											<TableCell>
												{type.defaultPercentage != null
													? `${type.defaultPercentage}%`
													: "—"}
											</TableCell>
											<TableCell className="flex items-center justify-end gap-2">
												<Button
													variant="ghost"
													size="icon"
													onClick={() => handleOpenEdit(type)}
												>
													<Pencil className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													onClick={() => confirmDelete(type.id)}
												>
													<Trash2 className="h-4 w-4 text-destructive" />
												</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
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
						</>
					) : (
						<Empty>
							<EmptyHeader>
								<EmptyTitle>{t("admin.examTypes.title")}</EmptyTitle>
								<EmptyDescription>
									{t("admin.examTypes.empty")}
								</EmptyDescription>
							</EmptyHeader>
							<EmptyContent />
						</Empty>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
