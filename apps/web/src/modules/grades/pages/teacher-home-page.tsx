import { useQuery } from "@tanstack/react-query";
import { BookOpen } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import { trpc } from "@/utils/trpc";
import { TeacherCourseCard } from "../components/teacher-course-card";
import { TeacherCoursesToolbar } from "../components/teacher-courses-toolbar";
import { useTeacherCourses } from "../hooks/use-teacher-courses";
import {
	courseNeedsAction,
	coursesOfPeriod,
	currentYearHalf,
	filterTeacherCourses,
} from "../services/teacher-courses";
import type { TeacherCoursePeriod, TeacherCourseSort } from "../types";

/** Teacher home: their courses with exams, grading progress and next actions. */
export default function TeacherHub() {
	const { t } = useTranslation();
	const [search, setSearch] = useState("");
	const [filterAction, setFilterAction] = useState(false);
	const [sortBy, setSortBy] = useState<TeacherCourseSort>("relevance");
	const [chosenPeriod, setChosenPeriod] = useState<TeacherCoursePeriod | null>(
		null,
	);

	const { data: coursesData, isLoading } = useTeacherCourses();
	const yearsQuery = useQuery(trpc.academicYears.list.queryOptions({}));
	const activeYear = yearsQuery.data?.items.find((y) => y.isActive);
	const currentPeriod = currentYearHalf(activeYear);
	// Default: the semester we are in; "all" stays one click away
	const period = chosenPeriod ?? currentPeriod;

	const courses = coursesOfPeriod(coursesData ?? [], period);

	const actionCount = courses.filter(courseNeedsAction).length;
	const filteredCourses = filterTeacherCourses(courses, {
		search,
		actionOnly: filterAction,
		sortBy,
	});

	if (isLoading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<Spinner className="h-8 w-8 text-primary" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<PageHeader
				title={t("teacher.courses.hubTitle")}
				description={t("teacher.courses.hubDescription")}
			/>

			{(coursesData ?? []).length === 0 ? (
				<div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-12 text-center">
					<div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
						<BookOpen className="h-6 w-6 text-muted-foreground" />
					</div>
					<div>
						<p className="font-medium text-foreground">
							{t("teacher.courses.empty.title")}
						</p>
						<p className="text-muted-foreground text-sm">
							{t("teacher.courses.empty.description")}
						</p>
					</div>
				</div>
			) : (
				<>
					<TeacherCoursesToolbar
						period={period}
						currentPeriod={currentPeriod}
						onPeriodChange={setChosenPeriod}
						search={search}
						filterAction={filterAction}
						actionCount={actionCount}
						sortBy={sortBy}
						onSearchChange={setSearch}
						onFilterActionChange={setFilterAction}
						onSortChange={setSortBy}
					/>

					{/* Course grid */}
					{filteredCourses.length === 0 ? (
						<div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground text-sm">
							{t(
								search || filterAction
									? "teacher.courses.noSearchMatch"
									: "teacher.courses.noCourseInPeriod",
							)}
						</div>
					) : (
						<div className="grid gap-4 sm:grid-cols-2">
							{filteredCourses.map((course) => (
								<TeacherCourseCard key={course.classCourseId} course={course} />
							))}
						</div>
					)}
				</>
			)}
		</div>
	);
}
