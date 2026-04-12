import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	ArrowLeft,
	CheckCircle2,
	ChevronDown,
	Download,
	FileSignature,
	FileSpreadsheet,
	Gavel,
	Loader2,
	Lock,
	Pen,
	Play,
	UserCheck,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import * as XLSX from "xlsx";
import { toast } from "@/lib/toast";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { ClipboardCopy } from "../../../components/ui/clipboard-copy";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "../../../components/ui/collapsible";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "../../../components/ui/table";
import { TableSkeleton } from "../../../components/ui/table-skeleton";
import type { RouterOutputs } from "../../../utils/trpc";
import { trpcClient } from "../../../utils/trpc";
import OverrideDecisionDialog from "./OverrideDecisionDialog";
import PromoteAdmittedDialog from "./PromoteAdmittedDialog";

// ---------------------------------------------------------------------------
// Types inferred from tRPC
// ---------------------------------------------------------------------------
type Deliberation = RouterOutputs["deliberations"]["getById"];
type StudentResult = Deliberation["studentResults"][number];
type UeResult = NonNullable<StudentResult["ueResults"]>[number];
type LogEntry = RouterOutputs["deliberations"]["getLogs"]["items"][number];

// ---------------------------------------------------------------------------
// Variant maps
// ---------------------------------------------------------------------------
const statusVariants: Record<
	string,
	"default" | "secondary" | "destructive" | "outline"
> = {
	draft: "outline",
	open: "default",
	closed: "secondary",
	signed: "default",
};

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

