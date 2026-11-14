import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";

/** Teacher workflow: pick a class course, list its exams, submit them. */
export function useWorkflowManager() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [selectedClassCourse, setSelectedClassCourse] = useState<string>("");
	const [filterYear, setFilterYear] = useState<string | null>(null);
	const [filterSemester, setFilterSemester] = useState<string | null>(null);

	const { data: semestersData } = useQuery(
		trpc.semesters.list.queryOptions({}),
	);
	const filterUeSemester = useMemo(() => {
		if (!filterSemester || !semestersData) return undefined;
		const code =
			semestersData.items.find((s) => s.id === filterSemester)?.code ?? "";
		if (code === "S1") return "fall" as const;
		if (code === "S2") return "spring" as const;
		return "annual" as const;
	}, [filterSemester, semestersData]);

	const { data: classCourses } = useQuery(
		trpc.classCourses.list.queryOptions({
			limit: 200,
			...(filterYear ? { academicYearId: filterYear } : {}),
			...(filterUeSemester ? { ueSemester: filterUeSemester } : {}),
		}),
	);

	const examsQuery = useQuery({
		...trpc.exams.list.queryOptions({
			classCourseId: selectedClassCourse || undefined,
		}),
		enabled: Boolean(selectedClassCourse),
	});

	const submitExam = useMutation({
		mutationFn: (examId: string) => trpcClient.exams.submit.mutate({ examId }),
		onSuccess: () => {
			toast.success(
				t("teacher.workflow.toast.submitted", {
					defaultValue: "Exam submitted",
				}),
			);
			queryClient.invalidateQueries(
				trpc.exams.list.queryKey({
					classCourseId: selectedClassCourse || undefined,
				}),
			);
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const exams = useMemo(() => examsQuery.data?.items ?? [], [examsQuery.data]);

	return {
		filterYear,
		filterSemester,
		selectedClassCourse,
		classCourses: classCourses?.items ?? [],
		onYearChange: (v: string | null) => {
			setFilterYear(v);
			setSelectedClassCourse("");
		},
		onSemesterChange: (v: string | null) => {
			setFilterSemester(v);
			setSelectedClassCourse("");
		},
		onClassCourseChange: setSelectedClassCourse,
		examsQuery,
		exams,
		submitExam,
	};
}
