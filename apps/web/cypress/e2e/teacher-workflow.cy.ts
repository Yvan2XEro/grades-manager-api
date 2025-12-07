const selectFirstClassCourse = () => {
	cy.get("#class-course", { timeout: 10000 }).click();
	cy.get("[role=option]").first().click();
	cy.contains(/Exam workflow/i).should("exist");
};

describe("Teacher exam workflow", () => {
	beforeEach(() => {
		cy.resetDatabase();
	});

	it("submits, gets approved, and locks an exam", () => {
		// Teacher submits an exam for approval.
		cy.loginAs("teacher", { route: "/teacher/workflows" });
		selectFirstClassCourse();
		cy.findAllByRole("button", { name: /Submit/i })
			.first()
			.click();
		cy.contains(/Exam submitted/i, { timeout: 10000 }).should("exist");

		// Dean approves the submitted exam.
		cy.loginAs("dean", { route: "/dean/workflows" });
		cy.findAllByRole("button", { name: /Approve & lock/i })
			.first()
			.click();
		cy.contains(/Exam approved/i, { timeout: 10000 }).should("exist");

		// Teacher locks the approved exam.
		cy.loginAs("teacher", { route: "/teacher/workflows" });
		selectFirstClassCourse();
		cy.findAllByRole("button", { name: /Lock/i }).first().click();
		cy.contains(/Exam locked/i, { timeout: 10000 }).should("exist");
	});
});
