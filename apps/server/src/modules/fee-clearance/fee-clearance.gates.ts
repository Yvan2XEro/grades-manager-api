import { TRPCError } from "@trpc/server";
import type { FeeGate } from "@/db/schema/app-schema";

export interface GateContext {
	institution: { id: string };
	permissions?: { canOverrideFeeGates?: boolean } | null;
	profile?: { id: string } | null;
}

/**
 * Throws PRECONDITION_FAILED if the given gate is active and the student is
 * not cleared (status !== 'paid' and !== 'exempt').
 *
 * Call this at the start of any procedure that should be blocked for
 * students with unpaid fees (e.g. transcript generation, exam registration).
 *
 * Admins with `canOverrideFeeGates` bypass the check. Pass `overrideNote` to
 * log an audit trail for the bypass reason.
 */
export async function assertFeeClearance(
	ctx: GateContext,
	gate: FeeGate,
	params: {
		studentId: string;
		academicYearId: string;
		overrideNote?: string;
	},
): Promise<void> {
	if (ctx.permissions?.canOverrideFeeGates) {
		if (params.overrideNote) {
			console.info(
				`[fee-gate-override] gate=${gate} student=${params.studentId} year=${params.academicYearId} by=${ctx.profile?.id ?? "unknown"} reason="${params.overrideNote}"`,
			);
		}
		return;
	}

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
