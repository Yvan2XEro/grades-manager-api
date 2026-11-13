/**
 * Catalogue of Handlebars variables, helpers and snippets exposed by the
 * academic-documents render context (see `apps/server/src/modules/
 * academic-documents/academic-documents.service.ts → buildRenderData`).
 *
 * Used by `CodeEditor` to power autocomplete and snippet insertion. Keep this
 * in sync with the actual render data — when a new top-level key is added in
 * the service, mirror it here so editor users get the suggestion.
 */

export type HbsCompletionEntry = {
	label: string;
	detail?: string;
	info?: string;
	apply?: string;
	type?: "variable" | "helper" | "snippet" | "block";
};

/**
 * Top-level variables. Listed as dot-paths so the completion can match what
 * the user has already typed (e.g. typing `theme.fonts.` filters to nested keys).
 */
export const HBS_VARIABLES: HbsCompletionEntry[] = [
	// theme.*
	"theme.page.size",
	"theme.page.orientation",
	"theme.page.margins.top",
	"theme.page.margins.right",
	"theme.page.margins.bottom",
	"theme.page.margins.left",
	"theme.watermark.enabled",
	"theme.watermark.text",
	"theme.watermark.color",
	"theme.watermark.textOpacity",
	"theme.watermark.logoOpacity",
	"theme.watermark.logoSize",
	"theme.watermark.textSize",
	"theme.fonts.main",
	"theme.fonts.title",
	"theme.fonts.header",
	"theme.fonts.body",
	"theme.fonts.studentName",
	"theme.fonts.studentInfo",
	"theme.fonts.signature",
	"theme.fonts.footer",
	"theme.fonts.legalText",
	"theme.fonts.mention",
	"theme.fonts.reference",
	"theme.fonts.subtitle",
	"theme.fonts.table",
	"theme.sizes.title",
	"theme.sizes.subtitle",
	"theme.sizes.header",
	"theme.sizes.content",
	"theme.sizes.body",
	"theme.sizes.studentName",
	"theme.sizes.studentInfo",
	"theme.sizes.legalText",
	"theme.sizes.footer",
	"theme.sizes.signature",
	"theme.sizes.mention",
	"theme.sizes.matricule",
	"theme.sizes.referenceNumber",
	"theme.sizes.tableHeader",
	"theme.sizes.tableBody",
	"theme.sizes.summary",
	"theme.colors.primary",
	"theme.colors.secondary",
	"theme.colors.accent",
	"theme.colors.title",
	"theme.colors.studentName",
	"theme.colors.fullName",
	"theme.colors.mention",
	"theme.colors.matricule",
	"theme.colors.diplomaTitle",
	"theme.colors.yearObtention",
	"theme.colors.juryDates",
	"theme.colors.outerBorder",
	"theme.colors.innerBorder",
	"theme.colors.border",
	"theme.colors.tableHeaderBg",
	"theme.colors.tableHeaderText",
	"theme.colors.tableBorder",
	"theme.colors.alternateRow",
	"theme.colors.passingGrade",
	"theme.colors.failingGrade",
	"theme.borders.outerWidth",
	"theme.borders.innerWidth",
	"theme.borders.decorative",
	"theme.logos.facultyLogoSize",
	"theme.logos.universityLogoSize",
	"theme.logos.ministryLogoSize",
	"theme.logos.coatOfArmsSize",
	"theme.logos.institutionLogoSize",
	"theme.qrCode.enabled",
	"theme.qrCode.compactPayload",
	"theme.qrCode.size",
	"theme.qrCode.offsetX",
	"theme.qrCode.offsetY",
	"theme.titleEffects.lineHeight",
	"theme.titleEffects.letterSpacing",
	"theme.titleEffects.shadow",
	"theme.titleEffects.shadowColor",
	"theme.titleEffects.shadowOffsetX",
	"theme.titleEffects.shadowOffsetY",
	"theme.titleEffects.shadowBlur",
	"theme.spacing.headerLineHeight",
	"theme.spacing.titleBlockMarginTop",
	"theme.spacing.titleBlockMarginBottom",
	"theme.spacing.ministerBlockMarginBottom",
	"theme.spacing.recipientBlockMarginBottom",
	"theme.spacing.signatureBlockMarginTop",
	"theme.spacing.sectionSpacing",
	"theme.spacing.bodyLineHeight",
	"theme.spacing.paragraphSpacing",
	"theme.display.bilingual",
	"theme.display.primaryLanguage",
	"theme.display.showQRCode",
	"theme.display.qrCodeSize",
	"theme.display.showSemesterBreakdown",
	"theme.display.showRanking",
	"theme.display.showRefNumber",
	"theme.display.showStamp",
	"theme.display.showSummary",
	"theme.display.showSignatures",
	"theme.table.borderWidth",
	"theme.table.rowHeight",
	"theme.table.alternateRows",
	"theme.table.showCoefficient",
	"theme.table.showCredits",
	"theme.table.showAppreciation",
	"theme.table.highlightFailures",
	"theme.table.showRowNumber",
	"theme.table.showRegistration",
	"theme.table.showGender",
	"theme.table.showBirthDate",
	"theme.table.showBirthPlace",
	"theme.table.showEmail",
	"theme.table.showPhone",
	"theme.table.showClass",
	"theme.table.showProgram",

	// country / ministry / minister
	"country.fr",
	"country.en",
	"country.mottoFr",
	"country.mottoEn",
	"ministry.fr",
	"ministry.en",
	"minister.titleFr",
	"minister.titleEn",

	// tutelles
	"university.fr",
	"university.en",
	"faculty.fr",
	"faculty.en",

	// institution
	"institution.id",
	"institution.nameFr",
	"institution.nameEn",
	"institution.abbreviation",
	"institution.contactEmail",
	"institution.postalBox",
	"institution.city",
	"institution.addressFr",
	"institution.addressEn",
	"institution.logoUrl",
	"institution.logoSvg",
	"institution.watermarkLogoUrl",
	"institution.watermarkLogoSvg",

	// center
	"center.id",
	"center.code",
	"center.name",
	"center.nameEn",
	"center.shortName",
	"center.logoUrl",
	"center.logoSvg",
	"center.adminInstanceLogoUrl",
	"center.adminInstanceLogoSvg",
	"center.watermarkLogoUrl",
	"center.watermarkLogoSvg",
	"center.authorizationOrderFr",
	"center.authorizationOrderEn",
	"center.postalBox",
	"center.contactEmail",
	"center.contactPhone",
	"center.city",
	"center.country",
	"center.administrativeInstances",
	"center.legalTexts",

	// logos (computed urls + inline SVG variants)
	"logos.institution",
	"logos.institutionSvg",
	"logos.faculty",
	"logos.facultySvg",
	"logos.university",
	"logos.universitySvg",
	"logos.ministry",
	"logos.ministrySvg",
	"logos.coatOfArms",
	"logos.coatOfArmsSvg",

	// jury / signatures
	"jury.admissionDate",
	"jury.deliberationDate",
	"jury.number",
	"signatures",
	"legalGrounds",
	"authority.name",
	"authority.role",

	// student (single)
	"student.id",
	"student.matricule",
	"student.fullName",
	"student.firstName",
	"student.lastName",
	"student.birthDate",
	"student.birthPlace",
	"student.mentionFr",
	"student.mentionEn",
	"student.option",
	"student.optionEn",

	// program / class
	"program.name",
	"program.level",
	"class.name",
	"class.code",

	// document
	"document.titleFr",
	"document.titleEn",
	"document.title",
	"document.subtitle",
	"document.referenceNumber",
	"document.issueDate",
	"document.academicYear",
	"document.yearObtention",
	"document.year",
	"document.generatedAt",

	// summary
	"summary.generalAverage",
	"summary.creditsEarned",
	"summary.creditsTotal",
	"summary.mention",
	"summary.decision",
	"summary.rank",
	"summary.classSize",
	"summary.total",
	"summary.male",
	"summary.female",

	// roster / semesters / context
	"students",
	"semesters",
	"context.class",
	"context.program",
	"context.academicYear",
	"context.cycleLevel",

	// rendering flags
	"demoMode",
	"qrCodeImage",
	"watermarkRepeat",
	"showResults",
].map((label) => ({ label, type: "variable" as const, detail: "variable" }));

