import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { findMention } from "../services/grade-scale";
import type { MentionRange } from "../types";

/** Shows the mention a typed score would earn with the current ranges. */
export function GradeScalePreview({ ranges }: { ranges: MentionRange[] }) {
	const { t } = useTranslation();
	const [previewScore, setPreviewScore] = useState("");
	const mention = useMemo(() => {
		const score = Number.parseFloat(previewScore);
		return Number.isNaN(score) ? null : findMention(ranges, score);
	}, [previewScore, ranges]);

	return (
		<div className="max-w-xs space-y-2">
			<Label>{t("admin.gradeScale.preview")}</Label>
			<div className="flex items-center gap-3">
				<Input
					type="number"
					min={0}
					max={20}
					step={0.5}
					placeholder={t("admin.gradeScale.previewPlaceholder")}
					value={previewScore}
					onChange={(e) => setPreviewScore(e.target.value)}
					className="w-28"
				/>
				{previewScore !== "" && (
					<span className="text-sm">
						{mention ? (
							<Badge variant="secondary" className="gap-1">
								<span className="font-bold">{mention.gradeLetter}</span>
								{mention.label}
							</Badge>
						) : (
							<span className="text-muted-foreground text-xs">
								{t("admin.gradeScale.previewNoMatch")}
							</span>
						)}
					</span>
				)}
			</div>
		</div>
	);
}
