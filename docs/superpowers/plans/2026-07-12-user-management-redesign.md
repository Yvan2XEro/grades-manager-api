# User Management Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the three broken user-management pages (UserManagement, StudentManagement, GuardiansManagement) with a unified People list and a proper Guardian directory, both with page-based pagination.

**Architecture:** New `users.listPaged` backend procedure adds offset pagination + search + student enrichment without touching existing cursor-based `users.list`. New `guardians.listAll`, `guardians.removeLink`, and `guardians.delete` procedures complete the guardian API. Two new frontend pages (`PeopleManagement`, `GuardianDirectory`) replace the three old ones; a shared `TablePagination` component handles page-number UI across both.

**Tech Stack:** Bun, Hono, tRPC, Drizzle ORM (PostgreSQL/PGlite), React, TanStack Query, React Router v7, shadcn/ui, Zod, i18next

## Global Constraints

- Run tests from `apps/server/`: `bun test`
- Run type-check: `bun check-types`
- Run lint/format: `bun check`
- `users.list` (cursor-based) must remain **unchanged** — 9 consumers depend on it
- All new backend procedures are `tenantProtectedProcedure` or `tenantAdminProcedure` (institution-scoped)
- No Co-Authored-By in commit messages
- Never edit SQL migration files — schema is already correct, no migrations needed
- Pagination: 1-indexed `page`, default `pageSize` = 25, max 100

---

## File Map

### Created
- `apps/server/src/modules/users/users.listpaged.repo.ts` — offset-based list with student JOIN
- `apps/web/src/components/ui/table-pagination.tsx` — reusable page-number UI
- `apps/web/src/pages/admin/users/PeopleManagement.tsx` — unified people list
- `apps/web/src/pages/admin/users/GuardianDirectory.tsx` — guardian directory

### Modified
- `apps/server/src/modules/users/users.service.ts` — add `listUsersPaged`
- `apps/server/src/modules/users/users.router.ts` — add `listPaged` procedure
- `apps/server/src/modules/guardians/guardians.repo.ts` — add `listAll`, `removeStudentLink`, `deleteGuardian`
- `apps/server/src/modules/guardians/guardians.service.ts` — add `listAll`, `removeLink`, `delete`
- `apps/server/src/modules/guardians/guardians.router.ts` — add `listAll`, `removeLink`, `delete` procedures
- `apps/server/src/modules/guardians/guardians.zod.ts` — add `listAllSchema`, `removeLinkSchema`
- `apps/web/src/pages/admin/UsersHub.tsx` — update tabs (People, Guardians, API Keys)
- `apps/web/src/App.tsx` — add new routes + redirects
- `apps/web/src/components/navigation/Sidebar.tsx` — Students link → `/admin/users/people`
- `apps/web/src/i18n/locales/en/translation.json` — add `usersHub.tabs.people`, guardian keys
- `apps/web/src/i18n/locales/fr/translation.json` — same keys in French

### Deleted
- `apps/web/src/pages/admin/UserManagement.tsx`
- `apps/web/src/pages/admin/StudentManagement.tsx`
- `apps/web/src/pages/admin/GuardiansManagement.tsx`

---

## Task 1 — Backend: `users.listPaged`

**Files:**
- Create: `apps/server/src/modules/users/users.listpaged.repo.ts`
- Modify: `apps/server/src/modules/users/users.service.ts`
- Modify: `apps/server/src/modules/users/users.router.ts`
- Test: `apps/server/src/modules/users/__tests__/users.caller.test.ts`

**Interfaces:**
- Produces: `trpc.users.listPaged` — input `{ page, pageSize, role?, status?, search?, classId?, academicYearId? }`, output `{ items, total, pageCount }`
- Items when `role !== "student"`: `{ id, firstName, lastName, primaryEmail, role, status }`
- Items when `role === "student"`: above + `{ registrationNumber, currentClassName, currentEnrollmentStatus }`

- [ ] **Step 1: Write failing tests**

In `apps/server/src/modules/users/__tests__/users.caller.test.ts`, add at the end of the file:

```ts
describe("users.listPaged", () => {
  test("requires auth", async () => {
    const caller = appRouter.createCaller(makeTestContext());
    await expect(
      caller.users.listPaged({ page: 1, pageSize: 25 }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  test("returns page with total and pageCount", async () => {
    const caller = appRouter.createCaller(await asAdmin());
    const result = await caller.users.listPaged({ page: 1, pageSize: 25 });
    expect(result).toMatchObject({
      items: expect.any(Array),
      total: expect.any(Number),
      pageCount: expect.any(Number),
    });
  });

  test("filters by role", async () => {
    const caller = appRouter.createCaller(await asAdmin());
    const result = await caller.users.listPaged({ page: 1, pageSize: 25, role: "student" });
    for (const item of result.items) {
      expect(item.role).toBe("student");
    }
  });

  test("search filters by name", async () => {
    const caller = appRouter.createCaller(await asAdmin());
    const result = await caller.users.listPaged({ page: 1, pageSize: 25, search: "zzz_no_match_xyz" });
    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  test("pageCount is ceil(total / pageSize)", async () => {
    const caller = appRouter.createCaller(await asAdmin());
    const result = await caller.users.listPaged({ page: 1, pageSize: 1 });
    expect(result.pageCount).toBe(Math.ceil(result.total / 1));
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd apps/server && bun test --test-name-pattern "users.listPaged"
```
Expected: failures with "users.listPaged is not a function" or similar.

- [ ] **Step 3: Create `users.listpaged.repo.ts`**

