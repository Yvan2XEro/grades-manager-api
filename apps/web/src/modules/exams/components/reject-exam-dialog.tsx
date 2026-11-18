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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";

/** Rejects a submitted exam with a mandatory reason; resolves `true` once rejected. */
export const RejectExamDialog = createCallable<
	{ examId: string; description?: string; successMessage?: string },
	boolean
>(({ call, examId, description, successMessage }) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [reason, setReason] = useState("");

	const reject = useMutationFlow(call, async (call) => {
		try {
			await trpcClient.exams.validate.mutate({
				examId,
				status: "rejected",
				rejectionReason: reason.trim(),
			});
			queryClient.invalidateQueries({
				queryKey: trpc.exams.listPaged.queryKey(),
			});
			toast.success(successMessage ?? t("admin.exams.toast.rejectSuccess"));
			call.end(true);
		} catch (error) {
			const message =
				error instanceof Error && error.message
					? error.message
					: t("admin.exams.toast.validateError");
			toast.error(message);
		}
	});

	return (
		<CallableDialog
			call={call}
			dismissValue={false}
			preventDismiss={reject.pending}
			className="sm:max-w-md"
			title={t("admin.exams.actions.reject")}
		>
			<div className="space-y-3 py-2">
				{description && (
					<p className="text-muted-foreground text-sm">{description}</p>
				)}
				<Label htmlFor="reject-reason">
					{t("admin.exams.rejectReasonLabel")}
				</Label>
				<Textarea
					id="reject-reason"
					rows={3}
					placeholder={t("admin.exams.rejectReasonPlaceholder")}
					value={reason}
					onChange={(e) => setReason(e.target.value)}
				/>
			</div>
			<div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
				<Button
					variant="outline"
					disabled={reject.pending}
					onClick={() => call.end(false)}
				>
					{t("common.cancel")}
				</Button>
				<Button
					variant="destructive"
					disabled={!reason.trim() || reject.pending}
					onClick={() => reject()}
				>
					{t("admin.exams.actions.reject")}
				</Button>
			</div>
		</CallableDialog>
	);
}, DIALOG_EXIT_MS);
