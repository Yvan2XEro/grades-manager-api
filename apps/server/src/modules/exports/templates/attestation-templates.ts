export const ATTESTATION_TEMPLATE_STANDARD = /* html */ `
<!--
  Attestation de réussite — modèle officiel par défaut (institution standard).
  Structure portée 1:1 depuis DIPLOMATION (attestation_template.html) avec :
    - les references settings.* remplacees par les vraies variables du
      contexte de rendu (institution.*, theme.*, logos.*)
    - le mode démo retiré (banner / watermark / qr-badge supprimés)
    - le toggle IPES vs Faculté piloté par \`institution.isIPES\`
      (basé sur \`institutions.type\`).
-->
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Attestation de réussite — {{upper student.firstName}} {{upper student.lastName}}</title>
<style>
@page { size: A4 portrait; margin: 0; }
* { box-sizing: border-box; }
html { width: 210mm; height: 297mm; }
body {
	margin: 20px;
	padding: 0;
	width: calc(210mm - 40px);
	height: calc(297mm - 40px);
	font-family: {{theme.fonts.main}};
	font-size: 10px;
	color: {{theme.colors.primary}};
	background-color: white;
	line-height: 1.2;
	position: relative;
}

.container { width: 100%; height: 100%; padding: 20px; box-sizing: border-box; position: relative; border: 1px solid {{theme.colors.primary}}; }

.watermark {
	position: absolute;
	top: 25%;
	left: 0;
	width: 100%;
	height: 50%;
	z-index: -1;
	display: {{#if theme.watermark.enabled}}flex{{else}}none{{/if}};
	justify-content: center;
	align-items: center;
	opacity: {{theme.watermark.logoOpacity}};
	pointer-events: none;
}
.watermark img { max-width: 600px; max-height: 400px; object-fit: contain; }

.header { line-height: normal; font-size: 9px; font-family: {{theme.fonts.header}}; }
.header-row1 { text-align: center; margin-bottom: 8px; display: flex; justify-content: space-between; }
.header-content { width: 33%; font-size: 9px; line-height: 1.1; }
.header-logo-content { align-content: center; display: flex; align-items: center; justify-content: space-between; }
.header-logo-content > div { width: 100%; height: 100%; align-items: center; margin: 3px; align-content: center; }
.header-logo-content > div > img { max-width: 80px; max-height: 80px; object-fit: contain; }

.header-row2 { text-align: center; margin-bottom: 10px; }
.header-row2 h1 { font-weight: bold; text-align: center; font-size: 17px; color: {{theme.colors.primary}}; margin: 2px 0; text-transform: uppercase; font-family: {{theme.fonts.title}}; }
.header-row2 h2 { font-weight: bold; font-size: 22px; color: {{theme.colors.secondary}}; margin: 2px 0; font-style: italic; }
.header-row2 p { font-size: 14px; margin: 2px 0; }

/* Body content (after ref number): bumped to 12px for legibility on the
 * official document. The header keeps its 9px to fit the tutelle chain. */
.content { margin: 16px 0; font-size: 12px; line-height: 1.5; }
.content p { font-size: 12px; line-height: 1.5; }
.student-info, .list-nomination-header { margin: 8px 0; font-size: 12px; }
.student-info p, .list-nomination-header p { margin: 8px 0; font-size: 12px; line-height: 1.5; }

.table-container { width: 100%; margin: 2px 0; }
table { width: 100%; border-collapse: collapse; margin-bottom: 2px; }
th, td { padding: 2px; text-align: center; border: 1px solid {{theme.colors.primary}}; font-size: 10px; vertical-align: middle; }
th { background: none; border-bottom: 2px solid {{theme.colors.primary}}; font-weight: bold; }
td { border: none; border-bottom: 1px solid #00000040; }

.nomination-list { display: flex; width: 100%; gap: 30%; margin: 8px 0; }
.nomination-list-item { border-top: 1px solid {{theme.colors.primary}}; width: 30%; padding-top: 4px; margin-top: 15px; }

.footer { margin-top: 8px; display: flex; justify-content: space-between; }
.signature { width: 48%; font-size: 10px; }

/* Bloc signature spécifique au type d'établissement */
.sign-{{institution.type}} { width: 100%; text-align: center; padding-bottom: 100px; }
.recteur-sign { margin-top: 65px; padding-bottom: 100px; }

.qr-code { float: left; position: relative; }
.qr-image { width: 100px; height: 100px; background-color: #eee; display: block; }
.qr-image img { width: 100%; height: 100%; object-fit: contain; }

.disclaimer { font-size: 7px; font-style: italic; text-align: left; margin-top: 10px; display: flex; flex-direction: row; position: absolute; bottom: 20px; left: 20px; right: 20px; color: {{theme.colors.secondary}}; line-height: 1.4; }
.disclaimer div { padding-right: 10px; }

em { font-style: italic; color: {{theme.colors.secondary}}; }

@media print {
	body { width: 210mm; height: 297mm; margin: 0; padding: 20px; box-shadow: none; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
	.no-print { display: none; }
}

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
				{{#if institution.postalBox}}********************<br>B.P. {{institution.postalBox}}<br>{{/if}}
				{{#if institution.contactEmail}}Email: <a href="mailto:{{institution.contactEmail}}">{{institution.contactEmail}}</a>{{/if}}
				{{else}}
				{{#if institution.postalBox}}********************<br>B.P. {{institution.postalBox}}<br>{{/if}}
				{{#if institution.contactEmail}}Email: <a href="mailto:{{institution.contactEmail}}">{{institution.contactEmail}}</a>{{/if}}
				{{/if}}
				</p>
			</div>

			<div class="header-logo-content">
				{{#if (or logos.universitySvg logos.university)}}<div>{{{logo svg=logos.universitySvg url=logos.university alt="University Logo"}}}</div>{{/if}}
				{{#if (or logos.facultySvg logos.faculty)}}<div>{{{logo svg=logos.facultySvg url=logos.faculty alt="Faculty Logo"}}}</div>{{/if}}
				{{#if institution.isIPES}}{{#if (or institution.logoSvg institution.logoUrl)}}<div>{{{logo svg=institution.logoSvg url=institution.logoUrl alt="IPES Logo"}}}</div>{{/if}}{{/if}}
			</div>

			<div class="header-content">
				<p>REPUBLIC OF CAMEROON<br>
				<em>Peace – Work – Fatherland</em><br>
				********************<br>
				MINISTRY OF HIGHER EDUCATION<br>
				{{#if university.en}}********************<br><strong>{{upper university.en}}</strong><br>{{/if}}
				{{#if faculty.en}}********************<br><strong>{{upper faculty.en}}</strong><br>{{/if}}
				{{#if institution.isIPES}}
				********************<br>
				<strong>{{upper institution.nameEn}}</strong><br>
				{{#if institution.postalBox}}********************<br>PO box {{institution.postalBox}}<br>{{/if}}
				{{#if institution.contactEmail}}Email: <a href="mailto:{{institution.contactEmail}}">{{institution.contactEmail}}</a>{{/if}}
				{{else}}
				{{#if institution.postalBox}}********************<br>PO box {{institution.postalBox}}<br>{{/if}}
				{{#if institution.contactEmail}}Email: <a href="mailto:{{institution.contactEmail}}">{{institution.contactEmail}}</a>{{/if}}
				{{/if}}
				</p>
			</div>
		</div>

		<div class="header-row2">
			<h1 class="main-title">ATTESTATION DE REUSSITE — {{program.level}}</h1>
			<h2 class="subtitle">CERTIFICATE OF COMPLETION — {{program.level}}</h2>
			<p style="margin-top: 6px;"><strong>Ref N° {{document.referenceNumber}}</strong></p>
		</div>
	</div>

	<div class="content">
		<div class="list-nomination-header">
			{{#if institution.isIPES}}
				<p><strong>Nous soussignés,</strong><br>
				<em>We, the undersigned,</em></p>
				<div class="nomination-list">
					<div class="nomination-list-item">
						<strong>Directeur de l'{{institution.abbreviation}}</strong><br>
						<em>Director of the {{institution.abbreviation}}</em>
					</div>
					{{#if university.fr}}
					<div class="nomination-list-item">
						<strong>Recteur de {{upper university.fr}}</strong><br>
						<em>Rector of {{upper university.fr}}</em>
					</div>
					{{/if}}
				</div>
			{{else}}
				<p><strong>Je soussigné(e), {{authority.name}},</strong><br>
				<em>I, the undersigned, {{authority.name}},</em></p>
				<p><strong>{{authority.role}} de {{upper institution.nameFr}}</strong><br>
				<em>{{authority.role}} of {{upper institution.nameEn}}</em></p>
			{{/if}}

			<p><strong>Vu le procès-verbal du jury N° {{jury.number}} en date du {{jury.deliberationDate}} {{#if institution.isIPES}}attestons{{else}}atteste{{/if}} que,</strong><br>
			<em>Considering the jury's decision N° {{jury.number}} dated {{jury.deliberationDate}}, certify that,</em></p>
		</div>

		<div class="student-info">
			<p>M./Mme/Mlle <strong>{{upper student.firstName}} {{upper student.lastName}}</strong><br>
			<em>Mr/Mrs/Miss</em></p>

			<p>Né(e) le : <strong>{{student.birthDate}}</strong> &nbsp;&nbsp;à&nbsp; <strong>{{student.birthPlace}}</strong><br>
			<em>Born on: <strong style="opacity:0">{{student.birthDate}}</strong></em>&nbsp;&nbsp;<em>at</em></p>

			{{#if institution.isIPES}}
			<p>Inscrit(e) à <strong>{{upper institution.nameFr}}</strong> sous le matricule : <strong>{{student.matricule}}</strong><br>
			<em>Registered at the <strong>{{upper institution.nameEn}}</strong> under the matricule number</em></p>
			{{else}}
			<p>Inscrit(e) sous le matricule : <strong>{{student.matricule}}</strong><br>
			<em>Registered under the matricule number</em></p>
			{{/if}}

			<p>A subi avec succès toutes les épreuves de : <strong>{{program.level}}</strong> en <strong>{{program.name}}</strong><br>
			<em>Having successfully passed all examinations for</em></p>
		</div>

		<div class="table-container">
			<table class="academic-table">
				<tr>
					<th>Domaine<br><em style="font-weight: normal">Domain of study</em></th>
					<th>Parcours<br><em style="font-weight: normal">Course</em></th>
					<th>Spécialité<br><em style="font-weight: normal">Specialization</em></th>
				</tr>
				<tr style="border-top: 1px solid {{theme.colors.primary}}; background-color: rgba(0,0,0,0.04);">
					<td><strong>—</strong></td>
					<td><strong>{{program.name}}</strong></td>
					<td><strong>{{student.option}}</strong></td>
				</tr>
			</table>
		</div>

		<div class="table-container">
			<table class="academic-table">
				<tr>
					<th>Total de crédits<br><em style="font-weight: normal">Credits earned</em></th>
					<th>Moyenne<br><em style="font-weight: normal">Average</em></th>
					<th>Mention<br><em style="font-weight: normal">Honor</em></th>
					<th>Année académique<br><em style="font-weight: normal">Academic year</em></th>
					<th>Décision<br><em style="font-weight: normal">Decision</em></th>
				</tr>
				<tr style="border-top: 1px solid {{theme.colors.primary}}; background-color: rgba(0,0,0,0.04);">
					<td><strong>{{summary.creditsEarned}} / {{summary.creditsTotal}}</strong></td>
					<td><strong>{{formatNumber summary.generalAverage}} / 20</strong></td>
					<td><strong>{{summary.mention}}</strong></td>
					<td><strong>{{document.academicYear}}</strong></td>
					<td><strong>{{summary.decision}}</strong></td>
				</tr>
			</table>
		</div>

		<p>En foi de quoi la présente attestation est délivrée pour servir et valoir ce que de droit.<br>
		<em>In witness whereof the present testimonial is given with all the privileges thereto pertaining.</em></p>
	</div>

	<div class="footer">
		<div class="signature signature-area" style="display: flex; flex-direction: column; align-items: center;">
			<div class="qr-code">
				{{#if qrCodeImage}}<div class="qr-image"><img src="{{qrCodeImage}}" alt="QR Code"></div>{{/if}}
			</div>
			{{#if institution.isIPES}}
			<div class="sign-{{institution.type}}">
				<p><strong>Le Directeur de l'{{institution.abbreviation}}</strong><br>
				<em>The Director of the {{institution.abbreviation}}</em></p>
			</div>
			{{/if}}
		</div>

		<div class="signature signature-area">
			<p><strong>{{institution.city}}, le {{document.issueDate}}</strong><br>
			<em>{{institution.city}}, the {{document.issueDate}}</em></p>

			{{#if institution.isIPES}}
				{{#if university.fr}}
				<p class="recteur-sign">
				<strong>Le Recteur de {{upper university.fr}}</strong><br>
				<em>The Rector of {{upper university.fr}}</em></p>
				{{/if}}
			{{else}}
				<p class="recteur-sign">
				<strong>{{authority.role}}</strong><br>
				<em>{{authority.role}}</em></p>
			{{/if}}
		</div>
	</div>

	<div class="disclaimer">
		<div>Il n'est délivré qu'un seul exemplaire d'attestation, le titulaire peut en faire des copies certifiées conformes.</div>
		<div><em>This certificate is delivered only once, the owner can make certified copies as necessary.</em></div>
	</div>
</div>
</body>
</html>

`;

