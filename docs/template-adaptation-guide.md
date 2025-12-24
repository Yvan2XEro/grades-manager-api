# Guide d'Adaptation des Templates HTML avec Handlebars

## Vue d'ensemble

Les templates HTML actuels utilisent des placeholders manuels comme `[NOM]`, `[XXX]`, etc.
Ce guide montre comment les remplacer par des variables Handlebars dynamiques.

## Syntaxe Handlebars de Base

### Variables simples
```handlebars
<!-- Avant -->
<h1>UNIVERSITÉ DE [NOM]</h1>

<!-- Après -->
<h1>{{university.name_fr}}</h1>
```

### Boucles
```handlebars
<!-- Avant -->
<tr>
  <td>1</td>
  <td>[NOM 1]</td>
  <td>[PRÉNOM 1]</td>
</tr>
<tr>
  <td>2</td>
  <td>[NOM 2]</td>
  <td>[PRÉNOM 2]</td>
</tr>

<!-- Après -->
{{#each students}}
<tr>
  <td>{{number}}</td>
  <td>{{lastName}}</td>
  <td>{{firstName}}</td>
</tr>
{{/each}}
```

### Conditionnels
```handlebars
{{#if watermark.enabled}}
  <div class="watermark">{{watermark.text}}</div>
{{/if}}

{{#if (eq decision "Ac")}}
  <td class="acquis">Acquis</td>
{{else}}
  <td class="non-acquis">Non Acquis</td>
{{/if}}
```

### Helpers personnalisés
```handlebars
<!-- Formater un nombre avec virgule française -->
{{formatNumber score}}        <!-- Affiche: 15,75 -->

<!-- Obtenir l'appréciation automatiquement -->
{{getAppreciation score}}     <!-- Affiche: Très Bien -->

<!-- Obtenir l'observation -->
{{getObservation score}}      <!-- Affiche: Admis ou Ajourné -->
```

## Template PV : Exemple d'Adaptation

### 1. En-tête

**Avant :**
```html
<div class="header">
  <h1>UNIVERSITÉ DE [NOM] / UNIVERSITY OF [NAME]</h1>
  <h2>FACULTÉ DE MÉDECINE ET DES SCIENCES PHARMACEUTIQUES</h2>
  <h2>FACULTY OF MEDICINE AND PHARMACEUTICAL SCIENCES</h2>

  <div class="logos">
    <div class="logo-box">
      <div>LOGO</div>
      <div>UNIVERSITÉ</div>
    </div>
  </div>

  <h3>INSTITUT SUPÉRIEUR DES ÉTUDES PARAMÉDICALES DE LA CROIX-ROUGE CAMEROUNAISE</h3>
</div>
```

**Après :**
```handlebars
<div class="header">
  <h1>{{university.name_fr}} / {{university.name_en}}</h1>
  <h2>{{faculty.name_fr}}</h2>
  <h2>{{faculty.name_en}}</h2>

  <div class="logos">
    <div class="logo-box">
      <img src="{{university.logo_url}}" alt="Logo Université" />
    </div>
    <div class="logo-box">
      <img src="{{faculty.logo_url}}" alt="Logo Faculté" />
    </div>
    <div class="logo-box">
      <img src="{{institute.logo_url}}" alt="Logo IPES" />
    </div>
  </div>

  <h3>{{institute.name_fr}}</h3>
  <h3>{{institute.name_en}}</h3>
</div>
```

### 2. Titre du document

**Avant :**
```html
<div class="title">
  PROCÈS-VERBAL DES RÉSULTATS DU SEMESTRE [N°] POUR LE COMPTE DE L'ANNÉE ACADÉMIQUE [ANNÉE]<br>
  ([NOM DU PROGRAMME] NIVEAU [N°])
</div>
```

**Après :**
```handlebars
<div class="title">
  PROCÈS-VERBAL DES RÉSULTATS DU {{semester}} POUR LE COMPTE DE L'ANNÉE ACADÉMIQUE {{academicYear}}<br>
  ({{program.name}} {{program.level}})
</div>
```

### 3. En-têtes de tableau (UEs dynamiques)

**Avant :**
```html
<thead>
  <tr>
    <th rowspan="3">N°</th>
    <th rowspan="3">NOM</th>
    <th rowspan="3">PRÉNOM</th>
    <th rowspan="3">MAT</th>

    <!-- UE 1 -->
    <th colspan="13" class="ue-header">UE [CODE] : [NOM UE 1]</th>

    <!-- UE 2 -->
    <th colspan="6" class="ue-header">UE [CODE] : [NOM UE 2]</th>
  </tr>
</thead>
```

