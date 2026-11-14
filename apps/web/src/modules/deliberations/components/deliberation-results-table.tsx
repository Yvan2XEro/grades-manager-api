import { Pen } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardCopy } from "@/components/ui/clipboard-copy";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { decisionVariants } from "../services/deliberation-status";
import type { OverrideState, StudentResult, UeResult } from "../types";
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

	return (
		<TableRow>
			<TableCell className="font-medium text-muted-foreground">
				{r.rank ?? "—"}
			</TableCell>
			<TableCell>
				{r.student?.registrationNumber ? (
					<ClipboardCopy
						value={r.student.registrationNumber}
						label={t("admin.deliberations.detail.registrationNumber")}
					/>
				) : (
					"—"
				)}
			</TableCell>
			<TableCell className="font-medium">
				{r.student?.profile?.firstName ?? ""}{" "}
				{r.student?.profile?.lastName ?? ""}
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
				<div className="flex items-center gap-1.5">
					<Badge variant={decisionVariants[r.finalDecision] ?? "outline"}>
						{t(`admin.deliberations.decision.${r.finalDecision}`, {
							defaultValue: r.finalDecision,
						})}
					</Badge>
					{r.isOverridden && <Pen className="h-3 w-3 text-amber-500" />}
				</div>
			</TableCell>
			<TableCell>
				{r.mention
					? t(`admin.deliberations.mention.${r.mention}`, {
							defaultValue: r.mention,
						})
					: "—"}
			</TableCell>
			{isOpen && (
				<TableCell>
					<Button variant="ghost" size="sm" onClick={onOverride}>
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
	onOverride: (student: OverrideState) => void;
}

/** Ranked student results of a deliberation. */
export function DeliberationResultsTable({
	results,
	isOpen,
	onOverride,
}: DeliberationResultsTableProps) {
	const { t } = useTranslation();

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
							<TableHead className="w-[60px]">
								{t("admin.deliberations.detail.rank")}
							</TableHead>
							<TableHead>
								{t("admin.deliberations.detail.registrationNumber")}
							</TableHead>
							<TableHead>{t("admin.deliberations.detail.student")}</TableHead>
							<TableHead className="text-right">
								{t("admin.deliberations.detail.average")}
							</TableHead>
							<TableHead className="text-right">
								{t("admin.deliberations.detail.credits")}
							</TableHead>
							<TableHead>UE</TableHead>
							<TableHead>{t("admin.deliberations.detail.decision")}</TableHead>
							<TableHead>{t("admin.deliberations.detail.mention")}</TableHead>
							{isOpen && <TableHead className="w-[60px]" />}
						</TableRow>
					</TableHeader>
					<TableBody>
						{results.map((r) => (
							<StudentResultRow
								key={r.id}
								result={r}
								isOpen={isOpen}
								onOverride={() =>
									onOverride({
										studentResultId: r.id,
										studentName:
											`${r.student?.profile?.firstName ?? ""} ${r.student?.profile?.lastName ?? ""}`.trim(),
										currentDecision: r.finalDecision,
									})
								}
							/>
						))}
					</TableBody>
				</Table>
			)}
		</div>
	);
}
