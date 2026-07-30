import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
	ArrowUpRight,
	BarChart3,
	BookOpen,
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
	Wallet,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
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
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnimatedCounter } from "@/hooks/useAnimatedCounter";
import { fadeUp, staggerContainer, staggerItem } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { trpc } from "../../utils/trpc";

/* ─── Types ──────────────────────────────────────────── */

type KpiCard = {
	key: string;
	count: number;
	icon: React.ReactNode;
	gradient: string;
	iconColor: string;
	href: string;
	suffix?: string;
};

/* ─── Animated KPI card ──────────────────────────────── */

function StatCard({ card, label }: { card: KpiCard; label: string }) {
	const count = useAnimatedCounter(card.count);
	return (
		<motion.div
			variants={staggerItem}
			whileHover={{ y: -3 }}
			transition={{ duration: 0.15 }}
		>
			<Link to={card.href}>
				<Card className="group cursor-pointer border-0 shadow-sm transition-all duration-200 hover:shadow-lg">
					<CardContent className="flex items-center gap-4 p-5">
						<div
							className={cn(
								"flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-110",
								card.gradient,
								card.iconColor,
							)}
						>
							{card.icon}
						</div>
						<div className="min-w-0 flex-1">
							<p className="truncate font-medium text-muted-foreground text-xs uppercase tracking-wide">
								{label}
							</p>
							<p className="animate-counter-in font-bold font-heading text-2xl text-foreground tabular-nums leading-tight">
								{count.toLocaleString()}
								{card.suffix && (
									<span className="font-semibold text-base">{card.suffix}</span>
								)}
							</p>
						</div>
						<ArrowUpRight className="group-hover:-translate-y-0.5 h-4 w-4 shrink-0 text-muted-foreground/30 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-primary" />
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
		color:
			"text-foreground bg-muted hover:bg-accent hover:text-accent-foreground",
	},
	{
		label: "Planifier un examen",
		icon: <ClipboardCheck className="h-4 w-4" />,
		href: "/admin/exams",
		color:
			"text-foreground bg-muted hover:bg-accent hover:text-accent-foreground",
	},
	{
		label: "Gérer les inscriptions",
		icon: <ClipboardList className="h-4 w-4" />,
		href: "/admin/classes/enrollments",
		color:
			"text-foreground bg-muted hover:bg-accent hover:text-accent-foreground",
	},
	{
		label: "Années académiques",
		icon: <CalendarDays className="h-4 w-4" />,
		href: "/admin/academic-years",
		color:
			"text-foreground bg-muted hover:bg-accent hover:text-accent-foreground",
	},
	{
		label: "Statistiques détaillées",
		icon: <BarChart3 className="h-4 w-4" />,
		href: "/admin/statistics",
		color:
			"text-foreground bg-muted hover:bg-accent hover:text-accent-foreground",
	},
];

const STATUS_COLORS: Record<string, string> = {
	active: "var(--chart-2)",
	pending: "var(--chart-3)",
	completed: "var(--chart-1)",
	withdrawn: "var(--chart-4)",
};

/* ─── Main component ─────────────────────────────────── */

