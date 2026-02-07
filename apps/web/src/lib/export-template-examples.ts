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
                <th rowspan="3">NOM</th>
                <th rowspan="3">PRÉNOM</th>
                <th rowspan="3">MATRICULE</th>
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
                <td class="student-name">{{lastName}}</td>
                <td class="student-name">{{firstName}}</td>
                <td>{{registrationNumber}}</td>

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
                <th>Nom</th>
                <th>Prénom</th>
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
                <td class="student-name">{{lastName}}</td>
                <td class="student-name">{{firstName}}</td>
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
                <th rowspan="2">NOM</th>
                <th rowspan="2">PRÉNOM</th>
                <th rowspan="2">MATRICULE</th>
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
                <td class="student-name">{{lastName}}</td>
                <td class="student-name">{{firstName}}</td>
                <td>{{registrationNumber}}</td>

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
} as const;

export type TemplateType = keyof typeof TEMPLATE_EXAMPLES;

export function getTemplateExample(type: TemplateType): string {
	return TEMPLATE_EXAMPLES[type];
}
