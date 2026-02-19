import { useQuery } from "@tanstack/react-query";
import {
	BookOpen,
	Building2,
	Calendar,
	ClipboardCheck,
	GraduationCap,
	School,
	Users,
} from "lucide-react";
import type React from "react";
import { useTranslation } from "react-i18next";
import {
	Bar,
	BarChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { trpcClient } from "../../utils/trpc";

type StatCard = {
	key:
		| "institutions"
		| "programs"
		| "courses"
		| "exams"
		| "students"
		| "teachers";
	count: number;
	icon: JSX.Element;
	bgColor: string;
	iconColor: string;
};

type ProgramStats = {
	name: string;
	students: number;
};

const AdminDashboard: React.FC = () => {
	const { data, isLoading } = useQuery({
		queryKey: ["adminDashboard"],
		queryFn: async () => {
			const [
				institutionsRes,
				programsRes,
				coursesRes,
				examsRes,
				studentsRes,
				yearsRes,
			] = await Promise.all([
				trpcClient.institutions.list.query({}),
				trpcClient.programs.list.query({}),
				trpcClient.courses.list.query({}),
				trpcClient.exams.list.query({}),
				trpcClient.students.list.query({}),
				trpcClient.academicYears.list.query({}),
			]);

			const programs = programsRes?.items ?? [];
			const institutionsCount =
				institutionsRes?.items?.filter((i) => i.type === "faculty").length ?? 0;
			const programsCount = programs.length;
			const coursesCount = coursesRes?.items?.length ?? 0;
			const examsCount = examsRes?.items?.length ?? 0;
			const studentsCount = studentsRes?.items?.length ?? 0;
			const teachersCount = 0;

			const activeYear = yearsRes?.items?.find((y) => y.isActive);

			const programStats: ProgramStats[] = activeYear
				? await Promise.all(
						programs.map(async (program) => {
							const { items: classes } = await trpcClient.classes.list.query({
								programId: program.id,
								academicYearId: activeYear.id,
							});
							let total = 0;
							for (const cls of classes) {
								const { items: studs } = await trpcClient.students.list.query({
									classId: cls.id,
								});
								total += studs.length;
							}
							return { name: program.name, students: total };
						}),
					)
				: [];

			const stats: StatCard[] = [
				{
					key: "institutions",
					count: institutionsCount,
					icon: <Building2 className="h-5 w-5" />,
					bgColor: "bg-gradient-to-br from-blue-50 to-blue-100/50",
					iconColor: "text-blue-600",
				},
				{
					key: "programs",
					count: programsCount,
					icon: <School className="h-5 w-5" />,
					bgColor: "bg-gradient-to-br from-violet-50 to-violet-100/50",
					iconColor: "text-violet-600",
				},
				{
					key: "courses",
					count: coursesCount,
					icon: <BookOpen className="h-5 w-5" />,
					bgColor: "bg-gradient-to-br from-emerald-50 to-emerald-100/50",
					iconColor: "text-emerald-600",
				},
				{
					key: "exams",
					count: examsCount,
					icon: <ClipboardCheck className="h-5 w-5" />,
					bgColor: "bg-gradient-to-br from-amber-50 to-amber-100/50",
					iconColor: "text-amber-600",
				},
				{
					key: "students",
					count: studentsCount,
					icon: <Users className="h-5 w-5" />,
					bgColor: "bg-gradient-to-br from-rose-50 to-rose-100/50",
					iconColor: "text-rose-600",
				},
				{
					key: "teachers",
					count: teachersCount,
					icon: <GraduationCap className="h-5 w-5" />,
					bgColor: "bg-gradient-to-br from-indigo-50 to-indigo-100/50",
					iconColor: "text-indigo-600",
				},
			];

			return {
				stats,
				activeYear: activeYear?.name,
				programStats,
			};
		},
	});

	const { t } = useTranslation();

	if (isLoading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<Spinner className="h-8 w-8 text-primary" />
			</div>
		);
	}

	const stats = data?.stats || [];
	const programStats = data?.programStats ?? [];
	const activeYear = data?.activeYear ?? t("admin.dashboard.noActiveYear");

	return (
		<div className="space-y-8">
			{/* Page Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="font-heading font-bold text-2xl text-foreground">
						{t("admin.dashboard.title")}
					</h1>
					<p className="mt-1 text-muted-foreground text-sm">
						{t("admin.dashboard.subtitle", {
							defaultValue: "Overview of your academic institution",
						})}
					</p>
				</div>
				<div className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2">
					<Calendar className="h-4 w-4 text-primary" />
					<span className="font-medium text-primary text-sm">
						{t("admin.dashboard.activeYear", { year: activeYear })}
					</span>
				</div>
			</div>

			{/* Stats Grid - Bento style */}
			<div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
				{stats.map((stat) => (
					<Card
						key={stat.key}
						className="border-0 shadow-sm transition-shadow hover:shadow-md"
					>
						<CardContent className="flex items-center gap-4 p-5">
							<div
								className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${stat.bgColor} ${stat.iconColor}`}
							>
								{stat.icon}
							</div>
							<div className="min-w-0">
								<p className="truncate text-muted-foreground text-xs font-medium uppercase tracking-wide">
									{t(`admin.dashboard.stats.${stat.key}`)}
								</p>
								<p className="font-heading font-bold text-2xl text-foreground tabular-nums">
									{stat.count}
								</p>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Program Stats Chart */}
			<Card className="border-0 shadow-sm">
				<CardHeader>
					<CardTitle className="text-lg">
						{t("admin.dashboard.programStats.title")}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="h-80">
						{programStats.length > 0 ? (
							<ResponsiveContainer width="100%" height="100%">
								<BarChart
									data={programStats}
									margin={{ top: 10, right: 20, left: 0, bottom: 60 }}
								>
									<CartesianGrid
										strokeDasharray="3 3"
										vertical={false}
										stroke="var(--border)"
									/>
									<XAxis
										dataKey="name"
										angle={-45}
										textAnchor="end"
										height={80}
										tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
										axisLine={false}
										tickLine={false}
									/>
									<YAxis
										tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
										axisLine={false}
										tickLine={false}
									/>
									<Tooltip
										contentStyle={{
											borderRadius: "8px",
											border: "1px solid var(--border)",
											boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
											fontSize: "13px",
										}}
									/>
									<Bar
										dataKey="students"
										fill="var(--primary)"
										radius={[6, 6, 0, 0]}
									/>
								</BarChart>
							</ResponsiveContainer>
						) : (
							<div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
								<School className="h-10 w-10 opacity-40" />
								<p className="text-sm">
									{t("admin.dashboard.programStats.empty")}
								</p>
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

export default AdminDashboard;
