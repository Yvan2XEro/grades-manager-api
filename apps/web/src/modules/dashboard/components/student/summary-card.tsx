export function SummaryCard({
	icon,
	label,
	value,
	sub,
	color,
}: {
	icon: React.ReactNode;
	label: string;
	value: React.ReactNode;
	sub?: string;
	color: string;
}) {
	return (
		<div className="flex items-start gap-3 rounded-xl border bg-card p-4 shadow-sm">
			<div
				className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}
			>
				{icon}
			</div>
			<div className="min-w-0">
				<p className="text-muted-foreground text-xs">{label}</p>
				<p className="mt-0.5 font-bold text-foreground text-xl tabular-nums">
					{value}
				</p>
				{sub && <p className="mt-0.5 text-muted-foreground text-xs">{sub}</p>}
			</div>
		</div>
	);
}
