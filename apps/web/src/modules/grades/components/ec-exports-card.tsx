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
import type { ExportClassCourse } from "../types";
import { BusyIcon } from "./export-ui";

/**
 * One row per class_course of the selected class. Eligibility (sum of
 * percentages = 100%) is enforced server-side. If you see "EC weights total
 * X%, expected 100%", finish wiring the EC's exams in /admin/exam-scheduler.
 */
export function EcExportsCard({
	classCourses,
	exporting,
	disabled,
	onPreview,
	onGenerate,
}: {
	classCourses: ExportClassCourse[];
	exporting: string | null;
	disabled: boolean;
	onPreview: (classCourseId: string) => void;
	onGenerate: (classCourseId: string) => void;
}) {
	return (
		<Card>
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<div>
						<CardTitle className="text-base">
							Par EC{" "}
							<Badge variant="secondary" className="ml-1">
								{classCourses.length}
							</Badge>
						</CardTitle>
						<CardDescription className="mt-1">
							Publication PDF par Élément Constitutif — agrège toutes les
							évaluations (CC + TP + Examen) avec moyenne EC. Nécessite que la
							somme des pondérations des examens de l&apos;EC soit à 100%.
						</CardDescription>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead className="bg-muted/40">
							<tr>
								<th className="px-4 py-2 text-left font-medium">Code</th>
								<th className="px-4 py-2 text-left font-medium">Intitulé</th>
								<th className="px-4 py-2 text-right font-medium">Coef.</th>
								<th className="px-4 py-2 text-right font-medium">Actions</th>
							</tr>
						</thead>
						<tbody className="divide-y">
							{classCourses.map((cc) => (
								<tr key={cc.id} className="hover:bg-muted/30">
									<td className="px-4 py-2 font-mono text-muted-foreground text-xs">
										{cc.code}
									</td>
									<td className="px-4 py-2">
										<span className="font-medium">{cc.name}</span>
									</td>
									<td className="px-4 py-2 text-right text-muted-foreground">
										{cc.coefficient}
									</td>
									<td className="px-4 py-2 text-right">
										<div className="flex justify-end gap-1">
											<Button
												type="button"
												variant="outline"
												size="sm"
												disabled={disabled}
												onClick={() => onPreview(cc.id)}
											>
												<BusyIcon
													busy={exporting === `preview-ec-${cc.id}`}
													icon={Eye}
													className="h-3 w-3"
												/>
											</Button>
											<Button
												type="button"
												size="sm"
												disabled={disabled}
												onClick={() => onGenerate(cc.id)}
											>
												<BusyIcon
													busy={exporting === `generate-ec-${cc.id}`}
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
