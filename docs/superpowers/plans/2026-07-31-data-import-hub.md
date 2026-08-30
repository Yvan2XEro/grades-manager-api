# Data Import Hub — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow admins to import institution data (academic structure, people, enrollments, grades) via downloadable Excel templates with preview/validation before commit.

**Architecture:** File upload stores a binary file → returns `fileId`. Four new batch job types (`import.academicStructure`, `import.people`, `import.enrollments`, `import.gradesBulk`) receive `{ fileId }`, parse the Excel/CSV in step 0, validate in step 1, and write to DB in step 2+. Frontend is a 4-tab hub page at `/admin/import` using the existing `batchJobs.preview → run` flow.

**Tech Stack:** ExcelJS (new dep, Excel generation + parsing), Hono multipart (file upload REST route), existing storage adapter, existing batch job framework, React + shadcn/ui.

## Global Constraints

- Runtime: Bun. All server code runs under Bun — no Node-only APIs.
- Excel library: `exceljs` — install in `apps/server` workspace only.
- Existing patterns: batch jobs use `BatchJobDefinition<TParams>` from `batch-jobs.types.ts`; storage uses `getStorageAdapter()` from `lib/storage.ts`; REST routes added directly to Hono app in `apps/server/src/index.ts`.
- File upload uses Hono's `c.req.parseBody()` (multipart/form-data), NOT base64 tRPC.
- File storage key format: UUID + extension (same as existing storage adapter).
- Import file retrieved by key using `path.join(localRoot, key)` (local storage only for now).
- Idempotency: all imports skip (not error) existing records matched by code/email/registrationNumber.
- Test runner: `bun test` from `apps/server/`. Tests in `src/modules/data-import/__tests__/`.
- No `Co-Authored-By` trailer in commits.
- Never run `git commit` or `git push` — suggest message as text only.

---

### Task 1: Install ExcelJS + add 4 batch job types to registry

**Files:**
- Modify: `apps/server/package.json` — add `exceljs`
- Modify: `apps/server/src/modules/batch-jobs/batch-jobs.types.ts` — add 4 import types
- Modify: `apps/server/src/modules/batch-jobs/job-types/index.ts` — register stubs

**Interfaces:**
- Produces: `"import.academicStructure" | "import.people" | "import.enrollments" | "import.gradesBulk"` in `BatchJobType` union; `exceljs` importable in all server code.

- [ ] **Step 1: Install exceljs**

```bash
cd apps/server && bun add exceljs
```

- [ ] **Step 2: Add 4 types to BATCH_JOB_TYPES**

In `apps/server/src/modules/batch-jobs/batch-jobs.types.ts`, extend the array:

```typescript
export const BATCH_JOB_TYPES = [
  "creditLedger.recompute",
  "studentFacts.refreshClass",
  "promotion.applyBatch",
  "academicYear.setup",
  "documents.generateBulk",
  "timetable.copyFromYear",
  "import.academicStructure",
  "import.people",
  "import.enrollments",
  "import.gradesBulk",
] as const;
```

- [ ] **Step 3: Create 4 stub job files**

Create `apps/server/src/modules/batch-jobs/job-types/import-academic-structure.ts`:

```typescript
import { z } from "zod";
import type { BatchJobDefinition } from "../batch-jobs.types";

const paramsSchema = z.object({ fileId: z.string() });
type Params = z.infer<typeof paramsSchema>;

export const importAcademicStructureJob: BatchJobDefinition<Params> = {
  type: "import.academicStructure",
  label: "Import Academic Structure",
  parseParams: (raw) => paramsSchema.parse(raw),
  preview: async (_params, _ctx) => {
    throw new Error("Not implemented yet");
  },
  executeStep: async (_params, _step, _ctx) => {},
};
```

Create identical stubs for `import-people.ts` (type `"import.people"`, label `"Import People"`), `import-enrollments.ts` (type `"import.enrollments"`, label `"Import Enrollments"`), `import-grades-bulk.ts` (type `"import.gradesBulk"`, label `"Import Grades Bulk"`).

- [ ] **Step 4: Register stubs**

In `apps/server/src/modules/batch-jobs/job-types/index.ts`, add:

```typescript
import { importAcademicStructureJob } from "./import-academic-structure";
import { importEnrollmentsJob } from "./import-enrollments";
import { importGradesBulkJob } from "./import-grades-bulk";
import { importPeopleJob } from "./import-people";

// inside registerAllJobTypes():
registerJobType(importAcademicStructureJob);
registerJobType(importPeopleJob);
registerJobType(importEnrollmentsJob);
registerJobType(importGradesBulkJob);
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd /path/to/project && bun check-types 2>&1 | grep -E "import.*job|batch-jobs.types" | head -20
```

Expected: no errors on the new types.

---

### Task 2: File storage helper + REST upload + template download route

**Files:**
- Create: `apps/server/src/modules/data-import/import-file-storage.ts`
- Modify: `apps/server/src/index.ts` — add 2 REST routes

**Interfaces:**
- Produces: `saveImportFile(buffer, ext, institutionId): Promise<{fileId: string}>`, `readImportFile(fileId): Promise<Buffer>`, `deleteImportFile(fileId): Promise<void>`
- Produces: `POST /api/import/upload` → `{ fileId: string }`, `GET /api/import/template/:type` → xlsx binary

- [ ] **Step 1: Create import-file-storage.ts**

```typescript
// apps/server/src/modules/data-import/import-file-storage.ts
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const importRoot =
  process.env.STORAGE_LOCAL_ROOT
    ? path.join(process.env.STORAGE_LOCAL_ROOT, "imports")
    : "./storage/uploads/imports";

async function ensureDir() {
  await mkdir(importRoot, { recursive: true });
}

export async function saveImportFile(
  buffer: Buffer,
  ext: string,
): Promise<string> {
  await ensureDir();
  const fileId = `${randomUUID()}${ext}`;
  await writeFile(path.join(importRoot, fileId), buffer);
  return fileId;
}

export async function readImportFile(fileId: string): Promise<Buffer> {
  const safeName = path.basename(fileId);
  return readFile(path.join(importRoot, safeName));
}

export async function deleteImportFile(fileId: string): Promise<void> {
  try {
    await unlink(path.join(importRoot, path.basename(fileId)));
  } catch {
    // ignore missing
  }
}
```

- [ ] **Step 2: Add REST upload route to index.ts**

In `apps/server/src/index.ts`, after the existing REST routes and before `app.route("/api/diplomation", ...)`, add:

```typescript
import { saveImportFile } from "./modules/data-import/import-file-storage";
import { generateImportTemplate } from "./modules/data-import/template-generator";

// POST /api/import/upload  (multipart/form-data, field: "file")
app.post("/api/import/upload", async (c) => {
  // Require auth
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: "Unauthorized" }, 401);

  const body = await c.req.parseBody();
  const file = body["file"];
  if (!file || typeof file === "string") {
    return c.json({ error: "No file provided" }, 400);
  }
  const blob = file as File;
  const ext = blob.name.endsWith(".csv") ? ".csv" : ".xlsx";
  const allowedTypes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv",
    "application/csv",
  ];
  if (!allowedTypes.includes(blob.type) && ext !== ".csv" && ext !== ".xlsx") {
    return c.json({ error: "Only .xlsx or .csv files are accepted" }, 400);
  }
  const MAX_BYTES = 10 * 1024 * 1024;
  if (blob.size > MAX_BYTES) {
    return c.json({ error: "File exceeds 10 MB limit" }, 400);
  }
  const buffer = Buffer.from(await blob.arrayBuffer());
  const fileId = await saveImportFile(buffer, ext);
  return c.json({ fileId });
});

// GET /api/import/template/:type
app.get("/api/import/template/:type", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: "Unauthorized" }, 401);

  const type = c.req.param("type") as string;
  const validTypes = ["academic-structure", "people", "enrollments", "grades-bulk"];
  if (!validTypes.includes(type)) {
    return c.json({ error: "Unknown template type" }, 400);
  }
  const buffer = await generateImportTemplate(type as never);
  c.header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  c.header("Content-Disposition", `attachment; filename="template-${type}.xlsx"`);
  return c.body(buffer);
});
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
bun check-types 2>&1 | grep "index.ts" | head -10
```

Expected: no errors (template-generator stub will be created in Task 3).

---

### Task 3: Template generator (ExcelJS)

**Files:**
- Create: `apps/server/src/modules/data-import/template-generator.ts`

**Interfaces:**
- Consumes: `exceljs` (installed in Task 1)
- Produces: `generateImportTemplate(type: "academic-structure"|"people"|"enrollments"|"grades-bulk"): Promise<Buffer>`

- [ ] **Step 1: Create template-generator.ts**

