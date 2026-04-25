import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckSquare2, Loader2, Square, Users, Zap } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { AcademicYearSelect } from "../../../components/inputs/AcademicYearSelect";
import { SemesterSelect } from "../../../components/inputs/SemesterSelect";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Checkbox } from "../../../components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Progress } from "../../../components/ui/progress";
import { ScrollArea } from "../../../components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../../components/ui/select";
import { Switch } from "../../../components/ui/switch";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "../../../components/ui/tabs";
import { trpcClient } from "../../../utils/trpc";

const TYPES = ["semester", "annual", "retake"] as const;

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

interface SharedFields {
	academicYearId: string | null;
	type: string;
	semesterId: string | null;
	deliberationDate: string;
	juryNumber: string;
	quickStart: boolean;
}

export default function CreateDeliberationDialog({
	open,
	onOpenChange,
}: Props) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [tab, setTab] = useState<"single" | "multi">("single");

	const [fields, setFields] = useState<SharedFields>({
		academicYearId: null,
		type: "",
		semesterId: null,
		deliberationDate: "",
		juryNumber: "",
		quickStart: false,
	});
	const [singleClassId, setSingleClassId] = useState<string | null>(null);
	const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
	const [batchProgress, setBatchProgress] = useState<{
		done: number;
		total: number;
		errors: string[];
	} | null>(null);

	function patch(p: Partial<SharedFields>) {
		setFields((prev) => ({ ...prev, ...p }));
	}

	function handleClose() {
		setFields({
			academicYearId: null,
			type: "",
			semesterId: null,
			deliberationDate: "",
			juryNumber: "",
			quickStart: false,
		});
		setSingleClassId(null);
		setSelectedClassIds([]);
		setBatchProgress(null);
		setTab("single");
		onOpenChange(false);
	}

	function buildInput(classId: string) {
		return {
			classId,
			academicYearId: fields.academicYearId!,
			type: fields.type as (typeof TYPES)[number],
			semesterId: fields.semesterId || undefined,
			deliberationDate: fields.deliberationDate
				? new Date(fields.deliberationDate).toISOString()
				: undefined,
			juryNumber: fields.juryNumber || undefined,
		};
	}

	// ── Single class mutations ────────────────────────────────────────────────
	const createMutation = useMutation({
		mutationFn: () =>
			trpcClient.deliberations.create.mutate(buildInput(singleClassId!)),
		onSuccess: () => {
			toast.success(t("admin.deliberations.toast.createSuccess"));
			queryClient.invalidateQueries({ queryKey: ["deliberations"] });
			handleClose();
		},
		onError: (err) => toast.error((err as Error).message),
	});

	const initAndComputeMutation = useMutation({
		mutationFn: () =>
			trpcClient.deliberations.initAndCompute.mutate(
				buildInput(singleClassId!),
			),
		onSuccess: () => {
			toast.success(
				t("admin.deliberations.toast.initAndComputeSuccess", {
					defaultValue: "Délibération créée et résultats calculés",
				}),
			);
			queryClient.invalidateQueries({ queryKey: ["deliberations"] });
			handleClose();
		},
		onError: (err) => toast.error((err as Error).message),
	});

	// ── Multi-class ──────────────────────────────────────────────────────────
	const classesQuery = useQuery({
		queryKey: ["class-select", fields.academicYearId ?? "all"],
		enabled: !!fields.academicYearId,
		queryFn: async () => {
			const { items } = await trpcClient.classes.list.query({
				academicYearId: fields.academicYearId!,
				limit: 200,
			});
			return items;
		},
	});
	const allClasses = classesQuery.data ?? [];

	function toggleClass(id: string) {
		setSelectedClassIds((prev) =>
			prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
		);
	}

	function toggleAll() {
		setSelectedClassIds(
			selectedClassIds.length === allClasses.length
				? []
				: allClasses.map((c) => c.id),
		);
	}

	async function handleBatchCreate() {
		if (!selectedClassIds.length || !fields.academicYearId || !fields.type)
			return;
		const errors: string[] = [];
		setBatchProgress({ done: 0, total: selectedClassIds.length, errors: [] });

		const fn = fields.quickStart
			? trpcClient.deliberations.initAndCompute.mutate
			: trpcClient.deliberations.create.mutate;

		for (let i = 0; i < selectedClassIds.length; i++) {
			try {
				await fn(buildInput(selectedClassIds[i]));
			} catch {
				const name =
					allClasses.find((c) => c.id === selectedClassIds[i])?.name ??
					selectedClassIds[i];
				errors.push(name);
			}
			setBatchProgress({
				done: i + 1,
				total: selectedClassIds.length,
				errors: [...errors],
			});
		}

		queryClient.invalidateQueries({ queryKey: ["deliberations"] });

		if (errors.length === 0) {
			toast.success(
				t("admin.deliberations.toast.batchCreateSuccess", {
					defaultValue: `${selectedClassIds.length} délibération(s) créée(s)`,
				}),
			);
			handleClose();
		} else {
			toast.error(
				t("admin.deliberations.toast.batchCreatePartial", {
					defaultValue: `${selectedClassIds.length - errors.length} créée(s), ${errors.length} erreur(s)`,
				}),
			);
		}
	}

	const singleCanSubmit =
		!!singleClassId && !!fields.academicYearId && !!fields.type;
	const multiCanSubmit =
		!!selectedClassIds.length && !!fields.academicYearId && !!fields.type;
	const singlePending =
		createMutation.isPending || initAndComputeMutation.isPending;
	const batchRunning =
		!!batchProgress && batchProgress.done < batchProgress.total;

	return (
		<Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
			<DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{t("admin.deliberations.form.createTitle")}</DialogTitle>
					<DialogDescription>
						{t("admin.deliberations.form.createDescription", {
							defaultValue:
								"Configurez et lancez une nouvelle session de délibération",
						})}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 px-6 pb-4">
					{/* ── Tabs ── */}
					<Tabs
						value={tab}
						onValueChange={(v) => setTab(v as "single" | "multi")}
					>
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger value="single">
								{t("admin.deliberations.form.tabSingle", {
									defaultValue: "Classe unique",
								})}
							</TabsTrigger>
							<TabsTrigger value="multi" className="gap-1.5">
								<Users className="h-3.5 w-3.5" />
								{t("admin.deliberations.form.tabMulti", {
									defaultValue: "Multi-classes",
								})}
							</TabsTrigger>
						</TabsList>
					</Tabs>

					{/* ── Shared: année + type ── */}
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>{t("admin.deliberations.form.academicYear")}</Label>
							<AcademicYearSelect
								value={fields.academicYearId}
								onChange={(v) => {
									patch({ academicYearId: v });
									setSingleClassId(null);
									setSelectedClassIds([]);
								}}
								autoSelectActive
							/>
						</div>
						<div className="space-y-2">
							<Label>{t("admin.deliberations.form.type")}</Label>
							<Select
								value={fields.type}
								onValueChange={(v) => patch({ type: v, semesterId: null })}
							>
								<SelectTrigger>
									<SelectValue
										placeholder={t("admin.deliberations.form.typePlaceholder")}
									/>
								</SelectTrigger>
								<SelectContent>
									{TYPES.map((ty) => (
										<SelectItem key={ty} value={ty}>
											{t(`admin.deliberations.type.${ty}`)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* ── Shared: semestre + date + jury number ── */}
					<div className="grid grid-cols-2 gap-4">
						{fields.type === "semester" && (
							<div className="space-y-2">
								<Label>{t("admin.deliberations.form.semester")}</Label>
								<SemesterSelect
									value={fields.semesterId}
									onChange={(v) => patch({ semesterId: v })}
									placeholder={t(
										"admin.deliberations.form.semesterPlaceholder",
									)}
								/>
							</div>
						)}
						<div className="space-y-2">
							<Label>{t("admin.deliberations.form.deliberationDate")}</Label>
							<Input
								type="date"
								value={fields.deliberationDate}
								onChange={(e) => patch({ deliberationDate: e.target.value })}
							/>
						</div>
						<div className="space-y-2">
							<Label>
								{t("admin.deliberations.form.juryNumber", {
									defaultValue: "Numéro de jury",
								})}
							</Label>
							<Input
								value={fields.juryNumber}
								onChange={(e) => patch({ juryNumber: e.target.value })}
								placeholder={t(
									"admin.deliberations.form.juryNumberPlaceholder",
									{
										defaultValue: "ex: J2024-001",
									},
								)}
							/>
						</div>
					</div>

					{/* ── Tab content ── */}
					{tab === "single" ? (
						<div className="space-y-2">
							<Label>{t("admin.deliberations.form.class")}</Label>
							<Select
								value={singleClassId ?? ""}
								onValueChange={(v) => setSingleClassId(v || null)}
								disabled={!fields.academicYearId || classesQuery.isLoading}
							>
								<SelectTrigger>
									{classesQuery.isLoading ? (
										<span className="flex items-center gap-2 text-muted-foreground">
											<Loader2 className="h-3.5 w-3.5 animate-spin" />
											Chargement…
										</span>
									) : (
										<SelectValue
											placeholder={t(
												"admin.deliberations.form.classPlaceholder",
											)}
										/>
									)}
								</SelectTrigger>
								<SelectContent>
									{allClasses.map((cls) => (
										<SelectItem key={cls.id} value={cls.id}>
											{cls.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					) : (
						<div className="space-y-2">
							<Label>
								{t("admin.deliberations.form.classes", {
									defaultValue: "Classes",
								})}
							</Label>
							{!fields.academicYearId ? (
								<p className="rounded-lg border border-dashed py-5 text-center text-muted-foreground text-sm">
									{t("admin.deliberations.form.selectYearFirst", {
										defaultValue: "Sélectionnez d'abord une année académique",
									})}
								</p>
							) : classesQuery.isLoading ? (
								<div className="flex items-center justify-center py-5">
									<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
								</div>
							) : allClasses.length === 0 ? (
								<p className="rounded-lg border border-dashed py-5 text-center text-muted-foreground text-sm">
									{t("admin.deliberations.form.noClasses", {
										defaultValue: "Aucune classe pour cette année",
									})}
								</p>
							) : (
								<>
									<div className="flex items-center justify-between pb-1">
										<button
											type="button"
											onClick={toggleAll}
											className="flex items-center gap-1.5 text-primary text-sm hover:underline"
										>
											{selectedClassIds.length === allClasses.length ? (
												<CheckSquare2 className="h-4 w-4" />
											) : (
												<Square className="h-4 w-4" />
											)}
											{selectedClassIds.length === allClasses.length
												? t("common.actions.deselectAll", {
														defaultValue: "Tout désélectionner",
													})
												: t("common.actions.selectAll", {
														defaultValue: "Tout sélectionner",
													})}
										</button>
										{selectedClassIds.length > 0 && (
											<Badge variant="secondary">
												{selectedClassIds.length} / {allClasses.length}
											</Badge>
										)}
									</div>
									<ScrollArea className="h-64 rounded-md border">
										<div className="divide-y">
											{allClasses.map((cls) => (
												<label
													key={cls.id}
													className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-muted/50"
												>
													<Checkbox
														checked={selectedClassIds.includes(cls.id)}
														onCheckedChange={() => toggleClass(cls.id)}
													/>
													<span className="text-sm">{cls.name}</span>
												</label>
											))}
										</div>
									</ScrollArea>
									{batchProgress && (
										<div className="space-y-1.5 rounded-lg border bg-muted/30 p-3">
											<div className="flex items-center justify-between text-muted-foreground text-xs">
												<span>
													{batchProgress.done} / {batchProgress.total}
												</span>
												{batchProgress.errors.length > 0 && (
													<span className="text-destructive">
														{batchProgress.errors.length} erreur(s)
													</span>
												)}
											</div>
											<Progress
												value={(batchProgress.done / batchProgress.total) * 100}
											/>
											{batchProgress.errors.length > 0 && (
												<p className="text-destructive text-xs">
													Échecs : {batchProgress.errors.join(", ")}
												</p>
											)}
										</div>
									)}
								</>
							)}
						</div>
					)}

					{/* ── Quick start ── */}
					<div className="flex items-center gap-3 rounded-lg border border-dashed p-3">
						<Switch
							id="quick-start"
							checked={fields.quickStart}
							onCheckedChange={(v) => patch({ quickStart: v })}
						/>
						<div>
							<label
								htmlFor="quick-start"
								className="cursor-pointer font-medium text-sm"
							>
								<Zap className="mr-1 inline h-3.5 w-3.5 text-yellow-500" />
								{t("admin.deliberations.form.quickStart", {
									defaultValue: "Démarrage rapide",
								})}
							</label>
							<p className="text-muted-foreground text-xs">
								{t("admin.deliberations.form.quickStartHint", {
									defaultValue:
										"Crée, ouvre et calcule les résultats en une seule étape",
								})}
							</p>
						</div>
					</div>
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={handleClose}
						disabled={batchRunning}
					>
						{t("common.actions.cancel")}
					</Button>
					{tab === "single" ? (
						<Button
							onClick={() =>
								fields.quickStart
									? initAndComputeMutation.mutate()
									: createMutation.mutate()
							}
							disabled={!singleCanSubmit || singlePending}
						>
							{singlePending && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							{fields.quickStart
								? t("admin.deliberations.form.quickStartSubmit", {
										defaultValue: "Créer et calculer",
									})
								: t("common.actions.create")}
						</Button>
					) : (
						<Button
							onClick={handleBatchCreate}
							disabled={!multiCanSubmit || batchRunning}
						>
							{batchRunning ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<Users className="mr-2 h-4 w-4" />
							)}
							{batchRunning
								? t("admin.deliberations.form.batchCreating", {
										defaultValue: "Création en cours…",
									})
								: t("admin.deliberations.form.batchSubmit", {
										defaultValue: `Créer pour ${selectedClassIds.length || "…"} classe(s)`,
									})}
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
