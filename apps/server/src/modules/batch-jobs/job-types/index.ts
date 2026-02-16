import { registerJobType } from "../batch-jobs.registry";
import { creditLedgerRecomputeJob } from "./credit-ledger-recompute";
import { studentFactsRefreshJob } from "./student-facts-refresh";

export function registerAllJobTypes() {
	registerJobType(creditLedgerRecomputeJob);
	registerJobType(studentFactsRefreshJob);
}
