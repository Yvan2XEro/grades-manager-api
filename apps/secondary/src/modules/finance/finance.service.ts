import { notFound } from "../../lib/errors";
import * as repo from "./finance.repo";

export async function listSchedules(
	institutionId: string,
	opts: {
		academicYearId?: string;
		classId?: string;
		limit?: number;
		offset?: number;
	},
) {
	return repo.findAllSchedules(institutionId, opts);
}

export async function createSchedule(
	data: Parameters<typeof repo.insertSchedule>[0],
	institutionId: string,
) {
	return repo.insertSchedule({ ...data, institutionId });
}

export async function getSchedule(id: string, institutionId: string) {
	const schedule = await repo.findScheduleById(id, institutionId);
	if (!schedule) throw notFound("Fee schedule not found");
	return schedule;
}

export async function listPayments(
	institutionId: string,
	opts: {
		enrollmentId?: string;
		feeType?: string;
		limit?: number;
		offset?: number;
	},
) {
	return repo.findAllPayments(institutionId, opts);
}

export async function recordPayment(
	data: Parameters<typeof repo.insertPayment>[0],
	institutionId: string,
) {
	return repo.insertPayment({ ...data, institutionId });
}

export async function getEnrollmentBalance(
	institutionId: string,
	enrollmentId: string,
) {
	return repo.sumPaymentsByEnrollment(institutionId, enrollmentId);
}
