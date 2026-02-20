import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import {
	FileText,
	Pencil,
	Plus,
	Star,
	Trash2,
	Download,
	Upload,
	Settings,
} from "lucide-react";
import { useCursorPagination } from "@/hooks/useCursorPagination";
import { useRowSelection } from "@/hooks/useRowSelection";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { BulkActionBar } from "@/components/ui/bulk-action-bar";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormDescription,
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
import { Switch } from "@/components/ui/switch";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Empty, EmptyContent, EmptyHeader } from "@/components/ui/empty";
import { trpcClient } from "@/utils/trpc";
import ConfirmModal from "@/components/modals/ConfirmModal";

type ExportTemplate = {
	id: string;
	institutionId: string;
	name: string;
	type: "pv" | "evaluation" | "ue";
	isDefault: boolean;
	templateBody: string;
	createdAt: Date;
	updatedAt: Date;
	createdBy: string;
	updatedBy: string;
};

const EXPORT_TYPES = [
	{ value: "pv", label: "PV (Procès-Verbal)" },
	{ value: "evaluation", label: "Evaluation" },
	{ value: "ue", label: "UE (Teaching Unit)" },
] as const;

const buildSchema = (t: any) =>
	z.object({
		name: z.string().min(2, t("admin.exportTemplates.validation.name")),
		type: z.enum(["pv", "evaluation", "ue"]),
		isDefault: z.boolean().default(false),
	});

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

export default function ExportTemplatesManagement() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const [isRenameOpen, setIsRenameOpen] = useState(false);
	const [renamingTemplate, setRenamingTemplate] = useState<ExportTemplate | null>(
		null,
	);
	const [deletingTemplate, setDeletingTemplate] =
		useState<ExportTemplate | null>(null);
	const [selectedType, setSelectedType] = useState<string>("all");
	const pagination = useCursorPagination({ pageSize: 20 });

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
	const { data: templatesData, isLoading } = useQuery({
		queryKey: ["exportTemplates", selectedType, pagination.cursor, pagination.pageSize],
		queryFn: async () => {
			const result = await trpcClient.exportTemplates.list.query({
				type: selectedType === "all" ? undefined : (selectedType as any),
				cursor: pagination.cursor,
				limit: pagination.pageSize,
			});
			return result as { items: ExportTemplate[]; nextCursor?: string };
		},
	});

	const templates = templatesData?.items;
	const selection = useRowSelection(templates ?? []);

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

	// Bulk delete mutation
	const bulkDeleteMutation = useMutation({
		mutationFn: async (ids: string[]) => {
			await Promise.all(ids.map((id) => trpcClient.exportTemplates.delete.mutate({ id })));
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["exportTemplates"] });
			selection.clear();
			toast.success(t("common.bulkActions.deleteSuccess", { defaultValue: "Items deleted successfully" }));
		},
		onError: () => toast.error(t("common.bulkActions.deleteError", { defaultValue: "Failed to delete items" })),
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
					<h1 className="font-heading font-bold text-2xl text-foreground">
						{t("admin.exportTemplates.title")}
					</h1>
					<p className="text-muted-foreground">
						{t("admin.exportTemplates.subtitle")}
					</p>
				</div>
				<Button onClick={() => navigate("/admin/export-templates/new")}>
					<Plus className="h-4 w-4 mr-2" />
					{t("admin.exportTemplates.actions.add")}
				</Button>
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
						<Select value={selectedType} onValueChange={(value) => { setSelectedType(value); pagination.reset(); }}>
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
					<BulkActionBar selectedCount={selection.selectedCount} onClear={selection.clear}>
						<Button
							variant="destructive"
							size="sm"
							onClick={() => bulkDeleteMutation.mutate([...selection.selectedIds])}
							disabled={bulkDeleteMutation.isPending}
						>
							<Trash2 className="mr-1.5 h-3.5 w-3.5" />
							{t("common.actions.delete")}
						</Button>
					</BulkActionBar>

					{isLoading ? (
						<div className="flex justify-center py-8">
							<Spinner />
						</div>
					) : templates && templates.length > 0 ? (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="w-10">
										<Checkbox
											checked={selection.isAllSelected}
											onCheckedChange={(checked) => selection.toggleAll(!!checked)}
											aria-label="Select all"
										/>
									</TableHead>
									<TableHead>{t("admin.exportTemplates.table.name")}</TableHead>
									<TableHead>{t("admin.exportTemplates.table.type")}</TableHead>
									<TableHead>
										{t("admin.exportTemplates.table.status")}
									</TableHead>
									<TableHead className="text-right">
										{t("admin.exportTemplates.table.actions")}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{templates.map((template) => (
									<TableRow key={template.id}>
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
													<Star className="h-3 w-3 mr-1" />
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
														title={t("admin.exportTemplates.actions.setDefault")}
													>
														<Star className="h-4 w-4" />
													</Button>
												)}
												<Button
													variant="ghost"
													size="sm"
													onClick={() => navigate(`/admin/export-templates/${template.id}`)}
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
								<h3 className="text-lg font-semibold text-foreground">
									{t("admin.exportTemplates.empty.title")}
								</h3>
								<p className="text-sm text-muted-foreground">
									{t("admin.exportTemplates.empty.description")}
								</p>
								<Button onClick={() => navigate("/admin/export-templates/new")} className="mt-4">
									<Plus className="h-4 w-4 mr-2" />
									{t("admin.exportTemplates.actions.add")}
								</Button>
							</EmptyContent>
						</Empty>
					)}
				</CardContent>
			</Card>

			<PaginationBar
				hasPrev={pagination.hasPrev}
				hasNext={!!templatesData?.nextCursor}
				onPrev={pagination.handlePrev}
				onNext={() => pagination.handleNext(templatesData?.nextCursor)}
				isLoading={isLoading}
			/>

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
								<Button
									type="submit"
									disabled={renameMutation.isPending}
								>
									{renameMutation.isPending && (
										<Spinner className="mr-2" />
									)}
									{t("common.actions.save")}
								</Button>
							</DialogFooter>
						</form>
					</Form>
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
		</div>
	);
}