export const ATTESTATION_TEMPLATE_IPES = /* html */ `
<!--
  Attestation de réussite — Modèle IPES (institution.type === 'institution').
  Pour les IPES chapeautés par une faculté + université.
  En-tête : République + Ministère + Université + Faculté + bloc IPES.
  Logos : université / faculté / IPES. Signataires : Directeur IPES + Recteur.
  Texte officiel "Nous soussignés / attestons" (pluriel).
-->
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Attestation de réussite — {{upper student.firstName}} {{upper student.lastName}}</title>
<style>
@page { size: A4 portrait; margin: 0; }
* { box-sizing: border-box; }
html { width: 210mm; height: 297mm; }
body {
	margin: 20px; padding: 0;
	width: calc(210mm - 40px);
	height: calc(297mm - 40px);
	font-family: {{theme.fonts.main}};
	font-size: 10px;
	color: {{theme.colors.primary}};
	background-color: white;
	line-height: 1.2;
	position: relative;
}
.container { width: 100%; height: 100%; padding: 20px; box-sizing: border-box; position: relative; border: 1px solid {{theme.colors.primary}}; }

.watermark {
	position: absolute; top: 25%; left: 0;
	width: 100%; height: 50%;
	z-index: -1;
	display: {{#if theme.watermark.enabled}}flex{{else}}none{{/if}};
	justify-content: center; align-items: center;
	opacity: {{theme.watermark.logoOpacity}};
	pointer-events: none;
}
.watermark img { max-width: 600px; max-height: 400px; object-fit: contain; }

.header { line-height: normal; font-size: 9px; font-family: {{theme.fonts.header}}; }
.header-row1 { text-align: center; margin-bottom: 8px; display: flex; justify-content: space-between; }
.header-content { width: 33%; font-size: 9px; line-height: 1.1; }
/* Logos in hierarchy order — centered with uniform gap. */
.header-logo-content { display: flex; align-items: center; justify-content: center; gap: 10px; flex-wrap: nowrap; }
.header-logo-content > div { display: flex; align-items: center; justify-content: center; }
.header-logo-content > div > img { max-width: 80px; max-height: 80px; object-fit: contain; }

.header-row2 { text-align: center; margin-bottom: 10px; }
.header-row2 h1 { font-weight: bold; text-align: center; font-size: 17px; color: {{theme.colors.primary}}; margin: 2px 0; text-transform: uppercase; font-family: {{theme.fonts.title}}; }
.header-row2 h2 { font-weight: bold; font-size: 22px; color: {{theme.colors.secondary}}; margin: 2px 0; font-style: italic; }
.header-row2 p { font-size: 14px; margin: 2px 0; }

/* Body content (after ref number): bumped to 12px for legibility on the
 * official document. The header keeps its 9px to fit the tutelle chain. */
.content { margin: 16px 0; font-size: 12px; line-height: 1.5; }
.content p { font-size: 12px; line-height: 1.5; }
.student-info, .list-nomination-header { margin: 8px 0; font-size: 12px; }
.student-info p, .list-nomination-header p { margin: 8px 0; font-size: 12px; line-height: 1.5; }

.table-container { width: 100%; margin: 4px 0; }
table { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
th, td { padding: 4px; text-align: center; border: none; font-size: 11px; vertical-align: middle; }
th { background: none; border-bottom: 2px solid {{theme.colors.primary}}; font-weight: bold; }
td { border-bottom: 1px solid #00000040; }

.nomination-list { display: flex; width: 100%; gap: 30%; margin: 8px 0; }
.nomination-list-item { border-top: 1px solid {{theme.colors.primary}}; width: 30%; padding-top: 4px; margin-top: 15px; }

.footer { margin-top: 8px; display: flex; justify-content: space-between; }
.signature { width: 48%; font-size: 10px; }

.sign-ipes { width: 100%; text-align: center; padding-bottom: 100px; }
.recteur-sign { margin-top: 65px; padding-bottom: 100px; }

.qr-code { float: left; position: relative; }
.qr-image { width: 100px; height: 100px; background-color: #eee; display: block; }
.qr-image img { width: 100%; height: 100%; object-fit: contain; }

.disclaimer { font-size: 7px; font-style: italic; text-align: left; margin-top: 10px; display: flex; flex-direction: row; position: absolute; bottom: 20px; left: 20px; right: 20px; color: {{theme.colors.secondary}}; line-height: 1.4; }
.disclaimer div { padding-right: 10px; }

em { font-style: italic; color: {{theme.colors.secondary}}; }

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
				{{#each tutelleChain}}{{#if (or this.logoSvg this.logoUrl)}}<div>{{{logo svg=this.logoSvg url=this.logoUrl alt=this.nameFr}}}</div>{{/if}}{{/each}}
				{{#if (or institution.logoSvg institution.logoUrl)}}<div>{{{logo svg=institution.logoSvg url=institution.logoUrl alt=institution.nameFr}}}</div>{{/if}}
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
			<h1 class="main-title">ATTESTATION DE REUSSITE — {{program.level}}</h1>
			<h2 class="subtitle">CERTIFICATE OF COMPLETION — {{program.level}}</h2>
			<p style="margin-top: 6px;"><strong>Ref N°&nbsp;&nbsp;_____________&nbsp;/{{document.referenceNumber}}</strong></p>
		</div>
	</div>

	<div class="content">
		<div class="list-nomination-header">
			<p><strong>Nous soussignés,</strong><br>
			<em>We, the undersigned,</em></p>
			<div class="nomination-list">
				<div class="nomination-list-item">
					<strong>Directeur de l'{{institution.abbreviation}}</strong><br>
					<em>Director of the {{institution.abbreviation}}</em>
				</div>
				{{#if university.fr}}
				<div class="nomination-list-item">
					<strong>Recteur de {{upper university.fr}}</strong><br>
					<em>Rector of {{upper university.fr}}</em>
				</div>
				{{/if}}
			</div>

			<p><strong>Vu le procès-verbal du jury N° {{jury.number}} en date du {{jury.deliberationDate}} attestons que,</strong><br>
			<em>Considering the jury's decision N° {{jury.number}} dated {{jury.deliberationDate}}, certify that,</em></p>
		</div>

		<div class="student-info">
			<p>M./Mme/Mlle <strong>{{upper student.firstName}} {{upper student.lastName}}</strong><br>
			<em>Mr/Mrs/Miss</em></p>

			<p>Né(e) le : <strong>{{student.birthDate}}</strong> &nbsp;&nbsp;à&nbsp; <strong>{{student.birthPlace}}</strong><br>
			<em>Born on: <strong style="opacity:0">{{student.birthDate}}</strong></em>&nbsp;&nbsp;<em>at</em></p>

			<p>Inscrit(e) à <strong>{{upper institution.nameFr}}</strong> sous le matricule : <strong>{{student.matricule}}</strong><br>
			<em>Registered at the <strong>{{upper institution.nameEn}}</strong> under the matricule number</em></p>

			<p>A subi avec succès toutes les épreuves de : <strong>{{program.level}}</strong> en <strong>{{program.name}}</strong><br>
			<em>Having successfully passed all examinations for</em></p>
		</div>

		<div class="table-container">
			<table class="academic-table">
				<tr>
					<th>Domaine<br><em style="font-weight: normal">Domain of study</em></th>
					<th>Parcours<br><em style="font-weight: normal">Course</em></th>
					<th>Spécialité<br><em style="font-weight: normal">Specialization</em></th>
				</tr>
				<tr style="border-top: 1px solid {{theme.colors.primary}}; background-color: rgba(0,0,0,0.04);">
					<td><strong>—</strong></td>
					<td><strong>{{program.name}}</strong></td>
					<td><strong>{{student.option}}</strong></td>
				</tr>
			</table>
		</div>

		<div class="table-container">
			<table class="academic-table">
				<tr>
					<th>Total de crédits<br><em style="font-weight: normal">Credits earned</em></th>
					<th>Moyenne<br><em style="font-weight: normal">Average</em></th>
					<th>Mention<br><em style="font-weight: normal">Honor</em></th>
					<th>Année académique<br><em style="font-weight: normal">Academic year</em></th>
					<th>Décision<br><em style="font-weight: normal">Decision</em></th>
				</tr>
				<tr style="border-top: 1px solid {{theme.colors.primary}}; background-color: rgba(0,0,0,0.04);">
					<td><strong>{{summary.creditsEarned}} / {{summary.creditsTotal}}</strong></td>
					<td><strong>{{formatNumber summary.generalAverage}} / 20</strong></td>
					<td><strong>{{summary.mention}}</strong></td>
					<td><strong>{{document.academicYear}}</strong></td>
					<td><strong>{{summary.decision}}</strong></td>
				</tr>
			</table>
		</div>

		<p>En foi de quoi la présente attestation est délivrée pour servir et valoir ce que de droit.<br>
		<em>In witness whereof the present testimonial is given with all the privileges thereto pertaining.</em></p>
	</div>

	<div class="footer">
		<div class="signature signature-area" style="display: flex; flex-direction: column; align-items: center;">
			<div class="qr-code">
				{{#if qrCodeImage}}<div class="qr-image"><img src="{{qrCodeImage}}" alt="QR Code"></div>{{/if}}
			</div>
			<div class="sign-ipes">
				<p><strong>Le Directeur de l'{{institution.abbreviation}}</strong><br>
				<em>The Director of the {{institution.abbreviation}}</em></p>
			</div>
		</div>

		<div class="signature signature-area">
			<p><strong>Douala, le {{document.issueDate}}</strong><br>
			<em>Douala, the {{document.issueDate}}</em></p>

			{{#if parentInstitution}}
			<p class="recteur-sign">
			<strong>LE DOYEN {{parentInstitution.displaySigle}}</strong><br>
			<em>The Dean of {{parentInstitution.displaySigle}}</em></p>
			{{/if}}
		</div>
	</div>

	<div class="disclaimer">
		<div>Il n'est délivré qu'un seul exemplaire d'attestation, le titulaire peut en faire des copies certifiées conformes.</div>
		<div><em>This certificate is delivered only once, the owner can make certified copies as necessary.</em></div>
	</div>
</div>
</body>
</html>

`;

