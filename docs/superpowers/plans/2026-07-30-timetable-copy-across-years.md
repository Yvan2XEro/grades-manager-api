# Timetable Copy Across Academic Years — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow administrators to copy timetable sessions from one academic year to another — as an optional step of the existing `academicYear.setup` batch job, and as a standalone `timetable.copyFromYear` batch job triggered from the timetable management page.

**Architecture:** A shared function `copySessionsAcrossYears()` is added to `timetable.service.ts`. Both the extended `academicYear.setup` job (new step 2, opt-in) and the new `timetable.copyFromYear` batch job call it, each constructing their own `classMapping` (sourceClassId → targetClassId). The frontend gains a checkbox in `AcademicYearSetupDialog` and a new `CopyTimetableDialog` component reachable from `TimetableManagement`.

**Tech Stack:** Drizzle ORM, tRPC adminProcedure, Bun test, React 18, shadcn/ui (Dialog, Checkbox, Button, Label), react-hook-form, i18next

## Global Constraints

- No DB migration — only existing tables (`course_sessions`, `classes`, `class_courses`, `academic_years`) are used
- All data access must be scoped to `institutionId`
- Idempotent copy: same `classCourseId + dayOfWeek + startTime + academicYearId` → skip (not error)
- Non-matching sessions → `notMatched++`, job continues (never blocks)
- Never copy `id`, `createdAt`, `updatedAt` — DB generates fresh values
- Batch job pattern: `preview()` → `executeStep()` → optional `rollback()` in `apps/server/src/modules/batch-jobs/job-types/`
- i18n keys added to both `apps/web/src/i18n/locales/fr/translation.json` and `apps/web/src/i18n/locales/en/translation.json`
- Run `bun check` and `bun check-types` (from workspace root) before marking any task complete
- **Test execution:** Per project convention, do NOT run tests per task during SDD. Write test code alongside implementation. Run the full suite once at the very end: `cd apps/server && bun test`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `apps/server/src/modules/timetable/timetable.service.ts` | Modify | Add `copySessionsAcrossYears()` + `CopySessionsResult` type |
| `apps/server/src/modules/timetable/__tests__/timetable.caller.test.ts` | Modify | Tests for `copySessionsAcrossYears()` + `timetable.copyFromYear` router |
| `apps/server/src/modules/batch-jobs/job-types/timetable-copy.ts` | Create | `timetable.copyFromYear` batch job definition |
| `apps/server/src/modules/batch-jobs/job-types/index.ts` | Modify | Register `timetableCopyJob` |
| `apps/server/src/modules/batch-jobs/job-types/academic-year-setup.ts` | Modify | Add optional step 2 for timetable copy + extend rollback |
| `apps/web/src/i18n/locales/fr/translation.json` | Modify | Add timetable copy i18n keys (FR) |
| `apps/web/src/i18n/locales/en/translation.json` | Modify | Add timetable copy i18n keys (EN) |
| `apps/web/src/pages/admin/AcademicYearSetupDialog.tsx` | Modify | Add `includeTimetable` checkbox + session count in preview |
| `apps/web/src/pages/admin/timetable/CopyTimetableDialog.tsx` | Create | Standalone copy dialog (source year selection → preview → run) |
| `apps/web/src/pages/admin/TimetableManagement.tsx` | Modify | Add "Copier depuis une autre année" button + render `CopyTimetableDialog` |

---

## Task 1: Backend — `copySessionsAcrossYears()` shared function + tests

**Files:**
- Modify: `apps/server/src/modules/timetable/timetable.service.ts` (append at end)
- Modify: `apps/server/src/modules/timetable/__tests__/timetable.caller.test.ts` (new describe block)

**Interfaces:**
- Produces: `copySessionsAcrossYears(sourceYearId, targetYearId, institutionId, classMapping)` → `Promise<CopySessionsResult>`
- Produces type: `CopySessionsResult = { copied: number; skipped: number; notMatched: number }`

- [ ] **Step 1: Append the type and function to `timetable.service.ts`**

The file already imports `and`, `eq` from drizzle-orm and `db`, `schema`. Append after the last line (currently line 835):

