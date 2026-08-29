# Pagination Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every infinite-scroll and cursor-prev/next list in the admin/dean frontend with offset-based page/pageSize pagination backed by new `listPaged` tRPC procedures, matching the existing `users.listPaged` + `TablePagination` pattern.

**Architecture:** Each affected backend module gets a new `listPaged` procedure (alongside the existing cursor `list`, which stays untouched for dropdowns/autocomplete). The frontend replaces `useInfiniteQuery`/`useInfiniteScroll` sentinel divs (or `useCursorPagination`/`PaginationBar`) with `useQuery` + `<TablePagination>`. All 17 pages are covered.

**Tech Stack:** Bun, Drizzle ORM, tRPC, React 18, React Query, `@/components/ui/table-pagination`, Zod

## Global Constraints

- Keep every existing cursor-based `list` procedure unchanged — dropdowns and other callers depend on it.
- New procedures are always named `listPaged` on the router (exception: `graduatedStudentsPaged`, `promotionPreviewPaged` in the classes router, which already have `graduatedStudents`/`promotionPreview`).
- `listPaged` output shape: `{ items: T[], total: number, pageCount: number }`. No `nextCursor`.
- `listPaged` input always includes `page: z.number().int().min(1).default(1)` and `pageSize: z.number().int().min(1).max(100).default(25)`.
- `pageSize` is server-clamped: `Math.min(Math.max(pageSize, 1), 100)`.
- Frontend default `pageSize`: 25. Default `page`: 1. Both reset when a filter changes.
- `TablePagination` import: `import { TablePagination } from "@/components/ui/table-pagination"`.
- Mutation invalidations use `queryClient.invalidateQueries(trpc.X.listPaged.queryKey())` (no args = invalidate all pages).
- Backend tests run from `apps/server/` directory: `cd apps/server && bun test src/modules/<name>/__tests__/<name>.caller.test.ts`.
- Use `makeTestContext`, `asAdmin`, `asSuperAdmin` from `lib/test-utils.ts` and `appRouter.createCaller(ctx)`.
- No new files for simple modules — add functions to existing `.zod.ts`, `.repo.ts`, `.service.ts`, `.router.ts`.

---

## Reference Pattern (read before any task)

### Backend reference: `apps/server/src/modules/users/users.listpaged.repo.ts`
### Frontend reference: `apps/web/src/pages/admin/users/PeopleManagement.tsx`

**Frontend shape — what every converted page must look like:**

```tsx
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { TablePagination } from "@/components/ui/table-pagination";
import { trpc, trpcClient } from "@/utils/trpc";

// Inside component:
const [page, setPage] = useState(1);
const [pageSize, setPageSize] = useState(25);

// Wrap every filter setter so page resets to 1:
const handleFilter =
  <T,>(setter: (v: T) => void) =>
  (value: T) => {
    setter(value);
    setPage(1);
  };

const { data, isLoading } = useQuery(
  trpc.X.listPaged.queryOptions({ page, pageSize, ...filters }),
);

const items = data?.items ?? [];

// In JSX, at the bottom of the table card (NOT a scroll sentinel):
<TablePagination
  page={page}
  pageCount={data?.pageCount ?? 1}
  total={data?.total ?? 0}
  pageSize={pageSize}
  onPageChange={setPage}
  onPageSizeChange={(s) => {
    setPageSize(s);
    setPage(1);
  }}
/>

// Mutation onSuccess:
onSuccess: () => {
  queryClient.invalidateQueries(trpc.X.listPaged.queryKey());
}
```

---

## Task 1 — Backend: teaching-units, study-cycles, academic-years, exam-types

**Files (all modifications, no new files):**
- Modify: `apps/server/src/modules/teaching-units/teaching-units.zod.ts`
- Modify: `apps/server/src/modules/teaching-units/teaching-units.repo.ts`
- Modify: `apps/server/src/modules/teaching-units/teaching-units.service.ts`
- Modify: `apps/server/src/modules/teaching-units/teaching-units.router.ts`
- Modify: `apps/server/src/modules/study-cycles/study-cycles.zod.ts`
- Modify: `apps/server/src/modules/study-cycles/study-cycles.repo.ts`
- Modify: `apps/server/src/modules/study-cycles/study-cycles.service.ts`
- Modify: `apps/server/src/modules/study-cycles/study-cycles.router.ts`
- Modify: `apps/server/src/modules/academic-years/academic-years.zod.ts`
- Modify: `apps/server/src/modules/academic-years/academic-years.repo.ts`
- Modify: `apps/server/src/modules/academic-years/academic-years.service.ts`
- Modify: `apps/server/src/modules/academic-years/academic-years.router.ts`
- Modify: `apps/server/src/modules/exam-types/exam-types.zod.ts`
- Modify: `apps/server/src/modules/exam-types/exam-types.repo.ts`
- Modify: `apps/server/src/modules/exam-types/exam-types.service.ts`
- Modify: `apps/server/src/modules/exam-types/exam-types.router.ts`
- Test: `apps/server/src/modules/teaching-units/__tests__/teaching-units.caller.test.ts`
- Test: `apps/server/src/modules/study-cycles/__tests__/study-cycles.caller.test.ts`
- Test: `apps/server/src/modules/academic-years/__tests__/academic-years.caller.test.ts`
- Test: `apps/server/src/modules/exam-types/__tests__/exam-types.caller.test.ts`

**Interfaces — Produces:**
- `trpc.teachingUnits.listPaged.queryOptions({ page, pageSize, programId? })` → `{ items, total, pageCount }`
- `trpc.studyCycles.listPaged.queryOptions({ page, pageSize })` → `{ items, total, pageCount }`
- `trpc.academicYears.listPaged.queryOptions({ page, pageSize })` → `{ items, total, pageCount }`
- `trpc.examTypes.listPaged.queryOptions({ page, pageSize })` → `{ items, total, pageCount }`

All four use `protectedProcedure`.

- [ ] **Step 1: Write the 4 failing tests**

Add to each existing test file (or create if absent). Pattern is identical — fill in the module name:

`apps/server/src/modules/teaching-units/__tests__/teaching-units.caller.test.ts`:
```ts
import { describe, expect, test } from "bun:test";
import { makeTestContext, asAdmin } from "@/lib/test-utils";
import { appRouter } from "@/routers";

describe("teachingUnits.listPaged", () => {
  test("returns { items, total, pageCount }", async () => {
    const ctx = await makeTestContext(await asAdmin());
    const caller = appRouter.createCaller(ctx);
    const result = await caller.teachingUnits.listPaged({ page: 1, pageSize: 25 });
    expect(result).toMatchObject({
      items: expect.any(Array),
      total: expect.any(Number),
      pageCount: expect.any(Number),
    });
  });
});
```

Repeat verbatim for `study-cycles.caller.test.ts` (`caller.studyCycles.listPaged`), `academic-years.caller.test.ts` (`caller.academicYears.listPaged`), `exam-types.caller.test.ts` (`caller.examTypes.listPaged`).

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd apps/server
bun test src/modules/teaching-units/__tests__/teaching-units.caller.test.ts --test-name-pattern "listPaged"
```

Expected: FAIL — "teachingUnits.listPaged is not a function" or similar.

- [ ] **Step 3: teaching-units — add `listPagedSchema` to zod**

In `apps/server/src/modules/teaching-units/teaching-units.zod.ts`, add after `listSchema`:

```ts
export const listPagedSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
  programId: z.string().optional(),
});
```

- [ ] **Step 4: teaching-units — add `listPaged` to repo**

In `apps/server/src/modules/teaching-units/teaching-units.repo.ts`, add `count` to the drizzle import and add the function:

```ts
import { and, count, eq, gt } from "drizzle-orm";

// ... (keep existing exports) ...

export async function listPaged(
  institutionId: string,
  opts: { page: number; pageSize: number; programId?: string },
) {
  const size = Math.min(Math.max(opts.pageSize, 1), 100);
  const offset = (Math.max(opts.page, 1) - 1) * size;
  const conditions = [
    eq(schema.programs.institutionId, institutionId),
    opts.programId ? eq(schema.teachingUnits.programId, opts.programId) : undefined,
  ].filter(Boolean) as ReturnType<typeof eq>[];
  const where = conditions.length > 1 ? and(...conditions) : conditions[0];

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: schema.teachingUnits.id,
        programId: schema.teachingUnits.programId,
        name: schema.teachingUnits.name,
        code: schema.teachingUnits.code,
        description: schema.teachingUnits.description,
        credits: schema.teachingUnits.credits,
        semester: schema.teachingUnits.semester,
        createdAt: schema.teachingUnits.createdAt,
      })
      .from(schema.teachingUnits)
      .innerJoin(schema.programs, eq(schema.teachingUnits.programId, schema.programs.id))
      .where(where)
      .orderBy(schema.teachingUnits.name)
      .limit(size)
      .offset(offset),
    db
      .select({ total: count() })
      .from(schema.teachingUnits)
      .innerJoin(schema.programs, eq(schema.teachingUnits.programId, schema.programs.id))
      .where(where),
  ]);
  const totalCount = Number(total ?? 0);
  return { items: rows, total: totalCount, pageCount: Math.ceil(totalCount / size) };
}
```

- [ ] **Step 5: teaching-units — add service wrapper + router procedure**

In `apps/server/src/modules/teaching-units/teaching-units.service.ts`, add:

```ts
import * as z from "zod";
import { listPagedSchema } from "./teaching-units.zod";

export async function listUnitsPaged(
  input: z.infer<typeof listPagedSchema>,
  institutionId: string,
) {
  return repo.listPaged(institutionId, input);
}
```

In `apps/server/src/modules/teaching-units/teaching-units.router.ts`, import `listPagedSchema` and add:

```ts
listPaged: protectedProcedure
  .input(listPagedSchema)
  .query(({ input, ctx }) => service.listUnitsPaged(input, ctx.institution.id)),
```

- [ ] **Step 6: study-cycles — zod + repo + service + router**

`study-cycles.zod.ts` — add after `cycleListSchema`:
```ts
export const listCyclesPagedSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
});
```

`study-cycles.repo.ts` — add `count` to imports, add function:
```ts
import { and, count, eq, gt } from "drizzle-orm";

