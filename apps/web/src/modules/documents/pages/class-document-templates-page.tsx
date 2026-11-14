import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { ClassTemplateKindCard } from "../components/class-template-kind-card";
import { ClassTemplateThemeView } from "../components/class-template-theme-view";
import { DocumentPreviewView } from "../components/document-preview-view";
import { useClassDocumentTemplates } from "../hooks/use-class-document-templates";
import { KINDS } from "../services/class-template-kinds";

export default function ClassDocumentTemplates() {
	const state = useClassDocumentTemplates();
	const {
		classes,
		classesLoading,
		selectedClassId,
		setSelectedClassId,
		selectedClassLabel,
		totalTemplates,
		editingKind,
		previewHtml,
		setPreviewHtml,
		seedSystemDefaultsMutation,
	} = state;

	if (editingKind) return <ClassTemplateThemeView state={state} />;

	if (previewHtml) {
		return (
			<DocumentPreviewView
				html={previewHtml}
				subtitle={`${selectedClassLabel} · données fictives — utilisez "Générer" sur la fiche étudiant pour produire le document final`}
				onBack={() => setPreviewHtml(null)}
			/>
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
					{KINDS.map((k) => (
						<ClassTemplateKindCard key={k.value} kind={k} state={state} />
					))}
				</div>
			)}
		</div>
	);
}
