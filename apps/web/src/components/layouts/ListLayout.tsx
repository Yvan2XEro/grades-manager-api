import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

interface ListLayoutProps {
	header?: ReactNode;
	/** Filters, bulk action bar… kept above the table. */
	toolbar?: ReactNode;
	/** Pagination, kept below the table. */
	footer?: ReactNode;
	/** The table; only its rows scroll (its header is sticky). */
	children: ReactNode;
}

/**
 * Page of a list: header, toolbar and footer stay in place while the table
 * area takes the remaining height and scrolls by itself (md and up).
 */
export function ListLayout({
	header,
	toolbar,
	footer,
	children,
}: ListLayoutProps) {
	return (
		<div className="flex min-h-0 flex-1 flex-col gap-4">
			{header}
			{toolbar}
			<Card className="flex min-h-64 flex-1 flex-col gap-0 overflow-hidden py-0">
				{children}
			</Card>
			{footer}
		</div>
	);
}

/** Layout of a page with tabs (`HubNav`) whose tabs may be list pages. */
export function HubLayout({ children }: { children: ReactNode }) {
	return <div className="flex min-h-0 flex-1 flex-col gap-6">{children}</div>;
}
