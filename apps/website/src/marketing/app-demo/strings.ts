import type { Locale } from "@/i18n";

/**
 * Interface strings for the product demos.
 *
 * These live here rather than in `src/i18n/{fr,en}.ts` because they are not
 * marketing copy: they are the application's own chrome — menu entries, column
 * headers, jury decisions, button labels — and they must stay in step with what
 * `apps/web` actually displays. Keeping them beside the components that render
 * them means a product rename changes one file, not two dictionaries.
 *
 * The demos previously hard-coded every one of these in French, so switching
 * the site to English left the screens untranslated while the captions around
 * them changed — the one place on the page where the illusion broke.
 *
 * The product ships a bilingual interface, so a French visitor sees the French
 * application and an English visitor sees the English one. That is accurate:
 * "Interface FR/EN nativement" is a claim the proposal makes, and the demos are
 * now the proof of it.
 */

export type DemoStrings = {
	/** Sidebar group headings. */
	groups: {
		overview: string;
		people: string;
		teaching: string;
		assessment: string;
		rules: string;
		documents: string;
	};
	/** Sidebar entries. */
	nav: {
		dashboard: string;
		students: string;
		courses: string;
		attendance: string;
		grades: string;
		exams: string;
		approvals: string;
		deliberations: string;
		juryRules: string;
		promotion: string;
		officialDocs: string;
		exportTemplates: string;
	};
	/** Header and window chrome. */
	chrome: {
		admin: string;
		teacher: string;
		search: string;
		institution: string;
		muteSound: string;
		unmuteSound: string;
	};
	/** Grade entry screen. */
	grades: {
		title: string;
		context: string;
		exam: string;
		examValue: string;
		weights: string;
		scale: string;
		student: string;
		cc: string;
		final: string;
		average: string;
		status: string;
		passed: string;
		resit: string;
		save: string;
		saved: string;
		classAverage: string;
		passingOf: (passing: number, total: number) => string;
		hint: string;
		savedHint: string;
		ariaCc: (name: string) => string;
		ariaExam: (name: string) => string;
	};
	/** Deliberation screen. */
	delib: {
		title: string;
		session: string;
		rulesHeading: string;
		open: string;
		closed: string;
		threshold: string;
		eliminating: string;
		compensation: string;
		enabled: string;
		disabled: string;
		admitted: string;
		resit: string;
		deferred: string;
		student: string;
		average: string;
		lowestMark: string;
		credits: string;
		decision: string;
		sign: string;
		signed: string;
		ruleApplied: string;
		ruleLine: (a: {
			threshold: string;
			eliminating: string;
			compensation: boolean;
			count: number;
			signed: boolean;
		}) => string;
		reasons: {
			eliminating: (mark: string) => string;
			compensated: string;
			averageOk: string;
			belowThreshold: string;
			farBelow: string;
		};
	};
	/** Screens borrowed by `LegacyInAppWindow`. */
	screens: {
		attendance: string;
		approvals: string;
		officialDocs: string;
		juryRules: string;
	};
};

const fr: DemoStrings = {
	groups: {
		overview: "Vue d'ensemble",
		people: "Personnes",
		teaching: "Enseignement",
		assessment: "Évaluations",
		rules: "Règles & promotion",
		documents: "Documents",
	},
	nav: {
		dashboard: "Tableau de bord",
		students: "Étudiants",
		courses: "Mes cours",
		attendance: "Assiduité",
		grades: "Notes",
		exams: "Examens",
		approvals: "Validations",
		deliberations: "Délibérations",
		juryRules: "Règles de jury",
		promotion: "Promotion",
		officialDocs: "Documents officiels",
		exportTemplates: "Modèles d'export",
	},
	chrome: {
		admin: "Administration",
		teacher: "Enseignant",
		search: "Rechercher…",
		institution: "Institut Supérieur",
		muteSound: "Couper les sons de la démo",
		unmuteSound: "Rétablir les sons de la démo",
	},
	grades: {
		title: "Saisie des notes",
		context: "UE-SANTE-1 / ANAT101 · BTS 1re année",
		exam: "Examen",
		examValue: "Anatomie humaine · ANAT101",
		weights: "CC 40 % · Examen 60 %",
		scale: "Barème sur 20",
		student: "Étudiant",
		cc: "CC",
		final: "Examen",
		average: "Moyenne",
		status: "Statut",
		passed: "Validé",
		resit: "Rattrapage",
		save: "Enregistrer",
		saved: "Enregistré",
		classAverage: "Moyenne de classe",
		passingOf: (p, t) => `${p} validés sur ${t}`,
		hint: "Modifiez une note : tout se recalcule.",
		savedHint: "Notes enregistrées.",
		ariaCc: (name) => `Note de contrôle continu — ${name}`,
		ariaExam: (name) => `Note d'examen — ${name}`,
	},
	delib: {
		title: "Délibération · L2 Informatique",
		session: "Session normale",
		rulesHeading: "Règles de délibération",
		open: "Séance ouverte",
		closed: "Séance clôturée",
		threshold: "Seuil d'admission",
		eliminating: "Note éliminatoire",
		compensation: "Compensation inter-UE",
		enabled: "Activée",
		disabled: "Désactivée",
		admitted: "Admis",
		resit: "Rattrapage",
		deferred: "Ajourné",
		student: "Étudiant",
		average: "Moyenne",
		lowestMark: "Note la + basse",
		credits: "ECTS",
		decision: "Décision",
		sign: "Clôturer et signer",
		signed: "PV signé",
		ruleApplied: "Règle appliquée ·",
		ruleLine: ({ threshold, eliminating, compensation, count, signed }) =>
			`seuil ${threshold} · éliminatoire < ${eliminating} · compensation ${
				compensation ? "activée" : "désactivée"
			} — ${count} dossiers réévalués instantanément${
				signed ? " · procès-verbal signé et horodaté." : "."
			}`,
		reasons: {
			eliminating: (mark) => `note éliminatoire (${mark})`,
			compensated: "compensation appliquée",
			averageOk: "moyenne validée",
			belowThreshold: "sous le seuil",
			farBelow: "écart trop important",
		},
	},
	screens: {
		attendance: "Assiduité",
		approvals: "Validations de notes",
		officialDocs: "Documents officiels",
		juryRules: "Règles de jury",
	},
};

