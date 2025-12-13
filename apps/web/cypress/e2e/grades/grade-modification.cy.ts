describe("Grade Modification", () => {
	beforeEach(() => {
		cy.resetDatabase();
	});

	describe("Modifying Existing Grades", () => {
		it("loads existing grades when selecting course and exam", () => {
			cy.loginAs("teacher", { route: "/teacher/grades" });

			// First, enter some grades
			cy.get('[data-testid="class-course-select"], #class-course', {
				timeout: 10000,
			}).click();
			cy.get("[role=option]").first().click();

			cy.get('[data-testid="exam-select"], #exam', { timeout: 5000 }).click();
			cy.get("[role=option]").first().click();

			// Enter initial grades
			cy.get(
				'input[type="number"], input[placeholder*="note"], input[placeholder*="grade"]',
			)
				.first()
				.clear()
				.type("15");

			cy.findByRole("button", { name: /save|enregistrer/i }).click();
			cy.contains(/saved|enregistré|success|succès/i, {
				timeout: 10000,
			}).should("exist");

			// Reload the page or navigate away and back
			cy.reload();

			// Re-select the same course and exam
			cy.get('[data-testid="class-course-select"], #class-course', {
				timeout: 10000,
			}).click();
			cy.get("[role=option]").first().click();

			cy.get('[data-testid="exam-select"], #exam', { timeout: 5000 }).click();
			cy.get("[role=option]").first().click();

			// The previously entered grade should be loaded
			cy.get(
				'input[type="number"], input[placeholder*="note"], input[placeholder*="grade"]',
			)
				.first()
				.should("have.value", "15");
		});

		it("allows modifying an existing grade", () => {
			cy.loginAs("teacher", { route: "/teacher/grades" });

			// Enter initial grade
			cy.get('[data-testid="class-course-select"], #class-course', {
				timeout: 10000,
			}).click();
			cy.get("[role=option]").first().click();

			cy.get('[data-testid="exam-select"], #exam', { timeout: 5000 }).click();
			cy.get("[role=option]").first().click();

			cy.get(
				'input[type="number"], input[placeholder*="note"], input[placeholder*="grade"]',
			)
				.first()
				.clear()
				.type("15");

			cy.findByRole("button", { name: /save|enregistrer/i }).click();
			cy.contains(/saved|enregistré|success|succès/i, {
				timeout: 10000,
			}).should("exist");

			// Modify the grade
			cy.get(
				'input[type="number"], input[placeholder*="note"], input[placeholder*="grade"]',
			)
				.first()
				.clear()
				.type("18");

			cy.findByRole("button", { name: /save|enregistrer/i }).click();

			// Should save the modification
			cy.contains(/saved|enregistré|success|succès/i, {
				timeout: 10000,
			}).should("exist");
		});

		it("verifies grade update persists after reload", () => {
			cy.loginAs("teacher", { route: "/teacher/grades" });

			// Enter initial grade
			cy.get('[data-testid="class-course-select"], #class-course', {
				timeout: 10000,
			}).click();
			cy.get("[role=option]").first().click();

			cy.get('[data-testid="exam-select"], #exam', { timeout: 5000 }).click();
			cy.get("[role=option]").first().click();

			cy.get(
				'input[type="number"], input[placeholder*="note"], input[placeholder*="grade"]',
			)
				.first()
				.clear()
				.type("15");

			cy.findByRole("button", { name: /save|enregistrer/i }).click();
			cy.contains(/saved|enregistré|success|succès/i, {
				timeout: 10000,
			}).should("exist");

			// Update the grade
			cy.get(
				'input[type="number"], input[placeholder*="note"], input[placeholder*="grade"]',
			)
				.first()
				.clear()
				.type("19");

			cy.findByRole("button", { name: /save|enregistrer/i }).click();
			cy.contains(/saved|enregistré|success|succès/i, {
				timeout: 10000,
			}).should("exist");

			// Reload and verify the update
			cy.reload();

			cy.get('[data-testid="class-course-select"], #class-course', {
				timeout: 10000,
			}).click();
			cy.get("[role=option]").first().click();

			cy.get('[data-testid="exam-select"], #exam', { timeout: 5000 }).click();
			cy.get("[role=option]").first().click();

			// Should show the updated grade
			cy.get(
				'input[type="number"], input[placeholder*="note"], input[placeholder*="grade"]',
			)
				.first()
				.should("have.value", "19");
		});

		it("allows clearing a grade", () => {
			cy.loginAs("teacher", { route: "/teacher/grades" });

			// Enter initial grade
			cy.get('[data-testid="class-course-select"], #class-course', {
				timeout: 10000,
			}).click();
			cy.get("[role=option]").first().click();

			cy.get('[data-testid="exam-select"], #exam', { timeout: 5000 }).click();
			cy.get("[role=option]").first().click();

			cy.get(
				'input[type="number"], input[placeholder*="note"], input[placeholder*="grade"]',
			)
				.first()
				.clear()
				.type("15");

			cy.findByRole("button", { name: /save|enregistrer/i }).click();
			cy.contains(/saved|enregistré|success|succès/i, {
				timeout: 10000,
			}).should("exist");

			// Clear the grade
			cy.get(
				'input[type="number"], input[placeholder*="note"], input[placeholder*="grade"]',
			)
				.first()
				.clear();

			cy.findByRole("button", { name: /save|enregistrer/i }).click();

			// Should save successfully
			cy.contains(/saved|enregistré|success|succès/i, {
				timeout: 10000,
			}).should("exist");
		});
	});

	describe("Modification History", () => {
		it("maintains modification history (if feature exists)", () => {
			cy.loginAs("teacher", { route: "/teacher/grades" });

			// Enter initial grade
			cy.get('[data-testid="class-course-select"], #class-course', {
				timeout: 10000,
			}).click();
			cy.get("[role=option]").first().click();

			cy.get('[data-testid="exam-select"], #exam', { timeout: 5000 }).click();
			cy.get("[role=option]").first().click();

			cy.get(
				'input[type="number"], input[placeholder*="note"], input[placeholder*="grade"]',
			)
				.first()
				.clear()
				.type("15");

			cy.findByRole("button", { name: /save|enregistrer/i }).click();
			cy.contains(/saved|enregistré|success|succès/i, {
				timeout: 10000,
			}).should("exist");

			// Modify the grade
			cy.get(
				'input[type="number"], input[placeholder*="note"], input[placeholder*="grade"]',
			)
				.first()
				.clear()
				.type("18");

			cy.findByRole("button", { name: /save|enregistrer/i }).click();
			cy.contains(/saved|enregistré|success|succès/i, {
				timeout: 10000,
			}).should("exist");

			// Check if there's a history button or link
			cy.get("body").then(($body) => {
				if (
					$body.text().match(/history|historique/i) ||
					$body.find('[data-testid*="history"]').length > 0
				) {
					cy.log("Grade modification history feature exists");
					// Click on history to view past modifications
					cy.contains(/history|historique/i, { timeout: 5000 })
						.first()
						.click();

					// Should show both versions (15 and 18)
					cy.contains("15").should("exist");
					cy.contains("18").should("exist");
				} else {
					cy.log("Grade modification history feature not found - skipping");
				}
			});
		});
	});

	describe("Multiple Modifications", () => {
		it("allows modifying multiple students' grades at once", () => {
			cy.loginAs("teacher", { route: "/teacher/grades" });

			// Enter initial grades
			cy.get('[data-testid="class-course-select"], #class-course', {
				timeout: 10000,
			}).click();
			cy.get("[role=option]").first().click();

			cy.get('[data-testid="exam-select"], #exam', { timeout: 5000 }).click();
			cy.get("[role=option]").first().click();

			const initialGrades = ["14", "15", "16"];
			cy.get(
				'input[type="number"], input[placeholder*="note"], input[placeholder*="grade"]',
			).each(($input, index) => {
				if (index < initialGrades.length) {
					cy.wrap($input).clear().type(initialGrades[index]);
				}
			});

			cy.findByRole("button", { name: /save|enregistrer/i }).click();
			cy.contains(/saved|enregistré|success|succès/i, {
				timeout: 10000,
			}).should("exist");

			// Modify multiple grades
			const updatedGrades = ["17", "18", "19"];
			cy.get(
				'input[type="number"], input[placeholder*="note"], input[placeholder*="grade"]',
			).each(($input, index) => {
				if (index < updatedGrades.length) {
					cy.wrap($input).clear().type(updatedGrades[index]);
				}
			});

			cy.findByRole("button", { name: /save|enregistrer/i }).click();

			// Should save all modifications
			cy.contains(/saved|enregistré|success|succès/i, {
				timeout: 10000,
			}).should("exist");
		});
	});

	describe("Validation on Modification", () => {
		it("validates modified grades are within range", () => {
			cy.loginAs("teacher", { route: "/teacher/grades" });

			// Enter initial grade
			cy.get('[data-testid="class-course-select"], #class-course', {
				timeout: 10000,
			}).click();
			cy.get("[role=option]").first().click();

			cy.get('[data-testid="exam-select"], #exam', { timeout: 5000 }).click();
			cy.get("[role=option]").first().click();

			cy.get(
				'input[type="number"], input[placeholder*="note"], input[placeholder*="grade"]',
			)
				.first()
				.clear()
				.type("15");

			cy.findByRole("button", { name: /save|enregistrer/i }).click();
			cy.contains(/saved|enregistré|success|succès/i, {
				timeout: 10000,
			}).should("exist");

			// Try to modify to invalid grade
			cy.get(
				'input[type="number"], input[placeholder*="note"], input[placeholder*="grade"]',
			)
				.first()
				.clear()
				.type("25");

			cy.findByRole("button", { name: /save|enregistrer/i }).click();

			// Should show validation error
			cy.contains(/invalid|invalide|0.*20|error|erreur/i, {
				timeout: 5000,
			}).should("exist");
		});
	});
});
