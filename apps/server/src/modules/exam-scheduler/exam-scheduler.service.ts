import { TRPCError } from "@trpc/server";
import { notFound } from "@/modules/_shared/errors";
import * as examsService from "@/modules/exams/exams.service";
import type {
	HistoryInput,
	PreviewInput,
	ScheduleInput,
	RunDetailsInput,
} from "./exam-scheduler.zod";
import * as repo from "./exam-scheduler.repo";

async function resolveContext(input: PreviewInput) {
	const [faculty, academicYear] = await Promise.all([
		repo.findFacultyById(input.facultyId),
		repo.findAcademicYearById(input.academicYearId),
	]);
	if (!faculty) throw notFound("Faculty not found");
	if (!academicYear) throw notFound("Academic year not found");
	return { faculty, academicYear };
}

export async function previewEligibleClasses(input: PreviewInput) {
	const context = await resolveContext(input);
	const classes = await repo.getClassesForScheduling(input);
	return {
		faculty: {
			id: context.faculty.id,
			name: context.faculty.name,
		},
		academicYear: {
			id: context.academicYear.id,
			name: context.academicYear.name,
			startDate: context.academicYear.startDate,
			endDate: context.academicYear.endDate,
		},
		classes,
	};
}

export async function scheduleExams(
	input: ScheduleInput,
	schedulerId: string | null,
) {
	const context = await resolveContext(input);
	const examType = await repo.findExamTypeById(input.examTypeId);
	if (!examType) {
		throw notFound("Exam type not found");
	}
	const classes = await repo.getClassesForScheduling({
		facultyId: input.facultyId,
		academicYearId: input.academicYearId,
		classIds: input.classIds,
	});
	if (!classes.length) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "No classes match the provided selection",
		});
	}
	const classCourses = await repo.getClassCourses(classes.map((c) => c.id));
	if (!classCourses.length) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Selected classes do not have assigned courses",
		});
	}
	const existing = await repo.findExistingTypeExams(
		classCourses.map((cc) => cc.id),
		examType.name,
	);
	const existingSet = new Set(existing.map((item) => item.classCourseId));
	const targets = classCourses.filter((cc) => !existingSet.has(cc.id));
	const duplicates = classCourses.length - targets.length;
	const createdIds: string[] = [];
	let conflicts = 0;
	const startMs = input.dateStart.getTime();
	const endMs = input.dateEnd.getTime();
	const range = Math.max(endMs - startMs, 0);
	const step = targets.length > 1 ? range / (targets.length - 1) : 0;

	for (let i = 0; i < targets.length; i += 1) {
		const target = targets[i];
		const scheduledDate = new Date(startMs + step * i);
		try {
			const exam = await examsService.createExam(
				{
					name: `${target.courseName} - ${examType.name}`,
					type: examType.name,
					date: scheduledDate,
					percentage: input.percentage.toString(),
					classCourse: target.id,
				},
				schedulerId,
			);
			if (exam) createdIds.push(exam.id);
		} catch (error) {
			if (error instanceof TRPCError && error.code === "BAD_REQUEST") {
				conflicts += 1;
				continue;
			}
			throw error;
		}
	}

	const summary = {
		created: createdIds.length,
		skipped: classCourses.length - createdIds.length,
		duplicates,
		conflicts,
		classCount: classes.length,
		classCourseCount: classCourses.length,
		examIds: createdIds,
		examType: { id: examType.id, name: examType.name },
		faculty: { id: context.faculty.id, name: context.faculty.name },
		academicYear: {
			id: context.academicYear.id,
			name: context.academicYear.name,
			startDate: context.academicYear.startDate,
			endDate: context.academicYear.endDate,
		},
	};

	let runId: string | undefined;
	const schedulerProfile = schedulerId
		? await repo.findDomainUserById(schedulerId)
		: null;
	try {
		const run = await repo.recordRun({
			facultyId: input.facultyId,
			academicYearId: input.academicYearId,
			examTypeId: examType.id,
			percentage: input.percentage.toString(),
			dateStart: input.dateStart,
			dateEnd: input.dateEnd,
			classIds: classes.map((klass) => klass.id),
			classCount: classes.length,
			classCourseCount: classCourses.length,
			createdCount: summary.created,
			skippedCount: summary.skipped,
			duplicateCount: duplicates,
			conflictCount: conflicts,
			scheduledBy: schedulerProfile ? schedulerProfile.id : null,
		});
		runId = run.id;
		await examsService.assignScheduleRun(createdIds, run.id);
	} catch (error) {
		console.error("Failed to record or link exam scheduling run", error);
	}

	return { ...summary, runId };
}

export function listHistory(input: HistoryInput) {
	return repo.listRuns(input);
}

export async function getRunDetails(input: RunDetailsInput) {
	const result = await repo.getRunDetails(input.runId);
	if (!result) {
		throw notFound("Scheduling run not found");
	}
	return result;
}
