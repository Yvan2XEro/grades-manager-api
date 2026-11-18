import type { LucideIcon } from "lucide-react";
import { Download } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

/** Row of headline figures of a statistics tab, with its Excel export button. */
export function StatTabHeader({
	children,
	onExport,
}: {
	children: ReactNode;
	onExport: () => void;
}) {
	const { t } = useTranslation();
	return (
		<div className="flex items-center justify-between">
			{children}
			<Button variant="outline" size="sm" onClick={onExport} className="gap-2">
				<Download className="h-4 w-4" />
				{t("admin.statistics.export")}
			</Button>
		</div>
	);
}

/** A big number with its label, optionally preceded by an icon tile. */
export function StatFigure({
	icon: Icon,
	value,
	label,
}: {
	icon?: LucideIcon;
	value: ReactNode;
	label: string;
}) {
	const figure = (
		<div>
			<p className="font-bold text-2xl tabular-nums">{value}</p>
			<p className="text-muted-foreground text-sm">{label}</p>
		</div>
	);
	if (!Icon) return figure;
	return (
		<div className="flex items-center gap-3">
			<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
				<Icon className="h-5 w-5 text-primary" />
			</div>
			{figure}
		</div>
	);
}
