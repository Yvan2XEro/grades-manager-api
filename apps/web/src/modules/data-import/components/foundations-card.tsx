import { Check, ChevronRight } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { FOUNDATION_META, foundationStatus } from "../services/import-steps";
import type { FoundationStep } from "../types";
import { StepStatusBadge } from "./step-status-badge";

/** The foundation steps, in order, with what already exists for each. */
export function FoundationsCard({ steps }: { steps: FoundationStep[] }) {
	const statuses = steps.map(foundationStatus);
	const done = statuses.filter((s) => s !== "todo").length;
	const next = statuses.indexOf("todo");

	return (
		<Card>
			<CardHeader className="flex flex-row items-start justify-between gap-4">
				<div className="space-y-1">
					<CardTitle className="text-base">1. Fondations</CardTitle>
					<p className="text-muted-foreground text-sm">
						La structure académique de l'institution, à importer une seule fois
						et dans cet ordre. Chaque étape s'appuie sur la précédente.
					</p>
				</div>
				<span className="shrink-0 font-medium text-muted-foreground text-sm">
					{done}/{steps.length}
				</span>
			</CardHeader>
			<CardContent>
				<ol className="space-y-2">
					{steps.map((step, index) => {
						const meta = FOUNDATION_META[step.key];
						const status = statuses[index];
						const Icon = meta?.icon;
						const isNext = index === next;
						return (
							<li
								key={step.key}
								className={cn(
									"flex flex-wrap items-center gap-4 rounded-lg border p-4",
									isNext && "border-primary/50 bg-primary/5",
								)}
							>
								<div
									className={cn(
										"flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-semibold text-sm",
										status === "done"
											? "bg-primary text-primary-foreground"
											: "bg-muted text-muted-foreground",
									)}
								>
									{status === "done" ? (
										<Check className="h-4 w-4" />
									) : (
										index + 1
									)}
								</div>
								<div className="min-w-0 flex-1 space-y-1">
									<div className="flex flex-wrap items-center gap-2">
										{Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
										<span className="font-medium">{step.label}</span>
										<StepStatusBadge status={status} />
									</div>
									<p className="text-muted-foreground text-sm">
										{meta?.description}
									</p>
									<p className="text-muted-foreground text-xs">
										{Object.entries(step.counts)
											.map(([label, n]) => `${n} ${label.toLowerCase()}`)
											.join(" · ")}
									</p>
								</div>
								<Button
									asChild
									variant={isNext ? "default" : "outline"}
									size="sm"
								>
									<Link to={`/import/${step.key}`}>
										{status === "todo" ? "Commencer" : "Revoir / compléter"}
										<ChevronRight className="ml-1 h-4 w-4" />
									</Link>
								</Button>
							</li>
						);
					})}
				</ol>
			</CardContent>
		</Card>
	);
}
