import "dotenv/config";
import path from "node:path";
import { scaffoldSampleSeeds } from "../seed/sample-data";

type CliArgs = {
	dir?: string;
	force?: boolean;
};

function parseArgs(argv: string[]): CliArgs {
	const args: CliArgs = {};
	for (let i = 0; i < argv.length; i++) {
		const current = argv[i];
		if (current === "--dir" && argv[i + 1]) {
			args.dir = argv[i + 1];
			i++;
		} else if (current === "--force") {
			args.force = true;
		} else if (current === "--help") {
			printHelp();
			process.exit(0);
		}
	}
	return args;
}

function printHelp() {
	console.log(`Usage: bun run --filter server seed:scaffold [options]

Options
  --dir <path>    Target directory (default: $SEED_DIR or seed/local)
  --force         Overwrite existing files
  --help          Show this help message
`);
}

async function main() {
	const args = parseArgs(process.argv.slice(2));
	const baseDir =
		args.dir ?? process.env.SEED_DIR ?? path.join("seed", "local");
	const resolvedDir = path.isAbsolute(baseDir)
		? baseDir
		: path.resolve(process.cwd(), baseDir);
	await scaffoldSampleSeeds(resolvedDir, {
		force: args.force,
		logger: console,
	});
	console.log(`[seed] Sample data available in ${resolvedDir}`);
}

main().catch((error) => {
	console.error("[seed] Failed to scaffold seed files.");
	console.error(error);
	process.exit(1);
});
