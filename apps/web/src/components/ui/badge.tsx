import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
	"inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-full border px-2.5 py-0.5 font-medium text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 [&>svg]:pointer-events-none [&>svg]:size-3",
	{
		variants: {
			variant: {
				default:
					"border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
				secondary:
					"border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/80",
				destructive:
					"border-destructive/20 border-transparent bg-destructive/12 text-destructive dark:bg-destructive/20 [a&]:hover:bg-destructive/20",
				outline:
					"border-border bg-transparent text-foreground [a&]:hover:bg-accent",
				success:
					"border-emerald-500/25 border-transparent bg-emerald-500/12 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-400",
				warning:
					"border-amber-500/25 border-transparent bg-amber-500/12 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-400",
				info: "border-sky-500/25 border-transparent bg-sky-500/12 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/15 dark:text-sky-400",
				muted: "border-border bg-muted text-muted-foreground",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

function Badge({
	className,
	variant,
	asChild = false,
	...props
}: React.ComponentProps<"span"> &
	VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
	const Comp = asChild ? Slot : "span";

	return (
		<Comp
			data-slot="badge"
			className={cn(badgeVariants({ variant }), className)}
			{...props}
		/>
	);
}

export { Badge, badgeVariants };
