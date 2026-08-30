# TKAMS Secondary — Plan B: Core Backend Catalog Modules

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement five catalog tRPC modules for `apps/secondary` — `academic-years`, `terms`, `subjects`, `tracks`, and `classes` — plus the shared test infrastructure and router wiring. After this plan, the secondary backend serves all catalog procedures needed for the admin UI.

**Architecture:** Each module lives under `apps/secondary/src/modules/<name>/` and follows the four-file pattern: zod schemas → repo (Drizzle queries) → service (business logic) → tRPC router. All five routers are registered in `src/routers/index.ts`. Tests are integration tests via `appRouter.createCaller(ctx)` against a real PostgreSQL database.

**Tech Stack:** Bun + tRPC 11 + Drizzle ORM 0.44 + PostgreSQL (node-postgres) + Zod v4

**Spec:** `docs/superpowers/specs/2026-08-26-tkams-secondaire.md` (sections 4 and 7)

## Global Constraints

- **Bun runtime** — run all commands with `bun`, not `node` or `npm`
- **Zod v4** — `z.record()` always takes two arguments: `z.record(z.string(), z.unknown())`, never one
- **Institution scope** — every query must filter by `institutionId` from `ctx.institution.id`; no cross-tenant data leaks
- **Code style** — tabs (width 2), double quotes, semicolons (Biome enforced)
- **No pg-boss, no batch jobs, no LMD machinery** — this is a clean secondary schema
- **English identifiers only** — no French variable or function names anywhere in TypeScript
- **Procedure selection** — reads use `tenantProcedure`; writes use `adminProcedure` (added in Task 0)
- **Schema is the source of truth** — the actual `src/db/schema.ts` takes precedence over the spec where they diverge (e.g., `terms` uses `termNumber: integer` not `name/code/orderIndex`; `tracks` has `isOfficial: boolean` not `officialExamType`)
- **Tests require a running PostgreSQL** — set `DATABASE_URL` to a test database; run `bun db:push` once before the first test run
- **Never edit SQL migration files manually** — use `bun db:generate`
- **Never add Co-Authored-By trailer** — suggest commit message as text only; do not commit/push

---

## Schema Reference (exact column names from `src/db/schema.ts`)

```
academicYears: id, institutionId, name, startDate, endDate,
               status ("active"|"closed"|"archived"), assessmentMode,
               createdAt, updatedAt

terms:         id, institutionId, academicYearId, termNumber (1|2|3),
               startDate, endDate, status ("open"|"closed"|"archived"),
               createdAt, updatedAt
               UNIQUE(academicYearId, termNumber)

tracks:        id, institutionId, name, code, cycleLevel
               ("first_cycle"|"second_cycle"|"technical"),
               isOfficial (boolean), createdAt, updatedAt
               UNIQUE(institutionId, code)

subjects:      id, institutionId, name, nameFr, code, minesecCode,
               subjectGroup, createdAt, updatedAt
               UNIQUE(institutionId, code)

trackSubjectCoefficients: id, trackId, subjectId, coefficient (integer),
               isOfficialExamSubject (boolean), createdAt, updatedAt
               UNIQUE(trackId, subjectId)
               NOTE: no institutionId column; scope via trackId → tracks

classes:       id, institutionId, academicYearId, trackId (nullable),
               classMasterId (nullable), name, code, level (varchar),
               room (nullable), maxCapacity (nullable),
               createdAt, updatedAt
               UNIQUE(academicYearId, code)

enrollments:   id, institutionId, studentId, academicYearId, classId,
               admissionType, status, createdAt, updatedAt

students:      id, institutionId, firstName, lastName, dateOfBirth,
               placeOfBirth, gender, mnu, registrationNumber, photoUrl,
               contactName, contactPhone, contactEmail, contactRelation,
               reportCardLanguage, createdAt, updatedAt
```

---

## Task 0: Prerequisites

**Files:**
- Modify: `src/lib/trpc.ts` — add `tenantProcedure` export
- Create: `src/lib/errors.ts` — shared error helpers
- Create: `src/lib/test-utils.ts` — test context factory

**Interfaces:**
- Produces: `tenantProcedure` (any authenticated user with institution), `notFound()`, `conflict()`, `makeTestContext()`, `asAdmin()`, `asTeacher()`
- Consumes: `db` from `../db`, Better-Auth `user`/`organization`/`member` tables (raw SQL inserts)

### Steps

- [ ] **Add `tenantProcedure` to `src/lib/trpc.ts`**

  Open the file (already read above). The `withInstitution` middleware is defined but not exported. Add one line at the end of the exported symbols block:

  ```ts
  export const tenantProcedure = withInstitution;
  ```

  Full modified export block becomes:

  ```ts
  export const router = t.router;
  export const publicProcedure = t.procedure;
  export const protectedProcedure = /* ... */;
  export const tenantProcedure = withInstitution;   // ← ADD THIS LINE
  export const adminProcedure = withInstitution.use(/* ... */);
  export const teacherProcedure = withInstitution.use(/* ... */);
  export const principalProcedure = withInstitution.use(/* ... */);
  ```

- [ ] **Create `src/lib/errors.ts`**

  ```ts
  import { TRPCError } from "@trpc/server";

  export const notFound = (message = "Not found") =>
  	new TRPCError({ code: "NOT_FOUND", message });

  export const conflict = (message = "Conflict") =>
  	new TRPCError({ code: "CONFLICT", message });

  export const forbidden = (message = "Forbidden") =>
  	new TRPCError({ code: "FORBIDDEN", message });
  ```

- [ ] **Create `src/lib/test-utils.ts`**

  Tests connect to the Postgres database at `DATABASE_URL`. Before the first run, ensure the schema is pushed: `cd apps/secondary && bun db:push`.

  ```ts
  import { randomUUID } from "node:crypto";
  import { sql } from "drizzle-orm";
  import { db } from "../db";
  import { institutions } from "../db/schema";
  import type { Context } from "./context";

  // ─── Module-level test state ──────────────────────────────────────────────────

  let _institution: typeof institutions.$inferSelect | null = null;
  let _adminUserId: string | null = null;
  let _teacherUserId: string | null = null;

  // ─── Setup ────────────────────────────────────────────────────────────────────

  /**
   * Inserts a test institution, admin user, teacher user, and their
   * Better-Auth organization + member rows. Call once per test file in
   * a `beforeAll` block.
   */
  export async function setupTestInstitution(): Promise<
  	typeof institutions.$inferSelect
  > {
  	const orgId = randomUUID();
  	const adminId = randomUUID();
  	const teacherId = randomUUID();

  	// Better-Auth user rows (id is text, not uuid in the auth schema)
  	await db.execute(sql`
  		INSERT INTO "user" (id, name, email, email_verified, created_at, updated_at)
  		VALUES
  			(${adminId}, ${"Test Admin"}, ${`admin-${orgId}@tkams.test`}, true, NOW(), NOW()),
  			(${teacherId}, ${"Test Teacher"}, ${`teacher-${orgId}@tkams.test`}, true, NOW(), NOW())
  		ON CONFLICT (email) DO NOTHING
  	`);

  	// Better-Auth organization row (id matches institution.id)
  	await db.execute(sql`
  		INSERT INTO organization (id, name, slug, created_at)
  		VALUES (${orgId}, ${"Test School"}, ${`test-${orgId}`}, NOW())
  		ON CONFLICT (id) DO NOTHING
  	`);

  	// Application institution (id = org id, no defaultRandom in schema)
  	const [institution] = await db
  		.insert(institutions)
  		.values({ id: orgId, name: "Test School" })
  		.onConflictDoNothing()
  		.returning();

  	if (!institution) {
  		// Already exists from a previous test run — fetch it
  		const rows = await db
  			.select()
  			.from(institutions)
  			.where(sql`id = ${orgId}`)
  			.limit(1);
  		_institution = rows[0]!;
  	} else {
  		_institution = institution;
  	}

  	// Better-Auth member rows
  	await db.execute(sql`
  		INSERT INTO member (id, organization_id, user_id, role, created_at)
  		VALUES
  			(${randomUUID()}, ${orgId}, ${adminId}, ${"admin"}, NOW()),
  			(${randomUUID()}, ${orgId}, ${teacherId}, ${"teacher"}, NOW())
  		ON CONFLICT DO NOTHING
  	`);

  	_adminUserId = adminId;
  	_teacherUserId = teacherId;
  	return _institution;
  }

  export function getTestInstitution(): typeof institutions.$inferSelect {
  	if (!_institution) {
  		throw new Error("Call setupTestInstitution() in beforeAll first");
  	}
  	return _institution;
  }

  // ─── Context factory ──────────────────────────────────────────────────────────

  type Role = "admin" | "teacher" | "principal";

  export function makeTestContext(opts: { role?: Role; userId?: string } = {}): Context {
  	const institution = opts.role ? getTestInstitution() : null;
  	const userId =
  		opts.userId ??
  		(opts.role === "teacher" ? _teacherUserId : _adminUserId) ??
  		randomUUID();
  	return {
  		db,
  		session: opts.role
  			? {
  					user: { id: userId },
  					session: { activeOrganizationId: institution?.id ?? null },
  				}
  			: null,
  		institution,
  	} as unknown as Context;
  }

  export const asAdmin = () => makeTestContext({ role: "admin" });
  export const asTeacher = () => makeTestContext({ role: "teacher" });
  export const asPrincipal = () => makeTestContext({ role: "principal" });
  export const asGuest = () => makeTestContext();
  ```