```typescript
// apps/server/src/modules/data-import/template-generator.ts
import ExcelJS from "exceljs";

export type ImportTemplateType =
  | "academic-structure"
  | "people"
  | "enrollments"
  | "grades-bulk";

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF1E40AF" }, // blue-800
};
const HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: "FFFFFFFF" },
};
const EXAMPLE_FONT: Partial<ExcelJS.Font> = {
  italic: true,
  color: { argb: "FF9CA3AF" }, // gray-400
};

function addHeaderRow(ws: ExcelJS.Worksheet, columns: string[]) {
  ws.columns = columns.map((c) => ({ header: c, key: c, width: Math.max(c.length + 4, 18) }));
  const headerRow = ws.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
  });
}

function addExampleRow(ws: ExcelJS.Worksheet, values: (string | number)[]) {
  const row = ws.addRow(values);
  row.eachCell((cell) => {
    cell.font = EXAMPLE_FONT;
  });
}

function addEnumValidation(ws: ExcelJS.Worksheet, col: number, startRow: number, values: string[]) {
  for (let r = startRow; r <= startRow + 500; r++) {
    ws.getCell(r, col).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [`"${values.join(",")}"`],
    };
  }
}

async function buildAcademicStructureTemplate(): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();

  // Sheet 1: Programmes
  const wsProg = wb.addWorksheet("Programmes");
  addHeaderRow(wsProg, ["code", "nameFr", "nameEn", "studyCycleCode", "departmentCode", "durationYears", "totalCredits"]);
  addExampleRow(wsProg, ["SIN", "Sciences Informatiques", "Computer Science", "BTS", "GINF", 2, 120]);
  wsProg.getCell("A2").note = "Formule suggérée: =UPPER(LEFT(SUBSTITUTE(B2,\" \",\"\"),4))";

  // Sheet 2: Cours
  const wsCours = wb.addWorksheet("Cours");
  addHeaderRow(wsCours, ["code", "name", "teachingUnitCode", "credits", "coefficient"]);
  addExampleRow(wsCours, ["ALGO1", "Algorithmique", "UE-ALGO", 3, 2]);

  // Sheet 3: Classes
  const wsClasses = wb.addWorksheet("Classes");
  addHeaderRow(wsClasses, ["code", "name", "programCode", "programOptionCode", "cycleLevelCode", "semesterCode", "academicYearCode"]);
  addExampleRow(wsClasses, ["SIN-BTS1-2026", "SIN BTS1 2025-2026", "SIN", "GEN", "BTS1", "S1", "AY-2026"]);

  // References sheet (hidden)
  const wsRef = wb.addWorksheet("Références");
  wsRef.state = "hidden";
  wsRef.addRow(["[Codes académiques de votre institution — rempli dynamiquement]"]);

  const { buffer } = await wb.xlsx.writeBuffer() as { buffer: Buffer };
  return buffer;
}

async function buildPeopleTemplate(): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();

  // Sheet 1: Étudiants
  const wsEtu = wb.addWorksheet("Étudiants");
  addHeaderRow(wsEtu, ["firstName", "lastName", "email", "dateOfBirth", "gender", "phone", "nationality", "registrationNumber", "classCode", "academicYearCode"]);
  addExampleRow(wsEtu, ["Jean", "Dupont", "jean.dupont@example.com", "2002-03-15", "H", "+237600000001", "Camerounaise", "ETU-2026-001", "SIN-BTS1-2026", "AY-2026"]);
  addEnumValidation(wsEtu, 5, 3, ["H", "F"]); // gender column

  // Sheet 2: Enseignants
  const wsEnseig = wb.addWorksheet("Enseignants");
  addHeaderRow(wsEnseig, ["firstName", "lastName", "email", "dateOfBirth", "gender", "phone", "specialty"]);
  addExampleRow(wsEnseig, ["Marie", "Curie", "m.curie@example.com", "1975-11-07", "F", "+237600000002", "Mathématiques"]);
  addEnumValidation(wsEnseig, 5, 3, ["H", "F"]);

  const wsRef = wb.addWorksheet("Références");
  wsRef.state = "hidden";
  wsRef.addRow(["Codes classes et années académiques de votre institution"]);

  const { buffer } = await wb.xlsx.writeBuffer() as { buffer: Buffer };
  return buffer;
}

async function buildEnrollmentsTemplate(): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Inscriptions");
  addHeaderRow(ws, ["registrationNumber", "classCode", "academicYearCode", "admissionType", "transferInstitution", "transferCredits"]);
  addExampleRow(ws, ["ETU-2026-001", "SIN-BTS1-2026", "AY-2026", "normal", "", ""]);
  addEnumValidation(ws, 4, 3, ["normal", "transfer", "direct"]);

  const { buffer } = await wb.xlsx.writeBuffer() as { buffer: Buffer };
  return buffer;
}

async function buildGradesBulkTemplate(): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Notes");
  addHeaderRow(ws, ["examCode", "registrationNumber", "score"]);
  addExampleRow(ws, ["CC-ALGO1-SIN-BTS1-S1", "ETU-2026-001", 14.5]);

  const { buffer } = await wb.xlsx.writeBuffer() as { buffer: Buffer };
  return buffer;
}

export async function generateImportTemplate(type: ImportTemplateType): Promise<Buffer> {
  switch (type) {
    case "academic-structure": return buildAcademicStructureTemplate();
    case "people": return buildPeopleTemplate();
    case "enrollments": return buildEnrollmentsTemplate();
    case "grades-bulk": return buildGradesBulkTemplate();
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
bun check-types 2>&1 | grep "template-generator" | head -10
```

Expected: no errors.

---

### Task 4: Parsers — academic structure + people

**Files:**
- Create: `apps/server/src/modules/data-import/parsers/academic-structure.parser.ts`
- Create: `apps/server/src/modules/data-import/parsers/people.parser.ts`
- Create: `apps/server/src/modules/data-import/__tests__/parsers.test.ts`

**Interfaces:**
- Consumes: `exceljs`, `readImportFile(fileId)` from `import-file-storage.ts`
- Produces:
  ```typescript
  type ParseError = { row: number; col?: string; message: string };
  type ParseWarning = { row: number; col?: string; message: string };

  type AcademicStructureRows = {
    programmes: Array<{ code: string; nameFr: string; nameEn?: string; studyCycleCode: string; departmentCode?: string; durationYears?: number; totalCredits?: number }>;
    cours: Array<{ code: string; name: string; teachingUnitCode: string; credits?: number; coefficient?: number }>;
    classes: Array<{ code: string; name: string; programCode: string; programOptionCode?: string; cycleLevelCode?: string; semesterCode?: string; academicYearCode: string }>;
    errors: ParseError[];
    warnings: ParseWarning[];
  };

  type PeopleRows = {
    students: Array<{ firstName: string; lastName: string; email: string; dateOfBirth?: string; gender?: string; phone?: string; nationality?: string; registrationNumber?: string; classCode?: string; academicYearCode?: string }>;
    teachers: Array<{ firstName: string; lastName: string; email: string; dateOfBirth?: string; gender?: string; phone?: string; specialty?: string }>;
    errors: ParseError[];
    warnings: ParseWarning[];
  };

  export function parseAcademicStructure(buffer: Buffer): Promise<AcademicStructureRows>;
  export function parsePeople(buffer: Buffer): Promise<PeopleRows>;
  ```

- [ ] **Step 1: Create academic-structure.parser.ts**

