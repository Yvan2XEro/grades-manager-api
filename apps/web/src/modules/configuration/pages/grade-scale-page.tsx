import { Info, Save } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { GradeScalePreview } from "../components/grade-scale-preview";
import { MentionRangesTable } from "../components/mention-ranges-table";
import { INSTITUTION_SCOPE, useGradeScale } from "../hooks/use-grade-scale";

export default function GradeScalePage() {
	const { t } = useTranslation();
	const scale = useGradeScale();
	const { saveMutation } = scale;

	if (scale.isLoading) {
		return (
			<div className="flex justify-center py-8">
				<Spinner />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<p className="text-muted-foreground text-sm">
				{t("admin.gradeScale.description")}
			</p>

			{/* Scope selector */}
			<div className="max-w-xs space-y-1.5">
				<Label>{t("admin.gradeScale.scopeLabel")}</Label>
				<Select value={scale.scopeId} onValueChange={scale.setScopeId}>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={INSTITUTION_SCOPE}>
							{t("admin.gradeScale.institutionDefault")}
						</SelectItem>
						{scale.programs.map((p) => (
							<SelectItem key={p.id} value={p.id}>
								{p.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{scale.isInherited && (
				<div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-blue-700 text-sm dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300">
					<Info className="mt-0.5 h-4 w-4 shrink-0" />
					<span>{t("admin.gradeScale.inheritedFromInstitution")}</span>
				</div>
			)}

			{/* Thresholds */}
			<div className="grid max-w-sm grid-cols-2 gap-4">
				<div className="space-y-1.5">
					<Label>{t("admin.gradeScale.passThreshold")}</Label>
					<Input
						type="number"
						min={0}
						max={20}
						step={0.5}
						value={scale.passThreshold}
						onChange={(e) => scale.setPassThreshold(Number(e.target.value))}
					/>
				</div>
				<div className="space-y-1.5">
					<Label>{t("admin.gradeScale.compensationThreshold")}</Label>
					<Input
						type="number"
						min={0}
						max={20}
						step={0.5}
						value={scale.compensationThreshold}
						onChange={(e) =>
							scale.setCompensationThreshold(Number(e.target.value))
						}
					/>
				</div>
			</div>

			<MentionRangesTable
				ranges={scale.ranges}
				actions={scale.rangeActions}
				hasOverlap={scale.hasOverlap}
			/>

			<GradeScalePreview ranges={scale.ranges} />

			<Button
				onClick={() => saveMutation.mutate()}
				disabled={saveMutation.isPending || scale.hasOverlap}
				className="gap-2"
			>
				{saveMutation.isPending ? (
					<Spinner className="h-4 w-4" />
				) : (
					<Save className="h-4 w-4" />
				)}
				{t("common.save")}
			</Button>

			{saveMutation.isSuccess && (
				<p className="text-emerald-600 text-sm">
					{t("admin.gradeScale.saved")}
				</p>
			)}
			{saveMutation.isError && (
				<p className="text-destructive text-sm">
					{saveMutation.error?.message ?? t("common.error")}
				</p>
			)}
		</div>
	);
}
