import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { createCallable } from "react-call";
import { useMutationFlow } from "react-call/mutation-flow";
import { useTranslation } from "react-i18next";
import {
	CallableDialog,
	DIALOG_EXIT_MS,
} from "@/components/callable/callable-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";

/** Overrides a student's exam participation eligibility; resolves `true` once saved. */
export const ParticipationOverrideDialog = createCallable<
	{
		examId: string;
		studentId: string;
		studentName: string | null;
		currentEligible: boolean;
	},
	boolean
>(({ call, examId, studentId, studentName, currentEligible }) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [eligible, setEligible] = useState(!currentEligible);
	const [reason, setReason] = useState("");

	const save = useMutationFlow(call, async (call) => {
		try {
			await trpcClient.attendance.overrideEligibility.mutate({
				examId,
				studentId,
				eligible,
				reason: reason.trim() || null,
			});
			queryClient.invalidateQueries({
				queryKey: trpc.attendance.getExamRoster.queryKey({ examId }),
			});
			call.end(true);
		} catch (error) {
			toast.error((error as Error).message);
		}
	});

	return (
		<CallableDialog
			call={call}
			dismissValue={false}
			preventDismiss={save.pending}
			className="sm:max-w-lg"
			title={t("admin.examParticipation.overrideDialog.title")}
			description={studentName ?? studentId}
		>
			<div className="space-y-3">
				<div className="flex gap-2">
					<Button
						variant={eligible ? "default" : "outline"}
						size="sm"
						onClick={() => setEligible(true)}
					>
						{t("admin.examParticipation.yes")}
					</Button>
					<Button
						variant={!eligible ? "destructive" : "outline"}
						size="sm"
						onClick={() => setEligible(false)}
					>
						{t("admin.examParticipation.no")}
					</Button>
				</div>
				<div className="space-y-1">
					<Label className="text-xs">
						{t("admin.examParticipation.overrideDialog.reason")}
					</Label>
					<Textarea
						rows={2}
						value={reason}
						onChange={(e) => setReason(e.target.value)}
						placeholder={t(
							"admin.examParticipation.overrideDialog.reasonPlaceholder",
						)}
					/>
				</div>
			</div>
			<div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end">
				<Button
					variant="outline"
					disabled={save.pending}
					onClick={() => call.end(false)}
				>
					{t("common.cancel")}
				</Button>
				<Button disabled={save.pending} onClick={() => save()}>
					{save.pending ? <Spinner className="mr-2 h-3 w-3" /> : null}
					{t("common.save")}
				</Button>
			</div>
		</CallableDialog>
	);
}, DIALOG_EXIT_MS);
