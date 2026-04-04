/**
 * Flow 01 — Prise en main du système & rôles utilisateurs
 *
 * Questions utilisateurs auxquelles ce flow répond :
 *  - "Qu'est-ce que je peux faire en tant qu'admin sur ce système ?"
 *  - "Comment l'interface s'adapte-t-elle selon mon rôle ?"
 *  - "Où trouve-t-on les informations clés de l'institution ?"
 *  - "Comment un enseignant accède-t-il à ses cours et ses étudiants ?"
 *  - "En tant qu'étudiant, comment je consulte mes notes ?"
 */
import { test } from "@playwright/test";
import { CREDENTIALS, SEED_DATA, capture, loginAs, pause } from "../fixtures/auth";

// ─────────────────────────────────────────────────────────────────────────────
// SCÉNARIO 1 : Connexion et découverte du tableau de bord administrateur
// Question : "Qu'est-ce que l'admin voit dès qu'il se connecte ?"
// ─────────────────────────────────────────────────────────────────────────────
test("01 - Tableau de bord admin : vue d'ensemble et navigation complète", async ({ page }) => {
	// ── ÉTAPE 1 : Page de connexion vierge ────────────────────────────────────
	// L'admin ouvre l'application pour la première fois de la journée
	await page.goto("/auth/login");
	await page.waitForLoadState("networkidle");
	await pause(800);
	await capture(page, "01a-login-page-vierge");

	// ── ÉTAPE 2 : Erreur de saisie — montre la validation du formulaire ───────
	// L'admin tape par erreur un mauvais mot de passe
	await page.locator("#email").fill(CREDENTIALS.admin.email);
	await page.locator("#password").fill("mauvais-motdepasse");
	await page.locator('button[type="submit"]').click();
	await pause(1800);
	await capture(page, "01b-login-erreur-validation");

	// ── ÉTAPE 3 : Connexion réussie ───────────────────────────────────────────
	await page.locator("#password").clear();
	await page.locator("#password").fill(CREDENTIALS.admin.password);
	await pause(400);
	await capture(page, "01c-login-formulaire-correct");
	await page.locator('button[type="submit"]').click();
	await page.waitForURL("**/admin**", { timeout: 20_000 });
	await page.waitForLoadState("networkidle");
	await pause(1500);

	// ── ÉTAPE 4 : Dashboard — première impression ─────────────────────────────
	// L'admin découvre les KPIs : étudiants actifs, examens en cours, taux de réussite…
	await capture(page, "01d-dashboard-admin-complet");

	// ── ÉTAPE 5 : Survol des cartes statistiques pour voir les chiffres ───────
	const statCards = page.locator('[class*="card"]:visible, [class*="Card"]:visible');
	const cardCount = await statCards.count();
	for (let i = 0; i < Math.min(cardCount, 6); i++) {
		await statCards.nth(i).scrollIntoViewIfNeeded();
		await statCards.nth(i).hover();
		await pause(500);
	}
	await capture(page, "01e-dashboard-stats-kpis");

	// ── ÉTAPE 6 : Graphiques et tendances (bas de page) ───────────────────────
	// L'admin fait défiler vers les graphiques de progression des notes
	await page.evaluate(() => window.scrollTo({ top: 500, behavior: "smooth" }));
	await pause(1000);
	await capture(page, "01f-dashboard-graphiques-tendances");
	await page.evaluate(() => window.scrollTo({ top: 1000, behavior: "smooth" }));
	await pause(900);
	await capture(page, "01g-dashboard-bas-de-page");
	await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
	await pause(600);

	// ── ÉTAPE 7 : Années académiques — vérifier l'année active ───────────────
	// "Quelle est l'année académique active ?"
	await page.goto("/admin/academic-years");
	await page.waitForLoadState("networkidle");
	await pause(1200);
	await capture(page, "01h-annees-academiques-liste");

	// Trouver et survoler l'année active 2025-2026
	const activeYearRow = page
		.locator(`tr:has-text("${SEED_DATA.academicYear.label}"), [class*="card"]:has-text("${SEED_DATA.academicYear.label}")`)
		.first();
	if (await activeYearRow.isVisible()) {
		await activeYearRow.hover();
		await pause(700);
		await capture(page, "01i-annee-active-2025-2026-detail");
		// Ouvrir son détail
		await activeYearRow.click();
		await page.waitForLoadState("networkidle");
		await pause(1000);
		await capture(page, "01j-annee-active-detail-config");
		await page.goBack();
		await pause(600);
	}

	// ── ÉTAPE 8 : Vue des facultés et programmes ──────────────────────────────
	// "Quels programmes propose l'institution ?"
	await page.goto("/admin/faculties");
	await page.waitForLoadState("networkidle");
	await pause(1200);
	await capture(page, "01k-facultes-liste-complete");

	// Survoler la première faculté pour voir ses programmes
	const facultyRow = page.locator("table tbody tr, [class*='card']").first();
	if (await facultyRow.isVisible()) {
		await facultyRow.hover();
		await pause(500);
		await facultyRow.click();
		await page.waitForLoadState("networkidle");
		await pause(1000);
		await capture(page, "01l-faculte-detail-programmes");

		await page.evaluate(() => window.scrollTo({ top: 400, behavior: "smooth" }));
		await pause(700);
		await capture(page, "01m-faculte-cycles-etudes");
		await page.goBack();
		await pause(600);
	}

	// ── ÉTAPE 9 : Fiches des classes actives ────────────────────────────────
	// "Combien de classes sont actives cette année ?"
	await page.goto("/admin/classes");
	await page.waitForLoadState("networkidle");
	await pause(1200);
	await capture(page, "01n-classes-actives-liste");

	const classRows = page.locator("table tbody tr");
	const classCount = await classRows.count();
	for (let i = 0; i < Math.min(classCount, 3); i++) {
		await classRows.nth(i).hover();
		await pause(400);
	}
	await capture(page, "01o-classes-hover-details");

	// Ouvrir une classe pour voir sa composition
	const firstClassRow = classRows.first();
	if (await firstClassRow.isVisible()) {
		await firstClassRow.click();
		await page.waitForLoadState("networkidle");
		await pause(1200);
		await capture(page, "01p-classe-detail-composition");

		await page.evaluate(() => window.scrollTo({ top: 400, behavior: "smooth" }));
		await pause(700);
		await capture(page, "01q-classe-detail-cours-assigns");
		await page.goBack();
		await pause(600);
	}

	// ── ÉTAPE 10 : Retour au dashboard, menu profil ───────────────────────────
	await page.goto("/admin");
	await page.waitForLoadState("networkidle");
	await pause(800);
	await capture(page, "01r-retour-dashboard-fin");
});

