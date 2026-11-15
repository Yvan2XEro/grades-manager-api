/**
 * Flow 04 — Full lifecycle of an exam
 *
 * User questions this flow answers:
 *  - "How do I create an exam with all its configuration options?"
 *  - "What is the difference between CC, TP, TPE and FINAL?"
 *  - "How do I schedule exams in the calendar?"
 *  - "What happens when an exam is locked — can it still be edited?"
 *  - "How does the admin approve an exam and lock the grades for good?"
 *  - "How do I run a grade approval workflow?"
 */
import { test } from "@playwright/test";
import { capture, loginAs, pause, SEED_DATA } from "../fixtures/auth";

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 1: Explore existing exams and understand their structure
// Question: "Which exams are already configured and what state are they in?"
// ─────────────────────────────────────────────────────────────────────────────
test("08 - Liste des examens : états, types et actions disponibles", async ({
	page,
}) => {
	await loginAs(page, "admin");

	// ── STEP 1: Full list of all exams ────────────────────────────────────────
	await page.goto("/admin/exams");
	await page.waitForLoadState("networkidle");
	await pause(1400);
	await capture(page, "04a-exams-liste-complete");

	// ── STEP 2: Scroll to see all exams ───────────────────────────────────────
	await page.evaluate(() => window.scrollTo({ top: 300, behavior: "smooth" }));
	await pause(800);
	await capture(page, "04b-exams-liste-scrollee");
	await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
	await pause(500);

	// ── STEP 3: Hover over an exam to see the available actions ───────────────
	// "What can I do on an existing exam?"
	const anatRow = page
		.locator('tr:has-text("Anatomie"), [role="row"]:has-text("Anatomie")')
		.first();
	const firstRow = page.locator("table tbody tr").first();
	const examRow = (await anatRow.count()) > 0 ? anatRow : firstRow;

	if (await examRow.isVisible()) {
		await examRow.hover();
		await pause(700);
		await capture(page, "04c-exam-row-hover-actions");

		// Open the actions menu
		const actionsBtn = examRow
			.locator(
				'button:has-text("Actions"), button[aria-label*="actions"], button[aria-haspopup]',
			)
			.first();
		if (await actionsBtn.isVisible()) {
			await actionsBtn.click();
			await pause(700);
			await capture(page, "04d-exam-menu-actions-ouvert");
			await page.keyboard.press("Escape");
			await pause(400);
		}

		// Open the exam's detail
		await examRow.click();
		await page.waitForLoadState("networkidle");
		await pause(1200);
		await capture(page, "04e-exam-detail-complet");

		await page.evaluate(() =>
			window.scrollTo({ top: 300, behavior: "smooth" }),
		);
		await pause(800);
		await capture(page, "04f-exam-detail-liste-etudiants-notes");

		await page.evaluate(() =>
			window.scrollTo({ top: 700, behavior: "smooth" }),
		);
		await pause(700);
		await capture(page, "04g-exam-detail-statistiques");

		await page.goBack();
		await pause(600);
	}

	// ── STEP 4: Filter by class INF25-BTS1A ───────────────────────────────────
	const classFilter = page.locator('[data-testid="class-select"]').first();
	if (await classFilter.isVisible()) {
		await classFilter.click();
		await pause(700);
		await capture(page, "04h-filtre-classe-ouvert");

		const infOption = page
			.locator(`[role="option"]:has-text("${SEED_DATA.classes.infirmierA}")`)
			.first();
		if (await infOption.isVisible()) {
			await infOption.click();
			await page.waitForLoadState("networkidle");
			await pause(1000);
			await capture(page, "04i-exams-filtres-inf25");
		} else {
			await page.keyboard.press("Escape");
		}
	}

	// ── STEP 5: Exam types (CC, TP, TPE, FINAL) ───────────────────────────────
	// "What is the weighting of each exam type?"
	await page.goto("/admin/exam-types");
	await page.waitForLoadState("networkidle");
	await pause(1300);
	await capture(page, "04j-types-examens-liste");

	const typeRows = page.locator("table tbody tr");
	const typeCount = await typeRows.count();
	for (let i = 0; i < Math.min(typeCount, 4); i++) {
		await typeRows.nth(i).hover();
		await pause(450);
	}
	await capture(page, "04k-types-examens-hover-detail");

	// Open a type to see its configuration
	if (await typeRows.first().isVisible()) {
		await typeRows.first().click();
		await page.waitForLoadState("networkidle");
		await pause(1000);
		await capture(page, "04l-type-exam-detail-config");
		await page.goBack();
		await pause(500);
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 2: Create a complete new exam with an approval workflow
// Question: "How do I create a Final exam for Physiology S1?"
// ─────────────────────────────────────────────────────────────────────────────
test("09 - Création complète d'un examen Final Physiologie avec workflow", async ({
	page,
}) => {
	await loginAs(page, "admin");
	await page.goto("/admin/exams");
	await page.waitForLoadState("networkidle");
	await pause(800);

	// ── STEP 1: Add button ────────────────────────────────────────────────────
	const addBtn = page
		.locator(
			'[data-testid="add-exam-button"], [data-testid="add-exam-button-empty"]',
		)
		.first();
	const fallback = page
		.locator(
			'button:has-text("Add exam"), button:has-text("Ajouter"), button:has-text("Nouvel examen"), button:has-text("New exam")',
		)
		.first();
	const btn = (await addBtn.count()) > 0 ? addBtn : fallback;

	if (!(await btn.isVisible())) {
		await capture(page, "04m-bouton-ajouter-exam-introuvable");
		return;
	}
	await btn.hover();
	await pause(500);
	await capture(page, "04m-bouton-ajouter-exam-hover");
	await btn.click();
	await pause(900);
	await capture(page, "04n-formulaire-creation-exam-ouvert");

	// ── STEP 2: Select the Physiology course ──────────────────────────────────
	const coursSelect = page.locator('[data-testid="class-course-select"]');
	if (await coursSelect.isVisible()) {
		await coursSelect.click();
		await pause(700);
		await capture(page, "04o-cours-dropdown-creation-exam");

		const physOption = page
			.locator(`[role="option"]:has-text("${SEED_DATA.courses.physiologie}")`)
			.first();
		if (await physOption.isVisible()) {
			await physOption.hover();
			await pause(400);
			await physOption.click();
		} else {
			await page.locator('[role="option"]').first().click();
		}
		await pause(600);
		await capture(page, "04p-cours-physiologie-selectionne");
	}

	// ── STEP 3: Exam name ─────────────────────────────────────────────────────
	const nameInput = page
		.locator(
			'input[placeholder*="exam name"], input[placeholder*="nom"], input[name*="name"]',
		)
		.first();
	if (await nameInput.isVisible()) {
		await nameInput.click();
		await nameInput.type("Examen Final — Physiologie S1 2025-2026", {
			delay: 60,
		});
		await pause(500);
		await capture(page, "04q-nom-examen-saisi");
	}

	// ── STEP 4: Exam type: FINAL ──────────────────────────────────────────────
	// Note: this is a free-text textbox with autosuggest
	const typeInput = page
		.locator(
			'input[placeholder*="Midterm"], input[placeholder*="Final"], input[placeholder*="ype"]',
		)
		.first();
	if (await typeInput.isVisible()) {
		await typeInput.click();
		await typeInput.type("FINAL", { delay: 80 });
		await pause(600);
		await capture(page, "04r-type-exam-saisi-final");
		// Accept the autosuggestion if available
		const suggestion = page
			.locator('[role="option"]:has-text("FINAL")')
			.first();
		if (await suggestion.isVisible({ timeout: 1200 }).catch(() => false)) {
			await suggestion.click();
		}
		await pause(400);
	}

	// ── STEP 5: Exam date ─────────────────────────────────────────────────────
	// "When will this exam take place?"
	const dateBtn = page
		.locator(
			'button:has-text("Choose a date"), button[aria-label*="date"], input[type="date"]',
		)
		.first();
	if (await dateBtn.isVisible()) {
		await dateBtn.click();
		await pause(800);
		await capture(page, "04s-selecteur-date-ouvert");

		// Pick the 20th of the current month
		const day20 = page.locator('[role="gridcell"]:has-text("20")').first();
		if (await day20.isVisible()) {
			await day20.click();
			await pause(500);
			await capture(page, "04t-date-selectionnee");
		} else {
			await page.keyboard.press("Escape");
		}
	}

	// ── STEP 6: Weight (coefficient) — 60% of the final grade ─────────────────
	// "What is the weight of this exam in the course's final grade?"
	const weightInput = page
		.locator(
			'input[type="number"][name*="weight"], input[placeholder*="Weight"], spinbutton',
		)
		.first();
	if (await weightInput.isVisible()) {
		await weightInput.click();
		await weightInput.fill("60");
		await pause(400);
		await capture(page, "04u-poids-examen-60pct");
	}

	// ── STEP 7: Completed form — preview before submission ────────────────────
	await capture(page, "04v-formulaire-exam-complet");

	// ── STEP 8: Save button ───────────────────────────────────────────────────
	const saveBtn = page
		.locator(
			'button:has-text("Save exam"), button:has-text("Enregistrer"), button:has-text("Créer"), button:has-text("Create")',
		)
		.first();
	if (await saveBtn.isVisible()) {
		await saveBtn.scrollIntoViewIfNeeded();
		await saveBtn.hover();
		await pause(700);
		await capture(page, "04w-bouton-creer-exam-hover");
	}

	await page.keyboard.press("Escape");
	await pause(500);
});

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 3: The scheduler — organizing exams in the calendar
// Question: "How do I view and organize all exams over time?"
// ─────────────────────────────────────────────────────────────────────────────
test("10 - Planificateur d'examens : calendrier et gestion des conflits", async ({
	page,
}) => {
	await loginAs(page, "admin");

	// ── STEP 1: Monthly calendar view of exams ────────────────────────────────
	await page.goto("/admin/exam-scheduler");
	await page.waitForLoadState("networkidle");
	await pause(1500);
	await capture(page, "04x-planificateur-vue-mensuelle");

	// ── STEP 2: Scroll to see the scheduled exams ─────────────────────────────
	await page.evaluate(() => window.scrollTo({ top: 300, behavior: "smooth" }));
	await pause(900);
	await capture(page, "04y-planificateur-examens-planifies");
	await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
	await pause(500);

	// ── STEP 3: Hover over an exam in the calendar ────────────────────────────
	// "What happens if I hover over an exam in the calendar?"
	const calendarEvent = page
		.locator('[class*="event"], [class*="exam"], [data-testid*="exam"]')
		.first();
	if (await calendarEvent.isVisible()) {
		await calendarEvent.hover();
		await pause(700);
		await capture(page, "04z-planificateur-survol-examen");
	}

	// ── STEP 4: Navigate to the next month ────────────────────────────────────
	const nextBtn = page
		.locator(
			'button[aria-label*="next"], button[aria-label*="Next"], button[aria-label*="suivant"]',
		)
		.first();
	if (await nextBtn.isVisible()) {
		await nextBtn.click();
		await pause(900);
		await capture(page, "05a-planificateur-mois-suivant");

		// Back to the current month
		const prevBtn = page
			.locator(
				'button[aria-label*="prev"], button[aria-label*="Prev"], button[aria-label*="précédent"]',
			)
			.first();
		if (await prevBtn.isVisible()) {
			await prevBtn.click();
			await pause(700);
			await capture(page, "05b-planificateur-retour-mois-courant");
		}
	}

	// ── STEP 5: Scheduler list view (if available) ────────────────────────────
	const listViewBtn = page
		.locator(
			'button:has-text("Liste"), button:has-text("List"), [aria-label*="list"]',
		)
		.first();
	if (await listViewBtn.isVisible()) {
		await listViewBtn.click();
		await pause(900);
		await capture(page, "05c-planificateur-vue-liste");
	}

	// ── STEP 6: Exam approval workflows ───────────────────────────────────────
	// "How do I submit an exam for approval?"
	await page.goto("/admin/exams");
	await page.waitForLoadState("networkidle");
	await pause(1200);

	// Look for exams with pending workflows
	const workflowBtn = page
		.locator(
			'button:has-text("Workflows"), button:has-text("Approbation"), a[href*="workflow"]',
		)
		.first();
	if (await workflowBtn.isVisible()) {
		await workflowBtn.click();
		await page.waitForLoadState("networkidle");
		await pause(1200);
		await capture(page, "05d-workflows-approbation-liste");

		await page.evaluate(() =>
			window.scrollTo({ top: 400, behavior: "smooth" }),
		);
		await pause(700);
		await capture(page, "05e-workflows-details");
	} else {
		// Try the workflows page directly
		await page.goto("/admin/workflows");
		await page.waitForLoadState("networkidle");
		await pause(1200);
		await capture(page, "05d-workflows-page-directe");
	}
});
