import { describe, expect, it, setDefaultTimeout } from "bun:test";
import Handlebars from "handlebars";
import { defaultExportConfig } from "@/config/export-config";
import type { MentionRange } from "@/db/schema/app-schema";
import { DEFAULT_MENTION_RANGES } from "@/db/schema/app-schema";
import {
	getAppreciation,
	getObservation,
	loadTemplate,
	logoHelper,
	mentionRangesToAppreciations,
} from "../template-helper";

setDefaultTimeout(60_000);

// Minimal template that mirrors the live pattern in transcript/releve templates.
const APPRECIATION_TPL = `{{#each grading.appreciations}}<row grade="{{gradeLetter}}" label="{{label}}" min="{{min}}" max="{{max}}"/>{{/each}}`;

function buildGradingBlock(ranges: MentionRange[]) {
	const sorted = [...ranges].sort((a, b) => b.min - a.min);
	return {
		appreciations: sorted.map((r, i) => ({
			label: r.label,
			labelEn: r.labelEn,
			gradeLetter: r.gradeLetter,
			min: r.min,
			max: i === 0 ? 20 : Math.round((sorted[i - 1].min - 0.01) * 100) / 100,
		})),
		passing_grade: 10,
		scale: 20,
	};
}

function render(tpl: string, data: unknown): string {
	return Handlebars.compile(tpl)(data);
}

describe("mentionRangesToAppreciations", () => {
	it("derives correct max from adjacent min boundaries", () => {
		const result = mentionRangesToAppreciations(DEFAULT_MENTION_RANGES);
		// Default: excellent(18) > tres_bien(16) > bien(14) > assez_bien(12) > passable(10)
		expect(result).toHaveLength(5);
		expect(result[0]).toMatchObject({ min: 18, max: 20 });
		expect(result[1]).toMatchObject({ min: 16, max: 17.99 });
		expect(result[2]).toMatchObject({ min: 14, max: 15.99 });
		expect(result[3]).toMatchObject({ min: 12, max: 13.99 });
		expect(result[4]).toMatchObject({ min: 10, max: 11.99 });
	});
});

describe("grading.appreciations — dynamic template rendering", () => {
	it("renders all default appreciation rows with correct labels and ranges", () => {
		const html = render(APPRECIATION_TPL, {
			grading: buildGradingBlock(DEFAULT_MENTION_RANGES),
		});

		expect(html).toContain('label="Excellent"');
		expect(html).toContain('label="Très Bien"');
		expect(html).toContain('label="Passable"');
		expect(html).toContain('min="18"');
		expect(html).toContain('max="20"');

		const rows = html.match(/<row /g) ?? [];
		expect(rows).toHaveLength(DEFAULT_MENTION_RANGES.length);
	});

	it("renders custom institution scale instead of hardcoded defaults", () => {
		const customRanges: MentionRange[] = [
			{
				key: "mention_honorable",
				label: "Mention Honorable",
				labelEn: "With Honours",
				gradeLetter: "A",
				min: 16,
			},
			{
				key: "satisfaisant",
				label: "Satisfaisant",
				labelEn: "Satisfactory",
				gradeLetter: "B",
				min: 12,
			},
			{
				key: "passable",
				label: "Passable",
				labelEn: "Pass",
				gradeLetter: "C",
				min: 10,
			},
		];

		const html = render(APPRECIATION_TPL, {
			grading: buildGradingBlock(customRanges),
		});

		expect(html).toContain('label="Mention Honorable"');
		expect(html).toContain('label="Satisfaisant"');
		expect(html).toContain('grade="A"');
		expect(html).toContain('min="16"');
		expect(html).toContain('max="20"');

		// Proves it's dynamic — none of the standard labels appear
		expect(html).not.toContain("Excellent");
		expect(html).not.toContain("Très Bien");
		expect(html).not.toContain("Bien");

		const rows = html.match(/<row /g) ?? [];
		expect(rows).toHaveLength(3);
	});

	it("includes gradeLetter for every range", () => {
		const html = render(APPRECIATION_TPL, {
			grading: buildGradingBlock(DEFAULT_MENTION_RANGES),
		});

		for (const r of DEFAULT_MENTION_RANGES) {
			expect(html).toContain(`grade="${r.gradeLetter}"`);
		}
	});

	it("max of top range is always scale ceiling (20)", () => {
		const customTopMin = 15;
		const ranges: MentionRange[] = [
			{
				key: "top",
				label: "Top",
				labelEn: "Top",
				gradeLetter: "A",
				min: customTopMin,
			},
			{
				key: "base",
				label: "Base",
				labelEn: "Base",
				gradeLetter: "B",
				min: 10,
			},
		];
		const html = render(APPRECIATION_TPL, {
			grading: buildGradingBlock(ranges),
		});
		expect(html).toContain(`min="${customTopMin}" max="20"`);
	});
});

