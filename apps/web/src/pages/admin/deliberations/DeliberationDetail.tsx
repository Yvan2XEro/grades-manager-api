import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	ArrowLeft,
	Download,
	FileSignature,
	FileSpreadsheet,
	Gavel,
	Loader2,
	Lock,
	Play,
	UserCheck,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import * as XLSX from "xlsx";
import { HubNav } from "@/components/navigation/HubNav";
import { useConfirm } from "@/hooks/useConfirm";
import { toast } from "@/lib/toast";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { trpcClient } from "../../../utils/trpc";
import type { OverrideState } from "./DeliberationContext";
import { DeliberationContext } from "./DeliberationContext";
import OverrideDecisionDialog from "./OverrideDecisionDialog";
import PromoteAdmittedDialog from "./PromoteAdmittedDialog";

const statusVariants: Record<
	string,
	"default" | "secondary" | "destructive" | "outline" | "success" | "warning"
> = {
	draft: "secondary",
	open: "default",
	closed: "outline",
	signed: "success",
};

const TABS = [
	{
		path: "results",
		labelKey: "admin.deliberations.detail.tabs.results",
	},
	{
		path: "jury",
		labelKey: "admin.deliberations.detail.tabs.jury",
	},
	{
		path: "activity",
		labelKey: "admin.deliberations.detail.tabs.activity",
	},
] as const;

export default function DeliberationDetail() {
	const { deliberationId } = useParams<{ deliberationId: string }>();
	const navigate = useNavigate();
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [overrideStudent, setOverrideStudent] = useState<OverrideState | null>(
		null,
	);
	const [promoteOpen, setPromoteOpen] = useState(false);
	const { confirm, ConfirmDialog } = useConfirm();

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
			<div className="py-12 text-center text-muted-foreground">
				{t("common.notFound")}
			</div>
		);
	}

	const results = delib.studentResults ?? [];
	const status = delib.status;
	const isOpen = status === "open";
	const isDraft = status === "draft";
	const isClosed = status === "closed";
	const isSigned = status === "signed";

	const basePath = `/admin/academic-results/deliberations/${deliberationId}`;

	return (
		<DeliberationContext.Provider
			value={{
				deliberationId: deliberationId!,
				delib,
				isOpen,
				isDraft,
				isClosed,
				isSigned,
				logsLoading: logsQuery.isLoading,
				logs: logsQuery.data?.items ?? [],
				setOverrideStudent,
				setPromoteOpen,
			}}
		>
			<div className="space-y-4">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<Button
							variant="ghost"
							size="icon"
							onClick={() => navigate("/admin/academic-results/deliberations")}
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
									onClick={() =>
										confirm({
											title: t("admin.deliberations.confirm.closeTitle"),
											message: t("admin.deliberations.confirm.close"),
											confirmText: t("admin.deliberations.actions.close"),
											onConfirm: () => transitionMutation.mutate("close"),
										})
									}
									disabled={transitionMutation.isPending}
								>
									<Lock className="mr-2 h-4 w-4" />
									{t("admin.deliberations.actions.close")}
								</Button>
							</>
						)}
						{isClosed && (
							<>
								<Button
									variant="outline"
									onClick={() =>
										confirm({
											title: t("admin.deliberations.confirm.reopenTitle"),
											message: t("admin.deliberations.confirm.reopen"),
											confirmText: t("admin.deliberations.actions.reopen"),
											onConfirm: () => transitionMutation.mutate("reopen"),
										})
									}
									disabled={transitionMutation.isPending}
								>
									{t("admin.deliberations.actions.reopen")}
								</Button>
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
									onClick={() =>
										confirm({
											title: t("admin.deliberations.confirm.signTitle"),
											message: t("admin.deliberations.confirm.sign"),
											confirmText: t("admin.deliberations.actions.sign"),
											onConfirm: () => transitionMutation.mutate("sign"),
										})
									}
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

				{/* Hub tabs */}
				<HubNav tabs={TABS} basePath={basePath} />

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
				<ConfirmDialog />
			</div>
		</DeliberationContext.Provider>
	);
}
