import { CheckCircle2, ChevronDown, Pen, UserCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardCopy } from "@/components/ui/clipboard-copy";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { StudentResult } from "./DeliberationContext";
import { useDeliberationContext } from "./DeliberationContext";

type UeResult = NonNullable<StudentResult["ueResults"]>[number];

const decisionVariants: Record<
	string,
	"default" | "secondary" | "destructive" | "outline"
> = {
	admitted: "default",
	compensated: "secondary",
	deferred: "outline",
	repeat: "destructive",
	excluded: "destructive",
	pending: "outline",
};

const ueDecisionVariants: Record<
	string,
	"default" | "secondary" | "destructive" | "outline"
> = {
	ADM: "default",
	CMP: "secondary",
	AJ: "destructive",
	INC: "outline",
};

const UE_INLINE_MAX = 4;

function UeBadgesSummary({ ueResults }: { ueResults: UeResult[] }) {
	const { t } = useTranslation();

	if (ueResults.length === 0)
		return <span className="text-muted-foreground">—</span>;

	const counts: Record<string, number> = {};
	for (const ue of ueResults) {
		counts[ue.decision] = (counts[ue.decision] ?? 0) + 1;
	}

	const renderBadge = (ue: UeResult) => (
		<Badge
			key={ue.ueId}
			variant={ueDecisionVariants[ue.decision] ?? "outline"}
			className="px-1.5 py-0 text-[10px]"
			title={`${ue.ueName} (${ue.ueAverage != null ? Number(ue.ueAverage).toFixed(2) : "—"}/20)`}
		>
			{ue.ueCode}: {ue.decision}
		</Badge>
	);

	if (ueResults.length <= UE_INLINE_MAX) {
		return (
			<div className="flex flex-wrap gap-1">{ueResults.map(renderBadge)}</div>
		);
	}

	return (
		<Collapsible>
			<CollapsibleTrigger asChild>
				<button
					type="button"
					className="flex items-center gap-1.5 text-muted-foreground text-xs hover:text-foreground"
				>
					<div className="flex gap-1">
						{Object.entries(counts).map(([decision, count]) => (
							<Badge
								key={decision}
								variant={ueDecisionVariants[decision] ?? "outline"}
								className="px-1.5 py-0 text-[10px]"
							>
								{count}{" "}
								{t(`admin.deliberations.ueDecision.${decision}`, {
									defaultValue: decision,
								})}
							</Badge>
						))}
					</div>
					<ChevronDown className="h-3 w-3" />
				</button>
			</CollapsibleTrigger>
			<CollapsibleContent>
				<div className="mt-1.5 flex flex-wrap gap-1">
					{ueResults.map(renderBadge)}
				</div>
			</CollapsibleContent>
		</Collapsible>
	);
}

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

export default function DeliberationResultsTab() {
	const { t } = useTranslation();
	const {
		delib,
		isOpen,
		isClosed,
		isSigned,
		setOverrideStudent,
		setPromoteOpen,
	} = useDeliberationContext();

	const results = delib.studentResults ?? [];
	const stats = delib.stats;

	return (
		<div className="space-y-6 pt-6">
			{/* Promote CTA — when closed or signed */}
			{(isClosed || isSigned) && (
				<div className="flex items-center justify-between rounded-xl border bg-emerald-50 px-5 py-4 dark:bg-emerald-900/20">
					<div className="flex items-center gap-3">
						<CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
						<div>
							<p className="font-semibold text-emerald-900 text-sm dark:text-emerald-200">
								{t("admin.deliberations.promote.ctaTitle", {
									defaultValue: "Promote admitted students",
								})}
							</p>
							<p className="mt-0.5 text-emerald-700 text-xs dark:text-emerald-300">
								{t("admin.deliberations.promote.ctaDesc", {
									defaultValue:
										"Students with an 'Admitted' decision can be promoted to the next academic level.",
								})}
							</p>
						</div>
					</div>
					<Button onClick={() => setPromoteOpen(true)}>
						<UserCheck className="mr-2 h-4 w-4" />
						{t("admin.deliberations.promote.button")}
					</Button>
				</div>
			)}

			{/* Stats cards */}
			{stats && (
				<div className="grid gap-4 md:grid-cols-4">
					<div className="rounded-xl border bg-card p-5 shadow-sm">
						<p className="text-muted-foreground text-xs uppercase tracking-wide">
							{t("admin.deliberations.detail.totalStudents")}
						</p>
						<p className="mt-1 font-bold text-2xl">
							{stats.totalStudents ?? 0}
						</p>
					</div>
					<div className="rounded-xl border bg-card p-5 shadow-sm">
						<p className="text-muted-foreground text-xs uppercase tracking-wide">
							{t("admin.deliberations.detail.successRate")}
						</p>
						<p className="mt-1 font-bold text-2xl text-emerald-600">
							{stats.successRate != null
								? `${(stats.successRate * 100).toFixed(1)}%`
								: "—"}
						</p>
					</div>
					<div className="rounded-xl border bg-card p-5 shadow-sm">
						<p className="text-muted-foreground text-xs uppercase tracking-wide">
							{t("admin.deliberations.detail.classAverage")}
						</p>
						<p className="mt-1 font-bold text-2xl">
							{stats.classAverage != null
								? Number(stats.classAverage).toFixed(2)
								: "—"}
						</p>
					</div>
					<div className="rounded-xl border bg-card p-5 shadow-sm">
						<p className="text-muted-foreground text-xs uppercase tracking-wide">
							{t("admin.deliberations.decision.admitted")}
						</p>
						<p className="mt-1 font-bold text-2xl text-emerald-600">
							{stats.decisionCounts?.admitted ?? 0}
						</p>
					</div>
				</div>
			)}

			{/* Student results table */}
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
								<TableHead>
									{t("admin.deliberations.detail.decision")}
								</TableHead>
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
										setOverrideStudent({
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
		</div>
	);
}
