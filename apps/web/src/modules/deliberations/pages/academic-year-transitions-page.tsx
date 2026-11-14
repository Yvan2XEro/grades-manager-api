import { RefreshCcw } from "lucide-react";
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

			<div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
				<div className="space-y-4">
					<TransitionCreateCard state={createState} />
				</div>
				<TransitionPlansCard plans={transitionsQuery.data?.items} />
			</div>
		</div>
	);
}
