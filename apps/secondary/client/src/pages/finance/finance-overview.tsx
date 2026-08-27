import { CreditCard, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";

export function FinanceOverview() {
	const { t } = useTranslation();

	return (
		<div className="space-y-5">
			<div>
				<h1 className="font-bold text-2xl text-foreground">
					{t("finance.title", "Finances")}
				</h1>
				<p className="text-muted-foreground text-sm">
					{t("finance.subtitle", "Gestion des frais de scolarité et paiements")}
				</p>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				<div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5">
					<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
						<CreditCard className="h-6 w-6" />
					</div>
					<div>
						<p className="text-muted-foreground text-sm">
							{t("finance.total_collected", "Total encaissé")}
						</p>
						<p className="font-bold text-2xl text-card-foreground">—</p>
					</div>
				</div>
				<div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5">
					<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
						<TrendingUp className="h-6 w-6" />
					</div>
					<div>
						<p className="text-muted-foreground text-sm">
							{t("finance.pending", "En attente")}
						</p>
						<p className="font-bold text-2xl text-card-foreground">—</p>
					</div>
				</div>
			</div>

			<div className="overflow-hidden rounded-xl border border-border">
				<div className="border-border border-b bg-muted/30 px-4 py-3">
					<h2 className="font-semibold text-foreground text-sm">
						{t("finance.fee_schedules", "Barèmes de frais")}
					</h2>
				</div>
				<div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
					<CreditCard className="h-10 w-10 opacity-20" />
					<p className="font-medium">
						{t("finance.no_schedules", "Aucun barème configuré")}
					</p>
					<p className="text-xs">
						{t(
							"finance.setup_hint",
							"Configurez les frais de scolarité pour commencer.",
						)}
					</p>
				</div>
			</div>
		</div>
	);
}
