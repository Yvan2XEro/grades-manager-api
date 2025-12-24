import { TRPCError } from "@trpc/server";
import { notFound } from "@/modules/_shared/errors";
import * as examsService from "@/modules/exams/exams.service";
import * as repo from "./exam-scheduler.repo";
import type {
	HistoryInput,
	PreviewInput,
	RunDetailsInput,
	ScheduleInput,
} from "./exam-scheduler.zod";

async function ensureAcademicYear(
	academicYearId: string,
	institutionId: string,
) {
	const academicYear = await repo.findAcademicYearById(academicYearId);
	if (!academicYear || academicYear.institutionId !== institutionId) {
		throw notFound("Academic year not found");
	}
	return academicYear;
}

async function ensureExamType(examTypeId: string, institutionId: string) {
	const examType = await repo.findExamTypeById(examTypeId);
	if (!examType || examType.institutionId !== institutionId) {
		throw notFound("Exam type not found");
	}
	return examType;
}

async function resolveContext(input: PreviewInput, institutionId: string) {
	const academicYear = await ensureAcademicYear(
		input.academicYearId,
		institutionId,
	);
	return { academicYear };
}

export async function previewEligibleClasses(
	input: PreviewInput,
	institutionId: string,
) {
	const context = await resolveContext(input, institutionId);
	console.log("[DEBUG preview] input:", input, "institutionId:", institutionId);
	const classes = await repo.getClassesForScheduling({
		academicYearId: input.academicYearId,
		institutionId,
		semesterId: input.semesterId,
	});
	console.log("[DEBUG preview] Found classes:", classes.length);
	return {
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
	institutionId: string,
) {
	const context = await resolveContext(input, institutionId);
	const examType = await ensureExamType(input.examTypeId, institutionId);
	const classes = await repo.getClassesForScheduling({
		institutionId,
		academicYearId: input.academicYearId,
		classIds: input.classIds,
		semesterId: input.semesterId,
	});
	if (!classes.length) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "No classes match the provided selection",
		});
	}
	const classCourses = await repo.getClassCourses(
		classes.map((c) => c.id),
		input.semesterId,
	);
	if (!classCourses.length) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Selected classes do not have assigned courses",
		});
	}
	const existing = await repo.findExistingTypeExams(
		classCourses.map((cc) => cc.id),
		examType.name,
		institutionId,
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
				institutionId,
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
			institutionId,
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
		await examsService.assignScheduleRun(createdIds, run.id, institutionId);
	} catch (error) {
		console.error("Failed to record or link exam scheduling run", error);
	}

	return { ...summary, runId };
}

export function listHistory(input: HistoryInput, institutionId: string) {
	return repo.listRuns(input, institutionId);
}

export async function getRunDetails(
	input: RunDetailsInput,
	institutionId: string,
) {
	const result = await repo.getRunDetails(input.runId, institutionId);
	if (!result) {
		throw notFound("Scheduling run not found");
	}
	return result;
}
