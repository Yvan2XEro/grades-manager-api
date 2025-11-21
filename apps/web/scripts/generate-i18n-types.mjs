#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const translationPath = path.resolve(
	process.cwd(),
	"src/i18n/locales/en/translation.json",
);
const resourcesPath = path.resolve(
	process.cwd(),
	"src/@types/resources.d.ts",
);

const indent = (level) => "\t".repeat(level);

const formatObject = (object, depth = 2) => {
	const lines = ["{"];
	for (const [key, value] of Object.entries(object)) {
		if (value && typeof value === "object" && !Array.isArray(value)) {
			lines.push(
				`${indent(depth)}${key}: ${formatObject(value, depth + 1)}`,
			);
			continue;
		}
		if (Array.isArray(value)) {
			throw new Error(
				`Unexpected array value for key "${key}" in the translation file.`,
			);
		}
		lines.push(`${indent(depth)}${key}: ${JSON.stringify(value)};`);
	}
	lines.push(`${indent(depth - 1)}};`);
	return lines.join("\n");
};

const translation = JSON.parse(fs.readFileSync(translationPath, "utf8"));
const output = `interface Resources {\n\ttranslation: ${formatObject(
	translation,
)}\n}\n\nexport default Resources;\n`;

fs.writeFileSync(resourcesPath, output);
console.log(`Updated ${resourcesPath} from ${translationPath}`);
