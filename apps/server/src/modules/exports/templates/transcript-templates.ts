export const RELEVE_TEMPLATE_STANDARD = /* html */ `
<!--
  Relevé de notes — modèle officiel par défaut (institution standard).
  Structure portée 1:1 depuis DIPLOMATION (releve_template.html) avec :
    - les references settings.* remplacees par les vraies variables du
      contexte de rendu (institution.*, theme.*, logos.*)
    - le mode démo retiré (banner / watermark / qr-badge supprimés)
    - le toggle IPES vs Faculté piloté par \`institution.isIPES\` (basé sur
      \`institutions.type\`) — pas de variable \`establishmentType\` dans le JSON.

  IPES (institution.type === 'institution') → affiche les infos institut
    (nom, BP, email, logo) à côté de l'en-tête tutelle.
  Faculté (institution.type === 'faculty') → l'institution EST la faculté
    chapeautant le programme ; l'en-tête institut est masqué.
-->
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Relevé de notes — {{upper student.firstName}} {{upper student.lastName}}</title>
<style>
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
body {
	font-family: {{theme.fonts.main}};
	width: 200mm;
	min-height: 287mm;
	background-color: white;
	margin: 5mm;
	border: 3px double {{theme.colors.primary}};
	color: {{theme.colors.primary}};
	position: relative;
	overflow: hidden;
}

.header { line-height: normal; font-size: 9px; font-family: {{theme.fonts.header}}; }

.watermark {
	position: absolute;
	top: 120px; left: 0;
	width: 100%; height: 100%;
	z-index: -1;
	display: {{#if theme.watermark.enabled}}flex{{else}}none{{/if}};
	justify-content: center; align-items: center;
	opacity: {{theme.watermark.logoOpacity}};
	pointer-events: none;
}
.watermark img { width: 600px; height: auto; }

.qr-code { width: 100px; height: 100px; display: block; position: relative; }

.header-row1 { text-align: center; margin-bottom: 20px; margin-top: 8px; display: flex; justify-content: space-between; align-items: center; }
.header-row1 .header-content strong { text-transform: uppercase; }
.header h1 { font-size: 17px; }

.student_block1 { display: flex; flex-direction: row; justify-content: space-between; }
.student_block1, .student-info { width: 90%; margin-left: auto; margin-right: auto; font-size: 10px; gap: 10px; }
.student-info { display: grid; grid-template-columns: 1fr 1fr 1.2fr; margin-bottom: 20px; }
.student-info p { font-size: 10px; margin: 0; padding: 0; }
.student-info > div { margin: 0; padding: 0; font-size: 10px; }

table { margin-left: auto; margin-right: auto; width: 96%; border-collapse: collapse; margin-bottom: 20px; font-size: 8.5px; }
th, td { border: 0.5px solid {{theme.colors.primary}}; padding: 2px; text-align: left; }
th { background-color: {{theme.colors.tableHeaderBg}}; color: {{theme.colors.tableHeaderText}}; }

.grade-scale { display: flex; font-size: 7px !important; float: left; margin-left: 20px; width: 50%; }
.grade-scale table { width: auto; margin-right: 10px; }
.grade-scale div { display: inline-block; }

/* Signature spécifique au type d'établissement */
.signature-{{institution.type}} { width: 50%; margin-left: 40px; font-size: 12px; }
.signature { margin-top: 30px; float: right; text-align: left; font-size: 12px; margin-right: 20px; }

.header-content { width: 35%; }
.header-logo-content { margin-top: 4px; align-content: center; display: flex; align-items: center; justify-content: space-between; }
.header-logo-content > div { width: 100%; height: 100%; align-items: center; align-content: center; }

.header-row2 h1 { font-weight: 100; text-align: center; font-size: 17px; color: {{theme.colors.primary}}; }
.header-row2 p { font-size: 12px; }
.header-row2 { text-align: center; }

td { text-align: center; }
.table { padding-left: 20px; }
.table-head th { text-align: center; }
.table-ue-code, .table-ue-label, .table-ue-avearage { font-weight: bold; }
.table-ec, .table-ue-title { text-align: left; }

.grade-sign { display: flex; justify-content: start; width: 96%; margin: 0 auto; }
.grade-sign th, .grade-sign td { padding: 1px; border: 0.5px solid {{theme.colors.primary}}; }

body > .container { width: 100%; height: 100%; position: relative; }
.footer-note { position: absolute; width: 100%; bottom: 10px; font-size: 7px; text-align: center; margin-top: 20px; padding-top: 10px; font-style: italic; }

.header-title { color: {{theme.colors.primary}}; }
.validated { color: {{theme.colors.passingGrade}}; font-weight: bold; }
.not-validated { color: {{theme.colors.failingGrade}}; }

        /* Page-break controls — keep cohesive blocks together and repeat
           table headers on each page. Added globally so long roster/grade
           tables don't slice across pages. */
        @media print {
            tr, .signatures, .signature, .signature-box, .legend-table,
            .stats-section, .stats-row, .eval-info, .ec-info, .ue-info,
            .bottom-section, .footer, .footer-info, .footer-note {
                page-break-inside: avoid;
                break-inside: avoid;
            }
            thead {
                display: table-header-group;
            }
            tfoot {
                display: table-footer-group;
            }
        }
        @page { orphans: 3; widows: 3; }
    </style>
</head>
<body>
<div class="container">
	<div class="watermark">
		{{{logo svg=institution.watermarkLogoSvg url=institution.watermarkLogoUrl alt="Watermark"}}}
	</div>

	<div class="header">
		<div class="header-row1">
			<div class="header-content">
				<p>REPUBLIQUE DU CAMEROUN<br>
				<em>Paix – Travail – Patrie</em><br>
				********************<br>
				MINISTERE DE L'ENSEIGNEMENT SUPERIEUR<br>
				{{#if university.fr}}********************<br><strong>{{upper university.fr}}</strong><br>{{/if}}
				{{#if faculty.fr}}********************<br><strong>{{upper faculty.fr}}</strong><br>{{/if}}
				{{#if institution.isIPES}}
				********************<br>
				<strong>{{upper institution.nameFr}}</strong><br>
				{{#if institution.postalBox}}********************<br>B.P {{institution.postalBox}}<br>{{/if}}
				{{#if institution.contactEmail}}Email: <a href="mailto:{{institution.contactEmail}}">{{institution.contactEmail}}</a>{{/if}}
				{{/if}}
				</p>
			</div>
			<div class="header-logo-content">
				{{#if (or logos.universitySvg logos.university)}}<div>{{{logo svg=logos.universitySvg url=logos.university alt="University Logo" style="height:70px;"}}}</div>{{/if}}
				{{#if (or logos.facultySvg logos.faculty)}}<div>{{{logo svg=logos.facultySvg url=logos.faculty alt="Faculty Logo" style="height:50px;margin:5px;"}}}</div>{{/if}}
				{{#if institution.isIPES}}{{#if (or institution.logoSvg institution.logoUrl)}}<div>{{{logo svg=institution.logoSvg url=institution.logoUrl alt="IPES Logo" style="height:70px;"}}}</div>{{/if}}{{/if}}
			</div>
			<div class="header-content">
				<p>REPUBLIC OF CAMEROON<br>
				<em>Peace – Work - Fatherland</em><br>
				********************<br>
				MINISTRY OF HIGHER EDUCATION<br>
				{{#if university.en}}********************<br><strong>{{upper university.en}}</strong><br>{{/if}}
				{{#if faculty.en}}********************<br><strong>{{upper faculty.en}}</strong><br>{{/if}}
				{{#if institution.isIPES}}
				********************<br>
				<strong>{{upper institution.nameEn}}</strong><br>
				{{#if institution.postalBox}}********************<br>PO box {{institution.postalBox}}<br>{{/if}}
				{{#if institution.contactEmail}}Email: <a href="mailto:{{institution.contactEmail}}">{{institution.contactEmail}}</a>{{/if}}
				{{/if}}
				</p>
			</div>
		</div>
		<div class="header-row2">
			<h1 class="header-title"><strong>RELEVE DE NOTES</strong> / TRANSCRIPT</h1>
			<p><strong>Ref N°</strong> {{document.referenceNumber}}</p>
		</div>
	</div>

	<div class="student_block1">
		<div>
			<p><strong><strong>NOM(S) ET PRENOM(S) :</strong> {{upper student.firstName}} {{upper student.lastName}}</strong><br>
			<em>Surname and name</em></p>
		</div>
		<div>
			<p><strong>MATRICULE :</strong> <strong>{{student.matricule}}</strong><br>
			<em>Registration N°</em></p>
		</div>
	</div>
	<div class="student-info">
		<div>
			<p><strong>NÉ(E) LE : {{student.birthDate}}</strong><br>
			<em>Born on</em></p>
		</div>
		<div>
			<p><strong>À :</strong> <strong>{{student.birthPlace}}</strong><br>
			<em>At</em></p>
		</div>
		<div></div>
		<div>
			<p><strong>CYCLE :</strong> <strong>{{program.level}}</strong><br>
			<em>Training cycle</em></p>
		</div>
		<div>
			<p><strong>ANNÉE ACADÉMIQUE :</strong> <strong>{{document.academicYear}}</strong><br>
			<em>Academic year</em></p>
		</div>
		<div>
			<p><strong>FILIÈRE :</strong> <strong>{{program.name}}</strong><br>
			<em>Field of study</em></p>
		</div>
		<div>
			<p><strong>NIVEAU :</strong> <strong>{{class.name}}</strong><br>
			<em>Level</em></p>
		</div>
		<div>
			<p><strong>CLASSE :</strong> <strong>{{class.code}}</strong><br>
			<em>Class</em></p>
		</div>
		{{#if student.option}}
		<div>
			<p><strong>OPTION :</strong> <strong>{{student.option}}</strong><br>
			<em>Option</em></p>
		</div>
		{{/if}}
	</div>

	<div class="table">
		<table>
			<thead>
				<tr class="table-head">
					<th class="table-code">CODE</th>
					<th colspan="3" class="table-ue">UNITE D'ENSEIGNEMENT</th>
					<th colspan="2" class="table-ec">ELEMENT CONSTITUTIF</th>
					<th class="table-session">SESSION</th>
					<th class="table-note">NOTE</th>
					<th class="table-average">MOYENNE</th>
					<th class="table-credit">CREDIT</th>
				</tr>
			</thead>
			<tbody>
				{{#each semesters}}
					{{#each this.ues}}
						{{#each this.courses}}
						<tr>
							<td class="table-code"><strong>{{this.code}}</strong></td>
							<td colspan="3" class="table-ue table-ue-title"><strong>{{../name}}</strong></td>
							<td colspan="2" class="table-ec">{{this.name}}</td>
							<td class="table-session">{{../../name}}</td>
							<td class="table-note">{{formatNumber this.exam}}</td>
							<td class="table-average"><strong>{{formatNumber this.average}}</strong></td>
							<td class="table-credit">{{this.credits}}</td>
						</tr>
						{{/each}}
					{{/each}}
				{{/each}}

				<tr class="table-summary">
					<td colspan="10">&nbsp;</td>
				</tr>
				<tr class="table-footer">
					<td class="summary-label">RELEVE NIVEAU</td>
					<td class="summary-label">SEMESTRE</td>
					<td class="summary-label">TOTAL CREDIT</td>
					<td colspan="2" class="summary-label">MOYENNE / 20</td>
					<td class="summary-label">MGP</td>
					<td class="summary-label">GRADE</td>
					<td colspan="4" class="summary-label">DECISION DU JURY</td>
				</tr>
				<tr class="table-footer-values">
					<td class="summary-value"><strong>{{class.name}}</strong></td>
					<td class="summary-value"><strong>—</strong></td>
					<td class="summary-value"><strong>{{summary.creditsEarned}}</strong></td>
					<td colspan="2" class="summary-value"><strong>{{formatNumber summary.generalAverage}}</strong></td>
					<td class="summary-value"><strong>—</strong></td>
					<td class="summary-value"><strong>{{getAppreciation summary.generalAverage}}</strong></td>
					<td colspan="4" class="summary-value validated"><strong>{{summary.decision}}</strong></td>
				</tr>
			</tbody>
		</table>
	</div>

	<div class="grade-sign">
		<div class="grade-scale">
			<div>
				<table style="table-layout: auto;">
					<tbody style="font-size: 6px;">
						<tr><td><strong>Grade</strong></td><td><strong>Appréciation</strong></td><td><strong>Moy /20</strong></td></tr>
						{{#each grading.appreciations}}
						<tr><td><strong>{{gradeLetter}}</strong></td><td><strong>{{label}}</strong></td><td><strong>[{{min}}-{{max}}]</strong></td></tr>
						{{/each}}
					</tbody>
				</table>
			</div>
			<div style="position: relative;">
				{{#if qrCodeImage}}<img src="{{qrCodeImage}}" alt="QR Code" class="qr-code">{{/if}}
			</div>
		</div>

		<div class="signature">
			<div><strong>{{institution.city}}, le {{document.issueDate}}</strong>
			<br/><i>{{institution.city}}, the {{document.issueDate}}</i></div><br/>

			{{#if institution.isIPES}}
				<div><strong>Le Directeur de l'{{institution.abbreviation}}</strong>
				<br/><i>The Director of {{institution.abbreviation}}</i></div>
			{{else}}
				<div><strong>Le Doyen de la Faculté</strong>
				<br/><i>The Dean of the Faculty</i></div>
			{{/if}}
		</div>
	</div>

	{{#if institution.isIPES}}
	<div class="signature-{{institution.type}}"><strong>Le Directeur de l'{{institution.abbreviation}}</strong>
	<br/><i>The Director of {{institution.abbreviation}}</i></div>
	{{/if}}
</div>

<div class="footer-note">
	Il n'est délivré qu'un seul exemplaire de relevé de notes, le titulaire peut en faire des copies certifiées conformes.<br>
	<em>This transcript is delivered only once, the owner can do many certified copies as necessary.</em>
</div>
</body>
</html>

`;

