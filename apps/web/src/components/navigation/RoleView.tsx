import type { ReactNode } from "react";
import { type BusinessRole, useStore } from "@/store";

/**
 * URLs never carry the user's role: a path such as `/timetable` renders the
 * view of the signed-in user's role group. Groups mirror the sidebar menus.
 */
export type RoleGroup = "admin" | "dean" | "teacher" | "student";

const ROLE_GROUPS: Record<BusinessRole, RoleGroup | null> = {
	owner: "admin",
	super_admin: "admin",
	administrator: "admin",
	dean: "dean",
	teacher: "teacher",
	grade_editor: "teacher",
	staff: "teacher",
	student: "student",
	guest: null,
};

export const roleGroupOf = (role: BusinessRole | undefined) =>
	role ? ROLE_GROUPS[role] : null;

export function useRoleGroup() {
	return roleGroupOf(useStore((state) => state.user?.role));
}

type RoleViewProps = Partial<Record<RoleGroup, ReactNode>> & {
	/** Rendered for groups without a dedicated view (admin view by default). */
	fallback: ReactNode;
};

/** Renders the view of the current user's role group for a shared path. */
export function RoleView({ fallback, ...views }: RoleViewProps) {
	const group = useRoleGroup();
	return <>{(group && views[group]) ?? fallback}</>;
}
