import "dotenv/config";
import { runSeed } from "../seed/runner";

type CliArgs = {
	foundationPath?: string;
	academicsPath?: string;
	usersPath?: string;
};

function parseArgs(argv: string[]): CliArgs {
	const args: CliArgs = {};
	for (let i = 0; i < argv.length; i++) {
		const current = argv[i];
		if (current === "--foundation" && argv[i + 1]) {
			args.foundationPath = argv[i + 1];
			i++;
		} else if (current === "--academics" && argv[i + 1]) {
			args.academicsPath = argv[i + 1];
			i++;
		} else if (current === "--users" && argv[i + 1]) {
			args.usersPath = argv[i + 1];
			i++;
		} else if (current === "--help") {
			printHelp();
			process.exit(0);
		}
	}
	return args;
}

function printHelp() {
	console.log(`Usage: bun run --filter server seed [options]

Options
  --foundation <path>   Override the foundation file (default: seed/00-foundation.yaml)
  --academics <path>    Override the academics file (default: seed/10-academics.yaml)
  --users <path>        Override the users file (default: seed/20-users.yaml)
  --help                Show this help message
`);
}

async function main() {
	const args = parseArgs(process.argv.slice(2));
	await runSeed(args);
	console.log("[seed] Completed.");
}

main().catch((error) => {
	console.error("[seed] Failed to run seed command.");
	console.error(error);
	process.exit(1);
});
