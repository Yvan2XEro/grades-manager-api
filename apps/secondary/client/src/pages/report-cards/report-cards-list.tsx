import { FileText } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/utils/trpc";

export function ReportCardsList() {
	const { t } = useTranslation();
	const { data: years = [] } = trpc.academicYears.list.useQuery();
	const activeYear = years.find((y) => (y as any).isActive) ?? years[0];
	const [yearId, setYearId] = useState("");
	const effectiveYearId = yearId || activeYear?.id || "";

	return (
		<div className="space-y-5">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-2xl text-foreground">
						{t("report_cards.title", "Bulletins de notes")}
					</h1>
					<p className="text-muted-foreground text-sm">
						{t(
							"report_cards.subtitle",
							"Génération et consultation des bulletins",
						)}
					</p>
				</div>
			</div>

			<div className="flex items-center gap-3">
				<label className="font-medium text-foreground text-sm">
					{t("report_cards.year_label", "Année scolaire")}
				</label>
				<select
					value={effectiveYearId}
					onChange={(e) => setYearId(e.target.value)}
					className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
				>
					{years.map((y) => (
						<option key={y.id} value={y.id}>
							{y.name}
						</option>
					))}
				</select>
			</div>

			<div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
				<FileText className="h-12 w-12 opacity-20" />
				<p className="font-medium">
					{t("report_cards.empty", "Aucun bulletin généré")}
				</p>
				<p className="text-xs">
					{t(
						"report_cards.empty_desc",
						"Les bulletins sont générés après la saisie des notes et les conseils de classe.",
					)}
				</p>
			</div>
		</div>
	);
}
