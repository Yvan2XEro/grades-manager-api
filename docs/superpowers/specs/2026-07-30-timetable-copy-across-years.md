# Timetable Copy Across Academic Years — Design Spec

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow administrators to copy timetable sessions from one academic year to another, either as an optional step of the existing `academicYear.setup` batch job or as a standalone `timetable.copyFromYear` batch job.

**Architecture:** A shared function `copySessionsAcrossYears()` in `timetable.service.ts` holds all the matching and insertion logic. Both the extended `academicYear.setup` job and the new standalone `timetable.copyFromYear` job call this function, passing a pre-built `classMapping` (sourceClassId → targetClassId). Each job also provides its own preview, rollback, and UI entry point.

**Tech Stack:** Drizzle ORM, tRPC (adminProcedure), Bun, React + shadcn/ui, react-hook-form + zod, i18next

## Global Constraints

- No new DB migration needed — only existing tables (`course_sessions`, `classes`, `class_courses`, `academic_years`) are used
- All data access must be scoped to `institutionId`
- Idempotent: re-running the copy on an already-copied timetable skips existing sessions (same `classCourseId` + `dayOfWeek` + `startTime` = duplicate)
- Non-matching sessions are **skipped silently** (not errors) — logged in the batch job report with count
- Never copy `id`, `createdAt`, `updatedAt` — always generate fresh values
- Follow existing batch job pattern: `preview()` → `executeStep()` → optional `rollback()`, all in `apps/server/src/modules/batch-jobs/job-types/`
- i18n: add keys to both `apps/web/src/i18n/locales/fr/translation.json` and `apps/web/src/i18n/locales/en/translation.json`
- Run `bun check` and `bun check-types` before marking implementation complete

---

## Data Model

### `course_sessions` table (existing, read-only reference)

| Column | Type | Notes |
|---|---|---|
| `id` | text PK | `gen_random_uuid()` |
| `institutionId` | text FK | institutions.id |
| `classCourseId` | text FK | class_courses.id — **changes between years** |
| `academicYearId` | text FK | academic_years.id |
| `dayOfWeek` | text | `'mon'|'tue'|'wed'|'thu'|'fri'|'sat'|'sun'` |
| `startTime` | text | `HH:MM` |
| `endTime` | text | `HH:MM` |
| `room` | text nullable | free-text label |
| `roomId` | text FK nullable | rooms.id |
| `semesterId` | text FK nullable | semesters.id |
| `validFrom` | date nullable | |
| `validUntil` | date nullable | |

### Matching logic

`classCourse` IDs change every year because classes are recreated. To match source sessions to target year:

1. Source session → source `classCourse` (get `code` + `class` id)
2. Source `class` → get `code`
3. Find target `class` by same `code` in `targetAcademicYearId` (via `classMapping`)
4. In target class, find `classCourse` with same `code`
5. If found → copy session; if not → `notMatched++`

---

## Backend

### Task 1 — Shared function `copySessionsAcrossYears()`

**File:** `apps/server/src/modules/timetable/timetable.service.ts`

Add at the bottom of the file:

```ts
export type CopySessionsResult = {
  copied: number;
  skipped: number;
  notMatched: number;
};

/**
 * Copies all timetable sessions from sourceYearId to targetYearId.
 * classMapping: Record<sourceClassId, targetClassId> — used to resolve
 * the matching classCourse in the target year.
 * Sessions that cannot be matched are counted in notMatched and skipped.
 * Duplicate detection: same classCourseId + dayOfWeek + startTime in target year → skip.
 */
export async function copySessionsAcrossYears(
  sourceYearId: string,
  targetYearId: string,
  institutionId: string,
  classMapping: Record<string, string>,
): Promise<CopySessionsResult> {
  const result: CopySessionsResult = { copied: 0, skipped: 0, notMatched: 0 };

  const sourceSessions = await db.query.courseSessions.findMany({
    where: and(
      eq(schema.courseSessions.academicYearId, sourceYearId),
      eq(schema.courseSessions.institutionId, institutionId),
    ),
    with: { classCourse: true },
  });

  for (const session of sourceSessions) {
    const sourceClassId = session.classCourse?.class;
    if (!sourceClassId) { result.notMatched++; continue; }

    const targetClassId = classMapping[sourceClassId];
    if (!targetClassId) { result.notMatched++; continue; }

    const targetCC = await db.query.classCourses.findFirst({
      where: and(
        eq(schema.classCourses.class, targetClassId),
        eq(schema.classCourses.code, session.classCourse.code),
        eq(schema.classCourses.institutionId, institutionId),
      ),
    });
    if (!targetCC) { result.notMatched++; continue; }

    // Idempotency check
    const existing = await db.query.courseSessions.findFirst({
      where: and(
        eq(schema.courseSessions.classCourseId, targetCC.id),
        eq(schema.courseSessions.dayOfWeek, session.dayOfWeek),
        eq(schema.courseSessions.startTime, session.startTime),
        eq(schema.courseSessions.academicYearId, targetYearId),
      ),
    });
    if (existing) { result.skipped++; continue; }

    await db.insert(schema.courseSessions).values({
      institutionId,
      classCourseId: targetCC.id,
      academicYearId: targetYearId,
      dayOfWeek: session.dayOfWeek,
      startTime: session.startTime,
      endTime: session.endTime,
      room: session.room,
      roomId: session.roomId,
      semesterId: session.semesterId,
      validFrom: session.validFrom,
      validUntil: session.validUntil,
    });
    result.copied++;
  }

  return result;
}
```