// ─────────────────────────────────────────────────────────────────────────────
// SCÉNARIO 2 : Perspective enseignant — accès ciblé sur ses responsabilités
// Question : "Comment un enseignant navigue-t-il ? Que peut-il voir ou faire ?"
// ─────────────────────────────────────────────────────────────────────────────
test("02 - Tableau de bord enseignant : Dr. Mballa découvre ses responsabilités", async ({ page }) => {
	// L'enseignant se connecte et voit son espace personnel
	await loginAs(page, "teacher");
	await pause(1400);
	await capture(page, "01s-teacher-dashboard-mballa");

	// ── Stats enseignant : mes cours, mes étudiants, mes examens en attente ───
	await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
	const teacherStats = page.locator('[class*="card"]:visible').first();
	if (await teacherStats.isVisible()) {
		await teacherStats.hover();
		await pause(500);
	}
	await capture(page, "01t-teacher-stats-apercu");

	// ── Ses cours assignés — Anatomie Humaine ────────────────────────────────
	// L'enseignant survole la card de son cours pour voir le résumé
	const anatCard = page.locator('a:has-text("Anatomie"), [class*="card"]:has-text("Anatomie")').first();
	if (await anatCard.isVisible()) {
		await anatCard.hover();
		await pause(700);
		await capture(page, "01u-teacher-cours-anatomie-hover");
	}

	// ── Liste complète de ses cours ──────────────────────────────────────────
	await page.goto("/teacher/courses");
	await page.waitForLoadState("networkidle");
	await pause(1000);
	await capture(page, "01v-teacher-liste-cours");

	// Ouvrir le détail du premier cours
	const firstCourse = page.locator("table tbody tr, [class*='card']").first();
	if (await firstCourse.isVisible()) {
		await firstCourse.hover();
		await pause(500);
		await firstCourse.click();
		await page.waitForLoadState("networkidle");
		await pause(1200);
		await capture(page, "01w-teacher-cours-detail");

		// Voir les étudiants inscrits dans ce cours
		await page.evaluate(() => window.scrollTo({ top: 400, behavior: "smooth" }));
		await pause(800);
		await capture(page, "01x-teacher-cours-etudiants-inscrits");

		// Voir les examens associés à ce cours
		await page.evaluate(() => window.scrollTo({ top: 800, behavior: "smooth" }));
		await pause(800);
		await capture(page, "01y-teacher-cours-examens-associes");

		await page.goBack();
		await pause(600);
	}

	// ── Vue saisie des notes (accès rapide depuis le dashboard) ──────────────
	// L'enseignant accède directement à la page de saisie
	await page.goto("/teacher/grades");
	await page.waitForLoadState("networkidle");
	await pause(1200);
	await capture(page, "01z-teacher-saisie-notes-landing");

	// ── Bas du dashboard — calendrier et notifications ───────────────────────
	await page.goto("/teacher");
	await page.waitForLoadState("networkidle");
	await page.evaluate(() => window.scrollTo({ top: 600, behavior: "smooth" }));
	await pause(1000);
	await capture(page, "02a-teacher-dashboard-bas-calendrier");
});