const en: DemoStrings = {
	groups: {
		overview: "Overview",
		people: "People",
		teaching: "Teaching",
		assessment: "Assessment",
		rules: "Rules & progression",
		documents: "Documents",
	},
	nav: {
		dashboard: "Dashboard",
		students: "Students",
		courses: "My courses",
		attendance: "Attendance",
		grades: "Grades",
		exams: "Exams",
		approvals: "Approvals",
		deliberations: "Deliberations",
		juryRules: "Jury rules",
		promotion: "Progression",
		officialDocs: "Official documents",
		exportTemplates: "Export templates",
	},
	chrome: {
		admin: "Administration",
		teacher: "Teacher",
		search: "Search…",
		institution: "Institut Supérieur",
		muteSound: "Mute the demo sounds",
		unmuteSound: "Unmute the demo sounds",
	},
	grades: {
		title: "Grade entry",
		context: "UE-SANTE-1 / ANAT101 · 1st year",
		exam: "Exam",
		examValue: "Human anatomy · ANAT101",
		weights: "CA 40 % · Exam 60 %",
		scale: "Marked out of 20",
		student: "Student",
		cc: "CA",
		final: "Exam",
		average: "Average",
		status: "Status",
		passed: "Passed",
		resit: "Resit",
		save: "Save",
		saved: "Saved",
		classAverage: "Class average",
		passingOf: (p, t) => `${p} passing of ${t}`,
		hint: "Change a mark: everything recomputes.",
		savedHint: "Marks saved.",
		ariaCc: (name) => `Continuous assessment mark — ${name}`,
		ariaExam: (name) => `Exam mark — ${name}`,
	},
	delib: {
		title: "Deliberation · L2 Computer Science",
		session: "Normal session",
		rulesHeading: "Deliberation rules",
		open: "Session open",
		closed: "Session closed",
		threshold: "Pass threshold",
		eliminating: "Eliminating mark",
		compensation: "Cross-unit compensation",
		enabled: "Enabled",
		disabled: "Disabled",
		admitted: "Passed",
		resit: "Resit",
		deferred: "Deferred",
		student: "Student",
		average: "Average",
		lowestMark: "Lowest mark",
		credits: "ECTS",
		decision: "Decision",
		sign: "Close and sign",
		signed: "Minutes signed",
		ruleApplied: "Rule applied ·",
		ruleLine: ({ threshold, eliminating, compensation, count, signed }) =>
			`threshold ${threshold} · eliminating < ${eliminating} · compensation ${
				compensation ? "enabled" : "disabled"
			} — ${count} records re-decided instantly${
				signed ? " · minutes signed and timestamped." : "."
			}`,
		reasons: {
			eliminating: (mark) => `eliminating mark (${mark})`,
			compensated: "compensation applied",
			averageOk: "average cleared",
			belowThreshold: "below threshold",
			farBelow: "gap too wide",
		},
	},
	screens: {
		attendance: "Attendance",
		approvals: "Grade approvals",
		officialDocs: "Official documents",
		juryRules: "Jury rules",
	},
};

export function demoStrings(locale: Locale | undefined): DemoStrings {
	return locale === "en" ? en : fr;
}
