import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, isValid, parseISO } from "date-fns";
import {
	CalendarPlus,
	Check,
	Copy,
	Pencil,
	Plus,
	Trash2,
	X,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { confirmAction } from "@/components/callable/confirm";
import { AcademicYearFormDialog } from "@/components/callable/forms/AcademicYearFormDialog";
import { BulkActionBar } from "@/components/ui/bulk-action-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	ContextMenuItem,
	ContextMenuSeparator,
} from "@/components/ui/context-menu";
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
import { UndrawCalendar } from "@/components/ui/undraw";
import { useRowSelection } from "@/hooks/useRowSelection";
import { toast } from "@/lib/toast";
import { Button } from "../../components/ui/button";
import { Spinner } from "../../components/ui/spinner";
import { Switch } from "../../components/ui/switch";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "../../components/ui/tooltip";
import { trpc, trpcClient } from "../../utils/trpc";
import type { AcademicYear } from "../../utils/type";
import { AcademicYearSetupDialog } from "./AcademicYearSetupDialog";

const AcademicYearManagement: React.FC = () => {
	const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);
	const queryClient = useQueryClient();
	const { t } = useTranslation();

	const { data, isLoading } = useQuery(
		trpc.academicYears.listPaged.queryOptions({ page, pageSize }),
	);

	const academicYears = data?.items ?? [];
	const selection = useRowSelection(academicYears);

	const bulkDeleteMutation = useMutation({
		mutationFn: async (ids: string[]) => {
			await Promise.all(
				ids.map((id) => trpcClient.academicYears.delete.mutate({ id })),
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries(trpc.academicYears.listPaged.queryKey());
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

	const openYearForm = (year?: AcademicYear) =>
		AcademicYearFormDialog.call({ year });

	const openSetup = (year: { id: string; name: string }) =>
		AcademicYearSetupDialog.call({
			targetYear: { id: year.id, name: year.name },
		});

	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			await trpcClient.academicYears.delete.mutate({ id });
		},
		onSuccess: () => {
			queryClient.invalidateQueries(trpc.academicYears.listPaged.queryKey());
			toast.success(t("admin.academicYears.toast.deleteSuccess"));
			setDeleteConfirmId(null);
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error && error.message
					? error.message
					: t("admin.academicYears.toast.deleteError");
			toast.error(message);
		},
	});

	const toggleActiveMutation = useMutation({
		mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
			await trpcClient.academicYears.setActive.mutate({ id, isActive });
		},
		onSuccess: () => {
			queryClient.invalidateQueries(trpc.academicYears.listPaged.queryKey());
			toast.success(t("admin.academicYears.toast.statusSuccess"));
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error && error.message
					? error.message
					: t("admin.academicYears.toast.statusError");
			toast.error(message);
		},
	});

	const createNextYearMutation = useMutation({
		mutationFn: async (sourceYearId: string) => {
			return trpcClient.academicYears.createNextYear.mutate({ sourceYearId });
		},
		onSuccess: (newYear) => {
			queryClient.invalidateQueries(trpc.academicYears.listPaged.queryKey());
			toast.success(
				t("admin.academicYears.toast.createNextYearSuccess", {
					defaultValue: "Année suivante créée : {{name}}",
					name: newYear.name,
				}),
			);
			// Auto-open setup dialog for the new year
			openSetup(newYear);
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error && error.message
					? error.message
					: t("admin.academicYears.toast.createNextYearError", {
							defaultValue: "Erreur lors de la création de l'année suivante",
						});
			toast.error(message);
		},
	});

	const handleDelete = (id: string) => {
		deleteMutation.mutate(id);
	};

	const handleToggleActive = (id: string, currentStatus: boolean) => {
		toggleActiveMutation.mutate({ id, isActive: !currentStatus });
	};

	const formatDate = (dateString: string) => {
		try {
			const date = parseISO(dateString);
			if (!isValid(date)) {
				return t("common.invalidDate");
			}
			return format(date, "MMM d, yyyy");
		} catch {
			return t("common.invalidDate");
		}
	};

	if (isLoading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<span className="loading loading-spinner loading-lg text-primary" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div>
					<h1 className="text-foreground">{t("admin.academicYears.title")}</h1>
					<p className="text-muted-foreground">
						{t("admin.academicYears.subtitle")}
					</p>
				</div>
				<Button
					type="button"
					onClick={() => openYearForm()}
					className="btn btn-primary"
				>
					<Plus className="mr-2 h-5 w-5" />
					{t("admin.academicYears.actions.add")}
				</Button>
			</div>

			<Card>
				{isLoading ? (
					<div className="flex items-center justify-center p-8">
						<Spinner />
					</div>
				) : academicYears.length === 0 ? (
					<div className="p-8 text-center">
						<UndrawCalendar className="mx-auto h-36 w-auto" />
						<h3 className="mt-4 font-medium text-foreground text-lg">
							{t("admin.academicYears.empty.title")}
						</h3>
						<p className="mt-1 text-muted-foreground">
							{t("admin.academicYears.empty.description")}
						</p>
						<Button type="button" onClick={() => openYearForm()}>
							<Plus className="mr-2 h-4 w-4" />
							{t("admin.academicYears.actions.add")}
						</Button>
					</div>
				) : (
					<CardContent>
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
							<TableSkeleton columns={6} rows={8} />
						) : (
							<Table className="min-w-full">
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
										<TableHead>{t("admin.academicYears.table.name")}</TableHead>
										<TableHead className="w-28">
											{t("admin.academicYears.table.startDate")}
										</TableHead>
										<TableHead className="w-28">
											{t("admin.academicYears.table.endDate")}
										</TableHead>
										<TableHead className="w-28">
											{t("admin.academicYears.table.status")}
										</TableHead>
										<TableHead className="w-[100px] text-right">
											{t("common.table.actions")}
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{academicYears.map((year) => (
										<TableRow
											key={year.id}
											actions={
												<>
													<ContextMenuItem onSelect={() => openYearForm(year)}>
														<span>
															{t("common.actions.edit", {
																defaultValue: "Edit",
															})}
														</span>
													</ContextMenuItem>
													<ContextMenuItem onSelect={() => openSetup(year)}>
														<Copy className="h-4 w-4" />
														<span>
															{t("admin.academicYears.setup.button", {
																defaultValue: "Setup",
															})}
														</span>
													</ContextMenuItem>
													<ContextMenuItem
														onSelect={() =>
															createNextYearMutation.mutate(year.id)
														}
														disabled={createNextYearMutation.isPending}
													>
														<CalendarPlus className="h-4 w-4" />
														<span>
															{t("admin.academicYears.actions.createNextYear", {
																defaultValue: "Créer l'année suivante",
															})}
														</span>
													</ContextMenuItem>
													<ContextMenuSeparator />
													<ContextMenuItem
														variant="destructive"
														onSelect={() => setDeleteConfirmId(year.id)}
													>
														<span>{t("common.actions.delete")}</span>
													</ContextMenuItem>
												</>
											}
										>
											<TableCell>
												<Checkbox
													checked={selection.isSelected(year.id)}
													onCheckedChange={() => selection.toggle(year.id)}
													aria-label={`Select ${year.name}`}
												/>
											</TableCell>
											<TableCell>{year.name}</TableCell>
											<TableCell>{formatDate(year.startDate)}</TableCell>
											<TableCell>{formatDate(year.endDate)}</TableCell>
											<TableCell>
												<div className="flex items-center gap-3">
													<Switch
														id={`academic-year-${year.id}`}
														checked={year.isActive}
														onCheckedChange={() =>
															handleToggleActive(year.id, year.isActive)
														}
													/>
													<label
														htmlFor={`academic-year-${year.id}`}
														className="text-muted-foreground text-xs"
													>
														{year.isActive
															? t("common.status.active")
															: t("common.status.inactive")}
													</label>
												</div>
											</TableCell>
											<td>
												{deleteConfirmId === year.id ? (
													<div className="flex items-center space-x-2">
														<span className="text-muted-foreground text-xs">
															{t("admin.academicYears.confirmDelete")}
														</span>
														<button
															type="button"
															onClick={() => handleDelete(year.id)}
															className="btn btn-error btn-sm"
														>
															<Check className="h-4 w-4" />
														</button>
														<button
															type="button"
															onClick={() => setDeleteConfirmId(null)}
															className="btn btn-ghost btn-sm"
														>
															<X className="h-4 w-4" />
														</button>
													</div>
												) : (
													<div className="flex items-center space-x-2">
														<Tooltip>
															<TooltipTrigger asChild>
																<Button
																	type="button"
																	variant="ghost"
																	size={"icon"}
																	onClick={() => openSetup(year)}
																>
																	<Copy className="h-4 w-4" />
																</Button>
															</TooltipTrigger>
															<TooltipContent>
																{t("admin.academicYears.setup.button")}
															</TooltipContent>
														</Tooltip>
														<Tooltip>
															<TooltipTrigger asChild>
																<Button
																	type="button"
																	variant="ghost"
																	size={"icon"}
																	onClick={() =>
																		createNextYearMutation.mutate(year.id)
																	}
																	disabled={createNextYearMutation.isPending}
																>
																	<CalendarPlus className="h-4 w-4" />
																</Button>
															</TooltipTrigger>
															<TooltipContent>
																{t(
																	"admin.academicYears.actions.createNextYear",
																	{ defaultValue: "Créer l'année suivante" },
																)}
															</TooltipContent>
														</Tooltip>
														<Button
															type="button"
															variant="ghost"
															size={"icon"}
															onClick={() => {
																openYearForm(year);
															}}
															className="btn btn-ghost btn-sm"
														>
															<Pencil className="h-4 w-4" />
														</Button>
														<Button
															type="button"
															variant="ghost"
															size={"icon"}
															onClick={() => setDeleteConfirmId(year.id)}
															className="btn btn-ghost btn-sm"
														>
															<Trash2 className="h-4 w-4" />
														</Button>
													</div>
												)}
											</td>
										</TableRow>
									))}
								</TableBody>
							</Table>
						)}
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
					</CardContent>
				)}
			</Card>
		</div>
	);
};

export default AcademicYearManagement;
