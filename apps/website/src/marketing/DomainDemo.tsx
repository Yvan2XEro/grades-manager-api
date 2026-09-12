"use client";

import type { Dict, Locale } from "@/i18n";
import { DeliberationDemo } from "./app-demo/DeliberationDemo";
import { GradeEntryDemo } from "./app-demo/GradeEntryDemo";
import { LegacyInAppWindow } from "./app-demo/LegacyInAppWindow";
import { ApprovalsDemo } from "./demos/ApprovalsDemo";
import { AttendanceDemo } from "./demos/AttendanceDemo";
import { DocExportDemo } from "./demos/DocExportDemo";
import { RulesEngineDemo } from "./demos/RulesEngineDemo";

/**
 * Mounts the live demo that belongs to a coverage domain.
 *
 * Four of these screens — attendance, approvals, document export and the rules
 * engine — were built, translated into both languages, and then left
 * unreferenced by any page. They are the strongest evidence the site has that
 * the product is deeper than nine paragraphs, so the coverage page puts them
 * back in front of the visitor.
 *
 * Grades and deliberation use the `app-demo/` pair instead of their `demos/`
 * namesakes: those reproduce the real product chrome and are what /produit and
 * the homepage already show, so the visitor sees one interface across the site
 * rather than two that disagree.
 *
 * The four legacy bodies are mounted through `LegacyInAppWindow`, which wraps
 * them in that same product shell rather than the mock browser frame they were
 * originally built with — otherwise the coverage page would show two different
 * interfaces and call both of them TKAMS.
 *
 * Each demo's own `hint` string doubles as the frame caption. Only three
 * `caption_*` keys exist in the dictionary and they belong to the homepage's
 * framing; reusing the hints keeps every caption bilingual without adding
 * dictionary entries that say the same thing twice.
 */
export function DomainDemo({
	which,
	dict,
}: {
	which:
		| "grades"
		| "deliberation"
		| "attendance"
		| "approvals"
		| "docexport"
		| "rules";
	dict: Dict;
}) {
	const d = dict.demos;
	const locale = dict.locale as Locale;

	switch (which) {
		case "grades":
			return <GradeEntryDemo caption={d.caption_grade} locale={locale} />;

		case "deliberation":
			return <DeliberationDemo caption={d.caption_delib} locale={locale} />;

		case "attendance":
			return (
				<LegacyInAppWindow
					screen="attendance"
					locale={locale}
					caption={d.attendance.hint}
				>
					<AttendanceDemo t={d.attendance} />
				</LegacyInAppWindow>
			);

		case "approvals":
			return (
				<LegacyInAppWindow
					screen="approvals"
					locale={locale}
					caption={d.approvals.hint}
				>
					<ApprovalsDemo t={d.approvals} />
				</LegacyInAppWindow>
			);

		case "docexport":
			return (
				<LegacyInAppWindow
					screen="docexport"
					locale={locale}
					caption={d.docexport.hint}
				>
					<DocExportDemo t={d.docexport} />
				</LegacyInAppWindow>
			);

		case "rules":
			return (
				<LegacyInAppWindow
					screen="rules"
					locale={locale}
					caption={d.caption_rules}
				>
					<RulesEngineDemo t={d.rules} />
				</LegacyInAppWindow>
			);
	}
}