```ts
export type CopySessionsResult = {
	copied: number;
	skipped: number;
	notMatched: number;
};

/**
 * Copies all timetable sessions from sourceYearId to targetYearId.
 * classMapping maps source class IDs to target class IDs.
 * Sessions with no matching classCourse in the target year are counted in notMatched.
 * Sessions already present in the target (same classCourseId+dayOfWeek+startTime) are skipped.
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
		if (!sourceClassId) {
			result.notMatched++;
			continue;
		}

		const targetClassId = classMapping[sourceClassId];
		if (!targetClassId) {
			result.notMatched++;
			continue;
		}

		const targetCC = await db.query.classCourses.findFirst({
			where: and(
				eq(schema.classCourses.class, targetClassId),
				eq(schema.classCourses.code, session.classCourse.code),
				eq(schema.classCourses.institutionId, institutionId),
			),
		});
		if (!targetCC) {
			result.notMatched++;
			continue;
		}

		const existing = await db.query.courseSessions.findFirst({
			where: and(
				eq(schema.courseSessions.classCourseId, targetCC.id),
				eq(schema.courseSessions.dayOfWeek, session.dayOfWeek),
				eq(schema.courseSessions.startTime, session.startTime),
				eq(schema.courseSessions.academicYearId, targetYearId),
			),
		});
		if (existing) {
			result.skipped++;
			continue;
		}

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

- [ ] **Step 2: Add tests in `timetable.caller.test.ts`**

Add these imports at the top of the file alongside existing ones (they are already imported — just verify they are present):
- `createAcademicYear`, `createClass`, `createClassCourse` from `"../../../lib/test-utils"`
- `db` from `"@/db"`, `schema` from `"@/db/schema/app-schema"`, `and`, `eq` from `"drizzle-orm"`

Add a new top-level `describe` block at the end of the file:

```ts
describe("copySessionsAcrossYears", () => {
	it("copies sessions from source year to target year via class mapping", async () => {
		const { copySessionsAcrossYears } = await import("../timetable.service");
		const institutionId = getTestInstitution().id;

		const sourceYear = await createAcademicYear({ institutionId });
		const targetYear = await createAcademicYear({ institutionId });

		const sourceClass = await createClass({
			academicYear: sourceYear.id,
			code: `CL-COPY-${randomUUID().slice(0, 4)}`,
			institutionId,
		});
		const sourceCC = await createClassCourse({
			class: sourceClass.id,
			code: `CC-COPY-${randomUUID().slice(0, 4)}`,
			institutionId,
		});

		await db.insert(schema.courseSessions).values({
			institutionId,
			classCourseId: sourceCC.id,
			academicYearId: sourceYear.id,
			dayOfWeek: "mon",
			startTime: "08:00",
			endTime: "10:00",
			room: "A101",
		});

		// Target class has same code, target classCourse has same code
		const targetClass = await createClass({
			academicYear: targetYear.id,
			code: sourceClass.code,
			institutionId,
		});
		const targetCC = await createClassCourse({
			class: targetClass.id,
			code: sourceCC.code,
			institutionId,
		});

		const classMapping: Record<string, string> = {
			[sourceClass.id]: targetClass.id,
		};
		const result = await copySessionsAcrossYears(
			sourceYear.id,
			targetYear.id,
			institutionId,
			classMapping,
		);

		expect(result.copied).toBe(1);
		expect(result.skipped).toBe(0);
		expect(result.notMatched).toBe(0);

		const copied = await db.query.courseSessions.findFirst({
			where: and(
				eq(schema.courseSessions.classCourseId, targetCC.id),
				eq(schema.courseSessions.academicYearId, targetYear.id),
			),
		});
		expect(copied).toBeTruthy();
		expect(copied?.dayOfWeek).toBe("mon");
		expect(copied?.startTime).toBe("08:00");
		expect(copied?.room).toBe("A101");
	});

	it("skips sessions already present in target year (idempotent)", async () => {
		const { copySessionsAcrossYears } = await import("../timetable.service");
		const institutionId = getTestInstitution().id;

		const sourceYear = await createAcademicYear({ institutionId });
		const targetYear = await createAcademicYear({ institutionId });

		const sourceClass = await createClass({
			academicYear: sourceYear.id,
			code: `CL-IDEM-${randomUUID().slice(0, 4)}`,
			institutionId,
		});
		const sourceCC = await createClassCourse({
			class: sourceClass.id,
			code: `CC-IDEM-${randomUUID().slice(0, 4)}`,
			institutionId,
		});

		await db.insert(schema.courseSessions).values({
			institutionId,
			classCourseId: sourceCC.id,
			academicYearId: sourceYear.id,
			dayOfWeek: "tue",
			startTime: "10:00",
			endTime: "12:00",
		});

		const targetClass = await createClass({
			academicYear: targetYear.id,
			code: sourceClass.code,
			institutionId,
		});
		const targetCC = await createClassCourse({
			class: targetClass.id,
			code: sourceCC.code,
			institutionId,
		});

		// Pre-insert the session in target (simulating a previous copy run)
		await db.insert(schema.courseSessions).values({
			institutionId,
			classCourseId: targetCC.id,
			academicYearId: targetYear.id,
			dayOfWeek: "tue",
			startTime: "10:00",
			endTime: "12:00",
		});

		const classMapping: Record<string, string> = {
			[sourceClass.id]: targetClass.id,
		};
		const result = await copySessionsAcrossYears(
			sourceYear.id,
			targetYear.id,
			institutionId,
			classMapping,
		);

		expect(result.copied).toBe(0);
		expect(result.skipped).toBe(1);
		expect(result.notMatched).toBe(0);
	});

	it("counts notMatched when source class has no mapping", async () => {
		const { copySessionsAcrossYears } = await import("../timetable.service");
		const institutionId = getTestInstitution().id;

		const sourceYear = await createAcademicYear({ institutionId });
		const targetYear = await createAcademicYear({ institutionId });

		const sourceClass = await createClass({
			academicYear: sourceYear.id,
			code: `CL-MISS-${randomUUID().slice(0, 4)}`,
			institutionId,
		});
		const sourceCC = await createClassCourse({
			class: sourceClass.id,
			code: `CC-MISS-${randomUUID().slice(0, 4)}`,
			institutionId,
		});

		await db.insert(schema.courseSessions).values({
			institutionId,
			classCourseId: sourceCC.id,
			academicYearId: sourceYear.id,
			dayOfWeek: "wed",
			startTime: "13:00",
			endTime: "15:00",
		});

		// Empty classMapping — no target class for this source class
		const result = await copySessionsAcrossYears(
			sourceYear.id,
			targetYear.id,
			institutionId,
			{},
		);

		expect(result.copied).toBe(0);
		expect(result.skipped).toBe(0);
		expect(result.notMatched).toBe(1);
	});

	it("counts notMatched when target classCourse code does not exist in target class", async () => {
		const { copySessionsAcrossYears } = await import("../timetable.service");
		const institutionId = getTestInstitution().id;

		const sourceYear = await createAcademicYear({ institutionId });
		const targetYear = await createAcademicYear({ institutionId });

		const sourceClass = await createClass({
			academicYear: sourceYear.id,
			code: `CL-NCC-${randomUUID().slice(0, 4)}`,
			institutionId,
		});
		const sourceCC = await createClassCourse({
			class: sourceClass.id,
			code: `CC-NCC-${randomUUID().slice(0, 4)}`,
			institutionId,
		});

		await db.insert(schema.courseSessions).values({
			institutionId,
			classCourseId: sourceCC.id,
			academicYearId: sourceYear.id,
			dayOfWeek: "thu",
			startTime: "15:00",
			endTime: "17:00",
		});

		// Target class exists but has a different classCourse code
		const targetClass = await createClass({
			academicYear: targetYear.id,
			code: sourceClass.code,
			institutionId,
		});
		await createClassCourse({
			class: targetClass.id,
			code: `CC-DIFFERENT-${randomUUID().slice(0, 4)}`,
			institutionId,
		});

		const classMapping: Record<string, string> = {
			[sourceClass.id]: targetClass.id,
		};
		const result = await copySessionsAcrossYears(
			sourceYear.id,
			targetYear.id,
			institutionId,
			classMapping,
		);

		expect(result.notMatched).toBe(1);
		expect(result.copied).toBe(0);
	});
});
```

- [ ] **Step 3: Run `bun check` from workspace root**

```bash
bun check
```
Expected: no errors

- [ ] **Step 4: Commit**

```
feat(timetable): add copySessionsAcrossYears shared function
```

---

## Task 2: Backend — `timetable.copyFromYear` batch job

**Files:**
- Create: `apps/server/src/modules/batch-jobs/job-types/timetable-copy.ts`
- Modify: `apps/server/src/modules/batch-jobs/job-types/index.ts`

**Interfaces:**
- Consumes: `copySessionsAcrossYears` from `../../timetable/timetable.service`
- Consumes: `BatchJobDefinition`, `JobContext`, `PreviewResult` from `../batch-jobs.types`
- Produces: job type `"timetable.copyFromYear"` registered in registry

- [ ] **Step 1: Create `timetable-copy.ts`**

```ts
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import type {
	BatchJobDefinition,
	JobContext,
	PreviewResult,
} from "../batch-jobs.types";

