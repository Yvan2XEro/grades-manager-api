# Data Import Hub — Design Spec

**Date:** 2026-07-31

## Goal

Allow institution administrators to import all their data (academic structure, people, enrollments, grades) via downloadable Excel templates, without touching the CLI or YAML files.

## Architecture

**Flow:** Download template → Fill in Excel → Upload → Preview (batch job dry-run) → Confirm → Commit.

File upload stores the file server-side and returns a `fileId`. A batch job receives `{ fileId, options }`, parses the file in step 0, validates in step 1, and creates records in step 2+. The existing `batchJobs.preview → run → rollback` framework handles orchestration unchanged.

## Tech Stack

- **Backend runtime:** Bun
- **Excel parsing/generation:** `exceljs` (add as dependency)
- **CSV fallback:** built-in string parsing (no extra lib)
- **API:** tRPC + REST for template download and file upload
- **Storage:** existing `STORAGE_DRIVER=local` (same as attendance justification uploads)
- **Batch framework:** existing `BATCH_JOB_TYPES` + `BatchJobDefinition<TParams>`
- **Frontend:** React + TanStack Query + shadcn/ui (existing patterns)

## Import Types & Dependency Order

Imports must respect the following dependency graph. The UI presents them as 4 tabs in this order:

```
1. Structure académique   →  programmes, UEs, cours, classes
2. Personnes              →  enseignants, étudiants
3. Inscriptions           →  étudiant → classe × année académique
4. Notes (bulk)           →  notes multi-examens
```

Multi-year: every template has an `academicYearCode` column. One file can mix multiple years.

## Excel Templates

Each template is generated dynamically by the server (`GET /api/import/template/:type`). It contains:

- **Row 1:** Column headers (bold, colored header row)
- **Row 2:** Example row (grayed, italic)
- **Sheet "Références"** (hidden): existing institution codes (programmes, cycles, années, classes) for VLOOKUP / data validation
- **Formula suggestions:** Code columns pre-filled with formula (e.g. `=UPPER(LEFT(SUBSTITUTE(A2," ",""),4))`) — editable by user
- **Data validation:** Enum columns (gender `H`/`F`, status `active`/`graduated`, exam type `CC`/`FINAL`/`TP`) have Excel dropdown validation

### Template columns per type

#### `academic-structure` (one row = one class or one course, discriminated by `entityType`)

Actually, split into 3 sheets in one workbook:
- Sheet "Programmes": `code`, `nameFr`, `nameEn`, `studyCycleCode`, `departmentCode`, `durationYears`, `totalCredits`
- Sheet "Cours": `code`, `name`, `teachingUnitCode`, `credits`, `coefficient`
- Sheet "Classes": `code`, `name`, `programCode`, `programOptionCode`, `cycleLevelCode`, `semesterCode`, `academicYearCode`

#### `people`

Two sheets in one workbook:
- Sheet "Étudiants": `firstName`, `lastName`, `email`, `dateOfBirth` (YYYY-MM-DD), `gender` (H/F), `phone`, `nationality`, `registrationNumber`, `classCode` (optional — triggers enrollment if provided), `academicYearCode` (required if classCode given)
- Sheet "Enseignants": `firstName`, `lastName`, `email`, `dateOfBirth`, `gender`, `phone`, `specialty`

#### `enrollments`

Single sheet: `registrationNumber`, `classCode`, `academicYearCode`, `admissionType` (`normal`/`transfer`/`direct`), `transferInstitution` (optional), `transferCredits` (optional)

#### `grades-bulk`

Single sheet: `examCode`, `registrationNumber`, `score`  
(examCode identifies the exam within the institution — requires exams to already exist)

## Backend — New Files

```
apps/server/src/
  modules/data-import/
    index.ts                          — exports router
    data-import.router.ts             — tRPC procedures + REST routes wired in index.ts
    data-import.service.ts            — file parsing, row validation, DB writes
    data-import.zod.ts                — param schemas for each import type
    template-generator.ts             — ExcelJS workbook generation per type
    parsers/
      academic-structure.parser.ts    — parse + validate structure workbook
      people.parser.ts                — parse + validate people workbook
      enrollments.parser.ts           — parse + validate enrollments sheet
      grades-bulk.parser.ts           — parse + validate grades sheet
  modules/batch-jobs/job-types/
    import-academic-structure.ts      — BatchJobDefinition for academic structure
    import-people.ts                  — BatchJobDefinition for people
    import-enrollments.ts             — BatchJobDefinition for enrollments
    import-grades-bulk.ts             — BatchJobDefinition for grades bulk
  index.ts (server entry)             — wire new REST routes for upload + template download
```

**Modified files:**
- `modules/batch-jobs/batch-jobs.types.ts` — add 4 new types to `BATCH_JOB_TYPES`
- `modules/batch-jobs/job-types/index.ts` — register 4 new jobs
- `routers/index.ts` — add `dataImport` router
- `index.ts` (server) — add `POST /api/import/upload` and `GET /api/import/template/:type` REST routes