export const ATTESTATION_TEMPLATE_FACULTY = /* html */ `
<!--
  Attestation de réussite — Modèle Faculté (institution.type === 'faculty').
  Pour les facultés. En-tête : République + Ministère + Université + Faculté
  (= institution). Pas de bloc IPES intermédiaire.
  Logos : université + faculté. Signataire : Doyen + Recteur de l'université.
  Texte officiel "Je soussigné / atteste" (singulier — le doyen).
-->
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Attestation de réussite — {{upper student.firstName}} {{upper student.lastName}}</title>
<style>
@page { size: A4 portrait; margin: 0; }
* { box-sizing: border-box; }
html { width: 210mm; height: 297mm; }
body {
	margin: 20px; padding: 0;
	width: calc(210mm - 40px);
	height: calc(297mm - 40px);
	font-family: {{theme.fonts.main}};
	font-size: 10px !important;
	color: {{theme.colors.primary}};
	background-color: white;
	line-height: 1.2;
	position: relative;
}
.container { width: 100%; height: 100%; padding: 20px; box-sizing: border-box; position: relative; border: 1px solid {{theme.colors.primary}}; }

.watermark {
	position: absolute; top: 25%; left: 0;
	width: 100%; height: 50%;
	z-index: -1;
	display: {{#if theme.watermark.enabled}}flex{{else}}none{{/if}};
	justify-content: center; align-items: center;
	opacity: {{theme.watermark.logoOpacity}};
	pointer-events: none;
}
.watermark img { max-width: 600px; max-height: 400px; object-fit: contain; }

.header { line-height: normal; font-size: 9px; font-family: {{theme.fonts.header}}; }
.header-row1 { text-align: center; margin-bottom: 8px; display: flex; justify-content: space-between; }
.header-content { width: 33%; font-size: 9px; line-height: 1.1; }
/* Logos in hierarchy order — centered with uniform gap. */
.header-logo-content { display: flex; align-items: center; justify-content: center; gap: 10px; flex-wrap: nowrap; }
.header-logo-content > div { display: flex; align-items: center; justify-content: center; }
.header-logo-content > div > img { max-width: 80px; max-height: 80px; object-fit: contain; }

.header-row2 { text-align: center; margin-bottom: 10px; }
.header-row2 h1 { font-weight: bold; text-align: center; font-size: 17px; color: {{theme.colors.primary}}; margin: 2px 0; text-transform: uppercase; font-family: {{theme.fonts.title}}; }
.header-row2 h2 { font-weight: bold; font-size: 22px; color: {{theme.colors.secondary}}; margin: 2px 0; font-style: italic; }
.header-row2 p { font-size: 14px; margin: 2px 0; }

.content { margin: 16px 0; }
.student-info, .list-nomination-header { margin: 5px 0; }
.student-info p, .list-nomination-header p { margin: 5px 0; }

.table-container { width: 100%; margin: 2px 0; }
table { width: 100%; border-collapse: collapse; margin-bottom: 2px; }
th, td { padding: 2px; text-align: center; border: none; font-size: 10px; vertical-align: middle; }
th { background: none; border-bottom: 2px solid {{theme.colors.primary}}; font-weight: bold; }
td { border-bottom: 1px solid #00000040; }

.footer { margin-top: 8px; display: flex; justify-content: space-between; }
.signature { width: 48%; font-size: 10px; }

.sign-faculty { width: 100%; text-align: center; padding-bottom: 100px; }
.recteur-sign { margin-top: 65px; padding-bottom: 100px; }

.qr-code { float: left; position: relative; }
.qr-image { width: 100px; height: 100px; background-color: #eee; display: block; }
.qr-image img { width: 100%; height: 100%; object-fit: contain; }

.disclaimer { font-size: 7px; font-style: italic; text-align: left; margin-top: 10px; display: flex; flex-direction: row; position: absolute; bottom: 20px; left: 20px; right: 20px; color: {{theme.colors.secondary}}; line-height: 1.4; }
.disclaimer div { padding-right: 10px; }

em { font-style: italic; color: {{theme.colors.secondary}}; }

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
				{{#each tutelleChain}}{{#if (or this.logoSvg this.logoUrl)}}<div>{{{logo svg=this.logoSvg url=this.logoUrl alt=this.nameFr}}}</div>{{/if}}{{/each}}
				{{#if (or institution.logoSvg institution.logoUrl)}}<div>{{{logo svg=institution.logoSvg url=institution.logoUrl alt=institution.nameFr}}}</div>{{/if}}
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
			<h1 class="main-title">ATTESTATION DE REUSSITE — {{program.level}}</h1>
			<h2 class="subtitle">CERTIFICATE OF COMPLETION — {{program.level}}</h2>
			<p style="margin-top: 6px;"><strong>Ref N°&nbsp;&nbsp;_____________&nbsp;/{{document.referenceNumber}}</strong></p>
		</div>
	</div>

	<div class="content">
		<div class="list-nomination-header">
			<p><strong>Je soussigné(e), {{authority.name}},</strong><br>
			<em>I, the undersigned, {{authority.name}},</em></p>
			<p><strong>{{authority.role}} de {{upper institution.nameFr}}</strong><br>
			<em>{{authority.role}} of {{upper institution.nameEn}}</em></p>

			<p><strong>Vu le procès-verbal du jury N° {{jury.number}} en date du {{jury.deliberationDate}} atteste que,</strong><br>
			<em>Considering the jury's decision N° {{jury.number}} dated {{jury.deliberationDate}}, certify that,</em></p>
		</div>

		<div class="student-info">
			<p>M./Mme/Mlle <strong>{{upper student.firstName}} {{upper student.lastName}}</strong><br>
			<em>Mr/Mrs/Miss</em></p>

			<p>Né(e) le : <strong>{{student.birthDate}}</strong> &nbsp;&nbsp;à&nbsp; <strong>{{student.birthPlace}}</strong><br>
			<em>Born on: <strong style="opacity:0">{{student.birthDate}}</strong></em>&nbsp;&nbsp;<em>at</em></p>

			<p>Inscrit(e) sous le matricule : <strong>{{student.matricule}}</strong><br>
			<em>Registered under the matricule number</em></p>

			<p>A subi avec succès toutes les épreuves de : <strong>{{program.level}}</strong> en <strong>{{program.name}}</strong><br>
			<em>Having successfully passed all examinations for</em></p>
		</div>

		<div class="table-container">
			<table class="academic-table">
				<tr>
					<th>Domaine<br><em style="font-weight: normal">Domain of study</em></th>
					<th>Parcours<br><em style="font-weight: normal">Course</em></th>
					<th>Spécialité<br><em style="font-weight: normal">Specialization</em></th>
				</tr>
				<tr style="border-top: 1px solid {{theme.colors.primary}}; background-color: rgba(0,0,0,0.04);">
					<td><strong>—</strong></td>
					<td><strong>{{program.name}}</strong></td>
					<td><strong>{{student.option}}</strong></td>
				</tr>
			</table>
		</div>

		<div class="table-container">
			<table class="academic-table">
				<tr>
					<th>Total de crédits<br><em style="font-weight: normal">Credits earned</em></th>
					<th>Moyenne<br><em style="font-weight: normal">Average</em></th>
					<th>Mention<br><em style="font-weight: normal">Honor</em></th>
					<th>Année académique<br><em style="font-weight: normal">Academic year</em></th>
					<th>Décision<br><em style="font-weight: normal">Decision</em></th>
				</tr>
				<tr style="border-top: 1px solid {{theme.colors.primary}}; background-color: rgba(0,0,0,0.04);">
					<td><strong>{{summary.creditsEarned}} / {{summary.creditsTotal}}</strong></td>
					<td><strong>{{formatNumber summary.generalAverage}} / 20</strong></td>
					<td><strong>{{summary.mention}}</strong></td>
					<td><strong>{{document.academicYear}}</strong></td>
					<td><strong>{{summary.decision}}</strong></td>
				</tr>
			</table>
		</div>

		<p>En foi de quoi la présente attestation est délivrée pour servir et valoir ce que de droit.<br>
		<em>In witness whereof the present testimonial is given with all the privileges thereto pertaining.</em></p>
	</div>

	<div class="footer">
		<div class="signature signature-area" style="display: flex; flex-direction: column; align-items: center;">
			<div class="qr-code">
				{{#if qrCodeImage}}<div class="qr-image"><img src="{{qrCodeImage}}" alt="QR Code"></div>{{/if}}
			</div>
			<div class="sign-faculty">
				<p><strong>{{authority.role}}</strong><br>
				<em>{{authority.role}} of the Faculty</em></p>
			</div>
		</div>

		<div class="signature signature-area">
			<p><strong>Douala, le {{document.issueDate}}</strong><br>
			<em>Douala, the {{document.issueDate}}</em></p>

			{{#if university.fr}}
			<p class="recteur-sign">
			<strong>Le Recteur de {{upper university.fr}}</strong><br>
			<em>The Rector of {{upper university.fr}}</em></p>
			{{/if}}
		</div>
	</div>

	<div class="disclaimer">
		<div>Il n'est délivré qu'un seul exemplaire d'attestation, le titulaire peut en faire des copies certifiées conformes.</div>
		<div><em>This certificate is delivered only once, the owner can make certified copies as necessary.</em></div>
	</div>
</div>
</body>
</html>

`;

