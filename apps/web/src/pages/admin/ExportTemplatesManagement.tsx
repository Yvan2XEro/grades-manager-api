import { zodResolver } from "@hookform/resolvers/zod";
import {
	useInfiniteQuery,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { FileText, Pencil, Plus, Settings, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { z } from "zod";
import ConfirmModal from "@/components/modals/ConfirmModal";
import { Badge } from "@/components/ui/badge";
import { BulkActionBar } from "@/components/ui/bulk-action-bar";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	ContextMenuItem,
	ContextMenuSeparator,
} from "@/components/ui/context-menu";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Empty, EmptyContent, EmptyHeader } from "@/components/ui/empty";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
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
import { useConfirm } from "@/hooks/useConfirm";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useRowSelection } from "@/hooks/useRowSelection";
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";
import type { ExportTemplate } from "@/utils/type";

const EXPORT_TYPES = [
	{ value: "pv", label: "PV (Procès-Verbal)" },
	{ value: "evaluation", label: "Evaluation" },
	{ value: "ue", label: "UE (Teaching Unit)" },
	{ value: "deliberation", label: "Délibération" },
	{ value: "diploma", label: "Diplôme" },
	{ value: "transcript", label: "Relevé de notes" },
	{ value: "attestation", label: "Attestation" },
] as const;

const buildSchema = (t: any) =>
	z.object({
		name: z.string().min(2, t("admin.exportTemplates.validation.name")),
		type: z.enum([
			"pv",
			"evaluation",
			"ue",
			"deliberation",
			"diploma",
			"transcript",
			"attestation",
		]),
		isDefault: z.boolean().default(false),
	});

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

