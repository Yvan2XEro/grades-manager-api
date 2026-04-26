#!/bin/sh
set -eu

bun -e '
	const { writeFileSync } = require("node:fs");

	const config = {
		serverUrl: process.env.SERVER_PUBLIC_URL ?? process.env.VITE_SERVER_URL ?? "",
		defaultOrganizationSlug:
			process.env.DEFAULT_ORGANIZATION_SLUG ??
			process.env.VITE_DEFAULT_ORGANIZATION_SLUG ??
			"",
	};

	writeFileSync(
		"/app/dist/runtime-config.js",
		`window.__APP_CONFIG__ = ${JSON.stringify(config, null, 2)};\n`,
		"utf8",
	);
'

exec serve -s dist -l "${PORT:-4173}"