// ---------------------------------------------------------------------------
// UE badges component
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function DeliberationDetail() {
	const { deliberationId } = useParams<{ deliberationId: string }>();
	const navigate = useNavigate();
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [overrideStudent, setOverrideStudent] = useState<{
		studentResultId: string;
		studentName: string;
		currentDecision: string;
	} | null>(null);
	const [promoteOpen, setPromoteOpen] = useState(false);

	const deliberationQuery = useQuery({
		queryKey: ["deliberation", deliberationId],
		queryFn: () =>
			trpcClient.deliberations.getById.query({ id: deliberationId! }),
		enabled: !!deliberationId,
	});

	const logsQuery = useQuery({
		queryKey: ["deliberation-logs", deliberationId],
		queryFn: () =>
			trpcClient.deliberations.getLogs.query({
				deliberationId: deliberationId!,
			}),
		enabled: !!deliberationId,
	});

	const invalidateAll = () => {
		queryClient.invalidateQueries({
			queryKey: ["deliberation", deliberationId],
		});
		queryClient.invalidateQueries({
			queryKey: ["deliberation-logs", deliberationId],
		});
	};

	const transitionMutation = useMutation({
		mutationFn: (action: string) =>
			trpcClient.deliberations.transition.mutate({
				id: deliberationId!,
				action: action as "open" | "close" | "sign" | "reopen",
			}),
		onSuccess: () => {
			toast.success(t("admin.deliberations.toast.transitionSuccess"));
			invalidateAll();
		},
		onError: (err) => toast.error((err as Error).message),
	});

	const computeMutation = useMutation({
		mutationFn: () =>
			trpcClient.deliberations.compute.mutate({ id: deliberationId! }),
		onSuccess: () => {
			toast.success(t("admin.deliberations.toast.computeSuccess"));
			invalidateAll();
		},
		onError: (err) => toast.error((err as Error).message),
	});

	const pdfExportMutation = useMutation({
		mutationFn: () =>
			trpcClient.exports.generateDeliberation.mutate({
				deliberationId: deliberationId!,
				format: "pdf",
			}),
		onSuccess: (result) => {
			const link = document.createElement("a");
			link.href = `data:${result.mimeType};base64,${result.data}`;
			link.download = result.filename;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			toast.success(t("admin.deliberations.toast.exportSuccess"));
		},
		onError: (err) => toast.error((err as Error).message),
	});

	const excelExportMutation = useMutation({
		mutationFn: () =>
			trpcClient.exports.getDeliberationData.query({
				deliberationId: deliberationId!,
			}),
		onSuccess: (data: any) => {
			const headerRows: any[][] = [
				[data.name_fr || data.name_en || ""],
				[],
				[
					data.deliberation?.programName
						? `Programme: ${data.deliberation.programName}`
						: "",
				],
				[
					data.deliberation?.className
						? `Classe: ${data.deliberation.className}`
						: "",
				],
				[
					data.deliberation?.academicYearName
						? `Année académique: ${data.deliberation.academicYearName}`
						: "",
				],
				[
					data.deliberation?.semesterName
						? `Semestre: ${data.deliberation.semesterName}`
						: "",
				],
				[],
			];

			const ues: any[] = data.ues ?? [];
			// Build header rows
			const colHeaders = ["Rang", "Matricule", "Nom", "Prénom"];
			for (const ue of ues) {
				colHeaders.push(`${ue.code} Moy`, `${ue.code} Dec`, `${ue.code} Cré`);
			}
			colHeaders.push("Moy Gén", "Crédits", "Décision", "Mention");
			headerRows.push(colHeaders);

			const dataRows = (data.students ?? []).map((s: any) => {
				const row: any[] = [
					s.rank,
					s.registrationNumber,
					s.lastName,
					s.firstName,
				];
				for (const ue of s.ueResults ?? []) {
					row.push(
						ue.ueAverage != null ? Math.round(ue.ueAverage * 100) / 100 : "",
						ue.decision,
						ue.creditsEarned,
					);
				}
				row.push(
					s.generalAverage != null
						? Math.round(s.generalAverage * 100) / 100
						: "",
					`${s.totalCreditsEarned} / ${s.totalCreditsPossible}`,
					s.finalDecisionLabel,
					s.mentionLabel ?? "",
				);
				return row;
			});

			// Stats row
			const statsRow = data.stats
				? [
						`Taux de réussite: ${data.stats.successRate}% | Admis: ${data.stats.admittedCount} | Compensés: ${data.stats.compensatedCount} | Ajournés: ${data.stats.deferredCount}`,
					]
				: [];

			const allRows = [...headerRows, ...dataRows, [], statsRow];
			const ws = XLSX.utils.aoa_to_sheet(allRows);
			const wb = XLSX.utils.book_new();
			XLSX.utils.book_append_sheet(wb, ws, "Délibération");
			XLSX.writeFile(
				wb,
				`Deliberation_${new Date().toISOString().split("T")[0]}.xlsx`,
			);
			toast.success(t("admin.deliberations.toast.exportSuccess"));
		},
		onError: (err) => toast.error((err as Error).message),
	});

	if (deliberationQuery.isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="h-6 w-6 animate-spin text-muted-foreground/60" />
			</div>
		);
	}

	const delib = deliberationQuery.data;
	if (!delib) {
		return (
			<Empty>
				<EmptyHeader>
					<EmptyDescription>Not found</EmptyDescription>
				</EmptyHeader>
			</Empty>
		);
	}

	const results = delib.studentResults ?? [];
	const stats = delib.stats;
	const status = delib.status;
	const isOpen = status === "open";
	const isDraft = status === "draft";
	const isClosed = status === "closed";
	const isSigned = status === "signed";

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => navigate("/admin/deliberations")}
					>
						<ArrowLeft className="h-5 w-5" />
					</Button>
					<div>
						<div className="flex items-center gap-2">
							<h1 className="text-foreground">
								{delib.classRef?.name ?? "Deliberation"}
							</h1>
							<Badge variant={statusVariants[status] ?? "outline"}>
								{t(`admin.deliberations.status.${status}`)}
							</Badge>
							<Badge variant="outline">
								{t(`admin.deliberations.type.${delib.type}`)}
							</Badge>
						</div>
						<p className="text-muted-foreground text-xs">
							{delib.academicYear?.name ?? ""}{" "}
							{delib.semester ? `— ${delib.semester.name}` : ""}
						</p>
					</div>
				</div>

				{/* Actions */}
				<div className="flex items-center gap-2">
					{isDraft && (
						<Button
							onClick={() => transitionMutation.mutate("open")}
							disabled={transitionMutation.isPending}
						>
							<Play className="mr-2 h-4 w-4" />
							{t("admin.deliberations.actions.open")}
						</Button>
					)}
					{isOpen && (
						<>
							<Button
								variant="outline"
								onClick={() => computeMutation.mutate()}
								disabled={computeMutation.isPending}
							>
								{computeMutation.isPending ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : (
									<Gavel className="mr-2 h-4 w-4" />
								)}
								{computeMutation.isPending
									? t("admin.deliberations.actions.computing")
									: t("admin.deliberations.actions.compute")}
							</Button>
							<Button
								onClick={() => {
									if (window.confirm(t("admin.deliberations.confirm.close"))) {
										transitionMutation.mutate("close");
									}
								}}
								disabled={transitionMutation.isPending}
							>
								<Lock className="mr-2 h-4 w-4" />
								{t("admin.deliberations.actions.close")}
							</Button>
						</>
					)}
					{isClosed && (
						<>
							<Button variant="outline" onClick={() => setPromoteOpen(true)}>
								<UserCheck className="mr-2 h-4 w-4" />
								{t("admin.deliberations.promote.button")}
							</Button>
							<Button
								variant="outline"
								onClick={() => pdfExportMutation.mutate()}
								disabled={pdfExportMutation.isPending}
							>
								{pdfExportMutation.isPending ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : (
									<Download className="mr-2 h-4 w-4" />
								)}
								PDF
							</Button>
							<Button
								variant="outline"
								onClick={() => excelExportMutation.mutate()}
								disabled={excelExportMutation.isPending}
							>
								{excelExportMutation.isPending ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : (
									<FileSpreadsheet className="mr-2 h-4 w-4" />
								)}
								Excel
							</Button>
							<Button
								onClick={() => {
									if (window.confirm(t("admin.deliberations.confirm.sign"))) {
										transitionMutation.mutate("sign");
									}
								}}
								disabled={transitionMutation.isPending}
							>
								<FileSignature className="mr-2 h-4 w-4" />
								{t("admin.deliberations.actions.sign")}
							</Button>
						</>
					)}
					{isSigned && (
						<>
							<Button variant="outline" onClick={() => setPromoteOpen(true)}>
								<UserCheck className="mr-2 h-4 w-4" />
								{t("admin.deliberations.promote.button")}
							</Button>
							<Button
								variant="outline"
								onClick={() => pdfExportMutation.mutate()}
								disabled={pdfExportMutation.isPending}
							>
								{pdfExportMutation.isPending ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : (
									<Download className="mr-2 h-4 w-4" />
								)}
								PDF
							</Button>
							<Button
								variant="outline"
								onClick={() => excelExportMutation.mutate()}
								disabled={excelExportMutation.isPending}
							>
								{excelExportMutation.isPending ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : (
									<FileSpreadsheet className="mr-2 h-4 w-4" />
								)}
								Excel
							</Button>
						</>
					)}
				</div>
			</div>

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
				{deliberationQuery.isLoading ? (
					<TableSkeleton columns={8} rows={8} />
				) : results.length === 0 ? (
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

			{/* Lifecycle info */}
			<div className="grid gap-4 md:grid-cols-2">
				{/* Jury */}
				<div className="rounded-xl border bg-card p-5 shadow-sm">
					<h3 className="mb-3 font-medium text-foreground text-sm">
						{t("admin.deliberations.detail.jury")}
					</h3>
					<dl className="space-y-2 text-sm">
						<div className="flex justify-between">
							<dt className="text-muted-foreground">
								{t("admin.deliberations.detail.president")}
							</dt>
							<dd className="font-medium">
								{delib.president
									? `${delib.president.firstName} ${delib.president.lastName}`
									: t("admin.deliberations.detail.noPresident")}
							</dd>
						</div>
						{(delib.juryMembers ?? []).map(
							(m: { role: string; name: string }, i: number) => (
								<div key={i} className="flex justify-between">
									<dt className="text-muted-foreground">{m.role}</dt>
									<dd>{m.name}</dd>
								</div>
							),
						)}
					</dl>
				</div>

				{/* Lifecycle */}
				<div className="rounded-xl border bg-card p-5 shadow-sm">
					<h3 className="mb-3 font-medium text-foreground text-sm">
						{t("admin.deliberations.detail.lifecycle")}
					</h3>
					<dl className="space-y-2 text-sm">
						<div className="flex justify-between">
							<dt className="text-muted-foreground">
								{t("admin.deliberations.detail.openedAt")}
							</dt>
							<dd>
								{delib.openedAt
									? new Date(delib.openedAt).toLocaleString()
									: t("admin.deliberations.detail.notYet")}
							</dd>
						</div>
						<div className="flex justify-between">
							<dt className="text-muted-foreground">
								{t("admin.deliberations.detail.closedAt")}
							</dt>
							<dd>
								{delib.closedAt
									? new Date(delib.closedAt).toLocaleString()
									: t("admin.deliberations.detail.notYet")}
							</dd>
						</div>
						<div className="flex justify-between">
							<dt className="text-muted-foreground">
								{t("admin.deliberations.detail.signedAt")}
							</dt>
							<dd>
								{delib.signedAt
									? new Date(delib.signedAt).toLocaleString()
									: t("admin.deliberations.detail.notYet")}
							</dd>
						</div>
					</dl>
				</div>
			</div>

			{/* Activity log */}
			<div className="rounded-xl border bg-card p-5 shadow-sm">
				<h3 className="mb-3 font-medium text-foreground text-sm">
					{t("admin.deliberations.logs.title")}
				</h3>
				{logsQuery.isLoading ? (
					<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
				) : (
					<div className="max-h-64 space-y-1 overflow-y-auto text-sm">
						{(logsQuery.data?.items ?? []).map((log) => (
							<div
								key={log.id}
								className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/40"
							>
								<CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
								<span className="text-muted-foreground">
									{new Date(log.createdAt).toLocaleString()}
								</span>
								<span className="font-medium">
									{t(`admin.deliberations.logs.${log.action}`, {
										defaultValue: log.action,
									})}
								</span>
							</div>
						))}
						{(logsQuery.data?.items ?? []).length === 0 && (
							<p className="text-muted-foreground">—</p>
						)}
					</div>
				)}
			</div>

			{/* Override dialog */}
			{overrideStudent && (
				<OverrideDecisionDialog
					open={!!overrideStudent}
					onOpenChange={(o) => !o && setOverrideStudent(null)}
					deliberationId={deliberationId!}
					studentResultId={overrideStudent.studentResultId}
					studentName={overrideStudent.studentName}
					currentDecision={overrideStudent.currentDecision}
				/>
			)}

			{/* Promote admitted dialog */}
			{(isClosed || isSigned) && delib.classId && (
				<PromoteAdmittedDialog
					open={promoteOpen}
					onOpenChange={setPromoteOpen}
					deliberationId={deliberationId!}
					sourceClassId={delib.classId}
					admittedCount={
						results.filter(
							(r) =>
								r.finalDecision === "admitted" ||
								r.finalDecision === "compensated",
						).length
					}
				/>
			)}
		</div>
	);
}

// ---------------------------------------------------------------------------
// Student result row (extracted for clarity)
// ---------------------------------------------------------------------------
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
