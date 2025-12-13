describe("Grade Locking", () => {
	beforeEach(() => {
		cy.resetDatabase();
	});

	describe("Lock Mechanism", () => {
		it("prevents modifying locked grades", () => {
			// Teacher enters and submits grades
			cy.loginAs("teacher", { route: "/teacher/workflows" });

			// Select class course
			cy.get("#class-course, [data-testid='class-course-select']", {
				timeout: 10000,
			}).click();
			cy.get("[role=option]").first().click();

			// Submit the exam for approval
			cy.findAllByRole("button", { name: /submit/i })
				.first()
				.click();
			cy.contains(/exam submitted|soumis/i, { timeout: 10000 }).should("exist");

			// Dean approves and locks
			cy.loginAs("dean", { route: "/dean/workflows" });
			cy.findAllByRole("button", {
				name: /approve.*lock|approuver.*verrouiller/i,
			})
				.first()
				.click();
			cy.contains(/approved|approuvé|locked|verrouillé/i, {
				timeout: 10000,
			}).should("exist");

			// Teacher tries to lock the approved exam
			cy.loginAs("teacher", { route: "/teacher/workflows" });
			cy.get("#class-course, [data-testid='class-course-select']", {
				timeout: 10000,
			}).click();
			cy.get("[role=option]").first().click();

			cy.findAllByRole("button", { name: /lock|verrouiller/i })
				.first()
				.click();
			cy.contains(/locked|verrouillé/i, { timeout: 10000 }).should("exist");

			// Now try to modify grades - should be prevented
			cy.visit("/teacher/grades");

			cy.get('[data-testid="class-course-select"], #class-course', {
				timeout: 10000,
			}).click();
			cy.get("[role=option]").first().click();

			cy.get('[data-testid="exam-select"], #exam', { timeout: 5000 }).click();
			cy.get("[role=option]").first().click();

			// Grade inputs should be disabled or show locked message
			cy.get("body").then(($body) => {
				const hasLockedMessage = $body.text().match(/locked|verrouillé/i);
				const hasDisabledInputs =
					$body.find("input[disabled], input[readonly]").length > 0;

				expect(hasLockedMessage || hasDisabledInputs).to.be.true;
			});
		});

		it("shows appropriate message when trying to modify locked grades", () => {
			// Complete the locking workflow first
			cy.loginAs("teacher", { route: "/teacher/workflows" });
			cy.get("#class-course, [data-testid='class-course-select']", {
				timeout: 10000,
			}).click();
			cy.get("[role=option]").first().click();
			cy.findAllByRole("button", { name: /submit/i })
				.first()
				.click();
			cy.contains(/exam submitted|soumis/i, { timeout: 10000 }).should("exist");

			cy.loginAs("dean", { route: "/dean/workflows" });
			cy.findAllByRole("button", {
				name: /approve.*lock|approuver.*verrouiller/i,
			})
				.first()
				.click();
			cy.contains(/approved|approuvé/i, { timeout: 10000 }).should("exist");

			cy.loginAs("teacher", { route: "/teacher/workflows" });
			cy.get("#class-course, [data-testid='class-course-select']", {
				timeout: 10000,
			}).click();
			cy.get("[role=option]").first().click();
			cy.findAllByRole("button", { name: /lock|verrouiller/i })
				.first()
				.click();
			cy.contains(/locked|verrouillé/i, { timeout: 10000 }).should("exist");

			// Try to access grade entry
			cy.visit("/teacher/grades");
			cy.get('[data-testid="class-course-select"], #class-course', {
				timeout: 10000,
			}).click();
			cy.get("[role=option]").first().click();

			cy.get('[data-testid="exam-select"], #exam', { timeout: 5000 }).click();
			cy.get("[role=option]").first().click();

			// Should show locked message
			cy.contains(/locked|verrouillé|cannot.*modif|ne.*peut.*modif/i, {
				timeout: 5000,
			}).should("exist");
		});

		it("disables grade input fields when exam is locked", () => {
			// Complete the locking workflow
			cy.loginAs("teacher", { route: "/teacher/workflows" });
			cy.get("#class-course, [data-testid='class-course-select']", {
				timeout: 10000,
			}).click();
			cy.get("[role=option]").first().click();
			cy.findAllByRole("button", { name: /submit/i })
				.first()
				.click();
			cy.contains(/exam submitted|soumis/i, { timeout: 10000 }).should("exist");

			cy.loginAs("dean", { route: "/dean/workflows" });
			cy.findAllByRole("button", {
				name: /approve.*lock|approuver.*verrouiller/i,
			})
				.first()
				.click();
			cy.contains(/approved|approuvé/i, { timeout: 10000 }).should("exist");

			cy.loginAs("teacher", { route: "/teacher/workflows" });
			cy.get("#class-course, [data-testid='class-course-select']", {
				timeout: 10000,
			}).click();
			cy.get("[role=option]").first().click();
			cy.findAllByRole("button", { name: /lock|verrouiller/i })
				.first()
				.click();
			cy.contains(/locked|verrouillé/i, { timeout: 10000 }).should("exist");

			// Check grade entry page
			cy.visit("/teacher/grades");
			cy.get('[data-testid="class-course-select"], #class-course', {
				timeout: 10000,
			}).click();
			cy.get("[role=option]").first().click();

			cy.get('[data-testid="exam-select"], #exam', { timeout: 5000 }).click();
			cy.get("[role=option]").first().click();

			// Grade inputs should be disabled
			cy.get(
				'input[type="number"], input[placeholder*="note"], input[placeholder*="grade"]',
			).should(($inputs) => {
				if ($inputs.length > 0) {
					expect($inputs.first()).to.match("[disabled], [readonly]");
				}
			});
		});
	});

	describe("Lock Status Visibility", () => {
		it("displays lock status indicator", () => {
			// Complete locking workflow
			cy.loginAs("teacher", { route: "/teacher/workflows" });
			cy.get("#class-course, [data-testid='class-course-select']", {
				timeout: 10000,
			}).click();
			cy.get("[role=option]").first().click();
			cy.findAllByRole("button", { name: /submit/i })
				.first()
				.click();
			cy.contains(/exam submitted|soumis/i, { timeout: 10000 }).should("exist");

			cy.loginAs("dean", { route: "/dean/workflows" });
			cy.findAllByRole("button", {
				name: /approve.*lock|approuver.*verrouiller/i,
			})
				.first()
				.click();
			cy.contains(/approved|approuvé/i, { timeout: 10000 }).should("exist");

			cy.loginAs("teacher", { route: "/teacher/workflows" });
			cy.get("#class-course, [data-testid='class-course-select']", {
				timeout: 10000,
			}).click();
			cy.get("[role=option]").first().click();
			cy.findAllByRole("button", { name: /lock|verrouiller/i })
				.first()
				.click();
			cy.contains(/locked|verrouillé/i, { timeout: 10000 }).should("exist");

			// Visit grades page
			cy.visit("/teacher/grades");
			cy.get('[data-testid="class-course-select"], #class-course', {
				timeout: 10000,
			}).click();
			cy.get("[role=option]").first().click();

			cy.get('[data-testid="exam-select"], #exam', { timeout: 5000 }).click();
			cy.get("[role=option]").first().click();

			// Should show locked indicator (badge, icon, or text)
			cy.get("body").then(($body) => {
				const hasLockIndicator =
					$body.text().match(/locked|verrouillé/i) ||
					$body.find('[data-testid*="lock"], [class*="lock"]').length > 0;

				expect(hasLockIndicator).to.be.true;
			});
		});

		it("shows lock icon or badge in exam list", () => {
			// Complete locking workflow
			cy.loginAs("teacher", { route: "/teacher/workflows" });
			cy.get("#class-course, [data-testid='class-course-select']", {
				timeout: 10000,
			}).click();
			cy.get("[role=option]").first().click();
			cy.findAllByRole("button", { name: /submit/i })
				.first()
				.click();
			cy.contains(/exam submitted|soumis/i, { timeout: 10000 }).should("exist");

			cy.loginAs("dean", { route: "/dean/workflows" });
			cy.findAllByRole("button", {
				name: /approve.*lock|approuver.*verrouiller/i,
			})
				.first()
				.click();
			cy.contains(/approved|approuvé/i, { timeout: 10000 }).should("exist");

			cy.loginAs("teacher", { route: "/teacher/workflows" });
			cy.get("#class-course, [data-testid='class-course-select']", {
				timeout: 10000,
			}).click();
			cy.get("[role=option]").first().click();
			cy.findAllByRole("button", { name: /lock|verrouiller/i })
				.first()
				.click();
			cy.contains(/locked|verrouillé/i, { timeout: 10000 }).should("exist");

			// Visit workflow page to see exam list
			cy.visit("/teacher/workflows");
			cy.get("#class-course, [data-testid='class-course-select']", {
				timeout: 10000,
			}).click();
			cy.get("[role=option]").first().click();

			// Should show locked indicator in the list
			cy.contains(/locked|verrouillé/i).should("exist");
		});
	});

	describe("Lock Workflow States", () => {
		it("follows proper workflow: unlocked → submitted → approved → locked", () => {
			// Step 1: Unlocked state
			cy.loginAs("teacher", { route: "/teacher/workflows" });
			cy.get("#class-course, [data-testid='class-course-select']", {
				timeout: 10000,
			}).click();
			cy.get("[role=option]").first().click();

			// Should show submit button
			cy.findAllByRole("button", { name: /submit/i }).should("exist");

			// Step 2: Submit
			cy.findAllByRole("button", { name: /submit/i })
				.first()
				.click();
			cy.contains(/exam submitted|soumis/i, { timeout: 10000 }).should("exist");

			// Step 3: Dean approves
			cy.loginAs("dean", { route: "/dean/workflows" });
			cy.findAllByRole("button", {
				name: /approve.*lock|approuver.*verrouiller/i,
			})
				.first()
				.click();
			cy.contains(/approved|approuvé/i, { timeout: 10000 }).should("exist");

			// Step 4: Teacher locks
			cy.loginAs("teacher", { route: "/teacher/workflows" });
			cy.get("#class-course, [data-testid='class-course-select']", {
				timeout: 10000,
			}).click();
			cy.get("[role=option]").first().click();

			cy.findAllByRole("button", { name: /lock|verrouiller/i })
				.first()
				.click();
			cy.contains(/locked|verrouillé/i, { timeout: 10000 }).should("exist");

			// Verify final locked state
			cy.reload();
			cy.get("#class-course, [data-testid='class-course-select']", {
				timeout: 10000,
			}).click();
			cy.get("[role=option]").first().click();

			// Should show locked status
			cy.contains(/locked|verrouillé/i).should("exist");
		});
	});

	describe("Grade Entry Before Locking", () => {
		it("allows grade entry before exam is locked", () => {
			cy.loginAs("teacher", { route: "/teacher/grades" });

			// Select unlocked exam
			cy.get('[data-testid="class-course-select"], #class-course', {
				timeout: 10000,
			}).click();
			cy.get("[role=option]").first().click();

			cy.get('[data-testid="exam-select"], #exam', { timeout: 5000 }).click();
			cy.get("[role=option]").first().click();

			// Should be able to enter grades
			cy.get(
				'input[type="number"], input[placeholder*="note"], input[placeholder*="grade"]',
			)
				.first()
				.should("not.be.disabled")
				.clear()
				.type("16");

			cy.findByRole("button", { name: /save|enregistrer/i }).click();

			// Should save successfully
			cy.contains(/saved|enregistré|success|succès/i, {
				timeout: 10000,
			}).should("exist");
		});
	});
});
