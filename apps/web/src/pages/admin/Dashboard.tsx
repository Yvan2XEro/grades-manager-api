import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
	ArrowUpRight,
	BookOpen,
	Building2,
	Calendar,
	CalendarDays,
	CheckCircle2,
	ClipboardCheck,
	ClipboardList,
	GraduationCap,
	School,
	TrendingUp,
	UserPlus,
	Users,
} from "lucide-react";
import type React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnimatedCounter } from "@/hooks/useAnimatedCounter";
import { fadeUp, staggerContainer, staggerItem } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { trpcClient } from "../../utils/trpc";

/* ─── Types ──────────────────────────────────────────── */

type StatCardData = {
	key: string;
	count: number;
	icon: React.ReactNode;
	gradient: string;
	iconColor: string;
	href: string;
};

type ProgramStats = { name: string; students: number };
type EnrollmentStatus = { name: string; value: number; color: string };

/* ─── Animated stat card ─────────────────────────────── */

function StatCard({ stat, label }: { stat: StatCardData; label: string }) {
	const count = useAnimatedCounter(stat.count);
	return (
		<motion.div variants={staggerItem} whileHover={{ y: -3 }} transition={{ duration: 0.15 }}>
			<Link to={stat.href}>
				<Card className="group cursor-pointer border-0 shadow-sm transition-all duration-200 hover:shadow-lg">
					<CardContent className="flex items-center gap-4 p-5">
						<div
							className={cn(
								"flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-110",
								stat.gradient,
								stat.iconColor,
							)}
						>
							{stat.icon}
						</div>
						<div className="min-w-0 flex-1">
							<p className="truncate font-medium text-muted-foreground text-xs uppercase tracking-wide">
								{label}
							</p>
							<p className="animate-counter-in font-bold font-heading text-2xl text-foreground tabular-nums leading-tight">
								{count.toLocaleString()}
							</p>
						</div>
						<ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground/30 transition-all duration-200 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
					</CardContent>
				</Card>
			</Link>
		</motion.div>
	);
}

/* ─── Skeleton loading ───────────────────────────────── */

function DashboardSkeleton() {
	return (
		<div className="page-enter space-y-8">
			<div className="flex items-center justify-between">
				<div className="space-y-2">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-4 w-64" />
				</div>
				<Skeleton className="h-10 w-40 rounded-lg" />
			</div>
			<div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
				{Array.from({ length: 6 }).map((_, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
					<Skeleton key={i} className="h-24 rounded-xl" />
				))}
			</div>
			<div className="grid gap-6 lg:grid-cols-5">
				<Skeleton className="h-80 rounded-xl lg:col-span-3" />
				<Skeleton className="h-80 rounded-xl lg:col-span-2" />
			</div>
			<Skeleton className="h-56 rounded-xl" />
		</div>
	);
}

/* ─── Custom donut label ─────────────────────────────── */

const RADIAN = Math.PI / 180;

// Lowercase name prevents React Compiler from treating this as a component
// (Recharts calls it as a plain function, not via React.createElement)
const renderPieLabel = ({
	cx,
	cy,
	midAngle,
	innerRadius,
	outerRadius,
	percent,
}: {
	cx: number;
	cy: number;
	midAngle: number;
	innerRadius: number;
	outerRadius: number;
	percent: number;
}) => {
	if (percent < 0.05) return null;
	const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
	const x = cx + radius * Math.cos(-midAngle * RADIAN);
	const y = cy + radius * Math.sin(-midAngle * RADIAN);
	return (
		<text
			x={x}
			y={y}
			fill="white"
			textAnchor="middle"
			dominantBaseline="central"
			fontSize={12}
			fontWeight={600}
		>
			{`${(percent * 100).toFixed(0)}%`}
		</text>
	);
};

/* ─── Quick actions ──────────────────────────────────── */

const QUICK_ACTIONS = [
	{
		label: "Ajouter un étudiant",
		icon: <UserPlus className="h-4 w-4" />,
		href: "/admin/students",
		color: "text-foreground bg-muted hover:bg-accent hover:text-accent-foreground",
	},
	{
		label: "Planifier un examen",
		icon: <ClipboardCheck className="h-4 w-4" />,
		href: "/admin/exams",
		color: "text-foreground bg-muted hover:bg-accent hover:text-accent-foreground",
	},
	{
		label: "Gérer les inscriptions",
		icon: <ClipboardList className="h-4 w-4" />,
		href: "/admin/enrollments",
		color: "text-foreground bg-muted hover:bg-accent hover:text-accent-foreground",
	},
	{
		label: "Années académiques",
		icon: <CalendarDays className="h-4 w-4" />,
		href: "/admin/academic-years",
		color: "text-foreground bg-muted hover:bg-accent hover:text-accent-foreground",
	},
	{
		label: "Résultats & exports",
		icon: <TrendingUp className="h-4 w-4" />,
		href: "/admin/grade-export",
		color: "text-foreground bg-muted hover:bg-accent hover:text-accent-foreground",
	},
];