export async function listCyclesPaged(
  institutionId: string,
  opts: { page: number; pageSize: number },
) {
  const size = Math.min(Math.max(opts.pageSize, 1), 100);
  const offset = (Math.max(opts.page, 1) - 1) * size;
  const where = eq(schema.studyCycles.institutionId, institutionId);

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: schema.studyCycles.id,
        institutionId: schema.studyCycles.institutionId,
        code: schema.studyCycles.code,
        name: schema.studyCycles.name,
        nameEn: schema.studyCycles.nameEn,
        description: schema.studyCycles.description,
        totalCreditsRequired: schema.studyCycles.totalCreditsRequired,
        durationYears: schema.studyCycles.durationYears,
        createdAt: schema.studyCycles.createdAt,
      })
      .from(schema.studyCycles)
      .where(where)
      .orderBy(schema.studyCycles.name)
      .limit(size)
      .offset(offset),
    db.select({ total: count() }).from(schema.studyCycles).where(where),
  ]);
  const totalCount = Number(total ?? 0);
  return { items: rows, total: totalCount, pageCount: Math.ceil(totalCount / size) };
}
```

`study-cycles.service.ts` — add:
```ts
import { listCyclesPagedSchema } from "./study-cycles.zod";
export async function listCyclesPaged(
  input: z.infer<typeof listCyclesPagedSchema>,
  institutionId: string,
) {
  return repo.listCyclesPaged(institutionId, input);
}
```

`study-cycles.router.ts` — add:
```ts
listPaged: protectedProcedure
  .input(listCyclesPagedSchema)
  .query(({ ctx, input }) => service.listCyclesPaged(input, ctx.institution.id)),
```

- [ ] **Step 7: academic-years — zod + repo + service + router**

`academic-years.zod.ts` — add:
```ts
export const listPagedSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
});
```

`academic-years.repo.ts` — `count` is already imported; add:
```ts
export async function listPaged(
  institutionId: string,
  opts: { page: number; pageSize: number },
) {
  const size = Math.min(Math.max(opts.pageSize, 1), 100);
  const offset = (Math.max(opts.page, 1) - 1) * size;
  const where = eq(schema.academicYears.institutionId, institutionId);

  const [rows, [{ total }]] = await Promise.all([
    db.select().from(schema.academicYears).where(where)
      .orderBy(schema.academicYears.startDate, schema.academicYears.id)
      .limit(size).offset(offset),
    db.select({ total: count() }).from(schema.academicYears).where(where),
  ]);
  const totalCount = Number(total ?? 0);
  return { items: rows, total: totalCount, pageCount: Math.ceil(totalCount / size) };
}
```

`academic-years.service.ts` — add:
```ts
export async function listAcademicYearsPaged(
  input: { page: number; pageSize: number },
  institutionId: string,
) {
  return repo.listPaged(institutionId, input);
}
```

`academic-years.router.ts` — import `listPagedSchema` from zod, add:
```ts
listPaged: protectedProcedure
  .input(listPagedSchema)
  .query(({ ctx, input }) => service.listAcademicYearsPaged(input, ctx.institution.id)),
```

- [ ] **Step 8: exam-types — zod + repo + service + router**

`exam-types.zod.ts` — add:
```ts
export const listPagedSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
});
```

`exam-types.repo.ts` — add `count` to imports; add:
```ts
import { and, count, eq, gt } from "drizzle-orm";

export async function listPaged(
  institutionId: string,
  opts: { page: number; pageSize: number },
) {
  const size = Math.min(Math.max(opts.pageSize, 1), 100);
  const offset = (Math.max(opts.page, 1) - 1) * size;
  const where = eq(schema.examTypes.institutionId, institutionId);

  const [rows, [{ total }]] = await Promise.all([
    db.select().from(schema.examTypes).where(where)
      .orderBy(schema.examTypes.name)
      .limit(size).offset(offset),
    db.select({ total: count() }).from(schema.examTypes).where(where),
  ]);
  const totalCount = Number(total ?? 0);
  return { items: rows, total: totalCount, pageCount: Math.ceil(totalCount / size) };
}
```

`exam-types.service.ts` — add:
```ts
export async function listExamTypesPaged(
  input: { page: number; pageSize: number },
  institutionId: string,
) {
  return repo.listPaged(institutionId, input);
}
```

`exam-types.router.ts` — import `listPagedSchema`, add:
```ts
listPaged: protectedProcedure
  .input(listPagedSchema)
  .query(({ ctx, input }) => service.listExamTypesPaged(input, ctx.institution.id)),
```

- [ ] **Step 9: Run all 4 tests — verify they pass**

```bash
cd apps/server
bun test src/modules/teaching-units/__tests__ src/modules/study-cycles/__tests__ src/modules/academic-years/__tests__ src/modules/exam-types/__tests__ --test-name-pattern "listPaged"
```

Expected: 4 PASS.

- [ ] **Step 10: Run the full test suite to check for regressions**

```bash
cd apps/server && bun test
```

Expected: same pass count as before this task, 0 new failures.

- [ ] **Step 11: Commit**

```bash
git add apps/server/src/modules/teaching-units/ apps/server/src/modules/study-cycles/ apps/server/src/modules/academic-years/ apps/server/src/modules/exam-types/
git commit -m "feat(backend): add listPaged to teaching-units, study-cycles, academic-years, exam-types"
```

---

## Task 2 — Backend: courses.listPaged + export-templates.listPaged

**Files:**
- Modify: `apps/server/src/modules/courses/courses.zod.ts`
- Modify: `apps/server/src/modules/courses/courses.repo.ts`
- Modify: `apps/server/src/modules/courses/courses.service.ts`
- Modify: `apps/server/src/modules/courses/courses.router.ts`
- Modify: `apps/server/src/modules/export-templates/export-templates.zod.ts`
- Modify: `apps/server/src/modules/export-templates/export-templates.repo.ts`
- Modify: `apps/server/src/modules/export-templates/export-templates.service.ts`
- Modify: `apps/server/src/modules/export-templates/export-templates.router.ts`
- Test: `apps/server/src/modules/courses/__tests__/courses.caller.test.ts`
- Test: `apps/server/src/modules/export-templates/__tests__/export-templates.caller.test.ts`

**Interfaces — Produces:**
- `trpc.courses.listPaged({ page, pageSize, programId? })` → `{ items, total, pageCount }` (uses `protectedProcedure`)
- `trpc.exportTemplates.listPaged({ page, pageSize, type? })` → `{ items, total, pageCount }` (uses `protectedProcedure`)

- [ ] **Step 1: Write failing tests**

`courses/__tests__/courses.caller.test.ts` — add:
```ts
describe("courses.listPaged", () => {
  test("returns { items, total, pageCount }", async () => {
    const caller = appRouter.createCaller(await makeTestContext(await asAdmin()));
    const result = await caller.courses.listPaged({ page: 1, pageSize: 25 });
    expect(result).toMatchObject({ items: expect.any(Array), total: expect.any(Number), pageCount: expect.any(Number) });
  });
});
```

`export-templates/__tests__/export-templates.caller.test.ts` — same pattern with `caller.exportTemplates.listPaged`.

- [ ] **Step 2: Run to verify failure**

```bash
cd apps/server && bun test src/modules/courses/__tests__ src/modules/export-templates/__tests__ --test-name-pattern "listPaged"
```

Expected: 2 FAIL.

- [ ] **Step 3: courses — zod + repo + service + router**

`courses.zod.ts` — add:
```ts
export const listPagedSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
  programId: z.string().optional(),
  teachingUnitId: z.string().optional(),
});
```

`courses.repo.ts` — add `count` to drizzle imports; add function:
```ts
import { and, count, eq, gt } from "drizzle-orm";

export async function listPaged(
  institutionId: string,
  opts: { page: number; pageSize: number; programId?: string; teachingUnitId?: string },
) {
  const size = Math.min(Math.max(opts.pageSize, 1), 100);
  const offset = (Math.max(opts.page, 1) - 1) * size;
  const conditions = [
    eq(schema.programs.institutionId, institutionId),
    opts.programId ? eq(schema.courses.program, opts.programId) : undefined,
    opts.teachingUnitId ? eq(schema.courses.teachingUnitId, opts.teachingUnitId) : undefined,
  ].filter(Boolean) as ReturnType<typeof eq>[];
  const where = conditions.length > 1 ? and(...conditions) : conditions[0];

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: schema.courses.id,
        code: schema.courses.code,
        name: schema.courses.name,
        hours: schema.courses.hours,
        program: schema.courses.program,
        teachingUnitId: schema.courses.teachingUnitId,
        defaultTeacher: schema.courses.defaultTeacher,
        defaultCoefficient: schema.courses.defaultCoefficient,
        createdAt: schema.courses.createdAt,
      })
      .from(schema.courses)
      .innerJoin(schema.programs, eq(schema.courses.program, schema.programs.id))
      .where(where)
      .orderBy(schema.courses.name)
      .limit(size)
      .offset(offset),
    db
      .select({ total: count() })
      .from(schema.courses)
      .innerJoin(schema.programs, eq(schema.courses.program, schema.programs.id))
      .where(where),
  ]);
  const totalCount = Number(total ?? 0);
  return { items: rows, total: totalCount, pageCount: Math.ceil(totalCount / size) };
}
```

`courses.service.ts` — add:
```ts
export async function listCoursesPaged(
  input: { page: number; pageSize: number; programId?: string; teachingUnitId?: string },
  institutionId: string,
) {
  return repo.listPaged(institutionId, input);
}
```

`courses.router.ts` — import `listPagedSchema`, add:
```ts
listPaged: protectedProcedure
  .input(listPagedSchema)
  .query(({ ctx, input }) => service.listCoursesPaged(input, ctx.institution.id)),
```

- [ ] **Step 4: export-templates — zod + repo + service + router**

The export-templates repo uses `db.query.exportTemplates.findMany` (no raw Drizzle builder). For `listPaged`, use the Drizzle builder directly.

`export-templates.zod.ts` — add after `listExportTemplatesSchema`:
```ts
export const listExportTemplatesPagedSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
  type: templateTypeEnum.optional(),
});
export type ListExportTemplatesPagedInput = z.infer<typeof listExportTemplatesPagedSchema>;
```

`export-templates.repo.ts` — add `count` to drizzle imports; add at end of file:
```ts
import { and, count, desc, eq, lt } from "drizzle-orm";

export async function findTemplatesByInstitutionPaged(
  institutionId: string,
  opts: { page: number; pageSize: number; type?: ExportTemplateType },
): Promise<{ items: ExportTemplate[]; total: number; pageCount: number }> {
  const size = Math.min(Math.max(opts.pageSize, 1), 100);
  const offset = (Math.max(opts.page, 1) - 1) * size;
  const conditions = [eq(schema.exportTemplates.institutionId, institutionId)];
  if (opts.type) conditions.push(eq(schema.exportTemplates.type, opts.type));
  const where = and(...conditions);

  const [items, [{ total }]] = await Promise.all([
    db.query.exportTemplates.findMany({
      where,
      orderBy: [desc(schema.exportTemplates.createdAt)],
      limit: size,
      offset,
    }),
    db.select({ total: count() }).from(schema.exportTemplates).where(where),
  ]);
  const totalCount = Number(total ?? 0);
  return { items, total: totalCount, pageCount: Math.ceil(totalCount / size) };
}
```

`export-templates.service.ts` — add:
```ts
export async function listTemplatesPaged(
  institutionId: string,
  input: ListExportTemplatesPagedInput,
) {
  return repo.findTemplatesByInstitutionPaged(institutionId, input);
}
```

`export-templates.router.ts` — import `listExportTemplatesPagedSchema`, add:
```ts
listPaged: protectedProcedure
  .input(zod.listExportTemplatesPagedSchema)
  .query(async ({ ctx, input }) => {
    requireManageCatalog({ permissions: ctx.permissions, action: "list export templates" });
    return service.listTemplatesPaged(ctx.institution.id, input);
  }),
