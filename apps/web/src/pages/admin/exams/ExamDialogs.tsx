import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { createCallable } from "react-call";
import { useMutationFlow } from "react-call/mutation-flow";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import {
	CallableDialog,
	DIALOG_EXIT_MS,
} from "@/components/callable/callable-dialog";
import { QuickCreate } from "@/components/callable/quick-create";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { upsertInList } from "@/lib/query-cache";
import { toast } from "@/lib/toast";
import {
	CLASSES_KEY,
	ClassCourseFormDialog,
	COURSES_KEY,
	fetchClassOptions,
	fetchCourseOptions,
} from "@/pages/admin/class-courses/ClassCourseDialogs";
import { trpc, trpcClient } from "@/utils/trpc";

type ClassCourseOption = { id: string; class: string; course: string };

/** Query keys of the lists feeding the exam form (shared with ExamManagement). */
export const examFormKeys = {
	classCourses: ["classCourses"],
	classes: CLASSES_KEY,
	courses: COURSES_KEY,
} as const;

export const fetchExamClassCourses = async () =>
	(await trpcClient.classCourses.list.query({})).items as ClassCourseOption[];

export interface ExamFormValuesIn {
	id: string;
	name: string;
	type: string;
	date: string;
	percentage: number;
	classCourse: string;
}

/**
 * Creates or edits an exam. A missing class-course assignment can be created
 * in place from the "+", which itself lets you create the class or course.
 */
export const ExamFormDialog = createCallable<
	{ exam?: ExamFormValuesIn },
	boolean
>(({ call, exam }) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	const schema = useMemo(
		() =>
			z.object({
				name: z.string().min(2, t("admin.exams.validation.name")),
				type: z.string().min(2, t("admin.exams.validation.type")),
				date: z.string().min(1, t("admin.exams.validation.date")),
				percentage: z
					.number()
					.min(1, t("admin.exams.validation.percentage.min"))
					.max(100, t("admin.exams.validation.percentage.max")),
				classCourseId: z.string({
					error: t("admin.exams.validation.classCourse"),
				}),
			}),
		[t],
	);
	type ExamFormData = z.infer<typeof schema>;

	const form = useForm<ExamFormData>({
		resolver: zodResolver(schema),
		defaultValues: exam
			? {
					name: exam.name,
					type: exam.type,
					date: exam.date.split("T")[0],
					percentage: exam.percentage,
					classCourseId: exam.classCourse,
				}
			: undefined,
	});

	const { data: classCourses = [] } = useQuery({
		queryKey: examFormKeys.classCourses,
		queryFn: fetchExamClassCourses,
	});
	const { data: classes = [] } = useQuery({
		queryKey: examFormKeys.classes,
		queryFn: fetchClassOptions,
	});
	const { data: courses = [] } = useQuery({
		queryKey: examFormKeys.courses,
		queryFn: fetchCourseOptions,
	});
	const classMap = new Map(classes.map((c) => [c.id, c.name]));
	const courseMap = new Map(courses.map((c) => [c.id, c.name]));

	const createClassCourse = async () => {
		const created = await ClassCourseFormDialog.call({
			existingCodes: [],
		});
		if (!created) return;
		// The labels come from the class and course lists: refresh them too
		await Promise.all([
			queryClient.invalidateQueries({ queryKey: examFormKeys.classes }),
			queryClient.invalidateQueries({ queryKey: examFormKeys.courses }),
		]);
		queryClient.setQueryData<ClassCourseOption[]>(
			examFormKeys.classCourses,
			(old) =>
				upsertInList(old ?? [], {
					id: created.id,
					class: created.class,
					course: created.course,
				}),
		);
		form.setValue("classCourseId", created.id, { shouldValidate: true });
	};

	const submit = useMutationFlow(call, async (call, data: ExamFormData) => {
		try {
			if (exam) {
				await trpcClient.exams.update.mutate({
					id: exam.id,
					...data,
					date: new Date(data.date),
				});
				toast.success(t("admin.exams.toast.updateSuccess"));
			} else {
				await trpcClient.exams.create.mutate({
					...data,
					date: new Date(data.date),
				});
				toast.success(t("admin.exams.toast.createSuccess"));
			}
			queryClient.invalidateQueries({
				queryKey: trpc.exams.listPaged.queryKey(),
			});
			call.end(true);
		} catch (error) {
			const message =
				error instanceof Error && error.message
					? error.message
					: exam
						? t("admin.exams.toast.updateError")
						: t("admin.exams.toast.createError");
			toast.error(message);
		}
	});

	return (
		<CallableDialog
			call={call}
			dismissValue={false}
			preventDismiss={submit.pending}
			title={
				exam
					? t("admin.exams.form.editTitle")
					: t("admin.exams.form.createTitle")
			}
		>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(submit)} className="space-y-4">
					<FormField
						control={form.control}
						name="classCourseId"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("admin.exams.form.courseLabel")}</FormLabel>
								<QuickCreate
									onCreate={createClassCourse}
									label={t("admin.classCourses.form.createTitle")}
								>
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
											{classCourses.map((cc) => (
												<SelectItem key={cc.id} value={cc.id}>
													{courseMap.get(cc.course)} - {classMap.get(cc.class)}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</QuickCreate>
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
									<DatePicker
										value={field.value ?? ""}
										onChange={field.onChange}
									/>
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

					<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
						<Button
							type="button"
							variant="outline"
							disabled={submit.pending}
							onClick={() => call.end(false)}
						>
							{t("common.actions.cancel")}
						</Button>
						<Button type="submit" disabled={submit.pending}>
							{submit.pending ? (
								<Spinner className="mr-2 h-4 w-4" />
							) : exam ? (
								t("common.actions.saveChanges")
							) : (
								t("admin.exams.form.submit")
							)}
						</Button>
					</div>
				</form>
			</Form>
		</CallableDialog>
	);
}, DIALOG_EXIT_MS);

