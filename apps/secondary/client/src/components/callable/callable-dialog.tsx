import type * as React from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

/** Matches the Radix close animation (`duration-200`) so it can finish before unmount. */
export const DIALOG_EXIT_MS = 200;

interface CallableDialogProps<Response> {
	/** The CallContext received by the Callable component. */
	call: { ended: boolean; end: (response: Response) => void };
	/** Response sent back to the caller when the dialog is dismissed (Esc, overlay, ✕). */
	dismissValue: Response;
	title: React.ReactNode;
	description?: React.ReactNode;
	/** Blocks dismissal while a mutation is in flight. */
	preventDismiss?: boolean;
	className?: string;
	children: React.ReactNode;
}

/**
 * Dialog shell shared by every Callable modal: wires `open` to `call.ended`
 * and resolves the Call with `dismissValue` when the user closes it.
 */
export function CallableDialog<Response>({
	call,
	dismissValue,
	title,
	description,
	preventDismiss,
	className,
	children,
}: CallableDialogProps<Response>) {
	return (
		<Dialog
			open={!call.ended}
			onOpenChange={(open) => {
				if (!open && !preventDismiss) call.end(dismissValue);
			}}
		>
			<DialogContent className={className}>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					{description && <DialogDescription>{description}</DialogDescription>}
				</DialogHeader>
				{children}
			</DialogContent>
		</Dialog>
	);
}
