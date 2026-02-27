import { registerJobType } from "../batch-jobs.registry";
import { academicYearSetupJob } from "./academic-year-setup";
import { creditLedgerRecomputeJob } from "./credit-ledger-recompute";
import { promotionApplyJob } from "./promotion-apply";
import { studentFactsRefreshJob } from "./student-facts-refresh";

export function registerAllJobTypes() {
	registerJobType(creditLedgerRecomputeJob);
	registerJobType(studentFactsRefreshJob);
	registerJobType(promotionApplyJob);
	registerJobType(academicYearSetupJob);
}