// ─── Register Handlebars helpers (mirrors academic-documents.service.ts) ─────
// Helpers are registered once without importing the service (avoids puppeteer).
let _helpersRegistered = false;
function ensureRealTemplateHelpers() {
	if (_helpersRegistered) return;
	Handlebars.registerHelper("eq", (a: unknown, b: unknown) => a === b);
	Handlebars.registerHelper(
		"gt",
		(a: unknown, b: unknown) => Number(a) > Number(b),
	);
	Handlebars.registerHelper(
		"gte",
		(a: unknown, b: unknown) => Number(a) >= Number(b),
	);
	Handlebars.registerHelper(
		"lt",
		(a: unknown, b: unknown) => Number(a) < Number(b),
	);
	Handlebars.registerHelper(
		"lte",
		(a: unknown, b: unknown) => Number(a) <= Number(b),
	);
	Handlebars.registerHelper(
		"add",
		(a: unknown, b: unknown) => Number(a) + Number(b),
	);
	Handlebars.registerHelper(
		"subtract",
		(a: unknown, b: unknown) => Number(a) - Number(b),
	);
	Handlebars.registerHelper(
		"multiply",
		(a: unknown, b: unknown) => Number(a) * Number(b),
	);
	Handlebars.registerHelper("divide", (a: unknown, b: unknown) =>
		Number(b) === 0 ? 0 : Number(a) / Number(b),
	);
	Handlebars.registerHelper("abs", (a: unknown) => Math.abs(Number(a)));
	Handlebars.registerHelper(
		"mod",
		(a: unknown, b: unknown) => Number(a) % Number(b),
	);
	Handlebars.registerHelper("upper", (a: unknown) =>
		String(a ?? "").toUpperCase(),
	);
	Handlebars.registerHelper("lower", (a: unknown) =>
		String(a ?? "").toLowerCase(),
	);
	Handlebars.registerHelper(
		"formatNumber",
		(value: unknown, decimals: unknown = 2) => {
			if (value === null || value === undefined || value === "") return "—";
			const n = Number(value);
			if (!Number.isFinite(n)) return "—";
			const d =
				typeof decimals === "number" && Number.isFinite(decimals)
					? decimals
					: 2;
			return n.toFixed(d).replace(".", ",");
		},
	);
	Handlebars.registerHelper("or", (...args: unknown[]) =>
		args.slice(0, -1).some((v) => Boolean(v)),
	);
	Handlebars.registerHelper("logo", logoHelper);
	Handlebars.registerHelper("getAppreciation", (score: number) =>
		getAppreciation(score ?? 0, defaultExportConfig),
	);
	Handlebars.registerHelper("getObservation", (score: number | null) =>
		getObservation(score, defaultExportConfig),
	);
	_helpersRegistered = true;
}

describe("real bundled templates — grading.appreciations wired end-to-end (JVL-42)", () => {
	it("transcript template renders all default appreciation labels", () => {
		ensureRealTemplateHelpers();
		const body = loadTemplate("transcript", "standard", "institution");
		// Minimal data: only grading block populated; Handlebars treats missing props as empty.
		const html = Handlebars.compile(body)({
			grading: buildGradingBlock(DEFAULT_MENTION_RANGES),
		});
		for (const r of DEFAULT_MENTION_RANGES) {
			expect(html).toContain(r.label);
		}
	});

	it("enrollment_certificate bundled template compiles without errors", () => {
		ensureRealTemplateHelpers();
		const body = loadTemplate(
			"enrollment_certificate",
			"standard",
			"institution",
		);
		expect(body).not.toContain("<!-- No bundled template -->");
		// The certificate template has no appreciation legend, but must compile cleanly.
		const html = Handlebars.compile(body)({
			grading: buildGradingBlock(DEFAULT_MENTION_RANGES),
		});
		expect(html.trim().length).toBeGreaterThan(100);
	});

	it("custom mention ranges propagate into the real transcript template", () => {
		ensureRealTemplateHelpers();
		const custom: MentionRange[] = [
			{
				key: "honneurs",
				label: "Avec Honneurs",
				labelEn: "With Honours",
				gradeLetter: "A",
				min: 16,
			},
			{
				key: "bien",
				label: "Bien",
				labelEn: "Good",
				gradeLetter: "B",
				min: 12,
			},
			{
				key: "passable",
				label: "Passable",
				labelEn: "Pass",
				gradeLetter: "C",
				min: 10,
			},
		];
		const body = loadTemplate("transcript", "standard", "institution");
		const html = Handlebars.compile(body)({
			grading: buildGradingBlock(custom),
		});
		expect(html).toContain("Avec Honneurs");
		expect(html).toContain("Passable");
		// Default labels must NOT appear (proves dynamic substitution)
		expect(html).not.toContain("Très Bien");
		expect(html).not.toContain("Excellent");
	});
});
