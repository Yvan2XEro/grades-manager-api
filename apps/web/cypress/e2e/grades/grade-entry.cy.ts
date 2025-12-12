describe("Grade Entry - Teacher Workflow", () => {
	beforeEach(() => {
		cy.resetDatabase();
	});

	describe("Basic Grade Entry", () => {
		it("allows teacher to enter grades for multiple students", () => {
			cy.loginAs("teacher", { route: "/teacher/grades" });

			// Select a class course
			cy.get('[data-testid="class-course-select"], #class-course', {
				timeout: 10000,
			}).click();
			cy.get("[role=option]").first().click();

			// Select an exam
			cy.get('[data-testid="exam-select"], #exam', { timeout: 5000 }).click();
			cy.get("[role=option]").first().click();

			// Wait for student list to load
			cy.contains(/student|étudiant/i, { timeout: 5000 }).should("exist");

			// Enter grades for visible students
			cy.get(
				'input[type="number"], input[placeholder*="note"], input[placeholder*="grade"]',
			)
				.first()
				.clear()
				.type("15");

			cy.get(
				'input[type="number"], input[placeholder*="note"], input[placeholder*="grade"]',
			)
				.eq(1)
				.clear()
				.type("18");

			// Save grades
			cy.findByRole("button", { name: /save|enregistrer/i }).click();

			// Should show success message
			cy.contains(/saved|enregistré|success|succès/i, {
				timeout: 10000,
			}).should("exist");
		});

		it("validates grade values between 0 and 20", () => {
			cy.loginAs("teacher", { route: "/teacher/grades" });

			// Select class course and exam
			cy.get('[data-testid="class-course-select"], #class-course', {
				timeout: 10000,
			}).click();
			cy.get("[role=option]").first().click();

			cy.get('[data-testid="exam-select"], #exam', { timeout: 5000 }).click();
			cy.get("[role=option]").first().click();

			// Try to enter invalid grade (> 20)
			cy.get(
				'input[type="number"], input[placeholder*="note"], input[placeholder*="grade"]',
			)
				.first()
				.clear()
				.type("25");

			// Try to save
			cy.findByRole("button", { name: /save|enregistrer/i }).click();

			// Should show validation error
			cy.contains(/invalid|invalide|0.*20|error|erreur/i, {
				timeout: 5000,
			}).should("exist");
		});

		it("validates grade values are not negative", () => {
			cy.loginAs("teacher", { route: "/teacher/grades" });

			// Select class course and exam
			cy.get('[data-testid="class-course-select"], #class-course', {
				timeout: 10000,
			}).click();
			cy.get("[role=option]").first().click();

			cy.get('[data-testid="exam-select"], #exam', { timeout: 5000 }).click();
			cy.get("[role=option]").first().click();

			// Try to enter negative grade
			cy.get(
				'input[type="number"], input[placeholder*="note"], input[placeholder*="grade"]',
			)
				.first()
				.clear()
				.type("-5");

			// Try to save
			cy.findByRole("button", { name: /save|enregistrer/i }).click();

			// Should show validation error
			cy.contains(/invalid|invalide|0.*20|error|erreur/i, {
				timeout: 5000,
			}).should("exist");
		});

		it("allows decimal grades", () => {
			cy.loginAs("teacher", { route: "/teacher/grades" });

			// Select class course and exam
			cy.get('[data-testid="class-course-select"], #class-course', {
				timeout: 10000,
			}).click();
			cy.get("[role=option]").first().click();

			cy.get('[data-testid="exam-select"], #exam', { timeout: 5000 }).click();
			cy.get("[role=option]").first().click();

			// Enter decimal grade
			cy.get(
				'input[type="number"], input[placeholder*="note"], input[placeholder*="grade"]',
			)
				.first()
				.clear()
				.type("15.5");

			// Save grades
			cy.findByRole("button", { name: /save|enregistrer/i }).click();

			// Should save successfully
			cy.contains(/saved|enregistré|success|succès/i, {
				timeout: 10000,
			}).should("exist");
		});

		it("shows confirmation message after successful save", () => {
			cy.loginAs("teacher", { route: "/teacher/grades" });

			// Select class course and exam
			cy.get('[data-testid="class-course-select"], #class-course', {
				timeout: 10000,
			}).click();
			cy.get("[role=option]").first().click();

			cy.get('[data-testid="exam-select"], #exam', { timeout: 5000 }).click();
			cy.get("[role=option]").first().click();

			// Enter a grade
			cy.get(
				'input[type="number"], input[placeholder*="note"], input[placeholder*="grade"]',
			)
				.first()
				.clear()
				.type("16");

			// Save grades
			cy.findByRole("button", { name: /save|enregistrer/i }).click();

			// Should show specific confirmation
			cy.contains(/saved|enregistré|success|succès/i, {
				timeout: 10000,
			}).should("exist");
		});
	});

	describe("Grade Entry - Course Selection", () => {
		it("requires course selection before entering grades", () => {
			cy.loginAs("teacher", { route: "/teacher/grades" });

			// Without selecting course/exam, grade inputs should not be visible
			cy.get(
				'input[type="number"], input[placeholder*="note"], input[placeholder*="grade"]',
			).should("not.exist");
		});

		it("requires exam selection before entering grades", () => {
			cy.loginAs("teacher", { route: "/teacher/grades" });

			// Select only class course
			cy.get('[data-testid="class-course-select"], #class-course', {
				timeout: 10000,
			}).click();
			cy.get("[role=option]").first().click();

			// Grade inputs should not be visible yet
			// (or there should be a message to select an exam)
			cy.contains(/select.*exam|choisir.*examen/i).should("exist");
		});

		it("loads student list after selecting course and exam", () => {
			cy.loginAs("teacher", { route: "/teacher/grades" });

			// Select class course
			cy.get('[data-testid="class-course-select"], #class-course', {
				timeout: 10000,
			}).click();
			cy.get("[role=option]").first().click();

			// Select exam
			cy.get('[data-testid="exam-select"], #exam', { timeout: 5000 }).click();
			cy.get("[role=option]").first().click();

			// Student list should load
			cy.contains(/student|étudiant/i, { timeout: 5000 }).should("exist");
			cy.get(
				'input[type="number"], input[placeholder*="note"], input[placeholder*="grade"]',
			).should("have.length.at.least", 1);
		});
	});

	describe("Bulk Grade Entry", () => {
		it("allows entering grades for all students in a list", () => {
			cy.loginAs("teacher", { route: "/teacher/grades" });

			// Select class course and exam
			cy.get('[data-testid="class-course-select"], #class-course', {
				timeout: 10000,
			}).click();
			cy.get("[role=option]").first().click();

			cy.get('[data-testid="exam-select"], #exam', { timeout: 5000 }).click();
			cy.get("[role=option]").first().click();

			// Enter grades for multiple students
			const grades = ["14", "16", "18", "12"];
			cy.get(
				'input[type="number"], input[placeholder*="note"], input[placeholder*="grade"]',
			).each(($input, index) => {
				if (index < grades.length) {
					cy.wrap($input).clear().type(grades[index]);
				}
			});

			// Save all grades
			cy.findByRole("button", { name: /save|enregistrer/i }).click();

			// Should show success message
			cy.contains(/saved|enregistré|success|succès/i, {
				timeout: 10000,
			}).should("exist");
		});

		it("can save partial grades (not all students)", () => {
			cy.loginAs("teacher", { route: "/teacher/grades" });

			// Select class course and exam
			cy.get('[data-testid="class-course-select"], #class-course', {
				timeout: 10000,
			}).click();
			cy.get("[role=option]").first().click();

			cy.get('[data-testid="exam-select"], #exam', { timeout: 5000 }).click();
			cy.get("[role=option]").first().click();

			// Enter grade for only first student
			cy.get(
				'input[type="number"], input[placeholder*="note"], input[placeholder*="grade"]',
			)
				.first()
				.clear()
				.type("15");

			// Save
			cy.findByRole("button", { name: /save|enregistrer/i }).click();

			// Should save successfully even if not all grades are entered
			cy.contains(/saved|enregistré|success|succès/i, {
				timeout: 10000,
			}).should("exist");
		});
	});
});
