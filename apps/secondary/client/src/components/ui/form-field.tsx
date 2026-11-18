import type * as React from "react";
import { Children, cloneElement, isValidElement, useId } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FormFieldProps {
	label: string;
	error?: string;
	hint?: string;
	required?: boolean;
	children: React.ReactNode;
	className?: string;
}

export function FormField({
	label,
	error,
	hint,
	required,
	children,
	className,
}: FormFieldProps) {
	const id = useId();
	const childArray = Children.toArray(children);
	const enhanced = childArray.map((child, i) => {
		if (i === 0 && isValidElement(child)) {
			return cloneElement(child as React.ReactElement<{ id?: string }>, { id });
		}
		return child;
	});

	return (
		<div className={cn("flex flex-col gap-1.5", className)}>
			<Label htmlFor={id}>
				{label}
				{required && <span className="ml-0.5 text-destructive">*</span>}
			</Label>
			{enhanced}
			{hint && !error && (
				<p className="text-muted-foreground text-xs">{hint}</p>
			)}
			{error && <p className="text-destructive text-xs">{error}</p>}
		</div>
	);
}