```

- [ ] **Step 5: Run tests — verify 2 pass**

```bash
cd apps/server && bun test src/modules/courses/__tests__ src/modules/export-templates/__tests__ --test-name-pattern "listPaged"
```

Expected: 2 PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/server/src/modules/courses/ apps/server/src/modules/export-templates/
git commit -m "feat(backend): add listPaged to courses and export-templates"
```

---

## Task 3 — Backend: classes.listPaged

**Files:**
- Modify: `apps/server/src/modules/classes/classes.zod.ts`
- Modify: `apps/server/src/modules/classes/classes.repo.ts`
- Modify: `apps/server/src/modules/classes/classes.service.ts`
- Modify: `apps/server/src/modules/classes/classes.router.ts`
- Test: `apps/server/src/modules/classes/__tests__/classes.caller.test.ts`

**Interfaces — Produces:**
- `trpc.classes.listPaged({ page, pageSize, academicYearId?, semesterId?, programId? })` → `{ items, total, pageCount }` (uses `tenantProtectedProcedure`)
- Items are same shape as existing `classes.list` items (with `programInfo`, `academicYearInfo`, joins)

- [ ] **Step 1: Write failing test**

Add to `apps/server/src/modules/classes/__tests__/classes.caller.test.ts`:
```ts
describe("classes.listPaged", () => {
  test("returns { items, total, pageCount }", async () => {
    const caller = appRouter.createCaller(await makeTestContext(await asAdmin()));
    const result = await caller.classes.listPaged({ page: 1, pageSize: 25 });
    expect(result).toMatchObject({ items: expect.any(Array), total: expect.any(Number), pageCount: expect.any(Number) });
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
cd apps/server && bun test src/modules/classes/__tests__/classes.caller.test.ts --test-name-pattern "listPaged"
```

- [ ] **Step 3: Add `listPagedSchema` to classes.zod.ts**

```ts
export const listPagedSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
  academicYearId: z.string().optional(),
  semesterId: z.string().optional(),
  programId: z.string().optional(),
});
```

- [ ] **Step 4: Add `listPaged` to classes.repo.ts**

The existing `list` function uses a `classSelection` object and multiple joins. The `listPaged` function reuses the same joins:

```ts
import { and, count, eq, gt, SQL } from "drizzle-orm";

export async function listPaged(
  institutionId: string,
  opts: {
    page: number;
    pageSize: number;
    academicYearId?: string;
    semesterId?: string;
    programId?: string;
  },
) {
  const size = Math.min(Math.max(opts.pageSize, 1), 100);
  const offset = (Math.max(opts.page, 1) - 1) * size;
  const conditions = [
    eq(schema.classes.institutionId, institutionId),
    opts.academicYearId ? eq(schema.classes.academicYear, opts.academicYearId) : undefined,
    opts.semesterId ? eq(schema.classes.semesterId, opts.semesterId) : undefined,
    opts.programId ? eq(schema.classes.program, opts.programId) : undefined,
  ].filter(Boolean) as ReturnType<typeof eq>[];
  const where = conditions.length > 1 ? and(...conditions) : conditions[0];

  const [rows, [{ total }]] = await Promise.all([
    db
      .select(classSelection)  // reuse the existing classSelection object defined at the top of the file
      .from(schema.classes)
      .leftJoin(schema.programs, eq(schema.programs.id, schema.classes.program))
      .leftJoin(schema.academicYears, eq(schema.academicYears.id, schema.classes.academicYear))
      .leftJoin(schema.cycleLevels, eq(schema.cycleLevels.id, schema.classes.cycleLevelId))
      .leftJoin(schema.studyCycles, eq(schema.studyCycles.id, schema.cycleLevels.cycleId))
      .leftJoin(schema.programOptions, eq(schema.programOptions.id, schema.classes.programOptionId))
      .leftJoin(schema.semesters, eq(schema.semesters.id, schema.classes.semesterId))
      .where(where)
      .orderBy(schema.classes.code)
      .limit(size)
      .offset(offset),
    db.select({ total: count() }).from(schema.classes).where(where),
  ]);
  const totalCount = Number(total ?? 0);
  return { items: rows, total: totalCount, pageCount: Math.ceil(totalCount / size) };
}
```

> Note: `classSelection` is defined at the top of `classes.repo.ts`. Verify the exact variable name in the file and use it directly.

- [ ] **Step 5: Add service + router**

`classes.service.ts` — add:
```ts
export async function listClassesPaged(
  input: { page: number; pageSize: number; academicYearId?: string; semesterId?: string; programId?: string },
  institutionId: string,
) {
  return repo.listPaged(institutionId, input);
}
```

`classes.router.ts` — import `listPagedSchema`, add to the `createRouter({...})` object:
```ts
listPaged: tenantProtectedProcedure
  .input(listPagedSchema)
  .query(({ ctx, input }) => service.listClassesPaged(input, ctx.institution.id)),
```

- [ ] **Step 6: Run test and full suite**

```bash
cd apps/server && bun test src/modules/classes/__tests__ --test-name-pattern "listPaged"
cd apps/server && bun test
```

Expected: test passes, no regressions.

- [ ] **Step 7: Commit**

```bash
git add apps/server/src/modules/classes/
git commit -m "feat(backend): add classes.listPaged"
```

---

## Task 4 — Backend: enrollments.listPaged

**Files:**
- Modify: `apps/server/src/modules/enrollments/enrollments.zod.ts`
- Modify: `apps/server/src/modules/enrollments/enrollments.repo.ts`
- Modify: `apps/server/src/modules/enrollments/enrollments.service.ts`
- Modify: `apps/server/src/modules/enrollments/enrollments.router.ts`
- Test: `apps/server/src/modules/enrollments/__tests__/enrollments.caller.test.ts`

**Interfaces — Produces:**
- `trpc.enrollments.listPaged({ page, pageSize, classId?, academicYearId?, status? })` → `{ items, total, pageCount }` (uses `tenantProtectedProcedure`)

- [ ] **Step 1: Write failing test**

Add to `enrollments/__tests__/enrollments.caller.test.ts`:
```ts
describe("enrollments.listPaged", () => {
  test("returns { items, total, pageCount }", async () => {
    const caller = appRouter.createCaller(await makeTestContext(await asAdmin()));
    const result = await caller.enrollments.listPaged({ page: 1, pageSize: 25 });
    expect(result).toMatchObject({ items: expect.any(Array), total: expect.any(Number), pageCount: expect.any(Number) });
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
cd apps/server && bun test src/modules/enrollments/__tests__ --test-name-pattern "listPaged"
```

- [ ] **Step 3: enrollments.zod.ts — add schema**

```ts
export const listPagedSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
  classId: z.string().optional(),
  academicYearId: z.string().optional(),
  status: z.enum(["pending", "active", "completed", "withdrawn"]).optional(),
});
```

- [ ] **Step 4: enrollments.repo.ts — add `listPaged`**

Add `count` to drizzle imports:

```ts
import { and, count, eq, gt } from "drizzle-orm";

export async function listPaged(opts: {
  institutionId: string;
  page: number;
  pageSize: number;
  classId?: string;
  academicYearId?: string;
  status?: schema.EnrollmentStatus;
}) {
  const size = Math.min(Math.max(opts.pageSize, 1), 100);
  const offset = (Math.max(opts.page, 1) - 1) * size;
  const conditions = [
    eq(schema.enrollments.institutionId, opts.institutionId),
    opts.classId ? eq(schema.enrollments.classId, opts.classId) : undefined,
    opts.academicYearId ? eq(schema.enrollments.academicYearId, opts.academicYearId) : undefined,
    opts.status ? eq(schema.enrollments.status, opts.status) : undefined,
  ].filter(Boolean) as ReturnType<typeof eq>[];
  const where = conditions.length > 1 ? and(...conditions) : conditions[0];

  const [rows, [{ total }]] = await Promise.all([
    db.select().from(schema.enrollments).where(where)
      .orderBy(schema.enrollments.createdAt, schema.enrollments.id)
      .limit(size).offset(offset),
    db.select({ total: count() }).from(schema.enrollments).where(where),
  ]);
  const totalCount = Number(total ?? 0);
  return { items: rows, total: totalCount, pageCount: Math.ceil(totalCount / size) };
}
```

- [ ] **Step 5: service + router**

`enrollments.service.ts` — add:
```ts
export async function listEnrollmentsPaged(
  input: { page: number; pageSize: number; classId?: string; academicYearId?: string; status?: schema.EnrollmentStatus },
  institutionId: string,
) {
  return repo.listPaged({ institutionId, ...input });
}
```

`enrollments.router.ts` — import `listPagedSchema`, add:
```ts
listPaged: tenantProtectedProcedure
  .input(listPagedSchema)
  .query(({ ctx, input }) => service.listEnrollmentsPaged(input, ctx.institution.id)),
```

- [ ] **Step 6: Run test + full suite**

```bash
cd apps/server && bun test src/modules/enrollments/__tests__ --test-name-pattern "listPaged"
cd apps/server && bun test
```

- [ ] **Step 7: Commit**

```bash
git add apps/server/src/modules/enrollments/
git commit -m "feat(backend): add enrollments.listPaged"
```

---

## Task 5 — Backend: class-courses.listPaged

**Files:**
- Modify: `apps/server/src/modules/class-courses/class-courses.zod.ts`
- Modify: `apps/server/src/modules/class-courses/class-courses.repo.ts`
- Modify: `apps/server/src/modules/class-courses/class-courses.service.ts`
- Modify: `apps/server/src/modules/class-courses/class-courses.router.ts`
- Test: `apps/server/src/modules/class-courses/__tests__/class-courses.caller.test.ts`

**Interfaces — Produces:**
- `trpc.classCourses.listPaged({ page, pageSize, classId?, academicYearId?, semesterId? })` → `{ items, total, pageCount }` (uses `tenantProtectedProcedure`)
- Items include teacher name fields (`teacherFirstName`, `teacherLastName`, `courseName`, `courseCode`) — same shape as existing `classCourses.list`.

