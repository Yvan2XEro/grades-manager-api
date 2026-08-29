import { zodResolver } from "@hookform/resolvers/zod";
import { Edit2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useBreadcrumbs } from "@/contexts/breadcrumbs-context";
import { trpc } from "@/utils/trpc";

const BAC_SERIES = ["A4", "C", "D", "TI", "F3", "F4", "A5"] as const;

const EXAM_TYPE_VARIANTS = {
	BEPC: "info",
	PROBATOIRE: "warning",
	BAC: "success",
} as const;

const EXAM_TYPE_LABELS: Record<string, string> = {
	BEPC: "BEPC",
	PROBATOIRE: "Probatoire",
	BAC: "Baccalauréat",
};

const editSchema = z.object({
	series: z.string().max(10).optional(),
	centerCode: z.string().max(30).optional(),
	sessionYear: z.number().int().min(1900).max(2100).optional(),
	registrationDeadline: z.string().optional(),
});
type EditValues = z.infer<typeof editSchema>;

type SessionShape = {
	id: string;
	examType: string;
	series?: string | null;
	sessionYear: number;
	centerCode?: string | null;
	registrationDeadline?: Date | string | null;
};

export function ExamSettingsTab() {
	const { t } = useTranslation();
	const { id } = useParams<{ id: string }>();
	const [editing, setEditing] = useState(false);
	const [saved, setSaved] = useState(false);

	const utils = trpc.useUtils();
	const { data: session } = trpc.officialExams.getSession.useQuery(
		{ id: id! },
		{ enabled: !!id },
	);

	const typed = session as SessionShape | undefined;
	useBreadcrumbs([
		{
			label: t("official_exams.title", "Official exams"),
			href: "/official-exams",
		},
		{
			label: typed ? `${typed.examType} ${typed.sessionYear}` : "…",
			href: `/official-exams/${id}`,
		},
		{ label: t("official_exams.tab_settings", "Settings") },
	]);

	const update = trpc.officialExams.updateSession.useMutation({
		onSuccess: () => {
			utils.officialExams.getSession.invalidate({ id: id! });
			setEditing(false);
			setSaved(true);
			setTimeout(() => setSaved(false), 2500);
		},
	});

	const {
		register,
		handleSubmit,
		reset,
		control,
		formState: { errors },
	} = useForm<EditValues>({ resolver: zodResolver(editSchema) });

	useEffect(() => {
		if (typed) {
			const dl = typed.registrationDeadline
				? new Date(typed.registrationDeadline as string)
						.toISOString()
						.slice(0, 16)
				: "";
			reset({
				series: typed.series ?? "",
				centerCode: typed.centerCode ?? "",
				sessionYear: typed.sessionYear,
				registrationDeadline: dl,
			});
		}
	}, [typed, reset]);

	if (!session) return null;
	const s = session as SessionShape;

	const formatDate = (d: Date | string | null | undefined) =>
		d
			? new Date(d as string).toLocaleDateString("fr-CM", {
					day: "2-digit",
					month: "long",
					year: "numeric",
				})
			: "—";

	const typeVariant =
		EXAM_TYPE_VARIANTS[s.examType as keyof typeof EXAM_TYPE_VARIANTS] ??
		"secondary";

	const onSubmit = (values: EditValues) => {
		update.mutate({
			id: id!,
			series: values.series || null,
			centerCode: values.centerCode || null,
			sessionYear: values.sessionYear,
			registrationDeadline: values.registrationDeadline
				? new Date(values.registrationDeadline).toISOString()
				: null,
		});
	};

	return (
		<div className="max-w-lg space-y-6">
			<div className="rounded-xl border border-border bg-card p-6">
				<div className="mb-4 flex items-center justify-between">
					<h2 className="font-semibold text-foreground">
						{t("official_exams.session_details", "Session details")}
					</h2>
					{!editing && (
						<Button
							variant="outline"
							size="sm"
							onClick={() => setEditing(true)}
						>
							<Edit2 className="mr-1 h-3.5 w-3.5" />
							{t("common.edit", "Edit")}
						</Button>
					)}
					{saved && (
						<span className="font-medium text-green-600 text-sm">
							{t("common.saved", "Saved.")}
						</span>
					)}
				</div>

				{editing ? (
					<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
						{/* Exam type — read-only (can't change after creation) */}
						<div className="flex items-center gap-3">
							<span className="w-44 text-muted-foreground text-sm">
								{t("official_exams.exam_type", "Exam type")}
							</span>
							<Badge variant={typeVariant}>
								{EXAM_TYPE_LABELS[s.examType] ?? s.examType}
							</Badge>
							<span className="text-muted-foreground text-xs">
								{t("official_exams.cannot_change", "(cannot be changed)")}
							</span>
						</div>

						{(s.examType === "BAC" || s.examType === "PROBATOIRE") && (
							<div className="space-y-1.5">
								<label className="font-medium text-foreground text-sm">
									{t("official_exams.series", "Series / Filière")}
								</label>
								<Controller
									name="series"
									control={control}
									render={({ field }) => (
										<Select
											value={field.value ?? ""}
											onValueChange={field.onChange}
										>
											<SelectTrigger>
												<SelectValue placeholder="—" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="">
													{t("common.none", "—")}
												</SelectItem>
												{BAC_SERIES.map((ser) => (
													<SelectItem key={ser} value={ser}>
														{ser}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									)}
								/>
							</div>
						)}

						<FormField
							label={t("official_exams.session_year", "Session year")}
							error={errors.sessionYear?.message}
						>
							<Input
								type="number"
								min={1900}
								max={2100}
								{...register("sessionYear", { valueAsNumber: true })}
							/>
						</FormField>

						<FormField
							label={t("official_exams.center_code", "Center code")}
							error={errors.centerCode?.message}
						>
							<Input
								placeholder="Ex: LYCEE-BYA-001"
								{...register("centerCode")}
							/>
						</FormField>

						<FormField
							label={t(
								"official_exams.registration_deadline",
								"Registration deadline",
							)}
							error={errors.registrationDeadline?.message}
						>
							<Input
								type="datetime-local"
								{...register("registrationDeadline")}
							/>
						</FormField>

						<div className="flex gap-2 pt-1">
							<Button type="submit" disabled={update.isPending}>
								<Save className="mr-1 h-4 w-4" />
								{update.isPending
									? t("common.saving", "Saving…")
									: t("common.save", "Save")}
							</Button>
							<Button
								type="button"
								variant="outline"
								onClick={() => setEditing(false)}
							>
								{t("common.cancel", "Cancel")}
							</Button>
						</div>
						{update.error && (
							<p className="text-destructive text-sm">{update.error.message}</p>
						)}
					</form>
				) : (
					<dl className="space-y-3">
						<div className="flex items-center gap-3">
							<dt className="w-44 text-muted-foreground text-sm">
								{t("official_exams.exam_type", "Exam type")}
							</dt>
							<dd>
								<Badge variant={typeVariant}>
									{EXAM_TYPE_LABELS[s.examType] ?? s.examType}
								</Badge>
							</dd>
						</div>
						{(s.examType === "BAC" || s.examType === "PROBATOIRE") && (
							<div className="flex items-center gap-3">
								<dt className="w-44 text-muted-foreground text-sm">
									{t("official_exams.series", "Series")}
								</dt>
								<dd className="text-foreground">
									{s.series ? (
										<Badge variant="secondary">{s.series}</Badge>
									) : (
										<span className="text-muted-foreground">—</span>
									)}
								</dd>
							</div>
						)}
						<div className="flex items-center gap-3">
							<dt className="w-44 text-muted-foreground text-sm">
								{t("official_exams.session_year", "Session year")}
							</dt>
							<dd className="font-medium text-foreground">{s.sessionYear}</dd>
						</div>
						<div className="flex items-center gap-3">
							<dt className="w-44 text-muted-foreground text-sm">
								{t("official_exams.center_code", "Center code")}
							</dt>
							<dd className="text-foreground">{s.centerCode ?? "—"}</dd>
						</div>
						<div className="flex items-center gap-3">
							<dt className="w-44 text-muted-foreground text-sm">
								{t("official_exams.registration_deadline", "Deadline")}
							</dt>
							<dd className="text-foreground">
								{formatDate(s.registrationDeadline)}
							</dd>
						</div>
					</dl>
				)}
			</div>
		</div>
	);
}
