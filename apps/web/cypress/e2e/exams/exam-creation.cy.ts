describe("Exam Management - Manual Creation", () => {
	beforeEach(() => {
		cy.resetDatabase();
	});

	describe("Creating an Exam", () => {
		it("successfully creates an exam with complete information", () => {
			cy.loginAs("administrator", { route: "/admin/exams" });

			// Click create/add exam button
			cy.findByRole("button", {
				name: /add.*exam|create.*exam|new.*exam|ajouter.*examen|nouvel.*examen/i,
			}).click();

			// Select class course
			cy.get(
				'[data-testid="class-course-select"], #classCourse, #classCourseId',
				{ timeout: 5000 },
			).click();
			cy.get("[role=option]").first().click();

			// Select exam type
			cy.get('[data-testid="exam-type-select"], #examType, #examTypeId', {
				timeout: 5000,
			}).click();
			cy.get("[role=option]").first().click();

			// Set date
			cy.findByLabelText(/date/i)
				.clear()
				.type("2024-12-15");

			// Set coefficient
			cy.findByLabelText(/coefficient|weight|pondération/i)
				.clear()
				.type("2");

			// Submit
			cy.findByRole("button", {
				name: /save|create|submit|enregistrer|créer/i,
			}).click();

			// Should show success
			cy.contains(/created|créé|success|succès/i, { timeout: 10000 }).should(
				"exist",
			);
		});

		it("displays created exam in the list", () => {
			cy.loginAs("administrator", { route: "/admin/exams" });

			cy.findByRole("button", {
				name: /add.*exam|create.*exam|new.*exam|ajouter.*examen|nouvel.*examen/i,
			}).click();

			cy.get(
				'[data-testid="class-course-select"], #classCourse, #classCourseId',
				{ timeout: 5000 },
			).click();
			cy.get("[role=option]").first().click();

			cy.get('[data-testid="exam-type-select"], #examType, #examTypeId', {
				timeout: 5000,
			}).click();
			cy.get("[role=option]").first().click();

			cy.findByLabelText(/date/i)
				.clear()
				.type("2024-12-20");

			cy.findByLabelText(/coefficient|weight|pondération/i)
				.clear()
				.type("1");

			cy.findByRole("button", {
				name: /save|create|submit|enregistrer|créer/i,
			}).click();

			cy.contains(/created|créé|success/i, { timeout: 10000 }).should("exist");

			// Should see exam in the list with date
			cy.contains(/2024-12-20|20\/12\/2024/i).should("exist");
		});
	});

	describe("Exam Form Validation", () => {
		it("requires class course selection", () => {
			cy.loginAs("administrator", { route: "/admin/exams" });

			cy.findByRole("button", {
				name: /add.*exam|create.*exam|new.*exam|ajouter.*examen|nouvel.*examen/i,
			}).click();

			// Try to submit without selecting class course
			cy.findByRole("button", {
				name: /save|create|submit|enregistrer|créer/i,
			}).click();

			// Should show validation error
			cy.contains(/required|obligatoire/i, { timeout: 5000 }).should("exist");
		});

		it("requires exam type selection", () => {
			cy.loginAs("administrator", { route: "/admin/exams" });

			cy.findByRole("button", {
				name: /add.*exam|create.*exam|new.*exam|ajouter.*examen|nouvel.*examen/i,
			}).click();

			// Select class course but not exam type
			cy.get(
				'[data-testid="class-course-select"], #classCourse, #classCourseId',
				{ timeout: 5000 },
			).click();
			cy.get("[role=option]").first().click();

			cy.findByRole("button", {
				name: /save|create|submit|enregistrer|créer/i,
			}).click();

			// Should show validation error
			cy.contains(/required|obligatoire|exam.*type/i, { timeout: 5000 }).should(
				"exist",
			);
		});

		it("requires date", () => {
			cy.loginAs("administrator", { route: "/admin/exams" });

			cy.findByRole("button", {
				name: /add.*exam|create.*exam|new.*exam|ajouter.*examen|nouvel.*examen/i,
			}).click();

			cy.get(
				'[data-testid="class-course-select"], #classCourse, #classCourseId',
				{ timeout: 5000 },
			).click();
			cy.get("[role=option]").first().click();

			cy.get('[data-testid="exam-type-select"], #examType, #examTypeId', {
				timeout: 5000,
			}).click();
			cy.get("[role=option]").first().click();

			cy.findByRole("button", {
				name: /save|create|submit|enregistrer|créer/i,
			}).click();

			// Should show validation error
			cy.contains(/required|obligatoire|date/i, { timeout: 5000 }).should(
				"exist",
			);
		});

		it("requires coefficient", () => {
			cy.loginAs("administrator", { route: "/admin/exams" });

			cy.findByRole("button", {
				name: /add.*exam|create.*exam|new.*exam|ajouter.*examen|nouvel.*examen/i,
			}).click();

			cy.get(
				'[data-testid="class-course-select"], #classCourse, #classCourseId',
				{ timeout: 5000 },
			).click();
			cy.get("[role=option]").first().click();

			cy.get('[data-testid="exam-type-select"], #examType, #examTypeId', {
				timeout: 5000,
			}).click();
			cy.get("[role=option]").first().click();

			cy.findByLabelText(/date/i)
				.clear()
				.type("2024-12-15");

			cy.findByRole("button", {
				name: /save|create|submit|enregistrer|créer/i,
			}).click();

			// Should show validation error
			cy.contains(/required|obligatoire|coefficient/i, { timeout: 5000 }).should(
				"exist",
			);
		});

		it("validates coefficient is positive", () => {
			cy.loginAs("administrator", { route: "/admin/exams" });

			cy.findByRole("button", {
				name: /add.*exam|create.*exam|new.*exam|ajouter.*examen|nouvel.*examen/i,
			}).click();

			cy.get(
				'[data-testid="class-course-select"], #classCourse, #classCourseId',
				{ timeout: 5000 },
			).click();
			cy.get("[role=option]").first().click();

			cy.get('[data-testid="exam-type-select"], #examType, #examTypeId', {
				timeout: 5000,
			}).click();
			cy.get("[role=option]").first().click();

			cy.findByLabelText(/date/i)
				.clear()
				.type("2024-12-15");

			// Enter negative coefficient
			cy.findByLabelText(/coefficient|weight|pondération/i)
				.clear()
				.type("-1");

			cy.findByRole("button", {
				name: /save|create|submit|enregistrer|créer/i,
			}).click();

			// Should show validation error
			cy.contains(/positive|greater.*0|supérieur/i, { timeout: 5000 }).should(
				"exist",
			);
		});

		it("validates date format", () => {
			cy.loginAs("administrator", { route: "/admin/exams" });

			cy.findByRole("button", {
				name: /add.*exam|create.*exam|new.*exam|ajouter.*examen|nouvel.*examen/i,
			}).click();

			cy.get(
				'[data-testid="class-course-select"], #classCourse, #classCourseId',
				{ timeout: 5000 },
			).click();
			cy.get("[role=option]").first().click();

			cy.get('[data-testid="exam-type-select"], #examType, #examTypeId', {
				timeout: 5000 },
			).click();
			cy.get("[role=option]").first().click();

			// Try invalid date
			cy.findByLabelText(/date/i)
				.clear()
				.type("invalid-date");

			cy.findByRole("button", {
				name: /save|create|submit|enregistrer|créer/i,
			}).click();

			// Should prevent invalid date
			cy.findByLabelText(/date/i).then(($input) => {
				const validityState = ($input[0] as HTMLInputElement).validity;
				expect(validityState.valid).to.be.false;
			});
		});
	});

	describe("Exam Properties", () => {
		it("allows setting exam description/notes (if available)", () => {
			cy.loginAs("administrator", { route: "/admin/exams" });

			cy.findByRole("button", {
				name: /add.*exam|create.*exam|new.*exam|ajouter.*examen|nouvel.*examen/i,
			}).click();

			cy.get(
				'[data-testid="class-course-select"], #classCourse, #classCourseId',
				{ timeout: 5000 },
			).click();
			cy.get("[role=option]").first().click();

			cy.get('[data-testid="exam-type-select"], #examType, #examTypeId', {
				timeout: 5000,
			}).click();
			cy.get("[role=option]").first().click();

			cy.findByLabelText(/date/i)
				.clear()
				.type("2024-12-15");

			cy.findByLabelText(/coefficient|weight|pondération/i)
				.clear()
				.type("2");

			// Check for description field
			cy.get("body").then(($body) => {
				const descriptionField = $body.find(
					'[name="description"], textarea, [data-testid="description"]',
				);
				if (descriptionField.length > 0) {
					cy.log("Description field exists");
					cy.wrap(descriptionField).first().type("Midterm exam for chapter 1-5");
				}
			});

			cy.findByRole("button", {
				name: /save|create|submit|enregistrer|créer/i,
			}).click();

			cy.contains(/created|créé|success/i, { timeout: 10000 }).should("exist");
		});

		it("displays exam type in the exam list", () => {
			cy.loginAs("administrator", { route: "/admin/exams" });

			cy.findByRole("button", {
				name: /add.*exam|create.*exam|new.*exam|ajouter.*examen|nouvel.*examen/i,
			}).click();

			cy.get(
				'[data-testid="class-course-select"], #classCourse, #classCourseId',
				{ timeout: 5000 },
			).click();
			cy.get("[role=option]").first().click();

			// Get the selected exam type name
			let examTypeName: string;
			cy.get('[data-testid="exam-type-select"], #examType, #examTypeId', {
				timeout: 5000,
			}).click();
			cy.get("[role=option]")
				.first()
				.invoke("text")
				.then((text) => {
					examTypeName = text.trim();
					cy.get("[role=option]").first().click();
				});

			cy.findByLabelText(/date/i)
				.clear()
				.type("2024-12-15");

			cy.findByLabelText(/coefficient|weight|pondération/i)
				.clear()
				.type("2");

			cy.findByRole("button", {
				name: /save|create|submit|enregistrer|créer/i,
			}).click();

			cy.contains(/created|créé|success/i, { timeout: 10000 }).should("exist");

			// Should show exam type in list
			if (examTypeName) {
				cy.contains(examTypeName).should("exist");
			}
		});

		it("displays coefficient in the exam list", () => {
			cy.loginAs("administrator", { route: "/admin/exams" });

			cy.findByRole("button", {
				name: /add.*exam|create.*exam|new.*exam|ajouter.*examen|nouvel.*examen/i,
			}).click();

			cy.get(
				'[data-testid="class-course-select"], #classCourse, #classCourseId',
				{ timeout: 5000 },
			).click();
			cy.get("[role=option]").first().click();

			cy.get('[data-testid="exam-type-select"], #examType, #examTypeId', {
				timeout: 5000,
			}).click();
			cy.get("[role=option]").first().click();

			cy.findByLabelText(/date/i)
				.clear()
				.type("2024-12-15");

			cy.findByLabelText(/coefficient|weight|pondération/i)
				.clear()
				.type("3");

			cy.findByRole("button", {
				name: /save|create|submit|enregistrer|créer/i,
			}).click();

			cy.contains(/created|créé|success/i, { timeout: 10000 }).should("exist");

			// Should show coefficient "3" in list
			cy.contains("3").should("exist");
		});
	});

	describe("Cancel Exam Creation", () => {
		it("allows canceling exam creation", () => {
			cy.loginAs("administrator", { route: "/admin/exams" });

			cy.findByRole("button", {
				name: /add.*exam|create.*exam|new.*exam|ajouter.*examen|nouvel.*examen/i,
			}).click();

			// Fill some data
			cy.get(
				'[data-testid="class-course-select"], #classCourse, #classCourseId',
				{ timeout: 5000 },
			).click();
			cy.get("[role=option]").first().click();

			// Click cancel
			cy.findByRole("button", { name: /cancel|annuler/i }).click();

			// Should close the form
			cy.get(
				'[data-testid="class-course-select"], #classCourse, #classCourseId',
			).should("not.exist");
		});

		it("discards data when canceling", () => {
			cy.loginAs("administrator", { route: "/admin/exams" });

			cy.findByRole("button", {
				name: /add.*exam|create.*exam|new.*exam|ajouter.*examen|nouvel.*examen/i,
			}).click();

			cy.get(
				'[data-testid="class-course-select"], #classCourse, #classCourseId',
				{ timeout: 5000 },
			).click();
			cy.get("[role=option]").first().click();

			cy.findByRole("button", { name: /cancel|annuler/i }).click();

			// Open form again
			cy.findByRole("button", {
				name: /add.*exam|create.*exam|new.*exam|ajouter.*examen|nouvel.*examen/i,
			}).click();

			// Form should be empty
			cy.get('[data-testid="class-course-select"], #classCourse, #classCourseId')
				.invoke("text")
				.should("match", /select|choisir/i);
		});
	});

	describe("Multiple Exam Creation", () => {
		it("allows creating multiple exams for the same course", () => {
			cy.loginAs("administrator", { route: "/admin/exams" });

			// Create first exam
			cy.findByRole("button", {
				name: /add.*exam|create.*exam|new.*exam|ajouter.*examen|nouvel.*examen/i,
			}).click();

			cy.get(
				'[data-testid="class-course-select"], #classCourse, #classCourseId',
				{ timeout: 5000 },
			).click();
			cy.get("[role=option]").first().click();

			cy.get('[data-testid="exam-type-select"], #examType, #examTypeId', {
				timeout: 5000,
			}).click();
			cy.get("[role=option]").first().click();

			cy.findByLabelText(/date/i)
				.clear()
				.type("2024-12-10");

			cy.findByLabelText(/coefficient|weight|pondération/i)
				.clear()
				.type("1");

			cy.findByRole("button", {
				name: /save|create|submit|enregistrer|créer/i,
			}).click();

			cy.contains(/created|créé|success/i, { timeout: 10000 }).should("exist");

			// Create second exam for same course
			cy.findByRole("button", {
				name: /add.*exam|create.*exam|new.*exam|ajouter.*examen|nouvel.*examen/i,
			}).click();

			cy.get(
				'[data-testid="class-course-select"], #classCourse, #classCourseId',
				{ timeout: 5000 },
			).click();
			cy.get("[role=option]").first().click();

			cy.get('[data-testid="exam-type-select"], #examType, #examTypeId', {
				timeout: 5000,
			}).click();
			cy.get("[role=option]").eq(1).click(); // Different exam type

			cy.findByLabelText(/date/i)
				.clear()
				.type("2024-12-20");

			cy.findByLabelText(/coefficient|weight|pondération/i)
				.clear()
				.type("2");

			cy.findByRole("button", {
				name: /save|create|submit|enregistrer|créer/i,
			}).click();

			cy.contains(/created|créé|success/i, { timeout: 10000 }).should("exist");

			// Should see both exams in the list
			cy.contains("2024-12-10").should("exist");
			cy.contains("2024-12-20").should("exist");
		});
	});
});
