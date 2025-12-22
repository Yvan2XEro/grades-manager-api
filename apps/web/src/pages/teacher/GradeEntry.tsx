import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	AlertTriangle,
	ArrowLeft,
	Check,
	Download,
	Info,
	Lock,
	Save,
	Upload,
} from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import * as XLSX from "xlsx";
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
import { useStore } from "../../store";
import { trpc, trpcClient } from "../../utils/trpc";

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
	const { courseId: routeCourseId } = useParams<{ courseId?: string }>();
	const navigate = useNavigate();
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const { user } = useStore();

	const teacherProfileId = user?.domainProfiles?.[0]?.id;
	const [selectedCourseId, setSelectedCourseId] = useState(routeCourseId ?? "");
	const autoSelectExamRef = useRef<boolean>(Boolean(routeCourseId));
	const manualCourseSelectionRef = useRef(false);
	const [selectedExam, setSelectedExam] = useState<string>("");

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm({ shouldUnregister: true });

	const classCoursesQuery = useQuery({
		...trpc.classCourses.list.queryOptions({
			teacherId: teacherProfileId ?? undefined,
			limit: 200,
		}),
	});
	const availableClassCourses = classCoursesQuery.data?.items ?? [];

	useEffect(() => {
		if (routeCourseId && !manualCourseSelectionRef.current) {
			autoSelectExamRef.current = true;
			setSelectedCourseId(routeCourseId);
		}
		if (manualCourseSelectionRef.current) {
			manualCourseSelectionRef.current = false;
		}
	}, [routeCourseId]);

	const handleCourseChange = (value: string) => {
		manualCourseSelectionRef.current = true;
		autoSelectExamRef.current = false;
		setSelectedCourseId(value);
		setSelectedExam("");
		if (value) {
			navigate(`/teacher/grades/${value}`, { replace: true });
		} else {
			navigate("/teacher/grades", { replace: true });
		}
	};

	const courseId = selectedCourseId;

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
			if (autoSelectExamRef.current) {
				setSelectedExam(exams[0].id);
			}
			return;
		}
		if (!exams.some((exam) => exam.id === selectedExam)) {
			if (autoSelectExamRef.current) {
				setSelectedExam(exams[0].id);
			} else {
				setSelectedExam("");
			}
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
	const gradesByStudent = useMemo(() => {
		const map: Record<
			string,
			{
				score: number;
				id: string;
			}
		> = {};
		gradeEntries.forEach((grade) => {
			map[grade.student] = {
				score: Number(grade.score),
				id: grade.id,
			};
		});
		return map;
	}, [gradeEntries]);

	useEffect(() => {
		if (!selectedExam || gradesQuery.isFetching) {
			reset({});
			return;
		}
		const defaults: Record<string, number> = {};
		gradeEntries.forEach((grade) => {
			defaults[`student_${grade.student}`] = Number(grade.score);
		});
		reset(defaults);
	}, [selectedExam, gradeEntries, gradesQuery.isFetching, reset]);

	const rosterStudents = rosterQuery.data ?? [];

	const handleExamChange = (examId: string) => {
		setSelectedExam(examId);
	};

	const submitGrades = handleSubmit((formValues) => {
		if (!selectedExam || isExamLocked) return;
		const values = formValues as Record<string, string | number | undefined>;
		const gradesToUpsert: GradeInput[] = [];
		const gradesToDelete: string[] = [];

		Object.entries(values).forEach(([field, rawValue]) => {
			if (!field.startsWith("student_")) return;
			const studentId = field.replace("student_", "");
			if (rawValue === "" || rawValue === undefined || rawValue === null) {
				const existing = gradesByStudent[studentId];
				if (existing?.id) {
					gradesToDelete.push(existing.id);
				}
				return;
			}
			const score = Number(rawValue);
			if (!Number.isNaN(score) && score >= 0 && score <= 20) {
				gradesToUpsert.push({
					studentId,
					examId: selectedExam,
					score,
				});
			}
		});

		Object.entries(gradesByStudent).forEach(([studentId, entry]) => {
			const fieldName = `student_${studentId}`;
			if (!(fieldName in values) && entry?.id) {
				gradesToDelete.push(entry.id);
			}
		});

		if (!gradesToUpsert.length && !gradesToDelete.length) return;
		saveGrades.mutate({ inserts: gradesToUpsert, deletes: gradesToDelete });
	});

	const saveGrades = useMutation({
		mutationFn: async (payload: {
			inserts: GradeInput[];
			deletes: string[];
		}) => {
			await Promise.all([
				...payload.inserts.map((grade) =>
					trpcClient.grades.upsertNote.mutate(grade),
				),
				...payload.deletes.map((id) =>
					trpcClient.grades.deleteNote.mutate({ id }),
				),
			]);
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
		classCoursesQuery.isLoading ||
		(Boolean(courseId) &&
			(courseContextQuery.isLoading ||
				rosterQuery.isLoading ||
				examsQuery.isLoading));

	const handleExportTemplate = () => {
		if (!selectedExamInfo || !rosterStudents.length) {
			toast.error(
				t("teacher.gradeEntry.toast.exportError", {
					defaultValue: "Please select an exam with students",
				}),
			);
			return;
		}

		const data = rosterStudents.map((student) => ({
			"Registration Number": student.registrationNumber || "",
			"First Name": student.firstName,
			"Last Name": student.lastName,
			Score: gradesByStudent[student.id]?.score ?? "",
		}));

		const worksheet = XLSX.utils.json_to_sheet(data);
		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, worksheet, "Grades");

		const fileName = `${courseInfo?.course_name || "grades"}_${selectedExamInfo.name}_${new Date().toISOString().split("T")[0]}.xlsx`;
		XLSX.writeFile(workbook, fileName);

		toast.success(
			t("teacher.gradeEntry.toast.exportSuccess", {
				defaultValue: "Template exported successfully",
			}),
		);
	};

	const handleImportGrades = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const data = new Uint8Array(e.target?.result as ArrayBuffer);
				const workbook = XLSX.read(data, { type: "array" });
				const worksheet = workbook.Sheets[workbook.SheetNames[0]];
				const jsonData = XLSX.utils.sheet_to_json(worksheet) as Array<{
					"Registration Number": string;
					"First Name": string;
					"Last Name": string;
					Score: number | string;
				}>;

				const updates: Record<string, number> = {};
				let importedCount = 0;

				jsonData.forEach((row) => {
					const student = rosterStudents.find(
						(s) =>
							s.registrationNumber === row["Registration Number"] ||
							(s.firstName === row["First Name"] &&
								s.lastName === row["Last Name"]),
					);

					if (student && row.Score !== "" && row.Score !== null) {
						const score = Number(row.Score);
						if (!Number.isNaN(score) && score >= 0 && score <= 20) {
							updates[`student_${student.id}`] = score;
							importedCount++;
						}
					}
				});

				reset(updates);
				toast.success(
					t("teacher.gradeEntry.toast.importSuccess", {
						defaultValue: "Imported {{count}} grades successfully",
						count: importedCount,
					}),
				);
			} catch (error) {
				toast.error(
					t("teacher.gradeEntry.toast.importError", {
						defaultValue: "Failed to import grades",
					}),
				);
			}
		};

		reader.readAsArrayBuffer(file);
		event.target.value = "";
	};

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
				<CardContent className="space-y-3">
					<div className="space-y-2">
						<Label htmlFor="class-course">
							{t("teacher.gradeEntry.selectCourse.label")}
						</Label>
						<Select
							value={courseId || undefined}
							onValueChange={handleCourseChange}
							disabled={availableClassCourses.length === 0}
						>
							<SelectTrigger
								id="class-course"
								data-testid="class-course-select"
							>
								<SelectValue
									placeholder={t("teacher.gradeEntry.selectCourse.empty")}
								/>
							</SelectTrigger>
							<SelectContent>
								{availableClassCourses.map((cc) => (
									<SelectItem key={cc.id} value={cc.id}>
										{cc.courseName ?? cc.course} • {cc.code}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{availableClassCourses.length === 0 &&
						!classCoursesQuery.isLoading ? (
							<p className="text-muted-foreground text-sm">
								{t("teacher.gradeEntry.selectCourse.emptyState")}
							</p>
						) : null}
					</div>
				</CardContent>
			</Card>

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
								<SelectTrigger id="exam" data-testid="exam-select">
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

					{selectedExam && rosterStudents.length > 0 && (
						<div className="flex flex-wrap items-center gap-3">
							<Button
								type="button"
								variant="outline"
								onClick={handleExportTemplate}
								disabled={!selectedExam || !rosterStudents.length}
							>
								<Download className="mr-2 h-4 w-4" />
								{t("teacher.gradeEntry.actions.exportTemplate", {
									defaultValue: "Export Template",
								})}
							</Button>
							<div>
								<input
									type="file"
									id="import-grades"
									accept=".xlsx,.xls"
									className="hidden"
									onChange={handleImportGrades}
									disabled={isExamLocked}
								/>
								<Button
									type="button"
									variant="outline"
									onClick={() =>
										document.getElementById("import-grades")?.click()
									}
									disabled={!selectedExam || isExamLocked}
								>
									<Upload className="mr-2 h-4 w-4" />
									{t("teacher.gradeEntry.actions.importGrades", {
										defaultValue: "Import Grades",
									})}
								</Button>
							</div>
						</div>
					)}

					{selectedExam && exams.length > 0 && (
						<Alert>
							<Info className="h-4 w-4" />
							<AlertTitle>{t("teacher.gradeEntry.info.title")}</AlertTitle>
							<AlertDescription>
								{t("teacher.gradeEntry.info.description")}
							</AlertDescription>
						</Alert>
					)}

					{courseId && !selectedExam && (
						<p className="text-muted-foreground text-sm">
							{t("teacher.gradeEntry.selectExam.prompt")}
						</p>
					)}
				</CardContent>
			</Card>

			{selectedExam && rosterStudents.length > 0 ? (
				<Card>
					<form onSubmit={submitGrades} className="flex flex-col">
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
										const fieldName = `student_${student.id}` as const;
										const fieldError = errors[fieldName]?.message;
										return (
											<TableRow key={student.id}>
												<TableCell>{student.registrationNumber}</TableCell>
												<TableCell>
													{student.lastName}, {student.firstName}
												</TableCell>
												<TableCell>
													<div className="flex flex-col gap-1">
														<Input
															key={`${selectedExam}-${student.id}`}
															type="number"
															inputMode="decimal"
															min="0"
															max="20"
															step="0.25"
															className="w-28"
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
																{fieldError}
															</p>
														) : null}
													</div>
												</TableCell>
												<TableCell>
													{gradesByStudent[student.id] !== undefined ? (
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
type GradeFormState = Record<string, number | undefined>;
