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
		"staff",
		"student",
	],
	super_admin: [
		"super_admin",
		"administrator",
		"dean",
		"teacher",
		"staff",
		"student",
	],
	administrator: ["administrator", "dean", "teacher", "staff", "student"],
	dean: ["dean", "teacher", "staff", "student"],
	teacher: ["teacher", "staff", "student"],
	staff: ["staff", "student"],
	student: ["student"],
};

export type PermissionSnapshot = {
	role: MemberRole | "guest";
	canManageCatalog: boolean;
	canManageStudents: boolean;
	canGrade: boolean;
	canAccessAnalytics: boolean;
};

export const ADMIN_ROLES: MemberRole[] = [
	"administrator",
	"dean",
	"super_admin",
	"owner",
];
export const SUPER_ADMIN_ROLES: MemberRole[] = ["super_admin", "owner"];

export function roleSatisfies(role: MemberRole | null | undefined, allowed: MemberRole[]) {
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
	const canManageCatalog = roleSatisfies(role, ADMIN_ROLES);
	const canManageStudents = roleSatisfies(role, ADMIN_ROLES);
	const canGrade = roleSatisfies(role, [
		"teacher",
		"administrator",
		"dean",
		"super_admin",
		"owner",
	]);
	const canAccessAnalytics = roleSatisfies(role, ADMIN_ROLES);

	return {
		role: normalizedRole,
		canManageCatalog,
		canManageStudents,
		canGrade,
		canAccessAnalytics,
	};
}
