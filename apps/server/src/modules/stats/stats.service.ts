import { statsRepo } from "./stats.repo";

export const statsService = {
	overview: (institutionId: string, academicYearId?: string) =>
		statsRepo.overview(institutionId, academicYearId),
	enrollmentStats: (institutionId: string, academicYearId?: string) =>
		statsRepo.enrollmentStats(institutionId, academicYearId),
	performanceStats: (institutionId: string, academicYearId?: string) =>
		statsRepo.performanceStats(institutionId, academicYearId),
	financeStats: (institutionId: string, academicYearId?: string) =>
		statsRepo.financeStats(institutionId, academicYearId),
	admissionsStats: (institutionId: string, academicYearId?: string) =>
		statsRepo.admissionsStats(institutionId, academicYearId),
};
