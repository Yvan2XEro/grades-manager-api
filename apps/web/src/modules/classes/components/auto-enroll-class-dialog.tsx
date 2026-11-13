import { useQueryClient } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { useState } from "react";
import { createCallable } from "react-call";
import { useMutationFlow } from "react-call/mutation-flow";
import { useTranslation } from "react-i18next";
import {
	CallableDialog,
	DIALOG_EXIT_MS,
} from "@/components/callable/callable-dialog";
import { CodedEntitySelect } from "@/components/forms";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";
import { useClassOptions, useProgramNames } from "../hooks/use-class-options";

// ── Auto-enrollment ────────────────────────────────────────────────────────

/** Enrolls every student of a class in its assigned courses for a year. */
export const AutoEnrollClassDialog = createCallable<void, boolean>(
	({ call }) => {
		const { t } = useTranslation();
		const queryClient = useQueryClient();
		const [classSearch, setClassSearch] = useState("");
		const [classId, setClassId] = useState("");
		const [academicYearId, setAcademicYearId] = useState<string | null>(null);

		const classes = useClassOptions(classSearch);
		const programMap = useProgramNames();

		const enroll = useMutationFlow(call, async (call) => {
			if (!classId || !academicYearId) return;
			try {
				const result =
					await trpcClient.studentCourseEnrollments.autoEnrollClass.mutate({
						classId,
						academicYearId,
					});
				queryClient.invalidateQueries({
					queryKey: ["studentCourseEnrollments"],
				});
				toast.success(
					t("admin.classCourses.toast.autoEnrollSuccess", {
						defaultValue: "{{count}} inscription(s) créée(s)",
						count: result.createdCount,
					}),
				);
				call.end(true);
			} catch (error) {
				const message =
					error instanceof Error && error.message
						? error.message
						: t("admin.classCourses.toast.autoEnrollError", {
								defaultValue: "Erreur lors de l'inscription automatique",
							});
				toast.error(message);
			}
		});

		return (
			<CallableDialog
				call={call}
				dismissValue={false}
				preventDismiss={enroll.pending}
				title={t("admin.classCourses.autoEnroll.title", {
					defaultValue: "Inscrire automatiquement les étudiants",
				})}
			>
				<div className="space-y-4">
					<p className="text-muted-foreground text-sm">
						{t("admin.classCourses.autoEnroll.description", {
							defaultValue:
								"Inscrit automatiquement tous les étudiants inscrits dans la classe aux cours qui leur sont assignés pour l'année académique choisie.",
						})}
					</p>

					<div>
						<label className="mb-2 block font-medium text-sm">
							{t("admin.classCourses.autoEnroll.classLabel", {
								defaultValue: "Classe",
							})}
						</label>
						<CodedEntitySelect
							items={classes}
							onSearch={setClassSearch}
							value={classes.find((c) => c.id === classId)?.code || null}
							onChange={(code) => {
								const cls = classes.find((c) => c.code === code);
								setClassId(cls?.id || "");
							}}
							placeholder={t("admin.classCourses.autoEnroll.classPlaceholder", {
								defaultValue: "Sélectionner une classe",
							})}
							searchMode="hybrid"
							getItemSubtitle={(cls) => programMap.get(cls.program)?.name ?? ""}
						/>
					</div>

					<div>
						<label className="mb-2 block font-medium text-sm">
							{t("admin.classCourses.autoEnroll.yearLabel", {
								defaultValue: "Année académique",
							})}
						</label>
						<AcademicYearSelect
							value={academicYearId}
							onChange={setAcademicYearId}
						/>
					</div>

					<div className="flex justify-end gap-2">
						<Button
							variant="outline"
							onClick={() => call.end(false)}
							disabled={enroll.pending}
						>
							{t("common.actions.cancel")}
						</Button>
						<Button
							onClick={() => enroll()}
							disabled={!classId || !academicYearId || enroll.pending}
						>
							{enroll.pending ? (
								<Spinner className="mr-2 h-4 w-4" />
							) : (
								<Users className="mr-2 h-4 w-4" />
							)}
							{t("admin.classCourses.autoEnroll.submit", {
								defaultValue: "Inscrire les étudiants",
							})}
						</Button>
					</div>
				</div>
			</CallableDialog>
		);
	},
	DIALOG_EXIT_MS,
);
