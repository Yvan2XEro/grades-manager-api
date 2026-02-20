import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import {
	AlertTriangle,
	BookOpen,
	Layers,
	Pencil,
	Plus,
	Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useCursorPagination } from "@/hooks/useCursorPagination";
import { useRowSelection } from "@/hooks/useRowSelection";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { BulkActionBar } from "@/components/ui/bulk-action-bar";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";
import { CodedEntitySelect } from "@/components/forms";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { ClipboardCopy } from "@/components/ui/clipboard-copy";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import { SemesterSelect } from "@/components/inputs/SemesterSelect";
import { Label } from "@/components/ui/label";
import { generateClassCourseCode } from "@/lib/code-generator";
import type { RouterOutputs } from "@/utils/trpc";
import { trpcClient } from "@/utils/trpc";

const buildClassCourseSchema = (t: TFunction) =>
	z
		.object({
			class: z.string({
				required_error: t("admin.classCourses.validation.class"),
			}),
			course: z.string({
				required_error: t("admin.classCourses.validation.course"),
			}),
			teacher: z.string({
				required_error: t("admin.classCourses.validation.teacher"),
			}),
		})
		.extend({
			code: z.string().min(
				3,
				t("admin.classCourses.validation.code", {
					defaultValue: "Code is required",
				}),
			),
			semesterId: z.string().optional(),
			coefficient: z.coerce.number().positive().default(1),
		});

type ClassCourseFormData = z.infer<ReturnType<typeof buildClassCourseSchema>>;

interface ClassCourse {
	id: string;
	code: string;
	class: string;
	course: string;
	teacher: string;
	semesterId: string | null;
	courseName?: string | null;
	courseCode?: string | null;
	coefficient: number;
}

interface Class {
	id: string;
	name: string;
	code: string;
	program: string;
	programCode?: string | null;
	academicYearName?: string;
	semesterId?: string | null;
	semesterCode?: string | null;
	cycleLevelCode?: string | null;
}

interface Program {
	id: string;
	name: string;
	code?: string | null;
}

interface Course {
	id: string;
	name: string;
	code: string;
}

type Teacher = RouterOutputs["users"]["list"]["items"][number];

