/**
 * Flow 03 — Saisie et validation des notes : parcours complet
 *
 * Questions utilisateurs auxquelles ce flow répond :
 *  - "Comment l'enseignant saisit-il ses notes étape par étape ?"
 *  - "Que se passe-t-il si une note est hors plage (>20 ou <0) ?"
 *  - "Comment l'admin voit-il l'avancement de la saisie des notes ?"
 *  - "Comment un deuxième enseignant saisit-il ses notes pour sa filière ?"
 *  - "L'admin peut-il corriger une note à la place d'un enseignant ?"
 */
import { test } from "@playwright/test";
import { CREDENTIALS, SEED_DATA, capture, loginAs, pause } from "../fixtures/auth";

// ─────────────────────────────────────────────────────────────────────────────
// SCÉNARIO 1 : Dr. Mballa saisit les notes de son CC d'Anatomie Humaine
// Question : "Comment l'enseignant procède-t-il pour noter tous ses étudiants ?"
// ─────────────────────────────────────────────────────────────────────────────
test("06 - Saisie des notes CC Anatomie — Dr. Mballa (flux complet)", async ({ page }) => {
	await loginAs(page, "teacher");

	// ── ÉTAPE 1 : Dashboard enseignant — rappel de l'examen en attente ────────
	// L'enseignant voit son examen "Contrôle Continu Anatomie" en attente de saisie
	await pause(1200);
	await capture(page, "03a-teacher-dashboard-examen-en-attente");

	// ── ÉTAPE 2 : Accès à la page de saisie des notes ────────────────────────
	await page.goto("/teacher/grades");
	await page.waitForLoadState("networkidle");
	await pause(1200);
	await capture(page, "03b-grade-entry-page-landing");

	// ── ÉTAPE 3 : Sélection du cours Anatomie Humaine ─────────────────────────
	// "Pour quel cours est-ce que je saisis des notes ?"
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

	// ── ÉTAPE 4 : Sélection de l'examen CC Anatomie ──────────────────────────
	// "Quel examen spécifique est-ce que je note ?"
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

	// ── ÉTAPE 5 : Lecture de la table — en-têtes, colonnes, info étudiants ────
	// L'enseignant vérifie que tous ses étudiants sont présents dans la table
	await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
	await pause(600);
	await capture(page, "03i-table-notes-vue-complete");

	// ── ÉTAPE 6 : Saisie des notes étudiant par étudiant ──────────────────────
	// Série de notes réalistes pour une classe de BTS Sciences Infirmières
	const gradeInputs = page.locator(
		'input[type="number"], input[inputmode="decimal"], input[placeholder*="/20"], input[placeholder*="note"]',
	);
	const inputCount = await gradeInputs.count();

	// Notes réalistes : bonne, passable, excellente, limite inférieure, rattrapable
	const grades = ["16.5", "11", "18", "7.5", "14", "12.5", "9", "15"];
	for (let i = 0; i < Math.min(inputCount, grades.length); i++) {
		const input = gradeInputs.nth(i);
		if (!(await input.isVisible())) break;

		await input.scrollIntoViewIfNeeded();
		await input.click();
		await pause(200);
		await input.fill(grades[i]);
		await pause(500);

		// Capture après chaque note importante
		if (i === 0) await capture(page, "03j-premiere-note-saisie");
		if (i === 3) await capture(page, "03k-progression-saisie-mi-parcours");
	}

	await capture(page, "03l-toutes-notes-saisies");

	// ── ÉTAPE 7 : Test validation — note hors plage (>20) ─────────────────────
	// "Que se passe-t-il si je saisis une note impossible ?"
	const firstInput = gradeInputs.first();
	if (await firstInput.isVisible()) {
		await firstInput.scrollIntoViewIfNeeded();
		await firstInput.click();
		await firstInput.fill("25");
		await pause(800);
		await capture(page, "03m-validation-note-hors-plage-25");
		// Corriger la note invalide
		await firstInput.fill("16.5");
		await pause(500);
	}

	// ── ÉTAPE 8 : Récapitulatif en bas de table ───────────────────────────────
	// "Quelle est la moyenne de la classe avec ces notes ?"
	await page.evaluate(() => window.scrollTo({ top: 500, behavior: "smooth" }));
	await pause(900);
	await capture(page, "03n-bas-table-recapitulatif-moyenne");
	await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
	await pause(500);

	// ── ÉTAPE 9 : Enregistrer les notes ──────────────────────────────────────
	const saveButton = page
		.locator('button:has-text("Enregistrer"), button:has-text("Save"), button:has-text("Sauvegarder"), button:has-text("Submit")')
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

	// ── ÉTAPE 10 : Vérification post-sauvegarde ───────────────────────────────
	// Les notes sont-elles bien persistées ?
	await page.reload();
	await page.waitForLoadState("networkidle");
	await pause(1200);
	await capture(page, "03q-notes-persistees-apres-reload");
});

