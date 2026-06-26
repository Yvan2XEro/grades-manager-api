/**
 * Built-in default templates for financial documents (fee clearance module).
 * These are the system fallbacks — institutions can override them via the
 * export-templates admin UI (same mechanism as academic document templates).
 *
 * Kept as TS string exports so they are bundled at compile time and available
 * in Docker without extra COPY rules or fs path resolution.
 */

export const PAYMENT_ORDER_TEMPLATE = /* html */ `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Bon de caisse — {{student.fullName}}</title>
<style>
@page { size: A4 portrait; margin: 0; }
* { box-sizing: border-box; }
body {
  margin: 20mm 20mm 20mm 20mm;
  font-family: Arial, sans-serif;
  font-size: 11pt;
  color: #1a1a1a;
  background: white;
}
.institution { text-align: center; font-size: 10.5pt; margin-bottom: 8px; }
.header { text-align: center; border-bottom: 2px solid #1a1a1a; padding-bottom: 8px; margin-bottom: 16px; }
.header h1 { font-size: 14pt; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 1px; }
.header h2 { font-size: 11pt; margin: 0; font-weight: normal; color: #555; }
.title-box {
  border: 2px solid #1a1a1a;
  padding: 8px 16px;
  text-align: center;
  margin: 20px 0;
  font-size: 13pt;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 2px;
}
.ref { text-align: right; font-size: 9pt; color: #666; margin-bottom: 16px; }
table.info { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
table.info td { padding: 5px 8px; font-size: 10.5pt; vertical-align: top; }
table.info td:first-child { font-weight: bold; width: 40%; }
table.amount { width: 100%; border-collapse: collapse; margin: 20px 0; border: 1px solid #ccc; }
table.amount th { background: #f0f0f0; padding: 8px; border: 1px solid #ccc; font-size: 10pt; text-align: left; }
table.amount td { padding: 8px; border: 1px solid #ccc; font-size: 11pt; }
table.amount .total { font-weight: bold; font-size: 13pt; }
.note { font-size: 9.5pt; color: #555; margin-top: 12px; font-style: italic; }
.validity { margin-top: 16px; padding: 10px; background: #fff8e1; border-left: 4px solid #f0a500; font-size: 10pt; }
.footer { margin-top: 40px; display: flex; justify-content: space-between; }
.signature { text-align: center; width: 45%; }
.signature .line { border-top: 1px solid #1a1a1a; margin-top: 50px; padding-top: 4px; font-size: 9.5pt; }
</style>
</head>
<body>
<div class="institution"><strong>{{institution.name}}</strong>{{#if institution.shortName}} — {{institution.shortName}}{{/if}}</div>
<div class="header">
  <h1>Bon de caisse / Ordre de paiement</h1>
  <h2>Payment Order</h2>
</div>
<div class="ref">
  Réf. : {{#if order.reference}}{{order.reference}}{{else}}—{{/if}} &nbsp;|&nbsp; Date : {{order.createdAt}}
</div>
<table class="info">
  <tr><td>Étudiant / Student</td><td>{{student.fullName}}</td></tr>
  <tr><td>Matricule</td><td>{{student.registrationNumber}}</td></tr>
  <tr><td>Année académique</td><td>{{academicYear.name}}</td></tr>
  <tr><td>Structure tarifaire</td><td>{{feeStructure.name}}</td></tr>
  <tr><td>Statut actuel</td><td>{{assignment.status}}</td></tr>
</table>
<div class="title-box">Montant à payer / Amount Due</div>
<table class="amount">
  <tr><th>Désignation</th><th>Montant</th></tr>
  <tr><td>Frais de scolarité</td><td class="total">{{order.amount}} {{order.currency}}</td></tr>
</table>
{{#if order.notes}}<div class="note">Note : {{order.notes}}</div>{{/if}}
{{#if order.expiresAt}}
<div class="validity">Ce bon est valable jusqu'au <strong>{{order.expiresAt}}</strong>.</div>
{{/if}}
<div class="footer">
  <div class="signature"><div class="line">Signature de l'étudiant<br>Student's signature</div></div>
  <div class="signature"><div class="line">Cachet et signature de l'établissement<br>Institution stamp &amp; signature</div></div>
</div>
</body>
</html>`;

