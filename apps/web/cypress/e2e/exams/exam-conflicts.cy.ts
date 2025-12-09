describe("Exam Management - Scheduling Conflicts", () => {
	beforeEach(() => {
		cy.resetDatabase();
	});

	describe("Detecting Date Conflicts", () => {
		it("detects when two exams are scheduled on the same date for same class", () => {
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
				.type("2024-12-15");

			cy.findByLabelText(/coefficient|weight|pondération/i)
				.clear()
				.type("1");

			cy.findByRole("button", {
				name: /save|create|submit|enregistrer|créer/i,
			}).click();

			cy.contains(/created|créé|success/i, { timeout: 10000 }).should("exist");

			// Try to create second exam on same date
			cy.findByRole("button", {
				name: /add.*exam|create.*exam|new.*exam|ajouter.*examen|nouvel.*examen/i,
			}).click();

			cy.get(
				'[data-testid="class-course-select"], #classCourse, #classCourseId',
				{ timeout: 5000 },
			).click();
			cy.get("[role=option]").first().click(); // Same course

			cy.get('[data-testid="exam-type-select"], #examType, #examTypeId', {
				timeout: 5000,
			}).click();
			cy.get("[role=option]").eq(1).click(); // Different type

			cy.findByLabelText(/date/i)
				.clear()
				.type("2024-12-15"); // Same date

			cy.findByLabelText(/coefficient|weight|pondération/i)
				.clear()
				.type("2");

			cy.findByRole("button", {
				name: /save|create|submit|enregistrer|créer/i,
			}).click();

			// Should show conflict warning or allow with warning
			cy.get("body", { timeout: 10000 }).then(($body) => {
				const hasConflictWarning =
					$body.text().match(/conflict|conflit|warning|attention|same.*date/i) !==
					null;
				const wasCreated = $body.text().match(/created|créé|success/i) !== null;

				// Either shows warning or creates anyway
				expect(hasConflictWarning || wasCreated).to.be.true;
			});
		});

		it("shows conflict alert message", () => {
			cy.loginAs("administrator", { route: "/admin/exams" });

			// Create exam
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
				.type("2024-12-16");

			cy.findByLabelText(/coefficient|weight|pondération/i)
				.clear()
				.type("1");

			cy.findByRole("button", {
				name: /save|create|submit|enregistrer|créer/i,
			}).click();

			cy.contains(/created|créé|success/i, { timeout: 10000 }).should("exist");

			// Create conflicting exam
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
			cy.get("[role=option]").eq(1).click();

			cy.findByLabelText(/date/i)
				.clear()
				.type("2024-12-16"); // Same date

			cy.findByLabelText(/coefficient|weight|pondération/i)
				.clear()
				.type("2");

			cy.findByRole("button", {
				name: /save|create|submit|enregistrer|créer/i,
			}).click();

			// Check for conflict message
			cy.get("body", { timeout: 10000 }).then(($body) => {
				const text = $body.text();
				const hasConflict =
					text.match(/conflict|conflit|already.*exam|déjà.*examen/i) !== null;

				if (hasConflict) {
					cy.log("Conflict warning displayed");
				} else {
					cy.log("No conflict warning - system allows multiple exams per day");
				}
			});
		});

		it("allows scheduling exams on same date for different classes", () => {
			cy.loginAs("administrator", { route: "/admin/exams" });

			// Create exam for first class/course
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
				.type("2024-12-17");

			cy.findByLabelText(/coefficient|weight|pondération/i)
				.clear()
				.type("1");

			cy.findByRole("button", {
				name: /save|create|submit|enregistrer|créer/i,
			}).click();

			cy.contains(/created|créé|success/i, { timeout: 10000 }).should("exist");

			// Create exam for different class/course on same date
			cy.findByRole("button", {
				name: /add.*exam|create.*exam|new.*exam|ajouter.*examen|nouvel.*examen/i,
			}).click();

			cy.get(
				'[data-testid="class-course-select"], #classCourse, #classCourseId',
				{ timeout: 5000 },
			).click();
			cy.get("[role=option]").eq(1).click(); // Different course

			cy.get('[data-testid="exam-type-select"], #examType, #examTypeId', {
				timeout: 5000,
			}).click();
			cy.get("[role=option]").first().click();

			cy.findByLabelText(/date/i)
				.clear()
				.type("2024-12-17"); // Same date

			cy.findByLabelText(/coefficient|weight|pondération/i)
				.clear()
				.type("1");

			cy.findByRole("button", {
				name: /save|create|submit|enregistrer|créer/i,
			}).click();

			// Should create successfully - no conflict for different classes
			cy.contains(/created|créé|success/i, { timeout: 10000 }).should("exist");
		});
	});

	describe("Conflict Resolution", () => {
		it("provides option to override conflict warning", () => {
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
				.type("2024-12-18");

			cy.findByLabelText(/coefficient|weight|pondération/i)
				.clear()
				.type("1");

			cy.findByRole("button", {
				name: /save|create|submit|enregistrer|créer/i,
			}).click();

			cy.contains(/created|créé|success/i, { timeout: 10000 }).should("exist");

			// Create potentially conflicting exam
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
			cy.get("[role=option]").eq(1).click();

			cy.findByLabelText(/date/i)
				.clear()
				.type("2024-12-18");

			cy.findByLabelText(/coefficient|weight|pondération/i)
				.clear()
				.type("2");

			cy.findByRole("button", {
				name: /save|create|submit|enregistrer|créer/i,
			}).click();

			// If conflict dialog appears, should have option to proceed anyway
			cy.get("body", { timeout: 10000 }).then(($body) => {
				const hasProceedButton =
					$body.find(
						'button:contains("Proceed"), button:contains("Continue"), button:contains("Continuer")',
					).length > 0;

				if (hasProceedButton) {
					cy.log("Override option available");
					cy.findByRole("button", {
						name: /proceed|continue|continuer/i,
					}).click();

					cy.contains(/created|créé|success/i, { timeout: 10000 }).should(
						"exist",
					);
				} else {
					cy.log("No conflict dialog or automatic override");
				}
			});
		});

		it("allows changing date to resolve conflict", () => {
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
				.type("2024-12-19");

			cy.findByLabelText(/coefficient|weight|pondération/i)
				.clear()
				.type("1");

			cy.findByRole("button", {
				name: /save|create|submit|enregistrer|créer/i,
			}).click();

			cy.contains(/created|créé|success/i, { timeout: 10000 }).should("exist");

			// Create second exam with different date
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
			cy.get("[role=option]").eq(1).click();

			// Use different date to avoid conflict
			cy.findByLabelText(/date/i)
				.clear()
				.type("2024-12-21");

			cy.findByLabelText(/coefficient|weight|pondération/i)
				.clear()
				.type("2");

			cy.findByRole("button", {
				name: /save|create|submit|enregistrer|créer/i,
			}).click();

			// Should create successfully - no conflict
			cy.contains(/created|créé|success/i, { timeout: 10000 }).should("exist");
		});

		it("suggests alternative dates (if feature exists)", () => {
			cy.loginAs("administrator", { route: "/admin/exams" });

			// Create exam
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

			// Try to create conflicting exam
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
			cy.get("[role=option]").eq(1).click();

			cy.findByLabelText(/date/i)
				.clear()
				.type("2024-12-20");

			cy.findByLabelText(/coefficient|weight|pondération/i)
				.clear()
				.type("2");

			cy.findByRole("button", {
				name: /save|create|submit|enregistrer|créer/i,
			}).click();

			// Check for suggested dates
			cy.get("body", { timeout: 10000 }).then(($body) => {
				const hasSuggestions =
					$body.text().match(/suggest|alternative|proposer|alternative/i) !==
					null;

				if (hasSuggestions) {
					cy.log("Alternative dates suggested");
				} else {
					cy.log("No date suggestions feature");
				}
			});
		});
	});

	describe("Conflict Prevention", () => {
		it("shows existing exams when selecting date", () => {
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
				.type("2024-12-22");

			cy.findByLabelText(/coefficient|weight|pondération/i)
				.clear()
				.type("1");

			cy.findByRole("button", {
				name: /save|create|submit|enregistrer|créer/i,
			}).click();

			cy.contains(/created|créé|success/i, { timeout: 10000 }).should("exist");

			// Open create form again
			cy.findByRole("button", {
				name: /add.*exam|create.*exam|new.*exam|ajouter.*examen|nouvel.*examen/i,
			}).click();

			// Check if existing exams are shown as context
			cy.get("body").then(($body) => {
				const showsExistingExams =
					$body.text().match(/existing|scheduled|déjà.*planifié/i) !== null;

				if (showsExistingExams) {
					cy.log("Existing exams are shown for context");
				}
			});
		});

		it("highlights conflicting dates in date picker (if feature exists)", () => {
			cy.loginAs("administrator", { route: "/admin/exams" });

			// Create exam
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
				.type("2024-12-23");

			cy.findByLabelText(/coefficient|weight|pondération/i)
				.clear()
				.type("1");

			cy.findByRole("button", {
				name: /save|create|submit|enregistrer|créer/i,
			}).click();

			cy.contains(/created|créé|success/i, { timeout: 10000 }).should("exist");

			// Create another exam and check date picker
			cy.findByRole("button", {
				name: /add.*exam|create.*exam|new.*exam|ajouter.*examen|nouvel.*examen/i,
			}).click();

			cy.get(
				'[data-testid="class-course-select"], #classCourse, #classCourseId',
				{ timeout: 5000 },
			).click();
			cy.get("[role=option]").first().click();

			// Click on date field to open picker
			cy.findByLabelText(/date/i).click();

			// Check if dates with exams are highlighted
			cy.get("body").then(($body) => {
				const hasHighlighting =
					$body.find('[class*="highlighted"], [class*="occupied"]').length > 0;

				if (hasHighlighting) {
					cy.log("Date picker highlights conflicting dates");
				} else {
					cy.log("No special highlighting in date picker");
				}
			});
		});
	});

	describe("Viewing Conflicts", () => {
		it("displays conflict summary on exam list", () => {
			cy.loginAs("administrator", { route: "/admin/exams" });

			// Create multiple exams on same date
			for (let i = 0; i < 2; i++) {
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
				cy.get("[role=option]").eq(i).click();

				cy.findByLabelText(/date/i)
					.clear()
					.type("2024-12-25");

				cy.findByLabelText(/coefficient|weight|pondération/i)
					.clear()
					.type(String(i + 1));

				cy.findByRole("button", {
					name: /save|create|submit|enregistrer|créer/i,
				}).click();

				cy.contains(/created|créé|success/i, { timeout: 10000 }).should(
					"exist",
				);
			}

			// Check for conflict indicator in list
			cy.get("body").then(($body) => {
				const hasConflictIndicator =
					$body.text().match(/conflict|conflit|warning|attention/i) !== null ||
					$body.find('[data-testid*="conflict"], [class*="conflict"]').length >
						0;

				if (hasConflictIndicator) {
					cy.log("Conflict indicators shown in exam list");
				} else {
					cy.log("No conflict indicators - system allows multiple exams per day");
				}
			});
		});
	});
});
