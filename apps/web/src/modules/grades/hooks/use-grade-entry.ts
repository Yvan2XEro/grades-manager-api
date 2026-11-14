import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { toast } from "@/lib/toast";
import { useStore } from "@/store";
import { trpc, trpcClient } from "@/utils/trpc";
import type {
	CourseInfo,
	Delegate,
	EntryExam,
	GradesByStudent,
	RosterStudent,
} from "../types";

/**
 * State of the grade entry page: the class course (from the route), its
 * exams, the selected exam with its grades and delegates, and what the
 * viewer may do on it.
 */
export function useGradeEntry() {
	const { courseId: routeCourseId } = useParams<{ courseId?: string }>();
	const navigate = useNavigate();
	const { t } = useTranslation();
	const { user } = useStore();

	const teacherProfileId = user?.domainProfiles?.[0]?.id;
	const viewerProfileId = teacherProfileId;
	const [selectedCourseId, setSelectedCourseId] = useState(routeCourseId ?? "");
	const autoSelectExamRef = useRef<boolean>(Boolean(routeCourseId));
	const manualCourseSelectionRef = useRef(false);
	const [selectedExam, setSelectedExam] = useState<string>("");

	const classCoursesQuery = useQuery({
		...trpc.classCourses.list.queryOptions({
			teacherId: teacherProfileId ?? undefined,
			limit: 200,
		}),
	});
	const availableClassCourses = classCoursesQuery.data?.items ?? [];

	useEffect(() => {
		if (routeCourseId && !manualCourseSelectionRef.current) {
			autoSelectExamRef.current = true;
			setSelectedCourseId(routeCourseId);
		}
		if (manualCourseSelectionRef.current) {
			manualCourseSelectionRef.current = false;
		}
	}, [routeCourseId]);

	const handleCourseChange = (value: string) => {
		manualCourseSelectionRef.current = true;
		autoSelectExamRef.current = false;
		setSelectedCourseId(value);
		setSelectedExam("");
		if (value) {
			navigate(`/grades/${value}`, { replace: true });
		} else {
			navigate("/", { replace: true });
		}
	};

	const courseId = selectedCourseId;

	const courseContextQuery = useQuery({
		queryKey: ["grade-entry-context", courseId],
		enabled: Boolean(courseId),
		queryFn: async () => {
			if (!courseId) {
				throw new Error("Missing class course id");
			}
			const classCourse = await trpcClient.classCourses.getById.query({
				id: courseId,
			});
			const klass = await trpcClient.classes.getById.query({
				id: classCourse.class,
			});
			const [course, program] = await Promise.all([
				trpcClient.courses.getById.query({ id: classCourse.course }),
				trpcClient.programs.getById.query({ id: klass.program }),
			]);
			// Fetch teaching unit info
			const teachingUnit = await trpcClient.teachingUnits.getById.query({
				id: course.teachingUnitId,
			});
			return {
				courseInfo: {
					course_name: course.name,
					course_code: course.code,
					teaching_unit_name: teachingUnit.name,
					teaching_unit_code: teachingUnit.code,
					class_name: klass.name,
					program_name: program.name,
				} as CourseInfo,
				teacherId: classCourse.teacher ?? null,
			};
		},
		onError: (error: any) => {
			toast.error(
				error.message || t("teacher.gradeEntry.toast.fetchCourseError"),
			);
		},
	});

	const courseInfo = courseContextQuery.data?.courseInfo ?? null;
	const courseOwnerId = courseContextQuery.data?.teacherId ?? null;

	const canManageDelegates = useMemo(() => {
		const role = user?.role;
		if (!role) return false;
		if (["administrator", "dean", "super_admin", "owner"].includes(role)) {
			return true;
		}
		if (
			role === "teacher" &&
			courseOwnerId &&
			viewerProfileId &&
			courseOwnerId === viewerProfileId
		) {
			return true;
		}
		return false;
	}, [user?.role, courseOwnerId, viewerProfileId]);

	const rosterQuery = useQuery({
		queryKey: ["class-course-roster", courseId],
		enabled: Boolean(courseId),
		queryFn: async () => {
			if (!courseId) return [] as RosterStudent[];
			const { students } = await trpcClient.classCourses.roster.query({
				id: courseId,
			});
			return students as RosterStudent[];
		},
		onError: (error: any) => {
			toast.error(
				error.message || t("teacher.gradeEntry.toast.fetchCourseError"),
			);
		},
	});

	const examsQuery = useQuery({
		queryKey: ["class-course-exams", courseId],
		enabled: Boolean(courseId),
		queryFn: async () => {
			if (!courseId) return [] as EntryExam[];
			const { items } = await trpcClient.exams.list.query({
				classCourseId: courseId,
			});
			return items.map(
				(e): EntryExam => ({
					id: e.id,
					name: e.name,
					type: e.type,
					date: e.date,
					percentage: Number(e.percentage),
					isLocked: e.isLocked,
					status: (e as any).status,
					canEdit: e.canEdit ?? false,
					sessionType: (e as any).sessionType ?? "normal",
					parentExamId: (e as any).parentExamId ?? null,
					scoringPolicy: (e as any).scoringPolicy ?? "replace",
				}),
			);
		},
		onError: (error: any) => {
			toast.error(
				error.message || t("teacher.gradeEntry.toast.fetchCourseError"),
			);
		},
	});

	const exams = useMemo(() => examsQuery.data ?? [], [examsQuery.data]);

	useEffect(() => {
		if (!exams.length) {
			setSelectedExam("");
			return;
		}
		if (!selectedExam) {
			if (autoSelectExamRef.current) {
				setSelectedExam(exams[0].id);
			}
			return;
		}
		if (!exams.some((exam) => exam.id === selectedExam)) {
			if (autoSelectExamRef.current) {
				setSelectedExam(exams[0].id);
			} else {
				setSelectedExam("");
			}
		}
	}, [exams, selectedExam]);

	const selectedExamInfo = useMemo(
		() => exams.find((exam) => exam.id === selectedExam),
		[exams, selectedExam],
	);
	const isExamLocked = selectedExamInfo?.isLocked ?? false;
	const canEditExam = selectedExam
		? (selectedExamInfo?.canEdit ?? false)
		: false;
	const inputsDisabled = isExamLocked || !canEditExam;

	const gradesQuery = useQuery({
		queryKey: ["exam-grades", selectedExam],
		enabled: Boolean(selectedExam),
		queryFn: async () => {
			const response = await trpcClient.grades.listByExam.query({
				examId: selectedExam!,
			});
			return response.items;
		},
		onError: (error: any) => {
			toast.error(
				error.message || t("teacher.gradeEntry.toast.fetchGradesError"),
			);
		},
	});

	const delegateQuery = useQuery({
		queryKey: ["exam-grade-editors", selectedExam],
		enabled: Boolean(selectedExam),
		queryFn: async () => {
			if (!selectedExam) return [] as Delegate[];
			return trpcClient.examGradeEditors.list.query({ examId: selectedExam });
		},
	});

	const gradeEntries = useMemo(
		() => gradesQuery.data ?? [],
		[gradesQuery.data],
	);
	const gradesByStudent = useMemo(() => {
		const map: GradesByStudent = {};
		gradeEntries.forEach((grade) => {
			map[grade.student] = {
				score: Number(grade.score),
				id: grade.id,
			};
		});
		return map;
	}, [gradeEntries]);

	const isInitialLoading =
		classCoursesQuery.isLoading ||
		(Boolean(courseId) &&
			(courseContextQuery.isLoading ||
				rosterQuery.isLoading ||
				examsQuery.isLoading));

	return {
		courseId,
		viewerProfileId,
		availableClassCourses,
		classCoursesLoading: classCoursesQuery.isLoading,
		handleCourseChange,
		courseInfo,
		canManageDelegates,
		rosterStudents: rosterQuery.data ?? [],
		exams,
		selectedExam,
		setSelectedExam,
		selectedExamInfo,
		isExamLocked,
		canEditExam,
		inputsDisabled,
		gradeEntries,
		gradesFetching: gradesQuery.isFetching,
		gradesByStudent,
		delegateQuery,
		delegates: delegateQuery.data ?? [],
		isInitialLoading,
	};
}

export type GradeEntryState = ReturnType<typeof useGradeEntry>;
