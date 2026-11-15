# Grade and PV Export System

## Overview

The export system generates PDF and HTML documents for:
- **PV (Procès-Verbal, official minutes)**: Full grade report for a class/semester
- **Evaluation publication**: Results of a specific exam
- **UE publication**: Results of a Teaching Unit (UE)

## Architecture

### File structure

```
apps/server/src/
├── modules/exports/
│   ├── index.ts                  # Module entry point
│   ├── exports.router.ts         # tRPC routes
│   ├── exports.service.ts        # Business logic
│   ├── exports.repo.ts           # Data access
│   ├── exports.zod.ts            # Validation schemas
│   └── template-helper.ts        # Template helpers
├── config/
│   └── export-config.json        # Institutional configuration
└── modules/exports/templates/
    ├── pv-template.html           # Template PV
    ├── evaluation-publication.html # Evaluation template
    └── teaching-unit-publication.html # UE template
```

## Configuration

### `export-config.json` file

This file contains all institutional and configuration information:

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

**To customize**: Edit the values in this JSON file.

## Usage via tRPC

### 1. Preview a PV (HTML)

```typescript
const html = await trpc.exports.previewPV.query({
  classId: "class-id",
  semesterId: "semester-id",
  academicYearId: "academic-year-id"
});
```

### 2. Generate a PV (PDF)

```typescript
const result = await trpc.exports.generatePV.mutate({
  classId: "class-id",
  semesterId: "semester-id",
  academicYearId: "academic-year-id",
  format: "pdf"
});

// result.content contains the PDF as base64
const pdfBlob = new Blob(
  [Buffer.from(result.content, 'base64')],
  { type: 'application/pdf' }
);
```

### 3. Preview an evaluation (HTML)

```typescript
const html = await trpc.exports.previewEvaluation.query({
  examId: "exam-id",
  observations: "Observations de l'enseignant..."
});
```

### 4. Generate an evaluation (PDF)

```typescript
const result = await trpc.exports.generateEvaluation.mutate({
  examId: "exam-id",
  format: "pdf",
  observations: "Observations..."
});
```

### 5. Preview a UE (HTML)

```typescript
const html = await trpc.exports.previewUE.query({
  teachingUnitId: "ue-id",
  classId: "class-id",
  semesterId: "semester-id",
  academicYearId: "academic-year-id"
});
```

### 6. Generate a UE (PDF)

```typescript
const result = await trpc.exports.generateUE.mutate({
  teachingUnitId: "ue-id",
  classId: "class-id",
  semesterId: "semester-id",
  academicYearId: "academic-year-id",
  format: "pdf"
});
```

## Automatically computed data

The system automatically computes:

### For each student
- **CC and EX averages**: Computed from the exam grades
- **Average per EC**: CC/EX weighting by percentage
- **Average per UE**: Average of the UE's ECs
- **Decision**: "Ac" (Acquis, passed) if average ≥ 10, otherwise "Nac"
- **Credits earned**: The UE's credits if passed, 0 otherwise
- **Overall average**: Average of all UEs
- **Final decision**: "VALIDÉ" (all semester credits earned) or "NON VALIDÉ"

### Overall statistics
- **Success rate**: Percentage of students who passed
- **Present/Absent**: Automatic count
- **Highest/lowest grade**: For evaluations
- **Overall average**: For evaluations

### Appreciations
Based on the configured thresholds:
- "Excellent" (excellent): ≥ 16
- "Très Bien" (very good): 14-15.99
- "Bien" (good): 12-13.99
- "Assez Bien" (fairly good): 10-11.99
- "Passable" (pass): 8-9.99
- "Insuffisant" (insufficient): < 8

## Permissions

The export endpoints use `gradingProcedure`, so they are accessible to:
- Teachers (teachers)
- Administrators (administrator, dean, super_admin)

## Data flow

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

## Adapting the HTML templates

The HTML templates use Handlebars as their template engine.

### Variables available in the templates

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

#### Evaluation template (`publication_evaluation.html`)
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

## Next steps

To finalize the system:

1. **Adapt the HTML templates**: Replace the `[XXX]` placeholders with Handlebars variables
2. **Add the logos**: Put the logos in an accessible folder
3. **Test with real data**: Write integration tests
4. **Frontend UI**: Build the React components for preview and export

## Troubleshooting

### PDF is not generated
- Check that Puppeteer is installed: `bun pm ls | grep puppeteer`
- Some systems may need additional system dependencies

### Template does not render correctly
- Check that the template paths are correct
- Check the logs for Handlebars errors

### Missing data
- Check that the Drizzle relations are properly defined
- Check that the data exists in the DB for the given ID
