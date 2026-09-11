import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams } from "react-router";
import { z } from "zod";
import { Confirm } from "@/components/callable/confirm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useBreadcrumbs } from "@/contexts/breadcrumbs-context";
import { errorToast } from "@/lib/error-toast";
import { trpc } from "@/utils/trpc";
import { TrackFormDialog } from "./track-form-dialog";

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

	const navigate = useNavigate();
	const [saved, setSaved] = useState(false);
	const [showEdit, setShowEdit] = useState(false);

	// ── Queries ──────────────────────────────────────────────────────────────

	const { data: track } = trpc.tracks.get.useQuery(
		{ id: id! },
		{ enabled: !!id },
	);
	useBreadcrumbs([
		{ label: t("nav.tracks", "Tracks"), href: "/tracks" },
		{ label: track?.name ?? trackState.name ?? "…" },
	]);

	const { data: subjectsData, isLoading: isLoadingSubjects } =
		trpc.subjects.list.useQuery({ page: 1, pageSize: 100 });

	const { data: grid, isLoading: isLoadingGrid } =
		trpc.tracks.getCoefficientsGrid.useQuery(
			{ trackId: id! },
			{ enabled: !!id },
		);

	const upsertCoefficient = trpc.tracks.upsertCoefficient.useMutation({
		onError: (err) => errorToast(err, t),
	});

	const utils = trpc.useUtils();
	const deleteTrack = trpc.tracks.delete.useMutation({
		onSuccess: () => {
			utils.tracks.list.invalidate();
			navigate("/tracks");
		},
		onError: (err) => errorToast(err, t),
	});

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
	const trackName =
		track?.name ?? trackState.name ?? t("tracks.detail.unnamed", "Track");
	const trackCode = trackState.code;
	const cycleLevel = trackState.cycleLevel;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div className="flex-1">
					<div className="flex items-center gap-2">
						<h1 className="font-bold text-2xl text-foreground">{trackName}</h1>
						{cycleLevel &&
							(() => {
								const CYCLE_LABELS: Record<string, string> = {
									first_cycle: t("tracks.cycle_first", "1st cycle"),
									second_cycle: t("tracks.cycle_second", "2nd cycle"),
									technical: t("tracks.cycle_technical", "Technical"),
								};
								return (
									<Badge variant={CYCLE_VARIANTS[cycleLevel] ?? "secondary"}>
										{CYCLE_LABELS[cycleLevel] ?? cycleLevel.replace(/_/g, " ")}
									</Badge>
								);
							})()}
					</div>
					{trackCode && (
						<p className="text-muted-foreground text-sm">
							{t("tracks.detail.code_label", "Code")}: {trackCode}
						</p>
					)}
				</div>
				<div className="flex gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setShowEdit(true)}
						disabled={!track}
					>
						<Pencil className="mr-1.5 h-3.5 w-3.5" />
						{t("tracks.edit", "Edit")}
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={async () => {
							const ok = await Confirm.call({
								title: t("tracks.delete", "Delete track"),
								description: t(
									"tracks.delete_confirm",
									"This will permanently delete this track and all its subject coefficients. This action cannot be undone.",
								),
								confirmLabel: t("common.delete", "Delete"),
								destructive: true,
							});
							if (ok) deleteTrack.mutate({ id: id! });
						}}
						disabled={!track || deleteTrack.isPending}
						className="text-destructive hover:bg-destructive/10"
					>
						<Trash2 className="mr-1.5 h-3.5 w-3.5" />
						{t("tracks.delete", "Delete")}
					</Button>
				</div>
			</div>

			{track && (
				<TrackFormDialog
					open={showEdit}
					onOpenChange={setShowEdit}
					onSuccess={() => {}}
					editTrack={{
						id: track.id,
						name: track.name,
						code: track.code,
						cycleLevel: track.cycleLevel as
							| "first_cycle"
							| "second_cycle"
							| "technical",
						isOfficial: track.isOfficial ?? false,
					}}
				/>
			)}

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
							<thead className="border-border border-b bg-muted/60 text-muted-foreground">
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
