import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";
import type { ExamRow } from "../types";
import { examFormKeys, fetchExamClassCourses } from "./use-exam-form";

export interface ExamFilters {
	searchTerm: string;
	academicYearId: string | null;
	classId: string | null;
	semesterId: string | null;
	/** `YYYY-MM-DD` from the date picker. */
	dateFrom: string | null;
	dateTo: string | null;
}

const EMPTY_FILTERS: ExamFilters = {
	searchTerm: "",
	academicYearId: null,
	classId: null,
	semesterId: null,
	dateFrom: null,
	dateTo: null,
};

/** Filters + pagination of the exams list; the active academic year is preselected. */
export function useExamFilters() {
	const [filters, setFilters] = useState<ExamFilters>(EMPTY_FILTERS);
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);

	const yearsQuery = useQuery({
		...trpc.academicYears.list.queryOptions({}),
	});
	useEffect(() => {
		if (!filters.academicYearId && yearsQuery.data?.items) {
			const active = yearsQuery.data.items.find((y) => y.isActive);
			if (active) {
				setFilters((prev) => ({ ...prev, academicYearId: active.id }));
				setPage(1);
			}
		}
	}, [yearsQuery.data, filters.academicYearId]);

	const setFilter = <K extends keyof ExamFilters>(
		key: K,
		value: ExamFilters[K],
	) => {
		setFilters((prev) => ({ ...prev, [key]: value }));
		setPage(1);
	};

	const reset = () => {
		setFilters(EMPTY_FILTERS);
		setPage(1);
	};

	return {
		filters,
		setFilter,
		reset,
		page,
		setPage,
		pageSize,
		setPageSize: (size: number) => {
			setPageSize(size);
			setPage(1);
		},
		yearsLoading: yearsQuery.isLoading,
	};
}

/** Page of exams + the class / course lookups used to resolve their labels. */
export function useExams({
	filters,
	page,
	pageSize,
	yearsLoading,
}: {
	filters: ExamFilters;
	page: number;
	pageSize: number;
	yearsLoading: boolean;
}) {
	const { academicYearId, searchTerm, classId, dateFrom, dateTo } = filters;
	const { data, isLoading } = useQuery(
		trpc.exams.listPaged.queryOptions(
			{
				page,
				pageSize,
				academicYearId: academicYearId ?? undefined,
				query: searchTerm.trim() ? searchTerm.trim() : undefined,
				classId: classId ?? undefined,
				dateFrom: dateFrom ?? undefined,
				dateTo: dateTo ?? undefined,
			},
			{ enabled: Boolean(academicYearId) },
		),
	);
	const exams: ExamRow[] = (data?.items ?? []).map((exam) => ({
		...exam,
		percentage: Number(exam.percentage),
	}));

	useQuery({ ...trpc.semesters.list.queryOptions({}) });
	const { data: classCourses } = useQuery({
		queryKey: examFormKeys.classCourses,
		queryFn: fetchExamClassCourses,
	});
	const { data: classes } = useQuery({
		queryKey: ["classes"],
		queryFn: async () => {
			const { items } = await trpcClient.classes.list.query({});
			return items as { id: string; name: string }[];
		},
	});
	const { data: courses } = useQuery({
		queryKey: ["courses"],
		queryFn: async () => {
			const { items } = await trpcClient.courses.list.query({});
			return items as { id: string; name: string }[];
		},
	});

	const classMap = new Map((classes ?? []).map((c) => [c.id, c.name]));
	const courseMap = new Map((courses ?? []).map((c) => [c.id, c.name]));
	const classCourseMap = new Map((classCourses ?? []).map((cc) => [cc.id, cc]));

	/** Course and class labels of an exam, falling back on the lookups. */
	const resolveLabels = (exam: ExamRow, notAvailable: string) => {
		const classCourse = classCourseMap.get(exam.classCourse);
		return {
			course:
				exam.courseName ??
				(classCourse ? courseMap.get(classCourse.course) : null) ??
				notAvailable,
			class:
				exam.className ??
				(classCourse ? classMap.get(classCourse.class) : null) ??
				notAvailable,
		};
	};

	return {
		data,
		exams,
		isLoading: isLoading || (!academicYearId && yearsLoading),
		resolveLabels,
	};
}

const errorMessage = (error: unknown, fallback: string) =>
	error instanceof Error && error.message ? error.message : fallback;

const invalidateExams = (queryClient: ReturnType<typeof useQueryClient>) =>
	queryClient.invalidateQueries(trpc.exams.listPaged.queryKey());

/** Delete / bulk delete / submit / approve mutations of the exams list. */
export function useExamMutations(onBulkDeleted: () => void) {
	const queryClient = useQueryClient();
	const { t } = useTranslation();

	const deleteExam = useMutation({
		mutationFn: async (id: string) => {
			await trpcClient.exams.delete.mutate({ id });
		},
		onSuccess: () => {
			invalidateExams(queryClient);
			toast.success(t("admin.exams.toast.deleteSuccess"));
		},
		onError: (error: unknown) =>
			toast.error(errorMessage(error, t("admin.exams.toast.deleteError"))),
	});

	const bulkDelete = useMutation({
		mutationFn: async (ids: string[]) => {
			await Promise.all(
				ids.map((id) => trpcClient.exams.delete.mutate({ id })),
			);
		},
		onSuccess: () => {
			invalidateExams(queryClient);
			onBulkDeleted();
			toast.success(
				t("common.bulkActions.deleteSuccess", {
					defaultValue: "Items deleted successfully",
				}),
			);
		},
		onError: () =>
			toast.error(
				t("common.bulkActions.deleteError", {
					defaultValue: "Failed to delete items",
				}),
			),
	});

	const submitExam = useMutation({
		mutationFn: async (examId: string) => {
			await trpcClient.exams.submit.mutate({ examId });
		},
		onSuccess: () => {
			invalidateExams(queryClient);
			toast.success(t("admin.exams.toast.submitSuccess"));
		},
		onError: (error: unknown) =>
			toast.error(errorMessage(error, t("admin.exams.toast.submitError"))),
	});

	const validateExam = useMutation({
		mutationFn: async (input: {
			examId: string;
			status: "approved" | "rejected";
			rejectionReason?: string;
		}) => {
			await trpcClient.exams.validate.mutate(input);
		},
		onSuccess: (_, variables) => {
			invalidateExams(queryClient);
			toast.success(
				variables.status === "approved"
					? t("admin.exams.toast.approveSuccess")
					: t("admin.exams.toast.rejectSuccess"),
			);
		},
		onError: (error: unknown) =>
			toast.error(errorMessage(error, t("admin.exams.toast.validateError"))),
	});

	return { deleteExam, bulkDelete, submitExam, validateExam };
}

/** A retake can be created for an approved normal exam that has none yet. */
export const canCreateRetake = (exam: ExamRow, exams: ExamRow[]) =>
	exam.sessionType !== "retake" &&
	exam.status === "approved" &&
	!exams.some((e) => e.parentExamId === exam.id);
