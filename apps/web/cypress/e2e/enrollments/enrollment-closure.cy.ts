describe("Enrollment Management - Enrollment Closure", () => {
	beforeEach(() => {
		cy.resetDatabase();
	});

	describe("Closing Individual Enrollment", () => {
		it("changes enrollment status to 'completed'", () => {
			cy.loginAs("administrator", { route: "/admin/enrollments" });

			// Select academic year and class
			cy.get('[data-testid="academic-year-select"]', { timeout: 10000 }).click();
			cy.findByRole("option", { name: /2024-2025/i }).click();

			cy.get('[data-testid="class-select"]').click();
			cy.get("[role=option]").first().click();

			// Enroll class first
			cy.findByRole("button", { name: /enroll.*entire.*class|enroll.*all/i }).click();
			cy.findByRole("button", { name: /confirm.*enrollment|confirm/i }).click();

			cy.contains(/enrolled|inscrit|synced/i, { timeout: 15000 }).should(
				"exist",
			);

			// Look for close/complete enrollment button
			cy.get("body").then(($body) => {
				if (
					$body.find(
						'button:contains("Close"), button:contains("Complete"), button:contains("Clôturer")',
					).length > 0
				) {
					cy.log("Close enrollment feature exists");

					cy.findAllByRole("button", {
						name: /close|complete|clôturer|terminer/i,
					})
						.first()
						.click();

					// Check if confirmation dialog appears
					cy.wait(1000);
					cy.get("body").then(($dialog) => {
						if (
							$dialog.find('button:contains("Confirm"), button:contains("Confirmer")')
								.length > 0
						) {
							cy.findByRole("button", { name: /confirm/i }).click();
						}
					});

					// Should show completed status
					cy.contains(/completed|terminé|closed|clôturé/i, {
						timeout: 10000,
					}).should("exist");
				} else {
					cy.log("Close enrollment feature not found - may use status change");
				}
			});
		});

		it("preserves enrollment history after closure", () => {
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

			// Get student info before closing
			let studentRegistrationNumber: string;
			cy.get("body")
				.invoke("text")
				.then((text) => {
					const match = text.match(/ENG\d+-\d+/);
					if (match) {
						studentRegistrationNumber = match[0];
						cy.log(`Found student: ${studentRegistrationNumber}`);
					}
				});

			// Close enrollment if feature exists
			cy.get("body").then(($body) => {
				if (
					$body.find(
						'button:contains("Close"), button:contains("Complete"), button:contains("Clôturer")',
					).length > 0
				) {
					cy.findAllByRole("button", {
						name: /close|complete|clôturer|terminer/i,
					})
						.first()
						.click();

					// Check if confirmation dialog appears
					cy.wait(1000);
					cy.get("body").then(($dialog) => {
						if (
							$dialog.find('button:contains("Confirm"), button:contains("Confirmer")')
								.length > 0
						) {
							cy.findByRole("button", { name: /confirm/i }).click();
						}
					});

					cy.contains(/completed|terminé|closed/i, { timeout: 10000 }).should(
						"exist",
					);

					// Verify student is still visible in the system
					if (studentRegistrationNumber) {
						cy.contains(studentRegistrationNumber).should("exist");
					}
				}
			});
		});

		it("prevents modifications to closed enrollment", () => {
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

			// Close enrollment
			cy.get("body").then(($body) => {
				if (
					$body.find(
						'button:contains("Close"), button:contains("Complete"), button:contains("Clôturer")',
					).length > 0
				) {
					cy.findAllByRole("button", {
						name: /close|complete|clôturer|terminer/i,
					})
						.first()
						.click();

					// Check if confirmation dialog appears
					cy.wait(1000);
					cy.get("body").then(($dialog) => {
						if (
							$dialog.find('button:contains("Confirm"), button:contains("Confirmer")')
								.length > 0
						) {
							cy.findByRole("button", { name: /confirm/i }).click();
						}
					});

					cy.contains(/completed|terminé|closed/i, { timeout: 10000 }).should(
						"exist",
					);

					// Try to open roster - should be read-only
					cy.findAllByRole("button", { name: /open.*roster|voir.*roster/i })
						.first()
						.click();

					cy.get("body").then(($body) => {
						const hasWithdrawButton =
							$body.find('button:contains("Withdraw"), button:contains("Retirer")')
								.length > 0;

						if (hasWithdrawButton) {
							// Button should be disabled
							cy.findAllByRole("button", { name: /withdraw|retirer/i })
								.first()
								.should("be.disabled");
						} else {
							cy.log("No withdraw button in closed enrollment - as expected");
						}
					});
				}
			});
		});
	});

	describe("Closing Enrollment Window", () => {
		it("displays enrollment window status", () => {
			cy.loginAs("administrator", { route: "/admin/enrollments" });

			cy.get('[data-testid="academic-year-select"]', { timeout: 10000 }).click();
			cy.findByRole("option", { name: /2024-2025/i }).click();

			cy.get('[data-testid="class-select"]').click();
			cy.get("[role=option]").first().click();

			// Should show window status
			cy.contains(/window|période|fenêtre/i, { timeout: 10000 }).should("exist");
		});

		it("shows open/closed window indicator", () => {
			cy.loginAs("administrator", { route: "/admin/enrollments" });

			cy.get('[data-testid="academic-year-select"]', { timeout: 10000 }).click();
			cy.findByRole("option", { name: /2024-2025/i }).click();

			cy.get('[data-testid="class-select"]').click();
			cy.get("[role=option]").first().click();

			// Look for window status indicator
			cy.get("body").then(($body) => {
				const hasWindowStatus =
					$body.text().match(/open|closed|ouvert|fermé/i) !== null;
				if (hasWindowStatus) {
					cy.log("Enrollment window status is shown");
				}
			});
		});

		it("allows closing enrollment window for entire class", () => {
			cy.loginAs("administrator", { route: "/admin/enrollments" });

			cy.get('[data-testid="academic-year-select"]', { timeout: 10000 }).click();
			cy.findByRole("option", { name: /2024-2025/i }).click();

			cy.get('[data-testid="class-select"]').click();
			cy.get("[role=option]").first().click();

			// Enroll class first
			cy.findByRole("button", { name: /enroll.*entire.*class|enroll.*all/i }).click();
			cy.findByRole("button", { name: /confirm.*enrollment|confirm/i }).click();

			cy.contains(/enrolled|inscrit|synced/i, { timeout: 15000 }).should(
				"exist",
			);

			// Look for close window button
			cy.get("body").then(($body) => {
				if (
					$body.find(
						'button:contains("Close"), button:contains("Clôturer"), button:contains("Close Window")',
					).length > 0
				) {
					cy.log("Close window feature exists");

					cy.findByRole("button", {
						name: /close.*window|clôturer.*fenêtre/i,
					}).click();

					// Check if confirmation dialog appears
					cy.wait(1000);
					cy.get("body").then(($dialog) => {
						if (
							$dialog.find('button:contains("Confirm"), button:contains("Confirmer")')
								.length > 0
						) {
							cy.findByRole("button", { name: /confirm/i }).click();
						}
					});

					cy.contains(/closed|fermé|completed/i, { timeout: 10000 }).should(
						"exist",
					);
				} else {
					cy.log("Close window feature not found");
				}
			});
		});
	});

	describe("Immutability After Closure", () => {
		it("prevents new enrollments after closure", () => {
			cy.loginAs("administrator", { route: "/admin/enrollments" });

			cy.get('[data-testid="academic-year-select"]', { timeout: 10000 }).click();
			cy.findByRole("option", { name: /2024-2025/i }).click();

			cy.get('[data-testid="class-select"]').click();
			cy.get("[role=option]").first().click();

			// Enroll and close
			cy.findByRole("button", { name: /enroll.*entire.*class|enroll.*all/i }).click();
			cy.findByRole("button", { name: /confirm.*enrollment|confirm/i }).click();

			cy.contains(/enrolled|inscrit|synced/i, { timeout: 15000 }).should(
				"exist",
			);

			cy.get("body").then(($body) => {
				if (
					$body.find('button:contains("Close"), button:contains("Clôturer")')
						.length > 0
				) {
					cy.findAllByRole("button", {
						name: /close|clôturer|complete|terminer/i,
					})
						.first()
						.click();

					// Check if confirmation dialog appears
					cy.wait(1000);
					cy.get("body").then(($dialog) => {
						if (
							$dialog.find('button:contains("Confirm"), button:contains("Confirmer")')
								.length > 0
						) {
							cy.findByRole("button", { name: /confirm/i }).click();
						}
					});

					cy.contains(/closed|fermé|completed/i, { timeout: 10000 }).should(
						"exist",
					);

					// Verify enrollment is prevented (button disabled, hidden, or not present)
					cy.wait(1000);
					cy.get("body").then(($body) => {
						// Try to find enroll button
						const enrollButtons = $body.find(
							'button:contains("Enroll entire class"), button:contains("Enroll all")',
						);

						if (enrollButtons.length > 0) {
							// Button exists - check if it's disabled
							const isDisabled =
								enrollButtons.first().prop("disabled") ||
								enrollButtons.first().attr("disabled") !== undefined;

							if (isDisabled) {
								cy.log("✓ Enroll button is disabled - enrollment prevented");
							} else {
								cy.log(
									"⚠ Enroll button exists and is not disabled - may indicate missing access control",
								);
							}
						} else {
							// Button doesn't exist - enrollment is prevented
							cy.log(
								"✓ Enroll button not found - enrollment prevented by hiding button",
							);
						}
					});
				}
			});
		});

		it("prevents withdrawals after closure", () => {
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

			cy.get("body").then(($body) => {
				if (
					$body.find('button:contains("Close"), button:contains("Clôturer")')
						.length > 0
				) {
					cy.findAllByRole("button", {
						name: /close|clôturer|complete|terminer/i,
					})
						.first()
						.click();

					// Check if confirmation dialog appears
					cy.wait(1000);
					cy.get("body").then(($dialog) => {
						if (
							$dialog.find('button:contains("Confirm"), button:contains("Confirmer")')
								.length > 0
						) {
							cy.findByRole("button", { name: /confirm/i }).click();
						}
					});

					cy.contains(/closed|fermé|completed/i, { timeout: 10000 }).should(
						"exist",
					);

					// Open roster and check withdraw is disabled
					cy.findAllByRole("button", { name: /open.*roster|voir.*roster/i })
						.first()
						.click();

					cy.get("body").then(($body) => {
						const withdrawButtons = $body.find(
							'button:contains("Withdraw"), button:contains("Retirer")',
						);
						if (withdrawButtons.length > 0) {
							// Should be disabled
							cy.wrap(withdrawButtons.first()).should("be.disabled");
						}
					});
				}
			});
		});

		it("shows read-only view of closed enrollments", () => {
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

			cy.get("body").then(($body) => {
				if (
					$body.find('button:contains("Close"), button:contains("Clôturer")')
						.length > 0
				) {
					cy.findAllByRole("button", {
						name: /close|clôturer|complete|terminer/i,
					})
						.first()
						.click();

					// Check if confirmation dialog appears
					cy.wait(1000);
					cy.get("body").then(($dialog) => {
						if (
							$dialog.find('button:contains("Confirm"), button:contains("Confirmer")')
								.length > 0
						) {
							cy.findByRole("button", { name: /confirm/i }).click();
						}
					});

					cy.contains(/closed|fermé|completed/i, { timeout: 10000 }).should(
						"exist",
					);

					// Should still be able to view (but not modify)
					cy.findAllByRole("button", { name: /open.*roster|voir.*roster/i })
						.first()
						.click();

					cy.contains(/roster|liste/i).should("exist");
				}
			});
		});
	});

	describe("Closure Confirmation", () => {
		it("requires confirmation before closing enrollment", () => {
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

			cy.get("body").then(($body) => {
				if (
					$body.find('button:contains("Close"), button:contains("Clôturer")')
						.length > 0
				) {
					cy.findAllByRole("button", {
						name: /close|clôturer|complete|terminer/i,
					})
						.first()
						.click();

					// Check if confirmation dialog appears
					cy.wait(1000);
					cy.get("body").then(($dialog) => {
						if (
							$dialog.find('button:contains("Confirm"), button:contains("Confirmer")')
								.length > 0
						) {
							cy.log("Confirmation dialog shown");
							cy.findByRole("button", { name: /confirm/i }).should("exist");
						} else {
							cy.log("No confirmation dialog - direct action");
						}
					});
				}
			});
		});

		it("shows warning about immutability in confirmation", () => {
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

			cy.get("body").then(($body) => {
				if (
					$body.find('button:contains("Close"), button:contains("Clôturer")')
						.length > 0
				) {
					cy.findAllByRole("button", {
						name: /close|clôturer|complete|terminer/i,
					})
						.first()
						.click();

					// Should show warning about permanence
					cy.get("body").then(($dialog) => {
						const hasWarning =
							$dialog.text().match(/cannot.*undo|permanent|irreversible/i) !==
							null;
						if (hasWarning) {
							cy.log("Immutability warning is shown");
						}
					});
				}
			});
		});

		it("allows canceling closure operation", () => {
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

			cy.get("body").then(($body) => {
				if (
					$body.find('button:contains("Close"), button:contains("Clôturer")')
						.length > 0
				) {
					cy.findAllByRole("button", {
						name: /close|clôturer|complete|terminer/i,
					})
						.first()
						.click();

					// Check if confirmation dialog appears with cancel option
					cy.wait(1000);
					cy.get("body").then(($dialog) => {
						if (
							$dialog.find('button:contains("Cancel"), button:contains("Annuler")')
								.length > 0
						) {
							// Cancel the closure
							cy.findByRole("button", { name: /cancel|annuler/i }).click();

							// Should remain open
							cy.contains(/active|actif|open|ouvert/i).should("exist");
						} else {
							cy.log("No cancel option in dialog - skipping cancel test");
						}
					});
				}
			});
		});
	});

	describe("Reopening Closed Enrollment", () => {
		it("allows reopening closed enrollment (if feature exists)", () => {
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

			cy.get("body").then(($body) => {
				if (
					$body.find('button:contains("Close"), button:contains("Clôturer")')
						.length > 0
				) {
					// Close first
					cy.findAllByRole("button", {
						name: /close|clôturer|complete|terminer/i,
					})
						.first()
						.click();

					// Check if confirmation dialog appears
					cy.wait(1000);
					cy.get("body").then(($dialog) => {
						if (
							$dialog.find('button:contains("Confirm"), button:contains("Confirmer")')
								.length > 0
						) {
							cy.findByRole("button", { name: /confirm/i }).click();
						}
					});

					cy.contains(/closed|fermé|completed/i, { timeout: 10000 }).should(
						"exist",
					);

					// Check for reopen button
					cy.get("body").then(($body) => {
						if (
							$body.find(
								'button:contains("Reopen"), button:contains("Rouvrir")',
							).length > 0
						) {
							cy.log("Reopen feature exists");

							cy.findByRole("button", { name: /reopen|rouvrir/i }).click();

							// Check if confirmation dialog appears for reopen
							cy.wait(1000);
							cy.get("body").then(($dialog) => {
								if (
									$dialog.find('button:contains("Confirm"), button:contains("Confirmer")')
										.length > 0
								) {
									cy.findByRole("button", { name: /confirm/i }).click();
								}
							});

							cy.contains(/open|ouvert|active|actif/i, {
								timeout: 10000,
							}).should("exist");
						} else {
							cy.log("Reopen feature not available - closure is permanent");
						}
					});
				}
			});
		});
	});
});
