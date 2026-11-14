import { AlertCircle, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { ImportIssue } from "../types";

/** Row-level problems of the uploaded file, errors first. */
export function IssuesTable({ issues }: { issues: ImportIssue[] }) {
	const errors = issues.filter((i) => i.level === "error");
	const warnings = issues.filter((i) => i.level === "warning");
	const [level, setLevel] = useState<"error" | "warning">(
		errors.length ? "error" : "warning",
	);
	const shown = level === "error" ? errors : warnings;

	if (!issues.length) return null;
	return (
		<div className="flex min-h-64 flex-1 flex-col gap-3">
			<div className="flex gap-2">
				<Button
					size="sm"
					variant={level === "error" ? "default" : "outline"}
					onClick={() => setLevel("error")}
				>
					<AlertCircle className="mr-1.5 h-4 w-4" />
					Erreurs ({errors.length})
				</Button>
				<Button
					size="sm"
					variant={level === "warning" ? "default" : "outline"}
					onClick={() => setLevel("warning")}
				>
					<AlertTriangle className="mr-1.5 h-4 w-4" />
					Avertissements ({warnings.length})
				</Button>
			</div>
			<div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-32">Feuille</TableHead>
							<TableHead className="w-20">Ligne</TableHead>
							<TableHead className="w-44">Colonne</TableHead>
							<TableHead>Problème</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{shown.map((issue, index) => (
							<TableRow
								key={`${issue.sheet}-${issue.row}-${issue.column}-${index}`}
							>
								<TableCell>{issue.sheet}</TableCell>
								<TableCell className="tabular-nums">
									{issue.row || "—"}
								</TableCell>
								<TableCell>{issue.column ?? "—"}</TableCell>
								<TableCell
									className={
										level === "error"
											? "text-destructive"
											: "text-amber-700 dark:text-amber-400"
									}
								>
									{issue.message}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
