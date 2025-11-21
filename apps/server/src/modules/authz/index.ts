import { TRPCError } from "@trpc/server";
import type { BusinessRole, DomainUser } from "@/db/schema/app-schema";

const roleHierarchy: Record<BusinessRole, BusinessRole[]> = {
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
        role: BusinessRole | "guest";
        canManageCatalog: boolean;
        canManageStudents: boolean;
        canGrade: boolean;
        canAccessAnalytics: boolean;
};

export const ADMIN_ROLES: BusinessRole[] = [
        "administrator",
        "dean",
        "super_admin",
];
export const SUPER_ADMIN_ROLES: BusinessRole[] = ["super_admin"];

export function roleSatisfies(role: BusinessRole, allowed: BusinessRole[]) {
        const expanded = roleHierarchy[role] ?? [];
        return expanded.some((r) => allowed.includes(r));
}

export function assertRole(
        profile: DomainUser | null | undefined,
        allowedRoles: BusinessRole[],
) {
        if (!profile) {
                throw new TRPCError({
                        code: "FORBIDDEN",
                        message: "Domain profile is required to access this resource",
                });
        }
        if (!roleSatisfies(profile.businessRole, allowedRoles)) {
                throw new TRPCError({
                        code: "FORBIDDEN",
                        message: "Insufficient domain permissions",
                });
        }
}

export function buildPermissions(
        profile: DomainUser | null | undefined,
): PermissionSnapshot {
        const role = profile?.businessRole ?? "guest";
        const canManageCatalog =
                !!profile && roleSatisfies(profile.businessRole, ADMIN_ROLES);
        const canManageStudents =
                !!profile && roleSatisfies(profile.businessRole, ADMIN_ROLES);
        const canGrade =
                !!profile &&
                roleSatisfies(profile.businessRole, [
                        "teacher",
                        "administrator",
                        "dean",
                        "super_admin",
                ]);
        const canAccessAnalytics =
                !!profile && roleSatisfies(profile.businessRole, ADMIN_ROLES);

        return {
                role,
                canManageCatalog,
                canManageStudents,
                canGrade,
                canAccessAnalytics,
        };
}
