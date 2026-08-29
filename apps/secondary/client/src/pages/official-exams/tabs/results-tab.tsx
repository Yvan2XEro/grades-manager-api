import { Award, CheckCircle, Users, XCircle } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";

type Candidate = {
	registration: {
		id: string;
		enrollmentId: string;
		candidateNumber: string | null;
		isEligible: boolean | null;
		hasPaidFee: boolean | null;
		isAdmitted: boolean | null;
		mention: string | null;
	};
	student: {
		id: string;
		firstName: string;
		lastName: string;
		mnu: string | null;
	};
};

const MENTION_OPTIONS = [
	{ value: "TB", label: "Très Bien" },
	{ value: "B", label: "Bien" },
	{ value: "AB", label: "Assez Bien" },
	{ value: "P", label: "Passable" },
	{ value: "AJOURNÉ", label: "Ajourné" },
];

function CandidateResultRow({
	candidate,
	onUpdate,
}: {
	candidate: Candidate;
	onUpdate: () => void;
}) {
	const { t } = useTranslation();
	const [isAdmitted, setIsAdmitted] = useState<boolean | null>(
		candidate.registration.isAdmitted,
	);
	const [mention, setMention] = useState<string>(
		candidate.registration.mention ?? "",
	);
	const [saved, setSaved] = useState(false);

	const update = trpc.officialExams.updateCandidate.useMutation({
		onSuccess: () => {
			setSaved(true);
			setTimeout(() => setSaved(false), 2000);
			onUpdate();
		},
	});

	const handleSave = () => {
		update.mutate({
			id: candidate.registration.id,
			isAdmitted: isAdmitted ?? false,
			mention: mention || undefined,
		});
	};

	const { student, registration } = candidate;

	return (
		<tr className="border-border border-b transition-colors last:border-0 hover:bg-muted/20">
			<td className="px-4 py-3">
				<div className="font-medium text-foreground text-sm">
					{student.lastName} {student.firstName}
				</div>
				{student.mnu && (
					<div className="font-mono text-muted-foreground text-xs">
						MNU: {student.mnu}
					</div>
				)}
			</td>
			<td className="px-4 py-3 text-center font-mono text-muted-foreground text-sm">
				{registration.candidateNumber ?? "—"}
			</td>
			<td className="px-4 py-3 text-center">
				{registration.isEligible === true ? (
					<Badge variant="success">
						{t("official_exams.eligible", "Eligible")}
					</Badge>
				) : registration.isEligible === false ? (
					<Badge variant="warning">
						{t("official_exams.not_eligible", "Not eligible")}
					</Badge>
				) : (
					<span className="text-muted-foreground text-xs">—</span>
				)}
			</td>
			<td className="px-4 py-3 text-center">
				<div className="flex items-center justify-center gap-2">
					<button
						type="button"
						onClick={() => setIsAdmitted(true)}
						className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
							isAdmitted === true
								? "bg-green-500 text-white"
								: "bg-muted text-muted-foreground hover:bg-green-100 hover:text-green-700"
						}`}
						title={t("official_exams.admitted", "Admitted")}
					>
						<CheckCircle className="h-4 w-4" />
					</button>
					<button
						type="button"
						onClick={() => setIsAdmitted(false)}
						className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
							isAdmitted === false
								? "bg-red-500 text-white"
								: "bg-muted text-muted-foreground hover:bg-red-100 hover:text-red-700"
						}`}
						title={t("official_exams.failed", "Failed")}
					>
						<XCircle className="h-4 w-4" />
					</button>
				</div>
			</td>
			<td className="px-4 py-3">
				<Select value={mention} onValueChange={setMention}>
					<SelectTrigger className="h-8 w-36 text-xs">
						<SelectValue
							placeholder={t("official_exams.mention_none", "— Mention —")}
						/>
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="">
							{t("official_exams.mention_none", "— None —")}
						</SelectItem>
						{MENTION_OPTIONS.map((opt) => (
							<SelectItem key={opt.value} value={opt.value}>
								{opt.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</td>
			<td className="px-4 py-3">
				<Button
					size="sm"
					variant={saved ? "default" : "outline"}
					disabled={update.isPending}
					onClick={handleSave}
					className={saved ? "bg-green-500 text-white hover:bg-green-500" : ""}
				>
					{saved ? t("common.saved", "Saved!") : t("common.save", "Save")}
				</Button>
			</td>
		</tr>
	);
}

export function ExamResultsTab() {
	const { t } = useTranslation();
	const { id: examSessionId } = useParams<{ id: string }>();
	const utils = trpc.useUtils();

	const { data: candidates = [], isLoading } =
		trpc.officialExams.listCandidates.useQuery(
			{ examSessionId: examSessionId! },
			{ enabled: !!examSessionId },
		);

	const onUpdate = () => {
		utils.officialExams.listCandidates.invalidate({
			examSessionId: examSessionId!,
		});
	};

	const admitted = (candidates as Candidate[]).filter(
		(c) => c.registration.isAdmitted === true,
	).length;
	const failed = (candidates as Candidate[]).filter(
		(c) => c.registration.isAdmitted === false,
	).length;
	const pending = candidates.length - admitted - failed;

	if (isLoading) {
		return (
			<div className="space-y-3">
				{[1, 2, 3].map((i) => (
					<Skeleton key={i} className="h-12 w-full" />
				))}
			</div>
		);
	}

	return (
		<div className="space-y-5">
			{/* Summary strip */}
			<div className="grid grid-cols-3 gap-4">
				<div className="rounded-xl border border-border bg-green-50 p-4 text-center dark:bg-green-950/20">
					<p className="font-bold text-2xl text-green-700 dark:text-green-400">
						{admitted}
					</p>
					<p className="text-green-600 text-xs dark:text-green-500">
						{t("official_exams.results_admitted", "Admitted")}
					</p>
				</div>
				<div className="rounded-xl border border-border bg-red-50 p-4 text-center dark:bg-red-950/20">
					<p className="font-bold text-2xl text-red-700 dark:text-red-400">
						{failed}
					</p>
					<p className="text-red-600 text-xs dark:text-red-500">
						{t("official_exams.results_failed", "Failed")}
					</p>
				</div>
				<div className="rounded-xl border border-border bg-muted p-4 text-center">
					<p className="font-bold text-2xl text-foreground">{pending}</p>
					<p className="text-muted-foreground text-xs">
						{t("official_exams.results_pending", "Pending")}
					</p>
				</div>
			</div>

			{/* Results table */}
			<div className="overflow-hidden rounded-xl border border-border">
				<div className="flex items-center gap-2 border-border border-b bg-muted/30 px-4 py-3">
					<Award className="h-4 w-4 text-muted-foreground" />
					<span className="font-medium text-foreground text-sm">
						{t("official_exams.tab_results", "Results")}
					</span>
					<span className="ml-auto text-muted-foreground text-xs">
						{candidates.length} {t("official_exams.candidates", "candidates")}
					</span>
				</div>

				{candidates.length === 0 ? (
					<div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
						<Users className="h-10 w-10 opacity-20" />
						<p className="font-medium">
							{t(
								"official_exams.no_candidates",
								"No candidates registered yet",
							)}
						</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead className="border-border border-b bg-muted/60 text-muted-foreground">
								<tr>
									<th className="px-4 py-2 text-left font-medium text-muted-foreground">
										{t("official_exams.col_student", "Student")}
									</th>
									<th className="px-4 py-2 text-center font-medium text-muted-foreground">
										{t("official_exams.col_candidate_number", "Candidate #")}
									</th>
									<th className="px-4 py-2 text-center font-medium text-muted-foreground">
										{t("official_exams.eligibility", "Eligibility")}
									</th>
									<th className="px-4 py-2 text-center font-medium text-muted-foreground">
										{t("official_exams.result", "Result")}
									</th>
									<th className="px-4 py-2 text-left font-medium text-muted-foreground">
										{t("official_exams.mention", "Mention")}
									</th>
									<th className="px-4 py-2 text-left font-medium text-muted-foreground" />
								</tr>
							</thead>
							<tbody>
								{(candidates as Candidate[]).map((c) => (
									<CandidateResultRow
										key={c.registration.id}
										candidate={c}
										onUpdate={onUpdate}
									/>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
}