- [ ] **Run Biome** to confirm no lint errors: `cd apps/secondary && bun check`

---

## Task 1: `academic-years` module

**Files:**
- Create: `src/modules/academic-years/academic-years.zod.ts`
- Create: `src/modules/academic-years/academic-years.repo.ts`
- Create: `src/modules/academic-years/academic-years.service.ts`
- Create: `src/modules/academic-years/academic-years.router.ts`
- Create: `src/modules/academic-years/index.ts`
- Create: `src/modules/academic-years/__tests__/academic-years.caller.test.ts`

**Interfaces:**
- Produces: `academicYearsRouter` — `list`, `create`, `setActive`, `close`
- Consumes: `db` from `../../db`, `academicYears` table from `../../db/schema`, `tenantProcedure` + `adminProcedure` from `../../lib/trpc`

### Steps

- [ ] **Write the failing test first**

  `src/modules/academic-years/__tests__/academic-years.caller.test.ts`:

  ```ts
  import { afterAll, beforeAll, describe, expect, it } from "bun:test";
  import { appRouter } from "../../../routers";
  import { asAdmin, asGuest, setupTestInstitution } from "../../../lib/test-utils";

  beforeAll(async () => {
  	await setupTestInstitution();
  });

  describe("academicYears.list", () => {
  	it("rejects unauthenticated requests", async () => {
  		const caller = appRouter.createCaller(asGuest());
  		await expect(caller.academicYears.list()).rejects.toMatchObject({
  			code: "UNAUTHORIZED",
  		});
  	});

  	it("returns empty array for a new institution", async () => {
  		const caller = appRouter.createCaller(asAdmin());
  		const result = await caller.academicYears.list();
  		expect(Array.isArray(result)).toBe(true);
  	});
  });

  describe("academicYears.create", () => {
  	it("rejects guest requests", async () => {
  		const caller = appRouter.createCaller(asGuest());
  		await expect(
  			caller.academicYears.create({
  				name: "2025-2026",
  				startDate: new Date("2025-09-01"),
  				endDate: new Date("2026-06-30"),
  			}),
  		).rejects.toBeDefined();
  	});

  	it("creates an academic year and returns it", async () => {
  		const caller = appRouter.createCaller(asAdmin());
  		const year = await caller.academicYears.create({
  			name: "2025-2026",
  			startDate: new Date("2025-09-01"),
  			endDate: new Date("2026-06-30"),
  		});
  		expect(year.id).toBeString();
  		expect(year.name).toBe("2025-2026");
  		expect(year.status).toBe("active");
  	});
  });

  describe("academicYears.setActive + close", () => {
  	it("sets a year to active and closes it", async () => {
  		const caller = appRouter.createCaller(asAdmin());
  		const year = await caller.academicYears.create({
  			name: "2024-2025",
  			startDate: new Date("2024-09-01"),
  			endDate: new Date("2025-06-30"),
  		});

  		const activated = await caller.academicYears.setActive({ id: year.id });
  		expect(activated.status).toBe("active");

  		const closed = await caller.academicYears.close({ id: year.id });
  		expect(closed.status).toBe("closed");
  	});

  	it("throws NOT_FOUND for unknown id", async () => {
  		const caller = appRouter.createCaller(asAdmin());
  		await expect(
  			caller.academicYears.setActive({ id: "00000000-0000-0000-0000-000000000000" }),
  		).rejects.toMatchObject({ code: "NOT_FOUND" });
  	});
  });
  ```

- [ ] **Run the test — expect it to fail** (module does not exist yet):

  ```bash
  cd apps/secondary && bun test src/modules/academic-years/__tests__/academic-years.caller.test.ts
  ```

- [ ] **Create `academic-years.zod.ts`**:

  ```ts
  import { z } from "zod";

  export const createSchema = z.object({
  	name: z.string().min(1).max(50),
  	startDate: z.coerce.date(),
  	endDate: z.coerce.date(),
  	assessmentMode: z
  		.enum(["six_sequence", "composition"])
  		.optional()
  		.default("six_sequence"),
  });

  export const idSchema = z.object({
  	id: z.string().uuid(),
  });
  ```

- [ ] **Create `academic-years.repo.ts`**:

  ```ts
  import { and, eq } from "drizzle-orm";
  import { db } from "../../db";
  import { academicYears } from "../../db/schema";

  export async function findAll(institutionId: string) {
  	return db
  		.select()
  		.from(academicYears)
  		.where(eq(academicYears.institutionId, institutionId))
  		.orderBy(academicYears.startDate);
  }

  export async function findById(id: string, institutionId: string) {
  	const rows = await db
  		.select()
  		.from(academicYears)
  		.where(
  			and(
  				eq(academicYears.id, id),
  				eq(academicYears.institutionId, institutionId),
  			),
  		)
  		.limit(1);
  	return rows[0] ?? null;
  }

  export async function insert(data: typeof academicYears.$inferInsert) {
  	const [row] = await db.insert(academicYears).values(data).returning();
  	return row!;
  }

  export async function setStatus(
  	id: string,
  	institutionId: string,
  	status: "active" | "closed" | "archived",
  ) {
  	const [row] = await db
  		.update(academicYears)
  		.set({ status, updatedAt: new Date() })
  		.where(
  			and(
  				eq(academicYears.id, id),
  				eq(academicYears.institutionId, institutionId),
  			),
  		)
  		.returning();
  	return row ?? null;
  }
  ```

- [ ] **Create `academic-years.service.ts`**:

  ```ts
  import { notFound } from "../../lib/errors";
  import * as repo from "./academic-years.repo";

  export async function list(institutionId: string) {
  	return repo.findAll(institutionId);
  }

  export async function create(
  	data: { name: string; startDate: Date; endDate: Date; assessmentMode?: string },
  	institutionId: string,
  ) {
  	return repo.insert({
  		institutionId,
  		name: data.name,
  		startDate: data.startDate,
  		endDate: data.endDate,
  		assessmentMode: data.assessmentMode ?? "six_sequence",
  		status: "active",
  	});
  }

  export async function setActive(id: string, institutionId: string) {
  	const existing = await repo.findById(id, institutionId);
  	if (!existing) throw notFound("Academic year not found");
  	const updated = await repo.setStatus(id, institutionId, "active");
  	return updated!;
  }

  export async function close(id: string, institutionId: string) {
  	const existing = await repo.findById(id, institutionId);
  	if (!existing) throw notFound("Academic year not found");
  	const updated = await repo.setStatus(id, institutionId, "closed");
  	return updated!;
  }
  ```

