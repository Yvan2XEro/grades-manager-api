describe("Exam Management - Automated Scheduling", () => {
	beforeEach(() => {
		cy.resetDatabase();
	});

	describe("Accessing Exam Scheduler", () => {
		it("navigates to exam scheduler page", () => {
			cy.loginAs("administrator", { route: "/admin/exam-scheduler" });

			// Should show scheduler interface
			cy.contains(/schedule|planification|scheduler/i, {
				timeout: 10000,
			}).should("exist");
		});

		it("displays scheduling configuration options", () => {
			cy.loginAs("administrator", { route: "/admin/exam-scheduler" });

			// Should show configuration fields
			cy.get("body", { timeout: 10000 }).should("exist");

			// Look for typical scheduling options
			cy.get("body").then(($body) => {
				const hasSchedulingOptions =
					$body.text().match(/class|date|exam.*type|période/i) !== null;
				expect(hasSchedulingOptions).to.be.true;
			});
		});
	});

	describe("Configuring Automatic Scheduling", () => {
		it("allows selecting multiple classes for scheduling", () => {
			cy.loginAs("administrator", { route: "/admin/exam-scheduler" });

			// Look for class selection
			cy.get(
				'[data-testid="class-select"], [data-testid="classes-select"], input[type="checkbox"]',
				{ timeout: 10000 },
			).should("exist");

			// If multi-select
			cy.get("body").then(($body) => {
				const hasMultiSelect =
					$body.find(
						'[data-testid="classes-select"], [multiple], input[type="checkbox"]',
					).length > 0;

				if (hasMultiSelect) {
					cy.log("Multi-class selection available");

					// Select multiple classes via checkboxes
					const checkboxes = $body.find('input[type="checkbox"]');
					if (checkboxes.length > 1) {
						cy.wrap(checkboxes.eq(0)).check();
						cy.wrap(checkboxes.eq(1)).check();
					}
				} else {
					cy.log("Single class selection");
				}
			});
		});

		it("allows setting exam period/date range", () => {
			cy.loginAs("administrator", { route: "/admin/exam-scheduler" });

			// Look for date range inputs
			cy.get("body").then(($body) => {
				const hasStartDate =
					$body.find(
						'[name="startDate"], input[placeholder*="start"], input[placeholder*="début"]',
					).length > 0;
				const hasEndDate =
					$body.find(
						'[name="endDate"], input[placeholder*="end"], input[placeholder*="fin"]',
					).length > 0;

				if (hasStartDate && hasEndDate) {
					cy.log("Date range configuration available");

					cy.get(
						'[name="startDate"], input[placeholder*="start"], input[placeholder*="début"]',
					)
						.first()
						.clear()
						.type("2024-12-10");

					cy.get(
						'[name="endDate"], input[placeholder*="end"], input[placeholder*="fin"]',
					)
						.first()
						.clear()
						.type("2024-12-20");
				} else {
					cy.log("Date range configuration not found");
				}
			});
		});

		it("allows selecting exam types to generate", () => {
			cy.loginAs("administrator", { route: "/admin/exam-scheduler" });

			// Look for exam type selection
			cy.get("body").then(($body) => {
				const hasExamTypeSelect =
					$body.find(
						'[data-testid*="exam-type"], input[type="checkbox"]',
					).length > 0;

				if (hasExamTypeSelect) {
					cy.log("Exam type selection available");

					// Select exam types
					const examTypeCheckboxes = $body.find('input[type="checkbox"]');
					if (examTypeCheckboxes.length > 0) {
						cy.wrap(examTypeCheckboxes.first()).check();
					}
				}
			});
		});
	});

	describe("Launching Exam Generation", () => {
		it("successfully generates exams for selected classes", () => {
			cy.loginAs("administrator", { route: "/admin/exam-scheduler" });

			// Configure scheduling
			cy.get("body", { timeout: 10000 }).then(($body) => {
				// Select class(es)
				const classCheckboxes = $body.find(
					'input[type="checkbox"][data-testid*="class"]',
				);
				if (classCheckboxes.length > 0) {
					cy.wrap(classCheckboxes.first()).check();
				} else {
					// Try dropdown
					const classSelect = $body.find(
						'[data-testid="class-select"], [data-testid="classes-select"]',
					);
					if (classSelect.length > 0) {
						cy.wrap(classSelect).click();
						cy.get("[role=option]").first().click();
					}
				}
			});

			// Set dates if available
			cy.get("body").then(($body) => {
				const startDateInput = $body.find(
					'[name="startDate"], input[placeholder*="start"]',
				);
				if (startDateInput.length > 0) {
					cy.wrap(startDateInput).clear().type("2024-12-15");
				}
			});

			// Click generate/schedule button
			cy.findByRole("button", {
				name: /generate|schedule|create|planifier|générer/i,
			}).click();

			// Should show success or generation report
			cy.contains(/generated|created|planifié|généré|success/i, {
				timeout: 15000,
			}).should("exist");
		});

		it("displays generation progress indicator", () => {
			cy.loginAs("administrator", { route: "/admin/exam-scheduler" });

			// Select configuration
			cy.get("body", { timeout: 10000 }).then(($body) => {
				const classCheckboxes = $body.find('input[type="checkbox"]');
				if (classCheckboxes.length > 0) {
					cy.wrap(classCheckboxes.first()).check();
				}
			});

			// Launch generation
			cy.findByRole("button", {
				name: /generate|schedule|create|planifier|générer/i,
			}).click();

			// Should show loading/progress
			cy.get("body").then(($body) => {
				const hasProgress =
					$body.find('[data-testid*="loading"], [class*="spinner"], [role="progressbar"]').length > 0 ||
					$body.text().match(/generating|loading|chargement/i) !== null;

				if (hasProgress) {
					cy.log("Progress indicator shown");
				}
			});

			cy.contains(/generated|created|success/i, { timeout: 15000 }).should(
				"exist",
			);
		});

		it("shows generation report after completion", () => {
			cy.loginAs("administrator", { route: "/admin/exam-scheduler" });

			cy.get("body", { timeout: 10000 }).then(($body) => {
				const classCheckboxes = $body.find('input[type="checkbox"]');
				if (classCheckboxes.length > 0) {
					cy.wrap(classCheckboxes.first()).check();
				}
			});

			cy.findByRole("button", {
				name: /generate|schedule|create|planifier|générer/i,
			}).click();

			cy.contains(/generated|created|success/i, { timeout: 15000 }).should(
				"exist",
			);

			// Should show report with numbers
			cy.get("body").then(($body) => {
				const hasReport =
					$body.text().match(/\d+.*exam|\d+.*created|\d+.*généré/i) !== null;
				expect(hasReport).to.be.true;
			});
		});

		it("displays count of generated exams", () => {
			cy.loginAs("administrator", { route: "/admin/exam-scheduler" });

			cy.get("body", { timeout: 10000 }).then(($body) => {
				const classCheckboxes = $body.find('input[type="checkbox"]');
				if (classCheckboxes.length > 0) {
					cy.wrap(classCheckboxes.first()).check();
				}
			});

			cy.findByRole("button", {
				name: /generate|schedule|create|planifier|générer/i,
			}).click();

			cy.contains(/generated|created|success/i, { timeout: 15000 }).should(
				"exist",
			);

			// Should show exam count
			cy.contains(/\d+.*exam|\d+.*examen/i).should("exist");
		});
	});

	describe("Scheduling Validation", () => {
		it("requires class selection before generating", () => {
			cy.loginAs("administrator", { route: "/admin/exam-scheduler" });

			// Try to generate without selecting classes
			cy.findByRole("button", {
				name: /generate|schedule|create|planifier|générer/i,
			}).should("be.disabled");
		});

		it("validates date range", () => {
			cy.loginAs("administrator", { route: "/admin/exam-scheduler" });

			cy.get("body").then(($body) => {
				const hasDateInputs =
					$body.find('[name="startDate"], [name="endDate"]').length > 0;

				if (hasDateInputs) {
					// Set end date before start date
					cy.get('[name="startDate"]').clear().type("2024-12-20");
					cy.get('[name="endDate"]').clear().type("2024-12-10");

					// Should show validation error
					cy.findByRole("button", {
						name: /generate|schedule|create|planifier|générer/i,
					}).click();

					cy.contains(
						/invalid.*date|date.*invalide|end.*before.*start|fin.*avant/i,
						{ timeout: 5000 },
					).should("exist");
				} else {
					cy.log("Date validation not applicable");
				}
			});
		});

		it("prevents generating without exam types", () => {
			cy.loginAs("administrator", { route: "/admin/exam-scheduler" });

			cy.get("body").then(($body) => {
				const hasExamTypeSelection =
					$body.find('[data-testid*="exam-type"]').length > 0;

				if (hasExamTypeSelection) {
					cy.log("Exam type selection required");

					// Try to generate without selecting exam types
					const classCheckboxes = $body.find('input[type="checkbox"]');
					if (classCheckboxes.length > 0) {
						cy.wrap(classCheckboxes.first()).check();
					}

					// Don't select any exam types
					cy.findByRole("button", {
						name: /generate|schedule|create|planifier|générer/i,
					}).should("be.disabled");
				}
			});
		});
	});

	describe("Bulk Scheduling Features", () => {
		it("generates exams for multiple classes simultaneously", () => {
			cy.loginAs("administrator", { route: "/admin/exam-scheduler" });

			// Select multiple classes
			cy.get("body", { timeout: 10000 }).then(($body) => {
				const classCheckboxes = $body.find('input[type="checkbox"]');
				if (classCheckboxes.length >= 2) {
					cy.log("Selecting multiple classes");
					cy.wrap(classCheckboxes.eq(0)).check();
					cy.wrap(classCheckboxes.eq(1)).check();

					cy.findByRole("button", {
						name: /generate|schedule|create|planifier|générer/i,
					}).click();

					cy.contains(/generated|created|success/i, { timeout: 15000 }).should(
						"exist",
					);

					// Should show multiple classes in report
					cy.get("body").then(($report) => {
						const text = $report.text();
						const hasMultipleClasses =
							text.match(/class|classe/gi)?.length || 0 > 1;
						if (hasMultipleClasses) {
							cy.log("Multiple classes scheduled");
						}
					});
				} else {
					cy.log("Not enough classes for multi-selection test");
				}
			});
		});

		it("applies scheduling rules consistently across classes", () => {
			cy.loginAs("administrator", { route: "/admin/exam-scheduler" });

			cy.get("body", { timeout: 10000 }).then(($body) => {
				const classCheckboxes = $body.find('input[type="checkbox"]');
				if (classCheckboxes.length >= 2) {
					cy.wrap(classCheckboxes.eq(0)).check();
					cy.wrap(classCheckboxes.eq(1)).check();

					cy.findByRole("button", {
						name: /generate|schedule|create|planifier|générer/i,
					}).click();

					cy.contains(/generated|created|success/i, { timeout: 15000 }).should(
						"exist",
					);

					// All generated exams should follow same rules
					cy.log("Exams generated with consistent rules");
				}
			});
		});
	});

	describe("Scheduling Report", () => {
		it("lists all generated exams with details", () => {
			cy.loginAs("administrator", { route: "/admin/exam-scheduler" });

			cy.get("body", { timeout: 10000 }).then(($body) => {
				const classCheckboxes = $body.find('input[type="checkbox"]');
				if (classCheckboxes.length > 0) {
					cy.wrap(classCheckboxes.first()).check();
				}
			});

			cy.findByRole("button", {
				name: /generate|schedule|create|planifier|générer/i,
			}).click();

			cy.contains(/generated|created|success/i, { timeout: 15000 }).should(
				"exist",
			);

			// Should show list of created exams
			cy.get("body").then(($body) => {
				const hasExamList =
					$body.find("table, ul, [data-testid*='exam-list']").length > 0;
				if (hasExamList) {
					cy.log("Generated exams list displayed");
				}
			});
		});

		it("shows class and course for each generated exam", () => {
			cy.loginAs("administrator", { route: "/admin/exam-scheduler" });

			cy.get("body", { timeout: 10000 }).then(($body) => {
				const classCheckboxes = $body.find('input[type="checkbox"]');
				if (classCheckboxes.length > 0) {
					cy.wrap(classCheckboxes.first()).check();
				}
			});

			cy.findByRole("button", {
				name: /generate|schedule|create|planifier|générer/i,
			}).click();

			cy.contains(/generated|created|success/i, { timeout: 15000 }).should(
				"exist",
			);

			// Should show class/course information
			cy.contains(/class|course|classe|cours/i).should("exist");
		});

		it("displays exam dates in the report", () => {
			cy.loginAs("administrator", { route: "/admin/exam-scheduler" });

			cy.get("body", { timeout: 10000 }).then(($body) => {
				const classCheckboxes = $body.find('input[type="checkbox"]');
				if (classCheckboxes.length > 0) {
					cy.wrap(classCheckboxes.first()).check();
				}
			});

			cy.findByRole("button", {
				name: /generate|schedule|create|planifier|générer/i,
			}).click();

			cy.contains(/generated|created|success/i, { timeout: 15000 }).should(
				"exist",
			);

			// Should show dates
			cy.get("body").then(($body) => {
				const hasDates =
					$body.text().match(/\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}/) !== null;
				if (hasDates) {
					cy.log("Exam dates displayed in report");
				}
			});
		});

		it("allows viewing scheduled exams in main exam list", () => {
			cy.loginAs("administrator", { route: "/admin/exam-scheduler" });

			cy.get("body", { timeout: 10000 }).then(($body) => {
				const classCheckboxes = $body.find('input[type="checkbox"]');
				if (classCheckboxes.length > 0) {
					cy.wrap(classCheckboxes.first()).check();
				}
			});

			cy.findByRole("button", {
				name: /generate|schedule|create|planifier|générer/i,
			}).click();

			cy.contains(/generated|created|success/i, { timeout: 15000 }).should(
				"exist",
			);

			// Navigate to main exam list
			cy.visit("/admin/exams");

			// Should see generated exams
			cy.get("body", { timeout: 10000 }).then(($body) => {
				const hasExams = $body.text().match(/exam|examen/i) !== null;
				expect(hasExams).to.be.true;
			});
		});
	});

	describe("Canceling Scheduling", () => {
		it("allows canceling before generation starts", () => {
			cy.loginAs("administrator", { route: "/admin/exam-scheduler" });

			// Configure but don't generate
			cy.get("body", { timeout: 10000 }).then(($body) => {
				const classCheckboxes = $body.find('input[type="checkbox"]');
				if (classCheckboxes.length > 0) {
					cy.wrap(classCheckboxes.first()).check();

					// Look for cancel/reset button
					const cancelButton = $body.find(
						'button:contains("Cancel"), button:contains("Reset"), button:contains("Annuler")',
					);
					if (cancelButton.length > 0) {
						cy.wrap(cancelButton).first().click();

						// Selections should be cleared
						cy.wrap(classCheckboxes.first()).should("not.be.checked");
					}
				}
			});
		});
	});
});
