describe("Student Management - Bulk Import", () => {
	beforeEach(() => {
		cy.resetDatabase();
	});

	describe("CSV/Excel Import", () => {
		it("successfully imports valid CSV file with multiple students", () => {
			cy.loginAs("administrator", { route: "/admin/students" });

			// Look for import button
			cy.findByRole("button", {
				name: /import|upload|bulk.*add|importer/i,
			}).click();

			// Create a valid CSV fixture
			const csvContent = `firstName,lastName,email,dateOfBirth,placeOfBirth,gender
Alice,Johnson,alice.johnson@example.com,2000-03-15,Yaoundé,female
Bob,Smith,bob.smith@example.com,2001-07-22,Douala,male
Carol,Williams,carol.williams@example.com,2000-11-30,Bafoussam,female`;

			// Upload the file
			cy.get('input[type="file"]').selectFile(
				{
					contents: Cypress.Buffer.from(csvContent),
					fileName: "students.csv",
					mimeType: "text/csv",
				},
				{ force: true },
			);

			// Select class for bulk import
			cy.get(
				'[data-testid="class-select"], #class, #classId, [name="classId"]',
				{ timeout: 5000 },
			).click();
			cy.get("[role=option]").first().click();

			// Submit import
			cy.findByRole("button", {
				name: /import|upload|process|submit|traiter/i,
			}).click();

			// Should show success message with count
			cy.contains(/3.*imported|3.*students|3.*créés|success|succès/i, {
				timeout: 15000,
			}).should("exist");

			// Should see imported students in the list
			cy.contains("Alice").should("exist");
			cy.contains("Bob").should("exist");
			cy.contains("Carol").should("exist");
		});

		it("handles duplicate emails during bulk import", () => {
			cy.loginAs("administrator", { route: "/admin/students" });

			// First, create a student
			cy.findByRole("button", {
				name: /add.*student|create.*student|new.*student|ajouter.*étudiant|nouvel.*étudiant/i,
			}).click();

			cy.findByLabelText(/first.*name|prénom/i)
				.clear()
				.type("Existing");
			cy.findByLabelText(/last.*name|nom/i)
				.clear()
				.type("Student");
			cy.findByLabelText(/email|courriel/i)
				.clear()
				.type("existing@example.com");
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

			// Now try to import with duplicate
			cy.findByRole("button", {
				name: /import|upload|bulk.*add|importer/i,
			}).click();

			const csvContent = `firstName,lastName,email,dateOfBirth,placeOfBirth,gender
NewUser,ValidUser,newuser@example.com,2000-03-15,Yaoundé,female
Duplicate,User,existing@example.com,2001-07-22,Douala,male`;

			cy.get('input[type="file"]').selectFile(
				{
					contents: Cypress.Buffer.from(csvContent),
					fileName: "students.csv",
					mimeType: "text/csv",
				},
				{ force: true },
			);

			cy.get(
				'[data-testid="class-select"], #class, #classId, [name="classId"]',
				{ timeout: 5000 },
			).click();
			cy.get("[role=option]").first().click();

			cy.findByRole("button", {
				name: /import|upload|process|submit|traiter/i,
			}).click();

			// Should show report with successes and conflicts
			cy.contains(/1.*created|1.*imported|1.*success/i, {
				timeout: 15000,
			}).should("exist");
			cy.contains(/1.*conflict|1.*duplicate|1.*error|1.*échec/i, {
				timeout: 5000,
			}).should("exist");
		});

		it("displays error report for invalid data", () => {
			cy.loginAs("administrator", { route: "/admin/students" });

			cy.findByRole("button", {
				name: /import|upload|bulk.*add|importer/i,
			}).click();

			// CSV with invalid data (missing required fields)
			const csvContent = `firstName,lastName,email,dateOfBirth,placeOfBirth,gender
ValidUser,Smith,valid@example.com,2000-03-15,Yaoundé,female
,MissingFirstName,missing@example.com,2001-07-22,Douala,male
NoEmail,User,,2000-11-30,Bafoussam,female`;

			cy.get('input[type="file"]').selectFile(
				{
					contents: Cypress.Buffer.from(csvContent),
					fileName: "students.csv",
					mimeType: "text/csv",
				},
				{ force: true },
			);

			cy.get(
				'[data-testid="class-select"], #class, #classId, [name="classId"]',
				{ timeout: 5000 },
			).click();
			cy.get("[role=option]").first().click();

			cy.findByRole("button", {
				name: /import|upload|process|submit|traiter/i,
			}).click();

			// Should show error report
			cy.contains(/error|errors|erreur/i, { timeout: 15000 }).should("exist");
			cy.contains(/1.*created|1.*success/i).should("exist");
			cy.contains(/2.*error|2.*failed|2.*échec/i).should("exist");
		});

		it("validates CSV format and headers", () => {
			cy.loginAs("administrator", { route: "/admin/students" });

			cy.findByRole("button", {
				name: /import|upload|bulk.*add|importer/i,
			}).click();

			// CSV with wrong headers
			const csvContent = `wrongHeader1,wrongHeader2,wrongHeader3
Value1,Value2,Value3`;

			cy.get('input[type="file"]').selectFile(
				{
					contents: Cypress.Buffer.from(csvContent),
					fileName: "students.csv",
					mimeType: "text/csv",
				},
				{ force: true },
			);

			cy.get(
				'[data-testid="class-select"], #class, #classId, [name="classId"]',
				{ timeout: 5000 },
			).click();
			cy.get("[role=option]").first().click();

			cy.findByRole("button", {
				name: /import|upload|process|submit|traiter/i,
			}).click();

			// Should show format validation error
			cy.contains(/invalid.*format|format.*invalide|header|column/i, {
				timeout: 10000,
			}).should("exist");
		});

		it("requires class selection for bulk import", () => {
			cy.loginAs("administrator", { route: "/admin/students" });

			cy.findByRole("button", {
				name: /import|upload|bulk.*add|importer/i,
			}).click();

			const csvContent = `firstName,lastName,email,dateOfBirth,placeOfBirth,gender
Test,User,test@example.com,2000-03-15,Yaoundé,female`;

			cy.get('input[type="file"]').selectFile(
				{
					contents: Cypress.Buffer.from(csvContent),
					fileName: "students.csv",
					mimeType: "text/csv",
				},
				{ force: true },
			);

			// Don't select a class, try to submit
			cy.findByRole("button", {
				name: /import|upload|process|submit|traiter/i,
			}).click();

			// Should show validation error
			cy.contains(/class.*required|classe.*obligatoire/i, {
				timeout: 5000,
			}).should("exist");
		});
	});

	describe("Import Preview", () => {
		it("shows preview of data before importing (if feature exists)", () => {
			cy.loginAs("administrator", { route: "/admin/students" });

			cy.findByRole("button", {
				name: /import|upload|bulk.*add|importer/i,
			}).click();

			const csvContent = `firstName,lastName,email,dateOfBirth,placeOfBirth,gender
Preview,User,preview@example.com,2000-03-15,Yaoundé,female`;

			cy.get('input[type="file"]').selectFile(
				{
					contents: Cypress.Buffer.from(csvContent),
					fileName: "students.csv",
					mimeType: "text/csv",
				},
				{ force: true },
			);

			// Check if preview is shown
			cy.get("body").then(($body) => {
				if (
					$body.text().match(/preview|aperçu/i) ||
					$body.find('[data-testid*="preview"]').length > 0
				) {
					cy.log("Import preview feature exists");
					cy.contains(/preview|aperçu/i).should("exist");
					cy.contains("Preview").should("exist");
					cy.contains("User").should("exist");
				} else {
					cy.log("No preview feature - skipping");
				}
			});
		});
	});

	describe("Import Report", () => {
		it("displays detailed import report after processing", () => {
			cy.loginAs("administrator", { route: "/admin/students" });

			cy.findByRole("button", {
				name: /import|upload|bulk.*add|importer/i,
			}).click();

			const csvContent = `firstName,lastName,email,dateOfBirth,placeOfBirth,gender
Report1,User1,report1@example.com,2000-03-15,Yaoundé,female
Report2,User2,report2@example.com,2001-07-22,Douala,male`;

			cy.get('input[type="file"]').selectFile(
				{
					contents: Cypress.Buffer.from(csvContent),
					fileName: "students.csv",
					mimeType: "text/csv",
				},
				{ force: true },
			);

			cy.get(
				'[data-testid="class-select"], #class, #classId, [name="classId"]',
				{ timeout: 5000 },
			).click();
			cy.get("[role=option]").first().click();

			cy.findByRole("button", {
				name: /import|upload|process|submit|traiter/i,
			}).click();

			// Should show report
			cy.contains(/report|rapport|summary|résumé/i, {
				timeout: 15000,
			}).should("exist");
			cy.contains(/2.*imported|2.*created|2.*success/i).should("exist");
		});

		it("shows specific errors for failed rows", () => {
			cy.loginAs("administrator", { route: "/admin/students" });

			cy.findByRole("button", {
				name: /import|upload|bulk.*add|importer/i,
			}).click();

			// Mix of valid and invalid
			const csvContent = `firstName,lastName,email,dateOfBirth,placeOfBirth,gender
Valid,User,valid@example.com,2000-03-15,Yaoundé,female
,InvalidUser,invalid@example.com,2001-07-22,Douala,male`;

			cy.get('input[type="file"]').selectFile(
				{
					contents: Cypress.Buffer.from(csvContent),
					fileName: "students.csv",
					mimeType: "text/csv",
				},
				{ force: true },
			);

			cy.get(
				'[data-testid="class-select"], #class, #classId, [name="classId"]',
				{ timeout: 5000 },
			).click();
			cy.get("[role=option]").first().click();

			cy.findByRole("button", {
				name: /import|upload|process|submit|traiter/i,
			}).click();

			// Should show which rows failed
			cy.contains(/row.*2|line.*2|ligne.*2/i, { timeout: 15000 }).should(
				"exist",
			);
		});
	});

	describe("Large File Handling", () => {
		it("handles importing many students at once", () => {
			cy.loginAs("administrator", { route: "/admin/students" });

			cy.findByRole("button", {
				name: /import|upload|bulk.*add|importer/i,
			}).click();

			// Generate CSV with 20 students
			let csvContent =
				"firstName,lastName,email,dateOfBirth,placeOfBirth,gender\n";
			for (let i = 1; i <= 20; i++) {
				csvContent += `Student${i},User${i},student${i}@example.com,2000-01-${String(i).padStart(2, "0")},Yaoundé,${i % 2 === 0 ? "male" : "female"}\n`;
			}

			cy.get('input[type="file"]').selectFile(
				{
					contents: Cypress.Buffer.from(csvContent),
					fileName: "students.csv",
					mimeType: "text/csv",
				},
				{ force: true },
			);

			cy.get(
				'[data-testid="class-select"], #class, #classId, [name="classId"]',
				{ timeout: 5000 },
			).click();
			cy.get("[role=option]").first().click();

			cy.findByRole("button", {
				name: /import|upload|process|submit|traiter/i,
			}).click();

			// Should process successfully (may take longer)
			cy.contains(/20.*imported|20.*created|20.*success/i, {
				timeout: 30000,
			}).should("exist");
		});
	});

	describe("Cancel Import", () => {
		it("allows canceling import before processing", () => {
			cy.loginAs("administrator", { route: "/admin/students" });

			cy.findByRole("button", {
				name: /import|upload|bulk.*add|importer/i,
			}).click();

			const csvContent = `firstName,lastName,email,dateOfBirth,placeOfBirth,gender
Cancel,Test,cancel@example.com,2000-03-15,Yaoundé,female`;

			cy.get('input[type="file"]').selectFile(
				{
					contents: Cypress.Buffer.from(csvContent),
					fileName: "students.csv",
					mimeType: "text/csv",
				},
				{ force: true },
			);

			// Click cancel
			cy.findByRole("button", { name: /cancel|annuler/i }).click();

			// Should close import dialog
			cy.get('input[type="file"]').should("not.exist");
		});
	});
});
