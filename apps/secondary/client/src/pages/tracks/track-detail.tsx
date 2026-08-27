import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useParams } from "react-router";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";

// ─── Schema ──────────────────────────────────────────────────────────────────

const formSchema = z.object({
	// valueAsNumber in register returns NaN for empty inputs; .catch(0) converts that to 0
	coefficients: z.record(
		z.string(),
		z.number().catch(0).pipe(z.number().int().min(0).max(20)),
	),
});

type FormValues = z.infer<typeof formSchema>;

// ─── Types ────────────────────────────────────────────────────────────────────

interface TrackLocationState {
	name?: string;
	code?: string;
	cycleLevel?: string;
}

const CYCLE_VARIANTS: Record<
	string,
	"default" | "secondary" | "info" | "success"
> = {
	first_cycle: "info",
	second_cycle: "success",
	technical: "secondary",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function TrackDetail() {
	const { t } = useTranslation();
	const { id } = useParams<{ id: string }>();
	const location = useLocation();
	const trackState = (location.state as TrackLocationState | null) ?? {};

	const [saved, setSaved] = useState(false);

	// ── Queries ──────────────────────────────────────────────────────────────

	const { data: subjectsData, isLoading: isLoadingSubjects } =
		trpc.subjects.list.useQuery({ page: 1, pageSize: 100 });

	const { data: grid, isLoading: isLoadingGrid } =
		trpc.tracks.getCoefficientsGrid.useQuery(
			{ trackId: id! },
			{ enabled: !!id },
		);

	const upsertCoefficient = trpc.tracks.upsertCoefficient.useMutation();

	// ── Form ─────────────────────────────────────────────────────────────────

	const {
		register,
		handleSubmit,
		reset,
		formState: { isSubmitting },
	} = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: { coefficients: {} },
	});

	// Populate form once both subjects and grid data are available
	useEffect(() => {
		if (!subjectsData || grid === undefined) return;

		const coefficients: Record<string, number> = {};
		for (const s of subjectsData.items) {
			coefficients[s.id] = 0;
		}
		for (const row of grid) {
			coefficients[row.subject.id] = row.coefficient;
		}
		reset({ coefficients });
	}, [subjectsData, grid, reset]);

	// ── Submit ───────────────────────────────────────────────────────────────

	const existingSubjectIds = new Set((grid ?? []).map((r) => r.subject.id));

	const onSubmit: SubmitHandler<FormValues> = async (values) => {
		const subjects = subjectsData?.items ?? [];

		// Save subjects that have a coefficient > 0, or already exist in the grid
		const toSave = subjects.filter((s) => {
			const coeff = values.coefficients[s.id] ?? 0;
			return coeff > 0 || existingSubjectIds.has(s.id);
		});

		await Promise.all(
			toSave.map((s) =>
				upsertCoefficient.mutateAsync({
					trackId: id!,
					subjectId: s.id,
					coefficient: values.coefficients[s.id] ?? 0,
					isOfficialExamSubject: false,
				}),
			),
		);

		setSaved(true);
		setTimeout(() => setSaved(false), 3000);
	};

	// ── Render ───────────────────────────────────────────────────────────────

	const subjects = subjectsData?.items ?? [];
	const isLoading = isLoadingSubjects || isLoadingGrid;
	const trackName = trackState.name ?? t("tracks.detail.unnamed", "Track");
	const trackCode = trackState.code;
	const cycleLevel = trackState.cycleLevel;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-3">
				<Link to="/tracks">
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label={t("common.back", "Back")}
					>
						<ArrowLeft />
					</Button>
				</Link>
				<div className="flex-1">
					<div className="flex items-center gap-2">
						<h1 className="font-bold text-2xl text-foreground">{trackName}</h1>
						{cycleLevel && (
							<Badge variant={CYCLE_VARIANTS[cycleLevel] ?? "secondary"}>
								{cycleLevel.replace(/_/g, " ")}
							</Badge>
						)}
					</div>
					{trackCode && (
						<p className="text-muted-foreground text-sm">
							{t("tracks.detail.code_label", "Code")}: {trackCode}
						</p>
					)}
				</div>
			</div>

			{/* Coefficient matrix */}
			{isLoading ? (
				<div className="space-y-2">
					<Skeleton className="h-10 w-full" />
					{Array.from({ length: 8 }, (_, i) => (
						<Skeleton key={i} className="h-12 w-full" />
					))}
				</div>
			) : subjects.length === 0 ? (
				<div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
					<p className="text-sm">
						{t(
							"tracks.detail.no_subjects",
							"No subjects found. Add subjects first.",
						)}
					</p>
				</div>
			) : (
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					<div className="overflow-hidden rounded-xl border border-border">
						<table className="w-full">
							<thead>
								<tr className="border-border border-b bg-muted/50">
									<th className="px-4 py-3 text-left font-medium text-muted-foreground text-sm">
										{t("tracks.detail.col_subject", "Subject")}
									</th>
									<th className="px-4 py-3 text-left font-medium text-muted-foreground text-sm">
										{t("tracks.detail.col_group", "Group")}
									</th>
									<th className="w-36 px-4 py-3 text-left font-medium text-muted-foreground text-sm">
										{t("tracks.detail.col_coefficient", "Coefficient")}
									</th>
								</tr>
							</thead>
							<tbody>
								{subjects.map((subject, i) => (
									<tr
										key={subject.id}
										className={`border-border border-b last:border-0 ${i % 2 === 1 ? "bg-muted/20" : ""}`}
									>
										<td className="px-4 py-3 text-foreground text-sm">
											{subject.nameFr || subject.name}
										</td>
										<td className="px-4 py-3 text-muted-foreground text-sm capitalize">
											{subject.subjectGroup?.replace(/_/g, " ") ?? "—"}
										</td>
										<td className="px-4 py-3">
											<Input
												type="number"
												min={0}
												max={20}
												className="h-8 w-20 text-center"
												{...register(`coefficients.${subject.id}`, {
													valueAsNumber: true,
												})}
											/>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					<div className="flex items-center gap-3">
						<Button type="submit" disabled={isSubmitting}>
							<Save />
							{isSubmitting
								? t("common.saving", "Saving…")
								: t("tracks.detail.save", "Save Coefficients")}
						</Button>
						{saved && (
							<span className="font-medium text-green-600 text-sm">
								{t("tracks.detail.saved_ok", "Coefficients saved.")}
							</span>
						)}
					</div>
				</form>
			)}
		</div>
	);
}
