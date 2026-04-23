import type React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
	title: string;
	description?: string;
	actions?: React.ReactNode;
	breadcrumb?: React.ReactNode;
	className?: string;
}

export function PageHeader({
	title,
	description,
	actions,
	breadcrumb,
	className,
}: PageHeaderProps) {
	return (
		<div className={cn("flex items-start justify-between gap-4", className)}>
			<div className="min-w-0 space-y-1">
				{breadcrumb && <div className="mb-1">{breadcrumb}</div>}
				<h1 className="truncate font-semibold text-2xl text-foreground tracking-tight">
					{title}
				</h1>
				{description && (
					<p className="text-muted-foreground text-sm">{description}</p>
				)}
			</div>
			{actions && (
				<div className="flex shrink-0 items-center gap-2">{actions}</div>
			)}
		</div>
	);
}
