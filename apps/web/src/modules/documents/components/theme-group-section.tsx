import { detectFieldKind, fieldLabel } from "../services/theme-fields";
import { FieldEditor } from "./theme-field-editor";

export function GroupSection({
	title,
	description,
	group,
	path,
	setField,
	valueOverride,
}: {
	title: string;
	description?: string;
	group: Record<string, unknown>;
	path: string[];
	setField: (path: string[], v: unknown) => void;
	valueOverride: Record<string, unknown> | null;
}) {
	const entries = Object.entries(group);
	return (
		<div className="rounded border border-border p-4">
			<div className="mb-3">
				<h4 className="font-semibold text-sm">{title}</h4>
				{description && (
					<p className="mt-0.5 text-muted-foreground text-xs">{description}</p>
				)}
			</div>
			<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
				{entries.map(([key, val]) => {
					const kind = detectFieldKind(val, key);
					if (kind === "object" && val && typeof val === "object") {
						// Nested (e.g. page.margins)
						return (
							<div key={key} className="md:col-span-2">
								<GroupSection
									title={fieldLabel(path[path.length - 1], key)}
									group={val as Record<string, unknown>}
									path={[...path, key]}
									setField={setField}
									valueOverride={
										(valueOverride?.[key] as
											| Record<string, unknown>
											| undefined) ?? null
									}
								/>
							</div>
						);
					}
					return (
						<FieldEditor
							key={key}
							label={fieldLabel(path[path.length - 1], key)}
							value={val}
							kind={kind}
							isOverridden={
								valueOverride !== null && key in (valueOverride ?? {})
							}
							onChange={(next) => setField([...path, key], next)}
						/>
					);
				})}
			</div>
		</div>
	);
}
