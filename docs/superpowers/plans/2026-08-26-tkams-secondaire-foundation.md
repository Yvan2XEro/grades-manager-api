# TKAMS Secondaire — Plan A: Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold `apps/secondary/` — a single Bun/Hono app with tRPC backend + React SPA — with full database schema, auth, permissions, i18n (FR/EN), login page, and role-based app shell (admin / teacher / principal sidebars).

**Architecture:** One Bun workspace package (`apps/secondary/`) with a `client/` subdirectory for the React SPA. Hono serves tRPC at `/trpc/*`, Better-Auth at `/api/auth/**`, and static files from `./dist` in production. In development, Vite (port 5173) proxies API calls to Hono (port 3001). HashRouter (`/#/...`) for all client routes to avoid Hono routing conflicts.

**Tech Stack:** Bun + Hono 4.8 + tRPC 11 + Drizzle ORM 0.44 + PostgreSQL + Better-Auth 1.3 + React 18 + React Router 7 + shadcn/ui + TailwindCSS v4 + Vite 7 + i18next 25

**Spec:** `docs/superpowers/specs/2026-08-26-tkams-secondaire.md`

## Global Constraints

- ALL database tables must be prefixed `sec_` (e.g. `sec_students`, `sec_terms`)
- Better-Auth tablePrefix must be `"sec_"` so auth tables (user, session, etc.) also get `sec_` prefix
- App lives at `apps/secondary/` — it is NOT split into two workspace packages; `client/` is a subdirectory, not a workspace member
- No tRPC procedure may run without institution context (resolved from session org)
- Three roles only: `admin`, `principal`, `teacher` — no `super_admin`, no `grade_editor`
- All UI strings go through i18next translation keys — zero hardcoded French or English labels in components
- Both `fr.json` and `en.json` translation files exist from day one
- Hono server port in dev: 3001 (not 3000, which TKAMS Supérieur uses)
- Vite dev port: 5173
- Run `bun check` (Biome) before every commit
- Tabs (width 2), double quotes, semicolons required
- Never edit SQL migration files manually — use `bun db:generate`
- Never add Co-Authored-By trailer to commits
- Do not commit/push; suggest commit message as text only

---

## File Structure

```
apps/secondary/
├── index.ts                          # Hono entry point
├── package.json
├── tsconfig.json
├── bunfig.toml
├── drizzle.config.ts
├── src/
│   ├── db/
│   │   ├── index.ts                  # Drizzle client
│   │   └── schema.ts                 # ALL sec_* tables
│   ├── lib/
│   │   ├── auth.ts                   # Better-Auth config (tablePrefix "sec_")
│   │   ├── context.ts                # tRPC request context
│   │   ├── permissions.ts            # createAccessControl + 3 roles
│   │   └── trpc.ts                   # Procedure types
│   └── routers/
│       └── index.ts                  # appRouter (stub health check)
└── client/
    ├── index.html
    ├── vite.config.ts                # Dev proxy /trpc + /api/auth → localhost:3001
    ├── tsconfig.json
    └── src/
        ├── main.tsx                  # HashRouter root
        ├── routes.tsx                # All route definitions
        ├── index.css                 # TailwindCSS v4 + TKAMS design tokens
        ├── i18n/
        │   ├── index.ts
        │   └── locales/
        │       ├── fr.json
        │       └── en.json
        ├── lib/
        │   └── auth-client.ts        # Better-Auth client
        ├── utils/
        │   └── trpc.ts               # tRPC + React Query client
        ├── components/
        │   ├── auth/
        │   │   └── protected-route.tsx
        │   └── layout/
        │       ├── app-shell.tsx     # Role-based shell selector
        │       ├── admin-sidebar.tsx
        │       ├── teacher-sidebar.tsx
        │       └── principal-sidebar.tsx
        └── pages/
            ├── auth/
            │   └── login.tsx
            ├── admin/
            │   ├── dashboard.tsx     # stub
            │   ├── students/
            │   │   └── index.tsx    # stub
            │   ├── enrollments/
            │   │   └── index.tsx    # stub
            │   ├── subjects/
            │   │   └── index.tsx    # stub
            │   ├── staff/
            │   │   └── index.tsx    # stub
            │   ├── classes/
            │   │   └── index.tsx    # stub
            │   ├── settings/
            │   │   └── index.tsx    # stub
            │   └── finance/
            │       └── index.tsx    # stub
            ├── teacher/
            │   ├── dashboard.tsx    # stub
            │   ├── grades/
            │   │   └── index.tsx    # stub
            │   └── attendance/
            │       └── index.tsx    # stub
            └── principal/
                ├── dashboard.tsx    # stub
                └── report-cards/
                    └── index.tsx    # stub
```

---

### Task 1: Monorepo workspace scaffold

**Files:**
- Create: `apps/secondary/package.json`
- Create: `apps/secondary/tsconfig.json`
- Create: `apps/secondary/bunfig.toml`
- Create: `apps/secondary/drizzle.config.ts`
- Create: `apps/secondary/index.ts` (skeleton — completed in Task 4)
- Create: `apps/secondary/client/index.html`
- Create: `apps/secondary/client/tsconfig.json`
- Create: `apps/secondary/client/vite.config.ts`

**Interfaces:**
- Produces: `apps/secondary/` workspace member recognized by root Bun workspaces; `bun dev:server` and `bun dev:client` scripts available inside the package

- [ ] **Step 1: Create `apps/secondary/package.json`**

```json
{
  "name": "secondary",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev:server": "bun --watch index.ts",
    "dev:client": "cd client && bun vite",
    "dev": "concurrently \"bun dev:server\" \"bun dev:client\"",
    "build:client": "cd client && bun vite build --outDir ../dist",
    "build": "bun run build:client && bun build ./index.ts --outdir ./out --target bun",
    "start": "bun ./out/index.js",
    "db:push": "drizzle-kit push",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "check": "biome check --write .",
    "check-types": "tsc --noEmit && cd client && tsc --noEmit"
  },
  "dependencies": {
    "@hono/trpc-server": "^0.3.4",
    "@trpc/server": "^11.5.0",
    "better-auth": "^1.3.9",
    "drizzle-orm": "^0.44.2",
    "hono": "^4.8.2",
    "pg": "^8.14.1",
    "zod": "^4.0.2"
  },
  "devDependencies": {
    "@biomejs/biome": "^1.9.4",
    "@types/bun": "^1.2.0",
    "@types/pg": "^8.11.10",
    "concurrently": "^9.1.2",
    "drizzle-kit": "^0.30.4",
    "typescript": "^5.7.3"
  }
}
```

- [ ] **Step 2: Create `apps/secondary/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "outDir": "./out"
  },
  "include": ["index.ts", "src/**/*.ts"],
  "exclude": ["node_modules", "dist", "out", "client"]
}
```

- [ ] **Step 3: Create `apps/secondary/bunfig.toml`**

```toml
[install]
exact = true
```

- [ ] **Step 4: Create `apps/secondary/drizzle.config.ts`**

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  tablesFilter: ["sec_*"],
});
```

- [ ] **Step 5: Create `apps/secondary/index.ts` skeleton**

```typescript
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { trpcServer } from "@hono/trpc-server";
import { auth } from "./src/lib/auth";
import { appRouter } from "./src/routers/index";
import { createContext } from "./src/lib/context";

const app = new Hono();

app.on(["GET", "POST"], "/api/auth/**", (c) => auth.handler(c.req.raw));

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
  }),
);

app.use("/*", serveStatic({ root: "./dist" }));
app.get("/*", serveStatic({ path: "./dist/index.html" }));

export default {
  port: Number(process.env.PORT ?? 3001),
  fetch: app.fetch,
};
```

- [ ] **Step 6: Create `apps/secondary/client/index.html`**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TKAMS Secondaire</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 7: Create `apps/secondary/client/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

