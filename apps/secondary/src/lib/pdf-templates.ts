/**
 * PDF HTML templates — pure TypeScript functions, no .hbs/.html files.
 * Bundled by `bun build --target bun` so no extra COPY step in Dockerfile.
 */

// ─── Class roster ─────────────────────────────────────────────────────────────

export type RosterStudent = {
	firstName: string;
	lastName: string;
	mnu?: string | null;
	dateOfBirth?: Date | null;
	gender?: string | null;
	registrationNumber?: string | null;
};

export function buildClassRosterHtml(data: {
	institution: {
		name: string;
		city?: string | null;
		minesecCode?: string | null;
	};
	className: string;
	yearName: string;
	students: RosterStudent[];
	language?: string;
}): string {
	const lang = data.language === "en" ? "en" : "fr";
	const L =
		lang === "fr"
			? {
					title: "LISTE DES ÉLÈVES",
					class: "Classe",
					year: "Année scolaire",
					num: "N°",
					name: "Nom & Prénom",
					mnu: "Matricule",
					dob: "Date de naissance",
					sex: "Sexe",
					regNum: "N° immatriculation",
					total: "Total élèves",
					generated: "Document généré automatiquement",
				}
			: {
					title: "STUDENT ROSTER",
					class: "Class",
					year: "Academic year",
					num: "No.",
					name: "Full name",
					mnu: "ID",
					dob: "Date of birth",
					sex: "Sex",
					regNum: "Registration no.",
					total: "Total students",
					generated: "Auto-generated document",
				};

	const formatDate = (d?: Date | null) =>
		d ? new Date(d).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US") : "—";

	const rows = data.students
		.map(
			(s, i) => `
  <tr>
    <td class="num">${i + 1}</td>
    <td class="name">${s.lastName.toUpperCase()} ${s.firstName}</td>
    <td>${s.mnu ?? "—"}</td>
    <td>${formatDate(s.dateOfBirth)}</td>
    <td class="center">${s.gender ?? "—"}</td>
    <td class="reg">${s.registrationNumber ?? "—"}</td>
  </tr>`,
		)
		.join("");

	return `<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="UTF-8"/>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: Arial, sans-serif; font-size: 11px; color: #111; background: #fff; padding: 15mm 18mm; }
.header { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 14px; border-bottom: 2px solid #1a56db; padding-bottom: 10px; }
.school-name { font-size: 15px; font-weight: bold; text-transform: uppercase; color: #1a56db; }
.school-meta { font-size: 10px; color: #555; margin-top: 2px; }
.doc-title { margin-left: auto; text-align: right; }
.doc-title h2 { font-size: 13px; font-weight: bold; text-transform: uppercase; color: #1a56db; }
.doc-title .sub { font-size: 11px; color: #333; margin-top: 2px; }
.meta { display: flex; gap: 24px; margin-bottom: 12px; padding: 8px 10px; background: #f3f6ff; border-radius: 4px; }
.meta-item { display: flex; gap: 6px; font-size: 11px; }
.meta-label { font-weight: bold; color: #333; }
table { width: 100%; border-collapse: collapse; }
thead th { background: #1a56db; color: #fff; padding: 6px 8px; text-align: left; font-size: 10px; font-weight: bold; }
tbody tr:nth-child(even) { background: #f8f9fb; }
tbody td { padding: 5px 8px; border-bottom: 1px solid #e5e7eb; }
.num { text-align: center; width: 28px; color: #6b7280; }
.name { font-weight: 600; }
.center { text-align: center; }
.reg { font-family: monospace; font-size: 10px; color: #6b7280; }
.footer { margin-top: 14px; font-size: 10px; color: #888; border-top: 1px solid #e5e7eb; padding-top: 6px; display: flex; justify-content: space-between; }
</style>
</head>
<body>
<div class="header">
  <div>
    <div class="school-name">${data.institution.name}</div>
    <div class="school-meta">${[data.institution.city, data.institution.minesecCode].filter(Boolean).join(" · ")}</div>
  </div>
  <div class="doc-title">
    <h2>${L.title}</h2>
    <div class="sub">${data.className} — ${data.yearName}</div>
  </div>
</div>

<table>
  <thead>
    <tr>
      <th class="num">${L.num}</th>
      <th>${L.name}</th>
      <th>${L.mnu}</th>
      <th>${L.dob}</th>
      <th class="center">${L.sex}</th>
      <th>${L.regNum}</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>

<div class="footer">
  <span>${L.total} : <strong>${data.students.length}</strong></span>
  <span>${data.institution.name} — ${L.generated}</span>
</div>
</body></html>`;
}

// ─── Eligibility list ─────────────────────────────────────────────────────────

export type EligibilityCandidate = {
	lastName: string;
	firstName: string;
	mnu?: string | null;
	isEligible: boolean | null;
	annualAverage?: number | null;
	hasPaidFee: boolean | null;
	candidateNumber?: string | null;
};

