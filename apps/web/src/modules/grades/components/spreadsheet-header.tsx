import { AlertCircle, ArrowLeft, Save } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/** Course title, fill / pending / error counters and the per-exam mode link. */
export function SpreadsheetHeader({
	courseInfo,
	filledCells,
	totalCells,
	dirtyCount,
	errorCount,
	onPerExamMode,
}: {
	courseInfo?: { courseName: string; className: string; programName: string };
	filledCells: number;
	totalCells: number;
	dirtyCount: number;
	errorCount: number;
	onPerExamMode: () => void;
}) {
	const { t } = useTranslation();
	return (
		<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
			<div>
				<div className="mb-1 flex items-center gap-2">
					<Button variant="ghost" size="sm" asChild>
						<Link to="/">
							<ArrowLeft className="mr-1 h-4 w-4" />
							{t("common.actions.back", { defaultValue: "Retour" })}
						</Link>
					</Button>
				</div>
				<h2 className="text-foreground">{courseInfo?.courseName}</h2>
				<p className="text-muted-foreground text-sm">
					{courseInfo?.className} • {courseInfo?.programName}
				</p>
			</div>
			<div className="flex flex-wrap items-center gap-2">
				<Badge variant="outline">
					{filledCells} / {totalCells}{" "}
					{t("teacher.spreadsheet.filled", { defaultValue: "remplies" })}
				</Badge>
				{dirtyCount > 0 && (
					<Badge variant="secondary" className="gap-1">
						<Save className="h-3 w-3" /> {dirtyCount}{" "}
						{t("teacher.spreadsheet.pending", { defaultValue: "en cours" })}
					</Badge>
				)}
				{errorCount > 0 && (
					<Badge variant="destructive" className="gap-1">
						<AlertCircle className="h-3 w-3" /> {errorCount}{" "}
						{t("teacher.spreadsheet.errors", { defaultValue: "erreurs" })}
					</Badge>
				)}
				<Button variant="outline" size="sm" onClick={onPerExamMode}>
					{t("teacher.spreadsheet.perExamMode", {
						defaultValue: "Mode examen unique",
					})}
				</Button>
			</div>
		</div>
	);
}
