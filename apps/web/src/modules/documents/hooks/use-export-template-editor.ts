import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import {
	getTemplateExample,
	type TemplateType,
} from "@/lib/export-template-examples";
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";

/**
 * Template being edited (or created when `templateId === "new"`): its fields,
 * save, preview (manual or live, debounced) and example loading.
 */
export function useExportTemplateEditor(templateId: string | undefined) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [isSaving, setIsSaving] = useState(false);
	const isNewTemplate = templateId === "new";

	// État local
	const [templateBody, setTemplateBody] = useState<string>("");
	const [templateName, setTemplateName] = useState<string>("");
	const [templateType, setTemplateType] = useState<string>("pv");
	const [previewHtml, setPreviewHtml] = useState<string>("");
	const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
	const [livePreview, setLivePreview] = useState<boolean>(false);

	// Mutation de création
	const createMutation = useMutation({
		mutationFn: async () => {
			if (!templateName.trim()) {
				throw new Error(t("admin.exportTemplates.validation.name"));
			}
			if (!templateBody.trim()) {
				throw new Error(t("admin.exportTemplates.editor.template.required"));
			}
			return await trpcClient.exportTemplates.create.mutate({
				name: templateName.trim(),
				type: templateType as any,
				isDefault: false,
				templateBody,
			});
		},
		onSuccess: (result) => {
			toast.success(t("admin.exportTemplates.toast.createSuccess"));
			navigate(`/export-templates/${result.id}`, { replace: true });
			queryClient.invalidateQueries({ queryKey: ["exportTemplates"] });
		},
		onError: (error: any) => {
			toast.error(
				error.message || t("admin.exportTemplates.toast.createError"),
			);
		},
	});

	// Charger le template
	const { data: template, isLoading } = useQuery({
		queryKey: ["exportTemplate", templateId],
		queryFn: async () => {
			if (!templateId || templateId === "new")
				throw new Error("No template ID");
			const result = await trpcClient.exportTemplates.getById.query({
				id: templateId,
			});
			setTemplateBody(result.templateBody || "");
			setTemplateName(result.name);
			setTemplateType(result.type);
			return result;
		},
		enabled: !!templateId && templateId !== "new",
	});

	// Mutation de sauvegarde
	const updateMutation = useMutation({
		mutationFn: async () => {
			if (!templateId || templateId === "new")
				throw new Error("No template ID");
			await trpcClient.exportTemplates.update.mutate({
				id: templateId,
				name: templateName.trim(),
				templateBody: templateBody || "",
			});
		},
		onSuccess: () => {
			toast.success(t("admin.exportTemplates.toast.updateSuccess"));
			queryClient.invalidateQueries({
				queryKey: ["exportTemplate", templateId],
			});
			queryClient.invalidateQueries({ queryKey: ["exportTemplates"] });
		},
		onError: (error: any) => {
			toast.error(
				error.message || t("admin.exportTemplates.toast.updateError"),
			);
		},
	});

	// Mutation pour générer le preview
	const previewMutation = useMutation({
		mutationFn: async () => {
			const result = await trpcClient.exports.previewTemplate.mutate({
				type: (template?.type || templateType) as any,
				templateBody,
			});
			return result;
		},
		onSuccess: (data: { html: string }) => {
			setPreviewHtml(data.html);
			toast.success(t("admin.exportTemplates.editor.preview.success"));
		},
		onError: (error: any) => {
			toast.error(
				error.message || t("admin.exportTemplates.editor.preview.error"),
			);
		},
	});

	const handleSave = async () => {
		if (!templateName.trim()) {
			toast.error(t("admin.exportTemplates.validation.name"));
			return;
		}
		if (!templateBody.trim()) {
			toast.error(t("admin.exportTemplates.editor.template.required"));
			return;
		}
		setIsSaving(true);
		try {
			if (isNewTemplate) {
				await createMutation.mutateAsync();
			} else {
				await updateMutation.mutateAsync();
			}
		} finally {
			setIsSaving(false);
		}
	};

	const handleGeneratePreview = async () => {
		setIsGeneratingPreview(true);
		try {
			await previewMutation.mutateAsync();
		} finally {
			setIsGeneratingPreview(false);
		}
	};

	// Live preview: debounce template body changes and re-render preview.
	// 600ms is enough to absorb fast typing without spamming the server.
	const liveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	useEffect(() => {
		if (!livePreview || !templateBody.trim()) return;
		if (liveTimerRef.current) clearTimeout(liveTimerRef.current);
		liveTimerRef.current = setTimeout(() => {
			previewMutation.mutate();
		}, 600);
		return () => {
			if (liveTimerRef.current) clearTimeout(liveTimerRef.current);
		};
		// previewMutation is stable across renders; we only want to re-fire on
		// body/type changes or when toggling live mode.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [livePreview, templateBody, templateType]);

	const handleLoadExample = () => {
		const currentType = (template?.type || templateType) as TemplateType;
		const exampleTemplate = getTemplateExample(currentType);
		if (exampleTemplate) {
			setTemplateBody(exampleTemplate);
			toast.success(t("admin.exportTemplates.editor.template.exampleLoaded"));
		}
	};

	return {
		template,
		isLoading,
		isNewTemplate,
		templateName,
		setTemplateName,
		templateType,
		setTemplateType,
		templateBody,
		setTemplateBody,
		previewHtml,
		livePreview,
		setLivePreview,
		isSaving,
		isGeneratingPreview,
		isPreviewPending: previewMutation.isPending,
		handleSave,
		handleGeneratePreview,
		handleLoadExample,
	};
}
