import { UserCog } from "lucide-react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/utils/trpc";

export function Staff() {
	const { t } = useTranslation();
	const { data: members = [], isLoading } = trpc.staff.list.useQuery();

	const roleLabel = (role: string) => {
		const labels: Record<string, string> = {
			teacher: "Enseignant",
			admin: "Administrateur",
			principal: "Principal",
			vice_principal: "Principal Adjoint",
			staff: "Personnel",
		};
		return labels[role] ?? role;
	};

	return (
		<div className="space-y-5">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-2xl text-foreground">
						{t("staff.title", "Personnel")}
					</h1>
					<p className="text-muted-foreground text-sm">
						{t("staff.subtitle", "Gestion du personnel de l'établissement")}
					</p>
				</div>
			</div>

			<div className="overflow-hidden rounded-xl border border-border">
				<table className="w-full text-sm">
					<thead className="bg-muted/40 text-muted-foreground">
						<tr>
							<th className="px-4 py-3 text-left font-medium">
								{t("staff.col_name", "Nom")}
							</th>
							<th className="px-4 py-3 text-left font-medium">
								{t("staff.col_email", "Email")}
							</th>
							<th className="px-4 py-3 text-left font-medium">
								{t("staff.col_role", "Rôle")}
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
						) : members.length === 0 ? (
							<tr>
								<td
									colSpan={3}
									className="px-4 py-12 text-center text-muted-foreground"
								>
									<div className="flex flex-col items-center gap-3">
										<UserCog className="h-10 w-10 opacity-30" />
										<p className="font-medium">
											{t("staff.empty_title", "Aucun membre du personnel")}
										</p>
										<p className="text-xs">
											{t(
												"staff.empty_desc",
												"Ajoutez les membres du personnel.",
											)}
										</p>
									</div>
								</td>
							</tr>
						) : (
							members.map((m) => (
								<tr key={m.id} className="transition-colors hover:bg-muted/30">
									<td className="px-4 py-3 font-medium text-foreground">
										{m.lastName} {m.firstName}
									</td>
									<td className="px-4 py-3 text-muted-foreground">{m.email}</td>
									<td className="px-4 py-3">
										<span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary text-xs">
											{roleLabel(m.role ?? "staff")}
										</span>
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
