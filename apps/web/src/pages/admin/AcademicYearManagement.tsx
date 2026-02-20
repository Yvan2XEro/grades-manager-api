import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, isValid, parseISO } from "date-fns";
import type { TFunction } from "i18next";
import { Calendar, Check, Pencil, Plus, Trash2, X } from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";
import { DatePicker } from "@/components/ui/date-picker";
import { BulkActionBar } from "@/components/ui/bulk-action-bar";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { PaginationBar } from "@/components/ui/pagination-bar";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useCursorPagination } from "@/hooks/useCursorPagination";
import { useRowSelection } from "@/hooks/useRowSelection";
import FormModal from "../../components/modals/FormModal";
import { Button } from "../../components/ui/button";
import { DialogFooter } from "../../components/ui/dialog";
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
import { Switch } from "../../components/ui/switch";
import { trpcClient } from "../../utils/trpc";

const buildAcademicYearSchema = (t: TFunction) =>
	z
		.object({
			startDate: z
				.string()
				.min(1, t("admin.academicYears.validation.startDate")),
			endDate: z.string().min(1, t("admin.academicYears.validation.endDate")),
			name: z.string().min(2, t("admin.academicYears.validation.name")),
		})
		.refine(
			(data) => {
				const start = new Date(data.startDate);
				const end = new Date(data.endDate);
				return end > start;
			},
			{
				message: t("admin.academicYears.validation.order"),
				path: ["endDate"],
			},
		);

type AcademicYear = {
	id: string;
	name: string;
	startDate: string;
	endDate: string;
	isActive: boolean;
	createdAt: string;
};

type FormData = z.infer<ReturnType<typeof buildAcademicYearSchema>>;

