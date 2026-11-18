import { Download, Eye } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type { TeachingUnitItem } from "../types";
import { BusyIcon } from "./export-ui";

/** One row per teaching unit of the program: PDF preview and download. */
export function UeExportsCard({
	teachingUnits,
	exporting,
	disabled,
	onDownloadAll,
	onPreview,
	onGenerate,
}: {
	teachingUnits: TeachingUnitItem[];
	exporting: string | null;
	disabled: boolean;
	onDownloadAll: () => void;
	onPreview: (ueId: string) => void;
	onGenerate: (ueId: string) => void;
}) {
	const { t } = useTranslation();
	return (
		<Card>
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<div>
						<CardTitle className="text-base">
							{t("admin.gradeExport.ue.title")}{" "}
							<Badge variant="secondary" className="ml-1">
								{teachingUnits.length}
							</Badge>
						</CardTitle>
						<CardDescription className="mt-1">
							{t("admin.gradeExport.ue.description")}
						</CardDescription>
					</div>
					<Button
						type="button"
						size="sm"
						onClick={onDownloadAll}
						disabled={disabled}
					>
						<BusyIcon
							busy={exporting === "bulk-ues"}
							icon={Download}
							className="mr-1 h-3 w-3"
						/>
						{t("admin.gradeExport.downloadAll")}
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				<div className="overflow-hidden rounded-md border">
					<table className="w-full text-sm">
						<thead className="bg-muted/50">
							<tr>
								<th className="px-4 py-2 text-left font-medium">
									{t("admin.gradeExport.columns.code")}
								</th>
								<th className="px-4 py-2 text-left font-medium">
									{t("admin.gradeExport.columns.ueName")}
								</th>
								<th className="px-4 py-2 text-left font-medium">
									{t("admin.gradeExport.columns.credits")}
								</th>
								<th className="px-4 py-2 text-right font-medium">
									{t("common.table.actions")}
								</th>
							</tr>
						</thead>
						<tbody className="divide-y">
							{teachingUnits.map((ue) => (
								<tr key={ue.id} className="hover:bg-muted/30">
									<td className="px-4 py-2 font-mono text-xs">{ue.code}</td>
									<td className="px-4 py-2 font-medium">{ue.name}</td>
									<td className="px-4 py-2 text-muted-foreground">
										{t("admin.gradeExport.ue.creditsShort", {
											count: ue.credits,
										})}
									</td>
									<td className="px-4 py-2 text-right">
										<div className="flex justify-end gap-1">
											<Button
												type="button"
												variant="outline"
												size="sm"
												disabled={disabled}
												onClick={() => onPreview(ue.id)}
											>
												<BusyIcon
													busy={exporting === `preview-ue-${ue.id}`}
													icon={Eye}
													className="h-3 w-3"
												/>
											</Button>
											<Button
												type="button"
												size="sm"
												disabled={disabled}
												onClick={() => onGenerate(ue.id)}
											>
												<BusyIcon
													busy={exporting === `generate-ue-${ue.id}`}
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
