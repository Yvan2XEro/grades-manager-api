import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Titled card of a chart, with a "no data" message when it is empty. */
export function ChartCard({
	title,
	isEmpty,
	emptyText,
	emptyClassName = "py-8",
	className,
	children,
}: {
	title: string;
	isEmpty: boolean;
	/** Defaults to `admin.statistics.noData`. */
	emptyText?: string;
	emptyClassName?: string;
	className?: string;
	children: ReactNode;
}) {
	const { t } = useTranslation();
	return (
		<Card className={className}>
			<CardHeader className="pb-2">
				<CardTitle className="text-base">{title}</CardTitle>
			</CardHeader>
			<CardContent>
				{isEmpty ? (
					<p
						className={cn(
							"text-center text-muted-foreground text-sm",
							emptyClassName,
						)}
					>
						{emptyText ?? t("admin.statistics.noData")}
					</p>
				) : (
					children
				)}
			</CardContent>
		</Card>
	);
}
