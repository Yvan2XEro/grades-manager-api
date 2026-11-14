import { BulkDocumentFailures } from "../components/bulk-document-failures";
import { BulkDocumentFilters } from "../components/bulk-document-filters";
import { BulkDocumentStudentsCard } from "../components/bulk-document-students-card";
import { useBulkDocumentGeneration } from "../hooks/use-bulk-document-generation";

export default function BulkDocumentGeneration() {
	const state = useBulkDocumentGeneration();

	return (
		<div className="space-y-6">
			<div>
				<h1 className="font-bold text-2xl text-foreground">
					Génération en lot
				</h1>
				<p className="text-muted-foreground">
					Génération côté navigateur. <strong>Ne fermez pas l'onglet</strong>{" "}
					pendant l'opération.
				</p>
			</div>

			<BulkDocumentFilters state={state} />

			{state.classId && <BulkDocumentStudentsCard state={state} />}

			{state.summary.error > 0 && !state.isGenerating && (
				<BulkDocumentFailures state={state} />
			)}
		</div>
	);
}