```typescript
// apps/server/src/modules/data-import/parsers/academic-structure.parser.ts
import ExcelJS from "exceljs";

export type ParseError = { row: number; col?: string; message: string };
export type ParseWarning = { row: number; col?: string; message: string };

export type ProgrammeRow = {
  code: string; nameFr: string; nameEn?: string;
  studyCycleCode: string; departmentCode?: string;
  durationYears?: number; totalCredits?: number;
};
export type CoursRow = {
  code: string; name: string; teachingUnitCode: string;
  credits?: number; coefficient?: number;
};
export type ClasseRow = {
  code: string; name: string; programCode: string;
  programOptionCode?: string; cycleLevelCode?: string;
  semesterCode?: string; academicYearCode: string;
};
export type AcademicStructureRows = {
  programmes: ProgrammeRow[];
  cours: CoursRow[];
  classes: ClasseRow[];
  errors: ParseError[];
  warnings: ParseWarning[];
};

function cell(row: ExcelJS.Row, col: number): string {
  const v = row.getCell(col).value;
  return v == null ? "" : String(v).trim();
}
function num(row: ExcelJS.Row, col: number): number | undefined {
  const v = row.getCell(col).value;
  const n = Number(v);
  return Number.isNaN(n) || v == null || v === "" ? undefined : n;
}

export async function parseAcademicStructure(buffer: Buffer): Promise<AcademicStructureRows> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);

  const errors: ParseError[] = [];
  const warnings: ParseWarning[] = [];
  const programmes: ProgrammeRow[] = [];
  const cours: CoursRow[] = [];
  const classes: ClasseRow[] = [];

  // Sheet: Programmes (skip row 1 header, row 2 example)
  const wsProg = wb.getWorksheet("Programmes");
  if (wsProg) {
    wsProg.eachRow((row, rowNum) => {
      if (rowNum <= 2) return;
      const code = cell(row, 1);
      const nameFr = cell(row, 2);
      const studyCycleCode = cell(row, 4);
      if (!code) { errors.push({ row: rowNum, col: "code", message: "code requis" }); return; }
      if (!nameFr) { errors.push({ row: rowNum, col: "nameFr", message: "nameFr requis" }); return; }
      if (!studyCycleCode) { warnings.push({ row: rowNum, col: "studyCycleCode", message: "studyCycleCode manquant — ligne ignorée" }); return; }
      programmes.push({
        code, nameFr, nameEn: cell(row, 3) || undefined,
        studyCycleCode, departmentCode: cell(row, 5) || undefined,
        durationYears: num(row, 6), totalCredits: num(row, 7),
      });
    });
  }

  // Sheet: Cours
  const wsCours = wb.getWorksheet("Cours");
  if (wsCours) {
    wsCours.eachRow((row, rowNum) => {
      if (rowNum <= 2) return;
      const code = cell(row, 1);
      const name = cell(row, 2);
      const teachingUnitCode = cell(row, 3);
      if (!code) { errors.push({ row: rowNum, col: "code", message: "code requis" }); return; }
      if (!name) { errors.push({ row: rowNum, col: "name", message: "name requis" }); return; }
      if (!teachingUnitCode) { warnings.push({ row: rowNum, col: "teachingUnitCode", message: "teachingUnitCode manquant" }); return; }
      const coefficient = num(row, 5);
      cours.push({
        code, name, teachingUnitCode,
        credits: num(row, 4),
        coefficient: coefficient == null ? 1 : coefficient,
      });
    });
  }

  // Sheet: Classes
  const wsClasses = wb.getWorksheet("Classes");
  if (wsClasses) {
    wsClasses.eachRow((row, rowNum) => {
      if (rowNum <= 2) return;
      const code = cell(row, 1);
      const name = cell(row, 2);
      const programCode = cell(row, 3);
      const academicYearCode = cell(row, 7);
      if (!code) { errors.push({ row: rowNum, col: "code", message: "code requis" }); return; }
      if (!programCode) { errors.push({ row: rowNum, col: "programCode", message: "programCode requis" }); return; }
      if (!academicYearCode) { errors.push({ row: rowNum, col: "academicYearCode", message: "academicYearCode requis" }); return; }
      classes.push({
        code, name: name || code, programCode,
        programOptionCode: cell(row, 4) || undefined,
        cycleLevelCode: cell(row, 5) || undefined,
        semesterCode: cell(row, 6) || undefined,
        academicYearCode,
      });
    });
  }

  return { programmes, cours, classes, errors, warnings };
}
```

- [ ] **Step 2: Create people.parser.ts**

```typescript
// apps/server/src/modules/data-import/parsers/people.parser.ts
import ExcelJS from "exceljs";
import type { ParseError, ParseWarning } from "./academic-structure.parser";

export type StudentRow = {
  firstName: string; lastName: string; email: string;
  dateOfBirth?: string; gender?: string; phone?: string;
  nationality?: string; registrationNumber?: string;
  classCode?: string; academicYearCode?: string;
};
export type TeacherRow = {
  firstName: string; lastName: string; email: string;
  dateOfBirth?: string; gender?: string; phone?: string; specialty?: string;
};
export type PeopleRows = {
  students: StudentRow[];
  teachers: TeacherRow[];
  errors: ParseError[];
  warnings: ParseWarning[];
};

function cell(row: ExcelJS.Row, col: number): string {
  const v = row.getCell(col).value;
  return v == null ? "" : String(v).trim();
}

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function parsePeople(buffer: Buffer): Promise<PeopleRows> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const errors: ParseError[] = [];
  const warnings: ParseWarning[] = [];
  const students: StudentRow[] = [];
  const teachers: TeacherRow[] = [];

  const wsEtu = wb.getWorksheet("Étudiants");
  if (wsEtu) {
    wsEtu.eachRow((row, rowNum) => {
      if (rowNum <= 2) return;
      const firstName = cell(row, 1);
      const lastName = cell(row, 2);
      const email = cell(row, 3);
      if (!firstName || !lastName) {
        errors.push({ row: rowNum, message: "firstName et lastName requis" }); return;
      }
      if (!email || !isValidEmail(email)) {
        errors.push({ row: rowNum, col: "email", message: `email invalide: "${email}"` }); return;
      }
      const classCode = cell(row, 9) || undefined;
      const academicYearCode = cell(row, 10) || undefined;
      if (classCode && !academicYearCode) {
        warnings.push({ row: rowNum, col: "academicYearCode", message: "classCode fourni sans academicYearCode — inscription ignorée" });
      }
      students.push({
        firstName, lastName, email,
        dateOfBirth: cell(row, 4) || undefined,
        gender: cell(row, 5) || undefined,
        phone: cell(row, 6) || undefined,
        nationality: cell(row, 7) || undefined,
        registrationNumber: cell(row, 8) || undefined,
        classCode, academicYearCode: classCode ? academicYearCode : undefined,
      });
    });
  }

  const wsEnseig = wb.getWorksheet("Enseignants");
  if (wsEnseig) {
    wsEnseig.eachRow((row, rowNum) => {
      if (rowNum <= 2) return;
      const firstName = cell(row, 1);
      const lastName = cell(row, 2);
      const email = cell(row, 3);
      if (!firstName || !lastName) {
        errors.push({ row: rowNum, message: "firstName et lastName requis" }); return;
      }
      if (!email || !isValidEmail(email)) {
        errors.push({ row: rowNum, col: "email", message: `email invalide: "${email}"` }); return;
      }
      teachers.push({
        firstName, lastName, email,
        dateOfBirth: cell(row, 4) || undefined,
        gender: cell(row, 5) || undefined,
        phone: cell(row, 6) || undefined,
        specialty: cell(row, 7) || undefined,
      });
    });
  }

  return { students, teachers, errors, warnings };
}
```

- [ ] **Step 3: Write parser unit tests**

Create `apps/server/src/modules/data-import/__tests__/parsers.test.ts`:

```typescript
import { describe, expect, it } from "bun:test";
import ExcelJS from "exceljs";
import { parseAcademicStructure } from "../parsers/academic-structure.parser";
import { parsePeople } from "../parsers/people.parser";

async function makeBuffer(
  sheets: Record<string, (string | number)[][]>,
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  for (const [name, rows] of Object.entries(sheets)) {
    const ws = wb.addWorksheet(name);
    for (const row of rows) ws.addRow(row);
  }
  const { buffer } = await wb.xlsx.writeBuffer() as { buffer: Buffer };
  return buffer;
}

describe("parseAcademicStructure", () => {
  it("parses valid programmes rows", async () => {
    const buf = await makeBuffer({
      Programmes: [
        ["code", "nameFr", "nameEn", "studyCycleCode", "departmentCode"],
        ["EXEMPLE", "exemple", "example", "BTS", "GINF"], // row 2 = example
        ["SIN", "Sciences Informatiques", "CS", "BTS", "GINF"],
      ],
    });
    const result = await parseAcademicStructure(buf);
    expect(result.programmes).toHaveLength(1);
    expect(result.programmes[0].code).toBe("SIN");
    expect(result.errors).toHaveLength(0);
  });

  it("errors on missing code in Programmes", async () => {
    const buf = await makeBuffer({
      Programmes: [
        ["code", "nameFr", "nameEn", "studyCycleCode"],
        ["", "", "", ""], // example row
        ["", "Sciences Informatiques", "CS", "BTS"],
      ],
    });
    const result = await parseAcademicStructure(buf);
    expect(result.errors.some((e) => e.col === "code")).toBe(true);
    expect(result.programmes).toHaveLength(0);
  });

  it("warns on missing studyCycleCode and skips row", async () => {
    const buf = await makeBuffer({
      Programmes: [
        ["code", "nameFr", "nameEn", "studyCycleCode"],
        ["", "", "", ""],
        ["SIN", "Sciences Informatiques", "CS", ""],
      ],
    });
    const result = await parseAcademicStructure(buf);
    expect(result.warnings.some((w) => w.col === "studyCycleCode")).toBe(true);
    expect(result.programmes).toHaveLength(0);
  });
});

describe("parsePeople", () => {
  it("parses valid students", async () => {
    const buf = await makeBuffer({
      "Étudiants": [
        ["firstName", "lastName", "email", "dateOfBirth", "gender", "phone", "nationality", "registrationNumber", "classCode", "academicYearCode"],
        ["", "", "", "", "", "", "", "", "", ""],
        ["Jean", "Dupont", "jean@ex.com", "2002-01-01", "H", "", "CM", "ETU-001", "SIN-BTS1", "AY-2026"],
      ],
    });
    const result = await parsePeople(buf);
    expect(result.students).toHaveLength(1);
    expect(result.students[0].email).toBe("jean@ex.com");
    expect(result.errors).toHaveLength(0);
  });

  it("errors on invalid email", async () => {
    const buf = await makeBuffer({
      "Étudiants": [
        ["firstName", "lastName", "email"],
        ["", "", ""],
        ["Jean", "Dupont", "not-an-email"],
      ],
    });
    const result = await parsePeople(buf);
    expect(result.errors.some((e) => e.col === "email")).toBe(true);
  });

  it("warns when classCode given without academicYearCode", async () => {
    const buf = await makeBuffer({
      "Étudiants": [
        ["firstName", "lastName", "email", "dateOfBirth", "gender", "phone", "nationality", "registrationNumber", "classCode", "academicYearCode"],
        ["", "", "", "", "", "", "", "", "", ""],
        ["Jean", "Dupont", "jean@ex.com", "", "", "", "", "", "SIN-BTS1", ""],
      ],
    });
    const result = await parsePeople(buf);
    expect(result.warnings.some((w) => w.col === "academicYearCode")).toBe(true);
    expect(result.students[0].classCode).toBeUndefined();
  });
});
```

