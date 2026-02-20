import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { CalendarDays, Loader2, LockOpen, Trash2, Unlock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import { SemesterSelect } from "@/components/inputs/SemesterSelect";
import { useCursorPagination } from "@/hooks/useCursorPagination";
import { useRowSelection } from "@/hooks/useRowSelection";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { BulkActionBar } from "@/components/ui/bulk-action-bar";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { type RouterOutputs, trpc, trpcClient } from "../../utils/trpc";

type CourseEnrollmentListResponse =
	RouterOutputs["studentCourseEnrollments"]["list"];
type CourseEnrollmentRow = CourseEnrollmentListResponse["items"][number];
type EnrollmentCreateResponse =
	RouterOutputs["studentCourseEnrollments"]["create"];
type PrerequisiteWarning = EnrollmentCreateResponse["warnings"][number];
type WarningCategory = "mandatory" | "recommended" | "corequisite";

const warningTranslationDefaults = {
	mandatory: "Mandatory gap",
	recommended: "Recommended gap",
	corequisite: "Co-requisite in progress",
} as const;

const warningMetaMap: Record<
	WarningCategory,
	{
		badgeClass: string;
		translationKey: keyof typeof warningTranslationDefaults;
	}
> = {
	mandatory: {
		badgeClass: "border-amber-200 bg-amber-50 text-amber-900",
		translationKey: "mandatory",
	},
	recommended: {
		badgeClass: "border-slate-200 bg-slate-50 text-slate-800",
		translationKey: "recommended",
	},
	corequisite: {
		badgeClass: "border-blue-200 bg-blue-50 text-blue-800",
		translationKey: "corequisite",
	},
};

const resolveWarningCategory = (
	warning: PrerequisiteWarning,
): WarningCategory => {
	if (warning.state === "in-progress") {
		return "corequisite";
	}
	return warning.prerequisiteType === "mandatory" ? "mandatory" : "recommended";
};

const getWarningMeta = (
	category: WarningCategory,
	t: TFunction<"translation", undefined>,
) => {
	const meta = warningMetaMap[category];
	return {
		badgeClass: meta.badgeClass,
		label: t(`admin.enrollments.warnings.${meta.translationKey}`, {
			defaultValue: warningTranslationDefaults[meta.translationKey],
		}),
	};
};

const buildCourseLabel = (
	name: string | null,
	code: string | null,
	fallbackId: string | null,
	t: TFunction<"translation", undefined>,
) => {
	if (name && code) {
		return t("admin.enrollments.warnings.courseLabel", {
			defaultValue: "{{name}} ({{code}})",
			name,
			code,
		});
	}
	if (name) return name;
	if (code) return code;
	return t("admin.enrollments.warnings.courseFallback", {
		defaultValue: "Course {{courseId}}",
		courseId: fallbackId ?? "N/A",
	});
};

const PrerequisiteWarningsList = ({
	warnings,
	t,
	showDescription = true,
}: {
	warnings: PrerequisiteWarning[];
	t: TFunction<"translation", undefined>;
	showDescription?: boolean;
}) => {
	if (!warnings.length) return null;
	const alertClass = showDescription
		? "border-amber-200 bg-amber-50 text-amber-900"
		: "border-amber-200 bg-amber-50 text-amber-900 text-xs sm:text-sm";
	return (
		<Alert className={alertClass}>
			<AlertTitle className="font-semibold text-sm">
				{t("admin.enrollments.warnings.title", {
					defaultValue: "Prerequisite warnings",
				})}
			</AlertTitle>
			<AlertDescription className="grid gap-2">
				{showDescription ? (
					<p className="text-muted-foreground text-xs sm:text-sm">
						{t("admin.enrollments.warnings.description", {
							defaultValue:
								"Review these unmet prerequisites before confirming next steps.",
						})}
					</p>
				) : null}
				{warnings.map((warning, index) => {
					const category = resolveWarningCategory(warning);
					const meta = getWarningMeta(category, t);
					const prerequisiteLabel = buildCourseLabel(
						warning.prerequisiteCourseName,
						warning.prerequisiteCourseCode,
						warning.prerequisiteCourseId,
						t,
					);
					const targetLabel = buildCourseLabel(
						warning.targetCourseName,
						warning.targetCourseCode,
						warning.targetCourseId,
						t,
					);
					return (
						<div
							key={`${warning.prerequisiteCourseId}-${warning.targetCourseId}-${index}`}
							className="space-y-1"
						>
							<div className="flex flex-wrap items-center gap-2">
								<Badge variant="outline" className={meta.badgeClass}>
									{meta.label}
								</Badge>
								<span className="font-medium text-gray-900 text-sm">
									{prerequisiteLabel}
								</span>
							</div>
							<p className="text-muted-foreground text-xs sm:text-sm">
								{t("admin.enrollments.warnings.appliesTo", {
									defaultValue: "Required for {{course}}",
									course: targetLabel,
								})}
							</p>
						</div>
					);
				})}
			</AlertDescription>
		</Alert>
	);
};

const EnrollmentManagement = () => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const pagination = useCursorPagination({ pageSize: 20 });
	const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("");
	const [selectedClass, setSelectedClass] = useState<string>("");
	const [selectedSemester, setSelectedSemester] = useState<string>("");

	const { data: years } = useQuery(
		trpc.academicYears.list.queryOptions({ limit: 100 }),
	);

	const { data: semesters } = useQuery(
		trpc.semesters.list.queryOptions({ limit: 100 }),
	);

	const { data: classes } = useQuery(
		trpc.classes.list.queryOptions({
			academicYearId: selectedAcademicYear || undefined,
			limit: 200,
		}),
	);

	const enrollmentsQuery = useQuery({
		...trpc.enrollments.list.queryOptions({
			classId: selectedClass || undefined,
			academicYearId: selectedAcademicYear || undefined,
			cursor: pagination.cursor,
			limit: pagination.pageSize,
		}),
		enabled: Boolean(selectedAcademicYear && selectedClass),
	});

	const studentsQuery = useQuery({
		...trpc.students.list.queryOptions({
			classId: selectedClass || undefined,
			limit: 100,
		}),
		enabled: Boolean(selectedClass),
	});

	const classCoursesQuery = useQuery({
		...trpc.classCourses.list.queryOptions({
			classId: selectedClass || undefined,
			semesterId: selectedSemester || undefined,
			limit: 100,
		}),
		enabled: Boolean(selectedClass),
	});

	const [selectedStudent, setSelectedStudent] = useState<string>("");
	const [rosterModalOpen, setRosterModalOpen] = useState(false);
	const [autoEnrollDialogOpen, setAutoEnrollDialogOpen] = useState(false);
	const [courseWarnings, setCourseWarnings] = useState<
		Record<string, PrerequisiteWarning[]>
	>({});
	const [autoEnrollWarnings, setAutoEnrollWarnings] = useState<
		PrerequisiteWarning[]
	>([]);

	const courseEnrollmentQuery = useQuery({
		...trpc.studentCourseEnrollments.list.queryOptions({
			studentId: selectedStudent || undefined,
			limit: 200,
		}),
		enabled: Boolean(selectedStudent && rosterModalOpen),
	});

	const selectedStudentProfile = useMemo(
		() =>
			studentsQuery.data?.items?.find(
				(student) => student.id === selectedStudent,
			) ?? null,
		[studentsQuery.data?.items, selectedStudent],
	);

	const windowsQuery = useQuery(
		trpc.workflows.enrollmentWindows.queryOptions(),
	);

	const toggleWindow = useMutation({
		mutationFn: (action: "open" | "close") =>
			trpcClient.workflows.enrollmentWindow.mutate({
				classId: selectedClass,
				academicYearId: selectedAcademicYear,
				action,
			}),
		onSuccess: () => {
			toast.success(
				t("admin.enrollments.toast.updated", {
					defaultValue: "Window updated",
				}),
			);
			queryClient.invalidateQueries(
				trpc.workflows.enrollmentWindows.queryKey(),
			);
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const rosterByClassCourse = useMemo(() => {
		const map = new Map<string, CourseEnrollmentRow>();
		courseEnrollmentQuery.data?.items?.forEach((item) => {
			map.set(item.classCourseId, item);
		});
		return map;
	}, [courseEnrollmentQuery.data?.items]);

	const assignCourse = useMutation({
		mutationFn: (classCourseId: string) =>
			trpcClient.studentCourseEnrollments.create.mutate({
				studentId: selectedStudent,
				classCourseId,
				status: "active",
			}),
		onSuccess: (result, classCourseIdParam) => {
			toast.success(
				t("admin.enrollments.toast.courseEnrolled", {
					defaultValue: "Student enrolled in course",
				}),
			);
			if (classCourseIdParam) {
				setCourseWarnings((prev) => {
					const next = { ...prev };
					if (result.warnings?.length) {
						next[classCourseIdParam] = result.warnings;
					} else {
						delete next[classCourseIdParam];
					}
					return next;
				});
			}
			queryClient.invalidateQueries(
				trpc.studentCourseEnrollments.list.queryKey(),
			);
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const withdrawCourse = useMutation({
		mutationFn: (payload: { id: string; status: "withdrawn" | "completed" }) =>
			trpcClient.studentCourseEnrollments.updateStatus.mutate(payload),
		onSuccess: () => {
			toast.success(
				t("admin.enrollments.toast.courseWithdrawn", {
					defaultValue: "Enrollment updated",
				}),
			);
			queryClient.invalidateQueries(
				trpc.studentCourseEnrollments.list.queryKey(),
			);
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const reactivateCourse = useMutation({
		mutationFn: (id: string) =>
			trpcClient.studentCourseEnrollments.updateStatus.mutate({
				id,
				status: "active",
			}),
		onSuccess: () => {
			toast.success(
				t("admin.enrollments.toast.courseReactivated", {
					defaultValue: "Enrollment restored",
				}),
			);
			queryClient.invalidateQueries(
				trpc.studentCourseEnrollments.list.queryKey(),
			);
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const autoEnrollMutation = useMutation({
		mutationFn: () =>
			trpcClient.studentCourseEnrollments.autoEnrollClass.mutate({
				classId: selectedClass,
				academicYearId: selectedAcademicYear,
				semesterId: selectedSemester || selectedClassDetails?.semester?.id,
			}),
		onSuccess: (result) => {
			toast.success(
				t("admin.enrollments.toast.autoEnrollSuccess", {
					defaultValue: "Class roster synced ({{count}} records)",
					count: result.createdCount,
				}),
			);
			if (result.warnings?.length) {
				setAutoEnrollWarnings(result.warnings);
				setAutoEnrollDialogOpen(true);
			} else {
				setAutoEnrollWarnings([]);
				setAutoEnrollDialogOpen(false);
			}
			queryClient.invalidateQueries(
				trpc.studentCourseEnrollments.list.queryKey(),
			);
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const enrollments = enrollmentsQuery.data?.items ?? [];
	const selection = useRowSelection(enrollments);

	const bulkDeleteMutation = useMutation({
		mutationFn: async (ids: string[]) => {
			await Promise.all(ids.map((id) => trpcClient.enrollments.delete.mutate({ id })));
		},
		onSuccess: () => {
			queryClient.invalidateQueries(trpc.enrollments.list.queryKey());
			selection.clear();
			toast.success(t("common.bulkActions.deleteSuccess", { defaultValue: "Items deleted successfully" }));
		},
		onError: () => toast.error(t("common.bulkActions.deleteError", { defaultValue: "Failed to delete items" })),
	});

	const studentsCount = studentsQuery.data?.items?.length ?? 0;
	const classCoursesCount = classCoursesQuery.data?.items?.length ?? 0;
	const windowStatus = useMemo(() => {
		if (!selectedClass || !selectedAcademicYear) return null;
		return windowsQuery.data?.find(
			(entry) =>
				entry.classId === selectedClass &&
				entry.academicYearId === selectedAcademicYear,
		);
	}, [windowsQuery.data, selectedAcademicYear, selectedClass]);

	useEffect(() => {
		setRosterModalOpen(false);
		setSelectedStudent("");
		pagination.reset();
	}, [selectedAcademicYear, selectedClass, selectedSemester]);

	useEffect(() => {
		if (!rosterModalOpen) {
			setCourseWarnings({});
		}
	}, [rosterModalOpen]);

	useEffect(() => {
		if (!selectedStudent) {
			setCourseWarnings({});
		}
	}, [selectedStudent]);

	const handleAutoEnrollConfirm = () => {
		setAutoEnrollWarnings([]);
		autoEnrollMutation.mutate();
	};

	const openRosterForStudent = (studentId: string) => {
		setSelectedStudent(studentId);
		setCourseWarnings({});
		setRosterModalOpen(true);
	};

	const handleRosterModalChange = (open: boolean) => {
		setRosterModalOpen(open);
		if (!open) {
			setCourseWarnings({});
		}
	};

	const selectedClassDetails = useMemo(() => {
		return classes?.items?.find((klass) => klass.id === selectedClass);
	}, [classes?.items, selectedClass]);

	const canAutoEnroll = Boolean(
		selectedAcademicYear &&
			selectedClass &&
			studentsCount > 0 &&
			classCoursesCount > 0 &&
			!autoEnrollMutation.isPending,
	);

	return (
		<div className="space-y-6">
			<div className="grid gap-4 rounded-xl border border-border bg-card p-4 shadow-sm md:grid-cols-2 lg:grid-cols-4">
				<div className="space-y-1">
					<p className="font-medium text-muted-foreground text-sm">
						{t("admin.enrollments.filters.year", {
							defaultValue: "Academic year",
						})}
					</p>
					<AcademicYearSelect
						value={selectedAcademicYear || null}
						onChange={(value) => {
							setSelectedAcademicYear(value);
							setSelectedClass("");
							setSelectedSemester("");
						}}
						placeholder={t("admin.enrollments.selectYear", {
							defaultValue: "Select academic year",
						})}
					/>
				</div>
				<div className="space-y-1">
					<p className="font-medium text-muted-foreground text-sm">
						{t("admin.enrollments.filters.class", { defaultValue: "Class" })}
					</p>
					<Select
						value={selectedClass}
						onValueChange={(value) => setSelectedClass(value)}
						disabled={!selectedAcademicYear}
					>
						<SelectTrigger data-testid="class-select" className="w-full">
							<SelectValue
								placeholder={t("admin.enrollments.selectClass", {
									defaultValue: "Select class",
								})}
							/>
						</SelectTrigger>
						<SelectContent>
							{classes?.items?.map((klass) => (
								<SelectItem key={klass.id} value={klass.id}>
									{klass.name}
									{klass.programOption?.name
										? ` \u2022 ${klass.programOption.name}`
										: ""}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-1">
					<p className="font-medium text-muted-foreground text-sm">
						{t("admin.enrollments.filters.semester", {
							defaultValue: "Semester",
						})}
					</p>
					<SemesterSelect
						value={selectedSemester || null}
						onChange={(v) => setSelectedSemester(v ?? "")}
						disabled={!selectedClass}
						placeholder={t("admin.enrollments.selectSemester", {
							defaultValue: "Select semester",
						})}
					/>
				</div>
				<div className="space-y-2 rounded-lg border border-border border-dashed p-3 text-muted-foreground text-sm">
					<p className="font-semibold text-foreground">
						{t("admin.enrollments.filters.summary", {
							defaultValue: "Snapshot",
						})}
					</p>
					<ul className="space-y-1 text-sm">
						<li>
							{t("admin.enrollments.filters.studentsCount", {
								defaultValue: "Students: {{value}}",
								value: studentsQuery.data?.items?.length ?? 0,
							})}
						</li>
						<li>
							{t("admin.enrollments.filters.cycle", {
								defaultValue: "Cycle: {{value}}",
								value:
									selectedClassDetails?.cycle?.name ??
									t("common.labels.notAvailable", { defaultValue: "N/A" }),
							})}
						</li>
						<li>
							{t("admin.enrollments.filters.cycleLevel", {
								defaultValue: "Level: {{value}}",
								value:
									selectedClassDetails?.cycleLevel?.name ??
									t("common.labels.notAvailable", { defaultValue: "N/A" }),
							})}
						</li>
						<li>
							{t("admin.enrollments.filters.option", {
								defaultValue: "Option: {{value}}",
								value:
									selectedClassDetails?.programOption?.name ??
									t("common.labels.notAvailable", { defaultValue: "N/A" }),
							})}
						</li>
						<li>
							{t("admin.enrollments.filters.window", {
								defaultValue: "Window: {{status}}",
								status: windowStatus?.status ?? t("common.labels.notAvailable"),
							})}
						</li>
					</ul>
				</div>
			</div>

			<Card>
				<CardHeader className="flex flex-col gap-4 pb-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex items-center gap-3">
						<CalendarDays className="h-6 w-6 text-primary-700" />
						<div>
							<p className="font-semibold text-foreground">
								{windowStatus
									? t("admin.enrollments.windowStatus", {
											defaultValue: "Window: {{status}}",
											status: windowStatus.status,
										})
									: t("admin.enrollments.windowMissing", {
											defaultValue: "Window not configured",
										})}
							</p>
							<p className="text-muted-foreground text-sm">
								{windowStatus?.status === "open"
									? t("admin.enrollments.windowOpen", {
											defaultValue: "Students can enroll.",
										})
									: t("admin.enrollments.windowClosed", {
											defaultValue: "Window currently closed.",
										})}
							</p>
						</div>
					</div>
					<div className="flex flex-wrap gap-2">
						<AlertDialog
							open={autoEnrollDialogOpen}
							onOpenChange={(open) => {
								setAutoEnrollDialogOpen(open);
								if (!open) {
									setAutoEnrollWarnings([]);
								}
							}}
						>
							<AlertDialogTrigger asChild>
								<Button
									type="button"
									variant="outline"
									disabled={!canAutoEnroll}
								>
									{autoEnrollMutation.isPending && (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									)}
									{t("admin.enrollments.autoEnroll.button", {
										defaultValue: "Enroll entire class",
									})}
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>
										{t("admin.enrollments.autoEnroll.title", {
											defaultValue: "Enroll every student?",
										})}
									</AlertDialogTitle>
									<AlertDialogDescription>
										{t("admin.enrollments.autoEnroll.description", {
											defaultValue:
												"This action enrolls {{students}} students into {{courses}} courses. Existing enrollments remain untouched.",
											students: studentsCount,
											courses: classCoursesCount,
										})}
									</AlertDialogDescription>
								</AlertDialogHeader>
								{autoEnrollWarnings.length > 0 ? (
									<div className="py-2">
										<PrerequisiteWarningsList
											warnings={autoEnrollWarnings}
											t={t}
										/>
									</div>
								) : null}
								<AlertDialogFooter>
									<AlertDialogCancel disabled={autoEnrollMutation.isPending}>
										{t("common.actions.cancel", { defaultValue: "Cancel" })}
									</AlertDialogCancel>
									<AlertDialogAction
										onClick={handleAutoEnrollConfirm}
										disabled={autoEnrollMutation.isPending}
									>
										{autoEnrollMutation.isPending && (
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										)}
										{t("admin.enrollments.autoEnroll.confirm", {
											defaultValue: "Confirm enrollment",
										})}
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
						<Button
							type="button"
							onClick={() => toggleWindow.mutate("open")}
							disabled={!selectedAcademicYear || !selectedClass}
						>
							<Unlock className="mr-1 h-4 w-4" />
							{t("admin.enrollments.actions.open", {
								defaultValue: "Open window",
							})}
						</Button>
						<Button
							type="button"
							variant="secondary"
							onClick={() => toggleWindow.mutate("close")}
							disabled={!selectedAcademicYear || !selectedClass}
						>
							<LockOpen className="mr-1 h-4 w-4" />
							{t("admin.enrollments.actions.close", {
								defaultValue: "Close window",
							})}
						</Button>
					</div>
				</CardHeader>
			</Card>

			<div>
				<Card className="lg:col-span-2">
					<CardHeader className="pb-4">
						<CardTitle className="font-semibold text-foreground text-lg">
							{t("admin.enrollments.listTitle", {
								defaultValue: "Enrollments",
							})}
						</CardTitle>
					</CardHeader>
					<CardContent>
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

						{enrollmentsQuery.isLoading ? (
							<p className="text-muted-foreground text-sm">
								{t("common.loading", { defaultValue: "Loading..." })}
							</p>
						) : enrollments.length ? (
							<div className="overflow-x-auto">
								<table className="min-w-full divide-y divide-border">
									<thead className="bg-muted">
										<tr>
											<th className="w-10 px-4 py-2">
												<Checkbox
													checked={selection.isAllSelected}
													onCheckedChange={(checked) => selection.toggleAll(!!checked)}
													aria-label="Select all"
												/>
											</th>
											<th className="px-4 py-2 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">
												{t("admin.enrollments.fields.student", {
													defaultValue: "Student",
												})}
											</th>
											<th className="px-4 py-2 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">
												{t("admin.enrollments.fields.status", {
													defaultValue: "Status",
												})}
											</th>
											<th className="px-4 py-2 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">
												{t("admin.enrollments.fields.dates", {
													defaultValue: "Dates",
												})}
											</th>
											<th className="px-4 py-2 text-right font-medium text-muted-foreground text-xs uppercase tracking-wider">
												{t("admin.enrollments.fields.actions", {
													defaultValue: "Actions",
												})}
											</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-border">
										{enrollments.map((enrollment) => {
											const student = studentsQuery.data?.items?.find(
												(s) => s.id === enrollment.studentId,
											);
											const fullName = student
												? `${student.profile.firstName} ${student.profile.lastName}`
												: t("admin.enrollments.fields.unknownStudent", {
														defaultValue: "Unknown student",
													});
											return (
												<tr key={enrollment.id}>
													<td className="px-4 py-3">
														<Checkbox
															checked={selection.isSelected(enrollment.id)}
															onCheckedChange={() => selection.toggle(enrollment.id)}
															aria-label={`Select ${fullName}`}
														/>
													</td>
													<td className="px-4 py-3">
														<div className="space-y-0.5">
															<p className="font-semibold text-foreground">
																{fullName}
															</p>
															<p className="text-muted-foreground text-sm">
																{student?.registrationNumber ??
																	t(
																		"admin.enrollments.fields.registrationFallback",
																		{
																			defaultValue: "ID: {{value}}",
																			value: enrollment.studentId,
																		},
																	)}
															</p>
														</div>
													</td>
													<td className="px-4 py-3">
														<span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 font-medium text-foreground text-xs">
															{t("admin.enrollments.fields.statusValue", {
																defaultValue: "{{value}}",
																value: enrollment.status,
															})}
														</span>
													</td>
													<td className="px-4 py-3 text-muted-foreground text-sm">
														<p>
															{t("admin.enrollments.fields.enrolledAt", {
																defaultValue: "Enrolled: {{value}}",
																value: enrollment.enrolledAt
																	? new Date(
																			enrollment.enrolledAt,
																		).toLocaleDateString()
																	: t("common.labels.notAvailable", {
																			defaultValue: "N/A",
																		}),
															})}
														</p>
														{enrollment.exitedAt && (
															<p>
																{t("admin.enrollments.fields.exitedAt", {
																	defaultValue: "Exited: {{value}}",
																	value: new Date(
																		enrollment.exitedAt,
																	).toLocaleDateString(),
																})}
															</p>
														)}
													</td>
													<td className="px-4 py-3 text-right">
														<Button
															type="button"
															size="sm"
															variant="secondary"
															onClick={() =>
																openRosterForStudent(enrollment.studentId)
															}
														>
															{t(
																"admin.enrollments.courseRoster.openModalBtn",
																{
																	defaultValue: "View roster",
																},
															)}
														</Button>
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
						) : (
							<p className="text-muted-foreground text-sm">
								{t("admin.enrollments.empty", {
									defaultValue:
										"No enrollments found for the selected filters.",
								})}
							</p>
						)}

						<PaginationBar
							hasPrev={pagination.hasPrev}
							hasNext={!!enrollmentsQuery.data?.nextCursor}
							onPrev={pagination.handlePrev}
							onNext={() => pagination.handleNext(enrollmentsQuery.data?.nextCursor)}
							isLoading={enrollmentsQuery.isLoading}
						/>
					</CardContent>
				</Card>

				<Dialog open={rosterModalOpen} onOpenChange={handleRosterModalChange}>
					<DialogContent className="min-w-[90vw]">
						<Card>
							<CardHeader className="pb-4">
								<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
									<div>
										<CardTitle className="font-semibold text-foreground text-lg">
											{t("admin.enrollments.courseRoster.title", {
												defaultValue: "Course roster (per student)",
											})}
										</CardTitle>
										<p className="text-muted-foreground text-sm">
											{t("admin.enrollments.courseRoster.subtitle", {
												defaultValue:
													"Select a student to review enrollment attempts, retakes, and status per course.",
											})}
										</p>
									</div>
									{selectedStudent && (
										<Badge variant="outline" className="text-sm">
											{t("admin.enrollments.courseRoster.selected", {
												defaultValue: "Managing: {{value}}",
												value: selectedStudentProfile
													? `${selectedStudentProfile.profile.firstName} ${selectedStudentProfile.profile.lastName}`
													: "",
											})}
										</Badge>
									)}
								</div>
							</CardHeader>
							<CardContent className="min-w-[70vw] space-y-4">
								{selectedStudent ? (
									<>
										<p className="font-medium text-foreground text-sm">
											{t("admin.enrollments.courseRoster.courses", {
												defaultValue: "Class courses",
											})}
										</p>
										<ScrollArea className="max-h-[420px] w-full rounded-md border">
											<div className="divide-y">
												{classCoursesQuery.data?.items?.map((course) => {
													const enrollment = rosterByClassCourse.get(course.id);
													const status = enrollment?.status ?? "none";
													const courseName = course.courseName ?? course.course;
													const teacherName = course.teacherFirstName
														? `${course.teacherFirstName} ${course.teacherLastName ?? ""}`.trim()
														: course.teacher;
													const canReactivate =
														enrollment && status === "withdrawn";
													const warningsForCourse =
														courseWarnings[course.id] ?? [];
													const enrollDisabled =
														!selectedStudent ||
														status === "active" ||
														(canReactivate
															? reactivateCourse.isPending
															: assignCourse.isPending);
													const handlePrimaryAction = () => {
														if (!selectedStudent) return;
														if (canReactivate) {
															reactivateCourse.mutate(enrollment.id);
														} else {
															assignCourse.mutate(course.id);
														}
													};
													return (
														<div
															key={course.id}
															className="space-y-2 px-4 py-3"
														>
															<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
															<div className="space-y-1">
																<p className="font-semibold text-foreground text-sm">
																	{courseName}
																</p>
																<p className="text-muted-foreground text-xs">
																	{t("admin.enrollments.courseRoster.teacher", {
																		defaultValue: "Teacher: {{value}}",
																		value: teacherName,
																	})}
																</p>
															</div>
															<div className="flex flex-col gap-2 sm:items-end">
																<div className="flex items-center gap-2">
																	<Badge
																	variant="outline"
																	className={
																		status === "active"
																			? "border-emerald-200 bg-emerald-50 text-emerald-800"
																			: status === "completed"
																				? "border-blue-200 bg-blue-50 text-blue-800"
																				: status === "failed"
																					? "border-rose-200 bg-rose-50 text-rose-800"
																					: "border-border bg-muted text-foreground"
																	}
																	>
																		{status === "none"
																			? t(
																				"admin.enrollments.courseRoster.notEnrolled",
																				{
																					defaultValue: "Not enrolled",
																				},
																			)
																		: status}
																	</Badge>
																	{enrollment && enrollment.attempt > 1 && (
																		<Badge
																			variant="outline"
																			className="border-orange-200 bg-orange-50 text-orange-800"
																		>
																			{t(
																				"admin.enrollments.courseRoster.attemptBadge",
																				{
																					defaultValue: "Attempt {{value}}",
																					value: enrollment.attempt,
																				},
																			)}
																		</Badge>
																	)}
																	{status === "failed" && (
																		<Badge
																			variant="outline"
																			className="border-amber-200 bg-amber-50 text-amber-800"
																		>
																			{t(
																				"admin.enrollments.courseRoster.retakeEligible",
																				{
																					defaultValue: "Retake eligible",
																				},
																			)}
																		</Badge>
																	)}
																</div>
																<div className="flex flex-wrap gap-2">
																	<Button
																		type="button"
																		size="xs"
																		variant="outline"
																		disabled={enrollDisabled}
																		onClick={handlePrimaryAction}
																	>
																		{canReactivate
																			? t(
																					"admin.enrollments.courseRoster.reactivateBtn",
																					{
																						defaultValue: "Restore enrollment",
																					},
																				)
																			: t(
																					"admin.enrollments.courseRoster.enrollBtn",
																					{
																						defaultValue: "Enroll",
																					},
																				)}
																	</Button>
																	<Button
																		type="button"
																		size="xs"
																		variant="secondary"
																		disabled={
																			!enrollment || withdrawCourse.isPending
																		}
																		onClick={() =>
																			enrollment &&
																			withdrawCourse.mutate({
																				id: enrollment.id,
																				status: "withdrawn",
																			})
																		}
																	>
																		{t(
																			"admin.enrollments.courseRoster.withdrawBtn",
																			{
																				defaultValue: "Withdraw",
																			},
																		)}
																	</Button>
																	<Button
																		type="button"
																		size="xs"
																		variant="ghost"
																		disabled={!selectedStudent}
																		onClick={() =>
																			assignCourse.mutate(course.id)
																		}
																	>
																		{t(
																			"admin.enrollments.courseRoster.retakeBtn",
																			{
																				defaultValue: "Retake",
																			},
																		)}
																	</Button>
																</div>
															</div>
															</div>
															{warningsForCourse.length > 0 ? (
																<PrerequisiteWarningsList
																	warnings={warningsForCourse}
																	t={t}
																	showDescription={false}
																/>
															) : null}
														</div>
													);
												}) ?? (
													<p className="text-muted-foreground text-sm">
														{t("admin.enrollments.courseRoster.noCourses", {
															defaultValue:
																"This class has no courses assigned yet.",
														})}
													</p>
												)}
											</div>
										</ScrollArea>
									</>
								) : (
									<p className="text-muted-foreground text-sm">
										{t("admin.enrollments.courseRoster.selectStudent", {
											defaultValue:
												"Pick a student to manage course enrollments.",
										})}
									</p>
								)}
							</CardContent>
						</Card>
					</DialogContent>
				</Dialog>
			</div>
		</div>
	);
};

export default EnrollmentManagement;
