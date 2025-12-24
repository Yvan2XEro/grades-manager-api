# Système d'Export de Notes et PV

## Vue d'ensemble

Le système d'export permet de générer des documents PDF et HTML pour :
- **PV (Procès-Verbal)** : Relevé de notes complet pour une classe/semestre
- **Publication d'Évaluation** : Résultats d'un examen spécifique
- **Publication UE** : Résultats d'une Unité d'Enseignement

## Architecture

### Structure des fichiers

```
apps/server/src/
├── modules/exports/
│   ├── index.ts                  # Point d'entrée du module
│   ├── exports.router.ts         # Routes tRPC
│   ├── exports.service.ts        # Logique métier
│   ├── exports.repo.ts           # Accès aux données
│   ├── exports.zod.ts            # Schémas de validation
│   └── template-helper.ts        # Helpers pour templates
├── config/
│   └── export-config.json        # Configuration institutionnelle
└── modules/exports/templates/
    ├── pv-template.html           # Template PV
    ├── evaluation-publication.html # Template évaluation
    └── teaching-unit-publication.html # Template UE
```

## Configuration

### Fichier `export-config.json`

Ce fichier contient toutes les informations institutionnelles et de configuration :

```json
{
  "institution": {
    "university": {
      "name_fr": "UNIVERSITÉ DE [NOM]",
      "name_en": "UNIVERSITY OF [NAME]",
      "logo_url": "/logos/university.png"
    },
    "faculty": {
      "name_fr": "FACULTÉ DE...",
      "name_en": "FACULTY OF...",
      "logo_url": "/logos/faculty.png"
    },
    "institute": {
      "name_fr": "INSTITUT...",
      "name_en": "INSTITUTE...",
      "logo_url": "/logos/ipes.png"
    }
  },
  "grading": {
    "appreciations": [...],
    "passing_grade": 10,
    "scale": 20
  },
  "signatures": {
    "pv": [...],
    "evaluation": [...],
    "ue": [...]
  }
}
```

**Pour personnaliser** : Modifiez les valeurs dans ce fichier JSON.

## Utilisation via tRPC

### 1. Prévisualiser un PV (HTML)

```typescript
const html = await trpc.exports.previewPV.query({
  classId: "class-id",
  semesterId: "semester-id",
  academicYearId: "academic-year-id"
});
```

### 2. Générer un PV (PDF)

```typescript
const result = await trpc.exports.generatePV.mutate({
  classId: "class-id",
  semesterId: "semester-id",
  academicYearId: "academic-year-id",
  format: "pdf"
});

// result.content contient le PDF en base64
const pdfBlob = new Blob(
  [Buffer.from(result.content, 'base64')],
  { type: 'application/pdf' }
);
```

### 3. Prévisualiser une évaluation (HTML)

```typescript
const html = await trpc.exports.previewEvaluation.query({
  examId: "exam-id",
  observations: "Observations de l'enseignant..."
});
```

### 4. Générer une évaluation (PDF)

```typescript
const result = await trpc.exports.generateEvaluation.mutate({
  examId: "exam-id",
  format: "pdf",
  observations: "Observations..."
});
```

### 5. Prévisualiser une UE (HTML)

```typescript
const html = await trpc.exports.previewUE.query({
  teachingUnitId: "ue-id",
  classId: "class-id",
  semesterId: "semester-id",
  academicYearId: "academic-year-id"
});
```

### 6. Générer une UE (PDF)

```typescript
const result = await trpc.exports.generateUE.mutate({
  teachingUnitId: "ue-id",
  classId: "class-id",
  semesterId: "semester-id",
  academicYearId: "academic-year-id",
  format: "pdf"
});
```

## Données calculées automatiquement

Le système calcule automatiquement :

