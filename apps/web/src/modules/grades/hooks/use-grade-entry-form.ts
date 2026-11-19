import type React from "react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { buildGradeChanges } from "../services/grade-changes";
import {
	exportGradeTemplate,
	readGradeImport,
} from "../services/grade-entry-excel";
import type { GradeEntryState } from "./use-grade-entry";
import { useSaveGrades } from "./use-grade-entry-mutations";

/**
 * Form of the selected exam (one `student_<id>` field per student), filled
 * from the saved grades, plus the Excel template export / import.
 */
export function useGradeEntryForm(entry: GradeEntryState) {
	const { t } = useTranslation();
	const {
		selectedExam,
		selectedExamInfo,
		inputsDisabled,
		gradeEntries,
		gradesFetching,
		gradesByStudent,
		rosterStudents,
		courseInfo,
	} = entry;

	const {
		register,
		handleSubmit,
		reset,
		getValues,
		formState: { errors, isDirty },
	} = useForm({ shouldUnregister: true, mode: "onTouched" });

	const saveGrades = useSaveGrades(selectedExam);

	useEffect(() => {
		if (!selectedExam || gradesFetching) {
			reset({});
			return;
		}
		const defaults: Record<string, number> = {};
		gradeEntries.forEach((grade) => {
			defaults[`student_${grade.student}`] = Number(grade.score);
		});
		reset(defaults);
	}, [selectedExam, gradeEntries, gradesFetching, reset]);

	// Closing or reloading the tab with unsaved grades asks for confirmation
	useEffect(() => {
		if (!isDirty) return;
		const warn = (event: BeforeUnloadEvent) => {
			event.preventDefault();
		};
		window.addEventListener("beforeunload", warn);
		return () => window.removeEventListener("beforeunload", warn);
	}, [isDirty]);

	const readOnlyToast = () =>
		toast.error(t("teacher.gradeEntry.delegates.readOnlyToast"));

	const handleExamChange = (examId: string) => {
		reset({});
		entry.setSelectedExam(examId);
	};

	const submitGrades = handleSubmit((formValues) => {
		if (!selectedExam || inputsDisabled) {
			readOnlyToast();
			return;
		}
		const { inserts, deletes } = buildGradeChanges(
			formValues as Record<string, string | number | undefined>,
			gradesByStudent,
			selectedExam,
		);
		if (!inserts.length && !deletes.length) {
			toast.info(t("teacher.gradeEntry.toast.noChanges"));
			return;
		}
		saveGrades.mutate({ inserts, deletes });
	});

	const handleExportTemplate = () => {
		if (!selectedExamInfo || !rosterStudents.length) {
			toast.error(t("teacher.gradeEntry.toast.exportError"));
			return;
		}
		exportGradeTemplate({
			students: rosterStudents,
			gradesByStudent,
			courseName: courseInfo?.course_name,
			examName: selectedExamInfo.name,
		});
		toast.success(t("teacher.gradeEntry.toast.exportSuccess"));
	};

	const handleImportGrades = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;
		if (inputsDisabled || !selectedExam) {
			readOnlyToast();
			event.target.value = "";
			return;
		}

		// The imported grades are saved right away: "imported" means stored,
		// a teacher who leaves the page afterwards must not lose them.
		readGradeImport(file, rosterStudents)
			.then(({ updates, skipped }) => {
				const values = { ...getValues(), ...updates };
				reset(values);
				const { inserts } = buildGradeChanges(
					updates,
					gradesByStudent,
					selectedExam,
				);
				if (inserts.length) saveGrades.mutate({ inserts, deletes: [] });
				const imported = Object.keys(updates).length;
				if (!imported && !skipped.length) {
					toast.error(t("teacher.gradeEntry.toast.importEmpty"));
					return;
				}
				if (skipped.length) {
					const shown = skipped.slice(0, 5).map((r) =>
						t(`teacher.gradeEntry.toast.importSkip.${r.reason}`, {
							row: r.row,
							label: r.label,
							value: r.value ?? "",
						}),
					);
					toast.warning(
						t("teacher.gradeEntry.toast.importPartial", {
							count: imported,
							skipped: skipped.length,
						}),
						{
							description:
								shown.join("\n") +
								(skipped.length > shown.length
									? `\n${t("teacher.gradeEntry.toast.importMore", { count: skipped.length - shown.length })}`
									: ""),
							duration: 15000,
						},
					);
				} else {
					toast.success(
						t("teacher.gradeEntry.toast.importSuccess", { count: imported }),
					);
				}
			})
			.catch(() => {
				toast.error(t("teacher.gradeEntry.toast.importError"));
			});
		event.target.value = "";
	};

	return {
		register,
		errors,
		submitGrades,
		isSaving: saveGrades.isPending,
		handleExamChange,
		handleExportTemplate,
		handleImportGrades,
	};
}