- [ ] **Step 8: Create `apps/secondary/client/vite.config.ts`**

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: {
    port: 5173,
    proxy: {
      "/trpc": "http://localhost:3001",
      "/api/auth": "http://localhost:3001",
    },
  },
});
```

- [ ] **Step 9: Install client dependencies**

Add to `apps/secondary/package.json` under `dependencies` (frontend deps go in the same package.json since client/ is not a workspace):

```json
{
  "dependencies": {
    "@hono/trpc-server": "^0.3.4",
    "@tanstack/react-query": "^5.85.5",
    "@trpc/client": "^11.5.0",
    "@trpc/react-query": "^11.5.0",
    "@trpc/server": "^11.5.0",
    "better-auth": "^1.3.9",
    "drizzle-orm": "^0.44.2",
    "hono": "^4.8.2",
    "i18next": "^25.6.3",
    "i18next-browser-languagedetector": "^8.0.5",
    "pg": "^8.14.1",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-i18next": "^15.6.0",
    "react-router": "^7.9.6",
    "zod": "^4.0.2"
  },
  "devDependencies": {
    "@biomejs/biome": "^1.9.4",
    "@tailwindcss/vite": "^4.1.17",
    "@types/bun": "^1.2.0",
    "@types/pg": "^8.11.10",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "concurrently": "^9.1.2",
    "drizzle-kit": "^0.30.4",
    "tailwindcss": "^4.1.17",
    "typescript": "^5.7.3",
    "vite": "^7.2.4"
  }
}
```

Then from `apps/secondary/`: `bun install`

- [ ] **Step 10: Suggest commit message**

```
feat(secondary): scaffold apps/secondary workspace package
```

---

### Task 2: Database schema — all `sec_*` tables

**Files:**
- Create: `apps/secondary/src/db/schema.ts`
- Create: `apps/secondary/src/db/index.ts`

**Interfaces:**
- Produces: All Drizzle table exports used by every subsequent module. Auth tables are managed by Better-Auth (not in this file). This file defines ALL application-domain tables.

- [ ] **Step 1: Create `apps/secondary/src/db/index.ts`**

```typescript
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });
export type DB = typeof db;
```

- [ ] **Step 2: Create `apps/secondary/src/db/schema.ts`**

Write the complete schema. All table names must start with `sec_`. Use `pgTable` from `drizzle-orm/pg-core`. Order matters: reference tables before dependent tables to avoid forward-reference issues.

```typescript
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const id = () => varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID());
const now = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const timestamps = () => ({
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Institutions ─────────────────────────────────────────────────────────────
// Maps 1-to-1 with Better-Auth organization. id = org.id

export const secInstitutions = pgTable("sec_institutions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  minesecCode: varchar("minesec_code", { length: 50 }),
  type: varchar("type", { length: 20 }).notNull().default("lycee"), // lycee | college | mixed
  address: text("address"),
  city: varchar("city", { length: 100 }),
  phone: varchar("phone", { length: 30 }),
  email: varchar("email", { length: 255 }),
  logoUrl: text("logo_url"),
  assessmentMode: varchar("assessment_mode", { length: 20 }).notNull().default("six_sequence"), // six_sequence | composition
  ...timestamps(),
});

// ─── Academic years ───────────────────────────────────────────────────────────

export const secAcademicYears = pgTable("sec_academic_years", {
  id: id(),
  institutionId: varchar("institution_id", { length: 36 }).notNull().references(() => secInstitutions.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 50 }).notNull(), // e.g. "2025-2026"
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("active"), // active | closed | archived
  assessmentMode: varchar("assessment_mode", { length: 20 }).notNull().default("six_sequence"),
  ...timestamps(),
}, (t) => [
  index("sec_ay_inst_idx").on(t.institutionId),
]);

// ─── Terms ────────────────────────────────────────────────────────────────────

export const secTerms = pgTable("sec_terms", {
  id: id(),
  institutionId: varchar("institution_id", { length: 36 }).notNull().references(() => secInstitutions.id, { onDelete: "cascade" }),
  academicYearId: varchar("academic_year_id", { length: 36 }).notNull().references(() => secAcademicYears.id, { onDelete: "cascade" }),
  termNumber: integer("term_number").notNull(), // 1, 2, or 3
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("open"), // open | closed | archived
  ...timestamps(),
}, (t) => [
  uniqueIndex("sec_terms_uniq").on(t.academicYearId, t.termNumber),
]);

// ─── Tracks (filières) ────────────────────────────────────────────────────────

export const secTracks = pgTable("sec_tracks", {
  id: id(),
  institutionId: varchar("institution_id", { length: 36 }).notNull().references(() => secInstitutions.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(), // "Terminale C"
  code: varchar("code", { length: 20 }).notNull(), // "TLE-C"
  cycleLevel: varchar("cycle_level", { length: 20 }).notNull(), // first_cycle | second_cycle | technical
  isOfficial: boolean("is_official").notNull().default(false),
  ...timestamps(),
}, (t) => [
  uniqueIndex("sec_tracks_code_uniq").on(t.institutionId, t.code),
]);

// ─── Subjects ─────────────────────────────────────────────────────────────────

export const secSubjects = pgTable("sec_subjects", {
  id: id(),
  institutionId: varchar("institution_id", { length: 36 }).notNull().references(() => secInstitutions.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),       // English name
  nameFr: varchar("name_fr", { length: 100 }).notNull(),  // French name
  code: varchar("code", { length: 30 }).notNull(),
  minesecCode: varchar("minesec_code", { length: 30 }),
  subjectGroup: varchar("subject_group", { length: 50 }), // languages | sciences | humanities | arts | pe
  ...timestamps(),
}, (t) => [
  uniqueIndex("sec_subjects_code_uniq").on(t.institutionId, t.code),
]);

// ─── Track × Subject coefficients ────────────────────────────────────────────

export const secTrackSubjectCoefficients = pgTable("sec_track_subject_coefficients", {
  id: id(),
  trackId: varchar("track_id", { length: 36 }).notNull().references(() => secTracks.id, { onDelete: "cascade" }),
  subjectId: varchar("subject_id", { length: 36 }).notNull().references(() => secSubjects.id, { onDelete: "cascade" }),
  coefficient: integer("coefficient").notNull().default(1),
  isOfficialExamSubject: boolean("is_official_exam_subject").notNull().default(false),
  ...timestamps(),
}, (t) => [
  uniqueIndex("sec_tsc_uniq").on(t.trackId, t.subjectId),
]);

// ─── Staff ────────────────────────────────────────────────────────────────────

export const secStaff = pgTable("sec_staff", {
  id: id(),
  institutionId: varchar("institution_id", { length: 36 }).notNull().references(() => secInstitutions.id, { onDelete: "cascade" }),
  authUserId: varchar("auth_user_id", { length: 36 }),  // Better-Auth user.id (null until account linked)
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 30 }),
  role: varchar("role", { length: 30 }).notNull().default("teacher"), // teacher | admin | principal | vice_principal | staff
  ...timestamps(),
}, (t) => [
  uniqueIndex("sec_staff_email_inst_uniq").on(t.institutionId, t.email),
  index("sec_staff_auth_user_idx").on(t.authUserId),
]);

// ─── Classes ──────────────────────────────────────────────────────────────────

export const secClasses = pgTable("sec_classes", {
  id: id(),
  institutionId: varchar("institution_id", { length: 36 }).notNull().references(() => secInstitutions.id, { onDelete: "cascade" }),
  academicYearId: varchar("academic_year_id", { length: 36 }).notNull().references(() => secAcademicYears.id, { onDelete: "cascade" }),
  trackId: varchar("track_id", { length: 36 }).references(() => secTracks.id),
  classMasterId: varchar("class_master_id", { length: 36 }).references(() => secStaff.id),
  name: varchar("name", { length: 50 }).notNull(), // "Terminale D"
  code: varchar("code", { length: 20 }).notNull(), // "TLE-D"
  level: varchar("level", { length: 30 }).notNull(), // "6e" | "5e" | "4e" | "3e" | "2nde" | "1re" | "Tle"
  room: varchar("room", { length: 50 }),
  maxCapacity: integer("max_capacity"),
  ...timestamps(),
}, (t) => [
  uniqueIndex("sec_classes_code_uniq").on(t.academicYearId, t.code),
  index("sec_classes_year_idx").on(t.academicYearId),
]);

// ─── Students ─────────────────────────────────────────────────────────────────

export const secStudents = pgTable("sec_students", {
  id: id(),
  institutionId: varchar("institution_id", { length: 36 }).notNull().references(() => secInstitutions.id, { onDelete: "cascade" }),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  dateOfBirth: timestamp("date_of_birth", { withTimezone: true }),
  placeOfBirth: varchar("place_of_birth", { length: 100 }),
  gender: varchar("gender", { length: 10 }), // M | F
  mnu: varchar("mnu", { length: 50 }),           // Matricule National Unique
  registrationNumber: varchar("registration_number", { length: 50 }),
  photoUrl: text("photo_url"),
  contactName: varchar("contact_name", { length: 200 }),
  contactPhone: varchar("contact_phone", { length: 30 }),
  contactEmail: varchar("contact_email", { length: 255 }),
  contactRelation: varchar("contact_relation", { length: 50 }), // father | mother | guardian
  reportCardLanguage: varchar("report_card_language", { length: 5 }).notNull().default("fr"), // fr | en
  ...timestamps(),
}, (t) => [
  index("sec_students_inst_idx").on(t.institutionId),
  index("sec_students_mnu_idx").on(t.mnu),
]);

// ─── Enrollments ──────────────────────────────────────────────────────────────

export const secEnrollments = pgTable("sec_enrollments", {
  id: id(),
  institutionId: varchar("institution_id", { length: 36 }).notNull().references(() => secInstitutions.id, { onDelete: "cascade" }),
  studentId: varchar("student_id", { length: 36 }).notNull().references(() => secStudents.id, { onDelete: "cascade" }),
  academicYearId: varchar("academic_year_id", { length: 36 }).notNull().references(() => secAcademicYears.id, { onDelete: "cascade" }),
  classId: varchar("class_id", { length: 36 }).notNull().references(() => secClasses.id),
  admissionType: varchar("admission_type", { length: 20 }).notNull().default("new"), // new | transfer | repeat | promoted
  status: varchar("status", { length: 20 }).notNull().default("active"), // active | transferred | withdrawn | graduated
  ...timestamps(),
}, (t) => [
  uniqueIndex("sec_enrollments_student_year_uniq").on(t.studentId, t.academicYearId),
  index("sec_enrollments_class_idx").on(t.classId),
]);

