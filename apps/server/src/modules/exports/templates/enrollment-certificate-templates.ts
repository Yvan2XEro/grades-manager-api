/**
 * Enrollment certificate ("certificat / attestation de scolarité").
 *
 * Certifies that a student is (or was) duly enrolled in a class / program /
 * level for an academic year. Unlike the pass certificate it says nothing
 * about results, so it only needs an enrollment.
 *
 * One body serves the standard and the center variants: the header switches
 * to the center branding when the class's program is attached to a center.
 * Render data used: institution.* (identity + contact), tutelleChain, center,
 * student.*, enrollment.*, program.*, class.*, document.* (reference, issue
 * date), signatory.*, qrCodeImage, theme.*.
 */
export const ENROLLMENT_CERTIFICATE_TEMPLATE = /* html */ `
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Certificat de scolarité — {{upper student.lastName}} {{student.firstName}}</title>
<style>
@page { size: A4 portrait; margin: 0; }
* { box-sizing: border-box; }
html { width: 210mm; height: 297mm; }
body {
	margin: 0; padding: 12mm;
	width: 210mm; height: 297mm;
	font-family: {{theme.fonts.main}};
	font-size: 11px;
	color: {{theme.colors.primary}};
	background: white;
	line-height: 1.35;
}
.page { position: relative; width: 100%; height: 100%; border: 1px solid {{theme.colors.primary}}; padding: 9mm 11mm 30mm; }
em { font-style: italic; color: {{theme.colors.secondary}}; }

.watermark { position: absolute; inset: 30% 0 auto 0; height: 40%; display: {{#if theme.watermark.enabled}}flex{{else}}none{{/if}}; justify-content: center; align-items: center; opacity: {{theme.watermark.logoOpacity}}; pointer-events: none; z-index: 0; }
.watermark img, .watermark svg { max-width: 420px; max-height: 320px; object-fit: contain; }

.header { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; font-family: {{theme.fonts.header}}; position: relative; z-index: 1; }
.header-side { width: 38%; text-align: center; font-size: 8.5px; line-height: 1.25; }
.header-side strong { font-size: 9px; }
.stars { letter-spacing: 1px; font-size: 7px; }
.header-logos { flex: 1; display: flex; justify-content: center; align-items: center; gap: 8px; }
.header-logos img, .header-logos svg { max-width: 72px; max-height: 72px; object-fit: contain; }
.contact-line { font-size: 8px; }

.title-block { text-align: center; margin: 9mm 0 7mm; position: relative; z-index: 1; }
.title-block h1 { font-family: {{theme.fonts.title}}; font-size: 21px; letter-spacing: 1.5px; margin: 0; text-transform: uppercase; }
.title-block h2 { font-size: 14px; font-style: italic; font-weight: normal; margin: 2px 0 0; color: {{theme.colors.secondary}}; }
.title-block .ref { margin-top: 8px; font-size: 11px; font-weight: bold; }

.body { position: relative; z-index: 1; font-size: 12px; line-height: 1.6; }
.body p { margin: 0 0 10px; }
.identity { width: 100%; border-collapse: collapse; margin: 6px 0 14px; font-size: 12px; }
.identity td { padding: 5px 6px; border-bottom: 1px solid #00000022; vertical-align: top; }
.identity td.label { width: 42%; }
.identity td.label em { display: block; font-size: 10px; }
.identity td.value { font-weight: bold; }
.enrolled { margin: 12px 0 14px; padding: 10px 12px; border-left: 3px solid {{theme.colors.primary}}; background: rgba(0,0,0,0.03); }

.signature-row { display: flex; justify-content: space-between; align-items: flex-start; margin-top: 10mm; position: relative; z-index: 1; }
.qr img { width: 90px; height: 90px; object-fit: contain; }
.signature { width: 55%; text-align: center; font-size: 11.5px; }
.signature .place { margin-bottom: 4px; }
.signature .space { height: 26mm; }
.signature .name { font-weight: bold; text-decoration: underline; }

.footer { position: absolute; left: 11mm; right: 11mm; bottom: 8mm; border-top: 1px solid {{theme.colors.primary}}; padding-top: 4px; text-align: center; font-size: 8px; line-height: 1.4; }
.footer .slogan { font-style: italic; font-size: 8.5px; }
.notice { font-size: 7.5px; font-style: italic; margin-top: 2px; }
</style>
</head>
<body>
<div class="page">
	<div class="watermark">
		{{#if center}}{{{logo svg=center.watermarkLogoSvg url=center.watermarkLogoUrl alt="Watermark"}}}{{else}}{{{logo svg=institution.watermarkLogoSvg url=institution.watermarkLogoUrl alt="Watermark"}}}{{/if}}
	</div>

	<div class="header">
		<div class="header-side">
			{{#if center}}
				{{#each center.administrativeInstances}}{{#if showOnCertificates}}<strong>{{upper nameFr}}</strong><br><span class="stars">********</span><br>{{/if}}{{/each}}
				<strong>{{upper center.name}}</strong><br>
				{{#if center.postalBox}}{{center.postalBox}}<br>{{/if}}
				{{#if center.contactPhone}}<span class="contact-line">Tél. : {{center.contactPhone}}</span><br>{{/if}}
				{{#if center.contactEmail}}<span class="contact-line">{{center.contactEmail}}</span>{{/if}}
			{{else}}
				{{country.fr}}<br><em>{{country.mottoFr}}</em><br><span class="stars">********</span><br>
				{{ministry.fr}}<br>
				{{#each tutelleChain}}<span class="stars">********</span><br><strong>{{upper this.nameFr}}</strong><br>{{/each}}
				<span class="stars">********</span><br>
				<strong>{{upper institution.nameFr}}</strong><br>
				{{#if institution.postalBox}}<span class="contact-line">{{institution.postalBox}}</span><br>{{/if}}
				{{#if institution.contactPhone}}<span class="contact-line">Tél. : {{institution.contactPhone}}</span><br>{{/if}}
				{{#if institution.contactEmail}}<span class="contact-line">{{institution.contactEmail}}</span>{{/if}}
			{{/if}}
		</div>
		<div class="header-logos">
			{{#if center}}
				{{#if (or center.logoSvg center.logoUrl)}}<div>{{{logo svg=center.logoSvg url=center.logoUrl alt=center.name}}}</div>{{/if}}
			{{else}}
				{{#each tutelleChain}}{{#if (or this.logoSvg this.logoUrl)}}<div>{{{logo svg=this.logoSvg url=this.logoUrl alt=this.nameFr}}}</div>{{/if}}{{/each}}
				{{#if (or institution.logoSvg institution.logoUrl)}}<div>{{{logo svg=institution.logoSvg url=institution.logoUrl alt=institution.nameFr}}}</div>{{/if}}
			{{/if}}
		</div>
		<div class="header-side">
			{{#if center}}
				{{#each center.administrativeInstances}}{{#if showOnCertificates}}<strong>{{upper nameEn}}</strong><br><span class="stars">********</span><br>{{/if}}{{/each}}
				<strong>{{upper center.nameEn}}</strong><br>
				{{#if center.postalBox}}{{center.postalBox}}<br>{{/if}}
				{{#if center.contactPhone}}<span class="contact-line">Tel: {{center.contactPhone}}</span><br>{{/if}}
				{{#if center.contactEmail}}<span class="contact-line">{{center.contactEmail}}</span>{{/if}}
			{{else}}
				{{country.en}}<br><em>{{country.mottoEn}}</em><br><span class="stars">********</span><br>
				{{ministry.en}}<br>
				{{#each tutelleChain}}<span class="stars">********</span><br><strong>{{upper this.nameEn}}</strong><br>{{/each}}
				<span class="stars">********</span><br>
				<strong>{{upper institution.nameEn}}</strong><br>
				{{#if institution.postalBox}}<span class="contact-line">{{institution.postalBox}}</span><br>{{/if}}
				{{#if institution.contactPhone}}<span class="contact-line">Tel: {{institution.contactPhone}}</span><br>{{/if}}
				{{#if institution.contactEmail}}<span class="contact-line">{{institution.contactEmail}}</span>{{/if}}
			{{/if}}
		</div>
	</div>

	<div class="title-block">
		<h1>{{document.titleFr}}</h1>
		<h2>{{document.titleEn}}</h2>
		<div class="ref">N° {{document.referenceNumber}}</div>
	</div>

	<div class="body">
		<p>
			<strong>Je soussigné(e){{#if signatory.name}}, {{signatory.name}}{{/if}}, {{signatory.titleFr}},</strong> certifie que :<br>
			<em>I, the undersigned{{#if signatory.name}}, {{signatory.name}}{{/if}}, {{signatory.titleEn}}, hereby certify that:</em>
		</p>

		<table class="identity">
			<tr>
				<td class="label">Nom et prénom(s)<em>Surname and given name(s)</em></td>
				<td class="value">{{upper student.lastName}} {{student.firstName}}</td>
			</tr>
			<tr>
				<td class="label">Né(e) le / à<em>Date and place of birth</em></td>
				<td class="value">{{student.birthDate}}{{#if student.birthPlace}} à {{student.birthPlace}}{{/if}}</td>
			</tr>
			<tr>
				<td class="label">Matricule<em>Registration number</em></td>
				<td class="value">{{student.matricule}}</td>
			</tr>
		</table>

		<div class="enrolled">
			<p>
				{{#if enrollment.isCurrent}}est régulièrement inscrit(e){{else}}a été régulièrement inscrit(e){{/if}}
				à <strong>{{institution.nameFr}}</strong>
				en <strong>{{#if program.level}}{{program.level}} — {{/if}}{{program.name}}</strong>{{#if student.option}}, option <strong>{{student.option}}</strong>{{/if}}
				(classe <strong>{{class.name}}</strong>)
				au titre de l'année académique <strong>{{document.academicYear}}</strong>.<br>
				<em>{{#if enrollment.isCurrent}}is duly enrolled{{else}}was duly enrolled{{/if}} at {{institution.nameEn}}
				in {{#if program.level}}{{program.level}} — {{/if}}{{program.name}} (class {{class.name}})
				for the {{document.academicYear}} academic year.</em>
			</p>
		</div>

		<p>
			En foi de quoi le présent certificat lui est délivré pour servir et valoir ce que de droit.<br>
			<em>In witness whereof this certificate is issued to serve and avail as of right.</em>
		</p>
	</div>

	<div class="signature-row">
		<div class="qr">
			{{#if qrCodeImage}}<img src="{{qrCodeImage}}" alt="QR">{{/if}}
		</div>
		<div class="signature">
			<div class="place">
				<strong>Fait à {{institution.city}}, le {{document.issueDate}}</strong><br>
				<em>Issued in {{institution.city}}, on {{document.issueDate}}</em>
			</div>
			<strong>{{signatory.titleFr}}</strong><br>
			<em>{{signatory.titleEn}}</em>
			<div class="space"></div>
			{{#if signatory.name}}<div class="name">{{signatory.name}}</div>{{/if}}
		</div>
	</div>

	<div class="footer">
		<div>
			<strong>{{institution.nameFr}}</strong>{{#if institution.addressFr}} — {{institution.addressFr}}{{/if}}{{#if institution.contactPhone}} — Tél. : {{institution.contactPhone}}{{/if}}{{#if institution.contactEmail}} — {{institution.contactEmail}}{{/if}}{{#if institution.website}} — {{institution.website}}{{/if}}
		</div>
		{{#if institution.sloganFr}}<div class="slogan">« {{institution.sloganFr}} »</div>{{/if}}
		<div class="notice">Toute rature ou surcharge annule ce certificat. / Any erasure or alteration voids this certificate.</div>
	</div>
</div>
</body>
</html>
`;
