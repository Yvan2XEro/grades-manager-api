import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { BookOpen, Calendar, ClipboardList, Clock, Users } from "lucide-react";
import type React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useStore } from "../../store";
import { trpcClient } from "../../utils/trpc";

type CourseInfo = {
	id: string;
	name: string;
	class_name: string;
	program_name: string;
	upcoming_exams: number;
	student_count: number;
	cycle_name?: string | null;
	cycle_code?: string | null;
	cycle_level_name?: string | null;
	cycle_level_code?: string | null;
};

type UpcomingExam = {
	id: string;
	name: string;
	date: string;
	percentage: number;
	course_name: string;
	class_name: string;
};

const TeacherDashboard: React.FC = () => {
	const { user } = useStore();
	const { t } = useTranslation();

	const { data, isLoading } = useQuery({
		queryKey: ["teacherDashboard", user?.id],
		queryFn: async () => {
			if (!user)
				return {
					courses: [] as CourseInfo[],
					upcomingExams: [] as UpcomingExam[],
					stats: {
						totalCourses: 0,
						totalClasses: 0,
						totalStudents: 0,
						totalExams: 0,
					},
				};

			const { items: years } = await trpcClient.academicYears.list.query({});
			const activeYear = years.find((y) => y.isActive);
			if (!activeYear)
				return {
					courses: [] as CourseInfo[],
					upcomingExams: [] as UpcomingExam[],
					stats: {
						totalCourses: 0,
						totalClasses: 0,
						totalStudents: 0,
						totalExams: 0,
					},
				};

			const { items } = await trpcClient.classCourses.list.query({
				teacherId: user.id,
			});
			const courses: CourseInfo[] = [];
			const upcoming: UpcomingExam[] = [];
			let totalStudents = 0;

			for (const cc of items) {
				const klass = await trpcClient.classes.getById.query({ id: cc.class });
				if (klass.academicYear !== activeYear.id) continue;

				const [course, program, students, exams] = await Promise.all([
					trpcClient.courses.getById.query({ id: cc.course }),
					trpcClient.programs.getById.query({ id: klass.program }),
					trpcClient.students.list.query({ classId: klass.id }),
					trpcClient.exams.list.query({
						classCourseId: cc.id,
						dateFrom: new Date(),
					}),
				]);

				const studentCount = students.items.length;
				totalStudents += studentCount;

				courses.push({
					id: cc.id,
					name: course.name,
					class_name: klass.name,
					program_name: program.name,
					upcoming_exams: exams.items.length,
					student_count: studentCount,
					cycle_name: klass.cycle?.name ?? null,
					cycle_code: klass.cycle?.code ?? null,
					cycle_level_name: klass.cycleLevel?.name ?? null,
					cycle_level_code: klass.cycleLevel?.code ?? null,
				});

				exams.items.forEach((exam) => {
					upcoming.push({
						id: exam.id,
						name: exam.name,
						date: exam.date,
						percentage: Number(exam.percentage),
						course_name: course.name,
						class_name: klass.name,
					});
				});
			}

			upcoming.sort(
				(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
			);

			const stats = {
				totalCourses: courses.length,
				totalClasses: new Set(courses.map((c) => c.class_name)).size,
				totalStudents,
				totalExams: courses.reduce((sum, c) => sum + c.upcoming_exams, 0),
			};

			return {
				courses,
				upcomingExams: upcoming.slice(0, 5),
				stats,
			};
		},
		enabled: !!user,
	});

	const courses = data?.courses ?? [];
	const upcomingExams = data?.upcomingExams ?? [];
	const stats =
		data?.stats ??
		({
			totalCourses: 0,
			totalClasses: 0,
			totalStudents: 0,
			totalExams: 0,
		} as const);
	const statCards = [
		{
			label: t("teacher.dashboard.stats.courses"),
			value: stats.totalCourses,
			Icon: BookOpen,
			iconClass: "bg-blue-50 text-blue-600",
		},
		{
			label: t("teacher.dashboard.stats.classes"),
			value: stats.totalClasses,
			Icon: Users,
			iconClass: "bg-emerald-50 text-emerald-600",
		},
		{
			label: t("teacher.dashboard.stats.students"),
			value: stats.totalStudents,
			Icon: Users,
			iconClass: "bg-purple-50 text-purple-600",
		},
		{
			label: t("teacher.dashboard.stats.exams"),
			value: stats.totalExams,
			Icon: ClipboardList,
			iconClass: "bg-amber-50 text-amber-600",
		},
	];

	if (isLoading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<Spinner className="h-10 w-10 text-primary" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div>
				<h2 className="font-bold text-2xl text-foreground">
					{t("teacher.dashboard.title")}
				</h2>
				<p className="text-muted-foreground">
					{t("teacher.dashboard.subtitle", {
						name: `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim(),
					})}
				</p>
			</div>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
				{statCards.map((stat) => (
					<Card key={stat.label}>
						<CardContent className="flex items-center gap-4">
							<div
								className={`rounded-full p-3 ${stat.iconClass} [&_svg]:h-6 [&_svg]:w-6`}
							>
								<stat.Icon className="h-6 w-6" />
							</div>
							<div>
								<p className="text-muted-foreground text-sm">{stat.label}</p>
								<p className="font-semibold text-2xl text-foreground">
									{stat.value}
								</p>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				<Card className="lg:col-span-2">
					<CardHeader className="border-b pb-4">
						<CardTitle>{t("teacher.dashboard.courses.title")}</CardTitle>
					</CardHeader>
					<CardContent className="divide-y">
						{courses.length === 0 ? (
							<div className="flex flex-col items-center gap-3 py-10 text-center">
								<BookOpen className="h-12 w-12 text-muted-foreground/60" />
								<div>
									<p className="font-medium text-foreground text-lg">
										{t("teacher.dashboard.courses.empty.title")}
									</p>
									<p className="text-muted-foreground text-sm">
										{t("teacher.dashboard.courses.empty.description")}
									</p>
								</div>
							</div>
						) : (
							courses.map((course) => (
								<Link
									key={course.id}
									to={`/teacher/grades/${course.id}`}
									className="block px-2 py-4 transition hover:bg-muted/50"
								>
									<div className="flex items-center justify-between gap-4">
										<div>
											<p className="font-medium text-base text-foreground">
												{course.name}
											</p>
											<p className="text-muted-foreground text-sm">
												{course.class_name} • {course.program_name}
											</p>
											{(course.cycle_name || course.cycle_level_name) && (
												<div className="mt-1 flex flex-wrap gap-2 text-xs">
													{course.cycle_name && (
														<Badge variant="outline">
															{course.cycle_name}
															{course.cycle_code
																? ` (${course.cycle_code})`
																: ""}
														</Badge>
													)}
													{course.cycle_level_name && (
														<Badge variant="secondary">
															{course.cycle_level_name}
															{course.cycle_level_code
																? ` (${course.cycle_level_code})`
																: ""}
														</Badge>
													)}
												</div>
											)}
										</div>
										<div className="flex items-center gap-4 text-muted-foreground text-sm">
											<span className="flex items-center gap-1">
												<Users className="h-4 w-4" /> {course.student_count}
											</span>
											<span className="flex items-center gap-1">
												<ClipboardList className="h-4 w-4" />{" "}
												{course.upcoming_exams}
											</span>
											<span className="font-medium text-primary">
												{t("teacher.dashboard.courses.view")}
											</span>
										</div>
									</div>
								</Link>
							))
						)}
					</CardContent>
					<CardFooter className="border-t">
						<Button variant="link" className="px-0" asChild>
							<Link to="/teacher/courses">
								{t("teacher.dashboard.courses.viewAll")}
							</Link>
						</Button>
					</CardFooter>
				</Card>

				<Card>
					<CardHeader className="border-b pb-4">
						<CardTitle>{t("teacher.dashboard.exams.title")}</CardTitle>
					</CardHeader>
					<CardContent className="divide-y">
						{upcomingExams.length === 0 ? (
							<div className="flex flex-col items-center gap-3 py-10 text-center">
								<Calendar className="h-12 w-12 text-muted-foreground/60" />
								<div>
									<p className="font-medium text-foreground text-lg">
										{t("teacher.dashboard.exams.empty.title")}
									</p>
									<p className="text-muted-foreground text-sm">
										{t("teacher.dashboard.exams.empty.description")}
									</p>
								</div>
							</div>
						) : (
							upcomingExams.map((exam) => (
								<div key={exam.id} className="px-2 py-3">
									<div className="flex items-center justify-between gap-3">
										<div>
											<p className="font-medium text-base text-foreground">
												{exam.name}
											</p>
											<p className="text-muted-foreground text-sm">
												{exam.course_name} • {exam.class_name}
											</p>
										</div>
										<Badge variant="outline" className="text-primary">
											{t("teacher.dashboard.exams.percentage", {
												value: exam.percentage,
											})}
										</Badge>
									</div>
									<div className="mt-2 flex items-center text-muted-foreground text-sm">
										<Clock className="mr-1 h-4 w-4" />
										{format(new Date(exam.date), "MMMM d, yyyy")}
									</div>
								</div>
							))
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
};

export default TeacherDashboard;
