import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import type { TFunction } from "i18next";
import {
	AlertTriangle,
	CheckCircle2,
	ClipboardList,
	Clock,
	Pencil,
	Plus,
	Trash2,
	XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import { SemesterSelect } from "@/components/inputs/SemesterSelect";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";
import ConfirmModal from "../../components/modals/ConfirmModal";
import FormModal from "../../components/modals/FormModal";
import { type RouterOutputs, trpcClient } from "../../utils/trpc";

const buildExamSchema = (t: TFunction) =>
	z.object({
		name: z.string().min(2, t("teacher.exams.validation.name")),
		type: z.string().min(2, t("teacher.exams.validation.type")),
		date: z.string().min(1, t("teacher.exams.validation.date")),
		percentage: z
			.number()
			.min(1, t("teacher.exams.validation.percentage.min"))
			.max(100, t("teacher.exams.validation.percentage.max")),
		classCourseId: z.string({
			required_error: t("teacher.exams.validation.classCourse"),
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
	const [filterYear, setFilterYear] = useState<string | null>(null);
	const [filterSemester, setFilterSemester] = useState<string | null>(null);

	const queryClient = useQueryClient();
	const { t } = useTranslation();
	const examSchema = useMemo(() => buildExamSchema(t), [t]);

	const { data: semestersData } = useQuery({
		queryKey: ["semesters"],
		queryFn: () => trpcClient.semesters.list.query({}),
	});
	const filterUeSemester = useMemo(() => {
		if (!filterSemester || !semestersData) return undefined;
		const code =
			semestersData.items.find((s) => s.id === filterSemester)?.code ?? "";
		if (code === "S1") return "fall" as const;
		if (code === "S2") return "spring" as const;
		return "annual" as const;
	}, [filterSemester, semestersData]);

	const { data: exams, isLoading } = useQuery({
		queryKey: ["teacherExams", filterYear, filterUeSemester],
		queryFn: async () => {
			const { items } = await trpcClient.exams.list.query({
				...(filterYear ? { academicYearId: filterYear } : {}),
				...(filterUeSemester ? { ueSemester: filterUeSemester } : {}),
			});
			return items as Exam[];
		},
	});

	const { data: classCourses } = useQuery({
		queryKey: ["teacherClassCourses", filterYear, filterUeSemester],
		queryFn: async () => {
			const { items } = await trpcClient.classCourses.list.query({
				...(filterYear ? { academicYearId: filterYear } : {}),
				...(filterUeSemester ? { ueSemester: filterUeSemester } : {}),
			});
			return items as ClassCourse[];
		},
	});

	const { data: classes } = useQuery({
		queryKey: ["teacherClasses", filterYear],
		queryFn: async () => {
			const { items } = await trpcClient.classes.list.query({
				...(filterYear ? { academicYearId: filterYear } : {}),
			});
			return items as Class[];
		},
	});

	const { data: courses } = useQuery({
		queryKey: ["teacherCoursesList"],
		queryFn: async () => {
			const { items } = await trpcClient.courses.list.query({});
			return items as Course[];
		},
	});

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<ExamFormData>({
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
			queryClient.invalidateQueries({ queryKey: ["teacherExams"] });
			toast.success(t("teacher.exams.toast.createSuccess"));
			setIsFormOpen(false);
			reset();
		},
		onError: (error: any) => {
			toast.error(error.message || t("teacher.exams.toast.createError"));
		},
	});

	const updateMutation = useMutation({
		mutationFn: async (data: ExamFormData & { id: string }) => {
			const { id, ...updateData } = data;
			await trpcClient.exams.update.mutate({ id, ...updateData });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["teacherExams"] });
			toast.success(t("teacher.exams.toast.updateSuccess"));
			setIsFormOpen(false);
			setEditingExam(null);
			reset();
		},
		onError: (error: any) => {
			toast.error(error.message || t("teacher.exams.toast.updateError"));
		},
	});

	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			await trpcClient.exams.delete.mutate({ id });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["teacherExams"] });
			toast.success(t("teacher.exams.toast.deleteSuccess"));
			setIsDeleteOpen(false);
			setDeleteId(null);
		},
		onError: (error: any) => {
			toast.error(error.message || t("teacher.exams.toast.deleteError"));
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
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-foreground">{t("teacher.exams.title")}</h1>
					<p className="text-base-content/60">{t("teacher.exams.subtitle")}</p>
				</div>
				<button
					onClick={() => {
						setEditingExam(null);
						reset();
						setIsFormOpen(true);
					}}
					className="btn btn-primary"
				>
					<Plus className="mr-2 h-5 w-5" />
					{t("teacher.exams.actions.add")}
				</button>
			</div>

			<div className="mb-4 flex flex-wrap items-end gap-4">
				<div className="w-56">
					<Label className="mb-1 block font-medium text-sm">
						{t("admin.classes.filters.academicYear", {
							defaultValue: "Academic Year",
						})}
					</Label>
					<AcademicYearSelect
						value={filterYear}
						onChange={(v) => setFilterYear(v)}
					/>
				</div>
				<div className="w-56">
					<Label className="mb-1 block font-medium text-sm">
						{t("admin.classes.filters.semester", {
							defaultValue: "Semester",
						})}
					</Label>
					<SemesterSelect
						value={filterSemester}
						onChange={(v) => setFilterSemester(v)}
					/>
				</div>
			</div>

			<div className="card bg-base-100 shadow-xl">
				{exams?.length === 0 ? (
					<div className="card-body items-center py-12 text-center">
						<ClipboardList className="h-16 w-16 text-base-content/20" />
						<h2 className="mt-4 font-semibold text-foreground text-lg">
							{t("teacher.exams.empty.title")}
						</h2>
						<p className="text-base-content/60">
							{t("teacher.exams.empty.description")}
						</p>
						<button
							onClick={() => {
								setEditingExam(null);
								reset();
								setIsFormOpen(true);
							}}
							className="btn btn-primary mt-4"
						>
							<Plus className="mr-2 h-4 w-4" />
							{t("teacher.exams.actions.add")}
						</button>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="table">
							<thead>
								<tr>
									<th>{t("teacher.exams.table.name")}</th>
									<th>{t("teacher.exams.table.course")}</th>
									<th>{t("teacher.exams.table.class")}</th>
									<th>{t("teacher.exams.table.type")}</th>
									<th>{t("teacher.exams.table.date")}</th>
									<th>{t("teacher.exams.table.percentage")}</th>
									<th>{t("teacher.exams.table.status")}</th>
									<th>{t("common.table.actions")}</th>
								</tr>
							</thead>
							<tbody>
								{exams?.map((exam) => (
									<>
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
											<td>
												{t("teacher.exams.table.percentageValue", {
													value: exam.percentage,
												})}
											</td>
											<td>
												<ExamStatusBadge exam={exam} t={t} />
											</td>
											<td>
												<div className="flex gap-2">
													<button
														onClick={() => {
															setEditingExam(exam);
															reset({
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
														onClick={() => openDeleteModal(exam.id)}
														className="btn btn-square btn-sm btn-ghost text-error"
														disabled={exam.isLocked}
													>
														<Trash2 className="h-4 w-4" />
													</button>
												</div>
											</td>
										</tr>
										{exam.status === "rejected" && exam.rejectionReason && (
											<tr key={`${exam.id}-rejection`}>
												<td colSpan={8} className="pt-0 pb-2">
													<div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-800 text-sm">
														<XCircle className="mt-0.5 h-4 w-4 shrink-0" />
														<div>
															<span className="font-medium">
																{t("teacher.exams.rejection.label")}
															</span>{" "}
															{exam.rejectionReason}
														</div>
													</div>
												</td>
											</tr>
										)}
									</>
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
					reset();
				}}
				title={
					editingExam
						? t("teacher.exams.form.editTitle")
						: t("teacher.exams.form.createTitle")
				}
			>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					<div className="form-control">
						<label className="label">
							<span className="label-text">
								{t("teacher.exams.form.classCourseLabel")}
							</span>
						</label>
						<select
							{...register("classCourseId")}
							className="select select-bordered w-full"
						>
							<option value="">
								{t("teacher.exams.form.classCoursePlaceholder")}
							</option>
							{classCourses?.map((cc) => (
								<option key={cc.id} value={cc.id}>
									{courseMap.get(cc.course)} - {classMap.get(cc.class)}
								</option>
							))}
						</select>
						{errors.classCourseId && (
							<label className="label">
								<span className="label-text-alt text-error">
									{errors.classCourseId.message}
								</span>
							</label>
						)}
					</div>

					<div className="grid gap-4 sm:grid-cols-2">
						<div className="form-control">
							<label className="label">
								<span className="label-text">
									{t("teacher.exams.form.nameLabel")}
								</span>
							</label>
							<input
								type="text"
								{...register("name")}
								className="input input-bordered"
								placeholder={t("teacher.exams.form.namePlaceholder")}
							/>
							{errors.name && (
								<label className="label">
									<span className="label-text-alt text-error">
										{errors.name.message}
									</span>
								</label>
							)}
						</div>

						<div className="form-control">
							<label className="label">
								<span className="label-text">
									{t("teacher.exams.form.typeLabel")}
								</span>
							</label>
							<input
								type="text"
								{...register("type")}
								className="input input-bordered"
								placeholder={t("teacher.exams.form.typePlaceholder")}
							/>
							{errors.type && (
								<label className="label">
									<span className="label-text-alt text-error">
										{errors.type.message}
									</span>
								</label>
							)}
						</div>
					</div>

					<div className="grid gap-4 sm:grid-cols-2">
						<div className="form-control">
							<label className="label">
								<span className="label-text">
									{t("teacher.exams.form.dateLabel")}
								</span>
							</label>
							<Controller
								name="date"
								control={control}
								render={({ field }) => (
									<DatePicker
										value={field.value ?? ""}
										onChange={field.onChange}
									/>
								)}
							/>
							{errors.date && (
								<label className="label">
									<span className="label-text-alt text-error">
										{errors.date.message}
									</span>
								</label>
							)}
						</div>

						<div className="form-control">
							<label className="label">
								<span className="label-text">
									{t("teacher.exams.form.percentageLabel")}
								</span>
							</label>
							<input
								type="number"
								{...register("percentage", { valueAsNumber: true })}
								className="input input-bordered"
								placeholder={t("teacher.exams.form.percentagePlaceholder")}
							/>
							{errors.percentage && (
								<label className="label">
									<span className="label-text-alt text-error">
										{errors.percentage.message}
									</span>
								</label>
							)}
						</div>
					</div>

					<div className="modal-action">
						<button
							type="button"
							onClick={() => {
								setIsFormOpen(false);
								setEditingExam(null);
								reset();
							}}
							className="btn btn-ghost"
							disabled={isSubmitting}
						>
							{t("common.actions.cancel")}
						</button>
						<button
							type="submit"
							className="btn btn-primary"
							disabled={isSubmitting}
						>
							{isSubmitting ? (
								<span className="loading loading-spinner loading-sm" />
							) : editingExam ? (
								t("common.actions.saveChanges")
							) : (
								t("teacher.exams.form.submit")
							)}
						</button>
					</div>
				</form>
			</FormModal>

			<ConfirmModal
				isOpen={isDeleteOpen}
				onClose={() => {
					setIsDeleteOpen(false);
					setDeleteId(null);
				}}
				onConfirm={handleDelete}
				title={t("teacher.exams.delete.title")}
				message={t("teacher.exams.delete.message")}
				confirmText={t("common.actions.delete")}
				isLoading={deleteMutation.isPending}
			/>
		</div>
	);
}

type ExamRow = RouterOutputs["exams"]["list"]["items"][number];

function ExamStatusBadge({ exam, t }: { exam: ExamRow; t: TFunction }) {
	if (exam.isLocked) {
		return (
			<span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800 text-xs">
				<Clock className="h-3 w-3" />
				{t("teacher.exams.status.locked")}
			</span>
		);
	}
	if (exam.status === "approved") {
		return (
			<span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 font-medium text-green-800 text-xs">
				<CheckCircle2 className="h-3 w-3" />
				{t("teacher.exams.status.approved")}
			</span>
		);
	}
	if (exam.status === "rejected") {
		return (
			<span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 font-medium text-red-800 text-xs">
				<XCircle className="h-3 w-3" />
				{t("teacher.exams.status.rejected")}
			</span>
		);
	}
	if (exam.status === "submitted") {
		return (
			<span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 font-medium text-blue-800 text-xs">
				<AlertTriangle className="h-3 w-3" />
				{t("teacher.exams.status.submitted")}
			</span>
		);
	}
	return (
		<span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-600 text-xs">
			{t("teacher.exams.status.open")}
		</span>
	);
}