### Pour chaque étudiant
- **Moyennes CC et EX** : Calculées à partir des notes d'examen
- **Moyenne par EC** : Pondération CC/EX selon pourcentage
- **Moyenne par UE** : Moyenne des EC de l'UE
- **Décision** : "Ac" (Acquis) si moyenne ≥ 10, sinon "Nac"
- **Crédits obtenus** : Crédits de l'UE si acquise, 0 sinon
- **Moyenne générale** : Moyenne de toutes les UEs
- **Décision finale** : "ACQUIS" ou "NON ACQUIS"

### Statistiques globales
- **Taux de réussite** : Pourcentage d'étudiants ayant réussi
- **Présents/Absents** : Comptage automatique
- **Note la plus haute/basse** : Pour les évaluations
- **Moyenne générale** : Pour les évaluations

### Appréciations
Basées sur les seuils configurés :
- Excellent : ≥ 16
- Très Bien : 14-15.99
- Bien : 12-13.99
- Assez Bien : 10-11.99
- Passable : 8-9.99
- Insuffisant : < 8

## Permissions

Les endpoints d'export utilisent `gradingProcedure`, donc accessible aux :
- Enseignants (teachers)
- Administrateurs (administrator, dean, super_admin)

## Flux de données

```
┌─────────────────┐
│  Frontend UI    │
│  (React)        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  tRPC Router    │
│  exports.*      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  ExportsService │
│  - processPVData│
│  - processUEData│
└────────┬────────┘
         │
         ├────────────────────┐
         ▼                    ▼
┌─────────────────┐  ┌──────────────────┐
│  ExportsRepo    │  │  Template Helper │
│  - Fetch data   │  │  - Load config   │
│    from DB      │  │  - Load templates│
└─────────────────┘  └──────────────────┘
         │                    │
         └────────┬───────────┘
                  ▼
         ┌─────────────────┐
         │   Handlebars    │
         │   Compilation   │
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │   Puppeteer     │
         │   PDF Gen       │
         └─────────────────┘
```

## Adaptation des templates HTML

Les templates HTML utilisent Handlebars comme moteur de template.

### Variables disponibles dans les templates

#### Template PV (`pv template.html`)
```handlebars
{{university.name_fr}}
{{faculty.name_fr}}
{{institute.name_fr}}
{{program.name}}
{{program.level}}
{{semester}}
{{academicYear}}

{{#each ues}}
  {{code}} - {{name}}
  {{#each courses}}
    {{code}} - {{name}}
  {{/each}}
{{/each}}

{{#each students}}
  {{number}} {{lastName}} {{firstName}} {{registrationNumber}}
  {{generalAverage}}
  {{overallDecision}}
{{/each}}

{{globalSuccessRate}}%
```

#### Template Évaluation (`publication_evaluation.html`)
```handlebars
{{evaluationType}}
{{course.code}} - {{course.name}}
{{teachingUnit.code}} - {{teachingUnit.name}}
{{program.name}} - {{program.level}}
{{examDate}}
{{duration}}
{{coefficient}}

{{#each students}}
  {{number}} {{lastName}} {{firstName}}
  {{formatNumber score}}
  {{getAppreciation score}}
  {{getObservation score}}
{{/each}}

{{stats.count}}
{{stats.present}}
{{stats.absent}}
{{formatNumber stats.average}}
{{stats.successRate}}%
```

## Prochaines étapes

Pour finaliser le système :

1. **Adapter les templates HTML** : Remplacer les placeholders `[XXX]` par les variables Handlebars
2. **Ajouter les logos** : Placer les logos dans un dossier accessible
3. **Tester avec des données réelles** : Créer des tests d'intégration
4. **Interface frontend** : Créer les composants React pour la prévisualisation et l'export

## Dépannage

### PDF ne se génère pas
- Vérifier que Puppeteer est installé : `bun pm ls | grep puppeteer`
- Sur certains systèmes, des dépendances système peuvent être nécessaires

### Template ne s'affiche pas correctement
- Vérifier que les chemins des templates sont corrects
- Vérifier les logs pour les erreurs Handlebars

### Données manquantes
- Vérifier que les relations Drizzle sont bien définies
- Vérifier que les données existent en BD pour l'ID fourni