## Backend — Key Interfaces

```typescript
// data-import.zod.ts
export const importJobParamsSchema = z.object({
  fileId: z.string(),
  type: z.enum(["academic-structure", "people", "enrollments", "grades-bulk"]),
  dryRun: z.boolean().default(false),
});

// data-import.service.ts
export type ParseResult = {
  rows: unknown[];
  errors: Array<{ row: number; col?: string; message: string }>;
  warnings: Array<{ row: number; col?: string; message: string }>;
};

export type ImportSummary = {
  toCreate: number;
  toSkip: number;   // already exists (idempotent)
  errors: ParseResult["errors"];
  warnings: ParseResult["warnings"];
};
```

## File Upload

`POST /api/import/upload` (REST, multipart/form-data):
- Accepts `.xlsx` or `.csv` (max 10 MB)
- Stores via existing storage driver
- Returns `{ fileId: string }`

Stored path: `imports/<institutionId>/<uuid>.<ext>`

## Validation Rules (preview step)

| Entity | Critical errors (block) | Warnings (allow with log) |
|---|---|---|
| Programme | Missing `code` or `nameFr` | `studyCycleCode` not found → skip row |
| Cours | Missing `code`, `teachingUnitCode` unknown | `coefficient` missing → default 1 |
| Classe | `programCode` unknown, `academicYearCode` unknown | `semesterCode` missing → null |
| Étudiant | Missing `firstName`/`lastName`/`email`, duplicate email | `registrationNumber` already exists → skip |
| Enseignant | Missing `email` | `specialty` missing → null |
| Inscription | `registrationNumber` unknown, `classCode` unknown | duplicate enrollment → skip |
| Note | `examCode` unknown, `registrationNumber` unknown | score out of range → clamp + warn |

**Idempotency:** all imports skip (not error) on existing records (matched by code/email/registrationNumber).

## Frontend — New Files

```
apps/web/src/
  pages/admin/import/
    DataImportHub.tsx          — main page, 4 tabs
    ImportSection.tsx          — reusable per-tab component (download + upload + preview + confirm)
    PreviewTable.tsx           — error/warning table component
```

**Modified files:**
- `App.tsx` — add route `/admin/import`
- Sidebar nav — add "Import données" link under admin section
- `i18n/locales/fr/translation.json` — add `admin.dataImport.*` keys
- `i18n/locales/en/translation.json` — add `admin.dataImport.*` keys

## Frontend — ImportSection behavior

1. **Download template button** — calls `GET /api/import/template/:type`, triggers browser download
2. **Upload zone** — drag & drop or file picker, accepts `.xlsx`/`.csv`; on select: upload to `POST /api/import/upload` → get `fileId`
3. **Auto-preview** — immediately calls `batchJobs.preview` with `{ type: "import.people", params: { fileId } }` → shows summary + error table
4. **Confirm button** — calls `batchJobs.run({ jobId })` → navigates to `/admin/batch-jobs/:id`
5. **Reset** — clears file + preview on new upload

## i18n Keys (FR)

```json
"admin": {
  "dataImport": {
    "title": "Import de données",
    "subtitle": "Importez vos données depuis Excel ou CSV",
    "tabs": {
      "structure": "Structure académique",
      "people": "Personnes",
      "enrollments": "Inscriptions",
      "grades": "Notes"
    },
    "downloadTemplate": "Télécharger le modèle",
    "uploadZone": "Glissez votre fichier ici ou cliquez pour sélectionner",
    "uploadZoneAccept": "Excel (.xlsx) ou CSV (.csv) · max 10 Mo",
    "preview": {
      "valid": "{{count}} ligne(s) valide(s)",
      "skipped": "{{count}} ligne(s) ignorée(s) (déjà existantes)",
      "errors": "{{count}} erreur(s)",
      "warnings": "{{count}} avertissement(s)",
      "row": "Ligne",
      "column": "Colonne",
      "message": "Message"
    },
    "confirm": "Lancer l'import",
    "uploading": "Téléversement…",
    "previewing": "Analyse du fichier…",
    "noFile": "Aucun fichier sélectionné",
    "errorBlocker": "Corrigez les erreurs avant de confirmer",
    "toast": {
      "uploadOk": "Fichier reçu, analyse en cours…",
      "importStarted": "Import lancé"
    },
    "prereqHint": {
      "people": "Importez d'abord la structure académique si les classes n'existent pas encore.",
      "enrollments": "Les étudiants et les classes doivent exister avant d'importer les inscriptions.",
      "grades": "Les examens doivent exister avant d'importer les notes."
    }
  }
}
```

## Testing

Each parser has unit tests:
- Valid file → correct `ParseResult`
- Missing required column → error on affected rows
- Unknown reference code → warning, row skipped
- Duplicate → skipped (idempotent, no error)

Each batch job handler has integration tests (same pattern as existing batch job tests):
- `preview` returns correct summary
- `run` creates records in DB
- `run` is idempotent (second run skips all)
- `rollback` deletes created records