export const RELEVE_TEMPLATE_IPES = /* html */ `
<!--
  Relevé de notes — Modèle IPES (institution.type === 'institution').
  Pour les IPES (Instituts Privés d'Enseignement Supérieur) chapeautés par
  une faculté + université. L'en-tête liste : République + Ministère +
  Université de tutelle + Faculté de tutelle + bloc IPES (nom, BP, email).
  Trois logos dans la barre du haut : université / faculté / IPES.
  Signataires : Directeur de l'IPES + Recteur de l'université.
-->
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Relevé de notes — {{upper student.firstName}} {{upper student.lastName}}</title>
<style>
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
body {
	font-family: {{theme.fonts.main}};
	width: 200mm;
	min-height: 287mm;
	background-color: white;
	margin: 5mm;
	border: 3px double {{theme.colors.primary}};
	color: {{theme.colors.primary}};
	position: relative;
	overflow: hidden;
}

.header { line-height: normal; font-size: 9px; font-family: {{theme.fonts.header}}; }

.watermark {
	position: absolute; top: 120px; left: 0;
	width: 100%; height: 100%;
	z-index: -1;
	display: {{#if theme.watermark.enabled}}flex{{else}}none{{/if}};
	justify-content: center; align-items: center;
	opacity: {{theme.watermark.logoOpacity}};
	pointer-events: none;
}
.watermark img { width: 600px; height: auto; }

.qr-code { width: 100px; height: 100px; display: block; position: relative; }

.header-row1 { text-align: center; margin-bottom: 20px; margin-top: 8px; display: flex; justify-content: space-between; }
.header h1 { font-size: 17px; }

.student_block1 { display: flex; flex-direction: row; justify-content: space-between; }
.student_block1, .student-info { width: 90%; margin-left: auto; margin-right: auto; font-size: 10px; gap: 10px; }
.student-info { display: grid; grid-template-columns: 1fr 1fr 1.2fr; margin-bottom: 20px; }
.student-info p { font-size: 10px; margin: 0; padding: 0; }
.student-info > div { margin: 0; padding: 0; font-size: 10px; }

table { margin-left: auto; margin-right: auto; width: 96%; border-collapse: collapse; margin-bottom: 20px; font-size: 8.5px; }
th, td { border: 0.5px solid {{theme.colors.primary}}; padding: 2px; text-align: left; }
th { background-color: {{theme.colors.tableHeaderBg}}; color: {{theme.colors.tableHeaderText}}; }

.grade-scale { display: flex; font-size: 7px !important; float: left; margin-left: 20px; width: 50%; }
.grade-scale table { width: auto; margin-right: 10px; }
.grade-scale div { display: inline-block; }

.signature-ipes { width: 50%; margin-left: 40px; font-size: 12px; }
.signature { margin-top: 30px; float: right; text-align: left; font-size: 12px; margin-right: 20px; }

.header-content { width: 35%; }
/* Logos in hierarchy order: highest tutelle first → … → current institution.
   Centered horizontally with a uniform gap so missing logos never spread the
   group apart. */
.header-logo-content { margin-top: 4px; display: flex; align-items: center; justify-content: center; gap: 12px; flex-wrap: nowrap; }
.header-logo-content > div { display: flex; align-items: center; justify-content: center; }

.header-row2 h1 { font-weight: 100; text-align: center; font-size: 17px; color: {{theme.colors.primary}}; }
.header-row2 p { font-size: 12px; }
.header-row2 { text-align: center; }

td { text-align: center; }
.table { padding-left: 20px; }
.table-head th { text-align: center; }
.table-ue-code, .table-ue-label, .table-ue-avearage { font-weight: bold; }
.table-ec, .table-ue-title { text-align: left; }

.grade-sign { display: flex; justify-content: start; width: 96%; margin: 0 auto; }
.grade-sign th, .grade-sign td { padding: 1px; border: 0.5px solid {{theme.colors.primary}}; }

body > .container { width: 100%; height: 100%; position: relative; }
.footer-note { position: absolute; width: 100%; bottom: 10px; font-size: 7px; text-align: center; margin-top: 20px; padding-top: 10px; font-style: italic; }

.header-title { color: {{theme.colors.primary}}; }
.validated { color: {{theme.colors.passingGrade}}; font-weight: bold; }
.not-validated { color: {{theme.colors.failingGrade}}; }

        /* Page-break controls — keep cohesive blocks together and repeat
           table headers on each page. Added globally so long roster/grade
           tables don't slice across pages. */
        @media print {
            tr, .signatures, .signature, .signature-box, .legend-table,
            .stats-section, .stats-row, .eval-info, .ec-info, .ue-info,
            .bottom-section, .footer, .footer-info, .footer-note {
                page-break-inside: avoid;
                break-inside: avoid;
            }
            thead {
                display: table-header-group;
            }
            tfoot {
                display: table-footer-group;
            }
        }
        @page { orphans: 3; widows: 3; }
    </style>
</head>
<body>
<div class="container">
	<div class="watermark">
		{{{logo svg=institution.watermarkLogoSvg url=institution.watermarkLogoUrl alt="Watermark"}}}
	</div>

	<div class="header">
		<div class="header-row1">
			<div class="header-content">
				<p>REPUBLIQUE DU CAMEROUN<br>
				<em>Paix – Travail – Patrie</em><br>
				********************<br>
				MINISTERE DE L'ENSEIGNEMENT SUPERIEUR<br>
				{{#each tutelleChain}}
				********************<br>
				<strong>{{upper this.nameFr}}</strong><br>
				{{#unless @first}}
					{{#if this.postalBox}}<span style="font-size:8px;">{{this.postalBox}}</span><br>{{/if}}
					{{#if this.contactEmail}}<span style="font-size:8px;">Email : {{this.contactEmail}}</span><br>{{/if}}
				{{/unless}}
				{{/each}}
				********************<br>
				<strong>{{upper institution.nameFr}}</strong><br>
				{{#if institution.postalBox}}********************<br>{{institution.postalBox}}<br>{{/if}}
				{{#if institution.contactEmail}}Email : <a href="mailto:{{institution.contactEmail}}">{{institution.contactEmail}}</a>{{/if}}
				</p>
			</div>
			<div class="header-logo-content">
				{{#each tutelleChain}}{{#if (or this.logoSvg this.logoUrl)}}<div>{{{logo svg=this.logoSvg url=this.logoUrl alt=this.nameFr style="height:60px;margin:4px;"}}}</div>{{/if}}{{/each}}
				{{#if (or institution.logoSvg institution.logoUrl)}}<div>{{{logo svg=institution.logoSvg url=institution.logoUrl alt=institution.nameFr style="height:70px;"}}}</div>{{/if}}
			</div>
			<div class="header-content">
				<p>REPUBLIC OF CAMEROON<br>
				<em>Peace – Work – Fatherland</em><br>
				********************<br>
				MINISTRY OF HIGHER EDUCATION<br>
				{{#each tutelleChain}}
				********************<br>
				<strong>{{upper this.nameEn}}</strong><br>
				{{#unless @first}}
					{{#if this.postalBox}}<span style="font-size:8px;">{{this.postalBox}}</span><br>{{/if}}
					{{#if this.contactEmail}}<span style="font-size:8px;">Email : {{this.contactEmail}}</span><br>{{/if}}
				{{/unless}}
				{{/each}}
				********************<br>
				<strong>{{upper institution.nameEn}}</strong><br>
				{{#if institution.postalBox}}********************<br>{{institution.postalBox}}<br>{{/if}}
				{{#if institution.contactEmail}}Email : <a href="mailto:{{institution.contactEmail}}">{{institution.contactEmail}}</a>{{/if}}
				</p>
			</div>
		</div>
		<div class="header-row2">
			<h1 class="header-title"><strong>RELEVE DE NOTES</strong> / TRANSCRIPT</h1>
			<p><strong>Ref N°</strong>&nbsp;&nbsp;_____________&nbsp;/{{document.referenceNumber}}</p>
		</div>
	</div>

	<div class="student_block1">
		<div>
			<p><strong>NOM(S) ET PRENOM(S) : {{upper student.firstName}} {{upper student.lastName}}</strong><br>
			<em>surname and name:</em></p>
		</div>
		<div>
			<p><strong>MATRICULE: {{student.matricule}}</strong><br>
			<em>Registration N°:</em></p>
		</div>
	</div>
	<div class="student-info">
		<div>
			<p><strong>NÉ(E) LE : {{student.birthDate}}</strong><br>
			<em>Born on:</em></p>
		</div>
		<div>
			<p><strong>À: {{student.birthPlace}}</strong><br>
			<em>At:</em></p>
		</div>
		<div>
			<p><strong>FILIÈRE: {{program.name}}</strong><br>
			<em>Field of Study:</em></p>
		</div>
		<div>
			<p><strong>CYCLE: {{program.level}}</strong><br>
			<em>Training cycle:</em></p>
		</div>
		<div>
			<p><strong>ANNÉE ACADÉMIQUE: {{document.academicYear}}</strong><br>
			<em>Academic Year:</em></p>
		</div>
		<div>
			<p><strong>OPTION : {{#if student.option}}{{student.option}}{{else}}—{{/if}}</strong><br>
			<em>Option:</em></p>
		</div>
		<div>
			<p><strong>NIVEAU: {{class.name}}</strong><br>
			<em>Level:</em></p>
		</div>
		<div>
			<p><strong>SEMESTRE: —</strong><br>
			<em>Semester:</em></p>
		</div>
		<div></div>
	</div>

	<div class="table">
		<table>
			<thead>
				<tr class="table-head">
					<th class="table-code">CODE UE</th>
					<th colspan="3" class="table-ue">UNITE D'ENSEIGNEMENT</th>
					<th colspan="2" class="table-ec">INTITULE ELEMENTS CONSTITUTIFS</th>
					<th class="table-note">NOTE/20<br><span style="font-weight:normal;font-style:italic;font-size:7px;">Mark/20</span></th>
					<th class="table-average">MOYENNE<br><span style="font-weight:normal;font-style:italic;font-size:7px;">Average</span></th>
					<th class="table-credit">CREDIT<br><span style="font-weight:normal;font-style:italic;font-size:7px;">Credit</span></th>
				</tr>
			</thead>
			<tbody>
				{{#each semesters}}
					{{#each this.ues}}
						{{#each this.courses}}
						<tr>
							{{#if @first}}
							<td class="table-code" rowspan="{{../courses.length}}"><strong>{{../code}}</strong></td>
							<td colspan="3" class="table-ue table-ue-title" rowspan="{{../courses.length}}"><strong>{{../name}}</strong></td>
							{{/if}}
							<td colspan="2" class="table-ec">{{this.name}}</td>
							<td class="table-note">{{formatNumber this.exam}}</td>
							{{#if @first}}
							<td class="table-average" rowspan="{{../courses.length}}"><strong>{{formatNumber ../average}}</strong></td>
							<td class="table-credit" rowspan="{{../courses.length}}">{{../credits}}</td>
							{{/if}}
						</tr>
						{{/each}}
					{{/each}}
				{{/each}}

				<tr class="table-summary"><td colspan="9">&nbsp;</td></tr>
				<tr class="table-footer">
					<td class="summary-label">RELEVE NIVEAU</td>
					<td class="summary-label">SEMESTRE</td>
					<td class="summary-label">TOTAL CREDITS /30</td>
					<td colspan="3" class="summary-label">MOYENNE SEMESTRIELLE/20</td>
					<td class="summary-label">MGP</td>
					<td class="summary-label">GRADE</td>
					<td class="summary-label">DECISION DU JURY</td>
				</tr>
				<tr class="table-footer-values">
					<td class="summary-value"><strong>{{class.name}}</strong></td>
					<td class="summary-value"><strong>—</strong></td>
					<td class="summary-value"><strong>{{summary.creditsEarned}}</strong></td>
					<td colspan="3" class="summary-value"><strong>{{formatNumber summary.generalAverage}}</strong></td>
					<td class="summary-value"><strong>—</strong></td>
					<td class="summary-value"><strong>{{getAppreciation summary.generalAverage}}</strong></td>
					<td class="summary-value validated"><strong>{{summary.decision}}</strong></td>
				</tr>
			</tbody>
		</table>
	</div>

	<div class="grade-sign">
		<div class="grade-scale">
			<div>
				<table style="table-layout: auto;">
					<tbody style="font-size: 6px;">
						<tr><td><strong>Grade</strong></td><td><strong>Appréciation</strong></td><td><strong>Moy /20</strong></td></tr>
						{{#each grading.appreciations}}
						<tr><td><strong>{{gradeLetter}}</strong></td><td><strong>{{label}}</strong></td><td><strong>[{{min}}-{{max}}]</strong></td></tr>
						{{/each}}
					</tbody>
				</table>
			</div>
			<div style="position: relative;">
				{{#if qrCodeImage}}<img src="{{qrCodeImage}}" alt="QR Code" class="qr-code">{{/if}}
			</div>
		</div>

		<div class="signature">
			<div><strong>Douala, le {{document.issueDate}}</strong>
			<br/><i>Douala, the {{document.issueDate}}</i></div><br/>

			{{#if parentInstitution}}
			<div><strong>LE DOYEN {{parentInstitution.displaySigle}}</strong>
			<br/><i>The Dean of {{parentInstitution.displaySigle}}</i></div>
			{{/if}}
		</div>
	</div>

	<div class="signature-ipes">
		<strong>Le Directeur de l'{{institution.abbreviation}}</strong>
		<br/><i>The Director of {{institution.abbreviation}}</i>
	</div>
</div>

<div class="footer-note">
	Il n'est délivré qu'un seul exemplaire de relevé de notes, le titulaire peut en faire des copies certifiées conformes.<br>
	<em>This transcript is delivered only once, the owner can do many certified copies as necessary.</em>
</div>
</body>
</html>

`;