- [ ] **Create `academic-years.router.ts`**:

  ```ts
  import {
  	adminProcedure,
  	router as trpcRouter,
  	tenantProcedure,
  } from "../../lib/trpc";
  import * as service from "./academic-years.service";
  import { createSchema, idSchema } from "./academic-years.zod";

  export const router = trpcRouter({
  	list: tenantProcedure.query(({ ctx }) =>
  		service.list(ctx.institution.id),
  	),

  	create: adminProcedure
  		.input(createSchema)
  		.mutation(({ ctx, input }) => service.create(input, ctx.institution.id)),

  	setActive: adminProcedure
  		.input(idSchema)
  		.mutation(({ ctx, input }) =>
  			service.setActive(input.id, ctx.institution.id),
  		),

  	close: adminProcedure
  		.input(idSchema)
  		.mutation(({ ctx, input }) =>
  			service.close(input.id, ctx.institution.id),
  		),
  });
  ```

- [ ] **Create `index.ts`**:

  ```ts
  export { router } from "./academic-years.router";
  ```

- [ ] **Temporarily wire the router** (to make the test compile) — open `src/routers/index.ts` and add a minimal academicYears entry (will be replaced wholesale in Task 6):

  ```ts
  import { publicProcedure, router } from "../lib/trpc";
  import { router as academicYearsRouter } from "../modules/academic-years";

  export const appRouter = router({
  	health: publicProcedure.query(() => ({ ok: true, service: "tkams-secondary" })),
  	academicYears: academicYearsRouter,
  });

  export type AppRouter = typeof appRouter;
  ```

- [ ] **Run the test — expect it to pass**:

  ```bash
  cd apps/secondary && bun test src/modules/academic-years/__tests__/academic-years.caller.test.ts
  ```

- [ ] **Run Biome**: `cd apps/secondary && bun check`

- [ ] **Suggested commit message**:
  ```
  feat(secondary): add academic-years tRPC module (list, create, setActive, close)
  ```

---

## Task 2: `terms` module

**Files:**
- Create: `src/modules/terms/terms.zod.ts`
- Create: `src/modules/terms/terms.repo.ts`
- Create: `src/modules/terms/terms.service.ts`
- Create: `src/modules/terms/terms.router.ts`
- Create: `src/modules/terms/index.ts`
- Create: `src/modules/terms/__tests__/terms.caller.test.ts`

**Interfaces:**
- Produces: `termsRouter` — `list`, `create`, `open`, `close`, `getActive`
- Consumes: `terms` table, `academicYears` table (FK ownership check), `tenantProcedure` + `adminProcedure`
- Note: The `terms` table uses `termNumber` (integer 1–3), NOT `name`/`code`/`orderIndex`

### Steps

- [ ] **Write the failing test first**

  `src/modules/terms/__tests__/terms.caller.test.ts`:

  ```ts
  import { beforeAll, describe, expect, it } from "bun:test";
  import { appRouter } from "../../../routers";
  import {
  	asAdmin,
  	asGuest,
  	setupTestInstitution,
  } from "../../../lib/test-utils";

  let academicYearId: string;

  beforeAll(async () => {
  	await setupTestInstitution();
  	const admin = appRouter.createCaller(asAdmin());
  	const year = await admin.academicYears.create({
  		name: "2025-2026-terms-test",
  		startDate: new Date("2025-09-01"),
  		endDate: new Date("2026-06-30"),
  	});
  	academicYearId = year.id;
  });

  describe("terms.list", () => {
  	it("rejects unauthenticated requests", async () => {
  		const caller = appRouter.createCaller(asGuest());
  		await expect(
  			caller.terms.list({ academicYearId: "00000000-0000-0000-0000-000000000000" }),
  		).rejects.toBeDefined();
  	});

  	it("returns empty array for a new year", async () => {
  		const caller = appRouter.createCaller(asAdmin());
  		const result = await caller.terms.list({ academicYearId });
  		expect(result).toEqual([]);
  	});
  });

  describe("terms.create", () => {
  	it("creates the three terms for a year", async () => {
  		const caller = appRouter.createCaller(asAdmin());

  		const t1 = await caller.terms.create({
  			academicYearId,
  			termNumber: 1,
  			startDate: new Date("2025-09-08"),
  			endDate: new Date("2025-11-28"),
  		});
  		expect(t1.termNumber).toBe(1);
  		expect(t1.status).toBe("open");

  		await caller.terms.create({
  			academicYearId,
  			termNumber: 2,
  			startDate: new Date("2026-01-05"),
  			endDate: new Date("2026-03-06"),
  		});

  		await caller.terms.create({
  			academicYearId,
  			termNumber: 3,
  			startDate: new Date("2026-03-09"),
  			endDate: new Date("2026-06-12"),
  		});

  		const list = await caller.terms.list({ academicYearId });
  		expect(list).toHaveLength(3);
  	});

  	it("rejects duplicate termNumber for same year", async () => {
  		const caller = appRouter.createCaller(asAdmin());
  		await expect(
  			caller.terms.create({
  				academicYearId,
  				termNumber: 1,
  				startDate: new Date("2025-09-08"),
  				endDate: new Date("2025-11-28"),
  			}),
  		).rejects.toMatchObject({ code: "CONFLICT" });
  	});
  });

  describe("terms.open + close", () => {
  	it("transitions term status", async () => {
  		const caller = appRouter.createCaller(asAdmin());
  		const list = await caller.terms.list({ academicYearId });
  		const term = list[0]!;

  		const closed = await caller.terms.close({ id: term.id });
  		expect(closed.status).toBe("closed");

  		const opened = await caller.terms.open({ id: term.id });
  		expect(opened.status).toBe("open");
  	});
  });

  describe("terms.getActive", () => {
  	it("returns the first open term for a year", async () => {
  		const caller = appRouter.createCaller(asAdmin());
  		const active = await caller.terms.getActive({ academicYearId });
  		expect(active?.status).toBe("open");
  	});
  });
  ```

- [ ] **Run the test — expect it to fail**:

  ```bash
  cd apps/secondary && bun test src/modules/terms/__tests__/terms.caller.test.ts
  ```

- [ ] **Create `terms.zod.ts`**:

  ```ts
  import { z } from "zod";

  export const listSchema = z.object({
  	academicYearId: z.string().uuid(),
  });

  export const createSchema = z.object({
  	academicYearId: z.string().uuid(),
  	termNumber: z.number().int().min(1).max(3),
  	startDate: z.coerce.date(),
  	endDate: z.coerce.date(),
  });

  export const idSchema = z.object({
  	id: z.string().uuid(),
  });

  export const getActiveSchema = z.object({
  	academicYearId: z.string().uuid(),
  });
  ```

- [ ] **Create `terms.repo.ts`**:

  ```ts
  import { and, asc, eq } from "drizzle-orm";
  import { db } from "../../db";
  import { terms } from "../../db/schema";

  export async function findByYear(
  	academicYearId: string,
  	institutionId: string,
  ) {
  	return db
  		.select()
  		.from(terms)
  		.where(
  			and(
  				eq(terms.academicYearId, academicYearId),
  				eq(terms.institutionId, institutionId),
  			),
  		)
  		.orderBy(asc(terms.termNumber));
  }

  export async function findById(id: string, institutionId: string) {
  	const rows = await db
  		.select()
  		.from(terms)
  		.where(and(eq(terms.id, id), eq(terms.institutionId, institutionId)))
  		.limit(1);
  	return rows[0] ?? null;
  }

  export async function findByYearAndNumber(
  	academicYearId: string,
  	termNumber: number,
  	institutionId: string,
  ) {
  	const rows = await db
  		.select()
  		.from(terms)
  		.where(
  			and(
  				eq(terms.academicYearId, academicYearId),
  				eq(terms.termNumber, termNumber),
  				eq(terms.institutionId, institutionId),
  			),
  		)
  		.limit(1);
  	return rows[0] ?? null;
  }

  export async function findActive(
  	academicYearId: string,
  	institutionId: string,
  ) {
  	const rows = await db
  		.select()
  		.from(terms)
  		.where(
  			and(
  				eq(terms.academicYearId, academicYearId),
  				eq(terms.institutionId, institutionId),
  				eq(terms.status, "open"),
  			),
  		)
  		.orderBy(asc(terms.termNumber))
  		.limit(1);
  	return rows[0] ?? null;
  }

  export async function insert(data: typeof terms.$inferInsert) {
  	const [row] = await db.insert(terms).values(data).returning();
  	return row!;
  }

  export async function setStatus(
  	id: string,
  	institutionId: string,
  	status: "open" | "closed" | "archived",
  ) {
  	const [row] = await db
  		.update(terms)
  		.set({ status, updatedAt: new Date() })
  		.where(and(eq(terms.id, id), eq(terms.institutionId, institutionId)))
  		.returning();
  	return row ?? null;
  }
  ```

