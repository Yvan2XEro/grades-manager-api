describe("Student Management - Creation", () => {
	beforeEach(() => {
		cy.resetDatabase();
	});

	describe("Creating a Student", () => {
		it("successfully creates a student with complete form", () => {
			cy.loginAs("administrator", { route: "/admin/students" });

			// Click create/add student button
			cy.findByRole("button", {
				name: /add.*student|create.*student|new.*student|ajouter.*étudiant|nouvel.*étudiant/i,
			}).click();

			// Fill in the form
			cy.findByLabelText(/first.*name|prénom/i)
				.clear()
				.type("Jean");
			cy.findByLabelText(/last.*name|nom/i)
				.clear()
				.type("Dupont");
			cy.findByLabelText(/email|courriel/i)
				.clear()
				.type("jean.dupont@example.com");

			// Date of birth
			cy.findByLabelText(/date.*birth|date.*naissance/i)
				.clear()
				.type("2000-01-15");

			// Place of birth
			cy.findByLabelText(/place.*birth|lieu.*naissance/i)
				.clear()
				.type("Yaoundé");

			// Gender
			cy.get('[data-testid="gender-select"], #gender, [name="gender"]', {
				timeout: 5000,
			}).click();
			cy.get("[role=option]").first().click();

			// Select a class
			cy.get(
				'[data-testid="class-select"], #class, #classId, [name="classId"]',
				{ timeout: 5000 },
			).click();
			cy.get("[role=option]").first().click();

			// Submit the form
			cy.findByRole("button", {
				name: /save|create|submit|enregistrer|créer/i,
			}).click();

			// Should show success message
			cy.contains(/created|créé|success|succès/i, { timeout: 10000 }).should(
				"exist",
			);

			// Should see the student in the list
			cy.contains("Jean").should("exist");
			cy.contains("Dupont").should("exist");
		});

		it("auto-generates registration number when format is active", () => {
			cy.loginAs("administrator", { route: "/admin/students" });

			// Click create student
			cy.findByRole("button", {
				name: /add.*student|create.*student|new.*student|ajouter.*étudiant|nouvel.*étudiant/i,
			}).click();

			// Fill in required fields (without registration number)
			cy.findByLabelText(/first.*name|prénom/i)
				.clear()
				.type("Marie");
			cy.findByLabelText(/last.*name|nom/i)
				.clear()
				.type("Martin");
			cy.findByLabelText(/email|courriel/i)
				.clear()
				.type("marie.martin@example.com");

			cy.findByLabelText(/date.*birth|date.*naissance/i)
				.clear()
				.type("2001-05-20");

			cy.findByLabelText(/place.*birth|lieu.*naissance/i)
				.clear()
				.type("Douala");

			cy.get('[data-testid="gender-select"], #gender, [name="gender"]', {
				timeout: 5000,
			}).click();
			cy.get("[role=option]").first().click();

			cy.get(
				'[data-testid="class-select"], #class, #classId, [name="classId"]',
				{ timeout: 5000 },
			).click();
			cy.get("[role=option]").first().click();

			// Submit
			cy.findByRole("button", {
				name: /save|create|submit|enregistrer|créer/i,
			}).click();

			// Should create successfully
			cy.contains(/created|créé|success|succès/i, { timeout: 10000 }).should(
				"exist",
			);

			// Should see auto-generated registration number in the list
			cy.get("body").then(($body) => {
				const hasRegNumber =
					$body.text().match(/REG-\d+|ENG\d+-\d+|\d{4,}/) !== null;
				expect(hasRegNumber).to.be.true;
			});
		});

		it("displays validation errors for missing required fields", () => {
			cy.loginAs("administrator", { route: "/admin/students" });

			cy.findByRole("button", {
				name: /add.*student|create.*student|new.*student|ajouter.*étudiant|nouvel.*étudiant/i,
			}).click();

			// Try to submit without filling required fields
			cy.findByRole("button", {
				name: /save|create|submit|enregistrer|créer/i,
			}).click();

			// Should show validation errors
			cy.contains(/required|obligatoire|must.*provide|doit/i, {
				timeout: 5000,
			}).should("exist");
		});

		it("validates email format", () => {
			cy.loginAs("administrator", { route: "/admin/students" });

			cy.findByRole("button", {
				name: /add.*student|create.*student|new.*student|ajouter.*étudiant|nouvel.*étudiant/i,
			}).click();

			// Fill with invalid email
			cy.findByLabelText(/first.*name|prénom/i)
				.clear()
				.type("Test");
			cy.findByLabelText(/last.*name|nom/i)
				.clear()
				.type("User");
			cy.findByLabelText(/email|courriel/i)
				.clear()
				.type("not-a-valid-email");

			// Try to submit
			cy.findByRole("button", {
				name: /save|create|submit|enregistrer|créer/i,
			}).click();

			// Should show email validation error
			cy.get("body").then(($body) => {
				const hasEmailError =
					$body.text().match(/email.*invalid|email.*valide|format/i) !== null;
				const inputInvalid =
					$body.find('input[type="email"]:invalid').length > 0;

				expect(hasEmailError || inputInvalid).to.be.true;
			});
		});

		it("prevents duplicate emails", () => {
			cy.loginAs("administrator", { route: "/admin/students" });

			// Create first student
			cy.findByRole("button", {
				name: /add.*student|create.*student|new.*student|ajouter.*étudiant|nouvel.*étudiant/i,
			}).click();

			cy.findByLabelText(/first.*name|prénom/i)
				.clear()
				.type("First");
			cy.findByLabelText(/last.*name|nom/i)
				.clear()
				.type("Student");
			cy.findByLabelText(/email|courriel/i)
				.clear()
				.type("duplicate@example.com");
			cy.findByLabelText(/date.*birth|date.*naissance/i)
				.clear()
				.type("2000-01-15");
			cy.findByLabelText(/place.*birth|lieu.*naissance/i)
				.clear()
				.type("Yaoundé");

			cy.get('[data-testid="gender-select"], #gender, [name="gender"]', {
				timeout: 5000,
			}).click();
			cy.get("[role=option]").first().click();

			cy.get(
				'[data-testid="class-select"], #class, #classId, [name="classId"]',
				{ timeout: 5000 },
			).click();
			cy.get("[role=option]").first().click();

			cy.findByRole("button", {
				name: /save|create|submit|enregistrer|créer/i,
			}).click();

			cy.contains(/created|créé|success|succès/i, { timeout: 10000 }).should(
				"exist",
			);

			// Try to create second student with same email
			cy.findByRole("button", {
				name: /add.*student|create.*student|new.*student|ajouter.*étudiant|nouvel.*étudiant/i,
			}).click();

			cy.findByLabelText(/first.*name|prénom/i)
				.clear()
				.type("Second");
			cy.findByLabelText(/last.*name|nom/i)
				.clear()
				.type("Student");
			cy.findByLabelText(/email|courriel/i)
				.clear()
				.type("duplicate@example.com");
			cy.findByLabelText(/date.*birth|date.*naissance/i)
				.clear()
				.type("2001-05-20");
			cy.findByLabelText(/place.*birth|lieu.*naissance/i)
				.clear()
				.type("Douala");

			cy.get('[data-testid="gender-select"], #gender, [name="gender"]', {
				timeout: 5000,
			}).click();
			cy.get("[role=option]").first().click();

			cy.get(
				'[data-testid="class-select"], #class, #classId, [name="classId"]',
				{ timeout: 5000 },
			).click();
			cy.get("[role=option]").first().click();

			cy.findByRole("button", {
				name: /save|create|submit|enregistrer|créer/i,
			}).click();

			// Should show duplicate error
			cy.contains(/duplicate|already.*exists|existe.*déjà|conflict/i, {
				timeout: 10000,
			}).should("exist");
		});

		it("shows created student in the list immediately", () => {
			cy.loginAs("administrator", { route: "/admin/students" });

			const firstName = "NewStudent";
			const lastName = "TestUser";

			cy.findByRole("button", {
				name: /add.*student|create.*student|new.*student|ajouter.*étudiant|nouvel.*étudiant/i,
			}).click();

			cy.findByLabelText(/first.*name|prénom/i)
				.clear()
				.type(firstName);
			cy.findByLabelText(/last.*name|nom/i)
				.clear()
				.type(lastName);
			cy.findByLabelText(/email|courriel/i)
				.clear()
				.type("newstudent@example.com");
			cy.findByLabelText(/date.*birth|date.*naissance/i)
				.clear()
				.type("2002-08-10");
			cy.findByLabelText(/place.*birth|lieu.*naissance/i)
				.clear()
				.type("Yaoundé");

			cy.get('[data-testid="gender-select"], #gender, [name="gender"]', {
				timeout: 5000,
			}).click();
			cy.get("[role=option]").first().click();

			cy.get(
				'[data-testid="class-select"], #class, #classId, [name="classId"]',
				{ timeout: 5000 },
			).click();
			cy.get("[role=option]").first().click();

			cy.findByRole("button", {
				name: /save|create|submit|enregistrer|créer/i,
			}).click();

			cy.contains(/created|créé|success|succès/i, { timeout: 10000 }).should(
				"exist",
			);

			// Verify student appears in list
			cy.contains(firstName, { timeout: 5000 }).should("exist");
			cy.contains(lastName).should("exist");
		});
	});

	describe("Form Validation", () => {
		it("requires first name", () => {
			cy.loginAs("administrator", { route: "/admin/students" });

			cy.findByRole("button", {
				name: /add.*student|create.*student|new.*student|ajouter.*étudiant|nouvel.*étudiant/i,
			}).click();

			// Fill all except first name
			cy.findByLabelText(/last.*name|nom/i)
				.clear()
				.type("TestLast");
			cy.findByLabelText(/email|courriel/i)
				.clear()
				.type("test@example.com");

			cy.findByRole("button", {
				name: /save|create|submit|enregistrer|créer/i,
			}).click();

			// Should show validation error
			cy.contains(/first.*name.*required|prénom.*obligatoire/i, {
				timeout: 5000,
			}).should("exist");
		});

		it("requires last name", () => {
			cy.loginAs("administrator", { route: "/admin/students" });

			cy.findByRole("button", {
				name: /add.*student|create.*student|new.*student|ajouter.*étudiant|nouvel.*étudiant/i,
			}).click();

			// Fill all except last name
			cy.findByLabelText(/first.*name|prénom/i)
				.clear()
				.type("TestFirst");
			cy.findByLabelText(/email|courriel/i)
				.clear()
				.type("test@example.com");

			cy.findByRole("button", {
				name: /save|create|submit|enregistrer|créer/i,
			}).click();

			// Should show validation error
			cy.contains(/last.*name.*required|nom.*obligatoire/i, {
				timeout: 5000,
			}).should("exist");
		});

		it("requires class selection", () => {
			cy.loginAs("administrator", { route: "/admin/students" });

			cy.findByRole("button", {
				name: /add.*student|create.*student|new.*student|ajouter.*étudiant|nouvel.*étudiant/i,
			}).click();

			// Fill all except class
			cy.findByLabelText(/first.*name|prénom/i)
				.clear()
				.type("Test");
			cy.findByLabelText(/last.*name|nom/i)
				.clear()
				.type("User");
			cy.findByLabelText(/email|courriel/i)
				.clear()
				.type("test@example.com");

			cy.findByRole("button", {
				name: /save|create|submit|enregistrer|créer/i,
			}).click();

			// Should show validation error
			cy.contains(/class.*required|classe.*obligatoire/i, {
				timeout: 5000,
			}).should("exist");
		});
	});

	describe("Cancel Creation", () => {
		it("allows canceling student creation", () => {
			cy.loginAs("administrator", { route: "/admin/students" });

			cy.findByRole("button", {
				name: /add.*student|create.*student|new.*student|ajouter.*étudiant|nouvel.*étudiant/i,
			}).click();

			// Fill some data
			cy.findByLabelText(/first.*name|prénom/i)
				.clear()
				.type("WillCancel");

			// Click cancel
			cy.findByRole("button", { name: /cancel|annuler/i }).click();

			// Should close the form/modal
			cy.findByLabelText(/first.*name|prénom/i).should("not.exist");
		});

		it("discards data when canceling", () => {
			cy.loginAs("administrator", { route: "/admin/students" });

			cy.findByRole("button", {
				name: /add.*student|create.*student|new.*student|ajouter.*étudiant|nouvel.*étudiant/i,
			}).click();

			cy.findByLabelText(/first.*name|prénom/i)
				.clear()
				.type("WillCancel");

			cy.findByRole("button", { name: /cancel|annuler/i }).click();

			// Open form again
			cy.findByRole("button", {
				name: /add.*student|create.*student|new.*student|ajouter.*étudiant|nouvel.*étudiant/i,
			}).click();

			// Form should be empty
			cy.findByLabelText(/first.*name|prénom/i).should("have.value", "");
		});
	});
});