export default function ClassCourseManagement() {
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const [editingClassCourse, setEditingClassCourse] =
		useState<ClassCourse | null>(null);
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const [filterYear, setFilterYear] = useState<string | null>(null);
	const [filterSemester, setFilterSemester] = useState<string | null>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: reset cursor when filters change
	useEffect(() => { pagination.reset(); }, [filterYear, filterSemester]);
	const [classSearch, setClassSearch] = useState("");
	const [courseSearch, setCourseSearch] = useState("");

	// UE bulk assignment state
	const [isUeAssignOpen, setIsUeAssignOpen] = useState(false);
	const [ueAssignClassId, setUeAssignClassId] = useState<string>("");
	const [ueAssignUeId, setUeAssignUeId] = useState<string>("");
	const [ueAssignClassSearch, setUeAssignClassSearch] = useState("");
	const [skippedCourses, setSkippedCourses] = useState<string[]>([]);

	const queryClient = useQueryClient();
	const { t } = useTranslation();
	const classCourseSchema = useMemo(() => buildClassCourseSchema(t), [t]);
	const pagination = useCursorPagination({ pageSize: 20 });

	const { data: defaultClasses = [] } = useQuery({
		queryKey: ["classes"],
		queryFn: async () => {
			const { items } = await trpcClient.classes.list.query({
				limit: 100,
			});
			return items.map(
				(cls) =>
					({
						id: cls.id,
						name: cls.name,
						code: cls.code,
						program: cls.program,
						programCode: cls.programInfo?.code ?? null,
						cycleLevelCode: cls.cycleLevel?.code ?? null,
						academicYearName: cls.academicYearInfo?.name ?? "",
						semesterId: cls.semester?.id ?? null,
						semesterCode: cls.semester?.code ?? null,
					}) as Class,
			);
		},
	});

	const { data: searchClasses = [] } = useQuery({
		queryKey: ["classes", "search", classSearch],
		queryFn: async () => {
			const items = await trpcClient.classes.search.query({
				query: classSearch,
			});
			return items.map(
				(cls) =>
					({
						id: cls.id,
						name: cls.name,
						code: cls.code,
						program: cls.program,
						programCode: cls.programInfo?.code ?? null,
						cycleLevelCode: cls.cycleLevel?.code ?? null,
						academicYearName: cls.academicYearInfo?.name ?? "",
						semesterId: cls.semester?.id ?? null,
						semesterCode: cls.semester?.code ?? null,
					}) as Class,
			);
		},
		enabled: classSearch.length >= 2,
	});

	const classes = classSearch.length >= 2 ? searchClasses : defaultClasses;

	const { data: programs } = useQuery({
		queryKey: ["programs"],
		queryFn: async () => {
			const { items } = await trpcClient.programs.list.query({});
			return items.map(
				(program) =>
					({
						id: program.id,
						name: program.name,
						code: program.code,
					}) as Program,
			);
		},
	});

	const { data: defaultCourses = [] } = useQuery({
		queryKey: ["courses"],
		queryFn: async () => {
			const { items } = await trpcClient.courses.list.query({
				limit: 100,
			});
			return items.map(
				(course) =>
					({
						id: course.id,
						name: course.name,
						code: course.code,
					}) as Course,
			);
		},
	});

	const { data: searchCourses = [] } = useQuery({
		queryKey: ["courses", "search", courseSearch],
		queryFn: async () => {
			const items = await trpcClient.courses.search.query({
				query: courseSearch,
			});
			return items.map(
				(course) =>
					({
						id: course.id,
						name: course.name,
						code: course.code,
					}) as Course,
			);
		},
		enabled: courseSearch.length >= 2,
	});

	const courses = courseSearch.length >= 2 ? searchCourses : defaultCourses;

	const { data: teachers } = useQuery({
		queryKey: ["teachers"],
		queryFn: async () => {
			const { items } = await trpcClient.users.list.query({
				role: "teacher",
				limit: 100,
			});
			return items;
		},
	});

	const { data: classCoursesData, isLoading } = useQuery({
		queryKey: ["classCourses", pagination.cursor, pagination.pageSize, filterYear, filterSemester],
		queryFn: async () => {
			const { items, nextCursor } = await trpcClient.classCourses.list.query({
				cursor: pagination.cursor,
				limit: pagination.pageSize,
				...(filterYear ? { academicYearId: filterYear } : {}),
				...(filterSemester ? { semesterId: filterSemester } : {}),
			});
			return {
				items: items.map(
					(cc) =>
						({
							id: cc.id,
							code: cc.code,
							class: cc.class,
							course: cc.course,
							teacher: cc.teacher,
							semesterId: cc.semesterId ?? null,
							courseName: cc.courseName,
							courseCode: cc.courseCode,
							coefficient: cc.coefficient ?? 1,
						}) as ClassCourse,
				),
				nextCursor,
			};
		},
	});
	const classCourses = classCoursesData?.items;

	const { data: semestersData } = useQuery({
		queryKey: ["semesters"],
		queryFn: () => trpcClient.semesters.list.query(),
	});
	const semesters = semestersData?.items;

	// Query for UE assignment: search classes
	const { data: ueAssignSearchClasses = [] } = useQuery({
		queryKey: ["classes", "search", ueAssignClassSearch],
		queryFn: async () => {
			const items = await trpcClient.classes.search.query({
				query: ueAssignClassSearch,
			});
			return items.map((cls) => ({
				id: cls.id,
				name: cls.name,
				code: cls.code,
				program: cls.program,
				programCode: cls.programInfo?.code ?? null,
				cycleLevelCode: cls.cycleLevel?.code ?? null,
				academicYearName: cls.academicYearInfo?.name ?? "",
				semesterId: cls.semester?.id ?? null,
				semesterCode: cls.semester?.code ?? null,
			})) as Class[];
		},
		enabled: ueAssignClassSearch.length >= 2,
	});
	const ueAssignClasses =
		ueAssignClassSearch.length >= 2 ? ueAssignSearchClasses : defaultClasses;

	// Get selected class for UE assignment
	const ueAssignSelectedClass = useMemo(
		() => ueAssignClasses.find((c) => c.id === ueAssignClassId),
		[ueAssignClasses, ueAssignClassId],
	);

	// Query for teaching units filtered by class's program
	const { data: teachingUnits = [] } = useQuery({
		queryKey: ["teachingUnits", ueAssignSelectedClass?.program],
		queryFn: async () => {
			if (!ueAssignSelectedClass?.program) return [];
			const { items } = await trpcClient.teachingUnits.list.query({
				programId: ueAssignSelectedClass.program,
			});
			return items;
		},
		enabled: Boolean(ueAssignSelectedClass?.program),
	});

	const form = useForm<ClassCourseFormData>({
		resolver: zodResolver(classCourseSchema),
		defaultValues: {
			class: "",
			course: "",
			teacher: "",
			code: "",
			semesterId: "",
			coefficient: 1,
		},
	});
	const { watch } = form;
	const selectedClassId = watch("class");
	const selectedCourseId = watch("course");
	const selectedSemesterId = watch("semesterId");
	const codeValue = watch("code");
	const selectedSemester = useMemo(
		() => semesters?.find((semester) => semester.id === selectedSemesterId),
		[semesters, selectedSemesterId],
	);

	const formatTeacherName = (teacher: Teacher) =>
		[teacher.firstName, teacher.lastName].filter(Boolean).join(" ") ||
		teacher.email;

	const teacherOptions = teachers ?? [];

	const classMap = new Map((classes ?? []).map((c) => [c.id, c]));
	const programMap = new Map((programs ?? []).map((p) => [p.id, p]));
	const courseMap = new Map((courses ?? []).map((c) => [c.id, c]));
	const teacherMap = new Map(
		teacherOptions.map((teacher) => [teacher.id, formatTeacherName(teacher)]),
	);
	const selectedClass = selectedClassId
		? classMap.get(selectedClassId)
		: undefined;
	const selectedCourse = selectedCourseId
		? courseMap.get(selectedCourseId)
		: undefined;
	const classCourseCodes = useMemo(
		() => (classCourses ?? []).map((cc) => cc.code).filter(Boolean),
		[classCourses],
	);
	const semesterDirty = Boolean(form.formState.dirtyFields.semesterId);
	useEffect(() => {
		if (editingClassCourse) return;
		if (semesterDirty) return;
		if (selectedClass?.semesterId) {
			form.setValue("semesterId", selectedClass.semesterId, {
				shouldDirty: false,
			});
			return;
		}
		if (!selectedSemesterId && semesters && semesters.length > 0) {
			form.setValue("semesterId", semesters[0].id, {
				shouldDirty: false,
			});
		}
	}, [
		editingClassCourse,
		form,
		selectedClass?.semesterId,
		selectedSemesterId,
		semesters,
		semesterDirty,
	]);

	const codeDirty = Boolean(form.formState.dirtyFields.code);
	useEffect(() => {
		if (editingClassCourse) return;
		if (codeDirty) return;
		const programCode =
			selectedClass?.programCode ??
			programMap.get(selectedClass?.program ?? "")?.code;
		if (!programCode) return;
		const suggestion = generateClassCourseCode({
			programCode,
			levelCode: selectedClass?.cycleLevelCode,
			semesterCode: selectedSemester?.code ?? selectedClass?.semesterCode,
			existingCodes: classCourseCodes,
		});
		if (suggestion && codeValue !== suggestion) {
			form.setValue("code", suggestion, { shouldDirty: false });
		}
	}, [
		classCourseCodes,
		codeDirty,
		codeValue,
		editingClassCourse,
		form,
		programMap,
		selectedClass?.cycleLevelCode,
		selectedClass?.program,
		selectedClass?.programCode,
		selectedClass?.semesterCode,
		selectedSemester?.code,
	]);

	// Preselect default teacher when course changes
	const teacherDirty = Boolean(form.formState.dirtyFields.teacher);
	useEffect(() => {
		if (editingClassCourse) return;
		if (teacherDirty) return;
		if (!selectedCourseId) return;

		// Fetch course details to get default teacher
		trpcClient.courses.getById
			.query({ id: selectedCourseId })
			.then((courseDetails) => {
				if (courseDetails.defaultTeacher) {
					form.setValue("teacher", courseDetails.defaultTeacher, {
						shouldDirty: false,
					});
				}
			})
			.catch(() => {
				// Ignore errors, teacher field will remain empty
			});
	}, [editingClassCourse, form, selectedCourseId, teacherDirty]);

	const activeClassIds = new Set((classes ?? []).map((c) => c.id));
	const displayedClassCourses = (classCourses ?? []).filter((cc) =>
		activeClassIds.has(cc.class),
	);

	const selection = useRowSelection(displayedClassCourses);

	const bulkDeleteMutation = useMutation({
		mutationFn: async (ids: string[]) => {
			await Promise.all(ids.map((id) => trpcClient.classCourses.delete.mutate({ id })));
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["classCourses"] });
			selection.clear();
			toast.success(t("common.bulkActions.deleteSuccess", { defaultValue: "Items deleted successfully" }));
		},
		onError: () => toast.error(t("common.bulkActions.deleteError", { defaultValue: "Failed to delete items" })),
	});

	const createMutation = useMutation({
		mutationFn: async (data: ClassCourseFormData) => {
			await trpcClient.classCourses.create.mutate(data);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["classCourses"] });
			toast.success(t("admin.classCourses.toast.createSuccess"));
			handleCloseForm();
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error && error.message
					? error.message
					: t("admin.classCourses.toast.createError");
			toast.error(message);
		},
	});

	const updateMutation = useMutation({
		mutationFn: async (data: ClassCourseFormData & { id: string }) => {
			const { id, ...updateData } = data;
			await trpcClient.classCourses.update.mutate({ id, ...updateData });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["classCourses"] });
			toast.success(t("admin.classCourses.toast.updateSuccess"));
			handleCloseForm();
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error && error.message
					? error.message
					: t("admin.classCourses.toast.updateError");
			toast.error(message);
		},
	});

	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			await trpcClient.classCourses.delete.mutate({ id });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["classCourses"] });
			toast.success(t("admin.classCourses.toast.deleteSuccess"));
			setIsDeleteOpen(false);
			setDeleteId(null);
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error && error.message
					? error.message
					: t("admin.classCourses.toast.deleteError");
			toast.error(message);
		},
	});

	// Bulk UE assignment mutation
	const bulkAssignMutation = useMutation({
		mutationFn: async ({
			classId,
			teachingUnitId,
		}: {
			classId: string;
			teachingUnitId: string;
		}) => {
			// Fetch all courses for this teaching unit
			const { items: courses } = await trpcClient.courses.list.query({
				teachingUnitId,
				limit: 200,
			});

			const selectedClass = ueAssignClasses.find((c) => c.id === classId);
			if (!selectedClass) throw new Error("Class not found");

			// Get existing class-course codes for uniqueness
			const existingCodes = (classCourses ?? []).map((cc) => cc.code);

			const skipped: string[] = [];
			const toCreate: Array<{
				code: string;
				class: string;
				course: string;
				teacher: string;
				coefficient: number;
				semesterId?: string;
			}> = [];

			for (const course of courses) {
				if (!course.defaultTeacher) {
					skipped.push(course.name);
					continue;
				}

				// Generate a unique code
				const programCode =
					selectedClass.programCode ??
					programs?.find((p) => p.id === selectedClass.program)?.code;
				const code = generateClassCourseCode({
					programCode: programCode ?? "PRG",
					levelCode: selectedClass.cycleLevelCode,
					semesterCode: selectedClass.semesterCode,
					existingCodes: [...existingCodes, ...toCreate.map((c) => c.code)],
				});

				toCreate.push({
					code,
					class: classId,
					course: course.id,
					teacher: course.defaultTeacher,
					coefficient: Number(course.defaultCoefficient) || 1,
					semesterId: selectedClass.semesterId ?? undefined,
				});
			}

			// Create all assignments
			for (const data of toCreate) {
				await trpcClient.classCourses.create.mutate(data);
			}

			return { created: toCreate.length, skipped };
		},
		onSuccess: ({ created, skipped }) => {
			queryClient.invalidateQueries({ queryKey: ["classCourses"] });
			if (created > 0) {
				toast.success(
					t("admin.classCourses.toast.bulkAssignSuccess", {
						defaultValue: "{{count}} cours assignés avec succès",
						count: created,
					}),
				);
			}
			if (skipped.length > 0) {
				setSkippedCourses(skipped);
			} else {
				handleCloseUeAssign();
			}
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error && error.message
					? error.message
					: t("admin.classCourses.toast.bulkAssignError", {
							defaultValue: "Erreur lors de l'assignation",
						});
			toast.error(message);
		},
	});

	const handleCloseUeAssign = () => {
		setIsUeAssignOpen(false);
		setUeAssignClassId("");
		setUeAssignUeId("");
		setUeAssignClassSearch("");
		setSkippedCourses([]);
	};

	const handleBulkAssign = () => {
		if (!ueAssignClassId || !ueAssignUeId) return;
		bulkAssignMutation.mutate({
			classId: ueAssignClassId,
			teachingUnitId: ueAssignUeId,
		});
	};

	const onSubmit = (data: ClassCourseFormData) => {
		if (editingClassCourse) {
			updateMutation.mutate({ ...data, id: editingClassCourse.id });
		} else {
			createMutation.mutate(data);
		}
	};

	const startCreate = () => {
		setEditingClassCourse(null);
		form.reset({
			class: "",
			course: "",
			teacher: "",
			code: "",
			semesterId: "",
			coefficient: 1,
		});
		setIsFormOpen(true);
	};

	const startEdit = (classCourse: ClassCourse) => {
		setEditingClassCourse(classCourse);
		form.reset({
			class: classCourse.class,
			course: classCourse.course,
			teacher: classCourse.teacher,
			code: classCourse.code,
			semesterId: classCourse.semesterId ?? "",
			coefficient: classCourse.coefficient,
		});
		setIsFormOpen(true);
	};

	const handleCloseForm = () => {
		setIsFormOpen(false);
		setEditingClassCourse(null);
		form.reset({
			class: "",
			course: "",
			teacher: "",
			code: "",
			semesterId: "",
			coefficient: 1,
		});
	};

	const confirmDelete = (id: string) => {
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
				<Spinner className="h-8 w-8" />
			</div>
		);
	}

	return (
		<div className="space-y-6 p-6">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div>
					<h1 className="font-semibold text-2xl">
						{t("admin.classCourses.title")}
					</h1>
					<p className="text-muted-foreground">
						{t("admin.classCourses.subtitle")}
					</p>
				</div>
				<div className="flex gap-2">
					<Button variant="outline" onClick={() => setIsUeAssignOpen(true)}>
						<Layers className="mr-2 h-4 w-4" />
						{t("admin.classCourses.actions.assignUe", {
							defaultValue: "Assigner un UE",
						})}
					</Button>
					<Button onClick={startCreate}>
						<Plus className="mr-2 h-4 w-4" />
						{t("admin.classCourses.actions.assign")}
					</Button>
				</div>
			</div>

			<div className="flex flex-wrap items-end gap-4">
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

			<BulkActionBar selectedCount={selection.selectedCount} onClear={selection.clear}>
				<Button
					variant="destructive"
					size="sm"
					onClick={() => bulkDeleteMutation.mutate([...selection.selectedIds])}
					disabled={bulkDeleteMutation.isPending}
				>
					<Trash2 className="mr-1.5 h-3.5 w-3.5" />
					{t("common.actions.delete")}
				</Button>
			</BulkActionBar>

			<Card>
				<CardHeader>
					<CardTitle>{t("admin.classCourses.title")}</CardTitle>
					<CardDescription>{t("admin.classCourses.subtitle")}</CardDescription>
				</CardHeader>
				<CardContent>
					{displayedClassCourses.length > 0 ? (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="w-10">
										<Checkbox
											checked={selection.isAllSelected}
											onCheckedChange={(checked) => selection.toggleAll(!!checked)}
											aria-label="Select all"
										/>
									</TableHead>
									<TableHead>
										{t("admin.classCourses.table.code", {
											defaultValue: "Code",
										})}
									</TableHead>
									<TableHead>{t("admin.classCourses.table.class")}</TableHead>
									<TableHead>{t("admin.classCourses.table.program")}</TableHead>
									<TableHead>{t("admin.classCourses.table.course")}</TableHead>
									<TableHead>
										{t("admin.classCourses.table.semester", {
											defaultValue: "Semester",
										})}
									</TableHead>
									<TableHead>{t("admin.classCourses.table.teacher")}</TableHead>
									<TableHead className="text-right">
										{t("common.table.actions")}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{displayedClassCourses.map((classCourse) => (
									<TableRow key={classCourse.id}>
										<TableCell>
											<Checkbox
												checked={selection.isSelected(classCourse.id)}
												onCheckedChange={() => selection.toggle(classCourse.id)}
												aria-label={`Select ${classCourse.code}`}
											/>
										</TableCell>
										<TableCell>
											<ClipboardCopy
												value={classCourse.code}
												label={t("admin.classCourses.table.code", {
													defaultValue: "Code",
												})}
											/>
										</TableCell>
										<TableCell className="font-medium">
											{classMap.get(classCourse.class)?.name}
										</TableCell>
										<TableCell>
											{programMap.get(
												classMap.get(classCourse.class)?.program ?? "",
											)?.name ??
												t("common.labels.notAvailable", {
													defaultValue: "N/A",
												})}
										</TableCell>
										<TableCell>
											{(() => {
												const info = courseMap.get(classCourse.course);
												if (!info) {
													return t("common.labels.notAvailable", {
														defaultValue: "N/A",
													});
												}
												return (
													<div className="space-y-0.5">
														<p className="font-medium text-sm">{info.name}</p>
														{info.code && (
															<p className="text-muted-foreground text-xs">
																{info.code}
															</p>
														)}
													</div>
												);
											})()}
										</TableCell>
										<TableCell>
											{(() => {
												const semester = semesters?.find(
													(item) => item.id === classCourse.semesterId,
												);
												if (!semester) {
													return t("common.labels.notAvailable", {
														defaultValue: "N/A",
													});
												}
												return `${semester.name} (${semester.code})`;
											})()}
										</TableCell>
										<TableCell>{teacherMap.get(classCourse.teacher)}</TableCell>
										<TableCell>
											<div className="flex justify-end gap-2">
												<Button
													variant="ghost"
													size="icon-sm"
													onClick={() => startEdit(classCourse)}
													aria-label={t("admin.classCourses.form.editTitle")}
												>
													<Pencil className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon-sm"
													className="text-destructive hover:text-destructive"
													onClick={() => confirmDelete(classCourse.id)}
													aria-label={t("admin.classCourses.delete.title")}
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					) : (
						<div className="py-12 text-center">
							<BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
							<p className="mt-4 font-medium">
								{t("admin.classCourses.empty.title")}
							</p>
							<p className="text-muted-foreground text-sm">
								{t("admin.classCourses.empty.description")}
							</p>
							<Button className="mt-4" onClick={startCreate}>
								<Plus className="mr-2 h-4 w-4" />
								{t("admin.classCourses.actions.assign")}
							</Button>
						</div>
					)}
				</CardContent>
			</Card>

			<PaginationBar
				hasPrev={pagination.hasPrev}
				hasNext={!!classCoursesData?.nextCursor}
				onPrev={pagination.handlePrev}
				onNext={() => pagination.handleNext(classCoursesData?.nextCursor)}
				isLoading={isLoading}
			/>

			<Dialog
				open={isFormOpen}
				onOpenChange={(open) => {
					setIsFormOpen(open);
					if (!open) handleCloseForm();
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{editingClassCourse
								? t("admin.classCourses.form.editTitle")
								: t("admin.classCourses.form.createTitle")}
						</DialogTitle>
					</DialogHeader>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
							<CodedEntitySelect
								items={classes}
								onSearch={setClassSearch}
								value={
									classes.find((c) => c.id === form.watch("class"))?.code ||
									null
								}
								onChange={(code) => {
									const cls = classes.find((c) => c.code === code);
									form.setValue("class", cls?.id || "");
								}}
								label={t("admin.classCourses.form.classLabel")}
								placeholder={t("admin.classCourses.form.classPlaceholder")}
								error={form.formState.errors.class?.message}
								searchMode="hybrid"
								getItemSubtitle={(cls) =>
									programMap.get(cls.program)?.name ??
									t("common.labels.notAvailable", {
										defaultValue: "N/A",
									})
								}
								required
							/>

							<CodedEntitySelect
								items={courses}
								onSearch={setCourseSearch}
								value={
									courses.find((c) => c.id === form.watch("course"))?.code ||
									null
								}
								onChange={(code) => {
									const course = courses.find((c) => c.code === code);
									form.setValue("course", course?.id || "");
								}}
								label={t("admin.classCourses.form.courseLabel")}
								placeholder={t("admin.classCourses.form.coursePlaceholder")}
								error={form.formState.errors.course?.message}
								searchMode="hybrid"
								required
							/>

							<FormField
								control={form.control}
								name="teacher"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("admin.classCourses.form.teacherLabel")}
										</FormLabel>
										<Select value={field.value} onValueChange={field.onChange}>
											<FormControl>
												<SelectTrigger>
													<SelectValue
														placeholder={t(
															"admin.classCourses.form.teacherPlaceholder",
														)}
													/>
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{teacherOptions.map((teacher) => (
													<SelectItem key={teacher.id} value={teacher.id}>
														{formatTeacherName(teacher)}
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
								name="semesterId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("admin.classCourses.form.semesterLabel", {
												defaultValue: "Semester",
											})}
										</FormLabel>
										<Select
											value={field.value}
											onValueChange={field.onChange}
											disabled={!semesters || semesters.length === 0}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue
														placeholder={t(
															"admin.classCourses.form.semesterPlaceholder",
															{
																defaultValue: "Select semester",
															},
														)}
													/>
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{semesters?.map((semester) => (
													<SelectItem key={semester.id} value={semester.id}>
														{semester.name} ({semester.code})
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
								name="code"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("admin.classCourses.form.codeLabel", {
												defaultValue: "Code",
											})}
										</FormLabel>
										<FormControl>
											<Input
												{...field}
												placeholder={t(
													"admin.classCourses.form.codePlaceholder",
													{
														defaultValue: "INF11-CLS24-01",
													},
												)}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="coefficient"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("admin.classCourses.form.coefficientLabel", {
												defaultValue: "Coefficient",
											})}
										</FormLabel>
										<FormControl>
											<Input
												{...field}
												type="number"
												step="0.01"
												min="0.01"
												placeholder={t(
													"admin.classCourses.form.coefficientPlaceholder",
													{
														defaultValue: "1.00",
													},
												)}
											/>
										</FormControl>
										<p className="text-muted-foreground text-xs">
											{t("admin.classCourses.form.coefficientHelp", {
												defaultValue:
													"Poids pour le calcul de la moyenne pondérée dans l'UE",
											})}
										</p>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
								<Button
									type="button"
									variant="outline"
									onClick={handleCloseForm}
									disabled={form.formState.isSubmitting}
								>
									{t("common.actions.cancel")}
								</Button>
								<Button type="submit" disabled={form.formState.isSubmitting}>
									{form.formState.isSubmitting ? (
										<Spinner className="mr-2 h-4 w-4" />
									) : editingClassCourse ? (
										t("common.actions.saveChanges")
									) : (
										t("admin.classCourses.form.createSubmit")
									)}
								</Button>
							</div>
						</form>
					</Form>
				</DialogContent>
			</Dialog>

			<AlertDialog
				open={isDeleteOpen}
				onOpenChange={(open) => {
					setIsDeleteOpen(open);
					if (!open) setDeleteId(null);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("admin.classCourses.delete.title")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("admin.classCourses.delete.message")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={deleteMutation.isPending}>
							{t("common.actions.cancel")}
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							disabled={deleteMutation.isPending}
						>
							{deleteMutation.isPending ? (
								<Spinner className="mr-2 h-4 w-4" />
							) : (
								<>
									<Trash2 className="mr-2 h-4 w-4" />
									{t("common.actions.delete")}
								</>
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* UE Bulk Assignment Dialog */}
			<Dialog
				open={isUeAssignOpen}
				onOpenChange={(open) => {
					if (!open) handleCloseUeAssign();
					else setIsUeAssignOpen(open);
				}}
			>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>
							{t("admin.classCourses.ueAssign.title", {
								defaultValue: "Assigner une unité d'enseignement",
							})}
						</DialogTitle>
					</DialogHeader>

					{skippedCourses.length > 0 ? (
						<div className="space-y-4">
							<div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
								<AlertTriangle className="mt-0.5 h-5 w-5 text-yellow-600" />
								<div>
									<p className="font-medium text-yellow-800">
										{t("admin.classCourses.ueAssign.skippedTitle", {
											defaultValue: "Certains cours n'ont pas été assignés",
										})}
									</p>
									<p className="mt-1 text-sm text-yellow-700">
										{t("admin.classCourses.ueAssign.skippedDesc", {
											defaultValue:
												"Les cours suivants n'ont pas d'enseignant par défaut et ont été ignorés :",
										})}
									</p>
									<ul className="mt-2 list-inside list-disc text-sm text-yellow-700">
										{skippedCourses.map((name) => (
											<li key={name}>{name}</li>
										))}
									</ul>
								</div>
							</div>
							<div className="flex justify-end">
								<Button onClick={handleCloseUeAssign}>
									{t("common.actions.close")}
								</Button>
							</div>
						</div>
					) : (
						<div className="space-y-4">
							<div>
								<label className="mb-2 block font-medium text-sm">
									{t("admin.classCourses.ueAssign.classLabel", {
										defaultValue: "Classe",
									})}
								</label>
								<CodedEntitySelect
									items={ueAssignClasses}
									onSearch={setUeAssignClassSearch}
									value={
										ueAssignClasses.find((c) => c.id === ueAssignClassId)
											?.code || null
									}
									onChange={(code) => {
										const cls = ueAssignClasses.find((c) => c.code === code);
										setUeAssignClassId(cls?.id || "");
										setUeAssignUeId(""); // Reset UE when class changes
									}}
									placeholder={t(
										"admin.classCourses.ueAssign.classPlaceholder",
										{
											defaultValue: "Sélectionner une classe",
										},
									)}
									searchMode="hybrid"
									getItemSubtitle={(cls) =>
										programs?.find((p) => p.id === cls.program)?.name ?? ""
									}
								/>
							</div>

							{ueAssignClassId && (
								<div>
									<label className="mb-2 block font-medium text-sm">
										{t("admin.classCourses.ueAssign.ueLabel", {
											defaultValue: "Unité d'enseignement",
										})}
									</label>
									<Select
										value={ueAssignUeId}
										onValueChange={setUeAssignUeId}
										disabled={teachingUnits.length === 0}
									>
										<SelectTrigger>
											<SelectValue
												placeholder={t(
													"admin.classCourses.ueAssign.uePlaceholder",
													{
														defaultValue: "Sélectionner une UE",
													},
												)}
											/>
										</SelectTrigger>
										<SelectContent>
											{teachingUnits.map((ue) => (
												<SelectItem key={ue.id} value={ue.id}>
													{ue.code} - {ue.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									{teachingUnits.length === 0 && ueAssignClassId && (
										<p className="mt-1 text-muted-foreground text-xs">
											{t("admin.classCourses.ueAssign.noUe", {
												defaultValue: "Aucune UE trouvée pour ce programme",
											})}
										</p>
									)}
								</div>
							)}

							<p className="text-muted-foreground text-sm">
								{t("admin.classCourses.ueAssign.hint", {
									defaultValue:
										"Tous les EC de l'UE seront assignés à la classe avec leur enseignant et coefficient par défaut. Les EC sans enseignant par défaut seront ignorés.",
								})}
							</p>

							<div className="flex justify-end gap-2">
								<Button
									variant="outline"
									onClick={handleCloseUeAssign}
									disabled={bulkAssignMutation.isPending}
								>
									{t("common.actions.cancel")}
								</Button>
								<Button
									onClick={handleBulkAssign}
									disabled={
										!ueAssignClassId ||
										!ueAssignUeId ||
										bulkAssignMutation.isPending
									}
								>
									{bulkAssignMutation.isPending ? (
										<Spinner className="mr-2 h-4 w-4" />
									) : (
										<Layers className="mr-2 h-4 w-4" />
									)}
									{t("admin.classCourses.ueAssign.submit", {
										defaultValue: "Assigner les cours",
									})}
								</Button>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
