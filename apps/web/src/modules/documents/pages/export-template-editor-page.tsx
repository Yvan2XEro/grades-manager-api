import { ArrowLeft, Save } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
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
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { TemplateEditorSplit } from "../components/template-editor-split";
import { useExportTemplateEditor } from "../hooks/use-export-template-editor";
import { EXPORT_TYPES, getExportTypeLabel } from "../types";

export default function ExportTemplateEditor() {
	const { t } = useTranslation();
	const { templateId } = useParams<{ templateId: string }>();
	const navigate = useNavigate();
	const editor = useExportTemplateEditor(templateId);
	const {
		template,
		isLoading,
		isNewTemplate,
		templateName,
		setTemplateName,
		templateType,
		setTemplateType,
		livePreview,
		setLivePreview,
		isSaving,
		isPreviewPending,
		handleSave,
	} = editor;
	// Vertical layout for the editor/preview split (allows the user to put
	// preview on top of editor on small screens, or side-by-side on big ones).
	const [splitDirection, setSplitDirection] = useState<
		"horizontal" | "vertical"
	>("horizontal");

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
				<Button onClick={() => navigate(-1)} className="mt-4">
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
					<Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
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
							{EXPORT_TYPES.map((type) => (
								<SelectItem key={type.value} value={type.value}>
									{type.label}
								</SelectItem>
							))}
							{/* Templates of other types (created elsewhere) keep their label */}
							{templateType &&
								!EXPORT_TYPES.some((type) => type.value === templateType) && (
									<SelectItem value={templateType}>
										{getExportTypeLabel(templateType)}
									</SelectItem>
								)}
						</SelectContent>
					</Select>
					<p className="text-muted-foreground text-xs">
						{t("admin.exportTemplates.form.typeDescription")}
					</p>
				</div>
			</div>

			{/* Editor + Preview — resizable split. The user can drag the handle
			   to expand either side, and toggle layout (horizontal/vertical). */}
			<div className="flex items-center gap-4 px-1">
				<div className="flex items-center gap-2">
					<Switch
						id="live-preview"
						checked={livePreview}
						onCheckedChange={setLivePreview}
					/>
					<Label
						htmlFor="live-preview"
						className="cursor-pointer font-normal text-sm"
					>
						Aperçu en direct
					</Label>
					{livePreview && isPreviewPending && (
						<span className="text-muted-foreground text-xs italic">
							rendu en cours…
						</span>
					)}
				</div>
				<div className="ml-auto flex items-center gap-2">
					<Label className="text-muted-foreground text-xs">Disposition:</Label>
					<Button
						size="sm"
						variant={splitDirection === "horizontal" ? "default" : "outline"}
						onClick={() => setSplitDirection("horizontal")}
					>
						Côte à côte
					</Button>
					<Button
						size="sm"
						variant={splitDirection === "vertical" ? "default" : "outline"}
						onClick={() => setSplitDirection("vertical")}
					>
						Empilé
					</Button>
				</div>
			</div>
			<TemplateEditorSplit editor={editor} splitDirection={splitDirection} />

			<div className="space-y-2 px-1 text-muted-foreground text-sm">
				<p className="font-semibold">
					{t("admin.exportTemplates.editor.template.helpTitle")}
				</p>
				<ul className="list-inside list-disc space-y-1">
					<li>{t("admin.exportTemplates.editor.template.helpHandlebars")}</li>
					<li>{t("admin.exportTemplates.editor.template.helpVariables")}</li>
					<li>{t("admin.exportTemplates.editor.template.helpStatic")}</li>
				</ul>
			</div>
		</div>
	);
}