- [ ] **Step 1: Write failing test**

Add to `class-courses/__tests__/class-courses.caller.test.ts`:
```ts
describe("classCourses.listPaged", () => {
  test("returns { items, total, pageCount }", async () => {
    const caller = appRouter.createCaller(await makeTestContext(await asAdmin()));
    const result = await caller.classCourses.listPaged({ page: 1, pageSize: 25 });
    expect(result).toMatchObject({ items: expect.any(Array), total: expect.any(Number), pageCount: expect.any(Number) });
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
cd apps/server && bun test src/modules/class-courses/__tests__ --test-name-pattern "listPaged"
```

- [ ] **Step 3: class-courses.zod.ts — add schema**

```ts
export const listPagedSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
  classId: z.string().optional(),
  academicYearId: z.string().optional(),
  semesterId: z.string().optional(),
});
```

- [ ] **Step 4: class-courses.repo.ts — add `listPaged`**

First read the existing `list` function's select shape (it joins `classCourses`, `courses`, `domainUsers`). Replicate the same joins:

```ts
import { and, count, eq, gt, inArray, type SQL } from "drizzle-orm";

export async function listPaged(opts: {
  institutionId: string;
  page: number;
  pageSize: number;
  classId?: string;
  academicYearId?: string;
  semesterId?: string;
}) {
  const size = Math.min(Math.max(opts.pageSize, 1), 100);
  const offset = (Math.max(opts.page, 1) - 1) * size;

  // If filtering by academicYearId, resolve matching class IDs first
  let classIdsFromYear: string[] | undefined;
  if (opts.academicYearId) {
    const matchingClasses = await db
      .select({ id: schema.classes.id })
      .from(schema.classes)
      .where(
        and(
          eq(schema.classes.academicYear, opts.academicYearId),
          eq(schema.classes.institutionId, opts.institutionId),
        ),
      );
    classIdsFromYear = matchingClasses.map((c) => c.id);
    if (classIdsFromYear.length === 0) {
      return { items: [], total: 0, pageCount: 0 };
    }
  }

  const conditions = [
    eq(schema.classCourses.institutionId, opts.institutionId),
    opts.classId ? eq(schema.classCourses.classId, opts.classId) : undefined,
    classIdsFromYear ? inArray(schema.classCourses.classId, classIdsFromYear) : undefined,
    opts.semesterId ? eq(schema.classCourses.semesterId, opts.semesterId) : undefined,
  ].filter(Boolean) as ReturnType<typeof eq>[];
  const where = conditions.length > 1 ? and(...conditions) : conditions[0];

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: schema.classCourses.id,
        classId: schema.classCourses.classId,
        courseId: schema.classCourses.courseId,
        code: schema.classCourses.code,
        semesterId: schema.classCourses.semesterId,
        coefficient: schema.classCourses.coefficient,
        teacher: schema.classCourses.teacher,
        courseName: schema.courses.name,
        courseCode: schema.courses.code,
        teacherFirstName: schema.domainUsers.firstName,
        teacherLastName: schema.domainUsers.lastName,
        createdAt: schema.classCourses.createdAt,
      })
      .from(schema.classCourses)
      .leftJoin(schema.courses, eq(schema.courses.id, schema.classCourses.courseId))
      .leftJoin(schema.domainUsers, eq(schema.domainUsers.id, schema.classCourses.teacher))
      .where(where)
      .orderBy(schema.classCourses.code)
      .limit(size)
      .offset(offset),
    db.select({ total: count() }).from(schema.classCourses).where(where),
  ]);
  const totalCount = Number(total ?? 0);
  return { items: rows, total: totalCount, pageCount: Math.ceil(totalCount / size) };
}
```

> **Important:** Look at the existing `list` function in `class-courses.repo.ts` to confirm the exact column names for `classCourses` (e.g. `classId` vs `class`, `courseId` vs `course`). Adjust the column references above to match the actual schema. Run `bun check-types` after implementing to catch any mismatch.

- [ ] **Step 5: service + router**

`class-courses.service.ts` — add:
```ts
export async function listClassCoursesPaged(
  input: { page: number; pageSize: number; classId?: string; academicYearId?: string; semesterId?: string },
  institutionId: string,
) {
  return repo.listPaged({ institutionId, ...input });
}
```

`class-courses.router.ts` — import `listPagedSchema`, add:
```ts
listPaged: tenantProtectedProcedure
  .input(listPagedSchema)
  .query(({ ctx, input }) => service.listClassCoursesPaged(input, ctx.institution.id)),
```

- [ ] **Step 6: Run test + type-check + full suite**

```bash
cd apps/server && bun test src/modules/class-courses/__tests__ --test-name-pattern "listPaged"
bun check-types
cd apps/server && bun test
```

- [ ] **Step 7: Commit**

```bash
git add apps/server/src/modules/class-courses/
git commit -m "feat(backend): add classCourses.listPaged"
```

---

## Task 6 — Backend: exams.listPaged

**Files:**
- Modify: `apps/server/src/modules/exams/exams.zod.ts`
- Modify: `apps/server/src/modules/exams/exams.repo.ts`
- Modify: `apps/server/src/modules/exams/exams.service.ts`
- Modify: `apps/server/src/modules/exams/exams.router.ts`
- Test: `apps/server/src/modules/exams/__tests__/exams.caller.test.ts`

**Interfaces — Produces:**
- `trpc.exams.listPaged({ page, pageSize, query?, classId?, academicYearId?, status?, statuses?, teacherId?, dateFrom?, dateTo? })` → `{ items, total, pageCount }` (uses `tenantProtectedProcedure`)
- Items: same shape as existing `exams.list` items.

- [ ] **Step 1: Write failing test**

Add to `exams/__tests__/exams.caller.test.ts`:
```ts
describe("exams.listPaged", () => {
  test("returns { items, total, pageCount }", async () => {
    const caller = appRouter.createCaller(await makeTestContext(await asAdmin()));
    const result = await caller.exams.listPaged({ page: 1, pageSize: 25 });
    expect(result).toMatchObject({ items: expect.any(Array), total: expect.any(Number), pageCount: expect.any(Number) });
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
cd apps/server && bun test src/modules/exams/__tests__ --test-name-pattern "listPaged"
```

- [ ] **Step 3: exams.zod.ts — add schema**

```ts
export const listPagedSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
  query: z.string().trim().min(1).optional(),
  classId: z.string().optional(),
  academicYearId: z.string().optional(),
  status: z.enum(examStatuses).optional(),
  statuses: z.array(z.enum(examStatuses)).optional(),
  teacherId: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});
```

> `examStatuses` is already imported/defined in this file — use the same import.

- [ ] **Step 4: exams.repo.ts — add `listPaged`**

The existing `list` function in `exams.repo.ts` already builds a rich `baseConditions` array and has multiple joins (`classCourses`, `classes`, `courses`, `teachingUnits`, `domainUsers`). Replicate the same conditions and joins, replacing cursor/limit with page/pageSize:

```ts
export async function listPaged(opts: {
  institutionId: string;
  page: number;
  pageSize: number;
  query?: string;
  classId?: string;
  academicYearId?: string;
  status?: string;
  statuses?: string[];
  teacherId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}) {
  const size = Math.min(Math.max(opts.pageSize, 1), 100);
  const offset = (Math.max(opts.page, 1) - 1) * size;

  // Copy the baseConditions block verbatim from the existing `list` function,
  // omitting only the cursor condition (gt/lt on id).
  const baseConditions = [
    eq(schema.exams.institutionId, opts.institutionId),
    opts.classId ? eq(schema.classes.id, opts.classId) : undefined,
    opts.academicYearId ? eq(schema.classes.academicYear, opts.academicYearId) : undefined,
    opts.status ? eq(schema.exams.status, opts.status) : undefined,
    opts.statuses?.length ? inArray(schema.exams.status, opts.statuses) : undefined,
    opts.teacherId ? eq(schema.classCourses.teacher, opts.teacherId) : undefined,
    opts.dateFrom ? gte(schema.exams.date, opts.dateFrom) : undefined,
    opts.dateTo ? lt(schema.exams.date, new Date(opts.dateTo.getTime() + 86_400_000)) : undefined,
    opts.query
      ? or(
          ilike(schema.exams.name, `%${opts.query}%`),
          ilike(schema.classCourses.code, `%${opts.query}%`),
          ilike(schema.classes.name, `%${opts.query}%`),
          ilike(schema.courses.name, `%${opts.query}%`),
        )
      : undefined,
  ].filter(Boolean);

  const where = baseConditions.length > 0 ? and(...baseConditions) : undefined;

  // Use the same select shape and joins as the existing `list` function.
  // Read the existing list function in this file to copy the exact select/join block.
  const [rows, [{ total }]] = await Promise.all([
    db
      .select(/* same select as existing list */)
      .from(schema.exams)
      .leftJoin(schema.classCourses, eq(schema.classCourses.id, schema.exams.classCourse))
      .leftJoin(schema.classes, eq(schema.classes.id, schema.classCourses.classId))
      .leftJoin(schema.courses, eq(schema.courses.id, schema.classCourses.courseId))
      .leftJoin(schema.teachingUnits, eq(schema.teachingUnits.id, schema.courses.teachingUnitId))
      .leftJoin(schema.domainUsers, eq(schema.domainUsers.id, schema.classCourses.teacher))
      .where(where)
      .orderBy(desc(schema.exams.date), schema.exams.id)
      .limit(size)
      .offset(offset),
    db
      .select({ total: count() })
      .from(schema.exams)
      .leftJoin(schema.classCourses, eq(schema.classCourses.id, schema.exams.classCourse))
      .leftJoin(schema.classes, eq(schema.classes.id, schema.classCourses.classId))
      .where(where),
  ]);
  const totalCount = Number(total ?? 0);
  return { items: rows, total: totalCount, pageCount: Math.ceil(totalCount / size) };
}
```

> **Critical:** Open `exams.repo.ts` and copy the exact `.select({...})` object from the existing `list` function into `listPaged`. Do not paraphrase — use the same field names. This file is complex; read it carefully before writing.

- [ ] **Step 5: exams.service.ts + router**

`exams.service.ts` — add:
```ts
export async function listExamsPaged(
  input: z.infer<typeof listPagedSchema>,
  institutionId: string,
) {
  return repo.listPaged({ institutionId, ...input });
}
```

`exams.router.ts` — import `listPagedSchema` from `./exams.zod`, add to router:
```ts
listPaged: tenantProtectedProcedure
  .input(listPagedSchema)
  .query(({ ctx, input }) => service.listExamsPaged(input, ctx.institution.id)),
```

