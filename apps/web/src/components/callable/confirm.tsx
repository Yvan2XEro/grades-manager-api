import type React from "react";
import { createCallable } from "react-call";
import { type MutationFn, useMutationFlow } from "react-call/mutation-flow";
import { useTranslation } from "react-i18next";
import { DIALOG_EXIT_MS } from "@/components/callable/callable-dialog";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";

interface ConfirmProps {
	title: string;
	/** Plain text, or rich content (e.g. a list of what will happen). */
	description: React.ReactNode;
	confirmLabel?: string;
	cancelLabel?: string;
	/** Defaults to `true`: most confirmations guard a destructive action. */
	destructive?: boolean;
	/**
	 * Runs the confirmed action inside the dialog: it stays open (pending)
	 * until the handler calls `call.end(true)`, and stays open on failure so
	 * the user can retry. Without it, confirming resolves `true` immediately.
	 */
	mutationFn?: MutationFn<boolean>;
}

/** Resolves `true` when confirmed, `false` when cancelled or dismissed. */
export const Confirm = createCallable<ConfirmProps, boolean>(
	({
		call,
		title,
		description,
		confirmLabel,
		cancelLabel,
		destructive = true,
		mutationFn,
	}) => {
		const { t } = useTranslation();
		const confirm = useMutationFlow(call, mutationFn);
		return (
			<Dialog
				open={!call.ended}
				onOpenChange={(open) => !open && !confirm.pending && call.end(false)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{title}</DialogTitle>
					</DialogHeader>
					<div className="px-6 pb-4 text-muted-foreground text-sm">
						{description}
					</div>
					<DialogFooter className="gap-2 sm:gap-0">
						<Button
							variant="ghost"
							onClick={() => call.end(false)}
							disabled={confirm.pending}
						>
							{cancelLabel ?? t("common.actions.cancel")}
						</Button>
						<Button
							variant={destructive ? "destructive" : "default"}
							onClick={() => confirm().orEnd(true)}
							disabled={confirm.pending}
						>
							{confirm.pending ? (
								<Spinner className="mr-2 text-primary" />
							) : null}
							{confirmLabel ?? t("common.actions.confirm")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		);
	},
	DIALOG_EXIT_MS,
);

export interface ConfirmActionRequest {
	title: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	/** Runs while the dialog shows a pending state; the dialog closes afterwards. */
	onConfirm: () => unknown;
}

/**
 * Confirms then runs `onConfirm` inside the dialog. Resolves `true` when the
 * action ran, `false` when the user cancelled.
 */
export function confirmAction({
	title,
	message,
	confirmText,
	cancelText,
	onConfirm,
}: ConfirmActionRequest) {
	return Confirm.call({
		title,
		description: message,
		confirmLabel: confirmText,
		cancelLabel: cancelText,
		mutationFn: async (call) => {
			try {
				await onConfirm();
			} finally {
				call.end(true);
			}
		},
	});
}
