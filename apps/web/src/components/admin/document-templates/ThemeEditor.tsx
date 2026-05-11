import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	detectFieldKind,
	type FieldKind,
	FONT_LIST,
	fieldLabel,
	GROUP_META,
	TAB_GROUP_ORDER,
	TAB_LABELS,
	type ThemeTab,
} from "./theme-fields";

type ThemeValue = Record<string, unknown>;

interface ThemeEditorProps {
	/** Default theme used as the visual baseline (typically returned by `getThemePresets`). */
	defaultTheme: ThemeValue;
	/** Current value: only the fields the user has overridden. Empty `{}` = inherit defaults. */
	value: Partial<ThemeValue>;
	onChange: (next: Partial<ThemeValue>) => void;
	/** When provided, shows a "preset" picker that pre-fills the override blob. */
	presets?: Array<{ id: string; name: string; theme: ThemeValue }>;
}

function setIn(
	obj: Record<string, unknown>,
	path: string[],
	val: unknown,
): Record<string, unknown> {
	if (path.length === 0) return obj;
	const [head, ...rest] = path;
	const current = (obj[head] ?? {}) as Record<string, unknown>;
	return {
		...obj,
		[head]:
			rest.length === 0
				? val
				: setIn(
						typeof current === "object" && current !== null ? current : {},
						rest,
						val,
					),
	};
}

function getIn(obj: Record<string, unknown>, path: string[]): unknown {
	let cur: unknown = obj;
	for (const seg of path) {
		if (cur && typeof cur === "object" && seg in (cur as object)) {
			cur = (cur as Record<string, unknown>)[seg];
		} else {
			return undefined;
		}
	}
	return cur;
}