- [ ] **Step 6: Run test + type-check + full suite**

```bash
cd apps/server && bun test src/modules/exams/__tests__ --test-name-pattern "listPaged"
bun check-types
cd apps/server && bun test
```

- [ ] **Step 7: Commit**

```bash
git add apps/server/src/modules/exams/
git commit -m "feat(backend): add exams.listPaged"
```

---

## Task 7 — Backend: notifications.listPaged + deliberations.listPaged

**Files:**
- Modify: `apps/server/src/modules/notifications/notifications.zod.ts` (or create if absent)
- Modify: `apps/server/src/modules/notifications/notifications.repo.ts`
- Modify: `apps/server/src/modules/notifications/notifications.service.ts`
- Modify: `apps/server/src/modules/notifications/notifications.router.ts`
- Modify: `apps/server/src/modules/deliberations/deliberations.zod.ts`
- Modify: `apps/server/src/modules/deliberations/deliberations.repo.ts`
- Modify: `apps/server/src/modules/deliberations/deliberations.service.ts`
- Modify: `apps/server/src/modules/deliberations/deliberations.router.ts`
- Test: `apps/server/src/modules/notifications/__tests__/notifications.caller.test.ts`
- Test: `apps/server/src/modules/deliberations/__tests__/deliberations.caller.test.ts`

**Interfaces — Produces:**
- `trpc.notifications.listPaged({ page, pageSize, status?, channel? })` → `{ items, total, pageCount }` — uses `adminProcedure`
- `trpc.deliberations.listPaged({ page, pageSize, classId?, academicYearId?, type?, status? })` → `{ items, total, pageCount }` — uses `tenantProtectedProcedure`

- [ ] **Step 1: Write failing tests**

`notifications/__tests__/notifications.caller.test.ts` — add:
```ts
describe("notifications.listPaged", () => {
  test("returns { items, total, pageCount }", async () => {
    const caller = appRouter.createCaller(await makeTestContext(await asAdmin()));
    const result = await caller.notifications.listPaged({ page: 1, pageSize: 25 });
    expect(result).toMatchObject({ items: expect.any(Array), total: expect.any(Number), pageCount: expect.any(Number) });
  });
});
```

Same for `deliberations/__tests__/deliberations.caller.test.ts` with `caller.deliberations.listPaged`.

- [ ] **Step 2: Run to verify failure**

```bash
cd apps/server && bun test src/modules/notifications/__tests__ src/modules/deliberations/__tests__ --test-name-pattern "listPaged"
```

- [ ] **Step 3: notifications — zod + repo + service + router**

Notifications do NOT filter by institutionId (the table has no such column). Filters: `status`, `channel`.

If `notifications.zod.ts` doesn't exist, create it. Otherwise add to it:
```ts
import { z } from "zod";
import * as schema from "@/db/schema/app-schema";

export const listNotificationsPagedSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
  status: z.enum(["pending", "sent", "failed", "retrying"]).optional(),
  channel: z.enum(["email", "sms", "push"]).optional(),
});
```

> Check the exact enum values for `NotificationStatus` and `NotificationChannel` in `app-schema.ts` and use them.

`notifications.repo.ts` — add `count` to drizzle imports; add:
```ts
import { and, count, desc, eq } from "drizzle-orm";

export async function listNotificationsPaged(opts: {
  page: number;
  pageSize: number;
  status?: schema.NotificationStatus;
  channel?: schema.NotificationChannel;
}) {
  const size = Math.min(Math.max(opts.pageSize, 1), 100);
  const offset = (Math.max(opts.page, 1) - 1) * size;
  const conditions = [
    opts.status ? eq(schema.notifications.status, opts.status) : undefined,
    opts.channel ? eq(schema.notifications.channel, opts.channel) : undefined,
  ].filter(Boolean) as ReturnType<typeof eq>[];
  const where = conditions.length > 1 ? and(...conditions) : conditions[0];

  const [items, [{ total }]] = await Promise.all([
    db.query.notifications.findMany({
      where,
      orderBy: [desc(schema.notifications.createdAt), desc(schema.notifications.id)],
      limit: size,
      offset,
    }),
    db.select({ total: count() }).from(schema.notifications).where(where),
  ]);
  const totalCount = Number(total ?? 0);
  return { items, total: totalCount, pageCount: Math.ceil(totalCount / size) };
}
```

`notifications.service.ts` — add:
```ts
export async function listPaged(
  opts: { page: number; pageSize: number; status?: schema.NotificationStatus; channel?: schema.NotificationChannel },
) {
  return repo.listNotificationsPaged(opts);
}
```

`notifications.router.ts` — import `listNotificationsPagedSchema`, add:
```ts
listPaged: adminProcedure
  .input(listNotificationsPagedSchema)
  .query(({ input }) => service.listPaged(input)),
```

- [ ] **Step 4: deliberations — zod + repo + service + router**

`deliberations.zod.ts` — add:
```ts
export const listDeliberationsPagedSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
  classId: z.string().optional(),
  academicYearId: z.string().optional(),
  type: z.enum(deliberationTypes as unknown as [string, ...string[]]).optional(),
  status: z.string().optional(),
});
export type ListDeliberationsPagedInput = z.infer<typeof listDeliberationsPagedSchema>;
```

> `deliberationTypes` is already defined in this file. Use the same cast.

`deliberations.repo.ts` — add `count` to imports; add:
```ts
import { and, count, desc, eq, gt } from "drizzle-orm";

export async function listDeliberationsPaged(opts: {
  institutionId: string;
  page: number;
  pageSize: number;
  classId?: string;
  academicYearId?: string;
  type?: string;
  status?: string;
}) {
  const size = Math.min(Math.max(opts.pageSize, 1), 100);
  const offset = (Math.max(opts.page, 1) - 1) * size;
  const conditions = [
    eq(schema.deliberations.institutionId, opts.institutionId),
    opts.classId ? eq(schema.deliberations.classId, opts.classId) : undefined,
    opts.academicYearId ? eq(schema.deliberations.academicYearId, opts.academicYearId) : undefined,
    opts.type ? eq(schema.deliberations.type, opts.type as schema.DeliberationType) : undefined,
    opts.status ? eq(schema.deliberations.status, opts.status as schema.DeliberationStatus) : undefined,
  ].filter(Boolean);
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, [{ total }]] = await Promise.all([
    db.query.deliberations.findMany({
      where,
      orderBy: [desc(schema.deliberations.createdAt)],
      limit: size,
      offset,
    }),
    db.select({ total: count() }).from(schema.deliberations).where(where),
  ]);
  const totalCount = Number(total ?? 0);
  return { items, total: totalCount, pageCount: Math.ceil(totalCount / size) };
}
```

`deliberations.service.ts` — add:
```ts
export async function listPaged(
  input: ListDeliberationsPagedInput,
  institutionId: string,
) {
  return repo.listDeliberationsPaged({ institutionId, ...input });
}
```

`deliberations.router.ts` (the `deliberationsRouter`, not `rulesRouter`) — import `listDeliberationsPagedSchema`, add:
```ts
listPaged: tenantProtectedProcedure
  .input(listDeliberationsPagedSchema)
  .query(({ ctx, input }) => service.listPaged(input, ctx.institution.id)),
```

- [ ] **Step 5: Run tests + full suite**

```bash
cd apps/server && bun test src/modules/notifications/__tests__ src/modules/deliberations/__tests__ --test-name-pattern "listPaged"
cd apps/server && bun test
```

- [ ] **Step 6: Commit**

```bash
git add apps/server/src/modules/notifications/ apps/server/src/modules/deliberations/
git commit -m "feat(backend): add notifications.listPaged and deliberations.listPaged"
```

---

## Task 8 — Backend: classes.graduatedStudentsPaged + classes.promotionPreviewPaged

**Files:**
- Modify: `apps/server/src/modules/classes/classes.zod.ts`
- Modify: `apps/server/src/modules/classes/classes.service.ts`
- Modify: `apps/server/src/modules/classes/classes.router.ts`
- Test: `apps/server/src/modules/classes/__tests__/classes.caller.test.ts`

**Interfaces — Produces:**
- `trpc.classes.graduatedStudentsPaged({ page, pageSize, programId?, cycleId? })` → `{ items, total, pageCount }` (uses `tenantAdminProcedure`)
- `trpc.classes.promotionPreviewPaged({ sourceClassId, page, pageSize })` → `{ items, total, pageCount }` (uses `tenantProtectedProcedure`)

- [ ] **Step 1: Write failing tests**

Add to `classes/__tests__/classes.caller.test.ts`:
```ts
describe("classes.graduatedStudentsPaged", () => {
  test("returns { items, total, pageCount }", async () => {
    const caller = appRouter.createCaller(await makeTestContext(await asAdmin()));
    const result = await caller.classes.graduatedStudentsPaged({ page: 1, pageSize: 25 });
    expect(result).toMatchObject({ items: expect.any(Array), total: expect.any(Number), pageCount: expect.any(Number) });
  });
});

describe("classes.promotionPreviewPaged", () => {
  test("returns { items, total, pageCount } for unknown class", async () => {
    const caller = appRouter.createCaller(await makeTestContext(await asAdmin()));
    // A non-existent sourceClassId should throw NOT_FOUND
    await expect(
      caller.classes.promotionPreviewPaged({ sourceClassId: "non-existent", page: 1, pageSize: 25 })
    ).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
cd apps/server && bun test src/modules/classes/__tests__/classes.caller.test.ts --test-name-pattern "graduatedStudentsPaged|promotionPreviewPaged"
```

- [ ] **Step 3: classes.zod.ts — add schemas**

```ts
export const graduatedStudentsPagedSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
  programId: z.string().optional(),
  cycleId: z.string().optional(),
});

export const promotionPreviewPagedSchema = z.object({
  sourceClassId: z.string(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
});
```

- [ ] **Step 4: classes.service.ts — add paged service functions**

`listGraduatedStudentsPaged` paginates the enrollment query directly instead of relying on the existing cursor-based `listGraduatedStudents`:

```ts
export async function listGraduatedStudentsPaged(
  institutionId: string,
  opts: { page: number; pageSize: number; programId?: string; cycleId?: string },
) {
  const size = Math.min(Math.max(opts.pageSize, 1), 100);
  const offset = (Math.max(opts.page, 1) - 1) * size;

  // Page through graduated enrollments using enrollmentsRepo.listPaged (added in Task 4)
  const { items: enrollments, total, pageCount } = await enrollmentsRepo.listPaged({
    institutionId,
    status: "graduated",
    page: opts.page,
    pageSize: opts.pageSize,
  });

  if (enrollments.length === 0) {
    return { items: [], total, pageCount };
  }

  // Enrich with student + class + credit info (same as existing listGraduatedStudents)
  const enriched = await Promise.all(
    enrollments.map(async (enrollment) => {
      const student = await studentsRepo.findById(enrollment.studentId, institutionId);
      const klass = await repo.findById(enrollment.classId, institutionId);
      const creditLedger = await db.query.studentCreditLedgers.findFirst({
        where: and(
          eq(schema.studentCreditLedgers.studentId, enrollment.studentId),
          eq(schema.studentCreditLedgers.institutionId, institutionId),
        ),
      });
      return { student, klass, enrollment, creditLedger: creditLedger ?? null };
    }),
  );

  return { items: enriched, total, pageCount };
}
```

