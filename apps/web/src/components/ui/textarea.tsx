import type * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
	return (
		<textarea
			data-slot="textarea"
			className={cn(
				"field-sizing-content flex min-h-20 w-full rounded-md border border-input bg-input px-3 py-2 text-sm outline-none transition-all duration-150",
				"placeholder:text-muted-foreground/55",
				"focus-visible:border-primary/50 focus-visible:ring-3 focus-visible:ring-primary/15",
				"disabled:cursor-not-allowed disabled:opacity-50",
				"aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
				"dark:bg-input/20 dark:aria-invalid:ring-destructive/40",
				className,
			)}
			{...props}
		/>
	);
}

export { Textarea };
