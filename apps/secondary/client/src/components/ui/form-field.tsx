import type * as React from "react";
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
	return (
		<div className={cn("flex flex-col gap-1.5", className)}>
			<Label>
				{label}
				{required && <span className="ml-0.5 text-destructive">*</span>}
			</Label>
			{children}
			{error && <p className="text-destructive text-xs">{error}</p>}
		</div>
	);
}
