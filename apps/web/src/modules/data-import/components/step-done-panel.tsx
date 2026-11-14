import { CheckCircle2 } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import type { StepPreview } from "../types";

/** Result of the import, with the way forward. */
export function StepDonePanel({
	preview,
	jobId,
	nextStep,
	onRestart,
}: {
	preview: StepPreview;
	jobId: string | null;
	nextStep?: { key: string; label: string };
	onRestart: () => void;
}) {
	return (
		<div className="flex flex-col items-center gap-4 rounded-lg border bg-card p-10 text-center">
			<CheckCircle2 className="h-12 w-12 text-emerald-600" />
			<div className="space-y-1">
				<p className="font-semibold text-lg">Import terminé</p>
				<p className="text-muted-foreground text-sm">
					{preview.sheets
						.map(
							(s) => `${s.sheet} : ${s.create} créé(s), ${s.update} mis à jour`,
						)
						.join(" · ")}
				</p>
			</div>
			<div className="flex flex-wrap justify-center gap-2">
				<Button variant="outline" onClick={onRestart}>
					Importer un autre fichier
				</Button>
				{jobId && (
					<Button asChild variant="outline">
						<Link to={`/batch-jobs/${jobId}`}>Voir le journal</Link>
					</Button>
				)}
				<Button asChild>
					<Link to={nextStep ? `/import/${nextStep.key}` : "/import"}>
						{nextStep
							? `Étape suivante : ${nextStep.label}`
							: "Retour à l'import"}
					</Link>
				</Button>
			</div>
		</div>
	);
}
