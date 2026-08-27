import { Users2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export function ClassCouncilsList() {
	const { t } = useTranslation();

	return (
		<div className="space-y-5">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-2xl text-foreground">
						{t("class_councils.title", "Conseils de classe")}
					</h1>
					<p className="text-muted-foreground text-sm">
						{t(
							"class_councils.subtitle",
							"Organisation des conseils de classe par trimestre",
						)}
					</p>
				</div>
			</div>

			<div className="overflow-hidden rounded-xl border border-border">
				<table className="w-full text-sm">
					<thead className="bg-muted/40 text-muted-foreground">
						<tr>
							<th className="px-4 py-3 text-left font-medium">
								{t("class_councils.col_class", "Classe")}
							</th>
							<th className="px-4 py-3 text-left font-medium">
								{t("class_councils.col_term", "Trimestre")}
							</th>
							<th className="px-4 py-3 text-left font-medium">
								{t("class_councils.col_date", "Date")}
							</th>
							<th className="px-4 py-3 text-left font-medium">
								{t("class_councils.col_status", "Statut")}
							</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td
								colSpan={4}
								className="px-4 py-12 text-center text-muted-foreground"
							>
								<div className="flex flex-col items-center gap-3">
									<Users2 className="h-10 w-10 opacity-30" />
									<p className="font-medium">
										{t("class_councils.empty", "Aucun conseil planifié")}
									</p>
									<p className="text-xs">
										{t(
											"class_councils.empty_desc",
											"Planifiez les conseils de classe pour chaque trimestre.",
										)}
									</p>
								</div>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	);
}
