import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Layers3 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";
import { HubNav } from "@/components/navigation/HubNav";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { trpc } from "@/utils/trpc";

const TABS = [
	{ path: "details", labelKey: "admin.studyCycles.tabs.details" },
	{ path: "levels", labelKey: "admin.studyCycles.tabs.levels" },
] as const;

export default function StudyCycleDetail() {
	const { cycleId } = useParams<{ cycleId: string }>();
	const { t } = useTranslation();

	const { data: cycle, isLoading } = useQuery(
		trpc.studyCycles.getCycle.queryOptions({ id: cycleId! }),
	);

	if (isLoading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<Spinner className="h-8 w-8" />
			</div>
		);
	}

	if (!cycle) {
		return (
			<div className="py-12 text-center text-muted-foreground">
				{t("common.notFound")}
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-start gap-4">
				<Button variant="ghost" size="icon" asChild>
					<Link to="/admin/institution/cycles">
						<ArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
				<div className="flex items-center gap-3">
					<Layers3 className="h-5 w-5 text-primary" />
					<div>
						<h1 className="font-semibold text-xl">{cycle.name}</h1>
						<p className="text-muted-foreground text-sm">
							{cycle.code} · {cycle.durationYears}{" "}
							{t("admin.studyCycles.table.years", {
								defaultValue: "{{value}} years",
								value: "",
							})
								.replace("{{value}} ", "")
								.trim()}{" "}
							· {cycle.totalCreditsRequired}{" "}
							{t("admin.studyCycles.table.credits", {
								defaultValue: "credits",
							}).toLowerCase()}
						</p>
					</div>
				</div>
			</div>
			<HubNav tabs={TABS} basePath={`/admin/institution/cycles/${cycleId}`} />
		</div>
	);
}
