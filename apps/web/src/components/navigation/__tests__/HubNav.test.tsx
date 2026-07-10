import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { HubNav } from "../HubNav";

const tabs = [
	{ path: "overview", labelKey: "institutionHub.tabs.overview" },
	{ path: "faculties", labelKey: "institutionHub.tabs.faculties" },
	{ path: "cycles", labelKey: "institutionHub.tabs.cycles" },
] as const;

function renderHubNav(initialPath: string) {
	render(
		<MemoryRouter initialEntries={[initialPath]}>
			<Routes>
				<Route
					path="/admin/institution/*"
					element={<HubNav tabs={tabs} basePath="/admin/institution" />}
				/>
			</Routes>
		</MemoryRouter>,
	);
}

describe("HubNav", () => {
	it("renders all tabs as links with correct hrefs", () => {
		renderHubNav("/admin/institution/overview");

		expect(
			screen.getByRole("link", { name: "institutionHub.tabs.overview" }),
		).toHaveAttribute("href", "/admin/institution/overview");
		expect(
			screen.getByRole("link", { name: "institutionHub.tabs.faculties" }),
		).toHaveAttribute("href", "/admin/institution/faculties");
		expect(
			screen.getByRole("link", { name: "institutionHub.tabs.cycles" }),
		).toHaveAttribute("href", "/admin/institution/cycles");
	});

	it("applies active style to the tab matching current path", () => {
		renderHubNav("/admin/institution/faculties");

		const facultesLink = screen.getByRole("link", {
			name: "institutionHub.tabs.faculties",
		});
		expect(facultesLink).toHaveClass("border-primary");
		expect(facultesLink).toHaveClass("text-primary");

		const overviewLink = screen.getByRole("link", {
			name: "institutionHub.tabs.overview",
		});
		expect(overviewLink).toHaveClass("border-transparent");
		expect(overviewLink).toHaveClass("text-muted-foreground");
	});

	it("marks active tab when current path has a sub-segment", () => {
		renderHubNav("/admin/institution/faculties/some-id");

		const facultesLink = screen.getByRole("link", {
			name: "institutionHub.tabs.faculties",
		});
		expect(facultesLink).toHaveClass("border-primary");
	});
});
