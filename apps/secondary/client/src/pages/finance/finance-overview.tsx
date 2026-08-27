import { CreditCard, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/utils/trpc";

export function FinanceOverview() {
	const { t } = useTranslation();

	const { data: academicYears = [] } = trpc.academicYears.list.useQuery();
	const activeYear = academicYears.find((y) => y.status === "active");

	const { data: schedules = [] } = trpc.finance.listSchedules.useQuery(
		{ academicYearId: activeYear?.id ?? "" },
		{ enabled: !!activeYear },
	);

	const { data: payments = [] } = trpc.finance.listPayments.useQuery({
		limit: 50,
	});

	const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);

	const formatAmount = (n: number) =>
		new Intl.NumberFormat("fr-CM", {
			style: "currency",
			currency: "XAF",
			maximumFractionDigits: 0,
		}).format(n);

	const formatDate = (d: Date | string) => new Date(d).toLocaleDateString();

	const methodLabel = (m: string) => {
		const map: Record<string, string> = {
			cash: "Cash",
			mtn_momo: "MTN MoMo",
			orange_money: "Orange Money",
			bank_transfer: "Bank transfer",
			campost: "CamPost",
		};
		return map[m] ?? m;
	};

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

			{/* Summary cards */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				<div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5">
					<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
						<CreditCard className="h-6 w-6" />
					</div>
					<div>
						<p className="text-muted-foreground text-sm">
							{t("finance.total_collected", "Total encaissé")}
						</p>
						<p className="font-bold text-2xl text-card-foreground">
							{formatAmount(totalCollected)}
						</p>
					</div>
				</div>
				<div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5">
					<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
						<TrendingUp className="h-6 w-6" />
					</div>
					<div>
						<p className="text-muted-foreground text-sm">
							{t("finance.fee_schedules_count", "Barèmes configurés")}
						</p>
						<p className="font-bold text-2xl text-card-foreground">
							{schedules.length}
						</p>
					</div>
				</div>
			</div>

			{/* Recent payments */}
			<div className="overflow-hidden rounded-xl border border-border">
				<div className="border-border border-b bg-muted/30 px-4 py-3">
					<h2 className="font-semibold text-foreground text-sm">
						{t("finance.recent_payments", "Paiements récents")}
					</h2>
				</div>

				{payments.length === 0 ? (
					<div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
						<CreditCard className="h-10 w-10 opacity-20" />
						<p className="font-medium">
							{t("finance.no_payments", "Aucun paiement enregistré")}
						</p>
					</div>
				) : (
					<table className="w-full text-sm">
						<thead className="border-border border-b bg-muted/20">
							<tr>
								<th className="px-4 py-2 text-left font-medium text-muted-foreground">
									{t("fees.date", "Date")}
								</th>
								<th className="px-4 py-2 text-left font-medium text-muted-foreground">
									{t("fees.amount", "Montant")}
								</th>
								<th className="px-4 py-2 text-left font-medium text-muted-foreground">
									{t("fees.method", "Méthode")}
								</th>
								<th className="px-4 py-2 text-left font-medium text-muted-foreground">
									{t("fees.type", "Type")}
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border">
							{payments.map((p) => (
								<tr key={p.id} className="hover:bg-muted/20">
									<td className="px-4 py-2 text-foreground">
										{formatDate(p.paidAt)}
									</td>
									<td className="px-4 py-2 font-medium text-foreground">
										{formatAmount(p.amount)}
									</td>
									<td className="px-4 py-2 text-muted-foreground">
										{methodLabel(p.paymentMethod)}
									</td>
									<td className="px-4 py-2 text-muted-foreground capitalize">
										{p.feeType}
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
