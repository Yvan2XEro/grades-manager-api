import { useQuery } from "@tanstack/react-query";
import { BookOpen, ClipboardList, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useStore } from "../../store";
import { trpcClient } from "../../utils/trpc";

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
				<Spinner className="h-10 w-10 text-primary" />
			</div>
		);
	}

	return (
		<div className="space-y-6 p-6">
			<div>
				<h2 className="font-bold text-2xl text-foreground">
					{t("teacher.courses.title")}
				</h2>
				<p className="text-muted-foreground">{t("teacher.courses.subtitle")}</p>
			</div>

			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{courses?.length ? (
					courses.map((course) => (
						<Card key={course.id} className="h-full">
							<CardHeader>
								<CardTitle>{course.name}</CardTitle>
								<CardDescription>
									{course.class_name} • {course.program_name}
								</CardDescription>
							</CardHeader>
							<CardContent className="flex flex-wrap justify-between gap-4">
								<div className="flex items-center gap-2 text-muted-foreground">
									<Users className="h-4 w-4" />
									<span>{course.student_count}</span>
								</div>
								<div className="flex items-center gap-2 text-muted-foreground">
									<ClipboardList className="h-4 w-4" />
									<span>{course.exam_count}</span>
								</div>
							</CardContent>
							<CardFooter className="justify-end">
								<Button asChild size="sm">
									<Link to={`/teacher/grades/${course.id}`}>
										{t("teacher.courses.actions.viewGrades")}
									</Link>
								</Button>
							</CardFooter>
						</Card>
					))
				) : (
					<Card className="col-span-full">
						<CardContent className="flex flex-col items-center gap-3 py-10 text-center">
							<BookOpen className="h-14 w-14 text-muted-foreground/40" />
							<div>
								<p className="font-semibold text-lg">
									{t("teacher.courses.empty.title")}
								</p>
								<p className="text-muted-foreground text-sm">
									{t("teacher.courses.empty.description")}
								</p>
							</div>
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
}
