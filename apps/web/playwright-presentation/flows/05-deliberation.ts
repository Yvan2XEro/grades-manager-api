/**
 * Flow 05 — Délibérations & Promotion : de la fin d'année à la décision
 *
 * Questions utilisateurs auxquelles ce flow répond :
 *  - "Comment fonctionne le processus de délibération de fin d'année ?"
 *  - "Quelles règles de promotion sont appliquées — comment les configurer ?"
 *  - "Comment évaluer automatiquement si un étudiant passe en année suivante ?"
 *  - "Comment voir les résultats de délibération étudiant par étudiant ?"
 *  - "Que fait le système avec les étudiants en situation limite ?"
 *  - "Comment consulter l'historique des promotions passées ?"
 */
import { test } from "@playwright/test";
import { capture, loginAs, pause, SEED_DATA } from "../fixtures/auth";

// ─────────────────────────────────────────────────────────────────────────────
// SCÉNARIO 1 : Consulter les délibérations existantes et leurs résultats
// Question : "Les délibérations de l'année dernière — comment voir les résultats ?"
// ─────────────────────────────────────────────────────────────────────────────
test("11 - Délibérations : liste, détail et résultats par étudiant", async ({
	page,
}) => {
	await loginAs(page, "admin");

	// ── ÉTAPE 1 : Liste des délibérations ─────────────────────────────────────
	await page.goto("/admin/deliberations");
	await page.waitForLoadState("networkidle");
	await pause(1500);
	await capture(page, "05a-deliberations-liste-complete");

	// ── ÉTAPE 2 : Scroll pour voir toutes les délibérations ──────────────────
	await page.evaluate(() => window.scrollTo({ top: 400, behavior: "smooth" }));
	await pause(800);
	await capture(page, "05b-deliberations-liste-scrollee");
	await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
	await pause(600);

	// ── ÉTAPE 3 : Survoler une délibération pour voir ses infos ──────────────
	const deliRows = page.locator("table tbody tr, [class*='card']");
	const count = await deliRows.count();
	for (let i = 0; i < Math.min(count, 3); i++) {
		await deliRows.nth(i).hover();
		await pause(500);
	}
	await capture(page, "05c-deliberations-survol");

	// ── ÉTAPE 4 : Ouvrir la première délibération — vue complète ─────────────
	const firstDeli = deliRows.first();
	if (await firstDeli.isVisible()) {
		await firstDeli.click();
		await page.waitForLoadState("networkidle");
		await pause(1400);
		await capture(page, "05d-deliberation-detail-entete");

		// ── ÉTAPE 5 : Voir les résultats par étudiant ─────────────────────────
		// "Quel étudiant a été admis, refusé, ou doit repasser ?"
		await page.evaluate(() =>
			window.scrollTo({ top: 400, behavior: "smooth" }),
		);
		await pause(1000);
		await capture(page, "05e-deliberation-resultats-etudiants");

		// Survoler les lignes d'étudiants pour voir leurs décisions individuelles
		const studentRows = page.locator("table tbody tr");
		const studCount = await studentRows.count();
		for (let i = 0; i < Math.min(studCount, 5); i++) {
			await studentRows.nth(i).hover();
			await pause(400);
		}
		await capture(page, "05f-deliberation-survol-decisions");

		// ── ÉTAPE 6 : Statistiques de la délibération ─────────────────────────
		// "Quel est le taux de réussite de cette promotion ?"
		await page.evaluate(() =>
			window.scrollTo({ top: 800, behavior: "smooth" }),
		);
		await pause(900);
		await capture(page, "05g-deliberation-statistiques-taux");

		// ── ÉTAPE 7 : Onglets supplémentaires ────────────────────────────────
		await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
		await pause(500);
		const tabs = page.locator('[role="tab"]');
		const tabCount = await tabs.count();
		for (let i = 1; i < Math.min(tabCount, 4); i++) {
			await tabs.nth(i).click();
			await pause(900);
			await capture(page, `05h-deliberation-onglet-${i}`);
			await page.evaluate(() =>
				window.scrollTo({ top: 0, behavior: "smooth" }),
			);
			await pause(500);
		}

		await page.goBack();
		await pause(700);
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// SCÉNARIO 2 : Configurer les règles de promotion
// Question : "Comment paramétrer les critères de passage en année supérieure ?"
// ─────────────────────────────────────────────────────────────────────────────
test("12 - Règles de promotion : configuration et compréhension", async ({
	page,
}) => {
	await loginAs(page, "admin");

	// ── ÉTAPE 1 : Vue d'ensemble des règles de promotion ─────────────────────
	await page.goto("/admin/promotion-rules");
	await page.waitForLoadState("networkidle");
	await pause(1300);
	await capture(page, "05i-promotion-vue-ensemble");

	await page.evaluate(() => window.scrollTo({ top: 400, behavior: "smooth" }));
	await pause(700);
	await capture(page, "05j-promotion-vue-ensemble-bas");
	await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
	await pause(500);

	// ── ÉTAPE 2 : Éditeur de règles — voir les critères configurés ───────────
	// "Quels sont les critères exacts pour passer en BTS2 ?"
	await page.goto("/admin/promotion-rules/rules");
	await page.waitForLoadState("networkidle");
	await pause(1200);
	await capture(page, "05k-editeur-regles-liste");

	// Survoler chaque règle pour voir sa description
	const rules = page.locator(
		'[class*="card"], li[class*="rule"], table tbody tr',
	);
	const ruleCount = await rules.count();
	for (let i = 0; i < Math.min(ruleCount, 4); i++) {
		await rules.nth(i).hover();
		await pause(500);
	}
	if (ruleCount > 0) await capture(page, "05l-regles-survol-details");

	// ── ÉTAPE 3 : Ouvrir une règle pour voir sa configuration complète ────────
	// "Comment est définie la règle de moyenne minimale 10/20 ?"
	const firstRule = rules.first();
	if (await firstRule.isVisible()) {
		await firstRule.click();
		await page.waitForLoadState("networkidle");
		await pause(1000);
		await capture(page, "05m-regle-detail-criteres");

		await page.evaluate(() =>
			window.scrollTo({ top: 300, behavior: "smooth" }),
		);
		await pause(700);
		await capture(page, "05n-regle-detail-parametres");

		await page.goBack().catch(() => page.keyboard.press("Escape"));
		await pause(600);
	}

	// ── ÉTAPE 4 : Page d'évaluation — que se passerait-il pour INF25-BTS1A ? ──
	// "Si la délibération avait lieu maintenant, combien d'étudiants passeraient ?"
	await page.goto("/admin/promotion-rules/evaluate");
	await page.waitForLoadState("networkidle");
	await pause(1300);
	await capture(page, "05o-evaluation-page-landing");

	// ── ÉTAPE 5 : Sélectionner la classe à évaluer ────────────────────────────
	const classSelect = page
		.locator('[role="combobox"], [data-testid="class-select"]')
		.first();
	if (await classSelect.isVisible()) {
		await classSelect.click();
		await pause(700);
		await capture(page, "05p-evaluation-classe-dropdown");

		const infOption = page
			.locator(`[role="option"]:has-text("${SEED_DATA.classes.infirmierA}")`)
			.first();
		if (await infOption.isVisible()) {
			await infOption.click();
		} else {
			await page.locator('[role="option"]').first().click();
		}
		await page.waitForLoadState("networkidle");
		await pause(1400);
		await capture(page, "05q-evaluation-classe-selectionnee");
	}

	// ── ÉTAPE 6 : Lancer l'évaluation pour voir les résultats prévisionnels ───
	const evalBtn = page
		.locator(
			'button:has-text("Évaluer"), button:has-text("Evaluate"), button:has-text("Analyser"), button:has-text("Run"), button:has-text("Simuler")',
		)
		.first();
	if (await evalBtn.isVisible()) {
		await evalBtn.scrollIntoViewIfNeeded();
		await evalBtn.hover();
		await pause(700);
		await capture(page, "05r-bouton-evaluation-hover");
		await evalBtn.click();
		await page.waitForLoadState("networkidle");
		await pause(1800);
		await capture(page, "05s-resultats-evaluation-previsionnel");

		// Voir les résultats étudiant par étudiant
		await page.evaluate(() =>
			window.scrollTo({ top: 400, behavior: "smooth" }),
		);
		await pause(900);
		await capture(page, "05t-resultats-par-etudiant");

		// Survoler les étudiants en situation limite
		const limitRows = page.locator(
			'tr:has-text("Limite"), tr:has-text("Borderline"), tr:has-text("Rattrapage")',
		);
		const limitCount = await limitRows.count();
		if (limitCount > 0) {
			await limitRows.first().hover();
			await pause(600);
			await capture(page, "05u-etudiants-situation-limite");
		}
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// SCÉNARIO 3 : Exécution officielle de la délibération et promotion
// Question : "Comment lancer officiellement la délibération et valider les résultats ?"
// ─────────────────────────────────────────────────────────────────────────────
test("13 - Exécution de la délibération et historique des promotions", async ({
	page,
}) => {
	await loginAs(page, "admin");

	// ── ÉTAPE 1 : Page d'exécution officielle ────────────────────────────────
	// "Quand je suis prêt, comment je lance la délibération officielle ?"
	await page.goto("/admin/promotion-rules/execute");
	await page.waitForLoadState("networkidle");
	await pause(1400);
	await capture(page, "05v-execution-deliberation-landing");

	// Voir les options d'exécution
	await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
	await pause(600);

	// Sélectionner une classe pour exécution
	const classSelect = page
		.locator('[role="combobox"], [data-testid="class-select"]')
		.first();
	if (await classSelect.isVisible()) {
		await classSelect.click();
		await pause(700);
		const classOption = page.locator('[role="option"]').first();
		if (await classOption.isVisible()) {
			await classOption.click();
			await page.waitForLoadState("networkidle");
			await pause(1100);
			await capture(page, "05w-execution-classe-selectionnee");
		} else {
			await page.keyboard.press("Escape");
		}
	}

	await page.evaluate(() => window.scrollTo({ top: 300, behavior: "smooth" }));
	await pause(800);
	await capture(page, "05x-execution-resume-avant-validation");

	// ── Bouton d'exécution (on survole seulement, on ne clique pas) ───────────
	const execBtn = page
		.locator(
			'button:has-text("Exécuter"), button:has-text("Execute"), button:has-text("Valider"), button:has-text("Lancer")',
		)
		.first();
	if (await execBtn.isVisible()) {
		await execBtn.scrollIntoViewIfNeeded();
		await execBtn.hover();
		await pause(700);
		await capture(page, "05y-bouton-execution-officielle-hover");
	}

	// ── ÉTAPE 2 : Historique des promotions passées ───────────────────────────
	// "Quelles promotions ont été délibérées dans le passé ?"
	await page.goto("/admin/promotion-rules/history");
	await page.waitForLoadState("networkidle");
	await pause(1200);
	await capture(page, "05z-historique-promotions-liste");

	await page.evaluate(() => window.scrollTo({ top: 400, behavior: "smooth" }));
	await pause(800);
	await capture(page, "06a-historique-promotions-detail");

	// Ouvrir un enregistrement d'historique pour voir les décisions
	const historyRows = page.locator("table tbody tr, [class*='card']");
	if (await historyRows.first().isVisible()) {
		await historyRows.first().hover();
		await pause(500);
		await capture(page, "06b-historique-survol-detail");

		await historyRows.first().click();
		await page.waitForLoadState("networkidle");
		await pause(1200);
		await capture(page, "06c-historique-record-complet");

		await page.evaluate(() =>
			window.scrollTo({ top: 400, behavior: "smooth" }),
		);
		await pause(700);
		await capture(page, "06d-historique-decisions-individuelles");

		await page.goBack();
		await pause(600);
	}

	// ── ÉTAPE 3 : Règles de délibération (critères bruts) ────────────────────
	// "Quels critères techniques sont utilisés dans les règles JSON ?"
	await page.goto("/admin/deliberations/rules");
	await page.waitForLoadState("networkidle");
	await pause(1200);
	await capture(page, "06e-deliberations-regles-techniques");

	await page.evaluate(() => window.scrollTo({ top: 400, behavior: "smooth" }));
	await pause(700);
	await capture(page, "06f-deliberations-regles-scrollees");
});
