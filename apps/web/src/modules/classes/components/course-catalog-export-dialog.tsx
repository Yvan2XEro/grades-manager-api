import { FileDown } from "lucide-react";
import { useState } from "react";
import { createCallable } from "react-call";
import { useMutationFlow } from "react-call/mutation-flow";
import { useTranslation } from "react-i18next";
import {
	CallableDialog,
	DIALOG_EXIT_MS,
} from "@/components/callable/callable-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";
import { useClassOptions } from "../hooks/use-class-options";

// ── Course catalogue PDF export ────────────────────────────────────────────

/** Exports the UE/EC catalogue as PDF for the filtered year or chosen classes. */
export const CourseCatalogExportDialog = createCallable<
	{ academicYearId?: string | null },
	boolean
>(({ call, academicYearId }) => {
	const { t } = useTranslation();
	const [scope, setScope] = useState<"year" | "selection">("year");
	const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
	const classes = useClassOptions("");

	const exportPdf = useMutationFlow(call, async (call) => {
		try {
			const result = await trpcClient.exports.generateCourseCatalog.mutate({
				classIds: scope === "selection" ? selectedClassIds : [],
				academicYearId:
					scope === "year" && academicYearId ? academicYearId : undefined,
				format: "pdf",
			});
			const bytes = atob(result.data as string);
			const arr = new Uint8Array(bytes.length);
			for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
			const blob = new Blob([arr], { type: "application/pdf" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = result.filename;
			a.click();
			URL.revokeObjectURL(url);
			toast.success(
				t("admin.classCourses.export.success", {
					defaultValue: "Catalogue exporté avec succès",
				}),
			);
			call.end(true);
		} catch {
			toast.error(
				t("admin.classCourses.export.error", {
					defaultValue: "Erreur lors de l'export PDF",
				}),
			);
		}
	});

	return (
		<CallableDialog
			call={call}
			dismissValue={false}
			preventDismiss={exportPdf.pending}
			title={t("admin.classCourses.export.title", {
				defaultValue: "Exporter le catalogue UE / EC",
			})}
		>
			<div className="space-y-4">
				<div className="space-y-1.5">
					<Label>
						{t("admin.classCourses.export.scopeLabel", {
							defaultValue: "Périmètre",
						})}
					</Label>
					<Select
						value={scope}
						onValueChange={(v) => setScope(v as "year" | "selection")}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="year">
								{t("admin.classCourses.export.scopeYear", {
									defaultValue: "Toutes les classes de l'année filtrée",
								})}
								{!academicYearId &&
									` (${t("admin.classCourses.export.noYearWarning", { defaultValue: "aucune année sélectionnée" })})`}
							</SelectItem>
							<SelectItem value="selection">
								{t("admin.classCourses.export.scopeSelection", {
									defaultValue: "Classes spécifiques",
								})}
							</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{scope === "selection" && (
					<div className="space-y-1.5">
						<Label>
							{t("admin.classCourses.export.classesLabel", {
								defaultValue: "Classes à inclure",
							})}
						</Label>
						<div className="max-h-48 space-y-0.5 overflow-y-auto rounded border p-2">
							{classes.map((cls) => (
								<label
									key={cls.id}
									className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm hover:bg-muted"
								>
									<Checkbox
										checked={selectedClassIds.includes(cls.id)}
										onCheckedChange={(checked) =>
											setSelectedClassIds((prev) =>
												checked
													? [...prev, cls.id]
													: prev.filter((id) => id !== cls.id),
											)
										}
									/>
									<span className="flex-1">{cls.name}</span>
									<span className="text-muted-foreground text-xs">
										{cls.code}
									</span>
								</label>
							))}
						</div>
						{selectedClassIds.length > 0 && (
							<p className="text-muted-foreground text-xs">
								{selectedClassIds.length}{" "}
								{t("admin.classCourses.export.selectedCount", {
									defaultValue: "classe(s) sélectionnée(s)",
								})}
							</p>
						)}
					</div>
				)}

				<div className="flex justify-end gap-2">
					<Button
						variant="ghost"
						type="button"
						disabled={exportPdf.pending}
						onClick={() => call.end(false)}
					>
						{t("common.actions.cancel")}
					</Button>
					<Button
						type="button"
						disabled={
							exportPdf.pending ||
							(scope === "year" && !academicYearId) ||
							(scope === "selection" && selectedClassIds.length === 0)
						}
						onClick={() => exportPdf()}
					>
						{exportPdf.pending ? (
							<Spinner className="mr-2 h-4 w-4" />
						) : (
							<FileDown className="mr-2 h-4 w-4" />
						)}
						{t("admin.classCourses.export.generate", {
							defaultValue: "Générer le PDF",
						})}
					</Button>
				</div>
			</div>
		</CallableDialog>
	);
}, DIALOG_EXIT_MS);
