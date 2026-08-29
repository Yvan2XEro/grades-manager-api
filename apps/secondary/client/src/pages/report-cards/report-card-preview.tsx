import {
	CheckCircle,
	Download,
	RefreshCw,
	Send,
	ShieldCheck,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";

type ReportCardStatus =
	| "draft"
	| "generated"
	| "validated_admin"
	| "validated_vp"
	| "signed"
	| "published";

const STATUS_VARIANTS: Record<
	ReportCardStatus,
	"secondary" | "info" | "success" | "warning" | "default"
> = {
	draft: "secondary",
	generated: "info",
	validated_admin: "warning",
	validated_vp: "warning",
	signed: "success",
	published: "default",
};

type SubjectAverage = {
	subjectId: string;
	subjectName: string;
	subjectNameFr: string;
	avg: number;
	assessmentCount: number;
	coeff?: number;
};

type ClassSubjectStat = {
	classAvg: number;
	classMin: number;
	classMax: number;
	classCount: number;
};

type SnapshotData = {
	studentId?: string;
	termId?: string;
	enrollmentId?: string;
	generatedAt?: string;
	subjectAverages?: Record<string, SubjectAverage>;
	overallAverage?: number | null;
	assessmentCount?: number;
	totalCoefficients?: number;
	rank?: number | null;
	classSize?: number | null;
	classSubjectStats?: Record<string, ClassSubjectStat>;
	absentSessions?: number | null;
	mentionCode?: string | null;
};

function PreviewSkeleton() {
	return (
		<div className="space-y-6">
			<Skeleton className="h-4 w-28" />
			<div className="space-y-2">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-4 w-32" />
			</div>
			<Skeleton className="h-48 w-full" />
		</div>
	);
}

export function ReportCardPreview() {
	const { t } = useTranslation();
	const { id } = useParams<{ id: string }>();

	const utils = trpc.useUtils();
	const { data: card, isLoading } = trpc.reportCards.get.useQuery(
		{ id: id! },
		{ enabled: !!id },
	);

	const generate = trpc.reportCards.generate.useMutation({
		onSuccess: () => {
			utils.reportCards.get.invalidate({ id: id! });
		},
	});

	const updateStatus = trpc.reportCards.updateStatus.useMutation({
		onSuccess: () => {
			utils.reportCards.get.invalidate({ id: id! });
		},
	});

	const generatePdf = trpc.reportCards.generatePdf.useMutation({
		onSuccess: ({ pdfBase64, filename }) => {
			const binary = atob(pdfBase64);
			const bytes = new Uint8Array(binary.length);
			for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
			const blob = new Blob([bytes], { type: "application/pdf" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = filename;
			a.click();
			URL.revokeObjectURL(url);
		},
	});

	if (isLoading) return <PreviewSkeleton />;

	if (!card) {
		return (
			<div className="py-24 text-center text-muted-foreground">
				<p className="font-medium">
					{t("report_cards.not_found", "Report card not found")}
				</p>
			</div>
		);
	}

	const snapshot = (card.snapshotData ?? {}) as SnapshotData;
	const subjectAverages = snapshot.subjectAverages ?? {};
	const subjectRows = Object.values(subjectAverages);
	const classSubjectStats = snapshot.classSubjectStats ?? {};
	const hasClassStats = Object.keys(classSubjectStats).length > 0;
	const status = card.status as ReportCardStatus;

	const handleGenerate = () => {
		if (snapshot.studentId && card.termId) {
			generate.mutate({ studentId: snapshot.studentId, termId: card.termId });
		}
	};

	// Lifecycle transition config: for each status, what action advances it?
	const NEXT_ACTION: Partial<
		Record<
			ReportCardStatus,
			{ nextStatus: ReportCardStatus; label: string; icon: React.ReactNode }
		>
	> = {
		generated: {
			nextStatus: "validated_admin",
			label: t("report_cards.action_validate_admin", "Validate (Admin)"),
			icon: <CheckCircle className="mr-2 h-4 w-4" />,
		},
		validated_admin: {
			nextStatus: "validated_vp",
			label: t("report_cards.action_validate_vp", "Validate (VP)"),
			icon: <ShieldCheck className="mr-2 h-4 w-4" />,
		},
		validated_vp: {
			nextStatus: "signed",
			label: t("report_cards.action_sign", "Sign"),
			icon: <CheckCircle className="mr-2 h-4 w-4" />,
		},
		signed: {
			nextStatus: "published",
			label: t("report_cards.action_publish", "Publish"),
			icon: <Send className="mr-2 h-4 w-4" />,
		},
	};
	const nextAction = NEXT_ACTION[status];

	return (
		<div className="space-y-6">
			<div className="flex items-start justify-between gap-4">
				<div>
					<h1 className="font-bold text-2xl text-foreground">
						{t("report_cards.preview_title", "Report Card")}
					</h1>
					<p className="text-muted-foreground text-sm">
						{snapshot.generatedAt
							? new Date(snapshot.generatedAt).toLocaleDateString()
							: "—"}
					</p>
				</div>
				<div className="flex items-center gap-3">
					<Badge variant={STATUS_VARIANTS[status] ?? "secondary"}>
						{t(`report_cards.status_${status}`, status ?? "draft")}
					</Badge>
					<Button
						variant={card.status === "draft" ? "default" : "outline"}
						size="sm"
						onClick={handleGenerate}
						disabled={generate.isPending || !snapshot.studentId}
					>
						<RefreshCw className="mr-2 h-4 w-4" />
						{card.status === "draft"
							? t("report_cards.generate", "Generate")
							: t("report_cards.regenerate", "Regenerate")}
					</Button>
					{card.status !== "draft" && (
						<Button
							variant="outline"
							size="sm"
							onClick={() => generatePdf.mutate({ id: card.id })}
							disabled={generatePdf.isPending}
						>
							<Download className="mr-2 h-4 w-4" />
							{t("report_cards.download_pdf", "Download PDF")}
						</Button>
					)}
					{nextAction && (
						<Button
							size="sm"
							onClick={() =>
								updateStatus.mutate({
									id: card.id,
									status: nextAction.nextStatus,
								})
							}
							disabled={updateStatus.isPending}
						>
							{nextAction.icon}
							{nextAction.label}
						</Button>
					)}
				</div>
			</div>

			{subjectRows.length > 0 ? (
				<Card>
					<CardHeader className="pb-2">
						<div className="flex items-center justify-between">
							<p className="font-semibold text-foreground">
								{t("report_cards.subject_averages", "Subject averages")}
							</p>
							<div className="flex items-center gap-3 text-muted-foreground text-sm">
								{snapshot.rank !== null && snapshot.rank !== undefined && (
									<span>
										{t("report_cards.rank", "Rank")}:{" "}
										<span className="font-bold text-foreground">
											{snapshot.rank}
											{snapshot.classSize ? `/${snapshot.classSize}` : ""}
										</span>
									</span>
								)}
								{snapshot.mentionCode && (
									<Badge variant="outline" className="capitalize">
										{snapshot.mentionCode.replace(/_/g, " ")}
									</Badge>
								)}
								{snapshot.absentSessions != null && (
									<span
										className={
											snapshot.absentSessions > 0
												? "text-amber-600 dark:text-amber-400"
												: ""
										}
									>
										{t("report_cards.absences", "Absences")}:{" "}
										<span className="font-semibold">
											{snapshot.absentSessions}
										</span>
									</span>
								)}
							</div>
						</div>
					</CardHeader>
					<CardContent className="p-0">
						<div className="overflow-hidden rounded-b-xl">
							<table className="w-full text-sm">
								<thead className="border-border border-b bg-muted/60 text-muted-foreground">
									<tr>
										<th className="px-4 py-2 text-left font-medium">
											{t("subjects.col_name", "Subject")}
										</th>
										<th className="w-16 px-3 py-2 text-center font-medium">
											{t("grades.col_coeff", "Coeff.")}
										</th>
										<th className="px-4 py-2 text-right font-medium">
											{t("grades.col_avg", "Average /20")}
										</th>
										{hasClassStats && (
											<>
												<th className="px-3 py-2 text-right font-medium text-muted-foreground text-xs">
													{t("report_cards.class_avg", "Class avg")}
												</th>
												<th className="px-3 py-2 text-right font-medium text-muted-foreground text-xs">
													{t("report_cards.class_min", "Min")}
												</th>
												<th className="px-3 py-2 text-right font-medium text-muted-foreground text-xs">
													{t("report_cards.class_max", "Max")}
												</th>
											</>
										)}
										<th className="px-4 py-2 text-right font-medium">
											{t("grades.col_count", "Assessments")}
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-border">
									{subjectRows.map((row) => {
										const cs = classSubjectStats[row.subjectId];
										return (
											<tr
												key={row.subjectId}
												className="transition-colors hover:bg-muted/20"
											>
												<td className="px-4 py-2 font-medium text-foreground">
													{row.subjectName}
												</td>
												<td className="px-3 py-2 text-center text-muted-foreground">
													{row.coeff ?? 1}
												</td>
												<td className="px-4 py-2 text-right font-semibold tabular-nums">
													{row.avg !== null ? row.avg.toFixed(2) : "—"}
												</td>
												{hasClassStats && (
													<>
														<td className="px-3 py-2 text-right text-muted-foreground text-sm tabular-nums">
															{cs ? cs.classAvg.toFixed(2) : "—"}
														</td>
														<td className="px-3 py-2 text-right text-muted-foreground text-sm tabular-nums">
															{cs ? cs.classMin.toFixed(2) : "—"}
														</td>
														<td className="px-3 py-2 text-right text-muted-foreground text-sm tabular-nums">
															{cs ? cs.classMax.toFixed(2) : "—"}
														</td>
													</>
												)}
												<td className="px-4 py-2 text-right text-muted-foreground">
													{row.assessmentCount}
												</td>
											</tr>
										);
									})}
								</tbody>
								{snapshot.overallAverage !== null &&
									snapshot.overallAverage !== undefined && (
										<tfoot>
											<tr className="bg-muted/30">
												<td
													className="px-4 py-3 font-bold text-foreground"
													colSpan={2}
												>
													{t("report_cards.overall_avg", "Weighted average")}
												</td>
												<td className="px-4 py-3 text-right font-bold tabular-nums">
													{typeof snapshot.overallAverage === "number"
														? snapshot.overallAverage.toFixed(2)
														: snapshot.overallAverage}
												</td>
												{hasClassStats && <td colSpan={3} />}
												<td />
											</tr>
										</tfoot>
									)}
							</table>
						</div>
					</CardContent>
				</Card>
			) : (
				<Card>
					<CardContent className="py-12 text-center text-muted-foreground">
						<p className="font-medium">
							{t(
								"report_cards.no_snapshot",
								"No grade data available. Generate the report card to compute averages.",
							)}
						</p>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
