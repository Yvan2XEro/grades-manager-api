import { useMutation } from "@tanstack/react-query";
import { Loader2, RotateCcw } from "lucide-react";
import { useState } from "react";
import { createCallable } from "react-call";
import { useTranslation } from "react-i18next";
import { DIALOG_EXIT_MS } from "@/components/callable/callable-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogBody,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";
import { useInvalidateDeliberation } from "../hooks/use-deliberation";
import { deliberationErrorMessage } from "../services/deliberation-errors";
import {
	DELIBERATION_DECISIONS,
	type DeliberationDecision,
	decisionVariants,
	ueDecisionVariants,
} from "../services/deliberation-status";
import type { StudentResult, UeResult } from "../types";

interface Props {
	deliberationId: string;
	result: StudentResult;
}

/** Decisions whose effect deserves a one-line explanation. */
const HELP_DECISIONS: readonly DeliberationDecision[] = [
	"deferred",
	"repeat",
	"excluded",
];

const formatAverage = (value: number | null | undefined) =>
	value != null ? Number(value).toFixed(2) : "—";

/**
 * Overrides the final decision of one student result, with a reason. Shows
 * what the jury needs to decide (average, credits, UE results) and lets it
 * restore the computed decision.
 */
export const OverrideDecisionDialog = createCallable<Props, void>(
	({ call, deliberationId, result }) => {
		const { t } = useTranslation();
		const invalidateDeliberation = useInvalidateDeliberation(deliberationId);
		const [newDecision, setNewDecision] = useState("");
		const [reason, setReason] = useState("");

		const currentDecision = result.finalDecision ?? "pending";
		const computedDecision = result.autoDecision ?? "pending";
		const studentName =
			`${result.student?.profile?.lastName ?? ""} ${result.student?.profile?.firstName ?? ""}`.trim();
		const ueResults = (result.ueResults ?? []) as UeResult[];
		const facts = (result.factsSnapshot ?? {}) as {
			partialAverage?: number | null;
		};
		const selectableDecisions = DELIBERATION_DECISIONS.filter(
			(d) => d !== currentDecision,
		);
		// Help lines only for the decisions the jury can actually pick here
		const helpDecisions = selectableDecisions.filter((d) =>
			HELP_DECISIONS.includes(d),
		);
		const canRestore =
			result.isOverridden &&
			computedDecision !== "pending" &&
			computedDecision !== currentDecision;

		const overrideMutation = useMutation({
			mutationFn: (input: { decision: string; reason: string }) =>
				trpcClient.deliberations.overrideDecision.mutate({
					deliberationId,
					studentResultId: result.id,
					finalDecision: input.decision as DeliberationDecision,
					reason: input.reason,
				}),
			onSuccess: () => {
				toast.success(t("admin.deliberations.toast.overrideSuccess"));
				invalidateDeliberation();
				call.end();
			},
			onError: (err) => toast.error(deliberationErrorMessage(t, err)),
		});

		return (
			<Dialog open={!call.ended} onOpenChange={(o) => !o && call.end()}>
				<DialogContent className="sm:max-w-xl">
					<DialogHeader>
						<DialogTitle>{t("admin.deliberations.override.title")}</DialogTitle>
						<DialogDescription>
							{studentName}
							{result.student?.registrationNumber
								? ` · ${result.student.registrationNumber}`
								: ""}
						</DialogDescription>
					</DialogHeader>

					<DialogBody className="space-y-4">
						<dl className="grid grid-cols-3 gap-3 rounded-lg border bg-muted/30 p-3 text-sm">
							<div>
								<dt className="text-muted-foreground text-xs">
									{t("admin.deliberations.detail.average")}
								</dt>
								<dd className="font-mono font-semibold">
									{result.generalAverage != null
										? formatAverage(result.generalAverage)
										: facts.partialAverage != null
											? t("admin.deliberations.override.partialAverage", {
													value: formatAverage(facts.partialAverage),
												})
											: "—"}
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
									{t("admin.deliberations.override.computedDecision")}
								</dt>
								<dd>
									<Badge variant={decisionVariants[computedDecision]}>
										{t(`admin.deliberations.decision.${computedDecision}`)}
									</Badge>
								</dd>
							</div>
						</dl>

						{ueResults.length > 0 && (
							<div className="max-h-40 overflow-y-auto rounded-lg border">
								<table className="w-full text-xs">
									<tbody>
										{ueResults.map((ue) => (
											<tr key={ue.ueId} className="border-b last:border-0">
												<td className="px-2 py-1.5">
													<span className="font-mono text-muted-foreground">
														{ue.ueCode}
													</span>{" "}
													{ue.ueName}
												</td>
												<td className="px-2 py-1.5 text-right font-mono">
													{formatAverage(ue.ueAverage)}
												</td>
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
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}

						<div className="flex items-center justify-between gap-2">
							<div className="space-y-1">
								<Label>
									{t("admin.deliberations.override.currentDecision")}
								</Label>
								<div className="flex items-center gap-2">
									<Badge variant={decisionVariants[currentDecision]}>
										{t(`admin.deliberations.decision.${currentDecision}`)}
									</Badge>
									{result.isOverridden && (
										<span className="text-muted-foreground text-xs">
											{t("admin.deliberations.detail.overridden")}
										</span>
									)}
								</div>
							</div>
							{canRestore && (
								<Button
									variant="outline"
									size="sm"
									disabled={overrideMutation.isPending}
									onClick={() =>
										overrideMutation.mutate({
											decision: computedDecision,
											reason: t("admin.deliberations.override.restoreReason"),
										})
									}
								>
									<RotateCcw className="mr-1.5 h-3.5 w-3.5" />
									{t("admin.deliberations.override.restore", {
										decision: t(
											`admin.deliberations.decision.${computedDecision}`,
										),
									})}
								</Button>
							)}
						</div>

						<div className="space-y-2">
							<Label>{t("admin.deliberations.override.newDecision")}</Label>
							<Select value={newDecision} onValueChange={setNewDecision}>
								<SelectTrigger>
									<SelectValue
										placeholder={t(
											"admin.deliberations.override.newDecisionPlaceholder",
										)}
									/>
								</SelectTrigger>
								<SelectContent>
									{selectableDecisions.map((d) => (
										<SelectItem key={d} value={d}>
											{t(`admin.deliberations.decision.${d}`)}
											{d === computedDecision &&
												` (${t("admin.deliberations.override.computed")})`}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{helpDecisions.length > 0 && (
								<ul className="space-y-0.5 text-muted-foreground text-xs">
									{helpDecisions.map((d) => (
										<li key={d}>
											{t(`admin.deliberations.override.help.${d}`)}
										</li>
									))}
								</ul>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="override-reason">
								{t("admin.deliberations.override.reason")}
								<span className="text-destructive" aria-hidden="true">
									*
								</span>
							</Label>
							<Textarea
								id="override-reason"
								required
								aria-required="true"
								value={reason}
								onChange={(e) => setReason(e.target.value)}
								placeholder={t(
									"admin.deliberations.override.reasonPlaceholder",
								)}
								rows={3}
							/>
							<p className="text-muted-foreground text-xs">
								{t("admin.deliberations.override.reasonRequired")}
							</p>
						</div>
					</DialogBody>

					<DialogFooter>
						<Button variant="outline" onClick={() => call.end()}>
							{t("common.actions.cancel")}
						</Button>
						<Button
							onClick={() =>
								overrideMutation.mutate({ decision: newDecision, reason })
							}
							disabled={
								!newDecision || !reason.trim() || overrideMutation.isPending
							}
						>
							{overrideMutation.isPending && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							{t("common.actions.confirm")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		);
	},
	DIALOG_EXIT_MS,
);
