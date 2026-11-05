import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { CycleLevelFormDialog } from "@/components/callable/forms/CycleLevelFormDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";

export default function StudyCycleLevelsTab() {
	const { cycleId } = useParams<{ cycleId: string }>();
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	const { data: cycle } = useQuery(
		trpc.studyCycles.getCycle.queryOptions({ id: cycleId! }),
	);

	const levelsQuery = useQuery({
		queryKey: ["cycleLevels", cycleId],
		queryFn: () =>
			trpcClient.studyCycles.listLevels.query({ cycleId: cycleId! }),
		enabled: Boolean(cycleId),
	});

	const invalidateLevels = () => {
		queryClient.invalidateQueries({ queryKey: ["cycleLevels", cycleId] });
	};

	const deleteMutation = useMutation({
		mutationFn: (id: string) =>
			trpcClient.studyCycles.deleteLevel.mutate({ id }),
		onSuccess: () => {
			toast.success(
				t("admin.studyCycles.toast.levelDelete", {
					defaultValue: "Level removed",
				}),
			);
			invalidateLevels();
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const openCreate = () => {
		const nextNum = (levelsQuery.data?.length ?? 0) + 1;
		return CycleLevelFormDialog.call({
			cycleId: cycleId!,
			defaults: {
				code: `${cycle?.code ?? "L"}-L${nextNum}`,
				name: `Level ${nextNum}`,
			},
		});
	};

	const openEdit = (level: {
		id: string;
		code: string;
		name: string;
		minCredits: number;
	}) => CycleLevelFormDialog.call({ cycleId: cycleId!, level });

	return (
		<Card>
			<CardContent className="space-y-3 pt-6">
				<Button type="button" variant="outline" onClick={openCreate}>
					<Plus className="mr-2 h-4 w-4" />
					{t("admin.studyCycles.actions.addLevel", {
						defaultValue: "Add level",
					})}
				</Button>
				<div className="space-y-2">
					{levelsQuery.data?.map((level) => (
						<div
							key={level.id}
							className="flex flex-wrap items-center justify-between rounded-lg border bg-card p-3 shadow-sm"
						>
							<div>
								<p className="font-semibold text-foreground">{level.name}</p>
								<p className="text-muted-foreground text-xs">
									{level.code} ·{" "}
									{t("admin.studyCycles.levelCredits", {
										defaultValue: "Required credits: {{value}}",
										value: level.minCredits,
									})}
								</p>
							</div>
							<div className="flex gap-1">
								<Button
									type="button"
									variant="ghost"
									size="icon-sm"
									onClick={() => openEdit(level)}
								>
									<Pencil className="h-4 w-4" />
									<span className="sr-only">{t("common.actions.edit")}</span>
								</Button>
								<Button
									type="button"
									variant="ghost"
									size="icon-sm"
									className="text-destructive hover:text-destructive"
									onClick={() => deleteMutation.mutate(level.id)}
									disabled={deleteMutation.isPending}
								>
									<Trash2 className="h-4 w-4" />
									<span className="sr-only">{t("common.actions.delete")}</span>
								</Button>
							</div>
						</div>
					))}
					{!levelsQuery.data?.length && (
						<p className="text-muted-foreground text-sm">
							{t("admin.studyCycles.levelsEmpty", {
								defaultValue: "No levels defined yet.",
							})}
						</p>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
