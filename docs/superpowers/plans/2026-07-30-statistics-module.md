# Statistics Module Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a backend `stats` tRPC router with aggregate queries + revamp the Dashboard + create a dedicated `/admin/statistics` page with 4 domain tabs (Étudiants, Performance, Finances, Admissions), year filter, and Excel export.

**Architecture:** New `modules/stats/` backend module with Drizzle aggregate queries (count/sum/avg + GROUP BY). Frontend has a revamped Dashboard using a single `stats.overview` query, plus a new StatisticsHub page with shared year filter passed to domain tabs.

**Tech Stack:** Bun, tRPC (adminProcedure), Drizzle ORM, React, Recharts (already installed), xlsx (already installed), react-i18next, shadcn/ui

## Global Constraints

- All backend queries MUST filter by `institutionId` from `ctx.institution.id`
- Use `adminProcedure` for all stats endpoints (same as notifications.stats)
- Drizzle field name gotchas (DB column → Drizzle field name):
  - `classes.program_id` → `schema.classes.program`
  - `classes.academic_year_id` → `schema.classes.academicYear`
  - `students.class_id` → `schema.students.class`
  - `exams.class_course_id` → `schema.exams.classCourse`
- `import * as schema from "@/db/schema/app-schema"` — wildcard pattern for tables
- `import { db } from "@/db"` — database access
- Drizzle operators: `import { and, count, desc, eq, sql, sum } from "drizzle-orm"`
- All `numeric` DB columns return as strings in Drizzle → use `parseFloat()`
- No tests needed for this feature (UI-only verification, per project convention)
- Never add Co-Authored-By trailer to commits
- Never commit/push; suggest commit message as text only

---

### Task 1: Backend — stats module

**Files:**
- Create: `apps/server/src/modules/stats/stats.repo.ts`
- Create: `apps/server/src/modules/stats/stats.service.ts`
- Create: `apps/server/src/modules/stats/stats.router.ts`
- Create: `apps/server/src/modules/stats/index.ts`
- Modify: `apps/server/src/routers/index.ts`

- [ ] **Step 1: Create stats.repo.ts**

