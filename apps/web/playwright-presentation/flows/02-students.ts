/**
 * Flow 02 — Gestion complète des étudiants
 *
 * Questions utilisateurs auxquelles ce flow répond :
 *  - "Comment retrouver rapidement un étudiant parmi des centaines ?"
 *  - "Comment consulter le dossier complet d'un étudiant (cours, notes, historique) ?"
 *  - "Comment créer un nouvel étudiant et l'inscrire dans la bonne classe ?"
 *  - "Comment vérifier les inscriptions aux cours d'un étudiant ?"
 *  - "Comment gérer un étudiant qui change de classe en cours d'année ?"
 */
import { test } from "@playwright/test";
import { SEED_DATA, capture, loginAs, pause } from "../fixtures/auth";

// ─────────────────────────────────────────────────────────────────────────────
// SCÉNARIO 1 : Retrouver un étudiant et consulter son dossier complet
// Question : "Je cherche Ndong Alain — comment voir son parcours complet ?"
// ─────────────────────────────────────────────────────────────────────────────
test("03 - Recherche d'un étudiant et consultation de son dossier académique", async ({ page }) => {
	await loginAs(page, "admin");

	// ── ÉTAPE 1 : Arriver sur la liste — vue d'ensemble ──────────────────────
	await page.goto("/admin/students");
	await page.waitForLoadState("networkidle");
	await pause(1200);
	await capture(page, "02a-students-liste-complete");

	// ── ÉTAPE 2 : Scroll pour voir toute la table — combien d'étudiants ? ────
	await page.evaluate(() => window.scrollTo({ top: 300, behavior: "smooth" }));
	await pause(700);
	await capture(page, "02b-students-liste-scrollee");
	await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
	await pause(500);

	// ── ÉTAPE 3 : Recherche par nom "Ndong" ──────────────────────────────────
	// L'admin tape le nom de l'étudiant dans la barre de recherche
	const searchInput = page
		.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="herche"], input[placeholder*="tudiant"]')
		.first();
	if (await searchInput.isVisible()) {
		await searchInput.click();
		await pause(300);
		// Frappe lettre par lettre pour montrer l'autocomplétion
		await searchInput.type("Nd", { delay: 150 });
		await pause(600);
		await capture(page, "02c-search-autocompletion-nd");

		await searchInput.type("ong", { delay: 150 });
		await pause(1000);
		await capture(page, "02d-search-ndong-resultat");

		// Hover sur le résultat trouvé
		const ndongRow = page.locator('tr:has-text("Ndong"), [role="row"]:has-text("Ndong")').first();
		if (await ndongRow.isVisible()) {
			await ndongRow.hover();
			await pause(500);
			await capture(page, "02e-search-ndong-hover");
		}

		// Effacer et chercher "Eyebe" (autre étudiant)
		await searchInput.click({ clickCount: 3 });
		await searchInput.fill("");
		await pause(300);
		await searchInput.type("Eyebe", { delay: 150 });
		await pause(1000);
		await capture(page, "02f-search-eyebe-resultat");
		await searchInput.fill("");
		await pause(500);
	}

	// ── ÉTAPE 4 : Filtre par classe INF25-BTS1A ───────────────────────────────
	// "Je veux voir uniquement les étudiants de la promotion infirmiers A"
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

		// Compter les étudiants filtrés
		const filteredRows = page.locator("table tbody tr");
		const count = await filteredRows.count();
		// Survoler chaque étudiant filtré
		for (let i = 0; i < Math.min(count, 4); i++) {
			await filteredRows.nth(i).hover();
			await pause(300);
		}
		await capture(page, "02i-filtre-inf25-survol-etudiants");
	}

	// ── ÉTAPE 5 : Ouvrir le dossier complet de Ndong Alain ───────────────────
	// "Montrez-moi tout ce qu'on sait sur cet étudiant"
	// Reset filtre et chercher Ndong
	const searchInput2 = page
		.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="herche"]')
		.first();
	if (await searchInput2.isVisible()) {
		await searchInput2.fill("Ndong");
		await pause(1000);
	}

	const ndongRow = page
		.locator('tr:has-text("Ndong"), [role="row"]:has-text("Ndong")')
		.first();
	const targetRow = (await ndongRow.count()) > 0
		? ndongRow
		: page.locator("table tbody tr").first();

	if (await targetRow.isVisible()) {
		await targetRow.click();
		await page.waitForLoadState("networkidle");
		await pause(1400);
		await capture(page, "02j-dossier-ndong-identite");

		// ── ÉTAPE 6 : Infos personnelles en haut de fiche ────────────────────
		await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
		await pause(600);
		await capture(page, "02k-ndong-infos-personnelles");

		// ── ÉTAPE 7 : Section inscriptions aux cours ──────────────────────────
		// "Dans quels cours est-il inscrit ?"
		await page.evaluate(() => window.scrollTo({ top: 400, behavior: "smooth" }));
		await pause(900);
		await capture(page, "02l-ndong-inscriptions-cours");

		// ── ÉTAPE 8 : Section notes et résultats ─────────────────────────────
		// "Quelles sont ses notes dans chaque matière ?"
		await page.evaluate(() => window.scrollTo({ top: 800, behavior: "smooth" }));
		await pause(900);
		await capture(page, "02m-ndong-notes-resultats");

		// ── ÉTAPE 9 : Onglets supplémentaires ────────────────────────────────
		// Explorer chaque onglet du profil : Inscriptions, Notes, Historique...
		const tabs = page.locator('[role="tab"]');
		const tabCount = await tabs.count();
		for (let i = 0; i < Math.min(tabCount, 4); i++) {
			await tabs.nth(i).click();
			await pause(900);
			await capture(page, `02n-ndong-onglet-${i}-${await tabs.nth(i).textContent().then(t => t?.trim().toLowerCase().replace(/\s+/g, "-").substring(0, 20) ?? i)}`);
			// Scroll pour voir le contenu de l'onglet
			await page.evaluate(() => window.scrollTo({ top: 300, behavior: "smooth" }));
			await pause(600);
			await capture(page, `02o-ndong-onglet-${i}-contenu`);
			await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
			await pause(400);
		}
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// SCÉNARIO 2 : Créer un nouvel étudiant et l'inscrire
// Question : "Comment ajouter un nouvel étudiant qui vient de s'inscrire ?"
// ─────────────────────────────────────────────────────────────────────────────
test("04 - Création d'un étudiant et inscription dans une classe", async ({ page }) => {
	await loginAs(page, "admin");
	await page.goto("/admin/students");
	await page.waitForLoadState("networkidle");
	await pause(800);

	// ── ÉTAPE 1 : Ouvrir le formulaire de création ────────────────────────────
	const addButton = page
		.locator('button:has-text("Ajouter"), button:has-text("Add"), button:has-text("Nouvel étudiant"), button:has-text("New student")')
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

	// ── ÉTAPE 2 : Remplir le prénom ───────────────────────────────────────────
	const firstInput = page
		.locator('input[name*="first"], input[id*="first"], input[placeholder*="rénom"], input[placeholder*="irst name"]')
		.first();
	if (await firstInput.isVisible()) {
		await firstInput.click();
		await firstInput.type("Brice", { delay: 100 });
		await pause(400);
		await capture(page, "02r-prenom-saisi");
	}

	// ── ÉTAPE 3 : Remplir le nom de famille ──────────────────────────────────
	const lastInput = page
		.locator('input[name*="last"], input[id*="last"], input[placeholder*="om de famille"], input[placeholder*="ast name"]')
		.first();
	if (await lastInput.isVisible()) {
		await lastInput.click();
		await lastInput.type("Onana", { delay: 100 });
		await pause(400);
	}

	// ── ÉTAPE 4 : Email ───────────────────────────────────────────────────────
	const emailInput = page.locator('input[type="email"]').first();
	if (await emailInput.isVisible()) {
		await emailInput.click();
		await emailInput.type("brice.onana@inses.cm", { delay: 80 });
		await pause(400);
	}

	await capture(page, "02s-formulaire-identite-rempli");

	// ── ÉTAPE 5 : Sélectionner le genre ──────────────────────────────────────
	const genderSelect = page.locator('[data-testid="gender-select"], [name*="gender"], [id*="gender"]').first();
	if (await genderSelect.isVisible()) {
		await genderSelect.click();
		await pause(600);
		await capture(page, "02t-genre-dropdown-ouvert");
		await page.locator('[role="option"]').first().click();
		await pause(400);
	}

	// ── ÉTAPE 6 : Sélectionner la classe INF25-BTS1A ──────────────────────────
	// "Dans quelle classe inscrire ce nouvel étudiant ?"
	const classSelect = page.locator('[data-testid="class-select"], [name*="class"], [id*="class"]').first();
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

	// ── ÉTAPE 7 : Formulaire complet avant soumission ─────────────────────────
	await capture(page, "02v-formulaire-complet-pret");

	// ── ÉTAPE 8 : Survol du bouton de soumission ──────────────────────────────
	const submitBtn = page
		.locator('button[type="submit"], button:has-text("Enregistrer"), button:has-text("Save"), button:has-text("Créer"), button:has-text("Create")')
		.first();
	if (await submitBtn.isVisible()) {
		await submitBtn.scrollIntoViewIfNeeded();
		await submitBtn.hover();
		await pause(700);
		await capture(page, "02w-bouton-soumettre-hover");
	}

	// ── ÉTAPE 9 : Fermer (on ne crée pas vraiment pour garder les données propres) ──
	await page.keyboard.press("Escape");
	await pause(600);
	await capture(page, "02x-formulaire-ferme-retour-liste");
});

// ─────────────────────────────────────────────────────────────────────────────
// SCÉNARIO 3 : Vérifier et gérer les inscriptions aux cours d'un étudiant
// Question : "Comment m'assurer qu'un étudiant est bien inscrit à tous ses cours ?"
// ─────────────────────────────────────────────────────────────────────────────
test("05 - Gestion des inscriptions aux cours d'un étudiant", async ({ page }) => {
	await loginAs(page, "admin");

	// ── ÉTAPE 1 : Aller directement sur le dossier de Ndong Alain ────────────
	await page.goto("/admin/students");
	await page.waitForLoadState("networkidle");
	await pause(800);

	const searchInput = page
		.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="herche"]')
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

	// ── ÉTAPE 2 : Onglet inscriptions aux cours ───────────────────────────────
	// Chercher l'onglet "Inscriptions" ou "Courses"
	const enrollTab = page.locator('[role="tab"]:has-text("Inscription"), [role="tab"]:has-text("Course"), [role="tab"]:has-text("Cours")').first();
	if (await enrollTab.isVisible()) {
		await enrollTab.click();
		await pause(1000);
		await capture(page, "02z-ndong-onglet-inscriptions-cours");

		// Voir tous les cours auxquels l'étudiant est inscrit
		await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
		await pause(600);
		const courseRows = page.locator("table tbody tr");
		const count = await courseRows.count();
		for (let i = 0; i < Math.min(count, 4); i++) {
			await courseRows.nth(i).hover();
			await pause(350);
		}
		await capture(page, "03a-ndong-cours-inscrits-liste");

		await page.evaluate(() => window.scrollTo({ top: 400, behavior: "smooth" }));
		await pause(700);
		await capture(page, "03b-ndong-cours-inscrits-suite");
	}

	// ── ÉTAPE 3 : Comparaison avec un autre étudiant — Eyebe Rachel ───────────
	// "Est-ce que Eyebe est inscrite aux mêmes cours ?"
	await page.goto("/admin/students");
	await page.waitForLoadState("networkidle");
	await pause(700);

	const searchInput2 = page
		.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="herche"]')
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

		// Voir ses cours — différente filière (Comptabilité)
		const coursesSection = page.locator('[role="tab"]:has-text("Inscription"), [role="tab"]:has-text("Course"), [role="tab"]:has-text("Cours")').first();
		if (await coursesSection.isVisible()) {
			await coursesSection.click();
			await pause(900);
			await capture(page, "03d-eyebe-cours-comptabilite");
		}

		await page.evaluate(() => window.scrollTo({ top: 400, behavior: "smooth" }));
		await pause(700);
		await capture(page, "03e-eyebe-inscriptions-completes");
	}
});