- [ ] **Step 4: Run tests**

```bash
bun test src/modules/data-import/__tests__/parsers.test.ts
```

Expected: all tests pass.

---

### Task 5: Parsers — enrollments + grades-bulk

**Files:**
- Create: `apps/server/src/modules/data-import/parsers/enrollments.parser.ts`
- Create: `apps/server/src/modules/data-import/parsers/grades-bulk.parser.ts`
- Modify: `apps/server/src/modules/data-import/__tests__/parsers.test.ts` — add tests

**Interfaces:**
- Produces:
  ```typescript
  type EnrollmentRow = { registrationNumber: string; classCode: string; academicYearCode: string; admissionType?: string; transferInstitution?: string; transferCredits?: number };
  type GradeRow = { examCode: string; registrationNumber: string; score: number };
  export function parseEnrollments(buffer: Buffer): Promise<{ rows: EnrollmentRow[]; errors: ParseError[]; warnings: ParseWarning[] }>;
  export function parseGradesBulk(buffer: Buffer): Promise<{ rows: GradeRow[]; errors: ParseError[]; warnings: ParseWarning[] }>;
  ```

- [ ] **Step 1: Create enrollments.parser.ts**

```typescript
// apps/server/src/modules/data-import/parsers/enrollments.parser.ts
import ExcelJS from "exceljs";
import type { ParseError, ParseWarning } from "./academic-structure.parser";

export type EnrollmentRow = {
  registrationNumber: string; classCode: string; academicYearCode: string;
  admissionType?: string; transferInstitution?: string; transferCredits?: number;
};

const VALID_ADMISSION_TYPES = ["normal", "transfer", "direct"];

function cell(row: ExcelJS.Row, col: number): string {
  const v = row.getCell(col).value;
  return v == null ? "" : String(v).trim();
}

export async function parseEnrollments(
  buffer: Buffer,
): Promise<{ rows: EnrollmentRow[]; errors: ParseError[]; warnings: ParseWarning[] }> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const ws = wb.getWorksheet("Inscriptions") ?? wb.worksheets[0];
  const errors: ParseError[] = [];
  const warnings: ParseWarning[] = [];
  const rows: EnrollmentRow[] = [];

  if (!ws) return { rows, errors: [{ row: 0, message: "Aucune feuille trouvée" }], warnings };

  ws.eachRow((row, rowNum) => {
    if (rowNum <= 2) return;
    const registrationNumber = cell(row, 1);
    const classCode = cell(row, 2);
    const academicYearCode = cell(row, 3);
    if (!registrationNumber) { errors.push({ row: rowNum, col: "registrationNumber", message: "requis" }); return; }
    if (!classCode) { errors.push({ row: rowNum, col: "classCode", message: "requis" }); return; }
    if (!academicYearCode) { errors.push({ row: rowNum, col: "academicYearCode", message: "requis" }); return; }
    const admissionType = cell(row, 4) || "normal";
    if (!VALID_ADMISSION_TYPES.includes(admissionType)) {
      warnings.push({ row: rowNum, col: "admissionType", message: `valeur inconnue "${admissionType}" — "normal" utilisé` });
    }
    const creditsRaw = row.getCell(6).value;
    const transferCredits = creditsRaw == null || creditsRaw === "" ? undefined : Number(creditsRaw);
    rows.push({
      registrationNumber, classCode, academicYearCode,
      admissionType: VALID_ADMISSION_TYPES.includes(admissionType) ? admissionType : "normal",
      transferInstitution: cell(row, 5) || undefined,
      transferCredits: Number.isNaN(transferCredits) ? undefined : transferCredits,
    });
  });

  return { rows, errors, warnings };
}
```

- [ ] **Step 2: Create grades-bulk.parser.ts**

```typescript
// apps/server/src/modules/data-import/parsers/grades-bulk.parser.ts
import ExcelJS from "exceljs";
import type { ParseError, ParseWarning } from "./academic-structure.parser";

export type GradeRow = { examCode: string; registrationNumber: string; score: number };

function cell(row: ExcelJS.Row, col: number): string {
  const v = row.getCell(col).value;
  return v == null ? "" : String(v).trim();
}

export async function parseGradesBulk(
  buffer: Buffer,
): Promise<{ rows: GradeRow[]; errors: ParseError[]; warnings: ParseWarning[] }> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const ws = wb.getWorksheet("Notes") ?? wb.worksheets[0];
  const errors: ParseError[] = [];
  const warnings: ParseWarning[] = [];
  const rows: GradeRow[] = [];

  if (!ws) return { rows, errors: [{ row: 0, message: "Feuille 'Notes' introuvable" }], warnings };

  ws.eachRow((row, rowNum) => {
    if (rowNum <= 2) return;
    const examCode = cell(row, 1);
    const registrationNumber = cell(row, 2);
    const scoreRaw = row.getCell(3).value;
    if (!examCode) { errors.push({ row: rowNum, col: "examCode", message: "requis" }); return; }
    if (!registrationNumber) { errors.push({ row: rowNum, col: "registrationNumber", message: "requis" }); return; }
    const score = Number(scoreRaw);
    if (Number.isNaN(score)) { errors.push({ row: rowNum, col: "score", message: `score invalide: "${scoreRaw}"` }); return; }
    if (score < 0 || score > 20) {
      warnings.push({ row: rowNum, col: "score", message: `score ${score} hors plage [0,20] — valeur conservée` });
    }
    rows.push({ examCode, registrationNumber, score });
  });

  return { rows, errors, warnings };
}
```

- [ ] **Step 3: Add tests for enrollments and grades parsers**

Append to `apps/server/src/modules/data-import/__tests__/parsers.test.ts`:

```typescript
import { parseEnrollments } from "../parsers/enrollments.parser";
import { parseGradesBulk } from "../parsers/grades-bulk.parser";

describe("parseEnrollments", () => {
  it("parses valid enrollment rows", async () => {
    const buf = await makeBuffer({
      Inscriptions: [
        ["registrationNumber", "classCode", "academicYearCode", "admissionType"],
        ["", "", "", ""],
        ["ETU-001", "SIN-BTS1", "AY-2026", "normal"],
      ],
    });
    const { rows, errors } = await parseEnrollments(buf);
    expect(rows).toHaveLength(1);
    expect(rows[0].classCode).toBe("SIN-BTS1");
    expect(errors).toHaveLength(0);
  });

  it("errors on missing registrationNumber", async () => {
    const buf = await makeBuffer({
      Inscriptions: [
        ["registrationNumber", "classCode", "academicYearCode"],
        ["", "", ""],
        ["", "SIN-BTS1", "AY-2026"],
      ],
    });
    const { errors } = await parseEnrollments(buf);
    expect(errors.some((e) => e.col === "registrationNumber")).toBe(true);
  });
});

describe("parseGradesBulk", () => {
  it("parses valid grade rows", async () => {
    const buf = await makeBuffer({
      Notes: [
        ["examCode", "registrationNumber", "score"],
        ["", "", ""],
        ["CC-ALGO1", "ETU-001", 14.5],
      ],
    });
    const { rows, errors } = await parseGradesBulk(buf);
    expect(rows).toHaveLength(1);
    expect(rows[0].score).toBe(14.5);
    expect(errors).toHaveLength(0);
  });

  it("errors on non-numeric score", async () => {
    const buf = await makeBuffer({
      Notes: [
        ["examCode", "registrationNumber", "score"],
        ["", "", ""],
        ["CC-ALGO1", "ETU-001", "abc"],
      ],
    });
    const { errors } = await parseGradesBulk(buf);
    expect(errors.some((e) => e.col === "score")).toBe(true);
  });

  it("warns on score out of range [0,20] but keeps value", async () => {
    const buf = await makeBuffer({
      Notes: [
        ["examCode", "registrationNumber", "score"],
        ["", "", ""],
        ["CC-ALGO1", "ETU-001", 25],
      ],
    });
    const { rows, warnings } = await parseGradesBulk(buf);
    expect(rows[0].score).toBe(25);
    expect(warnings.some((w) => w.col === "score")).toBe(true);
  });
});
```

