export const PV_TEMPLATE = /* html */ `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Procès-Verbal</title>
    <style>
        @page {
            size: {{#if styleConfig.pageSize}}{{styleConfig.pageSize}}{{else}}A4{{/if}} {{#if styleConfig.pageOrientation}}{{styleConfig.pageOrientation}}{{else}}landscape{{/if}};
            margin: {{#if styleConfig.margins.top}}{{styleConfig.margins.top}}{{else}}8{{/if}}mm {{#if styleConfig.margins.right}}{{styleConfig.margins.right}}{{else}}8{{/if}}mm {{#if styleConfig.margins.bottom}}{{styleConfig.margins.bottom}}{{else}}8{{/if}}mm {{#if styleConfig.margins.left}}{{styleConfig.margins.left}}{{else}}8{{/if}}mm;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: {{#if styleConfig.fontFamily}}{{styleConfig.fontFamily}}{{else}}'Times New Roman', Times, serif{{/if}};
            font-size: {{#if styleConfig.fontSize}}{{styleConfig.fontSize}}{{else}}10{{/if}}px;
            background: #fafafa;
            padding: 10px;
            position: relative;
        }

        .container {
            width: 100%;
            margin: 0 auto;
            background: white;
            padding: 0;
            box-shadow: 0 0 15px rgba(0,0,0,0.08);
            position: relative;
        }

        {{#if styleConfig.watermark.enabled}}
        .container::before {
            content: '{{styleConfig.watermark.text}}{{#if styleConfig.watermark.institutionName}} — {{styleConfig.watermark.institutionName}}{{/if}}';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate({{#if styleConfig.watermark.rotation}}{{styleConfig.watermark.rotation}}{{else}}-45{{/if}}deg);
            font-size: {{#if styleConfig.watermark.fontSize}}{{styleConfig.watermark.fontSize}}{{else}}120{{/if}}px;
            font-weight: bold;
            opacity: {{#if styleConfig.watermark.opacity}}{{styleConfig.watermark.opacity}}{{else}}0.10{{/if}};
            color: rgba(200, 200, 200, 1);
            z-index: 0;
            pointer-events: none;
        }
        {{#if styleConfig.watermark.logoUrl}}
        .container::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 60%;
            height: 60%;
            transform: translate(-50%, -50%);
            background-image: url('{{styleConfig.watermark.logoUrl}}');
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            opacity: 0.06;
            z-index: 0;
            pointer-events: none;
        }
        {{/if}}
        {{/if}}

        .content-wrapper {
            position: relative;
            z-index: 1;
        }

        .header {
            text-align: center;
            border-bottom: 2px solid #666;
            padding-bottom: 12px;
            margin-bottom: 12px;
        }

        .header h1 {
            font-size: {{#if styleConfig.headerFontSize}}{{styleConfig.headerFontSize}}{{else}}15{{/if}}px;
            color: {{#if styleConfig.primaryColor}}{{styleConfig.primaryColor}}{{else}}#2c2c2c{{/if}};
            margin-bottom: 3px;
            font-weight: bold;
        }

        .header h2 {
            font-size: {{#if styleConfig.headerFontSize}}{{multiply styleConfig.headerFontSize 0.87}}{{else}}13{{/if}}px;
            color: {{#if styleConfig.secondaryColor}}{{styleConfig.secondaryColor}}{{else}}#4a4a4a{{/if}};
            margin-bottom: 2px;
            font-weight: normal;
        }

        .header h3 {
            font-size: {{#if styleConfig.fontSize}}{{styleConfig.fontSize}}{{else}}11{{/if}}px;
            color: #666;
            font-weight: normal;
            margin-bottom: 2px;
        }

        .logos {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 40px;
            margin: 12px 0;
        }

        .logo-box {
            width: 70px;
            height: 70px;
            border: 2px dashed #bbb;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-size: 9px;
            color: #999;
            text-align: center;
            padding: 5px;
        }

        .title {
            color: #2c2c2c;
            padding: 10px 0;
            text-align: center;
            margin-bottom: 12px;
            font-size: 11px;
            font-weight: bold;
        }

        table {
            border: {{#if styleConfig.tableBorderWidth}}{{styleConfig.tableBorderWidth}}{{else}}1{{/if}}px solid {{#if styleConfig.tableBorderColor}}{{styleConfig.tableBorderColor}}{{else}}#ccc{{/if}};
            width: 100%;
            border-collapse: collapse;
            font-size: {{#if styleConfig.fontSize}}{{multiply styleConfig.fontSize 0.75}}{{else}}7.5{{/if}}px;
            margin-bottom: 12px;
            table-layout: auto;
        }

        th {
            background: {{#if styleConfig.headerBackgroundColor}}{{styleConfig.headerBackgroundColor}}{{else}}white{{/if}};
            color: {{#if styleConfig.headerTextColor}}{{styleConfig.headerTextColor}}{{else}}#2c2c2c{{/if}};
            padding: 4px 2px;
            text-align: center;
            border: {{#if styleConfig.tableBorderWidth}}{{styleConfig.tableBorderWidth}}{{else}}1{{/if}}px solid {{#if styleConfig.tableBorderColor}}{{styleConfig.tableBorderColor}}{{else}}#bbb{{/if}};
            font-weight: bold;
            line-height: 1.2;
            font-size: {{#if styleConfig.fontSize}}{{multiply styleConfig.fontSize 0.7}}{{else}}7{{/if}}px;
        }

        .ue-header {
            border-bottom: 2px solid #999;
        }

        td {
            padding: 3px 1px;
            border: {{#if styleConfig.tableBorderWidth}}{{styleConfig.tableBorderWidth}}{{else}}1{{/if}}px solid {{#if styleConfig.tableBorderColor}}{{styleConfig.tableBorderColor}}{{else}}#ddd{{/if}};
            text-align: center;
            font-size: {{#if styleConfig.fontSize}}{{multiply styleConfig.fontSize 0.75}}{{else}}7.5{{/if}}px;
            color: #333;
            background: white;
        }

        tbody tr:nth-child(even) td {
            background: {{#if styleConfig.alternateRowColor}}{{styleConfig.alternateRowColor}}{{else}}white{{/if}};
        }

        .student-name { text-transform: uppercase; /* student-name uppercase */
            text-align: left;
            font-weight: bold;
            padding-left: 3px;
            font-size: 7.5px;
            color: #2c2c2c;
            width: 8%;
        }

        .student-firstname {
            text-align: left;
            font-weight: bold;
            padding-left: 3px;
            font-size: 7.5px;
            color: #2c2c2c;
            width: 8%;
        }

        .acquis {
            color: #2c2c2c;
            font-weight: bold;
        }

        .non-acquis {
            color: #666;
            font-weight: bold;
        }

        .moyenne-finale {
            font-weight: bold;
            border-left: 2px solid #999;
        }

        .moyenne-ue {
            font-weight: bold;
        }

        .taux-reussite-row {
            background: white;
            font-weight: bold;
        }

        .taux-reussite-row td {
            text-align: center;
            font-size: 11px;
            padding: 8px;
        }

        .bottom-section {
            display: flex;
            justify-content: space-between;
            gap: 20px;
            margin-top: 12px;
        }

        .legend-info-wrapper {
            display: flex;
            gap: 15px;
        }

        .info-box {
            border: 1px solid #ccc;
            padding: 10px;
            font-size: 9px;
            min-width: 200px;
        }

        .info-box div {
            margin-bottom: 5px;
        }

        .info-box strong {
            color: #2c2c2c;
        }

        .legend-table {
            border: 1px solid #ccc;
            border-collapse: collapse;
            font-size: 7px;
            width: auto;
        }

        .legend-table td {
            border: 1px solid #ddd;
            padding: 3px 6px;
            text-align: left;
        }

        .legend-table td:nth-child(odd) {
            font-weight: bold;
            color: #2c2c2c;
            width: 40px;
        }

        .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 30px;
        }

        .signature-box {
            text-align: center;
            width: 30%;
        }

        .signature-line {
            font-size: 10px;
            color: #2c2c2c;
            font-weight: normal;
        }

        @media print {
            body {
                background: white;
                padding: 0;
            }

            .container {
                box-shadow: none;
                padding: 0;
                width: 100%;
            }

            .container::before {
                color: rgba(200, 200, 200, 0.15);
            }

            table {
                border: 1px solid #ccc;
                font-size: 7.5px;
            }

            th {
                font-size: 7px;
            }

            td {
                font-size: 7.5px;
                color: #333;
            }

            .logo-box {
                border-style: solid;
            }
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
        <div class="content-wrapper">
            <div class="header">
                {{!-- Tutelle header: Pays / Devise / Ministère / Université / Faculté / Institut.
                     Center-affiliated programs use pv-template-center.html (picked by template-loader). --}}
                <div style="display:flex;justify-content:space-between;align-items: center;gap:12px;margin-bottom:8px;font-size:9px;line-height:1.4;text-align:center;">
                    <div style="flex:1">
                        {{country.fr}}<br>
                        <em>{{country.mottoFr}}</em><br>
                        ********************<br>
                        {{ministry.fr}}<br>
                        {{#if university.fr}}********************<br><strong>{{upper university.fr}}</strong><br>{{/if}}
                        {{#if faculty.fr}}********************<br><strong>{{upper faculty.fr}}</strong>{{#if faculty.postalBox}}<br>B.P. {{faculty.postalBox}}{{/if}}{{#if faculty.contactEmail}}<br>Email : {{faculty.contactEmail}}{{/if}}<br>{{/if}}
                        ********************<br>
                        <strong>{{upper institutionHeader.nameFr}}</strong>
                        {{#if institutionHeader.postalBox}}<br>********************<br>B.P. {{institutionHeader.postalBox}}{{/if}}
                        {{#if institutionHeader.contactEmail}}<br>Email : <a href="mailto:{{institutionHeader.contactEmail}}">{{institutionHeader.contactEmail}}</a>{{/if}}
                    </div>
                    <div style="display:flex;align-items:center;gap:10px;">
                        {{{logo svg=logos.universitySvg url=logos.university alt="University" style="max-height:60px;max-width:80px;object-fit:contain;"}}}
                        {{{logo svg=logos.facultySvg url=logos.faculty alt="Faculty" style="max-height:60px;max-width:80px;object-fit:contain;"}}}
                        {{{logo svg=logos.institutionSvg url=logos.institution alt="Institution" style="max-height:60px;max-width:80px;object-fit:contain;"}}}
                    </div>
                    <div style="flex:1">
                        {{country.en}}<br>
                        <em>{{country.mottoEn}}</em><br>
                        ********************<br>
                        {{ministry.en}}<br>
                        {{#if university.en}}********************<br><strong>{{upper university.en}}</strong><br>{{/if}}
                        {{#if faculty.en}}********************<br><strong>{{upper faculty.en}}</strong>{{#if faculty.postalBox}}<br>P.O. Box {{faculty.postalBox}}{{/if}}{{#if faculty.contactEmail}}<br>Email: {{faculty.contactEmail}}{{/if}}<br>{{/if}}
                        ********************<br>
                        <strong>{{upper institutionHeader.nameEn}}</strong>
                        {{#if institutionHeader.postalBox}}<br>********************<br>P.O. Box {{institutionHeader.postalBox}}{{/if}}
                        {{#if institutionHeader.contactEmail}}<br>Email: <a href="mailto:{{institutionHeader.contactEmail}}">{{institutionHeader.contactEmail}}</a>{{/if}}
                    </div>
                </div>
            </div>

            <div class="title">
                {{#if headerConfig.titleFr}}{{headerConfig.titleFr}}{{else}}PROCÈS-VERBAL DES RÉSULTATS{{/if}}
                {{#if headerConfig.titleEn}} / {{headerConfig.titleEn}}{{else}} / GRADE RESULTS MINUTES{{/if}}<br>
                {{#if headerConfig.showSemester}}{{semester}} — {{/if}}{{#if headerConfig.showAcademicYear}}ANNÉE ACADÉMIQUE / ACADEMIC YEAR {{academicYear}}{{/if}}<br>
                {{#if headerConfig.showClassName}}({{program.name}} {{program.level}}){{/if}}
            </div>

            <table>
                <thead>
                    <tr>
                        <th rowspan="3">N°</th>
                        <th rowspan="3">MAT<br><span style="font-weight:normal">ID</span></th>
                        <th rowspan="3">NOM ET PRÉNOM<br><span style="font-weight:normal">FULL NAME</span></th>

                        {{#each ues}}
                        <th colspan="{{add (multiply courses.length 3) 3}}" class="ue-header">UE {{code}} : {{name}}</th>
                        {{/each}}

                        <th rowspan="3">TOTAL CRE<br><span style="font-weight:normal">CREDITS</span></th>
                        <th rowspan="3">MOY GEN<br><span style="font-weight:normal">GPA</span></th>
                        <th rowspan="3">BILAN<br><span style="font-weight:normal">RESULT</span></th>
                    </tr>
                    <tr>
                        {{#each ues}}
                            {{#each courses}}
                            <th colspan="3" class="ec-header">EC {{code}}<br>{{name}}</th>
                            {{/each}}
                            <th colspan="3" class="ec-header">BILAN UE / UE RESULT</th>
                        {{/each}}
                    </tr>
                    <tr>
                        {{#each ues}}
                            {{#each courses}}
                            <th>CC<br><span style="font-weight:normal">CW</span></th>
                            <th>EX<br><span style="font-weight:normal">EX</span></th>
                            <th>MOY<br><span style="font-weight:normal">AVG</span></th>
                            {{/each}}
                            <th>MOY<br>AVG</th>
                            <th>DEC<br>RES</th>
                            <th>CRE<br>CR</th>
                        {{/each}}
                    </tr>
                </thead>
                <tbody>
                    {{#each students}}
                    <tr>
                        <td>{{number}}</td>
                        <td>{{registrationNumber}}</td>
                        <td class="student-name">{{upper firstName}} {{upper lastName}}</td>

                        {{#each ueGrades}}
                            {{#each courseGrades}}
                            <td>{{formatNumber cc}}</td>
                            <td>{{formatNumber ex}}</td>
                            <td>{{formatNumber average}}</td>
                            {{/each}}

                            <!-- Bilan UE -->
                            <td class="moyenne-ue">{{formatNumber average}}</td>
                            <td class="{{#if (eq decision 'Ac')}}acquis{{else}}non-acquis{{/if}}">{{decision}}</td>
                            <td>{{credits}}</td>
                        {{/each}}

                        <td>{{totalCredits}}</td>
                        <td class="moyenne-finale">{{formatNumber generalAverage}}</td>
                        <td class="{{#if (eq overallDecision 'VALIDÉ')}}acquis{{else}}non-acquis{{/if}}">
                            {{overallDecision}}
                        </td>
                    </tr>
                    {{/each}}

                    <tr class="taux-reussite-row">
                        <td colspan="1000" style="border-top: 2px solid #666;">
                            <strong>Taux de Réussite / Success Rate (TR / SR): {{formatNumber globalSuccessRate 2}}%</strong>
                        </td>
                    </tr>
                </tbody>
            </table>

            <div class="bottom-section">
                <div class="legend-info-wrapper">
                    <table class="legend-table">
                        <tr>
                            <td>CC / CW:</td>
                            <td>Contrôle Continu / Coursework</td>
                            <td>CRE / CR:</td>
                            <td>Crédits / Credits</td>
                            <td>Ac:</td>
                            <td>Acquis / Acquired</td>
                        </tr>
                        <tr>
                            <td>EX:</td>
                            <td>Examen / Exam</td>
                            <td>EC:</td>
                            <td>Élément Constitutif / Course unit</td>
                            <td>Nac:</td>
                            <td>Non Acquis / Not Acquired</td>
                        </tr>
                        <tr>
                            <td>MOY / AVG:</td>
                            <td>Moyenne / Average</td>
                            <td>UE:</td>
                            <td>Unité d'Enseignement / Teaching Unit</td>
                            <td>TR / SR:</td>
                            <td>Taux de Réussite / Success Rate</td>
                        </tr>
                        <tr>
                            <td>DEC / RES:</td>
                            <td>Décision / Decision</td>
                            <td>MAT / ID:</td>
                            <td>Matricule / Student ID</td>
                            <td></td>
                            <td></td>
                        </tr>
                    </table>

                    <div class="info-box">
                        <div><strong>Programme / Program:</strong> {{program.name}}</div>
                        <div><strong>Semestre / Semester:</strong> {{semester}}</div>
                        <div><strong>Année académique / Academic Year:</strong> {{academicYear}}</div>
                    </div>
                </div>
            </div>

            <div class="signatures">
                {{#each signatures}}
                <div class="signature-box">
                    <div class="signature-line">{{position}}</div>
                    {{#if name}}
                    <div class="signature-name">{{name}}</div>
                    {{/if}}
                </div>
                {{/each}}
            </div>
        </div>
    </div>
</body>
</html>

`;

