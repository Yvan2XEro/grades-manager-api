import { ExternalLink } from "lucide-react";
import { Fragment } from "react";
import { createCallable } from "react-call";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { DIALOG_EXIT_MS } from "@/components/callable/callable-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { formatDecimal } from "@/lib/number-format";
import {
	decisionVariants,
	ueDecisionVariants,
} from "../services/deliberation-status";
import type { StudentResult, UeResult } from "../types";

/**
 * Side panel with one student's jury result: average, credits, decision and
 * every UE with its courses (continuous assessment, exam, course average),
 * so the jury can check a mark without leaving the deliberation.
 */
export const StudentResultSheet = createCallable<
	{ result: StudentResult },
	void
>(({ call, result }) => {
	const { t } = useTranslation();
	const decision = result.finalDecision ?? "pending";
	const name =
		`${result.student?.profile?.lastName ?? ""} ${result.student?.profile?.firstName ?? ""}`.trim();
	const ueResults = (result.ueResults ?? []) as UeResult[];
	const domainUserId = result.student?.domainUserId;

	return (
		<Sheet open={!call.ended} onOpenChange={(o) => !o && call.end()}>
			<SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
				<SheetHeader>
					<SheetTitle>{name || "—"}</SheetTitle>
					<SheetDescription className="font-mono">
						{result.student?.registrationNumber ?? ""}
					</SheetDescription>
				</SheetHeader>

				<div className="space-y-4 px-4 pb-6">
					<dl className="grid grid-cols-3 gap-3 rounded-lg border bg-muted/30 p-3 text-sm">
						<div>
							<dt className="text-muted-foreground text-xs">
								{t("admin.deliberations.detail.average")}
							</dt>
							<dd className="font-mono font-semibold">
								{formatDecimal(result.generalAverage)}
							</dd>
						</div>
						<div>
							<dt className="text-muted-foreground text-xs">
								{t("admin.deliberations.detail.credits")}
							</dt>
							<dd className="font-semibold">
								{t("admin.deliberations.detail.creditsFormat", {
									earned: result.totalCreditsEarned ?? 0,
									total: result.totalCreditsPossible ?? 0,
								})}
							</dd>
						</div>
						<div>
							<dt className="text-muted-foreground text-xs">
								{t("admin.deliberations.detail.decision")}
							</dt>
							<dd>
								<Badge variant={decisionVariants[decision] ?? "outline"}>
									{t(`admin.deliberations.decision.${decision}`)}
								</Badge>
							</dd>
						</div>
					</dl>

					{result.isOverridden && result.overrideReason && (
						<p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900 text-xs dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-200">
							{t("admin.deliberations.studentSheet.overrideReason", {
								reason: result.overrideReason,
							})}
						</p>
					)}

					{ueResults.length === 0 ? (
						<p className="text-muted-foreground text-sm">
							{t("admin.deliberations.detail.noResults")}
						</p>
					) : (
						<div className="overflow-x-auto rounded-lg border">
							<table className="w-full text-xs">
								<thead className="bg-muted/40 text-muted-foreground">
									<tr>
										<th className="px-2 py-1.5 text-left font-medium">
											{t("admin.deliberations.studentSheet.course")}
										</th>
										<th className="px-2 py-1.5 text-right font-medium">
											{t("admin.deliberations.studentSheet.cc")}
										</th>
										<th className="px-2 py-1.5 text-right font-medium">
											{t("admin.deliberations.studentSheet.exam")}
										</th>
										<th className="px-2 py-1.5 text-right font-medium">
											{t("admin.deliberations.studentSheet.average")}
										</th>
									</tr>
								</thead>
								<tbody>
									{ueResults.map((ue) => (
										<Fragment key={ue.ueId}>
											<tr className="border-t bg-muted/20">
												<td className="px-2 py-1.5 font-medium">
													<span className="font-mono text-muted-foreground">
														{ue.ueCode}
													</span>{" "}
													{ue.ueName}
													<span className="ml-1 text-muted-foreground">
														·{" "}
														{t("admin.deliberations.studentSheet.ueCredits", {
															count: ue.ueCredits,
														})}
													</span>
												</td>
												<td />
												<td className="px-2 py-1.5 text-right">
													<Badge
														variant={
															ueDecisionVariants[ue.decision] ?? "outline"
														}
														className="px-1.5 py-0 text-[10px]"
													>
														{t(`admin.deliberations.ueDecision.${ue.decision}`)}
													</Badge>
												</td>
												<td className="px-2 py-1.5 text-right font-mono font-semibold">
													{formatDecimal(ue.ueAverage)}
												</td>
											</tr>
											{(ue.courseResults ?? []).map((c) => (
												<tr key={c.courseId} className="border-t">
													<td className="py-1.5 pr-2 pl-5">
														{c.courseName}
														<span className="ml-1 text-muted-foreground">
															(×{c.coefficient})
														</span>
													</td>
													<td className="px-2 py-1.5 text-right font-mono">
														{formatDecimal(c.cc)}
													</td>
													<td className="px-2 py-1.5 text-right font-mono">
														{formatDecimal(c.ex)}
													</td>
													<td className="px-2 py-1.5 text-right font-mono">
														{formatDecimal(c.average)}
													</td>
												</tr>
											))}
										</Fragment>
									))}
								</tbody>
							</table>
						</div>
					)}

					{domainUserId && (
						<Button asChild variant="outline" size="sm">
							<Link to={`/profiles/${domainUserId}`} onClick={() => call.end()}>
								<ExternalLink className="mr-1.5 h-3.5 w-3.5" />
								{t("admin.deliberations.studentSheet.openFile")}
							</Link>
						</Button>
					)}
				</div>
			</SheetContent>
		</Sheet>
	);
}, DIALOG_EXIT_MS);
