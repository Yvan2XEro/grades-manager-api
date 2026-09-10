import "@testing-library/cypress/add-commands";
import "./commands";

const _API_URL = "http://localhost:3001";

Cypress.Commands.add("loginAs", (role: "sysadmin" | "admin" | "teacher") => {
	const map = {
		sysadmin: {
			email: Cypress.env("SYSADMIN_EMAIL"),
			password: Cypress.env("SYSADMIN_PASSWORD"),
		},
		admin: {
			email: Cypress.env("ADMIN_EMAIL"),
			password: Cypress.env("ADMIN_PASSWORD"),
		},
		teacher: {
			email: Cypress.env("TEACHER_EMAIL"),
			password: Cypress.env("TEACHER_PASSWORD"),
		},
	};
	const creds = map[role];
	cy.session(
		role,
		() => {
			cy.visit("/#/login");
			cy.findByLabelText(/adresse email|email/i).type(creds.email);
			cy.findByLabelText(/mot de passe|password/i).type(creds.password);
			cy.findByRole("button", { name: /se connecter|sign in/i }).click();
			cy.url().should("not.include", "/login", { timeout: 15000 });
			if (role !== "sysadmin") {
				// OrgGuard runs: list() → setActive() → window.location.reload() → AppShell renders.
				// shadcn Sidebar uses <div data-sidebar="sidebar">, not <aside>. Wait for that element.
				cy.get("[data-sidebar='sidebar']", { timeout: 20000 }).should("exist");
			}
		},
		{
			// Detect invalidated sessions (e.g. after a password change revokes all sessions,
			// or after TC-SA-ID-09 deletes the active institution leaving OrgGuard in create-mode).
			validate() {
				cy.visit("/#/");
				cy.url({ timeout: 10000 }).should("not.include", "/login");
				if (role !== "sysadmin") {
					// OrgGuard shows "create institution" form when the active org is gone —
					// the URL stays "/#/" so the url check above passes but the session is stale.
					// Sidebar only renders when OrgGuard succeeds, so this is the right sentinel.
					cy.get("[data-sidebar='sidebar']", { timeout: 15000 }).should(
						"exist",
					);
				}
			},
		},
	);
});

Cypress.Commands.add("interceptTrpc", (procedure: string, alias: string) => {
	// httpBatchLink batches multiple procedures into one URL like
	// /trpc/proc1,proc2?batch=1 — use regex so we match even when the
	// target procedure is not first in the batch.
	const escaped = procedure.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
	cy.intercept(new RegExp(`/trpc/[^?]*${escaped}`)).as(alias);
});
