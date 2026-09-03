import { Building2, ShieldAlert, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import {
	Area,
	AreaChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatDate(d: string | Date, locale: string) {
	return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-GB", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	}).format(new Date(d));
}

const TYPE_COLORS: Record<string, string> = {
	lycee: "bg-blue-500/10 text-blue-600",
	college: "bg-violet-500/10 text-violet-600",
	mixed: "bg-amber-500/10 text-amber-600",
};

// ─── KPI card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
	label: string;
	value: number | string | undefined;
	icon: React.ReactNode;
	accent: string;
	to?: string;
}

function StatCard({ label, value, icon, accent, to }: StatCardProps) {
	const inner = (
		<div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:bg-muted/30">
			<div
				className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg ${accent}`}
			>
				{icon}
			</div>
			<div>
				<p className="text-muted-foreground text-xs uppercase tracking-wide">
					{label}
				</p>
				{value === undefined ? (
					<Skeleton className="mt-1 h-7 w-16" />
				) : (
					<p className="font-bold text-2xl text-card-foreground leading-tight">
						{value}
					</p>
				)}
			</div>
		</div>
	);
	return to ? <Link to={to}>{inner}</Link> : inner;
}

// ─── Growth chart ─────────────────────────────────────────────────────────────

function mergeTimeSeries(
	institutions: { month: string; count: number }[],
	users: { month: string; count: number }[],
) {
	const months = new Set([
		...institutions.map((r) => r.month),
		...users.map((r) => r.month),
	]);
	const sorted = [...months].sort();
	return sorted.map((month) => ({
		month: month.slice(5), // "YYYY-MM" → "MM"
		institutions: institutions.find((r) => r.month === month)?.count ?? 0,
		users: users.find((r) => r.month === month)?.count ?? 0,
	}));
}

function GrowthChart() {
	const { t } = useTranslation();
	const { data, isLoading } = trpc.systemAdmin.globalTimeSeries.useQuery();

	if (isLoading) return <Skeleton className="h-48 w-full rounded-xl" />;

	const chartData = data ? mergeTimeSeries(data.institutions, data.users) : [];

	if (chartData.length === 0) {
		return (
			<div className="flex h-48 items-center justify-center text-muted-foreground text-sm">
				{t("sysadmin.overview.no_growth_data", "No growth data yet")}
			</div>
		);
	}

	return (
		<ResponsiveContainer width="100%" height={200}>
			<AreaChart
				data={chartData}
				margin={{ top: 4, right: 8, bottom: 0, left: -20 }}
			>
				<defs>
					<linearGradient id="colorInst" x1="0" y1="0" x2="0" y2="1">
						<stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
						<stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
					</linearGradient>
					<linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
						<stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
						<stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
					</linearGradient>
				</defs>
				<CartesianGrid strokeDasharray="3 3" className="stroke-border" />
				<XAxis
					dataKey="month"
					tick={{ fontSize: 11 }}
					className="text-muted-foreground"
				/>
				<YAxis
					allowDecimals={false}
					tick={{ fontSize: 11 }}
					className="text-muted-foreground"
				/>
				<Tooltip
					contentStyle={{
						borderRadius: 8,
						border: "1px solid hsl(var(--border))",
						background: "hsl(var(--popover))",
						color: "hsl(var(--popover-foreground))",
						fontSize: 12,
					}}
				/>
				<Area
					type="monotone"
					dataKey="institutions"
					name={t("sysadmin.nav.institutions", "Institutions")}
					stroke="#3b82f6"
					strokeWidth={2}
					fill="url(#colorInst)"
				/>
				<Area
					type="monotone"
					dataKey="users"
					name={t("sysadmin.nav.users", "Users")}
					stroke="#8b5cf6"
					strokeWidth={2}
					fill="url(#colorUsers)"
				/>
			</AreaChart>
		</ResponsiveContainer>
	);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function SysAdminOverview() {
	const { t, i18n } = useTranslation();
	const { data: stats } = trpc.systemAdmin.stats.useQuery();
	const { data: recent, isLoading: recentLoading } =
		trpc.systemAdmin.listInstitutions.useQuery({
			page: 1,
			pageSize: 8,
		});

	const typeLabels: Record<string, string> = {
		lycee: t("sysadmin.institutions.type_lycee", "Lycée"),
		college: t("sysadmin.institutions.type_college", "Collège"),
		mixed: t("sysadmin.institutions.type_mixed", "Mixed"),
	};

	return (
		<div className="space-y-6">
			<div>
				<h1 className="font-bold text-2xl text-foreground">
					{t("sysadmin.overview.title", "Overview")}
				</h1>
				<p className="text-muted-foreground text-sm">
					{t("sysadmin.overview.subtitle", "Platform health at a glance")}
				</p>
			</div>

			{/* KPI row */}
			<div className="grid gap-4 sm:grid-cols-3">
				<StatCard
					label={t("sysadmin.overview.institutions", "Institutions")}
					value={stats?.institutions}
					icon={<Building2 className="h-5 w-5" />}
					accent="bg-blue-500/10 text-blue-600"
					to="/sysadmin/institutions"
				/>
				<StatCard
					label={t("sysadmin.overview.users", "Users")}
					value={stats?.users}
					icon={<Users className="h-5 w-5" />}
					accent="bg-violet-500/10 text-violet-600"
					to="/sysadmin/users"
				/>
				<StatCard
					label={t("sysadmin.overview.banned_users", "Banned users")}
					value={stats?.bannedUsers}
					icon={<ShieldAlert className="h-5 w-5" />}
					accent="bg-rose-500/10 text-rose-600"
					to="/sysadmin/users"
				/>
			</div>

			{/* Growth chart */}
			<div className="overflow-hidden rounded-xl border border-border bg-card p-5">
				<div className="mb-4 flex items-center justify-between">
					<h2 className="font-semibold text-base text-card-foreground">
						{t("sysadmin.overview.growth_chart", "Growth (last 12 months)")}
					</h2>
					<div className="flex items-center gap-4 text-muted-foreground text-xs">
						<span className="flex items-center gap-1.5">
							<span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-500" />
							{t("sysadmin.nav.institutions", "Institutions")}
						</span>
						<span className="flex items-center gap-1.5">
							<span className="inline-block h-2.5 w-2.5 rounded-full bg-violet-500" />
							{t("sysadmin.nav.users", "Users")}
						</span>
					</div>
				</div>
				<GrowthChart />
			</div>

			{/* Recent institutions */}
			<div className="overflow-hidden rounded-xl border border-border bg-card">
				<div className="flex items-center justify-between border-border border-b px-5 py-4">
					<h2 className="font-semibold text-base text-card-foreground">
						{t("sysadmin.overview.recent_institutions", "Recent Institutions")}
					</h2>
					<Link
						to="/sysadmin/institutions"
						className="text-primary text-xs hover:underline"
					>
						{t("sysadmin.overview.view_all", "View all →")}
					</Link>
				</div>

				{recentLoading ? (
					<div className="space-y-px">
						{Array.from({ length: 5 }, (_, i) => (
							<div key={i} className="flex items-center gap-4 px-5 py-3">
								<Skeleton className="h-4 w-48" />
								<Skeleton className="h-5 w-14 rounded-full" />
								<Skeleton className="h-4 w-20" />
								<Skeleton className="ml-auto h-5 w-14 rounded-full" />
							</div>
						))}
					</div>
				) : !recent || recent.rows.length === 0 ? (
					<div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
						<Building2 className="h-8 w-8 opacity-20" />
						<p className="text-sm">
							{t("sysadmin.overview.no_institutions", "No institutions yet.")}
						</p>
					</div>
				) : (
					<div className="divide-y divide-border">
						{recent.rows.map((inst) => (
							<Link
								key={inst.id}
								to={`/sysadmin/institutions/${inst.id}`}
								className="flex items-center justify-between gap-4 px-5 py-3 text-sm transition-colors hover:bg-muted/30"
							>
								<span className="truncate font-medium text-foreground">
									{inst.name}
								</span>
								<div className="flex shrink-0 items-center gap-3">
									<span
										className={`rounded-full px-2 py-0.5 font-medium text-xs ${TYPE_COLORS[inst.type] ?? "bg-muted text-muted-foreground"}`}
									>
										{typeLabels[inst.type] ?? inst.type}
									</span>
									<span className="text-muted-foreground text-xs">
										{inst.city ?? "—"}
									</span>
									{inst.orgId ? (
										<span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-600 text-xs">
											{t("sysadmin.institutions.status_active", "Active")}
										</span>
									) : (
										<span className="rounded-full bg-rose-500/10 px-2 py-0.5 font-medium text-rose-600 text-xs">
											{t("sysadmin.institutions.status_suspended", "Suspended")}
										</span>
									)}
									<span className="text-muted-foreground text-xs">
										{formatDate(inst.createdAt, i18n.language)}
									</span>
								</div>
							</Link>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
