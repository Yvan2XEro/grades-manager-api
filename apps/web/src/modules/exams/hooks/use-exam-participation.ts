import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { trpc, trpcClient } from "@/utils/trpc";
import type {
	ParticipationClassCourseItem,
	ParticipationExamItem,
	ParticipationRow,
} from "../types";

/** Year → class course → exam cascade of the participation roster page. */
export function useParticipationFilters() {
	const [academicYearId, setAcademicYearIdState] = useState<string | null>(
		null,
	);
	const [classCourseId, setClassCourseIdState] = useState<string | null>(null);
	const [examId, setExamId] = useState<string | null>(null);

	const { data: classCourses } = useQuery({
		queryKey: ["classCourses-for-participation", academicYearId],
		queryFn: async () => {
			const { items } = await trpcClient.classCourses.list.query({
				academicYearId: academicYearId ?? undefined,
				limit: 500,
			});
			return items as ParticipationClassCourseItem[];
		},
	});

	const { data: exams } = useQuery({
		queryKey: ["exams-for-participation", classCourseId],
		queryFn: async () => {
			if (!classCourseId) return [];
			const { items } = await trpcClient.exams.list.query({
				classCourseId,
				limit: 200,
			});
			return items as ParticipationExamItem[];
		},
		enabled: !!classCourseId,
	});

	return {
		academicYearId,
		setAcademicYearId: (id: string | null) => {
			setAcademicYearIdState(id);
			setClassCourseIdState(null);
			setExamId(null);
		},
		classCourseId,
		setClassCourseId: (id: string | null) => {
			setClassCourseIdState(id);
			setExamId(null);
		},
		examId,
		setExamId,
		classCourses: classCourses ?? [],
		exams: exams ?? [],
	};
}

/** Participation roster of an exam, with its generate / lock mutations. */
export function useExamRoster(examId: string | null) {
	const queryClient = useQueryClient();

	const rosterStatusQuery = useQuery({
		...trpc.attendance.getExamRosterStatus.queryOptions({
			examId: examId ?? "",
		}),
		enabled: !!examId,
	});
	const rosterQuery = useQuery({
		...trpc.attendance.getExamRoster.queryOptions({ examId: examId ?? "" }),
		enabled: !!examId,
	});

	const invalidate = () => {
		queryClient.invalidateQueries({
			queryKey: trpc.attendance.getExamRoster.queryKey({ examId: examId! }),
		});
		queryClient.invalidateQueries({
			queryKey: trpc.attendance.getExamRosterStatus.queryKey({
				examId: examId!,
			}),
		});
	};

	const generate = useMutation({
		mutationFn: () =>
			trpcClient.attendance.generateExamRoster.mutate({ examId: examId! }),
		onSuccess: invalidate,
	});
	const lock = useMutation({
		mutationFn: () =>
			trpcClient.attendance.lockExamRoster.mutate({ examId: examId! }),
		onSuccess: invalidate,
	});

	const rows: ParticipationRow[] = (rosterQuery.data ?? []).map((row) => ({
		...row,
		id: row.studentId,
	}));
	const status = rosterStatusQuery.data;

	return {
		rows,
		isLoading: rosterQuery.isLoading,
		isLocked: status?.locked ?? false,
		hasRoster: status?.exists ?? false,
		generate,
		lock,
	};
}
