import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Pencil, Plus, Trash2 } from "lucide-react";
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
import { Spinner } from "../../components/ui/spinner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "../../components/ui/table";
import { Textarea } from "../../components/ui/textarea";
import { useRowSelection } from "../../hooks/useRowSelection";
import { trpc, trpcClient } from "../../utils/trpc";

const buildSchema = (t: ReturnType<typeof useTranslation>["t"]) =>
	z.object({
		nameFr: z.string().min(
			2,
			t("admin.faculties.form.nameFrRequired", {
				defaultValue: "French name is required",
			}),
		),
		nameEn: z.string().min(
			2,
			t("admin.faculties.form.nameEnRequired", {
				defaultValue: "English name is required",
			}),
		),
		code: z.string().min(
			2,
			t("admin.faculties.form.codeRequired", {
				defaultValue: "Code is required",
			}),
		),
		shortName: z.string().optional(),
		descriptionFr: z.string().optional(),
		descriptionEn: z.string().optional(),
	});

type Faculty = {
	id: string;
	code: string;
	nameFr: string;
	nameEn: string;
	shortName: string | null;
	descriptionFr: string | null;
	descriptionEn: string | null;
	type: string;
};

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

export default function FacultyManagement() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const schema = useMemo(() => buildSchema(t), [t]);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);
	const [deleteId, setDeleteId] = useState<string | null>(null);

	const form = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			nameFr: "",
			nameEn: "",
			code: "",
			shortName: "",
			descriptionFr: "",
			descriptionEn: "",
		},
	});

	const resetForm = () =>
		form.reset({
			nameFr: "",
			nameEn: "",
			code: "",
			shortName: "",
			descriptionFr: "",
			descriptionEn: "",
		});

	const { data: allInstitutions, isLoading } = useQuery(
		trpc.institutions.list.queryOptions(),
	);

	const faculties = useMemo(
		() =>
			(allInstitutions ?? []).filter((i) => i.type === "faculty") as Faculty[],
		[allInstitutions],
	);

	const selection = useRowSelection(faculties);

	const handleOpenCreate = () => {
		setEditingFaculty(null);
		resetForm();
		setIsModalOpen(true);
	};

	const handleOpenEdit = (faculty: Faculty) => {
		setEditingFaculty(faculty);
		form.reset({
			nameFr: faculty.nameFr,
			nameEn: faculty.nameEn,
			code: faculty.code,
			shortName: faculty.shortName ?? "",
			descriptionFr: faculty.descriptionFr ?? "",
			descriptionEn: faculty.descriptionEn ?? "",
		});
		setIsModalOpen(true);
	};

	const handleCloseModal = () => {
		setIsModalOpen(false);
		setEditingFaculty(null);
		resetForm();
	};

	const invalidate = () =>
		queryClient.invalidateQueries({
			queryKey: trpc.institutions.list.queryKey(),
		});

	const createMutation = useMutation({
		mutationFn: async (values: FormValues) => {
			await trpcClient.institutions.create.mutate({
				...values,
				type: "faculty",
				shortName: values.shortName || undefined,
				descriptionFr: values.descriptionFr || undefined,
				descriptionEn: values.descriptionEn || undefined,
			});
		},
		onSuccess: () => {
			toast.success(
				t("admin.faculties.toast.createSuccess", {
					defaultValue: "Faculty created",
				}),
			);
			invalidate();
			handleCloseModal();
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error && error.message
					? error.message
					: t("admin.faculties.toast.createError", {
							defaultValue: "Failed to create faculty",
						});
			toast.error(message);
		},
	});

	const updateMutation = useMutation({
		mutationFn: async ({ id, values }: { id: string; values: FormValues }) => {
			await trpcClient.institutions.update.mutate({
				id,
				data: {
					...values,
					type: "faculty",
					shortName: values.shortName || undefined,
					descriptionFr: values.descriptionFr || undefined,
					descriptionEn: values.descriptionEn || undefined,
				},
			});
		},
		onSuccess: () => {
			toast.success(
				t("admin.faculties.toast.updateSuccess", {
					defaultValue: "Faculty updated",
				}),
			);
			invalidate();
			handleCloseModal();
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error && error.message
					? error.message
					: t("admin.faculties.toast.updateError", {
							defaultValue: "Failed to update faculty",
						});
			toast.error(message);
		},
	});

	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			await trpcClient.institutions.delete.mutate({ id });
		},
		onSuccess: () => {
			toast.success(
				t("admin.faculties.toast.deleteSuccess", {
					defaultValue: "Faculty deleted",
				}),
			);
			invalidate();
			setDeleteId(null);
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error && error.message
					? error.message
					: t("admin.faculties.toast.deleteError", {
							defaultValue: "Failed to delete faculty",
						});
			toast.error(message);
		},
	});

	const bulkDeleteMutation = useMutation({
		mutationFn: async (ids: string[]) => {
			await Promise.all(
				ids.map((id) => trpcClient.institutions.delete.mutate({ id })),
			);
		},
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

	const isSaving =
		createMutation.isPending ||
		updateMutation.isPending ||
		deleteMutation.isPending;

	const onSubmit = (values: FormValues) => {
		if (editingFaculty) {
			updateMutation.mutate({ id: editingFaculty.id, values });
		} else {
			createMutation.mutate(values);
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-3">
					<div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
						<Building2 className="h-5 w-5 text-primary" />
					</div>
					<div>
						<h1 className="font-bold font-heading text-2xl text-foreground">
							{t("admin.faculties.title", { defaultValue: "Faculties" })}
						</h1>
						<p className="text-muted-foreground text-sm">
							{t("admin.faculties.subtitle", {
								defaultValue:
									"Manage faculties and schools within the institution.",
							})}
						</p>
					</div>
				</div>
				<Button onClick={handleOpenCreate}>
					<Plus className="mr-2 h-4 w-4" />
					{t("admin.faculties.actions.add", { defaultValue: "Add faculty" })}
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>
						{t("admin.faculties.table.title", {
							defaultValue: "All faculties",
						})}
					</CardTitle>
					<CardDescription>
						{t("admin.faculties.table.description", {
							defaultValue:
								"List of all faculties and schools registered in the system.",
						})}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="flex items-center justify-center py-8">
							<Spinner />
						</div>
					) : faculties.length > 0 ? (
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
											{t("admin.faculties.table.code", {
												defaultValue: "Code",
											})}
										</TableHead>
										<TableHead>
											{t("admin.faculties.table.nameFr", {
												defaultValue: "Name (FR)",
											})}
										</TableHead>
										<TableHead>
											{t("admin.faculties.table.nameEn", {
												defaultValue: "Name (EN)",
											})}
										</TableHead>
										<TableHead>
											{t("admin.faculties.table.shortName", {
												defaultValue: "Short name",
											})}
										</TableHead>
										<TableHead className="w-[120px] text-right">
											{t("common.table.actions")}
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{faculties.map((faculty) => (
										<TableRow key={faculty.id}>
											<TableCell>
												<Checkbox
													checked={selection.isSelected(faculty.id)}
													onCheckedChange={() => selection.toggle(faculty.id)}
													aria-label={`Select ${faculty.nameFr}`}
												/>
											</TableCell>
											<TableCell>
												<span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 font-mono text-xs">
													{faculty.code}
												</span>
											</TableCell>
											<TableCell className="font-medium">
												{faculty.nameFr}
											</TableCell>
											<TableCell>{faculty.nameEn}</TableCell>
											<TableCell>{faculty.shortName || "\u2014"}</TableCell>
											<TableCell className="flex items-center justify-end gap-2">
												<Button
													variant="ghost"
													size="icon"
													onClick={() => handleOpenEdit(faculty)}
												>
													<Pencil className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													onClick={() => setDeleteId(faculty.id)}
												>
													<Trash2 className="h-4 w-4 text-destructive" />
												</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</>
					) : (
						<Empty>
							<EmptyHeader>
								<Building2 className="mx-auto h-10 w-10 text-muted-foreground/50" />
								<EmptyTitle>
									{t("admin.faculties.empty.title", {
										defaultValue: "No faculties yet",
									})}
								</EmptyTitle>
								<EmptyDescription>
									{t("admin.faculties.empty.description", {
										defaultValue:
											"Create your first faculty to start organizing your academic structure.",
									})}
								</EmptyDescription>
							</EmptyHeader>
							<EmptyContent>
								<Button onClick={handleOpenCreate} variant="outline">
									<Plus className="mr-2 h-4 w-4" />
									{t("admin.faculties.actions.add", {
										defaultValue: "Add faculty",
									})}
								</Button>
							</EmptyContent>
						</Empty>
					)}
				</CardContent>
			</Card>

			<FormModal
				isOpen={isModalOpen}
				onClose={handleCloseModal}
				title={
					editingFaculty
						? t("admin.faculties.form.editTitle", {
								defaultValue: "Edit faculty",
							})
						: t("admin.faculties.form.createTitle", {
								defaultValue: "Create faculty",
							})
				}
			>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<div className="grid gap-4 sm:grid-cols-2">
							<FormField
								control={form.control}
								name="code"
								render={({ field }) => (
									<FormItem>
										<FormLabel required>
											{t("admin.faculties.form.codeLabel", {
												defaultValue: "Code",
											})}
										</FormLabel>
										<FormControl>
											<Input placeholder="FST" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="shortName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("admin.faculties.form.shortNameLabel", {
												defaultValue: "Short name",
											})}
										</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<div className="grid gap-4 sm:grid-cols-2">
							<FormField
								control={form.control}
								name="nameFr"
								render={({ field }) => (
									<FormItem>
										<FormLabel required>
											{t("admin.faculties.form.nameFrLabel", {
												defaultValue: "Name (French)",
											})}
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
								name="nameEn"
								render={({ field }) => (
									<FormItem>
										<FormLabel required>
											{t("admin.faculties.form.nameEnLabel", {
												defaultValue: "Name (English)",
											})}
										</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<div className="grid gap-4 sm:grid-cols-2">
							<FormField
								control={form.control}
								name="descriptionFr"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("admin.faculties.form.descriptionFrLabel", {
												defaultValue: "Description (French)",
											})}
										</FormLabel>
										<FormControl>
											<Textarea rows={3} {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="descriptionEn"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("admin.faculties.form.descriptionEnLabel", {
												defaultValue: "Description (English)",
											})}
										</FormLabel>
										<FormControl>
											<Textarea rows={3} {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<DialogFooter className="gap-2 sm:gap-0">
							<Button variant="ghost" type="button" onClick={handleCloseModal}>
								{t("common.actions.cancel")}
							</Button>
							<Button type="submit" disabled={isSaving}>
								{isSaving
									? t("common.actions.saving")
									: editingFaculty
										? t("common.actions.save")
										: t("admin.faculties.form.submit", {
												defaultValue: "Create",
											})}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</FormModal>

			<ConfirmModal
				isOpen={Boolean(deleteId)}
				onClose={() => setDeleteId(null)}
				onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
				title={t("admin.faculties.delete.title", {
					defaultValue: "Delete faculty",
				})}
				message={t("admin.faculties.delete.message", {
					defaultValue:
						"Are you sure you want to delete this faculty? This action cannot be undone.",
				})}
				isLoading={deleteMutation.isPending}
			/>
		</div>
	);
}