export function buildEligibilityListHtml(data: {
	institution: {
		name: string;
		city?: string | null;
		minesecCode?: string | null;
	};
	examType: string;
	sessionYear: number;
	series?: string | null;
	candidates: EligibilityCandidate[];
	language?: string;
}): string {
	const lang = data.language === "en" ? "en" : "fr";
	const L =
		lang === "fr"
			? {
					title: "LISTE D'ÉLIGIBILITÉ",
					num: "N°",
					name: "Nom & Prénom",
					mnu: "MNU",
					avg: "Moy. annuelle",
					eligible: "Éligible",
					feePaid: "Frais payés",
					yes: "Oui",
					no: "Non",
					totalEligible: "Total éligibles",
					totalNotEligible: "Total non éligibles",
					generated: "Document généré automatiquement",
				}
			: {
					title: "ELIGIBILITY LIST",
					num: "No.",
					name: "Full name",
					mnu: "ID",
					avg: "Annual avg",
					eligible: "Eligible",
					feePaid: "Fee paid",
					yes: "Yes",
					no: "No",
					totalEligible: "Total eligible",
					totalNotEligible: "Total not eligible",
					generated: "Auto-generated document",
				};

	const eligible = data.candidates.filter((c) => c.isEligible);
	const notEligible = data.candidates.filter((c) => !c.isEligible);

	const row = (c: EligibilityCandidate, i: number) => `
  <tr>
    <td class="num">${i + 1}</td>
    <td class="name">${c.lastName.toUpperCase()} ${c.firstName}</td>
    <td class="mono">${c.mnu ?? "—"}</td>
    <td class="center">${c.annualAverage !== null && c.annualAverage !== undefined ? `${c.annualAverage.toFixed(2)}/20` : "—"}</td>
    <td class="center ${c.isEligible ? "yes" : "no"}">${c.isEligible ? L.yes : L.no}</td>
    <td class="center ${c.hasPaidFee ? "yes" : "no"}">${c.hasPaidFee ? L.yes : L.no}</td>
  </tr>`;

	const examLabel = [data.examType, data.series, String(data.sessionYear)]
		.filter(Boolean)
		.join(" ");

	return `<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="UTF-8"/>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: Arial, sans-serif; font-size: 11px; color: #111; background: #fff; padding: 15mm 18mm; }
.header { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 14px; border-bottom: 2px solid #1a56db; padding-bottom: 10px; }
.school-name { font-size: 15px; font-weight: bold; text-transform: uppercase; color: #1a56db; }
.school-meta { font-size: 10px; color: #555; margin-top: 2px; }
.doc-title { margin-left: auto; text-align: right; }
.doc-title h2 { font-size: 13px; font-weight: bold; text-transform: uppercase; color: #1a56db; }
.doc-title .sub { font-size: 11px; color: #333; margin-top: 2px; }
.stats { display: flex; gap: 16px; margin-bottom: 12px; }
.stat-box { flex: 1; padding: 8px 12px; border-radius: 4px; font-size: 11px; }
.stat-box.elig { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; }
.stat-box.noelig { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; }
.stat-box .val { font-size: 20px; font-weight: bold; }
table { width: 100%; border-collapse: collapse; }
thead th { background: #1a56db; color: #fff; padding: 6px 8px; text-align: left; font-size: 10px; font-weight: bold; }
tbody tr:nth-child(even) { background: #f8f9fb; }
tbody td { padding: 5px 8px; border-bottom: 1px solid #e5e7eb; }
.num { text-align: center; width: 28px; color: #6b7280; }
.name { font-weight: 600; }
.center { text-align: center; }
.mono { font-family: monospace; font-size: 10px; }
.yes { color: #166534; font-weight: bold; }
.no { color: #991b1b; font-weight: bold; }
.footer { margin-top: 14px; font-size: 10px; color: #888; border-top: 1px solid #e5e7eb; padding-top: 6px; display: flex; justify-content: space-between; }
</style>
</head>
<body>
<div class="header">
  <div>
    <div class="school-name">${data.institution.name}</div>
    <div class="school-meta">${[data.institution.city, data.institution.minesecCode].filter(Boolean).join(" · ")}</div>
  </div>
  <div class="doc-title">
    <h2>${L.title}</h2>
    <div class="sub">${examLabel}</div>
  </div>
</div>

<div class="stats">
  <div class="stat-box elig"><div class="val">${eligible.length}</div>${L.totalEligible}</div>
  <div class="stat-box noelig"><div class="val">${notEligible.length}</div>${L.totalNotEligible}</div>
</div>

<table>
  <thead>
    <tr>
      <th class="num">${L.num}</th>
      <th>${L.name}</th>
      <th>${L.mnu}</th>
      <th class="center">${L.avg}</th>
      <th class="center">${L.eligible}</th>
      <th class="center">${L.feePaid}</th>
    </tr>
  </thead>
  <tbody>${data.candidates.map(row).join("")}</tbody>
</table>

<div class="footer">
  <span>${data.institution.name} — ${L.generated}</span>
</div>
</body></html>`;
}

// ─── Candidate list ───────────────────────────────────────────────────────────

export type ExamCandidate = {
	candidateNumber?: string | null;
	lastName: string;
	firstName: string;
	mnu?: string | null;
	dateOfBirth?: Date | null;
	isEligible: boolean | null;
	isAdmitted?: boolean | null;
	mention?: string | null;
};

