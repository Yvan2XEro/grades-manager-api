import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo } from "react";
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
import { Spinner } from "@/components/ui/spinner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { useRowSelection } from "@/hooks/useRowSelection";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";
import {
	type Institution,
	InstitutionFormDialog,
} from "./InstitutionFormDialog";

export default function FacultyManagement() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	const { data: allInstitutions, isLoading } = useQuery(
		trpc.institutions.list.queryOptions(),
	);
	const institutions = useMemo(
		() => (allInstitutions ?? []) as Institution[],
		[allInstitutions],
	);
	const selection = useRowSelection(institutions);

	const handleOpenCreate = () => InstitutionFormDialog.call({});

	const handleOpenEdit = (institution: Institution) =>
		InstitutionFormDialog.call({ institution });

	const confirmDelete = (id: string) =>
		confirmAction({
			title: t("admin.institutions.delete.title", {
				defaultValue: "Delete institution",
			}),
			message: t("admin.institutions.delete.message", {
				defaultValue:
					"Are you sure you want to delete this institution? This action cannot be undone.",
			}),
			onConfirm: () => deleteMutation.mutateAsync(id).catch(() => undefined),
		});

	const invalidate = () =>
		queryClient.invalidateQueries({
			queryKey: trpc.institutions.list.queryKey(),
		});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => trpcClient.institutions.delete.mutate({ id }),
		onSuccess: () => {
			toast.success(
				t("admin.institutions.toast.deleteSuccess", {
					defaultValue: "Institution deleted",
				}),
			);
			invalidate();
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const bulkDeleteMutation = useMutation({
		mutationFn: (ids: string[]) =>
			Promise.all(
				ids.map((id) => trpcClient.institutions.delete.mutate({ id })),
			),
		onSuccess: () => {
			invalidate();
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

	const typeLabel = (type: string) => {
		switch (type) {
			case "university":
				return t("admin.institution.form.typeUniversity", {
					defaultValue: "University",
				});
			case "faculty":
				return t("admin.institution.form.typeFaculty", {
					defaultValue: "Faculty/School",
				});
			case "institution":
				return t("admin.institution.form.typeInstitution", {
					defaultValue: "Institution",
				});
			default:
				return type;
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-3">
					<div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/8">
						<Building2 className="h-4 w-4 text-primary" />
					</div>
					<div>
						<h1 className="text-foreground">
							{t("admin.institutions.title", { defaultValue: "Institutions" })}
						</h1>
						<p className="mt-0.5 text-muted-foreground text-xs">
							{t("admin.institutions.subtitle", {
								defaultValue: "Manage universities, faculties and schools.",
							})}
						</p>
					</div>
				</div>
				<Button onClick={handleOpenCreate}>
					<Plus className="mr-2 h-4 w-4" />
					{t("admin.institutions.actions.add", {
						defaultValue: "Add institution",
					})}
				</Button>
			</div>

			<Card>
				<CardContent>
					{isLoading ? (
						<div className="flex items-center justify-center py-8">
							<Spinner />
						</div>
					) : institutions.length > 0 ? (
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
								<TableSkeleton columns={6} rows={8} />
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
											<TableHead className="w-24">
												{t("admin.institutions.table.code", {
													defaultValue: "Code",
												})}
											</TableHead>
											<TableHead className="w-28">
												{t("admin.institutions.table.type", {
													defaultValue: "Type",
												})}
											</TableHead>
											<TableHead>
												{t("admin.institutions.table.nameFr", {
													defaultValue: "Name (FR)",
												})}
											</TableHead>
											<TableHead>
												{t("admin.institutions.table.nameEn", {
													defaultValue: "Name (EN)",
												})}
											</TableHead>
											<TableHead className="w-28">
												{t("admin.institutions.table.shortName", {
													defaultValue: "Short name",
												})}
											</TableHead>
											<TableHead className="w-[100px] text-right">
												{t("common.table.actions")}
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{institutions.map((inst) => (
											<TableRow
												key={inst.id}
												actions={
													<>
														<ContextMenuItem
															onSelect={() => handleOpenEdit(inst)}
														>
															<Pencil className="h-4 w-4" />
															{t("common.actions.edit", {
																defaultValue: "Edit",
															})}
														</ContextMenuItem>
														<ContextMenuSeparator />
														<ContextMenuItem
															variant="destructive"
															onSelect={() => confirmDelete(inst.id)}
														>
															<Trash2 className="h-4 w-4" />
															{t("common.actions.delete")}
														</ContextMenuItem>
													</>
												}
											>
												<TableCell>
													<Checkbox
														checked={selection.isSelected(inst.id)}
														onCheckedChange={() => selection.toggle(inst.id)}
														aria-label={`Select ${inst.nameFr}`}
													/>
												</TableCell>
												<TableCell>
													<span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 font-mono text-xs">
														{inst.code}
													</span>
												</TableCell>
												<TableCell>
													<span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs">
														{typeLabel(inst.type)}
													</span>
												</TableCell>
												<TableCell className="font-medium">
													{inst.nameFr}
												</TableCell>
												<TableCell>{inst.nameEn}</TableCell>
												<TableCell>{inst.shortName || "\u2014"}</TableCell>
												<TableCell className="flex items-center justify-end gap-2">
													<Button
														variant="ghost"
														size="icon"
														onClick={() => handleOpenEdit(inst)}
													>
														<Pencil className="h-4 w-4" />
													</Button>
													<Button
														variant="ghost"
														size="icon"
														onClick={() => confirmDelete(inst.id)}
													>
														<Trash2 className="h-4 w-4 text-destructive" />
													</Button>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							)}
						</>
					) : (
						<Empty>
							<EmptyHeader>
								<Building2 className="mx-auto h-10 w-10 text-muted-foreground/50" />
								<EmptyTitle>
									{t("admin.institutions.empty.title", {
										defaultValue: "No institutions yet",
									})}
								</EmptyTitle>
								<EmptyDescription>
									{t("admin.institutions.empty.description", {
										defaultValue:
											"Create your first institution to start organizing your academic structure.",
									})}
								</EmptyDescription>
							</EmptyHeader>
							<EmptyContent>
								<Button onClick={handleOpenCreate} variant="outline">
									<Plus className="mr-2 h-4 w-4" />
									{t("admin.institutions.actions.add", {
										defaultValue: "Add institution",
									})}
								</Button>
							</EmptyContent>
						</Empty>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
