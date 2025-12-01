import {
	AlertTriangle,
	ArrowLeft,
	Check,
	Info,
	Lock,
	Save,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
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
import { useStore } from "../../store";
import { trpcClient } from "../../utils/trpc";

type Student = {
	id: string;
	firstName: string;
	lastName: string;
	registrationNumber: string;
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
	const { user } = useStore();
	const navigate = useNavigate();
	const { t } = useTranslation();

	const [courseInfo, setCourseInfo] = useState<CourseInfo | null>(null);
	const [students, setStudents] = useState<Student[]>([]);
	const [exams, setExams] = useState<Exam[]>([]);
	const [selectedExam, setSelectedExam] = useState<string>("");
	const [grades, setGrades] = useState<Record<string, number>>({});
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [isExamLocked, setIsExamLocked] = useState(false);

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm();

	useEffect(() => {
		if (user && courseId) {
			fetchCourseData();
		}
	}, [user, courseId]);

	useEffect(() => {
		if (selectedExam) {
			fetchGrades(selectedExam);

			// Check if exam is locked
			const exam = exams.find((e) => e.id === selectedExam);
			setIsExamLocked(exam?.isLocked || false);

			// Reset form when exam changes
			reset();
		}
	}, [selectedExam, exams, reset]);

	const fetchCourseData = async () => {
		if (!user || !courseId) return;

		setIsLoading(true);
		try {
			const classCourse = await trpcClient.classCourses.getById.query({
				id: courseId,
			});
			const klass = await trpcClient.classes.getById.query({
				id: classCourse.class,
			});
			const [course, program, studentsRes, examsRes] = await Promise.all([
				trpcClient.courses.getById.query({ id: classCourse.course }),
				trpcClient.programs.getById.query({ id: klass.program }),
				trpcClient.students.list.query({ classId: klass.id }),
				trpcClient.exams.list.query({ classCourseId: courseId }),
			]);

			setCourseInfo({
				course_name: course.name,
				class_name: klass.name,
				program_name: program.name,
			});

			setStudents(studentsRes.items as Student[]);
			const examsList = examsRes.items.map((e) => ({
				id: e.id,
				name: e.name,
				type: e.type,
				date: e.date,
				percentage: Number(e.percentage),
				isLocked: e.isLocked,
			}));
			setExams(examsList);
			if (examsList.length > 0) setSelectedExam(examsList[0].id);
		} catch (error: any) {
			console.error("Error fetching course data:", error);
			toast.error(
				error.message || t("teacher.gradeEntry.toast.fetchCourseError"),
			);
		} finally {
			setIsLoading(false);
		}
	};

	const fetchGrades = async (examId: string) => {
		if (!examId) return;

		try {
			const { items } = await trpcClient.grades.listByExam.query({ examId });
			const gradesRecord: Record<string, number> = {};
			items.forEach((grade) => {
				gradesRecord[grade.student] = Number(grade.score);
			});
			setGrades(gradesRecord);

			const formData: Record<string, any> = {};
			items.forEach((grade) => {
				formData[`student_${grade.student}`] = Number(grade.score);
			});
			reset(formData);
		} catch (error: any) {
			console.error("Error fetching grades:", error);
			toast.error(
				error.message || t("teacher.gradeEntry.toast.fetchGradesError"),
			);
		}
	};

	const handleExamChange = (examId: string) => {
		setSelectedExam(examId);
		setGrades({});
	};

	const onSubmit = async (data: any) => {
		if (!selectedExam || isExamLocked) return;

		setIsSaving(true);
		try {
			// Transform form data into array of grade objects
			const gradesToUpsert: GradeInput[] = [];

			for (const studentId in data) {
				if (studentId.startsWith("student_")) {
					const actualStudentId = studentId.replace("student_", "");
					const score = Number.parseFloat(data[studentId]);

					if (!isNaN(score) && score >= 0 && score <= 20) {
						gradesToUpsert.push({
							studentId: actualStudentId,
							examId: selectedExam,
							score,
						});
					}
				}
			}

			// Upsert grades
			if (gradesToUpsert.length > 0) {
				await Promise.all(
					gradesToUpsert.map((g) => trpcClient.grades.upsertNote.mutate(g)),
				);
				toast.success(t("teacher.gradeEntry.toast.saveSuccess"));
				fetchGrades(selectedExam);
			}
		} catch (error: any) {
			console.error("Error saving grades:", error);
			toast.error(error.message || t("teacher.gradeEntry.toast.saveError"));
		} finally {
			setIsSaving(false);
		}
	};

	const lockExam = async () => {
		if (!selectedExam) return;

		try {
			await trpcClient.exams.lock.mutate({ examId: selectedExam, lock: true });
			setIsExamLocked(true);
			toast.success(t("teacher.gradeEntry.toast.lockSuccess"));
			setExams(
				exams.map((exam) =>
					exam.id === selectedExam ? { ...exam, isLocked: true } : exam,
				),
			);
		} catch (error: any) {
			console.error("Error locking exam:", error);
			toast.error(error.message || t("teacher.gradeEntry.toast.lockError"));
		}
	};

	if (isLoading) {
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
										onClick={lockExam}
										disabled={!selectedExam}
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

			{selectedExam && students.length > 0 ? (
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
									{students.map((student) => {
										const fieldError = (
											errors as Record<string, { message?: string } | undefined>
										)[`student_${student.id}`];
										return (
											<TableRow key={student.id}>
												<TableCell>{student.registrationNumber}</TableCell>
												<TableCell>
													{student.lastName}, {student.firstName}
												</TableCell>
												<TableCell>
													<div className="flex flex-col gap-1">
														<Input
															type="number"
															inputMode="decimal"
															min="0"
															max="20"
															step="0.25"
															className="w-28"
															defaultValue={grades[student.id] ?? ""}
															disabled={isExamLocked}
															{...register(`student_${student.id}`, {
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
															})}
														/>
														{fieldError ? (
															<p className="text-destructive text-xs">
																{fieldError.message}
															</p>
														) : null}
													</div>
												</TableCell>
												<TableCell>
													{grades[student.id] !== undefined ? (
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
								<Button type="submit" disabled={isSaving}>
									{isSaving ? (
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
