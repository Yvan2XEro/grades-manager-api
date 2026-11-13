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

// framer-motion bundles its own React copy, causing duplicate-React hook errors.
vi.mock("framer-motion", () => ({
	motion: new Proxy(
		{},
		{
			get:
				() =>
				({ children }: { children?: unknown }) =>
					children,
		},
	),
	AnimatePresence: ({ children }: { children?: unknown }) => children,
}));

// next-themes needs a ThemeProvider in the tree; avoid it entirely in tests.
vi.mock("next-themes", () => ({
	useTheme: () => ({ resolvedTheme: "light" }),
}));

import Sidebar from "../Sidebar";

const makeAdmin = () => ({
	profileId: "user-1",
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

		// Overview group is always rendered for admin
		expect(screen.getByTestId("nav-/")).toBeInTheDocument();
		expect(screen.getByTestId("nav-/institution")).toBeInTheDocument();
		expect(screen.getByTestId("nav-/academic-years")).toBeInTheDocument();

		// Teacher-specific links must not be present
		expect(screen.queryByTestId("nav-/exports")).not.toBeInTheDocument();
	});

	it("shows flat teacher links and hides admin links for teacher role", () => {
		mockState.user = makeTeacher();

		render(
			<MemoryRouter>
				<Sidebar />
			</MemoryRouter>,
		);

		// Flat mode — all links always rendered
		expect(screen.getByTestId("nav-/")).toBeInTheDocument();
		expect(screen.getByTestId("nav-/attendance")).toBeInTheDocument();
		expect(screen.getByTestId("nav-/exports")).toBeInTheDocument();

		// Admin-specific links must not be present
		expect(screen.queryByTestId("nav-/institution")).not.toBeInTheDocument();
	});

	it("shows new sidebar groups for admin role (JVL-99)", () => {
		mockState.user = makeAdmin();

		render(
			<MemoryRouter>
				<Sidebar />
			</MemoryRouter>,
		);

		// Inscriptions & Admissions group
		expect(screen.getByTestId("nav-/users/people")).toBeInTheDocument();
		expect(screen.getByTestId("nav-/admissions")).toBeInTheDocument();
		expect(screen.getByTestId("nav-/users/guardians")).toBeInTheDocument();

		// Academic results hub replaces separate deliberations/promotion entries
		expect(screen.getByTestId("nav-/academic-results")).toBeInTheDocument();
		expect(screen.queryByTestId("nav-/deliberations")).not.toBeInTheDocument();
		expect(screen.queryByTestId("nav-/promotion")).not.toBeInTheDocument();

		// Users reduced to its own group
		expect(screen.getByTestId("nav-/users")).toBeInTheDocument();

		// Export templates and class doc templates removed from sidebar (now in grades hub)
		expect(
			screen.queryByTestId("nav-/export-templates"),
		).not.toBeInTheDocument();
		expect(
			screen.queryByTestId("nav-/class-document-templates"),
		).not.toBeInTheDocument();
	});
});