export function buildCandidateListHtml(data: {
	institution: {
		name: string;
		city?: string | null;
		minesecCode?: string | null;
		centerCode?: string | null;
	};
	examType: string;
	sessionYear: number;
	series?: string | null;
	candidates: ExamCandidate[];
	language?: string;
}): string {
	const lang = data.language === "en" ? "en" : "fr";
	const L =
		lang === "fr"
			? {
					title: "LISTE DES CANDIDATS",
					numCand: "N° candidat",
					name: "Nom & Prénom",
					mnu: "MNU",
					dob: "Date nais.",
					eligible: "Éligible",
					result: "Résultat",
					mention: "Mention",
					center: "Centre",
					total: "Total candidats",
					yes: "Oui",
					no: "Non",
					admitted: "Admis",
					notAdmitted: "Ajourné",
					generated: "Document généré automatiquement",
				}
			: {
					title: "CANDIDATE LIST",
					numCand: "Candidate no.",
					name: "Full name",
					mnu: "ID",
					dob: "Date of birth",
					eligible: "Eligible",
					result: "Result",
					mention: "Mention",
					center: "Center",
					total: "Total candidates",
					yes: "Yes",
					no: "No",
					admitted: "Admitted",
					notAdmitted: "Failed",
					generated: "Auto-generated document",
				};

	const formatDate = (d?: Date | null) =>
		d ? new Date(d).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US") : "—";

	const rows = data.candidates
		.map(
			(c, i) => `
  <tr>
    <td class="num">${i + 1}</td>
    <td class="mono center">${c.candidateNumber ?? "—"}</td>
    <td class="name">${c.lastName.toUpperCase()} ${c.firstName}</td>
    <td class="mono">${c.mnu ?? "—"}</td>
    <td class="center">${formatDate(c.dateOfBirth)}</td>
    <td class="center ${c.isEligible ? "yes" : "no"}">${c.isEligible ? L.yes : L.no}</td>
    <td class="center ${c.isAdmitted === true ? "yes" : c.isAdmitted === false ? "no" : ""}">${
			c.isAdmitted === true
				? L.admitted
				: c.isAdmitted === false
					? L.notAdmitted
					: "—"
		}</td>
    <td class="center">${c.mention ?? "—"}</td>
  </tr>`,
		)
		.join("");

	const examLabel = [data.examType, data.series, String(data.sessionYear)]
		.filter(Boolean)
		.join(" ");

	return `<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="UTF-8"/>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: Arial, sans-serif; font-size: 10px; color: #111; background: #fff; padding: 12mm 16mm; }
.header { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; border-bottom: 2px solid #1a56db; padding-bottom: 10px; }
.school-name { font-size: 14px; font-weight: bold; text-transform: uppercase; color: #1a56db; }
.school-meta { font-size: 9px; color: #555; margin-top: 2px; }
.doc-title { margin-left: auto; text-align: right; }
.doc-title h2 { font-size: 12px; font-weight: bold; text-transform: uppercase; color: #1a56db; }
.doc-title .sub { font-size: 10px; color: #333; margin-top: 2px; }
.center-info { margin-bottom: 10px; font-size: 10px; color: #444; }
table { width: 100%; border-collapse: collapse; }
thead th { background: #1a56db; color: #fff; padding: 5px 6px; text-align: left; font-size: 9px; font-weight: bold; }
tbody tr:nth-child(even) { background: #f8f9fb; }
tbody td { padding: 4px 6px; border-bottom: 1px solid #e5e7eb; }
.num { text-align: center; width: 24px; color: #6b7280; }
.name { font-weight: 600; }
.center { text-align: center; }
.mono { font-family: monospace; }
.yes { color: #166534; font-weight: bold; }
.no { color: #991b1b; font-weight: bold; }
.footer { margin-top: 12px; font-size: 9px; color: #888; border-top: 1px solid #e5e7eb; padding-top: 5px; display: flex; justify-content: space-between; }
</style>
</head>
<body>
<div class="header">
  <div>
    <div class="school-name">${data.institution.name}</div>
    <div class="school-meta">${[data.institution.city, data.institution.minesecCode].filter(Boolean).join(" · ")}</div>
  </div>
  <div class="doc-title">
    <h2>${L.title}</h2>
    <div class="sub">${examLabel}</div>
  </div>
</div>
${data.institution.centerCode ? `<div class="center-info">${L.center} : <strong>${data.institution.centerCode}</strong></div>` : ""}

<table>
  <thead>
    <tr>
      <th class="num">N°</th>
      <th class="center">${L.numCand}</th>
      <th>${L.name}</th>
      <th>${L.mnu}</th>
      <th class="center">${L.dob}</th>
      <th class="center">${L.eligible}</th>
      <th class="center">${L.result}</th>
      <th class="center">${L.mention}</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>

<div class="footer">
  <span>${L.total} : <strong>${data.candidates.length}</strong></span>
  <span>${data.institution.name} — ${L.generated}</span>
</div>
</body></html>`;
}
