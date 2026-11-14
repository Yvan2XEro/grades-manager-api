import { Eye, FileText, RotateCcw } from "lucide-react";
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
import type { useClassDocumentTemplates } from "../hooks/use-class-document-templates";
import type { KINDS } from "../services/class-template-kinds";

/** Template assignment of one document kind for the selected class. */
export function ClassTemplateKindCard({
	kind: k,
	state,
}: {
	kind: (typeof KINDS)[number];
	state: ReturnType<typeof useClassDocumentTemplates>;
}) {
	const {
		assignmentsByKind,
		templatesByType,
		selectedClassId,
		handleAssign,
		handleOpenOverrides,
		previewMutation,
		removeMutation,
	} = state;
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
								themeOverrides: assignment?.themeOverrides ?? undefined,
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
}
