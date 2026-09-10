import { and, eq } from "drizzle-orm";
import { db } from "../db";
import type { PrintTemplateType } from "../db/schema";
import { printTemplates } from "../db/schema";
import type { TemplateData } from "./template-renderer";
import { renderTemplate } from "./template-renderer";

// ─── Default templates ────────────────────────────────────────────────────────

const COMMON_STYLE = `
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: Arial, sans-serif; font-size: 12px; color: #111; background: #fff; padding: 20mm; }
.header { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; border-bottom: 2px solid #1a56db; padding-bottom: 12px; }
.logo { height: 60px; width: auto; }
.header-text { flex: 1; }
.school-name { font-size: 16px; font-weight: bold; text-transform: uppercase; color: #1a56db; }
.school-meta { font-size: 10px; color: #555; margin-top: 2px; }
.doc-title { text-align: right; }
.doc-title h2 { font-size: 14px; font-weight: bold; text-transform: uppercase; color: #1a56db; }
.doc-title .sub-label { font-size: 11px; color: #555; margin-top: 2px; }
table { width: 100%; border-collapse: collapse; margin-top: 12px; }
thead th { background: #1a56db; color: #fff; padding: 7px 10px; text-align: left; font-size: 11px; font-weight: bold; }
tbody tr:nth-child(even) { background: #f8f9fb; }
tbody tr td { padding: 6px 10px; border-bottom: 1px solid #e5e7eb; }
.num { text-align: right; font-variant-numeric: tabular-nums; }
.center { text-align: center; }
.footer { margin-top: 20px; font-size: 10px; color: #888; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 8px; }
.summary { display: flex; gap: 24px; margin-bottom: 12px; padding: 10px; background: #f3f6ff; border-radius: 4px; font-size: 11px; }
.summary span { font-weight: bold; }
`;

// ─── Report card ──────────────────────────────────────────────────────────────

const REPORT_CARD_STYLE = `
.student-info { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; margin-bottom: 16px; padding: 10px; background: #f3f6ff; border-radius: 4px; }
.info-row { display: flex; gap: 6px; }
.info-label { font-weight: bold; color: #333; min-width: 80px; }
.coeff-col { text-align: center; color: #6b7280; font-size: 11px; width: 50px; }
.appr { color: #374151; font-style: italic; }
.domain-row td { background: #e0e7ff; font-weight: bold; color: #1e40af; padding: 5px 10px; }
.domain-avg { text-align: right; font-variant-numeric: tabular-nums; }
.total-row { background: #e0e7ff !important; }
.total-row td { font-weight: bold; padding: 7px 10px; }
.total-avg { text-align: right; font-variant-numeric: tabular-nums; }
`;

const REPORT_CARD_FR = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<style>${COMMON_STYLE}${REPORT_CARD_STYLE}</style>
</head>
<body>
<div class="header">
  <img src="{{logo_url}}" alt="Logo" class="logo" />
  <div class="header-text">
    <div class="school-name">{{institution_name}}</div>
    <div class="school-meta">{{school_city}} · {{minesec_code}}</div>
  </div>
  <div class="doc-title">
    <h2>BULLETIN DE NOTES</h2>
    <div class="sub-label">TRIMESTRE {{term}} — {{year_name}}</div>
  </div>
</div>

<div class="student-info">
  <div class="info-row"><span class="info-label">Élève :</span><span>{{student_name}}</span></div>
  <div class="info-row"><span class="info-label">Classe :</span><span>{{class_name}}</span></div>
  <div class="info-row"><span class="info-label">Matricule :</span><span>{{student_mnu}}</span></div>
  <div class="info-row"><span class="info-label">Né(e) le :</span><span>{{student_dob}}</span></div>
  <div class="info-row"><span class="info-label">Rang :</span><span style="font-weight:bold;color:#1a56db">{{rank}}</span></div>
</div>