export const PV_TEMPLATE_CENTER = /* html */ `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Procès-Verbal</title>
    <style>
        @page {
            size: {{#if styleConfig.pageSize}}{{styleConfig.pageSize}}{{else}}A4{{/if}} {{#if styleConfig.pageOrientation}}{{styleConfig.pageOrientation}}{{else}}landscape{{/if}};
            margin: {{#if styleConfig.margins.top}}{{styleConfig.margins.top}}{{else}}8{{/if}}mm {{#if styleConfig.margins.right}}{{styleConfig.margins.right}}{{else}}8{{/if}}mm {{#if styleConfig.margins.bottom}}{{styleConfig.margins.bottom}}{{else}}8{{/if}}mm {{#if styleConfig.margins.left}}{{styleConfig.margins.left}}{{else}}8{{/if}}mm;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: {{#if styleConfig.fontFamily}}{{styleConfig.fontFamily}}{{else}}'Times New Roman', Times, serif{{/if}};
            font-size: {{#if styleConfig.fontSize}}{{styleConfig.fontSize}}{{else}}10{{/if}}px;
            background: #fafafa;
            padding: 10px;
            position: relative;
        }

        .container {
            width: 100%;
            margin: 0 auto;
            background: white;
            padding: 0;
            box-shadow: 0 0 15px rgba(0,0,0,0.08);
            position: relative;
        }

        {{#if styleConfig.watermark.enabled}}
        .container::before {
            content: '{{styleConfig.watermark.text}}{{#if styleConfig.watermark.institutionName}} — {{styleConfig.watermark.institutionName}}{{/if}}';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate({{#if styleConfig.watermark.rotation}}{{styleConfig.watermark.rotation}}{{else}}-45{{/if}}deg);
            font-size: {{#if styleConfig.watermark.fontSize}}{{styleConfig.watermark.fontSize}}{{else}}120{{/if}}px;
            font-weight: bold;
            opacity: {{#if styleConfig.watermark.opacity}}{{styleConfig.watermark.opacity}}{{else}}0.10{{/if}};
            color: rgba(200, 200, 200, 1);
            z-index: 0;
            pointer-events: none;
        }
        {{#if styleConfig.watermark.logoUrl}}
        .container::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 60%;
            height: 60%;
            transform: translate(-50%, -50%);
            background-image: url('{{styleConfig.watermark.logoUrl}}');
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            opacity: 0.06;
            z-index: 0;
            pointer-events: none;
        }
        {{/if}}
        {{/if}}

        .content-wrapper {
            position: relative;
            z-index: 1;
        }

        .header {
            text-align: center;
            border-bottom: 2px solid #666;
            padding-bottom: 12px;
            margin-bottom: 12px;
        }

        .header h1 {
            font-size: {{#if styleConfig.headerFontSize}}{{styleConfig.headerFontSize}}{{else}}15{{/if}}px;
            color: {{#if styleConfig.primaryColor}}{{styleConfig.primaryColor}}{{else}}#2c2c2c{{/if}};
            margin-bottom: 3px;
            font-weight: bold;
        }

        .header h2 {
            font-size: {{#if styleConfig.headerFontSize}}{{multiply styleConfig.headerFontSize 0.87}}{{else}}13{{/if}}px;
            color: {{#if styleConfig.secondaryColor}}{{styleConfig.secondaryColor}}{{else}}#4a4a4a{{/if}};
            margin-bottom: 2px;
            font-weight: normal;
        }

        .header h3 {
            font-size: {{#if styleConfig.fontSize}}{{styleConfig.fontSize}}{{else}}11{{/if}}px;
            color: #666;
            font-weight: normal;
            margin-bottom: 2px;
        }

        .logos {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 40px;
            margin: 12px 0;
        }

        .logo-box {
            width: 70px;
            height: 70px;
            border: 2px dashed #bbb;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-size: 9px;
            color: #999;
            text-align: center;
            padding: 5px;
        }

        .title {
            color: #2c2c2c;
            padding: 10px 0;
            text-align: center;
            margin-bottom: 12px;
            font-size: 11px;
            font-weight: bold;
        }

        table {
            border: {{#if styleConfig.tableBorderWidth}}{{styleConfig.tableBorderWidth}}{{else}}1{{/if}}px solid {{#if styleConfig.tableBorderColor}}{{styleConfig.tableBorderColor}}{{else}}#ccc{{/if}};
            width: 100%;
            border-collapse: collapse;
            font-size: {{#if styleConfig.fontSize}}{{multiply styleConfig.fontSize 0.75}}{{else}}7.5{{/if}}px;
            margin-bottom: 12px;
            table-layout: auto;
        }

        th {
            background: {{#if styleConfig.headerBackgroundColor}}{{styleConfig.headerBackgroundColor}}{{else}}white{{/if}};
            color: {{#if styleConfig.headerTextColor}}{{styleConfig.headerTextColor}}{{else}}#2c2c2c{{/if}};
            padding: 4px 2px;
            text-align: center;
            border: {{#if styleConfig.tableBorderWidth}}{{styleConfig.tableBorderWidth}}{{else}}1{{/if}}px solid {{#if styleConfig.tableBorderColor}}{{styleConfig.tableBorderColor}}{{else}}#bbb{{/if}};
            font-weight: bold;
            line-height: 1.2;
            font-size: {{#if styleConfig.fontSize}}{{multiply styleConfig.fontSize 0.7}}{{else}}7{{/if}}px;
        }

        .ue-header {
            border-bottom: 2px solid #999;
        }

        td {
            padding: 3px 1px;
            border: {{#if styleConfig.tableBorderWidth}}{{styleConfig.tableBorderWidth}}{{else}}1{{/if}}px solid {{#if styleConfig.tableBorderColor}}{{styleConfig.tableBorderColor}}{{else}}#ddd{{/if}};
            text-align: center;
            font-size: {{#if styleConfig.fontSize}}{{multiply styleConfig.fontSize 0.75}}{{else}}7.5{{/if}}px;
            color: #333;
            background: white;
        }

        tbody tr:nth-child(even) td {
            background: {{#if styleConfig.alternateRowColor}}{{styleConfig.alternateRowColor}}{{else}}white{{/if}};
        }

        .student-name { text-transform: uppercase; /* student-name uppercase */
            text-align: left;
            font-weight: bold;
            padding-left: 3px;
            font-size: 7.5px;
            color: #2c2c2c;
            width: 8%;
        }

        .student-firstname {
            text-align: left;
            font-weight: bold;
            padding-left: 3px;
            font-size: 7.5px;
            color: #2c2c2c;
            width: 8%;
        }

        .acquis {
            color: #2c2c2c;
            font-weight: bold;
        }

        .non-acquis {
            color: #666;
            font-weight: bold;
        }

        .moyenne-finale {
            font-weight: bold;
            border-left: 2px solid #999;
        }

        .moyenne-ue {
            font-weight: bold;
        }

        .taux-reussite-row {
            background: white;
            font-weight: bold;
        }

        .taux-reussite-row td {
            text-align: center;
            font-size: 11px;
            padding: 8px;
        }

        .bottom-section {
            display: flex;
            justify-content: space-between;
            gap: 20px;
            margin-top: 12px;
        }

        .legend-info-wrapper {
            display: flex;
            gap: 15px;
        }

        .info-box {
            border: 1px solid #ccc;
            padding: 10px;
            font-size: 9px;
            min-width: 200px;
        }

        .info-box div {
            margin-bottom: 5px;
        }

        .info-box strong {
            color: #2c2c2c;
        }

        .legend-table {
            border: 1px solid #ccc;
            border-collapse: collapse;
            font-size: 7px;
            width: auto;
        }

        .legend-table td {
            border: 1px solid #ddd;
            padding: 3px 6px;
            text-align: left;
        }

        .legend-table td:nth-child(odd) {
            font-weight: bold;
            color: #2c2c2c;
            width: 40px;
        }

        .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 30px;
        }

        .signature-box {
            text-align: center;
            width: 30%;
        }

        .signature-line {
            font-size: 10px;
            color: #2c2c2c;
            font-weight: normal;
        }

        @media print {
            body {
                background: white;
                padding: 0;
            }

            .container {
                box-shadow: none;
                padding: 0;
                width: 100%;
            }

            .container::before {
                color: rgba(200, 200, 200, 0.15);
            }

            table {
                border: 1px solid #ccc;
                font-size: 7.5px;
            }

            th {
                font-size: 7px;
            }

            td {
                font-size: 7.5px;
                color: #333;
            }

            .logo-box {
                border-style: solid;
            }
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
        <div class="content-wrapper">
            <div class="header">
                {{!-- Center-only header — same 3-col layout as the standard variant.
                     Sources strictly from the centers tables (centers, center_administrative_instances, center_legal_texts).
                     No tutelle / faculty / university. --}}
                <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:8px;font-size:9px;line-height:1.4;text-align:center;">
                    <div style="flex:1">
                        {{country.fr}}<br>
                        <em>{{country.mottoFr}}</em><br>
                        ********************<br>
                        {{#each center.administrativeInstances}}
                        <strong>{{upper this.nameFr}}{{#if this.acronymFr}} ({{this.acronymFr}}){{/if}}</strong><br>
                        ********************<br>
                        {{/each}}
                        <strong>{{upper center.name}}</strong>
                        {{#if center.postalBox}}<br>********************<br>B.P. {{center.postalBox}}{{/if}}
                        {{#if center.contactEmail}}<br>Email : <a href="mailto:{{center.contactEmail}}">{{center.contactEmail}}</a>{{/if}}
                    </div>
                    <div style="display:flex;flex-direction:row;flex-wrap:wrap;align-items:center;justify-content:center;gap:10px;">
                        {{{logo svg=center.logoSvg url=center.logoUrl alt=center.name style="max-height:80px;max-width:120px;object-fit:contain;"}}}
                        {{#each center.administrativeInstances}}
                            {{#if (or this.logoSvg this.logoUrl)}}
                            {{{logo svg=this.logoSvg url=this.logoUrl alt=this.nameFr style="max-height:50px;max-width:80px;object-fit:contain;"}}}
                            {{/if}}
                        {{/each}}
                    </div>
                    <div style="flex:1">
                        {{country.en}}<br>
                        <em>{{country.mottoEn}}</em><br>
                        ********************<br>
                        {{#each center.administrativeInstances}}
                        <strong>{{upper this.nameEn}}{{#if this.acronymEn}} ({{this.acronymEn}}){{/if}}</strong><br>
                        ********************<br>
                        {{/each}}
                        {{#if center.nameEn}}<strong>{{upper center.nameEn}}</strong>{{else}}<strong>{{upper center.name}}</strong>{{/if}}
                        {{#if center.postalBox}}<br>********************<br>P.O. Box {{center.postalBox}}{{/if}}
                        {{#if center.contactEmail}}<br>Email: <a href="mailto:{{center.contactEmail}}">{{center.contactEmail}}</a>{{/if}}
                    </div>
                </div>
                {{#if center.authorizationOrderFr}}
                <div style="font-size:9px;color:#444;font-style:italic;padding:4px 6px;margin:4px auto 0;text-align:center;border-top:1px dotted #999;display:inline-block;">
                    {{center.authorizationOrderFr}}{{#if center.authorizationOrderEn}} / {{center.authorizationOrderEn}}{{/if}}
                </div>
                {{/if}}
                {{#if center.legalTexts.length}}
                <div style="font-size:8px;color:#555;margin:6px 0;padding-top:4px;border-top:1px dotted #aaa;text-align:center;line-height:1.4;">
                    {{#each center.legalTexts}}
                    <div>{{textFr}} / <span style="font-style:italic">{{textEn}}</span></div>
                    {{/each}}
                </div>
                {{/if}}
            </div>

            <div class="title">
                {{#if headerConfig.titleFr}}{{headerConfig.titleFr}}{{else}}PROCÈS-VERBAL DES RÉSULTATS{{/if}}
                {{#if headerConfig.titleEn}} / {{headerConfig.titleEn}}{{else}} / GRADE RESULTS MINUTES{{/if}}<br>
                {{#if headerConfig.showSemester}}{{semester}} — {{/if}}{{#if headerConfig.showAcademicYear}}ANNÉE ACADÉMIQUE / ACADEMIC YEAR {{academicYear}}{{/if}}<br>
                {{#if headerConfig.showClassName}}({{program.name}} {{program.level}}){{/if}}
            </div>

            <table>
                <thead>
                    <tr>
                        <th rowspan="3">N°</th>
                        <th rowspan="3">MAT<br><span style="font-weight:normal">ID</span></th>
                        <th rowspan="3">NOM ET PRÉNOM<br><span style="font-weight:normal">FULL NAME</span></th>

                        {{#each ues}}
                        <th colspan="{{add (multiply courses.length 3) 3}}" class="ue-header">UE {{code}} : {{name}}</th>
                        {{/each}}

                        <th rowspan="3">TOTAL CRE<br><span style="font-weight:normal">CREDITS</span></th>
                        <th rowspan="3">MOY GEN<br><span style="font-weight:normal">GPA</span></th>
                        <th rowspan="3">BILAN<br><span style="font-weight:normal">RESULT</span></th>
                    </tr>
                    <tr>
                        {{#each ues}}
                            {{#each courses}}
                            <th colspan="3" class="ec-header">EC {{code}}<br>{{name}}</th>
                            {{/each}}
                            <th colspan="3" class="ec-header">BILAN UE / UE RESULT</th>
                        {{/each}}
                    </tr>
                    <tr>
                        {{#each ues}}
                            {{#each courses}}
                            <th>CC<br><span style="font-weight:normal">CW</span></th>
                            <th>EX<br><span style="font-weight:normal">EX</span></th>
                            <th>MOY<br><span style="font-weight:normal">AVG</span></th>
                            {{/each}}
                            <th>MOY<br>AVG</th>
                            <th>DEC<br>RES</th>
                            <th>CRE<br>CR</th>
                        {{/each}}
                    </tr>
                </thead>
                <tbody>
                    {{#each students}}
                    <tr>
                        <td>{{number}}</td>
                        <td>{{registrationNumber}}</td>
                        <td class="student-name">{{upper firstName}} {{upper lastName}}</td>

                        {{#each ueGrades}}
                            {{#each courseGrades}}
                            <td>{{formatNumber cc}}</td>
                            <td>{{formatNumber ex}}</td>
                            <td>{{formatNumber average}}</td>
                            {{/each}}

                            <!-- Bilan UE -->
                            <td class="moyenne-ue">{{formatNumber average}}</td>
                            <td class="{{#if (eq decision 'Ac')}}acquis{{else}}non-acquis{{/if}}">{{decision}}</td>
                            <td>{{credits}}</td>
                        {{/each}}

                        <td>{{totalCredits}}</td>
                        <td class="moyenne-finale">{{formatNumber generalAverage}}</td>
                        <td class="{{#if (eq overallDecision 'VALIDÉ')}}acquis{{else}}non-acquis{{/if}}">
                            {{overallDecision}}
                        </td>
                    </tr>
                    {{/each}}

                    <tr class="taux-reussite-row">
                        <td colspan="1000" style="border-top: 2px solid #666;">
                            <strong>Taux de Réussite / Success Rate (TR / SR): {{formatNumber globalSuccessRate 2}}%</strong>
                        </td>
                    </tr>
                </tbody>
            </table>

            <div class="bottom-section">
                <div class="legend-info-wrapper">
                    <table class="legend-table">
                        <tr>
                            <td>CC / CW:</td>
                            <td>Contrôle Continu / Coursework</td>
                            <td>CRE / CR:</td>
                            <td>Crédits / Credits</td>
                            <td>Ac:</td>
                            <td>Acquis / Acquired</td>
                        </tr>
                        <tr>
                            <td>EX:</td>
                            <td>Examen / Exam</td>
                            <td>EC:</td>
                            <td>Élément Constitutif / Course unit</td>
                            <td>Nac:</td>
                            <td>Non Acquis / Not Acquired</td>
                        </tr>
                        <tr>
                            <td>MOY / AVG:</td>
                            <td>Moyenne / Average</td>
                            <td>UE:</td>
                            <td>Unité d'Enseignement / Teaching Unit</td>
                            <td>TR / SR:</td>
                            <td>Taux de Réussite / Success Rate</td>
                        </tr>
                        <tr>
                            <td>DEC / RES:</td>
                            <td>Décision / Decision</td>
                            <td>MAT / ID:</td>
                            <td>Matricule / Student ID</td>
                            <td></td>
                            <td></td>
                        </tr>
                    </table>

                    <div class="info-box">
                        <div><strong>Programme / Program:</strong> {{program.name}}</div>
                        <div><strong>Semestre / Semester:</strong> {{semester}}</div>
                        <div><strong>Année académique / Academic Year:</strong> {{academicYear}}</div>
                    </div>
                </div>
            </div>

            <div class="signatures">
                {{#each signatures}}
                <div class="signature-box">
                    <div class="signature-line">{{position}}</div>
                    {{#if name}}
                    <div class="signature-name">{{name}}</div>
                    {{/if}}
                </div>
                {{/each}}
            </div>
        </div>
    </div>
</body>
</html>

`;

