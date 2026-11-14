import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { upsertInList } from "@/lib/query-cache";
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";
import type { ExamType, Semester } from "@/utils/type";
import { ExamTypeFormDialog } from "../components/exam-type-form-dialog";
import type {
	PreviewClass,
	SchedulerRetakeExam,
	SchedulerRunDetails,
	ScoringPolicy,
	SessionMode,
} from "../types";
import { useSelectAllOnLoad } from "./use-select-all-on-load";

const HISTORY_KEY = ["examSchedulerHistory"];
const EXAM_TYPES_KEY = ["examTypes", "all"];

/** Last scheduler runs. */
export function useSchedulerHistory() {
	const query = useQuery({
		queryKey: HISTORY_KEY,
		queryFn: () => trpcClient.examScheduler.history.query({ limit: 20 }),
	});
	return { items: query.data?.items ?? [], isLoading: query.isLoading };
}

/** Exams created by one scheduler run. */
export function useSchedulerRunDetails(runId: string) {
	const query = useQuery({
		queryKey: ["examSchedulerRunDetails", runId],
		enabled: Boolean(runId),
		queryFn: async () => {
			if (!runId) return null;
			return trpcClient.examScheduler.details.query({ runId });
		},
	});
	return {
		details: query.data as SchedulerRunDetails | null,
		isLoading: query.isLoading,
	};
}

/**
 * State, previews and mutations of the "schedule exams" dialog, for both a
 * normal session (one exam per class course of the selected classes) and a
 * retake session (one retake per selected exam).
 */
