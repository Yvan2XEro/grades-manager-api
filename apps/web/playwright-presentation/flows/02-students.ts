/**
 * Flow 02 — Full student management
 *
 * User questions this flow answers:
 *  - "How do I quickly find one student among hundreds?"
 *  - "How do I view a student's full record (courses, grades, history)?"
 *  - "How do I create a new student and enroll them in the right class?"
 *  - "How do I check a student's course enrollments?"
 *  - "How do I handle a student who changes class mid-year?"
 */
import { test } from "@playwright/test";
import { capture, loginAs, pause, SEED_DATA } from "../fixtures/auth";

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 1: Find a student and view their full record
// Question: "I am looking for Ndong Alain — how do I see his full record?"
// ─────────────────────────────────────────────────────────────────────────────
test("03 - Recherche d'un étudiant et consultation de son dossier académique", async ({
	page,
}) => {
	await loginAs(page, "admin");

	// ── STEP 1: Land on the list — overview ───────────────────────────────────
	await page.goto("/admin/students");
	await page.waitForLoadState("networkidle");
	await pause(1200);
	await capture(page, "02a-students-liste-complete");

	// ── STEP 2: Scroll through the whole table — how many students? ──────────
	await page.evaluate(() => window.scrollTo({ top: 300, behavior: "smooth" }));
	await pause(700);
	await capture(page, "02b-students-liste-scrollee");
	await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
	await pause(500);

	// ── STEP 3: Search by name "Ndong" ────────────────────────────────────────
	// The admin types the student's name in the search bar
	const searchInput = page
		.locator(
			'input[type="search"], input[placeholder*="Search"], input[placeholder*="herche"], input[placeholder*="tudiant"]',
		)
		.first();
	if (await searchInput.isVisible()) {
		await searchInput.click();
		await pause(300);
		// Types letter by letter to show autocompletion
		await searchInput.type("Nd", { delay: 150 });
		await pause(600);
		await capture(page, "02c-search-autocompletion-nd");

		await searchInput.type("ong", { delay: 150 });
		await pause(1000);
		await capture(page, "02d-search-ndong-resultat");

		// Hover over the matching result
		const ndongRow = page
			.locator('tr:has-text("Ndong"), [role="row"]:has-text("Ndong")')
			.first();
		if (await ndongRow.isVisible()) {
			await ndongRow.hover();
			await pause(500);
			await capture(page, "02e-search-ndong-hover");
		}

		// Clear and search for "Eyebe" (another student)
		await searchInput.click({ clickCount: 3 });
		await searchInput.fill("");
		await pause(300);
		await searchInput.type("Eyebe", { delay: 150 });
		await pause(1000);
		await capture(page, "02f-search-eyebe-resultat");
		await searchInput.fill("");
		await pause(500);
	}

	// ── STEP 4: Filter by class INF25-BTS1A ───────────────────────────────────
	// "I only want to see the students of nursing cohort A"
	const classFilter = page.locator('[data-testid="class-select"]');
	if (await classFilter.isVisible()) {
		await classFilter.click();
		await pause(700);
		await capture(page, "02g-filtre-classe-ouvert");

		const infOption = page
			.locator(`[role="option"]:has-text("${SEED_DATA.classes.infirmierA}")`)
			.first();
		if (await infOption.isVisible()) {
			await infOption.click();
		} else {
			await page.locator('[role="option"]').first().click();
		}
		await page.waitForLoadState("networkidle");
		await pause(1000);
		await capture(page, "02h-filtre-inf25-resultats");

		// Count the filtered students
		const filteredRows = page.locator("table tbody tr");
		const count = await filteredRows.count();
		// Hover over each filtered student
		for (let i = 0; i < Math.min(count, 4); i++) {
			await filteredRows.nth(i).hover();
			await pause(300);
		}
		await capture(page, "02i-filtre-inf25-survol-etudiants");
	}

	// ── STEP 5: Open Ndong Alain's full record ────────────────────────────────
	// "Show me everything we know about this student"
	// Reset the filter and search for Ndong
	const searchInput2 = page
		.locator(
			'input[type="search"], input[placeholder*="Search"], input[placeholder*="herche"]',
		)
		.first();
	if (await searchInput2.isVisible()) {
		await searchInput2.fill("Ndong");
		await pause(1000);
	}

	const ndongRow = page
		.locator('tr:has-text("Ndong"), [role="row"]:has-text("Ndong")')
		.first();
	const targetRow =
		(await ndongRow.count()) > 0
			? ndongRow
			: page.locator("table tbody tr").first();

	if (await targetRow.isVisible()) {
		await targetRow.click();
		await page.waitForLoadState("networkidle");
		await pause(1400);
		await capture(page, "02j-dossier-ndong-identite");

		// ── STEP 6: Personal info at the top of the record ───────────────────
		await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
		await pause(600);
		await capture(page, "02k-ndong-infos-personnelles");

		// ── STEP 7: Course enrollments section ────────────────────────────────
		// "Which courses is he enrolled in?"
		await page.evaluate(() =>
			window.scrollTo({ top: 400, behavior: "smooth" }),
		);
		await pause(900);
		await capture(page, "02l-ndong-inscriptions-cours");

		// ── STEP 8: Grades and results section ───────────────────────────────
		// "What are his grades in each subject?"
		await page.evaluate(() =>
			window.scrollTo({ top: 800, behavior: "smooth" }),
		);
		await pause(900);
		await capture(page, "02m-ndong-notes-resultats");

		// ── STEP 9: Additional tabs ──────────────────────────────────────────
		// Explore each profile tab: Enrollments, Grades, History...
		const tabs = page.locator('[role="tab"]');
		const tabCount = await tabs.count();
		for (let i = 0; i < Math.min(tabCount, 4); i++) {
			await tabs.nth(i).click();
			await pause(900);
			await capture(
				page,
				`02n-ndong-onglet-${i}-${await tabs
					.nth(i)
					.textContent()
					.then(
						(t) =>
							t?.trim().toLowerCase().replace(/\s+/g, "-").substring(0, 20) ??
							i,
					)}`,
			);
			// Scroll to see the tab's content
			await page.evaluate(() =>
				window.scrollTo({ top: 300, behavior: "smooth" }),
			);
			await pause(600);
			await capture(page, `02o-ndong-onglet-${i}-contenu`);
			await page.evaluate(() =>
				window.scrollTo({ top: 0, behavior: "smooth" }),
			);
			await pause(400);
		}
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 2: Create a new student and enroll them
// Question: "How do I add a new student who has just registered?"
// ─────────────────────────────────────────────────────────────────────────────
test("04 - Création d'un étudiant et inscription dans une classe", async ({
	page,
}) => {
	await loginAs(page, "admin");
	await page.goto("/admin/students");
	await page.waitForLoadState("networkidle");
	await pause(800);

	// ── STEP 1: Open the creation form ────────────────────────────────────────
	const addButton = page
		.locator(
			'button:has-text("Ajouter"), button:has-text("Add"), button:has-text("Nouvel étudiant"), button:has-text("New student")',
		)
		.first();
	if (!(await addButton.isVisible())) {
		await capture(page, "02p-bouton-ajouter-introuvable");
		return;
	}

	await addButton.hover();
	await pause(500);
	await capture(page, "02p-bouton-ajouter-hover");
	await addButton.click();
	await pause(900);
	await capture(page, "02q-formulaire-creation-vide");

	// ── STEP 2: Fill in the first name ────────────────────────────────────────
	const firstInput = page
		.locator(
			'input[name*="first"], input[id*="first"], input[placeholder*="rénom"], input[placeholder*="irst name"]',
		)
		.first();
	if (await firstInput.isVisible()) {
		await firstInput.click();
		await firstInput.type("Brice", { delay: 100 });
		await pause(400);
		await capture(page, "02r-prenom-saisi");
	}

	// ── STEP 3: Fill in the last name ─────────────────────────────────────────
	const lastInput = page
		.locator(
			'input[name*="last"], input[id*="last"], input[placeholder*="om de famille"], input[placeholder*="ast name"]',
		)
		.first();
	if (await lastInput.isVisible()) {
		await lastInput.click();
		await lastInput.type("Onana", { delay: 100 });
		await pause(400);
	}

	// ── STEP 4: Email ─────────────────────────────────────────────────────────
	const emailInput = page.locator('input[type="email"]').first();
	if (await emailInput.isVisible()) {
		await emailInput.click();
		await emailInput.type("brice.onana@inses.cm", { delay: 80 });
		await pause(400);
	}

	await capture(page, "02s-formulaire-identite-rempli");

	// ── STEP 5: Select the gender ─────────────────────────────────────────────
	const genderSelect = page
		.locator('[data-testid="gender-select"], [name*="gender"], [id*="gender"]')
		.first();
	if (await genderSelect.isVisible()) {
		await genderSelect.click();
		await pause(600);
		await capture(page, "02t-genre-dropdown-ouvert");
		await page.locator('[role="option"]').first().click();
		await pause(400);
	}

	// ── STEP 6: Select class INF25-BTS1A ──────────────────────────────────────
	// "Which class should this new student be enrolled in?"
	const classSelect = page
		.locator('[data-testid="class-select"], [name*="class"], [id*="class"]')
		.first();
	if (await classSelect.isVisible()) {
		await classSelect.click();
		await pause(700);
		await capture(page, "02u-classe-dropdown-ouverte");

		const infOption = page
			.locator(`[role="option"]:has-text("${SEED_DATA.classes.infirmierA}")`)
			.first();
		if (await infOption.isVisible()) {
			await infOption.click();
		} else {
			await page.locator('[role="option"]').first().click();
		}
		await pause(500);
	}

	// ── STEP 7: Completed form before submission ──────────────────────────────
	await capture(page, "02v-formulaire-complet-pret");

	// ── STEP 8: Hover over the submit button ──────────────────────────────────
	const submitBtn = page
		.locator(
			'button[type="submit"], button:has-text("Enregistrer"), button:has-text("Save"), button:has-text("Créer"), button:has-text("Create")',
		)
		.first();
	if (await submitBtn.isVisible()) {
		await submitBtn.scrollIntoViewIfNeeded();
		await submitBtn.hover();
		await pause(700);
		await capture(page, "02w-bouton-soumettre-hover");
	}

	// ── STEP 9: Close (nothing is actually created, to keep the data clean) ──
	await page.keyboard.press("Escape");
	await pause(600);
	await capture(page, "02x-formulaire-ferme-retour-liste");
});

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 3: Check and manage a student's course enrollments
// Question: "How do I make sure a student is enrolled in all their courses?"
// ─────────────────────────────────────────────────────────────────────────────
test("05 - Gestion des inscriptions aux cours d'un étudiant", async ({
	page,
}) => {
	await loginAs(page, "admin");

	// ── STEP 1: Go straight to Ndong Alain's record ───────────────────────────
	await page.goto("/admin/students");
	await page.waitForLoadState("networkidle");
	await pause(800);

	const searchInput = page
		.locator(
			'input[type="search"], input[placeholder*="Search"], input[placeholder*="herche"]',
		)
		.first();
	if (await searchInput.isVisible()) {
		await searchInput.fill("Ndong");
		await pause(1000);
	}

	const ndongRow = page
		.locator('tr:has-text("Ndong"), [role="row"]:has-text("Ndong")')
		.first();
	if (!(await ndongRow.isVisible())) return;

	await ndongRow.click();
	await page.waitForLoadState("networkidle");
	await pause(1200);
	await capture(page, "02y-ndong-dossier-inscriptions");

	// ── STEP 2: Course enrollments tab ────────────────────────────────────────
	// Look for the "Inscriptions" or "Courses" tab
	const enrollTab = page
		.locator(
			'[role="tab"]:has-text("Inscription"), [role="tab"]:has-text("Course"), [role="tab"]:has-text("Cours")',
		)
		.first();
	if (await enrollTab.isVisible()) {
		await enrollTab.click();
		await pause(1000);
		await capture(page, "02z-ndong-onglet-inscriptions-cours");

		// See all the courses the student is enrolled in
		await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
		await pause(600);
		const courseRows = page.locator("table tbody tr");
		const count = await courseRows.count();
		for (let i = 0; i < Math.min(count, 4); i++) {
			await courseRows.nth(i).hover();
			await pause(350);
		}
		await capture(page, "03a-ndong-cours-inscrits-liste");

		await page.evaluate(() =>
			window.scrollTo({ top: 400, behavior: "smooth" }),
		);
		await pause(700);
		await capture(page, "03b-ndong-cours-inscrits-suite");
	}

	// ── STEP 3: Comparison with another student — Eyebe Rachel ────────────────
	// "Is Eyebe enrolled in the same courses?"
	await page.goto("/admin/students");
	await page.waitForLoadState("networkidle");
	await pause(700);

	const searchInput2 = page
		.locator(
			'input[type="search"], input[placeholder*="Search"], input[placeholder*="herche"]',
		)
		.first();
	if (await searchInput2.isVisible()) {
		await searchInput2.fill("Eyebe");
		await pause(1000);
	}

	const eyebeRow = page
		.locator('tr:has-text("Eyebe"), [role="row"]:has-text("Eyebe")')
		.first();
	if (await eyebeRow.isVisible()) {
		await eyebeRow.click();
		await page.waitForLoadState("networkidle");
		await pause(1200);
		await capture(page, "03c-eyebe-dossier-compta");

		// See her courses — different program (Accounting)
		const coursesSection = page
			.locator(
				'[role="tab"]:has-text("Inscription"), [role="tab"]:has-text("Course"), [role="tab"]:has-text("Cours")',
			)
			.first();
		if (await coursesSection.isVisible()) {
			await coursesSection.click();
			await pause(900);
			await capture(page, "03d-eyebe-cours-comptabilite");
		}

		await page.evaluate(() =>
			window.scrollTo({ top: 400, behavior: "smooth" }),
		);
		await pause(700);
		await capture(page, "03e-eyebe-inscriptions-completes");
	}
});
