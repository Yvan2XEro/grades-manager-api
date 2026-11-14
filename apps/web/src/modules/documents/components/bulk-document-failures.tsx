import { AlertCircle, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { useBulkDocumentGeneration } from "../hooks/use-bulk-document-generation";

type State = ReturnType<typeof useBulkDocumentGeneration>;

/** Students whose document failed, with the error. */
export function BulkDocumentFailures({ state }: { state: State }) {
	const { summary, genStatus, studentItems } = state;
	return (
		<Card className="border-destructive/40">
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-destructive">
					<AlertCircle className="h-5 w-5" />
					{summary.error} échec(s)
				</CardTitle>
			</CardHeader>
			<CardContent>
				<ul className="space-y-1 text-sm">
					{Object.entries(genStatus)
						.filter(([, s]) => s.state === "error")
						.map(([id, s]) => {
							const student = studentItems.find((x) => x.id === id);
							return (
								<li key={id} className="flex items-start gap-2">
									<FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />
									<div>
										<div className="font-medium">
											{student?.profile.lastName} {student?.profile.firstName}{" "}
											<span className="font-mono text-muted-foreground text-xs">
												({student?.registrationNumber})
											</span>
										</div>
										<div className="text-destructive text-xs">
											{(s as { error: string }).error}
										</div>
									</div>
								</li>
							);
						})}
				</ul>
			</CardContent>
		</Card>
	);
}
