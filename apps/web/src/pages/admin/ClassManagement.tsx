import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";
import ConfirmModal from "../../components/modals/ConfirmModal";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../components/ui/select";
import { Spinner } from "../../components/ui/spinner";
import { trpcClient } from "../../utils/trpc";

const buildClassSchema = (t: TFunction) =>
	z.object({
		programId: z.string({
			required_error: t("admin.classes.validation.program"),
		}),
		academicYearId: z.string({
			required_error: t("admin.classes.validation.academicYear"),
		}),
		name: z.string().min(2, t("admin.classes.validation.name")),
	});

type ClassFormData = z.infer<ReturnType<typeof buildClassSchema>>;

interface Class {
	id: string;
	name: string;
	programId: string;
	academicYearId: string;
	program: { name: string };
	academicYear: { name: string };
	students: { id: string }[];
}

export default function ClassManagement() {
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const [editingClass, setEditingClass] = useState<Class | null>(null);
	const [deleteId, setDeleteId] = useState<string | null>(null);

	const queryClient = useQueryClient();
	const { t } = useTranslation();
	const classSchema = useMemo(() => buildClassSchema(t), [t]);

	const { data: classes, isLoading } = useQuery({
		queryKey: ["classes"],
		queryFn: async () => {
			const { items } = await trpcClient.classes.list.query({});
			return Promise.all(
				items.map(async (cls) => {
					const [program, academicYear, students] = await Promise.all([
						trpcClient.programs.getById.query({ id: cls.program }),
						trpcClient.academicYears.getById.query({ id: cls.academicYear }),
						trpcClient.students.list.query({ classId: cls.id }),
					]);
					return {
						id: cls.id,
						name: cls.name,
						programId: cls.program,
						academicYearId: cls.academicYear,
						program: { name: program.name },
						academicYear: { name: academicYear.name },
						students: students.items.map((s) => ({ id: s.id })),
					} as Class;
				}),
			);
		},
	});

	const { data: programs } = useQuery({
		queryKey: ["programs"],
		queryFn: async () => {
			const { items } = await trpcClient.programs.list.query({});
			return items;
		},
	});

	const { data: academicYears } = useQuery({
		queryKey: ["academicYears"],
		queryFn: async () => {
			const { items } = await trpcClient.academicYears.list.query({});
			return items;
		},
	});

	const form = useForm<ClassFormData>({
		resolver: zodResolver(classSchema),
		defaultValues: {
			programId: "",
			academicYearId: "",
			name: "",
		},
	});

	const { watch, setValue } = form;

	const selectedProgramId = watch("programId");
	const selectedAcademicYearId = watch("academicYearId");

	useEffect(() => {
		const program = programs?.find((p) => p.id === selectedProgramId);
		const year = academicYears?.find((y) => y.id === selectedAcademicYearId);
		if (program && year) {
			const startYear = new Date(year.startDate).getFullYear();
			const endYear = new Date(year.endDate).getFullYear();
			setValue("name", `${program.name}(${startYear}-${endYear})`);
		}
	}, [
		selectedProgramId,
		selectedAcademicYearId,
		programs,
		academicYears,
		setValue,
	]);

	const createMutation = useMutation({
		mutationFn: async (data: ClassFormData) => {
			await trpcClient.classes.create.mutate({
				name: data.name,
				program: data.programId,
				academicYear: data.academicYearId,
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["classes"] });
			toast.success(t("admin.classes.toast.createSuccess"));
			setIsFormOpen(false);
			form.reset();
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error && error.message
					? error.message
					: t("admin.classes.toast.createError");
			toast.error(message);
		},
	});

	const updateMutation = useMutation({
		mutationFn: async (data: ClassFormData & { id: string }) => {
			await trpcClient.classes.update.mutate({
				id: data.id,
				name: data.name,
				program: data.programId,
				academicYear: data.academicYearId,
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["classes"] });
			toast.success(t("admin.classes.toast.updateSuccess"));
			setIsFormOpen(false);
			setEditingClass(null);
			form.reset();
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error && error.message
					? error.message
					: t("admin.classes.toast.updateError");
			toast.error(message);
		},
	});

	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			await trpcClient.classes.delete.mutate({ id });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["classes"] });
			toast.success(t("admin.classes.toast.deleteSuccess"));
			setIsDeleteOpen(false);
			setDeleteId(null);
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error && error.message
					? error.message
					: t("admin.classes.toast.deleteError");
			toast.error(message);
		},
	});

	const onSubmit = async (data: ClassFormData) => {
		if (editingClass) {
			updateMutation.mutate({ ...data, id: editingClass.id });
		} else {
			createMutation.mutate(data);
		}
	};

	const openDeleteModal = (id: string) => {
		setDeleteId(id);
		setIsDeleteOpen(true);
	};

	const handleDelete = () => {
		if (deleteId) {
			deleteMutation.mutate(deleteId);
		}
	};

	if (isLoading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<span className="loading loading-spinner loading-lg" />
			</div>
		);
	}

	return (
		<div className="p-6">
			<div className="mb-6 flex items-center justify-between">
				<div>
					<h1 className="font-bold text-2xl">{t("admin.classes.title")}</h1>
					<p className="text-base-content/60">{t("admin.classes.subtitle")}</p>
				</div>
				<button
					type="button"
					onClick={() => {
						setEditingClass(null);
						form.reset();
						setIsFormOpen(true);
					}}
					className="btn btn-primary"
				>
					<Plus className="mr-2 h-5 w-5" />
					{t("admin.classes.actions.add")}
				</button>
			</div>

			<div className="card bg-base-100 shadow-xl">
				{classes?.length === 0 ? (
					<div className="card-body items-center py-12 text-center">
						<Users className="h-16 w-16 text-base-content/20" />
						<h2 className="card-title mt-4">
							{t("admin.classes.empty.title")}
						</h2>
						<p className="text-base-content/60">
							{t("admin.classes.empty.description")}
						</p>
						<button
							type="button"
							onClick={() => {
								setEditingClass(null);
								form.reset();
								setIsFormOpen(true);
							}}
							className="btn btn-primary mt-4"
						>
							<Plus className="mr-2 h-4 w-4" />
							{t("admin.classes.actions.add")}
						</button>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="table">
							<thead>
								<tr>
									<th>{t("admin.classes.table.name")}</th>
									<th>{t("admin.classes.table.program")}</th>
									<th>{t("admin.classes.table.academicYear")}</th>
									<th>{t("admin.classes.table.students")}</th>
									<th>{t("common.table.actions")}</th>
								</tr>
							</thead>
							<tbody>
								{classes?.map((cls) => (
									<tr key={cls.id}>
										<td className="font-medium">{cls.name}</td>
										<td>{cls.program?.name}</td>
										<td>{cls.academicYear?.name}</td>
										<td>
											<div className="flex items-center gap-2">
												<Users className="h-4 w-4" />
												<span>{cls.students?.length || 0}</span>
											</div>
										</td>
										<td>
											<div className="flex gap-2">
												<button
													type="button"
													onClick={() => {
														setEditingClass(cls);
														form.reset({
															name: cls.name,
															programId: cls.programId,
															academicYearId: cls.academicYearId,
														});
														setIsFormOpen(true);
													}}
													className="btn btn-square btn-sm btn-ghost"
												>
													<Pencil className="h-4 w-4" />
												</button>
												<button
													type="button"
													onClick={() => openDeleteModal(cls.id)}
													className="btn btn-square btn-sm btn-ghost text-error"
												>
													<Trash2 className="h-4 w-4" />
												</button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>

			<FormModal
				isOpen={isFormOpen}
				onClose={() => {
					setIsFormOpen(false);
					setEditingClass(null);
					form.reset();
				}}
				title={
					editingClass
						? t("admin.classes.form.editTitle")
						: t("admin.classes.form.createTitle")
				}
			>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="programId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("admin.classes.form.programLabel")}</FormLabel>
									<Select onValueChange={field.onChange} value={field.value}>
										<FormControl>
											<SelectTrigger>
												<SelectValue
													placeholder={t(
														"admin.classes.form.programPlaceholder",
													)}
												/>
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{programs?.map((program) => (
												<SelectItem key={program.id} value={program.id}>
													{program.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="academicYearId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t("admin.classes.form.academicYearLabel")}
									</FormLabel>
									<Select onValueChange={field.onChange} value={field.value}>
										<FormControl>
											<SelectTrigger>
												<SelectValue
													placeholder={t(
														"admin.classes.form.academicYearPlaceholder",
													)}
												/>
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{academicYears?.map((year) => (
												<SelectItem key={year.id} value={year.id}>
													{year.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("admin.classes.form.labelLabel")}</FormLabel>
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
									setIsFormOpen(false);
									setEditingClass(null);
									form.reset();
								}}
							>
								{t("common.actions.cancel")}
							</Button>
							<Button type="submit" disabled={form.formState.isSubmitting}>
								{form.formState.isSubmitting ? (
									<Spinner className="mr-2 h-4 w-4" />
								) : editingClass ? (
									t("common.actions.saveChanges")
								) : (
									t("admin.classes.form.createSubmit")
								)}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</FormModal>

			<ConfirmModal
				isOpen={isDeleteOpen}
				onClose={() => {
					setIsDeleteOpen(false);
					setDeleteId(null);
				}}
				onConfirm={handleDelete}
				title={t("admin.classes.delete.title")}
				message={t("admin.classes.delete.message")}
				confirmText={t("common.actions.delete")}
				isLoading={deleteMutation.isPending}
			/>
		</div>
	);
}
