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

	const { data: academicYears, isLoading } = useQuery({
		queryKey: ["academicYears"],
		queryFn: async () => {
			const { items } = await trpcClient.academicYears.list.query({});
			return items as AcademicYear[];
		},
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
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="font-bold text-2xl text-gray-800">
						{t("admin.academicYears.title")}
					</h2>
					<p className="text-gray-600">{t("admin.academicYears.subtitle")}</p>
				</div>
				<button
					type="button"
					onClick={() => {
						setEditingYear(null);
						form.reset({ startDate: "", endDate: "", name: "" });
						setIsModalOpen(true);
					}}
					className="btn btn-primary"
				>
					<Plus className="mr-2 h-5 w-5" />{" "}
					{t("admin.academicYears.actions.add")}
				</button>
			</div>

			<div className="overflow-hidden rounded-xl bg-white shadow-sm">
				{academicYears?.length === 0 ? (
					<div className="p-8 text-center">
						<Calendar className="mx-auto h-12 w-12 text-gray-400" />
						<h3 className="mt-4 font-medium text-gray-700 text-lg">
							{t("admin.academicYears.empty.title")}
						</h3>
						<p className="mt-1 text-gray-500">
							{t("admin.academicYears.empty.description")}
						</p>
						<button
							type="button"
							onClick={() => {
								setEditingYear(null);
								form.reset({ startDate: "", endDate: "", name: "" });
								setIsModalOpen(true);
							}}
							className="btn btn-primary btn-sm mt-4"
						>
							<Plus className="mr-2 h-4 w-4" />{" "}
							{t("admin.academicYears.actions.add")}
						</button>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="table">
							<thead>
								<tr>
									<th>{t("admin.academicYears.table.name")}</th>
									<th>{t("admin.academicYears.table.startDate")}</th>
									<th>{t("admin.academicYears.table.endDate")}</th>
									<th>{t("admin.academicYears.table.status")}</th>
									<th>{t("common.table.actions")}</th>
								</tr>
							</thead>
							<tbody>
								{academicYears?.map((year) => (
									<tr key={year.id}>
										<td>{year.name}</td>
										<td>{formatDate(year.startDate)}</td>
										<td>{formatDate(year.endDate)}</td>
										<td>
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
										</td>
										<td>
											{deleteConfirmId === year.id ? (
												<div className="flex items-center space-x-2">
													<span className="text-gray-600 text-sm">
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
													<button
														type="button"
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
													</button>
													<button
														type="button"
														onClick={() => setDeleteConfirmId(year.id)}
														className="btn btn-ghost btn-sm"
													>
														<Trash2 className="h-4 w-4" />
													</button>
												</div>
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>

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
										<Input type="date" {...field} />
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
										<Input type="date" {...field} />
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
