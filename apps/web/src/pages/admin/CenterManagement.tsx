import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { toast } from "@/lib/toast";
import ConfirmModal from "../../components/modals/ConfirmModal";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import {
	ContextMenuItem,
	ContextMenuSeparator,
} from "../../components/ui/context-menu";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "../../components/ui/empty";
import { Spinner } from "../../components/ui/spinner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "../../components/ui/table";
import { trpcClient } from "../../utils/trpc";

type Center = {
	id: string;
	code: string;
	shortName: string | null;
	name: string;
	nameEn: string | null;
	city: string | null;
	country: string | null;
	logoUrl: string | null;
	isActive: boolean;
};

export default function CenterManagement() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [deleteId, setDeleteId] = useState<string | null>(null);

	const centersQuery = useQuery({
		queryKey: ["centers"],
		queryFn: async () => {
			const result = await trpcClient.centers.list.query({
				limit: 200,
				includeInactive: true,
			});
			return result.items as Center[];
		},
	});
	const centers = centersQuery.data ?? [];

	const deleteMutation = useMutation({
		mutationFn: (id: string) => trpcClient.centers.delete.mutate({ id }),
		onSuccess: () => {
			toast.success(
				t("admin.centers.toast.deleteSuccess", {
					defaultValue: "Centre supprimé",
				}),
			);
			queryClient.invalidateQueries({ queryKey: ["centers"] });
			setDeleteId(null);
		},
		onError: (error: Error) => toast.error(error.message),
	});

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-3">
					<div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/8">
						<Building className="h-4 w-4 text-primary" />
					</div>
					<div>
						<h1 className="text-foreground">
							{t("admin.centers.title", { defaultValue: "Nos centres" })}
						</h1>
						<p className="mt-0.5 text-muted-foreground text-xs">
							{t("admin.centers.subtitle", {
								defaultValue:
									"Configurez les centres de formation professionnelle de l'institution.",
							})}
						</p>
					</div>
				</div>
				<Button onClick={() => navigate("/admin/centers/new")}>
					<Plus className="mr-2 h-4 w-4" />
					{t("admin.centers.actions.add", {
						defaultValue: "Ajouter un centre",
					})}
				</Button>
			</div>

			<Card>
				<CardContent>
					{centersQuery.isLoading ? (
						<div className="flex items-center justify-center py-8">
							<Spinner />
						</div>
					) : centers.length > 0 ? (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="w-16">
										{t("admin.centers.table.logo", {
											defaultValue: "Logo",
										})}
									</TableHead>
									<TableHead className="w-28">
										{t("admin.centers.table.code", { defaultValue: "Code" })}
									</TableHead>
									<TableHead>
										{t("admin.centers.table.name", { defaultValue: "Nom" })}
									</TableHead>
									<TableHead>
										{t("admin.centers.table.city", { defaultValue: "Ville" })}
									</TableHead>
									<TableHead>
										{t("admin.centers.table.country", {
											defaultValue: "Pays",
										})}
									</TableHead>
									<TableHead>
										{t("admin.centers.table.status", {
											defaultValue: "Statut",
										})}
									</TableHead>
									<TableHead className="w-[100px] text-right">
										{t("common.table.actions")}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{centers.map((center) => (
									<TableRow
										key={center.id}
										actions={
											<>
												<ContextMenuItem
													onSelect={() =>
														navigate(`/admin/centers/${center.id}`)
													}
												>
													<Pencil className="h-4 w-4" />
													{t("common.actions.edit")}
												</ContextMenuItem>
												<ContextMenuSeparator />
												<ContextMenuItem
													variant="destructive"
													onSelect={() => setDeleteId(center.id)}
												>
													<Trash2 className="h-4 w-4" />
													{t("common.actions.delete")}
												</ContextMenuItem>
											</>
										}
									>
										<TableCell>
											{center.logoUrl ? (
												<img
													src={center.logoUrl}
													alt={center.name}
													className="h-8 w-8 rounded object-contain"
												/>
											) : (
												<div className="flex h-8 w-8 items-center justify-center rounded bg-muted">
													<Building className="h-4 w-4 text-muted-foreground" />
												</div>
											)}
										</TableCell>
										<TableCell>
											<span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 font-mono text-xs">
												{center.code}
											</span>
										</TableCell>
										<TableCell className="font-medium">
											{center.shortName ?? center.name}
											<div className="text-muted-foreground text-xs">
												{center.name}
											</div>
										</TableCell>
										<TableCell>{center.city || "—"}</TableCell>
										<TableCell>{center.country || "—"}</TableCell>
										<TableCell>
											<span
												className={
													center.isActive
														? "inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 text-emerald-600 text-xs"
														: "inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-muted-foreground text-xs"
												}
											>
												{center.isActive
													? t("common.status.active", {
															defaultValue: "Actif",
														})
													: t("common.status.inactive", {
															defaultValue: "Inactif",
														})}
											</span>
										</TableCell>
										<TableCell className="flex items-center justify-end gap-2">
											<Button
												variant="ghost"
												size="icon"
												onClick={() => navigate(`/admin/centers/${center.id}`)}
											>
												<Pencil className="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												onClick={() => setDeleteId(center.id)}
											>
												<Trash2 className="h-4 w-4 text-destructive" />
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					) : (
						<Empty>
							<EmptyHeader>
								<Building className="mx-auto h-10 w-10 text-muted-foreground/50" />
								<EmptyTitle>
									{t("admin.centers.empty.title", {
										defaultValue: "Aucun centre",
									})}
								</EmptyTitle>
								<EmptyDescription>
									{t("admin.centers.empty.description", {
										defaultValue:
											"Créez votre premier centre pour organiser les programmes par campus.",
									})}
								</EmptyDescription>
							</EmptyHeader>
							<EmptyContent>
								<Button
									variant="outline"
									onClick={() => navigate("/admin/centers/new")}
								>
									<Plus className="mr-2 h-4 w-4" />
									{t("admin.centers.actions.add", {
										defaultValue: "Ajouter un centre",
									})}
								</Button>
							</EmptyContent>
						</Empty>
					)}
				</CardContent>
			</Card>

			<ConfirmModal
				isOpen={Boolean(deleteId)}
				onClose={() => setDeleteId(null)}
				onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
				title={t("admin.centers.delete.title", {
					defaultValue: "Supprimer le centre",
				})}
				message={t("admin.centers.delete.message", {
					defaultValue:
						"Êtes-vous sûr de vouloir supprimer ce centre ? Cette action est irréversible.",
				})}
				isLoading={deleteMutation.isPending}
			/>
		</div>
	);
}
