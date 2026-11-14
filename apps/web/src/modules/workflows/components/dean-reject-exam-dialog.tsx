import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useState } from "react";
import { createCallable } from "react-call";
import { useTranslation } from "react-i18next";
import { DIALOG_EXIT_MS } from "@/components/callable/callable-dialog";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogBody,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";

/** Dean rejects a submitted exam with a mandatory reason. */

export const DeanRejectExamDialog = createCallable<{
	examId: string;
	examName: string;
}>(({ call, examId, examName }) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [reason, setReason] = useState("");

	const rejectMutation = useMutation({
		mutationFn: () =>
			trpcClient.workflows.rejectGrades.mutate({ examId, reason }),
		onSuccess: () => {
			toast.success(t("dean.approvals.rejected"));
			queryClient.invalidateQueries(trpc.exams.listPaged.queryKey());
			call.end();
			setReason("");
		},
		onError: (e: Error) => toast.error(e.message),
	});

	return (
		<Dialog open={!call.ended} onOpenChange={(o) => !o && call.end()}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-destructive">
						<X className="h-5 w-5" />
						{t("dean.approvals.rejectTitle")}
					</DialogTitle>
				</DialogHeader>
				<DialogBody>
					<p className="text-muted-foreground text-sm">
						<strong>{examName}</strong> — {t("dean.approvals.rejectHint")}
					</p>
					<textarea
						value={reason}
						onChange={(e) => setReason(e.target.value)}
						placeholder={t("dean.approvals.rejectPlaceholder")}
						className="min-h-[80px] w-full resize-none rounded-md border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
					/>
				</DialogBody>
				<DialogFooter>
					<Button variant="outline" onClick={() => call.end()}>
						{t("common.cancel")}
					</Button>
					<Button
						variant="destructive"
						disabled={!reason.trim() || rejectMutation.isPending}
						onClick={() => rejectMutation.mutate()}
					>
						{t("dean.approvals.rejectConfirm")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}, DIALOG_EXIT_MS);