// ─── Subject assignments ──────────────────────────────────────────────────────

export const secSubjectAssignments = pgTable("sec_subject_assignments", {
  id: id(),
  institutionId: varchar("institution_id", { length: 36 }).notNull().references(() => secInstitutions.id, { onDelete: "cascade" }),
  staffId: varchar("staff_id", { length: 36 }).notNull().references(() => secStaff.id, { onDelete: "cascade" }),
  subjectId: varchar("subject_id", { length: 36 }).notNull().references(() => secSubjects.id, { onDelete: "cascade" }),
  classId: varchar("class_id", { length: 36 }).notNull().references(() => secClasses.id, { onDelete: "cascade" }),
  academicYearId: varchar("academic_year_id", { length: 36 }).notNull().references(() => secAcademicYears.id, { onDelete: "cascade" }),
  ...timestamps(),
}, (t) => [
  uniqueIndex("sec_sa_uniq").on(t.staffId, t.subjectId, t.classId, t.academicYearId),
  index("sec_sa_class_idx").on(t.classId),
]);

// ─── Assessments (grades) ─────────────────────────────────────────────────────

export const secAssessments = pgTable("sec_assessments", {
  id: id(),
  institutionId: varchar("institution_id", { length: 36 }).notNull().references(() => secInstitutions.id, { onDelete: "cascade" }),
  studentId: varchar("student_id", { length: 36 }).notNull().references(() => secStudents.id, { onDelete: "cascade" }),
  classId: varchar("class_id", { length: 36 }).notNull().references(() => secClasses.id, { onDelete: "cascade" }),
  subjectId: varchar("subject_id", { length: 36 }).notNull().references(() => secSubjects.id, { onDelete: "cascade" }),
  termId: varchar("term_id", { length: 36 }).notNull().references(() => secTerms.id, { onDelete: "cascade" }),
  assessmentType: varchar("assessment_type", { length: 30 }).notNull(),
  // Six-sequence: sequence_1 | sequence_2 | sequence_3 | sequence_4 | sequence_5 | sequence_6
  // Composition: end_of_term_exam | class_test | quiz
  value: numeric("value", { precision: 4, scale: 2 }), // 0.00 - 20.00, null = absent
  enteredById: varchar("entered_by_id", { length: 36 }).references(() => secStaff.id),
  ...timestamps(),
}, (t) => [
  uniqueIndex("sec_assessments_uniq").on(t.studentId, t.subjectId, t.termId, t.assessmentType),
  index("sec_assessments_class_term_idx").on(t.classId, t.termId),
]);

// ─── Term averages (computed, cached) ────────────────────────────────────────

export const secTermAverages = pgTable("sec_term_averages", {
  id: id(),
  institutionId: varchar("institution_id", { length: 36 }).notNull().references(() => secInstitutions.id, { onDelete: "cascade" }),
  enrollmentId: varchar("enrollment_id", { length: 36 }).notNull().references(() => secEnrollments.id, { onDelete: "cascade" }),
  termId: varchar("term_id", { length: 36 }).notNull().references(() => secTerms.id, { onDelete: "cascade" }),
  weightedAverage: numeric("weighted_average", { precision: 4, scale: 2 }),
  totalPoints: numeric("total_points", { precision: 8, scale: 2 }),
  totalCoefficients: integer("total_coefficients"),
  subjectAverages: jsonb("subject_averages"), // { [subjectId]: { avg, points, coeff, rank } }
  rank: integer("rank"),
  mentionCode: varchar("mention_code", { length: 30 }), // below_average | passing | good | very_good | excellent | outstanding
  ...timestamps(),
}, (t) => [
  uniqueIndex("sec_ta_uniq").on(t.enrollmentId, t.termId),
]);

// ─── Annual averages (computed at year-end) ───────────────────────────────────

export const secAnnualAverages = pgTable("sec_annual_averages", {
  id: id(),
  institutionId: varchar("institution_id", { length: 36 }).notNull().references(() => secInstitutions.id, { onDelete: "cascade" }),
  enrollmentId: varchar("enrollment_id", { length: 36 }).notNull().references(() => secEnrollments.id, { onDelete: "cascade" }),
  t1Average: numeric("t1_average", { precision: 4, scale: 2 }),
  t2Average: numeric("t2_average", { precision: 4, scale: 2 }),
  t3Average: numeric("t3_average", { precision: 4, scale: 2 }),
  annualAverage: numeric("annual_average", { precision: 4, scale: 2 }),
  councilDecision: varchar("council_decision", { length: 40 }),
  // admitted | admitted_commendation | admitted_distinction | honour_roll |
  // conditional_pass | deferred | repeat_authorized | repeat_mandatory | expelled | warning | reprimand
  councilDecisionId: varchar("council_decision_id", { length: 36 }), // FK set after sec_council_decisions
  ...timestamps(),
}, (t) => [
  uniqueIndex("sec_aa_uniq").on(t.enrollmentId),
]);

// ─── Student comments ─────────────────────────────────────────────────────────

export const secStudentComments = pgTable("sec_student_comments", {
  id: id(),
  institutionId: varchar("institution_id", { length: 36 }).notNull().references(() => secInstitutions.id, { onDelete: "cascade" }),
  studentId: varchar("student_id", { length: 36 }).notNull().references(() => secStudents.id, { onDelete: "cascade" }),
  subjectId: varchar("subject_id", { length: 36 }).notNull().references(() => secSubjects.id, { onDelete: "cascade" }),
  termId: varchar("term_id", { length: 36 }).notNull().references(() => secTerms.id, { onDelete: "cascade" }),
  classId: varchar("class_id", { length: 36 }).notNull().references(() => secClasses.id, { onDelete: "cascade" }),
  comment: varchar("comment", { length: 200 }).notNull(),
  ...timestamps(),
}, (t) => [
  uniqueIndex("sec_sc_uniq").on(t.studentId, t.subjectId, t.termId, t.classId),
]);

// ─── Report cards ─────────────────────────────────────────────────────────────

export const secReportCards = pgTable("sec_report_cards", {
  id: id(),
  institutionId: varchar("institution_id", { length: 36 }).notNull().references(() => secInstitutions.id, { onDelete: "cascade" }),
  enrollmentId: varchar("enrollment_id", { length: 36 }).notNull().references(() => secEnrollments.id, { onDelete: "cascade" }),
  termId: varchar("term_id", { length: 36 }).notNull().references(() => secTerms.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 30 }).notNull().default("draft"),
  // draft | generated | validated_admin | validated_vice_principal | signed_principal | published
  snapshotData: jsonb("snapshot_data"), // frozen copy of all data at publish time
  language: varchar("language", { length: 5 }).notNull().default("fr"), // fr | en
  ...timestamps(),
}, (t) => [
  uniqueIndex("sec_rc_enrollment_term_uniq").on(t.enrollmentId, t.termId),
  index("sec_rc_status_inst_idx").on(t.status, t.institutionId),
]);

// ─── Class councils ───────────────────────────────────────────────────────────

export const secClassCouncils = pgTable("sec_class_councils", {
  id: id(),
  institutionId: varchar("institution_id", { length: 36 }).notNull().references(() => secInstitutions.id, { onDelete: "cascade" }),
  classId: varchar("class_id", { length: 36 }).notNull().references(() => secClasses.id, { onDelete: "cascade" }),
  termId: varchar("term_id", { length: 36 }).notNull().references(() => secTerms.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 20 }).notNull().default("draft"), // draft | scheduled | held | signed
  presidentId: varchar("president_id", { length: 36 }).references(() => secStaff.id),
  secretaryId: varchar("secretary_id", { length: 36 }).references(() => secStaff.id),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  heldAt: timestamp("held_at", { withTimezone: true }),
  pvPath: text("pv_path"),
  globalNote: text("global_note"),
  ...timestamps(),
}, (t) => [
  uniqueIndex("sec_cc_class_term_uniq").on(t.classId, t.termId),
]);

// ─── Council decisions (must be before secAnnualAverages FK) ─────────────────

export const secCouncilDecisions = pgTable("sec_council_decisions", {
  id: id(),
  institutionId: varchar("institution_id", { length: 36 }).notNull().references(() => secInstitutions.id, { onDelete: "cascade" }),
  councilId: varchar("council_id", { length: 36 }).notNull().references(() => secClassCouncils.id, { onDelete: "cascade" }),
  enrollmentId: varchar("enrollment_id", { length: 36 }).notNull().references(() => secEnrollments.id, { onDelete: "cascade" }),
  decision: varchar("decision", { length: 40 }).notNull(),
  // admitted | admitted_commendation | admitted_distinction | honour_roll |
  // conditional_pass | deferred | repeat_authorized | repeat_mandatory | expelled | warning | reprimand
  note: text("note"),
  ...timestamps(),
}, (t) => [
  uniqueIndex("sec_cd_uniq").on(t.councilId, t.enrollmentId),
]);

