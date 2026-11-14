import { CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { ExternalLinkIcon } from "@/components/navigation/external-link-icon";
import { Button } from "@/components/ui/button";
import { G, stepLabel } from "../services/import-steps";
import type { StepPreview } from "../types";

/** Result of the import, with the way forward. */
export function StepDonePanel({
	preview,
	jobId,
	nextStep,
	onRestart,
}: {
	preview: StepPreview;
	jobId: string | null;
	nextStep?: { key: string; label: string };
	onRestart: () => void;
}) {
	const { t } = useTranslation();
	return (
		<div className="flex flex-col items-center gap-4 rounded-lg border bg-card p-10 text-center">
			<CheckCircle2 className="h-12 w-12 text-emerald-600" />
			<div className="space-y-1">
				<p className="font-semibold text-lg">{t(`${G}done.title`)}</p>
				<p className="text-muted-foreground text-sm">
					{preview.sheets
						.map((s) =>
							t(`${G}done.sheet`, {
								sheet: s.sheet,
								created: s.create,
								updated: s.update,
							}),
						)
						.join(" · ")}
				</p>
			</div>
			<div className="flex flex-wrap justify-center gap-2">
				<Button variant="outline" onClick={onRestart}>
					{t(`${G}done.another`)}
				</Button>
				{jobId && (
					<Button asChild variant="outline">
						<Link to={`/batch-jobs/${jobId}`}>
							{t(`${G}done.log`)}
							<ExternalLinkIcon />
						</Link>
					</Button>
				)}
				<Button asChild>
					<Link to={nextStep ? `/import/${nextStep.key}` : "/import"}>
						{nextStep
							? t(`${G}done.next`, {
									label: stepLabel(nextStep.key, t, nextStep.label),
								})
							: t(`${G}done.back`)}
					</Link>
				</Button>
			</div>
		</div>
	);
}