- [ ] **Step 4: Run tests**

```bash
bun test src/modules/data-import/__tests__/parsers.test.ts
```

Expected: all tests pass.

---

### Task 6: Import batch jobs — academic structure + people

**Files:**
- Modify: `apps/server/src/modules/batch-jobs/job-types/import-academic-structure.ts` — full implementation
- Modify: `apps/server/src/modules/batch-jobs/job-types/import-people.ts` — full implementation
- Create: `apps/server/src/modules/data-import/__tests__/import-jobs.test.ts`

**Interfaces:**
- Consumes: `readImportFile(fileId)`, `parseAcademicStructure`, `parsePeople`, `db`, `schema`, `and`, `eq` from drizzle

- [ ] **Step 1: Implement import-academic-structure.ts**

Replace stub content with:

```typescript
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import { readImportFile } from "../../data-import/import-file-storage";
import { parseAcademicStructure } from "../../data-import/parsers/academic-structure.parser";
import type { BatchJobDefinition, JobContext, PreviewResult } from "../batch-jobs.types";

const paramsSchema = z.object({ fileId: z.string() });
type Params = z.infer<typeof paramsSchema>;

export const importAcademicStructureJob: BatchJobDefinition<Params> = {
  type: "import.academicStructure",
  label: "Import Academic Structure",
  parseParams: (raw) => paramsSchema.parse(raw),

  async preview(params, ctx) {
    const buffer = await readImportFile(params.fileId);
    const parsed = await parseAcademicStructure(buffer);
    await ctx.log("info", `Preview: ${parsed.programmes.length} programmes, ${parsed.cours.length} cours, ${parsed.classes.length} classes — ${parsed.errors.length} erreur(s)`);
    return {
      steps: [
        { name: "Import programmes", estimatedItems: parsed.programmes.length },
        { name: "Import cours", estimatedItems: parsed.cours.length },
        { name: "Import classes", estimatedItems: parsed.classes.length },
      ],
      summary: {
        programmeCount: parsed.programmes.length,
        coursCount: parsed.cours.length,
        classeCount: parsed.classes.length,
        errors: parsed.errors,
        warnings: parsed.warnings,
      },
      totalItems: parsed.programmes.length + parsed.cours.length + parsed.classes.length,
    } satisfies PreviewResult;
  },

  async executeStep(params, step, ctx) {
    const buffer = await readImportFile(params.fileId);
    const parsed = await parseAcademicStructure(buffer);

    if (step.stepIndex === 0) {
      // Import programmes
      let created = 0; let skipped = 0;
      for (const p of parsed.programmes) {
        const exists = await db.query.programs.findFirst({
          where: and(eq(schema.programs.code, p.code), eq(schema.programs.institutionId, ctx.institutionId)),
        });
        if (exists) { skipped++; continue; }
        await db.insert(schema.programs).values({
          code: p.code, nameFr: p.nameFr, nameEn: p.nameEn,
          studyCycleCode: p.studyCycleCode, departmentCode: p.departmentCode,
          durationYears: p.durationYears ?? 2, totalCredits: p.totalCredits ?? 120,
          institutionId: ctx.institutionId,
        });
        created++;
      }
      await ctx.reportStepProgress(step.id, { itemsProcessed: created, itemsSkipped: skipped });
      await ctx.log("info", `Programmes: ${created} créé(s), ${skipped} ignoré(s)`);
    } else if (step.stepIndex === 1) {
      // Import cours
      let created = 0; let skipped = 0;
      for (const c of parsed.cours) {
        const exists = await db.query.courses.findFirst({
          where: and(eq(schema.courses.code, c.code), eq(schema.courses.institutionId, ctx.institutionId)),
        });
        if (exists) { skipped++; continue; }
        await db.insert(schema.courses).values({
          code: c.code, name: c.name,
          teachingUnitCode: c.teachingUnitCode,
          credits: c.credits ?? 0, coefficient: c.coefficient ?? 1,
          institutionId: ctx.institutionId,
        });
        created++;
      }
      await ctx.reportStepProgress(step.id, { itemsProcessed: created, itemsSkipped: skipped });
      await ctx.log("info", `Cours: ${created} créé(s), ${skipped} ignoré(s)`);
    } else if (step.stepIndex === 2) {
      // Import classes
      let created = 0; let skipped = 0;
      for (const cl of parsed.classes) {
        // Resolve academicYearId by code
        const ay = await db.query.academicYears.findFirst({
          where: and(eq(schema.academicYears.code, cl.academicYearCode), eq(schema.academicYears.institutionId, ctx.institutionId)),
        });
        if (!ay) {
          await ctx.log("warn", `Classe ${cl.code}: année académique "${cl.academicYearCode}" introuvable — ignorée`);
          skipped++; continue;
        }
        const exists = await db.query.classes.findFirst({
          where: and(eq(schema.classes.code, cl.code), eq(schema.classes.academicYear, ay.id)),
        });
        if (exists) { skipped++; continue; }
        await db.insert(schema.classes).values({
          code: cl.code, name: cl.name || cl.code,
          program: cl.programCode, academicYear: ay.id,
          programOptionId: null, cycleLevelId: null, semesterId: null,
          institutionId: ctx.institutionId,
        });
        created++;
      }
      await ctx.reportStepProgress(step.id, { itemsProcessed: created, itemsSkipped: skipped });
      await ctx.log("info", `Classes: ${created} créée(s), ${skipped} ignorée(s)`);
    }
  },

  async rollback(params, ctx) {
    await ctx.log("warn", "Rollback de l'import structure non supporté (trop risqué de supprimer des données partagées)");
  },
};
```

- [ ] **Step 2: Implement import-people.ts**

Replace stub with:

