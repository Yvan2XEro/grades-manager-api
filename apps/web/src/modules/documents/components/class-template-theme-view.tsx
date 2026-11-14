import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { useClassDocumentTemplates } from "../hooks/use-class-document-templates";
import { ThemeEditor } from "./theme-editor";

type State = ReturnType<typeof useClassDocumentTemplates>;

/** Full-page editor of the theme overrides of one class template, with live preview. */
export function ClassTemplateThemeView({ state }: { state: State }) {
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
		</div>
	);
}
