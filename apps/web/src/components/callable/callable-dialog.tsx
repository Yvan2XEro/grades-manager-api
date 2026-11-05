import type React from "react";
import { useEffect, useRef } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

/** Matches the dialog close animation (`duration-200`) so it can finish before unmount. */
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
	/** Extra classes for the dialog panel, e.g. a max width. */
	className?: string;
	/** Extra classes for the scrollable body. */
	contentClassName?: string;
	children: React.ReactNode;
}

/**
 * Dialog shell shared by every Callable modal (same look as `FormModal`):
 * wires `open` to `call.ended` and resolves the Call with `dismissValue`
 * when the user closes it.
 */
export function CallableDialog<Response>({
	call,
	dismissValue,
	title,
	description,
	preventDismiss,
	className,
	contentClassName,
	children,
}: CallableDialogProps<Response>) {
	const wasOpen = useRef(false);
	useEffect(() => {
		if (!call.ended && !wasOpen.current) sounds.open();
		else if (call.ended && wasOpen.current) sounds.close();
		wasOpen.current = !call.ended;
	}, [call.ended]);

	return (
		<Dialog
			open={!call.ended}
			onOpenChange={(open) => {
				if (!open && !preventDismiss) call.end(dismissValue);
			}}
		>
			<DialogContent
				className={cn("overflow-hidden p-0 sm:max-w-2xl", className)}
			>
				<div className="h-1 w-full bg-gradient-to-r from-primary/80 to-primary/40" />
				<DialogHeader className="px-6 pt-5">
					<DialogTitle>{title}</DialogTitle>
					{description && <DialogDescription>{description}</DialogDescription>}
				</DialogHeader>
				<div
					className={cn(
						"max-h-[calc(80vh-8rem)] overflow-y-auto px-6 pb-6",
						contentClassName,
					)}
				>
					{children}
				</div>
			</DialogContent>
		</Dialog>
	);
}