export const PAYMENT_RECEIPT_TEMPLATE = /* html */ `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Reçu de paiement — {{student.fullName}}</title>
<style>
@page { size: A5 landscape; margin: 0; }
* { box-sizing: border-box; }
body {
  margin: 14mm 16mm;
  font-family: Arial, sans-serif;
  font-size: 10.5pt;
  color: #1a1a1a;
  background: white;
}
.header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1a1a1a; padding-bottom: 8px; margin-bottom: 12px; }
.header-left { font-size: 10pt; }
.header-right { text-align: right; font-size: 9.5pt; color: #444; }
.title { text-align: center; margin: 10px 0; }
.title h1 { font-size: 14pt; margin: 0; text-transform: uppercase; letter-spacing: 1px; }
.badge {
  display: inline-block;
  background: #1a7a1a;
  color: white;
  padding: 3px 14px;
  border-radius: 20px;
  font-size: 9pt;
  font-weight: bold;
  margin-top: 4px;
}
table.info { width: 100%; border-collapse: collapse; margin: 10px 0; }
table.info tr:nth-child(even) { background: #f9f9f9; }
table.info td { padding: 4px 8px; font-size: 10pt; }
table.info td:first-child { font-weight: bold; width: 38%; }
.amount-box { border: 2px solid #1a7a1a; padding: 8px 16px; text-align: center; margin: 12px 0; border-radius: 4px; }
.amount-box .label { font-size: 9.5pt; color: #555; }
.amount-box .value { font-size: 18pt; font-weight: bold; color: #1a7a1a; }
.footer { margin-top: 18px; display: flex; justify-content: space-between; }
.signature { text-align: center; width: 45%; }
.signature .line { border-top: 1px solid #1a1a1a; margin-top: 30px; padding-top: 4px; font-size: 9pt; }
.legal { font-size: 8.5pt; color: #777; text-align: center; margin-top: 12px; border-top: 1px solid #ddd; padding-top: 6px; }
</style>
</head>
<body>
<div class="header">
  <div class="header-left"><strong>{{institution.name}}</strong>{{#if institution.shortName}}<br>{{institution.shortName}}{{/if}}</div>
  <div class="header-right">
    N° : {{#if payment.reference}}{{payment.reference}}{{else}}—{{/if}}<br>
    Date paiement : {{payment.paymentDate}}<br>
    Enregistré le : {{payment.createdAt}}
  </div>
</div>
<div class="title">
  <h1>Reçu de paiement / Payment Receipt</h1>
  <div>Année académique : {{academicYear.name}}</div>
  <span class="badge">✓ Confirmé</span>
</div>
<table class="info">
  <tr><td>Étudiant</td><td>{{student.fullName}}</td></tr>
  <tr><td>Matricule</td><td>{{student.registrationNumber}}</td></tr>
  <tr><td>Structure tarifaire</td><td>{{feeStructure.name}}</td></tr>
  <tr><td>Mode de paiement</td><td>{{payment.paymentMethod}}</td></tr>
</table>
<div class="amount-box">
  <div class="label">Montant reçu / Amount received</div>
  <div class="value">{{payment.amount}} {{payment.currency}}</div>
</div>
<div class="footer">
  <div class="signature"><div class="line">Signature de l'étudiant<br>Student's signature</div></div>
  <div class="signature"><div class="line">Cachet et signature du caissier<br>Cashier stamp &amp; signature</div></div>
</div>
<div class="legal">Ce reçu est un document officiel de {{institution.name}}. Toute falsification est passible de poursuites.</div>
</body>
</html>`;