- [ ] **Create `terms.service.ts`**:

  ```ts
  import { conflict, notFound } from "../../lib/errors";
  import * as repo from "./terms.repo";

  export async function list(academicYearId: string, institutionId: string) {
  	return repo.findByYear(academicYearId, institutionId);
  }

  export async function create(
  	data: {
  		academicYearId: string;
  		termNumber: number;
  		startDate: Date;
  		endDate: Date;
  	},
  	institutionId: string,
  ) {
  	const existing = await repo.findByYearAndNumber(
  		data.academicYearId,
  		data.termNumber,
  		institutionId,
  	);
  	if (existing) {
  		throw conflict(
  			`Term ${data.termNumber} already exists for this academic year`,
  		);
  	}
  	return repo.insert({
  		institutionId,
  		academicYearId: data.academicYearId,
  		termNumber: data.termNumber,
  		startDate: data.startDate,
  		endDate: data.endDate,
  		status: "open",
  	});
  }

  export async function open(id: string, institutionId: string) {
  	const existing = await repo.findById(id, institutionId);
  	if (!existing) throw notFound("Term not found");
  	const updated = await repo.setStatus(id, institutionId, "open");
  	return updated!;
  }

  export async function close(id: string, institutionId: string) {
  	const existing = await repo.findById(id, institutionId);
  	if (!existing) throw notFound("Term not found");
  	const updated = await repo.setStatus(id, institutionId, "closed");
  	return updated!;
  }

  export async function getActive(
  	academicYearId: string,
  	institutionId: string,
  ) {
  	return repo.findActive(academicYearId, institutionId);
  }
  ```

- [ ] **Create `terms.router.ts`**:

  ```ts
  import {
  	adminProcedure,
  	router as trpcRouter,
  	tenantProcedure,
  } from "../../lib/trpc";
  import * as service from "./terms.service";
  import {
  	createSchema,
  	getActiveSchema,
  	idSchema,
  	listSchema,
  } from "./terms.zod";

  export const router = trpcRouter({
  	list: tenantProcedure
  		.input(listSchema)
  		.query(({ ctx, input }) =>
  			service.list(input.academicYearId, ctx.institution.id),
  		),

  	create: adminProcedure
  		.input(createSchema)
  		.mutation(({ ctx, input }) => service.create(input, ctx.institution.id)),

  	open: adminProcedure
  		.input(idSchema)
  		.mutation(({ ctx, input }) =>
  			service.open(input.id, ctx.institution.id),
  		),

  	close: adminProcedure
  		.input(idSchema)
  		.mutation(({ ctx, input }) =>
  			service.close(input.id, ctx.institution.id),
  		),

  	getActive: tenantProcedure
  		.input(getActiveSchema)
  		.query(({ ctx, input }) =>
  			service.getActive(input.academicYearId, ctx.institution.id),
  		),
  });
  ```

- [ ] **Create `index.ts`**:

  ```ts
  export { router } from "./terms.router";
  ```

- [ ] **Add the `terms` router to `src/routers/index.ts`** (temporary, will be consolidated in Task 6):

  ```ts
  import { publicProcedure, router } from "../lib/trpc";
  import { router as academicYearsRouter } from "../modules/academic-years";
  import { router as termsRouter } from "../modules/terms";

  export const appRouter = router({
  	health: publicProcedure.query(() => ({ ok: true, service: "tkams-secondary" })),
  	academicYears: academicYearsRouter,
  	terms: termsRouter,
  });

  export type AppRouter = typeof appRouter;
  ```

- [ ] **Run the test — expect it to pass**:

  ```bash
  cd apps/secondary && bun test src/modules/terms/__tests__/terms.caller.test.ts
  ```

- [ ] **Run Biome**: `cd apps/secondary && bun check`

- [ ] **Suggested commit message**:
  ```
  feat(secondary): add terms tRPC module (list, create, open, close, getActive)
  ```

---

## Task 3: `subjects` module

**Files:**
- Create: `src/modules/subjects/subjects.zod.ts`
- Create: `src/modules/subjects/subjects.repo.ts`
- Create: `src/modules/subjects/subjects.service.ts`
- Create: `src/modules/subjects/subjects.router.ts`
- Create: `src/modules/subjects/index.ts`
- Create: `src/modules/subjects/__tests__/subjects.caller.test.ts`

**Interfaces:**
- Produces: `subjectsRouter` — `list`, `create`, `update`
- Consumes: `subjects` table, `tenantProcedure` + `adminProcedure`

### Steps

- [ ] **Write the failing test first**

  `src/modules/subjects/__tests__/subjects.caller.test.ts`:

  ```ts
  import { beforeAll, describe, expect, it } from "bun:test";
  import { appRouter } from "../../../routers";
  import { asAdmin, asGuest, setupTestInstitution } from "../../../lib/test-utils";

  beforeAll(async () => {
  	await setupTestInstitution();
  });

  describe("subjects.list", () => {
  	it("rejects unauthenticated requests", async () => {
  		const caller = appRouter.createCaller(asGuest());
  		await expect(caller.subjects.list()).rejects.toBeDefined();
  	});

  	it("returns an array for authenticated users", async () => {
  		const caller = appRouter.createCaller(asAdmin());
  		const result = await caller.subjects.list();
  		expect(Array.isArray(result)).toBe(true);
  	});
  });

  describe("subjects.create", () => {
  	it("creates a subject and returns it", async () => {
  		const caller = appRouter.createCaller(asAdmin());
  		const subject = await caller.subjects.create({
  			name: "Mathematics",
  			nameFr: "Mathématiques",
  			code: `MATH-${Date.now()}`,
  			minesecCode: "MTH",
  			subjectGroup: "sciences",
  		});
  		expect(subject.id).toBeString();
  		expect(subject.name).toBe("Mathematics");
  	});

  	it("rejects duplicate code within institution", async () => {
  		const caller = appRouter.createCaller(asAdmin());
  		const code = `PHYS-${Date.now()}`;
  		await caller.subjects.create({
  			name: "Physics",
  			nameFr: "Physique",
  			code,
  		});
  		await expect(
  			caller.subjects.create({ name: "Physics 2", nameFr: "Physique 2", code }),
  		).rejects.toMatchObject({ code: "CONFLICT" });
  	});
  });

  describe("subjects.update", () => {
  	it("updates allowed fields", async () => {
  		const caller = appRouter.createCaller(asAdmin());
  		const subject = await caller.subjects.create({
  			name: "English",
  			nameFr: "Anglais",
  			code: `ENG-${Date.now()}`,
  		});
  		const updated = await caller.subjects.update({
  			id: subject.id,
  			subjectGroup: "languages",
  		});
  		expect(updated.subjectGroup).toBe("languages");
  	});

  	it("throws NOT_FOUND for unknown id", async () => {
  		const caller = appRouter.createCaller(asAdmin());
  		await expect(
  			caller.subjects.update({
  				id: "00000000-0000-0000-0000-000000000000",
  				name: "X",
  			}),
  		).rejects.toMatchObject({ code: "NOT_FOUND" });
  	});
  });
  ```

- [ ] **Run the test — expect it to fail**:

  ```bash
  cd apps/secondary && bun test src/modules/subjects/__tests__/subjects.caller.test.ts
  ```

- [ ] **Create `subjects.zod.ts`**:

  ```ts
  import { z } from "zod";

  export const createSchema = z.object({
  	name: z.string().min(1).max(100),
  	nameFr: z.string().min(1).max(100).optional().default(""),
  	code: z.string().min(1).max(30),
  	minesecCode: z.string().max(30).optional(),
  	subjectGroup: z.string().max(50).optional(),
  });

  export const updateSchema = z.object({
  	id: z.string().uuid(),
  	name: z.string().min(1).max(100).optional(),
  	nameFr: z.string().min(1).max(100).optional(),
  	code: z.string().min(1).max(30).optional(),
  	minesecCode: z.string().max(30).optional(),
  	subjectGroup: z.string().max(50).optional(),
  });
  ```