```typescript
import { and, count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";

function yearFilter(academicYearId: string | undefined, col: any) {
  return academicYearId ? [eq(col, academicYearId)] : [];
}

export const statsRepo = {
  async overview(institutionId: string, academicYearId?: string) {
    const [studentsRow] = await db
      .select({ count: count() })
      .from(schema.enrollments)
      .where(
        and(
          eq(schema.enrollments.institutionId, institutionId),
          eq(schema.enrollments.status, "active"),
          ...yearFilter(academicYearId, schema.enrollments.academicYearId),
        ),
      );

    const [examsPendingRow] = await db
      .select({ count: count() })
      .from(schema.exams)
      .where(
        and(
          eq(schema.exams.institutionId, institutionId),
          eq(schema.exams.status, "submitted"),
        ),
      );

    const [feeExpectedRow] = await db
      .select({
        total: sql<string>`COALESCE(SUM(${schema.studentFeeAssignments.effectiveAmount}), '0')`,
      })
      .from(schema.studentFeeAssignments)
      .where(
        and(
          eq(schema.studentFeeAssignments.institutionId, institutionId),
          ...yearFilter(academicYearId, schema.studentFeeAssignments.academicYearId),
        ),
      );

    const [feeCollectedRow] = await db
      .select({
        total: sql<string>`COALESCE(SUM(${schema.feePayments.amount}), '0')`,
      })
      .from(schema.feePayments)
      .innerJoin(
        schema.studentFeeAssignments,
        eq(schema.feePayments.feeAssignmentId, schema.studentFeeAssignments.id),
      )
      .where(
        and(
          eq(schema.feePayments.institutionId, institutionId),
          ...yearFilter(academicYearId, schema.studentFeeAssignments.academicYearId),
        ),
      );

    const [admissionsRow] = await db
      .select({ count: count() })
      .from(schema.admissionApplications)
      .where(
        and(
          eq(schema.admissionApplications.institutionId, institutionId),
          ...yearFilter(academicYearId, schema.admissionApplications.academicYearId),
        ),
      );

    const [deliberationsOpenRow] = await db
      .select({ count: count() })
      .from(schema.deliberations)
      .where(
        and(
          eq(schema.deliberations.institutionId, institutionId),
          eq(schema.deliberations.status, "open"),
          ...yearFilter(academicYearId, schema.deliberations.academicYearId),
        ),
      );

    const feeExpected = parseFloat(feeExpectedRow?.total ?? "0");
    const feeCollected = parseFloat(feeCollectedRow?.total ?? "0");

    return {
      activeStudents: studentsRow?.count ?? 0,
      examsPending: examsPendingRow?.count ?? 0,
      feeExpected,
      feeCollected,
      feeOutstanding: feeExpected - feeCollected,
      feeCollectionRate:
        feeExpected > 0 ? Math.round((feeCollected / feeExpected) * 100) : 0,
      admissionsTotal: admissionsRow?.count ?? 0,
      deliberationsOpen: deliberationsOpenRow?.count ?? 0,
    };
  },

  async enrollmentStats(institutionId: string, academicYearId?: string) {
    const baseWhere = and(
      eq(schema.enrollments.institutionId, institutionId),
      ...yearFilter(academicYearId, schema.enrollments.academicYearId),
    );

    const [totalRow] = await db
      .select({ count: count() })
      .from(schema.enrollments)
      .where(baseWhere);

    const byStatus = await db
      .select({ status: schema.enrollments.status, count: count() })
      .from(schema.enrollments)
      .where(baseWhere)
      .groupBy(schema.enrollments.status);

    const byProgram = await db
      .select({
        programId: schema.classes.program,
        programName: schema.programs.name,
        count: count(),
      })
      .from(schema.enrollments)
      .innerJoin(
        schema.classes,
        eq(schema.enrollments.classId, schema.classes.id),
      )
      .innerJoin(
        schema.programs,
        eq(schema.classes.program, schema.programs.id),
      )
      .where(baseWhere)
      .groupBy(schema.classes.program, schema.programs.name)
      .orderBy(desc(count()));

    const byGender = await db
      .select({ gender: schema.domainUsers.gender, count: count() })
      .from(schema.enrollments)
      .innerJoin(
        schema.students,
        eq(schema.enrollments.studentId, schema.students.id),
      )
      .innerJoin(
        schema.domainUsers,
        eq(schema.students.domainUserId, schema.domainUsers.id),
      )
      .where(baseWhere)
      .groupBy(schema.domainUsers.gender);

    return {
      total: totalRow?.count ?? 0,
      byStatus,
      byProgram,
      byGender,
    };
  },

  async performanceStats(institutionId: string, academicYearId?: string) {
    const deliberationWhere = and(
      eq(schema.deliberations.institutionId, institutionId),
      ...yearFilter(academicYearId, schema.deliberations.academicYearId),
    );

    const byDecision = await db
      .select({
        decision: schema.deliberationStudentResults.finalDecision,
        count: count(),
      })
      .from(schema.deliberationStudentResults)
      .innerJoin(
        schema.deliberations,
        eq(
          schema.deliberationStudentResults.deliberationId,
          schema.deliberations.id,
        ),
      )
      .where(deliberationWhere)
      .groupBy(schema.deliberationStudentResults.finalDecision);

    const byMention = await db
      .select({
        mention: schema.deliberationStudentResults.mention,
        count: count(),
      })
      .from(schema.deliberationStudentResults)
      .innerJoin(
        schema.deliberations,
        eq(
          schema.deliberationStudentResults.deliberationId,
          schema.deliberations.id,
        ),
      )
      .where(
        and(
          deliberationWhere,
          sql`${schema.deliberationStudentResults.mention} IS NOT NULL`,
        ),
      )
      .groupBy(schema.deliberationStudentResults.mention);

    const [avgRow] = await db
      .select({
        avg: sql<string>`COALESCE(AVG(${schema.deliberationStudentResults.generalAverage}), '0')`,
      })
      .from(schema.deliberationStudentResults)
      .innerJoin(
        schema.deliberations,
        eq(
          schema.deliberationStudentResults.deliberationId,
          schema.deliberations.id,
        ),
      )
      .where(
        and(
          deliberationWhere,
          sql`${schema.deliberationStudentResults.generalAverage} IS NOT NULL`,
        ),
      );

    return {
      byDecision,
      byMention,
      avgGeneralAverage: parseFloat(avgRow?.avg ?? "0"),
    };
  },

  async financeStats(institutionId: string, academicYearId?: string) {
    const assignWhere = and(
      eq(schema.studentFeeAssignments.institutionId, institutionId),
      ...yearFilter(academicYearId, schema.studentFeeAssignments.academicYearId),
    );

    const [expectedRow] = await db
      .select({
        total: sql<string>`COALESCE(SUM(${schema.studentFeeAssignments.effectiveAmount}), '0')`,
        count: count(),
      })
      .from(schema.studentFeeAssignments)
      .where(assignWhere);

    const [collectedRow] = await db
      .select({
        total: sql<string>`COALESCE(SUM(${schema.feePayments.amount}), '0')`,
      })
      .from(schema.feePayments)
      .innerJoin(
        schema.studentFeeAssignments,
        eq(schema.feePayments.feeAssignmentId, schema.studentFeeAssignments.id),
      )
      .where(
        and(
          eq(schema.feePayments.institutionId, institutionId),
          ...yearFilter(academicYearId, schema.studentFeeAssignments.academicYearId),
        ),
      );

    const byStatus = await db
      .select({ status: schema.studentFeeAssignments.status, count: count() })
      .from(schema.studentFeeAssignments)
      .where(assignWhere)
      .groupBy(schema.studentFeeAssignments.status);

    const byPaymentMethod = await db
      .select({
        method: schema.feePayments.paymentMethod,
        total: sql<string>`COALESCE(SUM(${schema.feePayments.amount}), '0')`,
        count: count(),
      })
      .from(schema.feePayments)
      .innerJoin(
        schema.studentFeeAssignments,
        eq(schema.feePayments.feeAssignmentId, schema.studentFeeAssignments.id),
      )
      .where(
        and(
          eq(schema.feePayments.institutionId, institutionId),
          ...yearFilter(academicYearId, schema.studentFeeAssignments.academicYearId),
        ),
      )
      .groupBy(schema.feePayments.paymentMethod);

    const monthlyCollections = await db
      .select({
        month: sql<string>`TO_CHAR(${schema.feePayments.paymentDate}, 'YYYY-MM')`,
        total: sql<string>`COALESCE(SUM(${schema.feePayments.amount}), '0')`,
      })
      .from(schema.feePayments)
      .innerJoin(
        schema.studentFeeAssignments,
        eq(schema.feePayments.feeAssignmentId, schema.studentFeeAssignments.id),
      )
      .where(
        and(
          eq(schema.feePayments.institutionId, institutionId),
          ...yearFilter(academicYearId, schema.studentFeeAssignments.academicYearId),
        ),
      )
      .groupBy(sql`TO_CHAR(${schema.feePayments.paymentDate}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${schema.feePayments.paymentDate}, 'YYYY-MM')`);

    const expected = parseFloat(expectedRow?.total ?? "0");
    const collected = parseFloat(collectedRow?.total ?? "0");

    return {
      expected,
      collected,
      outstanding: expected - collected,
      collectionRate: expected > 0 ? Math.round((collected / expected) * 100) : 0,
      assignmentsCount: expectedRow?.count ?? 0,
      byStatus,
      byPaymentMethod: byPaymentMethod.map((r) => ({
        ...r,
        total: parseFloat(r.total),
      })),
      monthlyCollections: monthlyCollections.map((r) => ({
        month: r.month,
        total: parseFloat(r.total),
      })),
    };
  },

  async admissionsStats(institutionId: string, academicYearId?: string) {
    const baseWhere = and(
      eq(schema.admissionApplications.institutionId, institutionId),
      ...yearFilter(academicYearId, schema.admissionApplications.academicYearId),
    );

    const [totalRow] = await db
      .select({ count: count() })
      .from(schema.admissionApplications)
      .where(baseWhere);

    const byStatus = await db
      .select({ status: schema.admissionApplications.status, count: count() })
      .from(schema.admissionApplications)
      .where(baseWhere)
      .groupBy(schema.admissionApplications.status);

    const byProgram = await db
      .select({
        programId: schema.admissionApplications.programId,
        programName: schema.programs.name,
        count: count(),
      })
      .from(schema.admissionApplications)
      .innerJoin(
        schema.programs,
        eq(schema.admissionApplications.programId, schema.programs.id),
      )
      .where(baseWhere)
      .groupBy(schema.admissionApplications.programId, schema.programs.name)
      .orderBy(desc(count()));

    const [convertedRow] = await db
      .select({ count: count() })
      .from(schema.admissionApplications)
      .where(
        and(
          baseWhere,
          sql`${schema.admissionApplications.convertedStudentId} IS NOT NULL`,
        ),
      );

    const total = totalRow?.count ?? 0;
    const converted = convertedRow?.count ?? 0;

    return {
      total,
      byStatus,
      byProgram,
      conversionRate: total > 0 ? Math.round((converted / total) * 100) : 0,
      converted,
    };
  },
};
```

