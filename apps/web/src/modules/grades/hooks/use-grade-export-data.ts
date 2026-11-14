import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";
import type {
	ExamItem,
	ExportClass,
	ExportClassCourse,
	TeachingUnitItem,
} from "../types";

interface GradeExportFilters {
	selectedYear: string;
	selectedClass: string;
	selectedSemester: string;
}

/** Everything the grade export page lists for the selected year / class / semester. */
export function useGradeExportData({
	selectedYear,
	selectedClass,
	selectedSemester,
}: GradeExportFilters) {
	const { t } = useTranslation();

	const { data: classes } = useQuery({
		queryKey: ["classes", selectedYear],
		queryFn: async () => {
			if (!selectedYear) return [];
			const [classRes, programRes] = await Promise.all([
				trpcClient.classes.list.query({ academicYearId: selectedYear }),
				trpcClient.programs.list.query({}),
			]);
			const programMap = new Map(
				programRes.items.map((p: { id: string; name: string }) => [
					p.id,
					p.name,
				]),
			);
			return classRes.items.map(
				(cls: { id: string; name: string; program: string }) => {
					const program = programMap.get(cls.program);
					return {
						id: cls.id,
						name: cls.name,
						program: { id: cls.program, name: program?.name ?? "" },
					};
				},
			) as ExportClass[];
		},
		enabled: !!selectedYear,
	});

	const { data: semesters = [] } = useQuery({
		queryKey: ["semesters"],
		queryFn: async () => {
			try {
				const result = await trpcClient.semesters.list.query({});
				return (result?.items || []) as { id: string; name: string }[];
			} catch (error) {
				console.error("Error fetching semesters:", error);
				toast.error(
					t("admin.gradeExport.toast.semestersFetchError", {
						defaultValue: "Could not load semesters",
					}),
				);
				return [];
			}
		},
	});

	const { data: academicYears } = useQuery({
		queryKey: ["academicYears"],
		queryFn: async () => {
			const { items } = await trpcClient.academicYears.list.query({});
			return items as Array<{ id: string; name: string }>;
		},
	});

	const { data: teachingUnits } = useQuery({
		queryKey: ["teachingUnits", selectedClass],
		queryFn: async () => {
			if (!selectedClass) return [];
			const classData = classes?.find((c) => c.id === selectedClass);
			if (!classData) return [];

			const programId = classData.program.id;
			if (!programId) return [];

			const { items: ues } = await trpcClient.teachingUnits.list.query({
				programId,
			});
			return ues as TeachingUnitItem[];
		},
		enabled: !!selectedClass && !!classes,
	});

	// EC list for the "Par EC" section — one entry per class_course attached
	// to the selected class. Used to render preview + generate buttons per EC.
	// Filtered by semester when one is selected so the user only sees the ECs
	// taught during that period.
	const { data: classCoursesList } = useQuery({
		queryKey: ["classCourses-export", selectedClass, selectedSemester],
		queryFn: async (): Promise<ExportClassCourse[]> => {
			if (!selectedClass) return [];
			const { items } = await trpcClient.classCourses.list.query({
				classId: selectedClass,
				...(selectedSemester ? { semesterId: selectedSemester } : {}),
				limit: 500,
			});
			// Reshape to a UI-friendly tuple. The repo flattens its joins —
			// the `list` output exposes `courseCode`/`courseName` (NOT a
			// nested `courseRef`), so reading from `courseRef.code` was
			// silently returning undefined and rendering "—" everywhere.
			return (items as Array<unknown>).map((raw) => {
				const cc = raw as {
					id: string;
					coefficient: string | number | null;
					courseCode?: string;
					courseName?: string;
				};
				return {
					id: cc.id,
					coefficient: Number(cc.coefficient ?? 1),
					code: cc.courseCode ?? "—",
					name: cc.courseName ?? "—",
				};
			});
		},
		enabled: !!selectedClass,
	});

	const { data: exportConfig } = useQuery({
		queryKey: ["exportConfig"],
		queryFn: () => trpcClient.exports.getConfig.query(),
	});

	const {
		data: exams,
		isLoading: examsLoading,
		isFetching: examsFetching,
	} = useQuery({
		queryKey: ["exams", selectedClass],
		queryFn: async (): Promise<ExamItem[]> => {
			if (!selectedClass) return [];
			// Single batched call — exams.list returns courseName/courseCode joined.
			const { items } = await trpcClient.exams.list.query({
				classId: selectedClass,
				limit: 500,
			});
			const result: ExamItem[] = items.map((exam: any) => ({
				id: exam.id,
				name: exam.name,
				type: exam.type,
				date: exam.date,
				percentage: Number(exam.percentage),
				courseName: exam.courseName ?? "",
				courseCode: exam.courseCode ?? null,
				classCourseCode: exam.classCourseCode ?? null,
				sessionType: exam.sessionType || "normal",
				parentExamId: exam.parentExamId || null,
				scoringPolicy: exam.scoringPolicy || "replace",
			}));
			return result.sort((a, b) => a.courseName.localeCompare(b.courseName));
		},
		enabled: !!selectedClass,
	});

	return {
		classes,
		semesters,
		academicYears,
		teachingUnits,
		classCoursesList,
		exportConfig,
		exams,
		examsLoading: examsLoading || examsFetching,
	};
}

export type GradeExportData = ReturnType<typeof useGradeExportData>;
