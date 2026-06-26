import { TRPCError } from "@trpc/server";
import type { BusinessRole } from "@/db/schema/app-schema";

export type MemberRole = BusinessRole | "owner";

const roleHierarchy: Record<MemberRole, MemberRole[]> = {
	owner: [
		"owner",
		"super_admin",
		"administrator",
		"dean",
		"teacher",
		"grade_editor",
		"staff",
		"student",
	],
	super_admin: [
		"super_admin",
		"administrator",
		"dean",
		"teacher",
		"grade_editor",
		"staff",
		"student",
	],
	administrator: [
		"administrator",
		"dean",
		"teacher",
		"grade_editor",
		"staff",
		"student",
	],
	dean: ["dean", "teacher", "grade_editor", "staff", "student"],
	teacher: ["teacher", "grade_editor", "staff", "student"],
	grade_editor: ["grade_editor"],
	staff: ["staff", "student"],
	student: ["student"],
};

export type PermissionSnapshot = {
	role: MemberRole | "guest";
	canManageCatalog: boolean;
	canManageStudents: boolean;
	canGrade: boolean;
	canAccessAnalytics: boolean;
	/** Configure fee structures and installment plans. */
	canConfigureFeeStructures: boolean;
	/** View and manage student fee assignments and discounts. */
	canManageFees: boolean;
	/** Record and delete payment confirmations. */
	canRecordPayments: boolean;
	/** Confirm/validate payment orders. */
	canValidatePayments: boolean;
	/** Override fee clearance gates on sensitive operations. */
	canOverrideFeeGates: boolean;
};

export const ADMIN_ROLES: MemberRole[] = [
	"administrator",
	"dean",
	"super_admin",
	"owner",
];
export const SUPER_ADMIN_ROLES: MemberRole[] = ["super_admin", "owner"];

export function roleSatisfies(
	role: MemberRole | null | undefined,
	allowed: MemberRole[],
) {
	if (!role) return false;
	const expanded = roleHierarchy[role] ?? [];
	return expanded.some((r) => allowed.includes(r));
}

export function assertRole(
	role: MemberRole | null | undefined,
	allowedRoles: MemberRole[],
) {
	if (!role) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Organization membership is required to access this resource",
		});
	}
	if (!roleSatisfies(role, allowedRoles)) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Insufficient domain permissions",
		});
	}
}

export function buildPermissions(
	role: MemberRole | null | undefined,
): PermissionSnapshot {
	const normalizedRole = role ?? "guest";
	const isAdmin = roleSatisfies(role, ADMIN_ROLES);
	const canManageCatalog = isAdmin;
	const canManageStudents = isAdmin;
	const canGrade = roleSatisfies(role, [
		"teacher",
		"grade_editor",
		"administrator",
		"dean",
		"super_admin",
		"owner",
	]);
	const canAccessAnalytics = isAdmin;

	return {
		role: normalizedRole,
		canManageCatalog,
		canManageStudents,
		canGrade,
		canAccessAnalytics,
		canConfigureFeeStructures: isAdmin,
		canManageFees: isAdmin,
		canRecordPayments: isAdmin,
		canValidatePayments: isAdmin,
		canOverrideFeeGates: isAdmin,
	};
}