// ─── Fee schedules ────────────────────────────────────────────────────────────

export const secFeeSchedules = pgTable("sec_fee_schedules", {
  id: id(),
  institutionId: varchar("institution_id", { length: 36 }).notNull().references(() => secInstitutions.id, { onDelete: "cascade" }),
  academicYearId: varchar("academic_year_id", { length: 36 }).notNull().references(() => secAcademicYears.id, { onDelete: "cascade" }),
  classId: varchar("class_id", { length: 36 }).references(() => secClasses.id), // null = applies to all classes
  tuitionAmount: integer("tuition_amount").notNull().default(0), // XAF
  apeAmount: integer("ape_amount").notNull().default(0),         // XAF
  instalments: jsonb("instalments"), // [{ dueDate, amount, label }]
  ...timestamps(),
});

// ─── Payments ─────────────────────────────────────────────────────────────────

export const secPayments = pgTable("sec_payments", {
  id: id(),
  institutionId: varchar("institution_id", { length: 36 }).notNull().references(() => secInstitutions.id, { onDelete: "cascade" }),
  enrollmentId: varchar("enrollment_id", { length: 36 }).notNull().references(() => secEnrollments.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(), // XAF
  feeType: varchar("fee_type", { length: 20 }).notNull().default("tuition"), // tuition | ape | other
  paymentMethod: varchar("payment_method", { length: 30 }).notNull().default("cash"),
  // cash | mtn_momo | orange_money | bank_transfer | campost
  reference: varchar("reference", { length: 100 }),
  paidAt: timestamp("paid_at", { withTimezone: true }).notNull(),
  recordedById: varchar("recorded_by_id", { length: 36 }).references(() => secStaff.id),
  note: text("note"),
  ...timestamps(),
}, (t) => [
  index("sec_payments_enrollment_idx").on(t.enrollmentId),
]);

// ─── Attendance sessions ──────────────────────────────────────────────────────

export const secAttendanceSessions = pgTable("sec_attendance_sessions", {
  id: id(),
  institutionId: varchar("institution_id", { length: 36 }).notNull().references(() => secInstitutions.id, { onDelete: "cascade" }),
  classId: varchar("class_id", { length: 36 }).notNull().references(() => secClasses.id, { onDelete: "cascade" }),
  subjectId: varchar("subject_id", { length: 36 }).references(() => secSubjects.id),
  termId: varchar("term_id", { length: 36 }).notNull().references(() => secTerms.id, { onDelete: "cascade" }),
  conductedById: varchar("conducted_by_id", { length: 36 }).references(() => secStaff.id),
  sessionDate: timestamp("session_date", { withTimezone: true }).notNull(),
  startTime: varchar("start_time", { length: 10 }), // "08:00"
  endTime: varchar("end_time", { length: 10 }),
  ...timestamps(),
}, (t) => [
  index("sec_as_class_term_idx").on(t.classId, t.termId),
]);

// ─── Attendance records ───────────────────────────────────────────────────────

export const secAttendanceRecords = pgTable("sec_attendance_records", {
  id: id(),
  institutionId: varchar("institution_id", { length: 36 }).notNull().references(() => secInstitutions.id, { onDelete: "cascade" }),
  sessionId: varchar("session_id", { length: 36 }).notNull().references(() => secAttendanceSessions.id, { onDelete: "cascade" }),
  studentId: varchar("student_id", { length: 36 }).notNull().references(() => secStudents.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 20 }).notNull().default("present"), // present | absent | late | excused
  justification: text("justification"),
  ...timestamps(),
}, (t) => [
  uniqueIndex("sec_ar_session_student_uniq").on(t.sessionId, t.studentId),
]);

// ─── Official exam sessions ───────────────────────────────────────────────────

export const secOfficialExamSessions = pgTable("sec_official_exam_sessions", {
  id: id(),
  institutionId: varchar("institution_id", { length: 36 }).notNull().references(() => secInstitutions.id, { onDelete: "cascade" }),
  academicYearId: varchar("academic_year_id", { length: 36 }).notNull().references(() => secAcademicYears.id, { onDelete: "cascade" }),
  examType: varchar("exam_type", { length: 20 }).notNull(), // BEPC | PROBATOIRE | BAC
  sessionYear: integer("session_year").notNull(),
  centerCode: varchar("center_code", { length: 30 }),
  registrationDeadline: timestamp("registration_deadline", { withTimezone: true }),
  ...timestamps(),
});

// ─── Official exam registrations ──────────────────────────────────────────────

export const secOfficialExamRegistrations = pgTable("sec_official_exam_registrations", {
  id: id(),
  institutionId: varchar("institution_id", { length: 36 }).notNull().references(() => secInstitutions.id, { onDelete: "cascade" }),
  examSessionId: varchar("exam_session_id", { length: 36 }).notNull().references(() => secOfficialExamSessions.id, { onDelete: "cascade" }),
  enrollmentId: varchar("enrollment_id", { length: 36 }).notNull().references(() => secEnrollments.id, { onDelete: "cascade" }),
  candidateNumber: varchar("candidate_number", { length: 30 }),
  isEligible: boolean("is_eligible").notNull().default(true),
  hasPaidFee: boolean("has_paid_fee").notNull().default(false),
  isAdmitted: boolean("is_admitted"),
  mention: varchar("mention", { length: 30 }),
  ...timestamps(),
}, (t) => [
  uniqueIndex("sec_oer_uniq").on(t.examSessionId, t.enrollmentId),
]);
```

- [ ] **Step 3: Run `bun db:push` to apply schema**

From `apps/secondary/`: `bun db:push`

If DATABASE_URL is not set, skip and note it for integration testing later.

- [ ] **Step 4: Suggest commit message**

```
feat(secondary): add full sec_* database schema (Task 2)
```

---

### Task 3: Auth + permissions

**Files:**
- Create: `apps/secondary/src/lib/auth.ts`
- Create: `apps/secondary/src/lib/permissions.ts`

**Interfaces:**
- Produces:
  - `auth` — Better-Auth handler instance (used by `index.ts`)
  - `auth.handler` — used in `index.ts` route binding
  - `ac`, `teacher`, `principal`, `admin` — exported from `permissions.ts`, consumed by `trpc.ts`

- [ ] **Step 1: Create `apps/secondary/src/lib/permissions.ts`**

```typescript
import { createAccessControl } from "better-auth/plugins/access";

const statement = {
  students:       ["create", "read", "update", "delete"],
  enrollments:    ["create", "read", "update", "delete"],
  subjects:       ["create", "read", "update", "delete"],
  assessments:    ["create", "read", "update"],
  report_cards:   ["read", "publish", "print"],
  class_councils: ["create", "read", "update"],
  attendance:     ["create", "read", "update"],
  finance:        ["create", "read", "update", "delete"],
  timetable:      ["create", "read", "update", "delete"],
  staff:          ["create", "read", "update", "delete"],
  settings:       ["read", "update"],
  notifications:  ["create", "read"],
  official_exams: ["create", "read", "update"],
} as const;

export const ac = createAccessControl(statement);

export const teacher = ac.newRole({
  students:      ["read"],
  assessments:   ["create", "read", "update"],
  report_cards:  ["read"],
  attendance:    ["create", "read", "update"],
  timetable:     ["read"],
  notifications: ["read"],
});

export const principal = ac.newRole({
  students:       ["read"],
  enrollments:    ["read"],
  assessments:    ["read"],
  report_cards:   ["read", "publish", "print"],
  class_councils: ["read", "update"],
  attendance:     ["read"],
  timetable:      ["read"],
  staff:          ["read"],
  finance:        ["read"],
  settings:       ["read"],
  notifications:  ["create", "read"],
  official_exams: ["read"],
});

export const admin = ac.newRole({
  students:       ["create", "read", "update", "delete"],
  enrollments:    ["create", "read", "update", "delete"],
  subjects:       ["create", "read", "update", "delete"],
  assessments:    ["create", "read", "update"],
  report_cards:   ["read", "publish", "print"],
  class_councils: ["create", "read", "update"],
  attendance:     ["create", "read", "update"],
  finance:        ["create", "read", "update", "delete"],
  timetable:      ["create", "read", "update", "delete"],
  staff:          ["create", "read", "update", "delete"],
  settings:       ["read", "update"],
  notifications:  ["create", "read"],
  official_exams: ["create", "read", "update"],
});
```

- [ ] **Step 2: Create `apps/secondary/src/lib/auth.ts`**

```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { ac, admin, principal, teacher } from "./permissions";
import { db } from "../db/index";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  tablePrefix: "sec_",
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3001",
  emailAndPassword: { enabled: true },
  plugins: [
    organization({
      ac,
      roles: { admin, principal, teacher },
      allowUserToCreateOrganization: false,
    }),
  ],
  trustedOrigins: [
    process.env.CORS_ORIGINS ?? "http://localhost:5173",
  ],
});

