import { Fragment, useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { formatDecimal } from "@/lib/number-format";
import { useProfileContext } from "../../hooks/use-profile-context";
import {
	type ProfileYearResults,
	useProfileResults,
} from "../../hooks/use-profile-results";

const ueDecisionVariants: Record<
	string,
	"default" | "secondary" | "destructive" | "outline"
> = {
	ADM: "default",
	CMP: "secondary",
	AJ: "destructive",
	INC: "outline",
};

/**
 * Course results of the student for one academic year: the figures of the
 * year's closed/signed jury, else the marks entered so far (computed with the
 * jury's formula and flagged as provisional).
 */
export default function ProfileResultsTab() {
	const { profileId } = useProfileContext();
	const { t } = useTranslation();
	const [academicYearId, setAcademicYearId] = useState<string | undefined>();

	const { data, isLoading } = useProfileResults(profileId, academicYearId);

	if (isLoading) return <TableSkeleton columns={6} rows={6} />;

	const years = data?.years ?? [];
	const results = data?.results ?? null;

	if (!years.length || !results) {
		return (
			<div className="py-12 text-center text-muted-foreground">
				{t("profileHub.results.empty")}
			</div>
		);
	}

	return (
		<div className="space-y-4 pt-6">
			<div className="flex flex-wrap items-center gap-3">
				<Select
					value={results.academicYear.id}
					onValueChange={(v) => setAcademicYearId(v)}
				>
					<SelectTrigger
						className="w-full sm:w-72"
						aria-label={t("profileHub.results.academicYear")}
					>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{years.map((y) => (
							<SelectItem key={y.academicYearId} value={y.academicYearId}>
								{y.academicYearName} — {y.className}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<SourceBadge results={results} />
			</div>

			<ResultsSummary results={results} />

			{results.ueResults.length === 0 ? (
				<div className="py-8 text-center text-muted-foreground">
					{t("profileHub.results.noCourses")}
				</div>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>{t("profileHub.results.course")}</TableHead>
							<TableHead className="text-right">
								{t("profileHub.results.cc")}
							</TableHead>
							<TableHead className="text-right">
								{t("profileHub.results.exam")}
							</TableHead>
							<TableHead className="text-right">
								{t("profileHub.results.average")}
							</TableHead>
							<TableHead className="text-right">
								{t("profileHub.results.credits")}
							</TableHead>
							<TableHead>{t("profileHub.results.status")}</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{results.ueResults.map((ue) => (
							<Fragment key={ue.ueId}>
								<TableRow className="bg-muted/40 hover:bg-muted/40">
									<TableCell className="font-medium" colSpan={3}>
										{ue.ueCode} — {ue.ueName}
									</TableCell>
									<TableCell className="text-right font-semibold tabular-nums">
										{formatDecimal(ue.ueAverage)}
									</TableCell>
									<TableCell className="text-right tabular-nums">
										{ue.creditsEarned} / {ue.ueCredits}
									</TableCell>
									<TableCell>
										<Badge
											variant={ueDecisionVariants[ue.decision] ?? "outline"}
										>
											{t(`admin.deliberations.ueDecision.${ue.decision}`)}
										</Badge>
									</TableCell>
								</TableRow>
								{ue.courseResults.map((c) => (
									<TableRow key={c.courseId}>
										<TableCell className="pl-6 text-sm">
											{c.courseName}
										</TableCell>
										<TableCell className="text-right text-sm tabular-nums">
											{formatDecimal(c.cc)}
										</TableCell>
										<TableCell className="text-right text-sm tabular-nums">
											{formatDecimal(c.ex)}
										</TableCell>
										<TableCell className="text-right text-sm tabular-nums">
											{formatDecimal(c.average)}
										</TableCell>
										<TableCell />
										<TableCell />
									</TableRow>
								))}
							</Fragment>
						))}
					</TableBody>
				</Table>
			)}
		</div>
	);
}

function SourceBadge({ results }: { results: ProfileYearResults }) {
	const { t } = useTranslation();
	if (results.source === "jury") {
		return (
			<Badge variant="secondary">
				{results.jury?.status === "signed"
					? t("profileHub.results.source.jurySigned")
					: t("profileHub.results.source.juryClosed")}
			</Badge>
		);
	}
	return (
		<Badge variant="outline">
			{t("profileHub.results.source.provisional")}
		</Badge>
	);
}

function ResultsSummary({ results }: { results: ProfileYearResults }) {
	const { t } = useTranslation();
	const average = results.generalAverage ?? results.partialAverage;
	const items = [
		{
			label:
				results.generalAverage === null && results.partialAverage !== null
					? t("profileHub.results.partialAverage")
					: t("profileHub.results.generalAverage"),
			value: average === null ? "—" : `${formatDecimal(average)} / 20`,
		},
		{
			label: t("profileHub.results.creditsEarned"),
			value: `${results.totalCreditsEarned} / ${results.totalCreditsPossible}`,
		},
		{
			label: t("profileHub.results.decision"),
			value: results.decision
				? t(`admin.deliberations.decision.${results.decision}`)
				: t("profileHub.results.notDeliberated"),
		},
		{
			label: t("profileHub.results.mention"),
			value: results.mention
				? t(`admin.deliberations.mention.${results.mention}` as never)
				: "—",
		},
	];
	return (
		<div className="grid grid-cols-2 gap-3 md:grid-cols-4">
			{items.map((item) => (
				<div key={item.label} className="rounded-lg border bg-card p-3">
					<p className="text-muted-foreground text-xs">{item.label}</p>
					<p className="mt-1 font-semibold tabular-nums">{item.value}</p>
				</div>
			))}
		</div>
	);
}
