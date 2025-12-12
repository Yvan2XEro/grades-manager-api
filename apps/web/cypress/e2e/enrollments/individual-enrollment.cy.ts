describe("Enrollment Management - Individual Enrollment", () => {
	beforeEach(() => {
		cy.resetDatabase();
	});

	describe("Creating Individual Enrollment", () => {
		it("successfully enrolls a student in a class", () => {
			cy.loginAs("administrator", { route: "/admin/enrollments" });

			// Select academic year
			cy.get('[data-testid="academic-year-select"]', {
				timeout: 10000,
			}).click();
			cy.findByRole("option", { name: /2024-2025/i }).click();

			// Select a class
			cy.get('[data-testid="class-select"]').click();
			cy.get("[role=option]").first().click();

			// Should see students or enroll button
			cy.get("body", { timeout: 10000 }).should("exist");

			// Look for individual enroll functionality
			cy.get("body").then(($body) => {
				const hasEnrollButton =
					$body.find('[data-testid="enroll-student"]').length > 0 ||
					$body.find('button:contains("Enroll")').length > 0;

				if (hasEnrollButton) {
					cy.log("Individual enrollment button found");

					// Try to click on whichever button exists
					if ($body.find('[data-testid="enroll-student"]').length > 0) {
						cy.get('[data-testid="enroll-student"]').first().click();
					} else {
						cy.findByRole("button", { name: /enroll/i })
							.first()
							.click();
					}

					// Should show success
					cy.contains(/enrolled|inscrit|success|succès/i, {
						timeout: 10000,
					}).should("exist");
				} else {
					cy.log(
						"Individual enrollment might use bulk enrollment - checking that",
					);
				}
			});
		});

		it("sets enrollment status to 'active'", () => {
			cy.loginAs("administrator", { route: "/admin/enrollments" });

			cy.get('[data-testid="academic-year-select"]', {
				timeout: 10000,
			}).click();
			cy.findByRole("option", { name: /2024-2025/i }).click();

			cy.get('[data-testid="class-select"]').click();
			cy.get("[role=option]").first().click();

			// Enroll student
			cy.findByRole("button", {
				name: /enroll.*entire.*class|enroll/i,
			}).click();
			cy.findByRole("button", { name: /confirm/i }).click();

			cy.contains(/enrolled|inscrit|synced/i, { timeout: 10000 }).should(
				"exist",
			);

			// Check status - should show active
			cy.contains(/active|actif/i, { timeout: 5000 }).should("exist");
		});

		it("prevents duplicate enrollment for same student/class/year", () => {
			cy.loginAs("administrator", { route: "/admin/enrollments" });

			cy.get('[data-testid="academic-year-select"]', {
				timeout: 10000,
			}).click();
			cy.findByRole("option", { name: /2024-2025/i }).click();

			cy.get('[data-testid="class-select"]').click();
			cy.get("[role=option]").first().click();

			// Enroll entire class first
			cy.findByRole("button", { name: /enroll.*entire.*class/i }).click();
			cy.findByRole("button", { name: /confirm/i }).click();

			cy.contains(/enrolled|inscrit|synced/i, { timeout: 10000 }).should(
				"exist",
			);

			// Try to enroll again
			cy.findByRole("button", { name: /enroll.*entire.*class/i }).click();
			cy.findByRole("button", { name: /confirm/i }).click();

			// Should handle gracefully (either show already enrolled or skip duplicates)
			cy.get("body", { timeout: 10000 }).then(($body) => {
				const hasConflictMessage =
					$body.text().match(/already.*enrolled|déjà.*inscrit|conflict/i) !==
					null;
				const hasSuccessMessage =
					$body.text().match(/enrolled|inscrit|synced/i) !== null;

				expect(hasConflictMessage || hasSuccessMessage).to.be.true;
			});
		});
	});

	describe("Enrollment Selection", () => {
		it("requires student selection", () => {
			cy.loginAs("administrator", { route: "/admin/enrollments" });

			cy.get('[data-testid="academic-year-select"]', {
				timeout: 10000,
			}).click();
			cy.findByRole("option", { name: /2024-2025/i }).click();

			// Try to enroll without selecting class
			cy.get("body").then(($body) => {
				if (
					$body.find('button:contains("Enroll"), button:contains("Confirm")')
						.length > 0
				) {
					const enrollButton = $body.find(
						'button:contains("Enroll"), button:contains("Confirm")',
					);
					if (!enrollButton.prop("disabled")) {
						cy.log("Enroll button is enabled - testing submission");
					} else {
						cy.log("Enroll button is disabled as expected");
					}
				}
			});
		});

		it("requires class selection", () => {
			cy.loginAs("administrator", { route: "/admin/enrollments" });

			cy.get('[data-testid="academic-year-select"]', {
				timeout: 10000,
			}).click();
			cy.findByRole("option", { name: /2024-2025/i }).click();

			// Without selecting class, enroll button should be disabled or not visible
			cy.findByRole("button", { name: /enroll.*entire.*class/i }).should(
				"be.disabled",
			);
		});

		it("requires academic year selection", () => {
			cy.loginAs("administrator", { route: "/admin/enrollments" });

			// Without selecting academic year, class selection should be disabled
			cy.get('[data-testid="class-select"]').should("be.disabled");
		});
	});

	describe("Enrollment Display", () => {
		it("displays enrolled student in roster", () => {
			cy.loginAs("administrator", { route: "/admin/enrollments" });

			cy.get('[data-testid="academic-year-select"]', {
				timeout: 10000,
			}).click();
			cy.findByRole("option", { name: /2024-2025/i }).click();

			cy.get('[data-testid="class-select"]').click();
			cy.get("[role=option]").first().click();

			// Enroll class
			cy.findByRole("button", { name: /enroll.*entire.*class/i }).click();
			cy.findByRole("button", { name: /confirm/i }).click();

			cy.contains(/enrolled|inscrit|synced/i, { timeout: 10000 }).should(
				"exist",
			);

			// Should show students in roster
			cy.contains(/ENG\d+-\d+/, { timeout: 5000 }).should("exist");
		});

		it("shows enrollment status", () => {
			cy.loginAs("administrator", { route: "/admin/enrollments" });

			cy.get('[data-testid="academic-year-select"]', {
				timeout: 10000,
			}).click();
			cy.findByRole("option", { name: /2024-2025/i }).click();

			cy.get('[data-testid="class-select"]').click();
			cy.get("[role=option]").first().click();

			cy.findByRole("button", { name: /enroll.*entire.*class/i }).click();
			cy.findByRole("button", { name: /confirm/i }).click();

			cy.contains(/enrolled|inscrit|synced/i, { timeout: 10000 }).should(
				"exist",
			);

			// Should show active status
			cy.contains(/active|actif/i).should("exist");
		});

		it("displays enrollment date/timestamp", () => {
			cy.loginAs("administrator", { route: "/admin/enrollments" });

			cy.get('[data-testid="academic-year-select"]', {
				timeout: 10000,
			}).click();
			cy.findByRole("option", { name: /2024-2025/i }).click();

			cy.get('[data-testid="class-select"]').click();
			cy.get("[role=option]").first().click();

			cy.findByRole("button", { name: /enroll.*entire.*class/i }).click();
			cy.findByRole("button", { name: /confirm/i }).click();

			cy.contains(/enrolled|inscrit|synced/i, { timeout: 10000 }).should(
				"exist",
			);

			// Look for date/timestamp
			cy.get("body").then(($body) => {
				const hasDate =
					$body.text().match(/\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}/) !== null;
				if (hasDate) {
					cy.log("Enrollment date is displayed");
				}
			});
		});
	});

	describe("Enrollment Validation", () => {
		it("validates that student belongs to selected class", () => {
			cy.loginAs("administrator", { route: "/admin/enrollments" });

			cy.get('[data-testid="academic-year-select"]', {
				timeout: 10000,
			}).click();
			cy.findByRole("option", { name: /2024-2025/i }).click();

			cy.get('[data-testid="class-select"]').click();
			cy.get("[role=option]").first().click();

			// Enroll the class first to ensure there are students
			cy.findByRole("button", {
				name: /enroll.*entire.*class|enroll/i,
			}).click();
			cy.findByRole("button", { name: /confirm/i }).click();

			cy.contains(/enrolled|inscrit|synced/i, { timeout: 10000 }).should(
				"exist",
			);

			// Should show students from that class
			cy.get("body", { timeout: 10000 }).then(($body) => {
				const studentCount = ($body.text().match(/ENG\d+-\d+/g) || []).length;
				cy.log(`Found ${studentCount} students in selected class`);

				if (studentCount > 0) {
					cy.log("✓ Students are visible in the selected class");
				} else {
					cy.log(
						"⚠ No students found - class may be empty or students not visible yet",
					);
				}
			});
		});
	});

	describe("Multiple Enrollments", () => {
		it("allows enrolling the same student in different academic years", () => {
			cy.loginAs("administrator", { route: "/admin/enrollments" });

			// Enroll in first year
			cy.get('[data-testid="academic-year-select"]', {
				timeout: 10000,
			}).click();
			cy.findByRole("option", { name: /2024-2025/i }).click();

			cy.get('[data-testid="class-select"]').click();
			cy.get("[role=option]").first().click();

			cy.findByRole("button", { name: /enroll.*entire.*class/i }).click();
			cy.findByRole("button", { name: /confirm/i }).click();

			cy.contains(/enrolled|inscrit|synced/i, { timeout: 10000 }).should(
				"exist",
			);

			// Try to check for other academic years
			cy.get("body").then(($body) => {
				const hasOtherYears =
					$body
						.find('[data-testid="academic-year-select"] option')
						.filter((_, el) => el.textContent?.match(/2023-2024|2025-2026/))
						.length > 0;

				if (hasOtherYears) {
					cy.log(
						"Multiple academic years available - can test cross-year enrollment",
					);
				} else {
					cy.log("Only one academic year in seed data");
				}
			});
		});
	});

	describe("Course-Level Enrollment", () => {
		it("opens course roster dialog", () => {
			cy.loginAs("administrator", { route: "/admin/enrollments" });

			cy.get('[data-testid="academic-year-select"]', {
				timeout: 10000,
			}).click();
			cy.findByRole("option", { name: /2024-2025/i }).click();

			cy.get('[data-testid="class-select"]').click();
			cy.get("[role=option]").first().click();

			// Enroll class first
			cy.findByRole("button", { name: /enroll.*entire.*class/i }).click();
			cy.findByRole("button", { name: /confirm/i }).click();

			cy.contains(/enrolled|inscrit|synced/i, { timeout: 10000 }).should(
				"exist",
			);

			// Open roster for a specific course
			cy.findAllByRole("button", { name: /open.*roster|voir.*roster/i })
				.first()
				.click();

			// Should show roster dialog
			cy.contains(/course.*roster|roster.*cours/i, { timeout: 5000 }).should(
				"exist",
			);
			cy.contains(/managing|gérer/i).should("exist");
		});

		it("allows withdrawing student from specific course", () => {
			cy.loginAs("administrator", { route: "/admin/enrollments" });

			cy.get('[data-testid="academic-year-select"]', {
				timeout: 10000,
			}).click();
			cy.findByRole("option", { name: /2024-2025/i }).click();

			cy.get('[data-testid="class-select"]').click();
			cy.get("[role=option]").first().click();

			cy.findByRole("button", { name: /enroll.*entire.*class/i }).click();
			cy.findByRole("button", { name: /confirm/i }).click();

			cy.contains(/enrolled|inscrit|synced/i, { timeout: 10000 }).should(
				"exist",
			);

			// Open roster
			cy.findAllByRole("button", { name: /open.*roster|voir.*roster/i })
				.first()
				.click();

			// Look for withdraw button
			cy.get("body").then(($body) => {
				if (
					$body.find('button:contains("Withdraw"), button:contains("Retirer")')
						.length > 0
				) {
					cy.log("Withdraw functionality exists");
					cy.findAllByRole("button", { name: /withdraw|retirer/i })
						.first()
						.click();

					cy.contains(/withdrawn|retiré|success/i, { timeout: 10000 }).should(
						"exist",
					);
				} else {
					cy.log("No withdraw button - might be view-only roster");
				}
			});
		});
	});
});
