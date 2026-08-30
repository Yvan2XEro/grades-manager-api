import {
	BookOpen,
	GraduationCap,
	LayoutDashboard,
	School,
	Settings,
	Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

interface StatCardProps {
	label: string;
	value: string | number;
	icon: React.ReactNode;
	className?: string;
}

function StatCard({ label, value, icon, className }: StatCardProps) {
	return (
		<div
			className={cn(
				"flex items-center gap-4 rounded-xl border border-border bg-card p-5",
				className,
			)}
		>
			<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
				{icon}
			</div>
			<div>
				<p className="text-muted-foreground text-sm">{label}</p>
				<p className="font-bold text-2xl text-card-foreground">{value}</p>
			</div>
		</div>
	);
}

interface QuickLinkProps {
	to: string;
	icon: React.ReactNode;
	label: string;
}

function QuickLink({ to, icon, label }: QuickLinkProps) {
	return (
		<Link
			to={to}
			className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center transition-colors hover:bg-muted/40"
		>
			<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
				{icon}
			</div>
			<span className="font-medium text-foreground text-sm">{label}</span>
		</Link>
	);
}

export function PrincipalDashboard() {
	const { t } = useTranslation();
	const { data: session } = useSession();

	const { data: studentsData } = trpc.students.list.useQuery({ pageSize: 1 });
	const { data: classesData } = trpc.classes.list.useQuery({ pageSize: 1 });
	const { data: staffData } = trpc.staff.list.useQuery({ pageSize: 1 });
	const { data: subjectsData } = trpc.subjects.list.useQuery({ pageSize: 1 });

	const { data: academicYears = [] } = trpc.academicYears.list.useQuery();
	const activeYear = academicYears.find((y) => y.status === "active");

	const { data: activeYearClassesData } = trpc.classes.list.useQuery(
		{ pageSize: 1, academicYearId: activeYear?.id ?? "" },
		{ enabled: !!activeYear },
	);

	const { data: activeYearEnrollmentsData } = trpc.enrollments.list.useQuery(
		{ pageSize: 1, academicYearId: activeYear?.id ?? "" },
		{ enabled: !!activeYear },
	);

	const userName = session?.user?.name ?? session?.user?.email ?? "";

	return (
		<div className="space-y-6">
			<div>
				<h1 className="font-bold text-2xl text-foreground">
					{userName
						? t("dashboard.welcome_name", "Bienvenue, {{name}}", {
								name: userName,
							})
						: t("dashboard.title", "Tableau de bord")}
				</h1>
				<p className="text-muted-foreground text-sm">
					{t("dashboard.principal_subtitle", "Direction de l'établissement")}
					{activeYear ? ` — ${activeYear.name}` : ""}
				</p>
			</div>

			{/* KPI cards */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<StatCard
					label={t("dashboard.students", "Élèves")}
					value={studentsData?.total ?? "—"}
					icon={<Users className="h-6 w-6" />}
				/>
				<StatCard
					label={t("dashboard.classes", "Classes")}
					value={classesData?.total ?? "—"}
					icon={<School className="h-6 w-6" />}
				/>
				<StatCard
					label={t("dashboard.staff", "Personnel")}
					value={staffData?.total ?? "—"}
					icon={<GraduationCap className="h-6 w-6" />}
				/>
				<StatCard
					label={t("dashboard.subjects", "Matières")}
					value={subjectsData?.total ?? "—"}
					icon={<BookOpen className="h-6 w-6" />}
				/>
			</div>

			{/* Academic summary */}
			<div className="rounded-xl border border-border bg-card">
				<div className="border-border border-b px-5 py-4">
					<h2 className="font-semibold text-base text-card-foreground">
						{t("dashboard.academic_summary", "Résumé académique")}
					</h2>
				</div>
				<div className="p-5">
					{activeYear ? (
						<div className="grid gap-4 sm:grid-cols-3">
							<div className="rounded-lg bg-muted/30 p-4 text-center">
								<p className="text-muted-foreground text-xs uppercase tracking-wide">
									{t("dashboard.active_year", "Année active")}
								</p>
								<p className="mt-1 font-bold text-card-foreground text-lg">
									{activeYear.name}
								</p>
							</div>
							<div className="rounded-lg bg-muted/30 p-4 text-center">
								<p className="text-muted-foreground text-xs uppercase tracking-wide">
									{t("dashboard.classes_this_year", "Classes")}
								</p>
								<p className="mt-1 font-bold text-card-foreground text-lg">
									{activeYearClassesData?.total ?? "—"}
								</p>
							</div>
							<div className="rounded-lg bg-muted/30 p-4 text-center">
								<p className="text-muted-foreground text-xs uppercase tracking-wide">
									{t("dashboard.enrollments_this_year", "Inscriptions")}
								</p>
								<p className="mt-1 font-bold text-card-foreground text-lg">
									{activeYearEnrollmentsData?.total ?? "—"}
								</p>
							</div>
						</div>
					) : (
						<div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
							<LayoutDashboard className="h-8 w-8 opacity-20" />
							<p className="text-sm">
								{t("dashboard.no_active_year", "Aucune année scolaire active.")}
							</p>
							<Link
								to="/settings"
								className="text-primary text-xs hover:underline"
							>
								{t("dashboard.configure_year", "Configurer →")}
							</Link>
						</div>
					)}
				</div>
			</div>

			{/* Quick access */}
			<div>
				<h2 className="mb-3 font-semibold text-base text-foreground">
					{t("dashboard.quick_access", "Accès rapide")}
				</h2>
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
					<QuickLink
						to="/students"
						icon={<Users className="h-5 w-5" />}
						label={t("nav.students", "Élèves")}
					/>
					<QuickLink
						to="/classes"
						icon={<School className="h-5 w-5" />}
						label={t("nav.classes", "Classes")}
					/>
					<QuickLink
						to="/grades"
						icon={<BookOpen className="h-5 w-5" />}
						label={t("nav.grades", "Notes")}
					/>
					<QuickLink
						to="/settings"
						icon={<Settings className="h-5 w-5" />}
						label={t("nav.settings", "Paramètres")}
					/>
				</div>
			</div>
		</div>
	);
}
