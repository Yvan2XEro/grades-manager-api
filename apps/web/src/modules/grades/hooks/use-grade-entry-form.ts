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
		formState: { errors },
	} = useForm({ shouldUnregister: true });

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

	const readOnlyToast = () =>
		toast.error(
			t("teacher.gradeEntry.delegates.readOnlyToast", {
				defaultValue: "You cannot edit this exam.",
			}),
		);

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
		if (!inserts.length && !deletes.length) return;
		saveGrades.mutate({ inserts, deletes });
	});

	const handleExportTemplate = () => {
		if (!selectedExamInfo || !rosterStudents.length) {
			toast.error(
				t("teacher.gradeEntry.toast.exportError", {
					defaultValue: "Please select an exam with students",
				}),
			);
			return;
		}
		exportGradeTemplate({
			students: rosterStudents,
			gradesByStudent,
			courseName: courseInfo?.course_name,
			examName: selectedExamInfo.name,
		});
		toast.success(
			t("teacher.gradeEntry.toast.exportSuccess", {
				defaultValue: "Template exported successfully",
			}),
		);
	};

	const handleImportGrades = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;
		if (inputsDisabled || !selectedExam) {
			readOnlyToast();
			event.target.value = "";
			return;
		}

		readGradeImport(file, rosterStudents)
			.then(({ updates, importedCount }) => {
				reset(updates);
				toast.success(
					t("teacher.gradeEntry.toast.importSuccess", {
						defaultValue: "Imported {{count}} grades successfully",
						count: importedCount,
					}),
				);
			})
			.catch(() => {
				toast.error(
					t("teacher.gradeEntry.toast.importError", {
						defaultValue: "Failed to import grades",
					}),
				);
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
