import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, ClipboardCheck, Clock, XCircle } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { trpc } from "../../utils/trpc";

type HistoryStatus = "approved" | "rejected" | "all";

function statusIcon(status: string) {
	if (status === "approved")
		return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
	if (status === "rejected")
		return <XCircle className="h-4 w-4 text-destructive" />;
	return <Clock className="h-4 w-4 text-muted-foreground" />;
}

export default function ApprovalHistory() {
	const { t } = useTranslation();
	const [statusFilter, setStatusFilter] = useState<HistoryStatus>("all");

	const examsQuery = useQuery(trpc.exams.list.queryOptions({ limit: 200 }));

	const allExams = examsQuery.data?.items ?? [];
	const historyExams = allExams.filter((e) => {
		if (statusFilter === "all")
			return e.status === "approved" || e.status === "rejected";
		return e.status === statusFilter;
	});

	const approvedCount = allExams.filter((e) => e.status === "approved").length;
	const rejectedCount = allExams.filter((e) => e.status === "rejected").length;

	return (
		<div className="space-y-6">
			<PageHeader
				title="Historique des approbations"
				description="Examens approuvés ou rejetés"
			/>

			{/* Summary strip */}
			<div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
				<div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
					<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
						<CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
					</div>
					<div>
						<p className="text-muted-foreground text-xs">Approuvés</p>
						<p className="font-bold text-xl tabular-nums">{approvedCount}</p>
					</div>
				</div>
				<div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
					<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
						<XCircle className="h-5 w-5 text-destructive" />
					</div>
					<div>
						<p className="text-muted-foreground text-xs">Rejetés</p>
						<p className="font-bold text-xl tabular-nums">{rejectedCount}</p>
					</div>
				</div>
			</div>

			{/* Filter */}
			<div className="flex items-center gap-3">
				<Select
					value={statusFilter}
					onValueChange={(v) => setStatusFilter(v as HistoryStatus)}
				>
					<SelectTrigger className="w-[180px]">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Tous</SelectItem>
						<SelectItem value="approved">Approuvés</SelectItem>
						<SelectItem value="rejected">Rejetés</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Table */}
			{examsQuery.isLoading ? (
				<div className="flex h-48 items-center justify-center">
					<Spinner className="h-8 w-8 text-primary" />
				</div>
			) : historyExams.length === 0 ? (
				<div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-12 text-center">
					<div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
						<ClipboardCheck className="h-6 w-6 text-muted-foreground" />
					</div>
					<div>
						<p className="font-medium text-foreground text-sm">
							Aucun historique
						</p>
						<p className="mt-1 text-muted-foreground text-xs">
							Aucun examen approuvé ou rejeté pour l'instant.
						</p>
					</div>
				</div>
			) : (
				<div className="rounded-xl border bg-card shadow-sm">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Examen</TableHead>
								<TableHead>Cours</TableHead>
								<TableHead>Coefficient</TableHead>
								<TableHead>Statut</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{historyExams.map((exam: any) => (
								<TableRow key={exam.id}>
									<TableCell className="font-medium">{exam.name}</TableCell>
									<TableCell className="text-muted-foreground text-sm">
										{exam.classCourse ?? "—"}
									</TableCell>
									<TableCell className="text-sm tabular-nums">
										{exam.percentage != null ? `${exam.percentage}%` : "—"}
									</TableCell>
									<TableCell>
										<div className="flex items-center gap-1.5">
											{statusIcon(exam.status)}
											<Badge
												variant={
													exam.status === "approved"
														? "success"
														: exam.status === "rejected"
															? "destructive"
															: "outline"
												}
												className="text-xs"
											>
												{exam.status === "approved" ? "Approuvé" : "Rejeté"}
											</Badge>
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}
		</div>
	);
}
