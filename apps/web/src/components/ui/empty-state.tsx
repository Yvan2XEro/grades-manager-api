import type React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface EmptyStateCTAProps {
	label: string;
	onClick: () => void;
	icon?: React.ReactNode;
}

interface EmptyStateProps {
	icon?: React.ReactNode;
	title: string;
	description?: string;
	cta?: EmptyStateCTAProps;
	className?: string;
}

export function EmptyState({
	icon,
	title,
	description,
	cta,
	className,
}: EmptyStateProps) {
	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-8 text-center",
				className,
			)}
		>
			{icon && (
				<div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
					{icon}
				</div>
			)}
			<div className="max-w-sm space-y-1">
				<p className="font-medium text-foreground text-sm">{title}</p>
				{description && (
					<p className="text-muted-foreground text-xs">{description}</p>
				)}
			</div>
			{cta && (
				<Button size="sm" onClick={cta.onClick}>
					{cta.icon && <span className="mr-1">{cta.icon}</span>}
					{cta.label}
				</Button>
			)}
		</div>
	);
}
