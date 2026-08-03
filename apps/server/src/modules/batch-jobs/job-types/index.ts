import { registerJobType } from "../batch-jobs.registry";
import { academicYearSetupJob } from "./academic-year-setup";
import { bulkDocumentGenerationJob } from "./bulk-document-generation";
import { creditLedgerRecomputeJob } from "./credit-ledger-recompute";
import { importAcademicStructureJob } from "./import-academic-structure";
import { importEnrollmentsJob } from "./import-enrollments";
import { importGradesBulkJob } from "./import-grades-bulk";
import { importPeopleJob } from "./import-people";
import { promotionApplyJob } from "./promotion-apply";
import { studentFactsRefreshJob } from "./student-facts-refresh";
import { timetableCopyJob } from "./timetable-copy";

export function registerAllJobTypes() {
	registerJobType(creditLedgerRecomputeJob);
	registerJobType(studentFactsRefreshJob);
	registerJobType(promotionApplyJob);
	registerJobType(academicYearSetupJob);
	registerJobType(bulkDocumentGenerationJob);
	registerJobType(timetableCopyJob);
	registerJobType(importAcademicStructureJob);
	registerJobType(importPeopleJob);
	registerJobType(importEnrollmentsJob);
	registerJobType(importGradesBulkJob);
}