- [ ] **Create `subjects.repo.ts`**:

  ```ts
  import { and, eq } from "drizzle-orm";
  import { db } from "../../db";
  import { subjects } from "../../db/schema";

  export async function findAll(institutionId: string) {
  	return db
  		.select()
  		.from(subjects)
  		.where(eq(subjects.institutionId, institutionId))
  		.orderBy(subjects.name);
  }

  export async function findById(id: string, institutionId: string) {
  	const rows = await db
  		.select()
  		.from(subjects)
  		.where(and(eq(subjects.id, id), eq(subjects.institutionId, institutionId)))
  		.limit(1);
  	return rows[0] ?? null;
  }

  export async function findByCode(code: string, institutionId: string) {
  	const rows = await db
  		.select()
  		.from(subjects)
  		.where(
  			and(eq(subjects.code, code), eq(subjects.institutionId, institutionId)),
  		)
  		.limit(1);
  	return rows[0] ?? null;
  }

  export async function insert(data: typeof subjects.$inferInsert) {
  	const [row] = await db.insert(subjects).values(data).returning();
  	return row!;
  }

  export async function update(
  	id: string,
  	institutionId: string,
  	data: Partial<typeof subjects.$inferInsert>,
  ) {
  	const [row] = await db
  		.update(subjects)
  		.set({ ...data, updatedAt: new Date() })
  		.where(and(eq(subjects.id, id), eq(subjects.institutionId, institutionId)))
  		.returning();
  	return row ?? null;
  }
  ```

- [ ] **Create `subjects.service.ts`**:

  ```ts
  import { conflict, notFound } from "../../lib/errors";
  import * as repo from "./subjects.repo";

  export async function list(institutionId: string) {
  	return repo.findAll(institutionId);
  }

  export async function create(
  	data: {
  		name: string;
  		nameFr?: string;
  		code: string;
  		minesecCode?: string;
  		subjectGroup?: string;
  	},
  	institutionId: string,
  ) {
  	const existing = await repo.findByCode(data.code, institutionId);
  	if (existing) {
  		throw conflict(`Subject code "${data.code}" already exists`);
  	}
  	return repo.insert({
  		institutionId,
  		name: data.name,
  		nameFr: data.nameFr ?? "",
  		code: data.code,
  		minesecCode: data.minesecCode,
  		subjectGroup: data.subjectGroup,
  	});
  }

  export async function updateSubject(
  	id: string,
  	institutionId: string,
  	data: {
  		name?: string;
  		nameFr?: string;
  		code?: string;
  		minesecCode?: string;
  		subjectGroup?: string;
  	},
  ) {
  	const existing = await repo.findById(id, institutionId);
  	if (!existing) throw notFound("Subject not found");

  	if (data.code && data.code !== existing.code) {
  		const duplicate = await repo.findByCode(data.code, institutionId);
  		if (duplicate) throw conflict(`Subject code "${data.code}" already taken`);
  	}

  	const updated = await repo.update(id, institutionId, data);
  	return updated!;
  }
  ```

- [ ] **Create `subjects.router.ts`**:

  ```ts
  import {
  	adminProcedure,
  	router as trpcRouter,
  	tenantProcedure,
  } from "../../lib/trpc";
  import * as service from "./subjects.service";
  import { createSchema, updateSchema } from "./subjects.zod";

  export const router = trpcRouter({
  	list: tenantProcedure.query(({ ctx }) =>
  		service.list(ctx.institution.id),
  	),

  	create: adminProcedure
  		.input(createSchema)
  		.mutation(({ ctx, input }) => service.create(input, ctx.institution.id)),

  	update: adminProcedure
  		.input(updateSchema)
  		.mutation(({ ctx, input }) => {
  			const { id, ...fields } = input;
  			return service.updateSubject(id, ctx.institution.id, fields);
  		}),
  });
  ```

- [ ] **Create `index.ts`**:

  ```ts
  export { router } from "./subjects.router";
  ```

- [ ] **Add the `subjects` router to `src/routers/index.ts`**:

  ```ts
  import { publicProcedure, router } from "../lib/trpc";
  import { router as academicYearsRouter } from "../modules/academic-years";
  import { router as subjectsRouter } from "../modules/subjects";
  import { router as termsRouter } from "../modules/terms";

  export const appRouter = router({
  	health: publicProcedure.query(() => ({ ok: true, service: "tkams-secondary" })),
  	academicYears: academicYearsRouter,
  	terms: termsRouter,
  	subjects: subjectsRouter,
  });

  export type AppRouter = typeof appRouter;
  ```

- [ ] **Run the test — expect it to pass**:

  ```bash
  cd apps/secondary && bun test src/modules/subjects/__tests__/subjects.caller.test.ts
  ```

- [ ] **Run Biome**: `cd apps/secondary && bun check`

- [ ] **Suggested commit message**:
  ```
  feat(secondary): add subjects tRPC module (list, create, update)
  ```

---

## Task 4: `tracks` module

**Files:**
- Create: `src/modules/tracks/tracks.zod.ts`
- Create: `src/modules/tracks/tracks.repo.ts`
- Create: `src/modules/tracks/tracks.service.ts`
- Create: `src/modules/tracks/tracks.router.ts`
- Create: `src/modules/tracks/index.ts`
- Create: `src/modules/tracks/__tests__/tracks.caller.test.ts`

**Interfaces:**
- Produces: `tracksRouter` — `list`, `create`, `upsertCoefficient`, `getCoefficientsGrid`
- Consumes: `tracks` + `trackSubjectCoefficients` + `subjects` tables
- Note: `trackSubjectCoefficients` has no `institutionId`. Institution scope is enforced by verifying `track.institutionId === ctx.institution.id` before any coefficient operation.

### Steps

- [ ] **Write the failing test first**

  `src/modules/tracks/__tests__/tracks.caller.test.ts`:

  ```ts
  import { beforeAll, describe, expect, it } from "bun:test";
  import { appRouter } from "../../../routers";
  import { asAdmin, asGuest, setupTestInstitution } from "../../../lib/test-utils";

  let trackId: string;
  let subjectId: string;

  beforeAll(async () => {
  	await setupTestInstitution();
  	const admin = appRouter.createCaller(asAdmin());

  	// Create a subject to use in coefficient tests
  	const subject = await admin.subjects.create({
  		name: "French",
  		nameFr: "Français",
  		code: `FR-${Date.now()}`,
  	});
  	subjectId = subject.id;
  });

  describe("tracks.list", () => {
  	it("rejects unauthenticated requests", async () => {
  		const caller = appRouter.createCaller(asGuest());
  		await expect(caller.tracks.list()).rejects.toBeDefined();
  	});

  	it("returns an array for authenticated users", async () => {
  		const caller = appRouter.createCaller(asAdmin());
  		const result = await caller.tracks.list();
  		expect(Array.isArray(result)).toBe(true);
  	});
  });

  describe("tracks.create", () => {
  	it("creates a track and returns it", async () => {
  		const caller = appRouter.createCaller(asAdmin());
  		const track = await caller.tracks.create({
  			name: "Sciences Series C",
  			code: `C-${Date.now()}`,
  			cycleLevel: "second_cycle",
  		});
  		expect(track.id).toBeString();
  		expect(track.cycleLevel).toBe("second_cycle");
  		expect(track.isOfficial).toBe(false);
  		trackId = track.id;
  	});

  	it("rejects duplicate code within institution", async () => {
  		const caller = appRouter.createCaller(asAdmin());
  		const code = `A4-${Date.now()}`;
  		await caller.tracks.create({ name: "Arts A4", code, cycleLevel: "second_cycle" });
  		await expect(
  			caller.tracks.create({ name: "Arts A4 dupe", code, cycleLevel: "second_cycle" }),
  		).rejects.toMatchObject({ code: "CONFLICT" });
  	});
  });

  describe("tracks.upsertCoefficient", () => {
  	it("creates and updates a coefficient", async () => {
  		const caller = appRouter.createCaller(asAdmin());

  		const first = await caller.tracks.upsertCoefficient({
  			trackId,
  			subjectId,
  			coefficient: 4,
  			isOfficialExamSubject: false,
  		});
  		expect(first.coefficient).toBe(4);

  		const updated = await caller.tracks.upsertCoefficient({
  			trackId,
  			subjectId,
  			coefficient: 6,
  			isOfficialExamSubject: true,
  		});
  		expect(updated.coefficient).toBe(6);
  		expect(updated.isOfficialExamSubject).toBe(true);
  	});

  	it("rejects coefficient for a track not in institution", async () => {
  		const caller = appRouter.createCaller(asAdmin());
  		await expect(
  			caller.tracks.upsertCoefficient({
  				trackId: "00000000-0000-0000-0000-000000000000",
  				subjectId,
  				coefficient: 3,
  			}),
  		).rejects.toMatchObject({ code: "NOT_FOUND" });
  	});
  });

  describe("tracks.getCoefficientsGrid", () => {
  	it("returns all coefficients for a track with subject info", async () => {
  		const caller = appRouter.createCaller(asAdmin());
  		const grid = await caller.tracks.getCoefficientsGrid({ trackId });
  		expect(Array.isArray(grid)).toBe(true);
  		expect(grid.length).toBeGreaterThan(0);
  		expect(grid[0]).toHaveProperty("subject");
  		expect(grid[0]).toHaveProperty("coefficient");
  	});
  });
  ```