const AdminDashboard: React.FC = () => {
	const { t } = useTranslation();

	const [yearId, setYearId] = useState<string | null>(null);
	const [yearInitialized, setYearInitialized] = useState(false);

	const yearListQuery = useQuery(trpc.academicYears.list.queryOptions({}));
	useEffect(() => {
		const active = yearListQuery.data?.items.find((y) => y.isActive);
		if (!yearInitialized && active) {
			setYearId(active.id);
			setYearInitialized(true);
		}
	}, [yearListQuery.data, yearInitialized]);

	const yearParam = { academicYearId: yearId ?? undefined };

	const overviewQuery = useQuery(trpc.stats.overview.queryOptions(yearParam));
	const enrollmentQuery = useQuery(
		trpc.stats.enrollmentStats.queryOptions(yearParam),
	);

	const isLoading =
		overviewQuery.isLoading ||
		enrollmentQuery.isLoading ||
		yearListQuery.isLoading;

	if (isLoading) return <DashboardSkeleton />;

	const ov = overviewQuery.data;
	const en = enrollmentQuery.data;

	const activeYearName =
		yearListQuery.data?.items.find((y) => y.id === yearId)?.name ??
		(yearId == null ? t("admin.dashboard.noActiveYear") : "—");

	const kpiCards: KpiCard[] = [
		{
			key: "activeStudents",
			count: ov?.activeStudents ?? 0,
			icon: <Users className="h-5 w-5" />,
			gradient: "bg-primary/10",
			iconColor: "text-primary",
			href: "/admin/students",
		},
		{
			key: "enrollments",
			count: en?.total ?? 0,
			icon: <GraduationCap className="h-5 w-5" />,
			gradient: "bg-primary/10",
			iconColor: "text-primary",
			href: "/admin/classes/enrollments",
		},
		{
			key: "admissionsTotal",
			count: ov?.admissionsTotal ?? 0,
			icon: <School className="h-5 w-5" />,
			gradient: "bg-primary/10",
			iconColor: "text-primary",
			href: "/admin/admissions",
		},
		{
			key: "examsPending",
			count: ov?.examsPending ?? 0,
			icon: <ClipboardCheck className="h-5 w-5" />,
			gradient: "bg-amber-500/10",
			iconColor: "text-amber-600 dark:text-amber-400",
			href: "/admin/exams",
		},
		{
			key: "deliberationsOpen",
			count: ov?.deliberationsOpen ?? 0,
			icon: <BookOpen className="h-5 w-5" />,
			gradient: "bg-blue-500/10",
			iconColor: "text-blue-600 dark:text-blue-400",
			href: "/admin/academic-results/deliberations",
		},
		{
			key: "feeCollectionRate",
			count: ov?.feeCollectionRate ?? 0,
			icon: <Wallet className="h-5 w-5" />,
			gradient: "bg-green-500/10",
			iconColor: "text-green-600 dark:text-green-400",
			href: "/admin/fee-clearance",
			suffix: "%",
		},
	];

	const byProgram = (en?.byProgram ?? []).map((p) => ({
		name: p.programName,
		students: p.count,
	}));
	const byStatus = (en?.byStatus ?? [])
		.filter((s) => s.count > 0)
		.map((s) => ({
			name:
				s.status === "active"
					? "Actif"
					: s.status === "pending"
						? "En attente"
						: s.status === "completed"
							? "Terminé"
							: s.status === "withdrawn"
								? "Retiré"
								: s.status,
			value: s.count,
			color: STATUS_COLORS[s.status] ?? "var(--chart-5)",
		}));

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
					<h1 className="font-bold text-2xl text-foreground">
						{t("admin.dashboard.title")}
					</h1>
					<p className="mt-1 text-muted-foreground text-sm">
						{t("admin.dashboard.subtitle", {
							defaultValue: "Vue d'ensemble de l'institution",
						})}
					</p>
				</div>
				<div className="flex items-center gap-3">
					<motion.div
						whileHover={{ scale: 1.02 }}
						transition={{ duration: 0.15 }}
						className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5"
					>
						<Calendar className="h-4 w-4 text-primary" />
						<span className="font-semibold text-primary text-sm">
							{activeYearName}
						</span>
					</motion.div>
					<div className="w-48">
						<AcademicYearSelect
							value={yearId}
							onChange={setYearId}
							allowAll
							allLabel={t("common.allYears", { defaultValue: "Toutes" })}
							autoSelectActive={false}
						/>
					</div>
				</div>
			</motion.div>

			{/* ── Action needed ────────────────────────── */}
			{((ov?.examsPending ?? 0) > 0 || (ov?.deliberationsOpen ?? 0) > 0) && (
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					className="grid gap-3 sm:grid-cols-2"
				>
					{(ov?.examsPending ?? 0) > 0 && (
						<Link to="/admin/exams/list?status=submitted">
							<div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 transition-colors hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-900/20 dark:hover:bg-amber-900/30">
								<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40">
									<CheckCircle2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
								</div>
								<div className="min-w-0 flex-1">
									<p className="font-semibold text-amber-900 text-sm dark:text-amber-200">
										{ov?.examsPending} examen
										{(ov?.examsPending ?? 0) > 1 ? "s" : ""} en attente
										d'approbation
									</p>
									<p className="mt-0.5 text-amber-700 text-xs dark:text-amber-400">
										Voir les examens soumis →
									</p>
								</div>
							</div>
						</Link>
					)}
					{(ov?.deliberationsOpen ?? 0) > 0 && (
						<Link to="/admin/academic-results/deliberations">
							<div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 transition-colors hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20 dark:hover:bg-blue-900/30">
								<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40">
									<ClipboardList className="h-5 w-5 text-blue-600 dark:text-blue-400" />
								</div>
								<div className="min-w-0 flex-1">
									<p className="font-semibold text-blue-900 text-sm dark:text-blue-200">
										{ov?.deliberationsOpen} délibération
										{(ov?.deliberationsOpen ?? 0) > 1 ? "s" : ""} en cours
									</p>
									<p className="mt-0.5 text-blue-700 text-xs dark:text-blue-400">
										Voir les délibérations →
									</p>
								</div>
							</div>
						</Link>
					)}
				</motion.div>
			)}

			{/* ── KPI cards ────────────────────────────── */}
			<motion.div
				variants={staggerContainer}
				initial="hidden"
				animate="visible"
				className="grid grid-cols-2 gap-4 lg:grid-cols-3"
			>
				{kpiCards.map((card) => (
					<StatCard
						key={card.key}
						card={card}
						label={t(`admin.dashboard.stats.${card.key}`, {
							defaultValue: card.key,
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
							{byProgram.length > 0 ? (
								<ResponsiveContainer width="100%" height="100%">
									<BarChart
										data={byProgram}
										margin={{ top: 4, right: 16, left: 0, bottom: 60 }}
									>
										<defs>
											<linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
												<stop
													offset="0%"
													stopColor="var(--primary)"
													stopOpacity={0.9}
												/>
												<stop
													offset="100%"
													stopColor="var(--primary)"
													stopOpacity={0.5}
												/>
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
									<p className="text-sm">
										{t("admin.dashboard.programStats.empty")}
									</p>
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
								<CardTitle className="text-base">
									Statut des inscriptions
								</CardTitle>
								<p className="text-muted-foreground text-xs">
									Répartition par état
								</p>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						{byStatus.length > 0 ? (
							<div className="space-y-4">
								<div className="h-48">
									<ResponsiveContainer width="100%" height="100%">
										<PieChart>
											<Pie
												data={byStatus}
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
												{byStatus.map((entry) => (
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
								<div className="space-y-2">
									{byStatus.map((entry) => (
										<div
											key={entry.name}
											className="flex items-center justify-between"
										>
											<div className="flex items-center gap-2">
												<span
													className="h-3 w-3 rounded-full"
													style={{ backgroundColor: entry.color }}
												/>
												<span className="text-muted-foreground text-xs">
													{entry.name}
												</span>
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
				{/* Fee clearance summary */}
				<Card className="border-0 shadow-sm lg:col-span-3">
					<CardHeader className="flex flex-row items-center justify-between pb-3">
						<div className="flex items-center gap-2">
							<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
								<Wallet className="h-4 w-4 text-green-600 dark:text-green-400" />
							</div>
							<CardTitle className="text-base">Scolarité</CardTitle>
						</div>
						<Link
							to="/admin/fee-clearance"
							className="flex items-center gap-1 text-muted-foreground text-xs transition-colors hover:text-primary"
						>
							Voir tout
							<ArrowUpRight className="h-3.5 w-3.5" />
						</Link>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-3 gap-4">
							{[
								{
									label: "Attendu",
									value: formatAmount(ov?.feeExpected ?? 0),
									color: "text-foreground",
								},
								{
									label: "Collecté",
									value: formatAmount(ov?.feeCollected ?? 0),
									color: "text-green-600 dark:text-green-400",
								},
								{
									label: "Restant",
									value: formatAmount(ov?.feeOutstanding ?? 0),
									color: "text-destructive",
								},
							].map((item) => (
								<div key={item.label}>
									<p className="text-muted-foreground text-xs">{item.label}</p>
									<p
										className={cn(
											"mt-0.5 font-semibold text-sm tabular-nums",
											item.color,
										)}
									>
										{item.value}
									</p>
								</div>
							))}
						</div>
						<div>
							<div className="mb-1.5 flex items-center justify-between text-xs">
								<span className="text-muted-foreground">Taux de collecte</span>
								<span className="font-semibold">
									{ov?.feeCollectionRate ?? 0}%
								</span>
							</div>
							<div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
								<div
									className="h-full rounded-full bg-green-500 transition-all duration-700"
									style={{
										width: `${Math.min(ov?.feeCollectionRate ?? 0, 100)}%`,
									}}
								/>
							</div>
						</div>
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
									"group flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium text-sm transition-all duration-150",
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

function formatAmount(n: number) {
	return `${new Intl.NumberFormat("fr-FR", {
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(n)} XAF`;
}

export default AdminDashboard;
