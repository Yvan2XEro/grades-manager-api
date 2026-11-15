import { createCallable } from "react-call";
import { useTranslation } from "react-i18next";
import { DIALOG_EXIT_MS } from "@/components/callable/callable-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStudentCourseRoster } from "../hooks/use-student-course-roster";
import { PrerequisiteWarningsList } from "./prerequisite-warnings-list";

/**
 * Per-student course roster of a class: enroll, withdraw, restore or retake
 * each class course, with prerequisite warnings.
 */
export const StudentCourseRosterDialog = createCallable<{
	studentId: string;
	studentName: string;
	classId: string;
	semesterId?: string;
}>(({ call, studentId, studentName, classId, semesterId }) => {
	const { t } = useTranslation();
	const {
		classCoursesQuery,
		rosterByClassCourse,
		courseWarnings,
		assignCourse,
		withdrawCourse,
		reactivateCourse,
	} = useStudentCourseRoster({ studentId, classId, semesterId });

	return (
		<Dialog open={!call.ended} onOpenChange={(o) => !o && call.end()}>
			<DialogContent className="min-w-[90vw]">
				<Card>
					<CardHeader className="pb-4">
						<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
							<div>
								<CardTitle className="font-semibold text-foreground text-lg">
									{t("admin.enrollments.courseRoster.title")}
								</CardTitle>
								<p className="text-muted-foreground text-xs">
									{t("admin.enrollments.courseRoster.subtitle")}
								</p>
							</div>
							{studentId && (
								<Badge variant="outline" className="text-sm">
									{t("admin.enrollments.courseRoster.selected", {
										value: studentName,
									})}
								</Badge>
							)}
						</div>
					</CardHeader>
					<CardContent className="min-w-[70vw] space-y-4">
						{studentId ? (
							<>
								<p className="font-medium text-foreground text-sm">
									{t("admin.enrollments.courseRoster.courses")}
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
											const warningsForCourse = courseWarnings[course.id] ?? [];
											const enrollDisabled =
												!studentId ||
												status === "active" ||
												(canReactivate
													? reactivateCourse.isPending
													: assignCourse.isPending);
											const handlePrimaryAction = () => {
												if (!studentId) return;
												if (canReactivate) {
													reactivateCourse.mutate(enrollment.id);
												} else {
													assignCourse.mutate(course.id);
												}
											};
											return (
												<div key={course.id} className="space-y-2 px-4 py-3">
													<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
														<div className="space-y-1">
															<p className="font-semibold text-foreground text-sm">
																{courseName}
															</p>
															<p className="text-muted-foreground text-xs">
																{t("admin.enrollments.courseRoster.teacher", {
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
																				{},
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
																			{},
																		)}
																	</Badge>
																)}
															</div>
															<div className="flex flex-wrap gap-2">
																<Button
																	type="button"
																	size="sm"
																	variant="outline"
																	disabled={enrollDisabled}
																	onClick={handlePrimaryAction}
																>
																	{canReactivate
																		? t(
																				"admin.enrollments.courseRoster.reactivateBtn",
																				{},
																			)
																		: t(
																				"admin.enrollments.courseRoster.enrollBtn",
																				{},
																			)}
																</Button>
																<Button
																	type="button"
																	size="sm"
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
																		{},
																	)}
																</Button>
																<Button
																	type="button"
																	size="sm"
																	variant="ghost"
																	disabled={!studentId}
																	onClick={() => assignCourse.mutate(course.id)}
																>
																	{t(
																		"admin.enrollments.courseRoster.retakeBtn",
																		{},
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
											<p className="text-muted-foreground text-xs">
												{t("admin.enrollments.courseRoster.noCourses")}
											</p>
										)}
									</div>
								</ScrollArea>
							</>
						) : (
							<p className="text-muted-foreground text-xs">
								{t("admin.enrollments.courseRoster.selectStudent")}
							</p>
						)}
					</CardContent>
				</Card>
			</DialogContent>
		</Dialog>
	);
}, DIALOG_EXIT_MS);