```ts
import { and, count, eq, ilike, or, type SQL } from "drizzle-orm";
import { db } from "@/db";
import {
  type BusinessRole,
  type DomainUserStatus,
  classes,
  domainUsers,
  enrollments,
  students,
} from "@/db/schema/app-schema";
import { member } from "@/db/schema/auth";

export type ListPagedOpts = {
  page: number;
  pageSize: number;
  role?: BusinessRole;
  status?: DomainUserStatus;
  search?: string;
  classId?: string;
  academicYearId?: string;
};

export async function listPaged(opts: ListPagedOpts) {
  const size = Math.min(Math.max(opts.pageSize ?? 25, 1), 100);
  const offset = (Math.max(opts.page ?? 1, 1) - 1) * size;
  const isStudent = opts.role === "student";

  const conditions: SQL[] = [];
  if (opts.role) conditions.push(eq(member.role, opts.role));
  if (opts.status) conditions.push(eq(domainUsers.status, opts.status));
  if (opts.search) {
    const term = `%${opts.search.toLowerCase()}%`;
    conditions.push(
      or(
        ilike(domainUsers.firstName, term),
        ilike(domainUsers.lastName, term),
        ilike(domainUsers.primaryEmail, term),
      ) as SQL,
    );
  }
  if (isStudent && opts.classId) {
    conditions.push(eq(enrollments.classId, opts.classId));
  }
  if (isStudent && opts.academicYearId) {
    conditions.push(eq(enrollments.academicYearId, opts.academicYearId));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  // Base columns shared across all roles
  const baseSelect = {
    id: domainUsers.id,
    firstName: domainUsers.firstName,
    lastName: domainUsers.lastName,
    primaryEmail: domainUsers.primaryEmail,
    phone: domainUsers.phone,
    status: domainUsers.status,
    role: member.role,
    memberId: domainUsers.memberId,
  } as const;

  if (isStudent) {
    const [rows, [{ total }]] = await Promise.all([
      db
        .select({
          ...baseSelect,
          registrationNumber: students.registrationNumber,
          currentClassName: classes.name,
          currentEnrollmentStatus: enrollments.status,
        })
        .from(domainUsers)
        .leftJoin(member, eq(member.id, domainUsers.memberId))
        .leftJoin(students, eq(students.domainUserId, domainUsers.id))
        .leftJoin(enrollments, eq(enrollments.studentId, students.id))
        .leftJoin(classes, eq(classes.id, enrollments.classId))
        .where(where)
        .orderBy(domainUsers.lastName, domainUsers.firstName)
        .limit(size)
        .offset(offset),
      db
        .select({ total: count() })
        .from(domainUsers)
        .leftJoin(member, eq(member.id, domainUsers.memberId))
        .leftJoin(students, eq(students.domainUserId, domainUsers.id))
        .leftJoin(enrollments, eq(enrollments.studentId, students.id))
        .where(where),
    ]);

    const totalCount = Number(total ?? 0);
    return {
      items: rows.map((r) => ({ ...r, role: r.role ?? null })),
      total: totalCount,
      pageCount: Math.ceil(totalCount / size),
    };
  }

  const [rows, [{ total }]] = await Promise.all([
    db
      .select(baseSelect)
      .from(domainUsers)
      .leftJoin(member, eq(member.id, domainUsers.memberId))
      .where(where)
      .orderBy(domainUsers.lastName, domainUsers.firstName)
      .limit(size)
      .offset(offset),
    db
      .select({ total: count() })
      .from(domainUsers)
      .leftJoin(member, eq(member.id, domainUsers.memberId))
      .where(where),
  ]);

  const totalCount = Number(total ?? 0);
  return {
    items: rows.map((r) => ({ ...r, role: r.role ?? null })),
    total: totalCount,
    pageCount: Math.ceil(totalCount / size),
  };
}
```

- [ ] **Step 4: Add `listUsersPaged` to `users.service.ts`**

At the end of `apps/server/src/modules/users/users.service.ts`, add:

```ts
import * as pagedRepo from "./users.listpaged.repo";

export async function listUsersPaged(opts: pagedRepo.ListPagedOpts) {
  return pagedRepo.listPaged(opts);
}
```

- [ ] **Step 5: Add `listPaged` procedure to `users.router.ts`**

In `apps/server/src/modules/users/users.router.ts`, add to the existing imports:
```ts
import { businessRoles, domainStatuses } from "@/db/schema/app-schema";
```
(already imported — check before adding)

Add to the `usersRouter` object:
```ts
listPaged: protectedProcedure
  .input(
    z.object({
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(100).default(25),
      role: z.enum(businessRoles).optional(),
      status: z.enum(domainStatuses).optional(),
      search: z.string().optional(),
      classId: z.string().optional(),
      academicYearId: z.string().optional(),
    }),
  )
  .query(({ input }) => service.listUsersPaged(input)),
```

- [ ] **Step 6: Run tests**

```bash
cd apps/server && bun test --test-name-pattern "users.listPaged"
```
Expected: all 5 tests pass.

- [ ] **Step 7: Type-check**

```bash
bun check-types
```
Expected: exit 0.

- [ ] **Step 8: Commit**

```bash
git add apps/server/src/modules/users/
git commit -m "feat(users): add listPaged procedure with offset pagination and student enrichment"
```

---

## Task 2 — Backend: `guardians.listAll`, `removeLink`, `delete`

**Files:**
- Modify: `apps/server/src/modules/guardians/guardians.repo.ts`
- Modify: `apps/server/src/modules/guardians/guardians.service.ts`
- Modify: `apps/server/src/modules/guardians/guardians.router.ts`
- Modify: `apps/server/src/modules/guardians/guardians.zod.ts`
- Test: `apps/server/src/modules/guardians/__tests__/guardians.caller.test.ts` (create if absent)

**Interfaces:**
- Produces: `trpc.guardians.listAll` — input `{ page, pageSize, search? }`, output `{ items: GuardianWithLinks[], total, pageCount }`
- Produces: `trpc.guardians.removeLink` — input `{ studentId, guardianId }`, no return value
- Produces: `trpc.guardians.delete` — input `{ id }`, no return value

- [ ] **Step 1: Write failing tests**

