import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
	AlertTriangle,
	ArrowLeft,
	Check,
	Download,
	Lock,
	Save,
	Trash2,
	Upload,
	UserPlus,
	Users,
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
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
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
	canEdit?: boolean;
	sessionType?: "normal" | "retake";
	parentExamId?: string | null;
	scoringPolicy?: "replace" | "best_of";
};

type GradeInput = {
	studentId: string;
	examId: string;
	score: number;
};

type CourseInfo = {
	course_name: string;
	course_code: string;
	teaching_unit_name: string;
	teaching_unit_code: string;
	class_name: string;
	program_name: string;
};

type Delegate = {
	id: string;
	createdAt: string;
	editor: {
		id: string;
		firstName: string;
		lastName: string;
		primaryEmail: string | null;
	};
	grantedBy?: {
		id: string | null;
		firstName: string | null;
		lastName: string | null;
	} | null;
};

const GradeEntry: React.FC = () => {
	const { courseId: routeCourseId } = useParams<{ courseId?: string }>();
	const navigate = useNavigate();
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const { user } = useStore();

	const teacherProfileId = user?.domainProfiles?.[0]?.id;
	const viewerProfileId = teacherProfileId;
	const [selectedCourseId, setSelectedCourseId] = useState(routeCourseId ?? "");
	const autoSelectExamRef = useRef<boolean>(Boolean(routeCourseId));
	const manualCourseSelectionRef = useRef(false);
	const [selectedExam, setSelectedExam] = useState<string>("");
	const [isDelegateDialogOpen, setDelegateDialogOpen] = useState(false);
	const [selectedEditorProfileId, setSelectedEditorProfileId] = useState("");

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
			// Fetch teaching unit info
			const teachingUnit = await trpcClient.teachingUnits.getById.query({
				id: course.teachingUnitId,
			});
			return {
				courseInfo: {
					course_name: course.name,
					course_code: course.code,
					teaching_unit_name: teachingUnit.name,
					teaching_unit_code: teachingUnit.code,
					class_name: klass.name,
					program_name: program.name,
				} as CourseInfo,
				teacherId: classCourse.teacher ?? null,
			};
		},
		onError: (error: any) => {
			toast.error(
				error.message || t("teacher.gradeEntry.toast.fetchCourseError"),
			);
		},
	});

	const courseInfo = courseContextQuery.data?.courseInfo ?? null;
	const courseOwnerId = courseContextQuery.data?.teacherId ?? null;

	const canManageDelegates = useMemo(() => {
		const role = user?.role;
		if (!role) return false;
		if (["administrator", "dean", "super_admin", "owner"].includes(role)) {
			return true;
		}
		if (
			role === "teacher" &&
			courseOwnerId &&
			viewerProfileId &&
			courseOwnerId === viewerProfileId
		) {
			return true;
		}
		return false;
	}, [user?.role, courseOwnerId, viewerProfileId]);

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
					canEdit: e.canEdit ?? false,
					sessionType: (e as any).sessionType ?? "normal",
					parentExamId: (e as any).parentExamId ?? null,
					scoringPolicy: (e as any).scoringPolicy ?? "replace",
				}),
			);
		},
		onError: (error: any) => {
			toast.error(
				error.message || t("teacher.gradeEntry.toast.fetchCourseError"),
			);
		},
	});

	const exams = useMemo(() => examsQuery.data ?? [], [examsQuery.data]);

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
	const canEditExam = selectedExam
		? (selectedExamInfo?.canEdit ?? false)
		: false;
	const inputsDisabled = isExamLocked || !canEditExam;

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

	const delegateQuery = useQuery({
		queryKey: ["exam-grade-editors", selectedExam],
		enabled: Boolean(selectedExam),
		queryFn: async () => {
			if (!selectedExam) return [] as Delegate[];
			return trpcClient.examGradeEditors.list.query({
				examId: selectedExam,
			});
		},
	});
	const delegates = delegateQuery.data ?? [];

	const candidateUsersQuery = useQuery({
		queryKey: ["grade-editor-candidates"],
		enabled: canManageDelegates && isDelegateDialogOpen,
		queryFn: async () => {
			const { items } = await trpcClient.users.list.query({
				roles: ["administrator", "dean", "teacher", "staff"],
				limit: 100,
			});
			return items;
		},
	});

	const gradeEntries = useMemo(
		() => gradesQuery.data ?? [],
		[gradesQuery.data],
	);
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
		reset({});
		setSelectedExam(examId);
	};

	const submitGrades = handleSubmit((formValues) => {
		if (!selectedExam || inputsDisabled) {
			toast.error(
				t("teacher.gradeEntry.delegates.readOnlyToast", {
					defaultValue: "You cannot edit this exam.",
				}),
			);
			return;
		}
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
			await trpcClient.exams.lock.mutate({
				examId: selectedExam,
				lock: true,
			});
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

	const assignDelegateMutation = useMutation({
		mutationFn: async (editorProfileId: string) => {
			if (!selectedExam || !editorProfileId) {
				throw new Error("Missing exam or editor");
			}
			return trpcClient.examGradeEditors.assign.mutate({
				examId: selectedExam,
				editorProfileId,
			});
		},
		onSuccess: () => {
			toast.success(t("teacher.gradeEntry.delegates.assignSuccess"));
			setDelegateDialogOpen(false);
			setSelectedEditorProfileId("");
			delegateQuery.refetch();
		},
		onError: (error: any) => {
			toast.error(
				error.message || t("teacher.gradeEntry.delegates.assignError"),
			);
		},
	});

	const revokeDelegateMutation = useMutation({
		mutationFn: async (delegateId: string) => {
			if (!selectedExam) {
				throw new Error("Missing exam");
			}
			return trpcClient.examGradeEditors.revoke.mutate({
				id: delegateId,
				examId: selectedExam,
			});
		},
		onSuccess: () => {
			toast.success(t("teacher.gradeEntry.delegates.revokeSuccess"));
			delegateQuery.refetch();
		},
		onError: (error: any) => {
			toast.error(
				error.message || t("teacher.gradeEntry.delegates.revokeError"),
			);
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
		if (inputsDisabled || !selectedExam) {
			toast.error(
				t("teacher.gradeEntry.delegates.readOnlyToast", {
					defaultValue: "You cannot edit this exam.",
				}),
			);
			event.target.value = "";
			return;
		}

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
		<div className="space-y-4">
			{/* Compact Header */}
			<div className="flex items-center gap-3">
				<Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
					<ArrowLeft className="h-5 w-5" />
					<span className="sr-only">Back</span>
				</Button>
				<div className="min-w-0 flex-1">
					<h2 className="font-semibold text-foreground text-xl">
						{t("teacher.gradeEntry.title")}
					</h2>
					{courseInfo && (
						<p className="truncate text-muted-foreground text-sm">
							<span className="font-medium">
								{courseInfo.teaching_unit_code}
							</span>
							{" / "}
							<span className="font-medium">{courseInfo.course_code}</span>
							{" • "}
							{courseInfo.class_name}
						</p>
					)}
				</div>
			</div>

			{/* Selection Bar - Course & Exam side by side */}
			<Card>
				<CardContent className="py-4">
					<div className="flex flex-col gap-4 lg:flex-row lg:items-end">
						{/* Course Selector */}
						<div className="min-w-0 flex-1 space-y-1.5">
							<Label
								htmlFor="class-course"
								className="font-medium text-muted-foreground text-xs"
							>
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
									className="w-full"
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
						</div>

						{/* Exam Selector */}
						<div className="min-w-0 flex-1 space-y-1.5">
							<Label
								htmlFor="exam"
								className="font-medium text-muted-foreground text-xs"
							>
								{t("teacher.gradeEntry.selectExam.label")}
							</Label>
							<Select
								value={selectedExam || undefined}
								onValueChange={handleExamChange}
								disabled={exams.length === 0 || !courseId}
							>
								<SelectTrigger
									id="exam"
									data-testid="exam-select"
									className="w-full"
								>
									<SelectValue
										placeholder={t("teacher.gradeEntry.selectExam.empty")}
									/>
								</SelectTrigger>
								<SelectContent>
									{exams.map((exam) => (
										<SelectItem key={exam.id} value={exam.id}>
											{exam.name} ({exam.percentage}%)
											{exam.sessionType === "retake" && (
												<span className="ml-1 text-orange-600">
													[{t("teacher.exams.sessionType.retake")}]
												</span>
											)}
											{exam.isLocked && (
												<span className="ml-1 text-muted-foreground">
													({t("teacher.gradeEntry.selectExam.lockedTag")})
												</span>
											)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* Quick Actions */}
						{selectedExam && (
							<div className="flex flex-wrap items-center gap-2">
								{/* Status Badges */}
								{selectedExamInfo?.sessionType === "retake" && (
									<Badge
										variant="outline"
										className="border-orange-300 bg-orange-50 text-orange-700"
									>
										{t("teacher.exams.sessionType.retake")}
									</Badge>
								)}
								{isExamLocked && (
									<Badge variant="secondary" className="gap-1">
										<Lock className="h-3 w-3" />
										{t("teacher.gradeEntry.lockedChip")}
									</Badge>
								)}

								{/* Delegates Button */}
								{canManageDelegates && (
									<Dialog
										open={isDelegateDialogOpen}
										onOpenChange={(open) => {
											setDelegateDialogOpen(open);
											if (!open) setSelectedEditorProfileId("");
										}}
									>
										<DialogTrigger asChild>
											<Button variant="outline" size="sm">
												<Users className="mr-1.5 h-4 w-4" />
												{delegates.length > 0 && (
													<span className="mr-1">({delegates.length})</span>
												)}
												{t("teacher.gradeEntry.delegates.title")}
											</Button>
										</DialogTrigger>
										<DialogContent className="max-w-lg">
											<DialogHeader>
												<DialogTitle>
													{t("teacher.gradeEntry.delegates.title")}
												</DialogTitle>
												<DialogDescription>
													{t("teacher.gradeEntry.delegates.description")}
												</DialogDescription>
											</DialogHeader>

											{/* Existing Delegates */}
											{delegates.length > 0 && (
												<div className="max-h-48 space-y-2 overflow-y-auto">
													{delegates.map((delegate) => {
														const isSelfDelegate =
															Boolean(viewerProfileId) &&
															delegate.editor.id === viewerProfileId;
														const canRevokeThis =
															(canManageDelegates && canEditExam) ||
															Boolean(isSelfDelegate);
														return (
															<div
																key={delegate.id}
																className="flex items-center justify-between rounded-md border p-2"
															>
																<div className="min-w-0 flex-1">
																	<p className="truncate font-medium text-sm">
																		{delegate.editor.lastName},{" "}
																		{delegate.editor.firstName}
																	</p>
																	<p className="truncate text-muted-foreground text-xs">
																		{delegate.editor.primaryEmail}
																	</p>
																</div>
																{canRevokeThis && (
																	<Button
																		type="button"
																		variant="ghost"
																		size="sm"
																		onClick={() =>
																			revokeDelegateMutation.mutate(delegate.id)
																		}
																		disabled={revokeDelegateMutation.isPending}
																	>
																		<Trash2 className="h-4 w-4" />
																	</Button>
																)}
															</div>
														);
													})}
												</div>
											)}

											{/* Add New Delegate */}
											{canEditExam && (
												<div className="space-y-2 border-t pt-4">
													<Label>
														{t("teacher.gradeEntry.delegates.selectLabel")}
													</Label>
													<div className="flex gap-2">
														<Select
															value={selectedEditorProfileId || undefined}
															onValueChange={setSelectedEditorProfileId}
															disabled={candidateUsersQuery.isLoading}
														>
															<SelectTrigger className="flex-1">
																<SelectValue
																	placeholder={t(
																		"teacher.gradeEntry.delegates.selectPlaceholder",
																	)}
																/>
															</SelectTrigger>
															<SelectContent>
																{candidateUsersQuery.data?.map((user) => (
																	<SelectItem key={user.id} value={user.id}>
																		{user.firstName} {user.lastName}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
														<Button
															type="button"
															onClick={() =>
																assignDelegateMutation.mutate(
																	selectedEditorProfileId,
																)
															}
															disabled={
																!selectedEditorProfileId ||
																assignDelegateMutation.isPending
															}
														>
															<UserPlus className="h-4 w-4" />
														</Button>
													</div>
												</div>
											)}
										</DialogContent>
									</Dialog>
								)}
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Read-only Alert */}
			{selectedExam && !canEditExam && (
				<Alert variant="destructive">
					<AlertTriangle className="h-4 w-4" />
					<AlertTitle>{t("teacher.gradeEntry.readOnly.title")}</AlertTitle>
					<AlertDescription>
						{t("teacher.gradeEntry.readOnly.description")}
					</AlertDescription>
				</Alert>
			)}

			{/* Main Grade Entry Table */}
			{selectedExam && rosterStudents.length > 0 ? (
				<Card>
					<form onSubmit={submitGrades} className="flex flex-col">
						{/* Toolbar */}
						<div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
							<div className="flex items-center gap-2 text-muted-foreground text-sm">
								<span>
									{rosterStudents.length}{" "}
									{t("teacher.gradeEntry.table.student").toLowerCase()}s
								</span>
								{Object.keys(gradesByStudent).length > 0 && (
									<Badge variant="secondary" className="text-xs">
										{Object.keys(gradesByStudent).length} /{" "}
										{rosterStudents.length}
									</Badge>
								)}
							</div>
							<div className="flex items-center gap-2">
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={handleExportTemplate}
									disabled={inputsDisabled}
								>
									<Download className="mr-1.5 h-4 w-4" />
									{t("teacher.gradeEntry.actions.exportTemplate")}
								</Button>
								<div>
									<input
										type="file"
										id="import-grades"
										accept=".xlsx,.xls"
										className="hidden"
										onChange={handleImportGrades}
										disabled={inputsDisabled}
									/>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() =>
											document.getElementById("import-grades")?.click()
										}
										disabled={inputsDisabled}
									>
										<Upload className="mr-1.5 h-4 w-4" />
										{t("teacher.gradeEntry.actions.importGrades")}
									</Button>
								</div>
								{!isExamLocked && canEditExam && (
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() => lockExamMutation.mutate()}
										disabled={lockExamMutation.isPending}
									>
										<Lock className="mr-1.5 h-4 w-4" />
										{t("teacher.gradeEntry.actions.lock")}
									</Button>
								)}
							</div>
						</div>

						{/* Table */}
						<CardContent className="px-0">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="w-36">
											{t("teacher.gradeEntry.table.registration")}
										</TableHead>
										<TableHead>
											{t("teacher.gradeEntry.table.student")}
										</TableHead>
										<TableHead className="w-32">
											{t("teacher.gradeEntry.table.score")}
										</TableHead>
										<TableHead className="w-28">
											{t("teacher.gradeEntry.table.status")}
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{rosterStudents.map((student) => {
										const fieldName = `student_${student.id}` as const;
										const fieldError = errors[fieldName]?.message;
										const hasGrade = gradesByStudent[student.id] !== undefined;
										return (
											<TableRow key={student.id}>
												<TableCell className="font-mono text-sm">
													{student.registrationNumber}
												</TableCell>
												<TableCell>
													<span className="font-medium">
														{student.lastName}
													</span>
													, {student.firstName}
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
															className="h-9 w-24"
															disabled={inputsDisabled}
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
														{fieldError && (
															<p className="text-destructive text-xs">
																{fieldError}
															</p>
														)}
													</div>
												</TableCell>
												<TableCell>
													{hasGrade ? (
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

						{/* Footer with Save */}
						{!inputsDisabled && (
							<CardFooter className="justify-end gap-2 border-t bg-muted/30">
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
			) : !courseId ? (
				<Card className="text-center">
					<CardContent className="py-12">
						<p className="text-muted-foreground">
							{availableClassCourses.length === 0
								? t("teacher.gradeEntry.selectCourse.emptyState")
								: t("teacher.gradeEntry.selectCourse.empty")}
						</p>
					</CardContent>
				</Card>
			) : (
				<Card className="text-center">
					<CardContent className="py-12">
						<p className="text-muted-foreground">
							{t("teacher.gradeEntry.selectExam.prompt")}
						</p>
					</CardContent>
				</Card>
			)}
		</div>
	);
};

export default GradeEntry;
type GradeFormState = Record<string, number | undefined>;
