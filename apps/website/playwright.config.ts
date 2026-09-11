import { defineConfig, devices } from "@playwright/test";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
import "dotenv/config";

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
	testDir: "./tests/e2e",
	/* Fail the build on CI if you accidentally left test.only in the source code. */
	forbidOnly: !!process.env.CI,
	/* Retry on CI only */
	retries: process.env.CI ? 2 : 0,
	/* Opt out of parallel tests on CI. */
	workers: process.env.CI ? 1 : undefined,
	/* Reporter to use. See https://playwright.dev/docs/test-reporters */
	reporter: "html",
	/* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
	use: {
		/* Base URL to use in actions like `await page.goto('/')`. */
		baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",

		/**
		 * The marketing demos drive themselves: `src/marketing/demos/ghost.tsx`
		 * runs a scripted "ghost cursor" walkthrough 500ms after a demo scrolls
		 * into view, mutating the demo's own state without any user action. That
		 * bail-out is keyed on `prefers-reduced-motion`, so forcing it here is what
		 * makes demo screenshots deterministic. Do not remove.
		 *
		 * Set via `contextOptions` because this Playwright version does not expose
		 * `reducedMotion` as a top-level `use` option.
		 */
		contextOptions: {
			reducedMotion: "reduce",
		},

		/* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
		trace: "on-first-retry",
	},
	/**
	 * Demo non-regression tolerance (refonte brief §6.3): a demo is "identical"
	 * if at most 0.1% of its pixels differ.
	 */
	expect: {
		toHaveScreenshot: {
			maxDiffPixelRatio: 0.001,
		},
	},
	projects: [
		{
			name: "chromium",
			testDir: "./tests/e2e",
			use: { ...devices["Desktop Chrome"], channel: "chromium" },
		},
		{
			name: "demos",
			testDir: "./tests/demos",
			use: {
				...devices["Desktop Chrome"],
				channel: "chromium",
				// Pinned so baselines stay comparable across machines.
				viewport: { width: 1280, height: 900 },
				deviceScaleFactor: 1,
			},
		},
	],
	webServer: {
		command: "pnpm dev",
		reuseExistingServer: true,
		url: "http://localhost:3000",
	},
});
