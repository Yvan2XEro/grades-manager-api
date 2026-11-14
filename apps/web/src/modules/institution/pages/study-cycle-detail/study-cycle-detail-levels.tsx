import { Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CycleLevelFormDialog } from "../../components/cycle-level-form-dialog";
import {
	useCycleLevels,
	useDeleteCycleLevel,
	useStudyCycle,
} from "../../hooks/use-study-cycles";
import type { CycleLevel } from "../../types";

export default function StudyCycleDetailLevels() {
	const { cycleId } = useParams<{ cycleId: string }>();
	const { t } = useTranslation();
	const { data: cycle } = useStudyCycle(cycleId!);
	const levelsQuery = useCycleLevels(cycleId);
	const deleteMutation = useDeleteCycleLevel(cycleId);

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

	const openEdit = (level: CycleLevel) =>
		CycleLevelFormDialog.call({ cycleId: cycleId!, level });

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