const paramsSchema = z.object({
	sourceAcademicYearId: z.string(),
	targetAcademicYearId: z.string(),
});
type Params = z.infer<typeof paramsSchema>;

export const timetableCopyJob: BatchJobDefinition<Params> = {
	type: "timetable.copyFromYear",
	label: "Copy Timetable from Year",

	parseParams(raw) {
		return paramsSchema.parse(raw);
	},

	async preview(params, ctx) {
		if (params.sourceAcademicYearId === params.targetAcademicYearId) {
			throw new Error("Source and target academic years must be different");
		}

		const sourceYear = await db.query.academicYears.findFirst({
			where: and(
				eq(schema.academicYears.id, params.sourceAcademicYearId),
				eq(schema.academicYears.institutionId, ctx.institutionId),
			),
		});
		if (!sourceYear) throw new Error("Source academic year not found");

		const targetYear = await db.query.academicYears.findFirst({
			where: and(
				eq(schema.academicYears.id, params.targetAcademicYearId),
				eq(schema.academicYears.institutionId, ctx.institutionId),
			),
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
			throw new Error(
				`No timetable sessions found in "${sourceYear.name}". Nothing to copy.`,
			);
		}

		await ctx.log(
			"info",
			`Preview: ${sessions.length} sessions from "${sourceYear.name}" → "${targetYear.name}"`,
		);

		return {
			steps: [
				{ name: "Copy timetable sessions", estimatedItems: sessions.length },
			],
			summary: {
				sourceYearName: sourceYear.name,
				targetYearName: targetYear.name,
				sessionCount: sessions.length,
			},
			totalItems: sessions.length,
		} satisfies PreviewResult;
	},

	async executeStep(params, step, ctx) {
		// Build classMapping: source class.id → target class.id, matched by code
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

		const targetByCode = new Map(targetClasses.map((c) => [c.code, c.id]));
		const classMapping: Record<string, string> = {};
		for (const src of sourceClasses) {
			const targetId = targetByCode.get(src.code);
			if (targetId) classMapping[src.id] = targetId;
		}

		const { copySessionsAcrossYears } = await import(
			"../../timetable/timetable.service"
		);
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
		await ctx.log(
			"info",
			"Rolled back: deleted all timetable sessions from target year",
		);
	},
};
```

- [ ] **Step 2: Register in `index.ts`**

In `apps/server/src/modules/batch-jobs/job-types/index.ts`, add:

```ts
import { timetableCopyJob } from "./timetable-copy";
```

And in `registerAllJobTypes()`:
```ts
registerJobType(timetableCopyJob);
```

The full file becomes:
```ts
import { registerJobType } from "../batch-jobs.registry";
import { academicYearSetupJob } from "./academic-year-setup";
import { bulkDocumentGenerationJob } from "./bulk-document-generation";
import { creditLedgerRecomputeJob } from "./credit-ledger-recompute";
import { promotionApplyJob } from "./promotion-apply";
import { studentFactsRefreshJob } from "./student-facts-refresh";
import { timetableCopyJob } from "./timetable-copy";

export function registerAllJobTypes() {
	registerJobType(creditLedgerRecomputeJob);
	registerJobType(studentFactsRefreshJob);
	registerJobType(promotionApplyJob);
	registerJobType(academicYearSetupJob);
	registerJobType(bulkDocumentGenerationJob);
	registerJobType(timetableCopyJob);
}
```

- [ ] **Step 3: Add tests in `timetable.caller.test.ts`**

Add a new top-level `describe` block after the `copySessionsAcrossYears` block from Task 1:

```ts
describe("timetable.copyFromYear batch job (via batchJobs router)", () => {
	it("previews a timetable.copyFromYear job", async () => {
		const admin = createCaller(asAdmin());
		const institutionId = getTestInstitution().id;

		const sourceYear = await createAcademicYear({ institutionId });
		const targetYear = await createAcademicYear({ institutionId });

		const sourceClass = await createClass({
			academicYear: sourceYear.id,
			code: `CL-PV-${randomUUID().slice(0, 4)}`,
			institutionId,
		});
		const sourceCC = await createClassCourse({
			class: sourceClass.id,
			institutionId,
		});
		await db.insert(schema.courseSessions).values({
			institutionId,
			classCourseId: sourceCC.id,
			academicYearId: sourceYear.id,
			dayOfWeek: "mon",
			startTime: "08:00",
			endTime: "10:00",
		});

		const previewed = await admin.batchJobs.preview({
			type: "timetable.copyFromYear",
			params: {
				sourceAcademicYearId: sourceYear.id,
				targetAcademicYearId: targetYear.id,
			},
		});

		expect(previewed.type).toBe("timetable.copyFromYear");
		expect(previewed.status).toBe("previewed");
		expect(previewed.steps.length).toBe(1);
		expect(previewed.steps[0].name).toBe("Copy timetable sessions");
		expect(
			(previewed.previewResult as Record<string, unknown>).sessionCount,
		).toBe(1);
	});

	it("runs timetable.copyFromYear to completion and copies sessions", async () => {
		const admin = createCaller(asAdmin());
		const institutionId = getTestInstitution().id;

		const sourceYear = await createAcademicYear({ institutionId });
		const targetYear = await createAcademicYear({ institutionId });

		const sourceClass = await createClass({
			academicYear: sourceYear.id,
			code: `CL-RUN-${randomUUID().slice(0, 4)}`,
			institutionId,
		});
		const sourceCC = await createClassCourse({
			class: sourceClass.id,
			code: `CC-RUN-${randomUUID().slice(0, 4)}`,
			institutionId,
		});
		await db.insert(schema.courseSessions).values({
			institutionId,
			classCourseId: sourceCC.id,
			academicYearId: sourceYear.id,
			dayOfWeek: "fri",
			startTime: "15:00",
			endTime: "17:00",
		});

		// Target class + classCourse with same codes
		const targetClass = await createClass({
			academicYear: targetYear.id,
			code: sourceClass.code,
			institutionId,
		});
		const targetCC = await createClassCourse({
			class: targetClass.id,
			code: sourceCC.code,
			institutionId,
		});

		const previewed = await admin.batchJobs.preview({
			type: "timetable.copyFromYear",
			params: {
				sourceAcademicYearId: sourceYear.id,
				targetAcademicYearId: targetYear.id,
			},
		});

		const completed = await admin.batchJobs.run({ jobId: previewed.id });

		expect(completed.status).toBe("completed");

		const copied = await db.query.courseSessions.findFirst({
			where: and(
				eq(schema.courseSessions.classCourseId, targetCC.id),
				eq(schema.courseSessions.academicYearId, targetYear.id),
			),
		});
		expect(copied).toBeTruthy();
		expect(copied?.dayOfWeek).toBe("fri");
		expect(copied?.startTime).toBe("15:00");
	});

	it("preview fails when source year has no sessions", async () => {
		const admin = createCaller(asAdmin());
		const institutionId = getTestInstitution().id;

		const sourceYear = await createAcademicYear({ institutionId });
		const targetYear = await createAcademicYear({ institutionId });

		await expect(
			admin.batchJobs.preview({
				type: "timetable.copyFromYear",
				params: {
					sourceAcademicYearId: sourceYear.id,
					targetAcademicYearId: targetYear.id,
				},
			}),
		).rejects.toThrow();
	});

	it("preview fails when source equals target", async () => {
		const admin = createCaller(asAdmin());
		const institutionId = getTestInstitution().id;
		const year = await createAcademicYear({ institutionId });

		await expect(
			admin.batchJobs.preview({
				type: "timetable.copyFromYear",
				params: {
					sourceAcademicYearId: year.id,
					targetAcademicYearId: year.id,
				},
			}),
		).rejects.toThrow();
	});
});
```

- [ ] **Step 4: Run `bun check` from workspace root**

```bash
bun check
```
Expected: no errors

- [ ] **Step 5: Commit**

```
feat(batch-jobs): add timetable.copyFromYear batch job
```

---

## Task 3: Backend — Extend `academicYear.setup` with optional timetable step

**Files:**
- Modify: `apps/server/src/modules/batch-jobs/job-types/academic-year-setup.ts`

**Interfaces:**
- Consumes: `copySessionsAcrossYears` from `../../timetable/timetable.service`

- [ ] **Step 1: Extend `paramsSchema` (line ~12-15)**

Replace:
```ts
const paramsSchema = z.object({
	sourceAcademicYearId: z.string(),
	targetAcademicYearId: z.string(),
});
```

With:
```ts
const paramsSchema = z.object({
	sourceAcademicYearId: z.string(),
	targetAcademicYearId: z.string(),
	includeTimetable: z.boolean().default(false),
});
```

- [ ] **Step 2: Extend `preview()` — add session count and conditional step**

In `preview()`, after the `classCourses` query (around line 71-76), add session counting and extend `steps` and `summary`. Replace from the `await ctx.log(...)` call onward:

```ts
		let sessionCount = 0;
		if (params.includeTimetable) {
			const sessions = await db
				.select({ id: schema.courseSessions.id })
				.from(schema.courseSessions)
				.where(
					and(
						eq(
							schema.courseSessions.academicYearId,
							params.sourceAcademicYearId,
						),
						eq(schema.courseSessions.institutionId, ctx.institutionId),
					),
				);
			sessionCount = sessions.length;
		}

		await ctx.log(
			"info",
			`Preview: ${sourceClasses.length} classes, ${classCourses.length} class courses from "${sourceYear.name}" to "${targetYear.name}"${params.includeTimetable ? `, ${sessionCount} timetable sessions` : ""}`,
		);

		const steps = [
			{
				name: "Copy classes",
				estimatedItems: sourceClasses.length,
			},
			{
				name: "Copy class course assignments",
				estimatedItems: classCourses.length,
			},
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
			totalItems:
				sourceClasses.length + classCourses.length + sessionCount,
		} satisfies PreviewResult;
```

- [ ] **Step 3: Extend `executeStep()` — add step index 2**

Replace:
```ts
	async executeStep(params, step, ctx) {
		if (step.stepIndex === 0) {
			await executeCopyClasses(params, step, ctx);
		} else if (step.stepIndex === 1) {
			await executeCopyClassCourses(params, step, ctx);
		}
	},
```

With:
```ts
	async executeStep(params, step, ctx) {
		if (step.stepIndex === 0) {
			await executeCopyClasses(params, step, ctx);
		} else if (step.stepIndex === 1) {
			await executeCopyClassCourses(params, step, ctx);
		} else if (step.stepIndex === 2 && params.includeTimetable) {
			await executeCopyTimetable(params, step, ctx);
		}
	},
```

- [ ] **Step 4: Extend `rollback()` — delete sessions when `includeTimetable`**

In `rollback()`, after the existing class deletion loop, add:

```ts
		if (params.includeTimetable) {
			await db
				.delete(schema.courseSessions)
				.where(
					and(
						eq(
							schema.courseSessions.academicYearId,
							params.targetAcademicYearId,
						),
						eq(schema.courseSessions.institutionId, ctx.institutionId),
					),
				);
			await ctx.log(
				"info",
				"Rolled back: deleted timetable sessions from target year",
			);
		}
```

- [ ] **Step 5: Add `executeCopyTimetable()` function**

Add this function at the end of the file (after `executeCopyClassCourses`):

```ts
async function executeCopyTimetable(
	params: Params,
	step: schema.BatchJobStep,
	ctx: JobContext,
) {
	// Reconstruct classMapping from step 0 data
	const steps = await repo.getStepsForJob(ctx.jobId);
	const step0 = steps.find((s) => s.stepIndex === 0);
	const classMapping = (
		step0?.data as { classMapping?: Record<string, string> }
	)?.classMapping;

	if (!classMapping || Object.keys(classMapping).length === 0) {
		await ctx.log("warn", "No class mapping found from step 1, skipping timetable copy");
		return;
	}

	const { copySessionsAcrossYears } = await import(
		"../../timetable/timetable.service"
	);
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
		`Timetable: copied ${result.copied}, skipped ${result.skipped} (already existed), ${result.notMatched} not matched (course missing in target year)`,
	);
}
```

Note: `schema.BatchJobStep` is already imported in this file via `import * as schema from "@/db/schema/app-schema"`. `repo` is imported via `import * as repo from "../batch-jobs.repo"`. No new imports needed — `schema.courseSessions` is already accessible.

- [ ] **Step 6: Add import for `courseSessions` delete in rollback**

`schema.courseSessions` is already available via `import * as schema`. The `and` and `eq` are already imported. No new imports needed.

- [ ] **Step 7: Add tests for the extended job in `timetable.caller.test.ts`**

Add after the `timetable.copyFromYear` describe block from Task 2:

```ts
describe("academicYear.setup with includeTimetable", () => {
	it("includes timetable step in preview when includeTimetable=true", async () => {
		const admin = createCaller(asAdmin());
		const institutionId = getTestInstitution().id;

		const sourceYear = await createAcademicYear({ institutionId });
		const targetYear = await createAcademicYear({ institutionId });

		const sourceClass = await createClass({
			academicYear: sourceYear.id,
			code: `CL-SETT-${randomUUID().slice(0, 4)}`,
			institutionId,
		});
		const sourceCC = await createClassCourse({
			class: sourceClass.id,
			institutionId,
		});
		await db.insert(schema.courseSessions).values({
			institutionId,
			classCourseId: sourceCC.id,
			academicYearId: sourceYear.id,
			dayOfWeek: "mon",
			startTime: "08:00",
			endTime: "10:00",
		});

		const previewed = await admin.batchJobs.preview({
			type: "academicYear.setup",
			params: {
				sourceAcademicYearId: sourceYear.id,
				targetAcademicYearId: targetYear.id,
				includeTimetable: true,
			},
		});

		expect(previewed.steps.length).toBe(3);
		expect(previewed.steps[2].name).toBe("Copy timetable sessions");
		expect(
			(previewed.previewResult as Record<string, unknown>).sessionCount,
		).toBe(1);
	});

	it("does not include timetable step when includeTimetable=false (default)", async () => {
		const admin = createCaller(asAdmin());
		const institutionId = getTestInstitution().id;

		const sourceYear = await createAcademicYear({ institutionId });
		const targetYear = await createAcademicYear({ institutionId });

		await createClass({
			academicYear: sourceYear.id,
			code: `CL-NOSET-${randomUUID().slice(0, 4)}`,
			institutionId,
		});

		const previewed = await admin.batchJobs.preview({
			type: "academicYear.setup",
			params: {
				sourceAcademicYearId: sourceYear.id,
				targetAcademicYearId: targetYear.id,
			},
		});

		expect(previewed.steps.length).toBe(2);
		expect(
			(previewed.previewResult as Record<string, unknown>).sessionCount,
		).toBe(0);
	});
});
```

- [ ] **Step 8: Run `bun check`**

```bash
bun check
```
Expected: no errors

- [ ] **Step 9: Commit**

```
feat(batch-jobs): extend academicYear.setup with optional timetable copy step
```

---

## Task 4: i18n — Add translation keys

**Files:**
- Modify: `apps/web/src/i18n/locales/fr/translation.json`
- Modify: `apps/web/src/i18n/locales/en/translation.json`

- [ ] **Step 1: Add keys to FR translation**

Under `admin.academicYears.setup`, add after the existing `"noClasses"` key:
```json
"includeTimetable": "Inclure l'emploi du temps",
"timetableSummary_one": "{{count}} séance à copier depuis l'année source",
"timetableSummary_other": "{{count}} séances à copier depuis l'année source"
```

Under `teacher.timetable`, add after the existing `"print"` key:
```json
"copyFromYear": "Copier depuis une autre année"
```

Under `admin.timetable` (currently empty object `{}`), replace with:
```json
"copyDialog": {
  "title": "Copier l'emploi du temps",
  "description": "Copie les séances d'une autre année académique vers l'année actuellement sélectionnée.",
  "sourceYear": "Année source",
  "sourceYearPlaceholder": "Sélectionner l'année à copier",
  "previewSummary_one": "{{count}} séance de \"{{sourceYearName}}\" vers \"{{targetYearName}}\"",
  "previewSummary_other": "{{count}} séances de \"{{sourceYearName}}\" vers \"{{targetYearName}}\"",
  "confirm": "Lancer la copie",
  "success": "Copie lancée avec succès",
  "noTargetYear": "Sélectionnez d'abord une année cible dans les filtres"
}
```

- [ ] **Step 2: Add keys to EN translation**

Same paths, in English:

Under `admin.academicYears.setup`:
```json
"includeTimetable": "Include timetable",
"timetableSummary_one": "{{count}} session to copy from source year",
"timetableSummary_other": "{{count}} sessions to copy from source year"
```

Under `teacher.timetable`:
```json
"copyFromYear": "Copy from another year"
```

Under `admin.timetable`:
```json
"copyDialog": {
  "title": "Copy Timetable",
  "description": "Copies sessions from another academic year into the currently selected target year.",
  "sourceYear": "Source year",
  "sourceYearPlaceholder": "Select the year to copy from",
  "previewSummary_one": "{{count}} session from \"{{sourceYearName}}\" to \"{{targetYearName}}\"",
  "previewSummary_other": "{{count}} sessions from \"{{sourceYearName}}\" to \"{{targetYearName}}\"",
  "confirm": "Start copy",
  "success": "Copy started successfully",
  "noTargetYear": "First select a target year in the filters"
}
```

- [ ] **Step 3: Commit**

```
i18n: add timetable copy translation keys (FR + EN)
```

---

## Task 5: Frontend — Extend `AcademicYearSetupDialog` with timetable checkbox

**Files:**
- Modify: `apps/web/src/pages/admin/AcademicYearSetupDialog.tsx`

- [ ] **Step 1: Add `Checkbox` import**

The file currently imports from `"../../components/ui/button"` and `"../../components/ui/label"`. Add:
```ts
import { Checkbox } from "../../components/ui/checkbox";
```

- [ ] **Step 2: Add `includeTimetable` state and extend `PreviewData` type**

After `const [sourceYearId, setSourceYearId] = useState<string | null>(null);`, add:
```ts
const [includeTimetable, setIncludeTimetable] = useState(false);
```

Extend the local `PreviewData` type:
```ts
type PreviewData = {
	jobId: string;
	steps: Array<{ name: string; itemsTotal: number }>;
	summary: {
		sourceYearName: string;
		targetYearName: string;
		classCount: number;
		classCourseCount: number;
		sessionCount: number;
	};
};
```

- [ ] **Step 3: Pass `includeTimetable` to `preview` mutation**

In `previewMutation.mutationFn`, update the params object:
```ts
params: {
	sourceAcademicYearId: sourceYearId!,
	targetAcademicYearId: targetYear.id,
	includeTimetable,
},
```

- [ ] **Step 4: Reset `includeTimetable` in `handleClose`**

In `handleClose()`, add:
```ts
setIncludeTimetable(false);
```

- [ ] **Step 5: Add checkbox in the source year selection form**

After the `<AcademicYearSelect ... />` block (around line 111), add:
```tsx
<div className="flex items-center gap-2 pt-1">
	<Checkbox
		id="include-timetable"
		checked={includeTimetable}
		onCheckedChange={(v) => setIncludeTimetable(!!v)}
	/>
	<label
		htmlFor="include-timetable"
		className="cursor-pointer text-sm"
	>
		{t("admin.academicYears.setup.includeTimetable")}
	</label>
