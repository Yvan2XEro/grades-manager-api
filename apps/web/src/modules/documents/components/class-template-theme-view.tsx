import { ArrowLeft, Save } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { useClassDocumentTemplates } from "../hooks/use-class-document-templates";
import { ThemeEditor } from "./theme-editor";

type State = ReturnType<typeof useClassDocumentTemplates>;

/** Full-page editor of the theme overrides of one class template, with live preview. */
export function ClassTemplateThemeView({ state }: { state: State }) {
	const { t } = useTranslation();
	const {
		editingKind,
		editingKindLabel,
		selectedClassLabel,
		overrides,
		setOverrides,
		setEditingKind,
		closeEditor,
		handleSaveOverrides,
		assignMutation,
		previewMutation,
		previewHtml,
		editingDefaultTheme,
		presetsByKind,
	} = state;
	if (!editingKind) return null;
	return (
		<div className="-m-4 md:-m-6 lg:-m-8 flex h-[calc(100vh-7rem)] flex-col space-y-4 p-4 md:p-6 lg:p-8">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div className="flex items-center gap-3">
					<Button variant="outline" size="sm" onClick={closeEditor}>
						<ArrowLeft className="mr-1 h-4 w-4" />
						{t("common.actions.back")}
					</Button>
					<div>
						<h1 className="font-bold text-foreground text-xl">
							{t("admin.documents.classTemplates.editor.title", {
								kind: editingKindLabel,
							})}
						</h1>
						<p className="text-muted-foreground text-xs">
							{t("admin.documents.classTemplates.editor.subtitle", {
								classLabel: selectedClassLabel,
							})}
						</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<span className="text-muted-foreground text-xs">
						{t("admin.documents.classTemplates.editor.modifiedGroups", {
							count: Object.keys(overrides).length,
						})}
					</span>
					<Button variant="ghost" onClick={() => setEditingKind(null)}>
						{t("common.actions.cancel")}
					</Button>
					<Button
						onClick={handleSaveOverrides}
						disabled={assignMutation.isPending}
					>
						{assignMutation.isPending && <Spinner className="mr-2" />}
						<Save className="mr-1 h-4 w-4" />
						{t("common.actions.save")}
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
						<span className="font-medium">
							{t("admin.documents.classTemplates.editor.preview")}
						</span>
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
							{t("admin.documents.classTemplates.editor.refreshPreview")}
						</Button>
					</div>
					<div className="flex-1">
						{previewHtml ? (
							<iframe
								title={t("admin.documents.classTemplates.editor.livePreview")}
								className="h-full w-full bg-white"
								srcDoc={previewHtml}
							/>
						) : (
							<div className="flex h-full items-center justify-center text-muted-foreground text-xs">
								{t("admin.documents.classTemplates.editor.previewHint")}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