/** Built-in Handlebars block helpers (use after `{{#`). */
export const HBS_BLOCK_HELPERS: HbsCompletionEntry[] = [
	{ label: "if", type: "block", detail: "if condition" },
	{ label: "unless", type: "block", detail: "unless condition" },
	{ label: "each", type: "block", detail: "iterate" },
	{ label: "with", type: "block", detail: "scope into context" },
];

/**
 * Custom helpers registered in academic-documents.service.ensureHelpers and
 * exports.service.registerHelpers. Keep in sync if you add new helpers.
 */
export const HBS_INLINE_HELPERS: HbsCompletionEntry[] = [
	{ label: "eq", detail: "(a, b) → boolean", type: "helper" },
	{ label: "gt", detail: "(a, b) → boolean", type: "helper" },
	{ label: "gte", detail: "(a, b) → boolean", type: "helper" },
	{ label: "lt", detail: "(a, b) → boolean", type: "helper" },
	{ label: "lte", detail: "(a, b) → boolean", type: "helper" },
	{ label: "add", detail: "(a, b) → number", type: "helper" },
	{ label: "subtract", detail: "(a, b) → number", type: "helper" },
	{ label: "multiply", detail: "(a, b) → number", type: "helper" },
	{ label: "divide", detail: "(a, b) → number", type: "helper" },
	{ label: "abs", detail: "(a) → number", type: "helper" },
	{ label: "mod", detail: "(a, b) → number", type: "helper" },
	{ label: "upper", detail: "(s) → string", type: "helper" },
	{ label: "lower", detail: "(s) → string", type: "helper" },
	{
		label: "formatNumber",
		detail: "(n, decimals?=2) → string",
		type: "helper",
	},
	{
		label: "getAppreciation",
		detail: "(score) → mention",
		type: "helper",
	},
	{
		label: "or",
		detail: "(...args) → boolean — true if any arg is truthy",
		type: "helper",
	},
	{
		label: "logo",
		detail:
			"(svg=, url=, alt?, class?, style?) → renders inline SVG if set, else <img src=url>",
		type: "helper",
	},
];

