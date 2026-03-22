import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Download, Eye, FileCode, Save } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
	getTemplateExample,
	type TemplateType,
} from "@/lib/export-template-examples";
import { trpcClient } from "@/utils/trpc";

export default function ExportTemplateEditor() {
	const { t } = useTranslation();
	const { templateId } = useParams<{ templateId: string }>();
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
			navigate(`/admin/export-templates/${result.id}`, { replace: true });
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

	const handleDownloadPreview = () => {
		if (!previewHtml) return;
		const blob = new Blob([previewHtml], { type: "text/html" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `preview-${templateType}-${Date.now()}.html`;
		a.click();
		URL.revokeObjectURL(url);
	};

	const handleLoadExample = () => {
		const currentType = (template?.type || templateType) as TemplateType;
		const exampleTemplate = getTemplateExample(currentType);
		if (exampleTemplate) {
			setTemplateBody(exampleTemplate);
			toast.success(t("admin.exportTemplates.editor.template.exampleLoaded"));
		}
	};

	if (isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<Spinner />
			</div>
		);
	}

	if (!template && !isNewTemplate) {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center">
				<h2 className="font-semibold text-foreground text-xl">
					{t("admin.exportTemplates.editor.notFound")}
				</h2>
				<Button
					onClick={() => navigate("/admin/export-templates")}
					className="mt-4"
				>
					<ArrowLeft className="mr-2 h-4 w-4" />
					{t("common.actions.back")}
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => navigate("/admin/export-templates")}
					>
						<ArrowLeft className="mr-2 h-4 w-4" />
						{t("common.actions.back")}
					</Button>
					<div>
						<h1 className="text-foreground">
							{template?.name || templateName}
						</h1>
						<p className="text-muted-foreground">
							{t("admin.exportTemplates.editor.subtitle", {
								type: template?.type || templateType,
							})}
						</p>
					</div>
				</div>
				<Button onClick={handleSave} disabled={isSaving}>
					{isSaving ? (
						<Spinner className="mr-2" />
					) : (
						<Save className="mr-2 h-4 w-4" />
					)}
					{isNewTemplate
						? t("common.actions.create")
						: t("common.actions.save")}
				</Button>
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				<div className="space-y-2">
					<Label>{t("admin.exportTemplates.form.name")}</Label>
					<Input
						value={templateName}
						onChange={(e) => setTemplateName(e.target.value)}
						placeholder={t("admin.exportTemplates.form.namePlaceholder")}
					/>
				</div>
				<div className="space-y-2">
					<Label>{t("admin.exportTemplates.form.type")}</Label>
					<Select
						value={templateType}
						onValueChange={setTemplateType}
						disabled={!isNewTemplate}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="pv">PV (Procès-Verbal)</SelectItem>
							<SelectItem value="evaluation">Evaluation</SelectItem>
							<SelectItem value="ue">UE (Teaching Unit)</SelectItem>
							<SelectItem value="deliberation">Délibération</SelectItem>
						</SelectContent>
					</Select>
					<p className="text-muted-foreground text-xs">
						{t("admin.exportTemplates.form.typeDescription")}
					</p>
				</div>
			</div>

			{/* Editor + Preview */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				{/* Éditeur */}
				<Card>
					<CardHeader>
						<CardTitle>
							{t("admin.exportTemplates.editor.template.editorTitle")}
						</CardTitle>
						<CardDescription>
							{t("admin.exportTemplates.editor.template.editorDescription")}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<Textarea
								value={templateBody}
								onChange={(e) => setTemplateBody(e.target.value)}
								placeholder={t(
									"admin.exportTemplates.editor.template.placeholder",
								)}
								className="min-h-[600px] font-mono text-sm"
								spellCheck={false}
							/>
							<div className="flex gap-2">
								<Button variant="outline" onClick={handleLoadExample}>
									<FileCode className="mr-2 h-4 w-4" />
									{t("admin.exportTemplates.editor.template.loadExample")}
								</Button>
								<Button
									onClick={handleGeneratePreview}
									disabled={isGeneratingPreview || !templateBody.trim()}
								>
									{isGeneratingPreview ? (
										<Spinner className="mr-2" />
									) : (
										<Eye className="mr-2 h-4 w-4" />
									)}
									{t("admin.exportTemplates.editor.template.generatePreview")}
								</Button>
							</div>
							<div className="space-y-2 text-muted-foreground text-sm">
								<p className="font-semibold">
									{t("admin.exportTemplates.editor.template.helpTitle")}
								</p>
								<ul className="list-inside list-disc space-y-1">
									<li>
										{t("admin.exportTemplates.editor.template.helpHandlebars")}
									</li>
									<li>
										{t("admin.exportTemplates.editor.template.helpVariables")}
									</li>
									<li>
										{t("admin.exportTemplates.editor.template.helpStatic")}
									</li>
								</ul>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Preview */}
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<div>
								<CardTitle>
									{t("admin.exportTemplates.editor.template.previewTitle")}
								</CardTitle>
								<CardDescription>
									{t(
										"admin.exportTemplates.editor.template.previewDescription",
									)}
								</CardDescription>
							</div>
							{previewHtml && (
								<Button
									variant="outline"
									size="sm"
									onClick={handleDownloadPreview}
								>
									<Download className="mr-2 h-4 w-4" />
									{t("admin.exportTemplates.editor.template.download")}
								</Button>
							)}
						</div>
					</CardHeader>
					<CardContent>
						{previewHtml ? (
							<div className="overflow-hidden rounded-lg border">
								<iframe
									srcDoc={previewHtml}
									className="h-[600px] w-full"
									title="Template Preview"
									sandbox="allow-same-origin"
								/>
							</div>
						) : (
							<div className="flex h-[600px] flex-col items-center justify-center rounded-lg border bg-muted/50">
								<Eye className="mb-4 h-12 w-12 text-muted-foreground" />
								<p className="text-muted-foreground">
									{t("admin.exportTemplates.editor.template.noPreview")}
								</p>
								<p className="mt-2 text-muted-foreground text-sm">
									{t("admin.exportTemplates.editor.template.clickGenerate")}
								</p>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