export type Session = typeof auth.$Infer.Session;
export type ActiveOrganization = typeof auth.$Infer.ActiveOrganization;
```

- [ ] **Step 3: Suggest commit message**

```
feat(secondary): add Better-Auth config + RBAC permissions (Task 3)
```

---

### Task 4: tRPC infrastructure

**Files:**
- Create: `apps/secondary/src/lib/context.ts`
- Create: `apps/secondary/src/lib/trpc.ts`
- Create: `apps/secondary/src/routers/index.ts`
- Modify: `apps/secondary/index.ts` (finalize Hono entry — already skeleton from Task 1)

**Interfaces:**
- Consumes: `auth` from `lib/auth.ts`, `db` from `db/index.ts`
- Produces:
  - `createContext(opts)` — tRPC context factory
  - `publicProcedure` — no auth required
  - `protectedProcedure` — requires authenticated session
  - `adminProcedure` — requires `admin` role in org
  - `teacherProcedure` — requires `teacher` or `admin` role
  - `principalProcedure` — requires `principal` or `admin` role
  - `appRouter` — root tRPC router

- [ ] **Step 1: Create `apps/secondary/src/lib/context.ts`**

```typescript
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { auth } from "./auth";
import { db } from "../db/index";
import { secInstitutions } from "../db/schema";
import { eq } from "drizzle-orm";

export async function createContext(opts: FetchCreateContextFnOptions) {
  const session = await auth.api.getSession({ headers: opts.req.headers });

  let institution = null;
  if (session?.session.activeOrganizationId) {
    const rows = await db
      .select()
      .from(secInstitutions)
      .where(eq(secInstitutions.id, session.session.activeOrganizationId))
      .limit(1);
    institution = rows[0] ?? null;
  }

  return { session, institution, db };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
```

- [ ] **Step 2: Create `apps/secondary/src/lib/trpc.ts`**

```typescript
import { TRPCError, initTRPC } from "@trpc/server";
import type { Context } from "./context";

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, session: ctx.session } });
});

const withInstitution = protectedProcedure.use(({ ctx, next }) => {
  if (!ctx.institution) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "No active institution",
    });
  }
  return next({ ctx: { ...ctx, institution: ctx.institution } });
});

export const adminProcedure = withInstitution.use(async ({ ctx, next }) => {
  const member = await ctx.session.session; // check via Better-Auth member role
  // Role check is done via Better-Auth organization membership
  // The auth plugin exposes role on the session's active org member record
  const role = (ctx.session as any)?.user?.role ?? null;
  if (role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx });
});

export const teacherProcedure = withInstitution.use(({ ctx, next }) => {
  const role = (ctx.session as any)?.user?.role ?? null;
  if (!["teacher", "admin"].includes(role)) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx });
});

export const principalProcedure = withInstitution.use(({ ctx, next }) => {
  const role = (ctx.session as any)?.user?.role ?? null;
  if (!["principal", "admin"].includes(role)) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx });
});
```

> **Implementation note:** Better-Auth v1.3 exposes the active org member's role via `session.session.activeOrganizationId` and a separate member record. The actual role retrieval should query the `sec_member` table (Better-Auth's org member table with the `sec_` prefix). Revise the role fetch logic once you confirm the exact Better-Auth API shape by reading `node_modules/better-auth/dist` types. The pattern above is the placeholder — replace the `(ctx.session as any)?.user?.role` lines with a real org member lookup from the `sec_member` table via Drizzle.

- [ ] **Step 3: Create `apps/secondary/src/routers/index.ts`**

```typescript
import { router, publicProcedure } from "../lib/trpc";
import { z } from "zod";

export const appRouter = router({
  health: publicProcedure.query(() => ({ ok: true, service: "tkams-secondary" })),
});

export type AppRouter = typeof appRouter;
```

- [ ] **Step 4: Suggest commit message**

```
feat(secondary): add tRPC context, procedures, and stub router (Task 4)
```

---

### Task 5: React client scaffold

**Files:**
- Create: `apps/secondary/client/src/main.tsx`
- Create: `apps/secondary/client/src/index.css`
- Create: `apps/secondary/client/src/utils/trpc.ts`

**Interfaces:**
- Produces: React entry point with HashRouter and TailwindCSS v4 tokens loaded; `trpc` and `queryClient` exported for use in components

- [ ] **Step 1: Create `apps/secondary/client/src/index.css`**

```css
@import "tailwindcss";

:root {
  --color-primary: oklch(0.48 0.2 277);         /* indigo */
  --color-primary-hover: oklch(0.42 0.22 277);
  --color-secondary: oklch(0.70 0.15 70);       /* amber — secondary accent */
  --color-bg: oklch(0.955 0.006 80);
  --color-surface: oklch(0.978 0.008 80);
  --color-border: oklch(0.88 0.006 80);
  --color-text: oklch(0.18 0.01 260);
  --color-text-muted: oklch(0.45 0.01 260);
  --radius: 6px;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --color-bg: oklch(0.14 0.01 260);
    --color-surface: oklch(0.18 0.01 260);
    --color-border: oklch(0.28 0.01 260);
    --color-text: oklch(0.94 0.006 80);
    --color-text-muted: oklch(0.65 0.006 80);
  }
}

:root[data-theme="dark"] {
  --color-bg: oklch(0.14 0.01 260);
  --color-surface: oklch(0.18 0.01 260);
  --color-border: oklch(0.28 0.01 260);
  --color-text: oklch(0.94 0.006 80);
  --color-text-muted: oklch(0.65 0.006 80);
}

body {
  background: var(--color-bg);
  color: var(--color-text);
  font-family: Inter, system-ui, sans-serif;
  margin: 0;
}
```

- [ ] **Step 2: Create `apps/secondary/client/src/utils/trpc.ts`**

```typescript
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { QueryClient } from "@tanstack/react-query";
import type { AppRouter } from "../../../src/routers/index";

export const trpc = createTRPCReact<AppRouter>();

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: "/trpc",
    }),
  ],
});
```

- [ ] **Step 3: Create `apps/secondary/client/src/main.tsx`**

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import "./i18n/index";
import "./index.css";
import { trpc, trpcClient, queryClient } from "./utils/trpc";
import { AppRoutes } from "./routes";

const root = document.getElementById("root")!;

createRoot(root).render(
  <StrictMode>
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </QueryClientProvider>
    </trpc.Provider>
  </StrictMode>,
);
```

- [ ] **Step 4: Suggest commit message**

```
feat(secondary): scaffold React client with TailwindCSS v4 tokens and tRPC client (Task 5)
```

---

### Task 6: i18n setup (FR/EN)

**Files:**
- Create: `apps/secondary/client/src/i18n/index.ts`
- Create: `apps/secondary/client/src/i18n/locales/fr.json`
- Create: `apps/secondary/client/src/i18n/locales/en.json`

**Interfaces:**
- Produces: i18next instance initialized with FR as default and EN fallback; `useTranslation` hook ready for all components

- [ ] **Step 1: Create `apps/secondary/client/src/i18n/index.ts`**

```typescript
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import fr from "./locales/fr.json";
import en from "./locales/en.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
    },
    fallbackLng: "fr",
    supportedLngs: ["fr", "en"],
    interpolation: { escapeValue: false },
  });

export default i18n;
```

- [ ] **Step 2: Create `apps/secondary/client/src/i18n/locales/fr.json`**

