import { Info, RefreshCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { TransitionCreateCard } from "../components/transition-create-card";
import { TransitionPlansCard } from "../components/transition-plans-card";
import {
	useCreateTransitionPlan,
	useTransitionPlans,
} from "../hooks/use-academic-year-transitions";

export default function AcademicYearTransitionsPage() {
	const { t } = useTranslation();
	const transitionsQuery = useTransitionPlans();
	const createState = useCreateTransitionPlan(transitionsQuery);

	return (
		<div className="space-y-6">
			<PageHeader
				title={t("admin.academicYearTransitions.title")}
				description={t("admin.academicYearTransitions.subtitle")}
				actions={
					<Button
						variant="outline"
						size="sm"
						onClick={() => transitionsQuery.refetch()}
						disabled={transitionsQuery.isFetching}
					>
						<RefreshCcw className="size-4" />
						{t("admin.academicYearTransitions.actions.refresh")}
					</Button>
				}
			/>

			{/* Two ways to move students to the next year: say which one to use */}
			<div className="flex items-start gap-3 rounded-xl border bg-muted/30 px-4 py-3 text-sm">
				<Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
				<div className="space-y-1">
					<p className="font-medium">
						{t("admin.academicYearTransitions.howTo.title")}
					</p>
					<p className="text-muted-foreground text-xs">
						{t("admin.academicYearTransitions.howTo.transition")}
					</p>
					<p className="text-muted-foreground text-xs">
						{t("admin.academicYearTransitions.howTo.shortcut")}
					</p>
				</div>
			</div>

			<div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
				<div className="space-y-4">
					<TransitionCreateCard state={createState} />
				</div>
				<TransitionPlansCard plans={transitionsQuery.data?.items} />
			</div>
		</div>
	);
}
