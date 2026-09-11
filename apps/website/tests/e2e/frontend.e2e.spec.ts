import { expect, test } from "@playwright/test";

test.describe("Frontend", () => {
	test("can load homepage", async ({ page }) => {
		await page.goto("/");
		await expect(page).toHaveTitle(/TKAMS/);
		const heading = page.locator("h1").first();
		await expect(heading).toBeVisible();
	});

	test("no Payload template metadata leaks into the head", async ({ page }) => {
		// Regression guard for the residual template defaults that used to ship
		// from mergeOpenGraph / generateMeta. Checked on a page that does NOT
		// define its own openGraph block, so it exercises the inherited baseline.
		await page.goto("/solutions");

		await expect(page).not.toHaveTitle(/Payload Website Template/);

		const ogSiteName = page.locator('meta[property="og:site_name"]');
		await expect(ogSiteName).toHaveAttribute("content", "TKAMS");

		const ogImage = page.locator('meta[property="og:image"]');
		await expect(ogImage).not.toHaveAttribute(
			"content",
			/website-template-OG\.webp/,
		);
	});
});
