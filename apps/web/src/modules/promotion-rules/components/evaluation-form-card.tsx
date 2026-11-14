import { Loader2, Play, RefreshCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { EvaluatePromotionState } from "../hooks/use-evaluate-promotion";

/** Rule / class / year selection, facts refresh and the evaluate button. */
export function EvaluationFormCard({
	state,
}: {
	state: EvaluatePromotionState;
}) {
	const { t } = useTranslation();
	const {
		rules,
		classes,
		selectedRuleId,
		setSelectedRuleId,
		selectedSourceClassId,
		setSelectedSourceClassId,
		selectedAcademicYearId,
		setSelectedAcademicYearId,
		selectedStudents,
		evaluationResult,
		isEvaluating,
		isRefreshingFacts,
		evaluate: handleEvaluate,
		refreshFacts: handleRefreshFacts,
		toggleStudent: handleToggleStudent,
		selectAll: handleSelectAll,
		deselectAll: handleDeselectAll,
		proceed: handleProceed,
	} = state;
	return (
		<Card className="border-0 shadow-sm">
			<CardHeader>
				<CardTitle>{t("admin.promotionRules.evaluate.form.title")}</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					<div className="space-y-2">
						<Label>{t("admin.promotionRules.evaluate.form.ruleLabel")}</Label>
						<Select value={selectedRuleId} onValueChange={setSelectedRuleId}>
							<SelectTrigger>
								<SelectValue
									placeholder={t(
										"admin.promotionRules.evaluate.form.rulePlaceholder",
									)}
								/>
							</SelectTrigger>
							<SelectContent>
								{rules?.map((rule) => (
									<SelectItem key={rule.id} value={rule.id}>
										{rule.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label>{t("admin.promotionRules.evaluate.form.classLabel")}</Label>
						<Select
							value={selectedSourceClassId}
							onValueChange={setSelectedSourceClassId}
						>
							<SelectTrigger>
								<SelectValue
									placeholder={t(
										"admin.promotionRules.evaluate.form.classPlaceholder",
									)}
								/>
							</SelectTrigger>
							<SelectContent>
								{classes?.map((cls) => (
									<SelectItem key={cls.id} value={cls.id}>
										{cls.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label>{t("admin.promotionRules.evaluate.form.yearLabel")}</Label>
						<AcademicYearSelect
							value={selectedAcademicYearId || null}
							onChange={(v) => setSelectedAcademicYearId(v)}
							placeholder={t(
								"admin.promotionRules.evaluate.form.yearPlaceholder",
							)}
						/>
					</div>
				</div>

				<div className="mt-6 rounded-lg border bg-muted/30 p-4">
					<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
						<div>
							<p className="font-medium">
								{t("admin.promotionRules.evaluate.actions.refreshFacts")}
							</p>
							<p className="text-muted-foreground text-xs">
								{t("admin.promotionRules.evaluate.form.refreshDescription")}
							</p>
						</div>
						<Button
							variant="outline"
							onClick={handleRefreshFacts}
							disabled={
								isRefreshingFacts ||
								!selectedSourceClassId ||
								!selectedAcademicYearId
							}
							className="md:w-auto"
						>
							{isRefreshingFacts ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
									{t("admin.promotionRules.evaluate.actions.refreshingFacts")}
								</>
							) : (
								<>
									<RefreshCcw className="mr-2 h-4 w-4" />
									{t("admin.promotionRules.evaluate.actions.refreshFacts")}
								</>
							)}
						</Button>
					</div>
				</div>

				<div className="mt-4">
					<Button
						onClick={handleEvaluate}
						disabled={
							isEvaluating ||
							!selectedRuleId ||
							!selectedSourceClassId ||
							!selectedAcademicYearId
						}
						className="w-full md:w-auto"
					>
						{isEvaluating ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
								{t("admin.promotionRules.evaluate.actions.evaluating")}
							</>
						) : (
							<>
								<Play className="mr-2 h-4 w-4" />
								{t("admin.promotionRules.evaluate.actions.evaluate")}
							</>
						)}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
