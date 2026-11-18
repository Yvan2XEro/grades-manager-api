// TKAMS brand tokens — hex values for email client compatibility (no oklch)
export const colors = {
	primary: "#6160FF",
	primaryDeep: "#4A49D4",
	primarySoft: "#F0EFFF",
	accent: "#FA6E1D",
	dark: "#1C1B38",
	darkSecondary: "#2B2950",
	ink: "#151428",
	inkSoft: "#2E2C50",
	muted: "#7B7B96",
	bg: "#FFFFFF",
	bgDeep: "#F5F5FB",
	border: "#E6E6EF",
	white: "#FFFFFF",
};

// Inline base64 — always works in any email client, no external URL dependency
export const LOGO_URL = "https://s3.overbrand.net/statics/tkams-logo.png";

export const WEBSITE_URL = process.env.WEBSITE_URL ?? "https://tkams.com";