- [ ] **Step 2: Create stats.service.ts**

```typescript
import { statsRepo } from "./stats.repo";

export const statsService = {
  overview: (institutionId: string, academicYearId?: string) =>
    statsRepo.overview(institutionId, academicYearId),
  enrollmentStats: (institutionId: string, academicYearId?: string) =>
    statsRepo.enrollmentStats(institutionId, academicYearId),
  performanceStats: (institutionId: string, academicYearId?: string) =>
    statsRepo.performanceStats(institutionId, academicYearId),
  financeStats: (institutionId: string, academicYearId?: string) =>
    statsRepo.financeStats(institutionId, academicYearId),
  admissionsStats: (institutionId: string, academicYearId?: string) =>
    statsRepo.admissionsStats(institutionId, academicYearId),
};
```

- [ ] **Step 3: Create stats.router.ts**

```typescript
import { z } from "zod";
import { adminProcedure, router } from "@/lib/trpc";
import { statsService } from "./stats.service";

const yearInput = z.object({ academicYearId: z.string().optional() });

export const statsRouter = router({
  overview: adminProcedure.input(yearInput).query(({ ctx, input }) =>
    statsService.overview(ctx.institution.id, input.academicYearId),
  ),
  enrollmentStats: adminProcedure.input(yearInput).query(({ ctx, input }) =>
    statsService.enrollmentStats(ctx.institution.id, input.academicYearId),
  ),
  performanceStats: adminProcedure.input(yearInput).query(({ ctx, input }) =>
    statsService.performanceStats(ctx.institution.id, input.academicYearId),
  ),
  financeStats: adminProcedure.input(yearInput).query(({ ctx, input }) =>
    statsService.financeStats(ctx.institution.id, input.academicYearId),
  ),
  admissionsStats: adminProcedure.input(yearInput).query(({ ctx, input }) =>
    statsService.admissionsStats(ctx.institution.id, input.academicYearId),
  ),
});
```

- [ ] **Step 4: Create index.ts**

```typescript
export { statsRouter } from "./stats.router";
```

- [ ] **Step 5: Wire to appRouter in routers/index.ts**

Add after existing imports:
```typescript
import { statsRouter } from "../modules/stats";
```

Add to `appRouter` object:
```typescript
stats: statsRouter,
```

---

### Task 2: Dashboard revamp

**Files:**
- Modify: `apps/web/src/pages/admin/Dashboard.tsx`

The current Dashboard makes 11+ parallel API calls and N+1 calls for program stats. Replace with:
- `trpc.stats.overview.queryOptions({ academicYearId: activeYearId })` for KPI cards
- Keep the bar chart but feed it from `trpc.stats.enrollmentStats` byProgram data
- Keep the donut chart but feed it from enrollmentStats byStatus
- Remove the `trpcClient` direct calls pattern — use `useQuery` with tRPC query options
- Add a "Voir les statistiques →" link to `/admin/statistics`

- [ ] **Step 1: Rewrite Dashboard.tsx**

Replace the entire `queryFn` and state section. New approach:

```typescript
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Calendar,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  GraduationCap,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import type React from "react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnimatedCounter } from "@/hooks/useAnimatedCounter";
import { fadeUp, staggerContainer, staggerItem } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { trpc } from "../../utils/trpc";
```

Keep `StatCard`, `DashboardSkeleton`, `renderPieLabel` components unchanged.

Replace `QUICK_ACTIONS` with i18n keys (keep same hrefs but use `t()` for labels):
```typescript
const QUICK_ACTIONS = [
  { labelKey: "admin.dashboard.quickActions.addStudent", icon: <UserPlus className="h-4 w-4" />, href: "/admin/students" },
  { labelKey: "admin.dashboard.quickActions.scheduleExam", icon: <ClipboardCheck className="h-4 w-4" />, href: "/admin/exams" },
  { labelKey: "admin.dashboard.quickActions.enrollments", icon: <ClipboardList className="h-4 w-4" />, href: "/admin/classes/enrollments" },
  { labelKey: "admin.dashboard.quickActions.academicYears", icon: <CalendarDays className="h-4 w-4" />, href: "/admin/academic-years" },
  { labelKey: "admin.dashboard.quickActions.statistics", icon: <BarChart3 className="h-4 w-4" />, href: "/admin/statistics" },
];
```