- [ ] **Run the test — expect it to fail**:

  ```bash
  cd apps/secondary && bun test src/modules/tracks/__tests__/tracks.caller.test.ts
  ```

- [ ] **Create `tracks.zod.ts`**:

  ```ts
  import { z } from "zod";

  export const createSchema = z.object({
  	name: z.string().min(1).max(100),
  	code: z.string().min(1).max(20),
  	cycleLevel: z.enum(["first_cycle", "second_cycle", "technical"]),
  	isOfficial: z.boolean().optional().default(false),
  });

  export const upsertCoefficientSchema = z.object({
  	trackId: z.string().uuid(),
  	subjectId: z.string().uuid(),
  	coefficient: z.number().int().min(0).max(20),
  	isOfficialExamSubject: z.boolean().optional().default(false),
  });

  export const getGridSchema = z.object({
  	trackId: z.string().uuid(),
  });
  ```

- [ ] **Create `tracks.repo.ts`**:

  ```ts
  import { and, eq } from "drizzle-orm";
  import { db } from "../../db";
  import { subjects, trackSubjectCoefficients, tracks } from "../../db/schema";

  export async function findAll(institutionId: string) {
  	return db
  		.select()
  		.from(tracks)
  		.where(eq(tracks.institutionId, institutionId))
  		.orderBy(tracks.code);
  }

  export async function findById(id: string, institutionId: string) {
  	const rows = await db
  		.select()
  		.from(tracks)
  		.where(and(eq(tracks.id, id), eq(tracks.institutionId, institutionId)))
  		.limit(1);
  	return rows[0] ?? null;
  }

  export async function findByCode(code: string, institutionId: string) {
  	const rows = await db
  		.select()
  		.from(tracks)
  		.where(and(eq(tracks.code, code), eq(tracks.institutionId, institutionId)))
  		.limit(1);
  	return rows[0] ?? null;
  }

  export async function insert(data: typeof tracks.$inferInsert) {
  	const [row] = await db.insert(tracks).values(data).returning();
  	return row!;
  }

  export async function upsertCoefficient(data: {
  	trackId: string;
  	subjectId: string;
  	coefficient: number;
  	isOfficialExamSubject: boolean;
  }) {
  	const [row] = await db
  		.insert(trackSubjectCoefficients)
  		.values({
  			trackId: data.trackId,
  			subjectId: data.subjectId,
  			coefficient: data.coefficient,
  			isOfficialExamSubject: data.isOfficialExamSubject,
  		})
  		.onConflictDoUpdate({
  			target: [
  				trackSubjectCoefficients.trackId,
  				trackSubjectCoefficients.subjectId,
  			],
  			set: {
  				coefficient: data.coefficient,
  				isOfficialExamSubject: data.isOfficialExamSubject,
  				updatedAt: new Date(),
  			},
  		})
  		.returning();
  	return row!;
  }

  export async function getCoefficientsGrid(trackId: string) {
  	return db
  		.select({
  			id: trackSubjectCoefficients.id,
  			trackId: trackSubjectCoefficients.trackId,
  			coefficient: trackSubjectCoefficients.coefficient,
  			isOfficialExamSubject: trackSubjectCoefficients.isOfficialExamSubject,
  			createdAt: trackSubjectCoefficients.createdAt,
  			subject: {
  				id: subjects.id,
  				name: subjects.name,
  				nameFr: subjects.nameFr,
  				code: subjects.code,
  				subjectGroup: subjects.subjectGroup,
  			},
  		})
  		.from(trackSubjectCoefficients)
  		.innerJoin(subjects, eq(trackSubjectCoefficients.subjectId, subjects.id))
  		.where(eq(trackSubjectCoefficients.trackId, trackId))
  		.orderBy(subjects.name);
  }
  ```

- [ ] **Create `tracks.service.ts`**:

  ```ts
  import { conflict, notFound } from "../../lib/errors";
  import * as repo from "./tracks.repo";

  export async function list(institutionId: string) {
  	return repo.findAll(institutionId);
  }

  export async function create(
  	data: {
  		name: string;
  		code: string;
  		cycleLevel: "first_cycle" | "second_cycle" | "technical";
  		isOfficial?: boolean;
  	},
  	institutionId: string,
  ) {
  	const existing = await repo.findByCode(data.code, institutionId);
  	if (existing) throw conflict(`Track code "${data.code}" already exists`);
  	return repo.insert({
  		institutionId,
  		name: data.name,
  		code: data.code,
  		cycleLevel: data.cycleLevel,
  		isOfficial: data.isOfficial ?? false,
  	});
  }

  export async function upsertCoefficient(
  	data: {
  		trackId: string;
  		subjectId: string;
  		coefficient: number;
  		isOfficialExamSubject?: boolean;
  	},
  	institutionId: string,
  ) {
  	// Verify track belongs to institution
  	const track = await repo.findById(data.trackId, institutionId);
  	if (!track) throw notFound("Track not found in this institution");

  	return repo.upsertCoefficient({
  		trackId: data.trackId,
  		subjectId: data.subjectId,
  		coefficient: data.coefficient,
  		isOfficialExamSubject: data.isOfficialExamSubject ?? false,
  	});
  }

  export async function getCoefficientsGrid(
  	trackId: string,
  	institutionId: string,
  ) {
  	// Verify track belongs to institution
  	const track = await repo.findById(trackId, institutionId);
  	if (!track) throw notFound("Track not found in this institution");
  	return repo.getCoefficientsGrid(trackId);
  }
  ```

- [ ] **Create `tracks.router.ts`**:

  ```ts
  import {
  	adminProcedure,
  	router as trpcRouter,
  	tenantProcedure,
  } from "../../lib/trpc";
  import * as service from "./tracks.service";
  import {
  	createSchema,
  	getGridSchema,
  	upsertCoefficientSchema,
  } from "./tracks.zod";

  export const router = trpcRouter({
  	list: tenantProcedure.query(({ ctx }) =>
  		service.list(ctx.institution.id),
  	),

  	create: adminProcedure
  		.input(createSchema)
  		.mutation(({ ctx, input }) => service.create(input, ctx.institution.id)),

  	upsertCoefficient: adminProcedure
  		.input(upsertCoefficientSchema)
  		.mutation(({ ctx, input }) =>
  			service.upsertCoefficient(input, ctx.institution.id),
  		),

  	getCoefficientsGrid: tenantProcedure
  		.input(getGridSchema)
  		.query(({ ctx, input }) =>
  			service.getCoefficientsGrid(input.trackId, ctx.institution.id),
  		),
  });
  ```

- [ ] **Create `index.ts`**:

  ```ts
  export { router } from "./tracks.router";
  ```

