import { ArrowDown, ArrowUp, Hash, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { Segment } from "../types";
import {
	CounterSegmentOptions,
	FieldSegmentOptions,
	LiteralSegmentOptions,
} from "./segment-options";

interface Props {
	segment: Segment;
	index: number;
	isLast: boolean;
	onChange: (segment: Segment) => void;
	onKindChange: (kind: Segment["kind"]) => void;
	onMove: (direction: "up" | "down") => void;
	onRemove: () => void;
}

/** One segment of a registration number format: its kind and options. */
export function SegmentEditor({
	segment,
	index,
	isLast,
	onChange,
	onKindChange,
	onMove,
	onRemove,
}: Props) {
	const { t } = useTranslation();
	return (
		<Card className="border border-dashed">
			<CardContent className="space-y-4 pt-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2 font-medium text-foreground text-sm">
						<Hash className="h-4 w-4" />
						{t("admin.registrationNumbers.segments.segmentLabel", {
							defaultValue: "Segment {{index}}",
							index: index + 1,
						})}
					</div>
					<div className="flex items-center gap-2">
						<Button
							type="button"
							variant="ghost"
							size="icon"
							disabled={index === 0}
							onClick={() => onMove("up")}
						>
							<ArrowUp className="h-4 w-4" />
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							disabled={isLast}
							onClick={() => onMove("down")}
						>
							<ArrowDown className="h-4 w-4" />
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							onClick={onRemove}
						>
							<Trash2 className="h-4 w-4 text-red-500" />
						</Button>
					</div>
				</div>
				<div className="space-y-2">
					<Label>
						{t("admin.registrationNumbers.segments.typeLabel", {
							defaultValue: "Segment type",
						})}
					</Label>
					<Select
						value={segment.kind}
						onValueChange={(value) => onKindChange(value as Segment["kind"])}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="literal">
								{t("admin.registrationNumbers.segments.literal", {
									defaultValue: "Literal text",
								})}
							</SelectItem>
							<SelectItem value="field">
								{t("admin.registrationNumbers.segments.field", {
									defaultValue: "Data field",
								})}
							</SelectItem>
							<SelectItem value="counter">
								{t("admin.registrationNumbers.segments.counter", {
									defaultValue: "Counter",
								})}
							</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{segment.kind === "literal" && (
					<LiteralSegmentOptions segment={segment} onChange={onChange} />
				)}
				{segment.kind === "field" && (
					<FieldSegmentOptions segment={segment} onChange={onChange} />
				)}
				{segment.kind === "counter" && (
					<CounterSegmentOptions segment={segment} onChange={onChange} />
				)}
			</CardContent>
		</Card>
	);
}