> **Important:** Read the existing `listGraduatedStudents` function in `classes.service.ts` and copy the exact enrichment logic (the `Promise.all` block and any filtering). The shape above is approximate.

`promotionPreviewPaged`:

```ts
export async function promotionPreviewPaged(
  sourceClassId: string,
  institutionId: string,
  opts: { page: number; pageSize: number },
) {
  const source = await repo.findById(sourceClassId, institutionId);
  if (!source) throw notFound("Source class not found");

  const size = Math.min(Math.max(opts.pageSize, 1), 100);
  const offset = (Math.max(opts.page, 1) - 1) * size;

  // Page through students using enrollmentsRepo.listPaged (Task 4)
  const { items: students, total, pageCount } = await enrollmentsRepo.listPaged({
    institutionId,
    classId: sourceClassId,
    page: opts.page,
    pageSize: opts.pageSize,
  });

  if (students.length === 0) return { items: [], total, pageCount };

  // Find latest signed annual deliberation (same as existing promotionPreview)
  const deliberation = await db.query.deliberations.findFirst({
    where: and(
      eq(schema.deliberations.classId, sourceClassId),
      eq(schema.deliberations.institutionId, institutionId),
      eq(schema.deliberations.type, "annual"),
      eq(schema.deliberations.status, "signed"),
    ),
    orderBy: (d, { desc }) => desc(d.createdAt),
  });

  const studentIds = students.map((s) => s.studentId);
  const deliberationResults = deliberation
    ? await db.query.deliberationStudentResults.findMany({
        where: and(
          eq(schema.deliberationStudentResults.deliberationId, deliberation.id),
          inArray(schema.deliberationStudentResults.studentId, studentIds),
        ),
      })
    : [];

  const resultByStudentId = new Map(deliberationResults.map((r) => [r.studentId, r]));

  // Map enrollments to student objects (load each student)
  const items = await Promise.all(
    students.map(async (enrollment) => {
      const student = await studentsRepo.findById(enrollment.studentId, institutionId);
      const result = resultByStudentId.get(enrollment.studentId);
      return { student, result };
    }),
  );

  return { items, total, pageCount };
}
```

> **Important:** Read the existing `promotionPreview` function in `classes.service.ts` and replicate its exact return shape (the mapping of `{ student, result }` or whatever it returns). The above is a skeleton — fill in the exact fields.

- [ ] **Step 5: classes.router.ts — add procedures**

Import `graduatedStudentsPagedSchema` and `promotionPreviewPagedSchema`, add:

```ts
graduatedStudentsPaged: tenantAdminProcedure
  .input(graduatedStudentsPagedSchema)
  .query(({ ctx, input }) =>
    service.listGraduatedStudentsPaged(ctx.institution.id, input),
  ),

promotionPreviewPaged: tenantProtectedProcedure
  .input(promotionPreviewPagedSchema)
  .query(({ ctx, input }) =>
    service.promotionPreviewPaged(input.sourceClassId, ctx.institution.id, input),
  ),
```

- [ ] **Step 6: Run tests + full suite**

```bash
cd apps/server && bun test src/modules/classes/__tests__/classes.caller.test.ts --test-name-pattern "graduatedStudentsPaged|promotionPreviewPaged"
bun check-types
cd apps/server && bun test
```

- [ ] **Step 7: Commit**

```bash
git add apps/server/src/modules/classes/
git commit -m "feat(backend): add classes.graduatedStudentsPaged and classes.promotionPreviewPaged"
```

---

## Task 9 — Frontend: TeachingUnitManagement

**Files:**
- Modify: `apps/web/src/pages/admin/TeachingUnitManagement.tsx`

**Consumes:** `trpc.teachingUnits.listPaged` (Task 1)
**Existing filters:** `selectedProgramId` (string, optional)

- [ ] **Step 1: Replace imports**

Remove: `useInfiniteQuery` from `@tanstack/react-query`; `useInfiniteScroll` from `@/hooks/useInfiniteScroll`.
Add: `useQuery` from `@tanstack/react-query`; `TablePagination` from `@/components/ui/table-pagination`.

- [ ] **Step 2: Replace query state and data fetch**

Remove the `useInfiniteQuery` block:
```ts
// REMOVE:
const { data: unitsData, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch } = useInfiniteQuery({...});
const unitItems = unitsData?.pages.flatMap((p) => p.items) ?? [];
const sentinelRef = useInfiniteScroll(fetchNextPage, { enabled: hasNextPage && !isFetchingNextPage });
```

Replace with:
```ts
const [page, setPage] = useState(1);
const [pageSize, setPageSize] = useState(25);

// Wrap filter setter to reset page:
const handleFilter = <T,>(setter: (v: T) => void) => (value: T) => {
  setter(value);
  setPage(1);
};

const { data, isLoading, refetch } = useQuery(
  trpc.teachingUnits.listPaged.queryOptions({
    page,
    pageSize,
    programId: selectedProgramId || undefined,
  }),
);
const unitItems = data?.items ?? [];
```

Update the `selectedProgramId` change handler to use `handleFilter`:
```ts
// BEFORE:
onValueChange={(v) => setSelectedProgramId(v === "all" ? "" : v)}
// AFTER:
onValueChange={(v) => handleFilter(setSelectedProgramId)(v === "all" ? "" : v)}
```

- [ ] **Step 3: Remove sentinel, add TablePagination**

Find the sentinel `<div ref={sentinelRef} className="h-1" />` and remove it.

After the closing `</Table>` or `</TableBody>` (before the closing `</CardContent>` or similar), add:
```tsx
<TablePagination
  page={page}
  pageCount={data?.pageCount ?? 1}
  total={data?.total ?? 0}
  pageSize={pageSize}
  onPageChange={setPage}
  onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
/>
```

- [ ] **Step 4: Update mutation invalidations**

Find all `queryClient.invalidateQueries(...)` calls in mutation `onSuccess` handlers. Replace any that invalidate the unit list with:
```ts
queryClient.invalidateQueries(trpc.teachingUnits.listPaged.queryKey());
```

- [ ] **Step 5: Run type-check**

```bash
bun check-types
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/pages/admin/TeachingUnitManagement.tsx
git commit -m "feat(frontend): replace infinite scroll with pagination in TeachingUnitManagement"
```

---

## Task 10 — Frontend: StudyCycleManagement + AcademicYearManagement + ExamTypes

**Files:**
- Modify: `apps/web/src/pages/admin/StudyCycleManagement.tsx`
- Modify: `apps/web/src/pages/admin/AcademicYearManagement.tsx`
- Modify: `apps/web/src/pages/admin/ExamTypes.tsx`

**Consumes:** `trpc.studyCycles.listPaged`, `trpc.academicYears.listPaged`, `trpc.examTypes.listPaged` (all from Task 1)
**Filters:** none (all three have no server-side filters beyond the institution)

Apply the same transformation to all three files:

- [ ] **Step 1: StudyCycleManagement**

1. Replace imports: remove `useInfiniteQuery`, `useInfiniteScroll`; add `useQuery`, `TablePagination`.
2. Add `const [page, setPage] = useState(1); const [pageSize, setPageSize] = useState(25);`
3. Replace query:
```ts
const { data, isLoading, refetch } = useQuery(
  trpc.studyCycles.listPaged.queryOptions({ page, pageSize }),
);
const items = data?.items ?? [];
```
4. Remove sentinel `<div ref={sentinelRef}>`. Add `<TablePagination page={page} pageCount={data?.pageCount ?? 1} total={data?.total ?? 0} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />` after the table.
5. Update invalidations: `queryClient.invalidateQueries(trpc.studyCycles.listPaged.queryKey())`.

- [ ] **Step 2: AcademicYearManagement**

Same pattern:
```ts
const { data, isLoading } = useQuery(
  trpc.academicYears.listPaged.queryOptions({ page, pageSize }),
);
const items = data?.items ?? [];
```
Invalidations: `queryClient.invalidateQueries(trpc.academicYears.listPaged.queryKey())`.

- [ ] **Step 3: ExamTypes**

```ts
const { data, isLoading } = useQuery(
  trpc.examTypes.listPaged.queryOptions({ page, pageSize }),
);
const items = data?.items ?? [];
```
Invalidations: `queryClient.invalidateQueries(trpc.examTypes.listPaged.queryKey())`.

- [ ] **Step 4: Type-check**

```bash
bun check-types
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/pages/admin/StudyCycleManagement.tsx apps/web/src/pages/admin/AcademicYearManagement.tsx apps/web/src/pages/admin/ExamTypes.tsx
git commit -m "feat(frontend): replace infinite scroll with pagination in StudyCycle/AcademicYear/ExamTypes"
```

---

## Task 11 — Frontend: CourseManagement + ExportTemplatesManagement

**Files:**
- Modify: `apps/web/src/pages/admin/CourseManagement.tsx`
- Modify: `apps/web/src/pages/admin/ExportTemplatesManagement.tsx`

**Consumes:** `trpc.courses.listPaged` (Task 2), `trpc.exportTemplates.listPaged` (Task 2)

- [ ] **Step 1: CourseManagement**

CourseManagement has a `selectedProgramId` filter. Apply the full pattern:

1. Replace imports (remove `useInfiniteQuery`, `useInfiniteScroll`; add `useQuery`, `TablePagination`).
2. Add page/pageSize state.
3. Replace query:
```ts
const { data, isLoading, refetch } = useQuery(
  trpc.courses.listPaged.queryOptions({
    page,
    pageSize,
    programId: selectedProgramId || undefined,
  }),
);
const courseItems = data?.items ?? [];
```
4. Wrap `selectedProgramId` setter in `handleFilter`.
5. Remove sentinel, add `<TablePagination>`.
6. Update invalidations: `queryClient.invalidateQueries(trpc.courses.listPaged.queryKey())`.

- [ ] **Step 2: ExportTemplatesManagement**

ExportTemplatesManagement has a `typeFilter` filter (maps to `type`):

```ts
const { data, isLoading, refetch } = useQuery(
  trpc.exportTemplates.listPaged.queryOptions({
    page,
    pageSize,
    type: typeFilter || undefined,
  }),
);
const templateItems = data?.items ?? [];
```

