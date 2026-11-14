import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { createCallable } from "react-call";
import { useMutationFlow } from "react-call/mutation-flow";
import { useTranslation } from "react-i18next";
import {
	CallableDialog,
	DIALOG_EXIT_MS,
} from "@/components/callable/callable-dialog";
import { QuickCreate } from "@/components/callable/quick-create";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { upsertInList } from "@/lib/query-cache";
import { toast } from "@/lib/toast";
import { StudyCycleFormDialog } from "@/modules/institution/StudyCycleFormDialog";
import { type RouterOutputs, trpcClient } from "@/utils/trpc";
import {
	STUDY_CYCLES_SELECT_KEY,
	type StudyCyclesSelect,
	useStudyCycles,
} from "../hooks/use-study-cycles";

interface DuplicateProgramsProps {
	sourceProgramIds: string[];
}

/**
 * Duplicates programs into other study cycles; resolves with the result, or
 * `undefined` when dismissed. A missing target cycle can be created in place.
 */
export const DuplicateProgramsDialog = createCallable<
	DuplicateProgramsProps,
	RouterOutputs["programs"]["duplicateForCycles"] | undefined
>(({ call, sourceProgramIds }) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [targetCycleIds, setTargetCycleIds] = useState<string[]>([]);
	const [cloneCurriculum, setCloneCurriculum] = useState(true);

	const { data: cycles } = useStudyCycles();

	const createCycle = async () => {
		const cycle = await StudyCycleFormDialog.call({});
		if (!cycle) return;
		queryClient.setQueryData<StudyCyclesSelect>(
			STUDY_CYCLES_SELECT_KEY,
			(old) => upsertInList(old, cycle),
		);
		setTargetCycleIds((prev) => [...prev, cycle.id]);
	};

	const submit = useMutationFlow(call, async (call) => {
		try {
			const result = await trpcClient.programs.duplicateForCycles.mutate({
				sourceProgramIds,
				targetCycleIds,
				cloneCurriculum,
			});
			queryClient.invalidateQueries({ queryKey: ["programs"] });
			toast.success(
				t("admin.programs.duplicate.toast.success", {
					defaultValue:
						"{{created}} programme(s) créé(s), {{skipped}} ignoré(s)",
					created: result.createdCount,
					skipped: result.skippedCount,
				}),
			);
			call.end(result);
		} catch (err) {
			toast.error(
				(err as Error).message ||
					t("admin.programs.duplicate.toast.error", {
						defaultValue: "Erreur lors de la duplication",
					}),
			);
		}
	});

	return (
		<CallableDialog
			call={call}
			dismissValue={undefined}
			preventDismiss={submit.pending}
			className="sm:max-w-lg"
			title={t("admin.programs.duplicate.title", {
				defaultValue: "Dupliquer vers un autre cycle",
			})}
			description={t("admin.programs.duplicate.description", {
				defaultValue:
					"{{count}} programme(s) seront copiés vers chaque cycle sélectionné. Le code et le nom seront préfixés par celui du cycle.",
				count: sourceProgramIds.length,
			})}
		>
			<div className="space-y-4">
				<div className="space-y-2">
					<div className="flex items-center justify-between gap-2">
						<Label>
							{t("admin.programs.duplicate.targetCycles", {
								defaultValue: "Cycles cibles",
							})}
						</Label>
						<QuickCreate
							onCreate={createCycle}
							label={t("admin.studyCycles.actions.add", {
								defaultValue: "Add cycle",
							})}
						/>
					</div>
					{cycles?.items?.length ? (
						<div className="max-h-56 space-y-2 overflow-y-auto rounded-md border p-3">
							{cycles.items.map((cycle) => {
								const checked = targetCycleIds.includes(cycle.id);
								return (
									<label
										key={cycle.id}
										className="flex cursor-pointer items-center gap-2 text-sm"
									>
										<Checkbox
											checked={checked}
											onCheckedChange={(value) => {
												setTargetCycleIds((prev) =>
													value
														? [...prev, cycle.id]
														: prev.filter((id) => id !== cycle.id),
												);
											}}
										/>
										<span className="font-medium">{cycle.name}</span>
										<span className="text-muted-foreground text-xs">
											({cycle.code})
										</span>
									</label>
								);
							})}
						</div>
					) : (
						<p className="text-muted-foreground text-sm">
							{t("admin.programs.duplicate.noCycles", {
								defaultValue: "Aucun cycle disponible",
							})}
						</p>
					)}
				</div>

				<label className="flex cursor-pointer items-center gap-2 text-sm">
					<Checkbox
						checked={cloneCurriculum}
						onCheckedChange={(v) => setCloneCurriculum(Boolean(v))}
					/>
					<span>
						{t("admin.programs.duplicate.cloneCurriculum", {
							defaultValue: "Cloner également les UE et EC",
						})}
					</span>
				</label>

				<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
					<Button
						variant="outline"
						onClick={() => call.end(undefined)}
						disabled={submit.pending}
					>
						{t("common.actions.cancel")}
					</Button>
					<Button
						onClick={() => submit()}
						disabled={
							targetCycleIds.length === 0 ||
							sourceProgramIds.length === 0 ||
							submit.pending
						}
					>
						{submit.pending && <Spinner className="mr-2 h-4 w-4" />}
						{t("admin.programs.duplicate.submit", {
							defaultValue: "Dupliquer",
						})}
					</Button>
				</div>
			</div>
		</CallableDialog>
	);
}, DIALOG_EXIT_MS);
