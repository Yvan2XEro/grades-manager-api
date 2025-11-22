import { create } from "zustand";
import { persist } from "zustand/middleware";

export type BusinessRole =
	| "guest"
	| "student"
	| "staff"
	| "dean"
	| "teacher"
	| "administrator"
	| "super_admin";

export type PermissionSnapshot = {
	canManageCatalog: boolean;
	canManageStudents: boolean;
	canGrade: boolean;
	canAccessAnalytics: boolean;
};

export type User = {
	profileId: string;
	authUserId?: string | null;
	role: BusinessRole;
	firstName: string;
	lastName: string;
	email: string;
	permissions: PermissionSnapshot;
} | null;

const defaultPermissions: PermissionSnapshot = {
	canManageCatalog: false,
	canManageStudents: false,
	canGrade: false,
	canAccessAnalytics: false,
};

/**
 * Role-based guards that mirror the backend authz module.
 * Use these to protect layouts/routes on the client.
 */
export const roleGuards = {
	manageCatalog: ["administrator", "dean", "super_admin"] as BusinessRole[],
	manageStudents: ["administrator", "dean", "super_admin"] as BusinessRole[],
	grade: ["teacher", "administrator", "dean", "super_admin"] as BusinessRole[],
	viewAnalytics: ["administrator", "dean", "super_admin"] as BusinessRole[],
};

type StoreState = {
	user: User;
	setUser: (user: User) => void;
	clearUser: () => void;
	sidebarOpen: boolean;
	toggleSidebar: () => void;
	setSidebarOpen: (open: boolean) => void;
};

export const useStore = create<StoreState>()(
	persist(
		(set) => ({
			user: null,
			setUser: (user) =>
				set({
					user: user
						? {
								...user,
								permissions: user.permissions ?? defaultPermissions,
							}
						: null,
				}),
			clearUser: () => set({ user: null }),
			sidebarOpen: true,
			toggleSidebar: () =>
				set((state) => ({ sidebarOpen: !state.sidebarOpen })),
			setSidebarOpen: (open) => set({ sidebarOpen: open }),
		}),
		{
			name: "academic-management-store",
			partialize: (state) => ({ user: state.user }),
		},
	),
);
