import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronDown, ChevronUp, ClipboardCheck, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { GradingProgress } from "@/components/ui/grading-progress";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "../../utils/trpc";

interface ExamItem {
	id: string;
	name: string;
	percentage: number;
	classCourse: string;
	status: string;
}

// ─── Reject Dialog ────────────────────────────────────────────────────────────

function RejectExamDialog({
	examId,
	examName,
	open,
	onClose,
}: {
	examId: string;
	examName: string;
	open: boolean;
	onClose: () => void;
}) {
	const queryClient = useQueryClient();
	const [reason, setReason] = useState("");

	const rejectMutation = useMutation({
		mutationFn: () =>
			trpcClient.workflows.rejectGrades
				? trpcClient.workflows.rejectGrades.mutate({ examId, reason })
				: // Fallback: use validateGrades with a reject flag if rejectGrades doesn't exist
					Promise.reject(new Error("Procédure rejectGrades non disponible")),
		onSuccess: () => {
			toast.success("Examen rejeté");
			queryClient.invalidateQueries(trpc.exams.list.queryKey());
			onClose();
			setReason("");
		},
		onError: (e: Error) => toast.error(e.message),
	});

	return (
		<Dialog open={open} onOpenChange={(o) => !o && onClose()}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-destructive">
						<X className="h-5 w-5" />
						Rejeter l'examen
					</DialogTitle>
				</DialogHeader>
				<p className="text-muted-foreground text-sm">
					<strong>{examName}</strong> — veuillez indiquer la raison du rejet.
				</p>
				<textarea
					value={reason}
					onChange={(e) => setReason(e.target.value)}
					placeholder="Raison du rejet (obligatoire)..."
					className="min-h-[80px] w-full resize-none rounded-md border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
				/>
				<DialogFooter>
					<Button variant="outline" onClick={onClose}>
						Annuler
					</Button>
					<Button
						variant="destructive"
						disabled={!reason.trim() || rejectMutation.isPending}
						onClick={() => rejectMutation.mutate()}
					>
						Rejeter
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// ─── Exam Approval Card ───────────────────────────────────────────────────────

function ExamApprovalCard({
	exam,
	selected,
	onToggle,
}: {
	exam: ExamItem;
	selected: boolean;
	onToggle: () => void;
}) {
	const queryClient = useQueryClient();
	const [expanded, setExpanded] = useState(false);
	const [rejectOpen, setRejectOpen] = useState(false);

	const gradesQuery = useQuery({
		queryKey: ["dean-grades", exam.id],
		enabled: expanded,
		queryFn: () =>
			trpcClient.grades.listByExam
				.query({ examId: exam.id })
				.then((r) => r.items),
	});

	const approveMutation = useMutation({
		mutationFn: () =>
			trpcClient.workflows.validateGrades.mutate({
				examId: exam.id,
				approverId: undefined,
			}),
		onSuccess: () => {
			toast.success("Examen approuvé");
			queryClient.invalidateQueries(trpc.exams.list.queryKey());
		},
		onError: (e: Error) => toast.error(e.message),
	});

	const grades = gradesQuery.data ?? [];
	const graded = grades.length;
	const avg =
		graded > 0
			? (grades.reduce((s, g) => s + Number(g.score), 0) / graded).toFixed(1)
			: null;
	const min =
		graded > 0
			? Math.min(...grades.map((g) => Number(g.score))).toFixed(1)
			: null;
	const max =
		graded > 0
			? Math.max(...grades.map((g) => Number(g.score))).toFixed(1)
			: null;

	return (
		<div className="overflow-hidden rounded-xl border bg-card shadow-sm">
			<div className="flex items-center gap-3 px-4 py-3">
				<Checkbox checked={selected} onCheckedChange={onToggle} />
				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-center gap-2">
						<span className="font-semibold text-foreground text-sm">
							{exam.name}
						</span>
						<Badge variant="warning" className="text-xs">
							Soumis
						</Badge>
						<span className="text-muted-foreground text-xs">
							{exam.percentage}%
						</span>
					</div>
					<p className="mt-0.5 text-muted-foreground text-xs">
						Cours : {exam.classCourse}
					</p>
				</div>
				{avg && (
					<div className="hidden shrink-0 items-center gap-3 text-muted-foreground text-xs md:flex">
						<span>
							Moy <strong className="text-foreground">{avg}</strong>
						</span>
						<span>Min {min}</span>
						<span>Max {max}</span>
					</div>
				)}
				<div className="flex shrink-0 items-center gap-2">
					<Button
						size="sm"
						variant="outline"
						className="border-destructive/30 text-destructive hover:bg-destructive/5"
						onClick={() => setRejectOpen(true)}
					>
						<X className="h-3.5 w-3.5" />
						Rejeter
					</Button>
					<Button
						size="sm"
						onClick={() => approveMutation.mutate()}
						disabled={approveMutation.isPending}
					>
						<Check className="mr-1 h-3.5 w-3.5" />
						Approuver
					</Button>
					<Button
						size="icon"
						variant="ghost"
						className="h-8 w-8"
						onClick={() => setExpanded((p) => !p)}
					>
						{expanded ? (
							<ChevronUp className="h-4 w-4" />
						) : (
							<ChevronDown className="h-4 w-4" />
						)}
					</Button>
				</div>
			</div>

			{expanded && (
				<div className="border-t bg-muted/20 px-4 py-3">
					{gradesQuery.isLoading ? (
						<div className="flex justify-center py-4">
							<Spinner className="h-5 w-5" />
						</div>
					) : grades.length === 0 ? (
						<p className="py-2 text-center text-muted-foreground text-sm">
							Aucune note enregistrée
						</p>
					) : (
						<>
							<div className="mb-2">
								<GradingProgress graded={graded} total={graded} />
							</div>
							<div className="max-h-64 overflow-y-auto rounded-md border">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Étudiant</TableHead>
											<TableHead className="w-24 text-right">Note</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{grades.map((g) => (
											<TableRow key={g.id}>
												<TableCell className="text-sm">{g.student}</TableCell>
												<TableCell className="text-right font-medium tabular-nums">
													{Number(g.score).toFixed(2)}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						</>
					)}
				</div>
			)}

			<RejectExamDialog
				examId={exam.id}
				examName={exam.name}
				open={rejectOpen}
				onClose={() => setRejectOpen(false)}
			/>
		</div>
	);
}

// ─── DeanDashboard ────────────────────────────────────────────────────────────

export default function DeanDashboard() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

	const examsQuery = useQuery(trpc.exams.list.queryOptions({ limit: 100 }));

	const bulkApproveMutation = useMutation({
		mutationFn: async (ids: string[]) => {
			await Promise.all(
				ids.map((examId) =>
					trpcClient.workflows.validateGrades.mutate({
						examId,
						approverId: undefined,
					}),
				),
			);
		},
		onSuccess: () => {
			toast.success("Examens approuvés");
			queryClient.invalidateQueries(trpc.exams.list.queryKey());
			setSelectedIds(new Set());
		},
		onError: (e: Error) => toast.error(e.message),
	});

	const submittedExams =
		(examsQuery.data?.items?.filter(
			(e) => e.status === "submitted",
		) as ExamItem[]) ?? [];

	const toggle = (id: string) =>
		setSelectedIds((prev) => {
			const next = new Set(prev);
			next.has(id) ? next.delete(id) : next.add(id);
			return next;
		});

	const allSelected =
		submittedExams.length > 0 && selectedIds.size === submittedExams.length;

	return (
		<div className="space-y-6">
			<PageHeader
				title="Approbations en attente"
				description={
					submittedExams.length > 0
						? `${submittedExams.length} examen${submittedExams.length > 1 ? "s" : ""} en attente de votre validation`
						: "Aucun examen en attente"
				}
			/>

			{examsQuery.isLoading ? (
				<div className="flex h-48 items-center justify-center">
					<Spinner className="h-8 w-8 text-primary" />
				</div>
			) : submittedExams.length === 0 ? (
				<div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-12 text-center">
					<div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
						<ClipboardCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
					</div>
					<div>
						<p className="font-medium text-foreground">Tout est à jour</p>
						<p className="text-muted-foreground text-sm">
							Aucun examen n'attend votre validation.
						</p>
					</div>
				</div>
			) : (
				<>
					{/* Bulk actions bar */}
					<div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-2.5">
						<div className="flex items-center gap-2">
							<Checkbox
								checked={allSelected}
								onCheckedChange={(checked) => {
									setSelectedIds(
										checked
											? new Set(submittedExams.map((e) => e.id))
											: new Set(),
									);
								}}
							/>
							<span className="text-muted-foreground text-sm">
								{selectedIds.size > 0
									? `${selectedIds.size} sélectionné${selectedIds.size > 1 ? "s" : ""}`
									: "Tout sélectionner"}
							</span>
						</div>
						{selectedIds.size > 0 && (
							<Button
								size="sm"
								onClick={() => bulkApproveMutation.mutate([...selectedIds])}
								disabled={bulkApproveMutation.isPending}
							>
								<Check className="mr-1 h-3.5 w-3.5" />
								Approuver la sélection ({selectedIds.size})
							</Button>
						)}
					</div>

					<div className="space-y-3">
						{submittedExams.map((exam) => (
							<ExamApprovalCard
								key={exam.id}
								exam={exam}
								selected={selectedIds.has(exam.id)}
								onToggle={() => toggle(exam.id)}
							/>
						))}
					</div>
				</>
			)}
		</div>
	);
}
