import { UserCheck } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/utils/trpc";

export function Enrollments() {
	const { t } = useTranslation();
	const { data: years = [] } = trpc.academicYears.list.useQuery();
	const [selectedYearId, setSelectedYearId] = useState<string>("");

	const activeYear = years.find((y) => (y as any).isActive) ?? years[0];
	const yearId = selectedYearId || activeYear?.id || "";

	const { data: enrollments = [], isLoading } = trpc.enrollments.list.useQuery(
		{ academicYearId: yearId },
		{ enabled: !!yearId },
	);

	return (
		<div className="space-y-5">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-2xl text-foreground">
						{t("enrollments.title", "Inscriptions")}
					</h1>
					<p className="text-muted-foreground text-sm">
						{t(
							"enrollments.subtitle",
							"Inscriptions des élèves par année scolaire",
						)}
					</p>
				</div>
			</div>

			<div className="flex items-center gap-3">
				<label className="font-medium text-foreground text-sm">
					{t("enrollments.year_label", "Année scolaire")}
				</label>
				<select
					value={yearId}
					onChange={(e) => setSelectedYearId(e.target.value)}
					className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
				>
					{years.map((y) => (
						<option key={y.id} value={y.id}>
							{(y as any).name || y.id}
						</option>
					))}
				</select>
				<span className="text-muted-foreground text-sm">
					{enrollments.length} {t("enrollments.count_label", "inscrits")}
				</span>
			</div>

			<div className="overflow-hidden rounded-xl border border-border">
				<table className="w-full text-sm">
					<thead className="bg-muted/40 text-muted-foreground">
						<tr>
							<th className="px-4 py-3 text-left font-medium">
								{t("enrollments.col_student", "Élève")}
							</th>
							<th className="px-4 py-3 text-left font-medium">
								{t("enrollments.col_class", "Classe")}
							</th>
							<th className="px-4 py-3 text-left font-medium">
								{t("enrollments.col_type", "Type d'admission")}
							</th>
							<th className="px-4 py-3 text-left font-medium">
								{t("enrollments.col_status", "Statut")}
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-border">
						{!yearId ? (
							<tr>
								<td
									colSpan={4}
									className="px-4 py-8 text-center text-muted-foreground"
								>
									{t(
										"enrollments.select_year",
										"Sélectionnez une année scolaire",
									)}
								</td>
							</tr>
						) : isLoading ? (
							<tr>
								<td
									colSpan={4}
									className="px-4 py-8 text-center text-muted-foreground"
								>
									{t("common.loading", "Chargement…")}
								</td>
							</tr>
						) : enrollments.length === 0 ? (
							<tr>
								<td
									colSpan={4}
									className="px-4 py-12 text-center text-muted-foreground"
								>
									<div className="flex flex-col items-center gap-3">
										<UserCheck className="h-10 w-10 opacity-30" />
										<p className="font-medium">
											{t("enrollments.empty_title", "Aucune inscription")}
										</p>
										<p className="text-xs">
											{t(
												"enrollments.empty_desc",
												"Aucun élève inscrit pour cette année scolaire.",
											)}
										</p>
									</div>
								</td>
							</tr>
						) : (
							enrollments.map((e) => {
								const s = (e as any).student;
								const cls = (e as any).enrollment ?? e;
								return (
									<tr
										key={(e as any).enrollment?.id ?? (e as any).id}
										className="transition-colors hover:bg-muted/30"
									>
										<td className="px-4 py-3 font-medium text-foreground">
											{s ? `${s.lastName} ${s.firstName}` : "—"}
										</td>
										<td className="px-4 py-3 text-muted-foreground">
											{(e as any).class?.name ??
												(e as any).enrollment?.classId ??
												"—"}
										</td>
										<td className="px-4 py-3 text-muted-foreground">
											{cls.admissionType ?? "—"}
										</td>
										<td className="px-4 py-3">
											<span
												className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium text-xs ${
													cls.status === "active"
														? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
														: cls.status === "withdrawn"
															? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
															: "bg-muted text-muted-foreground"
												}`}
											>
												{cls.status ?? "—"}
											</span>
										</td>
									</tr>
								);
							})
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}