**Après :**
```handlebars
<thead>
  <tr>
    <th rowspan="3">N°</th>
    <th rowspan="3">NOM</th>
    <th rowspan="3">PRÉNOM</th>
    <th rowspan="3">MAT</th>

    {{#each ues}}
      <!-- Le colspan dépend du nombre de cours dans l'UE -->
      <th colspan="{{add (multiply courses.length 3) 7}}" class="ue-header">
        UE {{code}} : {{name}}
      </th>
    {{/each}}

    <th rowspan="3">TOTAL CRE</th>
    <th rowspan="3">MOY GEN</th>
    <th rowspan="3">BILAN</th>
  </tr>

  <tr>
    {{#each ues}}
      {{#each courses}}
        <th colspan="3" class="ec-header">EC {{code}}<br>{{name}}</th>
      {{/each}}
      <th colspan="7" class="ec-header">BILAN UE</th>
    {{/each}}
  </tr>

  <tr>
    {{#each ues}}
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
    {{/each}}
  </tr>
</thead>
```

### 4. Lignes d'étudiants

**Avant :**
```html
<tbody>
  <tr>
    <td>1</td>
    <td class="student-name">[NOM 1]</td>
    <td class="student-firstname">[PRÉNOM 1]</td>
    <td>[MAT]</td>

    <!-- UE 1 - EC1 -->
    <td>XX,X</td>
    <td>XX,X</td>
    <td>XX,X</td>

    <!-- ... -->

    <td>XX</td>
    <td class="moyenne-finale">XX,X</td>
    <td class="acquis">ACQUIS</td>
  </tr>
</tbody>
```

**Après :**
```handlebars
<tbody>
  {{#each students}}
  <tr>
    <td>{{number}}</td>
    <td class="student-name">{{lastName}}</td>
    <td class="student-firstname">{{firstName}}</td>
    <td>{{registrationNumber}}</td>

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
      <td>{{successRate}}%</td>
      <td class="moyenne-ue">{{formatNumber average}}</td>
      <td class="{{#if (eq decision 'Ac')}}acquis{{else}}non-acquis{{/if}}">{{decision}}</td>
      <td>{{credits}}</td>
    {{/each}}

    <td>{{totalCredits}}</td>
    <td class="moyenne-finale">{{formatNumber generalAverage}}</td>
    <td class="{{#if (eq overallDecision 'ACQUIS')}}acquis{{else}}non-acquis{{/if}}">
      {{overallDecision}}
    </td>
  </tr>
  {{/each}}

  <tr class="taux-reussite-row">
    <td colspan="45" style="border-top: 2px solid #666;">
      <strong>Taux de Réussite (TR): {{globalSuccessRate}}%</strong>
    </td>
  </tr>
</tbody>
```

### 5. Signatures

**Avant :**
```html
<div class="signatures">
  <div class="signature-box">
    <div class="signature-line">Le Rapporteur</div>
  </div>
  <div class="signature-box">
    <div class="signature-line">Les Membres du Jury</div>
  </div>
  <div class="signature-box">
    <div class="signature-line">Le Président du Jury</div>
  </div>
</div>
```

**Après :**
```handlebars
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
```

## Template Évaluation : Exemple d'Adaptation

### Informations sur l'évaluation

**Avant :**
```html
<div class="eval-info">
  <div><strong>Type d'évaluation:</strong> [CC / TPE / TP / EXAMEN / RATTRAPAGE]</div>
  <div><strong>Code EC:</strong> [CODE EC]</div>
  <div><strong>Intitulé EC:</strong> [INTITULÉ COMPLET DE L'EC]</div>
  <div><strong>Code UE:</strong> [CODE UE] - [INTITULÉ UE]</div>
  <div><strong>Programme:</strong> [NOM DU PROGRAMME] - Niveau [N°]</div>
  <div><strong>Date de l'évaluation:</strong> [JJ/MM/AAAA]</div>
  <div><strong>Durée:</strong> [X] heures</div>
  <div><strong>Coefficient:</strong> [X]</div>
  <div><strong>Note sur:</strong> [20 / 10 / 100]</div>
</div>
```

**Après :**
```handlebars
<div class="eval-info">
  <div><strong>Type d'évaluation:</strong> {{evaluationType}} - {{evaluationLabel}}</div>
  <div><strong>Code EC:</strong> {{course.code}}</div>
  <div><strong>Intitulé EC:</strong> {{course.name}}</div>
  <div><strong>Code UE:</strong> {{teachingUnit.code}} - {{teachingUnit.name}}</div>
  <div><strong>Programme:</strong> {{program.name}} - {{program.level}}</div>
  <div><strong>Date de l'évaluation:</strong> {{examDate}}</div>
  <div><strong>Durée:</strong> {{duration}} heures</div>
  <div><strong>Coefficient:</strong> {{coefficient}}</div>
  <div><strong>Note sur:</strong> {{scale}}</div>
</div>
```

