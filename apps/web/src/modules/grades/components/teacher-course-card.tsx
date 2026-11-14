import { AlertCircle, BookOpen, Users, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { courseNeedsAction } from "../services/teacher-courses";
import type { CourseData } from "../types";
import { CompactExamRow } from "./compact-exam-row";

/** Card of a teacher course with its exams and the fast entry link. */
export function TeacherCourseCard({ course }: { course: CourseData }) {
	const { t } = useTranslation();
	const hasPendingAction = courseNeedsAction(course);

	return (
		<div className="overflow-hidden rounded-xl border bg-card shadow-sm">
			<div className="flex items-start justify-between border-b bg-muted/30 px-4 py-3">
				<div className="flex items-start gap-3">
					<div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
						<BookOpen className="h-4 w-4 text-primary" />
					</div>
					<div>
						<div className="flex items-center gap-2">
							<span className="font-semibold text-foreground text-sm">
								{course.courseName}
							</span>
							{course.isDelegated && (
								<Badge variant="secondary" className="text-xs">
									Délégué
								</Badge>
							)}
						</div>
						<span className="text-muted-foreground text-xs">
							{course.className} · {course.programName}
						</span>
					</div>
				</div>
				<div className="flex shrink-0 items-center gap-2 text-muted-foreground text-xs">
					{course.exams.length > 0 && (
						<Button
							asChild
							size="sm"
							variant="ghost"
							className="h-7 px-2 text-xs"
						>
							<Link to={`/grades/${course.classCourseId}/fast`}>
								<Zap className="mr-1 h-3 w-3" />
								{t("teacher.courses.actions.fastEntry")}
							</Link>
						</Button>
					)}
					<Users className="h-3.5 w-3.5" />
					<span>{course.studentCount}</span>
					{hasPendingAction && (
						<span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
							<AlertCircle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
						</span>
					)}
				</div>
			</div>

			{course.exams.length === 0 ? (
				<p className="px-4 py-5 text-center text-muted-foreground text-sm">
					Aucun examen pour ce cours
				</p>
			) : (
				<div className="divide-y">
					{course.exams.map((exam) => (
						<CompactExamRow
							key={exam.id}
							exam={exam}
							studentCount={course.studentCount}
							classCourseId={course.classCourseId}
						/>
					))}
				</div>
			)}
		</div>
	);
}