No tests needed for this function directly — it's covered by the batch job tests.

---

### Task 2 — Extend `academicYear.setup` with optional timetable step

**File:** `apps/server/src/modules/batch-jobs/job-types/academic-year-setup.ts`

**Changes:**

1. Extend `paramsSchema`:
```ts
const paramsSchema = z.object({
  sourceAcademicYearId: z.string(),
  targetAcademicYearId: z.string(),
  includeTimetable: z.boolean().default(false),
});
```

2. In `preview()`, add timetable session count to summary when `includeTimetable: true`:
```ts
// after existing classCourses count query...
let sessionCount = 0;
if (params.includeTimetable) {
  const sessions = await db
    .select({ id: schema.courseSessions.id })
    .from(schema.courseSessions)
    .where(
      and(
        eq(schema.courseSessions.academicYearId, params.sourceAcademicYearId),
        eq(schema.courseSessions.institutionId, ctx.institutionId),
      ),
    );
  sessionCount = sessions.length;
}

const steps = [
  { name: "Copy classes", estimatedItems: sourceClasses.length },
  { name: "Copy class course assignments", estimatedItems: classCourses.length },
  ...(params.includeTimetable
    ? [{ name: "Copy timetable sessions", estimatedItems: sessionCount }]
    : []),
];

return {
  steps,
  summary: {
    sourceYearName: sourceYear.name,
    targetYearName: targetYear.name,
    classCount: sourceClasses.length,
    classCourseCount: classCourses.length,
    sessionCount,
  },
  totalItems: sourceClasses.length + classCourses.length + sessionCount,
} satisfies PreviewResult;
```

3. In `executeStep()`, add step 2:
```ts
} else if (step.stepIndex === 2 && params.includeTimetable) {
  await executeCopyTimetable(params, step, ctx);
}
```

4. New `executeCopyTimetable()` function at bottom of file:
```ts
async function executeCopyTimetable(
  params: Params,
  step: schema.BatchJobStep,
  ctx: JobContext,
) {
  // Rebuild classMapping from step 0 data
  const steps = await repo.getStepsForJob(ctx.jobId);
  const step0 = steps.find((s) => s.stepIndex === 0);
  const classMapping = (step0?.data as { classMapping?: Record<string, string> })?.classMapping ?? {};

  const { copySessionsAcrossYears } = await import("../../timetable/timetable.service");
  const result = await copySessionsAcrossYears(
    params.sourceAcademicYearId,
    params.targetAcademicYearId,
    ctx.institutionId,
    classMapping,
  );

  await ctx.reportStepProgress(step.id, {
    itemsProcessed: result.copied + result.skipped,
    itemsSkipped: result.skipped,
  });

  await ctx.log(
    "info",
    `Timetable: copied ${result.copied}, skipped ${result.skipped} (already existed), not matched ${result.notMatched} (course not found in target year)`,
  );
}
```

5. Extend `rollback()` to also delete sessions when `includeTimetable: true`:
```ts
if (params.includeTimetable) {
  await db
    .delete(schema.courseSessions)
    .where(
      and(
        eq(schema.courseSessions.academicYearId, params.targetAcademicYearId),
        eq(schema.courseSessions.institutionId, ctx.institutionId),
      ),
    );
  await ctx.log("info", "Rolled back: deleted timetable sessions from target year");
}
```

---

### Task 3 — New batch job `timetable.copyFromYear`

**File (create):** `apps/server/src/modules/batch-jobs/job-types/timetable-copy.ts`