export const FINANCIAL_CLEARANCE_TEMPLATE = /* html */ `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Attestation de quitus — {{student.fullName}}</title>
<style>
@page { size: A4 portrait; margin: 0; }
* { box-sizing: border-box; }
body {
  margin: 22mm 22mm 22mm 22mm;
  font-family: "Times New Roman", Times, serif;
  font-size: 12pt;
  color: #1a1a1a;
  background: white;
  line-height: 1.6;
}
.header { text-align: center; margin-bottom: 24px; border-bottom: 3px double #1a1a1a; padding-bottom: 12px; }
.header .name { font-size: 15pt; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
.doc-title { text-align: center; margin: 28px 0; }
.doc-title h1 {
  font-size: 16pt;
  text-transform: uppercase;
  letter-spacing: 2px;
  border: 2px solid #1a1a1a;
  display: inline-block;
  padding: 8px 24px;
  margin: 0;
}
.doc-title .subtitle { font-size: 12pt; margin-top: 6px; color: #555; font-style: italic; }
.ref { text-align: right; font-size: 10pt; color: #666; margin-bottom: 20px; }
.body-text { text-align: justify; margin-bottom: 16px; }
.student-info { margin: 20px 0; padding: 12px 16px; border: 1px solid #ccc; background: #fafafa; }
.student-info table { width: 100%; border-collapse: collapse; }
.student-info td { padding: 4px 8px; }
.student-info td:first-child { font-weight: bold; width: 35%; }
.clearance-banner {
  margin: 24px 0;
  padding: 14px;
  background: #e8f5e9;
  border-left: 6px solid #2e7d32;
  text-align: center;
  font-size: 13pt;
  font-weight: bold;
  color: #2e7d32;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.validity { font-size: 10.5pt; color: #555; font-style: italic; margin-top: 8px; }
.footer { margin-top: 50px; display: flex; justify-content: space-between; align-items: flex-end; }
.footer .signature { text-align: center; }
.footer .signature .line { border-top: 1px solid #1a1a1a; margin-top: 50px; padding-top: 4px; font-size: 10pt; }
</style>
</head>
<body>
<div class="header">
  <div class="name">{{institution.name}}</div>
  {{#if institution.shortName}}<div>{{institution.shortName}}</div>{{/if}}
</div>
<div class="doc-title">
  <h1>Attestation de quitus</h1>
  <div class="subtitle">Financial Clearance Certificate</div>
</div>
<div class="ref">Réf. : {{assignment.id}} &nbsp;|&nbsp; Délivrée le : {{clearedAt}}</div>
<p class="body-text">
  Le soussigné, <strong>{{institution.name}}</strong>, certifie par la présente
  que l'étudiant(e) dont les informations figurent ci-dessous est à jour
  de l'ensemble de ses obligations financières pour l'année académique en cours.
</p>
<div class="student-info">
  <table>
    <tr><td>Nom et prénom(s)</td><td>{{student.fullName}}</td></tr>
    <tr><td>Matricule</td><td>{{student.registrationNumber}}</td></tr>
    <tr><td>Année académique</td><td>{{academicYear.name}}</td></tr>
    <tr><td>Structure tarifaire</td><td>{{feeStructure.name}}</td></tr>
    <tr><td>Montant acquitté</td><td>{{assignment.effectiveAmount}} {{assignment.currency}}</td></tr>
  </table>
</div>
<div class="clearance-banner">✓ Quitus accordé — Financial Clearance Granted</div>
<p class="body-text">
  Ce document est délivré pour servir et valoir ce que de droit,
  notamment pour les procédures d'inscription, d'examen, et de délivrance
  de tout document académique officiel.
</p>
<p class="validity">
  Ce quitus est établi pour l'année académique <strong>{{academicYear.name}}</strong> uniquement.
</p>
<div class="footer">
  <div>Fait à ____________, le {{clearedAt}}</div>
  <div class="signature">
    <div class="line">Le Directeur / The Director<br><strong>{{institution.name}}</strong></div>
  </div>
</div>
</body>
</html>`;
