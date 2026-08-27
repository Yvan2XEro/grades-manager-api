import type * as React from "react";

import { cn } from "@/lib/utils";

/**
 * A styled native <select> wrapper following the shadcn/ui visual pattern.
 * Uses native HTML select to avoid requiring @radix-ui/react-select.
 */
function Select({ className, ...props }: React.ComponentProps<"select">) {
	return (
		<select
			data-slot="select"
			className={cn(
				"flex h-9 w-full appearance-none rounded border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50",
				className,
			)}
			{...props}
		/>
	);
}

function SelectOption({ className, ...props }: React.ComponentProps<"option">) {
	return (
		<option
			className={cn("bg-background text-foreground", className)}
			{...props}
		/>
	);
}

export { Select, SelectOption };
