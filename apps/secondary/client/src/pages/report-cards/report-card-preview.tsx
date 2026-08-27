import { ArrowLeft, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";
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
};

type SnapshotData = {
	studentId?: string;
	termId?: string;
	enrollmentId?: string;
	generatedAt?: string;
	subjectAverages?: Record<string, SubjectAverage>;
	overallAverage?: number | null;
	assessmentCount?: number;
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
	const status = card.status as ReportCardStatus;

	const handleGenerate = () => {
		if (snapshot.studentId && card.termId) {
			generate.mutate({ studentId: snapshot.studentId, termId: card.termId });
		}
	};

	return (
		<div className="space-y-6">
			<Link
				to="/report-cards"
				className="inline-flex items-center gap-1 text-muted-foreground text-sm hover:text-foreground"
			>
				<ArrowLeft className="h-4 w-4" />
				{t("nav.report_cards", "Report cards")}
			</Link>

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
				</div>
			</div>

			{subjectRows.length > 0 ? (
				<Card>
					<CardHeader className="pb-2">
						<p className="font-semibold text-foreground">
							{t("report_cards.subject_averages", "Subject averages")}
						</p>
					</CardHeader>
					<CardContent className="p-0">
						<div className="overflow-hidden rounded-b-xl">
							<table className="w-full text-sm">
								<thead className="bg-muted/40 text-muted-foreground">
									<tr>
										<th className="px-4 py-2 text-left font-medium">
											{t("subjects.col_name", "Subject")}
										</th>
										<th className="px-4 py-2 text-right font-medium">
											{t("grades.col_avg", "Average /20")}
										</th>
										<th className="px-4 py-2 text-right font-medium">
											{t("grades.col_count", "Assessments")}
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-border">
									{subjectRows.map((row) => (
										<tr
											key={row.subjectId}
											className="transition-colors hover:bg-muted/20"
										>
											<td className="px-4 py-2 font-medium text-foreground">
												{row.subjectName}
											</td>
											<td className="px-4 py-2 text-right tabular-nums">
												{row.avg !== null ? row.avg : "—"}
											</td>
											<td className="px-4 py-2 text-right text-muted-foreground">
												{row.assessmentCount}
											</td>
										</tr>
									))}
								</tbody>
								{snapshot.overallAverage !== null &&
									snapshot.overallAverage !== undefined && (
										<tfoot>
											<tr className="bg-muted/30">
												<td className="px-4 py-3 font-bold text-foreground">
													{t("report_cards.overall_avg", "Overall average")}
												</td>
												<td className="px-4 py-3 text-right font-bold tabular-nums">
													{snapshot.overallAverage}
												</td>
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