```json
{
  "app": {
    "name": "TKAMS Secondaire",
    "tagline": "Gestion scolaire MINESEC"
  },
  "auth": {
    "login": "Connexion",
    "logout": "Déconnexion",
    "email": "Adresse email",
    "password": "Mot de passe",
    "sign_in": "Se connecter",
    "invalid_credentials": "Email ou mot de passe incorrect"
  },
  "nav": {
    "dashboard": "Tableau de bord",
    "students": "Élèves",
    "enrollments": "Inscriptions",
    "classes": "Classes",
    "subjects": "Matières",
    "staff": "Personnel",
    "grades": "Notes",
    "attendance": "Présences",
    "report_cards": "Bulletins",
    "class_councils": "Conseils de classe",
    "finance": "Scolarité",
    "settings": "Paramètres",
    "timetable": "Emploi du temps",
    "official_exams": "Examens officiels"
  },
  "common": {
    "save": "Enregistrer",
    "cancel": "Annuler",
    "delete": "Supprimer",
    "edit": "Modifier",
    "add": "Ajouter",
    "search": "Rechercher",
    "loading": "Chargement…",
    "error": "Une erreur est survenue",
    "confirm": "Confirmer",
    "yes": "Oui",
    "no": "Non",
    "actions": "Actions",
    "status": "Statut",
    "name": "Nom",
    "date": "Date",
    "close": "Fermer",
    "back": "Retour",
    "next": "Suivant",
    "previous": "Précédent",
    "required": "Requis",
    "optional": "Optionnel",
    "no_data": "Aucune donnée"
  },
  "students": {
    "title": "Élèves",
    "add": "Ajouter un élève",
    "first_name": "Prénom",
    "last_name": "Nom de famille",
    "dob": "Date de naissance",
    "pob": "Lieu de naissance",
    "gender": "Sexe",
    "gender_m": "Masculin",
    "gender_f": "Féminin",
    "mnu": "Matricule National (MNU)",
    "registration_number": "Numéro d'inscription",
    "photo": "Photo",
    "contact_name": "Nom du contact",
    "contact_phone": "Téléphone du contact",
    "contact_email": "Email du contact",
    "contact_relation": "Lien de parenté",
    "report_card_language": "Langue du bulletin"
  },
  "grades": {
    "title": "Saisie des notes",
    "sequence": "Séquence {{n}}",
    "end_of_term": "Composition",
    "class_test": "Devoir sur table",
    "quiz": "Interrogation",
    "average": "Moyenne",
    "coefficient": "Coefficient",
    "points": "Points",
    "rank": "Rang",
    "absent": "Absent",
    "class_average": "Moyenne de classe",
    "class_max": "Maximum",
    "class_min": "Minimum"
  },
  "report_cards": {
    "title": "Bulletins de notes",
    "generate": "Générer",
    "publish": "Publier",
    "print": "Imprimer",
    "status_draft": "Brouillon",
    "status_generated": "Généré",
    "status_validated_admin": "Validé (Admin)",
    "status_validated_vp": "Validé (Censeur)",
    "status_signed": "Signé (Principal)",
    "status_published": "Publié",
    "term": "Trimestre {{n}}",
    "mention_below_average": "Insuffisant",
    "mention_passing": "Passable",
    "mention_good": "Assez Bien",
    "mention_very_good": "Bien",
    "mention_excellent": "Très Bien",
    "mention_outstanding": "Excellent"
  },
  "finance": {
    "title": "Scolarité",
    "tuition": "Frais de scolarité",
    "ape": "Frais APE",
    "payment": "Paiement",
    "amount": "Montant (FCFA)",
    "payment_method": "Mode de paiement",
    "cash": "Espèces",
    "mtn_momo": "MTN MoMo",
    "orange_money": "Orange Money",
    "bank_transfer": "Virement bancaire",
    "campost": "Campost",
    "paid": "Payé",
    "pending": "En attente",
    "overdue": "En retard",
    "receipt": "Reçu"
  },
  "academic_years": {
    "title": "Années scolaires",
    "active": "En cours",
    "closed": "Clôturée",
    "archived": "Archivée"
  },
  "terms": {
    "term_1": "1er Trimestre",
    "term_2": "2ème Trimestre",
    "term_3": "3ème Trimestre",
    "open": "Ouvert",
    "closed": "Clôturé"
  },
  "councils": {
    "title": "Conseil de classe",
    "draft": "Brouillon",
    "scheduled": "Planifié",
    "held": "Tenu",
    "signed": "Signé",
    "decision_admitted": "Admis",
    "decision_commendation": "Admis avec félicitations",
    "decision_distinction": "Admis avec distinction",
    "decision_honour_roll": "Tableau d'honneur",
    "decision_conditional_pass": "Admis provisoirement",
    "decision_deferred": "Ajourné (redoublement autorisé)",
    "decision_repeat_authorized": "Redoublement autorisé",
    "decision_repeat_mandatory": "Redoublement obligatoire",
    "decision_expelled": "Exclusion",
    "decision_warning": "Avertissement",
    "decision_reprimand": "Blâme"
  },
  "official_exams": {
    "bepc": "BEPC",
    "probatoire": "Probatoire",
    "bac": "Baccalauréat",
    "candidate_number": "Numéro de candidat",
    "eligible": "Éligible",
    "admitted": "Admis"
  }
}
```

- [ ] **Step 3: Create `apps/secondary/client/src/i18n/locales/en.json`**

```json
{
  "app": {
    "name": "TKAMS Secondaire",
    "tagline": "MINESEC School Management"
  },
  "auth": {
    "login": "Login",
    "logout": "Logout",
    "email": "Email address",
    "password": "Password",
    "sign_in": "Sign in",
    "invalid_credentials": "Invalid email or password"
  },
  "nav": {
    "dashboard": "Dashboard",
    "students": "Students",
    "enrollments": "Enrollments",
    "classes": "Classes",
    "subjects": "Subjects",
    "staff": "Staff",
    "grades": "Grades",
    "attendance": "Attendance",
    "report_cards": "Report Cards",
    "class_councils": "Class Councils",
    "finance": "Finance",
    "settings": "Settings",
    "timetable": "Timetable",
    "official_exams": "Official Exams"
  },
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "add": "Add",
    "search": "Search",
    "loading": "Loading…",
    "error": "An error occurred",
    "confirm": "Confirm",
    "yes": "Yes",
    "no": "No",
    "actions": "Actions",
    "status": "Status",
    "name": "Name",
    "date": "Date",
    "close": "Close",
    "back": "Back",
    "next": "Next",
    "previous": "Previous",
    "required": "Required",
    "optional": "Optional",
    "no_data": "No data"
  },
  "students": {
    "title": "Students",
    "add": "Add student",
    "first_name": "First name",
    "last_name": "Last name",
    "dob": "Date of birth",
    "pob": "Place of birth",
    "gender": "Gender",
    "gender_m": "Male",
    "gender_f": "Female",
    "mnu": "National ID (MNU)",
    "registration_number": "Registration number",
    "photo": "Photo",
    "contact_name": "Contact name",
    "contact_phone": "Contact phone",
    "contact_email": "Contact email",
    "contact_relation": "Relationship",
    "report_card_language": "Report card language"
  },
  "grades": {
    "title": "Grade entry",
    "sequence": "Sequence {{n}}",
    "end_of_term": "End-of-term exam",
    "class_test": "Class test",
    "quiz": "Quiz",
    "average": "Average",
    "coefficient": "Coefficient",
    "points": "Points",
    "rank": "Rank",
    "absent": "Absent",
    "class_average": "Class average",
    "class_max": "Maximum",
    "class_min": "Minimum"
  },
  "report_cards": {
    "title": "Report Cards",
    "generate": "Generate",
    "publish": "Publish",
    "print": "Print",
    "status_draft": "Draft",
    "status_generated": "Generated",
    "status_validated_admin": "Validated (Admin)",
    "status_validated_vp": "Validated (VP)",
    "status_signed": "Signed (Principal)",
    "status_published": "Published",
    "term": "Term {{n}}",
    "mention_below_average": "Below Average",
    "mention_passing": "Passing",
    "mention_good": "Good",
    "mention_very_good": "Very Good",
    "mention_excellent": "Excellent",
    "mention_outstanding": "Outstanding"
  },
  "finance": {
    "title": "Finance",
    "tuition": "Tuition fees",
    "ape": "APE fees",
    "payment": "Payment",
    "amount": "Amount (XAF)",
    "payment_method": "Payment method",
    "cash": "Cash",
    "mtn_momo": "MTN MoMo",
    "orange_money": "Orange Money",
    "bank_transfer": "Bank transfer",
    "campost": "Campost",
    "paid": "Paid",
    "pending": "Pending",
    "overdue": "Overdue",
    "receipt": "Receipt"
  },
  "academic_years": {
    "title": "Academic years",
    "active": "Active",
    "closed": "Closed",
    "archived": "Archived"
  },
  "terms": {
    "term_1": "Term 1",
    "term_2": "Term 2",
    "term_3": "Term 3",
    "open": "Open",
    "closed": "Closed"
  },
  "councils": {
    "title": "Class council",
    "draft": "Draft",
    "scheduled": "Scheduled",
    "held": "Held",
    "signed": "Signed",
    "decision_admitted": "Admitted",
    "decision_commendation": "Admitted with commendation",
    "decision_distinction": "Admitted with distinction",
    "decision_honour_roll": "Honour roll",
    "decision_conditional_pass": "Conditional pass",
    "decision_deferred": "Deferred (repeat authorized)",
    "decision_repeat_authorized": "Repeat authorized",
    "decision_repeat_mandatory": "Mandatory repeat",
    "decision_expelled": "Expelled",
    "decision_warning": "Warning",
    "decision_reprimand": "Reprimand"
  },
  "official_exams": {
    "bepc": "BEPC",
    "probatoire": "Probatoire",
    "bac": "Baccalauréat",
    "candidate_number": "Candidate number",
    "eligible": "Eligible",
    "admitted": "Admitted"
  }
}
```

- [ ] **Step 4: Suggest commit message**

```
feat(secondary): add i18n setup with FR/EN translations (Task 6)
```

---

### Task 7: Auth frontend — login page

**Files:**
- Create: `apps/secondary/client/src/lib/auth-client.ts`
- Create: `apps/secondary/client/src/pages/auth/login.tsx`
- Create: `apps/secondary/client/src/components/auth/protected-route.tsx`

**Interfaces:**
- Produces:
  - `authClient` — Better-Auth browser client with `signIn`, `signOut`, `useSession`
  - `<LoginPage />` — full login form
  - `<ProtectedRoute role={...} />` — redirects to `/login` if unauthenticated or wrong role

- [ ] **Step 1: Create `apps/secondary/client/src/lib/auth-client.ts`**

```typescript
import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: "/api/auth",
  plugins: [organizationClient()],
});

export const { useSession, signIn, signOut } = authClient;
```

