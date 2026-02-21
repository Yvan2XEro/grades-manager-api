import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";
import ConfirmModal from "../../components/modals/ConfirmModal";
import FormModal from "../../components/modals/FormModal";
import { BulkActionBar } from "../../components/ui/bulk-action-bar";
import { Button } from "../../components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../components/ui/card";
import { Checkbox } from "../../components/ui/checkbox";
import { DialogFooter } from "../../components/ui/dialog";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "../../components/ui/empty";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "../../components/ui/form";
import { Input } from "../../components/ui/input";
import { PaginationBar } from "../../components/ui/pagination-bar";
import { Spinner } from "../../components/ui/spinner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "../../components/ui/table";
import { useCursorPagination } from "../../hooks/useCursorPagination";
import { useRowSelection } from "../../hooks/useRowSelection";
import { trpcClient } from "../../utils/trpc";

const buildSchema = (t: ReturnType<typeof useTranslation>["t"]) =>
	z.object({
		name: z.string().min(2, t("admin.examTypes.form.nameLabel")),
		description: z.string().optional(),
		defaultPercentage: z.coerce.number().int().min(1).max(100).optional(),
	});

type ExamType = {
	id: string;
	name: string;
	description: string | null;
	defaultPercentage: number | null;
};

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

export default function ExamTypes() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const schema = useMemo(() => buildSchema(t), [t]);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingType, setEditingType] = useState<ExamType | null>(null);
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const pagination = useCursorPagination({ pageSize: 20 });

	const form = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: { name: "", description: "", defaultPercentage: 40 },
	});

	const resetForm = () =>
		form.reset({ name: "", description: "", defaultPercentage: 40 });

	const { data, isLoading } = useQuery({
		queryKey: ["examTypes", pagination.cursor],
		queryFn: async () => {
			const result = await trpcClient.examTypes.list.query({
				cursor: pagination.cursor,
				limit: pagination.pageSize,
			});
			return result as { items: ExamType[]; nextCursor?: string };
		},
	});

	const examTypes = data?.items ?? [];
	const selection = useRowSelection(examTypes);

	const handleOpenCreate = () => {
		setEditingType(null);
		resetForm();
		setIsModalOpen(true);
	};

	const handleOpenEdit = (type: ExamType) => {
		setEditingType(type);
		form.reset({
			name: type.name,
			description: type.description ?? "",
			defaultPercentage: type.defaultPercentage ?? 40,
		});
		setIsModalOpen(true);
	};

	const handleCloseModal = () => {
		setIsModalOpen(false);
		setEditingType(null);
		resetForm();
	};

	const createMutation = useMutation({
		mutationFn: async (values: FormValues) => {
			await trpcClient.examTypes.create.mutate({
				name: values.name,
				description: values.description || undefined,
				defaultPercentage: values.defaultPercentage,
			});
		},
		onSuccess: () => {
			toast.success(t("admin.examTypes.toast.createSuccess"));
			queryClient.invalidateQueries({ queryKey: ["examTypes"] });
			handleCloseModal();
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error && error.message
					? error.message
					: t("admin.examTypes.toast.createError");
			toast.error(message);
		},
	});

	const updateMutation = useMutation({
		mutationFn: async ({ id, values }: { id: string; values: FormValues }) => {
			await trpcClient.examTypes.update.mutate({
				id,
				name: values.name,
				description: values.description || undefined,
				defaultPercentage: values.defaultPercentage,
			});
		},
		onSuccess: () => {
			toast.success(t("admin.examTypes.toast.updateSuccess"));
			queryClient.invalidateQueries({ queryKey: ["examTypes"] });
			handleCloseModal();
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error && error.message
					? error.message
					: t("admin.examTypes.toast.updateError");
			toast.error(message);
		},
	});

	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			await trpcClient.examTypes.delete.mutate({ id });
		},
		onSuccess: () => {
			toast.success(t("admin.examTypes.toast.deleteSuccess"));
			queryClient.invalidateQueries({ queryKey: ["examTypes"] });
			setDeleteId(null);
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
			queryClient.invalidateQueries({ queryKey: ["examTypes"] });
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

	const isSaving =
		createMutation.isPending ||
		updateMutation.isPending ||
		deleteMutation.isPending;

	const onSubmit = (values: FormValues) => {
		if (editingType) {
			updateMutation.mutate({ id: editingType.id, values });
		} else {
			createMutation.mutate(values);
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="font-bold font-heading text-2xl text-foreground">
						{t("admin.examTypes.title")}
					</h1>
					<p className="text-muted-foreground">
						{t("admin.examTypes.subtitle")}
					</p>
				</div>
				<Button onClick={handleOpenCreate}>
					<Plus className="mr-2 h-4 w-4" />
					{t("admin.examTypes.actions.add")}
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>{t("admin.examTypes.table.title")}</CardTitle>
					<CardDescription>
						{t("admin.examTypes.table.description")}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="flex items-center justify-center py-8">
							<Spinner />
						</div>
					) : examTypes.length > 0 ? (
						<>
							<BulkActionBar
								selectedCount={selection.selectedCount}
								onClear={selection.clear}
							>
								<Button
									variant="destructive"
									size="sm"
									onClick={() => {
										if (window.confirm(t("common.bulkActions.confirmDelete", { defaultValue: "Are you sure you want to delete the selected items?" }))) {
											bulkDeleteMutation.mutate([...selection.selectedIds]);
										}
									}}
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
										<TableHead>
											{t("admin.examTypes.table.defaultPercentage")}
										</TableHead>
										<TableHead className="w-[120px] text-right">
											{t("common.table.actions")}
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{examTypes.map((type) => (
										<TableRow key={type.id}>
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
													onClick={() => setDeleteId(type.id)}
												>
													<Trash2 className="h-4 w-4 text-destructive" />
												</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
							<PaginationBar
								hasPrev={pagination.hasPrev}
								hasNext={!!data?.nextCursor}
								onPrev={pagination.handlePrev}
								onNext={() => pagination.handleNext(data?.nextCursor)}
								isLoading={isLoading}
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

			<FormModal
				isOpen={isModalOpen}
				onClose={handleCloseModal}
				title={
					editingType
						? t("admin.examTypes.form.editTitle")
						: t("admin.examTypes.form.createTitle")
				}
			>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("admin.examTypes.form.nameLabel")}</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t("admin.examTypes.form.descriptionLabel")}
									</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="defaultPercentage"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t("admin.examTypes.form.defaultPercentageLabel")}
									</FormLabel>
									<FormControl>
										<Input type="number" min={1} max={100} {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<DialogFooter className="gap-2 sm:gap-0">
							<Button variant="ghost" type="button" onClick={handleCloseModal}>
								{t("common.actions.cancel")}
							</Button>
							<Button type="submit" disabled={isSaving}>
								{isSaving
									? t("common.actions.saving")
									: t("admin.examTypes.form.submit")}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</FormModal>

			<ConfirmModal
				isOpen={Boolean(deleteId)}
				onClose={() => setDeleteId(null)}
				onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
				title={t("admin.examTypes.delete.title")}
				message={t("admin.examTypes.delete.message")}
				isLoading={deleteMutation.isPending}
			/>
		</div>
	);
}
