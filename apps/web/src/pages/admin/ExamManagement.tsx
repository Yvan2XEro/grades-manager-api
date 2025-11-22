import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import type { TFunction } from "i18next";
import { ClipboardList, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
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

const buildExamSchema = (t: TFunction) =>
	z.object({
		name: z.string().min(2, t("admin.exams.validation.name")),
		type: z.string().min(2, t("admin.exams.validation.type")),
		date: z.string().min(1, t("admin.exams.validation.date")),
		percentage: z
			.number()
			.min(1, t("admin.exams.validation.percentage.min"))
			.max(100, t("admin.exams.validation.percentage.max")),
		classCourseId: z.string({
			required_error: t("admin.exams.validation.classCourse"),
		}),
	});

type ExamFormData = z.infer<ReturnType<typeof buildExamSchema>>;

interface Exam {
	id: string;
	name: string;
	type: string;
	date: string;
	percentage: number;
	classCourse: string;
	isLocked: boolean;
}

interface ClassCourse {
	id: string;
	class: string;
	course: string;
}

interface Class {
	id: string;
	name: string;
}

interface Course {
	id: string;
	name: string;
}

export default function ExamManagement() {
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const [editingExam, setEditingExam] = useState<Exam | null>(null);
	const [deleteId, setDeleteId] = useState<string | null>(null);

	const queryClient = useQueryClient();
	const { t } = useTranslation();
	const examSchema = useMemo(() => buildExamSchema(t), [t]);

	const { data: exams, isLoading } = useQuery({
		queryKey: ["exams"],
		queryFn: async () => {
			const { items } = await trpcClient.exams.list.query({});
			return items.map((e) => ({
				...e,
				percentage: Number(e.percentage),
			})) as Exam[];
		},
	});

	const { data: classCourses } = useQuery({
		queryKey: ["classCourses"],
		queryFn: async () => {
			const { items } = await trpcClient.classCourses.list.query({});
			return items as ClassCourse[];
		},
	});

	const { data: classes } = useQuery({
		queryKey: ["classes"],
		queryFn: async () => {
			const { items } = await trpcClient.classes.list.query({});
			return items as Class[];
		},
	});

	const { data: courses } = useQuery({
		queryKey: ["courses"],
		queryFn: async () => {
			const { items } = await trpcClient.courses.list.query({});
			return items as Course[];
		},
	});

	const form = useForm<ExamFormData>({
		resolver: zodResolver(examSchema),
	});

	const classMap = new Map((classes ?? []).map((c) => [c.id, c.name]));
	const courseMap = new Map((courses ?? []).map((c) => [c.id, c.name]));
	const classCourseMap = new Map((classCourses ?? []).map((cc) => [cc.id, cc]));

	const createMutation = useMutation({
		mutationFn: async (data: ExamFormData) => {
			await trpcClient.exams.create.mutate({
				...data,
				date: new Date(data.date),
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["exams"] });
			toast.success(t("admin.exams.toast.createSuccess"));
			setIsFormOpen(false);
			form.reset();
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error && error.message
					? error.message
					: t("admin.exams.toast.createError");
			toast.error(message);
		},
	});

	const updateMutation = useMutation({
		mutationFn: async (data: ExamFormData & { id: string }) => {
			const { id, ...updateData } = data;
			await trpcClient.exams.update.mutate({
				id,
				...updateData,
				date: new Date(updateData.date),
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["exams"] });
			toast.success(t("admin.exams.toast.updateSuccess"));
			setIsFormOpen(false);
			setEditingExam(null);
			form.reset();
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error && error.message
					? error.message
					: t("admin.exams.toast.updateError");
			toast.error(message);
		},
	});

	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			await trpcClient.exams.delete.mutate({ id });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["exams"] });
			toast.success(t("admin.exams.toast.deleteSuccess"));
			setIsDeleteOpen(false);
			setDeleteId(null);
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error && error.message
					? error.message
					: t("admin.exams.toast.deleteError");
			toast.error(message);
		},
	});

	const onSubmit = async (data: ExamFormData) => {
		if (editingExam) {
			updateMutation.mutate({ ...data, id: editingExam.id });
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
					<h1 className="font-bold text-2xl">{t("admin.exams.title")}</h1>
					<p className="text-base-content/60">{t("admin.exams.subtitle")}</p>
				</div>
				<button
					type="button"
					onClick={() => {
						setEditingExam(null);
						form.reset();
						setIsFormOpen(true);
					}}
					className="btn btn-primary"
				>
					<Plus className="mr-2 h-5 w-5" />
					{t("admin.exams.actions.add")}
				</button>
			</div>

			<div className="card bg-base-100 shadow-xl">
				{exams?.length === 0 ? (
					<div className="card-body items-center py-12 text-center">
						<ClipboardList className="h-16 w-16 text-base-content/20" />
						<h2 className="card-title mt-4">{t("admin.exams.empty.title")}</h2>
						<p className="text-base-content/60">
							{t("admin.exams.empty.description")}
						</p>
						<button
							type="button"
							onClick={() => {
								setEditingExam(null);
								form.reset();
								setIsFormOpen(true);
							}}
							className="btn btn-primary mt-4"
						>
							<Plus className="mr-2 h-4 w-4" />
							{t("admin.exams.actions.add")}
						</button>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="table">
							<thead>
								<tr>
									<th>{t("admin.exams.table.name")}</th>
									<th>{t("admin.exams.table.course")}</th>
									<th>{t("admin.exams.table.class")}</th>
									<th>{t("admin.exams.table.type")}</th>
									<th>{t("admin.exams.table.date")}</th>
									<th>{t("admin.exams.table.percentage")}</th>
									<th>{t("admin.exams.table.status")}</th>
									<th>{t("common.table.actions")}</th>
								</tr>
							</thead>
							<tbody>
								{exams?.map((exam) => (
									<tr key={exam.id}>
										<td className="font-medium">{exam.name}</td>
										<td>
											{courseMap.get(
												classCourseMap.get(exam.classCourse)?.course || "",
											)}
										</td>
										<td>
											{classMap.get(
												classCourseMap.get(exam.classCourse)?.class || "",
											)}
										</td>
										<td>{exam.type}</td>
										<td>{format(new Date(exam.date), "MMM d, yyyy")}</td>
										<td>{exam.percentage}%</td>
										<td>
											<span
												className={`badge ${
													exam.isLocked ? "badge-warning" : "badge-success"
												}`}
											>
												{exam.isLocked
													? t("admin.exams.status.locked")
													: t("admin.exams.status.open")}
											</span>
										</td>
										<td>
											<div className="flex gap-2">
												<button
													type="button"
													onClick={() => {
														setEditingExam(exam);
														form.reset({
															name: exam.name,
															type: exam.type,
															date: exam.date.split("T")[0],
															percentage: exam.percentage,
															classCourseId: exam.classCourse,
														});
														setIsFormOpen(true);
													}}
													className="btn btn-square btn-sm btn-ghost"
													disabled={exam.isLocked}
												>
													<Pencil className="h-4 w-4" />
												</button>
												<button
													type="button"
													onClick={() => openDeleteModal(exam.id)}
													className="btn btn-square btn-sm btn-ghost text-error"
													disabled={exam.isLocked}
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
					setEditingExam(null);
					form.reset();
				}}
				title={
					editingExam
						? t("admin.exams.form.editTitle")
						: t("admin.exams.form.createTitle")
				}
			>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="classCourseId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("admin.exams.form.courseLabel")}</FormLabel>
									<Select onValueChange={field.onChange} value={field.value}>
										<FormControl>
											<SelectTrigger>
												<SelectValue
													placeholder={t("admin.exams.form.coursePlaceholder")}
												/>
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{classCourses?.map((cc) => (
												<SelectItem key={cc.id} value={cc.id}>
													{courseMap.get(cc.course)} - {classMap.get(cc.class)}
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
									<FormLabel>{t("admin.exams.form.nameLabel")}</FormLabel>
									<FormControl>
										<Input
											{...field}
											placeholder={t("admin.exams.form.namePlaceholder")}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="type"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("admin.exams.form.typeLabel")}</FormLabel>
									<FormControl>
										<Input
											{...field}
											placeholder={t("admin.exams.form.typePlaceholder")}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="date"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("admin.exams.form.dateLabel")}</FormLabel>
									<FormControl>
										<Input type="date" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="percentage"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("admin.exams.form.percentageLabel")}</FormLabel>
									<FormControl>
										<Input
											type="number"
											value={field.value ?? ""}
											onChange={(event) =>
												field.onChange(
													event.target.value === ""
														? undefined
														: Number(event.target.value),
												)
											}
											placeholder={t("admin.exams.form.percentagePlaceholder")}
										/>
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
									setEditingExam(null);
									form.reset();
								}}
							>
								{t("common.actions.cancel")}
							</Button>
							<Button type="submit" disabled={form.formState.isSubmitting}>
								{form.formState.isSubmitting ? (
									<Spinner className="mr-2 h-4 w-4" />
								) : editingExam ? (
									t("common.actions.saveChanges")
								) : (
									t("admin.exams.form.submit")
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
				title={t("admin.exams.delete.title")}
				message={t("admin.exams.delete.message")}
				confirmText={t("common.actions.delete")}
				isLoading={deleteMutation.isPending}
			/>
		</div>
	);
}
