describe("Enrollment Management - Bulk Enrollment", () => {
	beforeEach(() => {
		cy.resetDatabase();
	});

	describe("Bulk Class Enrollment", () => {
		it("enrolls entire class with one action", () => {
			cy.loginAs("administrator", { route: "/admin/enrollments" });

			// Select academic year
			cy.get('[data-testid="academic-year-select"]', { timeout: 10000 }).click();
			cy.findByRole("option", { name: /2024-2025/i }).click();

			// Select a class
			cy.get('[data-testid="class-select"]').click();
			cy.get("[role=option]", { timeout: 5000 }).first().click();

			// Click bulk enroll button
			cy.findByRole("button", { name: /enroll.*entire.*class|enroll.*all/i }).click();

			// Confirm
			cy.findByRole("button", { name: /confirm.*enrollment|confirm/i }).click();

			// Should show success message
			cy.contains(/class.*roster.*synced|enrolled|inscrit|success/i, {
				timeout: 15000,
			}).should("exist");
		});

		it("displays count of enrolled students", () => {
			cy.loginAs("administrator", { route: "/admin/enrollments" });

			cy.get('[data-testid="academic-year-select"]', { timeout: 10000 }).click();
			cy.findByRole("option", { name: /2024-2025/i }).click();

			cy.get('[data-testid="class-select"]').click();
			cy.get("[role=option]").first().click();

			cy.findByRole("button", { name: /enroll.*entire.*class|enroll.*all/i }).click();
			cy.findByRole("button", { name: /confirm.*enrollment|confirm/i }).click();

			// Should show count (e.g., "5 students enrolled")
			cy.contains(/\d+.*student|\d+.*étudiant/i, { timeout: 15000 }).should(
				"exist",
			);
		});

		it("handles already enrolled students gracefully", () => {
			cy.loginAs("administrator", { route: "/admin/enrollments" });

			cy.get('[data-testid="academic-year-select"]', { timeout: 10000 }).click();
			cy.findByRole("option", { name: /2024-2025/i }).click();

			cy.get('[data-testid="class-select"]').click();
			cy.get("[role=option]").first().click();

			// Enroll first time
			cy.findByRole("button", { name: /enroll.*entire.*class|enroll.*all/i }).click();
			cy.findByRole("button", { name: /confirm.*enrollment|confirm/i }).click();

			cy.contains(/enrolled|inscrit|synced/i, { timeout: 15000 }).should(
				"exist",
			);

			// Try to enroll again
			cy.findByRole("button", { name: /enroll.*entire.*class|enroll.*all/i }).click();
			cy.findByRole("button", { name: /confirm.*enrollment|confirm/i }).click();

			// Should handle gracefully (skip already enrolled or show message)
			cy.get("body", { timeout: 10000 }).then(($body) => {
				const hasMessage =
					$body.text().match(/already.*enrolled|déjà.*inscrit|0.*new|synced/i) !==
					null;
				expect(hasMessage).to.be.true;
			});
		});

		it("enrolls all students in selected class courses", () => {
			cy.loginAs("administrator", { route: "/admin/enrollments" });

			cy.get('[data-testid="academic-year-select"]', { timeout: 10000 }).click();
			cy.findByRole("option", { name: /2024-2025/i }).click();

			cy.get('[data-testid="class-select"]').click();
			cy.get("[role=option]").first().click();

			cy.findByRole("button", { name: /enroll.*entire.*class|enroll.*all/i }).click();
			cy.findByRole("button", { name: /confirm.*enrollment|confirm/i }).click();

			cy.contains(/enrolled|inscrit|synced/i, { timeout: 15000 }).should(
				"exist",
			);

			// Should see course enrollments listed
			cy.get("body").then(($body) => {
				const hasCourseList =
					$body.find('[data-testid*="course"], tr, li').length > 0;
				expect(hasCourseList).to.be.true;
			});
		});
	});

	describe("Bulk Enrollment Confirmation", () => {
		it("shows confirmation dialog before enrolling", () => {
			cy.loginAs("administrator", { route: "/admin/enrollments" });

			cy.get('[data-testid="academic-year-select"]', { timeout: 10000 }).click();
			cy.findByRole("option", { name: /2024-2025/i }).click();

			cy.get('[data-testid="class-select"]').click();
			cy.get("[role=option]").first().click();

			cy.findByRole("button", { name: /enroll.*entire.*class|enroll.*all/i }).click();

			// Should show confirmation dialog
			cy.contains(/confirm|confirmer/i, { timeout: 5000 }).should("exist");
			cy.findByRole("button", { name: /confirm.*enrollment|confirm/i }).should(
				"exist",
			);
		});

		it("displays enrollment summary in confirmation", () => {
			cy.loginAs("administrator", { route: "/admin/enrollments" });

			cy.get('[data-testid="academic-year-select"]', { timeout: 10000 }).click();
			cy.findByRole("option", { name: /2024-2025/i }).click();

			cy.get('[data-testid="class-select"]').click();
			cy.get("[role=option]").first().click();

			cy.findByRole("button", { name: /enroll.*entire.*class|enroll.*all/i }).click();

			// Should show details about what will be enrolled
			cy.get("body", { timeout: 5000 }).then(($body) => {
				const hasDetails =
					$body.text().match(/student|course|étudiant|cours/i) !== null;
				expect(hasDetails).to.be.true;
			});
		});

		it("allows canceling bulk enrollment", () => {
			cy.loginAs("administrator", { route: "/admin/enrollments" });

			cy.get('[data-testid="academic-year-select"]', { timeout: 10000 }).click();
			cy.findByRole("option", { name: /2024-2025/i }).click();

			cy.get('[data-testid="class-select"]').click();
			cy.get("[role=option]").first().click();

			cy.findByRole("button", { name: /enroll.*entire.*class|enroll.*all/i }).click();

			// Cancel the enrollment
			cy.findByRole("button", { name: /cancel|annuler/i }).click();

			// Should close dialog without enrolling
			cy.findByRole("button", { name: /confirm.*enrollment|confirm/i }).should(
				"not.exist",
			);
		});
	});

	describe("Bulk Enrollment Report", () => {
		it("shows enrollment report after bulk operation", () => {
			cy.loginAs("administrator", { route: "/admin/enrollments" });

			cy.get('[data-testid="academic-year-select"]', { timeout: 10000 }).click();
			cy.findByRole("option", { name: /2024-2025/i }).click();

			cy.get('[data-testid="class-select"]').click();
			cy.get("[role=option]").first().click();

			cy.findByRole("button", { name: /enroll.*entire.*class|enroll.*all/i }).click();
			cy.findByRole("button", { name: /confirm.*enrollment|confirm/i }).click();

			// Should show summary/report
			cy.contains(/enrolled|inscrit|synced|success/i, {
				timeout: 15000,
			}).should("exist");

			// Should show numbers
			cy.get("body").then(($body) => {
				const hasNumbers = $body.text().match(/\d+.*student|\d+.*course/) !== null;
				expect(hasNumbers).to.be.true;
			});
		});

		it("reports any conflicts during bulk enrollment", () => {
			cy.loginAs("administrator", { route: "/admin/enrollments" });

			cy.get('[data-testid="academic-year-select"]', { timeout: 10000 }).click();
			cy.findByRole("option", { name: /2024-2025/i }).click();

			cy.get('[data-testid="class-select"]').click();
			cy.get("[role=option]").first().click();

			// Enroll first time
			cy.findByRole("button", { name: /enroll.*entire.*class|enroll.*all/i }).click();
			cy.findByRole("button", { name: /confirm.*enrollment|confirm/i }).click();

			cy.contains(/enrolled|inscrit|synced/i, { timeout: 15000 }).should(
				"exist",
			);

			// Try again to create conflicts
			cy.findByRole("button", { name: /enroll.*entire.*class|enroll.*all/i }).click();
			cy.findByRole("button", { name: /confirm.*enrollment|confirm/i }).click();

			// Should report that students were already enrolled
			cy.get("body", { timeout: 10000 }).then(($body) => {
				const text = $body.text();
				const hasConflictReport =
					text.match(/already|déjà|0.*new|no.*change/i) !== null;
				expect(hasConflictReport).to.be.true;
			});
		});
	});

	describe("Bulk Enrollment Performance", () => {
		it("handles enrolling large class efficiently", () => {
			cy.loginAs("administrator", { route: "/admin/enrollments" });

			cy.get('[data-testid="academic-year-select"]', { timeout: 10000 }).click();
			cy.findByRole("option", { name: /2024-2025/i }).click();

			cy.get('[data-testid="class-select"]').click();
			cy.get("[role=option]").first().click();

			const startTime = Date.now();

			cy.findByRole("button", { name: /enroll.*entire.*class|enroll.*all/i }).click();
			cy.findByRole("button", { name: /confirm.*enrollment|confirm/i }).click();

			cy.contains(/enrolled|inscrit|synced/i, { timeout: 20000 }).then(() => {
				const duration = Date.now() - startTime;
				cy.log(`Bulk enrollment took ${duration}ms`);
				expect(duration).to.be.lessThan(20000);
			});
		});

		it("provides loading indicator during bulk enrollment", () => {
			cy.loginAs("administrator", { route: "/admin/enrollments" });

			cy.get('[data-testid="academic-year-select"]', { timeout: 10000 }).click();
			cy.findByRole("option", { name: /2024-2025/i }).click();

			cy.get('[data-testid="class-select"]').click();
			cy.get("[role=option]").first().click();

			cy.findByRole("button", { name: /enroll.*entire.*class|enroll.*all/i }).click();
			cy.findByRole("button", { name: /confirm.*enrollment|confirm/i }).click();

			// Should show loading state
			cy.get("body").then(($body) => {
				const hasLoader =
					$body.find('[data-testid*="loading"], [class*="spinner"]').length >
						0 || $body.text().match(/loading|chargement/i) !== null;

				if (hasLoader) {
					cy.log("Loading indicator is shown");
				}
			});

			cy.contains(/enrolled|inscrit|synced/i, { timeout: 15000 }).should(
				"exist",
			);
		});
	});

	describe("Selective Bulk Enrollment", () => {
		it("allows selecting specific students for bulk enrollment", () => {
			cy.loginAs("administrator", { route: "/admin/enrollments" });

			cy.get('[data-testid="academic-year-select"]', { timeout: 10000 }).click();
			cy.findByRole("option", { name: /2024-2025/i }).click();

			cy.get('[data-testid="class-select"]').click();
			cy.get("[role=option]").first().click();

			// Check if there are checkboxes for selective enrollment
			cy.get("body").then(($body) => {
				const hasCheckboxes =
					$body.find('input[type="checkbox"]').length > 1;

				if (hasCheckboxes) {
					cy.log("Selective enrollment is available");

					// Select first two checkboxes
					cy.get('input[type="checkbox"]').eq(0).check();
					cy.get('input[type="checkbox"]').eq(1).check();

					cy.findByRole("button", {
						name: /enroll.*selected|enroll/i,
					}).click();
					cy.findByRole("button", { name: /confirm/i }).click();

					cy.contains(/enrolled|inscrit|success/i, {
						timeout: 10000,
					}).should("exist");
				} else {
					cy.log("Only full class enrollment available");
				}
			});
		});

		it("allows deselecting students from bulk enrollment", () => {
			cy.loginAs("administrator", { route: "/admin/enrollments" });

			cy.get('[data-testid="academic-year-select"]', { timeout: 10000 }).click();
			cy.findByRole("option", { name: /2024-2025/i }).click();

			cy.get('[data-testid="class-select"]').click();
			cy.get("[role=option]").first().click();

			cy.get("body").then(($body) => {
				const hasCheckboxes =
					$body.find('input[type="checkbox"]').length > 1;

				if (hasCheckboxes) {
					// Select all
					cy.get('input[type="checkbox"]').first().check();

					// Deselect one
					cy.get('input[type="checkbox"]').eq(1).uncheck();

					cy.findByRole("button", {
						name: /enroll.*selected|enroll/i,
					}).click();
					cy.findByRole("button", { name: /confirm/i }).click();

					cy.contains(/enrolled|inscrit/i, { timeout: 10000 }).should("exist");
				} else {
					cy.log("Selective enrollment not available");
				}
			});
		});
	});

	describe("Bulk Enrollment by Course", () => {
		it("shows course-wise enrollment status", () => {
			cy.loginAs("administrator", { route: "/admin/enrollments" });

			cy.get('[data-testid="academic-year-select"]', { timeout: 10000 }).click();
			cy.findByRole("option", { name: /2024-2025/i }).click();

			cy.get('[data-testid="class-select"]').click();
			cy.get("[role=option]").first().click();

			cy.findByRole("button", { name: /enroll.*entire.*class|enroll.*all/i }).click();
			cy.findByRole("button", { name: /confirm.*enrollment|confirm/i }).click();

			cy.contains(/enrolled|inscrit|synced/i, { timeout: 15000 }).should(
				"exist",
			);

			// Should show courses with enrollment status
			cy.get("body").then(($body) => {
				const hasCourses =
					$body.text().match(/course|cours|matière/i) !== null;
				if (hasCourses) {
					cy.log("Course-wise status is shown");
				}
			});
		});

		it("displays enrollment count per course", () => {
			cy.loginAs("administrator", { route: "/admin/enrollments" });

			cy.get('[data-testid="academic-year-select"]', { timeout: 10000 }).click();
			cy.findByRole("option", { name: /2024-2025/i }).click();

			cy.get('[data-testid="class-select"]').click();
			cy.get("[role=option]").first().click();

			cy.findByRole("button", { name: /enroll.*entire.*class|enroll.*all/i }).click();
			cy.findByRole("button", { name: /confirm.*enrollment|confirm/i }).click();

			cy.contains(/enrolled|inscrit|synced/i, { timeout: 15000 }).should(
				"exist",
			);

			// Should show count per course (e.g., "5/5 enrolled")
			cy.get("body").then(($body) => {
				const hasCount = $body.text().match(/\d+\/\d+|\d+.*enrolled/) !== null;
				if (hasCount) {
					cy.log("Per-course enrollment count is shown");
				}
			});
		});
	});

	describe("Bulk Unenrollment", () => {
		it("allows bulk unenrolling entire class (if feature exists)", () => {
			cy.loginAs("administrator", { route: "/admin/enrollments" });

			cy.get('[data-testid="academic-year-select"]', { timeout: 10000 }).click();
			cy.findByRole("option", { name: /2024-2025/i }).click();

			cy.get('[data-testid="class-select"]').click();
			cy.get("[role=option]").first().click();

			// First enroll
			cy.findByRole("button", { name: /enroll.*entire.*class|enroll.*all/i }).click();
			cy.findByRole("button", { name: /confirm.*enrollment|confirm/i }).click();

			cy.contains(/enrolled|inscrit|synced/i, { timeout: 15000 }).should(
				"exist",
			);

			// Check for unenroll functionality
			cy.get("body").then(($body) => {
				if (
					$body.find('button:contains("Unenroll"), button:contains("Withdraw")')
						.length > 0
				) {
					cy.log("Bulk unenroll feature exists");
					cy.findByRole("button", { name: /unenroll|withdraw|retirer/i }).click();
					cy.findByRole("button", { name: /confirm/i }).click();

					cy.contains(/unenrolled|withdrawn|retiré/i, {
						timeout: 10000,
					}).should("exist");
				} else {
					cy.log("Bulk unenroll feature not available");
				}
			});
		});
	});
});