export const EVALUATION_TEMPLATE = /* html */ `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Publication Évaluation</title>
    <style>
        @page {
            size: {{#if styleConfig.pageSize}}{{styleConfig.pageSize}}{{else}}A4{{/if}} {{#if styleConfig.pageOrientation}}{{styleConfig.pageOrientation}}{{else}}portrait{{/if}};
            margin: {{#if styleConfig.margins.top}}{{styleConfig.margins.top}}{{else}}10{{/if}}mm {{#if styleConfig.margins.right}}{{styleConfig.margins.right}}{{else}}10{{/if}}mm {{#if styleConfig.margins.bottom}}{{styleConfig.margins.bottom}}{{else}}10{{/if}}mm {{#if styleConfig.margins.left}}{{styleConfig.margins.left}}{{else}}10{{/if}}mm;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: {{#if styleConfig.fontFamily}}{{styleConfig.fontFamily}}{{else}}'Times New Roman', Times, serif{{/if}};
            font-size: {{#if styleConfig.fontSize}}{{styleConfig.fontSize}}{{else}}10{{/if}}px;
            background: #fafafa;
            padding: 10px;
            position: relative;
        }

        .container {
            width: 210mm;
            margin: 0 auto;
            background: white;
            padding: 10mm;
            box-shadow: 0 0 15px rgba(0,0,0,0.08);
            position: relative;
        }

        {{#if styleConfig.watermark.enabled}}
        .container::before {
            content: '{{styleConfig.watermark.text}}{{#if styleConfig.watermark.institutionName}} — {{styleConfig.watermark.institutionName}}{{/if}}';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate({{#if styleConfig.watermark.rotation}}{{styleConfig.watermark.rotation}}{{else}}-45{{/if}}deg);
            font-size: {{#if styleConfig.watermark.fontSize}}{{styleConfig.watermark.fontSize}}{{else}}100{{/if}}px;
            font-weight: bold;
            opacity: {{#if styleConfig.watermark.opacity}}{{styleConfig.watermark.opacity}}{{else}}0.10{{/if}};
            color: rgba(200, 200, 200, 1);
            z-index: 0;
            pointer-events: none;
        }
        {{#if styleConfig.watermark.logoUrl}}
        .container::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 60%;
            height: 60%;
            transform: translate(-50%, -50%);
            background-image: url('{{styleConfig.watermark.logoUrl}}');
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            opacity: 0.06;
            z-index: 0;
            pointer-events: none;
        }
        {{/if}}
        {{/if}}

        .content-wrapper {
            position: relative;
            z-index: 1;
        }

        .header {
            text-align: center;
            border-bottom: 2px solid #666;
            padding-bottom: 12px;
            margin-bottom: 15px;
        }

        .header h1 {
            font-size: {{#if styleConfig.headerFontSize}}{{styleConfig.headerFontSize}}{{else}}14{{/if}}px;
            color: {{#if styleConfig.primaryColor}}{{styleConfig.primaryColor}}{{else}}#2c2c2c{{/if}};
            margin-bottom: 3px;
            font-weight: bold;
        }

        .header h2 {
            font-size: {{#if styleConfig.headerFontSize}}{{multiply styleConfig.headerFontSize 0.86}}{{else}}12{{/if}}px;
            color: {{#if styleConfig.secondaryColor}}{{styleConfig.secondaryColor}}{{else}}#4a4a4a{{/if}};
            margin-bottom: 2px;
            font-weight: normal;
        }

        .header h3 {
            font-size: {{#if styleConfig.fontSize}}{{styleConfig.fontSize}}{{else}}10{{/if}}px;
            color: #666;
            font-weight: normal;
            margin-bottom: 2px;
        }

        .logos {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 20px;
            margin: 6px 0;
        }

        .logo-box {
            width: 70px;
            height: 70px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-size: 9px;
            text-align: center;
            padding: 5px;
        }


        .title {
            color: #2c2c2c;
            padding: 10px 0;
            text-align: center;
            margin-bottom: 15px;
            font-size: 12px;
            font-weight: bold;
        }

        .eval-info {
            background: white;
            border: 1px solid #ccc;
            padding: 12px;
            margin-bottom: 15px;
            font-size: 10px;
        }

        .eval-info div {
            margin-bottom: 5px;
        }

        .eval-info strong {
            color: #2c2c2c;
            display: inline-block;
            width: 150px;
        }

        table {
            border: {{#if styleConfig.tableBorderWidth}}{{styleConfig.tableBorderWidth}}{{else}}1{{/if}}px solid {{#if styleConfig.tableBorderColor}}{{styleConfig.tableBorderColor}}{{else}}#ccc{{/if}};
            width: 100%;
            border-collapse: collapse;
            font-size: {{#if styleConfig.fontSize}}{{styleConfig.fontSize}}{{else}}10{{/if}}px;
            margin-bottom: 15px;
        }

        th {
            background: {{#if styleConfig.headerBackgroundColor}}{{styleConfig.headerBackgroundColor}}{{else}}white{{/if}};
            color: {{#if styleConfig.headerTextColor}}{{styleConfig.headerTextColor}}{{else}}#2c2c2c{{/if}};
            padding: 8px 5px;
            text-align: center;
            border: {{#if styleConfig.tableBorderWidth}}{{styleConfig.tableBorderWidth}}{{else}}1{{/if}}px solid {{#if styleConfig.tableBorderColor}}{{styleConfig.tableBorderColor}}{{else}}#bbb{{/if}};
            font-weight: bold;
            line-height: 1.3;
            font-size: {{#if styleConfig.fontSize}}{{styleConfig.fontSize}}{{else}}10{{/if}}px;
        }

        td {
            padding: 6px 4px;
            border: {{#if styleConfig.tableBorderWidth}}{{styleConfig.tableBorderWidth}}{{else}}1{{/if}}px solid {{#if styleConfig.tableBorderColor}}{{styleConfig.tableBorderColor}}{{else}}#ddd{{/if}};
            text-align: center;
            font-size: {{#if styleConfig.fontSize}}{{styleConfig.fontSize}}{{else}}10{{/if}}px;
            color: #333;
            background: white;
        }

        tbody tr:nth-child(even) td {
            background: {{#if styleConfig.alternateRowColor}}{{styleConfig.alternateRowColor}}{{else}}white{{/if}};
        }

        .student-name { text-transform: uppercase; /* student-name uppercase */
            text-align: left;
            font-weight: bold;
            padding-left: 8px;
            font-size: 10px;
            color: #2c2c2c;
        }

        .student-firstname {
            text-align: left;
            font-weight: bold;
            padding-left: 8px;
            font-size: 10px;
            color: #2c2c2c;
        }

        .note-cell {
            font-weight: bold;
            font-size: 11px;
        }

        .stats-section {
            display: flex;
            justify-content: space-around;
            margin: 20px 0;
            padding: 15px;
            border: 1px solid #ccc;
            background: white;
        }

        .stat-item {
            text-align: center;
        }

        .stat-label {
            font-size: 9px;
            color: #666;
            margin-bottom: 5px;
        }

        .stat-value {
            font-size: 14px;
            font-weight: bold;
            color: #2c2c2c;
        }

        .bottom-section {
            display: flex;
            justify-content: space-between;
            margin-top: 15px;
            gap: 15px;
        }

        .legend-table {
            border: 1px solid #ccc;
            border-collapse: collapse;
            font-size: 7px;
            width: auto;
        }

        .legend-table td {
            border: 1px solid #ddd;
            padding: 3px 6px;
            text-align: left;
            font-size: 7px;
        }

        .legend-table td:nth-child(odd) {
            font-weight: bold;
            color: #2c2c2c;
            width: 40px;
        }

        .info-box {
            border: 1px solid #ccc;
            padding: 10px;
            font-size: 9px;
            min-width: 220px;
        }

        .info-box div {
            margin-bottom: 5px;
        }

        .info-box strong {
            color: #2c2c2c;
        }

        .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 30px;
        }

        .signature-box {
            text-align: center;
            width: 30%;
        }

        .signature-line {
            font-size: 10px;
            color: #2c2c2c;
            font-weight: normal;
        }

        .observation {
            margin-top: 10px;
            padding: 10px;
            border: 1px solid #ccc;
            font-size: 9px;
            background: white;
        }

        @media print {
            body {
                background: white;
                padding: 0;
            }

            .container {
                box-shadow: none;
                padding: 10mm;
            }

            .container::before {
                color: rgba(200, 200, 200, 0.15);
            }

            .logo-box {
                border-style: solid;
            }
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
        <div class="content-wrapper">
            <div class="header">
                {{!-- Tutelle header: Pays / Devise / Ministère / Université / Faculté / Institut.
                     Center-affiliated programs use evaluation-publication-center.html (picked by template-loader). --}}
                <div style="display:flex;justify-content:space-between;align-items: center;gap:12px;margin-bottom:8px;font-size:9px;line-height:1.4;text-align:center;">
                    <div style="flex:1">
                        {{country.fr}}<br>
                        <em>{{country.mottoFr}}</em><br>
                        ********************<br>
                        {{ministry.fr}}<br>
                        {{#if university.fr}}********************<br><strong>{{upper university.fr}}</strong><br>{{/if}}
                        {{#if faculty.fr}}********************<br><strong>{{upper faculty.fr}}</strong>{{#if faculty.postalBox}}<br>B.P. {{faculty.postalBox}}{{/if}}{{#if faculty.contactEmail}}<br>Email : {{faculty.contactEmail}}{{/if}}<br>{{/if}}
                        ********************<br>
                        <strong>{{upper institutionHeader.nameFr}}</strong>
                        {{#if institutionHeader.postalBox}}<br>********************<br>B.P. {{institutionHeader.postalBox}}{{/if}}
                        {{#if institutionHeader.contactEmail}}<br>Email : <a href="mailto:{{institutionHeader.contactEmail}}">{{institutionHeader.contactEmail}}</a>{{/if}}
                    </div>
                    <div style="display:flex;align-items:center;gap:10px;">
                        {{{logo svg=logos.universitySvg url=logos.university alt="University" style="max-height:60px;max-width:80px;object-fit:contain;"}}}
                        {{{logo svg=logos.facultySvg url=logos.faculty alt="Faculty" style="max-height:60px;max-width:80px;object-fit:contain;"}}}
                        {{{logo svg=logos.institutionSvg url=logos.institution alt="Institution" style="max-height:60px;max-width:80px;object-fit:contain;"}}}
                    </div>
                    <div style="flex:1">
                        {{country.en}}<br>
                        <em>{{country.mottoEn}}</em><br>
                        ********************<br>
                        {{ministry.en}}<br>
                        {{#if university.en}}********************<br><strong>{{upper university.en}}</strong><br>{{/if}}
                        {{#if faculty.en}}********************<br><strong>{{upper faculty.en}}</strong>{{#if faculty.postalBox}}<br>P.O. Box {{faculty.postalBox}}{{/if}}{{#if faculty.contactEmail}}<br>Email: {{faculty.contactEmail}}{{/if}}<br>{{/if}}
                        ********************<br>
                        <strong>{{upper institutionHeader.nameEn}}</strong>
                        {{#if institutionHeader.postalBox}}<br>********************<br>P.O. Box {{institutionHeader.postalBox}}{{/if}}
                        {{#if institutionHeader.contactEmail}}<br>Email: <a href="mailto:{{institutionHeader.contactEmail}}">{{institutionHeader.contactEmail}}</a>{{/if}}
                    </div>
                </div>
            </div>

            <div class="title">
                {{#if headerConfig.titleFr}}{{headerConfig.titleFr}}{{else}}PUBLICATION DES RÉSULTATS{{/if}}
                {{#if headerConfig.titleEn}} / {{headerConfig.titleEn}}{{else}} / GRADE PUBLICATION{{/if}}<br>
                {{#if headerConfig.showSemester}}{{semester}} - {{/if}}{{#if headerConfig.showAcademicYear}}ANNÉE ACADÉMIQUE {{academicYear}}{{/if}}
            </div>

            <div class="eval-info">
                <div><strong>Type d'évaluation:</strong> {{evaluationType}} - {{evaluationLabel}}</div>
                <div><strong>Code EC:</strong> {{course.code}}</div>
                <div><strong>Intitulé EC:</strong> {{course.name}}</div>
                <div><strong>Code UE:</strong> {{teachingUnit.code}} - {{teachingUnit.name}}</div>
                <div><strong>Programme / Program:</strong> {{program.name}} - {{program.level}}</div>
                <div><strong>Date de l'évaluation:</strong> {{examDate}}</div>
                <div><strong>Durée:</strong> {{duration}} heures</div>
                <div><strong>Pondération de l'évaluation:</strong> {{examPercentage}}%</div>
                <div><strong>Coefficient EC dans l'UE:</strong> {{coefficient}}</div>
                <div><strong>Note sur:</strong> {{scale}}</div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>N°</th>
                        <th>MATRICULE</th>
                        <th>NOM ET PRÉNOM</th>
                        <th>NOTE / {{scale}}</th>
                        <th>APPRÉCIATION</th>
                        <th>OBSERVATION</th>
                    </tr>
                </thead>
                <tbody>
                    {{#each students}}
                    <tr>
                        <td>{{number}}</td>
                        <td>{{registrationNumber}}</td>
                        <td class="student-name">{{upper firstName}} {{upper lastName}}</td>
                        <td class="note-cell">{{formatNumber score}}</td>
                        <td>{{appreciation}}</td>
                        <td>{{observation}}</td>
                    </tr>
                    {{/each}}
                </tbody>
            </table>

            <div class="stats-section">
                <div class="stat-item">
                    <div class="stat-label">Nombre d'étudiants</div>
                    <div class="stat-value">{{stats.count}}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Présents</div>
                    <div class="stat-value">{{stats.present}}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Absents</div>
                    <div class="stat-value">{{stats.absent}}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Moyenne générale</div>
                    <div class="stat-value">{{formatNumber stats.average}} / {{scale}}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Note la plus haute</div>
                    <div class="stat-value">{{formatNumber stats.highest}}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Note la plus basse</div>
                    <div class="stat-value">{{formatNumber stats.lowest}}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Taux de réussite</div>
                    <div class="stat-value">{{stats.successRate}}%</div>
                </div>
            </div>

            {{#if observations}}
            <div class="observation">
                <strong>Observations générales:</strong><br>
                {{observations}}
            </div>
            {{/if}}

            <div class="bottom-section">
                <div style="flex: 1;"></div>
                <div style="display: flex; gap: 15px;">
                    <table class="legend-table">
                        <tr>
                            <td>CC:</td>
                            <td>Contrôle Continu</td>
                            <td>MAT:</td>
                            <td>Matricule</td>
                        </tr>
                        <tr>
                            <td>TPE:</td>
                            <td>Travaux Pratiques Encadrés</td>
                            <td>EC:</td>
                            <td>Élément Constitutif</td>
                        </tr>
                        <tr>
                            <td>TP:</td>
                            <td>Travaux Pratiques</td>
                            <td>UE:</td>
                            <td>Unité d'Enseignement</td>
                        </tr>
                    </table>

                    <div class="info-box">
                        <div><strong>Programme / Program:</strong> {{program.name}}</div>
                        <div><strong>Semestre:</strong> {{semester}}</div>
                        <div><strong>Année académique / Academic Year:</strong> {{academicYear}}</div>
                        <div><strong>Date de publication:</strong> {{publicationDate}}</div>
                    </div>
                </div>
            </div>

            <div class="signatures">
                {{#each signatures}}
                <div class="signature-box">
                    <div class="signature-line">{{position}}</div>
                    {{#if name}}
                    <div class="signature-name">{{name}}</div>
                    {{/if}}
                </div>
                {{/each}}
            </div>
        </div>
    </div>
</body>
</html>

`;

