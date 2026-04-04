/**
 * Flow 06 — Exports, Rapports & Administration système
 *
 * Questions utilisateurs auxquelles ce flow répond :
 *  - "Comment générer un relevé de notes complet pour imprimer ?"
 *  - "Comment configurer et personnaliser les templates d'export ?"
 *  - "Comment surveiller la santé du système et les tâches en cours ?"
 *  - "Comment configurer l'intégration avec le système de diplomation externe ?"
 *  - "Où voir les notifications envoyées aux étudiants et enseignants ?"
 *  - "Comment gérer les numéros d'inscription automatiques ?"
 */
import { test } from "@playwright/test";
import { SEED_DATA, capture, loginAs, pause } from "../fixtures/auth";

// ─────────────────────────────────────────────────────────────────────────────
// SCÉNARIO 1 : Générer et exporter le relevé de notes d'une promotion
// Question : "Comment produire le document officiel de notes pour la classe INF25 ?"
// ─────────────────────────────────────────────────────────────────────────────
test("14 - Export des notes : relevé officiel par classe", async ({ page }) => {
	await loginAs(page, "admin");

	// ── ÉTAPE 1 : Page d'export des notes ─────────────────────────────────────
	await page.goto("/admin/grade-export");
	await page.waitForLoadState("networkidle");
	await pause(1400);
	await capture(page, "06g-grade-export-landing");

	// ── ÉTAPE 2 : Filtrer par classe INF25-BTS1A ──────────────────────────────
	// "Je veux le relevé complet de la classe infirmiers A"
	const classFilter = page.locator('[data-testid="class-select"]').first();
	if (await classFilter.isVisible()) {
		await classFilter.click();
		await pause(700);
		const infOption = page
			.locator(`[role="option"]:has-text("${SEED_DATA.classes.infirmierA}")`)
			.first();
		if (await infOption.isVisible()) {
			await infOption.click();
		} else {
			await page.locator('[role="option"]').first().click();
		}
		await page.waitForLoadState("networkidle");
		await pause(1200);
		await capture(page, "06h-export-inf25-filtre");
	}

	// ── ÉTAPE 3 : Voir la table complète des notes par cours ─────────────────
	// Colonnes : Étudiant | Anatomie | Physiologie | Soins | Moyenne | Décision
	await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
	await pause(600);
	await capture(page, "06i-export-table-notes-entetes");

	await page.evaluate(() => window.scrollTo({ top: 300, behavior: "smooth" }));
	await pause(800);
	await capture(page, "06j-export-table-notes-corps");

	// Survoler les lignes d'étudiants
	const studentRows = page.locator("table tbody tr");
	const count = await studentRows.count();
	for (let i = 0; i < Math.min(count, 4); i++) {
		await studentRows.nth(i).hover();
		await pause(400);
	}
	await capture(page, "06k-export-lignes-etudiants-survol");

	// ── ÉTAPE 4 : Bouton d'export — les différents formats disponibles ────────
	// "Puis-je exporter en PDF, Excel, ou CSV ?"
	await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
	await pause(500);
	const exportBtn = page
		.locator('button:has-text("Exporter"), button:has-text("Export"), button:has-text("Télécharger"), button:has-text("Download")')
		.first();
	if (await exportBtn.isVisible()) {
		await exportBtn.scrollIntoViewIfNeeded();
		await exportBtn.hover();
		await pause(800);
		await capture(page, "06l-bouton-export-hover");

		// Si menu déroulant avec formats
		await exportBtn.click();
		await pause(700);
		const exportMenu = page.locator('[role="menu"], [data-testid*="export-menu"]').first();
		if (await exportMenu.isVisible()) {
			await capture(page, "06m-export-menu-formats");
			await page.keyboard.press("Escape");
			await pause(400);
		} else {
			await capture(page, "06m-export-lance");
		}
	}

	// ── ÉTAPE 5 : Changer de classe — COMPT25-BTS1A ───────────────────────────
	if (await classFilter.isVisible()) {
		await classFilter.click();
		await pause(600);
		const comptaOption = page
			.locator(`[role="option"]:has-text("${SEED_DATA.classes.comptaA}")`)
			.first();
		if (await comptaOption.isVisible()) {
			await comptaOption.click();
			await page.waitForLoadState("networkidle");
			await pause(1100);
			await capture(page, "06n-export-compta-filtre");

			await page.evaluate(() => window.scrollTo({ top: 300, behavior: "smooth" }));
			await pause(700);
			await capture(page, "06o-export-compta-table");
		} else {
			await page.keyboard.press("Escape");
		}
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// SCÉNARIO 2 : Configurer les templates d'export personnalisés
// Question : "Comment créer un template de relevé aux couleurs de l'institution ?"
// ─────────────────────────────────────────────────────────────────────────────
test("15 - Templates d'export : configuration et personnalisation", async ({ page }) => {
	await loginAs(page, "admin");

	// ── ÉTAPE 1 : Liste des templates d'export existants ─────────────────────
	await page.goto("/admin/export-templates");
	await page.waitForLoadState("networkidle");
	await pause(1200);
	await capture(page, "06p-export-templates-liste");

	// ── ÉTAPE 2 : Survoler les templates disponibles ─────────────────────────
	const templates = page.locator("table tbody tr, [class*='card']");
	const count = await templates.count();
	for (let i = 0; i < Math.min(count, 4); i++) {
		await templates.nth(i).hover();
		await pause(450);
	}
	if (count > 0) await capture(page, "06q-templates-survol");

	// ── ÉTAPE 3 : Ouvrir un template pour voir sa structure ──────────────────
	// "Comment est configuré le template de relevé de notes officiel ?"
	if (await templates.first().isVisible()) {
		await templates.first().click();
		await page.waitForLoadState("networkidle");
		await pause(1200);
		await capture(page, "06r-template-detail-structure");

		// Voir la configuration complète
		await page.evaluate(() => window.scrollTo({ top: 400, behavior: "smooth" }));
		await pause(800);
		await capture(page, "06s-template-detail-config");

		await page.evaluate(() => window.scrollTo({ top: 800, behavior: "smooth" }));
		await pause(700);
		await capture(page, "06t-template-detail-bas");

		// Onglets de configuration
		const tabs = page.locator('[role="tab"]');
		const tabCount = await tabs.count();
		for (let i = 1; i < Math.min(tabCount, 3); i++) {
			await tabs.nth(i).click();
			await pause(800);
			await capture(page, `06u-template-onglet-${i}`);
		}

		await page.goBack();
		await pause(600);
	}

	// ── ÉTAPE 4 : Délégation de saisie ───────────────────────────────────────
	// "Comment autoriser un grade-editor à saisir des notes sur un examen précis ?"
	await page.goto("/admin/grade-access");
	await page.waitForLoadState("networkidle");
	await pause(1300);
	await capture(page, "06v-grade-access-delegation-liste");

	await page.evaluate(() => window.scrollTo({ top: 400, behavior: "smooth" }));
	await pause(800);
	await capture(page, "06w-grade-access-delegation-details");

	// Hover sur les accords de délégation
	const delegateRows = page.locator("table tbody tr, [class*='card']");
	const delegateCount = await delegateRows.count();
	for (let i = 0; i < Math.min(delegateCount, 3); i++) {
		await delegateRows.nth(i).hover();
		await pause(400);
	}
	if (delegateCount > 0) await capture(page, "06x-delegation-survol-details");
});

// ─────────────────────────────────────────────────────────────────────────────
// SCÉNARIO 3 : Monitoring système, batch jobs et administration technique
// Question : "Comment surveiller la santé du système ? Où voir les erreurs ?"
// ─────────────────────────────────────────────────────────────────────────────
test("16 - Monitoring, batch jobs et administration système", async ({ page }) => {
	await loginAs(page, "admin");

	// ── ÉTAPE 1 : Dashboard de monitoring ────────────────────────────────────
	// "Est-ce que tout fonctionne correctement ? Y a-t-il des erreurs ?"
	await page.goto("/admin/monitoring");
	await page.waitForLoadState("networkidle");
	await pause(1500);
	await capture(page, "06y-monitoring-overview");

	// KPIs techniques : jobs en cours, notifications en attente, erreurs...
	await page.evaluate(() => window.scrollTo({ top: 400, behavior: "smooth" }));
	await pause(900);
	await capture(page, "06z-monitoring-kpis-techniques");

	await page.evaluate(() => window.scrollTo({ top: 800, behavior: "smooth" }));
	await pause(800);
	await capture(page, "07a-monitoring-bas-graphiques");
	await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
	await pause(500);

	// ── ÉTAPE 2 : Batch jobs — tâches lourdes en arrière-plan ────────────────
	// "Comment lancer un import massif d'étudiants ou une migration de données ?"
	await page.goto("/admin/batch-jobs");
	await page.waitForLoadState("networkidle");
	await pause(1200);
	await capture(page, "07b-batch-jobs-liste");

	// Survoler les jobs disponibles
	const jobs = page.locator("table tbody tr, [class*='card']");
	const jobCount = await jobs.count();
	if (jobCount > 0) {
		for (let i = 0; i < Math.min(jobCount, 3); i++) {
			await jobs.nth(i).hover();
			await pause(450);
		}
		await capture(page, "07c-batch-job-survol");

		// Ouvrir un job pour voir ses logs et son historique d'exécution
		await jobs.first().click();
		await page.waitForLoadState("networkidle");
		await pause(1200);
		await capture(page, "07d-batch-job-detail-status");

		await page.evaluate(() => window.scrollTo({ top: 400, behavior: "smooth" }));
		await pause(800);
		await capture(page, "07e-batch-job-logs-progression");

		await page.evaluate(() => window.scrollTo({ top: 800, behavior: "smooth" }));
		await pause(700);
		await capture(page, "07f-batch-job-historique-executions");

		await page.goBack();
		await pause(500);
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// SCÉNARIO 4 : Institution, intégration externe et clés API
// Question : "Comment configurer l'intégration avec le système de diplomation ?"
// ─────────────────────────────────────────────────────────────────────────────
test("17 - Configuration institution, API keys et notifications", async ({ page }) => {
	await loginAs(page, "admin");

	// ── ÉTAPE 1 : Fiche de l'institution INSES ───────────────────────────────
	// "Comment modifier les informations officielles de l'établissement ?"
	await page.goto("/admin/institution");
	await page.waitForLoadState("networkidle");
	await pause(1400);
	await capture(page, "07g-institution-inses-entete");

	await page.evaluate(() => window.scrollTo({ top: 400, behavior: "smooth" }));
	await pause(900);
	await capture(page, "07h-institution-coordonnees-contact");

	await page.evaluate(() => window.scrollTo({ top: 800, behavior: "smooth" }));
	await pause(800);
	await capture(page, "07i-institution-configuration-systeme");
	await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
	await pause(500);

	// ── ÉTAPE 2 : Numéros d'inscription automatiques ─────────────────────────
	// "Comment est généré le numéro INSES25-0001 ? Peut-on le personnaliser ?"
	await page.goto("/admin/registration-numbers");
	await page.waitForLoadState("networkidle");
	await pause(1200);
	await capture(page, "07j-numeros-inscription-config");

	await page.evaluate(() => window.scrollTo({ top: 400, behavior: "smooth" }));
	await pause(700);
	await capture(page, "07k-numeros-inscription-format");

	// ── ÉTAPE 3 : Clés API pour le système de diplomation externe ────────────
	// "Comment l'institution externe accède-t-elle aux données de diplomation ?"
	await page.goto("/admin/api-keys");
	await page.waitForLoadState("networkidle");
	await pause(1200);
	await capture(page, "07l-api-keys-gestion");

	// La clé brute n'est jamais visible — seulement le hash
	await page.evaluate(() => window.scrollTo({ top: 300, behavior: "smooth" }));
	await pause(700);
	await capture(page, "07m-api-keys-table-hashes");

	// Bouton "Créer une nouvelle clé"
	const createKeyBtn = page
		.locator('button:has-text("Créer"), button:has-text("Create"), button:has-text("Generate"), button:has-text("Ajouter")')
		.first();
	if (await createKeyBtn.isVisible()) {
		await createKeyBtn.scrollIntoViewIfNeeded();
		await createKeyBtn.hover();
		await pause(600);
		await capture(page, "07n-bouton-creer-api-key-hover");
		await createKeyBtn.click();
		await pause(900);
		await capture(page, "07o-formulaire-creation-api-key");
		await page.keyboard.press("Escape");
		await pause(400);
	}

	// ── ÉTAPE 4 : Notifications envoyées ─────────────────────────────────────
	// "Comment vérifier que les notifications email ont bien été envoyées ?"
	await page.goto("/admin/notifications");
	await page.waitForLoadState("networkidle");
	await pause(1200);
	await capture(page, "07p-notifications-liste");

	await page.evaluate(() => window.scrollTo({ top: 400, behavior: "smooth" }));
	await pause(800);
	await capture(page, "07q-notifications-detail-envois");

	// Hover sur les notifications récentes
	const notifRows = page.locator("table tbody tr");
	const notifCount = await notifRows.count();
	for (let i = 0; i < Math.min(notifCount, 4); i++) {
		await notifRows.nth(i).hover();
		await pause(400);
	}
	if (notifCount > 0) await capture(page, "07r-notifications-survol-statut");

	// ── ÉTAPE 5 : Gestion des utilisateurs et domaine ────────────────────────
	// "Comment créer un compte enseignant ou admin dans le système ?"
	await page.goto("/admin/users");
	await page.waitForLoadState("networkidle");
	await pause(1200);
	await capture(page, "07s-users-liste-complete");

	await page.evaluate(() => window.scrollTo({ top: 400, behavior: "smooth" }));
	await pause(700);
	await capture(page, "07t-users-liste-roles");

	// Survoler les utilisateurs pour voir leurs rôles
	const userRows = page.locator("table tbody tr");
	const userCount = await userRows.count();
	for (let i = 0; i < Math.min(userCount, 4); i++) {
		await userRows.nth(i).hover();
		await pause(400);
	}
	await capture(page, "07u-users-survol-roles");
});