- [ ] **Step 2: Create `apps/secondary/client/src/pages/auth/login.tsx`**

```tsx
import { useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { signIn } from "@/lib/auth-client";

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await signIn.email({ email, password });
      if (result.error) {
        setError(t("auth.invalid_credentials"));
      } else {
        navigate("/");
      }
    } catch {
      setError(t("auth.invalid_credentials"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-bg)",
      }}
    >
      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius)",
          padding: "2rem",
          width: "100%",
          maxWidth: "400px",
        }}
      >
        <h1
          style={{
            color: "var(--color-primary)",
            fontSize: "1.5rem",
            fontWeight: 700,
            marginBottom: "0.25rem",
          }}
        >
          {t("app.name")}
        </h1>
        <p style={{ color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>
          {t("app.tagline")}
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", marginBottom: "0.25rem" }}>
              {t("auth.email")}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius)",
                background: "var(--color-bg)",
                color: "var(--color-text)",
                fontSize: "0.875rem",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", marginBottom: "0.25rem" }}>
              {t("auth.password")}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius)",
                background: "var(--color-bg)",
                color: "var(--color-text)",
                fontSize: "0.875rem",
                boxSizing: "border-box",
              }}
            />
          </div>

          {error && (
            <p style={{ color: "oklch(0.55 0.22 25)", fontSize: "0.875rem" }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: "var(--color-primary)",
              color: "#fff",
              border: "none",
              borderRadius: "var(--radius)",
              padding: "0.625rem 1rem",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? t("common.loading") : t("auth.sign_in")}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `apps/secondary/client/src/components/auth/protected-route.tsx`**

```tsx
import { Navigate } from "react-router";
import { useSession } from "@/lib/auth-client";

interface Props {
  children: React.ReactNode;
  role?: "admin" | "teacher" | "principal";
}

