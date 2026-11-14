import { PlusCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { useRegistrationFormatDraft } from "../hooks/use-registration-format-draft";
import type { Segment } from "../types";
import { SegmentEditor } from "./segment-editor";

interface Props {
	segments: Segment[];
	actions: ReturnType<typeof useRegistrationFormatDraft>["segments"];
}

/** Ordered list of the segments of a format, with buttons to add each kind. */
export function FormatSegmentsCard({ segments, actions }: Props) {
	const { t } = useTranslation();
	const addButtons = [
		{
			kind: "literal",
			label: t("admin.registrationNumbers.segments.addLiteral", {
				defaultValue: "Add literal",
			}),
		},
		{
			kind: "field",
			label: t("admin.registrationNumbers.segments.addField", {
				defaultValue: "Add field",
			}),
		},
		{
			kind: "counter",
			label: t("admin.registrationNumbers.segments.addCounter", {
				defaultValue: "Add counter",
			}),
		},
	] as const;

	return (
		<Card>
			<CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
				<CardTitle>
					{t("admin.registrationNumbers.segments.title", {
						defaultValue: "Segments",
					})}
				</CardTitle>
				<div className="flex flex-wrap gap-2">
					{addButtons.map(({ kind, label }) => (
						<Button
							key={kind}
							type="button"
							size="sm"
							variant="outline"
							onClick={() => actions.add(kind)}
						>
							<PlusCircle className="mr-2 h-4 w-4" />
							{label}
						</Button>
					))}
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				{segments.length === 0 && (
					<p className="text-muted-foreground text-xs">
						{t("admin.registrationNumbers.segments.empty", {
							defaultValue:
								"Combine literals, fields, and counters to craft a pattern.",
						})}
					</p>
				)}
				{segments.map((segment, index) => (
					<SegmentEditor
						key={`segment-${index}`}
						segment={segment}
						index={index}
						isLast={index === segments.length - 1}
						onChange={(next) => actions.update(index, next)}
						onKindChange={(kind) => actions.changeKind(index, kind)}
						onMove={(direction) => actions.move(index, direction)}
						onRemove={() => actions.remove(index)}
					/>
				))}
			</CardContent>
		</Card>
	);
}
