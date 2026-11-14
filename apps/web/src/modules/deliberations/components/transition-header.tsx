import {
	CheckCircle2,
	Play,
	RefreshCcw,
	ShieldCheck,
	XCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusStepper } from "@/components/ui/status-stepper";

import {
	count,
	formatDate,
	statusVariant,
	stepStatusFor,
	TRANSITION_STEPS,
} from "../services/transition-status";
import type { Summary, Transition, TransitionAction } from "../types";

/** Title, status, workflow actions and stepper of a transition plan. */
export function TransitionHeader({
	transition,
	summary,
	onAction,
	isPending,
}: {
	transition: NonNullable<Transition>;
	summary: Summary;
	onAction: (action: TransitionAction) => void;
	isPending: boolean;
}) {
	const { t } = useTranslation();
	const blocked = count(summary, "blocked");
	const terminal = ["completed", "completed_with_errors", "cancelled", "stale"];
	const canCancel =
		!terminal.includes(transition.status) && transition.status !== "running";

	const primaryAction = (() => {
		if (["draft", "ready"].includes(transition.status)) {
			const canSubmit = blocked === 0;
			return (
				<Button
					size="sm"
					onClick={() => onAction("submit")}
					disabled={isPending || !canSubmit}
					title={
						!canSubmit
							? t("admin.academicYearTransitions.actions.submitBlocked", {
									count: blocked,
								})
							: undefined
					}
				>
					<ShieldCheck className="size-4" />
					{t("admin.academicYearTransitions.actions.submit")}
					{!canSubmit && (
						<Badge variant="destructive" className="ml-1 text-xs">
							{blocked}
						</Badge>
					)}
				</Button>
			);
		}
		if (transition.status === "pending_approval") {
			return (
				<Button
					size="sm"
					onClick={() => onAction("approve")}
					disabled={isPending}
				>
					<CheckCircle2 className="size-4" />
					{t("admin.academicYearTransitions.actions.approve")}
				</Button>
			);
		}
		if (transition.status === "approved") {
			return (
				<Button
					size="sm"
					onClick={() => onAction("execute")}
					disabled={isPending}
				>
					<Play className="size-4" />
					{t("admin.academicYearTransitions.actions.execute")}
				</Button>
			);
		}
		if (transition.status === "running") {
			return (
				<Button size="sm" disabled>
					<RefreshCcw className="size-4 animate-spin" />
					{t("admin.academicYearTransitions.actions.running")}
				</Button>
			);
		}
		return null;
	})();

	const steps = TRANSITION_STEPS.map((s) => ({
		key: s.key,
		label: t(s.labelKey),
	}));

	return (
		<div className="space-y-4 rounded-lg border bg-card p-4">
			<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
				<div>
					<div className="flex flex-wrap items-center gap-2">
						<h2 className="font-semibold text-lg">
							{transition.sourceYear?.name ?? "-"}
							{" → "}
							{transition.targetYear?.name ?? "-"}
						</h2>
						<Badge variant={statusVariant(transition.status)}>
							{t(`admin.academicYearTransitions.status.${transition.status}`)}
						</Badge>
					</div>
					<p className="mt-1 text-muted-foreground text-sm">
						{t("admin.academicYearTransitions.generatedAt", {
							date: formatDate(transition.generatedAt),
						})}
					</p>
				</div>
				<div className="flex shrink-0 flex-wrap items-center gap-2">
					{canCancel && (
						<Button
							variant="outline"
							size="sm"
							onClick={() => onAction("cancel")}
							disabled={isPending}
						>
							<XCircle className="size-4" />
							{t("admin.academicYearTransitions.actions.cancel")}
						</Button>
					)}
					{primaryAction}
				</div>
			</div>
			<StatusStepper
				steps={steps}
				currentStatus={stepStatusFor(transition.status)}
				rejectedStatus={
					["cancelled", "stale"].includes(transition.status)
						? stepStatusFor(transition.status)
						: undefined
				}
			/>
		</div>
	);
}
