import { BookOpen } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import { TeacherCourseCard } from "../components/teacher-course-card";
import { TeacherCoursesToolbar } from "../components/teacher-courses-toolbar";
import { useTeacherCourses } from "../hooks/use-teacher-courses";
import {
	courseNeedsAction,
	filterTeacherCourses,
} from "../services/teacher-courses";
import type { TeacherCourseSort } from "../types";

/** Teacher home: their courses with exams, grading progress and next actions. */
export default function TeacherHub() {
	const [search, setSearch] = useState("");
	const [filterAction, setFilterAction] = useState(false);
	const [sortBy, setSortBy] = useState<TeacherCourseSort>("relevance");

	const { data: coursesData, isLoading } = useTeacherCourses();

	const courses = coursesData ?? [];

	const actionCount = useMemo(
		() => courses.filter(courseNeedsAction).length,
		[courses],
	);

	const filteredCourses = useMemo(
		() =>
			filterTeacherCourses(courses, {
				search,
				actionOnly: filterAction,
				sortBy,
			}),
		[courses, search, filterAction, sortBy],
	);

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
				title="Mes cours & notes"
				description="Saisie des notes, verrouillage et soumission par cours"
			/>

			{courses.length === 0 ? (
				<div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-12 text-center">
					<div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
						<BookOpen className="h-6 w-6 text-muted-foreground" />
					</div>
					<div>
						<p className="font-medium text-foreground">Aucun cours assigné</p>
						<p className="text-muted-foreground text-sm">
							Vous n'avez aucun cours pour l'année académique en cours.
						</p>
					</div>
				</div>
			) : (
				<>
					<TeacherCoursesToolbar
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
							Aucun cours ne correspond à votre recherche.
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
