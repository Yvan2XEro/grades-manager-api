import { format } from "date-fns";
import { Award, ChevronDown, ChevronUp, FileText } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DecisionResult } from "../../types";

const DECISION_CONFIG: Record<
	string,
	{ code: string; labelKey: string; isSuccess: boolean; isPending?: boolean }
> = {
	admitted: {
		code: "ADM",
		labelKey: "deliberation.decision.admitted",
		isSuccess: true,
	},
	compensated: {
		code: "CMP",
		labelKey: "deliberation.decision.compensated",
		isSuccess: true,
	},
	deferred: {
		code: "AJ",
		labelKey: "deliberation.decision.deferred",
		isSuccess: false,
	},
	repeat: {
		code: "RED",
		labelKey: "deliberation.decision.repeat",
		isSuccess: false,
	},
	excluded: {
		code: "EXC",
		labelKey: "deliberation.decision.excluded",
		isSuccess: false,
	},
	pending: {
		code: "EN",
		labelKey: "deliberation.decision.pending",
		isSuccess: false,
		isPending: true,
	},
};

export function DeliberationDecisionCard({
	decision,
	isLatest,
}: {
	decision: DecisionResult;
	isLatest?: boolean;
}) {
	const { t } = useTranslation();
	const [ueOpen, setUeOpen] = useState(false);

	if (!decision.finalDecision) return null;
	const cfg = DECISION_CONFIG[decision.finalDecision] ?? {
		code: "—",
		labelKey: "deliberation.decision.unknown",
		isSuccess: false,
	};

	const wrapCls = cfg.isPending
		? "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30"
		: cfg.isSuccess
			? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
			: "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30";
	const badgeCls = cfg.isPending
		? "bg-blue-500 text-white"
		: cfg.isSuccess
			? "bg-emerald-600 text-white"
			: "bg-amber-500 text-white";
	const iconCls = cfg.isPending
		? "text-blue-500 dark:text-blue-400"
		: cfg.isSuccess
			? "text-emerald-600 dark:text-emerald-400"
			: "text-amber-500";

	return (
		<div className={`rounded-xl border shadow-sm ${wrapCls}`}>
			<div className="flex items-start gap-4 p-4">
				<div
					className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-sm ${badgeCls}`}
				>
					{cfg.code}
				</div>
				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-center gap-2">
						<span className="font-semibold text-foreground text-sm">
							{t(cfg.labelKey)}
						</span>
						{isLatest && (
							<Badge variant="secondary" className="text-xs">
								{t("student.performance.latestDecision")}
							</Badge>
						)}
						{decision.isOverridden && (
							<Badge variant="outline" className="text-xs">
								{t("deliberation.decision.overridden")}
							</Badge>
						)}
					</div>
					<div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-muted-foreground text-xs">
						{decision.academicYear && <span>{decision.academicYear}</span>}
						{decision.className && <span>{decision.className}</span>}
						{decision.generalAverage !== null && (
							<span>
								{t("student.performance.average")}:{" "}
								{decision.generalAverage.toFixed(2)}/20
							</span>
						)}
						{decision.mention && (
							<span>
								{t("student.performance.mention", {
									mention: decision.mention,
								})}
							</span>
						)}
						{decision.rank !== null && (
							<span>
								{t("student.performance.rank", { rank: decision.rank })}
							</span>
						)}
						{decision.closedAt && (
							<span>
								{t("deliberation.publishedAt", {
									date: format(new Date(decision.closedAt), "dd/MM/yyyy"),
								})}
							</span>
						)}
					</div>
				</div>
				<Award className={`h-5 w-5 shrink-0 ${iconCls}`} />
			</div>

			{decision.ueResults.length > 0 && (
				<>
					<button
						type="button"
						className="flex w-full items-center justify-between border-t px-4 py-2 text-left text-muted-foreground text-xs transition-colors hover:bg-muted/20"
						onClick={() => setUeOpen((p) => !p)}
					>
						<span className="font-medium">
							{t("student.performance.ueBreakdown")}
						</span>
						{ueOpen ? (
							<ChevronUp className="h-3.5 w-3.5" />
						) : (
							<ChevronDown className="h-3.5 w-3.5" />
						)}
					</button>
					{ueOpen && (
						<div className="border-t">
							{decision.ueResults.map((ue) => (
								<div
									key={ue.ueId}
									className="flex items-center justify-between border-b px-4 py-2 last:border-0"
								>
									<div className="min-w-0">
										<p className="truncate font-medium text-foreground text-xs">
											{ue.ueName}
											{ue.ueCode && (
												<span className="ml-1 font-mono text-[10px] text-muted-foreground">
													{ue.ueCode}
												</span>
											)}
										</p>
										<p className="text-[10px] text-muted-foreground">
											{ue.creditsEarned}/{ue.ueCredits} crédits
										</p>
									</div>
									<div className="flex shrink-0 items-center gap-2">
										{ue.ueAverage !== null && (
											<span className="font-semibold text-foreground text-xs tabular-nums">
												{ue.ueAverage.toFixed(2)}
											</span>
										)}
										{ue.isValidated ? (
											<Badge variant="success" className="text-[10px]">
												{t("student.performance.validated")}
											</Badge>
										) : (
											<Badge variant="destructive" className="text-[10px]">
												{t("student.performance.notValidated")}
											</Badge>
										)}
									</div>
								</div>
							))}
						</div>
					)}
				</>
			)}
			{decision.closedAt && (
				<div className="border-t px-4 py-3">
					<Button asChild size="sm" variant="outline">
						<Link to="/documents">
							<FileText className="mr-2 h-4 w-4" />
							{t("student.performance.downloadDocuments")}
						</Link>
					</Button>
				</div>
			)}
		</div>
	);
}
