import localFont from "next/font/local";

/*
 * The fonts are bundled with the site (variable WOFF2, latin subset, SIL Open
 * Font License) instead of being fetched from Google Fonts at build time: the
 * build no longer depends on the network of the machine that runs it, which
 * made the Docker build fail in CI. The latin subset covers French (é, à, ç,
 * œ, « », €). To update a font, download the latin variable WOFF2 from
 * fonts.googleapis.com/css2?family=<Family>:wght@<min>..<max>.
 */

/**
 * Headings and figures.
 *
 * Funnel Display is narrower and more sharply cut than Sora, so the long
 * French headlines this site carries fit on fewer lines without dropping a
 * size step, and its figures read more decisively in the estimator and the
 * pricing tables.
 */
export const funnelDisplay = localFont({
	src: "./funnel-display-latin-variable.woff2",
	weight: "400 800",
	variable: "--font-display-family",
	display: "swap",
});

/**
 * Body and interface text.
 *
 * Montserrat is geometric where Inter is neutral, which gives the running
 * text the same constructed feel as the Funnel Display headings. Weights up
 * to 700 are used because Montserrat's 600 is noticeably lighter than
 * Inter's at the same nominal weight.
 */
export const montserrat = localFont({
	src: "./montserrat-latin-variable.woff2",
	weight: "400 700",
	variable: "--font-body-family",
	display: "swap",
});

export const jetbrainsMono = localFont({
	src: "./jetbrains-mono-latin-variable.woff2",
	weight: "400 500",
	variable: "--font-jetbrains-mono",
	display: "swap",
});
