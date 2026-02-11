describe("Student Management - Modification", () => {
	beforeEach(() => {
		cy.resetDatabase();
	});

	describe("Editing Student Information", () => {
		it("successfully edits student personal information", () => {
			cy.loginAs("administrator", { route: "/admin/students" });

			// Find and click edit button on first student
			cy.findAllByRole("button", { name: /edit|modifier/i })
				.first()
				.click();

			// Modify fields
			cy.findByLabelText(/first.*name|prénom/i)
				.clear()
				.type("UpdatedFirst");
			cy.findByLabelText(/last.*name|nom/i)
				.clear()
				.type("UpdatedLast");

			// Save changes
			cy.findByRole("button", {
				name: /save|update|enregistrer|mettre.*jour/i,
			}).click();

			// Should show success message
			cy.contains(/updated|modifié|success|succès/i, {
				timeout: 10000,
			}).should("exist");

			// Should see updated data in the list
			cy.contains("UpdatedFirst").should("exist");
			cy.contains("UpdatedLast").should("exist");
		});

		it("allows changing student class", () => {
			cy.loginAs("administrator", { route: "/admin/students" });

			// Edit first student
			cy.findAllByRole("button", { name: /edit|modifier/i })
				.first()
				.click();

			// Change class
			cy.get(
				'[data-testid="class-select"], #class, #classId, [name="classId"]',
				{ timeout: 5000 },
			).click();
			// Select a different class (second option)
			cy.get("[role=option]").eq(1).click();

			// Save
			cy.findByRole("button", {
				name: /save|update|enregistrer|mettre.*jour/i,
			}).click();

			// Should save successfully
			cy.contains(/updated|modifié|success|succès/i, {
				timeout: 10000,
			}).should("exist");
		});

		it("persists changes after page reload", () => {
			cy.loginAs("administrator", { route: "/admin/students" });

			// Edit first student
			cy.findAllByRole("button", { name: /edit|modifier/i })
				.first()
				.click();

			const uniqueName = `Persisted${Date.now()}`;

			cy.findByLabelText(/first.*name|prénom/i)
				.clear()
				.type(uniqueName);

			cy.findByRole("button", {
				name: /save|update|enregistrer|mettre.*jour/i,
			}).click();

			cy.contains(/updated|modifié|success|succès/i, {
				timeout: 10000,
			}).should("exist");

			// Reload page
			cy.reload();

			// Should still see the updated name
			cy.contains(uniqueName, { timeout: 10000 }).should("exist");
		});

		it("validates email format during edit", () => {
			cy.loginAs("administrator", { route: "/admin/students" });

			cy.findAllByRole("button", { name: /edit|modifier/i })
				.first()
				.click();

			// Enter invalid email
			cy.findByLabelText(/email|courriel/i)
				.clear()
				.type("invalid-email-format");

			cy.findByRole("button", {
				name: /save|update|enregistrer|mettre.*jour/i,
			}).click();

			// Should show validation error
			cy.get("body").then(($body) => {
				const hasEmailError =
					$body.text().match(/email.*invalid|email.*valide|format/i) !== null;
				const inputInvalid =
					$body.find('input[type="email"]:invalid').length > 0;

				expect(hasEmailError || inputInvalid).to.be.true;
			});
		});

		it("prevents setting duplicate email during edit", () => {
			cy.loginAs("administrator", { route: "/admin/students" });

			// Get the email of the second student to attempt duplication
			let existingEmail: string;

			cy.get("body").then(($body) => {
				// Find an email in the table (look for email pattern)
				const emailMatch = $body.text().match(/[\w.-]+@example\.com/);
				if (emailMatch) {
					existingEmail = emailMatch[0];
				}
			});

			// Edit a different student
			cy.findAllByRole("button", { name: /edit|modifier/i })
				.eq(1)
				.click();

			// Try to set duplicate email
			cy.findByLabelText(/email|courriel/i).then(($input) => {
				if (existingEmail) {
					cy.wrap($input).clear().type(existingEmail);
				} else {
					// Fallback: try a known email from seed data
					cy.wrap($input).clear().type("admin@example.com");
				}
			});

			cy.findByRole("button", {
				name: /save|update|enregistrer|mettre.*jour/i,
			}).click();

			// Should show duplicate error
			cy.contains(/duplicate|already.*exists|existe.*déjà|conflict/i, {
				timeout: 10000,
			}).should("exist");
		});

		it("loads current student data in edit form", () => {
			cy.loginAs("administrator", { route: "/admin/students" });

			// Capture student name from list
			let studentName: string;
			cy.get("body")
				.invoke("text")
				.then((text) => {
					// Find a student name (assuming seed data has students)
					const match = text.match(/ENG\d+-\d+/);
					if (match) {
						studentName = match[0];
					}
				});

			// Click edit on first student
			cy.findAllByRole("button", { name: /edit|modifier/i })
				.first()
				.click();

			// Form should have populated data
			cy.findByLabelText(/first.*name|prénom/i).should("not.have.value", "");
			cy.findByLabelText(/last.*name|nom/i).should("not.have.value", "");
			cy.findByLabelText(/email|courriel/i).should("not.have.value", "");
		});
	});

	describe("Cancel Edit", () => {
		it("allows canceling edit without saving", () => {
			cy.loginAs("administrator", { route: "/admin/students" });

			cy.findAllByRole("button", { name: /edit|modifier/i })
				.first()
				.click();

			// Make changes
			cy.findByLabelText(/first.*name|prénom/i)
				.clear()
				.type("WillNotSave");

			// Click cancel
			cy.findByRole("button", { name: /cancel|annuler/i }).click();

			// Changes should not be saved
			cy.contains("WillNotSave").should("not.exist");
		});

		it("discards changes when canceling", () => {
			cy.loginAs("administrator", { route: "/admin/students" });

			// Get original first name
			let originalName: string;
			cy.findAllByRole("button", { name: /edit|modifier/i })
				.first()
				.click();

			cy.findByLabelText(/first.*name|prénom/i)
				.invoke("val")
				.then((val) => {
					originalName = val as string;
				});

			// Change it
			cy.findByLabelText(/first.*name|prénom/i)
				.clear()
				.type("TempChange");

			// Cancel
			cy.findByRole("button", { name: /cancel|annuler/i }).click();

			// Edit again to verify original is still there
			cy.findAllByRole("button", { name: /edit|modifier/i })
				.first()
				.click();

			cy.findByLabelText(/first.*name|prénom/i).should(($input) => {
				const val = $input.val();
				expect(val).not.to.equal("TempChange");
			});
		});
	});

	describe("Edit Validation", () => {
		it("requires first name when editing", () => {
			cy.loginAs("administrator", { route: "/admin/students" });

			cy.findAllByRole("button", { name: /edit|modifier/i })
				.first()
				.click();

			// Clear first name
			cy.findByLabelText(/first.*name|prénom/i).clear();

			cy.findByRole("button", {
				name: /save|update|enregistrer|mettre.*jour/i,
			}).click();

			// Should show validation error
			cy.contains(/first.*name.*required|prénom.*obligatoire|required/i, {
				timeout: 5000,
			}).should("exist");
		});

		it("requires last name when editing", () => {
			cy.loginAs("administrator", { route: "/admin/students" });

			cy.findAllByRole("button", { name: /edit|modifier/i })
				.first()
				.click();

			// Clear last name
			cy.findByLabelText(/last.*name|nom/i).clear();

			cy.findByRole("button", {
				name: /save|update|enregistrer|mettre.*jour/i,
			}).click();

			// Should show validation error
			cy.contains(/last.*name.*required|nom.*obligatoire|required/i, {
				timeout: 5000,
			}).should("exist");
		});

		it("requires email when editing", () => {
			cy.loginAs("administrator", { route: "/admin/students" });

			cy.findAllByRole("button", { name: /edit|modifier/i })
				.first()
				.click();

			// Clear email
			cy.findByLabelText(/email|courriel/i).clear();

			cy.findByRole("button", {
				name: /save|update|enregistrer|mettre.*jour/i,
			}).click();

			// Should show validation error
			cy.contains(/email.*required|email.*obligatoire|required/i, {
				timeout: 5000,
			}).should("exist");
		});
	});

	describe("Multiple Edits", () => {
		it("allows editing multiple students sequentially", () => {
			cy.loginAs("administrator", { route: "/admin/students" });

			// Edit first student
			cy.findAllByRole("button", { name: /edit|modifier/i })
				.first()
				.click();

			cy.findByLabelText(/first.*name|prénom/i)
				.clear()
				.type("FirstEdit");

			cy.findByRole("button", {
				name: /save|update|enregistrer|mettre.*jour/i,
			}).click();

			cy.contains(/updated|modifié|success|succès/i, {
				timeout: 10000,
			}).should("exist");

			// Edit second student
			cy.findAllByRole("button", { name: /edit|modifier/i })
				.eq(1)
				.click();

			cy.findByLabelText(/first.*name|prénom/i)
				.clear()
				.type("SecondEdit");

			cy.findByRole("button", {
				name: /save|update|enregistrer|mettre.*jour/i,
			}).click();

			cy.contains(/updated|modifié|success|succès/i, {
				timeout: 10000,
			}).should("exist");

			// Both should be visible
			cy.contains("FirstEdit").should("exist");
			cy.contains("SecondEdit").should("exist");
		});
	});

	describe("Update Registration Number", () => {
		it("allows updating registration number (if editable)", () => {
			cy.loginAs("administrator", { route: "/admin/students" });

			cy.findAllByRole("button", { name: /edit|modifier/i })
				.first()
				.click();

			// Check if registration number field exists and is editable
			cy.get("body").then(($body) => {
				const regNumberInput = $body.find(
					'[name="registrationNumber"], [data-testid="registration-number"]',
				);

				if (regNumberInput.length > 0 && !regNumberInput.prop("disabled")) {
					cy.log("Registration number is editable");
					cy.wrap(regNumberInput).clear().type("NEW-REG-123");

					cy.findByRole("button", {
						name: /save|update|enregistrer|mettre.*jour/i,
					}).click();

					cy.contains(/updated|modifié|success|succès/i, {
						timeout: 10000,
					}).should("exist");

					cy.contains("NEW-REG-123").should("exist");
				} else {
					cy.log("Registration number is read-only - skipping");
				}
			});
		});
	});

	describe("Edit Student Status", () => {
		it("allows changing student status (if feature exists)", () => {
			cy.loginAs("administrator", { route: "/admin/students" });

			cy.findAllByRole("button", { name: /edit|modifier/i })
				.first()
				.click();

			// Check if status field exists
			cy.get("body").then(($body) => {
				if (
					$body.find('[name="status"], [data-testid="status-select"]').length >
					0
				) {
					cy.log("Status field exists");
					cy.get('[name="status"], [data-testid="status-select"]').click();
					cy.get("[role=option]").first().click();

					cy.findByRole("button", {
						name: /save|update|enregistrer|mettre.*jour/i,
					}).click();

					cy.contains(/updated|modifié|success|succès/i, {
						timeout: 10000,
					}).should("exist");
				} else {
					cy.log("No status field - skipping");
				}
			});
		});
	});
});
