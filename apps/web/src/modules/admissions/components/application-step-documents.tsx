import { Badge } from "@/components/ui/badge";

/** Step 7 — documents to bring with the physical file. */
export function ApplicationStepDocuments({ t }: { t: (k: string) => string }) {
	const docs = [
		{ key: "photo", required: true },
		{ key: "cni", required: true },
		{ key: "birthCert", required: true },
		{ key: "bacCert", required: true },
		{ key: "bacTranscript", required: true },
		{ key: "priorTranscript", required: false },
	] as const;

	return (
		<div className="space-y-4">
			<p className="text-muted-foreground text-sm">
				{t("admissions.documents.subtitle")}
			</p>
			<div className="space-y-2">
				{docs.map((doc) => (
					<div
						key={doc.key}
						className="flex items-start gap-3 rounded-lg border p-3"
					>
						<div
							className={`mt-0.5 size-2 shrink-0 rounded-full ${doc.required ? "bg-destructive" : "bg-amber-400"}`}
						/>
						<p className="flex-1 text-sm">
							{t(`admissions.documents.items.${doc.key}`)}
						</p>
						<Badge
							variant={doc.required ? "outline" : "secondary"}
							className="shrink-0 text-xs"
						>
							{doc.required
								? t("admissions.documents.required")
								: t("admissions.documents.recommended")}
						</Badge>
					</div>
				))}
			</div>
			<div className="rounded-lg bg-muted/50 p-3 text-muted-foreground text-sm">
				💡 Ces pièces seront demandées lors du dépôt physique de votre dossier.
			</div>
		</div>
	);
}
