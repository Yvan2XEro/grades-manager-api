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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";
import type { OverrideDecision } from "../types";

/**
 * Forces a student eligible / ineligible for a retake, with a mandatory
 * reason; resolves `true` once saved.
 */
export const RetakeOverrideDialog = createCallable<
	{
		examId: string;
		studentCourseEnrollmentId: string;
		studentName: string;
		action: OverrideDecision;
	},
	boolean
>(({ call, examId, studentCourseEnrollmentId, studentName, action }) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [reason, setReason] = useState("");

	const save = useMutationFlow(call, async (call) => {
		try {
			await trpcClient.exams.upsertRetakeOverride.mutate({
				examId,
				studentCourseEnrollmentId,
				decision: action,
				reason: reason.trim(),
			});
			toast.success(t("admin.retake.toast.overrideSuccess"));
			queryClient.invalidateQueries({
				queryKey: ["retakeEligibility", examId],
			});
			call.end(true);
		} catch (error) {
			toast.error(
				(error as Error).message || t("admin.retake.toast.overrideError"),
			);
		}
	});

	return (
		<CallableDialog
			call={call}
			dismissValue={false}
			preventDismiss={save.pending}
			className="sm:max-w-lg"
			title={t("admin.retake.override.confirmTitle")}
			description={t("admin.retake.override.confirmMessage", {
				action:
					action === "force_eligible"
						? t("admin.retake.override.forceEligible").toLowerCase()
						: t("admin.retake.override.forceIneligible").toLowerCase(),
			})}
		>
			<div className="space-y-4 py-2">
				<div className="space-y-2">
					<Label>{t("admin.retake.table.student")}</Label>
					<p className="font-medium">{studentName}</p>
				</div>
				<div className="space-y-2">
					<Label htmlFor="overrideReason">
						{t("admin.retake.override.reason")}
					</Label>
					<Input
						id="overrideReason"
						value={reason}
						onChange={(e) => setReason(e.target.value)}
						placeholder={t("admin.retake.override.reasonPlaceholder")}
					/>
				</div>
			</div>
			<div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
				<Button
					variant="outline"
					disabled={save.pending}
					onClick={() => call.end(false)}
				>
					{t("common.actions.cancel")}
				</Button>
				<Button
					onClick={() => save()}
					disabled={!reason.trim() || save.pending}
				>
					{save.pending ? <Spinner className="mr-2 h-4 w-4" /> : null}
					{t("common.actions.confirm")}
				</Button>
			</div>
		</CallableDialog>
	);
}, DIALOG_EXIT_MS);
