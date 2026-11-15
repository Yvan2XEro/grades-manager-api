/**
 * Flow 03 — Grade entry and validation: the full journey
 *
 * User questions this flow answers:
 *  - "How does the teacher enter grades step by step?"
 *  - "What happens if a grade is out of range (>20 or <0)?"
 *  - "How does the admin see grade entry progress?"
 *  - "How does a second teacher enter grades for their program?"
 *  - "Can the admin correct a grade on a teacher's behalf?"
 */
import { test } from "@playwright/test";
import {
	CREDENTIALS,
	capture,
	loginAs,
	pause,
	SEED_DATA,
} from "../fixtures/auth";

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 1: Dr. Mballa enters the grades for his Human Anatomy CA
// Question: "How does the teacher go about grading all their students?"
// ─────────────────────────────────────────────────────────────────────────────
test("06 - Saisie des notes CC Anatomie — Dr. Mballa (flux complet)", async ({
	page,
}) => {
	await loginAs(page, "teacher");

	// ── STEP 1: Teacher dashboard — reminder of the pending exam ──────────────
	// The teacher sees their "Contrôle Continu Anatomie" exam awaiting grade entry
	await pause(1200);
	await capture(page, "03a-teacher-dashboard-examen-en-attente");

	// ── STEP 2: Go to the grade entry page ────────────────────────────────────
	await page.goto("/teacher/grades");
	await page.waitForLoadState("networkidle");
	await pause(1200);
	await capture(page, "03b-grade-entry-page-landing");

	// ── STEP 3: Select the Human Anatomy course ───────────────────────────────
	// "Which course am I entering grades for?"
	const coursSelect = page.locator('[data-testid="class-course-select"]');
	if (await coursSelect.isVisible()) {
		await coursSelect.click();
		await pause(800);
		await capture(page, "03c-cours-dropdown-ouvert");

		const anatOption = page
			.locator(`[role="option"]:has-text("${SEED_DATA.courses.anatomie}")`)
			.first();
		if (await anatOption.isVisible()) {
			await anatOption.hover();
			await pause(400);
			await capture(page, "03d-cours-anatomie-option-hover");
			await anatOption.click();
		} else {
			await page.locator('[role="option"]').first().click();
		}
		await pause(800);
		await capture(page, "03e-cours-anatomie-selectionne");
	}

	// ── STEP 4: Select the CC Anatomie exam ───────────────────────────────────
	// "Which specific exam am I grading?"
	const examSelect = page.locator('[data-testid="exam-select"]');
	if (await examSelect.isVisible()) {
		await examSelect.click();
		await pause(800);
		await capture(page, "03f-exam-dropdown-ouvert");

		const ccOption = page
			.locator(`[role="option"]:has-text("${SEED_DATA.exams.anatomieCC}")`)
			.first();
		if (await ccOption.isVisible()) {
			await ccOption.hover();
			await pause(400);
			await capture(page, "03g-exam-cc-anatomie-hover");
			await ccOption.click();
		} else {
			await page.locator('[role="option"]').first().click();
		}
		await page.waitForLoadState("networkidle");
		await pause(1500);
		await capture(page, "03h-table-notes-chargee");
	}

	// ── STEP 5: Read the table — headers, columns, student info ───────────────
	// The teacher checks that all their students are in the table
	await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
	await pause(600);
	await capture(page, "03i-table-notes-vue-complete");

	// ── STEP 6: Enter grades student by student ───────────────────────────────
	// A realistic set of grades for a BTS Nursing Sciences class
	const gradeInputs = page.locator(
		'input[type="number"], input[inputmode="decimal"], input[placeholder*="/20"], input[placeholder*="note"]',
	);
	const inputCount = await gradeInputs.count();

	// Realistic grades: good, fair, excellent, lower bound, eligible for retake
	const grades = ["16.5", "11", "18", "7.5", "14", "12.5", "9", "15"];
	for (let i = 0; i < Math.min(inputCount, grades.length); i++) {
		const input = gradeInputs.nth(i);
		if (!(await input.isVisible())) break;

		await input.scrollIntoViewIfNeeded();
		await input.click();
		await pause(200);
		await input.fill(grades[i]);
		await pause(500);

		// Screenshot after each significant grade
		if (i === 0) await capture(page, "03j-premiere-note-saisie");
		if (i === 3) await capture(page, "03k-progression-saisie-mi-parcours");
	}

	await capture(page, "03l-toutes-notes-saisies");

	// ── STEP 7: Validation test — out-of-range grade (>20) ────────────────────
	// "What happens if I enter an impossible grade?"
	const firstInput = gradeInputs.first();
	if (await firstInput.isVisible()) {
		await firstInput.scrollIntoViewIfNeeded();
		await firstInput.click();
		await firstInput.fill("25");
		await pause(800);
		await capture(page, "03m-validation-note-hors-plage-25");
		// Fix the invalid grade
		await firstInput.fill("16.5");
		await pause(500);
	}

	// ── STEP 8: Summary at the bottom of the table ────────────────────────────
	// "What is the class average with these grades?"
	await page.evaluate(() => window.scrollTo({ top: 500, behavior: "smooth" }));
	await pause(900);
	await capture(page, "03n-bas-table-recapitulatif-moyenne");
	await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
	await pause(500);

	// ── STEP 9: Save the grades ───────────────────────────────────────────────
	const saveButton = page
		.locator(
			'button:has-text("Enregistrer"), button:has-text("Save"), button:has-text("Sauvegarder"), button:has-text("Submit")',
		)
		.first();
	if (await saveButton.isVisible()) {
		await saveButton.scrollIntoViewIfNeeded();
		await saveButton.hover();
		await pause(700);
		await capture(page, "03o-bouton-enregistrer-hover");
		await saveButton.click();
		await page.waitForLoadState("networkidle");
		await pause(1500);
		await capture(page, "03p-notes-enregistrees-confirmation");
	}

	// ── STEP 10: Post-save check ──────────────────────────────────────────────
	// Are the grades actually persisted?
	await page.reload();
	await page.waitForLoadState("networkidle");
	await pause(1200);
	await capture(page, "03q-notes-persistees-apres-reload");
});

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 2: Kombo Francis enters the Accounting grades
// Question: "Does each teacher work independently on their own courses?"
// ─────────────────────────────────────────────────────────────────────────────
test("07 - Saisie des notes CC Comptabilité — Kombo Francis", async ({
	page,
}) => {
	// Sign in as a second teacher on another course
	await page.goto("/auth/login");
	await page.waitForLoadState("networkidle");
	await page.locator("#email").fill(CREDENTIALS.teacher2.email);
	await page.locator("#password").fill(CREDENTIALS.teacher2.password);
	await page.locator('button[type="submit"]').click();
	await page.waitForURL("**/teacher**", { timeout: 20_000 });
	await page.waitForLoadState("networkidle");
	await pause(1200);
	await capture(page, "03r-teacher-kombo-dashboard");

	// ── His dashboard is different — he only sees his courses ─────────────────
	// "Kombo only sees his accounting courses, not Dr. Mballa's"
	await pause(600);
	await capture(page, "03s-kombo-cours-comptabilite-uniquement");

	// ── Grade entry access ────────────────────────────────────────────────────
	await page.goto("/teacher/grades");
	await page.waitForLoadState("networkidle");
	await pause(1000);

	// Select the Accounting course
	const coursSelect = page.locator('[data-testid="class-course-select"]');
	if (await coursSelect.isVisible()) {
		await coursSelect.click();
		await pause(700);
		await capture(page, "03t-kombo-cours-dropdown");

		const comptaOption = page
			.locator(`[role="option"]:has-text("${SEED_DATA.courses.compta}")`)
			.first();
		if (await comptaOption.isVisible()) {
			await comptaOption.click();
		} else {
			await page.locator('[role="option"]').first().click();
		}
		await pause(800);
	}

	// Select the CC Comptabilité exam
	const examSelect = page.locator('[data-testid="exam-select"]');
	if (await examSelect.isVisible()) {
		await examSelect.click();
		await pause(700);
		await capture(page, "03u-kombo-exam-dropdown");

		const ccOption = page
			.locator(`[role="option"]:has-text("${SEED_DATA.exams.comptaCC}")`)
			.first();
		if (await ccOption.isVisible()) {
			await ccOption.click();
		} else {
			await page.locator('[role="option"]').first().click();
		}
		await page.waitForLoadState("networkidle");
		await pause(1400);
		await capture(page, "03v-kombo-table-notes-chargee");
	}

	// ── Enter the accounting grades ───────────────────────────────────────────
	const gradeInputs = page.locator(
		'input[type="number"], input[inputmode="decimal"], input[placeholder*="/20"]',
	);
	const inputCount = await gradeInputs.count();
	const grades = ["13.5", "17", "8", "15.5", "11", "16"];
	for (let i = 0; i < Math.min(inputCount, grades.length); i++) {
		const input = gradeInputs.nth(i);
		if (!(await input.isVisible())) break;
		await input.scrollIntoViewIfNeeded();
		await input.click();
		await input.fill(grades[i]);
		await pause(450);
	}
	await capture(page, "03w-kombo-notes-compta-saisies");

	// Save
	const saveBtn = page
		.locator(
			'button:has-text("Enregistrer"), button:has-text("Save"), button:has-text("Sauvegarder")',
		)
		.first();
	if (await saveBtn.isVisible()) {
		await saveBtn.scrollIntoViewIfNeeded();
		await saveBtn.hover();
		await pause(600);
		await capture(page, "03x-kombo-save-hover");
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 3: The admin supervises and checks grade entry progress
// Question: "How does the admin know which courses have been graded and which are pending?"
// ─────────────────────────────────────────────────────────────────────────────
test("08 - Supervision admin : avancement et vérification de la saisie des notes", async ({
	page,
}) => {
	await loginAs(page, "admin");

	// ── STEP 1: Grade export view — grade entry dashboard ─────────────────────
	// "Which courses have been graded? Which are still empty?"
	await page.goto("/admin/grade-export");
	await page.waitForLoadState("networkidle");
	await pause(1400);
	await capture(page, "03y-admin-grade-export-vue-ensemble");

	// ── STEP 2: Filter by class INF25-BTS1A ───────────────────────────────────
	const classFilter = page.locator('[data-testid="class-select"]').first();
	if (await classFilter.isVisible()) {
		await classFilter.click();
		await pause(700);
		const infOption = page
			.locator(`[role="option"]:has-text("${SEED_DATA.classes.infirmierA}")`)
			.first();
		if (await infOption.isVisible()) {
			await infOption.click();
			await page.waitForLoadState("networkidle");
			await pause(1100);
			await capture(page, "03z-admin-inf25-notes-par-cours");
		} else {
			await page.keyboard.press("Escape");
		}
	}

	// ── STEP 3: See the grade table per student and per course ────────────────
	await page.evaluate(() => window.scrollTo({ top: 300, behavior: "smooth" }));
	await pause(800);
	await capture(page, "04a-admin-table-notes-complete");

	// ── STEP 4: Excel/PDF export button ───────────────────────────────────────
	// "How do I export this table to PDF to print it?"
	const exportBtn = page
		.locator(
			'button:has-text("Exporter"), button:has-text("Export"), button:has-text("Télécharger"), button:has-text("Download")',
		)
		.first();
	if (await exportBtn.isVisible()) {
		await exportBtn.scrollIntoViewIfNeeded();
		await exportBtn.hover();
		await pause(800);
		await capture(page, "04b-admin-export-bouton-hover");
	}

	await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
	await pause(500);

	// ── STEP 5: Filter by class COMPT25-BTS1A ─────────────────────────────────
	if (await classFilter.isVisible()) {
		await classFilter.click();
		await pause(600);
		const comptaOption = page
			.locator(`[role="option"]:has-text("${SEED_DATA.classes.comptaA}")`)
			.first();
		if (await comptaOption.isVisible()) {
			await comptaOption.click();
			await page.waitForLoadState("networkidle");
			await pause(1000);
			await capture(page, "04c-admin-compta-notes-par-cours");
		} else {
			await page.keyboard.press("Escape");
		}
	}

	// ── STEP 6: Grade entry delegation (grade-access) ─────────────────────────
	// "How can the admin allow someone else to enter grades?"
	await page.goto("/admin/grade-access");
	await page.waitForLoadState("networkidle");
	await pause(1400);
	await capture(page, "04d-admin-grade-access-delegation");

	await page.evaluate(() => window.scrollTo({ top: 400, behavior: "smooth" }));
	await pause(800);
	await capture(page, "04e-admin-grade-access-detail");

	// Hover over the delegation items
	const delegateRows = page.locator("table tbody tr, [class*='card']");
	const count = await delegateRows.count();
	for (let i = 0; i < Math.min(count, 3); i++) {
		await delegateRows.nth(i).hover();
		await pause(400);
	}
	await capture(page, "04f-admin-delegation-hover");
});