export function ThemeEditor({
	defaultTheme,
	value,
	onChange,
	presets,
}: ThemeEditorProps) {
	const merged = useMemo(
		() => deepMerge(defaultTheme, value),
		[defaultTheme, value],
	);

	const tabs: ThemeTab[] = ["typography", "colors", "sizes", "options"];

	const setField = (path: string[], v: unknown) => {
		// Persist override (we always write into `value` even if v equals default —
		// keeps round-trips stable; future: detect equality and prune).
		onChange(setIn(value as Record<string, unknown>, path, v));
	};

	return (
		<div className="space-y-4">
			{presets && presets.length > 0 && (
				<div className="flex items-center gap-2">
					<Label className="text-muted-foreground text-xs">Préréglage:</Label>
					<Select
						onValueChange={(presetId) => {
							const p = presets.find((x) => x.id === presetId);
							if (!p) return;
							onChange(p.theme);
						}}
					>
						<SelectTrigger className="h-8 w-48">
							<SelectValue placeholder="Appliquer un préréglage" />
						</SelectTrigger>
						<SelectContent>
							{presets.map((p) => (
								<SelectItem key={p.id} value={p.id}>
									{p.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<button
						type="button"
						onClick={() => onChange({})}
						className="text-muted-foreground text-xs underline hover:text-foreground"
					>
						Réinitialiser tout
					</button>
				</div>
			)}
			<Tabs defaultValue="typography">
				<TabsList>
					{tabs.map((tab) => (
						<TabsTrigger key={tab} value={tab}>
							{TAB_LABELS[tab]}
						</TabsTrigger>
					))}
				</TabsList>
				{tabs.map((tab) => (
					<TabsContent key={tab} value={tab} className="space-y-4">
						{TAB_GROUP_ORDER[tab].map((groupKey) => {
							const group = (merged as Record<string, unknown>)[groupKey];
							if (!group || typeof group !== "object") return null;
							const meta = GROUP_META[groupKey];
							return (
								<GroupSection
									key={groupKey}
									title={meta?.label ?? groupKey}
									description={meta?.description}
									group={group as Record<string, unknown>}
									path={[groupKey]}
									setField={setField}
									valueOverride={
										(value[groupKey] as Record<string, unknown> | undefined) ??
										null
									}
								/>
							);
						})}
					</TabsContent>
				))}
			</Tabs>
		</div>
	);
}

function GroupSection({
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

function FieldEditor({
	label,
	value,
	kind,
	isOverridden,
	onChange,
}: {
	label: string;
	value: unknown;
	kind: FieldKind;
	isOverridden: boolean;
	onChange: (v: unknown) => void;
}) {
	if (kind === "boolean") {
		return (
			<div className="flex items-center justify-between rounded px-2 py-1.5 hover:bg-muted/40">
				<Label className="flex items-center gap-2 text-xs">
					{label}
					{isOverridden && (
						<span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
					)}
				</Label>
				<Switch checked={Boolean(value)} onCheckedChange={(v) => onChange(v)} />
			</div>
		);
	}

	if (kind === "color") {
		return (
			<div className="space-y-1">
				<Label className="flex items-center gap-2 text-xs">
					{label}
					{isOverridden && (
						<span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
					)}
				</Label>
				<div className="flex items-center gap-2">
					<input
						type="color"
						value={String(value ?? "#000000")}
						onChange={(e) => onChange(e.target.value)}
						className="h-8 w-10 cursor-pointer rounded border border-input"
					/>
					<Input
						value={String(value ?? "")}
						onChange={(e) => onChange(e.target.value)}
						className="h-8 font-mono text-xs"
					/>
				</div>
			</div>
		);
	}

	if (kind === "font") {
		return (
			<div className="space-y-1">
				<Label className="flex items-center gap-2 text-xs">
					{label}
					{isOverridden && (
						<span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
					)}
				</Label>
				<Select value={String(value ?? "")} onValueChange={onChange}>
					<SelectTrigger className="h-8">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{FONT_LIST.map((f) => (
							<SelectItem key={f} value={f}>
								<span style={{ fontFamily: f }}>{f.split(",")[0]}</span>
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		);
	}

	if (kind === "language") {
		return (
			<div className="space-y-1">
				<Label className="flex items-center gap-2 text-xs">
					{label}
					{isOverridden && (
						<span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
					)}
				</Label>
				<Select value={String(value ?? "french")} onValueChange={onChange}>
					<SelectTrigger className="h-8">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="french">Français</SelectItem>
						<SelectItem value="english">English</SelectItem>
					</SelectContent>
				</Select>
			</div>
		);
	}

	if (kind === "page-size") {
		return (
			<div className="space-y-1">
				<Label className="flex items-center gap-2 text-xs">
					{label}
					{isOverridden && (
						<span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
					)}
				</Label>
				<Select value={String(value ?? "A4")} onValueChange={onChange}>
					<SelectTrigger className="h-8">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="A4">A4</SelectItem>
						<SelectItem value="A3">A3</SelectItem>
						<SelectItem value="Letter">Letter</SelectItem>
					</SelectContent>
				</Select>
			</div>
		);
	}

	if (kind === "page-orientation") {
		return (
			<div className="space-y-1">
				<Label className="flex items-center gap-2 text-xs">
					{label}
					{isOverridden && (
						<span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
					)}
				</Label>
				<Select value={String(value ?? "portrait")} onValueChange={onChange}>
					<SelectTrigger className="h-8">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="portrait">Portrait</SelectItem>
						<SelectItem value="landscape">Paysage</SelectItem>
					</SelectContent>
				</Select>
			</div>
		);
	}

	if (kind === "number") {
		const n = Number(value);
		const isFraction = !Number.isInteger(n) || (n > 0 && n < 1);
		const step = isFraction ? 0.01 : 1;
		const min = inferMin(label, n);
		const max = inferMax(label, n);
		return (
			<div className="space-y-1">
				<div className="flex items-center justify-between">
					<Label className="flex items-center gap-2 text-xs">
						{label}
						{isOverridden && (
							<span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
						)}
					</Label>
					<Input
						type="number"
						value={n}
						step={step}
						onChange={(e) => onChange(Number(e.target.value))}
						className="h-7 w-20 text-xs"
					/>
				</div>
				<Slider
					value={[n]}
					min={min}
					max={max}
					step={step}
					onValueChange={(v) => onChange(v[0])}
				/>
			</div>
		);
	}

	// fallback: text
	return (
		<div className="space-y-1">
			<Label className="flex items-center gap-2 text-xs">
				{label}
				{isOverridden && (
					<span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
				)}
			</Label>
			<Input
				value={String(value ?? "")}
				onChange={(e) => onChange(e.target.value)}
				className="h-8 text-xs"
			/>
		</div>
	);
}

function inferMin(label: string, current: number): number {
	if (current >= 0 && current <= 1) return 0;
	if (label.toLowerCase().includes("opacité")) return 0;
	if (label.toLowerCase().includes("taille") || label.includes("Hauteur"))
		return 0;
	if (label.toLowerCase().includes("largeur")) return 0;
	if (current < 0) return -100;
	return 0;
}

function inferMax(label: string, current: number): number {
	if (current <= 1 && current >= 0 && current % 1 !== 0) return 1; // opacity
	if (label.toLowerCase().includes("opacité")) return 1;
	const upper = current * 4;
	return Math.max(20, Math.ceil(upper));
}

function deepMerge<T extends Record<string, unknown>>(
	base: T,
	override: Partial<T>,
): T {
	const out: Record<string, unknown> = { ...base };
	for (const [k, v] of Object.entries(override ?? {})) {
		const existing = (base as Record<string, unknown>)[k];
		if (
			v !== null &&
			typeof v === "object" &&
			!Array.isArray(v) &&
			existing &&
			typeof existing === "object" &&
			!Array.isArray(existing)
		) {
			out[k] = deepMerge(
				existing as Record<string, unknown>,
				v as Record<string, unknown>,
			);
		} else {
			out[k] = v;
		}
	}
	return out as T;
}

export { deepMerge as deepMergeTheme };
