import { AlertTriangle, Pen } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	decisionVariants,
	incompleteUeCount,
	isIncompleteResult,
} from "../services/deliberation-status";
import type { StudentResult, UeResult } from "../types";
import { UeBadgesSummary } from "./ue-badges-summary";

function StudentResultRow({
	result: r,
	isOpen,
	onOverride,
}: {
	result: StudentResult;
	isOpen: boolean;
	onOverride: () => void;
}) {
	const { t } = useTranslation();
	// Results not computed yet have no decision
	const decision = r.finalDecision ?? "pending";
	const incomplete = isIncompleteResult(r);
	const missingUes = incompleteUeCount(r);
	const name =
		`${r.student?.profile?.lastName ?? ""} ${r.student?.profile?.firstName ?? ""}`.trim();

	return (
		<TableRow
			className={
				decision === "pending" ? "bg-amber-50/60 dark:bg-amber-900/10" : ""
			}
		>
			<TableCell className="font-medium text-muted-foreground">
				{r.rank ?? "—"}
			</TableCell>
			<TableCell>
				<div className="font-medium">{name || "—"}</div>
				<div className="font-mono text-muted-foreground text-xs">
					{r.student?.registrationNumber ?? ""}
				</div>
			</TableCell>
			<TableCell className="text-right font-mono">
				{r.generalAverage != null ? Number(r.generalAverage).toFixed(2) : "—"}
			</TableCell>
			<TableCell className="text-right">
				{t("admin.deliberations.detail.creditsFormat", {
					earned: r.totalCreditsEarned ?? 0,
					total: r.totalCreditsPossible ?? 0,
				})}
			</TableCell>
			<TableCell>
				<UeBadgesSummary ueResults={(r.ueResults ?? []) as UeResult[]} />
			</TableCell>
			<TableCell>
				<div className="flex flex-col items-start gap-0.5">
					<div className="flex items-center gap-1.5">
						<Badge variant={decisionVariants[decision] ?? "outline"}>
							{decision === "pending" && (
								<AlertTriangle className="mr-1 h-3 w-3" />
							)}
							{t(`admin.deliberations.decision.${decision}`)}
						</Badge>
						{r.isOverridden && (
							<Pen
								className="h-3 w-3 text-amber-500"
								aria-label={t("admin.deliberations.detail.overridden")}
							/>
						)}
					</div>
					{incomplete && missingUes > 0 && (
						<span className="text-amber-700 text-xs dark:text-amber-400">
							{t("admin.deliberations.detail.missingUes", {
								count: missingUes,
							})}
						</span>
					)}
				</div>
			</TableCell>
			<TableCell>
				{r.mention ? t(`admin.deliberations.mention.${r.mention}`) : "—"}
			</TableCell>
			{isOpen && (
				<TableCell className="sticky right-0 bg-card text-right">
					<Button
						variant="ghost"
						size="icon"
						onClick={onOverride}
						title={t("admin.deliberations.actions.override")}
						aria-label={t("admin.deliberations.actions.override")}
					>
						<Pen className="h-3.5 w-3.5" />
					</Button>
				</TableCell>
			)}
		</TableRow>
	);
}

interface DeliberationResultsTableProps {
	results: StudentResult[];
	/** Shows the override button of each row (open deliberations only). */
	isOpen: boolean;
	onOverride: (result: StudentResult) => void;
}

/** Ranked student results of a deliberation (unranked, incomplete ones last). */
export function DeliberationResultsTable({
	results,
	isOpen,
	onOverride,
}: DeliberationResultsTableProps) {
	const { t } = useTranslation();
	const sorted = [...results].sort((a, b) => {
		if (a.rank != null && b.rank != null) return a.rank - b.rank;
		if (a.rank != null) return -1;
		if (b.rank != null) return 1;
		return (a.student?.profile?.lastName ?? "").localeCompare(
			b.student?.profile?.lastName ?? "",
		);
	});

	return (
		<div className="rounded-xl border bg-card shadow-sm">
			<div className="border-b px-5 py-3">
				<h3 className="font-medium text-foreground text-sm">
					{t("admin.deliberations.detail.students")}
				</h3>
			</div>
			{results.length === 0 ? (
				<div className="py-10 text-center text-muted-foreground text-sm">
					{t("admin.deliberations.detail.noResults")}
				</div>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-[56px]">
								{t("admin.deliberations.detail.rank")}
							</TableHead>
							<TableHead>{t("admin.deliberations.detail.student")}</TableHead>
							<TableHead className="text-right">
								{t("admin.deliberations.detail.average")}
							</TableHead>
							<TableHead className="text-right">
								{t("admin.deliberations.detail.credits")}
							</TableHead>
							<TableHead>{t("admin.deliberations.detail.ues")}</TableHead>
							<TableHead>{t("admin.deliberations.detail.decision")}</TableHead>
							<TableHead>{t("admin.deliberations.detail.mention")}</TableHead>
							{isOpen && (
								<TableHead className="sticky right-0 w-[52px] bg-card" />
							)}
						</TableRow>
					</TableHeader>
					<TableBody>
						{sorted.map((r) => (
							<StudentResultRow
								key={r.id}
								result={r}
								isOpen={isOpen}
								onOverride={() => onOverride(r)}
							/>
						))}
					</TableBody>
				</Table>
			)}
		</div>
	);
}
