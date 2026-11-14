import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { EvaluationFormCard } from "../../components/evaluation-form-card";
import { EvaluationResults } from "../../components/evaluation-results";
import { useEvaluatePromotion } from "../../hooks/use-evaluate-promotion";

export function EvaluatePromotionPage() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const state = useEvaluatePromotion();

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="space-y-4">
				<Button
					variant="ghost"
					size="sm"
					onClick={() => navigate("/promotion-legacy")}
					className="gap-2"
				>
					<ArrowLeft className="h-4 w-4" />
					{t("common.actions.back")}
				</Button>
				<div>
					<h1 className="text-foreground">
						{t("admin.promotionRules.evaluate.title")}
					</h1>
					<p className="mt-1 text-muted-foreground">
						{t("admin.promotionRules.evaluate.subtitle")}
					</p>
				</div>
			</div>

			<EvaluationFormCard state={state} />

			{state.hasEvaluated && state.evaluationResult && (
				<EvaluationResults
					state={state}
					evaluationResult={state.evaluationResult}
				/>
			)}
		</div>
	);
}
