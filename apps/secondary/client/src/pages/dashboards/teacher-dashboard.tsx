import { ClipboardList, GraduationCap } from "lucide-react";
import { useTranslation } from "react-i18next";

export function TeacherDashboard() {
	const { t } = useTranslation();

	return (
		<div className="space-y-6">
			<div>
				<h1 className="font-bold text-2xl text-foreground">
					{t("dashboard.welcome", "Bienvenue")}
				</h1>
				<p className="text-muted-foreground text-sm">
					{t("dashboard.teacher_subtitle", "Espace enseignant")}
				</p>
			</div>

			<div className="grid gap-4 sm:grid-cols-2">
				<div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5">
					<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
						<GraduationCap className="h-6 w-6" />
					</div>
					<div>
						<p className="text-muted-foreground text-sm">
							{t("dashboard.my_classes", "Mes classes")}
						</p>
						<p className="font-bold text-2xl text-card-foreground">—</p>
					</div>
				</div>
				<div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5">
					<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
						<ClipboardList className="h-6 w-6" />
					</div>
					<div>
						<p className="text-muted-foreground text-sm">
							{t("dashboard.pending_grades", "Notes à saisir")}
						</p>
						<p className="font-bold text-2xl text-card-foreground">—</p>
					</div>
				</div>
			</div>
		</div>
	);
}
