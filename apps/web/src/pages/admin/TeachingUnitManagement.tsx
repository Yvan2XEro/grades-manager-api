import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { BulkActionBar } from "@/components/ui/bulk-action-bar";
import { Checkbox } from "@/components/ui/checkbox";
import { ClipboardCopy } from "@/components/ui/clipboard-copy";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { useCursorPagination } from "@/hooks/useCursorPagination";
import { useRowSelection } from "@/hooks/useRowSelection";
import ConfirmModal from "../../components/modals/ConfirmModal";
import { Button } from "../../components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../components/ui/card";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "../../components/ui/empty";
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
import { trpc, trpcClient } from "../../utils/trpc";

const TeachingUnitManagement = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const [selectedProgramId, setSelectedProgramId] = useState<string>("");
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const pagination = useCursorPagination({ pageSize: 20 });

	const { data: programs } = useQuery(trpc.programs.list.queryOptions({}));
	const programList = programs?.items ?? [];
	const _selectedProgram = useMemo(
		() => programList.find((program) => program.id === selectedProgramId),
		[programList, selectedProgramId],
	);

	const { data: units, isLoading } = useQuery(
		trpc.teachingUnits.list.queryOptions({
			programId: selectedProgramId || undefined,
			cursor: pagination.cursor,
			limit: pagination.pageSize,
		}),
	);

	const unitItems = units?.items ?? [];
	const selection = useRowSelection(unitItems);

	const programMap = useMemo(
		() => new Map(programList.map((program) => [program.id, program])),
		[programList],
	);

	const deleteMutation = useMutation({
		mutationFn: (id: string) => trpcClient.teachingUnits.delete.mutate({ id }),
		onSuccess: () => {
			toast.success(
				t("admin.teachingUnits.toast.deleted", {
					defaultValue: "Teaching unit deleted",
				}),
			);
			queryClient.invalidateQueries(
				trpc.teachingUnits.list.queryKey({
					programId: selectedProgramId || undefined,
				}),
			);
			setIsDeleteOpen(false);
			setDeleteId(null);
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const bulkDeleteMutation = useMutation({
		mutationFn: async (ids: string[]) => {
			await Promise.all(
				ids.map((id) => trpcClient.teachingUnits.delete.mutate({ id })),
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries(
				trpc.teachingUnits.list.queryKey({
					programId: selectedProgramId || undefined,
				}),
			);
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

	const handleDelete = () => {
		if (deleteId) {
			deleteMutation.mutate(deleteId);
		}
	};

	const handleOpenDelete = (id: string) => {
		setDeleteId(id);
		setIsDeleteOpen(true);
	};

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
					<h1 className="font-bold font-heading text-2xl text-foreground">
						{t("admin.teachingUnits.title", { defaultValue: "Teaching units" })}
					</h1>
					<p className="text-muted-foreground">
						{t("admin.teachingUnits.subtitle", {
							defaultValue: "Manage UE catalog, semesters, and prerequisites.",
						})}
					</p>
				</div>
				<Button onClick={() => navigate("/admin/teaching-units/+")}>
					<Plus className="mr-2 h-4 w-4" />
					{t("admin.teachingUnits.actions.create", {
						defaultValue: "Create UE",
					})}
				</Button>
			</div>

			<Card>
				<CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
					<div>
						<CardTitle>
							{t("admin.teachingUnits.list", {
								defaultValue: "Units list",
							})}
						</CardTitle>
						<CardDescription>
							{t("admin.teachingUnits.listDescription", {
								defaultValue:
									"Browse teaching units and open them to manage ECs.",
							})}
						</CardDescription>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<Select
							value={selectedProgramId || undefined}
							onValueChange={(value) => {
								setSelectedProgramId(value);
								pagination.reset();
							}}
						>
							<SelectTrigger className="min-w-48">
								<SelectValue
									placeholder={t("admin.teachingUnits.selectProgram", {
										defaultValue: "Select program",
									})}
								/>
							</SelectTrigger>
							<SelectContent>
								{programList.map((program) => (
									<SelectItem key={program.id} value={program.id}>
										{program.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Button
							variant="outline"
							onClick={() => {
								setSelectedProgramId("");
								pagination.reset();
							}}
							disabled={!selectedProgramId}
						>
							{t("common.actions.reset", { defaultValue: "Reset" })}
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					{unitItems.length ? (
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
									<Trash2 className="mr-1.5 h-3.5 w-3.5" />
									{t("common.actions.delete")}
								</Button>
							</BulkActionBar>
							<div className="overflow-x-auto">
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
												{t("admin.teachingUnits.table.code")}
											</TableHead>
											<TableHead>
												{t("admin.teachingUnits.table.name")}
											</TableHead>
											<TableHead>
												{t("admin.teachingUnits.table.program")}
											</TableHead>
											<TableHead>
												{t("admin.teachingUnits.table.semester")}
											</TableHead>
											<TableHead>
												{t("admin.teachingUnits.table.credits")}
											</TableHead>
											<TableHead className="text-right">
												{t("common.table.actions")}
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{unitItems.map((unit) => (
											<TableRow key={unit.id}>
												<TableCell>
													<Checkbox
														checked={selection.isSelected(unit.id)}
														onCheckedChange={() => selection.toggle(unit.id)}
														aria-label={`Select ${unit.name}`}
													/>
												</TableCell>
												<TableCell>
													<ClipboardCopy
														value={unit.code}
														label={t("admin.teachingUnits.table.code", {
															defaultValue: "Code",
														})}
													/>
												</TableCell>
												<TableCell className="font-medium">
													{unit.name}
												</TableCell>
												<TableCell>
													{(() => {
														const programInfo = programMap.get(unit.programId);
														if (!programInfo) {
															return t("common.labels.notAvailable", {
																defaultValue: "N/A",
															});
														}
														return <p>{programInfo.name}</p>;
													})()}
												</TableCell>
												<TableCell>
													{t(`admin.teachingUnits.semesters.${unit.semester}`, {
														defaultValue: unit.semester,
													})}
												</TableCell>
												<TableCell>{unit.credits}</TableCell>
												<TableCell className="text-right">
													<div className="flex justify-end gap-2">
														<Button
															variant="ghost"
															size="sm"
															onClick={() =>
																navigate(`/admin/teaching-units/${unit.id}`)
															}
														>
															{t("common.actions.open", {
																defaultValue: "Open",
															})}
														</Button>
														<Button
															variant="ghost"
															size="icon-sm"
															className="text-destructive hover:text-destructive"
															onClick={() => handleOpenDelete(unit.id)}
														>
															<Trash2 className="h-4 w-4" />
														</Button>
													</div>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
							<PaginationBar
								hasPrev={pagination.hasPrev}
								hasNext={!!units?.nextCursor}
								onPrev={pagination.handlePrev}
								onNext={() => pagination.handleNext(units?.nextCursor)}
								isLoading={isLoading}
							/>
						</>
					) : (
						<Empty>
							<EmptyHeader>
								<EmptyMedia variant="icon">
									<Plus className="h-6 w-6 text-muted-foreground" />
								</EmptyMedia>
								<EmptyTitle>
									{t("admin.teachingUnits.empty", {
										defaultValue: "No units yet for this program.",
									})}
								</EmptyTitle>
								<EmptyDescription>
									{t("admin.teachingUnits.emptyDescription", {
										defaultValue:
											"Create a teaching unit to start managing ECs.",
									})}
								</EmptyDescription>
							</EmptyHeader>
							<EmptyContent>
								<Button onClick={() => navigate("/admin/teaching-units/+")}>
									<Plus className="mr-2 h-4 w-4" />
									{t("admin.teachingUnits.actions.create", {
										defaultValue: "Create UE",
									})}
								</Button>
							</EmptyContent>
						</Empty>
					)}
				</CardContent>
			</Card>

			<ConfirmModal
				isOpen={isDeleteOpen}
				onClose={() => {
					setIsDeleteOpen(false);
					setDeleteId(null);
				}}
				onConfirm={handleDelete}
				title={t("admin.teachingUnits.deleteTitle", {
					defaultValue: "Delete teaching unit",
				})}
				message={t("admin.teachingUnits.deleteMessage", {
					defaultValue: "Are you sure you want to remove this unit?",
				})}
				confirmText={t("common.actions.delete")}
				isLoading={deleteMutation.isPending}
			/>
		</div>
	);
};

export default TeachingUnitManagement;
