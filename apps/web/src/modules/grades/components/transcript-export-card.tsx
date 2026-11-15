import { Download, FileSpreadsheet } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { BusyIcon, MissingHint, StepBadge } from "./export-ui";

/** Combined Excel transcript of the selected exams. */
export function TranscriptExportCard({
	exporting,
	hasExamSelection,
	disabled,
	onExport,
}: {
	exporting: string | null;
	hasExamSelection: boolean;
	disabled: boolean;
	onExport: () => void;
}) {
	const { t } = useTranslation();
	return (
		<Card>
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between gap-4">
					<div>
						<CardTitle className="flex items-center gap-3 text-base">
							<StepBadge step={3} />
							<FileSpreadsheet className="h-4 w-4" />
							{t("admin.gradeExport.actions.combinedLabel")}
						</CardTitle>
						<CardDescription className="mt-1">
							{t("admin.gradeExport.transcript.description")}
						</CardDescription>
					</div>
					{!hasExamSelection && (
						<MissingHint>
							{t("admin.gradeExport.transcript.missingExams")}
						</MissingHint>
					)}
				</div>
			</CardHeader>
			<CardContent>
				<Button type="button" onClick={onExport} disabled={disabled}>
					<BusyIcon
						busy={exporting === "combined"}
						icon={Download}
						className="mr-2 h-4 w-4"
					/>
					{t("admin.gradeExport.actions.combinedExport")}
				</Button>
			</CardContent>
		</Card>
	);
}
