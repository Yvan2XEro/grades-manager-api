import { BookOpen, ClipboardList } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
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

export function TeacherDashboard() {
	const { t } = useTranslation();

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

	// Unique classes from assignments
	const uniqueClasses = new Set(assignments.map((a) => a.assignment.classId))
		.size;

	return (
		<div className="space-y-6">
			<div>
				<h1 className="font-bold text-2xl text-foreground">
					{t("dashboard.welcome", "Bienvenue")}
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
					icon={<BookOpen className="h-6 w-6" />}
				/>
				<StatCard
					label={t("dashboard.my_subjects", "Mes matières")}
					value={assignments.length}
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
						<thead className="border-border border-b bg-muted/20">
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
		</div>
	);
}
