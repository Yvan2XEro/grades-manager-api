import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
	BookOpen,
	Calendar,
	ChevronRight,
	ClipboardList,
	Clock,
	Users,
} from "lucide-react";
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
	isDelegated?: boolean;
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
					isDelegated: cc.isDelegated,
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
			bgColor: "bg-blue-50",
			iconColor: "text-blue-600",
		},
		{
			label: t("teacher.dashboard.stats.classes"),
			value: stats.totalClasses,
			Icon: Users,
			bgColor: "bg-emerald-50",
			iconColor: "text-emerald-600",
		},
		{
			label: t("teacher.dashboard.stats.students"),
			value: stats.totalStudents,
			Icon: Users,
			bgColor: "bg-violet-50",
			iconColor: "text-violet-600",
		},
		{
			label: t("teacher.dashboard.stats.exams"),
			value: stats.totalExams,
			Icon: ClipboardList,
			bgColor: "bg-amber-50",
			iconColor: "text-amber-600",
		},
	];

	if (isLoading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<Spinner className="h-8 w-8 text-primary" />
			</div>
		);
	}

	return (
		<div className="space-y-8">
			{/* Header */}
			<div>
				<h1 className="font-heading font-bold text-2xl text-foreground">
					{t("teacher.dashboard.title")}
				</h1>
				<p className="mt-1 text-muted-foreground text-sm">
					{t("teacher.dashboard.subtitle", {
						name: `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim(),
					})}
				</p>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
				{statCards.map((stat) => (
					<Card key={stat.label} className="border-0 shadow-sm">
						<CardContent className="flex items-center gap-4 p-5">
							<div
								className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${stat.bgColor} ${stat.iconColor}`}
							>
								<stat.Icon className="h-5 w-5" />
							</div>
							<div>
								<p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
									{stat.label}
								</p>
								<p className="font-heading font-bold text-2xl text-foreground tabular-nums">
									{stat.value}
								</p>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Content Grid */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				{/* Courses */}
				<Card className="border-0 shadow-sm lg:col-span-2">
					<CardHeader className="pb-3">
						<CardTitle className="text-lg">
							{t("teacher.dashboard.courses.title")}
						</CardTitle>
					</CardHeader>
					<CardContent className="p-0">
						{courses.length === 0 ? (
							<div className="flex flex-col items-center gap-3 p-10 text-center">
								<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
									<BookOpen className="h-6 w-6 text-muted-foreground" />
								</div>
								<div>
									<p className="font-medium text-foreground">
										{t("teacher.dashboard.courses.empty.title")}
									</p>
									<p className="text-muted-foreground text-sm">
										{t("teacher.dashboard.courses.empty.description")}
									</p>
								</div>
							</div>
						) : (
							<div className="divide-y">
								{courses.map((course) => (
									<Link
										key={course.id}
										to={`/teacher/grades/${course.id}`}
										className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-muted/50"
									>
										<div className="min-w-0 flex-1">
											<div className="flex items-start justify-between gap-3">
												<div className="min-w-0">
													<p className="truncate font-medium text-foreground">
														{course.name}
													</p>
													<p className="text-muted-foreground text-sm">
														{course.class_name} &middot;{" "}
														{course.program_name}
													</p>
												</div>
												{course.isDelegated && (
													<Badge variant="secondary" className="shrink-0">
														{t("teacher.courses.delegatedBadge", {
															defaultValue: "Delegated",
														})}
													</Badge>
												)}
											</div>
											{(course.cycle_name || course.cycle_level_name) && (
												<div className="mt-2 flex flex-wrap gap-1.5">
													{course.cycle_name && (
														<Badge variant="outline" className="text-xs">
															{course.cycle_name}
															{course.cycle_code
																? ` (${course.cycle_code})`
																: ""}
														</Badge>
													)}
													{course.cycle_level_name && (
														<Badge variant="secondary" className="text-xs">
															{course.cycle_level_name}
															{course.cycle_level_code
																? ` (${course.cycle_level_code})`
																: ""}
														</Badge>
													)}
												</div>
											)}
										</div>
										<div className="flex shrink-0 items-center gap-4 text-muted-foreground text-sm">
											<span className="flex items-center gap-1 tabular-nums">
												<Users className="h-3.5 w-3.5" />{" "}
												{course.student_count}
											</span>
											<span className="flex items-center gap-1 tabular-nums">
												<ClipboardList className="h-3.5 w-3.5" />{" "}
												{course.upcoming_exams}
											</span>
											<ChevronRight className="h-4 w-4 text-muted-foreground/50" />
										</div>
									</Link>
								))}
							</div>
						)}
					</CardContent>
					{courses.length > 0 && (
						<CardFooter className="border-t px-6 py-3">
							<Button variant="link" className="h-auto p-0 text-primary" asChild>
								<Link to="/teacher/courses">
									{t("teacher.dashboard.courses.viewAll")}
								</Link>
							</Button>
						</CardFooter>
					)}
				</Card>

				{/* Upcoming Exams */}
				<Card className="border-0 shadow-sm">
					<CardHeader className="pb-3">
						<CardTitle className="text-lg">
							{t("teacher.dashboard.exams.title")}
						</CardTitle>
					</CardHeader>
					<CardContent className="p-0">
						{upcomingExams.length === 0 ? (
							<div className="flex flex-col items-center gap-3 p-10 text-center">
								<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
									<Calendar className="h-6 w-6 text-muted-foreground" />
								</div>
								<div>
									<p className="font-medium text-foreground">
										{t("teacher.dashboard.exams.empty.title")}
									</p>
									<p className="text-muted-foreground text-sm">
										{t("teacher.dashboard.exams.empty.description")}
									</p>
								</div>
							</div>
						) : (
							<div className="divide-y">
								{upcomingExams.map((exam) => (
									<div key={exam.id} className="px-6 py-4">
										<div className="flex items-start justify-between gap-3">
											<div className="min-w-0">
												<p className="truncate font-medium text-foreground text-sm">
													{exam.name}
												</p>
												<p className="text-muted-foreground text-xs">
													{exam.course_name} &middot; {exam.class_name}
												</p>
											</div>
											<Badge
												variant="outline"
												className="shrink-0 border-primary/20 bg-primary/5 text-primary"
											>
												{t("teacher.dashboard.exams.percentage", {
													value: exam.percentage,
												})}
											</Badge>
										</div>
										<div className="mt-2 flex items-center text-muted-foreground text-xs">
											<Clock className="mr-1.5 h-3.5 w-3.5" />
											{format(new Date(exam.date), "MMMM d, yyyy")}
										</div>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
};

export default TeacherDashboard;
