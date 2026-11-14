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
import { type FieldKind, FONT_LIST } from "../services/theme-fields";

/** Input of one theme field, picked from its detected kind. */
export function FieldEditor({
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