export const EVALUATION_TEMPLATE_CENTER = /* html */ `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Publication Évaluation</title>
    <style>
        @page {
            size: {{#if styleConfig.pageSize}}{{styleConfig.pageSize}}{{else}}A4{{/if}} {{#if styleConfig.pageOrientation}}{{styleConfig.pageOrientation}}{{else}}portrait{{/if}};
            margin: {{#if styleConfig.margins.top}}{{styleConfig.margins.top}}{{else}}10{{/if}}mm {{#if styleConfig.margins.right}}{{styleConfig.margins.right}}{{else}}10{{/if}}mm {{#if styleConfig.margins.bottom}}{{styleConfig.margins.bottom}}{{else}}10{{/if}}mm {{#if styleConfig.margins.left}}{{styleConfig.margins.left}}{{else}}10{{/if}}mm;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: {{#if styleConfig.fontFamily}}{{styleConfig.fontFamily}}{{else}}'Times New Roman', Times, serif{{/if}};
            font-size: {{#if styleConfig.fontSize}}{{styleConfig.fontSize}}{{else}}10{{/if}}px;
            background: #fafafa;
            padding: 10px;
            position: relative;
        }

        .container {
            width: 210mm;
            margin: 0 auto;
            background: white;
            padding: 10mm;
            box-shadow: 0 0 15px rgba(0,0,0,0.08);
            position: relative;
        }

        {{#if styleConfig.watermark.enabled}}
        .container::before {
            content: '{{styleConfig.watermark.text}}{{#if styleConfig.watermark.institutionName}} — {{styleConfig.watermark.institutionName}}{{/if}}';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate({{#if styleConfig.watermark.rotation}}{{styleConfig.watermark.rotation}}{{else}}-45{{/if}}deg);
            font-size: {{#if styleConfig.watermark.fontSize}}{{styleConfig.watermark.fontSize}}{{else}}100{{/if}}px;
            font-weight: bold;
            opacity: {{#if styleConfig.watermark.opacity}}{{styleConfig.watermark.opacity}}{{else}}0.10{{/if}};
            color: rgba(200, 200, 200, 1);
            z-index: 0;
            pointer-events: none;
        }
        {{#if styleConfig.watermark.logoUrl}}
        .container::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 60%;
            height: 60%;
            transform: translate(-50%, -50%);
            background-image: url('{{styleConfig.watermark.logoUrl}}');
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            opacity: 0.06;
            z-index: 0;
            pointer-events: none;
        }
        {{/if}}
        {{/if}}

        .content-wrapper {
            position: relative;
            z-index: 1;
        }

        .header {
            text-align: center;
            border-bottom: 2px solid #666;
            padding-bottom: 12px;
            margin-bottom: 15px;
        }

        .header h1 {
            font-size: {{#if styleConfig.headerFontSize}}{{styleConfig.headerFontSize}}{{else}}14{{/if}}px;
            color: {{#if styleConfig.primaryColor}}{{styleConfig.primaryColor}}{{else}}#2c2c2c{{/if}};
            margin-bottom: 3px;
            font-weight: bold;
        }

        .header h2 {
            font-size: {{#if styleConfig.headerFontSize}}{{multiply styleConfig.headerFontSize 0.86}}{{else}}12{{/if}}px;
            color: {{#if styleConfig.secondaryColor}}{{styleConfig.secondaryColor}}{{else}}#4a4a4a{{/if}};
            margin-bottom: 2px;
            font-weight: normal;
        }

        .header h3 {
            font-size: {{#if styleConfig.fontSize}}{{styleConfig.fontSize}}{{else}}10{{/if}}px;
            color: #666;
            font-weight: normal;
            margin-bottom: 2px;
        }

        .logos {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 20px;
            margin: 6px 0;
        }

        .logo-box {
            width: 70px;
            height: 70px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-size: 9px;
            text-align: center;
            padding: 5px;
        }


        .title {
            color: #2c2c2c;
            padding: 10px 0;
            text-align: center;
            margin-bottom: 15px;
            font-size: 12px;
            font-weight: bold;
        }

        .eval-info {
            background: white;
            border: 1px solid #ccc;
            padding: 12px;
            margin-bottom: 15px;
            font-size: 10px;
        }

        .eval-info div {
            margin-bottom: 5px;
        }

        .eval-info strong {
            color: #2c2c2c;
            display: inline-block;
            width: 150px;
        }

        table {
            border: {{#if styleConfig.tableBorderWidth}}{{styleConfig.tableBorderWidth}}{{else}}1{{/if}}px solid {{#if styleConfig.tableBorderColor}}{{styleConfig.tableBorderColor}}{{else}}#ccc{{/if}};
            width: 100%;
            border-collapse: collapse;
            font-size: {{#if styleConfig.fontSize}}{{styleConfig.fontSize}}{{else}}10{{/if}}px;
            margin-bottom: 15px;
        }

        th {
            background: {{#if styleConfig.headerBackgroundColor}}{{styleConfig.headerBackgroundColor}}{{else}}white{{/if}};
            color: {{#if styleConfig.headerTextColor}}{{styleConfig.headerTextColor}}{{else}}#2c2c2c{{/if}};
            padding: 8px 5px;
            text-align: center;
            border: {{#if styleConfig.tableBorderWidth}}{{styleConfig.tableBorderWidth}}{{else}}1{{/if}}px solid {{#if styleConfig.tableBorderColor}}{{styleConfig.tableBorderColor}}{{else}}#bbb{{/if}};
            font-weight: bold;
            line-height: 1.3;
            font-size: {{#if styleConfig.fontSize}}{{styleConfig.fontSize}}{{else}}10{{/if}}px;
        }

        td {
            padding: 6px 4px;
            border: {{#if styleConfig.tableBorderWidth}}{{styleConfig.tableBorderWidth}}{{else}}1{{/if}}px solid {{#if styleConfig.tableBorderColor}}{{styleConfig.tableBorderColor}}{{else}}#ddd{{/if}};
            text-align: center;
            font-size: {{#if styleConfig.fontSize}}{{styleConfig.fontSize}}{{else}}10{{/if}}px;
            color: #333;
            background: white;
        }

        tbody tr:nth-child(even) td {
            background: {{#if styleConfig.alternateRowColor}}{{styleConfig.alternateRowColor}}{{else}}white{{/if}};
        }

        .student-name { text-transform: uppercase; /* student-name uppercase */
            text-align: left;
            font-weight: bold;
            padding-left: 8px;
            font-size: 10px;
            color: #2c2c2c;
        }

        .student-firstname {
            text-align: left;
            font-weight: bold;
            padding-left: 8px;
            font-size: 10px;
            color: #2c2c2c;
        }

        .note-cell {
            font-weight: bold;
            font-size: 11px;
        }

        .stats-section {
            display: flex;
            justify-content: space-around;
            margin: 20px 0;
            padding: 15px;
            border: 1px solid #ccc;
            background: white;
        }

        .stat-item {
            text-align: center;
        }

        .stat-label {
            font-size: 9px;
            color: #666;
            margin-bottom: 5px;
        }

        .stat-value {
            font-size: 14px;
            font-weight: bold;
            color: #2c2c2c;
        }

        .bottom-section {
            display: flex;
            justify-content: space-between;
            margin-top: 15px;
            gap: 15px;
        }

        .legend-table {
            border: 1px solid #ccc;
            border-collapse: collapse;
            font-size: 7px;
            width: auto;
        }

        .legend-table td {
            border: 1px solid #ddd;
            padding: 3px 6px;
            text-align: left;
            font-size: 7px;
        }

        .legend-table td:nth-child(odd) {
            font-weight: bold;
            color: #2c2c2c;
            width: 40px;
        }

        .info-box {
            border: 1px solid #ccc;
            padding: 10px;
            font-size: 9px;
            min-width: 220px;
        }

        .info-box div {
            margin-bottom: 5px;
        }

        .info-box strong {
            color: #2c2c2c;
        }

        .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 30px;
        }

        .signature-box {
            text-align: center;
            width: 30%;
        }

        .signature-line {
            font-size: 10px;
            color: #2c2c2c;
            font-weight: normal;
        }

        .observation {
            margin-top: 10px;
            padding: 10px;
            border: 1px solid #ccc;
            font-size: 9px;
            background: white;
        }

        @media print {
            body {
                background: white;
                padding: 0;
            }

            .container {
                box-shadow: none;
                padding: 10mm;
            }

            .container::before {
                color: rgba(200, 200, 200, 0.15);
            }

            .logo-box {
                border-style: solid;
            }
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
        <div class="content-wrapper">
            <div class="header">
                {{!-- Center-only header — same 3-col layout as the standard variant.
                     Sources strictly from the centers tables (centers, center_administrative_instances, center_legal_texts).
                     No tutelle / faculty / university. --}}
                <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:8px;font-size:9px;line-height:1.4;text-align:center;">
                    <div style="flex:1">
                        {{country.fr}}<br>
                        <em>{{country.mottoFr}}</em><br>
                        ********************<br>
                        {{#each center.administrativeInstances}}
                        <strong>{{upper this.nameFr}}{{#if this.acronymFr}} ({{this.acronymFr}}){{/if}}</strong><br>
                        ********************<br>
                        {{/each}}
                        <strong>{{upper center.name}}</strong>
                        {{#if center.postalBox}}<br>********************<br>B.P. {{center.postalBox}}{{/if}}
                        {{#if center.contactEmail}}<br>Email : <a href="mailto:{{center.contactEmail}}">{{center.contactEmail}}</a>{{/if}}
                    </div>
                    <div style="display:flex;flex-direction:row;flex-wrap:wrap;align-items:center;justify-content:center;gap:10px;">
                        {{{logo svg=center.logoSvg url=center.logoUrl alt=center.name style="max-height:80px;max-width:120px;object-fit:contain;"}}}
                        {{#each center.administrativeInstances}}
                            {{#if (or this.logoSvg this.logoUrl)}}
                            {{{logo svg=this.logoSvg url=this.logoUrl alt=this.nameFr style="max-height:50px;max-width:80px;object-fit:contain;"}}}
                            {{/if}}
                        {{/each}}
                    </div>
                    <div style="flex:1">
                        {{country.en}}<br>
                        <em>{{country.mottoEn}}</em><br>
                        ********************<br>
                        {{#each center.administrativeInstances}}
                        <strong>{{upper this.nameEn}}{{#if this.acronymEn}} ({{this.acronymEn}}){{/if}}</strong><br>
                        ********************<br>
                        {{/each}}
                        {{#if center.nameEn}}<strong>{{upper center.nameEn}}</strong>{{else}}<strong>{{upper center.name}}</strong>{{/if}}
                        {{#if center.postalBox}}<br>********************<br>P.O. Box {{center.postalBox}}{{/if}}
                        {{#if center.contactEmail}}<br>Email: <a href="mailto:{{center.contactEmail}}">{{center.contactEmail}}</a>{{/if}}
                    </div>
                </div>
                {{#if center.authorizationOrderFr}}
                <div style="font-size:9px;color:#444;font-style:italic;padding:4px 6px;margin:4px auto 0;text-align:center;border-top:1px dotted #999;display:inline-block;">
                    {{center.authorizationOrderFr}}{{#if center.authorizationOrderEn}} / {{center.authorizationOrderEn}}{{/if}}
                </div>
                {{/if}}
                {{#if center.legalTexts.length}}
                <div style="font-size:8px;color:#555;margin:6px 0;padding-top:4px;border-top:1px dotted #aaa;text-align:center;line-height:1.4;">
                    {{#each center.legalTexts}}
                    <div>{{textFr}} / <span style="font-style:italic">{{textEn}}</span></div>
                    {{/each}}
                </div>
                {{/if}}
            </div>

            <div class="title">
                {{#if headerConfig.titleFr}}{{headerConfig.titleFr}}{{else}}PUBLICATION DES RÉSULTATS{{/if}}
                {{#if headerConfig.titleEn}} / {{headerConfig.titleEn}}{{else}} / GRADE PUBLICATION{{/if}}<br>
                {{#if headerConfig.showSemester}}{{semester}} - {{/if}}{{#if headerConfig.showAcademicYear}}ANNÉE ACADÉMIQUE {{academicYear}}{{/if}}
            </div>

            <div class="eval-info">
                <div><strong>Type d'évaluation:</strong> {{evaluationType}} - {{evaluationLabel}}</div>
                <div><strong>Code EC:</strong> {{course.code}}</div>
                <div><strong>Intitulé EC:</strong> {{course.name}}</div>
                <div><strong>Code UE:</strong> {{teachingUnit.code}} - {{teachingUnit.name}}</div>
                <div><strong>Programme / Program:</strong> {{program.name}} - {{program.level}}</div>
                <div><strong>Date de l'évaluation:</strong> {{examDate}}</div>
                <div><strong>Durée:</strong> {{duration}} heures</div>
                <div><strong>Pondération de l'évaluation:</strong> {{examPercentage}}%</div>
                <div><strong>Coefficient EC dans l'UE:</strong> {{coefficient}}</div>
                <div><strong>Note sur:</strong> {{scale}}</div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>N°</th>
                        <th>MATRICULE</th>
                        <th>NOM ET PRÉNOM</th>
                        <th>NOTE / {{scale}}</th>
                        <th>APPRÉCIATION</th>
                        <th>OBSERVATION</th>
                    </tr>
                </thead>
                <tbody>
                    {{#each students}}
                    <tr>
                        <td>{{number}}</td>
                        <td>{{registrationNumber}}</td>
                        <td class="student-name">{{upper firstName}} {{upper lastName}}</td>
                        <td class="note-cell">{{formatNumber score}}</td>
                        <td>{{appreciation}}</td>
                        <td>{{observation}}</td>
                    </tr>
                    {{/each}}
                </tbody>
            </table>

            <div class="stats-section">
                <div class="stat-item">
                    <div class="stat-label">Nombre d'étudiants</div>
                    <div class="stat-value">{{stats.count}}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Présents</div>
                    <div class="stat-value">{{stats.present}}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Absents</div>
                    <div class="stat-value">{{stats.absent}}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Moyenne générale</div>
                    <div class="stat-value">{{formatNumber stats.average}} / {{scale}}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Note la plus haute</div>
                    <div class="stat-value">{{formatNumber stats.highest}}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Note la plus basse</div>
                    <div class="stat-value">{{formatNumber stats.lowest}}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Taux de réussite</div>
                    <div class="stat-value">{{stats.successRate}}%</div>
                </div>
            </div>

            {{#if observations}}
            <div class="observation">
                <strong>Observations générales:</strong><br>
                {{observations}}
            </div>
            {{/if}}

            <div class="bottom-section">
                <div style="flex: 1;"></div>
                <div style="display: flex; gap: 15px;">
                    <table class="legend-table">
                        <tr>
                            <td>CC:</td>
                            <td>Contrôle Continu</td>
                            <td>MAT:</td>
                            <td>Matricule</td>
                        </tr>
                        <tr>
                            <td>TPE:</td>
                            <td>Travaux Pratiques Encadrés</td>
                            <td>EC:</td>
                            <td>Élément Constitutif</td>
                        </tr>
                        <tr>
                            <td>TP:</td>
                            <td>Travaux Pratiques</td>
                            <td>UE:</td>
                            <td>Unité d'Enseignement</td>
                        </tr>
                    </table>

                    <div class="info-box">
                        <div><strong>Programme / Program:</strong> {{program.name}}</div>
                        <div><strong>Semestre:</strong> {{semester}}</div>
                        <div><strong>Année académique / Academic Year:</strong> {{academicYear}}</div>
                        <div><strong>Date de publication:</strong> {{publicationDate}}</div>
                    </div>
                </div>
            </div>

            <div class="signatures">
                {{#each signatures}}
                <div class="signature-box">
                    <div class="signature-line">{{position}}</div>
                    {{#if name}}
                    <div class="signature-name">{{name}}</div>
                    {{/if}}
                </div>
                {{/each}}
            </div>
        </div>
    </div>
</body>
</html>

`;

export const EC_TEMPLATE = /* html */ `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Publication EC</title>
    <style>
        @page {
            size: {{#if styleConfig.pageSize}}{{styleConfig.pageSize}}{{else}}A4{{/if}} {{#if styleConfig.pageOrientation}}{{styleConfig.pageOrientation}}{{else}}portrait{{/if}};
            margin: {{#if styleConfig.margins.top}}{{styleConfig.margins.top}}{{else}}10{{/if}}mm {{#if styleConfig.margins.right}}{{styleConfig.margins.right}}{{else}}10{{/if}}mm {{#if styleConfig.margins.bottom}}{{styleConfig.margins.bottom}}{{else}}10{{/if}}mm {{#if styleConfig.margins.left}}{{styleConfig.margins.left}}{{else}}10{{/if}}mm;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: {{#if styleConfig.fontFamily}}{{styleConfig.fontFamily}}{{else}}'Times New Roman', Times, serif{{/if}};
            font-size: {{#if styleConfig.fontSize}}{{styleConfig.fontSize}}{{else}}10{{/if}}px;
            background: #fafafa;
            padding: 10px;
            position: relative;
        }
        .container {
            width: 210mm;
            margin: 0 auto;
            background: white;
            padding: 10mm;
            box-shadow: 0 0 15px rgba(0,0,0,0.08);
            position: relative;
        }
        {{#if styleConfig.watermark.enabled}}
        .container::before {
            content: '{{styleConfig.watermark.text}}{{#if styleConfig.watermark.institutionName}} — {{styleConfig.watermark.institutionName}}{{/if}}';
            position: absolute; top: 50%; left: 50%;
            transform: translate(-50%, -50%) rotate({{#if styleConfig.watermark.rotation}}{{styleConfig.watermark.rotation}}{{else}}-45{{/if}}deg);
            font-size: {{#if styleConfig.watermark.fontSize}}{{styleConfig.watermark.fontSize}}{{else}}100{{/if}}px;
            font-weight: bold;
            opacity: {{#if styleConfig.watermark.opacity}}{{styleConfig.watermark.opacity}}{{else}}0.10{{/if}};
            color: rgba(200, 200, 200, 1);
            z-index: 0; pointer-events: none;
        }
        {{#if styleConfig.watermark.logoUrl}}
        .container::after {
            content: ''; position: absolute; top: 50%; left: 50%;
            width: 60%; height: 60%;
            transform: translate(-50%, -50%);
            background-image: url('{{styleConfig.watermark.logoUrl}}');
            background-size: contain; background-repeat: no-repeat; background-position: center;
            opacity: 0.06; z-index: 0; pointer-events: none;
        }
        {{/if}}
        {{/if}}
        .content-wrapper { position: relative; z-index: 1; }
        .header { text-align: center; border-bottom: 2px solid #666; padding-bottom: 12px; margin-bottom: 15px; }
        .ec-info { background: white; border: 1px solid #ccc; padding: 12px; margin-bottom: 15px; font-size: 10px; }
        .ec-info div { margin-bottom: 5px; }
        .ec-info strong { color: #2c2c2c; display: inline-block; width: 150px; }
        .title { color: #2c2c2c; padding: 10px 0; text-align: center; margin-bottom: 15px; font-size: 12px; font-weight: bold; }
        table {
            border: {{#if styleConfig.tableBorderWidth}}{{styleConfig.tableBorderWidth}}{{else}}1{{/if}}px solid {{#if styleConfig.tableBorderColor}}{{styleConfig.tableBorderColor}}{{else}}#ccc{{/if}};
            width: 100%; border-collapse: collapse;
            font-size: {{#if styleConfig.fontSize}}{{multiply styleConfig.fontSize 0.9}}{{else}}9{{/if}}px;
            margin-bottom: 15px;
        }
        th {
            background: {{#if styleConfig.headerBackgroundColor}}{{styleConfig.headerBackgroundColor}}{{else}}white{{/if}};
            color: {{#if styleConfig.headerTextColor}}{{styleConfig.headerTextColor}}{{else}}#2c2c2c{{/if}};
            padding: 6px 4px; text-align: center;
            border: {{#if styleConfig.tableBorderWidth}}{{styleConfig.tableBorderWidth}}{{else}}1{{/if}}px solid {{#if styleConfig.tableBorderColor}}{{styleConfig.tableBorderColor}}{{else}}#bbb{{/if}};
            font-weight: bold; line-height: 1.3;
        }
        td {
            padding: 5px 3px;
            border: {{#if styleConfig.tableBorderWidth}}{{styleConfig.tableBorderWidth}}{{else}}1{{/if}}px solid {{#if styleConfig.tableBorderColor}}{{styleConfig.tableBorderColor}}{{else}}#ddd{{/if}};
            text-align: center; color: #333; background: white;
        }
        tbody tr:nth-child(even) td { background: {{#if styleConfig.alternateRowColor}}{{styleConfig.alternateRowColor}}{{else}}white{{/if}}; }
        .student-name { text-transform: uppercase; /* student-name uppercase */ text-align: left; font-weight: bold; padding-left: 5px; color: #2c2c2c; }
        .acquis { color: #16a34a; font-weight: bold; }
        .non-acquis { color: #dc2626; font-weight: bold; }
        .moyenne-finale { font-weight: bold; }
        .stats-row { background: white; font-weight: bold; }
        .legend-table { font-size: 8px; color: #666; margin-top: 8px; }
        .legend-table td { border: none; padding: 1px 6px; text-align: left; }
        .signatures { margin-top: 30px; display: flex; justify-content: space-between; gap: 20px; }
        .signature-box { flex: 1; text-align: center; font-size: 10px; }
        .signature-box .label { font-weight: bold; padding-bottom: 30mm; border-bottom: 1px solid #999; display: block; }
        .signature-box .name { padding-top: 2mm; font-style: italic; color: #666; }
    
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
        <div class="content-wrapper">
            <div class="header">
                {{!-- Standard 3-col header — same shape as pv/ue/evaluation. --}}
                <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:8px;font-size:9px;line-height:1.4;text-align:center;">
                    <div style="flex:1">
                        {{country.fr}}<br>
                        <em>{{country.mottoFr}}</em><br>
                        ********************<br>
                        {{ministry.fr}}<br>
                        {{#if university.fr}}********************<br><strong>{{upper university.fr}}</strong><br>{{/if}}
                        {{#if faculty.fr}}********************<br><strong>{{upper faculty.fr}}</strong><br>{{/if}}
                        ********************<br>
                        <strong>{{upper institutionHeader.nameFr}}</strong>
                        {{#if institutionHeader.postalBox}}<br>********************<br>B.P. {{institutionHeader.postalBox}}{{/if}}
                        {{#if institutionHeader.contactEmail}}<br>Email : <a href="mailto:{{institutionHeader.contactEmail}}">{{institutionHeader.contactEmail}}</a>{{/if}}
                    </div>
                    <div style="display:flex;align-items:center;gap:10px;">
                        {{{logo svg=logos.universitySvg url=logos.university alt="University" style="max-height:60px;max-width:80px;object-fit:contain;"}}}
                        {{{logo svg=logos.facultySvg url=logos.faculty alt="Faculty" style="max-height:60px;max-width:80px;object-fit:contain;"}}}
                        {{{logo svg=logos.institutionSvg url=logos.institution alt="Institution" style="max-height:60px;max-width:80px;object-fit:contain;"}}}
                    </div>
                    <div style="flex:1">
                        {{country.en}}<br>
                        <em>{{country.mottoEn}}</em><br>
                        ********************<br>
                        {{ministry.en}}<br>
                        {{#if university.en}}********************<br><strong>{{upper university.en}}</strong><br>{{/if}}
                        {{#if faculty.en}}********************<br><strong>{{upper faculty.en}}</strong><br>{{/if}}
                        ********************<br>
                        <strong>{{upper institutionHeader.nameEn}}</strong>
                        {{#if institutionHeader.postalBox}}<br>********************<br>P.O. Box {{institutionHeader.postalBox}}{{/if}}
                        {{#if institutionHeader.contactEmail}}<br>Email: <a href="mailto:{{institutionHeader.contactEmail}}">{{institutionHeader.contactEmail}}</a>{{/if}}
                    </div>
                </div>
            </div>

            <div class="title">
                {{#if headerConfig.titleFr}}{{headerConfig.titleFr}}{{else}}PUBLICATION DES RÉSULTATS — ÉLÉMENT CONSTITUTIF{{/if}}
                {{#if headerConfig.titleEn}} / {{headerConfig.titleEn}}{{else}} / COURSE GRADE PUBLICATION{{/if}}<br>
                {{#if headerConfig.showSemester}}{{semester}} - {{/if}}{{#if headerConfig.showAcademicYear}}ANNÉE ACADÉMIQUE {{academicYear}}{{/if}}
            </div>

            <div class="ec-info">
                <div><strong>Code EC :</strong> {{classCourse.code}}</div>
                <div><strong>Intitulé EC :</strong> {{classCourse.name}}</div>
                <div><strong>Crédits :</strong> {{classCourse.credits}}</div>
                <div><strong>Coefficient :</strong> {{classCourse.coefficient}}</div>
                {{#if teachingUnit.code}}<div><strong>UE de rattachement :</strong> {{teachingUnit.code}} — {{teachingUnit.name}}</div>{{/if}}
                <div><strong>Programme / Program :</strong> {{program.name}}{{#if program.level}} - {{program.level}}{{/if}}</div>
                <div><strong>Classe / Class :</strong> {{className}}</div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th rowspan="2" style="width: 5%;">N°</th>
                        <th rowspan="2" style="width: 12%;">MAT<br><span style="font-weight:normal;font-size:7.5px">ID</span></th>
                        <th rowspan="2" style="width: 22%;">NOM ET PRÉNOM<br><span style="font-weight:normal;font-size:7.5px">FULL NAME</span></th>
                        {{#each exams}}
                        <th>{{this.label}}<br><span style="font-weight:normal;font-size:7.5px">{{formatNumber this.percentage 0}}%</span></th>
                        {{/each}}
                        <th rowspan="2">MOY EC<br><span style="font-weight:normal;font-size:7.5px">AVG</span></th>
                        <th rowspan="2">DEC<br><span style="font-weight:normal;font-size:7.5px">RES</span></th>
                        <th rowspan="2">CRE<br><span style="font-weight:normal;font-size:7.5px">CR</span></th>
                    </tr>
                    <tr>
                        {{#each exams}}
                        <th><span style="font-size:7.5px">/{{formatNumber this.maxScore 0}}</span></th>
                        {{/each}}
                    </tr>
                </thead>
                <tbody>
                    {{#each students}}
                    <tr>
                        <td>{{number}}</td>
                        <td>{{registrationNumber}}</td>
                        <td class="student-name">{{upper firstName}} {{upper lastName}}</td>
                        {{#each examGrades}}
                        <td>{{formatNumber this.score}}</td>
                        {{/each}}
                        <td class="moyenne-finale">{{formatNumber average}}</td>
                        <td class="{{#if (eq decision 'Ac')}}acquis{{else}}non-acquis{{/if}}">{{decision}}</td>
                        <td>{{credits}}</td>
                    </tr>
                    {{/each}}
                    <tr class="stats-row">
                        <td colspan="100">
                            <strong>Taux de Réussite / Success Rate (TR / SR) : {{formatNumber globalSuccessRate 2}}%</strong>
                            &nbsp;&nbsp;|&nbsp;&nbsp;
                            <strong>Moyenne EC / EC Average : {{formatNumber globalAverage}}/20</strong>
                        </td>
                    </tr>
                </tbody>
            </table>

            <table class="legend-table">
                <tr>
                    <td><strong>CC :</strong> Contrôle Continu</td>
                    <td><strong>TP :</strong> Travaux Pratiques</td>
                    <td><strong>EX :</strong> Examen</td>
                    <td><strong>Ac :</strong> Acquis</td>
                    <td><strong>Nac :</strong> Non Acquis</td>
                </tr>
            </table>

            <div class="signatures">
                {{#each signatures}}
                <div class="signature-box">
                    <span class="label">{{position}}</span>
                    {{#if name}}<span class="name">{{name}}</span>{{/if}}
                </div>
                {{/each}}
            </div>
        </div>
    </div>
</body>
</html>

`;

