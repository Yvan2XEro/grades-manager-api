import { createCallable } from "react-call";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface ConfirmProps {
	title: string;
	description: string;
	confirmLabel?: string;
	cancelLabel?: string;
	destructive?: boolean;
}

export const Confirm = createCallable<ConfirmProps, boolean>(
	({
		call,
		title,
		description,
		confirmLabel = "Confirm",
		cancelLabel = "Cancel",
		destructive = false,
	}) => (
		<Dialog
			open={!call.ended}
			onOpenChange={(open) => !open && call.end(false)}
		>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>
				<p className="text-muted-foreground text-sm">{description}</p>
				<div className="flex justify-end gap-2 pt-2">
					<Button variant="ghost" onClick={() => call.end(false)}>
						{cancelLabel}
					</Button>
					<Button
						variant={destructive ? "destructive" : "default"}
						onClick={() => call.end(true)}
					>
						{confirmLabel}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	),
);
