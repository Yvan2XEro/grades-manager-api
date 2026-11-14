import { Copy, Download, Plus, Printer, Upload } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
	/** Shown on the left, e.g. the number of sessions. */
	summary: string | null;
	canCopy: boolean;
	canExport: boolean;
	canAddSession: boolean;
	onCopy: () => void;
	onImport: () => void;
	onExport: () => void;
	onPrint: () => void;
	onAddSession: () => void;
}

/** Copy / import / export / print / new session buttons of the timetable. */
export function TimetableActions({
	summary,
	canCopy,
	canExport,
	canAddSession,
	onCopy,
	onImport,
	onExport,
	onPrint,
	onAddSession,
}: Props) {
	const { t } = useTranslation();
	return (
		<div className="flex items-center justify-between">
			<p className="text-muted-foreground text-sm">{summary}</p>
			<div className="flex items-center gap-2">
				<Button
					variant="outline"
					size="sm"
					onClick={onCopy}
					disabled={!canCopy}
				>
					<Copy className="mr-1.5 h-4 w-4" />
					{t("teacher.timetable.copyFromYear")}
				</Button>
				<Button variant="outline" size="sm" onClick={onImport}>
					<Upload className="mr-1.5 h-4 w-4" />
					{t("teacher.timetable.importCsv")}
				</Button>
				<Button
					variant="outline"
					size="sm"
					onClick={onExport}
					disabled={!canExport}
				>
					<Download className="mr-1.5 h-4 w-4" />
					{t("teacher.timetable.export")}
				</Button>
				<Button
					variant="outline"
					size="sm"
					onClick={onPrint}
					disabled={!canExport}
				>
					<Printer className="mr-1.5 h-4 w-4" />
					{t("teacher.timetable.print")}
				</Button>
				<Tooltip>
					<TooltipTrigger asChild>
						<span>
							<Button
								onClick={onAddSession}
								size="sm"
								disabled={!canAddSession}
							>
								<Plus className="mr-2 h-4 w-4" />
								{t("teacher.timetable.newSession")}
							</Button>
						</span>
					</TooltipTrigger>
					{!canAddSession && (
						<TooltipContent>
							{t("teacher.timetable.selectCourse")}
						</TooltipContent>
					)}
				</Tooltip>
			</div>
		</div>
	);
}