export const EC_TEMPLATE_CENTER = /* html */ `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Publication EC</title>
    <style>
        @page {
            size: {{#if styleConfig.pageSize}}{{styleConfig.pageSize}}{{else}}A4{{/if}} {{#if styleConfig.pageOrientation}}{{styleConfig.pageOrientation}}{{else}}portrait{{/if}};
            margin: {{#if styleConfig.margins.top}}{{styleConfig.margins.top}}{{else}}10{{/if}}mm {{#if styleConfig.margins.right}}{{styleConfig.margins.right}}{{else}}10{{/if}}mm {{#if styleConfig.margins.bottom}}{{styleConfig.margins.bottom}}{{else}}10{{/if}}mm {{#if styleConfig.margins.left}}{{styleConfig.margins.left}}{{else}}10{{/if}}mm;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: {{#if styleConfig.fontFamily}}{{styleConfig.fontFamily}}{{else}}'Times New Roman', Times, serif{{/if}};
            font-size: {{#if styleConfig.fontSize}}{{styleConfig.fontSize}}{{else}}10{{/if}}px;
            background: #fafafa;
            padding: 10px;
            position: relative;
        }
        .container {
            width: 210mm; margin: 0 auto; background: white;
            padding: 10mm; box-shadow: 0 0 15px rgba(0,0,0,0.08); position: relative;
        }
        {{#if styleConfig.watermark.enabled}}
        .container::before {
            content: '{{styleConfig.watermark.text}}{{#if styleConfig.watermark.institutionName}} — {{styleConfig.watermark.institutionName}}{{/if}}';
            position: absolute; top: 50%; left: 50%;
            transform: translate(-50%, -50%) rotate({{#if styleConfig.watermark.rotation}}{{styleConfig.watermark.rotation}}{{else}}-45{{/if}}deg);
            font-size: {{#if styleConfig.watermark.fontSize}}{{styleConfig.watermark.fontSize}}{{else}}100{{/if}}px;
            font-weight: bold;
            opacity: {{#if styleConfig.watermark.opacity}}{{styleConfig.watermark.opacity}}{{else}}0.10{{/if}};
            color: rgba(200, 200, 200, 1);
            z-index: 0; pointer-events: none;
        }
        {{/if}}
        .content-wrapper { position: relative; z-index: 1; }
        .header { text-align: center; border-bottom: 2px solid #666; padding-bottom: 12px; margin-bottom: 15px; }
        .ec-info { background: white; border: 1px solid #ccc; padding: 12px; margin-bottom: 15px; font-size: 10px; }
        .ec-info div { margin-bottom: 5px; }
        .ec-info strong { color: #2c2c2c; display: inline-block; width: 150px; }
        .title { color: #2c2c2c; padding: 10px 0; text-align: center; margin-bottom: 15px; font-size: 12px; font-weight: bold; }
        table {
            border: {{#if styleConfig.tableBorderWidth}}{{styleConfig.tableBorderWidth}}{{else}}1{{/if}}px solid {{#if styleConfig.tableBorderColor}}{{styleConfig.tableBorderColor}}{{else}}#ccc{{/if}};
            width: 100%; border-collapse: collapse;
            font-size: {{#if styleConfig.fontSize}}{{multiply styleConfig.fontSize 0.9}}{{else}}9{{/if}}px;
            margin-bottom: 15px;
        }
        th {
            background: {{#if styleConfig.headerBackgroundColor}}{{styleConfig.headerBackgroundColor}}{{else}}white{{/if}};
            color: {{#if styleConfig.headerTextColor}}{{styleConfig.headerTextColor}}{{else}}#2c2c2c{{/if}};
            padding: 6px 4px; text-align: center;
            border: {{#if styleConfig.tableBorderWidth}}{{styleConfig.tableBorderWidth}}{{else}}1{{/if}}px solid {{#if styleConfig.tableBorderColor}}{{styleConfig.tableBorderColor}}{{else}}#bbb{{/if}};
            font-weight: bold; line-height: 1.3;
        }
        td {
            padding: 5px 3px;
            border: {{#if styleConfig.tableBorderWidth}}{{styleConfig.tableBorderWidth}}{{else}}1{{/if}}px solid {{#if styleConfig.tableBorderColor}}{{styleConfig.tableBorderColor}}{{else}}#ddd{{/if}};
            text-align: center; color: #333; background: white;
        }
        tbody tr:nth-child(even) td { background: {{#if styleConfig.alternateRowColor}}{{styleConfig.alternateRowColor}}{{else}}white{{/if}}; }
        .student-name { text-transform: uppercase; /* student-name uppercase */ text-align: left; font-weight: bold; padding-left: 5px; color: #2c2c2c; }
        .acquis { color: #16a34a; font-weight: bold; }
        .non-acquis { color: #dc2626; font-weight: bold; }
        .moyenne-finale { font-weight: bold; }
        .stats-row { background: white; font-weight: bold; }
        .legend-table { font-size: 8px; color: #666; margin-top: 8px; }
        .legend-table td { border: none; padding: 1px 6px; text-align: left; }
        .signatures { margin-top: 30px; display: flex; justify-content: space-between; gap: 20px; }
        .signature-box { flex: 1; text-align: center; font-size: 10px; }
        .signature-box .label { font-weight: bold; padding-bottom: 30mm; border-bottom: 1px solid #999; display: block; }
        .signature-box .name { padding-top: 2mm; font-style: italic; color: #666; }
    
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
        <div class="content-wrapper">
            <div class="header">
                {{!-- Center-only header — same 3-col layout as the standard variant.
                     Sources strictly from the centers tables (centers, center_administrative_instances, center_legal_texts).
                     No tutelle / faculty / university. --}}
                <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:8px;font-size:9px;line-height:1.4;text-align:center;">
                    <div style="flex:1">
                        {{country.fr}}<br>
                        <em>{{country.mottoFr}}</em><br>
                        ********************<br>
                        {{#each center.administrativeInstances}}
                        <strong>{{upper this.nameFr}}{{#if this.acronymFr}} ({{this.acronymFr}}){{/if}}</strong><br>
                        ********************<br>
                        {{/each}}
                        <strong>{{upper center.name}}</strong>
                        {{#if center.postalBox}}<br>********************<br>B.P. {{center.postalBox}}{{/if}}
                        {{#if center.contactEmail}}<br>Email : <a href="mailto:{{center.contactEmail}}">{{center.contactEmail}}</a>{{/if}}
                    </div>
                    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;">
                        {{{logo svg=center.logoSvg url=center.logoUrl alt=center.name style="max-height:80px;max-width:120px;object-fit:contain;"}}}
                        {{#each center.administrativeInstances}}
                            {{#if (or this.logoSvg this.logoUrl)}}
                            {{{logo svg=this.logoSvg url=this.logoUrl alt=this.nameFr style="max-height:50px;max-width:80px;object-fit:contain;"}}}
                            {{/if}}
                        {{/each}}
                    </div>
                    <div style="flex:1">
                        {{country.en}}<br>
                        <em>{{country.mottoEn}}</em><br>
                        ********************<br>
                        {{#each center.administrativeInstances}}
                        <strong>{{upper this.nameEn}}{{#if this.acronymEn}} ({{this.acronymEn}}){{/if}}</strong><br>
                        ********************<br>
                        {{/each}}
                        {{#if center.nameEn}}<strong>{{upper center.nameEn}}</strong>{{else}}<strong>{{upper center.name}}</strong>{{/if}}
                        {{#if center.postalBox}}<br>********************<br>P.O. Box {{center.postalBox}}{{/if}}
                        {{#if center.contactEmail}}<br>Email: <a href="mailto:{{center.contactEmail}}">{{center.contactEmail}}</a>{{/if}}
                    </div>
                </div>
                {{#if center.authorizationOrderFr}}
                <div style="font-size:9px;color:#444;font-style:italic;margin:4px 0;text-align:center;">
                    {{center.authorizationOrderFr}}{{#if center.authorizationOrderEn}} / {{center.authorizationOrderEn}}{{/if}}
                </div>
                {{/if}}
                {{#if center.legalTexts.length}}
                <div style="font-size:8px;color:#555;margin-bottom:6px;text-align:left;line-height:1.4;">
                    {{#each center.legalTexts}}
                    <div>• {{textFr}} / <span style="font-style:italic">{{textEn}}</span></div>
                    {{/each}}
                </div>
                {{/if}}
            </div>

            <div class="title">
                {{#if headerConfig.titleFr}}{{headerConfig.titleFr}}{{else}}PUBLICATION DES RÉSULTATS — ÉLÉMENT CONSTITUTIF{{/if}}
                {{#if headerConfig.titleEn}} / {{headerConfig.titleEn}}{{else}} / COURSE GRADE PUBLICATION{{/if}}<br>
                {{#if headerConfig.showSemester}}{{semester}} - {{/if}}{{#if headerConfig.showAcademicYear}}ANNÉE ACADÉMIQUE {{academicYear}}{{/if}}
            </div>

            <div class="ec-info">
                <div><strong>Code EC :</strong> {{classCourse.code}}</div>
                <div><strong>Intitulé EC :</strong> {{classCourse.name}}</div>
                <div><strong>Crédits :</strong> {{classCourse.credits}}</div>
                <div><strong>Coefficient :</strong> {{classCourse.coefficient}}</div>
                {{#if teachingUnit.code}}<div><strong>UE de rattachement :</strong> {{teachingUnit.code}} — {{teachingUnit.name}}</div>{{/if}}
                <div><strong>Programme / Program :</strong> {{program.name}}{{#if program.level}} - {{program.level}}{{/if}}</div>
                <div><strong>Classe / Class :</strong> {{className}}</div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th rowspan="2" style="width: 5%;">N°</th>
                        <th rowspan="2" style="width: 12%;">MAT<br><span style="font-weight:normal;font-size:7.5px">ID</span></th>
                        <th rowspan="2" style="width: 22%;">NOM ET PRÉNOM<br><span style="font-weight:normal;font-size:7.5px">FULL NAME</span></th>
                        {{#each exams}}
                        <th>{{this.label}}<br><span style="font-weight:normal;font-size:7.5px">{{formatNumber this.percentage 0}}%</span></th>
                        {{/each}}
                        <th rowspan="2">MOY EC<br><span style="font-weight:normal;font-size:7.5px">AVG</span></th>
                        <th rowspan="2">DEC<br><span style="font-weight:normal;font-size:7.5px">RES</span></th>
                        <th rowspan="2">CRE<br><span style="font-weight:normal;font-size:7.5px">CR</span></th>
                    </tr>
                    <tr>
                        {{#each exams}}
                        <th><span style="font-size:7.5px">/{{formatNumber this.maxScore 0}}</span></th>
                        {{/each}}
                    </tr>
                </thead>
                <tbody>
                    {{#each students}}
                    <tr>
                        <td>{{number}}</td>
                        <td>{{registrationNumber}}</td>
                        <td class="student-name">{{upper firstName}} {{upper lastName}}</td>
                        {{#each examGrades}}
                        <td>{{formatNumber this.score}}</td>
                        {{/each}}
                        <td class="moyenne-finale">{{formatNumber average}}</td>
                        <td class="{{#if (eq decision 'Ac')}}acquis{{else}}non-acquis{{/if}}">{{decision}}</td>
                        <td>{{credits}}</td>
                    </tr>
                    {{/each}}
                    <tr class="stats-row">
                        <td colspan="100">
                            <strong>Taux de Réussite / Success Rate (TR / SR) : {{formatNumber globalSuccessRate 2}}%</strong>
                            &nbsp;&nbsp;|&nbsp;&nbsp;
                            <strong>Moyenne EC / EC Average : {{formatNumber globalAverage}}/20</strong>
                        </td>
                    </tr>
                </tbody>
            </table>

            <table class="legend-table">
                <tr>
                    <td><strong>CC :</strong> Contrôle Continu</td>
                    <td><strong>TP :</strong> Travaux Pratiques</td>
                    <td><strong>EX :</strong> Examen</td>
                    <td><strong>Ac :</strong> Acquis</td>
                    <td><strong>Nac :</strong> Non Acquis</td>
                </tr>
            </table>

            <div class="signatures">
                {{#each signatures}}
                <div class="signature-box">
                    <span class="label">{{position}}</span>
                    {{#if name}}<span class="name">{{name}}</span>{{/if}}
                </div>
                {{/each}}
            </div>
        </div>
    </div>
</body>
</html>

`;

