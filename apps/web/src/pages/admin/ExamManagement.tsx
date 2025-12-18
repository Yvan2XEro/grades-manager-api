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
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../components/ui/card";
import { DialogFooter } from "../../components/ui/dialog";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../components/ui/select";
import { Spinner } from "../../components/ui/spinner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "../../components/ui/table";
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

	return (
		<div className="space-y-6 p-6">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div>
					<h1 className="font-semibold text-2xl">{t("admin.exams.title")}</h1>
					<p className="text-muted-foreground">{t("admin.exams.subtitle")}</p>
				</div>
				<Button
					onClick={() => {
						setEditingExam(null);
						form.reset();
						setIsFormOpen(true);
					}}
					data-testid="add-exam-button"
				>
					<Plus className="mr-2 h-5 w-5" />
					{t("admin.exams.actions.add")}
				</Button>
			</div>

			<Card>
				<CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<CardTitle>{t("admin.exams.title")}</CardTitle>
						<CardDescription>{t("admin.exams.subtitle")}</CardDescription>
					</div>
					<Button
						onClick={() => {
							setEditingExam(null);
							form.reset();
							setIsFormOpen(true);
						}}
						data-testid="add-exam-button-header"
					>
						<Plus className="mr-2 h-4 w-4" />
						{t("admin.exams.actions.add")}
					</Button>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="flex h-48 items-center justify-center">
							<Spinner className="h-8 w-8" />
						</div>
					) : !exams?.length ? (
						<Empty className="border border-dashed">
							<EmptyHeader>
								<EmptyMedia variant="icon">
									<ClipboardList className="h-8 w-8 text-muted-foreground" />
								</EmptyMedia>
								<EmptyTitle>{t("admin.exams.empty.title")}</EmptyTitle>
								<EmptyDescription>
									{t("admin.exams.empty.description")}
								</EmptyDescription>
							</EmptyHeader>
							<EmptyContent>
								<Button
									onClick={() => {
										setEditingExam(null);
										form.reset();
										setIsFormOpen(true);
									}}
									data-testid="add-exam-button-empty"
								>
									<Plus className="mr-2 h-4 w-4" />
									{t("admin.exams.actions.add")}
								</Button>
							</EmptyContent>
						</Empty>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>{t("admin.exams.table.name")}</TableHead>
										<TableHead>{t("admin.exams.table.course")}</TableHead>
										<TableHead>{t("admin.exams.table.class")}</TableHead>
										<TableHead>{t("admin.exams.table.type")}</TableHead>
										<TableHead>{t("admin.exams.table.date")}</TableHead>
										<TableHead>{t("admin.exams.table.percentage")}</TableHead>
										<TableHead>{t("admin.exams.table.status")}</TableHead>
										<TableHead className="text-right">
											{t("common.table.actions")}
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{exams?.map((exam) => (
										<TableRow key={exam.id}>
											<TableCell className="font-medium">{exam.name}</TableCell>
											<TableCell>
												{courseMap.get(
													classCourseMap.get(exam.classCourse)?.course || "",
												)}
											</TableCell>
											<TableCell>
												{classMap.get(
													classCourseMap.get(exam.classCourse)?.class || "",
												)}
											</TableCell>
											<TableCell>{exam.type}</TableCell>
											<TableCell>
												{format(new Date(exam.date), "MMM d, yyyy")}
											</TableCell>
											<TableCell>{exam.percentage}%</TableCell>
											<TableCell>
												<Badge
													variant={exam.isLocked ? "secondary" : "default"}
													className={
														exam.isLocked
															? "bg-amber-100 text-amber-900 hover:bg-amber-100 dark:bg-amber-400/20 dark:text-amber-100"
															: "bg-emerald-100 text-emerald-900 hover:bg-emerald-100 dark:bg-emerald-400/20 dark:text-emerald-100"
													}
												>
													{exam.isLocked
														? t("admin.exams.status.locked")
														: t("admin.exams.status.open")}
												</Badge>
											</TableCell>
											<TableCell className="text-right">
												<div className="flex justify-end gap-2">
													<Button
														type="button"
														size="icon-sm"
														variant="ghost"
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
														aria-label={t("admin.exams.form.editTitle")}
														disabled={exam.isLocked}
													>
														<Pencil className="h-4 w-4" />
													</Button>
													<Button
														type="button"
														size="icon-sm"
														variant="ghost"
														className="text-destructive hover:text-destructive"
														onClick={() => openDeleteModal(exam.id)}
														aria-label={t("admin.exams.delete.title")}
														disabled={exam.isLocked}
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>

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
											<SelectTrigger
												id="classCourseId"
												data-testid="class-course-select"
											>
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
											id="examType"
											data-testid="exam-type-select"
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