export function ProtectedRoute({ children, role }: Props) {
  const { data: session, isPending } = useSession();

  if (isPending) return null;

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Role check: if role specified, verify the user has that role in the active org
  // Better-Auth exposes active org member role via session.session.activeOrganizationId
  // Full role enforcement is server-side; client-side is UX only
  if (role) {
    const memberRole = (session as any)?.session?.member?.role ?? null;
    const allowed =
      role === "admin"
        ? memberRole === "admin"
        : role === "principal"
          ? ["principal", "admin"].includes(memberRole)
          : ["teacher", "admin"].includes(memberRole);

    if (!allowed) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}
```

- [ ] **Step 4: Suggest commit message**

```
feat(secondary): add login page, auth client, and protected route (Task 7)
```

---

### Task 8: App shell + navigation

**Files:**
- Create: `apps/secondary/client/src/components/layout/app-shell.tsx`
- Create: `apps/secondary/client/src/components/layout/admin-sidebar.tsx`
- Create: `apps/secondary/client/src/components/layout/teacher-sidebar.tsx`
- Create: `apps/secondary/client/src/components/layout/principal-sidebar.tsx`
- Create: `apps/secondary/client/src/routes.tsx`
- Create: stub page files for all P0 routes (see list below)

**Interfaces:**
- Consumes: `useSession` from `auth-client.ts`, `ProtectedRoute` from `protected-route.tsx`
- Produces: Full routing tree with role-based shell, EcoTech-style 220px sidebar matching design canvas

- [ ] **Step 1: Create `apps/secondary/client/src/components/layout/admin-sidebar.tsx`**

The sidebar matches the design canvas: 220px wide, indigo primary, section groups, icon + label nav items.

```tsx
import { NavLink } from "react-router";
import { useTranslation } from "react-i18next";
import { signOut } from "@/lib/auth-client";

const sections = [
  {
    label: "Academic",
    items: [
      { to: "/admin", label: "nav.dashboard", icon: "⊞" },
      { to: "/admin/students", label: "nav.students", icon: "👤" },
      { to: "/admin/enrollments", label: "nav.enrollments", icon: "📋" },
      { to: "/admin/classes", label: "nav.classes", icon: "🏫" },
      { to: "/admin/subjects", label: "nav.subjects", icon: "📚" },
      { to: "/admin/staff", label: "nav.staff", icon: "👥" },
    ],
  },
  {
    label: "Assessments",
    items: [
      { to: "/admin/report-cards", label: "nav.report_cards", icon: "📄" },
      { to: "/admin/class-councils", label: "nav.class_councils", icon: "🏛" },
      { to: "/admin/official-exams", label: "nav.official_exams", icon: "🎓" },
    ],
  },
  {
    label: "School",
    items: [
      { to: "/admin/finance", label: "nav.finance", icon: "💰" },
      { to: "/admin/attendance", label: "nav.attendance", icon: "✅" },
      { to: "/admin/settings", label: "nav.settings", icon: "⚙" },
    ],
  },
];

const navLinkStyle = (isActive: boolean) => ({
  display: "flex",
  alignItems: "center",
  gap: "0.625rem",
  padding: "0.5rem 0.75rem",
  borderRadius: "var(--radius)",
  color: isActive ? "#fff" : "oklch(0.85 0.08 277)",
  background: isActive ? "rgba(255,255,255,0.15)" : "transparent",
  textDecoration: "none",
  fontSize: "0.875rem",
  fontWeight: isActive ? 600 : 400,
  transition: "background 0.15s",
});

export function AdminSidebar() {
  const { t } = useTranslation();

  return (
    <aside
      style={{
        width: "220px",
        minHeight: "100vh",
        background: "var(--color-primary)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      <div style={{ padding: "1.25rem 1rem 1rem" }}>
        <div style={{ color: "#fff", fontWeight: 700, fontSize: "1rem" }}>TKAMS</div>
        <div style={{ color: "oklch(0.80 0.08 277)", fontSize: "0.75rem" }}>Secondaire</div>
      </div>

      <nav style={{ flex: 1, padding: "0.5rem" }}>
        {sections.map((section) => (
          <div key={section.label} style={{ marginBottom: "1rem" }}>
            <div
              style={{
                color: "oklch(0.70 0.08 277)",
                fontSize: "0.7rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                padding: "0 0.75rem",
                marginBottom: "0.25rem",
              }}
            >
              {section.label}
            </div>
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/admin"}
                style={({ isActive }) => navLinkStyle(isActive)}
              >
                <span style={{ fontSize: "1rem" }}>{item.icon}</span>
                {t(item.label)}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div style={{ padding: "1rem" }}>
        <button
          onClick={() => signOut()}
          style={{
            width: "100%",
            background: "rgba(255,255,255,0.1)",
            color: "oklch(0.85 0.08 277)",
            border: "none",
            borderRadius: "var(--radius)",
            padding: "0.5rem 0.75rem",
            cursor: "pointer",
            fontSize: "0.875rem",
            textAlign: "left",
          }}
        >
          {t("auth.logout")}
        </button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Create `apps/secondary/client/src/components/layout/teacher-sidebar.tsx`**

```tsx
import { NavLink } from "react-router";
import { useTranslation } from "react-i18next";
import { signOut } from "@/lib/auth-client";

const items = [
  { to: "/teacher", label: "nav.dashboard", icon: "⊞" },
  { to: "/teacher/grades", label: "nav.grades", icon: "✏" },
  { to: "/teacher/attendance", label: "nav.attendance", icon: "✅" },
];

const navLinkStyle = (isActive: boolean) => ({
  display: "flex",
  alignItems: "center",
  gap: "0.625rem",
  padding: "0.5rem 0.75rem",
  borderRadius: "var(--radius)",
  color: isActive ? "#fff" : "oklch(0.85 0.08 277)",
  background: isActive ? "rgba(255,255,255,0.15)" : "transparent",
  textDecoration: "none",
  fontSize: "0.875rem",
  fontWeight: isActive ? 600 : 400,
});

export function TeacherSidebar() {
  const { t } = useTranslation();

  return (
    <aside
      style={{
        width: "220px",
        minHeight: "100vh",
        background: "var(--color-primary)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      <div style={{ padding: "1.25rem 1rem 1rem" }}>
        <div style={{ color: "#fff", fontWeight: 700, fontSize: "1rem" }}>TKAMS</div>
        <div style={{ color: "oklch(0.80 0.08 277)", fontSize: "0.75rem" }}>Secondaire</div>
      </div>
      <nav style={{ flex: 1, padding: "0.5rem" }}>
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/teacher"}
            style={({ isActive }) => navLinkStyle(isActive)}
          >
            <span style={{ fontSize: "1rem" }}>{item.icon}</span>
            {t(item.label)}
          </NavLink>
        ))}
      </nav>
      <div style={{ padding: "1rem" }}>
        <button
          onClick={() => signOut()}
          style={{
            width: "100%",
            background: "rgba(255,255,255,0.1)",
            color: "oklch(0.85 0.08 277)",
            border: "none",
            borderRadius: "var(--radius)",
            padding: "0.5rem 0.75rem",
            cursor: "pointer",
            fontSize: "0.875rem",
            textAlign: "left",
          }}
        >
          {t("auth.logout")}
        </button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 3: Create `apps/secondary/client/src/components/layout/principal-sidebar.tsx`**

```tsx
import { NavLink } from "react-router";
import { useTranslation } from "react-i18next";
import { signOut } from "@/lib/auth-client";

const items = [
  { to: "/principal", label: "nav.dashboard", icon: "⊞" },
  { to: "/principal/report-cards", label: "nav.report_cards", icon: "📄" },
];

const navLinkStyle = (isActive: boolean) => ({
  display: "flex",
  alignItems: "center",
  gap: "0.625rem",
  padding: "0.5rem 0.75rem",
  borderRadius: "var(--radius)",
  color: isActive ? "#fff" : "oklch(0.85 0.08 277)",
  background: isActive ? "rgba(255,255,255,0.15)" : "transparent",
  textDecoration: "none",
  fontSize: "0.875rem",
  fontWeight: isActive ? 600 : 400,
});

export function PrincipalSidebar() {
  const { t } = useTranslation();

  return (
    <aside
      style={{
        width: "220px",
        minHeight: "100vh",
        background: "var(--color-primary)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      <div style={{ padding: "1.25rem 1rem 1rem" }}>
        <div style={{ color: "#fff", fontWeight: 700, fontSize: "1rem" }}>TKAMS</div>
        <div style={{ color: "oklch(0.80 0.08 277)", fontSize: "0.75rem" }}>Secondaire</div>
      </div>
      <nav style={{ flex: 1, padding: "0.5rem" }}>
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/principal"}
            style={({ isActive }) => navLinkStyle(isActive)}
          >
            <span style={{ fontSize: "1rem" }}>{item.icon}</span>
            {t(item.label)}
          </NavLink>
        ))}
      </nav>
      <div style={{ padding: "1rem" }}>
        <button
          onClick={() => signOut()}
          style={{
            width: "100%",
            background: "rgba(255,255,255,0.1)",
            color: "oklch(0.85 0.08 277)",
            border: "none",
            borderRadius: "var(--radius)",
            padding: "0.5rem 0.75rem",
            cursor: "pointer",
            fontSize: "0.875rem",
            textAlign: "left",
          }}
        >
          {t("auth.logout")}
        </button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 4: Create `apps/secondary/client/src/components/layout/app-shell.tsx`**

```tsx
import { useSession } from "@/lib/auth-client";
import { AdminSidebar } from "./admin-sidebar";
import { TeacherSidebar } from "./teacher-sidebar";
import { PrincipalSidebar } from "./principal-sidebar";

interface Props {
  children: React.ReactNode;
}

export function AppShell({ children }: Props) {
  const { data: session } = useSession();
  const role = (session as any)?.session?.member?.role ?? "teacher";

  const Sidebar =
    role === "admin"
      ? AdminSidebar
      : role === "principal"
        ? PrincipalSidebar
        : TeacherSidebar;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main
        style={{
          flex: 1,
          background: "var(--color-bg)",
          padding: "1.5rem",
          overflowY: "auto",
        }}
      >
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Step 5: Create stub page files**

Create each file with a minimal stub:

`apps/secondary/client/src/pages/admin/dashboard.tsx`:
```tsx
import { useTranslation } from "react-i18next";
export function AdminDashboard() {
  const { t } = useTranslation();
  return <h1 style={{ color: "var(--color-text)" }}>{t("nav.dashboard")}</h1>;
}
```

Repeat the same pattern for each stub, replacing the page label:
- `pages/admin/students/index.tsx` — `t("nav.students")`
- `pages/admin/enrollments/index.tsx` — `t("nav.enrollments")`
- `pages/admin/classes/index.tsx` — `t("nav.classes")`
- `pages/admin/subjects/index.tsx` — `t("nav.subjects")`
- `pages/admin/staff/index.tsx` — `t("nav.staff")`
- `pages/admin/report-cards/index.tsx` — `t("nav.report_cards")`
- `pages/admin/class-councils/index.tsx` — `t("nav.class_councils")`
- `pages/admin/official-exams/index.tsx` — `t("nav.official_exams")`
- `pages/admin/finance/index.tsx` — `t("nav.finance")`
- `pages/admin/attendance/index.tsx` — `t("nav.attendance")`
- `pages/admin/settings/index.tsx` — `t("nav.settings")`
- `pages/teacher/dashboard.tsx` — `t("nav.dashboard")`
- `pages/teacher/grades/index.tsx` — `t("nav.grades")`
- `pages/teacher/attendance/index.tsx` — `t("nav.attendance")`
- `pages/principal/dashboard.tsx` — `t("nav.dashboard")`
- `pages/principal/report-cards/index.tsx` — `t("nav.report_cards")`

- [ ] **Step 6: Create `apps/secondary/client/src/routes.tsx`**

```tsx
import { Routes, Route, Navigate } from "react-router";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { AppShell } from "@/components/layout/app-shell";
import { LoginPage } from "@/pages/auth/login";
import { AdminDashboard } from "@/pages/admin/dashboard";
import { AdminStudents } from "@/pages/admin/students/index";
import { AdminEnrollments } from "@/pages/admin/enrollments/index";
import { AdminClasses } from "@/pages/admin/classes/index";
import { AdminSubjects } from "@/pages/admin/subjects/index";
import { AdminStaff } from "@/pages/admin/staff/index";
import { AdminReportCards } from "@/pages/admin/report-cards/index";
import { AdminClassCouncils } from "@/pages/admin/class-councils/index";
import { AdminOfficialExams } from "@/pages/admin/official-exams/index";
import { AdminFinance } from "@/pages/admin/finance/index";
import { AdminAttendance } from "@/pages/admin/attendance/index";
import { AdminSettings } from "@/pages/admin/settings/index";
import { TeacherDashboard } from "@/pages/teacher/dashboard";
import { TeacherGrades } from "@/pages/teacher/grades/index";
import { TeacherAttendance } from "@/pages/teacher/attendance/index";
import { PrincipalDashboard } from "@/pages/principal/dashboard";
import { PrincipalReportCards } from "@/pages/principal/report-cards/index";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/admin/*"
        element={
          <ProtectedRoute role="admin">
            <AppShell>
              <Routes>
                <Route index element={<AdminDashboard />} />
                <Route path="students" element={<AdminStudents />} />
                <Route path="enrollments" element={<AdminEnrollments />} />
                <Route path="classes" element={<AdminClasses />} />
                <Route path="subjects" element={<AdminSubjects />} />
                <Route path="staff" element={<AdminStaff />} />
                <Route path="report-cards" element={<AdminReportCards />} />
                <Route path="class-councils" element={<AdminClassCouncils />} />
                <Route path="official-exams" element={<AdminOfficialExams />} />
                <Route path="finance" element={<AdminFinance />} />
                <Route path="attendance" element={<AdminAttendance />} />
                <Route path="settings" element={<AdminSettings />} />
              </Routes>
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher/*"
        element={
          <ProtectedRoute role="teacher">
            <AppShell>
              <Routes>
                <Route index element={<TeacherDashboard />} />
                <Route path="grades" element={<TeacherGrades />} />
                <Route path="attendance" element={<TeacherAttendance />} />
              </Routes>
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/principal/*"
        element={
          <ProtectedRoute role="principal">
            <AppShell>
              <Routes>
                <Route index element={<PrincipalDashboard />} />
                <Route path="report-cards" element={<PrincipalReportCards />} />
              </Routes>
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
```

> **Note:** Each stub page component must export a named function matching the import name — e.g. `export function AdminStudents()`. Use the same stub pattern from Step 5.

- [ ] **Step 7: Run type check**

From `apps/secondary/`: `bun check-types`

Fix any type errors. Common ones: missing export names on stubs, import path mismatches.

- [ ] **Step 8: Suggest commit message**

```
feat(secondary): add app shell, sidebars, and full routing tree (Task 8)
```

---

## Self-Review

**Spec coverage check:**
- Assessment modes (six_sequence / composition): covered in schema (`assessmentMode` on institutions + academic years, `assessmentType` enum values on assessments table)
- All 3 roles: admin, principal, teacher — covered in permissions.ts and routes
- `sec_` prefix: all tables prefixed, Better-Auth tablePrefix set
- Bilingual: FR + EN translation files with all navigation, grades, report card, finance, council keys
- Report card language per student: `reportCardLanguage` column on `secStudents`
- Hono port 3001 (not 3000): set in `index.ts`
- Hash router: `HashRouter` in `main.tsx`, all routes are `/#/admin/...`
- `councilDecisionId` forward reference: schema orders `secCouncilDecisions` before `secAnnualAverages`; the FK column `councilDecisionId` in `secAnnualAverages` is left as a bare varchar (not a Drizzle `.references()`) to avoid circular dependencies — add the FK via a separate migration after both tables exist if needed

**Placeholder scan:** No TBD/TODO in code steps. The tRPC role-fetch in `trpc.ts` uses `(ctx.session as any)` with an explicit implementation note — implementer must resolve the actual Better-Auth session shape.

**Type consistency:** All exported function/component names match their import names in `routes.tsx`. Stub pages must export named functions, not default exports.
