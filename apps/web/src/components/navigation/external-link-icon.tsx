import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Marks an action that takes the user to another page (out of the current
 * context). Actions that stay in context open a dialog instead (`PageDialog`).
 */
export function ExternalLinkIcon({ className }: { className?: string }) {
	return (
		<ExternalLink
			aria-hidden
			className={cn("ml-1.5 h-3.5 w-3.5 shrink-0 opacity-70", className)}
		/>
	);
}
