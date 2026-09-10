import type * as React from "react";
import { Children, cloneElement, isValidElement, useId } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FormFieldProps {
	label: string;
	error?: string;
	required?: boolean;
	children: React.ReactNode;
	className?: string;
}

export function FormField({
	label,
	error,
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
			{error && <p className="text-destructive text-xs">{error}</p>}
		</div>
	);
}
