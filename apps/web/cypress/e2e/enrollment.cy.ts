describe("Enrollment management", () => {
	beforeEach(() => {
		cy.resetDatabase();
	});

	it("opens windows, auto-enrolls the class, and inspects roster", () => {
		cy.loginAs("administrator", { route: "/admin/enrollments" });

		cy.contains("Academic year").parent().find("button").click();
		cy.contains("2024-2025").click();

		cy.contains("Class").parent().find("button").click();
		cy.contains("Software Engineering L1 - Cohort A").click();

		cy.contains("Students: 1").should("exist");
		cy.contains("Window:").should("exist");

		cy.findByRole("button", { name: /Enroll entire class/i }).click();
		cy.findByRole("button", { name: /Confirm enrollment/i }).click();
		cy.contains(/Class roster synced/i, { timeout: 10000 }).should("exist");

		cy.findAllByRole("button", { name: /View roster/i })
			.first()
			.click();
		cy.contains(/Course roster/i).should("exist");
		cy.contains(/Managing:/i).should("exist");
		cy.get("body").type("{esc}");
	});
});