</div>
```

- [ ] **Step 6: Show session count in preview when `includeTimetable`**

In the preview section (after the steps list, inside the `previewData` branch), add:
```tsx
{includeTimetable && previewData.summary.sessionCount > 0 && (
	<p className="text-muted-foreground text-sm">
		{t("admin.academicYears.setup.timetableSummary", {
			count: previewData.summary.sessionCount,
		})}
	</p>
)}
```

- [ ] **Step 7: Run `bun check` and `bun check-types`**

```bash
bun check && bun check-types
```
Expected: no errors

- [ ] **Step 8: Commit**

```
feat(ui): add timetable checkbox to AcademicYearSetupDialog
```

---

## Task 6: Frontend — `CopyTimetableDialog` + `TimetableManagement` button

**Files:**
- Create: `apps/web/src/pages/admin/timetable/CopyTimetableDialog.tsx`
- Modify: `apps/web/src/pages/admin/TimetableManagement.tsx`

- [ ] **Step 1: Create `CopyTimetableDialog.tsx`**

```tsx
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogBody,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	currentYearId: string | null;
	currentYearName?: string | null;
}

type PreviewData = {
	jobId: string;
	steps: Array<{ name: string; itemsTotal: number }>;
	summary: {
		sourceYearName: string;
		targetYearName: string;
		sessionCount: number;
	};
};