Wrap `typeFilter` setter in `handleFilter`. Invalidations: `queryClient.invalidateQueries(trpc.exportTemplates.listPaged.queryKey())`.

- [ ] **Step 3: Type-check + commit**

```bash
bun check-types
git add apps/web/src/pages/admin/CourseManagement.tsx apps/web/src/pages/admin/ExportTemplatesManagement.tsx
git commit -m "feat(frontend): replace infinite scroll with pagination in CourseManagement/ExportTemplates"
```

---

## Task 12 — Frontend: ClassManagement

**Files:**
- Modify: `apps/web/src/pages/admin/ClassManagement.tsx`

**Consumes:** `trpc.classes.listPaged` (Task 3)
**Existing filters:** `yearFilter` (academicYearId), `semesterFilter` (semesterId)

> **Note:** `ClassManagement.tsx` was recently modified to add row-click navigation and create→navigate-to-hub. Only replace the query mechanism — do not change navigation logic.

- [ ] **Step 1: Replace imports**

Remove: `useInfiniteQuery`, `useInfiniteScroll`. Add: `useQuery`, `TablePagination`.

- [ ] **Step 2: Replace query**

```ts
const [page, setPage] = useState(1);
const [pageSize, setPageSize] = useState(25);

const handleFilter = <T,>(setter: (v: T) => void) => (value: T) => {
  setter(value);
  setPage(1);
};

const { data, isLoading, refetch } = useQuery(
  trpc.classes.listPaged.queryOptions({
    page,
    pageSize,
    academicYearId: yearFilter || undefined,
    semesterId: semesterFilter || undefined,
  }),
);
const classItems = data?.items ?? [];
```

Update `yearFilter` and `semesterFilter` change handlers to use `handleFilter`.

- [ ] **Step 3: Remove sentinel, add TablePagination; update invalidations**

```ts
// Mutations onSuccess:
queryClient.invalidateQueries(trpc.classes.listPaged.queryKey());
```

- [ ] **Step 4: Type-check + commit**

```bash
bun check-types
git add apps/web/src/pages/admin/ClassManagement.tsx
git commit -m "feat(frontend): replace infinite scroll with pagination in ClassManagement"
```

---

## Task 13 — Frontend: EnrollmentManagement

**Files:**
- Modify: `apps/web/src/pages/admin/EnrollmentManagement.tsx`

**Consumes:** `trpc.enrollments.listPaged` (Task 4)
**Existing filters:** `classFilter` (classId), `yearFilter` (academicYearId), `statusFilter` (status)

- [ ] **Step 1: Replace imports**

Remove `useInfiniteQuery`, `useInfiniteScroll`. Add `useQuery`, `TablePagination`.

- [ ] **Step 2: Replace query**

```ts
const [page, setPage] = useState(1);
const [pageSize, setPageSize] = useState(25);

const handleFilter = <T,>(setter: (v: T) => void) => (value: T) => {
  setter(value);
  setPage(1);
};

const { data, isLoading, refetch } = useQuery(
  trpc.enrollments.listPaged.queryOptions({
    page,
    pageSize,
    classId: classFilter || undefined,
    academicYearId: yearFilter || undefined,
    status: statusFilter || undefined,
  }),
);
const enrollmentItems = data?.items ?? [];
```

Wrap all three filter setters in `handleFilter`. Remove sentinel, add `<TablePagination>`. Update invalidations to `trpc.enrollments.listPaged.queryKey()`.

- [ ] **Step 3: Type-check + commit**

```bash
bun check-types
git add apps/web/src/pages/admin/EnrollmentManagement.tsx
git commit -m "feat(frontend): replace infinite scroll with pagination in EnrollmentManagement"
```

---

## Task 14 — Frontend: ClassCourseManagement

**Files:**
- Modify: `apps/web/src/pages/admin/ClassCourseManagement.tsx`

**Consumes:** `trpc.classCourses.listPaged` (Task 5)
**Existing filters:** classId, academicYearId, semesterId (read the file to confirm exact state variable names)

- [ ] **Step 1: Replace imports**

Remove `useInfiniteQuery`, `useInfiniteScroll`. Add `useQuery`, `TablePagination`.

- [ ] **Step 2: Replace query**

```ts
const [page, setPage] = useState(1);
const [pageSize, setPageSize] = useState(25);

const handleFilter = <T,>(setter: (v: T) => void) => (value: T) => {
  setter(value);
  setPage(1);
};

const { data, isLoading, refetch } = useQuery(
  trpc.classCourses.listPaged.queryOptions({
    page,
    pageSize,
    classId: classFilter || undefined,
    academicYearId: yearFilter || undefined,
    semesterId: semesterFilter || undefined,
  }),
);
const ccItems = data?.items ?? [];
```

Wrap filter setters in `handleFilter`. Remove sentinel, add `<TablePagination>`. Update invalidations to `trpc.classCourses.listPaged.queryKey()`.

- [ ] **Step 3: Type-check + commit**

```bash
bun check-types
git add apps/web/src/pages/admin/ClassCourseManagement.tsx
git commit -m "feat(frontend): replace infinite scroll with pagination in ClassCourseManagement"
```

---

## Task 15 — Frontend: ExamManagement

**Files:**
- Modify: `apps/web/src/pages/admin/ExamManagement.tsx`

**Consumes:** `trpc.exams.listPaged` (Task 6)
**Existing filters:** yearFilter, classFilter, semesterFilter, statusFilter, dateFrom, dateTo (read the file for exact names)

- [ ] **Step 1: Replace imports**

Remove `useInfiniteQuery`, `useInfiniteScroll`. Add `useQuery`, `TablePagination`.

- [ ] **Step 2: Replace query**

```ts
const [page, setPage] = useState(1);
const [pageSize, setPageSize] = useState(25);

const handleFilter = <T,>(setter: (v: T) => void) => (value: T) => {
  setter(value);
  setPage(1);
};

const { data, isLoading, refetch } = useQuery(
  trpc.exams.listPaged.queryOptions({
    page,
    pageSize,
    academicYearId: yearFilter || undefined,
    classId: classFilter || undefined,
    status: statusFilter || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  }),
);
const examItems = data?.items ?? [];
```

> Read `ExamManagement.tsx` to find the exact filter state variable names and what each maps to in the `listPaged` input. Adjust the query call accordingly.

Wrap all filter setters in `handleFilter`. Remove sentinel, add `<TablePagination>`. Update invalidations.

- [ ] **Step 3: Type-check + commit**

```bash
bun check-types
git add apps/web/src/pages/admin/ExamManagement.tsx
git commit -m "feat(frontend): replace infinite scroll with pagination in ExamManagement"
```

---

## Task 16 — Frontend: NotificationsCenter

**Files:**
- Modify: `apps/web/src/pages/admin/NotificationsCenter.tsx`

**Consumes:** `trpc.notifications.listPaged` (Task 7)
**Existing filters:** statusFilter, channel ("email")

- [ ] **Step 1: Replace imports**

Remove `useInfiniteQuery`, `useInfiniteScroll`. Add `useQuery`, `TablePagination`.

- [ ] **Step 2: Replace query**

```ts
const [page, setPage] = useState(1);
const [pageSize, setPageSize] = useState(25);

const handleFilter = <T,>(setter: (v: T) => void) => (value: T) => {
  setter(value);
  setPage(1);
};

const { data, isLoading, refetch } = useQuery(
  trpc.notifications.listPaged.queryOptions({
    page,
    pageSize,
    status: statusFilter || undefined,
    channel: "email",
  }),
);
const notifItems = data?.items ?? [];
```

Wrap statusFilter setter in `handleFilter`. Remove sentinel, add `<TablePagination>`. Update invalidations to `trpc.notifications.listPaged.queryKey()`.

- [ ] **Step 3: Type-check + commit**

```bash
bun check-types
git add apps/web/src/pages/admin/NotificationsCenter.tsx
git commit -m "feat(frontend): replace infinite scroll with pagination in NotificationsCenter"
```

---

## Task 17 — Frontend: DeliberationsList

**Files:**
- Modify: `apps/web/src/pages/admin/deliberations/DeliberationsList.tsx`

**Consumes:** `trpc.deliberations.listPaged` (Task 7)
**Existing filters:** classId, type, status, academicYearId (read file to confirm names)

- [ ] **Step 1: Replace imports**

Remove `useInfiniteQuery`, `useInfiniteScroll`. Add `useQuery`, `TablePagination`.

- [ ] **Step 2: Replace query**

```ts
const [page, setPage] = useState(1);
const [pageSize, setPageSize] = useState(25);

const handleFilter = <T,>(setter: (v: T) => void) => (value: T) => {
  setter(value);
  setPage(1);
};

const { data, isLoading, refetch } = useQuery(
  trpc.deliberations.listPaged.queryOptions({
    page,
    pageSize,
    classId: classFilter || undefined,
    academicYearId: yearFilter || undefined,
    type: typeFilter || undefined,
    status: statusFilter || undefined,
  }),
);
const deliberationItems = data?.items ?? [];
```

> Read the file to get exact state variable names.

Wrap filter setters in `handleFilter`. Remove sentinel, add `<TablePagination>`. Update invalidations.

- [ ] **Step 3: Type-check + commit**

```bash
bun check-types
git add apps/web/src/pages/admin/deliberations/DeliberationsList.tsx
git commit -m "feat(frontend): replace cursor pagination with TablePagination in DeliberationsList"
```

---

## Task 18 — Frontend: DeanDashboard

**Files:**
- Modify: `apps/web/src/pages/dean/DeanDashboard.tsx`

**Consumes:** `trpc.exams.listPaged` (Task 6) — replaces `trpc.exams.list` cursor call
**Current pattern:** `useCursorPagination` + `PaginationBar` + `trpc.exams.list.queryOptions({ cursor, statuses: ["submitted"] })`

- [ ] **Step 1: Replace imports**

Remove: `useCursorPagination` from `@/hooks/useCursorPagination`; `PaginationBar` from `@/components/ui/pagination-bar`.
Add: `TablePagination` from `@/components/ui/table-pagination`.

- [ ] **Step 2: Replace pagination state and query**

Remove:
```ts
const pagination = useCursorPagination({ pageSize: PAGE_SIZE });
// ... reset calls ...
```

Add:
```ts
const [page, setPage] = useState(1);
const [pageSize, setPageSize] = useState(25);
```

Replace the `trpc.exams.list.queryOptions({...cursor...})` call:
```ts
const examsQuery = useQuery(
  trpc.exams.listPaged.queryOptions({
    page,
    pageSize,
    statuses: ["submitted"],
    // include any other existing filters (academicYearId, classId etc.)
  }),
);
const exams = examsQuery.data?.items ?? [];
```

