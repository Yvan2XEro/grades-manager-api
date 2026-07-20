import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { Spinner } from "@/components/ui/spinner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { trpc } from "@/utils/trpc";

export default function FeeStructureImpactTab() {
	const { id } = useParams<{ id: string }>();
	const { t } = useTranslation();

	const { data, isLoading } = useQuery(
		trpc.feeClearance.previewStructureImpact.queryOptions({
			feeStructureId: id!,
		}),
	);

	if (isLoading) {
		return (
			<div className="flex justify-center py-8">
				<Spinner />
			</div>
		);
	}

	if (!data) return null;

	return (
		<div className="space-y-4 pt-6">
			<div className="grid grid-cols-3 gap-3 rounded-md bg-muted/40 p-3 text-sm">
				<div>
					<p className="text-muted-foreground text-xs">
						{t("feeClearance.structures.impact.totalStudents", {
							defaultValue: "Étudiants dans le scope",
						})}
					</p>
					<p className="font-semibold text-lg">{data.totals.totalStudents}</p>
				</div>
				<div>
					<p className="text-muted-foreground text-xs">
						{t("feeClearance.structures.impact.toAssign", {
							defaultValue: "À assigner",
						})}
					</p>
					<p className="font-semibold text-emerald-600 text-lg">
						{data.totals.toAssign}
					</p>
				</div>
				<div>
					<p className="text-muted-foreground text-xs">
						{t("feeClearance.structures.impact.alreadyAssigned", {
							defaultValue: "Déjà assignés",
						})}
					</p>
					<p className="font-semibold text-lg text-muted-foreground">
						{data.totals.alreadyAssigned}
					</p>
				</div>
			</div>

			{data.classes.length === 0 ? (
				<p className="text-muted-foreground text-sm">
					{t("feeClearance.structures.impact.noClasses", {
						defaultValue:
							"Aucune classe ne correspond au scope de cette structure.",
					})}
				</p>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>
								{t("feeClearance.structures.impact.class", {
									defaultValue: "Classe",
								})}
							</TableHead>
							<TableHead className="text-right">
								{t("feeClearance.structures.impact.toAssign", {
									defaultValue: "À assigner",
								})}
							</TableHead>
							<TableHead className="text-right">
								{t("feeClearance.structures.impact.alreadyAssigned", {
									defaultValue: "Déjà assignés",
								})}
							</TableHead>
							<TableHead className="text-right">
								{t("common.total", { defaultValue: "Total" })}
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{data.classes.map((c) => (
							<TableRow key={c.classId}>
								<TableCell>
									<span className="font-medium">{c.className}</span>
									<span className="ml-1.5 text-muted-foreground text-xs">
										{c.classCode}
									</span>
								</TableCell>
								<TableCell className="text-right text-emerald-600">
									{c.toAssign}
								</TableCell>
								<TableCell className="text-right text-muted-foreground">
									{c.alreadyAssigned}
								</TableCell>
								<TableCell className="text-right">{c.totalStudents}</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}
		</div>
	);
}
