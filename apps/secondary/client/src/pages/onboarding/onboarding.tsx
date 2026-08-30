import {
	BookOpen,
	Building2,
	Calendar,
	CheckCircle2,
	ChevronRight,
	Download,
	Layers,
	Plus,
	Table2,
	Trash2,
	Upload,
	Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router";
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
import { trpc } from "@/utils/trpc";

// ─── Types ────────────────────────────────────────────────────────────────────

type CycleLevel = "first_cycle" | "second_cycle" | "technical";

const STEPS = [
	{ id: 1, icon: Building2, key: "institution" },
	{ id: 2, icon: Calendar, key: "academic_year" },
	{ id: 3, icon: Layers, key: "tracks" },
	{ id: 4, icon: BookOpen, key: "subjects" },
	{ id: 5, icon: Table2, key: "coefficients" },
	{ id: 6, icon: Layers, key: "classes" },
	{ id: 7, icon: Users, key: "staff" },
] as const;

// ─── CSV utilities ────────────────────────────────────────────────────────────

function downloadCsv(filename: string, header: string, rows: string[]) {
	const content = [header, ...rows].join("\n");
	const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

function parseCsv(text: string): string[][] {
	return text
		.split(/\r?\n/)
		.filter((l) => l.trim())
		.map((l) => l.split(",").map((c) => c.trim().replace(/^"|"$/g, "")));
}

// ─── Step progress indicator ──────────────────────────────────────────────────

function StepProgress({ current }: { current: number }) {
	const { t } = useTranslation();
	return (
		<div className="flex items-center gap-0">
			{STEPS.map((step, idx) => {
				const done = current > step.id;
				const active = current === step.id;
				return (
					<div key={step.id} className="flex items-center">
						<div
							className={`flex h-8 w-8 items-center justify-center rounded-full font-semibold text-xs transition-colors ${
								done
									? "bg-primary text-primary-foreground"
									: active
										? "bg-primary/20 text-primary ring-2 ring-primary"
										: "bg-muted text-muted-foreground"
							}`}
						>
							{done ? <CheckCircle2 className="h-4 w-4" /> : step.id}
						</div>
						{idx < STEPS.length - 1 && (
							<div
								className={`h-0.5 w-8 sm:w-12 ${done ? "bg-primary" : "bg-muted"}`}
							/>
						)}
					</div>
				);
			})}
		</div>
	);
}

// ─── Step 1: Institution profile ──────────────────────────────────────────────

function Step1Institution({ onNext }: { onNext: () => void }) {
	const { t } = useTranslation();
	const utils = trpc.useUtils();
	const { data: institution } = trpc.institutions.get.useQuery();
	const update = trpc.institutions.update.useMutation({
		onSuccess: () => {
			utils.institutions.get.invalidate();
			onNext();
		},
	});

	const {
		register,
		handleSubmit,
		control,
		formState: { errors },
	} = useForm({
		values: institution
			? {
					name: institution.name,
					minesecCode: institution.minesecCode ?? "",
					city: institution.city ?? "",
					type:
						(institution.type as "lycee" | "college" | "mixed") ?? undefined,
					address: institution.address ?? "",
					phone: institution.phone ?? "",
					email: institution.email ?? "",
				}
			: undefined,
	});

	const [_logoFile, setLogoFile] = useState<File | null>(null);
	const [uploading, setUploading] = useState(false);

	const handleLogoUpload = async (file: File) => {
		setLogoFile(file);
		setUploading(true);
		try {
			const fd = new FormData();
			fd.append("file", file);
			const res = await fetch("/api/upload", {
				method: "POST",
				body: fd,
				credentials: "include",
			});
			const data = await res.json();
			if (data.url) {
				update.mutate({ logoUrl: data.url });
			}
		} catch {
			// ignore upload error
		} finally {
			setUploading(false);
		}
	};

	const onSubmit = (data: any) => {
		update.mutate({
			name: data.name,
			minesecCode: data.minesecCode || undefined,
			city: data.city || undefined,
			type: data.type || undefined,
			address: data.address || undefined,
			phone: data.phone || undefined,
			email: data.email || undefined,
		});
	};

	return (
		<form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
			<div>
				<h2 className="font-semibold text-foreground text-lg">
					{t("onboarding.step1_title", "Institution profile")}
				</h2>
				<p className="text-muted-foreground text-sm">
					{t("onboarding.step1_desc", "Basic information about your school")}
				</p>
			</div>

			{/* Logo upload */}
			<div className="flex items-center gap-4">
				<div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
					{institution?.logoUrl ? (
						<img
							src={institution.logoUrl}
							alt="logo"
							className="h-full w-full object-cover"
						/>
					) : (
						<Building2 className="h-7 w-7 text-muted-foreground" />
					)}
				</div>
				<label className="cursor-pointer">
					<input
						type="file"
						accept="image/*"
						className="hidden"
						onChange={(e) => {
							const f = e.target.files?.[0];
							if (f) handleLogoUpload(f);
						}}
					/>
					<Button
						type="button"
						variant="outline"
						size="sm"
						disabled={uploading}
						asChild
					>
						<span>
							<Upload className="mr-1.5 h-3.5 w-3.5" />
							{uploading
								? t("common.loading", "Loading…")
								: t("onboarding.upload_logo", "Upload logo")}
						</span>
					</Button>
				</label>
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<FormField
					label={t("settings.school_name", "School name")}
					required
					error={errors.name?.message}
				>
					<Input
						placeholder="e.g. Lycée de Yaoundé"
						{...register("name", { required: "Required" })}
					/>
				</FormField>
				<FormField label={t("settings.minesec_code", "MINESEC code")}>
					<Input placeholder="e.g. LYA-001" {...register("minesecCode")} />
				</FormField>
				<FormField label={t("settings.city", "City / Division")}>
					<Input placeholder="e.g. Yaoundé, Mfoundi" {...register("city")} />
				</FormField>
				<FormField label={t("settings.school_type", "School type")}>
					<Controller
						name="type"
						control={control}
						render={({ field }) => (
							<Select
								value={field.value ?? ""}
								onValueChange={(v) => field.onChange(v || undefined)}
							>
								<SelectTrigger>
									<SelectValue placeholder={t("common.select", "Select…")} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="lycee">
										{t("settings.type_lycee", "Lycée")}
									</SelectItem>
									<SelectItem value="college">
										{t("settings.type_college", "Collège")}
									</SelectItem>
									<SelectItem value="mixed">
										{t("settings.type_mixed", "Mixed")}
									</SelectItem>
								</SelectContent>
							</Select>
						)}
					/>
				</FormField>
				<FormField label={t("settings.phone", "Phone")}>
					<Input
						type="tel"
						placeholder="+237 6XX XXX XXX"
						{...register("phone")}
					/>
				</FormField>
				<FormField label={t("settings.email", "Email")}>
					<Input
						type="email"
						placeholder="school@example.cm"
						{...register("email")}
					/>
				</FormField>
			</div>
			<FormField label={t("settings.address", "Address")}>
				<textarea
					rows={2}
					placeholder="Street address…"
					className="flex min-h-[60px] w-full rounded-md border border-input bg-input px-3 py-2 text-sm outline-none focus-visible:border-primary/50 focus-visible:ring-3 focus-visible:ring-primary/15"
					{...register("address")}
				/>
			</FormField>

			<div className="flex justify-end">
				<Button type="submit" disabled={update.isPending}>
					{t("common.next", "Next")}
					<ChevronRight className="ml-1.5 h-4 w-4" />
				</Button>
			</div>
		</form>
	);
}

// ─── Step 2: Academic year + terms ────────────────────────────────────────────

function Step2AcademicYear({ onNext }: { onNext: () => void }) {
	const { t } = useTranslation();
	const utils = trpc.useUtils();
	const createYear = trpc.academicYears.create.useMutation();
	const createTerm = trpc.terms.create.useMutation();
	const activateYear = trpc.academicYears.setActive.useMutation();

	const { data: years = [] } = trpc.academicYears.list.useQuery();
	const hasYear = years.length > 0;

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm({
		defaultValues: {
			yearName: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
			yearStart: "",
			yearEnd: "",
			t1Start: "",
			t1End: "",
			t2Start: "",
			t2End: "",
			t3Start: "",
			t3End: "",
		},
	});

	const onSubmit = async (data: any) => {
		if (hasYear) {
			onNext();
			return;
		}
		const year = await createYear.mutateAsync({
			name: data.yearName,
			startDate: new Date(
				data.yearStart || `${new Date().getFullYear()}-09-01`,
			),
			endDate: new Date(
				data.yearEnd || `${new Date().getFullYear() + 1}-07-31`,
			),
		});
		const terms = [
			{ termNumber: 1, startDate: data.t1Start, endDate: data.t1End },
			{ termNumber: 2, startDate: data.t2Start, endDate: data.t2End },
			{ termNumber: 3, startDate: data.t3Start, endDate: data.t3End },
		];
		for (const term of terms) {
			if (term.startDate && term.endDate) {
				await createTerm.mutateAsync({
					academicYearId: year.id,
					termNumber: term.termNumber as 1 | 2 | 3,
					startDate: new Date(term.startDate),
					endDate: new Date(term.endDate),
				});
			}
		}
		await activateYear.mutateAsync({ id: year.id });
		utils.academicYears.list.invalidate();
		onNext();
	};

	const isPending =
		createYear.isPending || createTerm.isPending || activateYear.isPending;

	if (hasYear) {
		return (
			<div className="space-y-5">
				<div>
					<h2 className="font-semibold text-foreground text-lg">
						{t("onboarding.step2_title", "Academic year")}
					</h2>
					<p className="text-muted-foreground text-sm">
						{t(
							"onboarding.year_already_exists",
							"An academic year already exists.",
						)}
					</p>
				</div>
				<div className="rounded-xl border border-border bg-muted/30 p-4">
					{years.map((y) => (
						<div key={y.id} className="flex items-center justify-between">
							<span className="font-medium text-foreground">{y.name}</span>
							{y.status === "active" && (
								<span className="rounded-full bg-green-100 px-2 py-0.5 text-green-700 text-xs dark:bg-green-900/30 dark:text-green-400">
									{t("academic_years.active", "Active")}
								</span>
							)}
						</div>
					))}
				</div>
				<div className="flex justify-end">
					<Button onClick={onNext}>
						{t("common.next", "Next")}
						<ChevronRight className="ml-1.5 h-4 w-4" />
					</Button>
				</div>
			</div>
		);
	}

	return (
		<form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
			<div>
				<h2 className="font-semibold text-foreground text-lg">
					{t("onboarding.step2_title", "Academic year")}
				</h2>
				<p className="text-muted-foreground text-sm">
					{t(
						"onboarding.step2_desc",
						"Create your first academic year and set the 3 term dates.",
					)}
				</p>
			</div>

			<FormField label={t("academic_years.year_name", "Year name")} required>
				<Input
					placeholder="2024-2025"
					{...register("yearName", { required: "Required" })}
				/>
			</FormField>

			{[1, 2, 3].map((n) => (
				<div key={n} className="space-y-2 rounded-xl border border-border p-4">
					<p className="font-medium text-foreground text-sm">
						{t(`terms.term_${n}`, `Term ${n}`)}
					</p>
					<div className="grid grid-cols-2 gap-3">
						<FormField label={t("common.start_date", "Start date")}>
							<Input type="date" {...register(`t${n}Start` as any)} />
						</FormField>
						<FormField label={t("common.end_date", "End date")}>
							<Input type="date" {...register(`t${n}End` as any)} />
						</FormField>
					</div>
				</div>
			))}

			<div className="flex justify-end">
				<Button type="submit" disabled={isPending}>
					{isPending
						? t("common.loading", "Loading…")
						: t("common.next", "Next")}
					<ChevronRight className="ml-1.5 h-4 w-4" />
				</Button>
			</div>
		</form>
	);
}

// ─── CSV import hook ──────────────────────────────────────────────────────────

function useCsvImport<T>(
	parser: (rows: string[][]) => T[],
	onImport: (items: T[]) => void,
) {
	const ref = useRef<HTMLInputElement>(null);
	const trigger = () => ref.current?.click();
	const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
		const f = e.target.files?.[0];
		if (!f) return;
		const reader = new FileReader();
		reader.onload = (ev) => {
			const text = ev.target?.result as string;
			const rows = parseCsv(text).slice(1); // skip header
			const items = parser(rows);
			onImport(items);
		};
		reader.readAsText(f);
		e.target.value = "";
	};
	const input = (
		<input
			ref={ref}
			type="file"
			accept=".csv,.txt"
			className="hidden"
			onChange={handle}
		/>
	);
	return { trigger, input };
}

// ─── Step 3: Tracks ───────────────────────────────────────────────────────────

const MINESEC_TRACKS = [
	{
		name: "Scientifique",
		code: "C",
		cycleLevel: "second_cycle" as CycleLevel,
		isOfficial: true,
	},
	{
		name: "Littéraire",
		code: "A",
		cycleLevel: "second_cycle" as CycleLevel,
		isOfficial: true,
	},
	{
		name: "Économique",
		code: "G",
		cycleLevel: "second_cycle" as CycleLevel,
		isOfficial: true,
	},
	{
		name: "Technique Industrielle",
		code: "F",
		cycleLevel: "technical" as CycleLevel,
		isOfficial: true,
	},
	{
		name: "Scientifique (1er cycle)",
		code: "SC1",
		cycleLevel: "first_cycle" as CycleLevel,
		isOfficial: false,
	},
	{
		name: "Littéraire (1er cycle)",
		code: "LT1",
		cycleLevel: "first_cycle" as CycleLevel,
		isOfficial: false,
	},
];

type TrackRow = {
	name: string;
	code: string;
	cycleLevel: CycleLevel;
	isOfficial: boolean;
};

function Step3Tracks({ onNext }: { onNext: () => void }) {
	const { t } = useTranslation();
	const { data: existingTracks } = trpc.tracks.list.useQuery({});
	const bulkCreate = trpc.tracks.bulkCreate.useMutation();
	const utils = trpc.useUtils();

	const [rows, setRows] = useState<TrackRow[]>(MINESEC_TRACKS);
	const [newRow, setNewRow] = useState<TrackRow>({
		name: "",
		code: "",
		cycleLevel: "first_cycle",
		isOfficial: false,
	});

	const existingItems =
		existingTracks && "items" in existingTracks ? existingTracks.items : [];
	const hasExisting = existingItems.length > 0;

	const { trigger: csvTrigger, input: csvInput } = useCsvImport(
		(data) =>
			data
				.map((r) => ({
					name: r[0] ?? "",
					code: r[1] ?? "",
					cycleLevel: (r[2] as CycleLevel) ?? "first_cycle",
					isOfficial: r[3] === "true",
				}))
				.filter((r) => r.name && r.code),
		(items) => setRows((prev) => [...prev, ...items]),
	);

	const handleSave = async () => {
		const toCreate = rows.filter((r) => r.name && r.code);
		if (toCreate.length > 0) {
			await bulkCreate.mutateAsync({ items: toCreate });
			utils.tracks.list.invalidate();
		}
		onNext();
	};

	if (hasExisting) {
		return (
			<div className="space-y-5">
				<div>
					<h2 className="font-semibold text-foreground text-lg">
						{t("onboarding.step3_title", "Tracks")}
					</h2>
					<p className="text-muted-foreground text-sm">
						{t("onboarding.tracks_already_exist", "Tracks already configured.")}
					</p>
				</div>
				<div className="overflow-hidden rounded-xl border border-border">
					<table className="w-full text-sm">
						<thead className="bg-muted/60 text-muted-foreground">
							<tr>
								<th className="px-4 py-2.5 text-left font-medium">
									{t("tracks.col_name", "Name")}
								</th>
								<th className="px-4 py-2.5 text-left font-medium">
									{t("tracks.col_code", "Code")}
								</th>
								<th className="px-4 py-2.5 text-left font-medium">
									{t("tracks.col_cycle", "Cycle")}
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border">
							{existingItems.map((tr) => (
								<tr key={tr.id}>
									<td className="px-4 py-2.5 font-medium">{tr.name}</td>
									<td className="px-4 py-2.5 text-muted-foreground">
										{tr.code}
									</td>
									<td className="px-4 py-2.5 text-muted-foreground">
										{tr.cycleLevel}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
				<div className="flex justify-end">
					<Button onClick={onNext}>
						{t("common.next", "Next")}
						<ChevronRight className="ml-1.5 h-4 w-4" />
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-5">
			{csvInput}
			<div>
				<h2 className="font-semibold text-foreground text-lg">
					{t("onboarding.step3_title", "Tracks")}
				</h2>
				<p className="text-muted-foreground text-sm">
					{t(
						"onboarding.step3_desc",
						"Select the official tracks for your institution, add custom ones, or import via CSV.",
					)}
				</p>
			</div>

			<div className="flex flex-wrap gap-2">
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() =>
						downloadCsv(
							"tracks-template.csv",
							"name,code,cycle_level,is_official",
							["Scientifique,C,second_cycle,true"],
						)
					}
				>
					<Download className="mr-1.5 h-3.5 w-3.5" />
					{t("onboarding.download_template", "Download template")}
				</Button>
				<Button type="button" variant="outline" size="sm" onClick={csvTrigger}>
					<Upload className="mr-1.5 h-3.5 w-3.5" />
					{t("onboarding.import_csv", "Import CSV")}
				</Button>
			</div>

			<div className="overflow-hidden rounded-xl border border-border">
				<table className="w-full text-sm">
					<thead className="bg-muted/60 text-muted-foreground">
						<tr>
							<th className="px-3 py-2.5 text-left font-medium">
								{t("tracks.col_name", "Name")}
							</th>
							<th className="px-3 py-2.5 text-left font-medium">
								{t("tracks.col_code", "Code")}
							</th>
							<th className="px-3 py-2.5 text-left font-medium">
								{t("tracks.col_cycle", "Cycle")}
							</th>
							<th className="px-3 py-2.5 text-left font-medium">
								{t("tracks.col_official", "Official")}
							</th>
							<th className="px-3 py-2.5" />
						</tr>
					</thead>
					<tbody className="divide-y divide-border">
						{rows.map((row, idx) => (
							<tr key={idx}>
								<td className="px-3 py-2">
									<Input
										value={row.name}
										onChange={(e) =>
											setRows((p) =>
												p.map((r, i) =>
													i === idx ? { ...r, name: e.target.value } : r,
												),
											)
										}
										className="h-7 text-xs"
									/>
								</td>
								<td className="px-3 py-2">
									<Input
										value={row.code}
										onChange={(e) =>
											setRows((p) =>
												p.map((r, i) =>
													i === idx ? { ...r, code: e.target.value } : r,
												),
											)
										}
										className="h-7 w-20 text-xs"
									/>
								</td>
								<td className="px-3 py-2">
									<Select
										value={row.cycleLevel}
										onValueChange={(v) =>
											setRows((p) =>
												p.map((r, i) =>
													i === idx ? { ...r, cycleLevel: v as CycleLevel } : r,
												),
											)
										}
									>
										<SelectTrigger className="h-7 text-xs">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="first_cycle">
												{t("tracks.cycle_first", "1st cycle")}
											</SelectItem>
											<SelectItem value="second_cycle">
												{t("tracks.cycle_second", "2nd cycle")}
											</SelectItem>
											<SelectItem value="technical">
												{t("tracks.cycle_technical", "Technical")}
											</SelectItem>
										</SelectContent>
									</Select>
								</td>
								<td className="px-3 py-2">
									<input
										type="checkbox"
										checked={row.isOfficial}
										onChange={(e) =>
											setRows((p) =>
												p.map((r, i) =>
													i === idx
														? { ...r, isOfficial: e.target.checked }
														: r,
												),
											)
										}
										className="h-4 w-4 accent-primary"
									/>
								</td>
								<td className="px-3 py-2 text-right">
									<button
										type="button"
										onClick={() =>
											setRows((p) => p.filter((_, i) => i !== idx))
										}
									>
										<Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
									</button>
								</td>
							</tr>
						))}
						{/* Add row */}
						<tr className="bg-muted/20">
							<td className="px-3 py-2">
								<Input
									value={newRow.name}
									onChange={(e) =>
										setNewRow((p) => ({ ...p, name: e.target.value }))
									}
									placeholder="Name"
									className="h-7 text-xs"
								/>
							</td>
							<td className="px-3 py-2">
								<Input
									value={newRow.code}
									onChange={(e) =>
										setNewRow((p) => ({ ...p, code: e.target.value }))
									}
									placeholder="Code"
									className="h-7 w-20 text-xs"
								/>
							</td>
							<td className="px-3 py-2">
								<Select
									value={newRow.cycleLevel}
									onValueChange={(v) =>
										setNewRow((p) => ({ ...p, cycleLevel: v as CycleLevel }))
									}
								>
									<SelectTrigger className="h-7 text-xs">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="first_cycle">1st cycle</SelectItem>
										<SelectItem value="second_cycle">2nd cycle</SelectItem>
										<SelectItem value="technical">Technical</SelectItem>
									</SelectContent>
								</Select>
							</td>
							<td className="px-3 py-2">
								<input
									type="checkbox"
									checked={newRow.isOfficial}
									onChange={(e) =>
										setNewRow((p) => ({ ...p, isOfficial: e.target.checked }))
									}
									className="h-4 w-4 accent-primary"
								/>
							</td>
							<td className="px-3 py-2 text-right">
								<Button
									type="button"
									size="sm"
									variant="ghost"
									className="h-6 px-2"
									onClick={() => {
										if (newRow.name && newRow.code) {
											setRows((p) => [...p, newRow]);
											setNewRow({
												name: "",
												code: "",
												cycleLevel: "first_cycle",
												isOfficial: false,
											});
										}
									}}
								>
									<Plus className="h-3.5 w-3.5" />
								</Button>
							</td>
						</tr>
					</tbody>
				</table>
			</div>

			<div className="flex justify-end">
				<Button onClick={handleSave} disabled={bulkCreate.isPending}>
					{bulkCreate.isPending
						? t("common.loading", "Loading…")
						: t("common.next", "Next")}
					<ChevronRight className="ml-1.5 h-4 w-4" />
				</Button>
			</div>
		</div>
	);
}

// ─── Step 4: Subjects ─────────────────────────────────────────────────────────

const DEFAULT_SUBJECTS = [
	{
		name: "Mathematics",
		nameFr: "Mathématiques",
		code: "MATH",
		subjectGroup: "Sciences",
	},
	{
		name: "Physics & Chemistry",
		nameFr: "Physique-Chimie",
		code: "PC",
		subjectGroup: "Sciences",
	},
	{
		name: "Life Sciences",
		nameFr: "SVT",
		code: "SVT",
		subjectGroup: "Sciences",
	},
	{ name: "French", nameFr: "Français", code: "FR", subjectGroup: "Languages" },
	{
		name: "English",
		nameFr: "Anglais",
		code: "ENG",
		subjectGroup: "Languages",
	},
	{
		name: "History & Geography",
		nameFr: "Hist-Géo",
		code: "HG",
		subjectGroup: "Humanities",
	},
	{
		name: "Philosophy",
		nameFr: "Philosophie",
		code: "PHILO",
		subjectGroup: "Humanities",
	},
	{
		name: "Economics",
		nameFr: "Économie",
		code: "ECO",
		subjectGroup: "Economics",
	},
	{
		name: "Physical Education",
		nameFr: "EPS",
		code: "EPS",
		subjectGroup: "Other",
	},
];

type SubjectRow = {
	name: string;
	nameFr: string;
	code: string;
	minesecCode: string;
	subjectGroup: string;
};

function Step4Subjects({ onNext }: { onNext: () => void }) {
	const { t } = useTranslation();
	const utils = trpc.useUtils();
	const { data: existingData } = trpc.subjects.list.useQuery({ pageSize: 200 });
	const bulkCreate = trpc.subjects.bulkCreate.useMutation();

	const hasExisting = (existingData?.items?.length ?? 0) > 0;

	const [rows, setRows] = useState<SubjectRow[]>(
		DEFAULT_SUBJECTS.map((s) => ({ ...s, minesecCode: "" })),
	);
	const [newRow, setNewRow] = useState<SubjectRow>({
		name: "",
		nameFr: "",
		code: "",
		minesecCode: "",
		subjectGroup: "",
	});

	const { trigger: csvTrigger, input: csvInput } = useCsvImport(
		(data) =>
			data
				.map((r) => ({
					name: r[0] ?? "",
					nameFr: r[1] ?? "",
					code: r[2] ?? "",
					minesecCode: r[3] ?? "",
					subjectGroup: r[4] ?? "",
				}))
				.filter((r) => r.name && r.code),
		(items) => setRows((prev) => [...prev, ...items]),
	);

	const handleSave = async () => {
		if (!hasExisting) {
			const toCreate = rows.filter((r) => r.name && r.code);
			if (toCreate.length > 0) {
				await bulkCreate.mutateAsync({ items: toCreate });
				utils.subjects.list.invalidate();
			}
		}
		onNext();
	};

	if (hasExisting) {
		return (
			<div className="space-y-5">
				<div>
					<h2 className="font-semibold text-foreground text-lg">
						{t("onboarding.step4_title", "Subjects")}
					</h2>
					<p className="text-muted-foreground text-sm">
						{t(
							"onboarding.subjects_already_exist",
							"Subjects already configured.",
						)}
					</p>
				</div>
				<p className="text-muted-foreground text-sm">
					{existingData?.total}{" "}
					{t("onboarding.subjects_count", "subjects in catalog")}
				</p>
				<div className="flex justify-end">
					<Button onClick={onNext}>
						{t("common.next", "Next")}
						<ChevronRight className="ml-1.5 h-4 w-4" />
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-5">
			{csvInput}
			<div>
				<h2 className="font-semibold text-foreground text-lg">
					{t("onboarding.step4_title", "Subjects")}
				</h2>
				<p className="text-muted-foreground text-sm">
					{t(
						"onboarding.step4_desc",
						"Add subjects to your catalog. These will be used for assignments and grade entry.",
					)}
				</p>
			</div>

			<div className="flex flex-wrap gap-2">
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() =>
						downloadCsv(
							"subjects-template.csv",
							"name,name_fr,code,minesec_code,subject_group",
							["Mathematics,Mathématiques,MATH,,Sciences"],
						)
					}
				>
					<Download className="mr-1.5 h-3.5 w-3.5" />
					{t("onboarding.download_template", "Download template")}
				</Button>
				<Button type="button" variant="outline" size="sm" onClick={csvTrigger}>
					<Upload className="mr-1.5 h-3.5 w-3.5" />
					{t("onboarding.import_csv", "Import CSV")}
				</Button>
			</div>

			<div className="overflow-x-auto rounded-xl border border-border">
				<table className="w-full text-sm">
					<thead className="bg-muted/60 text-muted-foreground">
						<tr>
							<th className="px-3 py-2.5 text-left font-medium">
								{t("subjects.col_name", "Name")}
							</th>
							<th className="px-3 py-2.5 text-left font-medium">
								{t("subjects.col_name_fr", "Name (FR)")}
							</th>
							<th className="px-3 py-2.5 text-left font-medium">
								{t("subjects.col_code", "Code")}
							</th>
							<th className="px-3 py-2.5 text-left font-medium">
								{t("subjects.col_group", "Group")}
							</th>
							<th className="px-3 py-2.5" />
						</tr>
					</thead>
					<tbody className="divide-y divide-border">
						{rows.map((row, idx) => (
							<tr key={idx}>
								<td className="px-3 py-2">
									<Input
										value={row.name}
										onChange={(e) =>
											setRows((p) =>
												p.map((r, i) =>
													i === idx ? { ...r, name: e.target.value } : r,
												),
											)
										}
										className="h-7 text-xs"
									/>
								</td>
								<td className="px-3 py-2">
									<Input
										value={row.nameFr}
										onChange={(e) =>
											setRows((p) =>
												p.map((r, i) =>
													i === idx ? { ...r, nameFr: e.target.value } : r,
												),
											)
										}
										className="h-7 text-xs"
									/>
								</td>
								<td className="px-3 py-2">
									<Input
										value={row.code}
										onChange={(e) =>
											setRows((p) =>
												p.map((r, i) =>
													i === idx ? { ...r, code: e.target.value } : r,
												),
											)
										}
										className="h-7 w-20 text-xs"
									/>
								</td>
								<td className="px-3 py-2">
									<Input
										value={row.subjectGroup}
										onChange={(e) =>
											setRows((p) =>
												p.map((r, i) =>
													i === idx
														? { ...r, subjectGroup: e.target.value }
														: r,
												),
											)
										}
										className="h-7 text-xs"
									/>
								</td>
								<td className="px-3 py-2 text-right">
									<button
										type="button"
										onClick={() =>
											setRows((p) => p.filter((_, i) => i !== idx))
										}
									>
										<Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
									</button>
								</td>
							</tr>
						))}
						<tr className="bg-muted/20">
							<td className="px-3 py-2">
								<Input
									value={newRow.name}
									onChange={(e) =>
										setNewRow((p) => ({ ...p, name: e.target.value }))
									}
									placeholder="Name"
									className="h-7 text-xs"
								/>
							</td>
							<td className="px-3 py-2">
								<Input
									value={newRow.nameFr}
									onChange={(e) =>
										setNewRow((p) => ({ ...p, nameFr: e.target.value }))
									}
									placeholder="Nom FR"
									className="h-7 text-xs"
								/>
							</td>
							<td className="px-3 py-2">
								<Input
									value={newRow.code}
									onChange={(e) =>
										setNewRow((p) => ({ ...p, code: e.target.value }))
									}
									placeholder="Code"
									className="h-7 w-20 text-xs"
								/>
							</td>
							<td className="px-3 py-2">
								<Input
									value={newRow.subjectGroup}
									onChange={(e) =>
										setNewRow((p) => ({ ...p, subjectGroup: e.target.value }))
									}
									placeholder="Group"
									className="h-7 text-xs"
								/>
							</td>
							<td className="px-3 py-2 text-right">
								<Button
									type="button"
									size="sm"
									variant="ghost"
									className="h-6 px-2"
									onClick={() => {
										if (newRow.name && newRow.code) {
											setRows((p) => [...p, newRow]);
											setNewRow({
												name: "",
												nameFr: "",
												code: "",
												minesecCode: "",
												subjectGroup: "",
											});
										}
									}}
								>
									<Plus className="h-3.5 w-3.5" />
								</Button>
							</td>
						</tr>
					</tbody>
				</table>
			</div>

			<div className="flex justify-end">
				<Button onClick={handleSave} disabled={bulkCreate.isPending}>
					{bulkCreate.isPending
						? t("common.loading", "Loading…")
						: t("common.next", "Next")}
					<ChevronRight className="ml-1.5 h-4 w-4" />
				</Button>
			</div>
		</div>
	);
}

// ─── Step 5: Coefficient matrix ───────────────────────────────────────────────

function Step5Coefficients({ onNext }: { onNext: () => void }) {
	const { t } = useTranslation();
	const { data: tracksData } = trpc.tracks.list.useQuery({ pageSize: 100 });
	const { data: subjectsData } = trpc.subjects.list.useQuery({ pageSize: 200 });
	const bulkUpsert = trpc.tracks.bulkUpsertCoefficients.useMutation();

	const tracks = tracksData && "items" in tracksData ? tracksData.items : [];
	const subjects = subjectsData?.items ?? [];

	const [selectedTrack, setSelectedTrack] = useState<string>("");
	const { data: gridData } = trpc.tracks.getCoefficientsGrid.useQuery(
		{ trackId: selectedTrack },
		{ enabled: !!selectedTrack },
	);

	// Local coefficient state: subjectId -> coefficient
	const [coeffs, setCoeffs] = useState<Record<string, number>>({});

	useEffect(() => {
		if (gridData) {
			const map: Record<string, number> = {};
			for (const row of gridData) {
				map[row.subject.id] = row.coefficient;
			}
			setCoeffs(map);
		} else {
			setCoeffs({});
		}
	}, [gridData]);

	const { trigger: csvTrigger, input: csvInput } = useCsvImport(
		(rows) => rows,
		(rows) => {
			// rows: [subject_code, coefficient, is_official_exam_subject]
			const map: Record<string, number> = {};
			for (const r of rows) {
				const subj = subjects.find((s) => s.code === r[0]);
				if (subj && r[1]) map[subj.id] = Number(r[1]) || 0;
			}
			setCoeffs((prev) => ({ ...prev, ...map }));
		},
	);

	const handleSave = async () => {
		if (selectedTrack && Object.keys(coeffs).length > 0) {
			const items = Object.entries(coeffs)
				.filter(([, v]) => v > 0)
				.map(([subjectId, coefficient]) => ({
					trackId: selectedTrack,
					subjectId,
					coefficient,
				}));
			if (items.length > 0) {
				await bulkUpsert.mutateAsync({ items });
			}
		}
		onNext();
	};

	return (
		<div className="space-y-5">
			{csvInput}
			<div>
				<h2 className="font-semibold text-foreground text-lg">
					{t("onboarding.step5_title", "Coefficient matrix")}
				</h2>
				<p className="text-muted-foreground text-sm">
					{t(
						"onboarding.step5_desc",
						"For each track, set the coefficient of each subject. You can also do this later from the Tracks page.",
					)}
				</p>
			</div>

			{tracks.length === 0 ? (
				<p className="text-muted-foreground text-sm">
					{t(
						"onboarding.no_tracks_yet",
						"No tracks yet — you can configure coefficients later.",
					)}
				</p>
			) : (
				<>
					<div className="flex flex-wrap items-center gap-3">
						<Select value={selectedTrack} onValueChange={setSelectedTrack}>
							<SelectTrigger className="w-48">
								<SelectValue
									placeholder={t("onboarding.select_track", "Select track…")}
								/>
							</SelectTrigger>
							<SelectContent>
								{tracks.map((tr) => (
									<SelectItem key={tr.id} value={tr.id}>
										{tr.name} ({tr.code})
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{selectedTrack && (
							<>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() =>
										downloadCsv(
											`coefficients-${selectedTrack}.csv`,
											"subject_code,coefficient,is_official_exam",
											subjects.map(
												(s) => `${s.code},${coeffs[s.id] ?? 0},false`,
											),
										)
									}
								>
									<Download className="mr-1.5 h-3.5 w-3.5" />
									{t("onboarding.download_template", "Download template")}
								</Button>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={csvTrigger}
								>
									<Upload className="mr-1.5 h-3.5 w-3.5" />
									{t("onboarding.import_csv", "Import CSV")}
								</Button>
							</>
						)}
					</div>

					{selectedTrack && (
						<div className="overflow-x-auto rounded-xl border border-border">
							<table className="w-full text-sm">
								<thead className="bg-muted/60 text-muted-foreground">
									<tr>
										<th className="px-4 py-2.5 text-left font-medium">
											{t("subjects.col_name", "Subject")}
										</th>
										<th className="px-4 py-2.5 text-left font-medium">
											{t("tracks.coefficient", "Coefficient")}
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-border">
									{subjects.map((s) => (
										<tr key={s.id}>
											<td className="px-4 py-2 font-medium">{s.name}</td>
											<td className="px-4 py-2">
												<Input
													type="number"
													min={0}
													max={20}
													value={coeffs[s.id] ?? 0}
													onChange={(e) =>
														setCoeffs((prev) => ({
															...prev,
															[s.id]: Number(e.target.value),
														}))
													}
													className="h-7 w-16 text-xs"
												/>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</>
			)}

			<div className="flex justify-end gap-2">
				<Button variant="outline" onClick={onNext}>
					{t("common.skip", "Skip")}
				</Button>
				<Button onClick={handleSave} disabled={bulkUpsert.isPending}>
					{bulkUpsert.isPending
						? t("common.loading", "Loading…")
						: t("common.next", "Next")}
					<ChevronRight className="ml-1.5 h-4 w-4" />
				</Button>
			</div>
		</div>
	);
}

// ─── Step 6: Classes ──────────────────────────────────────────────────────────

const LEVEL_OPTIONS = ["6ème", "5ème", "4ème", "3ème", "2nde", "1ère", "Tle"];
type ClassRow = {
	name: string;
	code: string;
	level: string;
	trackCode: string;
	room: string;
};

function Step6Classes({ onNext }: { onNext: () => void }) {
	const { t } = useTranslation();
	const utils = trpc.useUtils();
	const { data: years = [] } = trpc.academicYears.list.useQuery();
	const activeYear = years.find((y) => y.status === "active") ?? years[0];
	const { data: tracksData } = trpc.tracks.list.useQuery({ pageSize: 100 });
	const { data: existingClasses } = trpc.classes.list.useQuery(
		{ academicYearId: activeYear?.id, pageSize: 200 },
		{ enabled: !!activeYear?.id },
	);
	const bulkCreate = trpc.classes.bulkCreate.useMutation();

	const tracks = tracksData && "items" in tracksData ? tracksData.items : [];
	const hasExisting = (existingClasses?.items?.length ?? 0) > 0;

	const [rows, setRows] = useState<ClassRow[]>([]);
	const [newRow, setNewRow] = useState<ClassRow>({
		name: "",
		code: "",
		level: "6ème",
		trackCode: "",
		room: "",
	});

	const { trigger: csvTrigger, input: csvInput } = useCsvImport(
		(data) =>
			data
				.map((r) => ({
					name: r[0] ?? "",
					code: r[1] ?? "",
					level: r[2] ?? "6ème",
					trackCode: r[3] ?? "",
					room: r[4] ?? "",
				}))
				.filter((r) => r.name && r.code),
		(items) => setRows((prev) => [...prev, ...items]),
	);

	const handleSave = async () => {
		if (!activeYear) {
			onNext();
			return;
		}
		if (!hasExisting && rows.length > 0) {
			const items = rows.map((r) => ({
				name: r.name,
				code: r.code,
				level: r.level,
				academicYearId: activeYear.id,
				trackId: tracks.find((t) => t.code === r.trackCode)?.id,
				room: r.room || undefined,
			}));
			await bulkCreate.mutateAsync({ items });
			utils.classes.list.invalidate();
		}
		onNext();
	};

	if (hasExisting) {
		return (
			<div className="space-y-5">
				<div>
					<h2 className="font-semibold text-foreground text-lg">
						{t("onboarding.step6_title", "Classes")}
					</h2>
					<p className="text-muted-foreground text-sm">
						{t(
							"onboarding.classes_already_exist",
							"Classes already configured.",
						)}
					</p>
				</div>
				<p className="text-muted-foreground text-sm">
					{existingClasses?.total}{" "}
					{t("onboarding.classes_count", "classes for this year")}
				</p>
				<div className="flex justify-end">
					<Button onClick={onNext}>
						{t("common.next", "Next")}
						<ChevronRight className="ml-1.5 h-4 w-4" />
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-5">
			{csvInput}
			<div>
				<h2 className="font-semibold text-foreground text-lg">
					{t("onboarding.step6_title", "Classes")}
				</h2>
				<p className="text-muted-foreground text-sm">
					{t(
						"onboarding.step6_desc",
						"Create classes for the active academic year.",
					)}
				</p>
			</div>

			<div className="flex flex-wrap gap-2">
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() =>
						downloadCsv(
							"classes-template.csv",
							"name,code,level,track_code,room",
							["Terminale C,TLE-C,Tle,C,B01"],
						)
					}
				>
					<Download className="mr-1.5 h-3.5 w-3.5" />
					{t("onboarding.download_template", "Download template")}
				</Button>
				<Button type="button" variant="outline" size="sm" onClick={csvTrigger}>
					<Upload className="mr-1.5 h-3.5 w-3.5" />
					{t("onboarding.import_csv", "Import CSV")}
				</Button>
			</div>

			{!activeYear && (
				<div className="rounded-lg bg-amber-50 px-4 py-3 text-amber-700 text-sm dark:bg-amber-900/20 dark:text-amber-300">
					{t(
						"onboarding.no_active_year",
						"No active academic year — complete step 2 first.",
					)}
				</div>
			)}

			<div className="overflow-x-auto rounded-xl border border-border">
				<table className="w-full text-sm">
					<thead className="bg-muted/60 text-muted-foreground">
						<tr>
							<th className="px-3 py-2.5 text-left font-medium">
								{t("classes.col_name", "Name")}
							</th>
							<th className="px-3 py-2.5 text-left font-medium">
								{t("classes.col_code", "Code")}
							</th>
							<th className="px-3 py-2.5 text-left font-medium">
								{t("classes.col_level", "Level")}
							</th>
							<th className="px-3 py-2.5 text-left font-medium">
								{t("tracks.col_track", "Track")}
							</th>
							<th className="px-3 py-2.5 text-left font-medium">
								{t("classes.col_room", "Room")}
							</th>
							<th className="px-3 py-2.5" />
						</tr>
					</thead>
					<tbody className="divide-y divide-border">
						{rows.map((row, idx) => (
							<tr key={idx}>
								<td className="px-3 py-2">
									<Input
										value={row.name}
										onChange={(e) =>
											setRows((p) =>
												p.map((r, i) =>
													i === idx ? { ...r, name: e.target.value } : r,
												),
											)
										}
										className="h-7 text-xs"
									/>
								</td>
								<td className="px-3 py-2">
									<Input
										value={row.code}
										onChange={(e) =>
											setRows((p) =>
												p.map((r, i) =>
													i === idx ? { ...r, code: e.target.value } : r,
												),
											)
										}
										className="h-7 w-20 text-xs"
									/>
								</td>
								<td className="px-3 py-2">
									<Select
										value={row.level}
										onValueChange={(v) =>
											setRows((p) =>
												p.map((r, i) => (i === idx ? { ...r, level: v } : r)),
											)
										}
									>
										<SelectTrigger className="h-7 text-xs">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{LEVEL_OPTIONS.map((l) => (
												<SelectItem key={l} value={l}>
													{l}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</td>
								<td className="px-3 py-2">
									<Select
										value={row.trackCode || "_"}
										onValueChange={(v) =>
											setRows((p) =>
												p.map((r, i) =>
													i === idx
														? { ...r, trackCode: v === "_" ? "" : v }
														: r,
												),
											)
										}
									>
										<SelectTrigger className="h-7 text-xs">
											<SelectValue placeholder="—" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="_">—</SelectItem>
											{tracks.map((tr) => (
												<SelectItem key={tr.id} value={tr.code}>
													{tr.code}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</td>
								<td className="px-3 py-2">
									<Input
										value={row.room}
										onChange={(e) =>
											setRows((p) =>
												p.map((r, i) =>
													i === idx ? { ...r, room: e.target.value } : r,
												),
											)
										}
										className="h-7 w-16 text-xs"
									/>
								</td>
								<td className="px-3 py-2 text-right">
									<button
										type="button"
										onClick={() =>
											setRows((p) => p.filter((_, i) => i !== idx))
										}
									>
										<Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
									</button>
								</td>
							</tr>
						))}
						<tr className="bg-muted/20">
							<td className="px-3 py-2">
								<Input
									value={newRow.name}
									onChange={(e) =>
										setNewRow((p) => ({ ...p, name: e.target.value }))
									}
									placeholder="Name"
									className="h-7 text-xs"
								/>
							</td>
							<td className="px-3 py-2">
								<Input
									value={newRow.code}
									onChange={(e) =>
										setNewRow((p) => ({ ...p, code: e.target.value }))
									}
									placeholder="Code"
									className="h-7 w-20 text-xs"
								/>
							</td>
							<td className="px-3 py-2">
								<Select
									value={newRow.level}
									onValueChange={(v) => setNewRow((p) => ({ ...p, level: v }))}
								>
									<SelectTrigger className="h-7 text-xs">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{LEVEL_OPTIONS.map((l) => (
											<SelectItem key={l} value={l}>
												{l}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</td>
							<td className="px-3 py-2">
								<Select
									value={newRow.trackCode || "_"}
									onValueChange={(v) =>
										setNewRow((p) => ({ ...p, trackCode: v === "_" ? "" : v }))
									}
								>
									<SelectTrigger className="h-7 text-xs">
										<SelectValue placeholder="—" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="_">—</SelectItem>
										{tracks.map((tr) => (
											<SelectItem key={tr.id} value={tr.code}>
												{tr.code}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</td>
							<td className="px-3 py-2">
								<Input
									value={newRow.room}
									onChange={(e) =>
										setNewRow((p) => ({ ...p, room: e.target.value }))
									}
									placeholder="Room"
									className="h-7 w-16 text-xs"
								/>
							</td>
							<td className="px-3 py-2 text-right">
								<Button
									type="button"
									size="sm"
									variant="ghost"
									className="h-6 px-2"
									onClick={() => {
										if (newRow.name && newRow.code) {
											setRows((p) => [...p, newRow]);
											setNewRow({
												name: "",
												code: "",
												level: "6ème",
												trackCode: "",
												room: "",
											});
										}
									}}
								>
									<Plus className="h-3.5 w-3.5" />
								</Button>
							</td>
						</tr>
					</tbody>
				</table>
			</div>

			<div className="flex justify-end">
				<Button onClick={handleSave} disabled={bulkCreate.isPending}>
					{bulkCreate.isPending
						? t("common.loading", "Loading…")
						: t("common.next", "Next")}
					<ChevronRight className="ml-1.5 h-4 w-4" />
				</Button>
			</div>
		</div>
	);
}

// ─── Step 7: Staff ────────────────────────────────────────────────────────────

type StaffRole = "teacher" | "admin" | "principal" | "vice_principal" | "staff";
type StaffRow = {
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	role: StaffRole;
};

function Step7Staff({ onDone }: { onDone: () => void }) {
	const { t } = useTranslation();
	const utils = trpc.useUtils();
	const bulkCreate = trpc.staff.bulkCreate.useMutation();
	const { data: existingStaff } = trpc.staff.list.useQuery({ pageSize: 5 });

	const [rows, setRows] = useState<StaffRow[]>([]);
	const [newRow, setNewRow] = useState<StaffRow>({
		firstName: "",
		lastName: "",
		email: "",
		phone: "",
		role: "teacher" as StaffRole,
	});

	const { trigger: csvTrigger, input: csvInput } = useCsvImport(
		(data) =>
			data
				.map((r) => ({
					firstName: r[0] ?? "",
					lastName: r[1] ?? "",
					email: r[2] ?? "",
					phone: r[3] ?? "",
					role: (r[4] ?? "teacher") as StaffRole,
				}))
				.filter((r) => r.firstName && r.email),
		(items) => setRows((prev) => [...prev, ...items]),
	);

	const hasExisting = (existingStaff?.items?.length ?? 0) > 0;

	const handleSave = async () => {
		if (!hasExisting && rows.length > 0) {
			await bulkCreate.mutateAsync({ items: rows });
			utils.staff.list.invalidate();
		}
		onDone();
	};

	return (
		<div className="space-y-5">
			{csvInput}
			<div>
				<h2 className="font-semibold text-foreground text-lg">
					{t("onboarding.step7_title", "Staff / Personnel")}
				</h2>
				<p className="text-muted-foreground text-sm">
					{t(
						"onboarding.step7_desc",
						"Optionally import your teaching and administrative staff. You can skip this and add staff later.",
					)}
				</p>
			</div>

			<div className="flex flex-wrap gap-2">
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() =>
						downloadCsv(
							"staff-template.csv",
							"first_name,last_name,email,phone,role",
							["Jean,Dupont,jean@school.cm,+237600000000,teacher"],
						)
					}
				>
					<Download className="mr-1.5 h-3.5 w-3.5" />
					{t("onboarding.download_template", "Download template")}
				</Button>
				<Button type="button" variant="outline" size="sm" onClick={csvTrigger}>
					<Upload className="mr-1.5 h-3.5 w-3.5" />
					{t("onboarding.import_csv", "Import CSV")}
				</Button>
			</div>

			{rows.length > 0 && (
				<div className="overflow-x-auto rounded-xl border border-border">
					<table className="w-full text-sm">
						<thead className="bg-muted/60 text-muted-foreground">
							<tr>
								<th className="px-3 py-2.5 text-left font-medium">
									{t("staff.col_first_name", "First name")}
								</th>
								<th className="px-3 py-2.5 text-left font-medium">
									{t("staff.col_last_name", "Last name")}
								</th>
								<th className="px-3 py-2.5 text-left font-medium">
									{t("staff.col_email", "Email")}
								</th>
								<th className="px-3 py-2.5 text-left font-medium">
									{t("staff.col_role", "Role")}
								</th>
								<th className="px-3 py-2.5" />
							</tr>
						</thead>
						<tbody className="divide-y divide-border">
							{rows.map((row, idx) => (
								<tr key={idx}>
									<td className="px-3 py-2 font-medium">{row.firstName}</td>
									<td className="px-3 py-2">{row.lastName}</td>
									<td className="px-3 py-2 text-muted-foreground">
										{row.email}
									</td>
									<td className="px-3 py-2 text-muted-foreground">
										{row.role}
									</td>
									<td className="px-3 py-2 text-right">
										<button
											type="button"
											onClick={() =>
												setRows((p) => p.filter((_, i) => i !== idx))
											}
										>
											<Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{/* Manual add row */}
			<div className="grid grid-cols-2 gap-3 rounded-xl border border-border p-4 sm:grid-cols-4">
				<Input
					value={newRow.firstName}
					onChange={(e) =>
						setNewRow((p) => ({ ...p, firstName: e.target.value }))
					}
					placeholder={t("staff.col_first_name", "First name")}
					className="text-sm"
				/>
				<Input
					value={newRow.lastName}
					onChange={(e) =>
						setNewRow((p) => ({ ...p, lastName: e.target.value }))
					}
					placeholder={t("staff.col_last_name", "Last name")}
					className="text-sm"
				/>
				<Input
					value={newRow.email}
					onChange={(e) => setNewRow((p) => ({ ...p, email: e.target.value }))}
					placeholder="email@school.cm"
					className="text-sm"
				/>
				<div className="flex gap-2">
					<Select
						value={newRow.role}
						onValueChange={(v) =>
							setNewRow((p) => ({ ...p, role: v as StaffRole }))
						}
					>
						<SelectTrigger className="flex-1">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{(
								[
									"teacher",
									"admin",
									"principal",
									"vice_principal",
									"staff",
								] as StaffRole[]
							).map((r) => (
								<SelectItem key={r} value={r}>
									{t(`staff.role_${r}`, r)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Button
						type="button"
						size="icon"
						variant="outline"
						onClick={() => {
							if (newRow.firstName && newRow.email) {
								setRows((p) => [...p, newRow]);
								setNewRow({
									firstName: "",
									lastName: "",
									email: "",
									phone: "",
									role: "teacher",
								});
							}
						}}
					>
						<Plus className="h-4 w-4" />
					</Button>
				</div>
			</div>

			<div className="flex justify-end gap-2">
				<Button variant="outline" onClick={onDone}>
					{t("common.skip", "Skip")}
				</Button>
				<Button onClick={handleSave} disabled={bulkCreate.isPending}>
					{bulkCreate.isPending
						? t("common.loading", "Loading…")
						: t("onboarding.finish", "Finish setup")}
					<CheckCircle2 className="ml-1.5 h-4 w-4" />
				</Button>
			</div>
		</div>
	);
}

// ─── Main onboarding page ─────────────────────────────────────────────────────

export function OnboardingPage() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();

	const step = Math.max(
		1,
		Math.min(7, Number(searchParams.get("step") ?? "1")),
	);

	const goTo = (n: number) =>
		setSearchParams({ step: String(n) }, { replace: true });
	const next = () => {
		if (step < 7) goTo(step + 1);
	};
	const done = () => navigate("/", { replace: true });

	return (
		<div className="flex min-h-screen flex-col bg-background">
			{/* Header */}
			<div className="border-border border-b bg-card px-6 py-4">
				<div className="mx-auto flex max-w-2xl items-center justify-between">
					<div className="flex items-center gap-2">
						<Building2 className="h-5 w-5 text-primary" />
						<span className="font-semibold text-foreground">
							{t("onboarding.title", "Institution setup")}
						</span>
					</div>
					<button
						type="button"
						className="text-muted-foreground text-sm hover:text-foreground"
						onClick={done}
					>
						{t("common.skip", "Skip")}
					</button>
				</div>
			</div>

			{/* Step indicator */}
			<div className="border-border border-b bg-card px-6 py-4">
				<div className="mx-auto flex max-w-2xl flex-col items-center gap-2">
					<StepProgress current={step} />
					<p className="text-muted-foreground text-xs">
						{t("onboarding.step_of", "Step {{step}} of {{total}}", {
							step,
							total: STEPS.length,
						})}
					</p>
				</div>
			</div>

			{/* Content */}
			<div className="flex-1 px-6 py-8">
				<div className="mx-auto max-w-2xl">
					{step === 1 && <Step1Institution onNext={next} />}
					{step === 2 && <Step2AcademicYear onNext={next} />}
					{step === 3 && <Step3Tracks onNext={next} />}
					{step === 4 && <Step4Subjects onNext={next} />}
					{step === 5 && <Step5Coefficients onNext={next} />}
					{step === 6 && <Step6Classes onNext={next} />}
					{step === 7 && <Step7Staff onDone={done} />}
				</div>
			</div>
		</div>
	);
}
