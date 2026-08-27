import { BookOpen } from "lucide-react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/utils/trpc";

export function Subjects() {
	const { t } = useTranslation();
	const { data: subjects = [], isLoading } = trpc.subjects.list.useQuery();

	return (
		<div className="space-y-5">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-2xl text-foreground">
						{t("subjects.title", "Matières")}
					</h1>
					<p className="text-muted-foreground text-sm">
						{t("subjects.subtitle", "Catalogue des matières enseignées")}
					</p>
				</div>
			</div>

			<div className="overflow-hidden rounded-xl border border-border">
				<table className="w-full text-sm">
					<thead className="bg-muted/40 text-muted-foreground">
						<tr>
							<th className="px-4 py-3 text-left font-medium">
								{t("subjects.col_name", "Matière")}
							</th>
							<th className="px-4 py-3 text-left font-medium">
								{t("subjects.col_code", "Code")}
							</th>
							<th className="px-4 py-3 text-left font-medium">
								{t("subjects.col_group", "Groupe")}
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
						) : subjects.length === 0 ? (
							<tr>
								<td
									colSpan={3}
									className="px-4 py-12 text-center text-muted-foreground"
								>
									<div className="flex flex-col items-center gap-3">
										<BookOpen className="h-10 w-10 opacity-30" />
										<p className="font-medium">
											{t("subjects.empty_title", "Aucune matière")}
										</p>
										<p className="text-xs">
											{t(
												"subjects.empty_desc",
												"Ajoutez les matières à votre catalogue.",
											)}
										</p>
									</div>
								</td>
							</tr>
						) : (
							subjects.map((s) => (
								<tr key={s.id} className="transition-colors hover:bg-muted/30">
									<td className="px-4 py-3 font-medium text-foreground">
										{s.name}
									</td>
									<td className="px-4 py-3 text-muted-foreground">
										{s.code ?? "—"}
									</td>
									<td className="px-4 py-3 text-muted-foreground">
										{s.subjectGroup ?? "—"}
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
