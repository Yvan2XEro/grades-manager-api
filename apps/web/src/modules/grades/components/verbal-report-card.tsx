import { Eye, FileSpreadsheet, FileText } from "lucide-react";
import { useId } from "react";
import { useTranslation } from "react-i18next";
import { SemesterSelect } from "@/components/inputs/SemesterSelect";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { BusyIcon, MissingHint, StepBadge } from "./export-ui";

/** Verbal report ("procès-verbal"): semester, retakes option, Excel / PDF. */
export function VerbalReportCard({
	exporting,
	pvReady,
	selectedSemester,
	includeRetakes,
	onSemesterChange,
	onIncludeRetakesChange,
	onExportExcel,
	onPreview,
	onGenerate,
}: {
	exporting: string | null;
	pvReady: boolean;
	selectedSemester: string;
	includeRetakes: boolean;
	onSemesterChange: (value: string) => void;
	onIncludeRetakesChange: (value: boolean) => void;
	onExportExcel: () => void;
	onPreview: () => void;
	onGenerate: () => void;
}) {
	const { t } = useTranslation();
	const semesterId = useId();
	const disabled = !pvReady || exporting !== null;
	return (
		<Card>
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between gap-4">
					<div>
						<CardTitle className="flex items-center gap-3 text-base">
							<StepBadge step={3} muted />
							<FileText className="h-4 w-4" />
							Procès-Verbal
						</CardTitle>
						<CardDescription className="mt-1">
							PV complet avec toutes les UEs, moyennes et décisions
						</CardDescription>
					</div>
					{!pvReady && <MissingHint>Sélectionnez un semestre</MissingHint>}
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor={semesterId}>Semestre</Label>
					<SemesterSelect
						value={selectedSemester || null}
						onChange={(v) => onSemesterChange(v ?? "")}
						placeholder="Sélectionner un semestre"
					/>
				</div>
				<div className="flex items-center gap-2">
					<Checkbox
						id="include-retakes"
						checked={includeRetakes}
						onCheckedChange={(checked) =>
							onIncludeRetakesChange(checked === true)
						}
					/>
					<Label
						htmlFor="include-retakes"
						className="cursor-pointer font-normal text-sm"
					>
						Inclure les notes de rattrapage
					</Label>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button
						type="button"
						variant="outline"
						onClick={onExportExcel}
						disabled={disabled}
					>
						<BusyIcon
							busy={exporting === "pv"}
							icon={FileSpreadsheet}
							className="mr-2 h-4 w-4"
						/>
						{t("admin.gradeExport.actions.pvExport")}
					</Button>
					<Button
						type="button"
						variant="outline"
						onClick={onPreview}
						disabled={disabled}
					>
						<BusyIcon
							busy={exporting === "preview-pv"}
							icon={Eye}
							className="mr-2 h-4 w-4"
						/>
						Prévisualiser PDF
					</Button>
					<Button type="button" onClick={onGenerate} disabled={disabled}>
						<BusyIcon
							busy={exporting === "generate-pv"}
							icon={FileText}
							className="mr-2 h-4 w-4"
						/>
						Générer PDF
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
