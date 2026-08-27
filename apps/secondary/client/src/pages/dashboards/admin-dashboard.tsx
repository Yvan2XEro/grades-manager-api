import { BookOpen, GraduationCap, School, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
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

export function AdminDashboard() {
	const { t } = useTranslation();

	const { data: studentsData } = trpc.students.list.useQuery({ pageSize: 1 });
	const { data: classesData } = trpc.classes.list.useQuery({ pageSize: 1 });
	const { data: staffData } = trpc.staff.list.useQuery({ pageSize: 1 });
	const { data: subjectsData } = trpc.subjects.list.useQuery({ pageSize: 1 });

	return (
		<div className="space-y-6">
			<div>
				<h1 className="font-bold text-2xl text-foreground">
					{t("dashboard.title", "Tableau de bord")}
				</h1>
				<p className="text-muted-foreground text-sm">
					{t("dashboard.subtitle", "Vue d'ensemble de l'établissement")}
				</p>
			</div>

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

			<div className="rounded-xl border border-border bg-card p-5">
				<h2 className="mb-3 font-semibold text-base text-card-foreground">
					{t("dashboard.quick_setup", "Configuration rapide")}
				</h2>
				<ol className="list-inside list-decimal space-y-2 text-muted-foreground text-sm">
					<li>{t("dashboard.setup_1", "Créer l'année scolaire")}</li>
					<li>
						{t("dashboard.setup_2", "Définir les filières et les matières")}
					</li>
					<li>{t("dashboard.setup_3", "Créer les classes")}</li>
					<li>{t("dashboard.setup_4", "Inscrire les élèves")}</li>
					<li>{t("dashboard.setup_5", "Affecter les enseignants")}</li>
				</ol>
			</div>
		</div>
	);
}