/** Insertable snippets — applied with cursor positioning via `${}` markers. */
export const HBS_SNIPPETS: HbsCompletionEntry[] = [
	{
		label: "if",
		type: "snippet",
		detail: "{{#if cond}}…{{/if}}",
		apply: "{{#if condition}}\n\t${0}\n{{/if}}",
	},
	{
		label: "ifelse",
		type: "snippet",
		detail: "{{#if}}…{{else}}…{{/if}}",
		apply: "{{#if condition}}\n\t${0}\n{{else}}\n\t\n{{/if}}",
	},
	{
		label: "each",
		type: "snippet",
		detail: "{{#each items}}…{{/each}}",
		apply: "{{#each items}}\n\t${0}\n{{/each}}",
	},
	{
		label: "unless",
		type: "snippet",
		detail: "{{#unless cond}}…{{/unless}}",
		apply: "{{#unless condition}}\n\t${0}\n{{/unless}}",
	},
	{
		label: "header-bilingual",
		type: "snippet",
		detail: "En-tête 3 colonnes (FR + armoiries + EN)",
		apply: `<div class="header">
	<div class="header-text">
		<div class="country">{{country.fr}}</div>
		<div class="motto">{{country.mottoFr}}</div>
		<div class="institution">{{ministry.fr}}</div>
		<div class="institution">{{university.fr}}</div>
		<div class="faculty">{{faculty.fr}}</div>
	</div>
	{{#if (or logos.coatOfArmsSvg logos.coatOfArms)}}<div class="coat-of-arms">{{{logo svg=logos.coatOfArmsSvg url=logos.coatOfArms alt=""}}}</div>{{/if}}
	{{#if theme.display.bilingual}}
	<div class="header-text">
		<div class="country">{{country.en}}</div>
		<div class="motto">{{country.mottoEn}}</div>
		<div class="institution">{{ministry.en}}</div>
		<div class="institution">{{university.en}}</div>
		<div class="faculty">{{faculty.en}}</div>
	</div>
	{{/if}}
</div>`,
	},
	{
		label: "header-center",
		type: "snippet",
		detail: "En-tête variante Centre (institution + center)",
		apply: `<div class="header">
	<div class="header-block">
		<div class="institution-name">{{institution.nameFr}}</div>
		{{#if institution.contactEmail}}<div class="meta">Email: {{institution.contactEmail}}</div>{{/if}}
	</div>
	<div class="header-center">
		{{{logo svg=center.logoSvg url=center.logoUrl alt="Centre"}}}
	</div>
	<div class="header-block">
		{{#if center.name}}
			<div class="institution-name">{{center.name}}</div>
			{{#if center.code}}<div class="meta">Code: {{center.code}}</div>{{/if}}
			{{#if center.contactEmail}}<div class="meta">{{center.contactEmail}}</div>{{/if}}
		{{/if}}
	</div>
</div>`,
	},
	{
		label: "students-table",
		type: "snippet",
		detail: "Tableau roster d'étudiants",
		apply: `<table>
	<thead>
		<tr>
			<th>N°</th>
			<th>Matricule</th>
			<th>Nom</th>
			<th>Prénom(s)</th>
		</tr>
	</thead>
	<tbody>
		{{#each students}}
		<tr>
			<td>{{this.number}}</td>
			<td>{{this.registrationNumber}}</td>
			<td>{{this.lastName}}</td>
			<td>{{this.firstName}}</td>
		</tr>
		{{/each}}
	</tbody>
</table>`,
	},
	{
		label: "signatures-3",
		type: "snippet",
		detail: "Bloc 3 signatures (impétrant / recteur / ministre)",
		apply: `<div class="signature-section">
	{{#each signatures}}
	<div class="signature-box{{#if this.minister}} minister{{/if}}">
		<div class="signature-title">{{this.fr}}</div>
		{{#if ../theme.display.bilingual}}<div class="signature-title-en"><em>{{this.en}}</em></div>{{/if}}
	</div>
	{{/each}}
</div>`,
	},
	{
		label: "watermark-block",
		type: "snippet",
		detail: "Bloc filigrane (logo + texte)",
		apply: `<div class="watermark">
	{{{logo svg=institution.watermarkLogoSvg url=institution.watermarkLogoUrl alt=""}}}
	<div class="watermark-text">{{theme.watermark.text}}</div>
</div>`,
	},
];