export const TEACHING_UNIT_TEMPLATE = /* html */ `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Publication UE</title>
    <style>
        @page {
            size: {{#if styleConfig.pageSize}}{{styleConfig.pageSize}}{{else}}A4{{/if}} {{#if styleConfig.pageOrientation}}{{styleConfig.pageOrientation}}{{else}}portrait{{/if}};
            margin: {{#if styleConfig.margins.top}}{{styleConfig.margins.top}}{{else}}10{{/if}}mm {{#if styleConfig.margins.right}}{{styleConfig.margins.right}}{{else}}10{{/if}}mm {{#if styleConfig.margins.bottom}}{{styleConfig.margins.bottom}}{{else}}10{{/if}}mm {{#if styleConfig.margins.left}}{{styleConfig.margins.left}}{{else}}10{{/if}}mm;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: {{#if styleConfig.fontFamily}}{{styleConfig.fontFamily}}{{else}}'Times New Roman', Times, serif{{/if}};
            font-size: {{#if styleConfig.fontSize}}{{styleConfig.fontSize}}{{else}}10{{/if}}px;
            background: #fafafa;
            padding: 10px;
            position: relative;
        }

        .container {
            width: 210mm;
            margin: 0 auto;
            background: white;
            padding: 10mm;
            box-shadow: 0 0 15px rgba(0,0,0,0.08);
            position: relative;
        }

        {{#if styleConfig.watermark.enabled}}
        .container::before {
            content: '{{styleConfig.watermark.text}}{{#if styleConfig.watermark.institutionName}} — {{styleConfig.watermark.institutionName}}{{/if}}';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate({{#if styleConfig.watermark.rotation}}{{styleConfig.watermark.rotation}}{{else}}-45{{/if}}deg);
            font-size: {{#if styleConfig.watermark.fontSize}}{{styleConfig.watermark.fontSize}}{{else}}100{{/if}}px;
            font-weight: bold;
            opacity: {{#if styleConfig.watermark.opacity}}{{styleConfig.watermark.opacity}}{{else}}0.10{{/if}};
            color: rgba(200, 200, 200, 1);
            z-index: 0;
            pointer-events: none;
        }
        {{#if styleConfig.watermark.logoUrl}}
        .container::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 60%;
            height: 60%;
            transform: translate(-50%, -50%);
            background-image: url('{{styleConfig.watermark.logoUrl}}');
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            opacity: 0.06;
            z-index: 0;
            pointer-events: none;
        }
        {{/if}}
        {{/if}}

        .content-wrapper {
            position: relative;
            z-index: 1;
        }

        .header {
            text-align: center;
            border-bottom: 2px solid #666;
            padding-bottom: 12px;
            margin-bottom: 15px;
        }

        .header h1 {
            font-size: {{#if styleConfig.headerFontSize}}{{styleConfig.headerFontSize}}{{else}}14{{/if}}px;
            color: {{#if styleConfig.primaryColor}}{{styleConfig.primaryColor}}{{else}}#2c2c2c{{/if}};
            margin-bottom: 3px;
            font-weight: bold;
        }

        .header h2 {
            font-size: {{#if styleConfig.headerFontSize}}{{multiply styleConfig.headerFontSize 0.86}}{{else}}12{{/if}}px;
            color: {{#if styleConfig.secondaryColor}}{{styleConfig.secondaryColor}}{{else}}#4a4a4a{{/if}};
            margin-bottom: 2px;
            font-weight: normal;
        }

        .header h3 {
            font-size: {{#if styleConfig.fontSize}}{{styleConfig.fontSize}}{{else}}10{{/if}}px;
            color: #666;
            font-weight: normal;
            margin-bottom: 2px;
        }

        .logos {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 20px;
            margin: 12px 0;
        }

        .logo-box {
            width: 70px;
            height: 70px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-size: 9px;
            text-align: center;
            padding: 5px;
        }

        .title {
            color: #2c2c2c;
            padding: 10px 0;
            text-align: center;
            margin-bottom: 15px;
            font-size: 12px;
            font-weight: bold;
        }

        .ue-info {
            background: white;
            border: 1px solid #ccc;
            padding: 12px;
            margin-bottom: 15px;
            font-size: 10px;
        }

        .ue-info div {
            margin-bottom: 5px;
        }

        .ue-info strong {
            color: #2c2c2c;
            display: inline-block;
            width: 150px;
        }

        table {
            border: {{#if styleConfig.tableBorderWidth}}{{styleConfig.tableBorderWidth}}{{else}}1{{/if}}px solid {{#if styleConfig.tableBorderColor}}{{styleConfig.tableBorderColor}}{{else}}#ccc{{/if}};
            width: 100%;
            border-collapse: collapse;
            font-size: {{#if styleConfig.fontSize}}{{multiply styleConfig.fontSize 0.9}}{{else}}9{{/if}}px;
            margin-bottom: 15px;
        }

        th {
            background: {{#if styleConfig.headerBackgroundColor}}{{styleConfig.headerBackgroundColor}}{{else}}white{{/if}};
            color: {{#if styleConfig.headerTextColor}}{{styleConfig.headerTextColor}}{{else}}#2c2c2c{{/if}};
            padding: 6px 4px;
            text-align: center;
            border: {{#if styleConfig.tableBorderWidth}}{{styleConfig.tableBorderWidth}}{{else}}1{{/if}}px solid {{#if styleConfig.tableBorderColor}}{{styleConfig.tableBorderColor}}{{else}}#bbb{{/if}};
            font-weight: bold;
            line-height: 1.3;
            font-size: {{#if styleConfig.fontSize}}{{multiply styleConfig.fontSize 0.9}}{{else}}9{{/if}}px;
        }

        .ue-header {
            border-bottom: 2px solid #999;
            font-size: 10px;
        }

        .ec-header {
            font-size: 8px;
        }

        td {
            padding: 5px 3px;
            border: {{#if styleConfig.tableBorderWidth}}{{styleConfig.tableBorderWidth}}{{else}}1{{/if}}px solid {{#if styleConfig.tableBorderColor}}{{styleConfig.tableBorderColor}}{{else}}#ddd{{/if}};
            text-align: center;
            font-size: {{#if styleConfig.fontSize}}{{multiply styleConfig.fontSize 0.9}}{{else}}9{{/if}}px;
            color: #333;
            background: white;
        }

        tbody tr:nth-child(even) td {
            background: {{#if styleConfig.alternateRowColor}}{{styleConfig.alternateRowColor}}{{else}}white{{/if}};
        }

        .student-name { text-transform: uppercase; /* student-name uppercase */
            text-align: left;
            font-weight: bold;
            padding-left: 5px;
            font-size: 9px;
            color: #2c2c2c;
        }

        .student-firstname {
            text-align: left;
            font-weight: bold;
            padding-left: 5px;
            font-size: 9px;
            color: #2c2c2c;
        }

        .acquis {
            color: #2c2c2c;
            font-weight: bold;
        }

        .non-acquis {
            color: #666;
            font-weight: bold;
        }

        .moyenne-ue {
            font-weight: bold;
        }

        .moyenne-finale {
            font-weight: bold;
            border-left: 2px solid #999;
        }

        .stats-row {
            background: white;
            font-weight: bold;
        }

        .stats-row td {
            text-align: center;
            font-size: 10px;
            padding: 8px;
            border-top: 2px solid #666;
        }

        .bottom-section {
            display: flex;
            justify-content: space-between;
            margin-top: 15px;
            gap: 15px;
        }

        .legend-table {
            border: 1px solid #ccc;
            border-collapse: collapse;
            font-size: 7px;
            width: auto;
        }

        .legend-table td {
            border: 1px solid #ddd;
            padding: 3px 6px;
            text-align: left;
            font-size: 7px;
        }

        .legend-table td:nth-child(odd) {
            font-weight: bold;
            color: #2c2c2c;
            width: 40px;
        }

        .info-box {
            border: 1px solid #ccc;
            padding: 10px;
            font-size: 9px;
            min-width: 220px;
        }

        .info-box div {
            margin-bottom: 5px;
        }

        .info-box strong {
            color: #2c2c2c;
        }

        .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 30px;
        }

        .signature-box {
            text-align: center;
            width: 30%;
        }

        .signature-line {
            font-size: 10px;
            color: #2c2c2c;
            font-weight: normal;
        }

        @media print {
            body {
                background: white;
                padding: 0;
            }

            .container {
                box-shadow: none;
                padding: 10mm;
            }

            .container::before {
                color: rgba(200, 200, 200, 0.15);
            }

            .logo-box {
                border-style: solid;
            }
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
        <div class="content-wrapper">
            <div class="header">
                {{!-- Tutelle header: Pays / Devise / Ministère / Université / Faculté / Institut.
                     Center-affiliated programs use teaching-unit-publication-center.html (picked by template-loader). --}}
                <div style="display:flex;justify-content:space-between;align-items: center;gap:12px;margin-bottom:8px;font-size:9px;line-height:1.4;text-align:center;">
                    <div style="flex:1">
                        {{country.fr}}<br>
                        <em>{{country.mottoFr}}</em><br>
                        ********************<br>
                        {{ministry.fr}}<br>
                        {{#if university.fr}}********************<br><strong>{{upper university.fr}}</strong><br>{{/if}}
                        {{#if faculty.fr}}********************<br><strong>{{upper faculty.fr}}</strong>{{#if faculty.postalBox}}<br>B.P. {{faculty.postalBox}}{{/if}}{{#if faculty.contactEmail}}<br>Email : {{faculty.contactEmail}}{{/if}}<br>{{/if}}
                        ********************<br>
                        <strong>{{upper institutionHeader.nameFr}}</strong>
                        {{#if institutionHeader.postalBox}}<br>********************<br>B.P. {{institutionHeader.postalBox}}{{/if}}
                        {{#if institutionHeader.contactEmail}}<br>Email : <a href="mailto:{{institutionHeader.contactEmail}}">{{institutionHeader.contactEmail}}</a>{{/if}}
                    </div>
                    <div style="display:flex;align-items:center;gap:10px;">
                        {{{logo svg=logos.universitySvg url=logos.university alt="University" style="max-height:60px;max-width:80px;object-fit:contain;"}}}
                        {{{logo svg=logos.facultySvg url=logos.faculty alt="Faculty" style="max-height:60px;max-width:80px;object-fit:contain;"}}}
                        {{{logo svg=logos.institutionSvg url=logos.institution alt="Institution" style="max-height:60px;max-width:80px;object-fit:contain;"}}}
                    </div>
                    <div style="flex:1">
                        {{country.en}}<br>
                        <em>{{country.mottoEn}}</em><br>
                        ********************<br>
                        {{ministry.en}}<br>
                        {{#if university.en}}********************<br><strong>{{upper university.en}}</strong><br>{{/if}}
                        {{#if faculty.en}}********************<br><strong>{{upper faculty.en}}</strong>{{#if faculty.postalBox}}<br>P.O. Box {{faculty.postalBox}}{{/if}}{{#if faculty.contactEmail}}<br>Email: {{faculty.contactEmail}}{{/if}}<br>{{/if}}
                        ********************<br>
                        <strong>{{upper institutionHeader.nameEn}}</strong>
                        {{#if institutionHeader.postalBox}}<br>********************<br>P.O. Box {{institutionHeader.postalBox}}{{/if}}
                        {{#if institutionHeader.contactEmail}}<br>Email: <a href="mailto:{{institutionHeader.contactEmail}}">{{institutionHeader.contactEmail}}</a>{{/if}}
                    </div>
                </div>
            </div>

            <div class="title">
                {{#if headerConfig.titleFr}}{{headerConfig.titleFr}}{{else}}PUBLICATION DES RÉSULTATS DE L'UNITÉ D'ENSEIGNEMENT{{/if}}
                {{#if headerConfig.titleEn}} / {{headerConfig.titleEn}}{{else}} / TEACHING UNIT GRADE PUBLICATION{{/if}}<br>
                {{#if headerConfig.showSemester}}{{semester}} - {{/if}}{{#if headerConfig.showAcademicYear}}ANNÉE ACADÉMIQUE {{academicYear}}{{/if}}
            </div>

            <div class="ue-info">
                <div><strong>Code UE:</strong> {{teachingUnit.code}}</div>
                <div><strong>Intitulé UE:</strong> {{teachingUnit.name}}</div>
                <div><strong>Crédits:</strong> {{teachingUnit.credits}} crédits</div>
                <div><strong>Programme / Program:</strong> {{program.name}} - {{program.level}}</div>
                <div><strong>Semestre:</strong> {{semester}}</div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th rowspan="2">N°</th>
                        <th rowspan="2">MAT</th>
                        <th rowspan="2">NOM ET PRÉNOM</th>

                        {{#each courses}}
                        <th colspan="3" class="ec-header">EC {{code}}<br>{{name}}</th>
                        {{/each}}

                        <th colspan="7" class="ue-header">BILAN UE</th>
                    </tr>
                    <tr>
                        {{#each courses}}
                        <th>CC</th>
                        <th>EX</th>
                        <th>MOY</th>
                        {{/each}}

                        <th>MOY</th>
                        <th>DEC</th>
                        <th>CRE</th>
                        <th>TR</th>
                        <th>MOY</th>
                        <th>DEC</th>
                        <th>CRE</th>
                    </tr>
                </thead>
                <tbody>
                    {{#each students}}
                    <tr>
                        <td>{{number}}</td>
                        <td>{{registrationNumber}}</td>
                        <td class="student-name">{{upper firstName}} {{upper lastName}}</td>

                        {{#each courseGrades}}
                        <td>{{formatNumber cc}}</td>
                        <td>{{formatNumber ex}}</td>
                        <td>{{formatNumber average}}</td>
                        {{/each}}

                        <td class="moyenne-ue">{{formatNumber ueAverage}}</td>
                        <td class="{{#if (eq decision 'Ac')}}acquis{{else}}non-acquis{{/if}}">{{decision}}</td>
                        <td>{{credits}}</td>
                        <td>{{formatNumber successRate 2}}%</td>
                        <td class="moyenne-finale">{{formatNumber ueAverage}}</td>
                        <td class="{{#if (eq decision 'Ac')}}acquis{{else}}non-acquis{{/if}}">{{decision}}</td>
                        <td>{{credits}}</td>
                    </tr>
                    {{/each}}

                    <tr class="stats-row">
                        <td colspan="100">
                            <strong>Taux de Réussite (TR): {{formatNumber globalSuccessRate 2}}%</strong>
                        </td>
                    </tr>
                </tbody>
            </table>

            <div class="bottom-section">
                <div style="flex: 1;"></div>
                <div style="display: flex; gap: 15px;">
                    <table class="legend-table">
                        <tr>
                            <td>CC:</td>
                            <td>Contrôle Continu</td>
                            <td>CRE:</td>
                            <td>Crédits</td>
                            <td>Ac:</td>
                            <td>Acquis</td>
                        </tr>
                        <tr>
                            <td>EX:</td>
                            <td>Examen</td>
                            <td>EC:</td>
                            <td>Élément Constitutif</td>
                            <td>Nac:</td>
                            <td>Non Acquis</td>
                        </tr>
                        <tr>
                            <td>MOY:</td>
                            <td>Moyenne</td>
                            <td>UE:</td>
                            <td>Unité d'Enseignement</td>
                            <td>TR:</td>
                            <td>Taux de Réussite</td>
                        </tr>
                        <tr>
                            <td>DEC:</td>
                            <td>Décision</td>
                            <td>MAT:</td>
                            <td>Matricule</td>
                            <td></td>
                            <td></td>
                        </tr>
                    </table>

                    <div class="info-box">
                        <div><strong>Programme / Program:</strong> {{program.name}}</div>
                        <div><strong>Semestre:</strong> {{semester}}</div>
                        <div><strong>Année académique / Academic Year:</strong> {{academicYear}}</div>
                    </div>
                </div>
            </div>

            <div class="signatures">
                {{#each signatures}}
                <div class="signature-box">
                    <div class="signature-line">{{position}}</div>
                    {{#if name}}
                    <div class="signature-name">{{name}}</div>
                    {{/if}}
                </div>
                {{/each}}
            </div>
        </div>
    </div>
</body>
</html>

`;

export const TEACHING_UNIT_TEMPLATE_CENTER = /* html */ `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Publication UE</title>
    <style>
        @page {
            size: {{#if styleConfig.pageSize}}{{styleConfig.pageSize}}{{else}}A4{{/if}} {{#if styleConfig.pageOrientation}}{{styleConfig.pageOrientation}}{{else}}portrait{{/if}};
            margin: {{#if styleConfig.margins.top}}{{styleConfig.margins.top}}{{else}}10{{/if}}mm {{#if styleConfig.margins.right}}{{styleConfig.margins.right}}{{else}}10{{/if}}mm {{#if styleConfig.margins.bottom}}{{styleConfig.margins.bottom}}{{else}}10{{/if}}mm {{#if styleConfig.margins.left}}{{styleConfig.margins.left}}{{else}}10{{/if}}mm;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: {{#if styleConfig.fontFamily}}{{styleConfig.fontFamily}}{{else}}'Times New Roman', Times, serif{{/if}};
            font-size: {{#if styleConfig.fontSize}}{{styleConfig.fontSize}}{{else}}10{{/if}}px;
            background: #fafafa;
            padding: 10px;
            position: relative;
        }

        .container {
            width: 210mm;
            margin: 0 auto;
            background: white;
            padding: 10mm;
            box-shadow: 0 0 15px rgba(0,0,0,0.08);
            position: relative;
        }

        {{#if styleConfig.watermark.enabled}}
        .container::before {
            content: '{{styleConfig.watermark.text}}{{#if styleConfig.watermark.institutionName}} — {{styleConfig.watermark.institutionName}}{{/if}}';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate({{#if styleConfig.watermark.rotation}}{{styleConfig.watermark.rotation}}{{else}}-45{{/if}}deg);
            font-size: {{#if styleConfig.watermark.fontSize}}{{styleConfig.watermark.fontSize}}{{else}}100{{/if}}px;
            font-weight: bold;
            opacity: {{#if styleConfig.watermark.opacity}}{{styleConfig.watermark.opacity}}{{else}}0.10{{/if}};
            color: rgba(200, 200, 200, 1);
            z-index: 0;
            pointer-events: none;
        }
        {{#if styleConfig.watermark.logoUrl}}
        .container::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 60%;
            height: 60%;
            transform: translate(-50%, -50%);
            background-image: url('{{styleConfig.watermark.logoUrl}}');
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            opacity: 0.06;
            z-index: 0;
            pointer-events: none;
        }
        {{/if}}
        {{/if}}

        .content-wrapper {
            position: relative;
            z-index: 1;
        }

        .header {
            text-align: center;
            border-bottom: 2px solid #666;
            padding-bottom: 12px;
            margin-bottom: 15px;
        }

        .header h1 {
            font-size: {{#if styleConfig.headerFontSize}}{{styleConfig.headerFontSize}}{{else}}14{{/if}}px;
            color: {{#if styleConfig.primaryColor}}{{styleConfig.primaryColor}}{{else}}#2c2c2c{{/if}};
            margin-bottom: 3px;
            font-weight: bold;
        }

        .header h2 {
            font-size: {{#if styleConfig.headerFontSize}}{{multiply styleConfig.headerFontSize 0.86}}{{else}}12{{/if}}px;
            color: {{#if styleConfig.secondaryColor}}{{styleConfig.secondaryColor}}{{else}}#4a4a4a{{/if}};
            margin-bottom: 2px;
            font-weight: normal;
        }

        .header h3 {
            font-size: {{#if styleConfig.fontSize}}{{styleConfig.fontSize}}{{else}}10{{/if}}px;
            color: #666;
            font-weight: normal;
            margin-bottom: 2px;
        }

        .logos {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 20px;
            margin: 12px 0;
        }

        .logo-box {
            width: 70px;
            height: 70px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-size: 9px;
            text-align: center;
            padding: 5px;
        }

        .title {
            color: #2c2c2c;
            padding: 10px 0;
            text-align: center;
            margin-bottom: 15px;
            font-size: 12px;
            font-weight: bold;
        }

        .ue-info {
            background: white;
            border: 1px solid #ccc;
            padding: 12px;
            margin-bottom: 15px;
            font-size: 10px;
        }

        .ue-info div {
            margin-bottom: 5px;
        }

        .ue-info strong {
            color: #2c2c2c;
            display: inline-block;
            width: 150px;
        }

        table {
            border: {{#if styleConfig.tableBorderWidth}}{{styleConfig.tableBorderWidth}}{{else}}1{{/if}}px solid {{#if styleConfig.tableBorderColor}}{{styleConfig.tableBorderColor}}{{else}}#ccc{{/if}};
            width: 100%;
            border-collapse: collapse;
            font-size: {{#if styleConfig.fontSize}}{{multiply styleConfig.fontSize 0.9}}{{else}}9{{/if}}px;
            margin-bottom: 15px;
        }

        th {
            background: {{#if styleConfig.headerBackgroundColor}}{{styleConfig.headerBackgroundColor}}{{else}}white{{/if}};
            color: {{#if styleConfig.headerTextColor}}{{styleConfig.headerTextColor}}{{else}}#2c2c2c{{/if}};
            padding: 6px 4px;
            text-align: center;
            border: {{#if styleConfig.tableBorderWidth}}{{styleConfig.tableBorderWidth}}{{else}}1{{/if}}px solid {{#if styleConfig.tableBorderColor}}{{styleConfig.tableBorderColor}}{{else}}#bbb{{/if}};
            font-weight: bold;
            line-height: 1.3;
            font-size: {{#if styleConfig.fontSize}}{{multiply styleConfig.fontSize 0.9}}{{else}}9{{/if}}px;
        }

        .ue-header {
            border-bottom: 2px solid #999;
            font-size: 10px;
        }

        .ec-header {
            font-size: 8px;
        }

        td {
            padding: 5px 3px;
            border: {{#if styleConfig.tableBorderWidth}}{{styleConfig.tableBorderWidth}}{{else}}1{{/if}}px solid {{#if styleConfig.tableBorderColor}}{{styleConfig.tableBorderColor}}{{else}}#ddd{{/if}};
            text-align: center;
            font-size: {{#if styleConfig.fontSize}}{{multiply styleConfig.fontSize 0.9}}{{else}}9{{/if}}px;
            color: #333;
            background: white;
        }

        tbody tr:nth-child(even) td {
            background: {{#if styleConfig.alternateRowColor}}{{styleConfig.alternateRowColor}}{{else}}white{{/if}};
        }

        .student-name { text-transform: uppercase; /* student-name uppercase */
            text-align: left;
            font-weight: bold;
            padding-left: 5px;
            font-size: 9px;
            color: #2c2c2c;
        }

        .student-firstname {
            text-align: left;
            font-weight: bold;
            padding-left: 5px;
            font-size: 9px;
            color: #2c2c2c;
        }

        .acquis {
            color: #2c2c2c;
            font-weight: bold;
        }

        .non-acquis {
            color: #666;
            font-weight: bold;
        }

        .moyenne-ue {
            font-weight: bold;
        }

        .moyenne-finale {
            font-weight: bold;
            border-left: 2px solid #999;
        }

        .stats-row {
            background: white;
            font-weight: bold;
        }

        .stats-row td {
            text-align: center;
            font-size: 10px;
            padding: 8px;
            border-top: 2px solid #666;
        }

        .bottom-section {
            display: flex;
            justify-content: space-between;
            margin-top: 15px;
            gap: 15px;
        }

        .legend-table {
            border: 1px solid #ccc;
            border-collapse: collapse;
            font-size: 7px;
            width: auto;
        }

        .legend-table td {
            border: 1px solid #ddd;
            padding: 3px 6px;
            text-align: left;
            font-size: 7px;
        }

        .legend-table td:nth-child(odd) {
            font-weight: bold;
            color: #2c2c2c;
            width: 40px;
        }

        .info-box {
            border: 1px solid #ccc;
            padding: 10px;
            font-size: 9px;
            min-width: 220px;
        }

        .info-box div {
            margin-bottom: 5px;
        }

        .info-box strong {
            color: #2c2c2c;
        }

        .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 30px;
        }

        .signature-box {
            text-align: center;
            width: 30%;
        }

        .signature-line {
            font-size: 10px;
            color: #2c2c2c;
            font-weight: normal;
        }

        @media print {
            body {
                background: white;
                padding: 0;
            }

            .container {
                box-shadow: none;
                padding: 10mm;
            }

            .container::before {
                color: rgba(200, 200, 200, 0.15);
            }

            .logo-box {
                border-style: solid;
            }
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
        <div class="content-wrapper">
            <div class="header">
                {{!-- Center-only header — same 3-col layout as the standard variant.
                     Sources strictly from the centers tables (centers, center_administrative_instances, center_legal_texts).
                     No tutelle / faculty / university. --}}
                <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:8px;font-size:9px;line-height:1.4;text-align:center;">
                    <div style="flex:1">
                        {{country.fr}}<br>
                        <em>{{country.mottoFr}}</em><br>
                        ********************<br>
                        {{#each center.administrativeInstances}}
                        <strong>{{upper this.nameFr}}{{#if this.acronymFr}} ({{this.acronymFr}}){{/if}}</strong><br>
                        ********************<br>
                        {{/each}}
                        <strong>{{upper center.name}}</strong>
                        {{#if center.postalBox}}<br>********************<br>B.P. {{center.postalBox}}{{/if}}
                        {{#if center.contactEmail}}<br>Email : <a href="mailto:{{center.contactEmail}}">{{center.contactEmail}}</a>{{/if}}
                    </div>
                    <div style="display:flex;flex-direction:row;flex-wrap:wrap;align-items:center;justify-content:center;gap:10px;">
                        {{{logo svg=center.logoSvg url=center.logoUrl alt=center.name style="max-height:80px;max-width:120px;object-fit:contain;"}}}
                        {{#each center.administrativeInstances}}
                            {{#if (or this.logoSvg this.logoUrl)}}
                            {{{logo svg=this.logoSvg url=this.logoUrl alt=this.nameFr style="max-height:50px;max-width:80px;object-fit:contain;"}}}
                            {{/if}}
                        {{/each}}
                    </div>
                    <div style="flex:1">
                        {{country.en}}<br>
                        <em>{{country.mottoEn}}</em><br>
                        ********************<br>
                        {{#each center.administrativeInstances}}
                        <strong>{{upper this.nameEn}}{{#if this.acronymEn}} ({{this.acronymEn}}){{/if}}</strong><br>
                        ********************<br>
                        {{/each}}
                        {{#if center.nameEn}}<strong>{{upper center.nameEn}}</strong>{{else}}<strong>{{upper center.name}}</strong>{{/if}}
                        {{#if center.postalBox}}<br>********************<br>P.O. Box {{center.postalBox}}{{/if}}
                        {{#if center.contactEmail}}<br>Email: <a href="mailto:{{center.contactEmail}}">{{center.contactEmail}}</a>{{/if}}
                    </div>
                </div>
                {{#if center.authorizationOrderFr}}
                <div style="font-size:9px;color:#444;font-style:italic;padding:4px 6px;margin:4px auto 0;text-align:center;border-top:1px dotted #999;display:inline-block;">
                    {{center.authorizationOrderFr}}{{#if center.authorizationOrderEn}} / {{center.authorizationOrderEn}}{{/if}}
                </div>
                {{/if}}
                {{#if center.legalTexts.length}}
                <div style="font-size:8px;color:#555;margin:6px 0;padding-top:4px;border-top:1px dotted #aaa;text-align:center;line-height:1.4;">
                    {{#each center.legalTexts}}
                    <div>{{textFr}} / <span style="font-style:italic">{{textEn}}</span></div>
                    {{/each}}
                </div>
                {{/if}}
            </div>

            <div class="title">
                {{#if headerConfig.titleFr}}{{headerConfig.titleFr}}{{else}}PUBLICATION DES RÉSULTATS DE L'UNITÉ D'ENSEIGNEMENT{{/if}}
                {{#if headerConfig.titleEn}} / {{headerConfig.titleEn}}{{else}} / TEACHING UNIT GRADE PUBLICATION{{/if}}<br>
                {{#if headerConfig.showSemester}}{{semester}} - {{/if}}{{#if headerConfig.showAcademicYear}}ANNÉE ACADÉMIQUE {{academicYear}}{{/if}}
            </div>

            <div class="ue-info">
                <div><strong>Code UE:</strong> {{teachingUnit.code}}</div>
                <div><strong>Intitulé UE:</strong> {{teachingUnit.name}}</div>
                <div><strong>Crédits:</strong> {{teachingUnit.credits}} crédits</div>
                <div><strong>Programme / Program:</strong> {{program.name}} - {{program.level}}</div>
                <div><strong>Semestre:</strong> {{semester}}</div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th rowspan="2">N°</th>
                        <th rowspan="2">MAT</th>
                        <th rowspan="2">NOM ET PRÉNOM</th>

                        {{#each courses}}
                        <th colspan="3" class="ec-header">EC {{code}}<br>{{name}}</th>
                        {{/each}}

                        <th colspan="7" class="ue-header">BILAN UE</th>
                    </tr>
                    <tr>
                        {{#each courses}}
                        <th>CC</th>
                        <th>EX</th>
                        <th>MOY</th>
                        {{/each}}

                        <th>MOY</th>
                        <th>DEC</th>
                        <th>CRE</th>
                        <th>TR</th>
                        <th>MOY</th>
                        <th>DEC</th>
                        <th>CRE</th>
                    </tr>
                </thead>
                <tbody>
                    {{#each students}}
                    <tr>
                        <td>{{number}}</td>
                        <td>{{registrationNumber}}</td>
                        <td class="student-name">{{upper firstName}} {{upper lastName}}</td>

                        {{#each courseGrades}}
                        <td>{{formatNumber cc}}</td>
                        <td>{{formatNumber ex}}</td>
                        <td>{{formatNumber average}}</td>
                        {{/each}}

                        <td class="moyenne-ue">{{formatNumber ueAverage}}</td>
                        <td class="{{#if (eq decision 'Ac')}}acquis{{else}}non-acquis{{/if}}">{{decision}}</td>
                        <td>{{credits}}</td>
                        <td>{{formatNumber successRate 2}}%</td>
                        <td class="moyenne-finale">{{formatNumber ueAverage}}</td>
                        <td class="{{#if (eq decision 'Ac')}}acquis{{else}}non-acquis{{/if}}">{{decision}}</td>
                        <td>{{credits}}</td>
                    </tr>
                    {{/each}}

                    <tr class="stats-row">
                        <td colspan="100">
                            <strong>Taux de Réussite (TR): {{formatNumber globalSuccessRate 2}}%</strong>
                        </td>
                    </tr>
                </tbody>
            </table>

            <div class="bottom-section">
                <div style="flex: 1;"></div>
                <div style="display: flex; gap: 15px;">
                    <table class="legend-table">
                        <tr>
                            <td>CC:</td>
                            <td>Contrôle Continu</td>
                            <td>CRE:</td>
                            <td>Crédits</td>
                            <td>Ac:</td>
                            <td>Acquis</td>
                        </tr>
                        <tr>
                            <td>EX:</td>
                            <td>Examen</td>
                            <td>EC:</td>
                            <td>Élément Constitutif</td>
                            <td>Nac:</td>
                            <td>Non Acquis</td>
                        </tr>
                        <tr>
                            <td>MOY:</td>
                            <td>Moyenne</td>
                            <td>UE:</td>
                            <td>Unité d'Enseignement</td>
                            <td>TR:</td>
                            <td>Taux de Réussite</td>
                        </tr>
                        <tr>
                            <td>DEC:</td>
                            <td>Décision</td>
                            <td>MAT:</td>
                            <td>Matricule</td>
                            <td></td>
                            <td></td>
                        </tr>
                    </table>

                    <div class="info-box">
                        <div><strong>Programme / Program:</strong> {{program.name}}</div>
                        <div><strong>Semestre:</strong> {{semester}}</div>
                        <div><strong>Année académique / Academic Year:</strong> {{academicYear}}</div>
                    </div>
                </div>
            </div>

            <div class="signatures">
                {{#each signatures}}
                <div class="signature-box">
                    <div class="signature-line">{{position}}</div>
                    {{#if name}}
                    <div class="signature-name">{{name}}</div>
                    {{/if}}
                </div>
                {{/each}}
            </div>
        </div>
    </div>
</body>
</html>

`;

