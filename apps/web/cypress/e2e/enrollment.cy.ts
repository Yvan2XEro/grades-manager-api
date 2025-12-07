describe("Enrollment management", () => {
	beforeEach(() => {
		cy.resetDatabase();
	});

	it("opens windows, auto-enrolls the class, and inspects roster", () => {
		cy.loginAs("administrator", { route: "/admin/enrollments" });

		cy.get('[data-testid="academic-year-select"]').click();
		cy.findByRole("option", { name: /2024-2025/i }).click();

		cy.get('[data-testid="class-select"]').click();
		cy.findByRole("option", {
			name: /Software Engineering L1 - Cohort A/i,
		}).click();

		cy.contains("ENG24-0001").should("exist");
		cy.contains("Window:").should("exist");

		cy.findByRole("button", { name: /Enroll entire class/i }).click();
		cy.findByRole("button", { name: /Confirm enrollment/i }).click();
		cy.contains(/Class roster synced/i, { timeout: 10000 }).should("exist");

		cy.findAllByRole("button", { name: /Open roster/i })
			.first()
			.click();
		cy.contains(/Course roster/i).should("exist");
		cy.contains(/Managing:/i).should("exist");
		cy.get("body").type("{esc}");
	});
});