Main component:
```typescript
const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [yearId, setYearId] = useState<string | null>(null);
  const [yearInitialized, setYearInitialized] = useState(false);

  const yearListQuery = useQuery(trpc.academicYears.list.queryOptions({}));
  useEffect(() => {
    const active = yearListQuery.data?.items.find((y) => y.isActive)?.id;
    if (!yearInitialized && active) {
      setYearId(active);
      setYearInitialized(true);
    }
  }, [yearListQuery.data, yearInitialized]);

  const activeYearName = yearListQuery.data?.items.find((y) => y.id === yearId)?.name;

  const overviewQuery = useQuery(
    trpc.stats.overview.queryOptions({ academicYearId: yearId ?? undefined }),
  );
  const enrollQuery = useQuery(
    trpc.stats.enrollmentStats.queryOptions({ academicYearId: yearId ?? undefined }),
  );

  const ov = overviewQuery.data;
  const enroll = enrollQuery.data;

  const isLoading = overviewQuery.isLoading || enrollQuery.isLoading;
  if (isLoading) return <DashboardSkeleton />;

  // KPI cards data
  const statCards = [
    {
      key: "activeStudents",
      count: ov?.activeStudents ?? 0,
      icon: <Users className="h-5 w-5" />,
      gradient: "bg-primary/10",
      iconColor: "text-primary",
      href: "/admin/users/people",
    },
    {
      key: "admissionsTotal",
      count: ov?.admissionsTotal ?? 0,
      icon: <GraduationCap className="h-5 w-5" />,
      gradient: "bg-primary/10",
      iconColor: "text-primary",
      href: "/admin/admissions",
    },
    {
      key: "examsPending",
      count: ov?.examsPending ?? 0,
      icon: <ClipboardCheck className="h-5 w-5" />,
      gradient: "bg-amber-500/10",
      iconColor: "text-amber-600",
      href: "/admin/exams/list?status=submitted",
    },
    {
      key: "deliberationsOpen",
      count: ov?.deliberationsOpen ?? 0,
      icon: <BookOpen className="h-5 w-5" />,
      gradient: "bg-blue-500/10",
      iconColor: "text-blue-600",
      href: "/admin/academic-results/deliberations",
    },
    {
      key: "feeCollectionRate",
      count: ov?.feeCollectionRate ?? 0,
      icon: <Wallet className="h-5 w-5" />,
      gradient: "bg-green-500/10",
      iconColor: "text-green-600",
      href: "/admin/fee-clearance",
    },
  ];

  // Bar chart data: students per program
  const programStats = (enroll?.byProgram ?? []).map((p) => ({
    name: p.programName,
    students: p.count,
  }));

  // Donut chart: enrollment by status
  const STATUS_COLORS: Record<string, string> = {
    active: "var(--chart-2)",
    pending: "var(--chart-3)",
    completed: "var(--chart-1)",
    withdrawn: "var(--chart-4)",
  };
  const enrollmentStatus = (enroll?.byStatus ?? [])
    .filter((s) => s.count > 0)
    .map((s) => ({
      name: t(`admin.statistics.enrollment.status.${s.status}`, { defaultValue: s.status }),
      value: s.count,
      color: STATUS_COLORS[s.status] ?? "var(--chart-5)",
    }));

  // Keep rest of JSX identical but:
  // 1. Replace header right side with AcademicYearSelect + year name badge
  // 2. Replace action banners (examsPending + deliberationsOpen) with ov?.examsPending / ov?.deliberationsOpen
  // 3. Replace stat cards loop with new statCards array
  // 4. Replace programStats and enrollmentStatus with computed values above
  // 5. Remove "recent exams" section (or keep it using a separate exams.list query limited to 6)
  // 6. Replace quickActions labels with t(labelKey)
  // 7. Add "→ Voir les statistiques détaillées" link at the bottom

  return (
    // ... JSX using the data above, keeping existing visual design
    // Key changes: AcademicYearSelect in header, new KPI cards (activeStudents, admissionsTotal, examsPending, deliberationsOpen, feeCollectionRate), real chart data
  );
};
```

**Important**: Keep the existing visual design (motion animations, card styling, Recharts charts). Only replace the data layer. Add the `AcademicYearSelect` to the header area (next to the year badge, replacing it). Add a `feeCollectionRate` display that shows "X%" with a label "Taux de recouvrement".

---

### Task 3: Statistics hub skeleton + routing + sidebar

**Files:**
- Create: `apps/web/src/pages/admin/statistics/StatisticsHub.tsx`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/components/navigation/Sidebar.tsx`

- [ ] **Step 1: Create StatisticsHub.tsx**

The hub holds the shared `yearId` filter and renders tabs for each domain. Use a tab-based layout (not HubNav — this page IS the hub, no sub-routes, just tab switching via local state).

```typescript
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { StatisticsStudentsTab } from "./StatisticsStudentsTab";
import { StatisticsPerformanceTab } from "./StatisticsPerformanceTab";
import { StatisticsFinancesTab } from "./StatisticsFinancesTab";
import { StatisticsAdmissionsTab } from "./StatisticsAdmissionsTab";

type TabKey = "students" | "performance" | "finances" | "admissions";

const TABS: TabKey[] = ["students", "performance", "finances", "admissions"];

