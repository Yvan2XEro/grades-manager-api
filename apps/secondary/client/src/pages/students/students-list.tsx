import { Search, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export function StudentsList() {
	const { t } = useTranslation();
	const [search, setSearch] = useState("");

	return (
		<div className="space-y-5">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-2xl text-foreground">
						{t("students.title", "Élèves")}
					</h1>
					<p className="text-muted-foreground text-sm">
						{t("students.subtitle", "Gestion des dossiers élèves")}
					</p>
				</div>
				<button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground text-sm transition-colors hover:bg-primary/90">
					<UserPlus className="h-4 w-4" />
					{t("students.add", "Ajouter un élève")}
				</button>
			</div>

			<div className="relative">
				<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
				<input
					type="text"
					placeholder={t(
						"students.search_placeholder",
						"Rechercher par nom, MNU…",
					)}
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="w-full rounded-lg border border-input bg-background py-2 pr-4 pl-9 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
				/>
			</div>

			<div className="overflow-hidden rounded-xl border border-border">
				<table className="w-full text-sm">
					<thead className="bg-muted/40 text-muted-foreground">
						<tr>
							<th className="px-4 py-3 text-left font-medium">
								{t("students.col_name", "Nom & Prénom")}
							</th>
							<th className="px-4 py-3 text-left font-medium">
								{t("students.col_mnu", "MNU")}
							</th>
							<th className="px-4 py-3 text-left font-medium">
								{t("students.col_gender", "Sexe")}
							</th>
							<th className="px-4 py-3 text-left font-medium">
								{t("students.col_class", "Classe")}
							</th>
							<th className="px-4 py-3 text-left font-medium">
								{t("students.col_actions", "Actions")}
							</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td
								colSpan={5}
								className="px-4 py-12 text-center text-muted-foreground"
							>
								<div className="flex flex-col items-center gap-3">
									<Users className="h-10 w-10 opacity-30" />
									<p className="font-medium">
										{t("students.empty_title", "Aucun élève inscrit")}
									</p>
									<p className="text-xs">
										{t(
											"students.empty_desc",
											"Commencez par ajouter les élèves de votre établissement.",
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
