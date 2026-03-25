#!/usr/bin/env node
/**
 * i18n Audit Script
 *
 * Scans all frontend source files for translation key usage and compares
 * against the EN and FR translation files.
 *
 * Reports:
 *  1. Keys used in code but missing from EN
 *  2. Keys used in code but missing from FR
 *  3. Keys present in EN but missing from FR
 *  4. Keys present in FR but missing from EN
 *  5. Unused keys (in translation files but never referenced in code)
 *
 * Usage: node scripts/i18n-audit.mjs [--fix-missing] [--json]
 *   --fix-missing  Copy missing keys from the other locale (value = "TODO:TRANSLATE:<original>")
 *   --json         Output results as JSON
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.cwd(), "src");
const EN_PATH = path.resolve(ROOT, "i18n/locales/en/translation.json");
const FR_PATH = path.resolve(ROOT, "i18n/locales/fr/translation.json");

const args = process.argv.slice(2);
const fixMissing = args.includes("--fix-missing");
const jsonOutput = args.includes("--json");

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Flatten nested object to dot-notation keys */
function flattenKeys(obj, prefix = "") {
	const result = {};
	for (const [key, value] of Object.entries(obj)) {
		const fullKey = prefix ? `${prefix}.${key}` : key;
		if (value && typeof value === "object" && !Array.isArray(value)) {
			Object.assign(result, flattenKeys(value, fullKey));
		} else {
			result[fullKey] = value;
		}
	}
	return result;
}

/** Recursively get all files matching extensions */
function walkDir(dir, extensions) {
	const results = [];
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			if (entry.name === "node_modules" || entry.name === "dist") continue;
			results.push(...walkDir(fullPath, extensions));
		} else if (extensions.some((ext) => entry.name.endsWith(ext))) {
			results.push(fullPath);
		}
	}
	return results;
}

