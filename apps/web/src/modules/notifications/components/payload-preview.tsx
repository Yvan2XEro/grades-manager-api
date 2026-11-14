/** First entries of a notification payload. */
export function PayloadPreview({ payload }: { payload: unknown }) {
	const entries = Object.entries(payload as Record<string, unknown>).slice(
		0,
		4,
	);
	if (entries.length === 0) return null;
	return (
		<dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
			{entries.map(([key, val]) => (
				<div key={key} className="flex flex-col">
					<dt className="font-medium text-[10px] text-muted-foreground uppercase tracking-wide">
						{key}
					</dt>
					<dd className="truncate text-foreground text-xs">
						{typeof val === "object" ? JSON.stringify(val) : String(val)}
					</dd>
				</div>
			))}
		</dl>
	);
}
