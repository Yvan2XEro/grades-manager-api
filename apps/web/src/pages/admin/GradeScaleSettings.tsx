import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export default function GradeScaleSettings() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	const { data: scale, isLoading } = useQuery(
		trpc.gradeScales.get.queryOptions(),
	);

	const [passThreshold, setPassThreshold] = useState(10);
	const [compensationThreshold, setCompensationThreshold] = useState(8);
	const [ranges, setRanges] = useState<MentionRange[]>(DEFAULT_RANGES);

	useEffect(() => {
		if (scale) {
			setPassThreshold(Number(scale.passThreshold));
			setCompensationThreshold(Number(scale.compensationThreshold));
			if (scale.mentionRanges?.length) setRanges(scale.mentionRanges);
		}
	}, [scale]);

	const saveMut = useMutation({
		mutationFn: () =>
			trpcClient.gradeScales.upsert.mutate({
				passThreshold,
				compensationThreshold,
				mentionRanges: ranges,
			}),
		onSuccess: () => {
			queryClient.invalidateQueries(trpc.gradeScales.get.queryKey());
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
				{t("admin.gradeScale.description", {
					defaultValue:
						"Configure le seuil de validation et les mentions utilisés dans les délibérations, relevés de notes et exports.",
				})}
			</p>

			{/* Thresholds */}
			<div className="grid max-w-sm grid-cols-2 gap-4">
				<div className="space-y-1.5">
					<Label>
						{t("admin.gradeScale.passThreshold", {
							defaultValue: "Seuil de validation (/20)",
						})}
					</Label>
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
					<Label>
						{t("admin.gradeScale.compensationThreshold", {
							defaultValue: "Seuil de compensation (/20)",
						})}
					</Label>
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
						{t("admin.gradeScale.mentionRanges", { defaultValue: "Mentions" })}
					</h3>
					<Button size="sm" variant="outline" onClick={addRange}>
						<Plus className="mr-1.5 h-3.5 w-3.5" />
						{t("common.add", { defaultValue: "Ajouter" })}
					</Button>
				</div>

				<div className="overflow-hidden rounded-lg border">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b bg-muted/40 text-muted-foreground text-xs uppercase tracking-wide">
								<th className="px-3 py-2 text-left">Clé</th>
								<th className="px-3 py-2 text-left">Label (FR)</th>
								<th className="px-3 py-2 text-left">Label (EN)</th>
								<th className="px-3 py-2 text-left">Lettre</th>
								<th className="px-3 py-2 text-left">Min (/20)</th>
								<th className="px-3 py-2" />
							</tr>
						</thead>
						<tbody>
							{ranges
								.slice()
								.sort((a, b) => b.min - a.min)
								.map((range, i) => {
									const origIdx = ranges.indexOf(range);
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
											<td className="w-20 px-3 py-1.5">
												<Input
													type="number"
													className="h-7 text-xs"
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
				<p className="text-[11px] text-muted-foreground">
					{t("admin.gradeScale.rangeHint", {
						defaultValue:
							"Chaque mention est attribuée si la moyenne est ≥ au seuil minimum correspondant (ordre décroissant).",
					})}
				</p>
			</div>

			<Button
				onClick={() => saveMut.mutate()}
				disabled={saveMut.isPending}
				className="gap-2"
			>
				{saveMut.isPending ? (
					<Spinner className="h-4 w-4" />
				) : (
					<Save className="h-4 w-4" />
				)}
				{t("common.save", { defaultValue: "Enregistrer" })}
			</Button>

			{saveMut.isSuccess && (
				<p className="text-emerald-600 text-sm">
					{t("admin.gradeScale.saved", { defaultValue: "Barème enregistré." })}
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
