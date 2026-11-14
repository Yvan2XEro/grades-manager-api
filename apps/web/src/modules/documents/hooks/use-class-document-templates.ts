import {
	useMutation,
	useQueries,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";
import { type DocumentKind, KINDS } from "../services/class-template-kinds";

/**
 * State of the class document templates page: selected class, its template
 * assignments, theme presets, the theme override being edited and the preview.
 */
export function useClassDocumentTemplates() {
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

	const closeEditor = () => {
		setEditingKind(null);
		setPreviewHtml(null);
	};

	return {
		classes,
		classesLoading,
		selectedClassId,
		setSelectedClassId,
		selectedClassLabel,
		templatesByType,
		totalTemplates,
		assignmentsByKind,
		presetsByKind,
		editingKind,
		setEditingKind,
		editingKindLabel,
		editingDefaultTheme,
		overrides,
		setOverrides,
		previewHtml,
		setPreviewHtml,
		closeEditor,
		assignMutation,
		removeMutation,
		previewMutation,
		seedSystemDefaultsMutation,
		handleAssign,
		handleOpenOverrides,
		handleSaveOverrides,
	};
}