/* ─── Exam status badge ──────────────────────────────── */

const examStatusConfig: Record<string, { label: string; className: string }> = {
	draft: { label: "Brouillon", className: "bg-muted text-muted-foreground" },
	open: { label: "Ouvert", className: "bg-primary/10 text-primary" },
	submitted: { label: "Soumis", className: "bg-muted text-foreground border border-border" },
	approved: { label: "Approuvé", className: "bg-primary/20 text-primary" },
	rejected: { label: "Rejeté", className: "bg-destructive/10 text-destructive" },
	closed: { label: "Clôturé", className: "bg-muted text-muted-foreground" },
};

/* ─── Main component ─────────────────────────────────── */

const AdminDashboard: React.FC = () => {
	const { t } = useTranslation();

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
				activeEnrollsRes,
				pendingEnrollsRes,
				completedEnrollsRes,
			] = await Promise.all([
				trpcClient.institutions.list.query({}),
				trpcClient.programs.list.query({}),
				trpcClient.courses.list.query({}),
				trpcClient.exams.list.query({ limit: 100 }),
				trpcClient.students.list.query({}),
				trpcClient.academicYears.list.query({}),
				trpcClient.enrollments.list.query({ status: "active", limit: 500 }).catch(() => ({ items: [] })),
				trpcClient.enrollments.list.query({ status: "pending", limit: 500 }).catch(() => ({ items: [] })),
				trpcClient.enrollments.list.query({ status: "completed", limit: 500 }).catch(() => ({ items: [] })),
			]);

			const programs = programsRes?.items ?? [];
			const activeYear = yearsRes?.items?.find((y) => y.isActive);

			const counts = {
				institutions: institutionsRes?.items?.filter((i) => i.type === "faculty").length ?? 0,
				programs: programs.length,
				courses: coursesRes?.items?.length ?? 0,
				exams: examsRes?.items?.length ?? 0,
				students: studentsRes?.items?.length ?? 0,
				activeEnrollments: activeEnrollsRes?.items?.length ?? 0,
			};

			// Enrollment distribution for donut chart
			const enrollmentStatus: EnrollmentStatus[] = [
				{ name: "Actif", value: activeEnrollsRes?.items?.length ?? 0, color: "var(--chart-2)" },
				{ name: "En attente", value: pendingEnrollsRes?.items?.length ?? 0, color: "var(--chart-3)" },
				{ name: "Terminé", value: completedEnrollsRes?.items?.length ?? 0, color: "var(--chart-1)" },
			].filter((e) => e.value > 0);

			// Program stats (students per program)
			const programStats: ProgramStats[] = activeYear
				? await Promise.all(
						programs.slice(0, 10).map(async (program) => {
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

			// Recent exams (sorted by date desc)
			const recentExams = (examsRes?.items ?? [])
				.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
				.slice(0, 6);

			const statCards: StatCardData[] = [
				{
					key: "institutions",
					count: counts.institutions,
					icon: <Building2 className="h-5 w-5" />,
					gradient: "bg-primary/10",
					iconColor: "text-primary",
					href: "/admin/faculties",
				},
				{
					key: "programs",
					count: counts.programs,
					icon: <School className="h-5 w-5" />,
					gradient: "bg-primary/10",
					iconColor: "text-primary",
					href: "/admin/programs",
				},
				{
					key: "courses",
					count: counts.courses,
					icon: <BookOpen className="h-5 w-5" />,
					gradient: "bg-primary/10",
					iconColor: "text-primary",
					href: "/admin/courses",
				},
				{
					key: "exams",
					count: counts.exams,
					icon: <ClipboardCheck className="h-5 w-5" />,
					gradient: "bg-primary/10",
					iconColor: "text-primary",
					href: "/admin/exams",
				},
				{
					key: "students",
					count: counts.students,
					icon: <Users className="h-5 w-5" />,
					gradient: "bg-primary/10",
					iconColor: "text-primary",
					href: "/admin/students",
				},
				{
					key: "activeEnrollments",
					count: counts.activeEnrollments,
					icon: <GraduationCap className="h-5 w-5" />,
					gradient: "bg-primary/10",
					iconColor: "text-primary",
					href: "/admin/enrollments",
				},
			];

			return {
				statCards,
				programStats,
				enrollmentStatus,
				recentExams,
				activeYear: activeYear?.name,
			};
		},
	});

	if (isLoading) return <DashboardSkeleton />;

	const stats = data?.statCards ?? [];
	const programStats = data?.programStats ?? [];
	const enrollmentStatus = data?.enrollmentStatus ?? [];
	const recentExams = data?.recentExams ?? [];
	const activeYear = data?.activeYear ?? t("admin.dashboard.noActiveYear");

	return (
		<div className="space-y-8">
			{/* ── Page header ──────────────────────────── */}
			<motion.div
				variants={fadeUp}
				initial="hidden"
				animate="visible"
				className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
			>
				<div>
					<h1 className="font-bold text-foreground text-2xl">
						{t("admin.dashboard.title")}
					</h1>
					<p className="mt-1 text-muted-foreground text-sm">
						{t("admin.dashboard.subtitle", {
							defaultValue: "Vue d'ensemble de l'institution",
						})}
					</p>
				</div>
				<motion.div
					whileHover={{ scale: 1.02 }}
					transition={{ duration: 0.15 }}
					className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5"
				>
					<Calendar className="h-4 w-4 text-primary" />
					<span className="font-semibold text-primary text-sm">
						{t("admin.dashboard.activeYear", { year: activeYear })}
					</span>
				</motion.div>
			</motion.div>

			{/* ── KPI cards ────────────────────────────── */}
			<motion.div
				variants={staggerContainer}
				initial="hidden"
				animate="visible"
				className="grid grid-cols-2 gap-4 lg:grid-cols-3"
			>
				{stats.map((stat) => (
					<StatCard
						key={stat.key}
						stat={stat}
						label={t(`admin.dashboard.stats.${stat.key}`, {
							defaultValue: stat.key,
						})}
					/>
				))}
			</motion.div>

			{/* ── Charts row ───────────────────────────── */}
			<motion.div
				initial={{ opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.3, duration: 0.45, ease: "easeOut" }}
				className="grid gap-6 lg:grid-cols-5"
			>
				{/* Bar chart: students per program */}
				<Card className="border-0 shadow-sm lg:col-span-3">
					<CardHeader className="pb-2">
						<div className="flex items-center gap-2">
							<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
								<School className="h-4 w-4 text-primary" />
							</div>
							<div>
								<CardTitle className="text-base">
									{t("admin.dashboard.programStats.title")}
								</CardTitle>
								<p className="text-muted-foreground text-xs">
									{t("admin.dashboard.programStats.subtitle", {
										defaultValue: "Étudiants inscrits par filière",
									})}
								</p>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<div className="h-64">
							{programStats.length > 0 ? (
								<ResponsiveContainer width="100%" height="100%">
									<BarChart
										data={programStats}
										margin={{ top: 4, right: 16, left: 0, bottom: 60 }}
									>
										<defs>
											<linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
												<stop offset="0%" stopColor="var(--primary)" stopOpacity={0.9} />
												<stop offset="100%" stopColor="var(--primary)" stopOpacity={0.5} />
											</linearGradient>
										</defs>
										<CartesianGrid
											strokeDasharray="3 3"
											vertical={false}
											stroke="var(--border)"
										/>
										<XAxis
											dataKey="name"
											angle={-35}
											textAnchor="end"
											height={70}
											tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
											axisLine={false}
											tickLine={false}
										/>
										<YAxis
											tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
											axisLine={false}
											tickLine={false}
											allowDecimals={false}
										/>
										<Tooltip
											contentStyle={{
												borderRadius: "10px",
												border: "1px solid var(--border)",
												boxShadow: "0 8px 20px -4px rgb(0 0 0 / 0.12)",
												fontSize: "13px",
												backgroundColor: "var(--card)",
											}}
											cursor={{ fill: "var(--muted)", opacity: 0.4 }}
										/>
										<Bar
											dataKey="students"
											fill="url(#barGrad)"
											radius={[6, 6, 0, 0]}
											isAnimationActive
											animationDuration={800}
											animationEasing="ease-out"
										/>
									</BarChart>
								</ResponsiveContainer>
							) : (
								<div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
									<School className="h-10 w-10 opacity-30" />
									<p className="text-sm">{t("admin.dashboard.programStats.empty")}</p>
								</div>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Donut chart: enrollment status */}
				<Card className="border-0 shadow-sm lg:col-span-2">
					<CardHeader className="pb-2">
						<div className="flex items-center gap-2">
							<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
								<CheckCircle2 className="h-4 w-4 text-primary" />
							</div>
							<div>
								<CardTitle className="text-base">Statut des inscriptions</CardTitle>
								<p className="text-muted-foreground text-xs">Répartition par état</p>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						{enrollmentStatus.length > 0 ? (
							<div className="space-y-4">
								<div className="h-48">
									<ResponsiveContainer width="100%" height="100%">
										<PieChart>
											<Pie
												data={enrollmentStatus}
												cx="50%"
												cy="50%"
												innerRadius={45}
												outerRadius={75}
												dataKey="value"
												labelLine={false}
												label={renderPieLabel}
												isAnimationActive
												animationDuration={800}
												animationEasing="ease-out"
											>
												{enrollmentStatus.map((entry) => (
													<Cell key={entry.name} fill={entry.color} />
												))}
											</Pie>
											<Tooltip
												contentStyle={{
													borderRadius: "10px",
													border: "1px solid var(--border)",
													fontSize: "13px",
													backgroundColor: "var(--card)",
												}}
											/>
										</PieChart>
									</ResponsiveContainer>
								</div>

								{/* Legend */}
								<div className="space-y-2">
									{enrollmentStatus.map((entry) => (
										<div key={entry.name} className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												<span
													className="h-3 w-3 rounded-full"
													style={{ backgroundColor: entry.color }}
												/>
												<span className="text-muted-foreground text-xs">{entry.name}</span>
											</div>
											<span className="font-semibold text-foreground text-sm tabular-nums">
												{entry.value.toLocaleString()}
											</span>
										</div>
									))}
								</div>
							</div>
						) : (
							<div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
								<CheckCircle2 className="h-10 w-10 opacity-30" />
								<p className="text-sm">Aucune inscription</p>
							</div>
						)}
					</CardContent>
				</Card>
			</motion.div>

			{/* ── Bottom row ───────────────────────────── */}
			<motion.div
				initial={{ opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.5, duration: 0.45, ease: "easeOut" }}
				className="grid gap-6 lg:grid-cols-5"
			>
				{/* Recent exams */}
				<Card className="border-0 shadow-sm lg:col-span-3">
					<CardHeader className="flex flex-row items-center justify-between pb-3">
						<div className="flex items-center gap-2">
							<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
								<ClipboardCheck className="h-4 w-4 text-muted-foreground" />
							</div>
							<CardTitle className="text-base">Examens récents</CardTitle>
						</div>
						<Link
							to="/admin/exams"
							className="flex items-center gap-1 text-muted-foreground text-xs hover:text-primary transition-colors"
						>
							Voir tout
							<ArrowUpRight className="h-3.5 w-3.5" />
						</Link>
					</CardHeader>
					<CardContent className="p-0">
						{recentExams.length === 0 ? (
							<div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
								<ClipboardList className="h-8 w-8 opacity-30" />
								<p className="text-sm">Aucun examen récent</p>
							</div>
						) : (
							<div className="divide-y">
								{recentExams.map((exam) => {
									const status = exam.status ?? "draft";
									const cfg = examStatusConfig[status] ?? examStatusConfig.draft;
									return (
										<div
											key={exam.id}
											className="flex items-center gap-4 px-6 py-3 transition-colors hover:bg-muted/40"
										>
											<div className="min-w-0 flex-1">
												<p className="truncate font-medium text-foreground text-sm">
													{exam.name}
												</p>
												<p className="truncate text-muted-foreground text-xs">
													{exam.courseName ?? "—"} · {exam.className ?? "—"}
												</p>
											</div>
											<div className="flex shrink-0 items-center gap-3">
												<span
													className={cn(
														"rounded-full px-2 py-0.5 text-[11px] font-medium",
														cfg.className,
													)}
												>
													{cfg.label}
												</span>
												<span className="text-muted-foreground text-xs tabular-nums">
													{new Intl.DateTimeFormat("fr-FR", {
														day: "2-digit",
														month: "short",
													}).format(new Date(exam.date))}
												</span>
											</div>
										</div>
									);
								})}
							</div>
						)}
					</CardContent>
				</Card>

				{/* Quick actions */}
				<Card className="border-0 shadow-sm lg:col-span-2">
					<CardHeader className="pb-3">
						<div className="flex items-center gap-2">
							<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
								<TrendingUp className="h-4 w-4 text-muted-foreground" />
							</div>
							<CardTitle className="text-base">Raccourcis</CardTitle>
						</div>
					</CardHeader>
					<CardContent className="space-y-2">
						{QUICK_ACTIONS.map((action) => (
							<Link
								key={action.href}
								to={action.href}
								className={cn(
									"group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
									action.color,
								)}
							>
								<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/60 shadow-sm transition-transform duration-150 group-hover:scale-110">
									{action.icon}
								</span>
								<span className="flex-1">{action.label}</span>
								<ArrowUpRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
							</Link>
						))}
					</CardContent>
				</Card>
			</motion.div>
		</div>
	);
};

export default AdminDashboard;
