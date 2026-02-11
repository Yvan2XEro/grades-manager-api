import "@testing-library/cypress/add-commands";

type Role = "administrator" | "dean" | "teacher";
type LoginOptions = { route?: string };

const credentialEnvMap: Record<Role, { email: string; password: string }> = {
	administrator: {
		email: Cypress.env("ADMIN_EMAIL"),
		password: Cypress.env("ADMIN_PASSWORD"),
	},
	dean: {
		email: Cypress.env("DEAN_EMAIL"),
		password: Cypress.env("DEAN_PASSWORD"),
	},
	teacher: {
		email: Cypress.env("TEACHER_EMAIL"),
		password: Cypress.env("TEACHER_PASSWORD"),
	},
};

function getCredentials(role: Role) {
	const creds = credentialEnvMap[role];
	if (!creds?.email || !creds?.password) {
		throw new Error(
			`Missing Cypress credentials for role ${role}. Define CYPRESS_${role.toUpperCase()}_EMAIL and password.`,
		);
	}
	return creds;
}

Cypress.Commands.add("loginAs", (role: Role, options: LoginOptions = {}) => {
	const { route = "/" } = options;
	const { email, password } = getCredentials(role);
	const target = route.startsWith("/") ? route : `/${route}`;
	const loginUrl = `/auth/login?return=${encodeURIComponent(target)}`;

	cy.visit(loginUrl);
	cy.findByLabelText(/email/i).clear().type(email);
	cy.findByLabelText(/password/i)
		.clear()
		.type(password, { log: false });
	cy.findByRole("button", { name: /sign in/i }).click();
	cy.location("pathname", { timeout: 10000 }).should("eq", target);
});

Cypress.Commands.add("resetDatabase", () => {
	cy.task("resetDB");
});

Cypress.Commands.add("logout", () => {
	cy.findByRole("button", { name: /logout|sign out|déconnexion/i })
		.first()
		.click();
	cy.location("pathname", { timeout: 10000 }).should("include", "/auth/login");
});

declare global {
	namespace Cypress {
		interface Chainable {
			loginAs(role: Role, options?: LoginOptions): Chainable<void>;
			resetDatabase(): Chainable<void>;
			logout(): Chainable<void>;
		}
	}
}
