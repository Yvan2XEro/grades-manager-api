import { TRPCError } from "@trpc/server";
import type { FeeGate } from "@/db/schema/app-schema";

export interface GateContext {
	institution: { id: string };
	permissions?: { canOverrideFeeGates?: boolean } | null;
}

/**
 * Throws PRECONDITION_FAILED if the given gate is active and the student is
 * not cleared (status !== 'paid' and !== 'exempt').
 *
 * Call this at the start of any procedure that should be blocked for
 * students with unpaid fees (e.g. transcript generation, exam registration).
 *
 * Admins with `canOverrideFeeGates` bypass the check.
 */
export async function assertFeeClearance(
	ctx: GateContext,
	gate: FeeGate,
	params: {
		studentId: string;
		academicYearId: string;
		/** Set to true to skip the check even when the gate is enabled. */
		override?: boolean;
	},
): Promise<void> {
	if (params.override || ctx.permissions?.canOverrideFeeGates) return;

	// Lazy import so module mock intercepts @/db in test environments.
	const repo = await import("./fee-clearance.repo");

	const rule = await repo.findGatingRule(ctx.institution.id, gate);
	if (!rule?.isEnabled) return;

	const assignment = await repo.findAssignmentForStudent(
		params.studentId,
		params.academicYearId,
		ctx.institution.id,
	);

	if (!assignment) {
		throw new TRPCError({
			code: "PRECONDITION_FAILED",
			message: `Fee clearance required for '${gate}': no fee assignment found for this academic year.`,
		});
	}

	if (assignment.status === "paid" || assignment.status === "exempt") return;

	throw new TRPCError({
		code: "PRECONDITION_FAILED",
		message: `Fee clearance required for '${gate}'. Current status: ${assignment.status}. Please clear outstanding fees before proceeding.`,
	});
}
