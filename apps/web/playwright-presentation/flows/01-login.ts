/**
 * Flow 01 — Getting started with the system & user roles
 *
 * User questions this flow answers:
 *  - "What can I do as an admin on this system?"
 *  - "How does the interface adapt to my role?"
 *  - "Where do I find the institution's key information?"
 *  - "How does a teacher access their courses and students?"
 *  - "As a student, how do I check my grades?"
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
// SCENARIO 1: Sign-in and tour of the administrator dashboard
// Question: "What does the admin see as soon as they sign in?"
// ─────────────────────────────────────────────────────────────────────────────
test("01 - Tableau de bord admin : vue d'ensemble et navigation complète", async ({
	page,
}) => {
	// ── STEP 1: Blank sign-in page ────────────────────────────────────────────
	// The admin opens the application for the first time today
	await page.goto("/auth/login");
	await page.waitForLoadState("networkidle");
	await pause(800);
	await capture(page, "01a-login-page-vierge");

	// ── STEP 2: Input error — shows form validation ───────────────────────────
	// The admin mistakenly types a wrong password
	await page.locator("#email").fill(CREDENTIALS.admin.email);
	await page.locator("#password").fill("mauvais-motdepasse");
	await page.locator('button[type="submit"]').click();
	await pause(1800);
	await capture(page, "01b-login-erreur-validation");

	// ── STEP 3: Successful sign-in ────────────────────────────────────────────
	await page.locator("#password").clear();
	await page.locator("#password").fill(CREDENTIALS.admin.password);
	await pause(400);
	await capture(page, "01c-login-formulaire-correct");
	await page.locator('button[type="submit"]').click();
	await page.waitForURL("**/admin**", { timeout: 20_000 });
	await page.waitForLoadState("networkidle");
	await pause(1500);

	// ── STEP 4: Dashboard — first impression ──────────────────────────────────
	// The admin discovers the KPIs: active students, ongoing exams, pass rate…
	await capture(page, "01d-dashboard-admin-complet");

	// ── STEP 5: Hover over the stat cards to see the figures ──────────────────
	const statCards = page.locator(
		'[class*="card"]:visible, [class*="Card"]:visible',
	);
	const cardCount = await statCards.count();
	for (let i = 0; i < Math.min(cardCount, 6); i++) {
		await statCards.nth(i).scrollIntoViewIfNeeded();
		await statCards.nth(i).hover();
		await pause(500);
	}
	await capture(page, "01e-dashboard-stats-kpis");

	// ── STEP 6: Charts and trends (bottom of the page) ────────────────────────
	// The admin scrolls down to the grade progression charts
	await page.evaluate(() => window.scrollTo({ top: 500, behavior: "smooth" }));
	await pause(1000);
	await capture(page, "01f-dashboard-graphiques-tendances");
	await page.evaluate(() => window.scrollTo({ top: 1000, behavior: "smooth" }));
	await pause(900);
	await capture(page, "01g-dashboard-bas-de-page");
	await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
	await pause(600);

	// ── STEP 7: Academic years — check the active year ────────────────────────
	// "Which academic year is active?"
	await page.goto("/admin/academic-years");
	await page.waitForLoadState("networkidle");
	await pause(1200);
	await capture(page, "01h-annees-academiques-liste");

	// Find and hover over the active year 2025-2026
	const activeYearRow = page
		.locator(
			`tr:has-text("${SEED_DATA.academicYear.label}"), [class*="card"]:has-text("${SEED_DATA.academicYear.label}")`,
		)
		.first();
	if (await activeYearRow.isVisible()) {
		await activeYearRow.hover();
		await pause(700);
		await capture(page, "01i-annee-active-2025-2026-detail");
		// Open its detail
		await activeYearRow.click();
		await page.waitForLoadState("networkidle");
		await pause(1000);
		await capture(page, "01j-annee-active-detail-config");
		await page.goBack();
		await pause(600);
	}

	// ── STEP 8: Faculties and programs view ───────────────────────────────────
	// "Which programs does the institution offer?"
	await page.goto("/admin/faculties");
	await page.waitForLoadState("networkidle");
	await pause(1200);
	await capture(page, "01k-facultes-liste-complete");

	// Hover over the first faculty to see its programs
	const facultyRow = page.locator("table tbody tr, [class*='card']").first();
	if (await facultyRow.isVisible()) {
		await facultyRow.hover();
		await pause(500);
		await facultyRow.click();
		await page.waitForLoadState("networkidle");
		await pause(1000);
		await capture(page, "01l-faculte-detail-programmes");

		await page.evaluate(() =>
			window.scrollTo({ top: 400, behavior: "smooth" }),
		);
		await pause(700);
		await capture(page, "01m-faculte-cycles-etudes");
		await page.goBack();
		await pause(600);
	}

	// ── STEP 9: Active class cards ────────────────────────────────────────────
	// "How many classes are active this year?"
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

	// Open a class to see its makeup
	const firstClassRow = classRows.first();
	if (await firstClassRow.isVisible()) {
		await firstClassRow.click();
		await page.waitForLoadState("networkidle");
		await pause(1200);
		await capture(page, "01p-classe-detail-composition");

		await page.evaluate(() =>
			window.scrollTo({ top: 400, behavior: "smooth" }),
		);
		await pause(700);
		await capture(page, "01q-classe-detail-cours-assigns");
		await page.goBack();
		await pause(600);
	}

	// ── STEP 10: Back to the dashboard, profile menu ──────────────────────────
	await page.goto("/admin");
	await page.waitForLoadState("networkidle");
	await pause(800);
	await capture(page, "01r-retour-dashboard-fin");
});

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 2: Teacher perspective — access focused on their responsibilities
// Question: "How does a teacher navigate? What can they see or do?"
// ─────────────────────────────────────────────────────────────────────────────
test("02 - Tableau de bord enseignant : Dr. Mballa découvre ses responsabilités", async ({
	page,
}) => {
	// The teacher signs in and sees their personal space
	await loginAs(page, "teacher");
	await pause(1400);
	await capture(page, "01s-teacher-dashboard-mballa");

	// ── Teacher stats: my courses, my students, my pending exams ──────────────
	await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
	const teacherStats = page.locator('[class*="card"]:visible').first();
	if (await teacherStats.isVisible()) {
		await teacherStats.hover();
		await pause(500);
	}
	await capture(page, "01t-teacher-stats-apercu");

	// ── Their assigned courses — Human Anatomy ────────────────────────────────
	// The teacher hovers over their course card to see the summary
	const anatCard = page
		.locator('a:has-text("Anatomie"), [class*="card"]:has-text("Anatomie")')
		.first();
	if (await anatCard.isVisible()) {
		await anatCard.hover();
		await pause(700);
		await capture(page, "01u-teacher-cours-anatomie-hover");
	}

	// ── Full list of their courses ────────────────────────────────────────────
	await page.goto("/teacher/courses");
	await page.waitForLoadState("networkidle");
	await pause(1000);
	await capture(page, "01v-teacher-liste-cours");

	// Open the first course's detail
	const firstCourse = page.locator("table tbody tr, [class*='card']").first();
	if (await firstCourse.isVisible()) {
		await firstCourse.hover();
		await pause(500);
		await firstCourse.click();
		await page.waitForLoadState("networkidle");
		await pause(1200);
		await capture(page, "01w-teacher-cours-detail");

		// See the students enrolled in this course
		await page.evaluate(() =>
			window.scrollTo({ top: 400, behavior: "smooth" }),
		);
		await pause(800);
		await capture(page, "01x-teacher-cours-etudiants-inscrits");

		// See the exams linked to this course
		await page.evaluate(() =>
			window.scrollTo({ top: 800, behavior: "smooth" }),
		);
		await pause(800);
		await capture(page, "01y-teacher-cours-examens-associes");

		await page.goBack();
		await pause(600);
	}

	// ── Grade entry view (quick access from the dashboard) ────────────────────
	// The teacher goes straight to the grade entry page
	await page.goto("/teacher/grades");
	await page.waitForLoadState("networkidle");
	await pause(1200);
	await capture(page, "01z-teacher-saisie-notes-landing");

	// ── Bottom of the dashboard — calendar and notifications ──────────────────
	await page.goto("/teacher");
	await page.waitForLoadState("networkidle");
	await page.evaluate(() => window.scrollTo({ top: 600, behavior: "smooth" }));
	await pause(1000);
	await capture(page, "02a-teacher-dashboard-bas-calendrier");
});
