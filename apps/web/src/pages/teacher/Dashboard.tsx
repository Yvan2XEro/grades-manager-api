import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { BookOpen, Calendar, ClipboardList, Clock, Users } from "lucide-react";
import type React from "react";
import { Link } from "react-router-dom";
import { useStore } from "../../store";
import { trpcClient } from "../../utils/trpc";

type CourseInfo = {
	id: string;
	name: string;
	class_name: string;
	program_name: string;
	upcoming_exams: number;
	student_count: number;
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

	if (isLoading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<div className="h-12 w-12 animate-spin rounded-full border-primary-600 border-t-2 border-b-2" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div>
				<h2 className="font-bold text-2xl text-gray-800">Teacher Dashboard</h2>
				<p className="text-gray-600">
					Welcome back, {user?.firstName} {user?.lastName}
				</p>
			</div>

			{/* Stats Grid */}
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
				<div className="rounded-xl bg-white p-6 shadow-sm transition-all hover:shadow-md">
					<div className="flex items-center">
						<div className="rounded-full bg-blue-100 p-3 text-blue-600">
							<BookOpen className="h-6 w-6" />
						</div>
						<div className="ml-4">
							<h3 className="font-medium text-gray-600 text-sm">My Courses</h3>
							<p className="font-bold text-2xl text-gray-900">
								{stats.totalCourses}
							</p>
						</div>
					</div>
				</div>

				<div className="rounded-xl bg-white p-6 shadow-sm transition-all hover:shadow-md">
					<div className="flex items-center">
						<div className="rounded-full bg-emerald-100 p-3 text-emerald-600">
							<Users className="h-6 w-6" />
						</div>
						<div className="ml-4">
							<h3 className="font-medium text-gray-600 text-sm">Classes</h3>
							<p className="font-bold text-2xl text-gray-900">
								{stats.totalClasses}
							</p>
						</div>
					</div>
				</div>

				<div className="rounded-xl bg-white p-6 shadow-sm transition-all hover:shadow-md">
					<div className="flex items-center">
						<div className="rounded-full bg-purple-100 p-3 text-purple-600">
							<Users className="h-6 w-6" />
						</div>
						<div className="ml-4">
							<h3 className="font-medium text-gray-600 text-sm">Students</h3>
							<p className="font-bold text-2xl text-gray-900">
								{stats.totalStudents}
							</p>
						</div>
					</div>
				</div>

				<div className="rounded-xl bg-white p-6 shadow-sm transition-all hover:shadow-md">
					<div className="flex items-center">
						<div className="rounded-full bg-amber-100 p-3 text-amber-600">
							<ClipboardList className="h-6 w-6" />
						</div>
						<div className="ml-4">
							<h3 className="font-medium text-gray-600 text-sm">Exams</h3>
							<p className="font-bold text-2xl text-gray-900">
								{stats.totalExams}
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				{/* My Courses */}
				<div className="overflow-hidden rounded-xl bg-white shadow-sm lg:col-span-2">
					<div className="border-gray-200 border-b px-6 py-4">
						<h3 className="font-medium text-gray-800 text-lg">My Courses</h3>
					</div>

					<div className="divide-y divide-gray-200">
						{courses.length === 0 ? (
							<div className="p-6 text-center">
								<BookOpen className="mx-auto h-12 w-12 text-gray-400" />
								<h3 className="mt-2 font-medium text-gray-700 text-lg">
									No courses found
								</h3>
								<p className="mt-1 text-gray-500">
									You have no assigned courses for the active academic year.
								</p>
							</div>
						) : (
							courses.map((course) => (
								<div key={course.id} className="p-4 hover:bg-gray-50">
									<Link to={`/teacher/grades/${course.id}`} className="block">
										<div className="flex items-center justify-between">
											<div>
												<h4 className="font-medium text-base text-gray-900">
													{course.name}
												</h4>
												<p className="text-gray-600 text-sm">
													{course.class_name} • {course.program_name}
												</p>
											</div>
											<div className="flex items-center space-x-3 text-sm">
												<span className="flex items-center text-gray-600">
													<Users className="mr-1 h-4 w-4" />
													{course.student_count}
												</span>
												<span className="flex items-center text-gray-600">
													<ClipboardList className="mr-1 h-4 w-4" />
													{course.upcoming_exams}
												</span>
												<span className="ml-2 font-medium text-primary-700 hover:text-primary-800">
													View &rarr;
												</span>
											</div>
										</div>
									</Link>
								</div>
							))
						)}
					</div>

					<div className="border-gray-200 border-t bg-gray-50 px-6 py-4">
						<Link
							to="/teacher/courses"
							className="font-medium text-primary-700 text-sm hover:text-primary-800"
						>
							View all courses &rarr;
						</Link>
					</div>
				</div>

				{/* Upcoming Exams */}
				<div className="overflow-hidden rounded-xl bg-white shadow-sm">
					<div className="border-gray-200 border-b px-6 py-4">
						<h3 className="font-medium text-gray-800 text-lg">
							Upcoming Exams
						</h3>
					</div>

					<div className="divide-y divide-gray-200">
						{upcomingExams.length === 0 ? (
							<div className="p-6 text-center">
								<Calendar className="mx-auto h-12 w-12 text-gray-400" />
								<h3 className="mt-2 font-medium text-gray-700 text-lg">
									No upcoming exams
								</h3>
								<p className="mt-1 text-gray-500">
									You have no scheduled exams coming up.
								</p>
							</div>
						) : (
							upcomingExams.map((exam) => (
								<div key={exam.id} className="p-4 hover:bg-gray-50">
									<div>
										<div className="flex items-center justify-between">
											<h4 className="font-medium text-base text-gray-900">
												{exam.name}
											</h4>
											<span className="rounded-full bg-primary-50 px-2 py-1 text-primary-700 text-sm">
												{exam.percentage}%
											</span>
										</div>
										<p className="mt-1 text-gray-600 text-sm">
											{exam.course_name} • {exam.class_name}
										</p>
										<div className="mt-2 flex items-center text-gray-500 text-sm">
											<Clock className="mr-1 h-4 w-4" />
											<span>{format(new Date(exam.date), "MMMM d, yyyy")}</span>
										</div>
									</div>
								</div>
							))
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default TeacherDashboard;
