/**
 * Example templates for export template editor
 * These templates demonstrate the available variables and structure for each type
 */

export const TEMPLATE_EXAMPLES = {
	pv: `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Procès-Verbal</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 10mm;
        }
        body {
            font-family: Arial, sans-serif;
            font-size: 10px;
            padding: 15px;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
        }
        .header h1 { font-size: 16px; margin: 5px 0; }
        .header h2 { font-size: 14px; margin: 5px 0; color: #444; }
        .header h3 { font-size: 12px; margin: 5px 0; color: #666; }
        .info { margin: 15px 0; font-size: 11px; }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9px;
            margin: 15px 0;
        }
        th, td {
            border: 1px solid #ccc;
            padding: 4px 3px;
            text-align: center;
        }
        th {
            background: #f0f0f0;
            font-weight: bold;
        }
        .ue-header { background: #d0d0d0; font-weight: bold; }
        .student-name { text-align: left; font-weight: bold; }
        .acquis { color: green; font-weight: bold; }
        .non-acquis { color: red; font-weight: bold; }
        .moyenne { font-weight: bold; background: #f9f9f9; }
        .stats { margin-top: 20px; padding: 10px; background: #f5f5f5; }
        .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 40px;
        }
        .signature-box { text-align: center; width: 30%; }
        .legend { font-size: 8px; margin-top: 15px; }
        .legend td { text-align: left; padding: 2px 5px; }
    </style>
</head>
<body>
    <!-- EN-TÊTE INSTITUTION -->
    <div class="header">
        {{#if university_name_fr}}
        <h1>{{university_name_fr}}</h1>
        {{/if}}
        {{#if faculty_name_fr}}
        <h2>{{faculty_name_fr}}</h2>
        {{/if}}
        <h2>{{name_fr}}</h2>
        {{#if contact_email}}<div>Email: {{contact_email}}</div>{{/if}}
    </div>

    <!-- TITRE DU DOCUMENT -->
    <div class="info" style="text-align: center;">
        <h2>PROCÈS-VERBAL DES RÉSULTATS</h2>
        <div><strong>Programme:</strong> {{program.name}} - {{program.level}}</div>
        <div><strong>Semestre:</strong> {{semester}} | <strong>Année:</strong> {{academicYear}}</div>
    </div>

    <!-- TABLEAU PRINCIPAL -->
    <table>
        <thead>
            <!-- Ligne 1: En-têtes UE -->
            <tr>
                <th rowspan="3">N°</th>
                <th rowspan="3">MAT</th>
                <th rowspan="3">NOM ET PRÉNOM</th>
                {{#each ues}}
                <th colspan="{{add (multiply courses.length 3) 2}}" class="ue-header">
                    {{code}} - {{name}} ({{credits}} crédits)
                </th>
                {{/each}}
                <th rowspan="3">TOTAL<br>CRÉDITS</th>
                <th rowspan="3">MOYENNE<br>GÉNÉRALE</th>
                <th rowspan="3">DÉCISION</th>
            </tr>

            <!-- Ligne 2: En-têtes EC (cours) -->
            <tr>
                {{#each ues}}
                    {{#each courses}}
                    <th colspan="3">{{code}}<br>{{name}}</th>
                    {{/each}}
                    <th colspan="2">BILAN UE</th>
                {{/each}}
            </tr>

            <!-- Ligne 3: CC/EX/MOY -->
            <tr>
                {{#each ues}}
                    {{#each courses}}
                    <th>CC</th>
                    <th>EX</th>
                    <th>MOY</th>
                    {{/each}}
                    <th>MOY</th>
                    <th>DÉC</th>
                {{/each}}
            </tr>
        </thead>

        <tbody>
            {{#each students}}
            <tr>
                <td>{{number}}</td>
                <td>{{registrationNumber}}</td>
                <td class="student-name">{{lastName}} {{firstName}}</td>

                {{#each ueGrades}}
                    {{#each courseGrades}}
                    <td>{{formatNumber cc}}</td>
                    <td>{{formatNumber ex}}</td>
                    <td class="moyenne">{{formatNumber average}}</td>
                    {{/each}}

                    <!-- Bilan UE -->
                    <td class="moyenne">{{formatNumber average}}</td>
                    <td class="{{#if (eq decision 'Ac')}}acquis{{else}}non-acquis{{/if}}">
                        {{decision}}
                    </td>
                {{/each}}

                <!-- Totaux étudiant -->
                <td>{{totalCredits}}</td>
                <td class="moyenne">{{formatNumber generalAverage}}</td>
                <td class="{{#if (eq overallDecision 'ACQUIS')}}acquis{{else}}non-acquis{{/if}}">
                    {{overallDecision}}
                </td>
            </tr>
            {{/each}}
        </tbody>

        <tfoot>
            <tr>
                <td colspan="100" style="text-align: center; font-weight: bold; padding: 10px;">
                    TAUX DE RÉUSSITE GLOBAL: {{globalSuccessRate}}%
                </td>
            </tr>
        </tfoot>
    </table>

    <!-- LÉGENDE -->
    <table class="legend" style="width: auto;">
        <tr>
            <td><strong>CC:</strong> Contrôle Continu</td>
            <td><strong>EX:</strong> Examen</td>
            <td><strong>MOY:</strong> Moyenne</td>
            <td><strong>Ac:</strong> Acquis</td>
            <td><strong>Nac:</strong> Non Acquis</td>
        </tr>
    </table>

    <!-- SIGNATURES -->
    <div class="signatures">
        {{#each signatures}}
        <div class="signature-box">
            <div style="border-top: 1px solid #333; margin-top: 50px; padding-top: 5px;">
                {{position}}
                {{#if name}}<br><em>{{name}}</em>{{/if}}
            </div>
        </div>
        {{/each}}
    </div>
</body>
</html>`,

	evaluation: `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Publication des Notes</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 15mm;
        }
        body {
            font-family: Arial, sans-serif;
            font-size: 11px;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 25px;
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
        }
        .header h1 { font-size: 16px; margin: 5px 0; }
        .header h2 { font-size: 14px; margin: 5px 0; color: #444; }
        .info-box {
            background: #f5f5f5;
            padding: 15px;
            margin: 15px 0;
            border-radius: 5px;
        }
        .info-box div { margin: 5px 0; }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            border: 1px solid #ccc;
            padding: 8px;
            text-align: center;
        }
        th {
            background: #e0e0e0;
            font-weight: bold;
        }
        .student-name { text-align: left; }
        .passed { color: green; }
        .failed { color: red; }
        .stats-box {
            display: flex;
            justify-content: space-around;
            background: #f0f0f0;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .stat-item { text-align: center; }
        .stat-value { font-size: 18px; font-weight: bold; color: #333; }
        .stat-label { font-size: 10px; color: #666; }
        .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 50px;
        }
        .signature-box { text-align: center; width: 30%; }
    </style>
</head>
<body>
    <!-- EN-TÊTE -->
    <div class="header">
        {{#if university_name_fr}}<h1>{{university_name_fr}}</h1>{{/if}}
        {{#if faculty_name_fr}}<h2>{{faculty_name_fr}}</h2>{{/if}}
        <h2>{{name_fr}}</h2>
    </div>

    <!-- TITRE -->
    <div style="text-align: center; margin: 20px 0;">
        <h2>PUBLICATION DES NOTES - {{evaluationLabel}}</h2>
    </div>

    <!-- INFORMATIONS -->
    <div class="info-box">
        <div><strong>Cours (EC):</strong> {{course.code}} - {{course.name}}</div>
        <div><strong>Unité d'Enseignement (UE):</strong> {{teachingUnit.code}} - {{teachingUnit.name}}</div>
        <div><strong>Programme:</strong> {{program.name}} - {{program.level}}</div>
        <div><strong>Semestre:</strong> {{semester}} | <strong>Année:</strong> {{academicYear}}</div>
        {{#if examDate}}<div><strong>Date d'examen:</strong> {{examDate}}</div>{{/if}}
    </div>

    <!-- STATISTIQUES -->
    <div class="stats-box">
        <div class="stat-item">
            <div class="stat-value">{{stats.count}}</div>
            <div class="stat-label">Inscrits</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">{{stats.present}}</div>
            <div class="stat-label">Présents</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">{{stats.absent}}</div>
            <div class="stat-label">Absents</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">{{formatNumber stats.average}}</div>
            <div class="stat-label">Moyenne</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">{{stats.successRate}}%</div>
            <div class="stat-label">Taux de réussite</div>
        </div>
    </div>

    <!-- TABLEAU DES NOTES -->
    <table>
        <thead>
            <tr>
                <th>N°</th>
                <th>Matricule</th>
                <th>Nom et Prénom</th>
                <th>Note /{{scale}}</th>
                <th>Appréciation</th>
                <th>Observation</th>
            </tr>
        </thead>
        <tbody>
            {{#each students}}
            <tr>
                <td>{{number}}</td>
                <td>{{registrationNumber}}</td>
                <td class="student-name">{{lastName}} {{firstName}}</td>
                <td class="{{#if (gt score 9.99)}}passed{{else}}failed{{/if}}">
                    {{#if score}}{{formatNumber score}}{{else}}ABS{{/if}}
                </td>
                <td>{{appreciation}}</td>
                <td>{{observation}}</td>
            </tr>
            {{/each}}
        </tbody>
    </table>

    {{#if observations}}
    <div style="margin: 20px 0; padding: 10px; background: #fffbe6; border: 1px solid #ffe58f;">
        <strong>Observations:</strong> {{observations}}
    </div>
    {{/if}}

    <div style="text-align: right; margin: 20px 0; font-size: 10px; color: #666;">
        Date de publication: {{publicationDate}}
    </div>

    <!-- SIGNATURES -->
    <div class="signatures">
        {{#each signatures}}
        <div class="signature-box">
            <div style="border-top: 1px solid #333; margin-top: 40px; padding-top: 5px;">
                {{position}}
                {{#if name}}<br><em>{{name}}</em>{{/if}}
            </div>
        </div>
        {{/each}}
    </div>
</body>
</html>`,

	ue: `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Publication UE</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 10mm;
        }
        body {
            font-family: Arial, sans-serif;
            font-size: 10px;
            padding: 15px;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
        }
        .header h1 { font-size: 16px; margin: 5px 0; }
        .header h2 { font-size: 14px; margin: 5px 0; color: #444; }
        .info { margin: 15px 0; font-size: 11px; text-align: center; }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9px;
            margin: 15px 0;
        }
        th, td {
            border: 1px solid #ccc;
            padding: 5px 4px;
            text-align: center;
        }
        th {
            background: #f0f0f0;
            font-weight: bold;
        }
        .course-header { background: #e0e0e0; }
        .student-name { text-align: left; font-weight: bold; }
        .acquis { color: green; font-weight: bold; }
        .non-acquis { color: red; font-weight: bold; }
        .moyenne { font-weight: bold; background: #f9f9f9; }
        .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 40px;
        }
        .signature-box { text-align: center; width: 30%; }
    </style>
</head>
<body>
    <!-- EN-TÊTE -->
    <div class="header">
        {{#if university_name_fr}}<h1>{{university_name_fr}}</h1>{{/if}}
        {{#if faculty_name_fr}}<h2>{{faculty_name_fr}}</h2>{{/if}}
        <h2>{{name_fr}}</h2>
    </div>

    <!-- TITRE -->
    <div class="info">
        <h2>RÉCAPITULATIF - UNITÉ D'ENSEIGNEMENT</h2>
        <div style="font-size: 14px; font-weight: bold; margin: 10px 0;">
            {{teachingUnit.code}} - {{teachingUnit.name}} ({{teachingUnit.credits}} crédits)
        </div>
        <div><strong>Programme:</strong> {{program.name}} - {{program.level}}</div>
        <div><strong>Semestre:</strong> {{semester}} | <strong>Année:</strong> {{academicYear}}</div>
    </div>

    <!-- TABLEAU -->
    <table>
        <thead>
            <tr>
                <th rowspan="2">N°</th>
                <th rowspan="2">MAT</th>
                <th rowspan="2">NOM ET PRÉNOM</th>
                {{#each courses}}
                <th colspan="3" class="course-header">{{code}} - {{name}}</th>
                {{/each}}
                <th rowspan="2">MOY<br>UE</th>
                <th rowspan="2">DÉC</th>
                <th rowspan="2">CRÉDITS</th>
            </tr>
            <tr>
                {{#each courses}}
                <th>CC</th>
                <th>EX</th>
                <th>MOY</th>
                {{/each}}
            </tr>
        </thead>
        <tbody>
            {{#each students}}
            <tr>
                <td>{{number}}</td>
                <td>{{registrationNumber}}</td>
                <td class="student-name">{{lastName}} {{firstName}}</td>

                {{#each courseGrades}}
                <td>{{formatNumber cc}}</td>
                <td>{{formatNumber ex}}</td>
                <td class="moyenne">{{formatNumber average}}</td>
                {{/each}}

                <td class="moyenne">{{formatNumber ueAverage}}</td>
                <td class="{{#if (eq decision 'Ac')}}acquis{{else}}non-acquis{{/if}}">
                    {{decision}}
                </td>
                <td>{{credits}}</td>
            </tr>
            {{/each}}
        </tbody>
        <tfoot>
            <tr>
                <td colspan="100" style="text-align: center; font-weight: bold; padding: 10px;">
                    TAUX DE RÉUSSITE: {{globalSuccessRate}}%
                </td>
            </tr>
        </tfoot>
    </table>

    <!-- SIGNATURES -->
    <div class="signatures">
        {{#each signatures}}
        <div class="signature-box">
            <div style="border-top: 1px solid #333; margin-top: 50px; padding-top: 5px;">
                {{position}}
                {{#if name}}<br><em>{{name}}</em>{{/if}}
            </div>
        </div>
        {{/each}}
    </div>
</body>
</html>`,
	deliberation: `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Procès-Verbal de Délibération</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 8mm;
        }
        body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 10px;
            padding: 10px;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #666;
            padding-bottom: 12px;
            margin-bottom: 12px;
        }
        .header h1 { font-size: 15px; margin: 3px 0; }
        .header h2 { font-size: 13px; color: #4a4a4a; margin: 2px 0; }
        .title {
            text-align: center;
            font-weight: bold;
            font-size: 11px;
            margin-bottom: 12px;
            padding: 10px 0;
        }
        .jury-info {
            text-align: center;
            font-size: 9px;
            margin-bottom: 12px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 7.5px;
            margin-bottom: 12px;
        }
        th {
            background: white;
            padding: 4px 2px;
            text-align: center;
            border: 1px solid #bbb;
            font-weight: bold;
            font-size: 7px;
        }
        td {
            padding: 3px 1px;
            border: 1px solid #ddd;
            text-align: center;
            font-size: 7.5px;
        }
        .ue-header { border-bottom: 2px solid #999; }
        .student-name { text-align: left; font-weight: bold; padding-left: 3px; }
        .moyenne-finale { font-weight: bold; border-left: 2px solid #999; }
        .moyenne-ue { font-weight: bold; }
        .decision-ADM { color: #16a34a; font-weight: bold; }
        .decision-CMP { color: #2563eb; font-weight: bold; }
        .decision-AJ { color: #dc2626; font-weight: bold; }
        .decision-INC { color: #9ca3af; font-weight: bold; }
        .decision-admitted { color: #16a34a; font-weight: bold; }
        .decision-compensated { color: #2563eb; font-weight: bold; }
        .decision-deferred { color: #dc2626; font-weight: bold; }
        .decision-repeat { color: #ea580c; font-weight: bold; }
        .decision-excluded { color: #7c2d12; font-weight: bold; }
        .decision-pending { color: #9ca3af; font-weight: bold; }
        .taux-reussite-row td { text-align: center; font-size: 11px; padding: 8px; font-weight: bold; }
        .bottom-section { display: flex; justify-content: space-between; gap: 20px; margin-top: 12px; }
        .legend-info-wrapper { display: flex; gap: 15px; }
        .info-box { border: 1px solid #ccc; padding: 10px; font-size: 9px; min-width: 200px; }
        .info-box div { margin-bottom: 5px; }
        .legend-table { border: 1px solid #ccc; border-collapse: collapse; font-size: 7px; width: auto; }
        .legend-table td { border: 1px solid #ddd; padding: 3px 6px; text-align: left; }
        .legend-table td:nth-child(odd) { font-weight: bold; width: 40px; }
        .signatures { display: flex; justify-content: space-between; margin-top: 30px; }
        .signature-box { text-align: center; width: 30%; }
    </style>
</head>
<body>
    <!-- EN-TÊTE INSTITUTION -->
    <div class="header">
        {{#if university_name_fr}}<h1>{{university_name_fr}} / {{university_name_en}}</h1>{{/if}}
        {{#if faculty_name_fr}}<h2>{{faculty_name_fr}}</h2>{{/if}}
        <h2>{{name_fr}} / {{name_en}}</h2>
        <div style="font-size: 9px; color: #666; margin-top: 8px;">
            {{#if university_contact_email}}Email: {{university_contact_email}}{{/if}}
            {{#if contact_email}}{{#if university_contact_email}} | {{/if}}{{contact_email}}{{/if}}
        </div>
    </div>

    <!-- TITRE -->
    <div class="title">
        PROCÈS-VERBAL DE DÉLIBÉRATION<br>
        {{#if deliberation.semesterName}}{{deliberation.semesterName}} - {{/if}}ANNÉE ACADÉMIQUE {{deliberation.academicYearName}}<br>
        ({{deliberation.programName}} — {{deliberation.className}})
        {{#if deliberation.date}}<br><span style="font-weight:normal; font-size:9px;">Date: {{deliberation.date}}</span>{{/if}}
    </div>

    <!-- JURY -->
    {{#if jury.president}}
    <div class="jury-info">
        <strong>Président du jury:</strong> {{jury.president.name}} ({{jury.president.role}})
        {{#if jury.members.length}}
        &nbsp;|&nbsp; <strong>Membres:</strong>
        {{#each jury.members}}{{#if @index}}, {{/if}}{{name}}{{/each}}
        {{/if}}
    </div>
    {{/if}}

    <!-- TABLEAU PRINCIPAL -->
    <table>
        <thead>
            <tr>
                <th rowspan="2">RANG</th>
                <th rowspan="2">MAT</th>
                <th rowspan="2">NOM ET PRÉNOM</th>
                {{#each ues}}
                <th colspan="3" class="ue-header">{{code}} — {{name}} ({{credits}} cr.)</th>
                {{/each}}
                <th rowspan="2">MOY<br>GEN</th>
                <th rowspan="2">CRÉDITS</th>
                <th rowspan="2">DÉCISION</th>
                <th rowspan="2">MENTION</th>
            </tr>
            <tr>
                {{#each ues}}
                <th>MOY</th>
                <th>DEC</th>
                <th>CRE</th>
                {{/each}}
            </tr>
        </thead>
        <tbody>
            {{#each students}}
            <tr>
                <td>{{rank}}</td>
                <td>{{registrationNumber}}</td>
                <td class="student-name">{{lastName}} {{firstName}}</td>

                {{#each ueResults}}
                <td class="moyenne-ue">{{formatNumber ueAverage}}</td>
                <td class="decision-{{decision}}">{{decision}}</td>
                <td>{{creditsEarned}}</td>
                {{/each}}

                <td class="moyenne-finale">{{formatNumber generalAverage}}</td>
                <td>{{totalCreditsEarned}} / {{totalCreditsPossible}}</td>
                <td class="decision-{{finalDecision}}">{{finalDecisionLabel}}</td>
                <td>{{mentionLabel}}</td>
            </tr>
            {{/each}}

            <tr class="taux-reussite-row">
                <td colspan="1000" style="border-top: 2px solid #666;">
                    <strong>Taux de Réussite: {{stats.successRate}}% — Admis: {{stats.admittedCount}} | Compensés: {{stats.compensatedCount}} | Ajournés: {{stats.deferredCount}} | En attente: {{stats.pendingCount}}</strong>
                </td>
            </tr>
        </tbody>
    </table>

    <!-- LÉGENDE + INFO -->
    <div class="bottom-section">
        <div class="legend-info-wrapper">
            <table class="legend-table">
                <tr><td>ADM:</td><td>Acquise</td><td>CMP:</td><td>Compensée</td></tr>
                <tr><td>AJ:</td><td>Non acquise</td><td>INC:</td><td>Incomplète</td></tr>
                <tr><td>MOY:</td><td>Moyenne</td><td>CRE:</td><td>Crédits</td></tr>
                <tr><td>MAT:</td><td>Matricule</td><td>DEC:</td><td>Décision</td></tr>
            </table>
            <div class="info-box">
                <div><strong>Programme:</strong> {{deliberation.programName}}</div>
                <div><strong>Classe:</strong> {{deliberation.className}}</div>
                {{#if deliberation.semesterName}}<div><strong>Semestre:</strong> {{deliberation.semesterName}}</div>{{/if}}
                <div><strong>Année académique:</strong> {{deliberation.academicYearName}}</div>
                <div><strong>Moyenne générale:</strong> {{formatNumber stats.classAverage}}</div>
                <div><strong>Étudiants inscrits:</strong> {{stats.totalStudents}}</div>
            </div>
        </div>
    </div>

    <!-- SIGNATURES -->
    <div class="signatures">
        {{#each signatures}}
        <div class="signature-box">
            <div style="border-top: 1px solid #333; margin-top: 50px; padding-top: 5px;">
                {{position}}
                {{#if name}}<br><em>{{name}}</em>{{/if}}
            </div>
        </div>
        {{/each}}
    </div>
</body>
</html>`,
} as const;

export type TemplateType = keyof typeof TEMPLATE_EXAMPLES;

export function getTemplateExample(type: TemplateType): string {
	return TEMPLATE_EXAMPLES[type];
}
