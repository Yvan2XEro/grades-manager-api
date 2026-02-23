import { registerJobType } from "../batch-jobs.registry";
import { creditLedgerRecomputeJob } from "./credit-ledger-recompute";
import { promotionApplyJob } from "./promotion-apply";
import { studentFactsRefreshJob } from "./student-facts-refresh";

export function registerAllJobTypes() {
	registerJobType(creditLedgerRecomputeJob);
	registerJobType(studentFactsRefreshJob);
	registerJobType(promotionApplyJob);
}
