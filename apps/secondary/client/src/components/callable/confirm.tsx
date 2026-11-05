import { Loader2 } from "lucide-react";
import { createCallable } from "react-call";
import { type MutationFn, useMutationFlow } from "react-call/mutation-flow";
import {
	CallableDialog,
	DIALOG_EXIT_MS,
} from "@/components/callable/callable-dialog";
import { Button } from "@/components/ui/button";

interface ConfirmProps {
	title: string;
	description: string;
	confirmLabel?: string;
	cancelLabel?: string;
	destructive?: boolean;
	/**
	 * Runs the confirmed action inside the dialog: it stays open (pending)
	 * until the handler calls `call.end(true)`, and stays open on failure so
	 * the user can retry. Without it, confirming resolves `true` immediately.
	 */
	mutationFn?: MutationFn<boolean>;
}

export const Confirm = createCallable<ConfirmProps, boolean>(
	({
		call,
		title,
		description,
		confirmLabel = "Confirm",
		cancelLabel = "Cancel",
		destructive = false,
		mutationFn,
	}) => {
		const confirm = useMutationFlow(call, mutationFn);
		return (
			<CallableDialog
				call={call}
				dismissValue={false}
				preventDismiss={confirm.pending}
				title={title}
				className="sm:max-w-sm"
			>
				<p className="text-muted-foreground text-sm">{description}</p>
				<div className="flex justify-end gap-2 pt-2">
					<Button
						variant="ghost"
						disabled={confirm.pending}
						onClick={() => call.end(false)}
					>
						{cancelLabel}
					</Button>
					<Button
						variant={destructive ? "destructive" : "default"}
						disabled={confirm.pending}
						onClick={() => confirm().orEnd(true)}
					>
						{confirm.pending && <Loader2 className="h-4 w-4 animate-spin" />}
						{confirmLabel}
					</Button>
				</div>
			</CallableDialog>
		);
	},
	DIALOG_EXIT_MS,
);
