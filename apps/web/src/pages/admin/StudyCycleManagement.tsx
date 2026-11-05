import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { confirmAction } from "@/components/callable/confirm";
import { StudyCycleFormDialog } from "@/components/callable/forms/StudyCycleFormDialog";
import { BulkActionBar } from "@/components/ui/bulk-action-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	ContextMenuItem,
	ContextMenuSeparator,
} from "@/components/ui/context-menu";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { trpc, trpcClient } from "../../utils/trpc";

export default function StudyCycleManagement() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);

	const { data: cyclesData, isLoading: cyclesLoading } = useQuery(
		trpc.studyCycles.listPaged.queryOptions({ page, pageSize }),
	);

	const cycles = cyclesData?.items ?? [];
	const selection = useRowSelection(cycles);

	const deleteCycleMutation = useMutation({
		mutationFn: (id: string) =>
			trpcClient.studyCycles.deleteCycle.mutate({ id }),
		onSuccess: () => {
			toast.success(
				t("admin.studyCycles.toast.deleteSuccess", {
					defaultValue: "Study cycle deleted",
				}),
			);
			queryClient.invalidateQueries(trpc.studyCycles.listPaged.queryKey());
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const bulkDeleteMutation = useMutation({
		mutationFn: async (ids: string[]) => {
			await Promise.all(
				ids.map((id) => trpcClient.studyCycles.deleteCycle.mutate({ id })),
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries(trpc.studyCycles.listPaged.queryKey());
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

	type Cycle = (typeof cycles)[number];

	const editCycle = (cycle: Cycle) => StudyCycleFormDialog.call({ cycle });

	const deleteCycle = (id: string) =>
		confirmAction({
			title: t("admin.studyCycles.delete.title", {
				defaultValue: "Delete study cycle",
			}),
			message: t("admin.studyCycles.delete.message", {
				defaultValue:
					"Deleting a cycle does not remove existing classes or programs, but they will require reassignment.",
			}),
			confirmText: t("common.actions.delete"),
			onConfirm: () => deleteCycleMutation.mutateAsync(id),
		});

	return (
		<div className="space-y-5">
			<div className="flex justify-end">
				<Button type="button" onClick={() => StudyCycleFormDialog.call({})}>
					<Plus className="mr-2 h-4 w-4" />
					{t("admin.studyCycles.actions.add", { defaultValue: "Add cycle" })}
				</Button>
			</div>

			<Card>
				<CardContent>
					{cyclesLoading ? (
						<TableSkeleton columns={5} rows={8} />
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
										<TableHead>
											{t("admin.studyCycles.table.name", {
												defaultValue: "Name",
											})}
										</TableHead>
										<TableHead className="w-20">
											{t("admin.studyCycles.table.credits", {
												defaultValue: "Credits",
											})}
										</TableHead>
										<TableHead className="w-28">
											{t("admin.studyCycles.table.duration", {
												defaultValue: "Duration",
											})}
										</TableHead>
										<TableHead className="w-[100px] text-right">
											{t("admin.studyCycles.table.actions", {
												defaultValue: "Actions",
											})}
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{cycles.map((cycle) => (
										<TableRow
											key={cycle.id}
											onClick={() =>
												navigate(`/admin/institution/cycles/${cycle.id}/levels`)
											}
											className="cursor-pointer"
											actions={
												<>
													<ContextMenuItem onSelect={() => editCycle(cycle)}>
														{t("common.actions.edit")}
													</ContextMenuItem>
													<ContextMenuSeparator />
													<ContextMenuItem
														className="text-destructive"
														onSelect={() => deleteCycle(cycle.id)}
													>
														{t("common.actions.delete")}
													</ContextMenuItem>
												</>
											}
										>
											<TableCell onClick={(e) => e.stopPropagation()}>
												<Checkbox
													checked={selection.isSelected(cycle.id)}
													onCheckedChange={() => selection.toggle(cycle.id)}
													aria-label={`Select ${cycle.name}`}
												/>
											</TableCell>
											<TableCell className="font-semibold text-foreground">
												{cycle.name}
											</TableCell>
											<TableCell>{cycle.totalCreditsRequired}</TableCell>
											<TableCell>
												{t("admin.studyCycles.table.years", {
													defaultValue: "{{value}} years",
													value: cycle.durationYears,
												})}
											</TableCell>
											<TableCell className="text-right">
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button
															variant="ghost"
															size="icon-sm"
															className="row-action-fade"
															onClick={(e) => e.stopPropagation()}
														>
															<MoreHorizontal className="h-4 w-4" />
															<span className="sr-only">
																{t("common.table.actions")}
															</span>
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														<DropdownMenuItem
															onClick={(e) => {
																e.stopPropagation();
																navigate(
																	`/admin/institution/cycles/${cycle.id}/levels`,
																);
															}}
														>
															<Pencil className="mr-2 h-4 w-4" />
															{t("admin.studyCycles.actions.manageLevels", {
																defaultValue: "Manage levels",
															})}
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={(e) => {
																e.stopPropagation();
																editCycle(cycle);
															}}
														>
															<Pencil className="mr-2 h-4 w-4" />
															{t("common.actions.edit")}
														</DropdownMenuItem>
														<DropdownMenuSeparator />
														<DropdownMenuItem
															className="text-destructive focus:text-destructive"
															onClick={(e) => {
																e.stopPropagation();
																deleteCycle(cycle.id);
															}}
														>
															<Trash2 className="mr-2 h-4 w-4" />
															{t("common.actions.delete")}
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									))}
									{!cycles.length && (
										<TableRow>
											<TableCell
												colSpan={5}
												className="py-6 text-center text-muted-foreground text-sm"
											>
												{t("admin.studyCycles.empty", {
													defaultValue: "No study cycles yet.",
												})}
											</TableCell>
										</TableRow>
									)}
								</TableBody>
							</Table>
							<TablePagination
								page={page}
								pageCount={cyclesData?.pageCount ?? 1}
								total={cyclesData?.total ?? 0}
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