### Tableau des notes

**Avant :**
```html
<tbody>
  <tr>
    <td>1</td>
    <td class="student-name">[NOM 1]</td>
    <td class="student-firstname">[PRÉNOM 1]</td>
    <td>[MAT]</td>
    <td class="note-cell">XX,XX</td>
    <td>[Excellent / Très Bien / Bien / Assez Bien / Passable / Insuffisant]</td>
    <td>[Admis / Ajourné / Absent]</td>
  </tr>
</tbody>
```

**Après :**
```handlebars
<tbody>
  {{#each students}}
  <tr>
    <td>{{number}}</td>
    <td class="student-name">{{lastName}}</td>
    <td class="student-firstname">{{firstName}}</td>
    <td>{{registrationNumber}}</td>
    <td class="note-cell">{{formatNumber score}}</td>
    <td>{{appreciation}}</td>
    <td>{{observation}}</td>
  </tr>
  {{/each}}
</tbody>
```

### Statistiques

**Avant :**
```html
<div class="stats-section">
  <div class="stat-item">
    <div class="stat-label">Nombre d'étudiants</div>
    <div class="stat-value">[XX]</div>
  </div>
  <div class="stat-item">
    <div class="stat-label">Présents</div>
    <div class="stat-value">[XX]</div>
  </div>
  <div class="stat-item">
    <div class="stat-label">Moyenne générale</div>
    <div class="stat-value">[XX,XX] / 20</div>
  </div>
</div>
```

**Après :**
```handlebars
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
```

### Observations

**Avant :**
```html
<div class="observation">
  <strong>Observations générales:</strong><br>
  [Espace pour les observations de l'enseignant]
</div>
```

**Après :**
```handlebars
{{#if observations}}
<div class="observation">
  <strong>Observations générales:</strong><br>
  {{observations}}
</div>
{{/if}}
```

## Checklist d'Adaptation

Pour chaque template, suivre ces étapes :

- [ ] **En-tête**
  - [ ] Remplacer noms université/faculté/institut
  - [ ] Ajouter chemins des logos
  - [ ] Adapter noms en FR et EN

- [ ] **Titre/Informations**
  - [ ] Programme, niveau, semestre
  - [ ] Année académique
  - [ ] Dates et informations spécifiques

- [ ] **Tableau principal**
  - [ ] Boucle sur les étudiants
  - [ ] Boucle sur les UEs/Cours (si applicable)
  - [ ] Formater les nombres avec `formatNumber`
  - [ ] Utiliser les helpers pour appréciations

- [ ] **Statistiques**
  - [ ] Remplacer tous les `[XX]` par variables
  - [ ] Utiliser `formatNumber` pour les décimales

- [ ] **Signatures**
  - [ ] Boucle sur le tableau de signatures
  - [ ] Affichage conditionnel du nom

- [ ] **Watermark**
  - [ ] Utiliser `{{watermark.text}}`
  - [ ] Conditionnel `{{#if watermark.enabled}}`

## Helpers Handlebars Disponibles

```handlebars
<!-- Formater un nombre (XX,XX) -->
{{formatNumber 15.75}}              <!-- Affiche: 15,75 -->
{{formatNumber null}}               <!-- Affiche: ABS -->

<!-- Appréciation automatique -->
{{getAppreciation 16.5}}            <!-- Affiche: Excellent -->

<!-- Observation automatique -->
{{getObservation 12}}               <!-- Affiche: Admis -->
{{getObservation 8}}                <!-- Affiche: Ajourné -->
{{getObservation null}}             <!-- Affiche: Absent -->

<!-- Comparaisons -->
{{#if (eq value "test")}}...{{/if}}
{{#if (gt score 10)}}...{{/if}}

<!-- Arithmétique -->
{{add 3 5}}                         <!-- Affiche: 8 -->
```

## Test de votre Template

Une fois adapté, testez avec :

```bash
# Lancer le serveur
bun dev:server

# Tester la prévisualisation
curl http://localhost:3000/trpc/exports.previewPV?input={"classId":"...","semesterId":"...","academicYearId":"..."}
```

Ou directement dans le frontend avec le composant de prévisualisation.

## Ressources

- Documentation Handlebars : https://handlebarsjs.com/
- Variables disponibles : `docs/exports.md`
- Exemples de code : `docs/export-ui-example.tsx`