```typescript
import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "@/db";
import * as authSchema from "@/db/schema/auth";
import * as schema from "@/db/schema/app-schema";
import { readImportFile } from "../../data-import/import-file-storage";
import { parsePeople } from "../../data-import/parsers/people.parser";
import type { BatchJobDefinition, PreviewResult } from "../batch-jobs.types";

const paramsSchema = z.object({ fileId: z.string() });
type Params = z.infer<typeof paramsSchema>;

export const importPeopleJob: BatchJobDefinition<Params> = {
  type: "import.people",
  label: "Import People",
  parseParams: (raw) => paramsSchema.parse(raw),

  async preview(params, ctx) {
    const buffer = await readImportFile(params.fileId);
    const parsed = await parsePeople(buffer);
    return {
      steps: [
        { name: "Import enseignants", estimatedItems: parsed.teachers.length },
        { name: "Import étudiants", estimatedItems: parsed.students.length },
      ],
      summary: {
        teacherCount: parsed.teachers.length,
        studentCount: parsed.students.length,
        errors: parsed.errors,
        warnings: parsed.warnings,
      },
      totalItems: parsed.teachers.length + parsed.students.length,
    } satisfies PreviewResult;
  },

  async executeStep(params, step, ctx) {
    const buffer = await readImportFile(params.fileId);
    const parsed = await parsePeople(buffer);

    if (step.stepIndex === 0) {
      // Import teachers: create auth user + domain user + org member with role teacher
      let created = 0; let skipped = 0;
      const org = await db.query.organization.findFirst({
        where: eq(authSchema.organization.id, ctx.institutionId),
      });
      for (const t of parsed.teachers) {
        const existingUser = await db.query.user.findFirst({
          where: eq(authSchema.user.email, t.email),
        });
        if (existingUser) { skipped++; continue; }
        const userId = randomUUID();
        await db.insert(authSchema.user).values({
          id: userId, email: t.email,
          name: `${t.firstName} ${t.lastName}`,
          emailVerified: false, createdAt: new Date(), updatedAt: new Date(),
        });
        const profileId = randomUUID();
        await db.insert(schema.domainUsers).values({
          id: profileId, authUserId: userId,
          firstName: t.firstName, lastName: t.lastName,
          primaryEmail: t.email, gender: (t.gender as "M" | "F") ?? null,
          phone: t.phone ?? null, institutionId: ctx.institutionId,
        });
        if (org) {
          await db.insert(authSchema.member).values({
            id: randomUUID(), organizationId: org.id, userId,
            role: "teacher", createdAt: new Date(),
          });
        }
        created++;
      }
      await ctx.reportStepProgress(step.id, { itemsProcessed: created, itemsSkipped: skipped });
      await ctx.log("info", `Enseignants: ${created} créé(s), ${skipped} ignoré(s) (email existant)`);
    } else if (step.stepIndex === 1) {
      // Import students
      let created = 0; let skipped = 0;
      for (const s of parsed.students) {
        const existingUser = await db.query.user.findFirst({
          where: eq(authSchema.user.email, s.email),
        });
        let userId: string;
        if (existingUser) {
          userId = existingUser.id;
          skipped++;
        } else {
          userId = randomUUID();
          await db.insert(authSchema.user).values({
            id: userId, email: s.email,
            name: `${s.firstName} ${s.lastName}`,
            emailVerified: false, createdAt: new Date(), updatedAt: new Date(),
          });
          const profileId = randomUUID();
          await db.insert(schema.domainUsers).values({
            id: profileId, authUserId: userId,
            firstName: s.firstName, lastName: s.lastName,
            primaryEmail: s.email, gender: (s.gender as "M" | "F") ?? null,
            phone: s.phone ?? null, institutionId: ctx.institutionId,
          });
          // Create student record
          await db.insert(schema.students).values({
            id: randomUUID(), domainUserId: profileId,
            institutionId: ctx.institutionId,
            registrationNumber: s.registrationNumber ?? null,
          });
          created++;
        }
        // Optionally enroll in class
        if (s.classCode && s.academicYearCode) {
          const ay = await db.query.academicYears.findFirst({
            where: and(eq(schema.academicYears.code, s.academicYearCode), eq(schema.academicYears.institutionId, ctx.institutionId)),
          });
          const cls = ay ? await db.query.classes.findFirst({
            where: and(eq(schema.classes.code, s.classCode), eq(schema.classes.academicYear, ay.id)),
          }) : null;
          if (cls) {
            const student = await db.query.students.findFirst({
              where: and(eq(schema.students.institutionId, ctx.institutionId)),
            });
            if (student) {
              const enrollExists = await db.query.enrollments.findFirst({
                where: and(eq(schema.enrollments.studentId, student.id), eq(schema.enrollments.classId, cls.id)),
              });
              if (!enrollExists) {
                await db.insert(schema.enrollments).values({
                  id: randomUUID(), studentId: student.id, classId: cls.id,
                  academicYearId: ay!.id, status: "active", admissionType: "normal",
                  institutionId: ctx.institutionId,
                });
              }
            }
          } else {
            await ctx.log("warn", `Étudiant ${s.email}: classe "${s.classCode}" introuvable — inscription ignorée`);
          }
        }
      }
      await ctx.reportStepProgress(step.id, { itemsProcessed: created, itemsSkipped: skipped });
      await ctx.log("info", `Étudiants: ${created} créé(s), ${skipped} ignoré(s)`);
    }
  },

  async rollback(_params, ctx) {
    await ctx.log("warn", "Rollback de l'import personnes non supporté");
  },
};
```

- [ ] **Step 3: Write integration tests for import jobs (preview only — no DB write tests needed at this stage)**

Create `apps/server/src/modules/data-import/__tests__/import-jobs.test.ts`:

```typescript
import { describe, expect, it } from "bun:test";
import ExcelJS from "exceljs";
import { saveImportFile } from "../import-file-storage";
import { asAdmin, makeTestContext } from "../../../lib/test-utils";
import { appRouter } from "../../../routers";

async function makeXlsx(sheets: Record<string, (string | number)[][]>): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  for (const [name, rows] of Object.entries(sheets)) {
    const ws = wb.addWorksheet(name);
    for (const row of rows) ws.addRow(row);
  }
  const { buffer } = await wb.xlsx.writeBuffer() as { buffer: Buffer };
  return buffer;
}

const createCaller = (ctx: ReturnType<typeof makeTestContext>) =>
  appRouter.createCaller(ctx);

describe("import.academicStructure preview", () => {
  it("previews with correct counts", async () => {
    const buf = await makeXlsx({
      Programmes: [
        ["code", "nameFr", "nameEn", "studyCycleCode"],
        ["", "", "", ""],
        ["SIN", "Sciences Informatiques", "CS", "BTS"],
      ],
      Cours: [["code", "name", "teachingUnitCode"], ["", "", ""], ["ALGO1", "Algorithmique", "UE-ALGO"]],
      Classes: [["code", "name", "programCode", "programOptionCode", "cycleLevelCode", "semesterCode", "academicYearCode"], ["", "", "", "", "", "", ""], ["SIN-BTS1", "SIN BTS1", "SIN", "", "", "", "AY-2026"]],
    });
    const fileId = await saveImportFile(buf, ".xlsx");
    const admin = createCaller(asAdmin());
    const previewed = await admin.batchJobs.preview({
      type: "import.academicStructure",
      params: { fileId },
    });
    expect(previewed.steps.length).toBe(3);
    const summary = previewed.previewResult as Record<string, unknown>;
    expect(summary.programmeCount).toBe(1);
    expect(summary.classeCount).toBe(1);
  });
});
```

- [ ] **Step 4: Run tests**

```bash
bun test src/modules/data-import/__tests__/import-jobs.test.ts
```

Expected: pass.

---

### Task 7: Import batch jobs — enrollments + grades-bulk

**Files:**
- Modify: `apps/server/src/modules/batch-jobs/job-types/import-enrollments.ts`
- Modify: `apps/server/src/modules/batch-jobs/job-types/import-grades-bulk.ts`

- [ ] **Step 1: Implement import-enrollments.ts**

```typescript
import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import { readImportFile } from "../../data-import/import-file-storage";
import { parseEnrollments } from "../../data-import/parsers/enrollments.parser";
import type { BatchJobDefinition, PreviewResult } from "../batch-jobs.types";

const paramsSchema = z.object({ fileId: z.string() });
type Params = z.infer<typeof paramsSchema>;

export const importEnrollmentsJob: BatchJobDefinition<Params> = {
  type: "import.enrollments",
  label: "Import Enrollments",
  parseParams: (raw) => paramsSchema.parse(raw),

  async preview(params, ctx) {
    const buffer = await readImportFile(params.fileId);
    const { rows, errors, warnings } = await parseEnrollments(buffer);
    return {
      steps: [{ name: "Import inscriptions", estimatedItems: rows.length }],
      summary: { rowCount: rows.length, errors, warnings },
      totalItems: rows.length,
    } satisfies PreviewResult;
  },

  async executeStep(params, step, ctx) {
    const buffer = await readImportFile(params.fileId);
    const { rows } = await parseEnrollments(buffer);
    let created = 0; let skipped = 0;

    for (const r of rows) {
      const student = await db.query.students.findFirst({
        where: and(
          eq(schema.students.institutionId, ctx.institutionId),
          eq(schema.students.registrationNumber, r.registrationNumber),
        ),
      });
      if (!student) {
        await ctx.log("warn", `Matricule "${r.registrationNumber}" introuvable — ligne ignorée`);
        skipped++; continue;
      }
      const ay = await db.query.academicYears.findFirst({
        where: and(eq(schema.academicYears.code, r.academicYearCode), eq(schema.academicYears.institutionId, ctx.institutionId)),
      });
      if (!ay) {
        await ctx.log("warn", `Année "${r.academicYearCode}" introuvable — ligne ignorée`);
        skipped++; continue;
      }
      const cls = await db.query.classes.findFirst({
        where: and(eq(schema.classes.code, r.classCode), eq(schema.classes.academicYear, ay.id)),
      });
      if (!cls) {
        await ctx.log("warn", `Classe "${r.classCode}" introuvable — ligne ignorée`);
        skipped++; continue;
      }
      const exists = await db.query.enrollments.findFirst({
        where: and(eq(schema.enrollments.studentId, student.id), eq(schema.enrollments.classId, cls.id)),
      });
      if (exists) { skipped++; continue; }

      await db.insert(schema.enrollments).values({
        id: randomUUID(), studentId: student.id, classId: cls.id,
        academicYearId: ay.id, status: "active",
        admissionType: (r.admissionType as "normal" | "transfer" | "direct") ?? "normal",
        transferInstitution: r.transferInstitution ?? null,
        transferCredits: r.transferCredits ?? null,
        institutionId: ctx.institutionId,
      });
      created++;
    }
    await ctx.reportStepProgress(step.id, { itemsProcessed: created, itemsSkipped: skipped });
    await ctx.log("info", `Inscriptions: ${created} créée(s), ${skipped} ignorée(s)`);
  },
};
```

