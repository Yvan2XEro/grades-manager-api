import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { useBulkDocumentGeneration } from "../hooks/use-bulk-document-generation";
import { GenerationStatusBadge } from "./generation-status-badge";

type State = ReturnType<typeof useBulkDocumentGeneration>;

/** Students of the class with a checkbox, their generation status and a preview button. */
export function BulkDocumentStudentsTable({ state }: { state: State }) {
	const {
		studentItems,
		allSelected,
		toggleAll,
		selectedIds,
		toggleOne,
		genStatus,
		previewOne,
	} = state;
	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead className="w-10">
						<Checkbox
							checked={allSelected}
							onCheckedChange={toggleAll}
							aria-label="Tout sélectionner"
						/>
					</TableHead>
					<TableHead>Matricule</TableHead>
					<TableHead>Nom</TableHead>
					<TableHead>Prénom(s)</TableHead>
					<TableHead className="w-32">Statut</TableHead>
					<TableHead className="w-12 text-right">Aperçu</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{studentItems.map((s) => {
					const status = genStatus[s.id];
					return (
						<TableRow key={s.id}>
							<TableCell>
								<Checkbox
									checked={selectedIds.has(s.id)}
									onCheckedChange={() => toggleOne(s.id)}
									aria-label={`Sélectionner ${s.profile.firstName}`}
								/>
							</TableCell>
							<TableCell className="font-mono text-xs">
								{s.registrationNumber}
							</TableCell>
							<TableCell>{s.profile.lastName}</TableCell>
							<TableCell>{s.profile.firstName}</TableCell>
							<TableCell>
								<GenerationStatusBadge status={status} />
							</TableCell>
							<TableCell className="text-right">
								<Button
									variant="ghost"
									size="sm"
									onClick={() => previewOne.mutate(s.id)}
									disabled={previewOne.isPending}
									title={`Aperçu pour ${s.profile.firstName} ${s.profile.lastName}`}
								>
									{previewOne.isPending && previewOne.variables === s.id ? (
										<Spinner className="h-4 w-4" />
									) : (
										<Eye className="h-4 w-4" />
									)}
								</Button>
							</TableCell>
						</TableRow>
					);
				})}
			</TableBody>
		</Table>
	);
}