- [ ] **Add the `tracks` router to `src/routers/index.ts`**:

  ```ts
  import { publicProcedure, router } from "../lib/trpc";
  import { router as academicYearsRouter } from "../modules/academic-years";
  import { router as subjectsRouter } from "../modules/subjects";
  import { router as termsRouter } from "../modules/terms";
  import { router as tracksRouter } from "../modules/tracks";

  export const appRouter = router({
  	health: publicProcedure.query(() => ({ ok: true, service: "tkams-secondary" })),
  	academicYears: academicYearsRouter,
  	terms: termsRouter,
  	subjects: subjectsRouter,
  	tracks: tracksRouter,
  });

  export type AppRouter = typeof appRouter;
  ```

- [ ] **Run the test — expect it to pass**:

  ```bash
  cd apps/secondary && bun test src/modules/tracks/__tests__/tracks.caller.test.ts
  ```

- [ ] **Run Biome**: `cd apps/secondary && bun check`

- [ ] **Suggested commit message**:
  ```
  feat(secondary): add tracks tRPC module (list, create, upsertCoefficient, getCoefficientsGrid)
  ```

---

## Task 5: `classes` module

**Files:**
- Create: `src/modules/classes/classes.zod.ts`
- Create: `src/modules/classes/classes.repo.ts`
- Create: `src/modules/classes/classes.service.ts`
- Create: `src/modules/classes/classes.router.ts`
- Create: `src/modules/classes/index.ts`
- Create: `src/modules/classes/__tests__/classes.caller.test.ts`

**Interfaces:**
- Produces: `classesRouter` — `list`, `create`, `get`, `getRoster`
- Consumes: `classes` + `enrollments` + `students` tables, `tenantProcedure` + `adminProcedure`
- Note: `classes.level` is a plain `varchar` string ("6e", "5e", "4e", "3e", "2nde", "1re", "Tle"); there is no separate `levels` table in apps/secondary

### Steps

- [ ] **Write the failing test first**

  `src/modules/classes/__tests__/classes.caller.test.ts`:

  ```ts
  import { beforeAll, describe, expect, it } from "bun:test";
  import { appRouter } from "../../../routers";
  import { asAdmin, asGuest, setupTestInstitution } from "../../../lib/test-utils";

  let academicYearId: string;
  let trackId: string;
  let classId: string;

  beforeAll(async () => {
  	await setupTestInstitution();
  	const admin = appRouter.createCaller(asAdmin());

  	const year = await admin.academicYears.create({
  		name: `classes-test-${Date.now()}`,
  		startDate: new Date("2025-09-01"),
  		endDate: new Date("2026-06-30"),
  	});
  	academicYearId = year.id;

  	const track = await admin.tracks.create({
  		name: "Sciences D",
  		code: `D-${Date.now()}`,
  		cycleLevel: "second_cycle",
  	});
  	trackId = track.id;
  });

  describe("classes.list", () => {
  	it("rejects unauthenticated requests", async () => {
  		const caller = appRouter.createCaller(asGuest());
  		await expect(
  			caller.classes.list({
  				academicYearId: "00000000-0000-0000-0000-000000000000",
  			}),
  		).rejects.toBeDefined();
  	});

  	it("returns empty array for a new year", async () => {
  		const caller = appRouter.createCaller(asAdmin());
  		const result = await caller.classes.list({ academicYearId });
  		expect(result).toEqual([]);
  	});
  });

  describe("classes.create", () => {
  	it("creates a class and returns it", async () => {
  		const caller = appRouter.createCaller(asAdmin());
  		const cls = await caller.classes.create({
  			name: "Terminale D",
  			code: `TLE-D-${Date.now()}`,
  			level: "Tle",
  			academicYearId,
  			trackId,
  		});
  		expect(cls.id).toBeString();
  		expect(cls.level).toBe("Tle");
  		expect(cls.trackId).toBe(trackId);
  		classId = cls.id;
  	});

  	it("rejects duplicate code within academic year", async () => {
  		const caller = appRouter.createCaller(asAdmin());
  		const code = `DUPE-${Date.now()}`;
  		await caller.classes.create({
  			name: "Class A",
  			code,
  			level: "3e",
  			academicYearId,
  		});
  		await expect(
  			caller.classes.create({ name: "Class B", code, level: "3e", academicYearId }),
  		).rejects.toMatchObject({ code: "CONFLICT" });
  	});
  });

  describe("classes.get", () => {
  	it("returns the class by id", async () => {
  		const caller = appRouter.createCaller(asAdmin());
  		const cls = await caller.classes.get({ id: classId });
  		expect(cls.id).toBe(classId);
  	});

  	it("throws NOT_FOUND for unknown id", async () => {
  		const caller = appRouter.createCaller(asAdmin());
  		await expect(
  			caller.classes.get({ id: "00000000-0000-0000-0000-000000000000" }),
  		).rejects.toMatchObject({ code: "NOT_FOUND" });
  	});
  });

  describe("classes.getRoster", () => {
  	it("returns empty roster for a new class", async () => {
  		const caller = appRouter.createCaller(asAdmin());
  		const roster = await caller.classes.getRoster({ classId });
  		expect(Array.isArray(roster)).toBe(true);
  		expect(roster).toHaveLength(0);
  	});
  });
  ```

- [ ] **Run the test — expect it to fail**:

  ```bash
  cd apps/secondary && bun test src/modules/classes/__tests__/classes.caller.test.ts
  ```

- [ ] **Create `classes.zod.ts`**:

  ```ts
  import { z } from "zod";

  const LEVELS = ["6e", "5e", "4e", "3e", "2nde", "1re", "Tle"] as const;

  export const listSchema = z.object({
  	academicYearId: z.string().uuid(),
  });

  export const createSchema = z.object({
  	name: z.string().min(1).max(50),
  	code: z.string().min(1).max(20),
  	level: z.string().min(1).max(30),
  	academicYearId: z.string().uuid(),
  	trackId: z.string().uuid().optional(),
  	classMasterId: z.string().uuid().optional(),
  	room: z.string().max(50).optional(),
  	maxCapacity: z.number().int().positive().optional(),
  });

  export const idSchema = z.object({
  	id: z.string().uuid(),
  });

  export const rosterSchema = z.object({
  	classId: z.string().uuid(),
  });
  ```

- [ ] **Create `classes.repo.ts`**:

  ```ts
  import { and, eq } from "drizzle-orm";
  import { db } from "../../db";
  import { classes, enrollments, students } from "../../db/schema";

  export async function findByYear(
  	academicYearId: string,
  	institutionId: string,
  ) {
  	return db
  		.select()
  		.from(classes)
  		.where(
  			and(
  				eq(classes.academicYearId, academicYearId),
  				eq(classes.institutionId, institutionId),
  			),
  		)
  		.orderBy(classes.name);
  }

  export async function findById(id: string, institutionId: string) {
  	const rows = await db
  		.select()
  		.from(classes)
  		.where(and(eq(classes.id, id), eq(classes.institutionId, institutionId)))
  		.limit(1);
  	return rows[0] ?? null;
  }

  export async function findByCode(
  	code: string,
  	academicYearId: string,
  	institutionId: string,
  ) {
  	const rows = await db
  		.select()
  		.from(classes)
  		.where(
  			and(
  				eq(classes.code, code),
  				eq(classes.academicYearId, academicYearId),
  				eq(classes.institutionId, institutionId),
  			),
  		)
  		.limit(1);
  	return rows[0] ?? null;
  }

  export async function insert(data: typeof classes.$inferInsert) {
  	const [row] = await db.insert(classes).values(data).returning();
  	return row!;
  }

  export async function getRoster(classId: string, institutionId: string) {
  	return db
  		.select({
  			enrollment: {
  				id: enrollments.id,
  				studentId: enrollments.studentId,
  				admissionType: enrollments.admissionType,
  				status: enrollments.status,
  				createdAt: enrollments.createdAt,
  			},
  			student: {
  				id: students.id,
  				firstName: students.firstName,
  				lastName: students.lastName,
  				gender: students.gender,
  				mnu: students.mnu,
  				registrationNumber: students.registrationNumber,
  				dateOfBirth: students.dateOfBirth,
  			},
  		})
  		.from(enrollments)
  		.innerJoin(students, eq(enrollments.studentId, students.id))
  		.where(
  			and(
  				eq(enrollments.classId, classId),
  				eq(enrollments.institutionId, institutionId),
  				eq(enrollments.status, "active"),
  			),
  		)
  		.orderBy(students.lastName, students.firstName);
  }
  ```

