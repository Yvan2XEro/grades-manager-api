import type { ReactNode } from "react";

/** Titled block of the review drawer, closed by a separator. */
export function DrawerSection({
	title,
	icon,
	children,
}: {
	title: string;
	icon?: ReactNode;
	children: ReactNode;
}) {
	return (
		<section>
			<p className="mb-3 flex items-center gap-1.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
				{icon}
				{title}
			</p>
			{children}
			<div className="mt-5 border-b" />
		</section>
	);
}

export function InfoGrid({ children }: { children: ReactNode }) {
	return <div className="grid grid-cols-2 gap-2">{children}</div>;
}

/** One labelled value of the review drawer. */
export function Info({
	label,
	value,
	wide,
}: {
	label: string;
	value: string;
	wide?: boolean;
}) {
	return (
		<div
			className={`rounded-lg bg-muted/40 px-3 py-2 ${wide ? "col-span-2" : ""}`}
		>
			<p className="text-[10px] text-muted-foreground uppercase tracking-wide">
				{label}
			</p>
			<p className="font-medium text-sm">{value}</p>
		</div>
	);
}
