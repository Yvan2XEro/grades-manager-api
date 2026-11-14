import { format } from "date-fns";
import { Download, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type { ExamItem } from "../types";
import { BusyIcon } from "./export-ui";

/** One row per selected exam: Excel export, PDF preview and download. */
export function ExamExportsCard({
	exams,
	exporting,
	disabled,
	onDownloadAll,
	onExportExcel,
	onPreview,
	onGenerate,
}: {
	exams: ExamItem[];
	exporting: string | null;
	disabled: boolean;
	onDownloadAll: () => void;
	onExportExcel: (exam: ExamItem) => void;
	onPreview: (examId: string) => void;
	onGenerate: (examId: string) => void;
}) {
	return (
		<Card>
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<div>
						<CardTitle className="text-base">
							Par évaluation{" "}
							<Badge variant="secondary" className="ml-1">
								{exams.length}
							</Badge>
						</CardTitle>
						<CardDescription className="mt-1">
							Export individuel par évaluation sélectionnée
						</CardDescription>
					</div>
					<Button
						type="button"
						size="sm"
						onClick={onDownloadAll}
						disabled={disabled}
					>
						<BusyIcon
							busy={exporting === "bulk-evaluations"}
							icon={Download}
							className="mr-1 h-3 w-3"
						/>
						Tout télécharger PDF
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				<div className="overflow-hidden rounded-md border">
					<table className="w-full text-sm">
						<thead className="bg-muted/50">
							<tr>
								<th className="px-4 py-2 text-left font-medium">Cours</th>
								<th className="px-4 py-2 text-left font-medium">Type</th>
								<th className="px-4 py-2 text-left font-medium">Date</th>
								<th className="px-4 py-2 text-right font-medium">Excel</th>
								<th className="px-4 py-2 text-right font-medium">PDF</th>
							</tr>
						</thead>
						<tbody className="divide-y">
							{exams.map((exam) => (
								<tr key={exam.id} className="hover:bg-muted/30">
									<td className="px-4 py-2">
										<span className="font-medium">{exam.courseName}</span>
										{exam.courseCode && (
											<span className="ml-1 text-muted-foreground text-xs">
												({exam.courseCode})
											</span>
										)}
									</td>
									<td className="px-4 py-2 text-muted-foreground">
										{exam.type}
									</td>
									<td className="px-4 py-2 text-muted-foreground">
										{format(new Date(exam.date), "dd MMM yyyy")}
									</td>
									<td className="px-4 py-2 text-right">
										<Button
											type="button"
											variant="outline"
											size="sm"
											disabled={disabled}
											onClick={() => onExportExcel(exam)}
										>
											<BusyIcon
												busy={exporting === exam.id}
												icon={Download}
												className="h-3 w-3"
											/>
										</Button>
									</td>
									<td className="px-4 py-2 text-right">
										<div className="flex justify-end gap-1">
											<Button
												type="button"
												variant="outline"
												size="sm"
												disabled={disabled}
												onClick={() => onPreview(exam.id)}
											>
												<BusyIcon
													busy={exporting === `preview-eval-${exam.id}`}
													icon={Eye}
													className="h-3 w-3"
												/>
											</Button>
											<Button
												type="button"
												size="sm"
												disabled={disabled}
												onClick={() => onGenerate(exam.id)}
											>
												<BusyIcon
													busy={exporting === `generate-eval-${exam.id}`}
													icon={Download}
													className="h-3 w-3"
												/>
											</Button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</CardContent>
		</Card>
	);
}