/** Creates a retake session of an approved exam; resolves `true` once created. */
export const RetakeExamDialog = createCallable<
	{
		parentExam: {
			id: string;
			name: string;
			courseName?: string | null;
			className?: string | null;
		};
	},
	boolean
>(({ call, parentExam }) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	const schema = useMemo(
		() =>
			z.object({
				name: z.string().optional(),
				date: z.string().min(1, t("admin.exams.validation.date")),
				scoringPolicy: z.enum(["replace", "best_of"]).default("replace"),
			}),
		[t],
	);
	type RetakeFormInput = z.input<typeof schema>;
	type RetakeFormData = z.output<typeof schema>;

	const form = useForm<RetakeFormInput, unknown, RetakeFormData>({
		resolver: zodResolver(schema),
		defaultValues: {
			name: `${parentExam.name} - ${t("retakes.badge.retake")}`,
			date: "",
			scoringPolicy: "replace",
		},
	});

	const submit = useMutationFlow(call, async (call, data: RetakeFormData) => {
		try {
			await trpcClient.exams.createRetake.mutate({
				parentExamId: parentExam.id,
				name: data.name || undefined,
				date: new Date(data.date),
				scoringPolicy: data.scoringPolicy,
			});
			queryClient.invalidateQueries({
				queryKey: trpc.exams.listPaged.queryKey(),
			});
			toast.success(t("admin.exams.toast.retakeSuccess"));
			call.end(true);
		} catch (error) {
			const message =
				error instanceof Error && error.message
					? error.message
					: t("admin.exams.toast.retakeError");
			toast.error(message);
		}
	});

	return (
		<CallableDialog
			call={call}
			dismissValue={false}
			preventDismiss={submit.pending}
			title={t("retakes.form.title")}
		>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(submit)} className="space-y-4">
					<div className="rounded-md border bg-muted/50 p-4">
						<p className="text-muted-foreground text-xs">
							{t("retakes.form.parentExamLabel")}
						</p>
						<p className="font-medium">{parentExam.name}</p>
						<p className="text-muted-foreground text-xs">
							{parentExam.courseName} - {parentExam.className}
						</p>
					</div>

					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("retakes.form.nameLabel")}</FormLabel>
								<FormControl>
									<Input
										{...field}
										placeholder={`${parentExam.name} - ${t("retakes.badge.retake")}`}
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
								<FormLabel>{t("retakes.form.dateLabel")}</FormLabel>
								<FormControl>
									<DatePicker
										value={field.value ?? ""}
										onChange={field.onChange}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="scoringPolicy"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("retakes.form.scoringPolicyLabel")}</FormLabel>
								<Select onValueChange={field.onChange} value={field.value}>
									<FormControl>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										<SelectItem value="replace">
											{t("retakes.scoringPolicy.replace")}
										</SelectItem>
										<SelectItem value="best_of">
											{t("retakes.scoringPolicy.best_of")}
										</SelectItem>
									</SelectContent>
								</Select>
								<p className="text-muted-foreground text-xs">
									{field.value === "replace"
										? t("retakes.scoringPolicy.replaceDescription")
										: t("retakes.scoringPolicy.best_ofDescription")}
								</p>
								<FormMessage />
							</FormItem>
						)}
					/>

					<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
						<Button
							type="button"
							variant="outline"
							disabled={submit.pending}
							onClick={() => call.end(false)}
						>
							{t("common.actions.cancel")}
						</Button>
						<Button type="submit" disabled={submit.pending}>
							{submit.pending ? (
								<Spinner className="mr-2 h-4 w-4" />
							) : (
								t("retakes.form.submit")
							)}
						</Button>
					</div>
				</form>
			</Form>
		</CallableDialog>
	);
}, DIALOG_EXIT_MS);

