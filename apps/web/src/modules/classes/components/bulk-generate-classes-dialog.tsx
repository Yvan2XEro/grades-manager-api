import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { createCallable } from "react-call";
import { useMutationFlow } from "react-call/mutation-flow";
import { useTranslation } from "react-i18next";
import { DIALOG_EXIT_MS } from "@/components/callable/callable-dialog";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogBody,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/lib/toast";
import type { RouterOutputs } from "@/utils/trpc";
import { trpc, trpcClient } from "@/utils/trpc";

/**
 * Generates every program × option × level class of a year (optionally
 * cloning teacher assignments from another year); resolves with the counts.
 */
export const BulkGenerateClassesDialog = createCallable<
	void,
	RouterOutputs["classes"]["bulkGenerate"] | undefined
>(({ call }) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [yearId, setYearId] = useState<string | null>(null);
	const [sourceYearId, setSourceYearId] = useState<string | null>(null);

	const generate = useMutationFlow(call, async (call) => {
		if (!yearId) return;
		try {
			const result = await trpcClient.classes.bulkGenerate.mutate({
				academicYearId: yearId,
				sourceAcademicYearId: sourceYearId ?? undefined,
			});
			queryClient.invalidateQueries(trpc.classes.listPaged.queryKey());
			toast.success(
				t("admin.classes.toast.bulkGenerateResult", {
					created: result.created,
					skipped: result.skipped,
				}),
			);
			call.end(result);
		} catch (err) {
			toast.error((err as Error).message);
		}
	});

	return (
		<Dialog
			open={!call.ended}
			onOpenChange={(o) => !o && !generate.pending && call.end(undefined)}
		>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>{t("admin.classes.bulkGenerate.title")}</DialogTitle>
					<DialogDescription>
						{t("admin.classes.bulkGenerate.description")}
					</DialogDescription>
				</DialogHeader>
				<DialogBody className="space-y-4">
					<div className="space-y-2">
						<Label>{t("admin.classes.bulkGenerate.yearLabel")}</Label>
						<AcademicYearSelect
							value={yearId}
							onChange={setYearId}
							autoSelectActive
						/>
					</div>
					<div className="space-y-2">
						<Label>{t("admin.classes.bulkGenerate.sourceYearLabel")}</Label>
						<AcademicYearSelect
							value={sourceYearId}
							onChange={setSourceYearId}
							autoSelectActive={false}
							placeholder={t(
								"admin.classes.bulkGenerate.sourceYearPlaceholder",
							)}
						/>
						<p className="text-muted-foreground text-xs">
							{t("admin.classes.bulkGenerate.sourceYearHint")}
						</p>
					</div>
				</DialogBody>
				<DialogFooter>
					<Button
						variant="outline"
						disabled={generate.pending}
						onClick={() => call.end(undefined)}
					>
						{t("common.actions.cancel")}
					</Button>
					<Button
						onClick={() => generate()}
						disabled={!yearId || generate.pending}
					>
						{generate.pending && (
							<Spinner className="mr-2 h-4 w-4 animate-spin" />
						)}
						{t("admin.classes.bulkGenerate.submit")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}, DIALOG_EXIT_MS);
