import { Loader2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Icon of an export button, replaced by a spinner while it runs. */
export function BusyIcon({
	busy,
	icon: Icon,
	className,
}: {
	busy: boolean;
	icon: LucideIcon;
	className: string;
}) {
	return busy ? (
		<Loader2 className={cn(className, "animate-spin")} />
	) : (
		<Icon className={className} />
	);
}

/** Numbered step bullet of the grade export page. */
export function StepBadge({ step, muted }: { step: number; muted?: boolean }) {
	return (
		<span
			className={cn(
				"flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-bold text-xs",
				muted
					? "bg-primary/20 text-primary"
					: "bg-primary text-primary-foreground",
			)}
		>
			{step}
		</span>
	);
}

/** Small grey hint shown next to a card title while a prerequisite is missing. */
export function MissingHint({ children }: { children: React.ReactNode }) {
	return (
		<span className="shrink-0 rounded-md bg-muted px-2 py-1 text-muted-foreground text-xs">
			{children}
		</span>
	);
}
