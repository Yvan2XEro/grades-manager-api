/**
 * Flow 04 — Cycle de vie complet d'un examen
 *
 * Questions utilisateurs auxquelles ce flow répond :
 *  - "Comment créer un examen avec toutes ses options de configuration ?"
 *  - "Quelle est la différence entre CC, TP, TPE et FINAL ?"
 *  - "Comment planifier les examens dans le calendrier ?"
 *  - "Que se passe-t-il quand un examen est verrouillé — peut-on encore modifier ?"
 *  - "Comment l'admin approuve-t-il un examen et verrouille les notes définitivement ?"
 *  - "Comment gérer un workflow d'approbation des notes ?"
 */
import { test } from "@playwright/test";
import { capture, loginAs, pause, SEED_DATA } from "../fixtures/auth";

// ─────────────────────────────────────────────────────────────────────────────
// SCÉNARIO 1 : Explorer les examens existants et comprendre leur structure
// Question : "Quels examens sont déjà configurés et dans quel état sont-ils ?"
// ─────────────────────────────────────────────────────────────────────────────
test("08 - Liste des examens : états, types et actions disponibles", async ({
	page,
}) => {
	await loginAs(page, "admin");

	// ── ÉTAPE 1 : Liste complète de tous les examens ──────────────────────────
	await page.goto("/admin/exams");
	await page.waitForLoadState("networkidle");
	await pause(1400);
	await capture(page, "04a-exams-liste-complete");

	// ── ÉTAPE 2 : Scroll pour voir tous les examens ──────────────────────────
	await page.evaluate(() => window.scrollTo({ top: 300, behavior: "smooth" }));
	await pause(800);
	await capture(page, "04b-exams-liste-scrollee");
	await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
	await pause(500);

	// ── ÉTAPE 3 : Survoler un examen pour voir les actions disponibles ────────
	// "Que puis-je faire sur un examen existant ?"
	const anatRow = page
		.locator('tr:has-text("Anatomie"), [role="row"]:has-text("Anatomie")')
		.first();
	const firstRow = page.locator("table tbody tr").first();
	const examRow = (await anatRow.count()) > 0 ? anatRow : firstRow;

	if (await examRow.isVisible()) {
		await examRow.hover();
		await pause(700);
		await capture(page, "04c-exam-row-hover-actions");

		// Ouvrir le menu actions
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

		// Ouvrir le détail de l'examen
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

	// ── ÉTAPE 4 : Filtrer par classe INF25-BTS1A ─────────────────────────────
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

	// ── ÉTAPE 5 : Types d'examens (CC, TP, TPE, FINAL) ───────────────────────
	// "Quelle est la pondération de chaque type d'examen ?"
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

	// Ouvrir un type pour voir sa configuration
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
// SCÉNARIO 2 : Créer un nouvel examen complet avec workflow d'approbation
// Question : "Comment créer un examen Final pour Physiologie S1 ?"
// ─────────────────────────────────────────────────────────────────────────────
test("09 - Création complète d'un examen Final Physiologie avec workflow", async ({
	page,
}) => {
	await loginAs(page, "admin");
	await page.goto("/admin/exams");
	await page.waitForLoadState("networkidle");
	await pause(800);

	// ── ÉTAPE 1 : Bouton Ajouter ──────────────────────────────────────────────
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

	// ── ÉTAPE 2 : Sélection du cours Physiologie ──────────────────────────────
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

	// ── ÉTAPE 3 : Nom de l'examen ─────────────────────────────────────────────
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

	// ── ÉTAPE 4 : Type d'examen : FINAL ──────────────────────────────────────
	// Note : c'est un textbox libre avec autosuggestion
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
		// Accepter l'autosuggestion si disponible
		const suggestion = page
			.locator('[role="option"]:has-text("FINAL")')
			.first();
		if (await suggestion.isVisible({ timeout: 1200 }).catch(() => false)) {
			await suggestion.click();
		}
		await pause(400);
	}

	// ── ÉTAPE 5 : Date de l'examen ────────────────────────────────────────────
	// "Quand aura lieu cet examen ?"
	const dateBtn = page
		.locator(
			'button:has-text("Choose a date"), button[aria-label*="date"], input[type="date"]',
		)
		.first();
	if (await dateBtn.isVisible()) {
		await dateBtn.click();
		await pause(800);
		await capture(page, "04s-selecteur-date-ouvert");

		// Choisir le 20 du mois courant
		const day20 = page.locator('[role="gridcell"]:has-text("20")').first();
		if (await day20.isVisible()) {
			await day20.click();
			await pause(500);
			await capture(page, "04t-date-selectionnee");
		} else {
			await page.keyboard.press("Escape");
		}
	}

	// ── ÉTAPE 6 : Poids (coefficient) — 60% de la note finale ────────────────
	// "Quel est le poids de cet examen dans la note finale du cours ?"
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

	// ── ÉTAPE 7 : Formulaire complet — aperçu avant soumission ───────────────
	await capture(page, "04v-formulaire-exam-complet");

	// ── ÉTAPE 8 : Bouton de sauvegarde ───────────────────────────────────────
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
// SCÉNARIO 3 : Le planificateur — organiser les examens dans le calendrier
// Question : "Comment visualiser et organiser tous les examens dans le temps ?"
// ─────────────────────────────────────────────────────────────────────────────
test("10 - Planificateur d'examens : calendrier et gestion des conflits", async ({
	page,
}) => {
	await loginAs(page, "admin");

	// ── ÉTAPE 1 : Vue calendrier mensuelle des examens ────────────────────────
	await page.goto("/admin/exam-scheduler");
	await page.waitForLoadState("networkidle");
	await pause(1500);
	await capture(page, "04x-planificateur-vue-mensuelle");

	// ── ÉTAPE 2 : Scroll pour voir les examens planifiés ─────────────────────
	await page.evaluate(() => window.scrollTo({ top: 300, behavior: "smooth" }));
	await pause(900);
	await capture(page, "04y-planificateur-examens-planifies");
	await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
	await pause(500);

	// ── ÉTAPE 3 : Survoler un examen dans le calendrier ──────────────────────
	// "Que se passe-t-il si je survole un examen dans le calendrier ?"
	const calendarEvent = page
		.locator('[class*="event"], [class*="exam"], [data-testid*="exam"]')
		.first();
	if (await calendarEvent.isVisible()) {
		await calendarEvent.hover();
		await pause(700);
		await capture(page, "04z-planificateur-survol-examen");
	}

	// ── ÉTAPE 4 : Navigation vers le mois suivant ────────────────────────────
	const nextBtn = page
		.locator(
			'button[aria-label*="next"], button[aria-label*="Next"], button[aria-label*="suivant"]',
		)
		.first();
	if (await nextBtn.isVisible()) {
		await nextBtn.click();
		await pause(900);
		await capture(page, "05a-planificateur-mois-suivant");

		// Revenir au mois courant
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

	// ── ÉTAPE 5 : Vue liste du planificateur (si disponible) ─────────────────
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

	// ── ÉTAPE 6 : Workflows d'approbation des examens ─────────────────────────
	// "Comment soumettre un examen pour approbation ?"
	await page.goto("/admin/exams");
	await page.waitForLoadState("networkidle");
	await pause(1200);

	// Chercher les examens avec des workflows en attente
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
		// Essayer la page workflows directement
		await page.goto("/admin/workflows");
		await page.waitForLoadState("networkidle");
		await pause(1200);
		await capture(page, "05d-workflows-page-directe");
	}
});
