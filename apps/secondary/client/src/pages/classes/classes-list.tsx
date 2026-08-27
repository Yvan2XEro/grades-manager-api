import { School } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { trpc } from "@/utils/trpc";

export function ClassesList() {
	const { t } = useTranslation();
	const { academicYearId } = useParams<{ academicYearId: string }>();
	const { data: classes = [], isLoading } = trpc.classes.list.useQuery(
		{ academicYearId: academicYearId || "" },
		{ enabled: !!academicYearId },
	);

	return (
		<div className="space-y-5">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-2xl text-foreground">
						{t("classes.title", "Classes")}
					</h1>
					<p className="text-muted-foreground text-sm">
						{t("classes.subtitle", "Gestion des classes de l'établissement")}
					</p>
				</div>
			</div>

			<div className="overflow-hidden rounded-xl border border-border">
				<table className="w-full text-sm">
					<thead className="bg-muted/40 text-muted-foreground">
						<tr>
							<th className="px-4 py-3 text-left font-medium">
								{t("classes.col_name", "Nom")}
							</th>
							<th className="px-4 py-3 text-left font-medium">
								{t("classes.col_code", "Code")}
							</th>
							<th className="px-4 py-3 text-left font-medium">
								{t("classes.col_level", "Niveau")}
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-border">
						{isLoading ? (
							<tr>
								<td
									colSpan={3}
									className="px-4 py-8 text-center text-muted-foreground"
								>
									{t("common.loading", "Chargement…")}
								</td>
							</tr>
						) : classes.length === 0 ? (
							<tr>
								<td
									colSpan={3}
									className="px-4 py-12 text-center text-muted-foreground"
								>
									<div className="flex flex-col items-center gap-3">
										<School className="h-10 w-10 opacity-30" />
										<p className="font-medium">
											{t("classes.empty_title", "Aucune classe")}
										</p>
										<p className="text-xs">
											{t(
												"classes.empty_desc",
												"Créez les classes de votre établissement.",
											)}
										</p>
									</div>
								</td>
							</tr>
						) : (
							classes.map((cls) => (
								<tr
									key={cls.id}
									className="transition-colors hover:bg-muted/30"
								>
									<td className="px-4 py-3 font-medium text-foreground">
										{cls.name}
									</td>
									<td className="px-4 py-3 text-muted-foreground">
										{cls.code ?? "—"}
									</td>
									<td className="px-4 py-3 text-muted-foreground">
										{cls.level ?? "—"}
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}