<table>
  <thead>
    <tr>
      <th>Matière</th>
      <th class="coeff-col">Coeff.</th>
      <th class="num">Moy. /20</th>
      <th>Appréc.</th>
    </tr>
  </thead>
  <tbody>
    {{#each domains}}
    <tr class="domain-row">
      <td colspan="2">{{domain_name}}</td>
      <td class="domain-avg">{{domain_avg}}</td>
      <td></td>
    </tr>
    {{#each courses}}
    <tr>
      <td style="padding-left:20px">{{subject}}</td>
      <td class="coeff-col">{{coeff}}</td>
      <td class="num">{{avg}}</td>
      <td class="appr">{{appreciation}}</td>
    </tr>
    {{/each}}
    {{/each}}
    <tr class="total-row">
      <td colspan="2">Moyenne générale</td>
      <td class="total-avg">{{overall_avg}}</td>
      <td>{{overall_appreciation}}</td>
    </tr>
  </tbody>
</table>

<div class="footer">{{institution_name}} — Document généré automatiquement</div>
</body>
</html>`;

const REPORT_CARD_EN = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<style>${COMMON_STYLE}${REPORT_CARD_STYLE}</style>
</head>
<body>
<div class="header">
  <img src="{{logo_url}}" alt="Logo" class="logo" />
  <div class="header-text">
    <div class="school-name">{{institution_name}}</div>
    <div class="school-meta">{{school_city}} · {{minesec_code}}</div>
  </div>
  <div class="doc-title">
    <h2>REPORT CARD</h2>
    <div class="sub-label">TERM {{term}} — {{year_name}}</div>
  </div>
</div>

<div class="student-info">
  <div class="info-row"><span class="info-label">Student:</span><span>{{student_name}}</span></div>
  <div class="info-row"><span class="info-label">Class:</span><span>{{class_name}}</span></div>
  <div class="info-row"><span class="info-label">ID:</span><span>{{student_mnu}}</span></div>
  <div class="info-row"><span class="info-label">Date of birth:</span><span>{{student_dob}}</span></div>
  <div class="info-row"><span class="info-label">Rank:</span><span style="font-weight:bold;color:#1a56db">{{rank}}</span></div>
</div>

<table>
  <thead>
    <tr>
      <th>Subject</th>
      <th class="coeff-col">Coeff.</th>
      <th class="num">Avg /20</th>
      <th>Grade</th>
    </tr>
  </thead>
  <tbody>
    {{#each domains}}
    <tr class="domain-row">
      <td colspan="2">{{domain_name}}</td>
      <td class="domain-avg">{{domain_avg}}</td>
      <td></td>
    </tr>
    {{#each courses}}
    <tr>
      <td style="padding-left:20px">{{subject}}</td>
      <td class="coeff-col">{{coeff}}</td>
      <td class="num">{{avg}}</td>
      <td class="appr">{{appreciation}}</td>
    </tr>
    {{/each}}
    {{/each}}
    <tr class="total-row">
      <td colspan="2">Overall average</td>
      <td class="total-avg">{{overall_avg}}</td>
      <td>{{overall_appreciation}}</td>
    </tr>
  </tbody>
</table>

<div class="footer">{{institution_name}} — Auto-generated document</div>
</body>
</html>`;

// ─── Class roster ─────────────────────────────────────────────────────────────

const CLASS_ROSTER_FR = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<style>${COMMON_STYLE}</style>
</head>
<body>
<div class="header">
  <div class="header-text">
    <div class="school-name">{{institution_name}}</div>
    <div class="school-meta">{{school_city}} · {{minesec_code}}</div>
  </div>
  <div class="doc-title">
    <h2>LISTE DES ÉLÈVES</h2>
    <div class="sub-label">{{class_name}} — {{year_name}}</div>
  </div>
</div>

<div class="summary">
  <div>Classe : <span>{{class_name}}</span></div>
  <div>Année scolaire : <span>{{year_name}}</span></div>
  <div>Total : <span>{{total_students}} élève(s)</span></div>
</div>

<table>
  <thead>
    <tr>
      <th class="center" style="width:40px">N°</th>
      <th>Nom et prénom(s)</th>
      <th>Matricule</th>
      <th>Date de naissance</th>
      <th class="center">Sexe</th>
      <th>N° Inscription</th>
    </tr>
  </thead>
  <tbody>
    {{#each students}}
    <tr>
      <td class="center">{{num}}</td>
      <td>{{student_name}}</td>
      <td>{{mnu}}</td>
      <td>{{dob}}</td>
      <td class="center">{{gender}}</td>
      <td>{{reg_num}}</td>
    </tr>
    {{/each}}
  </tbody>
</table>

<div class="footer">{{institution_name}} — Document généré automatiquement</div>
</body>
</html>`;

const CLASS_ROSTER_EN = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<style>${COMMON_STYLE}</style>
</head>
<body>
<div class="header">
  <div class="header-text">
    <div class="school-name">{{institution_name}}</div>
    <div class="school-meta">{{school_city}} · {{minesec_code}}</div>
  </div>
  <div class="doc-title">
    <h2>CLASS REGISTER</h2>
    <div class="sub-label">{{class_name}} — {{year_name}}</div>
  </div>
</div>

<div class="summary">
  <div>Class: <span>{{class_name}}</span></div>
  <div>Academic year: <span>{{year_name}}</span></div>
  <div>Total: <span>{{total_students}} student(s)</span></div>
</div>

<table>
  <thead>
    <tr>
      <th class="center" style="width:40px">No.</th>
      <th>Name</th>
      <th>Student ID</th>
      <th>Date of birth</th>
      <th class="center">Gender</th>
      <th>Reg. No.</th>
    </tr>
  </thead>
  <tbody>
    {{#each students}}
    <tr>
      <td class="center">{{num}}</td>
      <td>{{student_name}}</td>
      <td>{{mnu}}</td>
      <td>{{dob}}</td>
      <td class="center">{{gender}}</td>
      <td>{{reg_num}}</td>
    </tr>
    {{/each}}
  </tbody>
</table>

<div class="footer">{{institution_name}} — Auto-generated document</div>
</body>
</html>`;

// ─── Eligibility list ─────────────────────────────────────────────────────────

const ELIGIBILITY_LIST_FR = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<style>${COMMON_STYLE}
.eligible-yes { color: #15803d; font-weight: bold; text-align: center; }
.eligible-no  { color: #b91c1c; text-align: center; }
</style>
</head>
<body>
<div class="header">
  <div class="header-text">
    <div class="school-name">{{institution_name}}</div>
    <div class="school-meta">{{school_city}} · {{minesec_code}}</div>
  </div>
  <div class="doc-title">
    <h2>LISTE D'ÉLIGIBILITÉ</h2>
    <div class="sub-label">{{exam_type}} — Session {{session_year}}</div>
  </div>
</div>

<div class="summary">
  <div>Examen : <span>{{exam_type}}</span></div>
  <div>Session : <span>{{session_year}}</span></div>
  <div>Série : <span>{{series}}</span></div>
  <div>Total candidats : <span>{{total_candidates}}</span></div>
</div>

<table>
  <thead>
    <tr>
      <th class="center" style="width:40px">N°</th>
      <th>N° Candidat</th>
      <th>Nom et prénom(s)</th>
      <th>Matricule</th>
      <th class="center">Éligible</th>
      <th class="center">Frais payés</th>
    </tr>
  </thead>
  <tbody>
    {{#each candidates}}
    <tr>
      <td class="center">{{num}}</td>
      <td>{{candidate_number}}</td>
      <td>{{student_name}}</td>
      <td>{{mnu}}</td>
      <td class="center">{{eligible}}</td>
      <td class="center">{{has_paid}}</td>
    </tr>
    {{/each}}
  </tbody>
</table>

<div class="footer">{{institution_name}} — Document généré automatiquement</div>
</body>
</html>`;

const ELIGIBILITY_LIST_EN = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<style>${COMMON_STYLE}</style>
</head>
<body>
<div class="header">
  <div class="header-text">
    <div class="school-name">{{institution_name}}</div>
    <div class="school-meta">{{school_city}} · {{minesec_code}}</div>
  </div>
  <div class="doc-title">
    <h2>ELIGIBILITY LIST</h2>
    <div class="sub-label">{{exam_type}} — Session {{session_year}}</div>
  </div>
</div>

<div class="summary">
  <div>Exam: <span>{{exam_type}}</span></div>
  <div>Session: <span>{{session_year}}</span></div>
  <div>Series: <span>{{series}}</span></div>
  <div>Total candidates: <span>{{total_candidates}}</span></div>
</div>

<table>
  <thead>
    <tr>
      <th class="center" style="width:40px">No.</th>
      <th>Candidate No.</th>
      <th>Name</th>
      <th>Student ID</th>
      <th class="center">Eligible</th>
      <th class="center">Fee paid</th>
    </tr>
  </thead>
  <tbody>
    {{#each candidates}}
    <tr>
      <td class="center">{{num}}</td>
      <td>{{candidate_number}}</td>
      <td>{{student_name}}</td>
      <td>{{mnu}}</td>
      <td class="center">{{eligible}}</td>
      <td class="center">{{has_paid}}</td>
    </tr>
    {{/each}}
  </tbody>
</table>

<div class="footer">{{institution_name}} — Auto-generated document</div>
</body>
</html>`;

// ─── Candidate list ───────────────────────────────────────────────────────────

const CANDIDATE_LIST_FR = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<style>${COMMON_STYLE}</style>
</head>
<body>
<div class="header">
  <div class="header-text">
    <div class="school-name">{{institution_name}}</div>
    <div class="school-meta">{{school_city}} · {{minesec_code}} · Centre : {{center_code}}</div>
  </div>
  <div class="doc-title">
    <h2>LISTE DES CANDIDATS</h2>
    <div class="sub-label">{{exam_type}} — Session {{session_year}}</div>
  </div>
</div>

<div class="summary">
  <div>Examen : <span>{{exam_type}}</span></div>
  <div>Session : <span>{{session_year}}</span></div>
  <div>Série : <span>{{series}}</span></div>
  <div>Centre : <span>{{center_code}}</span></div>
  <div>Total : <span>{{total_candidates}}</span></div>
</div>

<table>
  <thead>
    <tr>
      <th class="center" style="width:40px">N°</th>
      <th>N° Candidat</th>
      <th>Nom et prénom(s)</th>
      <th>Matricule</th>
      <th>Date de naissance</th>
      <th class="center">Éligible</th>
      <th class="center">Admis</th>
      <th>Mention</th>
    </tr>
  </thead>
  <tbody>
    {{#each candidates}}
    <tr>
      <td class="center">{{num}}</td>
      <td>{{candidate_number}}</td>
      <td>{{student_name}}</td>
      <td>{{mnu}}</td>
      <td>{{dob}}</td>
      <td class="center">{{eligible}}</td>
      <td class="center">{{admitted}}</td>
      <td>{{mention}}</td>
    </tr>
    {{/each}}
  </tbody>
</table>

<div class="footer">{{institution_name}} — Document généré automatiquement</div>
</body>
</html>`;

const CANDIDATE_LIST_EN = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<style>${COMMON_STYLE}</style>
</head>
<body>
<div class="header">
  <div class="header-text">
    <div class="school-name">{{institution_name}}</div>
    <div class="school-meta">{{school_city}} · {{minesec_code}} · Centre: {{center_code}}</div>
  </div>
  <div class="doc-title">
    <h2>CANDIDATE LIST</h2>
    <div class="sub-label">{{exam_type}} — Session {{session_year}}</div>
  </div>
</div>

<div class="summary">
  <div>Exam: <span>{{exam_type}}</span></div>
  <div>Session: <span>{{session_year}}</span></div>
  <div>Series: <span>{{series}}</span></div>
  <div>Centre: <span>{{center_code}}</span></div>
  <div>Total: <span>{{total_candidates}}</span></div>
</div>

<table>
  <thead>
    <tr>
      <th class="center" style="width:40px">No.</th>
      <th>Candidate No.</th>
      <th>Name</th>
      <th>Student ID</th>
      <th>Date of birth</th>
      <th class="center">Eligible</th>
      <th class="center">Admitted</th>
      <th>Mention</th>
    </tr>
  </thead>
  <tbody>
    {{#each candidates}}
    <tr>
      <td class="center">{{num}}</td>
      <td>{{candidate_number}}</td>
      <td>{{student_name}}</td>
      <td>{{mnu}}</td>
      <td>{{dob}}</td>
      <td class="center">{{eligible}}</td>
      <td class="center">{{admitted}}</td>
      <td>{{mention}}</td>
    </tr>
    {{/each}}
  </tbody>
</table>

<div class="footer">{{institution_name}} — Auto-generated document</div>
</body>
</html>`;

// ─── Default templates map ────────────────────────────────────────────────────

const DEFAULT_TEMPLATES: Record<PrintTemplateType, { fr: string; en: string }> =
	{
		report_card: { fr: REPORT_CARD_FR, en: REPORT_CARD_EN },
		class_roster: { fr: CLASS_ROSTER_FR, en: CLASS_ROSTER_EN },
		eligibility_list: { fr: ELIGIBILITY_LIST_FR, en: ELIGIBILITY_LIST_EN },
		candidate_list: { fr: CANDIDATE_LIST_FR, en: CANDIDATE_LIST_EN },
	};

// ─── Resolver ─────────────────────────────────────────────────────────────────

export async function resolveAndRender(
	institutionId: string,
	type: PrintTemplateType,
	language: "fr" | "en",
	data: TemplateData,
): Promise<string> {
	const rows = await db
		.select({
			htmlContentFr: printTemplates.htmlContentFr,
			htmlContentEn: printTemplates.htmlContentEn,
		})
		.from(printTemplates)
		.where(
			and(
				eq(printTemplates.institutionId, institutionId),
				eq(printTemplates.type, type),
			),
		)
		.limit(1);

	const row = rows[0];
	const customHtml =
		row !== undefined
			? language === "fr"
				? row.htmlContentFr
				: row.htmlContentEn
			: null;

	const html =
		customHtml && customHtml.trim().length > 0
			? customHtml
			: DEFAULT_TEMPLATES[type][language];

	return renderTemplate(html, data);
}