export const DELIBERATION_TEMPLATE = /* html */ `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Procès-Verbal de Délibération</title>
    <style>
        @page {
            size: {{#if styleConfig.pageSize}}{{styleConfig.pageSize}}{{else}}A4{{/if}} {{#if styleConfig.pageOrientation}}{{styleConfig.pageOrientation}}{{else}}landscape{{/if}};
            margin: {{#if styleConfig.margins.top}}{{styleConfig.margins.top}}{{else}}8{{/if}}mm {{#if styleConfig.margins.right}}{{styleConfig.margins.right}}{{else}}8{{/if}}mm {{#if styleConfig.margins.bottom}}{{styleConfig.margins.bottom}}{{else}}8{{/if}}mm {{#if styleConfig.margins.left}}{{styleConfig.margins.left}}{{else}}8{{/if}}mm;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: {{#if styleConfig.fontFamily}}{{styleConfig.fontFamily}}{{else}}'Times New Roman', Times, serif{{/if}};
            font-size: {{#if styleConfig.fontSize}}{{styleConfig.fontSize}}{{else}}10{{/if}}px;
            background: #fafafa;
            padding: 10px;
            position: relative;
        }

        .container {
            width: 297mm;
            margin: 0 auto;
            background: white;
            padding: 10mm;
            box-shadow: 0 0 15px rgba(0,0,0,0.08);
            position: relative;
        }

        {{#if styleConfig.watermark.enabled}}
        .container::before {
            content: '{{styleConfig.watermark.text}}{{#if styleConfig.watermark.institutionName}} — {{styleConfig.watermark.institutionName}}{{/if}}';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate({{#if styleConfig.watermark.rotation}}{{styleConfig.watermark.rotation}}{{else}}-45{{/if}}deg);
            font-size: {{#if styleConfig.watermark.fontSize}}{{styleConfig.watermark.fontSize}}{{else}}120{{/if}}px;
            font-weight: bold;
            opacity: {{#if styleConfig.watermark.opacity}}{{styleConfig.watermark.opacity}}{{else}}0.10{{/if}};
            color: rgba(200, 200, 200, 1);
            z-index: 0;
            pointer-events: none;
        }
        {{#if styleConfig.watermark.logoUrl}}
        .container::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 60%;
            height: 60%;
            transform: translate(-50%, -50%);
            background-image: url('{{styleConfig.watermark.logoUrl}}');
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            opacity: 0.06;
            z-index: 0;
            pointer-events: none;
        }
        {{/if}}
        {{/if}}

        .content-wrapper { position: relative; z-index: 1; }

        .header {
            text-align: center;
            border-bottom: 2px solid #666;
            padding-bottom: 12px;
            margin-bottom: 12px;
        }

        .header h1 {
            font-size: {{#if styleConfig.headerFontSize}}{{styleConfig.headerFontSize}}{{else}}15{{/if}}px;
            color: {{#if styleConfig.primaryColor}}{{styleConfig.primaryColor}}{{else}}#2c2c2c{{/if}};
            margin-bottom: 3px;
            font-weight: bold;
        }

        .header h2 {
            font-size: {{#if styleConfig.headerFontSize}}{{multiply styleConfig.headerFontSize 0.87}}{{else}}13{{/if}}px;
            color: {{#if styleConfig.secondaryColor}}{{styleConfig.secondaryColor}}{{else}}#4a4a4a{{/if}};
            margin-bottom: 2px;
            font-weight: normal;
        }

        .logos {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 40px;
            margin: 12px 0;
        }

        .logo-box {
            width: 70px;
            height: 70px;
            border: 2px dashed #bbb;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-size: 9px;
            color: #999;
            text-align: center;
            padding: 5px;
        }

        .title {
            color: #2c2c2c;
            padding: 10px 0;
            text-align: center;
            margin-bottom: 12px;
            font-size: 11px;
            font-weight: bold;
        }

        .jury-info {
            margin-bottom: 12px;
            font-size: 9px;
            text-align: center;
        }

        .jury-info strong { color: #2c2c2c; }

        table {
            border: {{#if styleConfig.tableBorderWidth}}{{styleConfig.tableBorderWidth}}{{else}}1{{/if}}px solid {{#if styleConfig.tableBorderColor}}{{styleConfig.tableBorderColor}}{{else}}#ccc{{/if}};
            width: 100%;
            border-collapse: collapse;
            font-size: {{#if styleConfig.fontSize}}{{multiply styleConfig.fontSize 0.75}}{{else}}7.5{{/if}}px;
            margin-bottom: 12px;
            table-layout: auto;
        }

        th {
            background: {{#if styleConfig.headerBackgroundColor}}{{styleConfig.headerBackgroundColor}}{{else}}white{{/if}};
            color: {{#if styleConfig.headerTextColor}}{{styleConfig.headerTextColor}}{{else}}#2c2c2c{{/if}};
            padding: 4px 2px;
            text-align: center;
            border: {{#if styleConfig.tableBorderWidth}}{{styleConfig.tableBorderWidth}}{{else}}1{{/if}}px solid {{#if styleConfig.tableBorderColor}}{{styleConfig.tableBorderColor}}{{else}}#bbb{{/if}};
            font-weight: bold;
            line-height: 1.2;
            font-size: {{#if styleConfig.fontSize}}{{multiply styleConfig.fontSize 0.7}}{{else}}7{{/if}}px;
        }

        .ue-header { border-bottom: 2px solid #999; }

        td {
            padding: 3px 1px;
            border: {{#if styleConfig.tableBorderWidth}}{{styleConfig.tableBorderWidth}}{{else}}1{{/if}}px solid {{#if styleConfig.tableBorderColor}}{{styleConfig.tableBorderColor}}{{else}}#ddd{{/if}};
            text-align: center;
            font-size: {{#if styleConfig.fontSize}}{{multiply styleConfig.fontSize 0.75}}{{else}}7.5{{/if}}px;
            color: #333;
            background: white;
        }

        tbody tr:nth-child(even) td {
            background: {{#if styleConfig.alternateRowColor}}{{styleConfig.alternateRowColor}}{{else}}white{{/if}};
        }

        .student-name { text-transform: uppercase; /* student-name uppercase */
            text-align: left;
            font-weight: bold;
            padding-left: 3px;
            font-size: 7.5px;
            color: #2c2c2c;
            width: 8%;
        }

        .student-firstname {
            text-align: left;
            font-weight: bold;
            padding-left: 3px;
            font-size: 7.5px;
            color: #2c2c2c;
            width: 8%;
        }

        .decision-adm { color: #16a34a; font-weight: bold; }
        .decision-cmp { color: #2563eb; font-weight: bold; }
        .decision-aj { color: #dc2626; font-weight: bold; }
        .decision-inc { color: #9ca3af; font-weight: bold; }

        .decision-admitted { color: #16a34a; font-weight: bold; }
        .decision-compensated { color: #2563eb; font-weight: bold; }
        .decision-deferred { color: #dc2626; font-weight: bold; }
        .decision-repeat { color: #ea580c; font-weight: bold; }
        .decision-excluded { color: #7c2d12; font-weight: bold; }
        .decision-pending { color: #9ca3af; font-weight: bold; }

        .moyenne-finale { font-weight: bold; border-left: 2px solid #999; }
        .moyenne-ue { font-weight: bold; }

        .taux-reussite-row { background: white; font-weight: bold; }
        .taux-reussite-row td { text-align: center; font-size: 11px; padding: 8px; }

        .bottom-section { display: flex; justify-content: space-between; gap: 20px; margin-top: 12px; }
        .legend-info-wrapper { display: flex; gap: 15px; }

        .info-box { border: 1px solid #ccc; padding: 10px; font-size: 9px; min-width: 200px; }
        .info-box div { margin-bottom: 5px; }
        .info-box strong { color: #2c2c2c; }

        .legend-table { border: 1px solid #ccc; border-collapse: collapse; font-size: 7px; width: auto; }
        .legend-table td { border: 1px solid #ddd; padding: 3px 6px; text-align: left; }
        .legend-table td:nth-child(odd) { font-weight: bold; color: #2c2c2c; width: 40px; }

        .signatures { display: flex; justify-content: space-between; margin-top: 30px; }
        .signature-box { text-align: center; width: 30%; }
        .signature-line { font-size: 10px; color: #2c2c2c; font-weight: normal; }

        @media print {
            body { background: white; padding: 0; }
            .container { box-shadow: none; padding: 8mm; width: 297mm; }
            .container::before { color: rgba(200, 200, 200, 0.15); }
            table { border: 1px solid #ccc; font-size: 7.5px; }
            th { font-size: 7px; }
            td { font-size: 7.5px; color: #333; }
            .logo-box { border-style: solid; }
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
        <div class="content-wrapper">
            <div class="header">
                {{!-- Tutelle header: Pays / Devise / Ministère / Université / Faculté / Institut.
                     Center-affiliated programs use deliberation-template-center.html (picked by template-loader). --}}
                <div style="display:flex;justify-content:space-between;align-items: center;gap:12px;margin-bottom:8px;font-size:9px;line-height:1.4;text-align:center;">
                    <div style="flex:1">
                        {{country.fr}}<br>
                        <em>{{country.mottoFr}}</em><br>
                        ********************<br>
                        {{ministry.fr}}<br>
                        {{#if university.fr}}********************<br><strong>{{upper university.fr}}</strong><br>{{/if}}
                        {{#if faculty.fr}}********************<br><strong>{{upper faculty.fr}}</strong>{{#if faculty.postalBox}}<br>B.P. {{faculty.postalBox}}{{/if}}{{#if faculty.contactEmail}}<br>Email : {{faculty.contactEmail}}{{/if}}<br>{{/if}}
                        ********************<br>
                        <strong>{{upper institutionHeader.nameFr}}</strong>
                        {{#if institutionHeader.postalBox}}<br>********************<br>B.P. {{institutionHeader.postalBox}}{{/if}}
                        {{#if institutionHeader.contactEmail}}<br>Email : <a href="mailto:{{institutionHeader.contactEmail}}">{{institutionHeader.contactEmail}}</a>{{/if}}
                    </div>
                    <div style="display:flex;align-items:center;gap:10px;">
                        {{{logo svg=logos.universitySvg url=logos.university alt="University" style="max-height:60px;max-width:80px;object-fit:contain;"}}}
                        {{{logo svg=logos.facultySvg url=logos.faculty alt="Faculty" style="max-height:60px;max-width:80px;object-fit:contain;"}}}
                        {{{logo svg=logos.institutionSvg url=logos.institution alt="Institution" style="max-height:60px;max-width:80px;object-fit:contain;"}}}
                    </div>
                    <div style="flex:1">
                        {{country.en}}<br>
                        <em>{{country.mottoEn}}</em><br>
                        ********************<br>
                        {{ministry.en}}<br>
                        {{#if university.en}}********************<br><strong>{{upper university.en}}</strong><br>{{/if}}
                        {{#if faculty.en}}********************<br><strong>{{upper faculty.en}}</strong>{{#if faculty.postalBox}}<br>P.O. Box {{faculty.postalBox}}{{/if}}{{#if faculty.contactEmail}}<br>Email: {{faculty.contactEmail}}{{/if}}<br>{{/if}}
                        ********************<br>
                        <strong>{{upper institutionHeader.nameEn}}</strong>
                        {{#if institutionHeader.postalBox}}<br>********************<br>P.O. Box {{institutionHeader.postalBox}}{{/if}}
                        {{#if institutionHeader.contactEmail}}<br>Email: <a href="mailto:{{institutionHeader.contactEmail}}">{{institutionHeader.contactEmail}}</a>{{/if}}
                    </div>
                </div>
            </div>

            <div class="title">
                {{#if headerConfig.titleFr}}{{headerConfig.titleFr}}{{else}}PROCÈS-VERBAL DE DÉLIBÉRATION{{/if}}
                {{#if headerConfig.titleEn}} / {{headerConfig.titleEn}}{{else}} / DELIBERATION REPORT{{/if}}<br>
                {{#if deliberation.semesterName}}{{deliberation.semesterName}} - {{/if}}ANNÉE ACADÉMIQUE {{deliberation.academicYearName}}<br>
                ({{deliberation.programName}} — {{deliberation.className}})
                {{#if deliberation.date}}<br><span style="font-weight:normal; font-size:9px;">Date: {{deliberation.date}}</span>{{/if}}
            </div>

            {{#if jury.president}}
            <div class="jury-info">
                <strong>Président du jury:</strong> {{jury.president.name}} ({{jury.president.role}})
                {{#if jury.members.length}}
                &nbsp;|&nbsp; <strong>Membres:</strong>
                {{#each jury.members}}{{#if @index}}, {{/if}}{{name}}{{/each}}
                {{/if}}
            </div>
            {{/if}}

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
                        <td>{{formatNumber rank 2}}</td>
                        <td>{{registrationNumber}}</td>
                        <td class="student-name">{{upper firstName}} {{upper lastName}}</td>

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
                            <strong>Taux de Réussite: {{stats.successRate}}% — Admis cl. sup.: {{stats.admittedCount}} | Admis par comp.: {{stats.compensatedCount}} | Ajournés: {{stats.deferredCount}} | En attente: {{stats.pendingCount}}</strong>
                        </td>
                    </tr>
                </tbody>
            </table>

            <div class="bottom-section">
                <div class="legend-info-wrapper">
                    <table class="legend-table">
                        <tr>
                            <td>ADM:</td>
                            <td>UE Acquise (crédits obtenus)</td>
                            <td>CMP:</td>
                            <td>UE Compensée (crédits obtenus)</td>
                        </tr>
                        <tr>
                            <td>AJ:</td>
                            <td>UE Non acquise (crédits non obtenus)</td>
                            <td>INC:</td>
                            <td>UE Incomplète (notes manquantes)</td>
                        </tr>
                        <tr>
                            <td>MOY:</td>
                            <td>Moyenne</td>
                            <td>CRE:</td>
                            <td>Crédits</td>
                        </tr>
                        <tr>
                            <td>MAT:</td>
                            <td>Matricule</td>
                            <td>DEC:</td>
                            <td>Décision</td>
                        </tr>
                    </table>

                    <div class="info-box">
                        <div><strong>Programme / Program:</strong> {{deliberation.programName}}</div>
                        <div><strong>Classe:</strong> {{deliberation.className}}</div>
                        {{#if deliberation.semesterName}}
                        <div><strong>Semestre:</strong> {{deliberation.semesterName}}</div>
                        {{/if}}
                        <div><strong>Année académique / Academic Year:</strong> {{deliberation.academicYearName}}</div>
                        <div><strong>Moyenne générale de la classe:</strong> {{formatNumber stats.classAverage}}</div>
                        <div><strong>Étudiants inscrits:</strong> {{stats.totalStudents}}</div>
                    </div>
                </div>
            </div>

            <div class="signatures">
                {{#each signatures}}
                <div class="signature-box">
                    <div class="signature-line">{{position}}</div>
                    {{#if name}}
                    <div class="signature-name">{{name}}</div>
                    {{/if}}
                </div>
                {{/each}}
            </div>
        </div>
    </div>
</body>
</html>

`;