Create or append to `apps/server/src/modules/guardians/__tests__/guardians.caller.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import { appRouter } from "@/routers";
import { asAdmin, makeTestContext } from "@/lib/test-utils";

describe("guardians.listAll", () => {
  test("requires auth", async () => {
    const caller = appRouter.createCaller(makeTestContext());
    await expect(
      caller.guardians.listAll({ page: 1, pageSize: 25 }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  test("returns page shape", async () => {
    const caller = appRouter.createCaller(await asAdmin());
    const result = await caller.guardians.listAll({ page: 1, pageSize: 25 });
    expect(result).toMatchObject({
      items: expect.any(Array),
      total: expect.any(Number),
      pageCount: expect.any(Number),
    });
  });

  test("each item has studentLinks array", async () => {
    const caller = appRouter.createCaller(await asAdmin());
    const result = await caller.guardians.listAll({ page: 1, pageSize: 25 });
    for (const item of result.items) {
      expect(Array.isArray(item.studentLinks)).toBe(true);
    }
  });

  test("search returns empty for no-match term", async () => {
    const caller = appRouter.createCaller(await asAdmin());
    const result = await caller.guardians.listAll({ page: 1, pageSize: 25, search: "zzz_no_match_xyz" });
    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});

describe("guardians.removeLink", () => {
  test("requires admin", async () => {
    const caller = appRouter.createCaller(makeTestContext());
    await expect(
      caller.guardians.removeLink({ studentId: "s1", guardianId: "g1" }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

describe("guardians.delete", () => {
  test("requires admin", async () => {
    const caller = appRouter.createCaller(makeTestContext());
    await expect(
      caller.guardians.delete({ id: "g1" }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
```

- [ ] **Step 2: Run to confirm failures**

```bash
cd apps/server && bun test --test-name-pattern "guardians\."
```
Expected: failures on `listAll`, `removeLink`, `delete`.

- [ ] **Step 3: Add Zod schemas to `guardians.zod.ts`**

Append to `apps/server/src/modules/guardians/guardians.zod.ts`:

```ts
export const listAllSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
  search: z.string().optional(),
});

export const removeLinkSchema = z.object({
  studentId: z.string(),
  guardianId: z.string(),
});

export const deleteGuardianSchema = z.object({
  id: z.string(),
});
```

- [ ] **Step 4: Add repo functions to `guardians.repo.ts`**

Add these imports at the top (merge with existing):
```ts
import { and, count, eq, ilike, or, type SQL } from "drizzle-orm";
```

Append to `apps/server/src/modules/guardians/guardians.repo.ts`:

```ts
export async function listAll(
  institutionId: string,
  opts: { page: number; pageSize: number; search?: string },
) {
  const size = Math.min(Math.max(opts.pageSize ?? 25, 1), 100);
  const offset = (Math.max(opts.page ?? 1, 1) - 1) * size;

  const conditions: SQL[] = [
    eq(schema.guardians.institutionId, institutionId),
  ];
  if (opts.search) {
    const term = `%${opts.search.toLowerCase()}%`;
    conditions.push(
      or(
        ilike(schema.guardians.firstName, term),
        ilike(schema.guardians.lastName, term),
        ilike(schema.guardians.email, term),
      ) as SQL,
    );
  }
  const where = and(...conditions);

  const [rows, [{ total }]] = await Promise.all([
    db.query.guardians.findMany({
      where,
      limit: size,
      offset,
      orderBy: (g, { asc }) => [asc(g.lastName), asc(g.firstName)],
      with: {
        studentLinks: {
          with: {
            student: {
              with: { domainUser: true },
            },
          },
        },
      },
    }),
    db
      .select({ total: count() })
      .from(schema.guardians)
      .where(where),
  ]);

  const totalCount = Number(total ?? 0);
  return {
    items: rows.map((g) => ({
      id: g.id,
      firstName: g.firstName,
      lastName: g.lastName,
      email: g.email,
      phone: g.phone,
      accessToken: g.accessToken,
      preferences: g.preferences,
      studentLinks: g.studentLinks.map((link) => ({
        id: link.id,
        relationshipType: link.relationshipType,
        isPrimary: link.isPrimary,
        isEmergencyContact: link.isEmergencyContact,
        student: {
          id: link.student.id,
          firstName: link.student.domainUser?.firstName ?? "",
          lastName: link.student.domainUser?.lastName ?? "",
          registrationNumber: link.student.registrationNumber,
        },
      })),
    })),
    total: totalCount,
    pageCount: Math.ceil(totalCount / size),
  };
}

export async function removeStudentLink(
  institutionId: string,
  studentId: string,
  guardianId: string,
) {
  await db
    .delete(schema.studentGuardians)
    .where(
      and(
        eq(schema.studentGuardians.institutionId, institutionId),
        eq(schema.studentGuardians.studentId, studentId),
        eq(schema.studentGuardians.guardianId, guardianId),
      ),
    );
}

export async function deleteGuardian(
  institutionId: string,
  guardianId: string,
) {
  const [deleted] = await db
    .delete(schema.guardians)
    .where(
      and(
        eq(schema.guardians.institutionId, institutionId),
        eq(schema.guardians.id, guardianId),
      ),
    )
    .returning({ id: schema.guardians.id });
  return deleted ?? null;
}
```

> **Note:** `listAll` uses `db.query.guardians.findMany` with a `with` relation. Verify that `studentLinks` and `student.domainUser` relations are defined in `app-schema.ts` relations. If `domainUser` relation does not exist on the `students` table relations, replace `link.student.domainUser?.firstName` with a separate join query or add the relation to the schema.

- [ ] **Step 5: Add service functions to `guardians.service.ts`**

Append to `apps/server/src/modules/guardians/guardians.service.ts`:

```ts
export async function listAll(
  institutionId: string,
  input: z.infer<typeof import("./guardians.zod").listAllSchema>,
) {
  return repo.listAll(institutionId, input);
}

export async function removeLink(
  institutionId: string,
  input: z.infer<typeof import("./guardians.zod").removeLinkSchema>,
) {
  await repo.removeStudentLink(institutionId, input.studentId, input.guardianId);
}

export async function deleteGuardian(institutionId: string, id: string) {
  const deleted = await repo.deleteGuardian(institutionId, id);
  if (!deleted) throw notFound("Guardian not found");
}
```

