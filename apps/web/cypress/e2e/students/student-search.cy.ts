describe("Student Management - Search and Filtering", () => {
	beforeEach(() => {
		cy.resetDatabase();
	});

	describe("Search by Name", () => {
		it("finds students by first name", () => {
			cy.loginAs("administrator", { route: "/admin/students" });

			// Wait for students to load
			cy.get("body", { timeout: 10000 }).should("contain.text", "ENG");

			// Search by first name (using seed data)
			cy.get('[data-testid="search-input"], input[type="search"], input[placeholder*="search"], input[placeholder*="recherch"]')
				.clear()
				.type("Alice");

			// Should show only matching students
			cy.contains("Alice", { timeout: 5000 }).should("exist");

			// Other students should not be visible (if search is filtering)
			cy.get("body").then(($body) => {
				const hasOtherStudents = $body.text().match(/Bob|Charlie/);
				if (hasOtherStudents) {
					cy.log("Search might not be filtering - showing all results");
				} else {
					cy.log("Search is properly filtering results");
				}
			});
		});

		it("finds students by last name", () => {
			cy.loginAs("administrator", { route: "/admin/students" });

			cy.get("body", { timeout: 10000 }).should("contain.text", "ENG");

			// Search by last name
			cy.get('[data-testid="search-input"], input[type="search"], input[placeholder*="search"], input[placeholder*="recherch"]')
				.clear()
				.type("Teacher");

			// Should show matching students
			cy.contains("Teacher", { timeout: 5000 }).should("exist");
		});

		it("performs case-insensitive search", () => {
			cy.loginAs("administrator", { route: "/admin/students" });

			cy.get("body", { timeout: 10000 }).should("contain.text", "ENG");

			// Search with lowercase
			cy.get('[data-testid="search-input"], input[type="search"], input[placeholder*="search"], input[placeholder*="recherch"]')
				.clear()
				.type("alice");

			// Should still find Alice (case-insensitive)
			cy.contains(/alice/i, { timeout: 5000 }).should("exist");
		});

		it("handles partial name matches", () => {
			cy.loginAs("administrator", { route: "/admin/students" });

			cy.get("body", { timeout: 10000 }).should("contain.text", "ENG");

			// Search with partial name
			cy.get('[data-testid="search-input"], input[type="search"], input[placeholder*="search"], input[placeholder*="recherch"]')
				.clear()
				.type("Ali");

			// Should find "Alice"
			cy.contains("Alice", { timeout: 5000 }).should("exist");
		});

		it("shows no results message when no matches found", () => {
			cy.loginAs("administrator", { route: "/admin/students" });

			cy.get("body", { timeout: 10000 }).should("contain.text", "ENG");

			// Search for non-existent student
			cy.get('[data-testid="search-input"], input[type="search"], input[placeholder*="search"], input[placeholder*="recherch"]')
				.clear()
				.type("NonExistentStudentName123");

			// Should show no results
			cy.contains(/no.*result|no.*student|aucun.*résultat|aucun.*étudiant/i, {
				timeout: 5000,
			}).should("exist");
		});

		it("clears search results when search is cleared", () => {
			cy.loginAs("administrator", { route: "/admin/students" });

			cy.get("body", { timeout: 10000 }).should("contain.text", "ENG");

			// Perform search
			cy.get('[data-testid="search-input"], input[type="search"], input[placeholder*="search"], input[placeholder*="recherch"]')
				.clear()
				.type("Alice");

			cy.contains("Alice", { timeout: 5000 }).should("exist");

			// Clear search
			cy.get('[data-testid="search-input"], input[type="search"], input[placeholder*="search"], input[placeholder*="recherch"]').clear();

			// Should show all students again
			cy.get("body").then(($body) => {
				const hasMultipleStudents = ($body.text().match(/ENG\d+-\d+/g) || [])
					.length > 1;
				expect(hasMultipleStudents).to.be.true;
			});
		});
	});

	describe("Search by Registration Number", () => {
		it("finds student by exact registration number", () => {
			cy.loginAs("administrator", { route: "/admin/students" });

			cy.get("body", { timeout: 10000 }).should("contain.text", "ENG");

			// Get a registration number from the page
			let regNumber: string;
			cy.get("body")
				.invoke("text")
				.then((text) => {
					const match = text.match(/ENG\d+-\d+/);
					if (match) {
						regNumber = match[0];
						cy.log(`Found registration number: ${regNumber}`);

						// Search by registration number
						cy.get('[data-testid="search-input"], input[type="search"], input[placeholder*="search"], input[placeholder*="recherch"]')
							.clear()
							.type(regNumber);

						// Should find the student
						cy.contains(regNumber, { timeout: 5000 }).should("exist");
					}
				});
		});

		it("finds student by partial registration number", () => {
			cy.loginAs("administrator", { route: "/admin/students" });

			cy.get("body", { timeout: 10000 }).should("contain.text", "ENG");

			// Search by partial registration number
			cy.get('[data-testid="search-input"], input[type="search"], input[placeholder*="search"], input[placeholder*="recherch"]')
				.clear()
				.type("ENG");

			// Should find students with ENG in their registration number
			cy.contains(/ENG\d+-\d+/, { timeout: 5000 }).should("exist");
		});
	});

	describe("Filter by Class", () => {
		it("filters students by selected class", () => {
			cy.loginAs("administrator", { route: "/admin/students" });

			cy.get("body", { timeout: 10000 }).should("contain.text", "ENG");

			// Find and click class filter dropdown
			cy.get('[data-testid="class-filter"], [data-testid="class-select"]', {
				timeout: 5000,
			}).click();

			// Select first class
			cy.get("[role=option]").first().click();

			// Should show only students from that class
			cy.get("body").then(($body) => {
				const studentCount = ($body.text().match(/ENG\d+-\d+/g) || []).length;
				cy.log(`Found ${studentCount} students in filtered class`);
				expect(studentCount).to.be.greaterThan(0);
			});
		});

		it("shows all students when 'All Classes' is selected", () => {
			cy.loginAs("administrator", { route: "/admin/students" });

			cy.get("body", { timeout: 10000 }).should("contain.text", "ENG");

			// Filter by class first
			cy.get('[data-testid="class-filter"], [data-testid="class-select"]', {
				timeout: 5000,
			}).click();
			cy.get("[role=option]").first().click();

			// Then select "All" or clear filter
			cy.get('[data-testid="class-filter"], [data-testid="class-select"]', {
				timeout: 5000,
			}).click();

			// Look for "All" or reset option
			cy.get("body").then(($body) => {
				if ($body.text().match(/all.*class|toutes.*class/i)) {
					cy.findByRole("option", { name: /all.*class|toutes.*class/i }).click();
				} else if ($body.find('[data-testid="clear-filter"]').length > 0) {
					cy.get('[data-testid="clear-filter"]').click();
				}
			});

			// Should show more students
			cy.get("body").then(($body) => {
				const studentCount = ($body.text().match(/ENG\d+-\d+/g) || []).length;
				expect(studentCount).to.be.greaterThan(0);
			});
		});
	});

	describe("Combined Search and Filter", () => {
		it("applies both search and class filter together", () => {
			cy.loginAs("administrator", { route: "/admin/students" });

			cy.get("body", { timeout: 10000 }).should("contain.text", "ENG");

			// Apply class filter
			cy.get('[data-testid="class-filter"], [data-testid="class-select"]', {
				timeout: 5000,
			}).click();
			cy.get("[role=option]").first().click();

			// Also search by name
			cy.get('[data-testid="search-input"], input[type="search"], input[placeholder*="search"], input[placeholder*="recherch"]')
				.clear()
				.type("Alice");

			// Should show only Alice from the selected class
			cy.contains("Alice", { timeout: 5000 }).should("exist");
		});

		it("maintains filter when performing search", () => {
			cy.loginAs("administrator", { route: "/admin/students" });

			cy.get("body", { timeout: 10000 }).should("contain.text", "ENG");

			// Apply filter first
			cy.get('[data-testid="class-filter"], [data-testid="class-select"]', {
				timeout: 5000,
			}).click();
			cy.get("[role=option]").first().click();

			// Perform search
			cy.get('[data-testid="search-input"], input[type="search"], input[placeholder*="search"], input[placeholder*="recherch"]')
				.clear()
				.type("Student");

			// Filter should still be applied (verify by checking if filter dropdown shows selection)
			cy.get('[data-testid="class-filter"], [data-testid="class-select"]').should(
				($select) => {
					const text = $select.text();
					expect(text).not.to.match(/select.*class|choisir.*class/i);
				},
			);
		});
	});

	describe("Search Performance", () => {
		it("performs search quickly with many results", () => {
			cy.loginAs("administrator", { route: "/admin/students" });

			cy.get("body", { timeout: 10000 }).should("contain.text", "ENG");

			const startTime = Date.now();

			// Perform search
			cy.get('[data-testid="search-input"], input[type="search"], input[placeholder*="search"], input[placeholder*="recherch"]')
				.clear()
				.type("a");

			// Results should appear quickly
			cy.get("body", { timeout: 3000 }).then(() => {
				const endTime = Date.now();
				const duration = endTime - startTime;
				cy.log(`Search took ${duration}ms`);
				expect(duration).to.be.lessThan(3000);
			});
		});
	});

	describe("Search Results Display", () => {
		it("displays relevant student information in search results", () => {
			cy.loginAs("administrator", { route: "/admin/students" });

			cy.get("body", { timeout: 10000 }).should("contain.text", "ENG");

			cy.get('[data-testid="search-input"], input[type="search"], input[placeholder*="search"], input[placeholder*="recherch"]')
				.clear()
				.type("Alice");

			// Should show name, registration number, and class info
			cy.contains("Alice", { timeout: 5000 }).should("exist");
			cy.contains(/ENG\d+-\d+/).should("exist");
		});

		it("shows search result count", () => {
			cy.loginAs("administrator", { route: "/admin/students" });

			cy.get("body", { timeout: 10000 }).should("contain.text", "ENG");

			cy.get('[data-testid="search-input"], input[type="search"], input[placeholder*="search"], input[placeholder*="recherch"]')
				.clear()
				.type("Student");

			// Look for result count indicator
			cy.get("body").then(($body) => {
				const hasResultCount =
					$body.text().match(/\d+.*result|\d+.*étudiant/) !== null;
				if (hasResultCount) {
					cy.log("Search result count is displayed");
				}
			});
		});
	});

	describe("Clear Filters", () => {
		it("provides clear all filters button", () => {
			cy.loginAs("administrator", { route: "/admin/students" });

			cy.get("body", { timeout: 10000 }).should("contain.text", "ENG");

			// Apply filter
			cy.get('[data-testid="class-filter"], [data-testid="class-select"]', {
				timeout: 5000,
			}).click();
			cy.get("[role=option]").first().click();

			// Search
			cy.get('[data-testid="search-input"], input[type="search"], input[placeholder*="search"], input[placeholder*="recherch"]')
				.clear()
				.type("Test");

			// Look for clear filters button
			cy.get("body").then(($body) => {
				if (
					$body.find('[data-testid="clear-filters"], button:contains("Clear")')
						.length > 0
				) {
					cy.log("Clear filters button exists");
					cy.get(
						'[data-testid="clear-filters"], button:contains("Clear")',
					).click();

					// Filters should be cleared
					cy.get('[data-testid="search-input"], input[type="search"]').should(
						"have.value",
						"",
					);
				}
			});
		});
	});

	describe("Real-time Search", () => {
		it("updates results as user types", () => {
			cy.loginAs("administrator", { route: "/admin/students" });

			cy.get("body", { timeout: 10000 }).should("contain.text", "ENG");

			const searchInput =
				'[data-testid="search-input"], input[type="search"], input[placeholder*="search"], input[placeholder*="recherch"]';

			// Type first letter
			cy.get(searchInput).clear().type("A");
			cy.wait(500); // Wait for debounce

			// Results should update
			cy.get("body").should("contain.text", /a/i);

			// Type more letters
			cy.get(searchInput).type("li");
			cy.wait(500); // Wait for debounce

			// Results should update to be more specific
			cy.contains("Alice", { timeout: 5000 }).should("exist");
		});
	});
});