const AcademicYearManagement: React.FC = () => {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
	const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
	const queryClient = useQueryClient();
	const { t } = useTranslation();
	const academicYearSchema = useMemo(() => buildAcademicYearSchema(t), [t]);
	const pagination = useCursorPagination({ pageSize: 20 });

	const form = useForm<FormData>({
		resolver: zodResolver(academicYearSchema),
		defaultValues: {
			startDate: "",
			endDate: "",
			name: "",
		},
	});

	const { watch, setValue } = form;

	const startDate = watch("startDate");
	const endDate = watch("endDate");

	useEffect(() => {
		if (startDate) {
			if (!editingYear || startDate !== editingYear.startDate.slice(0, 10)) {
				const end = new Date(startDate);
				end.setFullYear(end.getFullYear() + 1);
				setValue("endDate", end.toISOString().slice(0, 10));
			}
		}
	}, [startDate, editingYear, setValue]);

	useEffect(() => {
		if (startDate && endDate) {
			const startYear = new Date(startDate).getFullYear();
			const endYear = new Date(endDate).getFullYear();
			setValue("name", `${startYear}-${endYear}`);
		}
	}, [startDate, endDate, setValue]);

	const { data, isLoading } = useQuery({
		queryKey: ["academicYears", pagination.cursor],
		queryFn: async () => {
			const result = await trpcClient.academicYears.list.query({
				cursor: pagination.cursor,
				limit: pagination.pageSize,
			});
			return result as { items: AcademicYear[]; nextCursor?: string };
		},
	});

	const academicYears = data?.items ?? [];
	const selection = useRowSelection(academicYears);

	const bulkDeleteMutation = useMutation({
		mutationFn: async (ids: string[]) => {
			await Promise.all(
				ids.map((id) => trpcClient.academicYears.delete.mutate({ id })),
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["academicYears"] });
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

	const createMutation = useMutation({
		mutationFn: async (data: FormData) => {
			await trpcClient.academicYears.create.mutate({
				name: data.name,
				startDate: new Date(data.startDate),
				endDate: new Date(data.endDate),
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["academicYears"] });
			toast.success(t("admin.academicYears.toast.createSuccess"));
			setIsModalOpen(false);
			form.reset();
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error && error.message
					? error.message
					: t("admin.academicYears.toast.createError");
			toast.error(message);
		},
	});

	const updateMutation = useMutation({
		mutationFn: async ({ id, data }: { id: string; data: FormData }) => {
			await trpcClient.academicYears.update.mutate({
				id,
				name: data.name,
				startDate: new Date(data.startDate),
				endDate: new Date(data.endDate),
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["academicYears"] });
			toast.success(t("admin.academicYears.toast.updateSuccess"));
			setIsModalOpen(false);
			setEditingYear(null);
			form.reset();
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error && error.message
					? error.message
					: t("admin.academicYears.toast.updateError");
			toast.error(message);
		},
	});

	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			await trpcClient.academicYears.delete.mutate({ id });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["academicYears"] });
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
			queryClient.invalidateQueries({ queryKey: ["academicYears"] });
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

	const onSubmit = async (data: FormData) => {
		if (editingYear) {
			updateMutation.mutate({ id: editingYear.id, data });
		} else {
			createMutation.mutate(data);
		}
	};

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
		<div className="space-y-6 p-6">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div>
					<h1 className="font-semibold text-2xl">
						{t("admin.academicYears.title")}
					</h1>
					<p className="text-muted-foreground">
						{t("admin.academicYears.subtitle")}
					</p>
				</div>
				<Button
					type="button"
					onClick={() => {
						setEditingYear(null);
						form.reset({ startDate: "", endDate: "", name: "" });
						setIsModalOpen(true);
					}}
					className="btn btn-primary"
				>
					<Plus className="mr-2 h-5 w-5" />
					{t("admin.academicYears.actions.add")}
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>{t("admin.academicYears.title")}</CardTitle>
					<CardDescription>{t("admin.academicYears.subtitle")}</CardDescription>
				</CardHeader>

				{isLoading ? (
					<div className="flex items-center justify-center p-8">
						<Spinner />
					</div>
				) : academicYears.length === 0 ? (
					<div className="p-8 text-center">
						<Calendar className="mx-auto h-12 w-12 text-muted-foreground/60" />
						<h3 className="mt-4 font-medium text-foreground text-lg">
							{t("admin.academicYears.empty.title")}
						</h3>
						<p className="mt-1 text-muted-foreground">
							{t("admin.academicYears.empty.description")}
						</p>
						<Button
							type="button"
							onClick={() => {
								setEditingYear(null);
								form.reset({
									startDate: "",
									endDate: "",
									name: "",
								});
								setIsModalOpen(true);
							}}
						>
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
									bulkDeleteMutation.mutate([...selection.selectedIds])
								}
								disabled={bulkDeleteMutation.isPending}
							>
								<Trash2 className="mr-1.5 h-3.5 w-3.5" />
								{t("common.actions.delete")}
							</Button>
						</BulkActionBar>
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
									<TableHead>
										{t("admin.academicYears.table.startDate")}
									</TableHead>
									<TableHead>
										{t("admin.academicYears.table.endDate")}
									</TableHead>
									<TableHead>{t("admin.academicYears.table.status")}</TableHead>
									<TableHead>{t("common.table.actions")}</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{academicYears.map((year) => (
									<TableRow key={year.id}>
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
													className="text-muted-foreground text-sm"
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
													<span className="text-muted-foreground text-sm">
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
													<Button
														type="button"
														variant="ghost"
														size={"icon"}
														onClick={() => {
															setEditingYear(year);
															form.reset({
																startDate: year.startDate.slice(0, 10),
																endDate: year.endDate.slice(0, 10),
																name: year.name,
															});
															setIsModalOpen(true);
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
						<PaginationBar
							hasPrev={pagination.hasPrev}
							hasNext={!!data?.nextCursor}
							onPrev={pagination.handlePrev}
							onNext={() => pagination.handleNext(data?.nextCursor)}
							isLoading={isLoading}
						/>
					</CardContent>
				)}
			</Card>

			<FormModal
				isOpen={isModalOpen}
				onClose={() => {
					setIsModalOpen(false);
					setEditingYear(null);
					form.reset();
				}}
				title={
					editingYear
						? t("admin.academicYears.modal.editTitle")
						: t("admin.academicYears.modal.createTitle")
				}
			>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="startDate"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t("admin.academicYears.modal.startDate")}
									</FormLabel>
									<FormControl>
										<DatePicker value={field.value ?? ""} onChange={field.onChange} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="endDate"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t("admin.academicYears.modal.endDate")}
									</FormLabel>
									<FormControl>
										<DatePicker value={field.value ?? ""} onChange={field.onChange} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("admin.academicYears.modal.label")}</FormLabel>
									<FormControl>
										<Input {...field} readOnly />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<DialogFooter className="gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => {
									setIsModalOpen(false);
									setEditingYear(null);
									form.reset();
								}}
							>
								{t("common.actions.cancel")}
							</Button>
							<Button type="submit" disabled={form.formState.isSubmitting}>
								{form.formState.isSubmitting ? (
									<Spinner className="mr-2 h-4 w-4" />
								) : (
									t("common.actions.save")
								)}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</FormModal>
		</div>
	);
};

export default AcademicYearManagement;
