import { FileCode2, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { Confirm } from "@/components/callable/confirm";
import { Button } from "@/components/ui/button";
import { CodeEditor } from "@/components/ui/code-editor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type { TemplateData } from "@/lib/template-renderer";
import { renderTemplate } from "@/lib/template-renderer";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

type TemplateType =
	| "report_card"
	| "class_roster"
	| "eligibility_list"
	| "candidate_list";

type Lang = "fr" | "en";

const TEMPLATE_TYPES: TemplateType[] = [
	"report_card",
	"class_roster",
	"eligibility_list",
	"candidate_list",
];

// ─── Default starter templates (FR + EN) ─────────────────────────────────────

const REPORT_CARD_STYLE = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 11px; padding: 16px 20px; color: #000; }
    .header { text-align: center; border-bottom: 2px solid #003366; padding-bottom: 8px; margin-bottom: 10px; }
    .header h1 { font-size: 14px; font-weight: bold; text-transform: uppercase; color: #003366; }
    .header h2 { font-size: 11px; margin-top: 3px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3px 20px; margin-bottom: 10px; font-size: 11px; border: 1px solid #ccc; padding: 6px 10px; border-radius: 4px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 10px; }
    th, td { border: 1px solid #aaa; padding: 3px 5px; vertical-align: middle; }
    th { background: #003366; color: #fff; font-weight: bold; text-align: center; white-space: nowrap; }
    .domain-row td { background: #dce6f0; font-weight: bold; font-size: 10px; color: #003366; }
    .avg-good { color: #007700; font-weight: bold; }
    .avg-bad  { color: #cc0000; font-weight: bold; }
    .summary { display: flex; gap: 12px; margin-top: 8px; }
    .summary-box { flex: 1; border: 1px solid #aaa; padding: 6px; text-align: center; border-radius: 4px; }
    .summary-box .label { font-size: 9px; text-transform: uppercase; color: #555; }
    .summary-box .val { font-size: 20px; font-weight: bold; margin-top: 2px; }
    .footer { margin-top: 24px; display: flex; justify-content: space-between; }
    .sign-box { width: 160px; text-align: center; }
    .sign-box .sign-line { border-top: 1px solid #000; margin-top: 40px; padding-top: 3px; font-size: 10px; }`;

const ROSTER_STYLE = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 11px; padding: 16px 20px; }
    .header { text-align: center; border-bottom: 2px solid #003366; padding-bottom: 8px; margin-bottom: 10px; }
    .header h1 { font-size: 14px; font-weight: bold; text-transform: uppercase; color: #003366; }
    .header h2 { font-size: 11px; margin-top: 3px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 10px; }
    th, td { border: 1px solid #aaa; padding: 4px 6px; }
    th { background: #003366; color: #fff; text-align: center; }
    tr:nth-child(even) { background: #f4f8ff; }`;

const DEFAULT_TEMPLATES: Record<TemplateType, Record<Lang, string>> = {
	report_card: {
		fr: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <style>${REPORT_CARD_STYLE}
  </style>
</head>
<body>
  <div class="header">
    <h1>{{institution_name}}</h1>
    <h2>BULLETIN DE NOTES &mdash; {{term_name}} &mdash; Année scolaire {{year_name}}</h2>
  </div>
  <div class="info-grid">
    <div><strong>Élève :</strong> {{student_name}}</div>
    <div><strong>Matricule :</strong> {{student_mnu}}</div>
    <div><strong>Classe :</strong> {{class_name}}</div>
    <div><strong>Absences :</strong> {{absences}} heure(s)</div>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width:20%;text-align:left">Matière</th>
        <th style="width:5%">Coef.</th>
        <th style="width:8%">Note CC</th>
        <th style="width:8%">Examen</th>
        <th style="width:8%">Moy.</th>
        <th style="width:7%">Rang</th>
        <th style="width:7%">Moy. cl.</th>
        <th style="width:22%;text-align:left">Appréciation</th>
        <th style="width:15%;text-align:left">Enseignant(e)</th>
      </tr>
    </thead>
    <tbody>
      {{#each domains}}
      <tr class="domain-row">
        <td colspan="7">{{name}}</td>
        <td colspan="2" style="text-align:right">Moy. domaine : <strong>{{avg}}</strong>/20</td>
      </tr>
      {{#each courses}}
      <tr>
        <td>{{name}}</td>
        <td style="text-align:center">{{coefficient}}</td>
        <td style="text-align:center">{{cc}}</td>
        <td style="text-align:center">{{exam}}</td>
        <td style="text-align:center" class="{{avg_class}}">{{avg}}</td>
        <td style="text-align:center">{{rank}}<sup>e</sup>/{{class_size}}</td>
        <td style="text-align:center">{{class_avg}}</td>
        <td>{{appreciation}}</td>
        <td>{{teacher}}</td>
      </tr>
      {{/each}}
      {{/each}}
    </tbody>
  </table>
  <div class="summary">
    <div class="summary-box">
      <div class="label">Moyenne générale</div>
      <div class="val">{{avg}}<span style="font-size:12px">/20</span></div>
    </div>
    <div class="summary-box">
      <div class="label">Rang</div>
      <div class="val">{{rank}}<sup style="font-size:12px">e</sup><span style="font-size:12px">/{{total_students}}</span></div>
    </div>
    <div class="summary-box">
      <div class="label">Décision du conseil</div>
      <div class="val" style="font-size:14px">{{decision}}</div>
    </div>
    <div class="summary-box">
      <div class="label">Conduite</div>
      <div class="val" style="font-size:14px">{{conduct}}</div>
    </div>
  </div>
  <div class="footer">
    <div class="sign-box"><div class="sign-line">Le Titulaire de classe</div></div>
    <div class="sign-box"><div class="sign-line">Direction</div></div>
  </div>
</body>
</html>`,

		en: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>${REPORT_CARD_STYLE}
  </style>
</head>
<body>
  <div class="header">
    <h1>{{institution_name}}</h1>
    <h2>REPORT CARD &mdash; {{term_name}} &mdash; Academic Year {{year_name}}</h2>
  </div>
  <div class="info-grid">
    <div><strong>Student:</strong> {{student_name}}</div>
    <div><strong>Student ID:</strong> {{student_mnu}}</div>
    <div><strong>Class:</strong> {{class_name}}</div>
    <div><strong>Absences:</strong> {{absences}} hour(s)</div>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width:20%;text-align:left">Subject</th>
        <th style="width:5%">Coef.</th>
        <th style="width:8%">CA Score</th>
        <th style="width:8%">Exam</th>
        <th style="width:8%">Avg.</th>
        <th style="width:7%">Rank</th>
        <th style="width:7%">Cl. avg.</th>
        <th style="width:22%;text-align:left">Remark</th>
        <th style="width:15%;text-align:left">Teacher</th>
      </tr>
    </thead>
    <tbody>
      {{#each domains}}
      <tr class="domain-row">
        <td colspan="7">{{name}}</td>
        <td colspan="2" style="text-align:right">Domain avg.: <strong>{{avg}}</strong>/20</td>
      </tr>
      {{#each courses}}
      <tr>
        <td>{{name}}</td>
        <td style="text-align:center">{{coefficient}}</td>
        <td style="text-align:center">{{cc}}</td>
        <td style="text-align:center">{{exam}}</td>
        <td style="text-align:center" class="{{avg_class}}">{{avg}}</td>
        <td style="text-align:center">{{rank}}<sup>th</sup>/{{class_size}}</td>
        <td style="text-align:center">{{class_avg}}</td>
        <td>{{appreciation}}</td>
        <td>{{teacher}}</td>
      </tr>
      {{/each}}
      {{/each}}
    </tbody>
  </table>
  <div class="summary">
    <div class="summary-box">
      <div class="label">General Average</div>
      <div class="val">{{avg}}<span style="font-size:12px">/20</span></div>
    </div>
    <div class="summary-box">
      <div class="label">Rank</div>
      <div class="val">{{rank}}<sup style="font-size:12px">th</sup><span style="font-size:12px">/{{total_students}}</span></div>
    </div>
    <div class="summary-box">
      <div class="label">Class Council Decision</div>
      <div class="val" style="font-size:14px">{{decision}}</div>
    </div>
    <div class="summary-box">
      <div class="label">Conduct</div>
      <div class="val" style="font-size:14px">{{conduct}}</div>
    </div>
  </div>
  <div class="footer">
    <div class="sign-box"><div class="sign-line">Class Teacher</div></div>
    <div class="sign-box"><div class="sign-line">Headmaster / Principal</div></div>
  </div>
</body>
</html>`,
	},

	class_roster: {
		fr: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <style>${ROSTER_STYLE}
  </style>
</head>
<body>
  <div class="header">
    <h1>{{institution_name}}</h1>
    <h2>LISTE DE CLASSE &mdash; {{class_name}} &mdash; Année {{year_name}}</h2>
  </div>
  <p style="margin-bottom:8px">Total : <strong>{{student_count}}</strong> élèves</p>
  <table>
    <thead>
      <tr>
        <th style="width:5%">N°</th>
        <th style="width:30%">Nom et Prénom</th>
        <th style="width:15%">Matricule</th>
        <th style="width:8%">Sexe</th>
        <th style="width:12%">Date de naissance</th>
        <th style="width:20%">Lieu de naissance</th>
        <th style="width:10%">Statut</th>
      </tr>
    </thead>
    <tbody>
      {{#each students}}
      <tr>
        <td style="text-align:center">{{index}}</td>
        <td>{{name}}</td>
        <td>{{mnu}}</td>
        <td style="text-align:center">{{gender}}</td>
        <td style="text-align:center">{{date_of_birth}}</td>
        <td>{{place_of_birth}}</td>
        <td style="text-align:center">{{status}}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>
</body>
</html>`,

		en: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>${ROSTER_STYLE}
  </style>
</head>
<body>
  <div class="header">
    <h1>{{institution_name}}</h1>
    <h2>CLASS LIST &mdash; {{class_name}} &mdash; Year {{year_name}}</h2>
  </div>
  <p style="margin-bottom:8px">Total: <strong>{{student_count}}</strong> students</p>
  <table>
    <thead>
      <tr>
        <th style="width:5%">No.</th>
        <th style="width:30%">Full Name</th>
        <th style="width:15%">Student ID</th>
        <th style="width:8%">Sex</th>
        <th style="width:12%">Date of Birth</th>
        <th style="width:20%">Place of Birth</th>
        <th style="width:10%">Status</th>
      </tr>
    </thead>
    <tbody>
      {{#each students}}
      <tr>
        <td style="text-align:center">{{index}}</td>
        <td>{{name}}</td>
        <td>{{mnu}}</td>
        <td style="text-align:center">{{gender}}</td>
        <td style="text-align:center">{{date_of_birth}}</td>
        <td>{{place_of_birth}}</td>
        <td style="text-align:center">{{status}}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>
</body>
</html>`,
	},

	eligibility_list: {
		fr: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <style>${ROSTER_STYLE}
  </style>
</head>
<body>
  <div class="header">
    <h1>{{institution_name}}</h1>
    <h2>LISTE D'ÉLIGIBILITÉ AUX EXAMENS &mdash; {{class_name}} &mdash; {{year_name}}</h2>
  </div>
  <p style="margin-bottom:8px">Candidats éligibles : <strong>{{student_count}}</strong></p>
  <table>
    <thead>
      <tr>
        <th style="width:5%">N°</th>
        <th style="width:30%">Nom et Prénom</th>
        <th style="width:15%">Matricule</th>
        <th style="width:10%">Sexe</th>
        <th style="width:15%">Moy. annuelle</th>
        <th style="width:25%">Observation</th>
      </tr>
    </thead>
    <tbody>
      {{#each students}}
      <tr>
        <td style="text-align:center">{{index}}</td>
        <td>{{name}}</td>
        <td>{{mnu}}</td>
        <td style="text-align:center">{{gender}}</td>
        <td style="text-align:center">{{avg}}/20</td>
        <td>{{observation}}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>
</body>
</html>`,

		en: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>${ROSTER_STYLE}
  </style>
</head>
<body>
  <div class="header">
    <h1>{{institution_name}}</h1>
    <h2>EXAM ELIGIBILITY LIST &mdash; {{class_name}} &mdash; {{year_name}}</h2>
  </div>
  <p style="margin-bottom:8px">Eligible candidates: <strong>{{student_count}}</strong></p>
  <table>
    <thead>
      <tr>
        <th style="width:5%">No.</th>
        <th style="width:30%">Full Name</th>
        <th style="width:15%">Student ID</th>
        <th style="width:10%">Sex</th>
        <th style="width:15%">Annual Avg.</th>
        <th style="width:25%">Remark</th>
      </tr>
    </thead>
    <tbody>
      {{#each students}}
      <tr>
        <td style="text-align:center">{{index}}</td>
        <td>{{name}}</td>
        <td>{{mnu}}</td>
        <td style="text-align:center">{{gender}}</td>
        <td style="text-align:center">{{avg}}/20</td>
        <td>{{observation}}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>
</body>
</html>`,
	},

	candidate_list: {
		fr: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <style>${ROSTER_STYLE}
    .sign-area { margin-top: 24px; display: flex; justify-content: space-between; }
    .sign-box { width: 160px; border-top: 1px solid #000; padding-top: 4px; text-align: center; font-size: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>{{institution_name}}</h1>
    <h2>LISTE DES CANDIDATS &mdash; {{session_name}} &mdash; {{subject_name}}</h2>
  </div>
  <p style="margin-bottom:8px">Nombre de candidats : <strong>{{student_count}}</strong></p>
  <table>
    <thead>
      <tr>
        <th style="width:5%">N°</th>
        <th style="width:15%">N° de table</th>
        <th style="width:35%">Nom et Prénom</th>
        <th style="width:15%">Matricule</th>
        <th style="width:8%">Sexe</th>
        <th style="width:22%">Observation</th>
      </tr>
    </thead>
    <tbody>
      {{#each candidates}}
      <tr>
        <td style="text-align:center">{{index}}</td>
        <td style="text-align:center">{{table_number}}</td>
        <td>{{name}}</td>
        <td>{{mnu}}</td>
        <td style="text-align:center">{{gender}}</td>
        <td></td>
      </tr>
      {{/each}}
    </tbody>
  </table>
  <div class="sign-area">
    <div class="sign-box">Le Surveillant de salle</div>
    <div class="sign-box">Direction</div>
  </div>
</body>
</html>`,

		en: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>${ROSTER_STYLE}
    .sign-area { margin-top: 24px; display: flex; justify-content: space-between; }
    .sign-box { width: 160px; border-top: 1px solid #000; padding-top: 4px; text-align: center; font-size: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>{{institution_name}}</h1>
    <h2>CANDIDATE LIST &mdash; {{session_name}} &mdash; {{subject_name}}</h2>
  </div>
  <p style="margin-bottom:8px">Number of candidates: <strong>{{student_count}}</strong></p>
  <table>
    <thead>
      <tr>
        <th style="width:5%">No.</th>
        <th style="width:15%">Table No.</th>
        <th style="width:35%">Full Name</th>
        <th style="width:15%">Student ID</th>
        <th style="width:8%">Sex</th>
        <th style="width:22%">Remark</th>
      </tr>
    </thead>
    <tbody>
      {{#each candidates}}
      <tr>
        <td style="text-align:center">{{index}}</td>
        <td style="text-align:center">{{table_number}}</td>
        <td>{{name}}</td>
        <td>{{mnu}}</td>
        <td style="text-align:center">{{gender}}</td>
        <td></td>
      </tr>
      {{/each}}
    </tbody>
  </table>
  <div class="sign-area">
    <div class="sign-box">Invigilator</div>
    <div class="sign-box">Headmaster / Principal</div>
  </div>
</body>
</html>`,
	},
};

// ─── Preview sample data ──────────────────────────────────────────────────────

const PREVIEW_DATA: Record<TemplateType, TemplateData> = {
	report_card: {
		institution_name: "Lycée Bilingue de Yaoundé",
		student_name: "MBARGA Jean-Paul",
		student_mnu: "CM-2024-001234",
		class_name: "3ème A",
		year_name: "2024–2025",
		term_name: "1ère Séquence",
		avg: "14.25",
		rank: "3",
		total_students: "48",
		absences: "4",
		decision: "Admis(e)",
		conduct: "Bien",
		domains: [
			{
				name: "Lettres & Sciences Humaines",
				avg: "13.60",
				courses: [
					{
						name: "Français",
						coefficient: "4",
						cc: "12.00",
						exam: "14.00",
						avg: "13.20",
						avg_class: "avg-bad",
						rank: "15",
						class_size: "48",
						class_avg: "13.80",
						appreciation: "Peut mieux faire",
						teacher: "M. NGONO E.",
					},
					{
						name: "Anglais",
						coefficient: "3",
						cc: "15.00",
						exam: "14.00",
						avg: "14.60",
						avg_class: "avg-good",
						rank: "8",
						class_size: "48",
						class_avg: "12.40",
						appreciation: "Bon travail",
						teacher: "Mme BIYA A.",
					},
				],
			},
			{
				name: "Sciences & Technologies",
				avg: "15.40",
				courses: [
					{
						name: "Mathématiques",
						coefficient: "4",
						cc: "16.00",
						exam: "15.00",
						avg: "15.60",
						avg_class: "avg-good",
						rank: "5",
						class_size: "48",
						class_avg: "11.80",
						appreciation: "Très bien",
						teacher: "M. MBOUOMBOUO",
					},
					{
						name: "Sciences Physiques",
						coefficient: "3",
						cc: "14.00",
						exam: "16.00",
						avg: "14.80",
						avg_class: "avg-good",
						rank: "10",
						class_size: "48",
						class_avg: "12.50",
						appreciation: "Bien",
						teacher: "Mme TCHOUAKE",
					},
				],
			},
		],
	},

	class_roster: {
		institution_name: "Lycée Bilingue de Yaoundé",
		class_name: "3ème A",
		year_name: "2024–2025",
		student_count: "3",
		students: [
			{
				index: "1",
				name: "ATANGANA Marie",
				mnu: "CM-2024-000101",
				gender: "F",
				date_of_birth: "12/03/2009",
				place_of_birth: "Yaoundé",
				status: "Redoublant",
			},
			{
				index: "2",
				name: "MBARGA Jean-Paul",
				mnu: "CM-2024-001234",
				gender: "M",
				date_of_birth: "05/07/2008",
				place_of_birth: "Bafoussam",
				status: "Nouveau",
			},
			{
				index: "3",
				name: "NKONO Sophie",
				mnu: "CM-2024-002500",
				gender: "F",
				date_of_birth: "21/11/2008",
				place_of_birth: "Douala",
				status: "Nouveau",
			},
		],
	},

	eligibility_list: {
		institution_name: "Lycée Bilingue de Yaoundé",
		class_name: "3ème A",
		year_name: "2024–2025",
		student_count: "3",
		students: [
			{
				index: "1",
				name: "ATANGANA Marie",
				mnu: "CM-2024-000101",
				gender: "F",
				avg: "15.40",
				observation: "Éligible",
			},
			{
				index: "2",
				name: "MBARGA Jean-Paul",
				mnu: "CM-2024-001234",
				gender: "M",
				avg: "14.25",
				observation: "Éligible",
			},
			{
				index: "3",
				name: "NKONO Sophie",
				mnu: "CM-2024-002500",
				gender: "F",
				avg: "9.80",
				observation: "Non éligible — moyenne insuffisante",
			},
		],
	},

	candidate_list: {
		institution_name: "Lycée Bilingue de Yaoundé",
		session_name: "BEPC 2025",
		subject_name: "Mathématiques",
		student_count: "3",
		candidates: [
			{
				index: "1",
				table_number: "001",
				name: "ATANGANA Marie",
				mnu: "CM-2024-000101",
				gender: "F",
			},
			{
				index: "2",
				table_number: "002",
				name: "MBARGA Jean-Paul",
				mnu: "CM-2024-001234",
				gender: "M",
			},
			{
				index: "3",
				table_number: "003",
				name: "NKONO Sophie",
				mnu: "CM-2024-002500",
				gender: "F",
			},
		],
	},
};

// ─── Variable reference per type ──────────────────────────────────────────────

const VAR_DOCS: Record<TemplateType, string> = {
	report_card: [
		"Scalaires : {{institution_name}}  {{student_name}}  {{student_mnu}}  {{class_name}}",
		"            {{year_name}}  {{term_name}}  {{avg}}  {{rank}}  {{total_students}}  {{absences}}  {{decision}}  {{conduct}}",
		"Domaines  : {{#each domains}}  {{name}}  {{avg}}  {{/each}}",
		"Matières  : {{#each courses}}  {{name}}  {{coefficient}}  {{cc}}  {{exam}}",
		"              {{avg}}  {{rank}}  {{class_size}}  {{class_avg}}  {{appreciation}}  {{teacher}}  {{/each}}",
	].join("\n"),
	class_roster: [
		"Scalaires : {{institution_name}}  {{class_name}}  {{year_name}}  {{student_count}}",
		"Boucle    : {{#each students}}  {{index}}  {{name}}  {{mnu}}  {{gender}}",
		"              {{date_of_birth}}  {{place_of_birth}}  {{status}}  {{/each}}",
	].join("\n"),
	eligibility_list: [
		"Scalaires : {{institution_name}}  {{class_name}}  {{year_name}}  {{student_count}}",
		"Boucle    : {{#each students}}  {{index}}  {{name}}  {{mnu}}  {{gender}}  {{avg}}  {{observation}}  {{/each}}",
	].join("\n"),
	candidate_list: [
		"Scalaires : {{institution_name}}  {{session_name}}  {{subject_name}}  {{student_count}}",
		"Boucle    : {{#each candidates}}  {{index}}  {{table_number}}  {{name}}  {{mnu}}  {{gender}}  {{/each}}",
	].join("\n"),
};

// ─── Type sidebar ─────────────────────────────────────────────────────────────

function TypeSidebar({
	institutionId,
	selected,
	onSelect,
}: {
	institutionId: string;
	selected: TemplateType | null;
	onSelect: (t: TemplateType) => void;
}) {
	const { t } = useTranslation();
	const { data } = trpc.systemAdmin.listInstitutionTemplates.useQuery({
		institutionId,
	});
	const customTypes = new Set(data?.map((r) => r.type) ?? []);

	return (
		<nav className="flex flex-col gap-1">
			{TEMPLATE_TYPES.map((type) => (
				<button
					key={type}
					type="button"
					onClick={() => onSelect(type)}
					className={cn(
						"flex items-center justify-between rounded-lg px-3 py-2.5 text-left font-medium text-sm transition-colors",
						selected === type
							? "bg-primary text-primary-foreground"
							: "text-foreground hover:bg-muted",
					)}
				>
					<div className="flex items-center gap-2.5">
						<FileCode2 className="h-4 w-4 flex-shrink-0" />
						{t(`sysadmin.templates.type_${type}`)}
					</div>
					<span
						className={cn(
							"rounded-full px-1.5 py-0.5 text-xs",
							selected === type
								? "bg-white/20 text-white"
								: customTypes.has(type)
									? "bg-emerald-500/10 text-emerald-600"
									: "bg-muted text-muted-foreground",
						)}
					>
						{customTypes.has(type)
							? t("sysadmin.templates.custom_badge")
							: t("sysadmin.templates.default_badge")}
					</span>
				</button>
			))}
		</nav>
	);
}

// ─── Template editor (FR + EN tabs, single save) ──────────────────────────────

function TemplateEditor({
	institutionId,
	type,
}: {
	institutionId: string;
	type: TemplateType;
}) {
	const { t } = useTranslation();
	const utils = trpc.useUtils();
	const [lang, setLang] = useState<Lang>("fr");
	const [showPreview, setShowPreview] = useState(false);
	const [savedMsg, setSavedMsg] = useState(false);

	const { data, isLoading } = trpc.systemAdmin.getInstitutionTemplate.useQuery(
		{ institutionId, type },
		{ enabled: !!institutionId },
	);

	const [name, setName] = useState("");
	const [htmlFr, setHtmlFr] = useState("");
	const [htmlEn, setHtmlEn] = useState("");

	const [initialized, setInitialized] = useState(false);
	if (!isLoading && !initialized) {
		setName(
			data?.name ??
				`${t(`sysadmin.templates.type_${type}`)} — ${new Date().getFullYear()}`,
		);
		setHtmlFr(data?.htmlContentFr ?? DEFAULT_TEMPLATES[type].fr);
		setHtmlEn(data?.htmlContentEn ?? DEFAULT_TEMPLATES[type].en);
		setInitialized(true);
	}

	const [lastType, setLastType] = useState(type);
	if (type !== lastType) {
		setLastType(type);
		setInitialized(false);
		setSavedMsg(false);
		setShowPreview(false);
	}

	const upsert = trpc.systemAdmin.upsertInstitutionTemplate.useMutation({
		onSuccess: () => {
			utils.systemAdmin.listInstitutionTemplates.invalidate({ institutionId });
			utils.systemAdmin.getInstitutionTemplate.invalidate({
				institutionId,
				type,
			});
			setSavedMsg(true);
			setTimeout(() => setSavedMsg(false), 2500);
		},
	});

	const del = trpc.systemAdmin.deleteInstitutionTemplate.useMutation({
		onSuccess: () => {
			utils.systemAdmin.listInstitutionTemplates.invalidate({ institutionId });
			utils.systemAdmin.getInstitutionTemplate.invalidate({
				institutionId,
				type,
			});
			setHtmlFr(DEFAULT_TEMPLATES[type].fr);
			setHtmlEn(DEFAULT_TEMPLATES[type].en);
			setName(
				`${t(`sysadmin.templates.type_${type}`)} — ${new Date().getFullYear()}`,
			);
			setInitialized(false);
		},
	});

	const activeHtml = lang === "fr" ? htmlFr : htmlEn;
	const setActiveHtml = lang === "fr" ? setHtmlFr : setHtmlEn;
	const previewHtml = renderTemplate(activeHtml, PREVIEW_DATA[type]);

	if (isLoading) {
		return (
			<div className="flex flex-col gap-3">
				<Skeleton className="h-8 w-64" />
				<Skeleton className="h-[400px] w-full" />
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-5">
			{/* Header */}
			<div className="flex items-center justify-between gap-4">
				<div>
					<h2 className="font-semibold text-base text-foreground">
						{t(`sysadmin.templates.type_${type}`)}
					</h2>
					<p className="mt-0.5 text-muted-foreground text-xs">
						{t("sysadmin.templates.editor_tip")}
					</p>
				</div>
				<div className="flex items-center gap-2">
					{data && (
						<Button
							variant="ghost"
							size="sm"
							className="text-rose-600 hover:text-rose-700"
							onClick={async () => {
								const ok = await Confirm.call({
									title: t("sysadmin.templates.delete_confirm_title"),
									description: t("sysadmin.templates.delete_confirm_desc"),
									confirmLabel: t("sysadmin.templates.delete_btn"),
									destructive: true,
								});
								if (!ok) return;
								del.mutate({ id: data.id });
							}}
						>
							<Trash2 className="mr-1.5 h-4 w-4" />
							{t("sysadmin.templates.delete")}
						</Button>
					)}
					<Button
						variant="outline"
						size="sm"
						onClick={() => setShowPreview(!showPreview)}
					>
						{showPreview
							? t("sysadmin.templates.hide_preview", "Masquer l'aperçu")
							: t("sysadmin.templates.preview")}
					</Button>
					<Button
						size="sm"
						disabled={upsert.isPending}
						onClick={() =>
							upsert.mutate({
								institutionId,
								type,
								name: name.trim() || t(`sysadmin.templates.type_${type}`),
								htmlContentFr: htmlFr,
								htmlContentEn: htmlEn,
							})
						}
					>
						{upsert.isPending ? (
							<>
								<Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
								{t("sysadmin.templates.saving")}
							</>
						) : savedMsg ? (
							t("sysadmin.templates.saved")
						) : (
							t("sysadmin.templates.save")
						)}
					</Button>
				</div>
			</div>

			{/* Template name */}
			<div className="space-y-1.5">
				<Label>{t("sysadmin.templates.template_name")}</Label>
				<Input
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder={t("sysadmin.templates.template_name_placeholder")}
					className="max-w-sm"
				/>
			</div>

			{/* Variable reference */}
			<div className="space-y-1 rounded-lg border border-border bg-muted/40 px-4 py-3">
				<p className="font-medium text-foreground text-xs uppercase tracking-wide">
					{t("sysadmin.templates.vars_title")}
				</p>
				<p className="text-muted-foreground text-xs">
					{t("sysadmin.templates.vars_hint")}
				</p>
				<pre className="mt-1 whitespace-pre-wrap font-mono text-foreground text-xs leading-relaxed">
					{VAR_DOCS[type]}
				</pre>
			</div>

			{/* FR / EN tab + editor */}
			<div className="space-y-2">
				<div className="flex items-center justify-between">
					{/* Language tabs */}
					<div className="flex overflow-hidden rounded-lg border border-border">
						{(["fr", "en"] as Lang[]).map((l) => (
							<button
								key={l}
								type="button"
								onClick={() => setLang(l)}
								className={cn(
									"px-5 py-1.5 font-semibold text-sm transition-colors",
									lang === l
										? "bg-primary text-primary-foreground"
										: "text-muted-foreground hover:bg-muted",
								)}
							>
								{l.toUpperCase()}
							</button>
						))}
					</div>
					<button
						type="button"
						onClick={() => setActiveHtml(DEFAULT_TEMPLATES[type][lang])}
						className="text-muted-foreground text-xs underline underline-offset-2 hover:text-foreground"
					>
						{t("sysadmin.templates.load_default")}
					</button>
				</div>
				<CodeEditor
					value={activeHtml}
					onChange={setActiveHtml}
					minHeight="460px"
				/>
			</div>

			{/* Live preview */}
			{showPreview && (
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<Label>
							{t("sysadmin.templates.preview")} ({lang.toUpperCase()})
						</Label>
						<span className="text-muted-foreground text-xs italic">
							{t(
								"sysadmin.templates.preview_sample_notice",
								"Données d'exemple",
							)}
						</span>
					</div>
					<iframe
						title="Template preview"
						srcDoc={previewHtml}
						sandbox="allow-same-origin"
						className="h-[600px] w-full rounded-lg border border-border bg-white"
					/>
				</div>
			)}
		</div>
	);
}

// ─── Main exported tab ────────────────────────────────────────────────────────

export function InstitutionTemplatesTab() {
	const { id: institutionId } = useParams<{ id: string }>();
	const { t } = useTranslation();
	const [selectedType, setSelectedType] = useState<TemplateType | null>(null);

	if (!institutionId) return null;

	return (
		<div className="grid grid-cols-[200px_1fr] gap-6">
			<div className="space-y-3">
				<p className="font-medium text-foreground text-sm">
					{t("sysadmin.templates.select_type")}
				</p>
				<TypeSidebar
					institutionId={institutionId}
					selected={selectedType}
					onSelect={setSelectedType}
				/>
			</div>

			<div>
				{selectedType ? (
					<TemplateEditor institutionId={institutionId} type={selectedType} />
				) : (
					<div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border border-dashed py-16 text-center">
						<FileCode2 className="h-8 w-8 text-muted-foreground" />
						<p className="font-medium text-foreground">
							{t("sysadmin.templates.no_templates")}
						</p>
						<p className="max-w-xs text-muted-foreground text-sm">
							{t("sysadmin.templates.no_templates_desc")}
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