export function useScheduleExams(mode: SessionMode, onDone: () => void) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [sessionMode, setSessionMode] = useState<SessionMode>(mode);

	// Common form state
	const [academicYearId, setAcademicYearId] = useState("");
	const [semesterId, setSemesterId] = useState("");
	const [dateStart, setDateStart] = useState("");
	const [dateEnd, setDateEnd] = useState("");

	// Normal session state
	const [examTypeId, setExamTypeId] = useState("");
	const [percentage, setPercentage] = useState(40);

	// Retake session state
	const [scoringPolicy, setScoringPolicy] = useState<ScoringPolicy>("replace");
	const [classFilter, setClassFilter] = useState<string>("");
	const [examTypeFilter, setExamTypeFilter] = useState<string>("");

	const examTypesQuery = useQuery({
		queryKey: EXAM_TYPES_KEY,
		queryFn: async () => {
			const { items } = await trpcClient.examTypes.list.query({ limit: 200 });
			return (Array.isArray(items) ? items : []) as ExamType[];
		},
	});
	const examTypes = examTypesQuery.data ?? [];

	useQuery({
		queryKey: ["semesters"],
		queryFn: async () => {
			const result = await trpcClient.semesters.list.query({
				limit: 200,
			});
			return result.items as Semester[];
		},
	});

	const classesQuery = useQuery({
		queryKey: ["classes", academicYearId],
		enabled: Boolean(academicYearId),
		queryFn: async () => {
			const result = await trpcClient.classes.list.query({
				academicYearId,
				limit: 500,
			});
			return result.items;
		},
	});
	const classes = classesQuery.data ?? [];

	// Normal session preview — semester is optional; without it we list all classes for the year
	const previewQuery = useQuery({
		queryKey: ["examSchedulerPreview", academicYearId, semesterId],
		enabled: sessionMode === "normal" && Boolean(academicYearId),
		queryFn: async () => {
			if (!academicYearId) return null;
			return trpcClient.examScheduler.preview.query({
				academicYearId,
				semesterId: semesterId || undefined,
			});
		},
	});
	const previewClasses = (previewQuery.data?.classes ?? []) as PreviewClass[];
	const previewClassIds = useMemo(
		() => previewClasses.map((klass) => klass.id),
		[previewClasses],
	);
	const classSelection = useSelectAllOnLoad(
		previewClassIds,
		sessionMode === "normal",
	);

	// Retake session preview
	const retakePreviewQuery = useQuery({
		queryKey: [
			"examSchedulerRetakePreview",
			academicYearId,
			semesterId,
			examTypeFilter,
			classFilter,
		],
		enabled:
			sessionMode === "retake" &&
			Boolean(academicYearId) &&
			Boolean(semesterId),
		queryFn: async () => {
			if (!academicYearId || !semesterId) return null;
			return trpcClient.examScheduler.previewRetakes.query({
				academicYearId,
				semesterId,
				examTypeId: examTypeFilter || undefined,
				classId: classFilter || undefined,
			});
		},
	});
	const retakeExams = (retakePreviewQuery.data?.exams ??
		[]) as SchedulerRetakeExam[];
	const retakeExamIds = useMemo(
		() => retakeExams.map((exam) => exam.id),
		[retakeExams],
	);
	const examSelection = useSelectAllOnLoad(
		retakeExamIds,
		sessionMode === "retake",
	);

	const selectExamType = (id: string) => {
		setExamTypeId(id);
		const selectedType = examTypes.find((type) => type.id === id);
		if (selectedType?.defaultPercentage != null) {
			setPercentage(selectedType.defaultPercentage);
		}
	};

	const createExamType = async () => {
		const examType = await ExamTypeFormDialog.call({});
		if (!examType) return;
		queryClient.setQueryData<ExamType[]>(EXAM_TYPES_KEY, (old) =>
			upsertInList(old ?? [], examType as ExamType),
		);
		setExamTypeId(examType.id);
		if (examType.defaultPercentage != null) {
			setPercentage(examType.defaultPercentage);
		}
	};

	const resetForm = () => {
		setAcademicYearId("");
		setSemesterId("");
		setDateStart("");
		setDateEnd("");
		setExamTypeId("");
		setPercentage(40);
		classSelection.reset();
		examSelection.reset();
		setScoringPolicy("replace");
		setClassFilter("");
		setExamTypeFilter("");
	};

	const scheduleMutation = useMutation({
		mutationFn: async () => {
			if (
				!academicYearId ||
				!examTypeId ||
				!dateStart ||
				!dateEnd ||
				!classSelection.selected.size
			) {
				throw new Error(t("admin.examScheduler.toast.error"));
			}
			await trpcClient.examScheduler.schedule.mutate({
				academicYearId,
				examTypeId,
				semesterId: semesterId || undefined,
				percentage,
				dateStart: new Date(dateStart),
				dateEnd: new Date(dateEnd),
				classIds: Array.from(classSelection.selected),
			});
		},
		onSuccess: () => {
			toast.success(t("admin.examScheduler.toast.success"));
			queryClient.invalidateQueries({ queryKey: HISTORY_KEY });
			onDone();
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error && error.message
					? error.message
					: t("admin.examScheduler.toast.error");
			toast.error(message);
		},
	});

	const scheduleRetakesMutation = useMutation({
		mutationFn: async () => {
			if (
				!academicYearId ||
				!semesterId ||
				!dateStart ||
				!dateEnd ||
				!examSelection.selected.size
			) {
				throw new Error(t("admin.examScheduler.toast.retakeError"));
			}
			return trpcClient.examScheduler.scheduleRetakes.mutate({
				academicYearId,
				semesterId,
				dateStart: new Date(dateStart),
				dateEnd: new Date(dateEnd),
				examIds: Array.from(examSelection.selected),
				scoringPolicy,
				examTypeId: examTypeFilter || undefined,
				classId: classFilter || undefined,
			});
		},
		onSuccess: (result) => {
			toast.success(
				t("admin.examScheduler.toast.retakeSuccess", {
					count: result.created,
				}),
			);
			queryClient.invalidateQueries({ queryKey: HISTORY_KEY });
			queryClient.invalidateQueries({
				queryKey: ["examSchedulerRetakePreview"],
			});
			onDone();
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error && error.message
					? error.message
					: t("admin.examScheduler.toast.retakeError");
			toast.error(message);
		},
	});

	const canSubmitNormal =
		Boolean(
			academicYearId &&
				examTypeId &&
				dateStart &&
				dateEnd &&
				classSelection.selected.size,
		) &&
		percentage >= 1 &&
		percentage <= 100 &&
		!scheduleMutation.isPending;

	const canSubmitRetake =
		Boolean(
			academicYearId &&
				semesterId &&
				dateStart &&
				dateEnd &&
				examSelection.selected.size,
		) && !scheduleRetakesMutation.isPending;

	const submit = () => {
		if (sessionMode === "normal") scheduleMutation.mutate();
		else scheduleRetakesMutation.mutate();
	};

	return {
		sessionMode,
		setSessionMode,
		academicYearId,
		setAcademicYearId,
		semesterId,
		setSemesterId,
		dateStart,
		setDateStart,
		dateEnd,
		setDateEnd,
		examTypeId,
		selectExamType,
		createExamType,
		percentage,
		setPercentage,
		scoringPolicy,
		setScoringPolicy,
		classFilter,
		setClassFilter,
		examTypeFilter,
		setExamTypeFilter,
		examTypes,
		classes,
		previewClasses,
		previewLoading: previewQuery.isLoading,
		classSelection,
		retakeExams,
		retakePreviewLoading: retakePreviewQuery.isLoading,
		examSelection,
		resetForm,
		submit,
		isPending: scheduleMutation.isPending || scheduleRetakesMutation.isPending,
		canSubmit: sessionMode === "normal" ? canSubmitNormal : canSubmitRetake,
	};
}

export type ScheduleExamsState = ReturnType<typeof useScheduleExams>;
