import { Check, ChevronRight, Rocket } from "lucide-react";
import type React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { ExternalLinkIcon } from "@/components/navigation/external-link-icon";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { G, type SetupMilestone } from "../services/import-steps";
import { useManualEntry } from "./manual-entry";

/**
 * Progress of the institution setup: a bar, the milestones in order and a
 * button to the next one. `compact` is the dashboard version.
 */
export function SetupProgress({
	milestones,
	compact = false,
	onDismiss,
}: {
	milestones: SetupMilestone[];
	compact?: boolean;
	onDismiss?: () => void;
}) {
	const { t } = useTranslation();
	const done = milestones.filter((m) => m.done).length;
	const next = milestones.find((m) => !m.done);
	const percent = Math.round((done / milestones.length) * 100);

	return (
		<Card
			className={cn("py-0", !compact && "border-primary/30 bg-primary/[0.03]")}
		>
			<CardContent className="space-y-4 p-5">
				<div className="flex flex-wrap items-center gap-4">
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
						<Rocket className="h-5 w-5" />
					</div>
					<div className="min-w-0 flex-1 space-y-1">
						<p className="font-medium">
							{next
								? t(`${G}progress.title`, { done, total: milestones.length })
								: t(`${G}progress.ready`)}
						</p>
						<p className="text-muted-foreground text-sm">
							{next
								? t(`${G}progress.next`, { label: next.label })
								: t(`${G}progress.readyHint`)}
						</p>
					</div>
					<div className="flex items-center gap-2">
						{onDismiss && (
							<Button variant="ghost" size="sm" onClick={onDismiss}>
								{t(`${G}progress.hide`)}
							</Button>
						)}
						{next &&
							(compact ? (
								// The dashboard card leads to the setup page: marked as leaving
								<Button asChild size="sm">
									<Link to="/import">
										{t(`${G}progress.continueSetup`)}
										<ExternalLinkIcon />
									</Link>
								</Button>
							) : (
								<MilestoneAction milestone={next} asButton>
									{t(`${G}progress.continue`)}
									<ChevronRight className="ml-1 h-4 w-4" />
								</MilestoneAction>
							))}
					</div>
				</div>
				<Progress value={percent} className="h-1.5" />
				{!compact && (
					<ol className="flex flex-wrap gap-2">
						{milestones.map((m, index) => (
							<li key={m.key}>
								<MilestoneAction
									milestone={m}
									className={cn(
										"flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition-colors hover:bg-muted",
										m.done
											? "border-primary/40 bg-primary/5 text-primary"
											: m === next
												? "border-primary font-medium text-foreground"
												: "text-muted-foreground",
									)}
								>
									{m.done ? (
										<Check className="h-3 w-3" />
									) : (
										<span className="font-semibold">{index + 1}</span>
									)}
									{m.label}
								</MilestoneAction>
							</li>
						))}
					</ol>
				)}
			</CardContent>
		</Card>
	);
}

/** A guided import step is a link to its wizard; the others open their page in a dialog. */
function MilestoneAction({
	milestone,
	asButton,
	className,
	children,
}: {
	milestone: SetupMilestone;
	asButton?: boolean;
	className?: string;
	children: React.ReactNode;
}) {
	const openManual = useManualEntry();
	if (milestone.importStep) {
		const link = (
			<Link to={`/import/${milestone.key}`} className={className}>
				{children}
			</Link>
		);
		return asButton ? (
			<Button asChild size="sm">
				{link}
			</Button>
		) : (
			link
		);
	}
	return asButton ? (
		<Button size="sm" onClick={() => openManual(milestone.key)}>
			{children}
		</Button>
	) : (
		<button
			type="button"
			className={className}
			onClick={() => openManual(milestone.key)}
		>
			{children}
		</button>
	);
}
