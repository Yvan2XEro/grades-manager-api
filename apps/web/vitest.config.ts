import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
			// Force all packages to resolve to the same React instance.
			// CJS packages (react-dom, @radix-ui) resolve React from the
			// workspace root; ESM imports via Vite must point there too.
			react: path.resolve(__dirname, "../../node_modules/react"),
			"react-dom": path.resolve(__dirname, "../../node_modules/react-dom"),
		},
		dedupe: ["react", "react-dom"],
	},
	test: {
		globals: true,
		environment: "jsdom",
		setupFiles: ["./src/setupTests.ts"],
		globalSetup: ["./vitest.global-setup.ts"],
		server: {
			deps: {
				// Inline all react-* packages + framer-motion so every module
				// goes through the same Vite transform and resolves to a single
				// React instance (prevents "duplicate React" hook call errors).
				inline: [/react/, "framer-motion"],
			},
		},
	},
});
