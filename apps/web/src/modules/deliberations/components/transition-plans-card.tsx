import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { count, statusVariant, summaryOf } from "../services/transition-status";
import type { TransitionListItem } from "../types";

/** Existing transition plans; each one opens its detail page. */
export function TransitionPlansCard({
	plans,
}: {
	plans: TransitionListItem[] | undefined;
}) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	return (
		<Card className="rounded-lg">
			<CardHeader>
				<CardTitle>{t("admin.academicYearTransitions.plans.title")}</CardTitle>
			</CardHeader>
			<CardContent className="space-y-2">
				{plans?.map((transition) => {
					const summary = summaryOf(transition);
					return (
						<button
							key={transition.id}
							type="button"
							onClick={() => void navigate(`/promotion/${transition.id}`)}
							className="w-full rounded-md border p-3 text-left transition hover:bg-muted/60"
						>
							<div className="flex items-center justify-between gap-2">
								<div className="font-medium text-sm">
									{transition.sourceYear?.name ?? "-"}
									{" → "}
									{transition.targetYear?.name ?? "-"}
								</div>
								<Badge variant={statusVariant(transition.status)}>
									{t(
										`admin.academicYearTransitions.status.${transition.status}`,
									)}
								</Badge>
							</div>
							<div className="mt-2 text-muted-foreground text-xs">
								{count(summary, "total")}{" "}
								{t("admin.academicYearTransitions.metrics.students")}
							</div>
						</button>
					);
				})}
				{plans?.length === 0 && (
					<div className="py-8 text-center text-muted-foreground text-sm">
						{t("admin.academicYearTransitions.empty.noPlans")}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