/** Extract t("key") / t('key') / t(`key`) calls from source code */
function _extractKeysFromFile(filePath) {
	const content = fs.readFileSync(filePath, "utf8");
	const keys = new Set();

	// Match t("key"), t('key'), t(`key`)
	// Also match t("key", { ... }) with options
	const patterns = [
		/\bt\(\s*["'`]([a-zA-Z0-9_.]+)["'`]/g,
		/\bi18n\.t\(\s*["'`]([a-zA-Z0-9_.]+)["'`]/g,
	];

	for (const pattern of patterns) {
		let match;
		while ((match = pattern.exec(content)) !== null) {
			keys.add(match[1]);
		}
	}

	return keys;
}

/** Set a nested key in an object */
function setNestedKey(obj, dottedKey, value) {
	const parts = dottedKey.split(".");
	let current = obj;
	for (let i = 0; i < parts.length - 1; i++) {
		if (!current[parts[i]] || typeof current[parts[i]] !== "object") {
			current[parts[i]] = {};
		}
		current = current[parts[i]];
	}
	current[parts[parts.length - 1]] = value;
}

// ── Main ─────────────────────────────────────────────────────────────────────

const en = JSON.parse(fs.readFileSync(EN_PATH, "utf8"));
const fr = JSON.parse(fs.readFileSync(FR_PATH, "utf8"));

const enFlat = flattenKeys(en);
const frFlat = flattenKeys(fr);

const enKeys = new Set(Object.keys(enFlat));
const frKeys = new Set(Object.keys(frFlat));

// Scan source files
const sourceFiles = walkDir(ROOT, [".ts", ".tsx"]);
const usedKeys = new Set();
const keyLocations = new Map(); // key -> [file:line, ...]

for (const filePath of sourceFiles) {
	// Skip translation files themselves and type defs
	if (filePath.includes("/i18n/") || filePath.includes("/@types/")) continue;

	const content = fs.readFileSync(filePath, "utf8");
	const lines = content.split("\n");
	const relPath = path.relative(ROOT, filePath);

	for (let lineNum = 0; lineNum < lines.length; lineNum++) {
		const line = lines[lineNum];
		const patterns = [
			/\bt\(\s*["'`]([a-zA-Z0-9_.]+)["'`]/g,
			/\bi18n\.t\(\s*["'`]([a-zA-Z0-9_.]+)["'`]/g,
		];
		for (const pattern of patterns) {
			let match;
			while ((match = pattern.exec(line)) !== null) {
				const key = match[1];
				usedKeys.add(key);
				if (!keyLocations.has(key)) keyLocations.set(key, []);
				keyLocations.get(key).push(`${relPath}:${lineNum + 1}`);
			}
		}
	}
}

// ── Analysis ─────────────────────────────────────────────────────────────────

// Keys used in code but missing from translations
const missingFromEN = [...usedKeys].filter((k) => !enKeys.has(k)).sort();
const missingFromFR = [...usedKeys].filter((k) => !frKeys.has(k)).sort();

// Keys in one locale but not the other
const enOnlyKeys = [...enKeys].filter((k) => !frKeys.has(k)).sort();
const frOnlyKeys = [...frKeys].filter((k) => !enKeys.has(k)).sort();

// Unused keys (in translations but never referenced in code)
// Note: some keys may be referenced dynamically, so this is approximate
const unusedEN = [...enKeys].filter((k) => !usedKeys.has(k)).sort();
const unusedFR = [...frKeys].filter((k) => !usedKeys.has(k)).sort();

// ── Output ───────────────────────────────────────────────────────────────────

if (jsonOutput) {
	const report = {
		summary: {
			sourceFilesScanned: sourceFiles.length,
			uniqueKeysInCode: usedKeys.size,
			enKeys: enKeys.size,
			frKeys: frKeys.size,
		},
		missingFromEN: missingFromEN.map((k) => ({
			key: k,
			locations: keyLocations.get(k) ?? [],
		})),
		missingFromFR: missingFromFR.map((k) => ({
			key: k,
			locations: keyLocations.get(k) ?? [],
		})),
		enOnlyKeys,
		frOnlyKeys,
		unusedEN,
		unusedFR,
	};
	console.log(JSON.stringify(report, null, 2));
} else {
	const RESET = "\x1b[0m";
	const BOLD = "\x1b[1m";
	const RED = "\x1b[31m";
	const YELLOW = "\x1b[33m";
	const GREEN = "\x1b[32m";
	const CYAN = "\x1b[36m";
	const DIM = "\x1b[2m";

	console.log(`\n${BOLD}${CYAN}═══ i18n Audit Report ═══${RESET}\n`);
	console.log(`${DIM}Source files scanned:${RESET} ${sourceFiles.length}`);
	console.log(`${DIM}Unique keys found in code:${RESET} ${usedKeys.size}`);
	console.log(`${DIM}EN translation keys:${RESET} ${enKeys.size}`);
	console.log(`${DIM}FR translation keys:${RESET} ${frKeys.size}`);

	// Missing from EN (used in code but no EN translation)
	if (missingFromEN.length > 0) {
		console.log(
			`\n${BOLD}${RED}✗ Keys used in code but MISSING from EN (${missingFromEN.length}):${RESET}`,
		);
		for (const key of missingFromEN) {
			const locs = keyLocations.get(key) ?? [];
			console.log(`  ${RED}•${RESET} ${key}`);
			for (const loc of locs.slice(0, 3)) {
				console.log(`    ${DIM}${loc}${RESET}`);
			}
			if (locs.length > 3) {
				console.log(`    ${DIM}... and ${locs.length - 3} more${RESET}`);
			}
		}
	} else {
		console.log(`\n${GREEN}✓ All keys used in code exist in EN${RESET}`);
	}

	// Missing from FR (used in code but no FR translation)
	if (missingFromFR.length > 0) {
		console.log(
			`\n${BOLD}${RED}✗ Keys used in code but MISSING from FR (${missingFromFR.length}):${RESET}`,
		);
		for (const key of missingFromFR) {
			const locs = keyLocations.get(key) ?? [];
			console.log(`  ${RED}•${RESET} ${key}`);
			for (const loc of locs.slice(0, 3)) {
				console.log(`    ${DIM}${loc}${RESET}`);
			}
			if (locs.length > 3) {
				console.log(`    ${DIM}... and ${locs.length - 3} more${RESET}`);
			}
		}
	} else {
		console.log(`\n${GREEN}✓ All keys used in code exist in FR${RESET}`);
	}

	// EN-only keys (not in FR)
	if (enOnlyKeys.length > 0) {
		console.log(
			`\n${BOLD}${YELLOW}⚠ Keys in EN but NOT in FR (${enOnlyKeys.length}):${RESET}`,
		);
		for (const key of enOnlyKeys) {
			console.log(`  ${YELLOW}•${RESET} ${key}`);
		}
	} else {
		console.log(`\n${GREEN}✓ EN and FR have the same keys${RESET}`);
	}

	// FR-only keys (not in EN)
	if (frOnlyKeys.length > 0) {
		console.log(
			`\n${BOLD}${YELLOW}⚠ Keys in FR but NOT in EN (${frOnlyKeys.length}):${RESET}`,
		);
		for (const key of frOnlyKeys) {
			console.log(`  ${YELLOW}•${RESET} ${key}`);
		}
	}

	// Unused keys summary
	const unusedBoth = unusedEN.filter((k) => unusedFR.includes(k));
	if (unusedBoth.length > 0) {
		console.log(
			`\n${BOLD}${DIM}⚠ Potentially unused keys (in both EN & FR but not found in code): ${unusedBoth.length}${RESET}`,
		);
		console.log(
			`  ${DIM}Run with --json for the full list. Note: dynamically-constructed keys may appear as unused.${RESET}`,
		);
	}

	// Summary
	const hasIssues =
		missingFromEN.length > 0 ||
		missingFromFR.length > 0 ||
		enOnlyKeys.length > 0 ||
		frOnlyKeys.length > 0;

	console.log(
		`\n${BOLD}${hasIssues ? YELLOW : GREEN}${hasIssues ? "⚠ Issues found" : "✓ All good!"}${RESET}\n`,
	);

	if (hasIssues) {
		process.exitCode = 1;
	}
}

// ── Fix missing (optional) ──────────────────────────────────────────────────

if (fixMissing) {
	let enModified = false;
	let frModified = false;

	// Add missing FR keys from EN
	for (const key of enOnlyKeys) {
		const enValue = enFlat[key];
		setNestedKey(fr, key, `TODO:TRANSLATE:${enValue}`);
		frModified = true;
	}

	// Add missing EN keys from FR
	for (const key of frOnlyKeys) {
		const frValue = frFlat[key];
		setNestedKey(en, key, `TODO:TRANSLATE:${frValue}`);
		enModified = true;
	}

	if (frModified) {
		fs.writeFileSync(FR_PATH, `${JSON.stringify(fr, null, "\t")}\n`);
		console.log(
			`Updated ${path.relative(process.cwd(), FR_PATH)} — added ${enOnlyKeys.length} missing keys`,
		);
	}
	if (enModified) {
		fs.writeFileSync(EN_PATH, `${JSON.stringify(en, null, "\t")}\n`);
		console.log(
			`Updated ${path.relative(process.cwd(), EN_PATH)} — added ${frOnlyKeys.length} missing keys`,
		);
	}
	if (!frModified && !enModified) {
		console.log("No missing cross-locale keys to fix.");
	}
}
