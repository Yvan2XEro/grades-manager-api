import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Info, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import type { RouterOutputs } from "@/utils/trpc";
import { trpc, trpcClient } from "@/utils/trpc";

type MentionRange = NonNullable<
	RouterOutputs["gradeScales"]["get"]
>["mentionRanges"][number];

const DEFAULT_RANGES: MentionRange[] = [
	{
		key: "excellent",
		label: "Excellent",
		labelEn: "Excellent",
		gradeLetter: "A",
		min: 18,
	},
	{
		key: "tres_bien",
		label: "Très Bien",
		labelEn: "Very Good",
		gradeLetter: "B",
		min: 16,
	},
	{ key: "bien", label: "Bien", labelEn: "Good", gradeLetter: "C", min: 14 },
	{
		key: "assez_bien",
		label: "Assez Bien",
		labelEn: "Fair",
		gradeLetter: "D",
		min: 12,
	},
	{
		key: "passable",
		label: "Passable",
		labelEn: "Satisfactory",
		gradeLetter: "E",
		min: 10,
	},
];

const INSTITUTION_SCOPE = "__institution__";

export default function GradeScaleSettings() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	const [scopeId, setScopeId] = useState<string>(INSTITUTION_SCOPE);
	const [previewScore, setPreviewScore] = useState("");

	const programId = scopeId === INSTITUTION_SCOPE ? null : scopeId;

	const { data: programs } = useQuery(trpc.programs.list.queryOptions({}));
	const { data: scale, isLoading } = useQuery(
		trpc.gradeScales.get.queryOptions({ programId }),
	);

	const [passThreshold, setPassThreshold] = useState(10);
	const [compensationThreshold, setCompensationThreshold] = useState(8);
	const [ranges, setRanges] = useState<MentionRange[]>(DEFAULT_RANGES);

	useEffect(() => {
		if (scale) {
			setPassThreshold(Number(scale.passThreshold));
			setCompensationThreshold(Number(scale.compensationThreshold));
			if (scale.mentionRanges?.length) setRanges(scale.mentionRanges);
		} else {
			setPassThreshold(10);
			setCompensationThreshold(8);
			setRanges(DEFAULT_RANGES);
		}
	}, [scale, scopeId]);

	const saveMut = useMutation({
		mutationFn: () =>
			trpcClient.gradeScales.upsert.mutate({
				programId,
				passThreshold,
				compensationThreshold,
				mentionRanges: ranges,
			}),
		onSuccess: () => {
			queryClient.invalidateQueries(
				trpc.gradeScales.get.queryKey({ programId }),
			);
		},
	});

	const updateRange = (
		index: number,
		field: keyof MentionRange,
		value: string | number,
	) => {
		setRanges((prev) =>
			prev.map((r, i) =>
				i === index
					? { ...r, [field]: field === "min" ? Number(value) : value }
					: r,
			),
		);
	};

	const addRange = () => {
		setRanges((prev) => [
			...prev,
			{
				key: `mention_${prev.length + 1}`,
				label: "",
				labelEn: "",
				gradeLetter: "",
				min: 0,
			},
		]);
	};

	const removeRange = (index: number) => {
		setRanges((prev) => prev.filter((_, i) => i !== index));
	};

	const hasOverlap = useMemo(() => {
		const mins = ranges.map((r) => r.min);
		return new Set(mins).size !== mins.length;
	}, [ranges]);

	const previewMention = useMemo(() => {
		const score = Number.parseFloat(previewScore);
		if (Number.isNaN(score)) return null;
		const sorted = [...ranges].sort((a, b) => b.min - a.min);
		return sorted.find((r) => score >= r.min) ?? null;
	}, [previewScore, ranges]);

	const isProgramScope = scopeId !== INSTITUTION_SCOPE;
	const isInherited = isProgramScope && !scale;

	if (isLoading) {
		return (
			<div className="flex justify-center py-8">
				<Spinner />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<p className="text-muted-foreground text-sm">
				{t("admin.gradeScale.description")}
			</p>

			{/* Scope selector */}
			<div className="max-w-xs space-y-1.5">
				<Label>{t("admin.gradeScale.scopeLabel")}</Label>
				<Select value={scopeId} onValueChange={setScopeId}>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={INSTITUTION_SCOPE}>
							{t("admin.gradeScale.institutionDefault")}
						</SelectItem>
						{(programs?.items ?? []).map((p) => (
							<SelectItem key={p.id} value={p.id}>
								{p.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{isInherited && (
				<div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-blue-700 text-sm dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300">
					<Info className="mt-0.5 h-4 w-4 shrink-0" />
					<span>{t("admin.gradeScale.inheritedFromInstitution")}</span>
				</div>
			)}

			{/* Thresholds */}
			<div className="grid max-w-sm grid-cols-2 gap-4">
				<div className="space-y-1.5">
					<Label>{t("admin.gradeScale.passThreshold")}</Label>
					<Input
						type="number"
						min={0}
						max={20}
						step={0.5}
						value={passThreshold}
						onChange={(e) => setPassThreshold(Number(e.target.value))}
					/>
				</div>
				<div className="space-y-1.5">
					<Label>{t("admin.gradeScale.compensationThreshold")}</Label>
					<Input
						type="number"
						min={0}
						max={20}
						step={0.5}
						value={compensationThreshold}
						onChange={(e) => setCompensationThreshold(Number(e.target.value))}
					/>
				</div>
			</div>

			{/* Mention ranges */}
			<div className="space-y-3">
				<div className="flex items-center justify-between">
					<h3 className="font-medium text-sm">
						{t("admin.gradeScale.mentionRanges")}
					</h3>
					<Button size="sm" variant="outline" onClick={addRange}>
						<Plus className="mr-1.5 h-3.5 w-3.5" />
						{t("common.add")}
					</Button>
				</div>

				<div className="overflow-hidden rounded-lg border">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b bg-muted/40 text-muted-foreground text-xs uppercase tracking-wide">
								<th className="px-3 py-2 text-left">
									{t("admin.gradeScale.key")}
								</th>
								<th className="px-3 py-2 text-left">
									{t("admin.gradeScale.labelFr")}
								</th>
								<th className="px-3 py-2 text-left">
									{t("admin.gradeScale.labelEn")}
								</th>
								<th className="px-3 py-2 text-left">
									{t("admin.gradeScale.letter")}
								</th>
								<th className="px-3 py-2 text-left">
									{t("admin.gradeScale.min")}
								</th>
								<th className="px-3 py-2" />
							</tr>
						</thead>
						<tbody>
							{ranges
								.slice()
								.sort((a, b) => b.min - a.min)
								.map((range) => {
									const origIdx = ranges.indexOf(range);
									const isDuplicate =
										ranges.filter((r) => r.min === range.min).length > 1;
									return (
										<tr
											key={origIdx}
											className="border-b last:border-0 hover:bg-muted/20"
										>
											<td className="px-3 py-1.5">
												<Input
													className="h-7 text-xs"
													value={range.key}
													onChange={(e) =>
														updateRange(origIdx, "key", e.target.value)
													}
												/>
											</td>
											<td className="px-3 py-1.5">
												<Input
													className="h-7 text-xs"
													value={range.label}
													onChange={(e) =>
														updateRange(origIdx, "label", e.target.value)
													}
												/>
											</td>
											<td className="px-3 py-1.5">
												<Input
													className="h-7 text-xs"
													value={range.labelEn}
													onChange={(e) =>
														updateRange(origIdx, "labelEn", e.target.value)
													}
												/>
											</td>
											<td className="w-16 px-3 py-1.5">
												<Input
													className="h-7 text-xs"
													value={range.gradeLetter}
													maxLength={2}
													onChange={(e) =>
														updateRange(origIdx, "gradeLetter", e.target.value)
													}
												/>
											</td>
											<td className="w-24 px-3 py-1.5">
												<Input
													type="number"
													className={`h-7 text-xs ${isDuplicate ? "border-destructive ring-1 ring-destructive/50" : ""}`}
													min={0}
													max={20}
													step={0.5}
													value={range.min}
													onChange={(e) =>
														updateRange(origIdx, "min", e.target.value)
													}
												/>
											</td>
											<td className="px-3 py-1.5">
												<Button
													size="icon"
													variant="ghost"
													className="h-7 w-7 text-destructive hover:text-destructive"
													onClick={() => removeRange(origIdx)}
													disabled={ranges.length <= 1}
												>
													<Trash2 className="h-3.5 w-3.5" />
												</Button>
											</td>
										</tr>
									);
								})}
						</tbody>
					</table>
				</div>

				{hasOverlap && (
					<p className="font-medium text-destructive text-xs">
						{t("admin.gradeScale.overlapError")}
					</p>
				)}

				<p className="text-[11px] text-muted-foreground">
					{t("admin.gradeScale.rangeHint")}
				</p>
			</div>

			{/* Score preview */}
			<div className="max-w-xs space-y-2">
				<Label>{t("admin.gradeScale.preview")}</Label>
				<div className="flex items-center gap-3">
					<Input
						type="number"
						min={0}
						max={20}
						step={0.5}
						placeholder={t("admin.gradeScale.previewPlaceholder")}
						value={previewScore}
						onChange={(e) => setPreviewScore(e.target.value)}
						className="w-28"
					/>
					{previewScore !== "" && (
						<span className="text-sm">
							{previewMention ? (
								<Badge variant="secondary" className="gap-1">
									<span className="font-bold">
										{previewMention.gradeLetter}
									</span>
									{previewMention.label}
								</Badge>
							) : (
								<span className="text-muted-foreground text-xs">
									{t("admin.gradeScale.previewNoMatch")}
								</span>
							)}
						</span>
					)}
				</div>
			</div>

			<Button
				onClick={() => saveMut.mutate()}
				disabled={saveMut.isPending || hasOverlap}
				className="gap-2"
			>
				{saveMut.isPending ? (
					<Spinner className="h-4 w-4" />
				) : (
					<Save className="h-4 w-4" />
				)}
				{t("common.save")}
			</Button>

			{saveMut.isSuccess && (
				<p className="text-emerald-600 text-sm">
					{t("admin.gradeScale.saved")}
				</p>
			)}
			{saveMut.isError && (
				<p className="text-destructive text-sm">
					{saveMut.error?.message ?? t("common.error")}
				</p>
			)}
		</div>
	);
}
