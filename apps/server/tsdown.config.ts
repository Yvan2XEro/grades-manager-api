import { defineConfig } from "tsdown";

export default defineConfig({
	entry: [
		"src/index.ts",
		"src/scripts/migrate.ts",
		"src/scripts/seed.ts",
	],
	format: ["esm"],
	clean: true,
});