Actually, avoid dynamic import in type position. Import the schemas at the top of the file instead:
```ts
import type { listAllSchema, removeLinkSchema } from "./guardians.zod";
// then use: z.infer<typeof listAllSchema>
```

- [ ] **Step 6: Add procedures to `guardians.router.ts`**

Append to the `guardiansRouter` object in `apps/server/src/modules/guardians/guardians.router.ts`:

```ts
listAll: tenantAdminProcedure
  .input(listAllSchema)
  .query(({ input, ctx }) =>
    service.listAll(ctx.institution.id, input),
  ),
removeLink: tenantAdminProcedure
  .input(removeLinkSchema)
  .mutation(({ input, ctx }) =>
    service.removeLink(ctx.institution.id, input),
  ),
delete: tenantAdminProcedure
  .input(z.object({ id: z.string() }))
  .mutation(({ input, ctx }) =>
    service.deleteGuardian(ctx.institution.id, input.id),
  ),
```

Also import the new zod schemas at the top:
```ts
import {
  createGuardianSchema,
  deleteGuardianSchema,
  linkStudentSchema,
  listAllSchema,
  recordCommunicationEventSchema,
  removeLinkSchema,
  updatePreferencesSchema,
} from "./guardians.zod";
```

- [ ] **Step 7: Run tests**

```bash
cd apps/server && bun test --test-name-pattern "guardians\."
```
Expected: all tests pass.

- [ ] **Step 8: Type-check**

```bash
bun check-types
```
Expected: exit 0.

- [ ] **Step 9: Commit**

```bash
git add apps/server/src/modules/guardians/
git commit -m "feat(guardians): add listAll, removeLink, and delete procedures"
```

---

## Task 3 — Frontend: `TablePagination` shared component

**Files:**
- Create: `apps/web/src/components/ui/table-pagination.tsx`

**Interfaces:**
- Produces: `<TablePagination page total pageSize pageCount onPageChange onPageSizeChange? />`

- [ ] **Step 1: Create `table-pagination.tsx`**

