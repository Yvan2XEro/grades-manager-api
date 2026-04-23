import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { vi } from "vitest";

// Mutable state shared between test body and the mock factory
const mockState = {
	user: null as unknown,
	sidebarOpen: false,
	// Use icon-rail mode — all links render unconditionally (no AnimatePresence gating)
	sidebarCollapsed: true,
	setSidebarOpen: vi.fn(),
	setUser: vi.fn(),
	clearUser: vi.fn(),
	toggleSidebar: vi.fn(),
	activeOrganizationSlug: null as string | null,
	setActiveOrganizationSlug: vi.fn(),
};

vi.mock("../../../store", () => {
	const useStore = (selector?: (s: typeof mockState) => unknown) =>
		selector ? selector(mockState) : mockState;
	useStore.getState = () => mockState;
	return {
		useStore,
		roleGuards: {
			manageCatalog: ["administrator", "super_admin", "owner"],
			manageStudents: ["administrator", "super_admin", "owner"],
			grade: [
				"teacher",
				"administrator",
				"super_admin",
				"owner",
				"grade_editor",
			],
			viewAnalytics: ["administrator", "super_admin", "owner", "dean"],
		},
	};
});

import Sidebar from "../Sidebar";

const makeAdmin = () => ({
	profileId: "user-1",
	authUserId: "user-1",
	email: "admin@example.com",
	image: null,
	firstName: "Jane",
	lastName: "Doe",
	role: "administrator" as const,
	permissions: {
		canManageCatalog: true,
		canManageStudents: true,
		canGrade: true,
		canAccessAnalytics: true,
	},
});

const makeTeacher = () => ({
	...makeAdmin(),
	email: "teacher@example.com",
	role: "teacher" as const,
	permissions: {
		canManageCatalog: false,
		canManageStudents: false,
		canGrade: true,
		canAccessAnalytics: false,
	},
});

describe("Sidebar navigation", () => {
	beforeEach(() => {
		mockState.user = null;
		mockState.sidebarCollapsed = true;
	});

	it("shows hub page links for admin roles", () => {
		mockState.user = makeAdmin();

		render(
			<MemoryRouter>
				<Sidebar />
			</MemoryRouter>,
		);

		expect(screen.getByTestId("nav-/admin/programs")).toBeInTheDocument();
		expect(screen.getByTestId("nav-/admin/classes")).toBeInTheDocument();
		expect(screen.getByTestId("nav-/admin/institution")).toBeInTheDocument();
	});

	it("shows my-courses and attendance links for teachers", () => {
		mockState.user = makeTeacher();

		render(
			<MemoryRouter>
				<Sidebar />
			</MemoryRouter>,
		);

		expect(screen.getByTestId("nav-/teacher")).toBeInTheDocument();
		expect(screen.getByTestId("nav-/teacher/attendance")).toBeInTheDocument();
	});
});
