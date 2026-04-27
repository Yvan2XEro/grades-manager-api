import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { vi } from "vitest";

// Mutable state shared between test body and the mock factory
const mockState = {
	user: null as unknown,
	sidebarOpen: false,
	sidebarCollapsed: false,
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
		mockState.sidebarCollapsed = false;
	});

	it("shows admin overview links and hides teacher links for admin role", () => {
		mockState.user = makeAdmin();

		render(
			<MemoryRouter>
				<Sidebar />
			</MemoryRouter>,
		);

		// Overview group is open by default — these links are always visible
		expect(screen.getByTestId("nav-/admin")).toBeInTheDocument();
		expect(screen.getByTestId("nav-/admin/institution")).toBeInTheDocument();
		expect(screen.getByTestId("nav-/admin/academic-years")).toBeInTheDocument();

		// Teacher-specific links must not be present
		expect(screen.queryByTestId("nav-/teacher")).not.toBeInTheDocument();
	});

	it("shows flat teacher links and hides admin links for teacher role", () => {
		mockState.user = makeTeacher();

		render(
			<MemoryRouter>
				<Sidebar />
			</MemoryRouter>,
		);

		// Flat mode — all links always rendered
		expect(screen.getByTestId("nav-/teacher")).toBeInTheDocument();
		expect(screen.getByTestId("nav-/teacher/attendance")).toBeInTheDocument();
		expect(screen.getByTestId("nav-/teacher/workflows")).toBeInTheDocument();

		// Admin-specific links must not be present
		expect(screen.queryByTestId("nav-/admin")).not.toBeInTheDocument();
	});
});
