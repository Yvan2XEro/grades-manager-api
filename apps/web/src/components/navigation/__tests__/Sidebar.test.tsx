import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { useStore } from "../../../store";
import Sidebar from "../Sidebar";

describe("Sidebar navigation", () => {
	beforeEach(() => {
		useStore.setState({
			user: null,
			sidebarOpen: true,
			setUser: () => {},
			clearUser: () => {},
			toggleSidebar: () => {},
			setSidebarOpen: () => {},
		});
	});

	const mockUser = (role: "administrator" | "teacher") => ({
		profileId: "user-1",
		authUserId: "user-1",
		email: "user@example.com",
		firstName: "Jane",
		lastName: "Doe",
		role,
		permissions: {
			canManageCatalog: role === "administrator",
			canManageStudents: role === "administrator",
			canGrade: true,
			canAccessAnalytics: role === "administrator",
		},
	});

	it("shows teaching unit and enrollment links for admin roles", () => {
		useStore.setState((state) => ({
			...state,
			user: mockUser("administrator"),
		}));

		render(
			<MemoryRouter>
				<Sidebar />
			</MemoryRouter>,
		);

		expect(screen.getByTestId("nav-/admin/teaching-units")).toBeInTheDocument();
		expect(screen.getByTestId("nav-/admin/enrollments")).toBeInTheDocument();
	});

	it("shows workflow link for teachers", () => {
		useStore.setState((state) => ({
			...state,
			user: mockUser("teacher"),
		}));

		render(
			<MemoryRouter>
				<Sidebar />
			</MemoryRouter>,
		);

		expect(screen.getByTestId("nav-/teacher/workflows")).toBeInTheDocument();
	});
});
