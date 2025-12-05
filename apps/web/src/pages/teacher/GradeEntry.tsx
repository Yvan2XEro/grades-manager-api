import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	AlertTriangle,
	ArrowLeft,
	Check,
	Info,
	Lock,
	Save,
} from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { trpcClient } from "../../utils/trpc";

type Student = {
	id: string;
	firstName: string;
	lastName: string;
	registrationNumber: string;
	status?: string;
};

type Exam = {
	id: string;
	name: string;
	type: string;
	date: string;
	percentage: number;
	isLocked: boolean;
};

type GradeInput = {
	studentId: string;
	examId: string;
	score: number;
};

type CourseInfo = {
	course_name: string;
	class_name: string;
	program_name: string;
};

const GradeEntry: React.FC = () => {
	const { courseId } = useParams<{ courseId: string }>();
	const navigate = useNavigate();
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	const [selectedExam, setSelectedExam] = useState<string>("");

	type GradeFormValues = { grades: Record<string, string> };

	const {
		control,
		handleSubmit,
		reset,
		watch,
		formState: { errors },
	} = useForm<GradeFormValues>({
		defaultValues: { grades: {} },
		shouldUnregister: true,
	});

	const courseContextQuery = useQuery({
		queryKey: ["grade-entry-context", courseId],
		enabled: Boolean(courseId),
		queryFn: async () => {
			if (!courseId) {
				throw new Error("Missing class course id");
			}
			const classCourse = await trpcClient.classCourses.getById.query({
				id: courseId,
			});
			const klass = await trpcClient.classes.getById.query({
				id: classCourse.class,
			});
			const [course, program] = await Promise.all([
				trpcClient.courses.getById.query({ id: classCourse.course }),
				trpcClient.programs.getById.query({ id: klass.program }),
			]);
			return {
				courseInfo: {
					course_name: course.name,
					class_name: klass.name,
					program_name: program.name,
				} as CourseInfo,
			};
		},
		onError: (error: any) => {
			toast.error(
				error.message || t("teacher.gradeEntry.toast.fetchCourseError"),
			);
		},
	});

	const courseInfo = courseContextQuery.data?.courseInfo ?? null;

	const rosterQuery = useQuery({
		queryKey: ["class-course-roster", courseId],
		enabled: Boolean(courseId),
		queryFn: async () => {
			if (!courseId) return [] as Student[];
			const { students } = await trpcClient.classCourses.roster.query({
				id: courseId,
			});
			return students as Student[];
		},
		onError: (error: any) => {
			toast.error(
				error.message || t("teacher.gradeEntry.toast.fetchCourseError"),
			);
		},
	});

	const examsQuery = useQuery({
		queryKey: ["class-course-exams", courseId],
		enabled: Boolean(courseId),
		queryFn: async () => {
			if (!courseId) return [] as Exam[];
			const { items } = await trpcClient.exams.list.query({
				classCourseId: courseId,
			});
			return items.map(
				(e): Exam => ({
					id: e.id,
					name: e.name,
					type: e.type,
					date: e.date,
					percentage: Number(e.percentage),
					isLocked: e.isLocked,
				}),
			);
		},
		onError: (error: any) => {
			toast.error(
				error.message || t("teacher.gradeEntry.toast.fetchCourseError"),
			);
		},
	});

	const exams = examsQuery.data ?? [];

	useEffect(() => {
		if (!exams.length) {
			setSelectedExam("");
			return;
		}
		if (!selectedExam) {
			setSelectedExam(exams[0].id);
			return;
		}
		if (!exams.some((exam) => exam.id === selectedExam)) {
			setSelectedExam(exams[0].id);
		}
	}, [exams, selectedExam]);

	const selectedExamInfo = useMemo(
		() => exams.find((exam) => exam.id === selectedExam),
		[exams, selectedExam],
	);
	const isExamLocked = selectedExamInfo?.isLocked ?? false;

	const gradesQuery = useQuery({
		queryKey: ["exam-grades", selectedExam],
		enabled: Boolean(selectedExam),
		queryFn: async () => {
			const response = await trpcClient.grades.listByExam.query({
				examId: selectedExam!,
			});
			return response.items;
		},
		onError: (error: any) => {
			toast.error(
				error.message || t("teacher.gradeEntry.toast.fetchGradesError"),
			);
		},
	});

	const gradeEntries = gradesQuery.data ?? [];

	useEffect(() => {
		if (!selectedExam) {
			reset({ grades: {} });
			return;
		}
		if (gradesQuery.isFetching) {
			reset({ grades: {} });
			return;
		}
		const defaults: Record<string, string> = {};
		gradeEntries.forEach((grade) => {
			defaults[grade.student] = Number(grade.score).toString();
		});
		reset({ grades: defaults });
	}, [selectedExam, gradeEntries, gradesQuery.isFetching, reset]);

	const rosterStudents = rosterQuery.data ?? [];

	const handleExamChange = (examId: string) => {
		setSelectedExam(examId);
	};

	const onSubmit = async (data: any) => {
		if (!selectedExam || isExamLocked) return;
		const gradesToUpsert: GradeInput[] = [];

		Object.entries(data.grades ?? {}).forEach(([studentId, rawScore]) => {
			const score = Number.parseFloat(rawScore);
			if (!Number.isNaN(score) && score >= 0 && score <= 20) {
				gradesToUpsert.push({
					studentId,
					examId: selectedExam,
					score,
				});
			}
		});

		if (gradesToUpsert.length === 0) return;
		saveGrades.mutate(gradesToUpsert);
	};

	const saveGrades = useMutation({
		mutationFn: async (payload: GradeInput[]) => {
			await Promise.all(
				payload.map((grade) => trpcClient.grades.upsertNote.mutate(grade)),
			);
		},
		onSuccess: () => {
			toast.success(t("teacher.gradeEntry.toast.saveSuccess"));
			if (selectedExam) {
				queryClient.invalidateQueries({
					queryKey: ["exam-grades", selectedExam],
				});
			}
		},
		onError: (error: any) => {
			toast.error(error.message || t("teacher.gradeEntry.toast.saveError"));
		},
	});

	const lockExamMutation = useMutation({
		mutationFn: async () => {
			if (!selectedExam) return;
			await trpcClient.exams.lock.mutate({ examId: selectedExam, lock: true });
		},
		onSuccess: () => {
			toast.success(t("teacher.gradeEntry.toast.lockSuccess"));
			if (courseId) {
				queryClient.invalidateQueries({
					queryKey: ["class-course-exams", courseId],
				});
			}
		},
		onError: (error: any) => {
			toast.error(error.message || t("teacher.gradeEntry.toast.lockError"));
		},
	});

	const isInitialLoading =
		courseContextQuery.isLoading ||
		rosterQuery.isLoading ||
		examsQuery.isLoading;

	if (isInitialLoading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<Spinner className="h-10 w-10 text-primary" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
					<ArrowLeft className="h-5 w-5" />
					<span className="sr-only">Back</span>
				</Button>
				<div>
					<h2 className="font-bold text-2xl text-foreground">
						{t("teacher.gradeEntry.title")}
					</h2>
					{courseInfo && (
						<p className="text-muted-foreground text-sm">
							{courseInfo.course_name} • {courseInfo.class_name} •{" "}
							{courseInfo.program_name}
						</p>
					)}
				</div>
			</div>

			<Card>
				<CardContent className="space-y-4">
					<div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
						<div className="w-full space-y-2 md:max-w-sm">
							<Label htmlFor="exam">
								{t("teacher.gradeEntry.selectExam.label")}
							</Label>
							<Select
								value={selectedExam || undefined}
								onValueChange={handleExamChange}
								disabled={exams.length === 0}
							>
								<SelectTrigger id="exam">
									<SelectValue
										placeholder={t("teacher.gradeEntry.selectExam.empty")}
									/>
								</SelectTrigger>
								<SelectContent>
									{exams.map((exam) => (
										<SelectItem key={exam.id} value={exam.id}>
											{exam.name} ({exam.percentage}%){" "}
											{exam.isLocked
												? `(${t("teacher.gradeEntry.selectExam.lockedTag")})`
												: ""}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						{selectedExam && (
							<div className="flex items-center gap-3">
								{isExamLocked ? (
									<Badge
										variant="secondary"
										className="flex items-center gap-2"
									>
										<Lock className="h-4 w-4" />
										{t("teacher.gradeEntry.lockedChip")}
									</Badge>
								) : (
									<Button
										type="button"
										variant="outline"
										onClick={() => lockExamMutation.mutate()}
										disabled={!selectedExam || lockExamMutation.isPending}
									>
										<Lock className="mr-2 h-4 w-4" />
										{t("teacher.gradeEntry.actions.lock")}
									</Button>
								)}
							</div>
						)}
					</div>

					{selectedExam && exams.length > 0 && (
						<Alert>
							<Info className="h-4 w-4" />
							<AlertTitle>{t("teacher.gradeEntry.info.title")}</AlertTitle>
							<AlertDescription>
								{t("teacher.gradeEntry.info.description")}
							</AlertDescription>
						</Alert>
					)}
				</CardContent>
			</Card>

			{selectedExam && rosterStudents.length > 0 ? (
				<Card>
					<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
						<CardContent className="px-0">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>
											{t("teacher.gradeEntry.table.registration")}
										</TableHead>
										<TableHead>
											{t("teacher.gradeEntry.table.student")}
										</TableHead>
										<TableHead>{t("teacher.gradeEntry.table.score")}</TableHead>
										<TableHead>
											{t("teacher.gradeEntry.table.status")}
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{rosterStudents.map((student) => {
										const fieldError =
											errors.grades?.[student.id]?.message;
										return (
											<TableRow key={student.id}>
												<TableCell>{student.registrationNumber}</TableCell>
												<TableCell>
													{student.lastName}, {student.firstName}
												</TableCell>
												<TableCell>
													<div className="flex flex-col gap-1">
														<Controller
															control={control}
															name={`grades.${student.id}`}
															rules={{
																min: {
																	value: 0,
																	message: t(
																		"teacher.gradeEntry.validation.min",
																	),
																},
																max: {
																	value: 20,
																	message: t(
																		"teacher.gradeEntry.validation.max",
																	),
																},
															}}
															render={({ field }) => (
																<Input
																	key={`${selectedExam}-${student.id}`}
																	type="number"
																	inputMode="decimal"
																	min="0"
																	max="20"
																	step="0.25"
																	className="w-28"
																	disabled={isExamLocked}
																	{...field}
																	value={field.value ?? ""}
																/>
															)}
														/>
														{fieldError ? (
															<p className="text-destructive text-xs">
																{fieldError.message}
															</p>
														) : null}
													</div>
												</TableCell>
												<TableCell>
				{watch(`grades.${student.id}`)?.toString().length ? (
														<Badge variant="secondary" className="gap-1">
															<Check className="h-3 w-3" />
															{t("teacher.gradeEntry.status.graded")}
														</Badge>
													) : (
														<Badge variant="outline">
															{t("teacher.gradeEntry.status.notGraded")}
														</Badge>
													)}
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</CardContent>
						{!isExamLocked && (
							<CardFooter className="justify-end gap-2 border-t">
								<Button
									type="submit"
									disabled={saveGrades.isPending || lockExamMutation.isPending}
								>
									{saveGrades.isPending ? (
										<>
											<Spinner className="mr-2 h-4 w-4 text-white" />
											{t("teacher.gradeEntry.actions.saving")}
										</>
									) : (
										<>
											<Save className="mr-2 h-4 w-4" />
											{t("teacher.gradeEntry.actions.save")}
										</>
									)}
								</Button>
							</CardFooter>
						)}
					</form>
				</Card>
			) : selectedExam ? (
				<Card className="text-center">
					<CardContent className="py-12">
						<AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />
						<p className="mt-4 font-medium text-foreground text-lg">
							{t("teacher.gradeEntry.emptyStudents.title")}
						</p>
						<p className="text-muted-foreground text-sm">
							{t("teacher.gradeEntry.emptyStudents.description")}
						</p>
					</CardContent>
				</Card>
			) : null}
		</div>
	);
};

export default GradeEntry;
