import { useTranslation } from "react-i18next";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	registrationCounterScopes,
	registrationFormatFields,
} from "../../../../../server/src/db/schema/registration-number-types";
import { toggleCounterScope } from "../services/registration-format";
import type { RegistrationFormatField, Segment } from "../types";

interface OptionsProps<S extends Segment> {
	segment: S;
	onChange: (segment: Segment) => void;
}

/** Text of a literal segment. */
export function LiteralSegmentOptions({
	segment,
	onChange,
}: OptionsProps<Extract<Segment, { kind: "literal" }>>) {
	const { t } = useTranslation();
	return (
		<div className="space-y-2">
			<Label>
				{t("admin.registrationNumbers.segments.literalValue", {
					defaultValue: "Text value",
				})}
			</Label>
			<Input
				value={segment.value}
				onChange={(event) =>
					onChange({
						...segment,
						value: event.target.value,
					})
				}
			/>
		</div>
	);
}

/** Field, transform, length and fallback of a data field segment. */
export function FieldSegmentOptions({
	segment,
	onChange,
}: OptionsProps<Extract<Segment, { kind: "field" }>>) {
	const { t } = useTranslation();
	return (
		<div className="grid gap-4 md:grid-cols-2">
			<div className="space-y-2">
				<Label>
					{t("admin.registrationNumbers.segments.fieldSelect", {
						defaultValue: "Select field",
					})}
				</Label>
				<Select
					value={segment.field}
					onValueChange={(value) =>
						onChange({
							...segment,
							field: value as RegistrationFormatField,
						})
					}
				>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{registrationFormatFields.map((field) => (
							<SelectItem key={field} value={field}>
								{field}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<div className="space-y-2">
				<Label>
					{t("admin.registrationNumbers.segments.transform", {
						defaultValue: "Transform",
					})}
				</Label>
				<Select
					value={segment.transform ?? "upper"}
					onValueChange={(value) =>
						onChange({
							...segment,
							transform: value as "upper" | "lower" | "none",
						})
					}
				>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="upper">
							{t("admin.registrationNumbers.segments.uppercase", {
								defaultValue: "Uppercase",
							})}
						</SelectItem>
						<SelectItem value="lower">
							{t("admin.registrationNumbers.segments.lowercase", {
								defaultValue: "Lowercase",
							})}
						</SelectItem>
						<SelectItem value="none">
							{t("admin.registrationNumbers.segments.none", {
								defaultValue: "Original",
							})}
						</SelectItem>
					</SelectContent>
				</Select>
			</div>
			<div className="space-y-2">
				<Label>
					{t("admin.registrationNumbers.segments.length", {
						defaultValue: "Max length",
					})}
				</Label>
				<Input
					type="number"
					min={1}
					value={segment.length?.toString() ?? ""}
					onChange={(event) => {
						const value = event.target.value;
						onChange({
							...segment,
							length: value ? Number(value) : undefined,
						});
					}}
				/>
			</div>
			<div className="space-y-2">
				<Label>
					{t("admin.registrationNumbers.segments.fallback", {
						defaultValue: "Fallback",
					})}
				</Label>
				<Input
					value={segment.fallback ?? ""}
					onChange={(event) =>
						onChange({
							...segment,
							fallback: event.target.value || undefined,
						})
					}
				/>
			</div>
		</div>
	);
}

/** Width, start, padding and scope of a counter segment. */
export function CounterSegmentOptions({
	segment,
	onChange,
}: OptionsProps<Extract<Segment, { kind: "counter" }>>) {
	const { t } = useTranslation();
	return (
		<div className="space-y-4">
			<div className="grid gap-4 md:grid-cols-2">
				<div className="space-y-2">
					<Label>
						{t("admin.registrationNumbers.segments.counterWidth", {
							defaultValue: "Width",
						})}
					</Label>
					<Input
						type="number"
						min={1}
						value={segment.width?.toString() ?? ""}
						onChange={(event) =>
							onChange({
								...segment,
								width: event.target.value
									? Number(event.target.value)
									: undefined,
							})
						}
					/>
				</div>
				<div className="space-y-2">
					<Label>
						{t("admin.registrationNumbers.segments.counterStart", {
							defaultValue: "Start value",
						})}
					</Label>
					<Input
						type="number"
						min={0}
						value={segment.start?.toString() ?? ""}
						onChange={(event) =>
							onChange({
								...segment,
								start: event.target.value
									? Number(event.target.value)
									: undefined,
							})
						}
					/>
				</div>
			</div>
			<div className="space-y-2">
				<Label>
					{t("admin.registrationNumbers.segments.counterPad", {
						defaultValue: "Pad character",
					})}
				</Label>
				<Input
					value={segment.padChar ?? "0"}
					maxLength={1}
					onChange={(event) =>
						onChange({
							...segment,
							padChar: event.target.value || "0",
						})
					}
				/>
			</div>
			<div className="space-y-2">
				<Label>
					{t("admin.registrationNumbers.segments.counterScope", {
						defaultValue: "Counter scope",
					})}
				</Label>
				<div className="flex flex-wrap gap-3">
					{registrationCounterScopes.map((scope) => (
						<label
							key={scope}
							className="flex items-center gap-2 text-foreground text-sm"
						>
							<Checkbox
								checked={segment.scope?.includes(scope) ?? false}
								onCheckedChange={() =>
									onChange(toggleCounterScope(segment, scope))
								}
							/>
							{scope}
						</label>
					))}
				</div>
			</div>
		</div>
	);
}
