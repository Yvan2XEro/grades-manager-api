import { Plus } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

interface QuickCreateProps {
	/**
	 * Opens a nested Callable to create the missing option. The handler inserts
	 * the created entity in the React Query cache feeding the select, then
	 * selects it; resolving without doing anything means the user cancelled.
	 */
	onCreate: () => Promise<unknown>;
	/** Accessible label of the "+" button. */
	label: string;
	disabled?: boolean;
	className?: string;
	/**
	 * The select (Select, Combobox, CodedEntitySelect…) the "+" sits next to.
	 * Omit it to render the "+" button alone, e.g. next to a checkbox list.
	 */
	children?: React.ReactNode;
}

/** Lays out a select with an aligned "+" that creates a missing option in place. */
export function QuickCreate({
	onCreate,
	label,
	disabled,
	className,
	children,
}: QuickCreateProps) {
	const [pending, setPending] = useState(false);

	const handleClick = async () => {
		setPending(true);
		try {
			await onCreate();
		} finally {
			setPending(false);
		}
	};

	const button = (
		<Button
			type="button"
			variant="outline"
			size="icon"
			className="shrink-0"
			onClick={handleClick}
			disabled={disabled || pending}
			aria-label={label}
			title={label}
		>
			{pending ? <Spinner className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
		</Button>
	);

	if (children == null) return button;

	return (
		<div className={cn("flex items-center gap-2", className)}>
			<div className="min-w-0 flex-1">{children}</div>
			{button}
		</div>
	);
}