export const DELIBERATION_TEMPLATE_CENTER = /* html */ `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Procès-Verbal de Délibération</title>
    <style>
        @page {
            size: {{#if styleConfig.pageSize}}{{styleConfig.pageSize}}{{else}}A4{{/if}} {{#if styleConfig.pageOrientation}}{{styleConfig.pageOrientation}}{{else}}landscape{{/if}};
            margin: {{#if styleConfig.margins.top}}{{styleConfig.margins.top}}{{else}}8{{/if}}mm {{#if styleConfig.margins.right}}{{styleConfig.margins.right}}{{else}}8{{/if}}mm {{#if styleConfig.margins.bottom}}{{styleConfig.margins.bottom}}{{else}}8{{/if}}mm {{#if styleConfig.margins.left}}{{styleConfig.margins.left}}{{else}}8{{/if}}mm;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: {{#if styleConfig.fontFamily}}{{styleConfig.fontFamily}}{{else}}'Times New Roman', Times, serif{{/if}};
            font-size: {{#if styleConfig.fontSize}}{{styleConfig.fontSize}}{{else}}10{{/if}}px;
            background: #fafafa;
            padding: 10px;
            position: relative;
        }

        .container {
            width: 297mm;
            margin: 0 auto;
            background: white;
            padding: 10mm;
            box-shadow: 0 0 15px rgba(0,0,0,0.08);
            position: relative;
        }

        {{#if styleConfig.watermark.enabled}}
        .container::before {
            content: '{{styleConfig.watermark.text}}{{#if styleConfig.watermark.institutionName}} — {{styleConfig.watermark.institutionName}}{{/if}}';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate({{#if styleConfig.watermark.rotation}}{{styleConfig.watermark.rotation}}{{else}}-45{{/if}}deg);
            font-size: {{#if styleConfig.watermark.fontSize}}{{styleConfig.watermark.fontSize}}{{else}}120{{/if}}px;
            font-weight: bold;
            opacity: {{#if styleConfig.watermark.opacity}}{{styleConfig.watermark.opacity}}{{else}}0.10{{/if}};
            color: rgba(200, 200, 200, 1);
            z-index: 0;
            pointer-events: none;
        }
        {{#if styleConfig.watermark.logoUrl}}
        .container::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 60%;
            height: 60%;
            transform: translate(-50%, -50%);
            background-image: url('{{styleConfig.watermark.logoUrl}}');
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            opacity: 0.06;
            z-index: 0;
            pointer-events: none;
        }
        {{/if}}
        {{/if}}

        .content-wrapper { position: relative; z-index: 1; }

        .header {
            text-align: center;
            border-bottom: 2px solid #666;
            padding-bottom: 12px;
            margin-bottom: 12px;
        }

        .header h1 {
            font-size: {{#if styleConfig.headerFontSize}}{{styleConfig.headerFontSize}}{{else}}15{{/if}}px;
            color: {{#if styleConfig.primaryColor}}{{styleConfig.primaryColor}}{{else}}#2c2c2c{{/if}};
            margin-bottom: 3px;
            font-weight: bold;
        }

        .header h2 {
            font-size: {{#if styleConfig.headerFontSize}}{{multiply styleConfig.headerFontSize 0.87}}{{else}}13{{/if}}px;
            color: {{#if styleConfig.secondaryColor}}{{styleConfig.secondaryColor}}{{else}}#4a4a4a{{/if}};
            margin-bottom: 2px;
            font-weight: normal;
        }

        .logos {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 40px;
            margin: 12px 0;
        }

        .logo-box {
            width: 70px;
            height: 70px;
            border: 2px dashed #bbb;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-size: 9px;
            color: #999;
            text-align: center;
            padding: 5px;
        }

        .title {
            color: #2c2c2c;
            padding: 10px 0;
            text-align: center;
            margin-bottom: 12px;
            font-size: 11px;
            font-weight: bold;
        }

        .jury-info {
            margin-bottom: 12px;
            font-size: 9px;
            text-align: center;
        }

        .jury-info strong { color: #2c2c2c; }

        table {
            border: {{#if styleConfig.tableBorderWidth}}{{styleConfig.tableBorderWidth}}{{else}}1{{/if}}px solid {{#if styleConfig.tableBorderColor}}{{styleConfig.tableBorderColor}}{{else}}#ccc{{/if}};
            width: 100%;
            border-collapse: collapse;
            font-size: {{#if styleConfig.fontSize}}{{multiply styleConfig.fontSize 0.75}}{{else}}7.5{{/if}}px;
            margin-bottom: 12px;
            table-layout: auto;
        }

        th {
            background: {{#if styleConfig.headerBackgroundColor}}{{styleConfig.headerBackgroundColor}}{{else}}white{{/if}};
            color: {{#if styleConfig.headerTextColor}}{{styleConfig.headerTextColor}}{{else}}#2c2c2c{{/if}};
            padding: 4px 2px;
            text-align: center;
            border: {{#if styleConfig.tableBorderWidth}}{{styleConfig.tableBorderWidth}}{{else}}1{{/if}}px solid {{#if styleConfig.tableBorderColor}}{{styleConfig.tableBorderColor}}{{else}}#bbb{{/if}};
            font-weight: bold;
            line-height: 1.2;
            font-size: {{#if styleConfig.fontSize}}{{multiply styleConfig.fontSize 0.7}}{{else}}7{{/if}}px;
        }

        .ue-header { border-bottom: 2px solid #999; }

        td {
            padding: 3px 1px;
            border: {{#if styleConfig.tableBorderWidth}}{{styleConfig.tableBorderWidth}}{{else}}1{{/if}}px solid {{#if styleConfig.tableBorderColor}}{{styleConfig.tableBorderColor}}{{else}}#ddd{{/if}};
            text-align: center;
            font-size: {{#if styleConfig.fontSize}}{{multiply styleConfig.fontSize 0.75}}{{else}}7.5{{/if}}px;
            color: #333;
            background: white;
        }

        tbody tr:nth-child(even) td {
            background: {{#if styleConfig.alternateRowColor}}{{styleConfig.alternateRowColor}}{{else}}white{{/if}};
        }

        .student-name { text-transform: uppercase; /* student-name uppercase */
            text-align: left;
            font-weight: bold;
            padding-left: 3px;
            font-size: 7.5px;
            color: #2c2c2c;
            width: 8%;
        }

        .student-firstname {
            text-align: left;
            font-weight: bold;
            padding-left: 3px;
            font-size: 7.5px;
            color: #2c2c2c;
            width: 8%;
        }

        .decision-adm { color: #16a34a; font-weight: bold; }
        .decision-cmp { color: #2563eb; font-weight: bold; }
        .decision-aj { color: #dc2626; font-weight: bold; }
        .decision-inc { color: #9ca3af; font-weight: bold; }

        .decision-admitted { color: #16a34a; font-weight: bold; }
        .decision-compensated { color: #2563eb; font-weight: bold; }
        .decision-deferred { color: #dc2626; font-weight: bold; }
        .decision-repeat { color: #ea580c; font-weight: bold; }
        .decision-excluded { color: #7c2d12; font-weight: bold; }
        .decision-pending { color: #9ca3af; font-weight: bold; }

        .moyenne-finale { font-weight: bold; border-left: 2px solid #999; }
        .moyenne-ue { font-weight: bold; }

        .taux-reussite-row { background: white; font-weight: bold; }
        .taux-reussite-row td { text-align: center; font-size: 11px; padding: 8px; }

        .bottom-section { display: flex; justify-content: space-between; gap: 20px; margin-top: 12px; }
        .legend-info-wrapper { display: flex; gap: 15px; }

        .info-box { border: 1px solid #ccc; padding: 10px; font-size: 9px; min-width: 200px; }
        .info-box div { margin-bottom: 5px; }
        .info-box strong { color: #2c2c2c; }

        .legend-table { border: 1px solid #ccc; border-collapse: collapse; font-size: 7px; width: auto; }
        .legend-table td { border: 1px solid #ddd; padding: 3px 6px; text-align: left; }
        .legend-table td:nth-child(odd) { font-weight: bold; color: #2c2c2c; width: 40px; }

        .signatures { display: flex; justify-content: space-between; margin-top: 30px; }
        .signature-box { text-align: center; width: 30%; }
        .signature-line { font-size: 10px; color: #2c2c2c; font-weight: normal; }

        @media print {
            body { background: white; padding: 0; }
            .container { box-shadow: none; padding: 8mm; width: 297mm; }
            .container::before { color: rgba(200, 200, 200, 0.15); }
            table { border: 1px solid #ccc; font-size: 7.5px; }
            th { font-size: 7px; }
            td { font-size: 7.5px; color: #333; }
            .logo-box { border-style: solid; }
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
        <div class="content-wrapper">
            <div class="header">
                {{!-- Center-only header — same 3-col layout as the standard variant.
                     Sources strictly from the centers tables (centers, center_administrative_instances, center_legal_texts).
                     No tutelle / faculty / university. --}}
                <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:8px;font-size:9px;line-height:1.4;text-align:center;">
                    <div style="flex:1">
                        {{country.fr}}<br>
                        <em>{{country.mottoFr}}</em><br>
                        ********************<br>
                        {{#each center.administrativeInstances}}
                        <strong>{{upper this.nameFr}}{{#if this.acronymFr}} ({{this.acronymFr}}){{/if}}</strong><br>
                        ********************<br>
                        {{/each}}
                        <strong>{{upper center.name}}</strong>
                        {{#if center.postalBox}}<br>********************<br>B.P. {{center.postalBox}}{{/if}}
                        {{#if center.contactEmail}}<br>Email : <a href="mailto:{{center.contactEmail}}">{{center.contactEmail}}</a>{{/if}}
                    </div>
                    <div style="display:flex;flex-direction:row;flex-wrap:wrap;align-items:center;justify-content:center;gap:10px;">
                        {{{logo svg=center.logoSvg url=center.logoUrl alt=center.name style="max-height:80px;max-width:120px;object-fit:contain;"}}}
                        {{#each center.administrativeInstances}}
                            {{#if (or this.logoSvg this.logoUrl)}}
                            {{{logo svg=this.logoSvg url=this.logoUrl alt=this.nameFr style="max-height:50px;max-width:80px;object-fit:contain;"}}}
                            {{/if}}
                        {{/each}}
                    </div>
                    <div style="flex:1">
                        {{country.en}}<br>
                        <em>{{country.mottoEn}}</em><br>
                        ********************<br>
                        {{#each center.administrativeInstances}}
                        <strong>{{upper this.nameEn}}{{#if this.acronymEn}} ({{this.acronymEn}}){{/if}}</strong><br>
                        ********************<br>
                        {{/each}}
                        {{#if center.nameEn}}<strong>{{upper center.nameEn}}</strong>{{else}}<strong>{{upper center.name}}</strong>{{/if}}
                        {{#if center.postalBox}}<br>********************<br>P.O. Box {{center.postalBox}}{{/if}}
                        {{#if center.contactEmail}}<br>Email: <a href="mailto:{{center.contactEmail}}">{{center.contactEmail}}</a>{{/if}}
                    </div>
                </div>
                {{#if center.authorizationOrderFr}}
                <div style="font-size:9px;color:#444;font-style:italic;padding:4px 6px;margin:4px auto 0;text-align:center;border-top:1px dotted #999;display:inline-block;">
                    {{center.authorizationOrderFr}}{{#if center.authorizationOrderEn}} / {{center.authorizationOrderEn}}{{/if}}
                </div>
                {{/if}}
                {{#if center.legalTexts.length}}
                <div style="font-size:8px;color:#555;margin:6px 0;padding-top:4px;border-top:1px dotted #aaa;text-align:center;line-height:1.4;">
                    {{#each center.legalTexts}}
                    <div>{{textFr}} / <span style="font-style:italic">{{textEn}}</span></div>
                    {{/each}}
                </div>
                {{/if}}
            </div>

            <div class="title">
                {{#if headerConfig.titleFr}}{{headerConfig.titleFr}}{{else}}PROCÈS-VERBAL DE DÉLIBÉRATION{{/if}}
                {{#if headerConfig.titleEn}} / {{headerConfig.titleEn}}{{else}} / DELIBERATION REPORT{{/if}}<br>
                {{#if deliberation.semesterName}}{{deliberation.semesterName}} - {{/if}}ANNÉE ACADÉMIQUE {{deliberation.academicYearName}}<br>
                ({{deliberation.programName}} — {{deliberation.className}})
                {{#if deliberation.date}}<br><span style="font-weight:normal; font-size:9px;">Date: {{deliberation.date}}</span>{{/if}}
            </div>

            {{#if jury.president}}
            <div class="jury-info">
                <strong>Président du jury:</strong> {{jury.president.name}} ({{jury.president.role}})
                {{#if jury.members.length}}
                &nbsp;|&nbsp; <strong>Membres:</strong>
                {{#each jury.members}}{{#if @index}}, {{/if}}{{name}}{{/each}}
                {{/if}}
            </div>
            {{/if}}

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
                        <td>{{formatNumber rank 2}}</td>
                        <td>{{registrationNumber}}</td>
                        <td class="student-name">{{upper firstName}} {{upper lastName}}</td>

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
                            <strong>Taux de Réussite: {{stats.successRate}}% — Admis cl. sup.: {{stats.admittedCount}} | Admis par comp.: {{stats.compensatedCount}} | Ajournés: {{stats.deferredCount}} | En attente: {{stats.pendingCount}}</strong>
                        </td>
                    </tr>
                </tbody>
            </table>

            <div class="bottom-section">
                <div class="legend-info-wrapper">
                    <table class="legend-table">
                        <tr>
                            <td>ADM:</td>
                            <td>UE Acquise (crédits obtenus)</td>
                            <td>CMP:</td>
                            <td>UE Compensée (crédits obtenus)</td>
                        </tr>
                        <tr>
                            <td>AJ:</td>
                            <td>UE Non acquise (crédits non obtenus)</td>
                            <td>INC:</td>
                            <td>UE Incomplète (notes manquantes)</td>
                        </tr>
                        <tr>
                            <td>MOY:</td>
                            <td>Moyenne</td>
                            <td>CRE:</td>
                            <td>Crédits</td>
                        </tr>
                        <tr>
                            <td>MAT:</td>
                            <td>Matricule</td>
                            <td>DEC:</td>
                            <td>Décision</td>
                        </tr>
                    </table>

                    <div class="info-box">
                        <div><strong>Programme / Program:</strong> {{deliberation.programName}}</div>
                        <div><strong>Classe:</strong> {{deliberation.className}}</div>
                        {{#if deliberation.semesterName}}
                        <div><strong>Semestre:</strong> {{deliberation.semesterName}}</div>
                        {{/if}}
                        <div><strong>Année académique / Academic Year:</strong> {{deliberation.academicYearName}}</div>
                        <div><strong>Moyenne générale de la classe:</strong> {{formatNumber stats.classAverage}}</div>
                        <div><strong>Étudiants inscrits:</strong> {{stats.totalStudents}}</div>
                    </div>
                </div>
            </div>

            <div class="signatures">
                {{#each signatures}}
                <div class="signature-box">
                    <div class="signature-line">{{position}}</div>
                    {{#if name}}
                    <div class="signature-name">{{name}}</div>
                    {{/if}}
                </div>
                {{/each}}
            </div>
        </div>
    </div>
</body>
</html>

`;
