import { CheckCircle2, ChevronDown, XCircle } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";

interface StudentEvaluationCardProps {
	student: {
		id: string;
		registrationNumber: string;
		name: string;
	};
	facts: {
		overallAverage: number;
		creditsEarned: number;
		requiredCredits: number;
		creditCompletionRate: number;
		failedCoursesCount: number;
		successRate: number;
	};
	eligible: boolean;
	reasons?: string[];
	selected?: boolean;
	onToggleSelect?: () => void;
}

export function StudentEvaluationCard({
	student,
	facts,
	eligible,
	reasons,
	selected,
	onToggleSelect,
}: StudentEvaluationCardProps) {
	const { t } = useTranslation();
	const [isOpen, setIsOpen] = useState(false);

	return (
		<Card
			className={`transition-all duration-200 ${
				eligible
					? "border-green-500/30 bg-green-50/20"
					: "border-red-500/30 bg-red-50/20"
			} ${selected ? "ring-2 ring-primary" : ""}`}
		>
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						{eligible ? (
							<CheckCircle2 className="h-5 w-5 text-green-600" />
						) : (
							<XCircle className="h-5 w-5 text-red-600" />
						)}
						<div>
							<h4 className="font-semibold">{student.name}</h4>
							<p className="text-muted-foreground text-sm">
								{student.registrationNumber}
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2">
						{eligible && (
							<Badge variant={eligible ? "default" : "secondary"}>
								{eligible
									? t("admin.promotionRules.studentCard.eligible")
									: t("admin.promotionRules.studentCard.notEligible")}
							</Badge>
						)}
					</div>
				</div>
			</CardHeader>

			<CardContent className="space-y-3">
				{/* Key Metrics */}
				<div className="grid grid-cols-3 gap-4">
					<div>
						<p className="text-muted-foreground text-xs">
							{t("admin.promotionRules.studentCard.metrics.average")}
						</p>
						<p className="font-semibold text-lg">
							{facts.overallAverage.toFixed(2)}/20
						</p>
					</div>
					<div>
						<p className="text-muted-foreground text-xs">
							{t("admin.promotionRules.studentCard.metrics.credits")}
						</p>
						<p className="font-semibold text-lg">
							{facts.creditsEarned}/{facts.requiredCredits}
						</p>
					</div>
					<div>
						<p className="text-muted-foreground text-xs">
							{t("admin.promotionRules.studentCard.metrics.successRate")}
						</p>
						<p className="font-semibold text-lg">
							{(facts.successRate * 100).toFixed(0)}%
						</p>
					</div>
				</div>

				{/* Credit Progress */}
				<div className="space-y-1">
					<div className="flex justify-between text-xs">
						<span className="text-muted-foreground">
							{t("admin.promotionRules.studentCard.progress.creditCompletion")}
						</span>
						<span className="font-medium">
							{(facts.creditCompletionRate * 100).toFixed(0)}%
						</span>
					</div>
					<Progress value={facts.creditCompletionRate * 100} />
				</div>

				{/* Collapsible Details */}
				<Collapsible open={isOpen} onOpenChange={setIsOpen}>
					<CollapsibleTrigger asChild>
						<Button
							variant="ghost"
							size="sm"
							className="w-full justify-between"
						>
							<span className="text-xs">
								{t("admin.promotionRules.studentCard.actions.viewDetails")}
							</span>
							<ChevronDown
								className={`h-4 w-4 transition-transform ${
									isOpen ? "rotate-180" : ""
								}`}
							/>
						</Button>
					</CollapsibleTrigger>
					<CollapsibleContent className="space-y-2 pt-2">
						<div className="space-y-1 text-sm">
							<div className="flex justify-between">
								<span className="text-muted-foreground">
									{t("admin.promotionRules.studentCard.details.failedCourses")}:
								</span>
								<span className="font-medium">{facts.failedCoursesCount}</span>
							</div>
						</div>
						{reasons && reasons.length > 0 && (
							<div className="border-t pt-2">
								<p className="mb-1 font-medium text-xs">Evaluation Notes:</p>
								<ul className="space-y-1 text-muted-foreground text-xs">
									{reasons.map((reason, idx) => (
										<li key={idx}>• {reason}</li>
									))}
								</ul>
							</div>
						)}
					</CollapsibleContent>
				</Collapsible>

				{/* Select Button for Eligible Students */}
				{eligible && onToggleSelect && (
					<Button
						onClick={onToggleSelect}
						variant={selected ? "secondary" : "default"}
						size="sm"
						className="w-full"
					>
						{selected
							? t("admin.promotionRules.studentCard.actions.deselect")
							: t("admin.promotionRules.studentCard.actions.select")}
					</Button>
				)}
			</CardContent>
		</Card>
	);
}