- [ ] **Step 2: Implement import-grades-bulk.ts**

```typescript
import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import { readImportFile } from "../../data-import/import-file-storage";
import { parseGradesBulk } from "../../data-import/parsers/grades-bulk.parser";
import type { BatchJobDefinition, PreviewResult } from "../batch-jobs.types";

const paramsSchema = z.object({ fileId: z.string() });
type Params = z.infer<typeof paramsSchema>;

export const importGradesBulkJob: BatchJobDefinition<Params> = {
  type: "import.gradesBulk",
  label: "Import Grades Bulk",
  parseParams: (raw) => paramsSchema.parse(raw),

  async preview(params, ctx) {
    const buffer = await readImportFile(params.fileId);
    const { rows, errors, warnings } = await parseGradesBulk(buffer);
    return {
      steps: [{ name: "Import notes", estimatedItems: rows.length }],
      summary: { rowCount: rows.length, errors, warnings },
      totalItems: rows.length,
    } satisfies PreviewResult;
  },

  async executeStep(params, step, ctx) {
    const buffer = await readImportFile(params.fileId);
    const { rows } = await parseGradesBulk(buffer);
    let created = 0; let skipped = 0;

    for (const r of rows) {
      // Find exam by code within institution
      const exam = await db.query.exams.findFirst({
        where: and(eq(schema.exams.code, r.examCode), eq(schema.exams.institutionId, ctx.institutionId)),
      });
      if (!exam) {
        await ctx.log("warn", `Examen "${r.examCode}" introuvable — ligne ignorée`);
        skipped++; continue;
      }
      if (exam.isLocked) {
        await ctx.log("warn", `Examen "${r.examCode}" verrouillé — ligne ignorée`);
        skipped++; continue;
      }
      // Find student
      const student = await db.query.students.findFirst({
        where: and(
          eq(schema.students.institutionId, ctx.institutionId),
          eq(schema.students.registrationNumber, r.registrationNumber),
        ),
      });
      if (!student) {
        await ctx.log("warn", `Matricule "${r.registrationNumber}" introuvable — ligne ignorée`);
        skipped++; continue;
      }
      // Upsert grade
      const existing = await db.query.grades.findFirst({
        where: and(eq(schema.grades.studentId, student.id), eq(schema.grades.examId, exam.id)),
      });
      if (existing) {
        await db.update(schema.grades).set({ score: String(r.score) }).where(eq(schema.grades.id, existing.id));
      } else {
        await db.insert(schema.grades).values({
          id: randomUUID(), studentId: student.id, examId: exam.id,
          score: String(r.score), institutionId: ctx.institutionId,
        });
      }
      created++;
    }
    await ctx.reportStepProgress(step.id, { itemsProcessed: created, itemsSkipped: skipped });
    await ctx.log("info", `Notes: ${created} importée(s), ${skipped} ignorée(s)`);
  },
};
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
bun check-types 2>&1 | grep -E "import-enrollments|import-grades" | head -10
```

Expected: no errors.

---

### Task 8: tRPC dataImport router + i18n keys

**Files:**
- Create: `apps/server/src/modules/data-import/index.ts`
- Create: `apps/server/src/modules/data-import/data-import.router.ts`
- Modify: `apps/server/src/routers/index.ts`
- Modify: `apps/web/src/i18n/locales/fr/translation.json`
- Modify: `apps/web/src/i18n/locales/en/translation.json`

**Interfaces:**
- Produces: `trpc.dataImport.getTemplateUrl(type)` → `{ url: string }` (just returns the REST URL so frontend knows where to GET the template)

- [ ] **Step 1: Create data-import.router.ts**

```typescript
// apps/server/src/modules/data-import/data-import.router.ts
import { z } from "zod";
import { adminProcedure, router } from "@/lib/trpc";

const TEMPLATE_TYPES = ["academic-structure", "people", "enrollments", "grades-bulk"] as const;

export const dataImportRouter = router({
  getTemplateUrl: adminProcedure
    .input(z.object({ type: z.enum(TEMPLATE_TYPES) }))
    .query(({ input, ctx }) => {
      const base = process.env.SERVER_PUBLIC_URL ?? "";
      return { url: `${base}/api/import/template/${input.type}` };
    }),
});
```

- [ ] **Step 2: Create index.ts**

```typescript
// apps/server/src/modules/data-import/index.ts
export { dataImportRouter } from "./data-import.router";
```

- [ ] **Step 3: Register in routers/index.ts**

Add `dataImport: dataImportRouter` to the `appRouter` object (follow existing pattern in that file).

- [ ] **Step 4: Add i18n keys to FR**

In `apps/web/src/i18n/locales/fr/translation.json`, under `"admin"`, add:

```json
"dataImport": {
  "title": "Import de données",
  "subtitle": "Importez vos données depuis un fichier Excel ou CSV",
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
    "message": "Message",
    "noErrors": "Aucune erreur"
  },
  "confirm": "Lancer l'import",
  "uploading": "Téléversement…",
  "previewing": "Analyse du fichier…",
  "noFile": "Aucun fichier sélectionné",
  "errorBlocker": "Corrigez les erreurs avant de confirmer l'import",
  "toast": {
    "uploadOk": "Fichier reçu",
    "importStarted": "Import lancé"
  },
  "prereqHint": {
    "people": "Importez d'abord la structure académique si les classes n'existent pas encore.",
    "enrollments": "Les étudiants et les classes doivent exister avant les inscriptions.",
    "grades": "Les examens doivent exister avant d'importer les notes."
  }
}
```

- [ ] **Step 5: Add i18n keys to EN** (same structure, English values)

```json
"dataImport": {
  "title": "Data Import",
  "subtitle": "Import your institution data from Excel or CSV",
  "tabs": {
    "structure": "Academic Structure",
    "people": "People",
    "enrollments": "Enrollments",
    "grades": "Grades"
  },
  "downloadTemplate": "Download template",
  "uploadZone": "Drag your file here or click to select",
  "uploadZoneAccept": "Excel (.xlsx) or CSV (.csv) · max 10 MB",
  "preview": {
    "valid": "{{count}} valid row(s)",
    "skipped": "{{count}} skipped (already exist)",
    "errors": "{{count}} error(s)",
    "warnings": "{{count}} warning(s)",
    "row": "Row",
    "column": "Column",
    "message": "Message",
    "noErrors": "No errors"
  },
  "confirm": "Run import",
  "uploading": "Uploading…",
  "previewing": "Analysing file…",
  "noFile": "No file selected",
  "errorBlocker": "Fix errors before confirming",
  "toast": {
    "uploadOk": "File received",
    "importStarted": "Import started"
  },
  "prereqHint": {
    "people": "Import academic structure first if classes don't exist yet.",
    "enrollments": "Students and classes must exist before importing enrollments.",
    "grades": "Exams must exist before importing grades."
  }
}
```

---

### Task 9: Frontend — ImportSection + PreviewTable components

**Files:**
- Create: `apps/web/src/pages/admin/import/PreviewTable.tsx`
- Create: `apps/web/src/pages/admin/import/ImportSection.tsx`

**Interfaces:**
- Produces:
  ```typescript
  // PreviewTable
  type PreviewRow = { row: number; col?: string; message: string };
  interface PreviewTableProps { rows: PreviewRow[]; label: string }

  // ImportSection
  type ImportType = "academic-structure" | "people" | "enrollments" | "grades-bulk";
  interface ImportSectionProps { type: ImportType; prereqHint?: string }
  ```

- [ ] **Step 1: Create PreviewTable.tsx**

