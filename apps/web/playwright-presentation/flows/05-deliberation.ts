/**
 * Flow 05 — Deliberations & Promotion: from year end to the decision
 *
 * User questions this flow answers:
 *  - "How does the end-of-year deliberation process work?"
 *  - "Which promotion rules are applied — how do I configure them?"
 *  - "How do I automatically assess whether a student moves up a year?"
 *  - "How do I see deliberation results student by student?"
 *  - "What does the system do with borderline students?"
 *  - "How do I view the history of past promotions?"
 */
import { test } from "@playwright/test";
import { capture, loginAs, pause, SEED_DATA } from "../fixtures/auth";

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 1: View existing deliberations and their results
// Question: "Last year's deliberations — how do I see the results?"
// ─────────────────────────────────────────────────────────────────────────────
test("11 - Délibérations : liste, détail et résultats par étudiant", async ({
	page,
}) => {
	await loginAs(page, "admin");

	// ── STEP 1: List of deliberations ─────────────────────────────────────────
	await page.goto("/admin/deliberations");
	await page.waitForLoadState("networkidle");
	await pause(1500);
	await capture(page, "05a-deliberations-liste-complete");

	// ── STEP 2: Scroll to see all deliberations ───────────────────────────────
	await page.evaluate(() => window.scrollTo({ top: 400, behavior: "smooth" }));
	await pause(800);
	await capture(page, "05b-deliberations-liste-scrollee");
	await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
	await pause(600);

	// ── STEP 3: Hover over a deliberation to see its info ─────────────────────
	const deliRows = page.locator("table tbody tr, [class*='card']");
	const count = await deliRows.count();
	for (let i = 0; i < Math.min(count, 3); i++) {
		await deliRows.nth(i).hover();
		await pause(500);
	}
	await capture(page, "05c-deliberations-survol");

	// ── STEP 4: Open the first deliberation — full view ───────────────────────
	const firstDeli = deliRows.first();
	if (await firstDeli.isVisible()) {
		await firstDeli.click();
		await page.waitForLoadState("networkidle");
		await pause(1400);
		await capture(page, "05d-deliberation-detail-entete");

		// ── STEP 5: See the results per student ───────────────────────────────
		// "Which student passed, failed, or has to retake?"
		await page.evaluate(() =>
			window.scrollTo({ top: 400, behavior: "smooth" }),
		);
		await pause(1000);
		await capture(page, "05e-deliberation-resultats-etudiants");

		// Hover over the student rows to see their individual decisions
		const studentRows = page.locator("table tbody tr");
		const studCount = await studentRows.count();
		for (let i = 0; i < Math.min(studCount, 5); i++) {
			await studentRows.nth(i).hover();
			await pause(400);
		}
		await capture(page, "05f-deliberation-survol-decisions");

		// ── STEP 6: Deliberation statistics ───────────────────────────────────
		// "What is the pass rate of this cohort?"
		await page.evaluate(() =>
			window.scrollTo({ top: 800, behavior: "smooth" }),
		);
		await pause(900);
		await capture(page, "05g-deliberation-statistiques-taux");

		// ── STEP 7: Additional tabs ──────────────────────────────────────────
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
// SCENARIO 2: Configure the promotion rules
// Question: "How do I set the criteria for moving up a year?"
// ─────────────────────────────────────────────────────────────────────────────
test("12 - Règles de promotion : configuration et compréhension", async ({
	page,
}) => {
	await loginAs(page, "admin");

	// ── STEP 1: Overview of the promotion rules ───────────────────────────────
	await page.goto("/admin/promotion-rules");
	await page.waitForLoadState("networkidle");
	await pause(1300);
	await capture(page, "05i-promotion-vue-ensemble");

	await page.evaluate(() => window.scrollTo({ top: 400, behavior: "smooth" }));
	await pause(700);
	await capture(page, "05j-promotion-vue-ensemble-bas");
	await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
	await pause(500);

	// ── STEP 2: Rule editor — see the configured criteria ─────────────────────
	// "What are the exact criteria to move up to BTS2?"
	await page.goto("/admin/promotion-rules/rules");
	await page.waitForLoadState("networkidle");
	await pause(1200);
	await capture(page, "05k-editeur-regles-liste");

	// Hover over each rule to see its description
	const rules = page.locator(
		'[class*="card"], li[class*="rule"], table tbody tr',
	);
	const ruleCount = await rules.count();
	for (let i = 0; i < Math.min(ruleCount, 4); i++) {
		await rules.nth(i).hover();
		await pause(500);
	}
	if (ruleCount > 0) await capture(page, "05l-regles-survol-details");

	// ── STEP 3: Open a rule to see its full configuration ─────────────────────
	// "How is the 10/20 minimum average rule defined?"
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

	// ── STEP 4: Evaluation page — what would happen for INF25-BTS1A? ──────────
	// "If the deliberation took place now, how many students would pass?"
	await page.goto("/admin/promotion-rules/evaluate");
	await page.waitForLoadState("networkidle");
	await pause(1300);
	await capture(page, "05o-evaluation-page-landing");

	// ── STEP 5: Select the class to evaluate ──────────────────────────────────
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

	// ── STEP 6: Run the evaluation to see the projected results ───────────────
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

		// See the results student by student
		await page.evaluate(() =>
			window.scrollTo({ top: 400, behavior: "smooth" }),
		);
		await pause(900);
		await capture(page, "05t-resultats-par-etudiant");

		// Hover over the borderline students
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
// SCENARIO 3: Official deliberation run and promotion
// Question: "How do I officially run the deliberation and validate the results?"
// ─────────────────────────────────────────────────────────────────────────────
test("13 - Exécution de la délibération et historique des promotions", async ({
	page,
}) => {
	await loginAs(page, "admin");

	// ── STEP 1: Official run page ─────────────────────────────────────────────
	// "When I am ready, how do I start the official deliberation?"
	await page.goto("/admin/promotion-rules/execute");
	await page.waitForLoadState("networkidle");
	await pause(1400);
	await capture(page, "05v-execution-deliberation-landing");

	// See the run options
	await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
	await pause(600);

	// Select a class to run
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

	// ── Run button (hover only, no click) ─────────────────────────────────────
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

	// ── STEP 2: History of past promotions ────────────────────────────────────
	// "Which cohorts have been deliberated in the past?"
	await page.goto("/admin/promotion-rules/history");
	await page.waitForLoadState("networkidle");
	await pause(1200);
	await capture(page, "05z-historique-promotions-liste");

	await page.evaluate(() => window.scrollTo({ top: 400, behavior: "smooth" }));
	await pause(800);
	await capture(page, "06a-historique-promotions-detail");

	// Open a history record to see the decisions
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

	// ── STEP 3: Deliberation rules (raw criteria) ─────────────────────────────
	// "Which technical criteria are used in the JSON rules?"
	await page.goto("/admin/deliberations/rules");
	await page.waitForLoadState("networkidle");
	await pause(1200);
	await capture(page, "06e-deliberations-regles-techniques");

	await page.evaluate(() => window.scrollTo({ top: 400, behavior: "smooth" }));
	await pause(700);
	await capture(page, "06f-deliberations-regles-scrollees");
});