export default function ExportTemplatesManagement() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const [isRenameOpen, setIsRenameOpen] = useState(false);
	const [renamingTemplate, setRenamingTemplate] =
		useState<ExportTemplate | null>(null);
	const [deletingTemplate, setDeletingTemplate] =
		useState<ExportTemplate | null>(null);
	const [selectedType, setSelectedType] = useState<string>("all");

	const renameSchema = z.object({
		name: z.string().min(2, t("admin.exportTemplates.validation.name")),
	});

	const renameForm = useForm<{ name: string }>({
		resolver: zodResolver(renameSchema),
		defaultValues: {
			name: "",
		},
	});

	// Fetch templates
	const {
		data: templatesData,
		isLoading,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useInfiniteQuery({
		queryKey: ["exportTemplates", selectedType],
		queryFn: async ({ pageParam }) => {
			const result = await trpcClient.exportTemplates.list.query({
				type: selectedType === "all" ? undefined : (selectedType as any),
				cursor: pageParam,
				limit: 20,
			});
			return result as { items: ExportTemplate[]; nextCursor?: string };
		},
		initialPageParam: undefined as string | undefined,
		getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
	});

	const templates = templatesData?.pages.flatMap((p) => p.items);
	const sentinelRef = useInfiniteScroll(fetchNextPage, {
		enabled: hasNextPage && !isFetchingNextPage,
	});
	const selection = useRowSelection(templates ?? []);

	const { confirm, ConfirmDialog } = useConfirm();

	// Rename mutation
	const renameMutation = useMutation({
		mutationFn: async (values: { name: string }) => {
			if (!renamingTemplate) return;
			await trpcClient.exportTemplates.update.mutate({
				id: renamingTemplate.id,
				name: values.name,
			});
		},
		onSuccess: () => {
			toast.success(t("admin.exportTemplates.toast.updateSuccess"));
			queryClient.invalidateQueries({ queryKey: ["exportTemplates"] });
			setIsRenameOpen(false);
			setRenamingTemplate(null);
		},
		onError: (error: any) => {
			toast.error(
				error.message || t("admin.exportTemplates.toast.updateError"),
			);
		},
	});

	// Delete mutation
	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			await trpcClient.exportTemplates.delete.mutate({ id });
		},
		onSuccess: () => {
			toast.success(t("admin.exportTemplates.toast.deleteSuccess"));
			queryClient.invalidateQueries({ queryKey: ["exportTemplates"] });
			setDeletingTemplate(null);
		},
		onError: (error: any) => {
			toast.error(
				error.message || t("admin.exportTemplates.toast.deleteError"),
			);
		},
	});

	// Set default mutation
	const setDefaultMutation = useMutation({
		mutationFn: async ({ id, type }: { id: string; type: string }) => {
			await trpcClient.exportTemplates.setDefault.mutate({
				id,
				type: type as any,
			});
		},
		onSuccess: () => {
			toast.success(t("admin.exportTemplates.toast.setDefaultSuccess"));
			queryClient.invalidateQueries({ queryKey: ["exportTemplates"] });
		},
		onError: (error: any) => {
			toast.error(
				error.message || t("admin.exportTemplates.toast.setDefaultError"),
			);
		},
	});

	// Seed system defaults mutation (idempotent)
	const seedSystemMutation = useMutation({
		mutationFn: async () => {
			return await trpcClient.academicDocuments.seedSystemDefaults.mutate();
		},
		onSuccess: (result: { created: string[]; skipped: string[] }) => {
			queryClient.invalidateQueries({ queryKey: ["exportTemplates"] });
			if (result.created.length > 0) {
				toast.success(`Modèles officiels créés : ${result.created.join(", ")}`);
			} else {
				toast.info("Tous les modèles officiels sont déjà présents.");
			}
		},
		onError: (error: any) => {
			toast.error(error.message || "Erreur lors de l'initialisation");
		},
	});

	// Bulk delete mutation
	const bulkDeleteMutation = useMutation({
		mutationFn: async (ids: string[]) => {
			await Promise.all(
				ids.map((id) => trpcClient.exportTemplates.delete.mutate({ id })),
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["exportTemplates"] });
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

	const handleOpenRename = (template: ExportTemplate) => {
		setRenamingTemplate(template);
		renameForm.reset({ name: template.name });
		setIsRenameOpen(true);
	};

	const handleCloseRename = () => {
		setIsRenameOpen(false);
		setRenamingTemplate(null);
		renameForm.reset();
	};

	const handleRename = (values: { name: string }) => {
		renameMutation.mutate(values);
	};

	const handleDelete = () => {
		if (deletingTemplate) {
			deleteMutation.mutate(deletingTemplate.id);
		}
	};

	const handleSetDefault = (template: ExportTemplate) => {
		setDefaultMutation.mutate({ id: template.id, type: template.type });
	};

	const getTypeLabel = (type: string) => {
		return EXPORT_TYPES.find((t) => t.value === type)?.label || type;
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-foreground">
						{t("admin.exportTemplates.title")}
					</h1>
					<p className="text-muted-foreground">
						{t("admin.exportTemplates.subtitle")}
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						onClick={() => seedSystemMutation.mutate()}
						disabled={seedSystemMutation.isPending}
						title="Crée les 3 modèles officiels (diplôme, relevé, attestation) si absents"
					>
						{seedSystemMutation.isPending && <Spinner className="mr-2" />}
						Initialiser modèles officiels
					</Button>
					<Button onClick={() => navigate("/admin/export-templates/new")}>
						<Plus className="mr-2 h-4 w-4" />
						{t("admin.exportTemplates.actions.add")}
					</Button>
				</div>
			</div>

			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle>{t("admin.exportTemplates.table.title")}</CardTitle>
							<CardDescription>
								{t("admin.exportTemplates.table.description")}
							</CardDescription>
						</div>
						<Select
							value={selectedType}
							onValueChange={(value) => {
								setSelectedType(value);
							}}
						>
							<SelectTrigger className="w-[200px]">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">
									{t("admin.exportTemplates.filter.all")}
								</SelectItem>
								{EXPORT_TYPES.map((type) => (
									<SelectItem key={type.value} value={type.value}>
										{type.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</CardHeader>
				<CardContent>
					<BulkActionBar
						selectedCount={selection.selectedCount}
						onClear={selection.clear}
					>
						<Button
							variant="destructive"
							size="sm"
							onClick={() =>
								confirm({
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
						<TableSkeleton columns={5} rows={8} />
					) : templates && templates.length > 0 ? (
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
									<TableHead>{t("admin.exportTemplates.table.name")}</TableHead>
									<TableHead className="w-28">
										{t("admin.exportTemplates.table.type")}
									</TableHead>
									<TableHead className="w-28">
										{t("admin.exportTemplates.table.status")}
									</TableHead>
									<TableHead className="text-right">
										{t("admin.exportTemplates.table.actions")}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{templates.map((template) => (
									<TableRow
										key={template.id}
										actions={
											<>
												<ContextMenuItem
													onSelect={() =>
														navigate(`/admin/export-templates/${template.id}`)
													}
												>
													<span>
														{t("common.actions.edit", { defaultValue: "Edit" })}
													</span>
												</ContextMenuItem>
												<ContextMenuItem
													onSelect={() => handleOpenRename(template)}
												>
													<span>
														{t("common.actions.rename", {
															defaultValue: "Rename",
														})}
													</span>
												</ContextMenuItem>
												<ContextMenuItem
													onSelect={() => handleSetDefault(template)}
												>
													<Star className="h-4 w-4" />
													<span>
														{t("admin.exportTemplates.actions.setDefault", {
															defaultValue: "Set as default",
														})}
													</span>
												</ContextMenuItem>
												<ContextMenuSeparator />
												<ContextMenuItem
													variant="destructive"
													onSelect={() => setDeletingTemplate(template)}
												>
													<span>{t("common.actions.delete")}</span>
												</ContextMenuItem>
											</>
										}
									>
										<TableCell>
											<Checkbox
												checked={selection.isSelected(template.id)}
												onCheckedChange={() => selection.toggle(template.id)}
												aria-label={`Select ${template.name}`}
											/>
										</TableCell>
										<TableCell className="font-medium">
											{template.name}
										</TableCell>
										<TableCell>
											<Badge variant="outline">
												{getTypeLabel(template.type)}
											</Badge>
										</TableCell>
										<TableCell>
											{template.isDefault ? (
												<Badge className="bg-yellow-500">
													<Star className="mr-1 h-3 w-3" />
													{t("admin.exportTemplates.table.default")}
												</Badge>
											) : (
												<Badge variant="secondary">
													{t("admin.exportTemplates.table.custom")}
												</Badge>
											)}
										</TableCell>
										<TableCell className="text-right">
											<div className="flex justify-end gap-2">
												{!template.isDefault && (
													<Button
														variant="ghost"
														size="sm"
														onClick={() => handleSetDefault(template)}
														disabled={setDefaultMutation.isPending}
														title={t(
															"admin.exportTemplates.actions.setDefault",
														)}
													>
														<Star className="h-4 w-4" />
													</Button>
												)}
												<Button
													variant="ghost"
													size="sm"
													onClick={() =>
														navigate(`/admin/export-templates/${template.id}`)
													}
													title={t("admin.exportTemplates.actions.edit")}
												>
													<Settings className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="sm"
													onClick={() => handleOpenRename(template)}
													title={t("admin.exportTemplates.actions.rename")}
												>
													<Pencil className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="sm"
													onClick={() => setDeletingTemplate(template)}
													disabled={template.isDefault}
													title={t("admin.exportTemplates.actions.delete")}
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
						<Empty>
							<EmptyHeader>
								<FileText className="h-12 w-12" />
							</EmptyHeader>
							<EmptyContent>
								<h3 className="font-semibold text-foreground text-lg">
									{t("admin.exportTemplates.empty.title")}
								</h3>
								<p className="text-muted-foreground text-xs">
									{t("admin.exportTemplates.empty.description")}
								</p>
								<Button
									onClick={() => navigate("/admin/export-templates/new")}
									className="mt-4"
								>
									<Plus className="mr-2 h-4 w-4" />
									{t("admin.exportTemplates.actions.add")}
								</Button>
							</EmptyContent>
						</Empty>
					)}
				</CardContent>
			</Card>

			<div ref={sentinelRef} className="h-1" />

			{/* Rename Dialog */}
			<Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>
							{t("admin.exportTemplates.form.renameTitle")}
						</DialogTitle>
						<DialogDescription>
							{t("admin.exportTemplates.form.renameDescription")}
						</DialogDescription>
					</DialogHeader>
					<div className="px-6 pb-4">
						<Form {...renameForm}>
							<form
								onSubmit={renameForm.handleSubmit(handleRename)}
								className="space-y-4"
							>
								<FormField
									control={renameForm.control}
									name="name"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												{t("admin.exportTemplates.form.name")}
											</FormLabel>
											<FormControl>
												<Input
													placeholder={t(
														"admin.exportTemplates.form.namePlaceholder",
													)}
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<DialogFooter>
									<Button
										type="button"
										variant="outline"
										onClick={handleCloseRename}
									>
										{t("common.actions.cancel")}
									</Button>
									<Button type="submit" disabled={renameMutation.isPending}>
										{renameMutation.isPending && <Spinner className="mr-2" />}
										{t("common.actions.save")}
									</Button>
								</DialogFooter>
							</form>
						</Form>
					</div>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation */}
			<ConfirmModal
				isOpen={!!deletingTemplate}
				onClose={() => setDeletingTemplate(null)}
				onConfirm={handleDelete}
				title={t("admin.exportTemplates.delete.title")}
				message={t("admin.exportTemplates.delete.message", {
					name: deletingTemplate?.name,
				})}
				isLoading={deleteMutation.isPending}
			/>
			<ConfirmDialog />
		</div>
	);
}