```tsx
// apps/web/src/pages/admin/import/PreviewTable.tsx
import { useTranslation } from "react-i18next";

type PreviewRow = { row: number; col?: string; message: string };

interface Props {
  rows: PreviewRow[];
  label: string;
  variant?: "error" | "warning";
}

export function PreviewTable({ rows, label, variant = "error" }: Props) {
  const { t } = useTranslation();
  if (rows.length === 0) return null;
  const color = variant === "error" ? "text-red-700 bg-red-50 border-red-200" : "text-yellow-800 bg-yellow-50 border-yellow-200";

  return (
    <div className={`rounded-md border p-3 ${color}`}>
      <p className="mb-2 font-medium text-sm">{label}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b">
              <th className="pb-1 pr-4 text-left">{t("admin.dataImport.preview.row")}</th>
              <th className="pb-1 pr-4 text-left">{t("admin.dataImport.preview.column")}</th>
              <th className="pb-1 text-left">{t("admin.dataImport.preview.message")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-current/10">
                <td className="py-0.5 pr-4">{r.row}</td>
                <td className="py-0.5 pr-4">{r.col ?? "—"}</td>
                <td className="py-0.5">{r.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create ImportSection.tsx**

```tsx
// apps/web/src/pages/admin/import/ImportSection.tsx
import { useMutation, useQuery } from "@tanstack/react-query";
import { Download, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";
import { PreviewTable } from "./PreviewTable";

type ImportType = "academic-structure" | "people" | "enrollments" | "grades-bulk";

interface Props {
  type: ImportType;
  prereqHint?: string;
}

type PreviewSummary = {
  errors?: Array<{ row: number; col?: string; message: string }>;
  warnings?: Array<{ row: number; col?: string; message: string }>;
  [key: string]: unknown;
};

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? "";

export function ImportSection({ type, prereqHint }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [previewSummary, setPreviewSummary] = useState<PreviewSummary | null>(null);

  const templateUrlQuery = useQuery(
    trpc.dataImport.getTemplateUrl.queryOptions({ type }),
  );

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${SERVER_URL}/api/import/upload`, {
        method: "POST",
        body: form,
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(err.error ?? "Upload failed");
      }
      return res.json() as Promise<{ fileId: string }>;
    },
    onSuccess: async (data) => {
      setFileId(data.fileId);
      toast.success(t("admin.dataImport.toast.uploadOk"));
      previewMutation.mutate(data.fileId);
    },
    onError: (err) => toast.error(err.message),
  });

  const batchJobType = {
    "academic-structure": "import.academicStructure",
    "people": "import.people",
    "enrollments": "import.enrollments",
    "grades-bulk": "import.gradesBulk",
  } as const;

  const previewMutation = useMutation({
    mutationFn: (fId: string) =>
      trpcClient.batchJobs.preview.mutate({
        type: batchJobType[type],
        params: { fileId: fId },
      }),
    onSuccess: (data) => {
      setJobId(data.id);
      setPreviewSummary((data.previewResult ?? {}) as PreviewSummary);
    },
    onError: (err) => toast.error(err.message),
  });

  const runMutation = useMutation({
    mutationFn: () => trpcClient.batchJobs.run.mutate({ jobId: jobId! }),
    onSuccess: () => {
      toast.success(t("admin.dataImport.toast.importStarted"));
      navigate(`/admin/batch-jobs/${jobId}`);
    },
    onError: (err) => toast.error(err.message),
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setFileId(null);
    setJobId(null);
    setPreviewSummary(null);
    uploadMutation.mutate(file);
  }

  function reset() {
    setFileId(null);
    setFileName(null);
    setJobId(null);
    setPreviewSummary(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const errors = previewSummary?.errors ?? [];
  const warnings = previewSummary?.warnings ?? [];
  const hasErrors = errors.length > 0;
  const isLoading = uploadMutation.isPending || previewMutation.isPending;

  return (
    <div className="space-y-5">
      {prereqHint && (
        <p className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-blue-800 text-sm">
          {prereqHint}
        </p>
      )}

      {/* Download template */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <p className="font-medium text-sm">Modèle Excel</p>
          <p className="text-muted-foreground text-xs">{t("admin.dataImport.uploadZoneAccept")}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          asChild
          disabled={!templateUrlQuery.data}
        >
          <a href={templateUrlQuery.data?.url} download>
            <Download className="mr-2 h-4 w-4" />
            {t("admin.dataImport.downloadTemplate")}
          </a>
        </Button>
      </div>

      {/* Upload zone */}
      <div
        className="cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors hover:border-primary hover:bg-accent/30"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) {
            setFileName(file.name);
            uploadMutation.mutate(file);
          }
        }}
      >
        <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm">
          {fileName
            ? <span className="font-medium">{fileName}</span>
            : t("admin.dataImport.uploadZone")}
        </p>
        <p className="mt-1 text-muted-foreground text-xs">{t("admin.dataImport.uploadZoneAccept")}</p>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.csv"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Loading state */}
      {isLoading && (
        <p className="text-center text-muted-foreground text-sm animate-pulse">
          {uploadMutation.isPending ? t("admin.dataImport.uploading") : t("admin.dataImport.previewing")}
        </p>
      )}

      {/* Preview results */}
      {previewSummary && !isLoading && (
        <div className="space-y-3">
          {/* Summary chips */}
          <div className="flex flex-wrap gap-2 text-sm">
            {Object.entries(previewSummary)
              .filter(([k]) => k !== "errors" && k !== "warnings")
              .map(([k, v]) => (
                <span key={k} className="rounded-full border bg-muted px-3 py-0.5 text-xs">
                  {k}: <strong>{String(v)}</strong>
                </span>
              ))}
          </div>
          <PreviewTable rows={errors} label={t("admin.dataImport.preview.errors", { count: errors.length })} variant="error" />
          <PreviewTable rows={warnings} label={t("admin.dataImport.preview.warnings", { count: warnings.length })} variant="warning" />
          {errors.length === 0 && (
            <p className="text-green-700 text-sm">✓ {t("admin.dataImport.preview.noErrors")}</p>
          )}
        </div>
      )}

      {/* Action buttons */}
      {previewSummary && !isLoading && (
        <div className="flex gap-2">
          <Button variant="outline" onClick={reset} size="sm">
            Nouveau fichier
          </Button>
          <Button
            onClick={() => runMutation.mutate()}
            disabled={hasErrors || runMutation.isPending || !jobId}
            size="sm"
          >
            {t(hasErrors ? "admin.dataImport.errorBlocker" : "admin.dataImport.confirm")}
          </Button>
        </div>
      )}
    </div>
  );
}
```

---

### Task 10: Frontend — DataImportHub page + routing + nav

**Files:**
- Create: `apps/web/src/pages/admin/import/DataImportHub.tsx`
- Modify: `apps/web/src/App.tsx`
- Modify: admin sidebar nav component (find via grep)

**Interfaces:**
- Consumes: `ImportSection`, i18n keys `admin.dataImport.*`

- [ ] **Step 1: Find sidebar nav file**

```bash
grep -rn "batch-jobs\|batchJobs\|Batch" /home/yvan/Workspaces/Projects/sgn/grades-manager-api/apps/web/src --include="*.tsx" -l | head -5
```

Use the result to find where to add the Import nav link.

- [ ] **Step 2: Create DataImportHub.tsx**

```tsx
// apps/web/src/pages/admin/import/DataImportHub.tsx
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImportSection } from "./ImportSection";

export default function DataImportHub() {
  const { t } = useTranslation();

  return (
    <div className="container max-w-3xl py-8">
      <div className="mb-6">
        <h1 className="font-bold text-2xl">{t("admin.dataImport.title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("admin.dataImport.subtitle")}</p>
      </div>

      <Tabs defaultValue="structure">
        <TabsList className="mb-6 grid w-full grid-cols-4">
          <TabsTrigger value="structure">{t("admin.dataImport.tabs.structure")}</TabsTrigger>
          <TabsTrigger value="people">{t("admin.dataImport.tabs.people")}</TabsTrigger>
          <TabsTrigger value="enrollments">{t("admin.dataImport.tabs.enrollments")}</TabsTrigger>
          <TabsTrigger value="grades">{t("admin.dataImport.tabs.grades")}</TabsTrigger>
        </TabsList>

        <TabsContent value="structure">
          <ImportSection type="academic-structure" />
        </TabsContent>
        <TabsContent value="people">
          <ImportSection
            type="people"
            prereqHint={t("admin.dataImport.prereqHint.people")}
          />
        </TabsContent>
        <TabsContent value="enrollments">
          <ImportSection
            type="enrollments"
            prereqHint={t("admin.dataImport.prereqHint.enrollments")}
          />
        </TabsContent>
        <TabsContent value="grades">
          <ImportSection
            type="grades-bulk"
            prereqHint={t("admin.dataImport.prereqHint.grades")}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 3: Add route in App.tsx**

Find the admin routes section in `apps/web/src/App.tsx` (around line 499 where other admin routes are). Add:

```tsx
import DataImportHub from "./pages/admin/import/DataImportHub";

// Inside admin <Route> block:
<Route path="import" element={<DataImportHub />} />
```

- [ ] **Step 4: Add nav link to admin sidebar**

Grep for the sidebar component with batch-jobs link and add an "Import données" link using the same pattern, pointing to `/admin/import`. Use a `Database` or `Upload` icon from lucide-react.

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd /path/to/project && bun check-types 2>&1 | grep -E "DataImportHub|ImportSection|import-hub" | head -10
```

Expected: no errors.
