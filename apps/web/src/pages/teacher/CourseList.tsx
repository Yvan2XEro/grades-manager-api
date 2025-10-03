import { useQuery } from "@tanstack/react-query";
import { BookOpen, ClipboardList, Users } from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";
import { useStore } from "../../store";
import { trpcClient } from "../../utils/trpc";
import { useTranslation } from "react-i18next";

interface Course {
	id: string;
	name: string;
	class_name: string;
	program_name: string;
	student_count: number;
	exam_count: number;
}

export default function CourseList() {
	const { user } = useStore();
  const { t } = useTranslation();

	const { data: courses, isLoading } = useQuery({
		queryKey: ["teacherCourses", user?.id],
		queryFn: async (): Promise<Course[]> => {
			if (!user) return [];

			const { items: years } = await trpcClient.academicYears.list.query({});
			const activeYear = years.find((y) => y.isActive);
			if (!activeYear) return [];

			const { items } = await trpcClient.classCourses.list.query({
				teacherId: user.id,
			});
			const results = await Promise.all(
				items.map(async (cc) => {
					const klass = await trpcClient.classes.getById.query({
						id: cc.class,
					});
					if (klass.academicYear !== activeYear.id) return null;

					const [course, program, students, exams] = await Promise.all([
						trpcClient.courses.getById.query({ id: cc.course }),
						trpcClient.programs.getById.query({ id: klass.program }),
						trpcClient.students.list.query({ classId: klass.id }),
						trpcClient.exams.list.query({ classCourseId: cc.id }),
					]);

					return {
						id: cc.id,
						name: course.name,
						class_name: klass.name,
						program_name: program.name,
						student_count: students.items.length,
						exam_count: exams.items.length,
					} as Course;
				}),
			);

			return results.filter(Boolean) as Course[];
		},
		enabled: !!user,
	});

	if (isLoading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<span className="loading loading-spinner loading-lg" />
			</div>
		);
	}

	return (
		<div className="space-y-6 p-6">
			<div>
				<h2 className="font-bold text-2xl">{t("teacher.courses.title")}</h2>
				<p className="text-base-content/60">
					{t("teacher.courses.subtitle")}
				</p>
			</div>

			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{courses?.map((course) => (
					<Link
						key={course.id}
						to={`/teacher/grades/${course.id}`}
						className="card bg-base-100 shadow-xl transition-shadow hover:shadow-2xl"
					>
						<div className="card-body">
							<h3 className="card-title">{course.name}</h3>
							<p className="text-base-content/60">
								{course.class_name} • {course.program_name}
							</p>

							<div className="card-actions mt-4 items-center justify-between">
								<div className="flex gap-4">
									<div className="flex items-center gap-1 text-base-content/70">
										<Users className="h-4 w-4" />
										<span>{course.student_count}</span>
									</div>
									<div className="flex items-center gap-1 text-base-content/70">
										<ClipboardList className="h-4 w-4" />
										<span>{course.exam_count}</span>
									</div>
								</div>
								<button className="btn btn-primary btn-sm">
									{t("teacher.courses.actions.viewGrades")}
								</button>
							</div>
						</div>
					</Link>
				))}

				{courses?.length === 0 && (
					<div className="card col-span-full bg-base-100 shadow-xl">
						<div className="card-body items-center py-12 text-center">
							<BookOpen className="h-16 w-16 text-base-content/20" />
							<h3 className="mt-4 font-bold text-xl">
								{t("teacher.courses.empty.title")}
							</h3>
							<p className="text-base-content/60">
								{t("teacher.courses.empty.description")}
							</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
