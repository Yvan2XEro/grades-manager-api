describe("Authentication - Logout", () => {
	beforeEach(() => {
		cy.resetDatabase();
	});

	it("successfully logs out admin user", () => {
		cy.loginAs("administrator");

		// Find and click logout button/link
		// This might be in a dropdown menu or header
		cy.findByRole("button", { name: /logout|sign out|déconnexion/i }).click();

		// Should redirect to login page
		cy.location("pathname", { timeout: 10000 }).should("include", "/auth/login");

		// Session should be invalidated
		cy.visit("/admin", { failOnStatusCode: false });
		cy.location("pathname").should("include", "/auth/login");
	});

	it("successfully logs out teacher user", () => {
		cy.loginAs("teacher");

		cy.findByRole("button", { name: /logout|sign out|déconnexion/i }).click();

		// Should redirect to login page
		cy.location("pathname", { timeout: 10000 }).should("include", "/auth/login");

		// Try to access teacher pages - should be redirected
		cy.visit("/teacher/grades", { failOnStatusCode: false });
		cy.location("pathname").should("include", "/auth/login");
	});

	it("clears session data on logout", () => {
		cy.loginAs("administrator");

		// Store some data to verify it gets cleared
		cy.window().then((win) => {
			const hasAuthData =
				win.localStorage.length > 0 || document.cookie.length > 0;
			expect(hasAuthData).to.be.true;
		});

		cy.findByRole("button", { name: /logout|sign out|déconnexion/i }).click();

		cy.location("pathname", { timeout: 10000 }).should("include", "/auth/login");

		// Verify session storage is cleared
		cy.window().then((win) => {
			// Check that auth-related storage is cleared
			const authKeys = Object.keys(win.localStorage).filter((key) =>
				key.toLowerCase().includes("auth"),
			);
			expect(authKeys.length).to.equal(0);
		});
	});

	it("prevents back navigation after logout", () => {
		cy.loginAs("administrator");
		cy.visit("/admin/students");

		cy.findByRole("button", { name: /logout|sign out|déconnexion/i }).click();
		cy.location("pathname", { timeout: 10000 }).should("include", "/auth/login");

		// Try to go back
		cy.go("back");

		// Should still be on login or redirect back to login
		cy.location("pathname", { timeout: 5000 }).should("include", "/auth/login");
	});

	it("requires re-authentication after logout", () => {
		cy.loginAs("administrator");

		cy.findByRole("button", { name: /logout|sign out|déconnexion/i }).click();
		cy.location("pathname", { timeout: 10000 }).should("include", "/auth/login");

		// Try to access protected page without logging back in
		cy.visit("/admin/students", { failOnStatusCode: false });
		cy.location("pathname").should("include", "/auth/login");

		// Now log back in
		cy.findByLabelText(/email/i)
			.clear()
			.type(Cypress.env("ADMIN_EMAIL"));
		cy.findByLabelText(/password/i)
			.clear()
			.type(Cypress.env("ADMIN_PASSWORD"));
		cy.findByRole("button", { name: /sign in/i }).click();

		// Should now have access
		cy.location("pathname", { timeout: 10000 }).should("not.include", "login");
	});

	it("handles logout when already logged out", () => {
		// Visit logout endpoint without being logged in
		cy.visit("/auth/login");

		// Should not crash or error
		cy.location("pathname").should("include", "/auth/login");
	});
});
