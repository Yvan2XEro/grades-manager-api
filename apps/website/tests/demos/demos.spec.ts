import { expect, type Locator, type Page, test } from "@playwright/test";

/**
 * Visual non-regression baselines for the six interactive marketing demos.
 *
 * These exist so a visual refonte can prove it did not disturb the demos. The
 * refonte is allowed to restyle the *frame* around a demo (DemoFrame chrome,
 * shadows, entrance motion); it is not allowed to change what is inside it.
 *
 * That is why every screenshot below is scoped to the DemoFrame's BODY — the
 * element that holds the demo itself — and never to the figure/chrome. A frame
 * restyle must not churn these baselines; a change inside a demo must.
 *
 * Determinism notes:
 *  - `reducedMotion: "reduce"` is set globally in playwright.config.ts. Without
 *    it `src/marketing/demos/ghost.tsx` starts a scripted cursor walkthrough
 *    500ms after each demo enters the viewport and mutates the demo's state
 *    mid-capture. Every baseline here depends on that opt-out.
 *  - Demos are client components rendered inside a server page, so we wait for
 *    an interactive control to be attached before touching anything.
 */

const DEMO_BODY = ".bg-tk-bg";

/** The scroll container inside a DemoFrame that actually holds the demo. */
function demoBody(page: Page, url: string): Locator {
	return page
		.locator("figure")
		.filter({ hasText: url })
		.locator(DEMO_BODY)
		.first();
}

/**
 * Screenshots settle better once fonts are done swapping — next/font uses
 * `display: swap`, so an early capture can catch the fallback face.
 */
async function ready(page: Page, body: Locator) {
	await page.evaluate(() => document.fonts.ready);
	await expect(body).toBeVisible();
}

test.describe("Demo visual baselines", () => {
	test.describe("homepage", () => {
		test("saisie — initial and after editing a grade", async ({ page }) => {
			await page.goto("/");
			const body = demoBody(page, "app.tkams.com/saisie");
			await ready(page, body);

			await expect(body).toHaveScreenshot("saisie-initial.png");

			// Fill the two blanks the ghost script would have filled, so the
			// average, the decision chip and the progress bar all recompute.
			await body.locator('[data-cursor="cc-4"]').fill("12");
			await body.locator('[data-cursor="exam-4"]').fill("14");
			await body.locator('[data-cursor="exam-5"]').fill("9");
			await expect(body).toHaveScreenshot("saisie-interacted.png");
		});

		test("regles — initial and after toggling compensation", async ({
			page,
		}) => {
			await page.goto("/");
			const body = demoBody(page, "app.tkams.com/regles");
			await ready(page, body);

			await expect(body).toHaveScreenshot("regles-initial.png");

			await body.locator('[data-cursor="comp"]').click();
			await expect(body).toHaveScreenshot("regles-interacted.png");
		});

		test("deliberations — initial and after running to signature", async ({
			page,
		}) => {
			await page.goto("/");
			const body = demoBody(page, "app.tkams.com/deliberations");
			await ready(page, body);

			await expect(body).toHaveScreenshot("deliberations-initial.png");

			// The stepper advances on 750ms timers and ends on the signed state,
			// which swaps the body for the stats grid. Wait for that end state
			// rather than sleeping a fixed amount.
			await body.locator('[data-cursor="run"]').click();
			await expect(body.locator('[data-cursor="run"]')).toBeHidden({
				timeout: 15_000,
			});
			await expect(body).toHaveScreenshot("deliberations-signed.png");
		});
	});

	test.describe("solutions", () => {
		test("presences — initial and after flagging a student", async ({
			page,
		}) => {
			await page.goto("/solutions");
			const body = demoBody(page, "app.tkams.com/presences");
			await ready(page, body);

			await expect(body).toHaveScreenshot("presences-initial.png");

			await body.locator('[data-cursor="flag-3"]').click();
			await expect(body).toHaveScreenshot("presences-interacted.png");
		});

		test("validations — initial and after approving all", async ({ page }) => {
			await page.goto("/solutions");
			const body = demoBody(page, "app.tkams.com/validations");
			await ready(page, body);

			await expect(body).toHaveScreenshot("validations-initial.png");

			await body.locator('[data-cursor="rej-3"]').click();
			await body.locator('[data-cursor="all"]').click();
			await expect(body).toHaveScreenshot("validations-interacted.png");
		});

		test("documents — initial and after generating an attestation", async ({
			page,
		}) => {
			await page.goto("/solutions");
			const body = demoBody(page, "app.tkams.com/documents");
			await ready(page, body);

			await expect(body).toHaveScreenshot("documents-initial.png");

			await body.locator('[data-cursor="tab-attestation"]').click();
			await body.locator('[data-cursor="gen"]').click();
			await expect(body).toHaveScreenshot("documents-generated.png");
		});
	});
});
