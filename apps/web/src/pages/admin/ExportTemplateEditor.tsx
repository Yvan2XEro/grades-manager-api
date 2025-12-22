import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Save, Eye, Download } from "lucide-react";
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
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
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
			toast.error(error.message || t("admin.exportTemplates.toast.createError"));
		},
	});

	// Charger le template
	const { data: template, isLoading } = useQuery({
		queryKey: ["exportTemplate", templateId],
		queryFn: async () => {
			if (!templateId || templateId === "new") throw new Error("No template ID");
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
			if (!templateId || templateId === "new") throw new Error("No template ID");
			await trpcClient.exportTemplates.update.mutate({
				id: templateId,
				name: templateName.trim(),
				templateBody: templateBody || "",
			});
		},
		onSuccess: () => {
			toast.success(t("admin.exportTemplates.toast.updateSuccess"));
			queryClient.invalidateQueries({ queryKey: ["exportTemplate", templateId] });
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

	if (isLoading) {
		return (
			<div className="flex justify-center items-center min-h-screen">
				<Spinner />
			</div>
		);
	}

	if (!template && !isNewTemplate) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen">
				<h2 className="text-2xl font-bold">
					{t("admin.exportTemplates.editor.notFound")}
				</h2>
				<Button
					onClick={() => navigate("/admin/export-templates")}
					className="mt-4"
				>
					<ArrowLeft className="h-4 w-4 mr-2" />
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
						<ArrowLeft className="h-4 w-4 mr-2" />
						{t("common.actions.back")}
					</Button>
					<div>
						<h1 className="text-3xl font-bold tracking-tight">
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
						<Save className="h-4 w-4 mr-2" />
					)}
					{isNewTemplate ? t("common.actions.create") : t("common.actions.save")}
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
						</SelectContent>
					</Select>
					<p className="text-xs text-muted-foreground">
						{t("admin.exportTemplates.form.typeDescription")}
					</p>
				</div>
			</div>

			{/* Editor + Preview */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
								className="font-mono text-sm min-h-[600px]"
								spellCheck={false}
							/>
							<div className="flex gap-2">
								<Button
									onClick={handleGeneratePreview}
                  disabled={isGeneratingPreview || !templateBody.trim()}
								>
									{isGeneratingPreview ? (
										<Spinner className="mr-2" />
									) : (
										<Eye className="h-4 w-4 mr-2" />
									)}
									{t("admin.exportTemplates.editor.template.generatePreview")}
								</Button>
							</div>
							<div className="text-sm text-muted-foreground space-y-2">
								<p className="font-semibold">
									{t("admin.exportTemplates.editor.template.helpTitle")}
								</p>
								<ul className="list-disc list-inside space-y-1">
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
									{t("admin.exportTemplates.editor.template.previewDescription")}
								</CardDescription>
							</div>
							{previewHtml && (
								<Button
									variant="outline"
									size="sm"
									onClick={handleDownloadPreview}
								>
									<Download className="h-4 w-4 mr-2" />
									{t("admin.exportTemplates.editor.template.download")}
								</Button>
							)}
						</div>
					</CardHeader>
					<CardContent>
						{previewHtml ? (
							<div className="border rounded-lg overflow-hidden">
								<iframe
									srcDoc={previewHtml}
									className="w-full h-[600px]"
									title="Template Preview"
									sandbox="allow-same-origin"
								/>
							</div>
						) : (
							<div className="flex flex-col items-center justify-center h-[600px] border rounded-lg bg-muted/50">
								<Eye className="h-12 w-12 text-muted-foreground mb-4" />
								<p className="text-muted-foreground">
									{t("admin.exportTemplates.editor.template.noPreview")}
								</p>
								<p className="text-sm text-muted-foreground mt-2">
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