export const RELEVE_TEMPLATE_FACULTY = /* html */ `
<!--
  Relevé de notes — Modèle Faculté (institution.type === 'faculty').
  Pour les facultés (FMSP, etc.) qui sont elles-mêmes des unités d'une
  université. L'en-tête : République + Ministère + Université de tutelle +
  Faculté (= institution courante). Pas de bloc IPES intermédiaire.
  Logos : université + faculté. Signataire : Doyen de la Faculté.
-->
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Relevé de notes — {{upper student.firstName}} {{upper student.lastName}}</title>
<style>
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
body {
	font-family: {{theme.fonts.main}};
	width: 200mm;
	min-height: 287mm;
	background-color: white;
	margin: 5mm;
	border: 3px double {{theme.colors.primary}};
	color: {{theme.colors.primary}};
	position: relative;
	overflow: hidden;
}

.header { line-height: normal; font-size: 9px; font-family: {{theme.fonts.header}}; }

.watermark {
	position: absolute; top: 120px; left: 0;
	width: 100%; height: 100%;
	z-index: -1;
	display: {{#if theme.watermark.enabled}}flex{{else}}none{{/if}};
	justify-content: center; align-items: center;
	opacity: {{theme.watermark.logoOpacity}};
	pointer-events: none;
}
.watermark img { width: 600px; height: auto; }

.qr-code { width: 100px; height: 100px; display: block; position: relative; }

.header-row1 { text-align: center; margin-bottom: 20px; margin-top: 8px; display: flex; justify-content: space-between; }
.header h1 { font-size: 17px; }

.student_block1 { display: flex; flex-direction: row; justify-content: space-between; }
.student_block1, .student-info { width: 90%; margin-left: auto; margin-right: auto; font-size: 10px; gap: 10px; }
.student-info { display: grid; grid-template-columns: 1fr 1fr 1.2fr; margin-bottom: 20px; }
.student-info p { font-size: 10px; margin: 0; padding: 0; }
.student-info > div { margin: 0; padding: 0; font-size: 10px; }

table { margin-left: auto; margin-right: auto; width: 96%; border-collapse: collapse; margin-bottom: 20px; font-size: 8.5px; }
th, td { border: 0.5px solid {{theme.colors.primary}}; padding: 2px; text-align: left; }
th { background-color: {{theme.colors.tableHeaderBg}}; color: {{theme.colors.tableHeaderText}}; }

.grade-scale { display: flex; font-size: 7px !important; float: left; margin-left: 20px; width: 50%; }
.grade-scale table { width: auto; margin-right: 10px; }
.grade-scale div { display: inline-block; }

.signature { margin-top: 30px; float: right; text-align: left; font-size: 12px; margin-right: 20px; }

.header-content { width: 35%; }
/* Logos in hierarchy order: highest tutelle first → … → current institution.
   Centered with uniform gap so missing logos don't spread the group apart. */
.header-logo-content { margin-top: 4px; display: flex; align-items: center; justify-content: center; gap: 12px; flex-wrap: nowrap; }
.header-logo-content > div { display: flex; align-items: center; justify-content: center; }

.header-row2 h1 { font-weight: 100; text-align: center; font-size: 17px; color: {{theme.colors.primary}}; }
.header-row2 p { font-size: 12px; }
.header-row2 { text-align: center; }

td { text-align: center; }
.table { padding-left: 20px; }
.table-head th { text-align: center; }
.table-ue-code, .table-ue-label, .table-ue-avearage { font-weight: bold; }
.table-ec, .table-ue-title { text-align: left; }

.grade-sign { display: flex; justify-content: start; width: 96%; margin: 0 auto; }
.grade-sign th, .grade-sign td { padding: 1px; border: 0.5px solid {{theme.colors.primary}}; }

body > .container { width: 100%; height: 100%; position: relative; }
.footer-note { position: absolute; width: 100%; bottom: 10px; font-size: 7px; text-align: center; margin-top: 20px; padding-top: 10px; font-style: italic; }

.header-title { color: {{theme.colors.primary}}; }
.validated { color: {{theme.colors.passingGrade}}; font-weight: bold; }
.not-validated { color: {{theme.colors.failingGrade}}; }

        /* Page-break controls — keep cohesive blocks together and repeat
           table headers on each page. Added globally so long roster/grade
           tables don't slice across pages. */
        @media print {
            tr, .signatures, .signature, .signature-box, .legend-table,
            .stats-section, .stats-row, .eval-info, .ec-info, .ue-info,
            .bottom-section, .footer, .footer-info, .footer-note {
                page-break-inside: avoid;
                break-inside: avoid;
            }
            thead {
                display: table-header-group;
            }
            tfoot {
                display: table-footer-group;
            }
        }
        @page { orphans: 3; widows: 3; }
    </style>
</head>
<body>
<div class="container">
	<div class="watermark">
		{{{logo svg=institution.watermarkLogoSvg url=institution.watermarkLogoUrl alt="Watermark"}}}
	</div>

	<div class="header">
		<div class="header-row1">
			<div class="header-content">
				<p>REPUBLIQUE DU CAMEROUN<br>
				<em>Paix – Travail – Patrie</em><br>
				********************<br>
				MINISTERE DE L'ENSEIGNEMENT SUPERIEUR<br>
				{{#each tutelleChain}}
				********************<br>
				<strong>{{upper this.nameFr}}</strong><br>
				{{#unless @first}}
					{{#if this.postalBox}}<span style="font-size:8px;">{{this.postalBox}}</span><br>{{/if}}
					{{#if this.contactEmail}}<span style="font-size:8px;">Email : {{this.contactEmail}}</span><br>{{/if}}
				{{/unless}}
				{{/each}}
				********************<br>
				<strong>{{upper institution.nameFr}}</strong><br>
				{{#if institution.postalBox}}********************<br>{{institution.postalBox}}<br>{{/if}}
				{{#if institution.contactEmail}}Email : <a href="mailto:{{institution.contactEmail}}">{{institution.contactEmail}}</a>{{/if}}
				</p>
			</div>
			<div class="header-logo-content">
				{{#each tutelleChain}}{{#if (or this.logoSvg this.logoUrl)}}<div>{{{logo svg=this.logoSvg url=this.logoUrl alt=this.nameFr style="height:60px;margin:4px;"}}}</div>{{/if}}{{/each}}
				{{#if (or institution.logoSvg institution.logoUrl)}}<div>{{{logo svg=institution.logoSvg url=institution.logoUrl alt=institution.nameFr style="height:70px;"}}}</div>{{/if}}
			</div>
			<div class="header-content">
				<p>REPUBLIC OF CAMEROON<br>
				<em>Peace – Work – Fatherland</em><br>
				********************<br>
				MINISTRY OF HIGHER EDUCATION<br>
				{{#each tutelleChain}}
				********************<br>
				<strong>{{upper this.nameEn}}</strong><br>
				{{#unless @first}}
					{{#if this.postalBox}}<span style="font-size:8px;">{{this.postalBox}}</span><br>{{/if}}
					{{#if this.contactEmail}}<span style="font-size:8px;">Email : {{this.contactEmail}}</span><br>{{/if}}
				{{/unless}}
				{{/each}}
				********************<br>
				<strong>{{upper institution.nameEn}}</strong><br>
				{{#if institution.postalBox}}********************<br>{{institution.postalBox}}<br>{{/if}}
				{{#if institution.contactEmail}}Email : <a href="mailto:{{institution.contactEmail}}">{{institution.contactEmail}}</a>{{/if}}
				</p>
			</div>
		</div>
		<div class="header-row2">
			<h1 class="header-title"><strong>RELEVE DE NOTES</strong> / TRANSCRIPT</h1>
			<p><strong>Ref N°</strong>&nbsp;&nbsp;_____________&nbsp;/{{document.referenceNumber}}</p>
		</div>
	</div>

	<div class="student_block1">
		<div>
			<p><strong>NOM(S) ET PRENOM(S) : {{upper student.firstName}} {{upper student.lastName}}</strong><br>
			<em>surname and name:</em></p>
		</div>
		<div>
			<p><strong>MATRICULE: {{student.matricule}}</strong><br>
			<em>Registration N°:</em></p>
		</div>
	</div>
	<div class="student-info">
		<div>
			<p><strong>NÉ(E) LE : {{student.birthDate}}</strong><br>
			<em>Born on:</em></p>
		</div>
		<div>
			<p><strong>À: {{student.birthPlace}}</strong><br>
			<em>At:</em></p>
		</div>
		<div>
			<p><strong>FILIÈRE: {{program.name}}</strong><br>
			<em>Field of Study:</em></p>
		</div>
		<div>
			<p><strong>CYCLE: {{program.level}}</strong><br>
			<em>Training cycle:</em></p>
		</div>
		<div>
			<p><strong>ANNÉE ACADÉMIQUE: {{document.academicYear}}</strong><br>
			<em>Academic Year:</em></p>
		</div>
		<div>
			<p><strong>OPTION : {{#if student.option}}{{student.option}}{{else}}—{{/if}}</strong><br>
			<em>Option:</em></p>
		</div>
		<div>
			<p><strong>NIVEAU: {{class.name}}</strong><br>
			<em>Level:</em></p>
		</div>
		<div>
			<p><strong>SEMESTRE: —</strong><br>
			<em>Semester:</em></p>
		</div>
		<div></div>
	</div>

	<div class="table">
		<table>
			<thead>
				<tr class="table-head">
					<th class="table-code">CODE UE</th>
					<th colspan="3" class="table-ue">UNITE D'ENSEIGNEMENT</th>
					<th colspan="2" class="table-ec">INTITULE ELEMENTS CONSTITUTIFS</th>
					<th class="table-note">NOTE/20<br><span style="font-weight:normal;font-style:italic;font-size:7px;">Mark/20</span></th>
					<th class="table-average">MOYENNE<br><span style="font-weight:normal;font-style:italic;font-size:7px;">Average</span></th>
					<th class="table-credit">CREDIT<br><span style="font-weight:normal;font-style:italic;font-size:7px;">Credit</span></th>
				</tr>
			</thead>
			<tbody>
				{{#each semesters}}
					{{#each this.ues}}
						{{#each this.courses}}
						<tr>
							{{#if @first}}
							<td class="table-code" rowspan="{{../courses.length}}"><strong>{{../code}}</strong></td>
							<td colspan="3" class="table-ue table-ue-title" rowspan="{{../courses.length}}"><strong>{{../name}}</strong></td>
							{{/if}}
							<td colspan="2" class="table-ec">{{this.name}}</td>
							<td class="table-note">{{formatNumber this.exam}}</td>
							{{#if @first}}
							<td class="table-average" rowspan="{{../courses.length}}"><strong>{{formatNumber ../average}}</strong></td>
							<td class="table-credit" rowspan="{{../courses.length}}">{{../credits}}</td>
							{{/if}}
						</tr>
						{{/each}}
					{{/each}}
				{{/each}}

				<tr class="table-summary"><td colspan="9">&nbsp;</td></tr>
				<tr class="table-footer">
					<td class="summary-label">RELEVE NIVEAU</td>
					<td class="summary-label">SEMESTRE</td>
					<td class="summary-label">TOTAL CREDITS /30</td>
					<td colspan="3" class="summary-label">MOYENNE SEMESTRIELLE/20</td>
					<td class="summary-label">MGP</td>
					<td class="summary-label">GRADE</td>
					<td class="summary-label">DECISION DU JURY</td>
				</tr>
				<tr class="table-footer-values">
					<td class="summary-value"><strong>{{class.name}}</strong></td>
					<td class="summary-value"><strong>—</strong></td>
					<td class="summary-value"><strong>{{summary.creditsEarned}}</strong></td>
					<td colspan="3" class="summary-value"><strong>{{formatNumber summary.generalAverage}}</strong></td>
					<td class="summary-value"><strong>—</strong></td>
					<td class="summary-value"><strong>{{getAppreciation summary.generalAverage}}</strong></td>
					<td class="summary-value validated"><strong>{{summary.decision}}</strong></td>
				</tr>
			</tbody>
		</table>
	</div>

	<div class="grade-sign">
		<div class="grade-scale">
			<div>
				<table style="table-layout: auto;">
					<tbody style="font-size: 6px;">
						<tr><td><strong>Grade</strong></td><td><strong>Appréciation</strong></td><td><strong>Moy /20</strong></td></tr>
						{{#each grading.appreciations}}
						<tr><td><strong>{{gradeLetter}}</strong></td><td><strong>{{label}}</strong></td><td><strong>[{{min}}-{{max}}]</strong></td></tr>
						{{/each}}
					</tbody>
				</table>
			</div>
			<div style="position: relative;">
				{{#if qrCodeImage}}<img src="{{qrCodeImage}}" alt="QR Code" class="qr-code">{{/if}}
			</div>
		</div>

		<div class="signature">
			<div><strong>Douala, le {{document.issueDate}}</strong>
			<br/><i>Douala, the {{document.issueDate}}</i></div><br/>

			<div><strong>Le Doyen de la Faculté</strong>
			<br/><i>The Dean of the Faculty</i></div>
		</div>
	</div>
</div>

<div class="footer-note">
	Il n'est délivré qu'un seul exemplaire de relevé de notes, le titulaire peut en faire des copies certifiées conformes.<br>
	<em>This transcript is delivered only once, the owner can do many certified copies as necessary.</em>
</div>
</body>
</html>

`;