```ts
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import type { BatchJobDefinition, JobContext, PreviewResult } from "../batch-jobs.types";

const paramsSchema = z.object({
  sourceAcademicYearId: z.string(),
  targetAcademicYearId: z.string(),
});
type Params = z.infer<typeof paramsSchema>;

export const timetableCopyJob: BatchJobDefinition<Params> = {
  type: "timetable.copyFromYear",
  label: "Copy Timetable from Year",

  parseParams(raw) { return paramsSchema.parse(raw); },

  async preview(params, ctx) {
    if (params.sourceAcademicYearId === params.targetAcademicYearId) {
      throw new Error("Source and target academic years must be different");
    }

    const sourceYear = await db.query.academicYears.findFirst({
      where: eq(schema.academicYears.id, params.sourceAcademicYearId),
    });
    if (!sourceYear) throw new Error("Source academic year not found");

    const targetYear = await db.query.academicYears.findFirst({
      where: eq(schema.academicYears.id, params.targetAcademicYearId),
    });
    if (!targetYear) throw new Error("Target academic year not found");

    const sessions = await db
      .select({ id: schema.courseSessions.id })
      .from(schema.courseSessions)
      .where(
        and(
          eq(schema.courseSessions.academicYearId, params.sourceAcademicYearId),
          eq(schema.courseSessions.institutionId, ctx.institutionId),
        ),
      );

    if (sessions.length === 0) {
      throw new Error(`No timetable sessions found in "${sourceYear.name}"`);
    }

    await ctx.log(
      "info",
      `Preview: ${sessions.length} sessions from "${sourceYear.name}" → "${targetYear.name}"`,
    );

    return {
      steps: [{ name: "Copy timetable sessions", estimatedItems: sessions.length }],
      summary: {
        sourceYearName: sourceYear.name,
        targetYearName: targetYear.name,
        sessionCount: sessions.length,
      },
      totalItems: sessions.length,
    } satisfies PreviewResult;
  },

  async executeStep(params, step, ctx) {
    // Build classMapping: source class.id → target class.id (matched by code + program)
    const sourceClasses = await db.query.classes.findMany({
      where: and(
        eq(schema.classes.academicYear, params.sourceAcademicYearId),
        eq(schema.classes.institutionId, ctx.institutionId),
      ),
    });

    const targetClasses = await db.query.classes.findMany({
      where: and(
        eq(schema.classes.academicYear, params.targetAcademicYearId),
        eq(schema.classes.institutionId, ctx.institutionId),
      ),
    });

    // Match by code (within same institution)
    const targetByCode = new Map(targetClasses.map((c) => [c.code, c.id]));
    const classMapping: Record<string, string> = {};
    for (const src of sourceClasses) {
      const targetId = targetByCode.get(src.code);
      if (targetId) classMapping[src.id] = targetId;
    }

    const { copySessionsAcrossYears } = await import("../../timetable/timetable.service");
    const result = await copySessionsAcrossYears(
      params.sourceAcademicYearId,
      params.targetAcademicYearId,
      ctx.institutionId,
      classMapping,
    );

    await ctx.reportStepProgress(step.id, {
      itemsProcessed: result.copied + result.skipped,
      itemsSkipped: result.skipped,
    });

    await ctx.log(
      "info",
      `Copied ${result.copied} sessions, skipped ${result.skipped} (already existed), ${result.notMatched} not matched (course missing in target year)`,
    );
  },

  async rollback(params, ctx) {
    await ctx.log("info", "Rolling back timetable copy...");
    await db
      .delete(schema.courseSessions)
      .where(
        and(
          eq(schema.courseSessions.academicYearId, params.targetAcademicYearId),
          eq(schema.courseSessions.institutionId, ctx.institutionId),
        ),
      );
    await ctx.log("info", "Rolled back: deleted timetable sessions from target year");
  },
};
```

**Register in `index.ts`:**
```ts
import { timetableCopyJob } from "./timetable-copy";
// ...
registerJobType(timetableCopyJob);
```

---

## Frontend

### Task 4 — `AcademicYearSetupDialog.tsx` — Checkbox "Inclure l'emploi du temps"

**File:** `apps/web/src/pages/admin/AcademicYearSetupDialog.tsx`

**Changes:**

1. Add local state: `const [includeTimetable, setIncludeTimetable] = useState(false);`

2. Add to `PreviewData.summary`:
```ts
summary: {
  sourceYearName: string;
  targetYearName: string;
  classCount: number;
  classCourseCount: number;
  sessionCount: number;
};
```

3. Pass `includeTimetable` to `batchJobs.preview.mutate()`:
```ts
params: {
  sourceAcademicYearId: sourceYearId!,
  targetAcademicYearId: targetYear.id,
  includeTimetable,
},
```

