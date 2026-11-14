import { ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
} from "@/components/ui/empty";
import { ExecutePromotionSummary } from "../../components/execute-promotion-summary";
import { ExecuteTargetClassCard } from "../../components/execute-target-class-card";
import { useExecutePromotion } from "../../hooks/use-execute-promotion";

export function ExecutePromotionPage() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const {
		state,
		rule,
		sourceClass,
		classes,
		targetClassId,
		setTargetClassId,
		targetClass,
		useBatch,
		isPending,
		execute,
		createTargetClass,
	} = useExecutePromotion();

	if (!state) {
		return (
			<div>
				<Card className="border-0 shadow-sm">
					<CardContent className="pt-6">
						<Empty className="border border-dashed">
							<EmptyHeader>
								<EmptyDescription>
									No promotion data found. Please start from the evaluation
									page.
								</EmptyDescription>
							</EmptyHeader>
							<EmptyContent>
								<Button
									onClick={() => navigate("/promotion-legacy?tab=evaluate")}
								>
									Go to Evaluation
								</Button>
							</EmptyContent>
						</Empty>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="space-y-4">
				<Button
					variant="ghost"
					size="sm"
					onClick={() => navigate("/promotion-legacy?tab=evaluate")}
					className="gap-2"
				>
					<ArrowLeft className="h-4 w-4" />
					{t("common.actions.back")}
				</Button>
				<div>
					<h1 className="text-foreground">Execute Promotion</h1>
					<p className="mt-1 text-muted-foreground">
						Confirm and apply the promotion to selected students
					</p>
				</div>
			</div>

			<ExecutePromotionSummary
				ruleName={rule?.name}
				ruleDescription={rule?.description}
				sourceClassName={sourceClass?.name}
				studentCount={state.studentIds.length}
			/>

			<ExecuteTargetClassCard
				classes={classes}
				sourceClassId={state.sourceClassId}
				sourceClassName={sourceClass?.name}
				targetClassId={targetClassId}
				targetClassName={targetClass?.name}
				onTargetClassChange={setTargetClassId}
				onCreateClass={createTargetClass}
			/>

			<div className="flex items-center gap-4">
				<Button
					variant="outline"
					onClick={() => navigate("/promotion-legacy?tab=evaluate")}
				>
					Back to Evaluation
				</Button>
				<div className="flex-1" />
				<Button
					onClick={execute}
					disabled={!targetClassId || isPending}
					size="lg"
				>
					{isPending ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
							{useBatch ? "Starting Batch Job..." : "Applying Promotion..."}
						</>
					) : (
						<>
							<CheckCircle className="mr-2 h-4 w-4" />
							{useBatch
								? `Execute as Batch Job (${state.studentIds.length} students)`
								: "Execute Promotion"}
						</>
					)}
				</Button>
			</div>
		</div>
	);
}
