import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
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

/** URL parameter of each filter. */
const FILTER_PARAMS: Record<keyof ExamFilters, string> = {
	searchTerm: "q",
	academicYearId: "year",
	classId: "class",
	semesterId: "semester",
	dateFrom: "from",
	dateTo: "to",
};

/**
 * Filters + pagination of the exams list; the active academic year is
 * preselected. Filters and page live in the URL, so coming back from the
 * grade entry of an exam finds the list as it was left.
 */
export function useExamFilters() {
	const [params, setParams] = useSearchParams();
	const filters: ExamFilters = {
		searchTerm: params.get(FILTER_PARAMS.searchTerm) ?? "",
		academicYearId: params.get(FILTER_PARAMS.academicYearId),
		classId: params.get(FILTER_PARAMS.classId),
		semesterId: params.get(FILTER_PARAMS.semesterId),
		dateFrom: params.get(FILTER_PARAMS.dateFrom),
		dateTo: params.get(FILTER_PARAMS.dateTo),
	};
	const page = Number(params.get("page")) || 1;
	const [pageSize, setPageSize] = useState(25);

	const update = (changes: Partial<Record<string, string | null>>) =>
		setParams(
			(prev) => {
				const next = new URLSearchParams(prev);
				for (const [key, value] of Object.entries(changes)) {
					if (value) next.set(key, value);
					else next.delete(key);
				}
				return next;
			},
			{ replace: true },
		);
	const setPage = (value: number) =>
		update({ page: value > 1 ? String(value) : null });

	const yearsQuery = useQuery({
		...trpc.academicYears.list.queryOptions({}),
	});
	const activeYearId = yearsQuery.data?.items.find((y) => y.isActive)?.id;
	useEffect(() => {
		if (!filters.academicYearId && activeYearId) {
			update({ [FILTER_PARAMS.academicYearId]: activeYearId, page: null });
		}
	}, [activeYearId, filters.academicYearId]);

	const setFilter = <K extends keyof ExamFilters>(
		key: K,
		value: ExamFilters[K],
	) => update({ [FILTER_PARAMS[key]]: value || null, page: null });

	const reset = () =>
		update({
			...Object.fromEntries(
				Object.values(FILTER_PARAMS).map((param) => [param, null]),
			),
			page: null,
		});

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

	useQuery({ ...trpc.semesters.list.queryOptions() });
	const { data: classCourses } = useQuery({
		queryKey: examFormKeys.classCourses,
		queryFn: fetchExamClassCourses,
	});
	const { data: classes } = useQuery({
		...trpc.classes.list.queryOptions({}),
		select: (data) => data.items as { id: string; name: string }[],
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
	queryClient.invalidateQueries(trpc.exams.listPaged.queryFilter());

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
			toast.success(t("common.bulkActions.deleteSuccess"));
		},
		onError: () => toast.error(t("common.bulkActions.deleteError")),
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
