import { zodResolver } from "@hookform/resolvers/zod";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { z } from "zod";
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
import { useBreadcrumbs } from "@/contexts/breadcrumbs-context";
import { trpc } from "@/utils/trpc";

const BAC_SERIES = ["A4", "C", "D", "TI", "F3", "F4", "A5"] as const;

const schema = z.object({
	examType: z.enum(["BEPC", "PROBATOIRE", "BAC"]),
	series: z.string().max(10).optional(),
	sessionYear: z.number().int().min(1990).max(2100),
	centerCode: z.string().max(30).optional(),
	registrationDeadline: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

type ExamType = "BEPC" | "PROBATOIRE" | "BAC";

/** Returns true if the level string suggests this class is a typical candidate for the exam type. */
function isSuggestedLevel(
	level: string | undefined,
	examType: ExamType,
): boolean {
	const haystack = (level ?? "").toLowerCase();
	if (examType === "BEPC") {
		return (
			haystack.includes("3") ||
			haystack.includes("troisième") ||
			haystack.includes("troisieme")
		);
	}
	if (examType === "PROBATOIRE") {
		return (
			haystack.includes("première") ||
			haystack.includes("premiere") ||
			haystack.includes("1ère") ||
			haystack.includes("1ere") ||
			haystack.includes("seconde")
		);
	}
	if (examType === "BAC") {
		return haystack.includes("terminale") || haystack.includes("tle");
	}
	return false;
}

export function ExamSessionNew() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const currentYear = new Date().getFullYear();
	useBreadcrumbs([
		{
			label: t("official_exams.title", "Official exams"),
			href: "/official-exams",
		},
		{ label: t("official_exams.create_session", "New exam session") },
	]);

	const { data: years = [] } = trpc.academicYears.list.useQuery();
	const activeYear = years.find((y) => y.status === "active") ?? years[0];

	const {
		register,
		control,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: { examType: "BEPC", sessionYear: currentYear },
	});

	const examType = useWatch({ control, name: "examType" });

	// Class selection state
	const [selectedClassIds, setSelectedClassIds] = useState<Set<string>>(
		new Set(),
	);
	const [classSearch, setClassSearch] = useState("");
	const [progressMsg, setProgressMsg] = useState<string | null>(null);

	// Reset selection when exam type changes
	useEffect(() => {
		setSelectedClassIds(new Set());
	}, [examType]);

	const { data: classesData, isLoading: classesLoading } =
		trpc.classes.list.useQuery(
			{ academicYearId: activeYear?.id, pageSize: 200 },
			{ enabled: !!activeYear?.id },
		);

	const allClasses = classesData?.items ?? [];

	const filteredClasses = useMemo(() => {
		const q = classSearch.trim().toLowerCase();
		if (!q) return allClasses;
		return allClasses.filter(
			(c) =>
				c.name.toLowerCase().includes(q) ||
				(c.level ?? "").toLowerCase().includes(q),
		);
	}, [allClasses, classSearch]);

	const create = trpc.officialExams.createSession.useMutation();
	const bulkRegister = trpc.officialExams.bulkRegisterCandidates.useMutation();

	const selectedCount = selectedClassIds.size;

	function toggleClass(id: string) {
		setSelectedClassIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	}

	function toggleAll() {
		if (filteredClasses.every((c) => selectedClassIds.has(c.id))) {
			// deselect all visible
			setSelectedClassIds((prev) => {
				const next = new Set(prev);
				for (const c of filteredClasses) next.delete(c.id);
				return next;
			});
		} else {
			// select all visible
			setSelectedClassIds((prev) => {
				const next = new Set(prev);
				for (const c of filteredClasses) next.add(c.id);
				return next;
			});
		}
	}

	const onSubmit = handleSubmit(async (values) => {
		if (!activeYear?.id) return;

		// 1. Create the session
		setProgressMsg(t("official_exams.progress_creating", "Creating session…"));
		const session = await create.mutateAsync({
			academicYearId: activeYear.id,
			examType: values.examType,
			series: values.series || undefined,
			sessionYear: values.sessionYear,
			centerCode: values.centerCode || undefined,
			registrationDeadline: values.registrationDeadline
				? new Date(values.registrationDeadline).toISOString()
				: undefined,
		});

		// 2. Bulk-enroll selected classes in sequence
		const classIds = Array.from(selectedClassIds);
		for (let i = 0; i < classIds.length; i++) {
			const classId = classIds[i];
			const cls = allClasses.find((c) => c.id === classId);
			const label = cls?.name ?? classId;
			setProgressMsg(
				t(
					"official_exams.progress_enrolling",
					"Enrolling {{name}}… ({{step}}/{{total}})",
					{
						name: label,
						step: i + 1,
						total: classIds.length,
					},
				),
			);
			await bulkRegister.mutateAsync({
				examSessionId: (session as { id: string }).id,
				classId,
			});
		}

		// 3. Navigate to candidates
		navigate(`/official-exams/${(session as { id: string }).id}/candidates`);
	});

	const allVisibleSelected =
		filteredClasses.length > 0 &&
		filteredClasses.every((c) => selectedClassIds.has(c.id));
	const someVisibleSelected = filteredClasses.some((c) =>
		selectedClassIds.has(c.id),
	);

	return (
		<div className="space-y-6">
			<div>
				<h1 className="font-bold text-2xl text-foreground">
					{t("official_exams.create_session", "New exam session")}
				</h1>
				<p className="text-muted-foreground text-sm">
					{t(
						"official_exams.create_hint",
						"Configure the exam session and select which classes to enroll.",
					)}
				</p>
			</div>

			<form onSubmit={onSubmit} className="max-w-2xl space-y-6">
				{/* Section 1: Session info */}
				<div className="space-y-4 rounded-xl border border-border bg-card p-6">
					<h2 className="font-semibold text-base text-foreground">
						{t("official_exams.section_session_info", "Session information")}
					</h2>

					{/* Exam type */}
					<div className="space-y-1.5">
						<Label>{t("official_exams.exam_type", "Exam type")} *</Label>
						<Controller
							name="examType"
							control={control}
							render={({ field }) => (
								<Select value={field.value} onValueChange={field.onChange}>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="BEPC">
											BEPC — Brevet du Premier Cycle
										</SelectItem>
										<SelectItem value="PROBATOIRE">Probatoire</SelectItem>
										<SelectItem value="BAC">Baccalauréat</SelectItem>
									</SelectContent>
								</Select>
							)}
						/>
					</div>

					{/* Series — only for BAC/PROBATOIRE */}
					{(examType === "BAC" || examType === "PROBATOIRE") && (
						<div className="space-y-1.5">
							<Label>
								{t("official_exams.series", "Series / Filière")}{" "}
								<span className="text-muted-foreground text-xs">
									({t("official_exams.series_hint", "e.g. A4, C, D, TI")})
								</span>
							</Label>
							<Controller
								name="series"
								control={control}
								render={({ field }) => (
									<Select
										value={field.value ?? ""}
										onValueChange={(v) =>
											field.onChange(v === "other" ? "" : v)
										}
									>
										<SelectTrigger>
											<SelectValue
												placeholder={t(
													"official_exams.series_placeholder",
													"Select a series…",
												)}
											/>
										</SelectTrigger>
										<SelectContent>
											{BAC_SERIES.map((s) => (
												<SelectItem key={s} value={s}>
													{s}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								)}
							/>
						</div>
					)}

					{/* Session year */}
					<div className="space-y-1.5">
						<Label>{t("official_exams.session_year", "Session year")} *</Label>
						<Input
							type="number"
							min={1990}
							max={2100}
							{...register("sessionYear", { valueAsNumber: true })}
						/>
						{errors.sessionYear && (
							<p className="text-destructive text-xs">
								{errors.sessionYear.message}
							</p>
						)}
					</div>

					{/* Center code */}
					<div className="space-y-1.5">
						<Label>
							{t("official_exams.center_code", "Center code")}{" "}
							<span className="text-muted-foreground text-xs">
								({t("common.optional", "optional")})
							</span>
						</Label>
						<Input
							{...register("centerCode")}
							placeholder="Ex: LYCEE-BYA-001"
						/>
					</div>

					{/* Registration deadline */}
					<div className="space-y-1.5">
						<Label>
							{t(
								"official_exams.registration_deadline",
								"Registration deadline",
							)}{" "}
							<span className="text-muted-foreground text-xs">
								({t("common.optional", "optional")})
							</span>
						</Label>
						<Input
							type="datetime-local"
							{...register("registrationDeadline")}
						/>
					</div>
				</div>

				{/* Section 2: Class selection */}
				<div className="space-y-4">
					<div>
						<h2 className="font-semibold text-base text-foreground">
							{t("official_exams.section_classes", "Concerned classes")}
						</h2>
						<p className="mt-0.5 text-muted-foreground text-sm">
							{t(
								"official_exams.classes_hint",
								"Select which classes will be registered for this exam. Leave empty to add candidates manually later.",
							)}
						</p>
					</div>

					{/* Search */}
					<div className="relative max-w-sm">
						<Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder={t(
								"official_exams.search_classes",
								"Search classes…",
							)}
							value={classSearch}
							onChange={(e) => setClassSearch(e.target.value)}
							className="pl-9"
						/>
					</div>

					{/* Class list */}
					<div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
						{classesLoading ? (
							<div className="p-4 text-center text-muted-foreground text-sm">
								{t("common.loading", "Loading…")}
							</div>
						) : filteredClasses.length === 0 ? (
							<div className="p-4 text-center text-muted-foreground text-sm">
								{classSearch
									? t(
											"official_exams.no_classes_match",
											"No classes match your search.",
										)
									: t(
											"official_exams.no_classes",
											"No classes found for this academic year.",
										)}
							</div>
						) : (
							<>
								{/* Select-all row */}
								<label className="flex cursor-pointer select-none items-center gap-3 bg-muted/40 px-4 py-2.5 transition-colors hover:bg-muted/60">
									<input
										type="checkbox"
										checked={allVisibleSelected}
										ref={(el) => {
											if (el)
												el.indeterminate =
													!allVisibleSelected && someVisibleSelected;
										}}
										onChange={toggleAll}
										className="h-4 w-4 cursor-pointer rounded border-border accent-primary"
									/>
									<span className="font-medium text-foreground text-sm">
										{allVisibleSelected
											? t("common.deselect_all", "Deselect all")
											: t("common.select_all", "Select all")}
									</span>
									<span className="ml-auto text-muted-foreground text-xs">
										{filteredClasses.length}{" "}
										{t("official_exams.classes_count", "class(es)")}
									</span>
								</label>

								{/* Class rows */}
								{filteredClasses.map((cls) => {
									const suggested = isSuggestedLevel(
										cls.level,
										examType as ExamType,
									);
									const checked = selectedClassIds.has(cls.id);
									return (
										<label
											key={cls.id}
											className="flex cursor-pointer select-none items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30"
										>
											<input
												type="checkbox"
												checked={checked}
												onChange={() => toggleClass(cls.id)}
												className="h-4 w-4 flex-shrink-0 cursor-pointer rounded border-border accent-primary"
											/>
											<span className="flex-1 text-foreground text-sm">
												{cls.name}
											</span>
											<div className="flex flex-shrink-0 items-center gap-2">
												{cls.level && (
													<Badge
														variant="outline"
														className="font-normal text-xs"
													>
														{cls.level}
													</Badge>
												)}
												{suggested && (
													<Badge className="border-primary/20 bg-primary/10 font-normal text-primary text-xs hover:bg-primary/10">
														{t("official_exams.suggested", "Suggested")}
													</Badge>
												)}
											</div>
										</label>
									);
								})}
							</>
						)}
					</div>

					{selectedCount > 0 && (
						<p className="text-muted-foreground text-sm">
							{t(
								"official_exams.selected_classes_count",
								"{{count}} class(es) selected — all enrolled students will be registered automatically.",
								{ count: selectedCount },
							)}
						</p>
					)}
				</div>

				{/* Errors */}
				{(create.error || bulkRegister.error) && (
					<p className="text-destructive text-sm">
						{create.error?.message ?? bulkRegister.error?.message}
					</p>
				)}

				{/* Progress message */}
				{progressMsg && (
					<p className="animate-pulse text-muted-foreground text-sm">
						{progressMsg}
					</p>
				)}

				{/* Actions */}
				<div className="flex flex-wrap gap-3">
					<Button type="submit" disabled={isSubmitting || !activeYear}>
						{isSubmitting
							? (progressMsg ?? t("common.creating", "Creating…"))
							: selectedCount > 0
								? t(
										"official_exams.create_and_enroll",
										"Create and enroll ({{count}} class(es)) →",
										{ count: selectedCount },
									)
								: t(
										"official_exams.create_without_enrolling",
										"Create without enrolling →",
									)}
					</Button>
					<Button
						type="button"
						variant="outline"
						onClick={() => navigate("/official-exams")}
						disabled={isSubmitting}
					>
						{t("common.cancel", "Cancel")}
					</Button>
				</div>

				{!activeYear && (
					<p className="text-muted-foreground text-sm">
						{t(
							"official_exams.no_active_year",
							"No active academic year — set one first in Settings.",
						)}
					</p>
				)}
			</form>
		</div>
	);
}