- [ ] **Create `classes.service.ts`**:

  ```ts
  import { conflict, notFound } from "../../lib/errors";
  import * as repo from "./classes.repo";

  export async function list(academicYearId: string, institutionId: string) {
  	return repo.findByYear(academicYearId, institutionId);
  }

  export async function create(
  	data: {
  		name: string;
  		code: string;
  		level: string;
  		academicYearId: string;
  		trackId?: string;
  		classMasterId?: string;
  		room?: string;
  		maxCapacity?: number;
  	},
  	institutionId: string,
  ) {
  	const existing = await repo.findByCode(
  		data.code,
  		data.academicYearId,
  		institutionId,
  	);
  	if (existing) {
  		throw conflict(
  			`Class code "${data.code}" already exists in this academic year`,
  		);
  	}
  	return repo.insert({
  		institutionId,
  		academicYearId: data.academicYearId,
  		trackId: data.trackId,
  		classMasterId: data.classMasterId,
  		name: data.name,
  		code: data.code,
  		level: data.level,
  		room: data.room,
  		maxCapacity: data.maxCapacity,
  	});
  }

  export async function get(id: string, institutionId: string) {
  	const cls = await repo.findById(id, institutionId);
  	if (!cls) throw notFound("Class not found");
  	return cls;
  }

  export async function getRoster(classId: string, institutionId: string) {
  	// Verify class belongs to institution
  	const cls = await repo.findById(classId, institutionId);
  	if (!cls) throw notFound("Class not found");
  	return repo.getRoster(classId, institutionId);
  }
  ```

- [ ] **Create `classes.router.ts`**:

  ```ts
  import {
  	adminProcedure,
  	router as trpcRouter,
  	tenantProcedure,
  } from "../../lib/trpc";
  import * as service from "./classes.service";
  import { createSchema, idSchema, listSchema, rosterSchema } from "./classes.zod";

  export const router = trpcRouter({
  	list: tenantProcedure
  		.input(listSchema)
  		.query(({ ctx, input }) =>
  			service.list(input.academicYearId, ctx.institution.id),
  		),

  	create: adminProcedure
  		.input(createSchema)
  		.mutation(({ ctx, input }) => service.create(input, ctx.institution.id)),

  	get: tenantProcedure
  		.input(idSchema)
  		.query(({ ctx, input }) => service.get(input.id, ctx.institution.id)),

  	getRoster: tenantProcedure
  		.input(rosterSchema)
  		.query(({ ctx, input }) =>
  			service.getRoster(input.classId, ctx.institution.id),
  		),
  });
  ```

- [ ] **Create `index.ts`**:

  ```ts
  export { router } from "./classes.router";
  ```

- [ ] **Add the `classes` router to `src/routers/index.ts`** (temporary, replaced in Task 6):

  ```ts
  import { publicProcedure, router } from "../lib/trpc";
  import { router as academicYearsRouter } from "../modules/academic-years";
  import { router as classesRouter } from "../modules/classes";
  import { router as subjectsRouter } from "../modules/subjects";
  import { router as termsRouter } from "../modules/terms";
  import { router as tracksRouter } from "../modules/tracks";

  export const appRouter = router({
  	health: publicProcedure.query(() => ({ ok: true, service: "tkams-secondary" })),
  	academicYears: academicYearsRouter,
  	terms: termsRouter,
  	subjects: subjectsRouter,
  	tracks: tracksRouter,
  	classes: classesRouter,
  });

  export type AppRouter = typeof appRouter;
  ```

- [ ] **Run the test — expect it to pass**:

  ```bash
  cd apps/secondary && bun test src/modules/classes/__tests__/classes.caller.test.ts
  ```

- [ ] **Run Biome**: `cd apps/secondary && bun check`

- [ ] **Suggested commit message**:
  ```
  feat(secondary): add classes tRPC module (list, create, get, getRoster)
  ```

---

## Task 6: Wire all routers + full test run

**Files:**
- Modify: `src/routers/index.ts` — final state with all 5 routers

**Interfaces:**
- Produces: fully assembled `appRouter` with `health`, `academicYears`, `terms`, `subjects`, `tracks`, `classes`
- Consumes: all 5 module routers

### Steps

- [ ] **Replace `src/routers/index.ts` with the final wiring**:

  ```ts
  import { publicProcedure, router } from "../lib/trpc";
  import { router as academicYearsRouter } from "../modules/academic-years";
  import { router as classesRouter } from "../modules/classes";
  import { router as subjectsRouter } from "../modules/subjects";
  import { router as termsRouter } from "../modules/terms";
  import { router as tracksRouter } from "../modules/tracks";

  export const appRouter = router({
  	health: publicProcedure.query(() => ({
  		ok: true,
  		service: "tkams-secondary",
  	})),
  	academicYears: academicYearsRouter,
  	terms: termsRouter,
  	subjects: subjectsRouter,
  	tracks: tracksRouter,
  	classes: classesRouter,
  });

  export type AppRouter = typeof appRouter;
  ```

- [ ] **Run the full test suite for all five modules**:

  ```bash
  cd apps/secondary && bun test src/modules/academic-years/__tests__/academic-years.caller.test.ts src/modules/terms/__tests__/terms.caller.test.ts src/modules/subjects/__tests__/subjects.caller.test.ts src/modules/tracks/__tests__/tracks.caller.test.ts src/modules/classes/__tests__/classes.caller.test.ts
  ```

  All tests should pass. Fix any regressions before committing.

- [ ] **Run type-checking**:

  ```bash
  cd apps/secondary && bun check-types
  ```

- [ ] **Run Biome one final time**:

  ```bash
  cd apps/secondary && bun check
  ```

- [ ] **Verify the health check still works** (optional manual smoke test):

  ```bash
  cd apps/secondary && bun dev:server &
  curl http://localhost:3001/trpc/health
  # Expected: {"result":{"data":{"ok":true,"service":"tkams-secondary"}}}
  ```

- [ ] **Suggested commit message**:
  ```
  feat(secondary): wire all catalog routers into appRouter (academic-years, terms, subjects, tracks, classes)
  ```

---

## Appendix: File Map

```
apps/secondary/src/
├── lib/
│   ├── errors.ts                          ← NEW (Task 0)
│   ├── test-utils.ts                      ← NEW (Task 0)
│   └── trpc.ts                            ← MODIFIED: add tenantProcedure (Task 0)
├── modules/
│   ├── academic-years/                    ← NEW (Task 1)
│   │   ├── __tests__/
│   │   │   └── academic-years.caller.test.ts
│   │   ├── academic-years.zod.ts
│   │   ├── academic-years.repo.ts
│   │   ├── academic-years.service.ts
│   │   ├── academic-years.router.ts
│   │   └── index.ts
│   ├── terms/                             ← NEW (Task 2)
│   │   ├── __tests__/
│   │   │   └── terms.caller.test.ts
│   │   ├── terms.zod.ts
│   │   ├── terms.repo.ts
│   │   ├── terms.service.ts
│   │   ├── terms.router.ts
│   │   └── index.ts
│   ├── subjects/                          ← NEW (Task 3)
│   │   ├── __tests__/
│   │   │   └── subjects.caller.test.ts
│   │   ├── subjects.zod.ts
│   │   ├── subjects.repo.ts
│   │   ├── subjects.service.ts
│   │   ├── subjects.router.ts
│   │   └── index.ts
│   ├── tracks/                            ← NEW (Task 4)
│   │   ├── __tests__/
│   │   │   └── tracks.caller.test.ts
│   │   ├── tracks.zod.ts
│   │   ├── tracks.repo.ts
│   │   ├── tracks.service.ts
│   │   ├── tracks.router.ts
│   │   └── index.ts
│   └── classes/                           ← NEW (Task 5)
│       ├── __tests__/
│       │   └── classes.caller.test.ts
│       ├── classes.zod.ts
│       ├── classes.repo.ts
│       ├── classes.service.ts
│       ├── classes.router.ts
│       └── index.ts
└── routers/
    └── index.ts                           ← MODIFIED (each task, finalised in Task 6)
```