export const ATTESTATION_TEMPLATE = /* html */ `
<!--
  Attestation template — DOM/CSS structure ported from DIPLOMATION's
  src/lib/attestation-generator/html-generator.ts. The header is split into
  \`.header-row1\` (3 columns: FR text | central logos | EN text) and
  \`.header-row2\` (title + subtitle + reference number). The content holds an
  intro nomination block, the student info paragraphs and 1-2 academic tables.
  The footer carries two signature columns (QR + director on the left,
  Douala / Rector on the right).
-->
<!DOCTYPE html>
<html lang="{{#if (eq theme.display.primaryLanguage 'english')}}en{{else}}fr{{/if}}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Attestation — {{upper student.fullName}}</title>
<style>
@page { size: A4 portrait; margin: 0; }
* { box-sizing: border-box; }
html { width: 210mm; height: 297mm; }
body {
	margin: {{theme.page.margins.top}}mm {{theme.page.margins.right}}mm {{theme.page.margins.bottom}}mm {{theme.page.margins.left}}mm;
	padding: 0;
	width: calc(210mm - {{multiply theme.page.margins.left 2}}mm);
	font-family: {{theme.fonts.main}};
	font-size: {{theme.sizes.body}}pt;
	color: {{theme.colors.primary}};
	background-color: white;
	line-height: 1.4;
	position: relative;
}

.container {
	width: 100%;
	height: 100%;
	padding: 0;
	box-sizing: border-box;
	position: relative;
	{{#if (gt theme.borders.outerWidth 0)}}border: {{theme.borders.outerWidth}}px {{#if theme.borders.decorative}}double{{else}}solid{{/if}} {{theme.colors.border}};{{/if}}
}

/* Demo mode overlays */
.demo-watermark { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1000; pointer-events: none; display: {{#if demoMode}}block{{else}}none{{/if}}; background: repeating-linear-gradient(45deg, transparent, transparent 100px, rgba(255,0,0,0.1) 100px, rgba(255,0,0,0.1) 120px); }
.demo-watermark::before { content: "DÉMO"; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 120px; font-weight: bold; color: rgba(255,0,0,0.15); font-family: Arial, sans-serif; letter-spacing: 20px; }
.demo-banner { position: absolute; top: 0; left: 0; right: 0; background: rgba(255,0,0,0.4); color: white; text-align: center; padding: 5px; font-size: 12px; font-weight: bold; z-index: 1001; display: {{#if demoMode}}block{{else}}none{{/if}}; }

/* Background watermark logo */
.watermark { position: absolute; top: 25%; left: 0; width: 100%; height: 50%; z-index: -1; display: {{#if theme.watermark.enabled}}flex{{else}}none{{/if}}; justify-content: center; align-items: center; opacity: {{theme.watermark.logoOpacity}}; pointer-events: none; }
.watermark img { max-width: 600px; max-height: 400px; object-fit: contain; }

/* Header */
.header { line-height: normal; font-size: {{theme.sizes.header}}pt; font-family: {{theme.fonts.header}}; }
.header-row1 { text-align: center; margin-bottom: 8px; display: flex; justify-content: space-between; }
.header-content { width: 33%; font-size: {{theme.sizes.header}}pt; line-height: 1.3; }
.header-content p { margin: 0; }
.header-content a { color: inherit; text-decoration: none; }
.header-logo-content { display: flex; align-items: center; justify-content: space-between; }
.header-logo-content > div { width: 100%; height: 100%; align-items: center; margin: 3px; align-content: center; display: flex; justify-content: center; }
.header-logo-content > div > img { max-width: {{theme.logos.institutionLogoSize}}px; max-height: {{theme.logos.institutionLogoSize}}px; object-fit: contain; }

.header-row2 { text-align: center; margin-bottom: 15px; }
.header-row2 .main-title { font-weight: bold; text-align: center; font-size: {{theme.sizes.title}}pt; color: {{theme.colors.accent}}; margin: 4px 0; text-transform: uppercase; font-family: {{theme.fonts.title}}; }
.header-row2 .subtitle { font-weight: bold; font-size: {{theme.sizes.subtitle}}pt; color: {{theme.colors.secondary}}; margin: 4px 0; font-style: italic; display: {{#if theme.display.bilingual}}block{{else}}none{{/if}}; font-family: {{theme.fonts.title}}; }
.header-row2 .ref-line { font-size: {{add theme.sizes.body 4}}pt; margin: 6px 0 0 0; font-weight: bold; display: {{#if theme.display.showRefNumber}}block{{else}}none{{/if}}; }

/* Main content */
.content { margin: 25px 0; }
.student-info, .list-nomination-header { margin: 8px 0; }
.student-info p, .list-nomination-header p { margin: 8px 0; }
.nomination-list { display: flex; width: 100%; gap: 30%; margin: 15px 0; }
.nomination-list-item { border-top: 1px solid {{theme.colors.border}}; width: 30%; padding-top: 4px; margin-top: 15px; }

/* Tables */
.table-container { width: 100%; margin: 5px 0; }
.academic-table { width: 100%; border-collapse: collapse; margin-bottom: 5px; }
.academic-table th, .academic-table td { padding: 4px; text-align: center; border: {{theme.borders.innerWidth}}px solid {{theme.colors.border}}; font-size: {{theme.sizes.body}}pt; vertical-align: middle; }
.academic-table th { background-color: rgba(0,0,0,0.05); font-weight: bold; color: {{theme.colors.primary}}; }
.academic-table tr.values-row { border-top: 1px solid {{theme.colors.border}}; background-color: rgba(0,0,0,0.04); }
.academic-table em { font-style: italic; color: {{theme.colors.secondary}}; font-weight: normal; display: {{#if theme.display.bilingual}}inline{{else}}none{{/if}}; }

/* Footer signatures */
.footer { margin-top: 15px; display: flex; justify-content: space-between; }
.signature { width: 48%; font-size: {{theme.sizes.signature}}pt; }
.signature-area { display: flex; flex-direction: column; align-items: center; }
.qr-code { display: {{#if theme.qrCode.enabled}}flex{{else}}none{{/if}}; align-items: center; justify-content: center; position: relative; }
.qr-image { width: {{theme.qrCode.size}}px; height: {{theme.qrCode.size}}px; background-color: #eee; display: block; }
.qr-image img { width: 100%; height: 100%; object-fit: contain; }
.sign-ipes { width: 100%; text-align: center; padding-bottom: 100px; }
.recteur-sign { margin-top: 65px; padding-bottom: 100px; }
.signature p { margin: 0; }

em { font-style: italic; color: {{theme.colors.secondary}}; {{#unless theme.display.bilingual}}display: none;{{/unless}} }

@media print { body { margin: 0; padding: 0; } .container { page-break-after: always; } }

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
	{{#if demoMode}}<div class="demo-banner">⚠️ MODE DÉMO - DOCUMENT NON OFFICIEL ⚠️</div><div class="demo-watermark"></div>{{/if}}

	<div class="watermark">
		{{{logo svg=institution.watermarkLogoSvg url=institution.watermarkLogoUrl alt="Watermark"}}}
	</div>

	<div class="header">
		<div class="header-row1">
			<div class="header-content">
				<p>
					{{country.fr}}<br>
					{{#if theme.display.bilingual}}<em>{{country.mottoFr}}</em>{{else}}<strong>{{country.mottoFr}}</strong>{{/if}}<br>
					********************<br>
					{{ministry.fr}}<br>
					{{#if university.fr}}********************<br><strong>{{upper university.fr}}</strong><br>{{/if}}
					{{#if faculty.fr}}********************<br><strong>{{upper faculty.fr}}</strong>{{#if faculty.postalBox}}<br>B.P. {{faculty.postalBox}}{{/if}}{{#if faculty.contactEmail}}<br>Email : {{faculty.contactEmail}}{{/if}}<br>{{/if}}
					********************<br>
					<strong>{{upper institution.nameFr}}</strong><br>
					{{#if institution.postalBox}}B.P. {{institution.postalBox}}<br>{{/if}}
					{{#if institution.contactEmail}}Email : <a href="mailto:{{institution.contactEmail}}">{{institution.contactEmail}}</a>{{/if}}
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
					{{#if theme.display.bilingual}}<em>{{country.mottoEn}}</em>{{else}}<strong>{{country.mottoEn}}</strong>{{/if}}<br>
					********************<br>
					{{ministry.en}}<br>
					{{#if university.en}}********************<br><strong>{{upper university.en}}</strong><br>{{/if}}
					{{#if faculty.en}}********************<br><strong>{{upper faculty.en}}</strong>{{#if faculty.postalBox}}<br>P.O. Box {{faculty.postalBox}}{{/if}}{{#if faculty.contactEmail}}<br>Email: {{faculty.contactEmail}}{{/if}}<br>{{/if}}
					********************<br>
					<strong>{{upper institution.nameEn}}</strong><br>
					{{#if institution.postalBox}}P.O. Box {{institution.postalBox}}<br>{{/if}}
					{{#if institution.contactEmail}}Email: <a href="mailto:{{institution.contactEmail}}">{{institution.contactEmail}}</a>{{/if}}
				</p>
			</div>
		</div>

		<div class="header-row2">
			<h1 class="main-title">{{document.titleFr}}</h1>
			<h2 class="subtitle">{{document.titleEn}}</h2>
			<p class="ref-line">Réf N° {{document.referenceNumber}}</p>
		</div>
	</div>

	<div class="content">
		<div class="list-nomination-header">
			<p>
				<strong>Je soussigné(e), {{authority.name}}, {{authority.role}}{{#if institution.nameFr}} de {{upper institution.nameFr}}{{/if}},</strong><br>
				{{#if theme.display.bilingual}}<em>I, the undersigned, {{authority.name}}, {{authority.role}}{{#if institution.nameEn}} of the {{upper institution.nameEn}}{{/if}},</em>{{/if}}
			</p>

			<p>
				<strong>Vu le procès-verbal du jury N° {{jury.number}} en date du {{jury.deliberationDate}}, atteste que,</strong><br>
				{{#if theme.display.bilingual}}<em>Considering the jury's decision N° {{jury.number}} dated {{jury.deliberationDate}}, certify that,</em>{{/if}}
			</p>
		</div>

		<div class="student-info">
			<p>
				M./Mme/Mlle <strong>{{upper student.fullName}}</strong><br>
				{{#if theme.display.bilingual}}<em>Mr/Mrs/Miss</em>{{/if}}
			</p>

			<p>
				Né(e) le : <strong>{{student.birthDate}}</strong>&nbsp;&nbsp;&nbsp;à&nbsp;<strong>{{student.birthPlace}}</strong><br>
				{{#if theme.display.bilingual}}<em>Born on : <strong style="opacity:0">{{student.birthDate}}</strong>&nbsp;&nbsp;&nbsp;at :</em>{{/if}}
			</p>

			<p>
				Inscrit(e) à <strong>{{upper institution.nameFr}}</strong> sous le matricule : <strong>{{student.matricule}}</strong><br>
				{{#if theme.display.bilingual}}<em>Registered at the <strong>{{upper institution.nameEn}}</strong> under the matricule number :</em>{{/if}}
			</p>

			<p>
				A subi avec succès toutes les épreuves de : <strong>{{class.name}}</strong> en <strong>{{program.name}}</strong><br>
				{{#if theme.display.bilingual}}<em>Having successfully passed all examinations for {{class.name}} in {{program.name}}</em>{{/if}}
			</p>
		</div>

		<div class="table-container">
			<table class="academic-table">
				<tr>
					<th>Domaine{{#if theme.display.bilingual}}<br><em>Domain of the study</em>{{/if}}</th>
					<th>Parcours{{#if theme.display.bilingual}}<br><em>Course</em>{{/if}}</th>
					<th>Spécialité{{#if theme.display.bilingual}}<br><em>Specialization</em>{{/if}}</th>
					{{#if student.option}}<th>Option{{#if theme.display.bilingual}}<br><em>Learning option</em>{{/if}}</th>{{/if}}
				</tr>
				<tr class="values-row">
					<td><strong>{{program.domainFr}}</strong>{{#if theme.display.bilingual}}<br><em>{{program.domainEn}}</em>{{/if}}</td>
					<td><strong>{{program.name}}</strong>{{#if theme.display.bilingual}}<br><em>{{program.nameEn}}</em>{{/if}}</td>
					<td><strong>{{program.specialiteFr}}</strong>{{#if theme.display.bilingual}}<br><em>{{program.specialiteEn}}</em>{{/if}}</td>
					{{#if student.option}}<td><strong>{{student.option}}</strong>{{#if theme.display.bilingual}}<br><em>{{student.optionEn}}</em>{{/if}}</td>{{/if}}
				</tr>
			</table>
		</div>

		{{#if showResults}}
		<div class="table-container">
			<table class="academic-table">
				<tr>
					<th>Total de crédits{{#if theme.display.bilingual}}<br><em>Credits earned</em>{{/if}}</th>
					<th>Moyenne{{#if theme.display.bilingual}}<br><em>Average</em>{{/if}}</th>
					<th>Mention{{#if theme.display.bilingual}}<br><em>Honor</em>{{/if}}</th>
					<th>Décision{{#if theme.display.bilingual}}<br><em>Decision</em>{{/if}}</th>
					<th>Année académique{{#if theme.display.bilingual}}<br><em>Academic year</em>{{/if}}</th>
				</tr>
				<tr class="values-row">
					<td><strong>{{summary.creditsEarned}} / {{summary.creditsTotal}}</strong></td>
					<td><strong>{{formatNumber summary.generalAverage}}</strong></td>
					<td><strong>{{summary.mention}}</strong></td>
					<td><strong>{{summary.decision}}</strong></td>
					<td><strong>{{document.academicYear}}</strong></td>
				</tr>
			</table>
		</div>
		{{/if}}

		<p>
			En foi de quoi la présente Attestation est délivrée pour servir et valoir ce que de droit.<br>
			{{#if theme.display.bilingual}}<em>In witness whereof the present testimonial is given with all the privileges thereto pertaining.</em>{{/if}}
		</p>
	</div>

	<div class="footer">
		<div class="signature signature-area">
			<div class="qr-code">
				<div class="qr-image">{{#if qrCodeImage}}<img src="{{qrCodeImage}}" alt="QR Code">{{/if}}</div>
			</div>
			<div class="sign-ipes">
				<p>
					<strong>{{authority.role}}</strong><br>
					{{#if theme.display.bilingual}}<em>The {{authority.role}}</em>{{/if}}
				</p>
			</div>
		</div>

		<div class="signature signature-area">
			<p>
				<strong>{{institution.city}}, le {{document.issueDate}}</strong><br>
				{{#if theme.display.bilingual}}<em>{{institution.city}}, the {{document.issueDate}}</em>{{/if}}
			</p>
			<p class="recteur-sign">
				<strong>LE CHEF D'ÉTABLISSEMENT</strong><br>
				{{#if theme.display.bilingual}}<em>The Dean of the Faculty</em>{{/if}}
			</p>
		</div>
	</div>
</div>
</body>
</html>

`;

