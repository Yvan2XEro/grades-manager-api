import { CheckCircle2, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { EvaluatePromotionState } from "../hooks/use-evaluate-promotion";
import { StudentEvaluationCard } from "./student-evaluation-card";

/** Eligible / not eligible students of an evaluation and their selection. */
export function EvaluationResults({
	state,
	evaluationResult,
}: {
	state: EvaluatePromotionState;
	evaluationResult: NonNullable<EvaluatePromotionState["evaluationResult"]>;
}) {
	const { t } = useTranslation();
	const {
		selectedStudents,
		toggleStudent: handleToggleStudent,
		selectAll: handleSelectAll,
		deselectAll: handleDeselectAll,
		proceed: handleProceed,
	} = state;
	return (
		<div className="fade-in slide-in-from-bottom-4 animate-in space-y-6">
			{/* Summary */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-4">
				<Card className="border-0 shadow-sm">
					<CardContent className="pt-6">
						<div className="text-foreground">
							{evaluationResult.totalStudents}
						</div>
						<p className="text-muted-foreground text-xs">
							{t("admin.promotionRules.evaluate.summary.total")}
						</p>
					</CardContent>
				</Card>
				<Card className="border-emerald-500/20 bg-emerald-500/5">
					<CardContent className="pt-6">
						<div className="font-bold text-2xl text-emerald-600">
							{evaluationResult.eligible.length}
						</div>
						<p className="text-muted-foreground text-xs">
							{t("admin.promotionRules.evaluate.summary.eligible")}
						</p>
					</CardContent>
				</Card>
				<Card className="border-destructive/20 bg-destructive/5">
					<CardContent className="pt-6">
						<div className="font-bold text-2xl text-destructive">
							{evaluationResult.notEligible.length}
						</div>
						<p className="text-muted-foreground text-xs">
							{t("admin.promotionRules.evaluate.summary.notEligible")}
						</p>
					</CardContent>
				</Card>
				<Card className="border-primary/30 bg-primary/5">
					<CardContent className="pt-6">
						<div className="font-bold text-2xl text-primary">
							{selectedStudents.size}
						</div>
						<p className="text-muted-foreground text-xs">
							{t("admin.promotionRules.evaluate.summary.selected")}
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Selection Actions */}
			{evaluationResult.eligible.length > 0 && (
				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm" onClick={handleSelectAll}>
						{t("admin.promotionRules.evaluate.actions.selectAll")}
					</Button>
					<Button variant="outline" size="sm" onClick={handleDeselectAll}>
						{t("admin.promotionRules.evaluate.actions.deselectAll")}
					</Button>
					<div className="flex-1" />
					<Button
						onClick={handleProceed}
						disabled={selectedStudents.size === 0}
					>
						{t("admin.promotionRules.evaluate.actions.proceed", {
							count: selectedStudents.size,
						})}
					</Button>
				</div>
			)}

			<Separator />

			{/* Student Lists */}
			<Tabs defaultValue="eligible">
				<TabsList className="grid w-full max-w-md grid-cols-2">
					<TabsTrigger value="eligible" className="gap-2">
						<CheckCircle2 className="h-4 w-4" />
						{t("admin.promotionRules.evaluate.tabs.eligible", {
							count: evaluationResult.eligible.length,
						})}
					</TabsTrigger>
					<TabsTrigger value="not-eligible" className="gap-2">
						<XCircle className="h-4 w-4" />
						{t("admin.promotionRules.evaluate.tabs.notEligible", {
							count: evaluationResult.notEligible.length,
						})}
					</TabsTrigger>
				</TabsList>

				<TabsContent value="eligible" className="mt-6 space-y-4">
					{evaluationResult.eligible.length === 0 ? (
						<Empty className="border border-dashed">
							<EmptyHeader>
								<EmptyDescription>
									{t("admin.promotionRules.evaluate.emptyState.noEligible")}
								</EmptyDescription>
							</EmptyHeader>
						</Empty>
					) : (
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
							{evaluationResult.eligible.map((result) => (
								<StudentEvaluationCard
									key={result.student.id}
									student={result.student}
									facts={result.facts}
									eligible={true}
									reasons={result.reasons}
									selected={selectedStudents.has(result.student.id)}
									onToggleSelect={() => handleToggleStudent(result.student.id)}
								/>
							))}
						</div>
					)}
				</TabsContent>

				<TabsContent value="not-eligible" className="mt-6 space-y-4">
					{evaluationResult.notEligible.length === 0 ? (
						<Empty className="border border-dashed">
							<EmptyHeader>
								<EmptyDescription>
									{t("admin.promotionRules.evaluate.emptyState.allEligible")}
								</EmptyDescription>
							</EmptyHeader>
						</Empty>
					) : (
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
							{evaluationResult.notEligible.map((result) => (
								<StudentEvaluationCard
									key={result.student.id}
									student={result.student}
									facts={result.facts}
									eligible={false}
									reasons={result.reasons}
								/>
							))}
						</div>
					)}
				</TabsContent>
			</Tabs>
		</div>
	);
}
