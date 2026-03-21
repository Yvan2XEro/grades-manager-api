import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusCircle, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { BulkActionBar } from "@/components/ui/bulk-action-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import {
	ContextMenuItem,
	ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { useRowSelection } from "@/hooks/useRowSelection";
import type { RouterOutputs } from "@/utils/trpc";
import { trpc, trpcClient } from "@/utils/trpc";

type FormatRecord = RouterOutputs["registrationNumbers"]["list"][number];

const describeSegment = (
	segment: FormatRecord["definition"]["segments"][number],
) => {
	switch (segment.kind) {
		case "literal":
			return `"${segment.value}"`;
		case "field":
			return `{{${segment.field}}}`;
		case "counter":
			return `#(${segment.scope?.join(",") ?? "global"})`;
		default:
			return "";
	}
};

const RegistrationNumberFormats = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const formatsQuery = useQuery(
		trpc.registrationNumbers.list.queryOptions({ includeInactive: true }),
	);

	const invalidateList = () =>
		queryClient.invalidateQueries(
			trpc.registrationNumbers.list.queryKey({ includeInactive: true }),
		);

	const activateMutation = useMutation({
		mutationFn: (id: string) =>
			trpcClient.registrationNumbers.update.mutate({
				id,
				isActive: true,
			}),
		onSuccess: () => {
			toast.success(
				t("admin.registrationNumbers.toast.activated", {
					defaultValue: "Format activated",
				}),
			);
			invalidateList();
		},
		onError: (error) => toast.error(error.message),
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) =>
			trpcClient.registrationNumbers.delete.mutate({ id }),
		onSuccess: () => {
			toast.success(
				t("admin.registrationNumbers.toast.deleted", {
					defaultValue: "Format deleted",
				}),
			);
			invalidateList();
		},
		onError: (error) => toast.error(error.message),
	});

	const selection = useRowSelection(formatsQuery.data ?? []);

	const bulkDeleteMutation = useMutation({
		mutationFn: async (ids: string[]) => {
			await Promise.all(
				ids.map((id) => trpcClient.registrationNumbers.delete.mutate({ id })),
			);
		},
		onSuccess: () => {
			invalidateList();
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
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div>
					<h1 className="text-foreground">
						{t("admin.registrationNumbers.title", {
							defaultValue: "Registration number formats",
						})}
					</h1>
					<p className="text-muted-foreground">
						{t("admin.registrationNumbers.subtitle", {
							defaultValue:
								"Design templates for automatic matricule generation.",
						})}
					</p>
				</div>
				<Button onClick={() => navigate("/admin/registration-numbers/+")}>
					<PlusCircle className="mr-2 h-4 w-4" />
					{t("admin.registrationNumbers.actions.new", {
						defaultValue: "New format",
					})}
				</Button>
			</div>

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

			<Card>
				<CardContent>
					<div className="overflow-x-auto">
						{formatsQuery.isPending ? (
							<TableSkeleton columns={5} rows={8} />
						) : (
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
									<TableHead>
							{t("admin.registrationNumbers.table.name", {
											defaultValue: "Name",
										})}
									</TableHead>
									<TableHead>
							{t("admin.registrationNumbers.table.description", {
											defaultValue: "Description",
										})}
									</TableHead>
									<TableHead className="w-32">
							{t("admin.registrationNumbers.table.pattern", {
											defaultValue: "Pattern",
										})}
									</TableHead>
									<TableHead className="text-right">
										{t("common.table.actions", {
											defaultValue: "Actions",
										})}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{formatsQuery.isPending && (
									<TableRow>
										<TableCell colSpan={4}>
											{t("common.loading", {
												defaultValue: "Loading...",
											})}
										</TableCell>
									</TableRow>
								)}
								{!formatsQuery.isPending &&
									(formatsQuery.data?.length ?? 0) === 0 && (
										<TableRow>
											<TableCell colSpan={4}>
												{t("admin.registrationNumbers.list.empty", {
													defaultValue:
														"No formats yet. Create your first one.",
												})}
											</TableCell>
										</TableRow>
									)}
								{formatsQuery.data?.map((format) => (
									<TableRow
								key={format.id}
								actions={
									<>
										<ContextMenuItem onSelect={() => navigate(`/admin/registration-numbers/${format.id}`)}>
											<span>{t("common.actions.edit", { defaultValue: "Edit" })}</span>
										</ContextMenuItem>
										<ContextMenuItem onSelect={() => activateMutation.mutate(format.id)}>
											<span>{t("admin.registrationNumbers.actions.activate", { defaultValue: "Activate" })}</span>
										</ContextMenuItem>
										<ContextMenuSeparator />
										<ContextMenuItem variant="destructive" onSelect={() => deleteMutation.mutate(format.id)}>
											<span>{t("admin.registrationNumbers.list.delete", { defaultValue: "Delete" })}</span>
										</ContextMenuItem>
									</>
								}
							>
										<TableCell className="w-10">
											<Checkbox
												checked={selection.isSelected(format.id)}
												onCheckedChange={() => selection.toggle(format.id)}
											/>
										</TableCell>
										<TableCell className="font-medium">
											<div className="flex items-center gap-2">
												{format.name}
												{format.isActive && (
													<Badge variant="secondary">
														{t("admin.registrationNumbers.list.active", {
															defaultValue: "Active",
														})}
													</Badge>
												)}
											</div>
										</TableCell>
										<TableCell>{format.description || "-"}</TableCell>
										<TableCell>
											<div className="flex flex-wrap gap-2 text-foreground text-xs">
												{format.definition.segments.map((segment, idx) => (
													<span
														key={`${format.id}-${idx}`}
														className="rounded bg-muted px-2 py-1"
													>
														{describeSegment(segment)}
													</span>
												))}
											</div>
										</TableCell>
										<TableCell className="text-right">
											<div className="flex flex-wrap justify-end gap-2">
												<Button
													size="sm"
													variant="outline"
													onClick={() =>
														navigate(`/admin/registration-numbers/${format.id}`)
													}
												>
													{t("admin.registrationNumbers.list.edit", {
														defaultValue: "Edit",
													})}
												</Button>
												{!format.isActive && (
													<Button
														size="sm"
														variant="secondary"
														onClick={() => activateMutation.mutate(format.id)}
														disabled={activateMutation.isPending}
													>
														{t("admin.registrationNumbers.list.activate", {
															defaultValue: "Activate",
														})}
													</Button>
												)}
												<Button
													size="sm"
													variant="destructive"
													onClick={() => {
														if (
															window.confirm(
																t(
																	"admin.registrationNumbers.list.confirmDelete",
																	{
																		defaultValue:
																			"Delete this format permanently?",
																	},
																),
															)
														) {
															deleteMutation.mutate(format.id);
														}
													}}
													disabled={format.isActive || deleteMutation.isPending}
												>
													{t("admin.registrationNumbers.list.delete", {
														defaultValue: "Delete",
													})}
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

export default RegistrationNumberFormats;
