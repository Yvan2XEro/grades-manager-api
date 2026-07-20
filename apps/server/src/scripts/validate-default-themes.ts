import {
	attestationClassicTheme,
	attestationThemeSchema,
} from "../modules/exports/themes/attestation-theme";
import {
	diplomaClassicTheme,
	diplomaThemeSchema,
} from "../modules/exports/themes/diploma-theme";
import {
	transcriptClassicTheme,
	transcriptThemeSchema,
} from "../modules/exports/themes/transcript-theme";

const cases = [
	["diploma", diplomaThemeSchema.safeParse(diplomaClassicTheme)],
	["transcript", transcriptThemeSchema.safeParse(transcriptClassicTheme)],
	["attestation", attestationThemeSchema.safeParse(attestationClassicTheme)],
] as const;

let exitCode = 0;
for (const [name, result] of cases) {
	if (result.success) {
		console.log(`OK ${name}`);
	} else {
		console.error(`FAIL ${name}:`);
		console.error(JSON.stringify(result.error.format(), null, 2));
		exitCode = 1;
	}
}
process.exit(exitCode);