export const ATTESTATION_TEMPLATE_CENTER = /* html */ `
<!--
  Attestation de réussite — Modèle CENTRE.
  Squelette CSS / HTML strictement repris de attestation_template_ipes.html
  (tailles en px, bordure 1px solid, watermark, tables, signataires, etc.)
  Seul le contenu change :
    - L'en-tête tire EXCLUSIVEMENT des tables \`centers\` /
      \`center_administrative_instances\` / \`center_legal_texts\`.
    - Le watermark utilise \`center.watermarkLogo*\`.
    - Texte officiel : "Je soussigné(e), Le Directeur du Centre".
    - Signataire : "LE DIRECTEUR DU CENTRE" (pas de Doyen / Recteur).
-->
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Attestation de réussite — {{upper student.firstName}} {{upper student.lastName}}</title>
<style>
@page { size: A4 portrait; margin: 0; }
* { box-sizing: border-box; }
html { width: 210mm; height: 297mm; }
body {
	margin: 20px; padding: 0;
	width: calc(210mm - 40px);
	height: calc(297mm - 40px);
	font-family: {{theme.fonts.main}};
	font-size: 10px;
	color: {{theme.colors.primary}};
	background-color: white;
	line-height: 1.2;
	position: relative;
}
.container { width: 100%; height: 100%; padding: 20px; box-sizing: border-box; position: relative; border: 1px solid {{theme.colors.primary}}; }

.watermark {
	position: absolute; top: 25%; left: 0;
	width: 100%; height: 50%;
	z-index: -1;
	display: {{#if theme.watermark.enabled}}flex{{else}}none{{/if}};
	justify-content: center; align-items: center;
	opacity: {{theme.watermark.logoOpacity}};
	pointer-events: none;
}
.watermark img { max-width: 600px; max-height: 400px; object-fit: contain; }

.header { line-height: normal; font-size: 9px; font-family: {{theme.fonts.header}}; }
.header-row1 { text-align: center; margin-bottom: 8px; padding: 0 8px; display: flex; justify-content: space-between; }
.header-content { width: 33%; font-size: 9px; line-height: 1.1; }
.center-authorization { display: block; font-size: 8px; font-style: italic; padding: 4px 6px; margin-top: 4px; border-top: 1px dotted {{theme.colors.secondary}}; }
.center-legal-text { display: block; font-size: 8px; line-height: 1.35; margin-top: 1px; }
/* Logos centered with uniform gap. Order: admin instance logos → center logo. */
.header-logo-content { display: flex; align-items: center; justify-content: center; gap: 10px; flex-wrap: nowrap; }
.header-logo-content > div { display: flex; align-items: center; justify-content: center; }
.header-logo-content > div > img { max-width: 80px; max-height: 80px; object-fit: contain; }

.header-row2 { text-align: center; margin-bottom: 10px; }
.header-row2 h1 { font-weight: bold; text-align: center; font-size: 17px; color: {{theme.colors.primary}}; margin: 2px 0; text-transform: uppercase; font-family: {{theme.fonts.title}}; }
.header-row2 h2 { font-weight: bold; font-size: 22px; color: {{theme.colors.secondary}}; margin: 2px 0; font-style: italic; }
.header-row2 p { font-size: 14px; margin: 2px 0; }

/* Body content (after ref number): bumped to 12px for legibility on the
 * official document. The header keeps its 9px to fit the center info chain. */
.content { margin: 16px 0; font-size: 12px; line-height: 1.5; }
.content p { font-size: 12px; line-height: 1.5; }
.student-info, .list-nomination-header { margin: 8px 0; font-size: 12px; }
.student-info p, .list-nomination-header p { margin: 8px 0; font-size: 12px; line-height: 1.5; }

.table-container { width: 100%; margin: 4px 0; }
table { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
th, td { padding: 4px; text-align: center; border: none; font-size: 11px; vertical-align: middle; }
th { background: none; border-bottom: 2px solid {{theme.colors.primary}}; font-weight: bold; }
td { border-bottom: 1px solid #00000040; }

.nomination-list { display: flex; width: 100%; gap: 30%; margin: 8px 0; }
.nomination-list-item { border-top: 1px solid {{theme.colors.primary}}; width: 30%; padding-top: 4px; margin-top: 15px; }

.footer { margin-top: 8px; display: flex; justify-content: space-between; }
.signature { width: 48%; font-size: 10px; }

.sign-ipes { width: 100%; text-align: center; padding-bottom: 100px; }
.recteur-sign { margin-top: 65px; padding-bottom: 100px; }

.qr-code { float: left; position: relative; }
.qr-image { width: 100px; height: 100px; background-color: #eee; display: block; }
.qr-image img { width: 100%; height: 100%; object-fit: contain; }

.disclaimer { font-size: 7px; font-style: italic; text-align: left; margin-top: 10px; display: flex; flex-direction: row; position: absolute; bottom: 20px; left: 20px; right: 20px; color: {{theme.colors.secondary}}; line-height: 1.4; }
.disclaimer div { padding-right: 10px; }

em { font-style: italic; color: {{theme.colors.secondary}}; }

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
		{{!-- Background watermark = the center's main logo. --}}
		{{{logo svg=center.logoSvg url=center.logoUrl alt="Watermark"}}}
	</div>

	<div class="header">
		<div class="header-row1">
			<div class="header-content">
				<p>
					{{#each center.administrativeInstances}}{{#if showOnCertificates}}<strong>{{upper nameFr}}{{#if acronymFr}} ({{acronymFr}}){{/if}}</strong><br>********************<br>{{/if}}{{/each}}
					<strong>{{upper center.name}}</strong><br>
					{{#if center.postalBox}}********************<br>{{center.postalBox}}<br>{{/if}}
					{{#if center.contactEmail}}Email : <a href="mailto:{{center.contactEmail}}">{{center.contactEmail}}</a>{{/if}}
				</p>
				{{#if center.authorizationOrderFr}}<span class="center-authorization">{{center.authorizationOrderFr}}</span>{{/if}}
				{{#each center.legalTexts}}<span class="center-legal-text">{{textFr}}</span>{{/each}}
			</div>
			<div class="header-logo-content">
				{{#each center.administrativeInstances}}{{#if showOnCertificates}}{{#if (or this.logoSvg this.logoUrl)}}<div>{{{logo svg=this.logoSvg url=this.logoUrl alt=this.nameFr}}}</div>{{/if}}{{/if}}{{/each}}
				{{#if (or center.logoSvg center.logoUrl)}}<div>{{{logo svg=center.logoSvg url=center.logoUrl alt=center.name}}}</div>{{/if}}
			</div>
			<div class="header-content">
				<p>
					{{#each center.administrativeInstances}}{{#if showOnCertificates}}<strong>{{upper nameEn}}{{#if acronymEn}} ({{acronymEn}}){{/if}}</strong><br>********************<br>{{/if}}{{/each}}
					<strong>{{upper center.nameEn}}</strong><br>
					{{#if center.postalBox}}********************<br>{{center.postalBox}}<br>{{/if}}
					{{#if center.contactEmail}}Email : <a href="mailto:{{center.contactEmail}}">{{center.contactEmail}}</a>{{/if}}
				</p>
				{{#if center.authorizationOrderEn}}<span class="center-authorization">{{center.authorizationOrderEn}}</span>{{/if}}
				{{#each center.legalTexts}}<span class="center-legal-text">{{textEn}}</span>{{/each}}
			</div>
		</div>
		<div class="header-row2">
			<h1 class="main-title">ATTESTATION DE REUSSITE — {{program.level}}</h1>
			<h2 class="subtitle">CERTIFICATE OF COMPLETION — {{program.level}}</h2>
			<p style="margin-top: 6px;"><strong>Ref N°&nbsp;&nbsp;_____________&nbsp;/{{document.year}}{{#each center.administrativeInstances}}{{#if acronymFr}}/{{acronymFr}}{{/if}}{{/each}}/{{#if center.shortName}}{{center.shortName}}{{else}}{{center.code}}{{/if}}</strong></p>
		</div>
	</div>

	<div class="content">
		<div class="list-nomination-header">
			<p><strong>Je soussigné(e),</strong><br>
			<em>I, the undersigned,</em></p>
			<div class="nomination-list">
				<div class="nomination-list-item">
					<strong>Le Directeur du {{#if center.shortName}}{{upper center.shortName}}{{else}}{{upper center.name}}{{/if}}</strong><br>
					<em>The Director of {{#if center.shortName}}{{upper center.shortName}}{{else}}{{upper center.name}}{{/if}}</em>
				</div>
			</div>

			<p><strong>Vu le procès-verbal du jury N° {{jury.number}} en date du {{jury.deliberationDate}} atteste que,</strong><br>
			<em>Considering the jury's decision N° {{jury.number}} dated {{jury.deliberationDate}}, certify that,</em></p>
		</div>

		<div class="student-info">
			<p>M./Mme/Mlle <strong>{{upper student.firstName}} {{upper student.lastName}}</strong><br>
			<em>Mr/Mrs/Miss</em></p>

			<p>Né(e) le : <strong>{{student.birthDate}}</strong> &nbsp;&nbsp;à&nbsp; <strong>{{student.birthPlace}}</strong><br>
			<em>Born on: <strong style="opacity:0">{{student.birthDate}}</strong></em>&nbsp;&nbsp;<em>at</em></p>

			<p>Inscrit(e) au <strong>{{upper center.name}}</strong> sous le matricule : <strong>{{student.matricule}}</strong><br>
			<em>Registered at the <strong>{{upper center.nameEn}}</strong> under the matricule number</em></p>

			<p>A subi avec succès toutes les épreuves de : <strong>{{program.level}}</strong> en <strong>{{program.name}}</strong><br>
			<em>Having successfully passed all examinations for</em></p>
		</div>

		<div class="table-container">
			<table class="academic-table">
				<tr>
					<th>Domaine<br><em style="font-weight: normal">Domain of study</em></th>
					<th>Parcours<br><em style="font-weight: normal">Course</em></th>
					<th>Spécialité<br><em style="font-weight: normal">Specialization</em></th>
				</tr>
				<tr style="border-top: 1px solid {{theme.colors.primary}}; background-color: rgba(0,0,0,0.04);">
					<td><strong>—</strong></td>
					<td><strong>{{program.name}}</strong></td>
					<td><strong>{{student.option}}</strong></td>
				</tr>
			</table>
		</div>

		<div class="table-container">
			<table class="academic-table">
				<tr>
					<th>Total de crédits<br><em style="font-weight: normal">Credits earned</em></th>
					<th>Moyenne<br><em style="font-weight: normal">Average</em></th>
					<th>Mention<br><em style="font-weight: normal">Honor</em></th>
					<th>Année académique<br><em style="font-weight: normal">Academic year</em></th>
					<th>Décision<br><em style="font-weight: normal">Decision</em></th>
				</tr>
				<tr style="border-top: 1px solid {{theme.colors.primary}}; background-color: rgba(0,0,0,0.04);">
					<td><strong>{{summary.creditsEarned}} / {{summary.creditsTotal}}</strong></td>
					<td><strong>{{formatNumber summary.generalAverage}} / 20</strong></td>
					<td><strong>{{summary.mention}}</strong></td>
					<td><strong>{{document.academicYear}}</strong></td>
					<td><strong>{{summary.decision}}</strong></td>
				</tr>
			</table>
		</div>

		<p>En foi de quoi la présente attestation est délivrée pour servir et valoir ce que de droit.<br>
		<em>In witness whereof the present testimonial is given with all the privileges thereto pertaining.</em></p>
	</div>

	<div class="footer">
		<div class="signature signature-area" style="display: flex; flex-direction: column; align-items: center;">
			<div class="qr-code">
				{{#if qrCodeImage}}<div class="qr-image"><img src="{{qrCodeImage}}" alt="QR Code"></div>{{/if}}
			</div>
		</div>

		<div class="signature signature-area">
			<p><strong>{{center.city}}, le</strong><br>
			<em>{{center.city}}, the</em></p>

			<p class="recteur-sign">
			<strong>LE DIRECTEUR DU {{#if center.shortName}}{{upper center.shortName}}{{else}}{{upper center.name}}{{/if}}</strong><br>
			<em>The Director of {{#if center.shortName}}{{upper center.shortName}}{{else}}{{upper center.name}}{{/if}}</em></p>
		</div>
	</div>

	<div class="disclaimer">
		<div>Il n'est délivré qu'un seul exemplaire d'attestation, le titulaire peut en faire des copies certifiées conformes.</div>
		<div><em>This certificate is delivered only once, the owner can make certified copies as necessary.</em></div>
	</div>
</div>
</body>
</html>

`;