> Read `DeanDashboard.tsx` to find ALL filters passed to `exams.list` and carry them forward.

- [ ] **Step 3: Replace PaginationBar with TablePagination**

Remove the `<PaginationBar>` component (usually near the bottom of the exams table section). Add:
```tsx
<TablePagination
  page={page}
  pageCount={examsQuery.data?.pageCount ?? 1}
  total={examsQuery.data?.total ?? 0}
  pageSize={pageSize}
  onPageChange={setPage}
  onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
/>
```

Update mutation invalidations: `queryClient.invalidateQueries(trpc.exams.listPaged.queryKey())`.

- [ ] **Step 4: Type-check + commit**

```bash
bun check-types
git add apps/web/src/pages/dean/DeanDashboard.tsx
git commit -m "feat(frontend): replace cursor pagination with TablePagination in DeanDashboard"
```

---

## Task 19 — Frontend: WorkflowApprovals

**Files:**
- Modify: `apps/web/src/pages/dean/WorkflowApprovals.tsx`

**Consumes:** `trpc.exams.listPaged` (Task 6) + `trpc.notifications.listPaged` (Task 7)
**Current pattern:** Two `useCursorPagination` instances (`examPagination`, `notifPagination`) + two `PaginationBar`s

- [ ] **Step 1: Replace imports**

Remove: `useCursorPagination`, `PaginationBar`. Add: `TablePagination`.

- [ ] **Step 2: Replace both pagination states**

```ts
// Remove: const examPagination = useCursorPagination(...)
// Remove: const notifPagination = useCursorPagination(...)

const [examPage, setExamPage] = useState(1);
const [examPageSize, setExamPageSize] = useState(25);
const [notifPage, setNotifPage] = useState(1);
const [notifPageSize, setNotifPageSize] = useState(25);
```

- [ ] **Step 3: Replace queries**

Exams query:
```ts
const examsQuery = useQuery(
  trpc.exams.listPaged.queryOptions({
    page: examPage,
    pageSize: examPageSize,
    statuses: ["submitted"],
    academicYearId: yearFilter ?? undefined,
    classId: classFilter ?? undefined,
  }),
);
const windowExams = examsQuery.data?.items ?? [];
```

Notifications query:
```ts
const notifQuery = useQuery(
  trpc.notifications.listPaged.queryOptions({
    page: notifPage,
    pageSize: notifPageSize,
    status: "pending",
  }),
);
const notifications = notifQuery.data?.items ?? [];
```

> Read `WorkflowApprovals.tsx` to confirm exact variable names and filter states used for both queries.

- [ ] **Step 4: Replace both PaginationBar components with TablePagination**

Exams table footer:
```tsx
<TablePagination
  page={examPage}
  pageCount={examsQuery.data?.pageCount ?? 1}
  total={examsQuery.data?.total ?? 0}
  pageSize={examPageSize}
  onPageChange={setExamPage}
  onPageSizeChange={(s) => { setExamPageSize(s); setExamPage(1); }}
/>
```

Notifications table footer:
```tsx
<TablePagination
  page={notifPage}
  pageCount={notifQuery.data?.pageCount ?? 1}
  total={notifQuery.data?.total ?? 0}
  pageSize={notifPageSize}
  onPageChange={setNotifPage}
  onPageSizeChange={(s) => { setNotifPageSize(s); setNotifPage(1); }}
/>
```

Also reset pages when year/class filters change:
```ts
// Filter change handlers must reset page:
const handleYearFilter = (v: string) => { setYearFilter(v); setExamPage(1); };
const handleClassFilter = (v: string) => { setClassFilter(v); setExamPage(1); };
```

- [ ] **Step 5: Type-check + commit**

```bash
bun check-types
git add apps/web/src/pages/dean/WorkflowApprovals.tsx
git commit -m "feat(frontend): replace cursor pagination with TablePagination in WorkflowApprovals"
```

---

## Task 20 — Frontend: ApprovalHistory

**Files:**
- Modify: `apps/web/src/pages/dean/ApprovalHistory.tsx`

**Consumes:** `trpc.exams.listPaged` (Task 6)
**Current pattern:** `useCursorPagination` + `PaginationBar` + filters: statuses (approved/rejected), search (query), classId, academicYearId

- [ ] **Step 1: Replace imports**

Remove `useCursorPagination`, `PaginationBar`. Add `TablePagination`.

- [ ] **Step 2: Replace state and query**

```ts
// Remove: const pagination = useCursorPagination({ pageSize: ... })
const [page, setPage] = useState(1);
const [pageSize, setPageSize] = useState(25);

const handleFilter = <T,>(setter: (v: T) => void) => (value: T) => {
  setter(value);
  setPage(1);
};

const { data: historyData, isLoading } = useQuery(
  trpc.exams.listPaged.queryOptions({
    page,
    pageSize,
    statuses: [...serverStatuses],  // already computed from statusFilter
    query: search.trim() || undefined,
    classId: classFilter !== "all" ? classFilter : undefined,
    academicYearId: yearFilter !== "all" ? yearFilter : undefined,
  }),
);
const historyExams = historyData?.items ?? [];
```

Wrap `search`, `statusFilter`, `classFilter`, `yearFilter` setters in `handleFilter`.

- [ ] **Step 3: Replace PaginationBar with TablePagination**

```tsx
<TablePagination
  page={page}
  pageCount={historyData?.pageCount ?? 1}
  total={historyData?.total ?? 0}
  pageSize={pageSize}
  onPageChange={setPage}
  onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
/>
```

The KPI counts (approvedCount, rejectedCount) currently derive from `historyExams` (the current page only). Keep this behavior — it now reflects the current page's distribution.

- [ ] **Step 4: Type-check + commit**

```bash
bun check-types
git add apps/web/src/pages/dean/ApprovalHistory.tsx
git commit -m "feat(frontend): replace cursor pagination with TablePagination in ApprovalHistory"
```

---

## Task 21 — Frontend: GraduatedStudents

**Files:**
- Modify: `apps/web/src/pages/admin/GraduatedStudents.tsx`

**Consumes:** `trpc.classes.graduatedStudentsPaged` (Task 8)
**Current pattern:** `useCursorPagination` + `trpcClient.classes.graduatedStudents.query({cursor})` + client-side `search` filter

- [ ] **Step 1: Replace imports**

Remove `useCursorPagination`, `PaginationBar`. Add `TablePagination`.
Replace `trpcClient` usage with `trpc` + `useQuery`.

- [ ] **Step 2: Replace state and query**

```ts
// Remove: const pagination = useCursorPagination({ pageSize: ... })
// Remove: const [items, setItems] = useState([])  (if any local accumulation)
const [page, setPage] = useState(1);
const [pageSize, setPageSize] = useState(25);

const { data, isLoading } = useQuery(
  trpc.classes.graduatedStudentsPaged.queryOptions({ page, pageSize }),
);
const items = data?.items ?? [];
```

Client-side search filter is now applied on the current page's items only (same behavior as before but within a page):
```ts
const [search, setSearch] = useState("");
const filtered = search.trim()
  ? items.filter(({ student }) => {
      const term = search.toLowerCase();
      return (
        student?.firstName?.toLowerCase().includes(term) ||
        student?.lastName?.toLowerCase().includes(term)
      );
    })
  : items;
```

- [ ] **Step 3: Replace PaginationBar with TablePagination**

Remove the existing `PaginationBar` or navigation buttons. Add:
```tsx
<TablePagination
  page={page}
  pageCount={data?.pageCount ?? 1}
  total={data?.total ?? 0}
  pageSize={pageSize}
  onPageChange={setPage}
  onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
/>
```

- [ ] **Step 4: Type-check + commit**

```bash
bun check-types
git add apps/web/src/pages/admin/GraduatedStudents.tsx
git commit -m "feat(frontend): replace cursor pagination with TablePagination in GraduatedStudents"
```

---

## Task 22 — Frontend: StudentManagement (promotionPreview)

**Files:**
- Modify: `apps/web/src/pages/teacher/StudentManagement.tsx`

**Consumes:** `trpc.classes.promotionPreviewPaged` (Task 8)
**Current pattern:** `useCursorPagination` + `PaginationBar` inside a dialog/modal showing promotion preview for a source class

- [ ] **Step 1: Replace imports**

Remove `useCursorPagination`, `PaginationBar`. Add `TablePagination`.

- [ ] **Step 2: Replace pagination state and query**

```ts
// Remove: const pagination = useCursorPagination({ pageSize: 30 })
const [page, setPage] = useState(1);
const [pageSize, setPageSize] = useState(30);

const { data: preview, isLoading } = useQuery({
  ...trpc.classes.promotionPreviewPaged.queryOptions({
    sourceClassId: sourceClassId!,
    page,
    pageSize,
  }),
  enabled: !!sourceClassId,
});
const previewItems = preview?.items ?? [];
```

When `sourceClassId` changes (user selects a new source class), reset page:
```ts
useEffect(() => {
  setPage(1);
}, [sourceClassId]);
```

- [ ] **Step 3: Replace PaginationBar with TablePagination**

Remove the `<PaginationBar hasPrev={...} onPrev={...} onNext={...} page={...} />`.

Add:
```tsx
<TablePagination
  page={page}
  pageCount={preview?.pageCount ?? 1}
  total={preview?.total ?? 0}
  pageSize={pageSize}
  onPageChange={setPage}
  onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
/>
```

- [ ] **Step 4: Type-check + full type-check**

```bash
bun check-types
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/pages/teacher/StudentManagement.tsx
git commit -m "feat(frontend): replace cursor pagination with TablePagination in StudentManagement promotionPreview"
```

---

## Completion Checklist

After all 22 tasks:

- [ ] `bun check-types` → 0 errors
- [ ] `cd apps/server && bun test` → 0 failures (same pass count as before)
- [ ] No `useInfiniteQuery` or `useInfiniteScroll` references remain in admin/dean pages:
  ```bash
  grep -r "useInfiniteQuery\|useInfiniteScroll\|sentinelRef\|fetchNextPage" apps/web/src/pages/admin apps/web/src/pages/dean apps/web/src/pages/teacher
  ```
  Expected: 0 results
- [ ] No `useCursorPagination` references in the 5 converted Pattern-B pages:
  ```bash
  grep -r "useCursorPagination" apps/web/src/pages/dean/WorkflowApprovals.tsx apps/web/src/pages/dean/DeanDashboard.tsx apps/web/src/pages/dean/ApprovalHistory.tsx apps/web/src/pages/admin/GraduatedStudents.tsx apps/web/src/pages/teacher/StudentManagement.tsx
  ```
  Expected: 0 results