// ─────────────────────────────────────────────────────────────────────────────
// SCÉNARIO 2 : Kombo Francis saisit les notes de Comptabilité
// Question : "Chaque enseignant travaille indépendamment sur ses propres cours ?"
// ─────────────────────────────────────────────────────────────────────────────
test("07 - Saisie des notes CC Comptabilité — Kombo Francis", async ({ page }) => {
	// Connexion d'un deuxième enseignant sur un autre cours
	await page.goto("/auth/login");
	await page.waitForLoadState("networkidle");
	await page.locator("#email").fill(CREDENTIALS.teacher2.email);
	await page.locator("#password").fill(CREDENTIALS.teacher2.password);
	await page.locator('button[type="submit"]').click();
	await page.waitForURL("**/teacher**", { timeout: 20_000 });
	await page.waitForLoadState("networkidle");
	await pause(1200);
	await capture(page, "03r-teacher-kombo-dashboard");

	// ── Son dashboard est différent — il voit uniquement ses cours ───────────
	// "Kombo ne voit que ses cours de comptabilité, pas ceux de Dr. Mballa"
	await pause(600);
	await capture(page, "03s-kombo-cours-comptabilite-uniquement");

	// ── Accès saisie des notes ────────────────────────────────────────────────
	await page.goto("/teacher/grades");
	await page.waitForLoadState("networkidle");
	await pause(1000);

	// Sélection du cours Comptabilité
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

	// Sélection de l'examen CC Comptabilité
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

	// ── Saisie des notes de comptabilité ─────────────────────────────────────
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

	// Enregistrer
	const saveBtn = page
		.locator('button:has-text("Enregistrer"), button:has-text("Save"), button:has-text("Sauvegarder")')
		.first();
	if (await saveBtn.isVisible()) {
		await saveBtn.scrollIntoViewIfNeeded();
		await saveBtn.hover();
		await pause(600);
		await capture(page, "03x-kombo-save-hover");
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// SCÉNARIO 3 : L'admin supervise et vérifie l'avancement de la saisie
// Question : "Comment l'admin sait-il quels cours ont été notés et lesquels sont en attente ?"
// ─────────────────────────────────────────────────────────────────────────────
test("08 - Supervision admin : avancement et vérification de la saisie des notes", async ({ page }) => {
	await loginAs(page, "admin");

	// ── ÉTAPE 1 : Vue export des notes — tableau de bord de la saisie ─────────
	// "Quels cours ont été notés ? Lesquels sont encore vides ?"
	await page.goto("/admin/grade-export");
	await page.waitForLoadState("networkidle");
	await pause(1400);
	await capture(page, "03y-admin-grade-export-vue-ensemble");

	// ── ÉTAPE 2 : Filtrer par classe INF25-BTS1A ──────────────────────────────
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

	// ── ÉTAPE 3 : Voir la table des notes par étudiant et par cours ───────────
	await page.evaluate(() => window.scrollTo({ top: 300, behavior: "smooth" }));
	await pause(800);
	await capture(page, "04a-admin-table-notes-complete");

	// ── ÉTAPE 4 : Bouton export Excel/PDF ────────────────────────────────────
	// "Comment exporter ce tableau en PDF pour l'imprimer ?"
	const exportBtn = page
		.locator('button:has-text("Exporter"), button:has-text("Export"), button:has-text("Télécharger"), button:has-text("Download")')
		.first();
	if (await exportBtn.isVisible()) {
		await exportBtn.scrollIntoViewIfNeeded();
		await exportBtn.hover();
		await pause(800);
		await capture(page, "04b-admin-export-bouton-hover");
	}

	await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
	await pause(500);

	// ── ÉTAPE 5 : Filtrer par classe COMPT25-BTS1A ────────────────────────────
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

	// ── ÉTAPE 6 : Délégation de saisie (grade-access) ─────────────────────────
	// "Comment l'admin peut-il autoriser quelqu'un d'autre à saisir des notes ?"
	await page.goto("/admin/grade-access");
	await page.waitForLoadState("networkidle");
	await pause(1400);
	await capture(page, "04d-admin-grade-access-delegation");

	await page.evaluate(() => window.scrollTo({ top: 400, behavior: "smooth" }));
	await pause(800);
	await capture(page, "04e-admin-grade-access-detail");

	// Hover sur les éléments de délégation
	const delegateRows = page.locator("table tbody tr, [class*='card']");
	const count = await delegateRows.count();
	for (let i = 0; i < Math.min(count, 3); i++) {
		await delegateRows.nth(i).hover();
		await pause(400);
	}
	await capture(page, "04f-admin-delegation-hover");
});