export const TRANSCRIPT_TEMPLATE = /* html */ `
<!--
  Transcript template — DOM/CSS structure ported from DIPLOMATION's
  src/lib/pdfGenerator.ts (createTranscriptHTML). Body uses a double border;
  header has 3 columns (.header-row1) and a centered title row (.header-row2);
  content is split into .student_block1 (NOM/MATRICULE) and .student-info
  (3-column grid with academic context); the table uses class names
  .table-code/.table-ue/.table-ec/.table-note/.table-average/.table-credit.
-->
<!DOCTYPE html>
<html lang="{{#if (eq theme.display.primaryLanguage 'english')}}en{{else}}fr{{/if}}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Relevé de notes — {{upper student.fullName}}</title>
<style>
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
body {
	font-family: {{theme.fonts.main}};
	width: 200mm;
	min-height: 287mm;
	box-sizing: border-box;
	background-color: white;
	margin: 5mm;
	border: {{add theme.table.borderWidth 2}}px double {{theme.colors.primary}};
	color: {{theme.colors.primary}};
	position: relative;
	overflow: hidden;
}

/* Demo overlays */
.demo-banner { position: absolute; top: 0; left: 0; right: 0; background: rgba(148,5,5,0.8); color: white; text-align: center; padding: 3px; font-size: 10px; font-weight: bold; z-index: 1001; display: {{#if demoMode}}block{{else}}none{{/if}}; }
.demo-watermark { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1000; pointer-events: none; display: {{#if demoMode}}block{{else}}none{{/if}}; background: repeating-linear-gradient(45deg, transparent, transparent 80px, rgba(255,0,0,0.08) 80px, rgba(255,0,0,0.08) 100px); }
.demo-watermark::before { content: "DÉMO"; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 100px; font-weight: bold; color: rgba(255,0,0,0.12); font-family: Arial, sans-serif; letter-spacing: 15px; }

/* Background watermark logo */
.watermark { position: absolute; top: 120px; left: 0; width: 100%; height: 100%; z-index: -1; display: {{#if theme.watermark.enabled}}flex{{else}}none{{/if}}; justify-content: center; align-items: center; opacity: {{theme.watermark.logoOpacity}}; pointer-events: none; }
.watermark img { width: 600px; height: auto; }

.container { width: 100%; height: 100%; position: relative; }

/* Header */
.header { line-height: normal; font-size: {{theme.sizes.header}}pt; font-family: {{theme.fonts.header}}; }
.header-row1 { text-align: center; margin-bottom: 20px; margin-top: 8px; display: flex; justify-content: space-between; }
.header-content { width: 35%; }
.header-content p { margin: 0; }
.header-content a { color: inherit; text-decoration: none; }
.header-logo-content { margin-top: 4px; align-content: center; display: flex; align-items: center; justify-content: space-between; }
.header-logo-content > div { width: 100%; height: 100%; align-items: center; align-content: center; display: flex; justify-content: center; }
.header-logo-content > div > img { max-height: 70px; max-width: 100%; object-fit: contain; }

.header-row2 { text-align: center; }
.header-row2 .header-title { color: {{theme.colors.accent}}; font-weight: 100; text-align: center; font-size: {{theme.sizes.title}}pt; margin: 4px 0; }
.header-row2 p { font-size: {{add theme.sizes.studentInfo 2}}pt; margin: 5px 0; }

em { font-style: italic; }
{{#unless theme.display.bilingual}}em { display: none !important; }{{/unless}}

/* Student blocks */
.student_block1, .student-info { width: 90%; margin-left: auto; margin-right: auto; font-size: {{theme.sizes.studentInfo}}pt; gap: 10px; }
.student_block1 { display: flex; flex-direction: row; justify-content: space-between; }
.student_block1 p, .student-info p { font-size: {{theme.sizes.studentInfo}}pt; margin: 0; padding: 0; }
.student-info { display: grid; grid-template-columns: 1fr 1fr 1.2fr; margin-bottom: 20px; }
.student-info > div { margin: 0; padding: 0; font-size: {{theme.sizes.studentInfo}}pt; }

/* Main grades table */
.table { padding-left: 20px; }
table { margin-left: auto; margin-right: auto; width: 96%; border-collapse: collapse; margin-bottom: 20px; font-size: {{theme.sizes.tableBody}}pt; font-family: {{theme.fonts.table}}; }
th, td { border: {{divide theme.table.borderWidth 2}}px solid {{theme.colors.tableBorder}}; padding: {{add theme.table.borderWidth 2}}px; text-align: center; }
th { background-color: {{theme.colors.tableHeaderBg}}; color: {{theme.colors.tableHeaderText}}; font-size: {{theme.sizes.tableHeader}}pt; font-weight: bold; }
.table-head th { text-align: center; }
.table-ue-code, .table-ue-label, .table-ue-avearage { font-weight: bold; }
.table-ec, .table-ue-title { text-align: left; }
.table-code { width: 8%; }
.table-ue { width: 25%; }
.table-ec { width: 25%; }
.table-note { width: 10%; }
.table-average { width: 12%; }
.table-credit { width: 10%; }
{{#if theme.table.alternateRows}}tbody tr:nth-child(even) td { background: {{theme.colors.alternateRow}}; }{{/if}}

.ue-row td { background: {{theme.colors.alternateRow}}; font-weight: bold; }
.passing { color: {{theme.colors.passingGrade}}; font-weight: bold; }
.failing { color: {{theme.colors.failingGrade}}; font-weight: bold; }

/* Grade scale + signatures */
.grade-sign { display: flex; justify-content: space-between; align-items: center; width: 96%; margin: 0 auto; gap: 20px; }
.grade-scale { display: {{#if theme.display.showSemesterBreakdown}}block{{else}}none{{/if}}; font-size: {{theme.sizes.footer}}pt; width: 50%; }
.grade-scale table { width: 100%; margin-bottom: 4px; }
.grade-scale th, .grade-scale td { width: 30px; padding: 1px; border: 0.5px solid {{theme.colors.tableBorder}}; }

.signature { margin-top: 30px; text-align: left; font-size: {{add theme.sizes.studentInfo 2}}pt; margin-right: 20px; padding-right: 20px; min-width: 40%; }
.signature p { margin: 4px 0; }

.qr-code-block { display: {{#if theme.display.showQRCode}}block{{else}}none{{/if}}; width: {{theme.display.qrCodeSize}}px; height: {{theme.display.qrCodeSize}}px; margin-top: 8px; }
.qr-code-block img { width: 100%; height: 100%; object-fit: contain; }

/* Footer note */
.footer-note { position: absolute; width: 100%; bottom: 10px; font-size: {{theme.sizes.footer}}pt; text-align: center; margin-top: 20px; padding-top: 10px; font-style: italic; }

@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }

        /* Page-break controls — keep cohesive blocks together and repeat
           table headers on each page. Added globally so long roster/grade
           tables don't slice across pages. */
        @media print {
            tr, .signatures, .signature, .signature-box, .legend-table,
            .stats-section, .stats-row, .eval-info, .ec-info, .ue-info,
            .bottom-section, .footer, .footer-info, .footer-note {
                page-break-inside: avoid;
                break-inside: avoid;
            }
            thead {
                display: table-header-group;
            }
            tfoot {
                display: table-footer-group;
            }
        }
        @page { orphans: 3; widows: 3; }
    </style>
</head>
<body>
<div class="container">
	{{#if demoMode}}<div class="demo-banner">⚠️ MODE DÉMO - RELEVÉ NON OFFICIEL ⚠️</div><div class="demo-watermark"></div>{{/if}}

	<div class="watermark">
		{{{logo svg=institution.watermarkLogoSvg url=institution.watermarkLogoUrl alt="Watermark"}}}
	</div>

	<div class="header">
		<div class="header-row1">
			<div class="header-content">
				<p>
					{{country.fr}}<br>
					<em>{{country.mottoFr}}</em><br>
					********************<br>
					{{ministry.fr}}<br>
					{{#if university.fr}}********************<br><strong>{{upper university.fr}}</strong><br>{{/if}}
					{{#if faculty.fr}}********************<br><strong>{{upper faculty.fr}}</strong>{{#if faculty.postalBox}}<br>B.P. {{faculty.postalBox}}{{/if}}{{#if faculty.contactEmail}}<br>Email : {{faculty.contactEmail}}{{/if}}<br>{{/if}}
					********************<br>
					<strong>{{upper institution.nameFr}}</strong>
					{{#if institution.postalBox}}<br>B.P. {{institution.postalBox}}{{/if}}
					{{#if institution.contactEmail}}<br>Email : <a href="mailto:{{institution.contactEmail}}">{{institution.contactEmail}}</a>{{/if}}
				</p>
			</div>

			<div class="header-logo-content">
				<div>{{{logo svg=logos.universitySvg url=logos.university alt="University Logo"}}}</div>
				<div>{{{logo svg=logos.facultySvg url=logos.faculty alt="Faculty Logo"}}}</div>
				<div>{{{logo svg=logos.institutionSvg url=logos.institution alt="Institution Logo"}}}</div>
			</div>

			<div class="header-content">
				<p>
					{{country.en}}<br>
					<em>{{country.mottoEn}}</em><br>
					********************<br>
					{{ministry.en}}<br>
					{{#if university.en}}********************<br><strong>{{upper university.en}}</strong><br>{{/if}}
					{{#if faculty.en}}********************<br><strong>{{upper faculty.en}}</strong>{{#if faculty.postalBox}}<br>P.O. Box {{faculty.postalBox}}{{/if}}{{#if faculty.contactEmail}}<br>Email: {{faculty.contactEmail}}{{/if}}<br>{{/if}}
					********************<br>
					<strong>{{upper institution.nameEn}}</strong>
					{{#if institution.postalBox}}<br>P.O. Box {{institution.postalBox}}{{/if}}
					{{#if institution.contactEmail}}<br>Email: <a href="mailto:{{institution.contactEmail}}">{{institution.contactEmail}}</a>{{/if}}
				</p>
			</div>
		</div>

		<div class="header-row2">
			<h1 class="header-title"><strong>RELEVÉ DE NOTES</strong> / TRANSCRIPT</h1>
			<p><strong>Réf N°</strong>&nbsp;&nbsp;{{document.referenceNumber}}</p>
		</div>
	</div>

	<div class="student_block1">
		<div>
			<p>
				<strong>NOM(S) ET PRÉNOM(S) :</strong>
				<strong>{{upper student.firstName}}{{#if student.lastName}} {{upper student.lastName}}{{/if}}</strong><br>
				<em>Surname and name</em>
			</p>
		</div>
		<div>
			<p>
				<strong>MATRICULE :</strong>
				<strong>{{student.matricule}}</strong><br>
				<em>Registration N°</em>
			</p>
		</div>
	</div>

	<div class="student-info">
		<div>
			<p>
				<strong>NÉ(E) LE :</strong>
				<strong>{{student.birthDate}}</strong><br>
				<em>Born on</em>
			</p>
		</div>
		<div>
			<p>
				<strong>À :</strong>
				<strong>{{student.birthPlace}}</strong><br>
				<em>At</em>
			</p>
		</div>
		<div></div>
		<div>
			<p>
				<strong>CYCLE :</strong>
				<strong>{{program.cycleName}}</strong><br>
				<em>Training cycle</em>
			</p>
		</div>
		<div>
			<p>
				<strong>ANNÉE ACADÉMIQUE :</strong>
				<strong>{{document.academicYear}}</strong><br>
				<em>Academic Year</em>
			</p>
		</div>
		<div>
			<p>
				<strong>FILIÈRE :</strong>
				<strong>{{program.name}}</strong><br>
				<em>Field of Study</em>
			</p>
		</div>
		<div>
			<p>
				<strong>NIVEAU :</strong>
				<strong>{{program.level}}</strong><br>
				<em>Level</em>
			</p>
		</div>
		<div>
			<p>
				<strong>SEMESTRE :</strong>
				<strong>{{document.semester}}</strong><br>
				<em>Semester</em>
			</p>
		</div>
		{{#if student.option}}
		<div>
			<p>
				<strong>OPTION :</strong>
				<strong>{{student.option}}</strong><br>
				<em>Option</em>
			</p>
		</div>
		{{/if}}
	</div>

	<div class="table">
		<table>
			<thead>
				<tr class="table-head">
					<th class="table-code">CODE</th>
					<th colspan="3" class="table-ue">UNITÉ D'ENSEIGNEMENT<br><em>Teaching Unit</em></th>
					<th colspan="2" class="table-ec">ÉLÉMENT CONSTITUTIF<br><em>Course</em></th>
					<th class="table-note">NOTE<br><em>Grade</em></th>
					<th class="table-average">MOYENNE<br><em>Average</em></th>
					<th class="table-credit">CRÉDIT<br><em>Credit</em></th>
				</tr>
			</thead>
			<tbody>
				{{#each semesters}}
					{{#each this.ues}}
						{{#each this.courses}}
						<tr>
							<td class="table-ue-code">{{../code}}</td>
							<td colspan="3" class="table-ue-title">{{../name}}</td>
							<td colspan="2" class="table-ec">{{this.name}}</td>
							<td>{{formatNumber this.average}}</td>
							<td class="table-ue-avearage {{#if (gte ../average ../../../grading.passing_grade)}}passing{{else if ../../../theme.table.highlightFailures}}failing{{/if}}">{{formatNumber ../average}}</td>
							<td>{{../credits}}</td>
						</tr>
						{{/each}}
					{{/each}}
				{{/each}}
			</tbody>
		</table>
	</div>

	<div class="grade-sign">
		<div class="grade-scale">
			<table>
				<thead><tr><th>Grade</th><th>Appréciation</th><th>Moy /20</th></tr></thead>
				<tbody>
					{{#each grading.appreciations}}
					<tr><td>{{gradeLetter}}</td><td>{{label}}</td><td>[{{min}}-{{max}}]</td></tr>
					{{/each}}
				</tbody>
			</table>
		</div>

		<div class="signature">
			<p><strong>Crédits acquis :</strong> {{summary.creditsEarned}} / {{summary.creditsTotal}}</p>
			<p><strong>Moyenne générale :</strong> {{formatNumber summary.generalAverage}} / 20</p>
			<p><strong>Mention :</strong> {{summary.mention}}</p>
			<p><strong>Décision :</strong> <strong>{{summary.decision}}</strong></p>
			<p style="margin-top: 16px;"><strong>{{institution.city}}, le {{document.issueDate}}</strong><br>
			<em>{{institution.city}}, the {{document.issueDate}}</em></p>
			<p style="margin-top: 12px;"><strong>LE CHEF D'ÉTABLISSEMENT</strong><br>
			<em>The Dean of the Faculty</em></p>
			{{#if qrCodeImage}}<div class="qr-code-block"><img src="{{qrCodeImage}}" alt="QR Code"></div>{{/if}}
		</div>
	</div>

	<div class="footer-note">
		Il n'est délivré qu'un seul exemplaire de relevé de notes — le titulaire peut en faire des copies certifiées conformes.<br>
		<em>This transcript is delivered only once, the owner can do many certified copies as necessary.</em>
	</div>
</div>
</body>
</html>

`;

