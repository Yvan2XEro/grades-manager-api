import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);

function ensureLruNamedExport() {
	const lruPath = require.resolve("lru-cache");
	const source = readFileSync(lruPath, "utf8");
	if (!source.includes("module.exports.LRUCache")) {
		writeFileSync(lruPath, `${source}\nmodule.exports.LRUCache = LRUCache;\n`, "utf8");
	}
}

function ensureWhatwgWrapper() {
	const whatwgMain = require.resolve("whatwg-url");
	const pkgRoot = path.resolve(path.dirname(whatwgMain), "..");
	const wrapperPath = path.join(pkgRoot, "webidl2js-wrapper.js");
	if (!existsSync(wrapperPath)) {
		const content = `"use strict";\nconst URL = require("./lib/URL.js");\nconst URLSearchParams = require("./lib/URLSearchParams.js");\nmodule.exports = { URL, URLSearchParams };\n`;
		writeFileSync(wrapperPath, content, "utf8");
	}
}

export default async function globalSetup() {
	ensureLruNamedExport();
	ensureWhatwgWrapper();
}
