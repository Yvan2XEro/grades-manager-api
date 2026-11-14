import { AlertCircle, CheckCircle2, Pencil, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import type { TransitionAudit } from "../types";

/** Timeline of the actions taken on a transition plan. */
export function TransitionAuditTimeline({
	audit,
	isLoading,
}: {
	audit: TransitionAudit | undefined;
	isLoading: boolean;
}) {
	const { t } = useTranslation();
	return (
		<Card className="rounded-lg">
			<CardHeader className="border-b pb-4">
				<CardTitle>{t("admin.academicYearTransitions.audit.title")}</CardTitle>
				<CardDescription>
					{t("admin.academicYearTransitions.audit.description")}
				</CardDescription>
			</CardHeader>
			<CardContent className="py-6">
				{isLoading && (
					<div className="space-y-3">
						{[1, 2, 3].map((i) => (
							<Skeleton key={i} className="h-12 w-full" />
						))}
					</div>
				)}
				{audit && (
					<div className="relative space-y-0">
						{audit.events.map((event, idx) => {
							const isLast = idx === audit.events.length - 1;
							const isTerminal = [
								"completed",
								"completed_with_errors",
								"cancelled",
								"stale",
							].includes(event.action);
							const isOverride = event.action === "override";
							return (
								<div key={`${event.action}-${idx}`} className="flex gap-4">
									<div className="relative flex flex-col items-center">
										<div
											className={cn(
												"flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2",
												event.action === "completed" &&
													"border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50",
												event.action === "completed_with_errors" &&
													"border-amber-500 bg-amber-50 dark:bg-amber-950/50",
												["cancelled", "stale"].includes(event.action) &&
													"border-destructive/50 bg-destructive/5",
												isOverride &&
													"border-violet-400/60 bg-violet-50 dark:bg-violet-950/30",
												![
													"completed",
													"completed_with_errors",
													"cancelled",
													"stale",
													"override",
												].includes(event.action) &&
													"border-muted-foreground/40 bg-muted",
											)}
										>
											{event.action === "completed" ? (
												<CheckCircle2 className="size-4 text-emerald-600" />
											) : event.action === "completed_with_errors" ? (
												<AlertCircle className="size-4 text-amber-600" />
											) : ["cancelled", "stale"].includes(event.action) ? (
												<XCircle className="size-4 text-destructive" />
											) : isOverride ? (
												<Pencil className="size-3.5 text-violet-600" />
											) : (
												<div className="h-2 w-2 rounded-full bg-muted-foreground/60" />
											)}
										</div>
										{!isLast && <div className="mt-1 w-px flex-1 bg-border" />}
									</div>
									<div className="pt-1 pb-6">
										<p className="font-medium text-sm">
											{t(
												`admin.academicYearTransitions.audit.action.${event.action}`,
											)}
											{isOverride && event.studentName && (
												<span className="ml-1.5 font-normal text-muted-foreground">
													— {event.studentName}
													{event.studentRegistrationNumber && (
														<span className="ml-1 text-xs">
															({event.studentRegistrationNumber})
														</span>
													)}
												</span>
											)}
										</p>
										<p className="text-muted-foreground text-xs">
											{event.actorName ? `${event.actorName} · ` : ""}
											{event.at
												? new Intl.DateTimeFormat(undefined, {
														dateStyle: "medium",
														timeStyle: "short",
													}).format(new Date(event.at))
												: "—"}
										</p>
										{isOverride && event.overrideReason && (
											<p className="mt-1 text-muted-foreground text-xs italic">
												"{event.overrideReason}"
											</p>
										)}
										{isTerminal &&
											audit.summary &&
											Object.keys(audit.summary).length > 0 && (
												<div className="mt-2 flex flex-wrap gap-2">
													{["promote", "graduate", "repeat", "failed"].map(
														(key) => {
															const val = audit.summary?.[key] ?? 0;
															if (val === 0) return null;
															return (
																<span
																	key={key}
																	className="rounded border px-2 py-0.5 text-xs"
																>
																	{t(
																		`admin.academicYearTransitions.outcome.${key}`,
																	)}
																	: {val}
																</span>
															);
														},
													)}
												</div>
											)}
									</div>
								</div>
							);
						})}
						{audit.events.length === 0 && (
							<p className="text-center text-muted-foreground text-sm">
								{t("admin.academicYearTransitions.audit.empty")}
							</p>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
