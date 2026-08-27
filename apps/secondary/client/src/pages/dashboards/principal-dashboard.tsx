import { FileText, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";

export function PrincipalDashboard() {
	const { t } = useTranslation();

	return (
		<div className="space-y-6">
			<div>
				<h1 className="font-bold text-2xl text-foreground">
					{t("dashboard.title", "Tableau de bord")}
				</h1>
				<p className="text-muted-foreground text-sm">
					{t("dashboard.principal_subtitle", "Direction de l'établissement")}
				</p>
			</div>

			<div className="grid gap-4 sm:grid-cols-2">
				<div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5">
					<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
						<TrendingUp className="h-6 w-6" />
					</div>
					<div>
						<p className="text-muted-foreground text-sm">
							{t("dashboard.avg_success", "Taux de réussite")}
						</p>
						<p className="font-bold text-2xl text-card-foreground">—</p>
					</div>
				</div>
				<div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5">
					<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
						<FileText className="h-6 w-6" />
					</div>
					<div>
						<p className="text-muted-foreground text-sm">
							{t("dashboard.report_cards", "Bulletins générés")}
						</p>
						<p className="font-bold text-2xl text-card-foreground">—</p>
					</div>
				</div>
			</div>
		</div>
	);
}