```tsx
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TablePaginationProps {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

export function TablePagination({
  page,
  pageCount,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: TablePaginationProps) {
  const start = Math.min((page - 1) * pageSize + 1, total);
  const end = Math.min(page * pageSize, total);

  // Build page number list: always show first, last, current ±1, with ellipsis
  function getPages(): (number | "ellipsis")[] {
    if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
    const pages: (number | "ellipsis")[] = [1];
    if (page > 3) pages.push("ellipsis");
    for (let p = Math.max(2, page - 1); p <= Math.min(pageCount - 1, page + 1); p++) {
      pages.push(p);
    }
    if (page < pageCount - 2) pages.push("ellipsis");
    pages.push(pageCount);
    return pages;
  }

  if (pageCount <= 1 && total <= pageSize) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
      <p className="text-muted-foreground text-sm">
        {total === 0
          ? "No results"
          : `Showing ${start}–${end} of ${total}`}
      </p>

      <div className="flex items-center gap-3">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => onPageChange(page - 1)}
                aria-disabled={page <= 1}
                className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>

            {getPages().map((p, i) =>
              p === "ellipsis" ? (
                // biome-ignore lint/suspicious/noArrayIndexKey: stable ellipsis position
                <PaginationItem key={`ellipsis-${i}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={p}>
                  <PaginationLink
                    isActive={p === page}
                    onClick={() => onPageChange(p)}
                    className="cursor-pointer"
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}

            <PaginationItem>
              <PaginationNext
                onClick={() => onPageChange(page + 1)}
                aria-disabled={page >= pageCount}
                className={page >= pageCount ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>

        {onPageSizeChange && (
          <Select
            value={String(pageSize)}
            onValueChange={(v) => onPageSizeChange(Number(v))}
          >
            <SelectTrigger className="h-8 w-[90px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 25, 50, 100].map((s) => (
                <SelectItem key={s} value={String(s)}>
                  {s} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
bun check-types
```
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/ui/table-pagination.tsx
git commit -m "feat(ui): add TablePagination component for page-based admin tables"
```

---

## Task 4 — Frontend: `PeopleManagement` page

**Files:**
- Create: `apps/web/src/pages/admin/users/PeopleManagement.tsx`

**Interfaces:**
- Consumes: `trpc.users.listPaged` (Task 1), `trpc.users.deleteProfile`, `trpc.users.updateProfile`, `<TablePagination>` (Task 3)
- Consumes i18n keys: `usersHub.people.*` (added in Task 6)

- [ ] **Step 1: Create `apps/web/src/pages/admin/users/PeopleManagement.tsx`**

```tsx
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { TablePagination } from "@/components/ui/table-pagination";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";
import type { BusinessRole, DomainUserStatus } from "@server/db/schema/app-schema";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import { ClassSelect } from "@/components/inputs/ClassSelect";

const ROLES: BusinessRole[] = [
  "administrator",
  "dean",
  "teacher",
  "grade_editor",
  "staff",
  "student",
];

const roleBadgeVariant: Record<string, "default" | "secondary" | "outline"> = {
  administrator: "default",
  dean: "default",
  teacher: "secondary",
  grade_editor: "secondary",
  staff: "outline",
  student: "outline",
};

export default function PeopleManagement() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [role, setRole] = useState<BusinessRole | "all">("all");
  const [status, setStatus] = useState<DomainUserStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [classId, setClassId] = useState<string | null>(null);
  const [academicYearId, setAcademicYearId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const isStudent = role === "student";

  // Reset to page 1 whenever filters change
  const handleFilter = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
  };

  const queryKey = trpc.users.listPaged.queryKey({
    page,
    pageSize,
    role: role === "all" ? undefined : role,
    status: status === "all" ? undefined : status,
    search: debouncedSearch || undefined,
    classId: isStudent ? (classId ?? undefined) : undefined,
    academicYearId: isStudent ? (academicYearId ?? undefined) : undefined,
  });

  const { data, isLoading } = useQuery(
    trpc.users.listPaged.queryOptions({
      page,
      pageSize,
      role: role === "all" ? undefined : role,
      status: status === "all" ? undefined : status,
      search: debouncedSearch || undefined,
      classId: isStudent ? (classId ?? undefined) : undefined,
      academicYearId: isStudent ? (academicYearId ?? undefined) : undefined,
    }),
  );

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      trpcClient.users.deleteProfile.mutate({ id }),
    onSuccess: () => {
      toast.success(t("common.deleted"));
      queryClient.invalidateQueries({ queryKey });
      setDeleteTarget(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const items = data?.items ?? [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-xl">
            {t("usersHub.people.title", { defaultValue: "People" })}
          </h2>
          <p className="text-muted-foreground text-sm">
            {t("usersHub.people.subtitle", {
              defaultValue: "All profiles in the institution.",
            })}
          </p>
        </div>
        <Button onClick={() => navigate("/admin/users/people/new")}>
          <Plus className="mr-2 h-4 w-4" />
          {t("usersHub.people.add", { defaultValue: "Add person" })}
        </Button>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        {/* Search + Status */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder={t("usersHub.people.searchPlaceholder", {
                defaultValue: "Search by name or email…",
              })}
              value={search}
              onChange={(e) => handleFilter(setSearch)(e.target.value)}
            />
          </div>
          <Select value={status} onValueChange={handleFilter(setStatus)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t("common.filters.allStatuses", { defaultValue: "All statuses" })}
              </SelectItem>
              <SelectItem value="active">{t("common.active")}</SelectItem>
              <SelectItem value="inactive">{t("common.inactive")}</SelectItem>
              <SelectItem value="suspended">
                {t("common.suspended", { defaultValue: "Suspended" })}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Role chips */}
        <div className="flex flex-wrap gap-2">
          {(["all", ...ROLES] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => handleFilter(setRole)(r)}
              className={`rounded-full border px-3 py-1 text-sm transition ${
                role === r
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:border-primary"
              }`}
            >
              {r === "all"
                ? t("common.filters.all", { defaultValue: "All" })
                : t(`roles.${r}`, { defaultValue: r })}
            </button>
          ))}
        </div>

        {/* Student-specific filters */}
        {isStudent && (
          <div className="flex flex-wrap gap-2">
            <ClassSelect
              value={classId}
              onChange={(v) => { setClassId(v); setPage(1); }}
              allowAll
              className="w-48"
            />
            <AcademicYearSelect
              value={academicYearId}
              onChange={(v) => { setAcademicYearId(v ?? null); setPage(1); }}
              allowAll
              autoSelectActive={false}
              className="w-48"
            />
          </div>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton columns={isStudent ? 5 : 4} rows={8} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("common.fields.name", { defaultValue: "Name" })}</TableHead>
              <TableHead>{t("common.fields.role", { defaultValue: "Role" })}</TableHead>
              {isStudent ? (
                <>
                  <TableHead>{t("usersHub.people.class", { defaultValue: "Class" })}</TableHead>
                  <TableHead>{t("usersHub.people.regNumber", { defaultValue: "Reg. number" })}</TableHead>
                  <TableHead>{t("usersHub.people.enrollmentStatus", { defaultValue: "Enrollment" })}</TableHead>
                </>
              ) : (
                <TableHead>{t("common.fields.email", { defaultValue: "Email" })}</TableHead>
              )}
              <TableHead>{t("common.fields.status", { defaultValue: "Status" })}</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={isStudent ? 7 : 5}
                  className="py-12 text-center text-muted-foreground"
                >
                  {t("usersHub.people.empty", { defaultValue: "No people found." })}
                </TableCell>
              </TableRow>
            ) : (
              items.map((person) => (
                <TableRow
                  key={person.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/admin/profiles/${person.id}`)}
                >
                  <TableCell className="font-medium">
                    {person.firstName} {person.lastName}
                  </TableCell>
                  <TableCell>
                    {person.role ? (
                      <Badge variant={roleBadgeVariant[person.role] ?? "outline"}>
                        {t(`roles.${person.role}`, { defaultValue: person.role })}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  {isStudent ? (
                    <>
                      <TableCell>
                        {"currentClassName" in person
                          ? (person.currentClassName ?? "—")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {"registrationNumber" in person
                          ? (person.registrationNumber ?? "—")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {"currentEnrollmentStatus" in person &&
                        person.currentEnrollmentStatus ? (
                          <Badge variant="outline">
                            {t(
                              `enrollments.status.${person.currentEnrollmentStatus}`,
                              { defaultValue: person.currentEnrollmentStatus },
                            )}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                    </>
                  ) : (
                    <TableCell className="text-muted-foreground text-sm">
                      {person.primaryEmail}
                    </TableCell>
                  )}
                  <TableCell>
                    <Badge
                      variant={
                        person.status === "active" ? "default" : "secondary"
                      }
                    >
                      {t(`common.${person.status}`, {
                        defaultValue: person.status,
                      })}
                    </Badge>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => navigate(`/admin/profiles/${person.id}`)}
                        >
                          {t("common.actions.open", { defaultValue: "Open" })}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteTarget(person.id)}
                        >
                          {t("common.actions.delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      <TablePagination
        page={page}
        pageCount={data?.pageCount ?? 1}
        total={data?.total ?? 0}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("usersHub.people.deleteConfirm", {
                defaultValue: "This will permanently delete the profile.",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
```

> **Note:** `ClassSelect` may not exist as a standalone component. Check `apps/web/src/components/inputs/`. If missing, replace with an inline `<Select>` querying `trpc.classes.list.queryOptions({})` — same pattern as `AcademicYearSelect`. The `useDebounce` hook: check if it exists at `@/hooks/useDebounce`; if not, implement it inline:
> ```ts
> function useDebounce<T>(value: T, delay: number): T {
>   const [debounced, setDebounced] = useState(value);
>   useEffect(() => {
>     const t = setTimeout(() => setDebounced(value), delay);
>     return () => clearTimeout(t);
>   }, [value, delay]);
>   return debounced;
> }
> ```

- [ ] **Step 2: Type-check**

```bash
bun check-types
```
Fix any type errors (likely: `currentClassName`/`registrationNumber` only present when `role === "student"` — use `"currentClassName" in person` guards as shown above).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/admin/users/PeopleManagement.tsx
git commit -m "feat(users): add PeopleManagement unified people list with role chips and pagination"
```

---

## Task 5 — Frontend: `GuardianDirectory` page

**Files:**
- Create: `apps/web/src/pages/admin/users/GuardianDirectory.tsx`

**Interfaces:**
- Consumes: `trpc.guardians.listAll` (Task 2), `trpc.guardians.create`, `trpc.guardians.updatePreferences`, `trpc.guardians.removeLink`, `trpc.guardians.delete`, `<TablePagination>` (Task 3)

- [ ] **Step 1: Create `apps/web/src/pages/admin/users/GuardianDirectory.tsx`**

```tsx
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Trash2,
  UserMinus,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { TablePagination } from "@/components/ui/table-pagination";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";

const RELATIONSHIP_TYPES = [
  "mother",
  "father",
  "guardian",
  "uncle",
  "aunt",
  "other",
] as const;

const DEFAULT_PREFERENCES = {
  resultsPublished: true,
  attendanceThreshold: true,
  feeClearance: true,
  documentsAvailable: true,
};

type PreferencesType = typeof DEFAULT_PREFERENCES;

export default function GuardianDirectory() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [prefTarget, setPrefTarget] = useState<{
    id: string;
    name: string;
    preferences: PreferencesType;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const queryKeyBase = trpc.guardians.listAll.queryKey({
    page,
    pageSize,
    search: debouncedSearch || undefined,
  });

  const { data, isLoading } = useQuery(
    trpc.guardians.listAll.queryOptions({
      page,
      pageSize,
      search: debouncedSearch || undefined,
    }),
  );

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: queryKeyBase });

  const removeLinkMutation = useMutation({
    mutationFn: (input: { studentId: string; guardianId: string }) =>
      trpcClient.guardians.removeLink.mutate(input),
    onSuccess: () => { toast.success(t("common.done", { defaultValue: "Done" })); invalidate(); },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => trpcClient.guardians.delete.mutate({ id }),
    onSuccess: () => {
      toast.success(t("common.deleted"));
      invalidate();
      setDeleteTarget(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const prefMutation = useMutation({
    mutationFn: (input: { guardianId: string; preferences: PreferencesType }) =>
      trpcClient.guardians.updatePreferences.mutate(input),
    onSuccess: () => {
      toast.success(t("guardians.admin.toasts.preferencesSaved"));
      invalidate();
      setPrefTarget(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const items = data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-xl">
            {t("guardians.admin.title")}
          </h2>
          <p className="text-muted-foreground text-sm">
            {t("guardians.admin.subtitle")}
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t("guardians.admin.save")}
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder={t("guardians.admin.searchPlaceholder", {
            defaultValue: "Search by name or email…",
          })}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {isLoading ? (
        <TableSkeleton columns={5} rows={6} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>{t("guardians.fields.firstName")}</TableHead>
              <TableHead>{t("guardians.fields.email")}</TableHead>
              <TableHead>
                {t("guardians.admin.linkedStudents", { defaultValue: "Linked to" })}
              </TableHead>
              <TableHead>
                {t("guardians.fields.relationshipType")}
              </TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-12 text-center text-muted-foreground"
                >
                  {t("guardians.admin.empty")}
                </TableCell>
              </TableRow>
            ) : (
              items.flatMap((g) => {
                const expanded = expandedId === g.id;
                const relationships = [
                  ...new Set(g.studentLinks.map((l) => l.relationshipType)),
                ];
                return [
                  <TableRow
                    key={g.id}
                    className="cursor-pointer"
                    onClick={() =>
                      setExpandedId(expanded ? null : g.id)
                    }
                  >
                    <TableCell>
                      {g.studentLinks.length > 0 ? (
                        expanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )
                      ) : null}
                    </TableCell>
                    <TableCell className="font-medium">
                      {g.firstName} {g.lastName}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {g.email}
                    </TableCell>
                    <TableCell>
                      {g.studentLinks.length === 0 ? (
                        <span className="text-muted-foreground text-sm">—</span>
                      ) : (
                        <Badge variant="secondary">
                          {g.studentLinks.length}{" "}
                          {g.studentLinks.length === 1
                            ? t("guardians.admin.student", { defaultValue: "student" })
                            : t("guardians.admin.students")}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {relationships.map((r) => (
                          <Badge key={r} variant="outline">
                            {t(`guardians.relationships.${r}`)}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              void navigator.clipboard.writeText(
                                `${window.location.origin}/guardian/portal?token=${g.accessToken}`,
                              );
                              toast.success(t("guardians.admin.toasts.linkCopied"));
                            }}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            {t("guardians.admin.copyPortalLink")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              setPrefTarget({
                                id: g.id,
                                name: `${g.firstName} ${g.lastName}`,
                                preferences: {
                                  ...DEFAULT_PREFERENCES,
                                  ...(g.preferences as PreferencesType),
                                },
                              })
                            }
                          >
                            <Settings className="mr-2 h-4 w-4" />
                            {t("guardians.admin.editPreferences", {
                              defaultValue: "Edit preferences",
                            })}
                          </DropdownMenuItem>
                          {g.studentLinks.length > 0 && (
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>
                                <UserMinus className="mr-2 h-4 w-4" />
                                {t("guardians.admin.removeFromStudent", {
                                  defaultValue: "Remove from student",
                                })}
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                {g.studentLinks.map((link) => (
                                  <DropdownMenuItem
                                    key={link.id}
                                    onClick={() =>
                                      removeLinkMutation.mutate({
                                        guardianId: g.id,
                                        studentId: link.student.id,
                                      })
                                    }
                                  >
                                    {link.student.firstName}{" "}
                                    {link.student.lastName}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteTarget(g.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t("common.actions.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>,

                  // Expanded student links row
                  ...(expanded
                    ? [
                        <TableRow key={`${g.id}-expanded`} className="bg-muted/30">
                          <TableCell />
                          <TableCell colSpan={5}>
                            <div className="space-y-1 py-1">
                              {g.studentLinks.map((link) => (
                                <div
                                  key={link.id}
                                  className="flex items-center gap-3 text-sm"
                                >
                                  <span className="text-muted-foreground">→</span>
                                  <span className="font-medium">
                                    {link.student.firstName} {link.student.lastName}
                                  </span>
                                  {link.student.registrationNumber && (
                                    <span className="text-muted-foreground">
                                      {link.student.registrationNumber}
                                    </span>
                                  )}
                                  {link.isPrimary && (
                                    <Badge variant="default" className="text-xs">
                                      {t("guardians.fields.isPrimary")}
                                    </Badge>
                                  )}
                                  {link.isEmergencyContact && (
                                    <Badge variant="outline" className="text-xs">
                                      {t("guardians.fields.isEmergencyContact")}
                                    </Badge>
                                  )}
                                </div>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>,
                      ]
                    : []),
                ];
              })
            )}
          </TableBody>
        </Table>
      )}

      <TablePagination
        page={page}
        pageCount={data?.pageCount ?? 1}
        total={data?.total ?? 0}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
      />

      {/* Add Guardian Dialog */}
      <AddGuardianDialog
        open={showAdd}
        onOpenChange={setShowAdd}
        onCreated={() => { invalidate(); setShowAdd(false); }}
      />

      {/* Edit Preferences Sheet */}
      <Sheet open={!!prefTarget} onOpenChange={(o) => !o && setPrefTarget(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {t("guardians.admin.editPreferences", {
                defaultValue: "Edit preferences",
              })}{" "}
              — {prefTarget?.name}
            </SheetTitle>
          </SheetHeader>
          {prefTarget && (
            <div className="space-y-4 px-1 pt-6">
              {Object.entries(DEFAULT_PREFERENCES).map(([key]) => {
                const checked =
                  prefTarget.preferences[key as keyof PreferencesType] !== false;
                return (
                  <label key={key} className="flex items-center gap-3 text-sm">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) =>
                        setPrefTarget((prev) =>
                          prev
                            ? {
                                ...prev,
                                preferences: {
                                  ...prev.preferences,
                                  [key]: v === true,
                                },
                              }
                            : null,
                        )
                      }
                    />
                    {t(`guardians.preferences.${key}`)}
                  </label>
                );
              })}
              <Button
                className="mt-4 w-full"
                disabled={prefMutation.isPending}
                onClick={() =>
                  prefTarget &&
                  prefMutation.mutate({
                    guardianId: prefTarget.id,
                    preferences: prefTarget.preferences,
                  })
                }
              >
                {t("common.actions.saveChanges")}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirm */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("guardians.admin.deleteConfirm", {
                defaultValue:
                  "This will permanently delete the guardian and all student links.",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Add Guardian Dialog ──────────────────────────────────────────────────────

function AddGuardianDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: () => void;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    studentId: "",
    relationshipType: "guardian",
    isPrimary: false,
    isEmergencyContact: false,
  });

  const { data: students } = useQuery(
    trpc.students.list.queryOptions({ limit: 200 }),
  );

  const mut = useMutation({
    mutationFn: () =>
      trpcClient.guardians.create.mutate({
        studentId: form.studentId,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        relationshipType:
          form.relationshipType as (typeof RELATIONSHIP_TYPES)[number],
        isPrimary: form.isPrimary,
        isEmergencyContact: form.isEmergencyContact,
        preferences: DEFAULT_PREFERENCES,
      }),
    onSuccess: () => {
      toast.success(t("guardians.admin.toasts.saved"));
      onCreated();
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        studentId: "",
        relationshipType: "guardian",
        isPrimary: false,
        isEmergencyContact: false,
      });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const isValid =
    form.firstName && form.lastName && form.email && form.studentId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("guardians.admin.createTitle")}</DialogTitle>
        </DialogHeader>
        <DialogBody className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>{t("guardians.fields.firstName")}</Label>
            <Input
              value={form.firstName}
              onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("guardians.fields.lastName")}</Label>
            <Input
              value={form.lastName}
              onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("guardians.fields.email")}</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("guardians.fields.phone")}</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>
              {t("guardians.admin.students", { defaultValue: "Link to student" })}
            </Label>
            <Select
              value={form.studentId}
              onValueChange={(v) => setForm((f) => ({ ...f, studentId: v }))}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={t("guardians.admin.selectStudent", {
                    defaultValue: "Select student…",
                  })}
                />
              </SelectTrigger>
              <SelectContent>
                {(students?.items ?? []).map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.firstName} {s.lastName}
                    {s.registrationNumber ? ` — ${s.registrationNumber}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("guardians.fields.relationshipType")}</Label>
            <Select
              value={form.relationshipType}
              onValueChange={(v) => setForm((f) => ({ ...f, relationshipType: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RELATIONSHIP_TYPES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {t(`guardians.relationships.${r}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col justify-end gap-3">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.isPrimary}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isPrimary: v === true }))}
              />
              {t("guardians.fields.isPrimary")}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.isEmergencyContact}
                onCheckedChange={(v) =>
                  setForm((f) => ({ ...f, isEmergencyContact: v === true }))
                }
              />
              {t("guardians.fields.isEmergencyContact")}
            </label>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.actions.cancel")}
          </Button>
          <Button disabled={!isValid || mut.isPending} onClick={() => mut.mutate()}>
            {t("guardians.admin.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
bun check-types
```
Fix any errors. Common ones: `Sheet`/`SheetContent`/`SheetHeader`/`SheetTitle` from `@/components/ui/sheet` — check if `sheet` exists in shadcn ui; if not install with `bunx shadcn@latest add sheet` from `apps/web/`.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/admin/users/GuardianDirectory.tsx
git commit -m "feat(guardians): add GuardianDirectory with search, expansion, and add/remove actions"
```

---

## Task 6 — Wiring: routes, hub, sidebar, redirects, i18n, deletions

**Files:**
- Modify: `apps/web/src/pages/admin/UsersHub.tsx`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/components/navigation/Sidebar.tsx`
- Modify: `apps/web/src/i18n/locales/en/translation.json`
- Modify: `apps/web/src/i18n/locales/fr/translation.json`
- Delete: `apps/web/src/pages/admin/UserManagement.tsx`
- Delete: `apps/web/src/pages/admin/StudentManagement.tsx`
- Delete: `apps/web/src/pages/admin/GuardiansManagement.tsx`

- [ ] **Step 1: Update `UsersHub.tsx`**

Replace the full file content:

```tsx
import { HubNav } from "@/components/navigation/HubNav";
import { Outlet } from "react-router";

const tabs = [
  { path: "people", labelKey: "usersHub.tabs.people" },
  { path: "guardians", labelKey: "usersHub.tabs.guardians" },
  { path: "api-keys", labelKey: "usersHub.tabs.apiKeys" },
] as const;

export default function UsersHub() {
  return (
    <div className="space-y-6">
      <HubNav tabs={tabs} basePath="/admin/users" />
      <Outlet />
    </div>
  );
}
```

- [ ] **Step 2: Update App.tsx routes**

Locate the `users` route block (around `<Route path="users" element={<UsersHub />}>`).

Replace the children with:

```tsx
<Route path="users" element={<UsersHub />}>
  <Route index element={<Navigate to="people" replace />} />
  <Route path="people" element={<PeopleManagement />} />
  <Route path="guardians" element={<GuardianDirectory />} />
  <Route path="api-keys" element={<ApiKeysManagement />} />
  {/* Legacy redirects */}
  <Route path="accounts" element={<Navigate to="/admin/users/people" replace />} />
  <Route path="students" element={<Navigate to="/admin/users/people" replace />} />
</Route>
```

Add imports at the top of `App.tsx` alongside the other admin imports:
```tsx
import PeopleManagement from "@/pages/admin/users/PeopleManagement";
import GuardianDirectory from "@/pages/admin/users/GuardianDirectory";
```

Remove the old imports:
```tsx
// Delete these lines:
import UserManagement from "@/pages/admin/UserManagement";
import StudentManagement from "@/pages/admin/StudentManagement";
import GuardiansManagement from "@/pages/admin/GuardiansManagement";
```

- [ ] **Step 3: Update Sidebar.tsx**

Find the "Students" sidebar link (currently pointing to `/admin/users/students`) and change it to `/admin/users/people`:

```tsx
// Before:
{ href: "/admin/users/students", ... }
// After:
{ href: "/admin/users/people", ... }
```

- [ ] **Step 4: Add i18n keys**

In `apps/web/src/i18n/locales/en/translation.json`, find the `usersHub` section and replace it:

```json
"usersHub": {
  "tabs": {
    "people": "People",
    "guardians": "Guardians",
    "apiKeys": "API Keys"
  },
  "people": {
    "title": "People",
    "subtitle": "All profiles in this institution.",
    "add": "Add person",
    "searchPlaceholder": "Search by name or email…",
    "class": "Class",
    "regNumber": "Reg. number",
    "enrollmentStatus": "Enrollment",
    "empty": "No people found.",
    "deleteConfirm": "This will permanently delete the profile and cannot be undone."
  }
}
```

In `apps/web/src/i18n/locales/fr/translation.json`, same section:

```json
"usersHub": {
  "tabs": {
    "people": "Personnes",
    "guardians": "Tuteurs",
    "apiKeys": "Clés API"
  },
  "people": {
    "title": "Personnes",
    "subtitle": "Tous les profils de cette institution.",
    "add": "Ajouter une personne",
    "searchPlaceholder": "Rechercher par nom ou email…",
    "class": "Classe",
    "regNumber": "Matricule",
    "enrollmentStatus": "Inscription",
    "empty": "Aucune personne trouvée.",
    "deleteConfirm": "Cette action supprimera définitivement le profil et ne peut pas être annulée."
  }
}
```

Also add to guardian keys if missing:
```json
"guardians": {
  "admin": {
    ...existing keys...,
    "searchPlaceholder": "Search by name or email…",
    "linkedStudents": "Linked to",
    "student": "student",
    "editPreferences": "Edit preferences",
    "removeFromStudent": "Remove from student",
    "selectStudent": "Select student…",
    "deleteConfirm": "This will permanently delete the guardian and all student links."
  }
}
```

- [ ] **Step 5: Delete old files**

```bash
rm apps/web/src/pages/admin/UserManagement.tsx
rm apps/web/src/pages/admin/StudentManagement.tsx
rm apps/web/src/pages/admin/GuardiansManagement.tsx
```

- [ ] **Step 6: Regenerate i18n types**

```bash
bun run --filter web check-types
```

If the project has an i18n type generation step (check `package.json` in `apps/web/`), run it. Otherwise just run type-check.

- [ ] **Step 7: Full type-check**

```bash
bun check-types
```
Expected: exit 0. Fix any import errors from the deleted files.

- [ ] **Step 8: Biome check**

```bash
bun check
```
Expected: no errors (warnings pre-existing are fine).

- [ ] **Step 9: Backend tests**

```bash
cd apps/server && bun test
```
Expected: all pass.

- [ ] **Step 10: Commit**

```bash
git add apps/web/src/pages/admin/UsersHub.tsx \
        apps/web/src/App.tsx \
        apps/web/src/components/navigation/Sidebar.tsx \
        apps/web/src/i18n/
git commit -m "feat(users): wire PeopleManagement + GuardianDirectory, remove old pages, update hub tabs"
```
