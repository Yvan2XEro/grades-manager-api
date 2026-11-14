import { Eye, FileCode } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Spinner } from "@/components/ui/spinner";
import type { useExportTemplateEditor } from "../hooks/use-export-template-editor";
import { useResizableHeight } from "../hooks/use-resizable-height";
import { CodeEditor } from "./code-editor";

/**
 * Code editor and HTML preview side by side (or stacked), in a card whose
 * height is resized by dragging its bottom edge (double-click resets it).
 */
export function TemplateEditorSplit({
	editor,
	splitDirection,
}: {
	editor: ReturnType<typeof useExportTemplateEditor>;
	splitDirection: "horizontal" | "vertical";
}) {
	const { t } = useTranslation();
	const { cardHeight, resetHeight, resizeHandlers } = useResizableHeight();
	const {
		templateBody,
		setTemplateBody,
		previewHtml,
		isGeneratingPreview,
		handleGeneratePreview,
		handleLoadExample,
	} = editor;

	return (
		<div className="relative rounded-lg border" style={{ height: cardHeight }}>
			<ResizablePanelGroup
				direction={splitDirection}
				className="h-full rounded-lg"
			>
				{/* Éditeur */}
				<ResizablePanel defaultSize={50} minSize={20}>
					<Card className="flex h-full flex-col rounded-none border-0">
						<CardHeader className="flex-shrink-0">
							<CardTitle>
								{t("admin.exportTemplates.editor.template.editorTitle")}
							</CardTitle>
							<CardDescription>
								{t("admin.exportTemplates.editor.template.editorDescription")}
							</CardDescription>
						</CardHeader>
						<CardContent className="flex flex-1 flex-col gap-3 overflow-hidden">
							{/* Real code editor (CodeMirror 6) with HTML+Handlebars
					    syntax highlighting, line numbers, search, autocomplete,
					    bracket matching and folding. Scrolls internally — the
					    surrounding panel controls the size. */}
							<div className="min-h-0 flex-1">
								<CodeEditor
									value={templateBody}
									onChange={setTemplateBody}
									placeholder={t(
										"admin.exportTemplates.editor.template.placeholder",
									)}
									className="h-full"
								/>
							</div>
							<div className="flex flex-wrap gap-2">
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
						</CardContent>
					</Card>
				</ResizablePanel>

				<ResizableHandle withHandle />

				{/* Preview */}
				<ResizablePanel defaultSize={50} minSize={20}>
					<Card className="flex h-full flex-col rounded-none border-0">
						<CardHeader className="flex-shrink-0">
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
							</div>
						</CardHeader>
						<CardContent className="flex flex-1 overflow-hidden">
							{previewHtml ? (
								<iframe
									srcDoc={previewHtml}
									className="h-full w-full rounded border bg-white"
									title="Template Preview"
									sandbox="allow-same-origin"
								/>
							) : (
								<div className="flex h-full w-full flex-col items-center justify-center rounded border bg-muted/50">
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
				</ResizablePanel>
			</ResizablePanelGroup>
			{/* Bottom edge handle — drag with the mouse to resize the
		    overall editor/preview card height. Double-click resets it. */}
			<div
				role="separator"
				aria-orientation="horizontal"
				aria-label="Redimensionner la hauteur"
				title="Glisser pour redimensionner — double-clic pour réinitialiser"
				{...resizeHandlers}
				onDoubleClick={resetHeight}
				className="group -bottom-1.5 absolute inset-x-0 z-10 flex h-3 cursor-row-resize items-center justify-center"
			>
				<span className="h-1 w-16 rounded-full bg-border transition-colors group-hover:bg-primary/60" />
			</div>
		</div>
	);
}
