import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { createCallable } from "react-call";
import { useTranslation } from "react-i18next";
import { DIALOG_EXIT_MS } from "@/components/callable/callable-dialog";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";

export const ExemptWithNotesDialog = createCallable<
	{
		assignmentId: string;
		onDone: () => void;
	},
	void
>(({ call, assignmentId, onDone }) => {
	const { t } = useTranslation();
	const [notes, setNotes] = useState("");

	const mut = useMutation({
		mutationFn: () =>
			trpcClient.feeClearance.exemptStudent.mutate({
				assignmentId,
				notes: notes || undefined,
			}),
		onSuccess: () => {
			toast.success(t("common.saved"));
			onDone();
			call.end();
			setNotes("");
		},
		onError: (e) => toast.error(e.message),
	});

	return (
		<AlertDialog open={!call.ended} onOpenChange={(o) => !o && call.end()}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{t("feeClearance.assignments.exemptConfirmTitle")}
					</AlertDialogTitle>
					<AlertDialogDescription>
						{t("feeClearance.assignments.exemptConfirmDescription")}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<div className="grid gap-1 px-1 py-2">
					<label className="font-medium text-sm" htmlFor="exempt-notes">
						{t("feeClearance.assignments.exemptNotes")}
					</label>
					<input
						id="exempt-notes"
						type="text"
						className="rounded-md border px-3 py-1.5 text-sm"
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
						placeholder={t("common.optional")}
					/>
				</div>
				<AlertDialogFooter>
					<AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
					<AlertDialogAction
						disabled={mut.isPending}
						onClick={(e) => {
							e.preventDefault();
							mut.mutate();
						}}
					>
						{t("feeClearance.assignments.exempt")}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}, DIALOG_EXIT_MS);