export function CopyTimetableDialog({
	open,
	onOpenChange,
	currentYearId,
	currentYearName,
}: Props) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [sourceYearId, setSourceYearId] = useState<string | null>(null);
	const [previewData, setPreviewData] = useState<PreviewData | null>(null);

	const previewMutation = useMutation({
		mutationFn: () =>
			trpcClient.batchJobs.preview.mutate({
				type: "timetable.copyFromYear",
				params: {
					sourceAcademicYearId: sourceYearId!,
					targetAcademicYearId: currentYearId!,
				},
			}),
		onSuccess: (data) => {
			setPreviewData({
				jobId: data.id,
				steps: data.steps.map((s) => ({
					name: s.name,
					itemsTotal: s.itemsTotal ?? 0,
				})),
				summary: (data.previewResult ?? {}) as PreviewData["summary"],
			});
		},
		onError: (err) => toast.error((err as Error).message),
	});

	const runMutation = useMutation({
		mutationFn: (jobId: string) =>
			trpcClient.batchJobs.run.mutate({ jobId }),
		onSuccess: () => {
			toast.success(t("admin.timetable.copyDialog.success"));
			handleClose();
			navigate(`/admin/batch-jobs/${previewData?.jobId}`);
		},
		onError: (err) => toast.error((err as Error).message),
	});

	function handleClose() {
		setSourceYearId(null);
		setPreviewData(null);
		onOpenChange(false);
	}

	return (
		<Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>
						{t("admin.timetable.copyDialog.title")}
					</DialogTitle>
					<DialogDescription>
						{t("admin.timetable.copyDialog.description")}
					</DialogDescription>
				</DialogHeader>

				<DialogBody className="px-6 pb-4">
					{!previewData ? (
						<div className="space-y-4">
							<div className="space-y-2">
								<Label>
									{t("admin.timetable.copyDialog.sourceYear")}
								</Label>
								<AcademicYearSelect
									value={sourceYearId}
									onChange={setSourceYearId}
									autoSelectActive={false}
									placeholder={t(
										"admin.timetable.copyDialog.sourceYearPlaceholder",
									)}
									excludeIds={currentYearId ? [currentYearId] : []}
								/>
							</div>
							{currentYearName && (
								<p className="text-muted-foreground text-sm">
									→ {currentYearName}
								</p>
							)}
						</div>
					) : (
						<div className="space-y-4">
							<p className="text-sm">
								{t("admin.timetable.copyDialog.previewSummary", {
									count: previewData.summary.sessionCount,
									sourceYearName: previewData.summary.sourceYearName,
									targetYearName: previewData.summary.targetYearName,
								})}
							</p>
							<div className="space-y-2">
								{previewData.steps.map((step, i) => (
									<div
										key={i}
										className="flex items-center justify-between rounded-lg border p-3"
									>
										<span className="text-sm">
											{i + 1}. {step.name}
										</span>
										<span className="text-muted-foreground text-xs">
											{step.itemsTotal} items
										</span>
									</div>
								))}
							</div>
						</div>
					)}
				</DialogBody>

				<DialogFooter>
					<Button variant="outline" onClick={handleClose}>
						{t("common.actions.cancel")}
					</Button>
					{!previewData ? (
						<Button
							onClick={() => previewMutation.mutate()}
							disabled={!sourceYearId || !currentYearId || previewMutation.isPending}
						>
							{previewMutation.isPending && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							{t("admin.batchJobs.actions.preview")}
						</Button>
					) : (
						<Button
							onClick={() => runMutation.mutate(previewData.jobId)}
							disabled={runMutation.isPending}
						>
							{runMutation.isPending && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							{t("admin.timetable.copyDialog.confirm")}
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
```

- [ ] **Step 2: Add `Copy` icon and `CopyTimetableDialog` to `TimetableManagement.tsx`**

Add `Copy` to the lucide-react import line. The current import is:
```ts
import {
	AlertTriangle,
	Calendar,
	Download,
	Pencil,
	Plus,
	Printer,
	Trash2,
	Upload,
	XCircle,
} from "lucide-react";
```

Add `Copy`:
```ts
import {
	AlertTriangle,
	Calendar,
	Copy,
	Download,
	Pencil,
	Plus,
	Printer,
	Trash2,
	Upload,
	XCircle,
} from "lucide-react";
```

Add the import for the new dialog (alongside `TimetableImportDialog`):
```ts
import { CopyTimetableDialog } from "./timetable/CopyTimetableDialog";
```

- [ ] **Step 3: Add `copyOpen` state and `currentYearName` lookup in `TimetableManagement`**

After the existing `const [importOpen, setImportOpen] = useState(false);` line, add:
```ts
const [copyOpen, setCopyOpen] = useState(false);
```

For the year name, after `const sessions: Session[] = sessionsQuery.data ?? [];`, add:
```ts
const currentYearName =
	yearListQuery.data?.items.find((y) => y.id === academicYearId)?.name ?? null;
```

- [ ] **Step 4: Add the Copy button in the action bar**

Find the existing Import button in the JSX (it renders `<Upload>` icon). Add the Copy button **before** it:
```tsx
<Button
	variant="outline"
	size="sm"
	onClick={() => setCopyOpen(true)}
	disabled={!academicYearId}
>
	<Copy className="mr-1.5 h-4 w-4" />
	{t("teacher.timetable.copyFromYear")}
</Button>
```

- [ ] **Step 5: Render `CopyTimetableDialog` in the JSX**

Alongside `<TimetableImportDialog ...>`, add:
```tsx
<CopyTimetableDialog
	open={copyOpen}
	onOpenChange={setCopyOpen}
	currentYearId={academicYearId}
	currentYearName={currentYearName}
/>
```

- [ ] **Step 6: Run `bun check` and `bun check-types`**

```bash
bun check && bun check-types
```
Expected: no errors

- [ ] **Step 7: Commit**

```
feat(ui): add CopyTimetableDialog and copy button to TimetableManagement
```

---

## Final Step: Run the full test suite

- [ ] **Run all server tests from `apps/server/`**

```bash
cd apps/server && bun test
```

Expected: all tests pass, including new tests in `timetable.caller.test.ts`

- [ ] **Commit if any minor fixes were needed**

---

## Self-Review

**Spec coverage:**
- ✅ `copySessionsAcrossYears()` shared function — Task 1
- ✅ `timetable.copyFromYear` batch job (preview, execute, rollback) — Task 2
- ✅ Extension of `academicYear.setup` with `includeTimetable` — Task 3
- ✅ i18n keys FR + EN — Task 4
- ✅ `AcademicYearSetupDialog` checkbox + session count in preview — Task 5
- ✅ `CopyTimetableDialog` + TimetableManagement button — Task 6
- ✅ Error cases: same year, no sessions, no matching class/CC — covered in tests

**Placeholder scan:** None found.

**Type consistency:**
- `CopySessionsResult` defined in Task 1, used in Task 2 and Task 3 via import — consistent
- `classMapping: Record<string, string>` used identically in all call sites — consistent
- `PreviewData.summary.sessionCount` added in Task 3 backend and consumed in Task 5 frontend — consistent
