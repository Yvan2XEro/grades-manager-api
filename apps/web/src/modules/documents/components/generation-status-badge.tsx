import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type GenerationState =
	| { state: "pending" }
	| { state: "running" }
	| { state: "ok" }
	| { state: "error"; error: string };

/** Per-row status of a batch generation/export (pending, running, ok, error). */
export function GenerationStatusBadge({
	status,
}: {
	status: GenerationState | undefined;
}) {
	if (!status) return <span className="text-muted-foreground text-xs">—</span>;
	switch (status.state) {
		case "pending":
			return <Badge variant="secondary">En attente</Badge>;
		case "running":
			return (
				<Badge variant="secondary">
					<Loader2 className="mr-1 h-3 w-3 animate-spin" />
					Génération
				</Badge>
			);
		case "ok":
			return (
				<Badge className="bg-emerald-600">
					<CheckCircle2 className="mr-1 h-3 w-3" />
					OK
				</Badge>
			);
		case "error":
			return (
				<Badge variant="destructive" title={status.error}>
					<AlertCircle className="mr-1 h-3 w-3" />
					Échec
				</Badge>
			);
	}
}
