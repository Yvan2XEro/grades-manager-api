import { Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { useGradeScale } from "../hooks/use-grade-scale";
import type { MentionRange } from "../types";

interface Props {
	ranges: MentionRange[];
	actions: ReturnType<typeof useGradeScale>["rangeActions"];
	hasOverlap: boolean;
}

/** Editable mention ranges, highest first; duplicated minimums are flagged. */
export function MentionRangesTable({ ranges, actions, hasOverlap }: Props) {
	const { t } = useTranslation();
	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<h3 className="font-medium text-sm">
					{t("admin.gradeScale.mentionRanges")}
				</h3>
				<Button size="sm" variant="outline" onClick={actions.add}>
					<Plus className="mr-1.5 h-3.5 w-3.5" />
					{t("common.add")}
				</Button>
			</div>

			<div className="overflow-hidden rounded-lg border">
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b bg-muted/40 text-muted-foreground text-xs uppercase tracking-wide">
							<th className="px-3 py-2 text-left">
								{t("admin.gradeScale.key")}
							</th>
							<th className="px-3 py-2 text-left">
								{t("admin.gradeScale.labelFr")}
							</th>
							<th className="px-3 py-2 text-left">
								{t("admin.gradeScale.labelEn")}
							</th>
							<th className="px-3 py-2 text-left">
								{t("admin.gradeScale.letter")}
							</th>
							<th className="px-3 py-2 text-left">
								{t("admin.gradeScale.min")}
							</th>
							<th className="px-3 py-2" />
						</tr>
					</thead>
					<tbody>
						{ranges
							.slice()
							.sort((a, b) => b.min - a.min)
							.map((range) => {
								const origIdx = ranges.indexOf(range);
								const isDuplicate =
									ranges.filter((r) => r.min === range.min).length > 1;
								return (
									<tr
										key={origIdx}
										className="border-b last:border-0 hover:bg-muted/20"
									>
										<td className="px-3 py-1.5">
											<Input
												className="h-7 text-xs"
												value={range.key}
												onChange={(e) =>
													actions.update(origIdx, "key", e.target.value)
												}
											/>
										</td>
										<td className="px-3 py-1.5">
											<Input
												className="h-7 text-xs"
												value={range.label}
												onChange={(e) =>
													actions.update(origIdx, "label", e.target.value)
												}
											/>
										</td>
										<td className="px-3 py-1.5">
											<Input
												className="h-7 text-xs"
												value={range.labelEn}
												onChange={(e) =>
													actions.update(origIdx, "labelEn", e.target.value)
												}
											/>
										</td>
										<td className="w-16 px-3 py-1.5">
											<Input
												className="h-7 text-xs"
												value={range.gradeLetter}
												maxLength={2}
												onChange={(e) =>
													actions.update(origIdx, "gradeLetter", e.target.value)
												}
											/>
										</td>
										<td className="w-24 px-3 py-1.5">
											<Input
												type="number"
												className={`h-7 text-xs ${isDuplicate ? "border-destructive ring-1 ring-destructive/50" : ""}`}
												min={0}
												max={20}
												step={0.5}
												value={range.min}
												onChange={(e) =>
													actions.update(origIdx, "min", e.target.value)
												}
											/>
										</td>
										<td className="px-3 py-1.5">
											<Button
												size="icon"
												variant="ghost"
												className="h-7 w-7 text-destructive hover:text-destructive"
												onClick={() => actions.remove(origIdx)}
												disabled={ranges.length <= 1}
											>
												<Trash2 className="h-3.5 w-3.5" />
											</Button>
										</td>
									</tr>
								);
							})}
					</tbody>
				</table>
			</div>

			{hasOverlap && (
				<p className="font-medium text-destructive text-xs">
					{t("admin.gradeScale.overlapError")}
				</p>
			)}

			<p className="text-[11px] text-muted-foreground">
				{t("admin.gradeScale.rangeHint")}
			</p>
		</div>
	);
}
