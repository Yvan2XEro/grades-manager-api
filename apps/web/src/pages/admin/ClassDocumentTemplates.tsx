import {
	useMutation,
	useQueries,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import {
	ArrowLeft,
	Download,
	Eye,
	FileText,
	RotateCcw,
	Save,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
	deepMergeTheme,
	ThemeEditor,
} from "@/components/admin/document-templates/ThemeEditor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";

type DocumentKind = "diploma" | "transcript" | "attestation" | "student_list";

const KINDS: Array<{
	value: DocumentKind;
	label: string;
	description: string;
}> = [
	{
		value: "diploma",
		label: "Diplôme",
		description: "Diplôme d'État officiel",
	},
	{
		value: "transcript",
		label: "Relevé de notes",
		description: "Relevé officiel des notes de l'étudiant",
	},
	{
		value: "student_list",
		label: "Liste d'étudiants",
		description: "Liste/roster pour cette classe (colonnes configurables)",
	},
	{
		value: "attestation",
		label: "Attestation",
		description: "Attestation de réussite ou d'inscription",
	},
];

export default function ClassDocumentTemplates() {
	const queryClient = useQueryClient();
	const [selectedClassId, setSelectedClassId] = useState<string>("");
	const [editingKind, setEditingKind] = useState<DocumentKind | null>(null);
	const [overrides, setOverrides] = useState<Record<string, unknown>>({});
	const [previewHtml, setPreviewHtml] = useState<string | null>(null);

	// Load classes
	const { data: classes, isLoading: classesLoading } = useQuery({
		queryKey: ["classes-for-templates"],
		queryFn: async () => {
			const res = await trpcClient.classes.list.query({ limit: 200 });
			return (
				res as {
					items: Array<{ id: string; name: string; code: string }>;
				}
			).items;
		},
	});

	useEffect(() => {
		if (!selectedClassId && classes && classes.length > 0) {
			setSelectedClassId(classes[0].id);
		}
	}, [classes, selectedClassId]);

	// Load existing assignments for the selected class
	const { data: assignments } = useQuery({
		queryKey: ["class-template-assignments", selectedClassId],
		queryFn: async () =>
			selectedClassId
				? await trpcClient.exportTemplates.listClassAssignments.query({
						classId: selectedClassId,
					})
				: [],
		enabled: !!selectedClassId,
	});

	// Templates available per type
	const { data: templatesByType } = useQuery({
		queryKey: ["templates-grouped"],
		queryFn: async () => {
			const map: Record<DocumentKind, Array<{ id: string; name: string }>> = {
				diploma: [],
				transcript: [],
				attestation: [],
				student_list: [],
			};
			for (const k of KINDS) {
				const res = await trpcClient.exportTemplates.list.query({
					type: k.value,
					limit: 100,
				});
				map[k.value] = (
					res as { items: Array<{ id: string; name: string }> }
				).items;
			}
			return map;
		},
	});

	// Theme presets per kind (for preset picker + as defaultTheme baseline)
	const presetQueries = useQueries({
		queries: KINDS.map((k) => ({
			queryKey: ["theme-presets", k.value],
			queryFn: async () => {
				const res = await trpcClient.exportTemplates.getThemePresets.query({
					kind: k.value,
				});
				return res as Array<{
					id: string;
					name: string;
					theme: Record<string, unknown>;
				}>;
			},
			staleTime: 60 * 60 * 1000,
		})),
	});

	const presetsByKind = useMemo(() => {
		const out: Record<DocumentKind, (typeof presetQueries)[number]["data"]> = {
			diploma: undefined,
			transcript: undefined,
			attestation: undefined,
			student_list: undefined,
		};
		KINDS.forEach((k, i) => {
			out[k.value] = presetQueries[i].data;
		});
		return out;
	}, [presetQueries]);

	const assignmentsByKind = useMemo(() => {
		const m: Record<DocumentKind, any> = {
			diploma: null,
			transcript: null,
			attestation: null,
			student_list: null,
		};
		for (const a of assignments ?? []) {
			if (a.templateType in m) m[a.templateType as DocumentKind] = a;
		}
		return m;
	}, [assignments]);

	const editingDefaultTheme = useMemo(() => {
		if (!editingKind) return {} as Record<string, unknown>;
		const presets = presetsByKind[editingKind];
		const classic = presets?.find((p) => p.id === "classic");
		return classic?.theme ?? {};
	}, [editingKind, presetsByKind]);

	const assignMutation = useMutation({
		mutationFn: async (input: {
			classId: string;
			templateType: DocumentKind;
			templateId: string;
			themeOverrides?: Record<string, unknown>;
		}) => {
			return await trpcClient.exportTemplates.assignToClass.mutate(input);
		},
		onSuccess: () => {
			toast.success("Modèle assigné");
			queryClient.invalidateQueries({
				queryKey: ["class-template-assignments", selectedClassId],
			});
		},
		onError: (err: any) => toast.error(err.message || "Échec de l'assignation"),
	});

	const removeMutation = useMutation({
		mutationFn: async (input: {
			classId: string;
			templateType: DocumentKind;
		}) => {
			return await trpcClient.exportTemplates.removeClassAssignment.mutate(
				input,
			);
		},
		onSuccess: () => {
			toast.success(
				"Assignation retirée — la classe utilisera le modèle par défaut",
			);
			queryClient.invalidateQueries({
				queryKey: ["class-template-assignments", selectedClassId],
			});
		},
	});

	const previewMutation = useMutation({
		mutationFn: async (input: {
			kind: DocumentKind;
			themeOverrides?: Record<string, unknown>;
		}) => {
			const tplBody =
				await trpcClient.academicDocuments.getBundledTemplateBody.query({
					kind: input.kind,
				});
			const result = await trpcClient.academicDocuments.previewBody.mutate({
				kind: input.kind,
				templateBody: (tplBody as { templateBody: string }).templateBody,
				themeOverrides: input.themeOverrides,
				demoMode: true,
			});
			return (result as { html: string }).html;
		},
		onSuccess: (html) => setPreviewHtml(html),
		onError: (err: any) => toast.error(err.message || "Échec de l'aperçu"),
	});

	const seedSystemDefaultsMutation = useMutation({
		mutationFn: () => trpcClient.academicDocuments.seedSystemDefaults.mutate(),
		onSuccess: (data: any) => {
			const created = data?.created ?? [];
			const skipped = data?.skipped ?? [];
			if (created.length > 0) {
				toast.success(
					`Modèles système créés : ${created.join(", ")}${
						skipped.length ? ` (déjà présents : ${skipped.join(", ")})` : ""
					}`,
				);
			} else if (skipped.length > 0) {
				toast.success("Modèles système déjà présents");
			}
			queryClient.invalidateQueries({ queryKey: ["templates-grouped"] });
			// Other 4 types (pv/evaluation/ue/deliberation) are now seeded too —
			// invalidate the global ExportTemplates list so the Export Templates
			// page reflects them.
			queryClient.invalidateQueries({ queryKey: ["exportTemplates"] });
		},
		onError: (err: any) =>
			toast.error(err.message || "Échec de la création des modèles système"),
	});

	const handleAssign = (kind: DocumentKind, templateId: string) => {
		if (!selectedClassId || !templateId) return;
		assignMutation.mutate({
			classId: selectedClassId,
			templateType: kind,
			templateId,
		});
	};

	const handleOpenOverrides = (kind: DocumentKind) => {
		const assignment = assignmentsByKind[kind];
		setEditingKind(kind);
		setOverrides((assignment?.themeOverrides as Record<string, unknown>) ?? {});
	};

	const handleSaveOverrides = () => {
		if (!editingKind) return;
		const assignment = assignmentsByKind[editingKind];
		// If no prior assignment, auto-pick the first available template (or
		// fail loudly if nothing is seeded yet).
		const templates = templatesByType?.[editingKind] ?? [];
		const templateId = assignment?.templateId ?? templates[0]?.id;
		if (!templateId) {
			toast.error(
				"Aucun modèle disponible — exécutez d'abord la création des modèles système",
			);
			return;
		}
		assignMutation.mutate(
			{
				classId: selectedClassId,
				templateType: editingKind,
				templateId,
				themeOverrides: overrides,
			},
			{
				onSuccess: () => {
					setEditingKind(null);
				},
			},
		);
	};

	const totalTemplates = useMemo(() => {
		if (!templatesByType) return 0;
		return KINDS.reduce(
			(sum, k) => sum + (templatesByType[k.value]?.length ?? 0),
			0,
		);
	}, [templatesByType]);

	const editingKindLabel = KINDS.find((k) => k.value === editingKind)?.label;
	const selectedClassLabel = useMemo(() => {
		const c = classes?.find((c) => c.id === selectedClassId);
		return c ? `${c.code} — ${c.name}` : "";
	}, [classes, selectedClassId]);

	// ---------- Editor full-page view ----------
	if (editingKind) {
		return (
			<div className="-m-4 md:-m-6 lg:-m-8 flex h-[calc(100vh-7rem)] flex-col space-y-4 p-4 md:p-6 lg:p-8">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div className="flex items-center gap-3">
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								setEditingKind(null);
								setPreviewHtml(null);
							}}
						>
							<ArrowLeft className="mr-1 h-4 w-4" />
							Retour
						</Button>
						<div>
							<h1 className="font-bold text-foreground text-xl">
								Personnaliser · {editingKindLabel}
							</h1>
							<p className="text-muted-foreground text-xs">
								{selectedClassLabel} · les surcharges s'appliquent uniquement à
								cette classe
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<span className="text-muted-foreground text-xs">
							{Object.keys(overrides).length} groupe(s) modifié(s)
						</span>
						<Button variant="ghost" onClick={() => setEditingKind(null)}>
							Annuler
						</Button>
						<Button
							onClick={handleSaveOverrides}
							disabled={assignMutation.isPending}
						>
							{assignMutation.isPending && <Spinner className="mr-2" />}
							<Save className="mr-1 h-4 w-4" />
							Enregistrer
						</Button>
					</div>
				</div>
				<div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-2">
					<div className="overflow-y-auto rounded border p-4 pr-2">
						<ThemeEditor
							defaultTheme={editingDefaultTheme}
							value={overrides}
							onChange={setOverrides}
							presets={presetsByKind[editingKind]}
						/>
					</div>
					<div className="flex flex-col overflow-hidden rounded border bg-muted/20">
						<div className="flex items-center justify-between border-b bg-background px-3 py-2 text-xs">
							<span className="font-medium">Aperçu</span>
							<Button
								size="sm"
								variant="ghost"
								onClick={() =>
									previewMutation.mutate({
										kind: editingKind,
										themeOverrides: overrides,
									})
								}
								disabled={previewMutation.isPending}
							>
								{previewMutation.isPending && <Spinner className="mr-1" />}
								Rafraîchir l'aperçu
							</Button>
						</div>
						<div className="flex-1">
							{previewHtml ? (
								<iframe
									title="Aperçu live"
									className="h-full w-full bg-white"
									srcDoc={previewHtml}
								/>
							) : (
								<div className="flex h-full items-center justify-center text-muted-foreground text-xs">
									Cliquez "Rafraîchir l'aperçu" pour générer le rendu
								</div>
							)}
						</div>
					</div>
				</div>
				<DeepMergeProbe value={editingDefaultTheme} />
			</div>
		);
	}

	// ---------- Preview full-page view ----------
	if (previewHtml) {
		return (
			<div className="-m-4 md:-m-6 lg:-m-8 flex h-[calc(100vh-7rem)] flex-col space-y-4 p-4 md:p-6 lg:p-8">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div className="flex items-center gap-3">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setPreviewHtml(null)}
						>
							<ArrowLeft className="mr-1 h-4 w-4" />
							Retour
						</Button>
						<div>
							<h1 className="font-bold text-foreground text-xl">
								Aperçu du document
							</h1>
							<p className="text-muted-foreground text-xs">
								{selectedClassLabel} · données fictives — utilisez "Générer" sur
								la fiche étudiant pour produire le document final
							</p>
						</div>
					</div>
					<Button
						variant="outline"
						onClick={() => {
							const blob = new Blob([previewHtml], { type: "text/html" });
							const url = URL.createObjectURL(blob);
							const a = document.createElement("a");
							a.href = url;
							a.download = "apercu-document.html";
							a.click();
							URL.revokeObjectURL(url);
						}}
					>
						<Download className="mr-1 h-4 w-4" />
						Télécharger HTML
					</Button>
				</div>
				<div className="min-h-0 flex-1 overflow-hidden rounded border">
					<iframe
						title="Aperçu"
						className="h-full w-full bg-white"
						srcDoc={previewHtml}
					/>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="font-bold text-2xl text-foreground">
						Templates de documents par classe
					</h1>
					<p className="text-muted-foreground">
						Choisissez le modèle de diplôme, relevé et attestation pour chaque
						classe. Vous pouvez surcharger le thème par classe (couleurs,
						polices, tailles, etc.) sans toucher au modèle d'institution.
					</p>
				</div>
				<Button
					variant={totalTemplates === 0 ? "default" : "outline"}
					size="sm"
					onClick={() => seedSystemDefaultsMutation.mutate()}
					disabled={seedSystemDefaultsMutation.isPending}
				>
					{seedSystemDefaultsMutation.isPending ? (
						<Spinner className="mr-2 h-4 w-4" />
					) : null}
					{totalTemplates === 0
						? "Créer les modèles système"
						: "Réinitialiser les modèles système"}
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Classe ciblée</CardTitle>
					<CardDescription>
						Sélectionnez la classe à configurer. Si rien n'est assigné, c'est le
						modèle par défaut du programme ou de l'institution qui s'applique.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Select
						value={selectedClassId}
						onValueChange={setSelectedClassId}
						disabled={classesLoading}
					>
						<SelectTrigger className="max-w-md">
							<SelectValue placeholder="Choisir une classe..." />
						</SelectTrigger>
						<SelectContent>
							{(classes ?? []).map((c) => (
								<SelectItem key={c.id} value={c.id}>
									{c.code} — {c.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</CardContent>
			</Card>

			{selectedClassId && (
				<div className="grid gap-4 md:grid-cols-3">
					{KINDS.map((k) => {
						const assignment = assignmentsByKind[k.value];
						const templates = templatesByType?.[k.value] ?? [];
						const hasOverrides =
							assignment?.themeOverrides &&
							Object.keys(assignment.themeOverrides).length > 0;
						return (
							<Card key={k.value}>
								<CardHeader>
									<div className="flex items-center justify-between">
										<CardTitle className="flex items-center gap-2">
											<FileText className="h-4 w-4" />
											{k.label}
										</CardTitle>
										{assignment ? (
											<Badge variant="default">Assigné</Badge>
										) : (
											<Badge variant="secondary">Défaut institution</Badge>
										)}
									</div>
									<CardDescription>{k.description}</CardDescription>
								</CardHeader>
								<CardContent className="space-y-3">
									<div>
										<Label className="text-muted-foreground text-xs">
											Modèle utilisé
										</Label>
										<Select
											value={assignment?.templateId ?? ""}
											onValueChange={(v) => handleAssign(k.value, v)}
										>
											<SelectTrigger>
												<SelectValue placeholder="(défaut institution)" />
											</SelectTrigger>
											<SelectContent>
												{templates.map((t) => (
													<SelectItem key={t.id} value={t.id}>
														{t.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>

									{hasOverrides && (
										<div className="rounded bg-amber-50 px-2 py-1 text-amber-700 text-xs">
											Thème personnalisé pour cette classe
										</div>
									)}

									<div className="flex flex-wrap gap-2">
										<Button
											size="sm"
											variant="outline"
											onClick={() => handleOpenOverrides(k.value)}
											disabled={templates.length === 0}
											title={
												templates.length === 0
													? "Aucun modèle disponible — créez d'abord les modèles système"
													: assignment
														? "Modifier le thème de cette classe"
														: "Créer une personnalisation pour cette classe (utilise le modèle par défaut)"
											}
										>
											Personnaliser le thème
										</Button>
										<Button
											size="sm"
											variant="outline"
											onClick={() =>
												previewMutation.mutate({
													kind: k.value,
													themeOverrides:
														assignment?.themeOverrides ?? undefined,
												})
											}
											disabled={previewMutation.isPending}
										>
											<Eye className="mr-1 h-3.5 w-3.5" />
											Aperçu
										</Button>
										{assignment && (
											<Button
												size="sm"
												variant="ghost"
												onClick={() =>
													removeMutation.mutate({
														classId: selectedClassId,
														templateType: k.value,
													})
												}
											>
												<RotateCcw className="mr-1 h-3.5 w-3.5" />
												Réinitialiser
											</Button>
										)}
									</div>
								</CardContent>
							</Card>
						);
					})}
				</div>
			)}

			{/* deepMergeTheme is exposed only to keep tree-shaking happy from the editor */}
			<DeepMergeProbe value={editingDefaultTheme} />
		</div>
	);
}

// no-op to ensure deepMergeTheme stays referenced (lints tolerate, tree-shaker drops)
function DeepMergeProbe({ value }: { value: Record<string, unknown> }) {
	void deepMergeTheme;
	void value;
	return null;
}