/** Rejects a submitted exam with a mandatory reason; resolves `true` once rejected. */
export const RejectExamDialog = createCallable<
	{ examId: string; description?: string; successMessage?: string },
	boolean
>(({ call, examId, description, successMessage }) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [reason, setReason] = useState("");

	const reject = useMutationFlow(call, async (call) => {
		try {
			await trpcClient.exams.validate.mutate({
				examId,
				status: "rejected",
				rejectionReason: reason.trim(),
			});
			queryClient.invalidateQueries({
				queryKey: trpc.exams.listPaged.queryKey(),
			});
			toast.success(successMessage ?? t("admin.exams.toast.rejectSuccess"));
			call.end(true);
		} catch (error) {
			const message =
				error instanceof Error && error.message
					? error.message
					: t("admin.exams.toast.validateError");
			toast.error(message);
		}
	});

	return (
		<CallableDialog
			call={call}
			dismissValue={false}
			preventDismiss={reject.pending}
			className="sm:max-w-md"
			title={t("admin.exams.actions.reject")}
		>
			<div className="space-y-3 py-2">
				{description && (
					<p className="text-muted-foreground text-sm">{description}</p>
				)}
				<Label htmlFor="reject-reason">
					{t("admin.exams.rejectReasonLabel")}
				</Label>
				<Textarea
					id="reject-reason"
					rows={3}
					placeholder={t("admin.exams.rejectReasonPlaceholder")}
					value={reason}
					onChange={(e) => setReason(e.target.value)}
				/>
			</div>
			<div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
				<Button
					variant="outline"
					disabled={reject.pending}
					onClick={() => call.end(false)}
				>
					{t("common.cancel")}
				</Button>
				<Button
					variant="destructive"
					disabled={!reason.trim() || reject.pending}
					onClick={() => reject()}
				>
					{t("admin.exams.actions.reject")}
				</Button>
			</div>
		</CallableDialog>
	);
}, DIALOG_EXIT_MS);