export const TRANSCRIPT_TEMPLATE_CENTER = /* html */ `
<!--
  Relevé de notes — Modèle CENTRE.
  Squelette CSS / HTML strictement repris de releve_template_ipes.html
  (tailles en px, bordure 3px double, watermark, table, signature, etc.)
  Seul le contenu change :
    - L'en-tête tire EXCLUSIVEMENT des tables \`centers\` /
      \`center_administrative_instances\` / \`center_legal_texts\` (pas de
      tutelle institutionnelle).
    - Le watermark utilise \`center.watermarkLogo*\`.
    - Le signataire est "LE DIRECTEUR DU CENTRE" (pas de Doyen / Recteur).
-->
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Relevé de notes — {{upper student.firstName}} {{upper student.lastName}}</title>
<style>
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
body {
	font-family: {{theme.fonts.main}};
	width: 200mm;
	min-height: 287mm;
	background-color: white;
	margin: 5mm;
	border: 3px double {{theme.colors.primary}};
	color: {{theme.colors.primary}};
	position: relative;
	overflow: hidden;
}

.header { line-height: normal; font-size: 9px; font-family: {{theme.fonts.header}}; }

.watermark {
	position: absolute; top: 120px; left: 0;
	width: 100%; height: 100%;
	z-index: -1;
	display: {{#if theme.watermark.enabled}}flex{{else}}none{{/if}};
	justify-content: center; align-items: center;
	opacity: {{theme.watermark.logoOpacity}};
	pointer-events: none;
}
.watermark img { width: 600px; height: auto; }

.qr-code { width: 100px; height: 100px; display: block; position: relative; }

.header-row1 { text-align: center; margin-bottom: 20px; margin-top: 8px; padding: 0 12px; display: flex; justify-content: space-between; }
.header h1 { font-size: 17px; }
.center-authorization { display: block; font-size: 8px; font-style: italic; padding: 4px 6px; margin-top: 4px; border-top: 1px dotted {{theme.colors.secondary}}; }
.center-legal-text { display: block; font-size: 8px; line-height: 1.35; margin-top: 1px; }

.student_block1 { display: flex; flex-direction: row; justify-content: space-between; }
.student_block1, .student-info { width: 90%; margin-left: auto; margin-right: auto; font-size: 10px; gap: 10px; }
.student-info { display: grid; grid-template-columns: 1fr 1fr 1.2fr; margin-bottom: 20px; }
.student-info p { font-size: 10px; margin: 0; padding: 0; }
.student-info > div { margin: 0; padding: 0; font-size: 10px; }

table { margin-left: auto; margin-right: auto; width: 96%; border-collapse: collapse; margin-bottom: 20px; font-size: 8.5px; }
th, td { border: 0.5px solid {{theme.colors.primary}}; padding: 2px; text-align: left; }
th { background-color: {{theme.colors.tableHeaderBg}}; color: {{theme.colors.tableHeaderText}}; }

.grade-scale { display: flex; font-size: 7px !important; float: left; margin-left: 20px; width: 50%; }
.grade-scale table { width: auto; margin-right: 10px; }
.grade-scale div { display: inline-block; }

.signature-ipes { width: 50%; margin-left: 40px; font-size: 12px; }
.signature { margin-top: 30px; float: right; text-align: left; font-size: 12px; margin-right: 20px; }

.header-content { width: 35%; }
/* Logos centered horizontally with a uniform gap so missing logos never spread the
   group apart. Order: admin instance logos → center logo. */
.header-logo-content { margin-top: 4px; display: flex; align-items: center; justify-content: center; gap: 12px; flex-wrap: nowrap; }
.header-logo-content > div { display: flex; align-items: center; justify-content: center; }

.header-row2 h1 { font-weight: 100; text-align: center; font-size: 17px; color: {{theme.colors.primary}}; }
.header-row2 p { font-size: 12px; }
.header-row2 { text-align: center; }

td { text-align: center; }
.table { padding-left: 20px; }
.table-head th { text-align: center; }
.table-ue-code, .table-ue-label, .table-ue-avearage { font-weight: bold; }
.table-ec, .table-ue-title { text-align: left; }

.grade-sign { display: flex; justify-content: start; width: 96%; margin: 0 auto; }
.grade-sign th, .grade-sign td { padding: 1px; border: 0.5px solid {{theme.colors.primary}}; }

body > .container { width: 100%; height: 100%; position: relative; }
.footer-note { position: absolute; width: 100%; bottom: 10px; font-size: 7px; text-align: center; margin-top: 20px; padding-top: 10px; font-style: italic; }

.header-title { color: {{theme.colors.primary}}; }
.validated { color: {{theme.colors.passingGrade}}; font-weight: bold; }
.not-validated { color: {{theme.colors.failingGrade}}; }

        /* Page-break controls — keep cohesive blocks together and repeat
           table headers on each page. Added globally so long roster/grade
           tables don't slice across pages. */
        @media print {
            tr, .signatures, .signature, .signature-box, .legend-table,
            .stats-section, .stats-row, .eval-info, .ec-info, .ue-info,
            .bottom-section, .footer, .footer-info, .footer-note {
                page-break-inside: avoid;
                break-inside: avoid;
            }
            thead {
                display: table-header-group;
            }
            tfoot {
                display: table-footer-group;
            }
        }
        @page { orphans: 3; widows: 3; }
    </style>
</head>
<body>
<div class="container">
	<div class="watermark">
		{{!-- Background watermark = the center's main logo (with watermark variant fallback). --}}
		{{{logo svg=center.logoSvg url=center.logoUrl alt="Watermark"}}}
	</div>

	<div class="header">
		<div class="header-row1">
			<div class="header-content">
				<p>
					{{#each center.administrativeInstances}}{{#if showOnTranscripts}}<strong>{{upper nameFr}}{{#if acronymFr}} ({{acronymFr}}){{/if}}</strong><br>********************<br>{{/if}}{{/each}}
					<strong>{{upper center.name}}</strong><br>
					{{#if center.postalBox}}********************<br>{{center.postalBox}}<br>{{/if}}
					{{#if center.contactEmail}}Email : <a href="mailto:{{center.contactEmail}}">{{center.contactEmail}}</a>{{/if}}
				</p>
				{{#if center.authorizationOrderFr}}<span class="center-authorization">{{center.authorizationOrderFr}}</span>{{/if}}
				{{#each center.legalTexts}}<span class="center-legal-text">{{textFr}}</span>{{/each}}
			</div>
			<div class="header-logo-content">
				{{#each center.administrativeInstances}}{{#if showOnTranscripts}}{{#if (or this.logoSvg this.logoUrl)}}<div>{{{logo svg=this.logoSvg url=this.logoUrl alt=this.nameFr style="height:60px;margin:4px;"}}}</div>{{/if}}{{/if}}{{/each}}
				{{#if (or center.logoSvg center.logoUrl)}}<div>{{{logo svg=center.logoSvg url=center.logoUrl alt=center.name style="height:70px;"}}}</div>{{/if}}
			</div>
			<div class="header-content">
				<p>
					{{#each center.administrativeInstances}}{{#if showOnTranscripts}}<strong>{{upper nameEn}}{{#if acronymEn}} ({{acronymEn}}){{/if}}</strong><br>********************<br>{{/if}}{{/each}}
					<strong>{{upper center.nameEn}}</strong><br>
					{{#if center.postalBox}}********************<br>{{center.postalBox}}<br>{{/if}}
					{{#if center.contactEmail}}Email : <a href="mailto:{{center.contactEmail}}">{{center.contactEmail}}</a>{{/if}}
				</p>
				{{#if center.authorizationOrderEn}}<span class="center-authorization">{{center.authorizationOrderEn}}</span>{{/if}}
				{{#each center.legalTexts}}<span class="center-legal-text">{{textEn}}</span>{{/each}}
			</div>
		</div>
		<div class="header-row2">
			<h1 class="header-title"><strong>RELEVE DE NOTES</strong> / TRANSCRIPT</h1>
			<p><strong>Ref N°</strong>&nbsp;&nbsp;_____________&nbsp;/{{document.year}}{{#each center.administrativeInstances}}{{#if acronymFr}}/{{acronymFr}}{{/if}}{{/each}}/{{#if center.shortName}}{{center.shortName}}{{else}}{{center.code}}{{/if}}</p>
		</div>
	</div>

	<div class="student_block1">
		<div>
			<p><strong>NOM(S) ET PRENOM(S) : {{upper student.firstName}} {{upper student.lastName}}</strong><br>
			<em>surname and name:</em></p>
		</div>
		<div>
			<p><strong>MATRICULE: {{student.matricule}}</strong><br>
			<em>Registration N°:</em></p>
		</div>
	</div>
	<div class="student-info">
		<div>
			<p><strong>NÉ(E) LE : {{student.birthDate}}</strong><br>
			<em>Born on:</em></p>
		</div>
		<div>
			<p><strong>À: {{student.birthPlace}}</strong><br>
			<em>At:</em></p>
		</div>
		<div>
			<p><strong>FILIÈRE: {{program.name}}</strong><br>
			<em>Field of Study:</em></p>
		</div>
		<div>
			<p><strong>CYCLE: {{program.level}}</strong><br>
			<em>Training cycle:</em></p>
		</div>
		<div>
			<p><strong>ANNÉE ACADÉMIQUE: {{document.academicYear}}</strong><br>
			<em>Academic Year:</em></p>
		</div>
		<div>
			<p><strong>OPTION : {{#if student.option}}{{student.option}}{{else}}—{{/if}}</strong><br>
			<em>Option:</em></p>
		</div>
		<div>
			<p><strong>NIVEAU: {{class.name}}</strong><br>
			<em>Level:</em></p>
		</div>
		<div>
			<p><strong>SEMESTRE: —</strong><br>
			<em>Semester:</em></p>
		</div>
		<div></div>
	</div>

	<div class="table">
		<table>
			<thead>
				<tr class="table-head">
					<th class="table-code">CODE UE</th>
					<th colspan="3" class="table-ue">UNITE D'ENSEIGNEMENT</th>
					<th colspan="2" class="table-ec">INTITULE ELEMENTS CONSTITUTIFS</th>
					<th class="table-note">NOTE/20<br><span style="font-weight:normal;font-style:italic;font-size:7px;">Mark/20</span></th>
					<th class="table-average">MOYENNE<br><span style="font-weight:normal;font-style:italic;font-size:7px;">Average</span></th>
					<th class="table-credit">CREDIT<br><span style="font-weight:normal;font-style:italic;font-size:7px;">Credit</span></th>
				</tr>
			</thead>
			<tbody>
				{{#each semesters}}
					{{#each this.ues}}
						{{#each this.courses}}
						<tr>
							{{#if @first}}
							<td class="table-code" rowspan="{{../courses.length}}"><strong>{{../code}}</strong></td>
							<td colspan="3" class="table-ue table-ue-title" rowspan="{{../courses.length}}"><strong>{{../name}}</strong></td>
							{{/if}}
							<td colspan="2" class="table-ec">{{this.name}}</td>
							<td class="table-note">{{formatNumber this.exam}}</td>
							{{#if @first}}
							<td class="table-average" rowspan="{{../courses.length}}"><strong>{{formatNumber ../average}}</strong></td>
							<td class="table-credit" rowspan="{{../courses.length}}">{{../credits}}</td>
							{{/if}}
						</tr>
						{{/each}}
					{{/each}}
				{{/each}}

				<tr class="table-summary"><td colspan="9">&nbsp;</td></tr>
				<tr class="table-footer">
					<td class="summary-label">RELEVE NIVEAU</td>
					<td class="summary-label">SEMESTRE</td>
					<td class="summary-label">TOTAL CREDITS /30</td>
					<td colspan="3" class="summary-label">MOYENNE SEMESTRIELLE/20</td>
					<td class="summary-label">MGP</td>
					<td class="summary-label">GRADE</td>
					<td class="summary-label">DECISION DU JURY</td>
				</tr>
				<tr class="table-footer-values">
					<td class="summary-value"><strong>{{class.name}}</strong></td>
					<td class="summary-value"><strong>—</strong></td>
					<td class="summary-value"><strong>{{summary.creditsEarned}}</strong></td>
					<td colspan="3" class="summary-value"><strong>{{formatNumber summary.generalAverage}}</strong></td>
					<td class="summary-value"><strong>—</strong></td>
					<td class="summary-value"><strong>{{getAppreciation summary.generalAverage}}</strong></td>
					<td class="summary-value validated"><strong>{{summary.decision}}</strong></td>
				</tr>
			</tbody>
		</table>
	</div>

	<div class="grade-sign">
		<div class="grade-scale">
			<div>
				<table style="table-layout: auto;">
					<tbody style="font-size: 6px;">
						<tr><td><strong>Grade</strong></td><td><strong>Appréciation</strong></td><td><strong>Moy /20</strong></td></tr>
						{{#each grading.appreciations}}
						<tr><td><strong>{{gradeLetter}}</strong></td><td><strong>{{label}}</strong></td><td><strong>[{{min}}-{{max}}]</strong></td></tr>
						{{/each}}
					</tbody>
				</table>
			</div>
			<div style="position: relative;">
				{{#if qrCodeImage}}<img src="{{qrCodeImage}}" alt="QR Code" class="qr-code">{{/if}}
			</div>
		</div>

		<div class="signature">
			<div><strong>{{center.city}}, le</strong>
			<br/><i>{{center.city}}, the</i></div>
		</div>
	</div>

	<div class="signature-ipes">
		<strong>LE DIRECTEUR DU {{#if center.shortName}}{{upper center.shortName}}{{else}}{{upper center.name}}{{/if}}</strong>
		<br/><i>The Director of {{#if center.shortName}}{{upper center.shortName}}{{else}}{{upper center.name}}{{/if}}</i>
	</div>
</div>

<div class="footer-note">
	Il n'est délivré qu'un seul exemplaire de relevé de notes, le titulaire peut en faire des copies certifiées conformes.<br>
	<em>This transcript is delivered only once, the owner can do many certified copies as necessary.</em>
</div>
</body>
</html>

`;
