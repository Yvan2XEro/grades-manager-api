import { CheckSquare2, Loader2, Square } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { CreateDeliberationState } from "../hooks/use-create-deliberation";

/** Multi-class tab: checkbox list of the year's classes and the batch progress. */
export function CreateDeliberationClassPicker({
	state: {
		fields,
		classesQuery,
		allClasses,
		selectedClassIds,
		toggleClass,
		toggleAll,
		batchProgress,
	},
}: {
	state: CreateDeliberationState;
}) {
	const { t } = useTranslation();
	const allSelected = selectedClassIds.length === allClasses.length;

	return (
		<div className="space-y-2">
			<Label>
				{t("admin.deliberations.form.classes", {
					defaultValue: "Classes",
				})}
			</Label>
			{!fields.academicYearId ? (
				<p className="rounded-lg border border-dashed py-5 text-center text-muted-foreground text-sm">
					{t("admin.deliberations.form.selectYearFirst", {
						defaultValue: "Sélectionnez d'abord une année académique",
					})}
				</p>
			) : classesQuery.isLoading ? (
				<div className="flex items-center justify-center py-5">
					<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
				</div>
			) : allClasses.length === 0 ? (
				<p className="rounded-lg border border-dashed py-5 text-center text-muted-foreground text-sm">
					{t("admin.deliberations.form.noClasses", {
						defaultValue: "Aucune classe pour cette année",
					})}
				</p>
			) : (
				<>
					<div className="flex items-center justify-between pb-1">
						<button
							type="button"
							onClick={toggleAll}
							className="flex items-center gap-1.5 text-primary text-sm hover:underline"
						>
							{allSelected ? (
								<CheckSquare2 className="h-4 w-4" />
							) : (
								<Square className="h-4 w-4" />
							)}
							{allSelected
								? t("common.actions.deselectAll", {
										defaultValue: "Tout désélectionner",
									})
								: t("common.actions.selectAll", {
										defaultValue: "Tout sélectionner",
									})}
						</button>
						{selectedClassIds.length > 0 && (
							<Badge variant="secondary">
								{selectedClassIds.length} / {allClasses.length}
							</Badge>
						)}
					</div>
					<ScrollArea className="h-64 rounded-md border">
						<div className="divide-y">
							{allClasses.map((cls) => (
								<label
									key={cls.id}
									className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-muted/50"
								>
									<Checkbox
										checked={selectedClassIds.includes(cls.id)}
										onCheckedChange={() => toggleClass(cls.id)}
									/>
									<span className="text-sm">{cls.name}</span>
								</label>
							))}
						</div>
					</ScrollArea>
					{batchProgress && (
						<div className="space-y-1.5 rounded-lg border bg-muted/30 p-3">
							<div className="flex items-center justify-between text-muted-foreground text-xs">
								<span>
									{batchProgress.done} / {batchProgress.total}
								</span>
								{batchProgress.errors.length > 0 && (
									<span className="text-destructive">
										{batchProgress.errors.length} erreur(s)
									</span>
								)}
							</div>
							<Progress
								value={(batchProgress.done / batchProgress.total) * 100}
							/>
							{batchProgress.errors.length > 0 && (
								<p className="text-destructive text-xs">
									Échecs : {batchProgress.errors.join(", ")}
								</p>
							)}
						</div>
					)}
				</>
			)}
		</div>
	);
}
