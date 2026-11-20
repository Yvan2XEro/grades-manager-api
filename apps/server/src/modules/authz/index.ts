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
/** Administrator and above — excludes deans (institution settings, accounts). */
export const ADMINISTRATOR_ROLES: MemberRole[] = [
	"administrator",
	"super_admin",
	"owner",
];
/**
 * Every institution employee. Students (and guests) are excluded: they only
 * reach self-service procedures that resolve their own records.
 */
export const STAFF_ROLES: MemberRole[] = [
	"staff",
	"grade_editor",
	"teacher",
	"dean",
	"administrator",
	"super_admin",
	"owner",
];

/** True when the role belongs to an employee (anything but student/guest). */
export function isStaffRole(role: MemberRole | null | undefined) {
	return roleSatisfies(role, STAFF_ROLES);
}

/**
 * Roles that read every student record of the institution, not only the
 * students of their own courses. The hierarchy makes a teacher satisfy
 * `staff` and `grade_editor`, so the two non-admin roles are matched exactly:
 * teachers stay scoped to their courses.
 */
export function hasInstitutionWideRecordAccess(
	role: MemberRole | null | undefined,
) {
	return (
		roleSatisfies(role, ADMIN_ROLES) ||
		role === "staff" ||
		role === "grade_editor"
	);
}

/**
 * Roles that edit the grades of every exam of the institution. A teacher
 * satisfies `grade_editor` through the hierarchy but only edits the exams of
 * their own courses (or delegated ones), hence the exact match.
 */
export function hasInstitutionWideGradeAccess(
	role: MemberRole | null | undefined,
) {
	return roleSatisfies(role, ADMIN_ROLES) || role === "grade_editor";
}

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