export default function StatisticsHub() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabKey>("students");
  const [yearId, setYearId] = useState<string | null>(null);
  const [yearInitialized, setYearInitialized] = useState(false);

  const yearListQuery = useQuery(trpc.academicYears.list.queryOptions({}));
  useEffect(() => {
    const active = yearListQuery.data?.items.find((y) => y.isActive)?.id;
    if (!yearInitialized && active) {
      setYearId(active);
      setYearInitialized(true);
    }
  }, [yearListQuery.data, yearInitialized]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <PageHeader
          title={t("admin.statistics.title")}
          description={t("admin.statistics.description")}
          icon={<BarChart3 className="h-5 w-5" />}
        />
        <div className="w-56">
          <AcademicYearSelect
            value={yearId}
            onChange={setYearId}
            allowAll
            allLabel={t("common.allYears")}
            autoSelectActive={false}
          />
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              "relative px-4 py-2.5 font-medium text-sm transition-colors",
              activeTab === tab
                ? "text-primary after:absolute after:right-0 after:bottom-0 after:left-0 after:h-0.5 after:rounded-full after:bg-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t(`admin.statistics.tabs.${tab}`)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "students" && <StatisticsStudentsTab yearId={yearId} />}
      {activeTab === "performance" && <StatisticsPerformanceTab yearId={yearId} />}
      {activeTab === "finances" && <StatisticsFinancesTab yearId={yearId} />}
      {activeTab === "admissions" && <StatisticsAdmissionsTab yearId={yearId} />}
    </div>
  );
}
```

Note: Check if `PageHeader` accepts an `icon` prop — look at how it's used in other hub pages. If not, use a `div` with an icon + title instead.

- [ ] **Step 2: Add route to App.tsx**

Find the block near line 400-450 where admin routes are defined. Add after the existing `/admin/batch-jobs` route (or similar standalone admin route):

```typescript
{ path: "statistics", lazy: () => import("./pages/admin/statistics/StatisticsHub").then(m => ({ Component: m.default })) },
```

Use the same lazy-loading pattern as neighboring routes.

- [ ] **Step 3: Add sidebar nav item**

In `Sidebar.tsx`, find the `adminGroups` array. Add a new group between the `results` group and the `system` group:

```typescript
{
  key: "analytics",
  titleKey: "navigation.sidebar.groups.analytics",
  items: [
    {
      to: "/admin/statistics",
      icon: <BarChart3 className={IC} />,
      labelKey: "navigation.sidebar.admin.statistics",
      badge: "new" as NavBadgeType,
    },
    {
      to: "/admin/fee-clearance",
      icon: <Wallet className={IC} />,
      labelKey: "navigation.sidebar.admin.feeClearance",
    },
  ],
},
```

Note: If `fee-clearance` is already in another group, just add the statistics item to that group or create a separate `analytics` group with only statistics.

Import `BarChart3` and `Wallet` from lucide-react if not already imported.

---

### Task 4: Statistics tab pages

**Files:**
- Create: `apps/web/src/pages/admin/statistics/StatisticsStudentsTab.tsx`
- Create: `apps/web/src/pages/admin/statistics/StatisticsPerformanceTab.tsx`
- Create: `apps/web/src/pages/admin/statistics/StatisticsFinancesTab.tsx`
- Create: `apps/web/src/pages/admin/statistics/StatisticsAdmissionsTab.tsx`

All tabs accept `{ yearId: string | null }` props and call their respective tRPC query.

- [ ] **Step 1: StatisticsStudentsTab.tsx**

```typescript
import { useQuery } from "@tanstack/react-query";
import { Download, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";

const GENDER_COLORS: Record<string, string> = {
  male: "var(--chart-1)",
  female: "var(--chart-2)",
  other: "var(--chart-3)",
};
const STATUS_COLORS: Record<string, string> = {
  active: "var(--chart-2)",
  pending: "var(--chart-3)",
  completed: "var(--chart-1)",
  withdrawn: "var(--chart-4)",
};

export function StatisticsStudentsTab({ yearId }: { yearId: string | null }) {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery(
    trpc.stats.enrollmentStats.queryOptions({ academicYearId: yearId ?? undefined }),
  );

  function handleExport() {
    if (!data) return;
    const wb = XLSX.utils.book_new();
    // By program sheet
    const programRows = data.byProgram.map((p) => ({
      Programme: p.programName,
      Inscrits: p.count,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(programRows), "Par programme");
    // By status sheet
    const statusRows = data.byStatus.map((s) => ({
      Statut: s.status,
      Count: s.count,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(statusRows), "Par statut");
    XLSX.writeFile(wb, "statistiques-etudiants.xlsx");
  }

  if (isLoading) return <Skeleton className="h-96 w-full" />;

  const total = data?.total ?? 0;
  const byProgram = (data?.byProgram ?? []).map((p) => ({ name: p.programName, value: p.count }));
  const byStatus = (data?.byStatus ?? []).map((s) => ({
    name: t(`admin.statistics.enrollment.status.${s.status}`, { defaultValue: s.status }),
    value: s.count,
    color: STATUS_COLORS[s.status] ?? "var(--chart-5)",
  }));
  const byGender = (data?.byGender ?? []).map((g) => ({
    name: t(`admin.statistics.gender.${g.gender ?? "unknown"}`, { defaultValue: g.gender ?? "N/A" }),
    value: g.count,
    color: GENDER_COLORS[g.gender ?? "other"] ?? "var(--chart-5)",
  }));

  return (
    <div className="space-y-5">
      {/* Header row: total + export */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-bold text-2xl tabular-nums">{total.toLocaleString()}</p>
            <p className="text-muted-foreground text-sm">{t("admin.statistics.enrollment.totalLabel")}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" />
          {t("admin.statistics.export")}
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        {/* Bar: by program */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("admin.statistics.enrollment.byProgram")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byProgram} margin={{ top: 4, right: 16, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" angle={-35} textAnchor="end" height={70} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: "10px", border: "1px solid var(--border)", fontSize: "13px", backgroundColor: "var(--card)" }} />
                  <Bar dataKey="value" fill="var(--primary)" radius={[6, 6, 0, 0]} opacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Donut: by status + by gender stacked */}
        <div className="flex flex-col gap-5 lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t("admin.statistics.enrollment.byStatus")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={byStatus} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" paddingAngle={2}>
                      {byStatus.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: "10px", border: "1px solid var(--border)", fontSize: "13px", backgroundColor: "var(--card)" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5">
                {byStatus.map((s) => (
                  <div key={s.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="text-muted-foreground">{s.name}</span>
                    </div>
                    <span className="font-semibold tabular-nums">{s.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t("admin.statistics.enrollment.byGender")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                {byGender.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-4">{t("common.noData")}</p>
                ) : byGender.map((g) => (
                  <div key={g.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: g.color }} />
                      <span className="text-muted-foreground">{g.name}</span>
                    </div>
                    <span className="font-semibold tabular-nums">{g.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: StatisticsPerformanceTab.tsx**

```typescript
import { useQuery } from "@tanstack/react-query";
import { Download, GraduationCap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";

const DECISION_COLORS: Record<string, string> = {
  passed: "var(--chart-2)",
  failed: "var(--chart-4)",
  repeating: "var(--chart-3)",
  excluded: "var(--destructive)",
  deferred: "var(--chart-5)",
};
const MENTION_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

export function StatisticsPerformanceTab({ yearId }: { yearId: string | null }) {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery(
    trpc.stats.performanceStats.queryOptions({ academicYearId: yearId ?? undefined }),
  );

  function handleExport() {
    if (!data) return;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.byDecision.map(d => ({ Décision: d.decision, Étudiants: d.count }))), "Par décision");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.byMention.map(m => ({ Mention: m.mention, Étudiants: m.count }))), "Par mention");
    XLSX.writeFile(wb, "statistiques-performance.xlsx");
  }

  if (isLoading) return <Skeleton className="h-96 w-full" />;

  const byDecision = (data?.byDecision ?? []).map((d) => ({
    name: t(`admin.statistics.performance.decision.${d.decision ?? "unknown"}`, { defaultValue: d.decision ?? "N/A" }),
    value: d.count,
    color: DECISION_COLORS[d.decision ?? ""] ?? "var(--chart-5)",
  }));
  const byMention = (data?.byMention ?? []).map((m, i) => ({
    name: t(`admin.statistics.performance.mention.${m.mention ?? "unknown"}`, { defaultValue: m.mention ?? "N/A" }),
    value: m.count,
    color: MENTION_COLORS[i % MENTION_COLORS.length],
  }));
  const avg = data?.avgGeneralAverage ?? 0;
  const total = byDecision.reduce((s, d) => s + d.value, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-bold text-2xl tabular-nums">{total.toLocaleString()}</p>
              <p className="text-muted-foreground text-sm">{t("admin.statistics.performance.studentsDeliberated")}</p>
            </div>
          </div>
          {avg > 0 && (
            <div>
              <p className="font-bold text-2xl tabular-nums">{avg.toFixed(2)}/20</p>
              <p className="text-muted-foreground text-sm">{t("admin.statistics.performance.avgGeneral")}</p>
            </div>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" />
          {t("admin.statistics.export")}
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("admin.statistics.performance.byDecision")}</CardTitle>
          </CardHeader>
          <CardContent>
            {byDecision.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground text-sm">{t("admin.statistics.noDeliberations")}</p>
            ) : (
              <div className="flex gap-4">
                <div className="h-48 w-48 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={byDecision} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" paddingAngle={2}>
                        {byDecision.map((d) => <Cell key={d.name} fill={d.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: "10px", border: "1px solid var(--border)", fontSize: "13px", backgroundColor: "var(--card)" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-1 flex-col justify-center gap-2">
                  {byDecision.map((d) => (
                    <div key={d.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="text-muted-foreground">{d.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold tabular-nums">{d.value}</span>
                        {total > 0 && <span className="text-muted-foreground text-xs">({Math.round((d.value / total) * 100)}%)</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("admin.statistics.performance.byMention")}</CardTitle>
          </CardHeader>
          <CardContent>
            {byMention.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground text-sm">{t("admin.statistics.noMentions")}</p>
            ) : (
              <div className="space-y-2">
                {byMention.map((m) => (
                  <div key={m.name} className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: m.color }} />
                    <div className="flex flex-1 items-center justify-between">
                      <span className="text-muted-foreground text-sm">{m.name}</span>
                      <span className="font-semibold text-sm tabular-nums">{m.value}</span>
                    </div>
                    <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full" style={{ backgroundColor: m.color, width: `${total > 0 ? Math.round((m.value / total) * 100) : 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: StatisticsFinancesTab.tsx**

```typescript
import { useQuery } from "@tanstack/react-query";
import { Download, Wallet } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";

function formatAmount(n: number) {
  return new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n) + " XAF";
}

const METHOD_COLORS: Record<string, string> = {
  cash: "var(--chart-1)",
  bank_transfer: "var(--chart-2)",
  mobile_money: "var(--chart-3)",
  check: "var(--chart-4)",
  bank_import: "var(--chart-5)",
};

export function StatisticsFinancesTab({ yearId }: { yearId: string | null }) {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery(
    trpc.stats.financeStats.queryOptions({ academicYearId: yearId ?? undefined }),
  );

  function handleExport() {
    if (!data) return;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([
      { Indicateur: "Attendu", Montant: data.expected },
      { Indicateur: "Collecté", Montant: data.collected },
      { Indicateur: "Impayé", Montant: data.outstanding },
      { Indicateur: "Taux de recouvrement", Montant: `${data.collectionRate}%` },
    ]), "Vue d'ensemble");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.monthlyCollections.map(m => ({ Mois: m.month, Montant: m.total }))), "Mensuel");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.byPaymentMethod.map(m => ({ Méthode: m.method, Montant: m.total, Transactions: m.count }))), "Par méthode");
    XLSX.writeFile(wb, "statistiques-finances.xlsx");
  }

  if (isLoading) return <Skeleton className="h-96 w-full" />;

  const d = data;
  const kpis = [
    { label: t("admin.statistics.finances.expected"), value: formatAmount(d?.expected ?? 0), color: "text-foreground" },
    { label: t("admin.statistics.finances.collected"), value: formatAmount(d?.collected ?? 0), color: "text-green-600" },
    { label: t("admin.statistics.finances.outstanding"), value: formatAmount(d?.outstanding ?? 0), color: "text-destructive" },
    { label: t("admin.statistics.finances.collectionRate"), value: `${d?.collectionRate ?? 0}%`, color: "text-primary" },
  ];
  const byMethod = (d?.byPaymentMethod ?? []).map((m) => ({
    name: t(`admin.statistics.finances.method.${m.method}`, { defaultValue: m.method }),
    value: m.total,
    count: m.count,
    color: METHOD_COLORS[m.method] ?? "var(--chart-5)",
  }));
  const monthly = (d?.monthlyCollections ?? []).map((m) => ({ month: m.month, montant: m.total }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
            <Wallet className="h-5 w-5 text-green-600" />
          </div>
          <p className="font-semibold text-lg">{t("admin.statistics.finances.title")}</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" />
          {t("admin.statistics.export")}
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-4">
              <p className="text-muted-foreground text-xs">{kpi.label}</p>
              <p className={`mt-1 font-bold text-xl tabular-nums ${kpi.color}`}>{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress bar: collection rate */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t("admin.statistics.finances.collected")}</span>
            <span className="font-medium">{d?.collectionRate ?? 0}%</span>
          </div>
          <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-700"
              style={{ width: `${Math.min(d?.collectionRate ?? 0, 100)}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
            <span>{formatAmount(d?.collected ?? 0)}</span>
            <span>{formatAmount(d?.expected ?? 0)}</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-5">
        {/* Area chart: monthly */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("admin.statistics.finances.monthlyTrend")}</CardTitle>
          </CardHeader>
          <CardContent>
            {monthly.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground text-sm">{t("admin.statistics.noData")}</p>
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthly} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="collectGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ borderRadius: "10px", border: "1px solid var(--border)", fontSize: "13px", backgroundColor: "var(--card)" }} formatter={(v: number) => [formatAmount(v), "Collecté"]} />
                    <Area type="monotone" dataKey="montant" stroke="var(--chart-2)" strokeWidth={2} fill="url(#collectGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Donut: by payment method */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("admin.statistics.finances.byMethod")}</CardTitle>
          </CardHeader>
          <CardContent>
            {byMethod.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground text-sm">{t("admin.statistics.noData")}</p>
            ) : (
              <>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={byMethod} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" paddingAngle={2}>
                        {byMethod.map((m) => <Cell key={m.name} fill={m.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: "10px", border: "1px solid var(--border)", fontSize: "13px", backgroundColor: "var(--card)" }} formatter={(v: number) => [formatAmount(v), ""]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1.5">
                  {byMethod.map((m) => (
                    <div key={m.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: m.color }} />
                        <span className="text-muted-foreground">{m.name}</span>
                      </div>
                      <span className="font-medium tabular-nums">{formatAmount(m.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: StatisticsAdmissionsTab.tsx**

```typescript
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Download } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";

const STATUS_COLORS: Record<string, string> = {
  draft: "var(--chart-5)",
  submitted: "var(--chart-3)",
  pending: "var(--chart-3)",
  approved: "var(--chart-2)",
  rejected: "var(--destructive)",
  waitlisted: "var(--chart-4)",
  enrolled: "var(--chart-1)",
};

export function StatisticsAdmissionsTab({ yearId }: { yearId: string | null }) {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery(
    trpc.stats.admissionsStats.queryOptions({ academicYearId: yearId ?? undefined }),
  );

  function handleExport() {
    if (!data) return;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.byStatus.map(s => ({ Statut: s.status, Candidatures: s.count }))), "Par statut");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.byProgram.map(p => ({ Programme: p.programName, Candidatures: p.count }))), "Par programme");
    XLSX.writeFile(wb, "statistiques-admissions.xlsx");
  }

  if (isLoading) return <Skeleton className="h-96 w-full" />;

  const total = data?.total ?? 0;
  const converted = data?.converted ?? 0;
  const conversionRate = data?.conversionRate ?? 0;
  const byStatus = (data?.byStatus ?? []).map((s) => ({
    name: t(`admin.statistics.admissions.status.${s.status}`, { defaultValue: s.status }),
    value: s.count,
    color: STATUS_COLORS[s.status] ?? "var(--chart-5)",
  }));
  const byProgram = (data?.byProgram ?? []).map((p) => ({ name: p.programName, value: p.count }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <ClipboardList className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-bold text-2xl tabular-nums">{total.toLocaleString()}</p>
              <p className="text-muted-foreground text-sm">{t("admin.statistics.admissions.total")}</p>
            </div>
          </div>
          <div>
            <p className="font-bold text-2xl tabular-nums">{conversionRate}%</p>
            <p className="text-muted-foreground text-sm">{t("admin.statistics.admissions.conversionRate")}</p>
          </div>
          <div>
            <p className="font-bold text-2xl tabular-nums">{converted.toLocaleString()}</p>
            <p className="text-muted-foreground text-sm">{t("admin.statistics.admissions.converted")}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" />
          {t("admin.statistics.export")}
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        {/* Bar: by program */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("admin.statistics.admissions.byProgram")}</CardTitle>
          </CardHeader>
          <CardContent>
            {byProgram.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground text-sm">{t("admin.statistics.noData")}</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byProgram} margin={{ top: 4, right: 16, left: 0, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="name" angle={-35} textAnchor="end" height={70} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: "10px", border: "1px solid var(--border)", fontSize: "13px", backgroundColor: "var(--card)" }} />
                    <Bar dataKey="value" fill="var(--primary)" radius={[6, 6, 0, 0]} opacity={0.85} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Donut: by status */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("admin.statistics.admissions.byStatus")}</CardTitle>
          </CardHeader>
          <CardContent>
            {byStatus.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground text-sm">{t("admin.statistics.noData")}</p>
            ) : (
              <>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={byStatus} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" paddingAngle={2}>
                        {byStatus.map((s) => <Cell key={s.name} fill={s.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: "10px", border: "1px solid var(--border)", fontSize: "13px", backgroundColor: "var(--card)" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1.5">
                  {byStatus.map((s) => (
                    <div key={s.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                        <span className="text-muted-foreground">{s.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold tabular-nums">{s.value}</span>
                        {total > 0 && <span className="text-muted-foreground text-xs">({Math.round((s.value / total) * 100)}%)</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

---

### Task 5: i18n keys

**Files:**
- Modify: `apps/web/src/i18n/locales/fr/translation.json`
- Modify: `apps/web/src/i18n/locales/en/translation.json`

- [ ] **Step 1: Add FR keys** — under `"admin"` section:

```json
"statistics": {
  "title": "Statistiques",
  "description": "Indicateurs clés de performance de l'institution",
  "export": "Exporter Excel",
  "noData": "Aucune donnée disponible",
  "noDeliberations": "Aucune délibération enregistrée",
  "noMentions": "Aucune mention attribuée",
  "tabs": {
    "students": "Étudiants",
    "performance": "Performance",
    "finances": "Finances",
    "admissions": "Admissions"
  },
  "enrollment": {
    "totalLabel": "Inscriptions actives",
    "byProgram": "Inscrits par programme",
    "byStatus": "Répartition par statut",
    "byGender": "Répartition par genre",
    "status": {
      "active": "Actif",
      "pending": "En attente",
      "completed": "Terminé",
      "withdrawn": "Retiré"
    }
  },
  "performance": {
    "studentsDeliberated": "Étudiants délibérés",
    "avgGeneral": "Moyenne générale",
    "byDecision": "Résultats par décision",
    "byMention": "Résultats par mention",
    "decision": {
      "passed": "Admis",
      "failed": "Échoué",
      "repeating": "Redoublant",
      "excluded": "Exclu",
      "deferred": "Reporté",
      "unknown": "Inconnu"
    },
    "mention": {
      "passable": "Passable",
      "assez_bien": "Assez bien",
      "bien": "Bien",
      "tres_bien": "Très bien",
      "excellent": "Excellent",
      "unknown": "Non attribuée"
    }
  },
  "finances": {
    "title": "Vue financière",
    "expected": "Montant attendu",
    "collected": "Montant collecté",
    "outstanding": "Reste à percevoir",
    "collectionRate": "Taux de recouvrement",
    "monthlyTrend": "Évolution mensuelle des encaissements",
    "byMethod": "Par moyen de paiement",
    "method": {
      "cash": "Espèces",
      "bank_transfer": "Virement",
      "mobile_money": "Mobile money",
      "check": "Chèque",
      "bank_import": "Import bancaire"
    }
  },
  "admissions": {
    "total": "Candidatures",
    "conversionRate": "Taux de conversion",
    "converted": "Candidats inscrits",
    "byProgram": "Candidatures par programme",
    "byStatus": "Répartition par statut",
    "status": {
      "draft": "Brouillon",
      "submitted": "Soumis",
      "pending": "En attente",
      "approved": "Accepté",
      "rejected": "Refusé",
      "waitlisted": "Liste d'attente",
      "enrolled": "Inscrit"
    }
  }
}
```

Also add under `"admin.dashboard"`:
```json
"quickActions": {
  "addStudent": "Ajouter un étudiant",
  "scheduleExam": "Planifier un examen",
  "enrollments": "Gérer les inscriptions",
  "academicYears": "Années académiques",
  "statistics": "Statistiques détaillées"
}
```

Also add under `"navigation.sidebar"`:
```json
"groups": {
  "analytics": "Analytique"
},
"admin": {
  "statistics": "Statistiques"
}
```

Also add under `"common"`:
```json
"allYears": "Toutes les années",
"noData": "Aucune donnée"
```

Also add under `"admin.statistics.gender"`:
```json
"gender": {
  "male": "Homme",
  "female": "Femme",
  "other": "Autre",
  "unknown": "Non renseigné"
}
```

- [ ] **Step 2: Add EN keys** — same structure with English translations:

```json
"statistics": {
  "title": "Statistics",
  "description": "Key performance indicators for the institution",
  "export": "Export Excel",
  "noData": "No data available",
  "noDeliberations": "No deliberations recorded",
  "noMentions": "No mentions assigned",
  "tabs": {
    "students": "Students",
    "performance": "Performance",
    "finances": "Finances",
    "admissions": "Admissions"
  },
  "enrollment": {
    "totalLabel": "Active enrollments",
    "byProgram": "Students by program",
    "byStatus": "Status breakdown",
    "byGender": "Gender breakdown",
    "status": {
      "active": "Active",
      "pending": "Pending",
      "completed": "Completed",
      "withdrawn": "Withdrawn"
    }
  },
  "performance": {
    "studentsDeliberated": "Students deliberated",
    "avgGeneral": "General average",
    "byDecision": "Results by decision",
    "byMention": "Results by mention",
    "decision": {
      "passed": "Passed",
      "failed": "Failed",
      "repeating": "Repeating",
      "excluded": "Excluded",
      "deferred": "Deferred",
      "unknown": "Unknown"
    },
    "mention": {
      "passable": "Pass",
      "assez_bien": "Fairly good",
      "bien": "Good",
      "tres_bien": "Very good",
      "excellent": "Excellent",
      "unknown": "Not assigned"
    }
  },
  "finances": {
    "title": "Financial overview",
    "expected": "Expected amount",
    "collected": "Collected amount",
    "outstanding": "Outstanding balance",
    "collectionRate": "Collection rate",
    "monthlyTrend": "Monthly collection trend",
    "byMethod": "By payment method",
    "method": {
      "cash": "Cash",
      "bank_transfer": "Bank transfer",
      "mobile_money": "Mobile money",
      "check": "Check",
      "bank_import": "Bank import"
    }
  },
  "admissions": {
    "total": "Applications",
    "conversionRate": "Conversion rate",
    "converted": "Enrolled applicants",
    "byProgram": "Applications by program",
    "byStatus": "Status breakdown",
    "status": {
      "draft": "Draft",
      "submitted": "Submitted",
      "pending": "Pending",
      "approved": "Approved",
      "rejected": "Rejected",
      "waitlisted": "Waitlisted",
      "enrolled": "Enrolled"
    }
  },
  "gender": {
    "male": "Male",
    "female": "Female",
    "other": "Other",
    "unknown": "Not specified"
  }
}
```

Same dashboard quickActions and navigation keys as FR but in English.
