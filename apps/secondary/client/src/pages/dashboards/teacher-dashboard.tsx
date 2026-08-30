import {
	BookOpen,
	CalendarDays,
	ClipboardList,
	School,
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

export function TeacherDashboard() {
	const { t } = useTranslation();
	const { data: session } = useSession();

	const { data: academicYears = [] } = trpc.academicYears.list.useQuery();
	const activeYear = academicYears.find((y) => y.status === "active");

	const { data: terms = [] } = trpc.terms.list.useQuery(
		{ academicYearId: activeYear?.id ?? "" },
		{ enabled: !!activeYear },
	);
	const activeTerm = terms.find((tm) => tm.status === "open") ?? terms[0];

	const { data: assignments = [] } = trpc.subjectAssignments.listMine.useQuery(
		{ academicYearId: activeYear?.id ?? "" },
		{ enabled: !!activeYear },
	);

	const uniqueClasses = new Set(assignments.map((a) => a.assignment.classId))
		.size;
	const uniqueSubjects = new Set(assignments.map((a) => a.assignment.subjectId))
		.size;

	const userName = session?.user?.name ?? session?.user?.email ?? "";

	return (
		<div className="space-y-6">
			<div>
				<h1 className="font-bold text-2xl text-foreground">
					{userName
						? t("dashboard.welcome_name", "Bienvenue, {{name}}", {
								name: userName,
							})
						: t("dashboard.welcome", "Bienvenue")}
				</h1>
				<p className="text-muted-foreground text-sm">
					{t("dashboard.teacher_subtitle", "Espace enseignant")}
					{activeYear ? ` — ${activeYear.name}` : ""}
				</p>
			</div>

			{/* Stats */}
			<div className="grid gap-4 sm:grid-cols-2">
				<StatCard
					label={t("dashboard.my_classes", "Mes classes")}
					value={uniqueClasses}
					icon={<School className="h-6 w-6" />}
				/>
				<StatCard
					label={t("dashboard.my_subjects", "Mes matières")}
					value={uniqueSubjects}
					icon={<ClipboardList className="h-6 w-6" />}
				/>
			</div>

			{/* Assignments table */}
			<div className="overflow-hidden rounded-xl border border-border">
				<div className="border-border border-b bg-muted/30 px-4 py-3">
					<h2 className="font-semibold text-foreground text-sm">
						{t("dashboard.my_assignments", "Mes affectations")}
					</h2>
				</div>

				{assignments.length === 0 ? (
					<div className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
						<BookOpen className="h-8 w-8 opacity-20" />
						<p className="text-sm">
							{t("dashboard.no_assignments", "Aucune affectation cette année.")}
						</p>
					</div>
				) : (
					<table className="w-full text-sm">
						<thead className="border-border border-b bg-muted/60 text-muted-foreground">
							<tr>
								<th className="px-4 py-2 text-left font-medium text-muted-foreground">
									{t("dashboard.class", "Classe")}
								</th>
								<th className="px-4 py-2 text-left font-medium text-muted-foreground">
									{t("dashboard.subject", "Matière")}
								</th>
								<th className="px-4 py-2 text-right font-medium text-muted-foreground">
									{t("dashboard.action", "Action")}
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border">
							{assignments.map((a) => (
								<tr key={a.assignment.id} className="hover:bg-muted/20">
									<td className="px-4 py-2 font-medium text-foreground">
										{a.class.name}
									</td>
									<td className="px-4 py-2 text-muted-foreground">
										{a.subject.name}
									</td>
									<td className="px-4 py-2 text-right">
										{activeTerm ? (
											<Link
												to={`/grades/${a.assignment.classId}/${a.assignment.subjectId}/${activeTerm.id}`}
												className="text-primary text-xs hover:underline"
											>
												{t("dashboard.enter_grades", "Saisir les notes →")}
											</Link>
										) : (
											<span className="text-muted-foreground text-xs">—</span>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>

			{/* Quick access */}
			<div>
				<h2 className="mb-3 font-semibold text-base text-foreground">
					{t("dashboard.quick_access", "Accès rapide")}
				</h2>
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
						to="/students"
						icon={<Users className="h-5 w-5" />}
						label={t("nav.students", "Élèves")}
					/>
					<QuickLink
						to="/attendance"
						icon={<CalendarDays className="h-5 w-5" />}
						label={t("nav.attendance", "Présences")}
					/>
				</div>
			</div>
		</div>
	);
}