4. In the source year selection form, add below the `AcademicYearSelect`:
```tsx
<div className="flex items-center gap-2 pt-1">
  <Checkbox
    id="include-timetable"
    checked={includeTimetable}
    onCheckedChange={(v) => setIncludeTimetable(!!v)}
  />
  <label htmlFor="include-timetable" className="text-sm cursor-pointer">
    {t("admin.academicYears.setup.includeTimetable")}
  </label>
</div>
```

5. In the preview step, when `includeTimetable` and `summary.sessionCount > 0`, show a summary line:
```tsx
{includeTimetable && (
  <p className="text-muted-foreground text-sm">
    {t("admin.academicYears.setup.timetableSummary", {
      count: previewData.summary.sessionCount,
    })}
  </p>
)}
```

6. Reset `includeTimetable` in `handleClose()`.

---

### Task 5 — `TimetableManagement.tsx` — Bouton + dialog `CopyTimetableDialog`

**New file:** `apps/web/src/pages/admin/timetable/CopyTimetableDialog.tsx`

Props:
```ts
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentYearId: string | null;
}
```

Two-step flow (same as `AcademicYearSetupDialog`):

**Step 1 — Source year selection:**
- `AcademicYearSelect` (exclude `currentYearId`)
- Button "Prévisualiser" → call `batchJobs.preview({ type: "timetable.copyFromYear", params: { sourceAcademicYearId, targetAcademicYearId: currentYearId } })`

**Step 2 — Preview:**
- Summary: `"X séances de l'année [source] → [cible]"`
- Steps list (matches `AcademicYearSetupDialog` display pattern)
- Button "Lancer la copie" → `batchJobs.run({ jobId })` → `navigate(/admin/batch-jobs/:jobId)`

**In `TimetableManagement.tsx`:**
- Add `Copy` icon import from lucide
- Add state: `const [copyOpen, setCopyOpen] = useState(false);`
- Add button in action bar (à côté du bouton Import):
```tsx
<Button variant="outline" size="sm" onClick={() => setCopyOpen(true)}>
  <Copy className="mr-1.5 h-4 w-4" />
  {t("teacher.timetable.copyFromYear")}
</Button>
```
- Render `<CopyTimetableDialog open={copyOpen} onOpenChange={setCopyOpen} currentYearId={academicYearId} />`

The button is always visible (not disabled when no sessions) — the admin may want to copy even if the current year is empty.

---

## i18n Keys

### `fr/translation.json`

Under `admin.academicYears.setup`:
```json
"includeTimetable": "Inclure l'emploi du temps",
"timetableSummary": "{{count}} séance(s) à copier depuis l'année source"
```

Under `teacher.timetable`:
```json
"copyFromYear": "Copier depuis une autre année"
```

New top-level namespace `admin.timetable`:
```json
"copyDialog": {
  "title": "Copier l'emploi du temps",
  "description": "Copie les séances d'une autre année académique vers l'année cible sélectionnée.",
  "sourceYear": "Année source",
  "sourceYearPlaceholder": "Sélectionner l'année à copier",
  "previewSummary": "{{count}} séance(s) de \"{{sourceYearName}}\" vers \"{{targetYearName}}\"",
  "confirm": "Lancer la copie",
  "success": "Copie lancée avec succès"
}
```

### `en/translation.json`

Same keys in English:
```json
"includeTimetable": "Include timetable",
"timetableSummary": "{{count}} session(s) to copy from source year"

"copyFromYear": "Copy from another year"

"copyDialog": {
  "title": "Copy Timetable",
  "description": "Copies sessions from another academic year into the selected target year.",
  "sourceYear": "Source year",
  "sourceYearPlaceholder": "Select the year to copy from",
  "previewSummary": "{{count}} session(s) from \"{{sourceYearName}}\" to \"{{targetYearName}}\"",
  "confirm": "Start copy",
  "success": "Copy started successfully"
}
```

---

## Error Cases

| Situation | Comportement |
|---|---|
| Source = cible | Erreur dans `preview()` : "Source and target must be different" |
| Aucune séance dans la source | Erreur dans `preview()` : "No sessions found in source year" |
| Classe cible absente (setup non fait) | Sessions concernées → `notMatched`, loguées, job continue |
| ClassCourse cible absent | Idem |
| Session déjà existante (même slot) | `skipped`, job continue |
| `currentYearId` null | Bouton désactivé dans l'UI |

---

## Scope Hors Spec

Les éléments suivants ne font **pas** partie de cette spec :
- Copie des présences (`attendance_sessions`)
- Synchronisation automatique au changement d'année active
- Interface de diff avant/après copie
- Gestion des conflits de salles
