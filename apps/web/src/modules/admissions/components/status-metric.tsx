/** One figure of the application status card. */
export function StatusMetric({
	label,
	value,
}: {
	label: string;
	value: string | number;
}) {
	return (
		<div className="rounded-lg border bg-muted/30 p-3">
			<p className="text-muted-foreground text-xs">{label}</p>
			<p className="font-semibold text-lg">{value}</p>
		</div>
	);
}
