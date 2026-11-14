import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";
import type { EligibilityRow } from "../types";

/** Year / semester / exam selection of the retake eligibility page. */
export function useRetakeExamSelection() {
	const [academicYearId, setAcademicYearIdState] = useState<string | null>(
		null,
	);
	const [semesterId, setSemesterIdState] = useState<string | null>(null);
	const [examId, setExamId] = useState<string | null>(null);

	const { data: semestersData } = useQuery(
		trpc.semesters.list.queryOptions({}),
	);
	const ueSemester = useMemo(() => {
		if (!semesterId || !semestersData) return undefined;
		const code =
			semestersData.items.find((s) => s.id === semesterId)?.code ?? "";
		if (code === "S1") return "fall" as const;
		if (code === "S2") return "spring" as const;
		return "annual" as const;
	}, [semesterId, semestersData]);

	// Approved exams of the selected academic year
	const examsQuery = useQuery({
		...trpc.exams.list.queryOptions({
			academicYearId: academicYearId ?? undefined,
			...(ueSemester ? { ueSemester } : {}),
			limit: 100,
		}),
		enabled: Boolean(academicYearId),
		select: (data) => data.items.filter((exam) => exam.status === "approved"),
	});

	return {
		academicYearId,
		setAcademicYearId: (id: string | null) => {
			setAcademicYearIdState(id);
			setExamId(null);
		},
		semesterId,
		setSemesterId: (id: string | null) => {
			setSemesterIdState(id);
			setExamId(null);
		},
		examId,
		setExamId,
		exams: examsQuery.data ?? [],
		examsLoading: examsQuery.isLoading,
		selectedExam: examsQuery.data?.find((e) => e.id === examId),
	};
}

export type RetakeExamSelection = ReturnType<typeof useRetakeExamSelection>;

/** Retake eligibility of an exam's students, split and searchable. */
export function useRetakeEligibility(examId: string | null, search: string) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	const eligibilityQuery = useQuery({
		queryKey: ["retakeEligibility", examId],
		queryFn: async () => {
			if (!examId) return null;
			return trpcClient.exams.listRetakeEligibility.query({ examId });
		},
		enabled: Boolean(examId),
	});

	const deleteOverride = useMutation({
		mutationFn: async (input: {
			examId: string;
			studentCourseEnrollmentId: string;
		}) => {
			return trpcClient.exams.deleteRetakeOverride.mutate(input);
		},
		onSuccess: () => {
			toast.success(t("admin.retake.toast.removeSuccess"));
			queryClient.invalidateQueries({
				queryKey: ["retakeEligibility", examId],
			});
		},
		onError: (error: Error) => {
			toast.error(error.message || t("admin.retake.toast.removeError"));
		},
	});

	const items = (
		(eligibilityQuery.data?.items ?? []) as Omit<EligibilityRow, "id">[]
	).map((row) => ({ ...row, id: row.studentCourseEnrollmentId }));

	const needle = search.trim().toLowerCase();
	const matchesSearch = (r: EligibilityRow) =>
		!needle ||
		r.studentName.toLowerCase().includes(needle) ||
		r.registrationNumber.toLowerCase().includes(needle);

	return {
		isLoading: eligibilityQuery.isLoading,
		isFeatureEnabled: eligibilityQuery.data?.enabled ?? false,
		items,
		eligible: items.filter((r) => r.status === "eligible" && matchesSearch(r)),
		ineligible: items.filter(
			(r) => r.status === "ineligible" && matchesSearch(r),
		),
		deleteOverride,
	};
}
