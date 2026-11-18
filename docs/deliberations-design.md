# Deliberations module design

## Overview

The **Deliberations** module manages the official process by which an academic jury reviews a class's results for a semester or an academic year, makes individual decisions for each student, and produces an official report (PV).

This module is directly inspired by the existing **Promotion Rules** module (same 3-layer architecture, same evaluate → execute pattern, same audit trail), but covers a broader scope:

```
Promotions: Evaluates rules → moves students between classes
Deliberations: Reviews results → makes official decisions → generates PVs → feeds DIPLOMATION
```

### Position in the overall workflow

```
Grades entered → Exams approved/locked
                        ↓
              Deliberation opened (jury formed)
                        ↓
              Automatic computation of results (facts)
                        ↓
              Jury reviews, adjusts the decisions
                        ↓
              Deliberation closed (PV signed)
                        ↓
              Export to DIPLOMATION (Excel)
                        ↓
              Promotion/progression (existing module)
```

---

## Table of contents

1. [Business concepts](#1-business-concepts)
2. [Database schema](#2-database-schema)
3. [Types and interfaces](#3-types-and-interfaces)
4. [API endpoints (Router)](#4-api-endpoints-router)
5. [Business logic (Service)](#5-business-logic-service)
6. [Database queries (Repo)](#6-database-queries-repo)
7. [Validation schemas (Zod)](#7-validation-schemas-zod)
8. [Complete workflow](#8-complete-workflow)
9. [Deliberation rules (json-rules-engine)](#9-deliberation-rules)
10. [Integration with existing modules](#10-integration-with-existing-modules)
11. [Link with DIPLOMATION](#11-link-with-diplomation)
12. [File structure](#12-file-structure)
13. [Tests](#13-tests)

---

## 1. Business concepts

### What is a deliberation?

A **deliberation** is the official act by which a **jury** made up of teachers and administrators:

1. **Reviews** the academic results of a class for a semester or a year
2. **Validates or invalidates** each student's UEs (teaching units)
3. **Awards** the corresponding credits
4. **Decides** the outcome for each student (admitted, deferred, repeating, excluded, etc.)
5. **Awards** honors (Très Bien, Bien, Assez Bien, Passable)
6. **Signs** the official report (PV)

### Difference from the Promotions module

| Aspect | Promotions | Deliberations |
|--------|-----------|---------------|
| **When** | After the deliberation | Before the promotion |
| **Who decides** | Automatic rules (json-rules-engine) | Human jury (with automatic suggestions) |
| **Granularity** | Per student (promoted yes/no) | Per UE + per student + honors |
| **Output** | Enrollments moved between classes | Official PV + decisions + data for DIPLOMATION |
| **Modifications** | No manual modification | The jury can **override** the computed decisions |
| **Status** | Single execution | Lifecycle (draft → open → closed → signed) |

### Types of deliberations

| Type | Scope | When |
|------|--------|-------|
| **Semester** | One semester of a class | End of each semester |
| **Annual** | Full year of a class | End of year (combines the 2 semesters) |
| **Retake** | After the retake session | After the retake exams |

### Possible decisions per student

| Decision | Code | Description | Typical condition |
|----------|------|-------------|-------------------|
| **Admitted** | `ADMITTED` | Student passes the year/semester | Average ≥ 10, sufficient credits |
| **Admitted by compensation** | `ADMITTED_COMPENSATED` | Some UEs < 10 but overall average ≥ 10 | Average ≥ 10, no eliminatory failure |
| **Deferred** | `DEFERRED` | Must retake some exams (retake session) | Average < 10 but recoverable |
| **Repeating** | `REPEAT` | Must repeat the year | Very low average or too many failures |
| **Excluded** | `EXCLUDED` | Exclusion from the program | Consecutive repeats, fraud, etc. |
| **Pending** | `PENDING` | Incomplete grades, no decision | Incomplete UEs |

### Possible decisions per UE

| Decision | Code | Description |
|----------|------|-------------|
| **Acquired** | `ACQUIRED` | UE average ≥ passing grade, all grades present |
| **Not acquired** | `NOT_ACQUIRED` | UE average < passing grade |
| **Incomplete** | `INCOMPLETE` | Missing grades |
| **Acquired by compensation** | `COMPENSATED` | UE < 10 but compensated by the overall average |

---

## 2. Database schema

### Table `deliberations`

Represents a deliberation session for a given class.

```typescript
export const deliberations = pgTable("deliberations", {
  id:               text("id").primaryKey().$defaultFn(() => sql`gen_random_uuid()`),
  institutionId:    text("institution_id").notNull().references(() => institutions.id, { onDelete: "cascade" }),

  // Academic context
  classId:          text("class_id").notNull().references(() => classes.id, { onDelete: "restrict" }),
  semesterId:       text("semester_id").references(() => semesters.id, { onDelete: "set null" }),  // null = full year
  academicYearId:   text("academic_year_id").notNull().references(() => academicYears.id, { onDelete: "restrict" }),

  // Type and status
  type:             text("type").notNull(),        // "semester" | "annual" | "retake"
  status:           text("status").notNull().default("draft"),  // "draft" | "open" | "closed" | "signed"

  // Jury
  juryMembers:      jsonb("jury_members").notNull().default([]),  // JuryMember[]
  presidentId:      text("president_id").references(() => domainUsers.id, { onDelete: "set null" }),

  // Metadata
  label:            text("label"),                  // Free-form label: "Délibération S1 2024-2025 L1 Info"
  notes:            text("notes"),                  // General observations of the jury
  sessionDate:      timestamp("session_date", { withTimezone: true }),  // Date of the jury session

  // Statistics (computed at closing)
  studentsCount:    integer("students_count").default(0),
  admittedCount:    integer("admitted_count").default(0),
  deferredCount:    integer("deferred_count").default(0),
  repeatCount:      integer("repeat_count").default(0),
  excludedCount:    integer("excluded_count").default(0),
  globalSuccessRate: doublePrecision("global_success_rate").default(0),
  globalAverage:    doublePrecision("global_average").default(0),

  // Link to a deliberation rule (optional)
  ruleId:           text("rule_id").references(() => deliberationRules.id, { onDelete: "set null" }),

  // Timestamps
  openedAt:         timestamp("opened_at", { withTimezone: true }),
  closedAt:         timestamp("closed_at", { withTimezone: true }),
  signedAt:         timestamp("signed_at", { withTimezone: true }),
  createdAt:        timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:        timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("idx_deliberations_institution").on(t.institutionId),
  index("idx_deliberations_class").on(t.classId),
  index("idx_deliberations_year").on(t.academicYearId),
  index("idx_deliberations_status").on(t.status),
  unique("uq_deliberation_class_semester_year").on(t.classId, t.semesterId, t.academicYearId, t.type),
]);
```

**Status lifecycle:**

```
draft → open → closed → signed
         ↑        ↓
         └── reopen (back to open if a correction is needed)
```

| Status | Description | Possible actions |
|--------|-------------|-------------------|
| `draft` | Created, jury not yet formed | Edit jury, open |
| `open` | Jury in session, decisions in progress | Compute, adjust decisions, close |
| `closed` | Decisions finalized, PV generated | Sign, reopen on error |
| `signed` | PV signed, deliberation finished | Read-only, DIPLOMATION export |

---

### Table `deliberation_student_results`

Individual result of each student in a deliberation.

```typescript
export const deliberationStudentResults = pgTable("deliberation_student_results", {
  id:               text("id").primaryKey().$defaultFn(() => sql`gen_random_uuid()`),
  deliberationId:   text("deliberation_id").notNull().references(() => deliberations.id, { onDelete: "cascade" }),
  studentId:        text("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),

  // Decision
  decision:         text("decision").notNull().default("PENDING"),
    // "ADMITTED" | "ADMITTED_COMPENSATED" | "DEFERRED" | "REPEAT" | "EXCLUDED" | "PENDING"
  decisionSource:   text("decision_source").notNull().default("auto"),
    // "auto" (computed by the rules) | "manual" (overridden by the jury)

  // Honor
  mention:          text("mention"),          // "TRES BIEN" | "BIEN" | "ASSEZ BIEN" | "PASSABLE" | null
  mentionEn:        text("mention_en"),       // English translation

  // Computed results (snapshot at the time of the deliberation)
  overallAverage:        doublePrecision("overall_average"),
  overallAverageUnweighted: doublePrecision("overall_average_unweighted"),
  totalCreditsEarned:    integer("total_credits_earned").default(0),
  totalCreditsAttempted: integer("total_credits_attempted").default(0),
  requiredCredits:       integer("required_credits").default(0),

  // Letter grade
  grade:            text("grade"),            // "A+", "A", "B+", etc.

  // Rank in the class
  rank:             integer("rank"),
  rankOutOf:        integer("rank_out_of"),

  // Per-UE details (snapshot)
  ueResults:        jsonb("ue_results").notNull().default([]),
    // DeliberationUEResult[]

  // Jury observations for this student
  juryObservation:  text("jury_observation"),

  // Full snapshot of the facts at the time of the deliberation (audit)
  evaluationData:   jsonb("evaluation_data").notNull().default({}),

  createdAt:        timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:        timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("idx_delib_results_deliberation").on(t.deliberationId),
  index("idx_delib_results_student").on(t.studentId),
  index("idx_delib_results_decision").on(t.decision),
  unique("uq_delib_results_deliberation_student").on(t.deliberationId, t.studentId),
]);
```

---

### Table `deliberation_rules`

Configurable deliberation rules (like `promotionRules` but for deliberation decisions).

```typescript
export const deliberationRules = pgTable("deliberation_rules", {
  id:               text("id").primaryKey().$defaultFn(() => sql`gen_random_uuid()`),
  institutionId:    text("institution_id").notNull().references(() => institutions.id, { onDelete: "cascade" }),

  name:             text("name").notNull(),         // "Règles de délibération L1 INSES"
  description:      text("description"),

  // Scope (optional, to target the rule)
  programId:        text("program_id").references(() => programs.id, { onDelete: "set null" }),
  cycleLevelId:     text("cycle_level_id").references(() => cycleLevels.id, { onDelete: "set null" }),

  // json-rules-engine rules for each decision type
  admissionRuleset:      jsonb("admission_ruleset").notNull(),     // Conditions for ADMITTED
  compensationRuleset:   jsonb("compensation_ruleset"),            // Conditions for ADMITTED_COMPENSATED
  deferralRuleset:       jsonb("deferral_ruleset"),                // Conditions for DEFERRED
  repeatRuleset:         jsonb("repeat_ruleset"),                  // Conditions for REPEAT
  exclusionRuleset:      jsonb("exclusion_ruleset"),               // Conditions for EXCLUDED

  // Configuration
  passingGrade:     doublePrecision("passing_grade").notNull().default(10),
  allowCompensation: boolean("allow_compensation").notNull().default(true),
  maxCompensableUEs: integer("max_compensable_ues").default(2),
  minCompensableScore: doublePrecision("min_compensable_score").default(8),

  isActive:         boolean("is_active").notNull().default(true),
  createdAt:        timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:        timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("idx_delib_rules_institution").on(t.institutionId),
  index("idx_delib_rules_program").on(t.programId),
  index("idx_delib_rules_active").on(t.isActive),
]);
```

---

### Table `deliberation_logs`

Audit log of all actions on a deliberation.

```typescript
export const deliberationLogs = pgTable("deliberation_logs", {
  id:               text("id").primaryKey().$defaultFn(() => sql`gen_random_uuid()`),
  deliberationId:   text("deliberation_id").notNull().references(() => deliberations.id, { onDelete: "cascade" }),
  actorId:          text("actor_id").notNull().references(() => domainUsers.id, { onDelete: "restrict" }),

  action:           text("action").notNull(),
    // "created" | "opened" | "computed" | "decision_overridden" | "closed" | "reopened" | "signed"

  // Action details
  targetStudentId:  text("target_student_id").references(() => students.id, { onDelete: "set null" }),
  previousValue:    jsonb("previous_value"),   // Previous state (e.g. decision before override)
  newValue:         jsonb("new_value"),         // New state
  reason:           text("reason"),             // Justification (required for overrides)

  createdAt:        timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("idx_delib_logs_deliberation").on(t.deliberationId),
  index("idx_delib_logs_actor").on(t.actorId),
  index("idx_delib_logs_action").on(t.action),
]);
```

---

### Relationship summary

```
deliberationRules (1:N deliberations)
  └── Rules reusable per program/level

deliberations (1:N deliberationStudentResults)
  ├── class, semester, academicYear (context)
  ├── juryMembers (JSONB)
  ├── presidentId → domainUsers
  ├── ruleId → deliberationRules
  └── deliberationStudentResults (1 per student)
       ├── decision, mention, grade, rank
       ├── ueResults (JSONB: decision per UE)
       └── evaluationData (JSONB: snapshot of the facts)

deliberationLogs (audit trail)
  └── All actions with actor, reason, before/after
```

---

## 3. Types and interfaces

### JuryMember

```typescript
interface JuryMember {
  profileId: string;        // References domainUsers.id
  name: string;             // Displayed name (snapshot)
  role: string;             // "president" | "rapporteur" | "member" | "secretary"
  title: string;            // Title: "Pr.", "Dr.", "M.", "Mme"
  department?: string;      // Department
  signature?: string;       // Signature URL (optional)
}
```

### DeliberationUEResult

```typescript
interface DeliberationUEResult {
  teachingUnitId: string;
  teachingUnitCode: string;
  teachingUnitName: string;
  credits: number;              // Credits of the UE

  average: number | null;       // Computed UE average
  decision: string;             // "ACQUIRED" | "NOT_ACQUIRED" | "INCOMPLETE" | "COMPENSATED"
  decisionSource: string;       // "auto" | "manual"
  creditsEarned: number;        // Credits earned (= credits if acquired, 0 otherwise)

  courses: DeliberationCourseResult[];
}

interface DeliberationCourseResult {
  courseId: string;
  courseCode: string;
  courseName: string;
  coefficient: number;

  ccScore: number | null;       // CC (continuous assessment) grade
  examScore: number | null;     // Exam grade
  average: number | null;       // Weighted course average
  isRetake: boolean;            // Comes from a retake
  sessionType: string;          // "normal" | "retake"
}
```

### DeliberationFacts (extends StudentPromotionFacts)

```typescript
interface DeliberationFacts extends StudentPromotionFacts {
  // Additional fields for the deliberation
  ueDecisions: Record<string, {
    average: number | null;
    decision: "ACQUIRED" | "NOT_ACQUIRED" | "INCOMPLETE";
    credits: number;
    creditsEarned: number;
  }>;

  compensableUEs: number;        // Number of UEs between minCompensable and passingGrade
  nonCompensableUEs: number;     // Number of UEs below minCompensable
  allUEsComplete: boolean;       // All UEs have all their grades

  // History (for repeat/exclusion rules)
  previousDeliberationDecision?: string;  // Decision of the previous year
  consecutiveRepeats: number;             // Number of consecutive repeats
  totalRepeats: number;                   // Total number of repeats
}
```

### ClassDeliberationPreview

```typescript
interface ClassDeliberationPreview {
  deliberationId: string;
  classId: string;
  className: string;
  semesterId: string | null;
  academicYearId: string;
  status: string;

  // Stats
  totalStudents: number;
  globalAverage: number;
  globalSuccessRate: number;

  // Per-student results
  students: StudentDeliberationPreview[];
}

interface StudentDeliberationPreview {
  studentId: string;
  registrationNumber: string;
  lastName: string;
  firstName: string;

  overallAverage: number | null;
  totalCreditsEarned: number;
  totalCreditsAttempted: number;
  grade: string | null;
  mention: string | null;
  rank: number;

  suggestedDecision: string;     // Decision computed by the rules
  currentDecision: string;       // Current decision (auto or overridden)
  decisionSource: string;        // "auto" | "manual"

  ueResults: DeliberationUEResult[];

  // Flags
  hasIncompleteUEs: boolean;
  hasEliminatoryFailures: boolean;
  isCompensated: boolean;
}
```

---

## 4. API endpoints (Router)

### Deliberation management

| Endpoint | Procedure | Input | Description |
|----------|-----------|-------|-------------|
| `create` | `adminProcedure` | `CreateDeliberationInput` | Create a new deliberation (status=draft) |
| `update` | `adminProcedure` | `UpdateDeliberationInput` | Edit jury, notes, label (status=draft/open) |
| `getById` | `protectedProcedure` | `{ id: string }` | Fetch a deliberation with its results |
| `list` | `protectedProcedure` | `ListDeliberationsInput` | List deliberations with filters |
| `delete` | `adminProcedure` | `{ id: string }` | Delete (only if status=draft) |

### Lifecycle

| Endpoint | Procedure | Input | Description |
|----------|-----------|-------|-------------|
| `open` | `adminProcedure` | `{ id: string }` | Move draft → open (checks the jury is formed) |
| `compute` | `adminProcedure` | `{ id: string, ruleId?: string }` | Compute/recompute the results of all students |
| `close` | `adminProcedure` | `{ id: string }` | Move open → closed (freezes the results) |
| `reopen` | `adminProcedure` | `{ id: string, reason: string }` | Move closed → open (with a required justification) |
| `sign` | `adminProcedure` | `{ id: string }` | Move closed → signed (final) |

### Decisions

| Endpoint | Procedure | Input | Description |
|----------|-----------|-------|-------------|
| `overrideStudentDecision` | `adminProcedure` | `OverrideDecisionInput` | Override a student's decision |
| `overrideUEDecision` | `adminProcedure` | `OverrideUEDecisionInput` | Override a UE's decision |
| `bulkOverrideDecisions` | `adminProcedure` | `BulkOverrideInput` | Override several decisions at once |
| `resetStudentDecision` | `adminProcedure` | `{ deliberationId, studentId }` | Restore the automatic decision |

### Viewing

| Endpoint | Procedure | Input | Description |
|----------|-----------|-------|-------------|
| `preview` | `protectedProcedure` | `{ id: string }` | Full preview with stats |
| `getStudentResult` | `protectedProcedure` | `{ deliberationId, studentId }` | Detailed result of a student |
| `getStatistics` | `protectedProcedure` | `{ id: string }` | Aggregated statistics |
| `getLogs` | `protectedProcedure` | `{ deliberationId, cursor?, limit? }` | Audit log |

### Exports

| Endpoint | Procedure | Input | Description |
|----------|-----------|-------|-------------|
| `generatePV` | `adminProcedure` | `{ id: string, format: "pdf" \| "html" }` | Generate the deliberation PV |
| `exportForDiplomation` | `adminProcedure` | `ExportDiplomationInput` | Generate the Excel file for DIPLOMATION |

### Deliberation rules

| Endpoint | Procedure | Input | Description |
|----------|-----------|-------|-------------|
| `rules.create` | `adminProcedure` | `CreateDelibRuleInput` | Create a deliberation rule |
| `rules.update` | `adminProcedure` | `UpdateDelibRuleInput` | Edit a rule |
| `rules.delete` | `adminProcedure` | `{ id: string }` | Delete (if not in use) |
| `rules.list` | `protectedProcedure` | `ListDelibRulesInput` | List the rules |
| `rules.getById` | `protectedProcedure` | `{ id: string }` | Rule details |

---

## 5. Business logic (Service)

### `deliberations.service.ts`

#### `create(input, institutionId)`

```
1. Check that the class exists and belongs to the institution
2. Check that no deliberation already exists for (class, semester, year, type)
3. Create the deliberation with status="draft"
4. Log "created"
5. Return the deliberation
```

#### `open(id, actorId, institutionId)`

```
1. Check status = "draft"
2. Check that juryMembers is not empty (at least 1 member)
3. Check that presidentId is set
4. Update status = "open", openedAt = now()
5. Log "opened"
```

#### `compute(id, ruleId, actorId, institutionId)`

```
1. Check status = "open"
2. Load the deliberation rule (ruleId or deliberation.ruleId)
3. Fetch all students enrolled in the class for the year
4. For each student:
   a. Compute the DeliberationFacts (reuses buildStudentFacts + extensions)
   b. Compute the per-UE results:
      - Fetch CC + Exam grades (with retake resolution)
      - Compute the average per course
      - Compute the average per UE
      - Determine the UE decision (ACQUIRED / NOT_ACQUIRED / INCOMPLETE)
      - Apply compensation if allowed:
        * UE with a grade between minCompensable and passingGrade
        * AND overall average ≥ passingGrade
        → decision = "COMPENSATED"
   c. Compute the overall average (weighted by credits)
   d. Compute the letter grade and the honor
   e. Evaluate the decision via json-rules-engine:
      - Test admissionRuleset → ADMITTED
      - Test compensationRuleset → ADMITTED_COMPENSATED
      - Test deferralRuleset → DEFERRED
      - Test repeatRuleset → REPEAT
      - Test exclusionRuleset → EXCLUDED
      - If nothing matches → PENDING
   f. Compute the rank (ordered by descending average)
5. Upsert the deliberationStudentResults
6. Update the deliberation statistics
7. Log "computed"
8. Return the full preview
```

#### `overrideStudentDecision(input, actorId, institutionId)`

```
1. Check status = "open"
2. Check that the result exists
3. Save the previous decision
4. Update:
   - decision = input.newDecision
   - decisionSource = "manual"
   - juryObservation = input.reason (required)
5. Log "decision_overridden" with previousValue and newValue
6. Recompute the deliberation statistics
```

#### `overrideUEDecision(input, actorId, institutionId)`

```
1. Check status = "open"
2. Fetch the student's result
3. Modify the relevant UE in ueResults:
   - decision = input.newDecision
   - decisionSource = "manual"
   - creditsEarned = (newDecision in ["ACQUIRED","COMPENSATED"]) ? ueCredits : 0
4. Recompute totalCreditsEarned for the student
5. Log "ue_decision_overridden"
```

#### `close(id, actorId, institutionId)`

```
1. Check status = "open"
2. Check that no student has decision = "PENDING"
   (all must have a decision)
3. Freeze the results: take a snapshot of evaluationData for each student
4. Compute the final statistics
5. Update status = "closed", closedAt = now()
6. Log "closed"
```

#### `reopen(id, reason, actorId, institutionId)`

```
1. Check status = "closed" (not "signed")
2. Check that reason is not empty
3. Update status = "open", closedAt = null
4. Log "reopened" with reason
```

#### `sign(id, actorId, institutionId)`

```
1. Check status = "closed"
2. Check that the actor is the jury president OR a super_admin
3. Update status = "signed", signedAt = now()
4. Log "signed"
5. After signing: the deliberation is FINAL (read-only)
```

---

## 6. Database queries (Repo)

### `deliberations.repo.ts`

#### Main queries

```typescript
// Create a deliberation
createDeliberation(data): Promise<Deliberation>

// Update
updateDeliberation(id, data): Promise<Deliberation>

// Fetch by ID with results
getDeliberationById(id, institutionId): Promise<Deliberation & { results: StudentResult[] }>

// List with filters and pagination
listDeliberations(opts: {
  institutionId: string;
  classId?: string;
  academicYearId?: string;
  status?: string;
  type?: string;
  cursor?: string;
  limit?: number;
}): Promise<{ items: Deliberation[], nextCursor?: string }>

// Check uniqueness
findExistingDeliberation(classId, semesterId, academicYearId, type): Promise<Deliberation | null>

// Delete (draft only)
deleteDeliberation(id): Promise<void>
```

#### Student results

```typescript
// Upsert a student result
upsertStudentResult(data): Promise<StudentResult>

// Bulk upsert
bulkUpsertStudentResults(deliberationId, results[]): Promise<void>

// Fetch a result
getStudentResult(deliberationId, studentId): Promise<StudentResult | null>

// Fetch all results of a deliberation
getDeliberationResults(deliberationId): Promise<StudentResult[]>

// Update a decision
updateStudentDecision(deliberationId, studentId, decision, decisionSource, observation?): Promise<void>

// Update a student's UE results
updateStudentUEResults(deliberationId, studentId, ueResults): Promise<void>
```

#### Data for the computation (reuses ExportsRepo)

```typescript
// Reuses the existing queries of exports.repo.ts:
// - getPVData(classId, semesterId, academicYearId)
// - getUEData(teachingUnitId, classId, semesterId, academicYearId)
// These queries already provide: students, courses, UEs, exams, grades

// Additional queries:
getStudentDeliberationHistory(studentId, institutionId): Promise<{
  previousDecisions: { academicYearId: string, decision: string }[];
  consecutiveRepeats: number;
  totalRepeats: number;
}>
```

#### Logs

```typescript
// Add a log
addLog(data: {
  deliberationId: string;
  actorId: string;
  action: string;
  targetStudentId?: string;
  previousValue?: unknown;
  newValue?: unknown;
  reason?: string;
}): Promise<void>

// List the logs
getLogs(deliberationId, cursor?, limit?): Promise<{ items: Log[], nextCursor?: string }>
```

---

## 7. Validation schemas (Zod)

```typescript
// === Creation ===
const createDeliberationSchema = z.object({
  classId: z.string().min(1),
  semesterId: z.string().optional(),       // null = annual
  academicYearId: z.string().min(1),
  type: z.enum(["semester", "annual", "retake"]),
  label: z.string().optional(),
  ruleId: z.string().optional(),
  juryMembers: z.array(z.object({
    profileId: z.string().min(1),
    name: z.string().min(1),
    role: z.enum(["president", "rapporteur", "member", "secretary"]),
    title: z.string().min(1),
    department: z.string().optional(),
  })).optional().default([]),
  presidentId: z.string().optional(),
  sessionDate: z.date().optional(),
});

// === Update ===
const updateDeliberationSchema = z.object({
  id: z.string().min(1),
  label: z.string().optional(),
  notes: z.string().optional(),
  juryMembers: z.array(/* same schema as above */).optional(),
  presidentId: z.string().optional(),
  sessionDate: z.date().optional(),
  ruleId: z.string().optional(),
});

// === Student decision override ===
const overrideStudentDecisionSchema = z.object({
  deliberationId: z.string().min(1),
  studentId: z.string().min(1),
  newDecision: z.enum(["ADMITTED", "ADMITTED_COMPENSATED", "DEFERRED", "REPEAT", "EXCLUDED"]),
  reason: z.string().min(10, "La justification doit faire au moins 10 caractères"),
});

// === UE decision override ===
const overrideUEDecisionSchema = z.object({
  deliberationId: z.string().min(1),
  studentId: z.string().min(1),
  teachingUnitId: z.string().min(1),
  newDecision: z.enum(["ACQUIRED", "NOT_ACQUIRED", "COMPENSATED"]),
  reason: z.string().min(10),
});

// === Bulk override ===
const bulkOverrideSchema = z.object({
  deliberationId: z.string().min(1),
  overrides: z.array(z.object({
    studentId: z.string().min(1),
    newDecision: z.enum(["ADMITTED", "ADMITTED_COMPENSATED", "DEFERRED", "REPEAT", "EXCLUDED"]),
    reason: z.string().min(10),
  })).min(1),
});

// === Computation ===
const computeSchema = z.object({
  id: z.string().min(1),
  ruleId: z.string().optional(),
});

// === Reopening ===
const reopenSchema = z.object({
  id: z.string().min(1),
  reason: z.string().min(10, "La raison de réouverture est obligatoire"),
});

// === List ===
const listDeliberationsSchema = z.object({
  classId: z.string().optional(),
  academicYearId: z.string().optional(),
  status: z.enum(["draft", "open", "closed", "signed"]).optional(),
  type: z.enum(["semester", "annual", "retake"]).optional(),
  cursor: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
});

// === DIPLOMATION export ===
const exportDiplomationSchema = z.object({
  deliberationId: z.string().min(1),
  exportType: z.enum(["diploma", "attestation", "transcript", "centre_attestation"]),
  // Optional fields (pre-filling of empty columns)
  titreDiplomeFr: z.string().optional(),
  titreDiplomeEn: z.string().optional(),
  sessionExamen: z.string().optional(),
  lieuDelivrance: z.string().optional(),
});

// === Deliberation rule ===
const createDelibRuleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  programId: z.string().optional(),
  cycleLevelId: z.string().optional(),
  admissionRuleset: z.record(z.unknown()),
  compensationRuleset: z.record(z.unknown()).optional(),
  deferralRuleset: z.record(z.unknown()).optional(),
  repeatRuleset: z.record(z.unknown()).optional(),
  exclusionRuleset: z.record(z.unknown()).optional(),
  passingGrade: z.number().min(0).max(20).default(10),
  allowCompensation: z.boolean().default(true),
  maxCompensableUEs: z.number().min(0).default(2),
  minCompensableScore: z.number().min(0).max(20).default(8),
});
```

---

## 8. Complete workflow

### Typical scenario: end-of-semester deliberation

```
PHASE 1 — PREPARATION
═══════════════════════

1. Admin creates the deliberation
   POST deliberations.create {
     classId: "L1-INFO-2024",
     semesterId: "S1",
     academicYearId: "2024-2025",
     type: "semester",
     label: "Délibération S1 2024-2025 L1 Informatique"
   }
   → status = "draft"

2. Admin forms the jury
   PUT deliberations.update {
     id: "delib-001",
     juryMembers: [
       { profileId: "prof-001", name: "Dr. NDONG", role: "president", title: "Pr." },
       { profileId: "prof-002", name: "M. EYEBE",  role: "rapporteur", title: "Dr." },
       { profileId: "prof-003", name: "Mme BELL",  role: "member", title: "Mme" },
       { profileId: "admin-001", name: "M. FOUDA", role: "secretary", title: "M." },
     ],
     presidentId: "prof-001",
     sessionDate: "2025-02-15T09:00:00Z"
   }


PHASE 2 — OPENING AND COMPUTATION
══════════════════════════════

3. Admin opens the deliberation
   POST deliberations.open { id: "delib-001" }
   → status = "open"
   → Checks: jury not empty, president set

4. Admin runs the automatic computation
   POST deliberations.compute {
     id: "delib-001",
     ruleId: "rule-L1-standard"    // Optional, otherwise uses the linked rule
   }
   → For each student:
     - Computes the CC + Exam grades per course
     - Resolves retakes (replace/best_of)
     - Computes the averages per UE
     - Determines the decisions per UE (Acquired/Not acquired/Incomplete)
     - Applies compensation if allowed
     - Computes the overall average
     - Evaluates the deliberation rules
     - Assigns the grade and the honor
     - Computes the rank
   → Returns the full preview


PHASE 3 — REVIEW BY THE JURY
═════════════════════════════

5. The jury reviews the results
   GET deliberations.preview { id: "delib-001" }
   → Shows all students with their suggested decisions

6. The jury overrides some decisions

   Example 1: A student with a 9.8 average; the jury decides to admit them
   POST deliberations.overrideStudentDecision {
     deliberationId: "delib-001",
     studentId: "student-042",
     newDecision: "ADMITTED_COMPENSATED",
     reason: "Moyenne très proche du seuil (9.8/10), progression régulière, pas d'échec éliminatoire"
   }

   Example 2: The jury compensates a UE
   POST deliberations.overrideUEDecision {
     deliberationId: "delib-001",
     studentId: "student-042",
     teachingUnitId: "ue-math",
     newDecision: "COMPENSATED",
     reason: "UE à 9.2/10 compensée par la moyenne générale de 10.5"
   }


PHASE 4 — CLOSING
══════════════════

7. Admin closes the deliberation
   POST deliberations.close { id: "delib-001" }
   → Checks: no student in "PENDING"
   → Freezes the results (evaluationData snapshot)
   → Computes the final statistics
   → status = "closed"

8. (Optional) If an error is found after closing
   POST deliberations.reopen {
     id: "delib-001",
     reason: "Erreur sur la note de l'étudiant NDONG en Physique, correction nécessaire"
   }
   → status = "open"
   → The jury can edit and then close again


PHASE 5 — SIGNATURE AND EXPORTS
═══════════════════════════════

9. The president signs
   POST deliberations.sign { id: "delib-001" }
   → status = "signed" (FINAL)
   → No further modification possible

10. Admin generates the official PV
    POST deliberations.generatePV {
      id: "delib-001",
      format: "pdf"
    }
    → PDF with institutional header, results table, jury signatures

11. Admin exports for DIPLOMATION
    POST deliberations.exportForDiplomation {
      deliberationId: "delib-001",
      exportType: "attestation"
    }
    → Excel .xlsx file in DIPLOMATION format
    → Columns filled automatically from the deliberation results
    → Empty columns flagged (see docs/integration-diplomation.md §3)


PHASE 6 — PROMOTION (existing module)
══════════════════════════════════════

12. ADMITTED/ADMITTED_COMPENSATED students are eligible for promotion
    → The existing promotionRules module takes over
    → evaluateClass uses the updated data
    → applyPromotion moves the students to the next class
```

### State diagram

```
                  ┌───────┐
                  │ draft │
                  └───┬───┘
                      │ open()
                      ▼
                  ┌───────┐
            ┌────→│ open  │←────┐
            │     └───┬───┘     │
            │         │ close() │ reopen(reason)
            │         ▼         │
            │     ┌────────┐    │
            │     │ closed │────┘
            │     └───┬────┘
            │         │ sign()
            │         ▼
            │     ┌────────┐
            │     │ signed │  ← FINAL
            │     └────────┘
            │
            └── compute() (can be called several times in "open" status)
```

---

## 9. Deliberation rules

### json-rules-engine format

The rules use the `DeliberationFacts` as their data source.

#### Standard admission rule

```json
{
  "conditions": {
    "all": [
      { "fact": "overallAverage", "operator": "greaterThanInclusive", "value": 10 },
      { "fact": "allUEsComplete", "operator": "equal", "value": true },
      { "fact": "eliminatoryFailures", "operator": "equal", "value": 0 }
    ]
  },
  "event": {
    "type": "ADMITTED",
    "params": { "message": "Admis - Moyenne >= 10, toutes UE complètes, pas d'échec éliminatoire" }
  }
}
```

#### Compensation rule

```json
{
  "conditions": {
    "all": [
      { "fact": "overallAverage", "operator": "greaterThanInclusive", "value": 10 },
      { "fact": "allUEsComplete", "operator": "equal", "value": true },
      { "fact": "compensableUEs", "operator": "greaterThan", "value": 0 },
      { "fact": "compensableUEs", "operator": "lessThanInclusive", "value": 2 },
      { "fact": "nonCompensableUEs", "operator": "equal", "value": 0 },
      { "fact": "lowestUnitAverage", "operator": "greaterThanInclusive", "value": 8 }
    ]
  },
  "event": {
    "type": "ADMITTED_COMPENSATED",
    "params": { "message": "Admis par compensation - Moyenne >= 10, UE compensables <= 2, pas de note UE < 8" }
  }
}
```

#### Deferral rule (retake)

```json
{
  "conditions": {
    "all": [
      { "fact": "overallAverage", "operator": "greaterThanInclusive", "value": 8 },
      { "fact": "overallAverage", "operator": "lessThan", "value": 10 },
      { "fact": "failedTeachingUnitsCount", "operator": "lessThanInclusive", "value": 3 },
      { "fact": "consecutiveRepeats", "operator": "lessThan", "value": 2 }
    ]
  },
  "event": {
    "type": "DEFERRED",
    "params": { "message": "Ajourné - Autorisé à passer le rattrapage" }
  }
}
```

#### Repeat rule

```json
{
  "conditions": {
    "any": [
      {
        "all": [
          { "fact": "overallAverage", "operator": "lessThan", "value": 8 },
          { "fact": "consecutiveRepeats", "operator": "lessThan", "value": 2 }
        ]
      },
      {
        "all": [
          { "fact": "creditCompletionRate", "operator": "lessThan", "value": 0.3 },
          { "fact": "consecutiveRepeats", "operator": "lessThan", "value": 2 }
        ]
      }
    ]
  },
  "event": {
    "type": "REPEAT",
    "params": { "message": "Redoublant - Moyenne < 8 ou crédits < 30%" }
  }
}
```

#### Exclusion rule

```json
{
  "conditions": {
    "any": [
      { "fact": "consecutiveRepeats", "operator": "greaterThanInclusive", "value": 2 },
      { "fact": "totalRepeats", "operator": "greaterThanInclusive", "value": 3 }
    ]
  },
  "event": {
    "type": "EXCLUDED",
    "params": { "message": "Exclu - 2 redoublements consécutifs ou 3 au total" }
  }
}
```

### Rule evaluation order

The rules are evaluated in a strict priority order:

```
1. exclusionRuleset     → EXCLUDED (highest priority)
2. repeatRuleset        → REPEAT
3. deferralRuleset      → DEFERRED
4. compensationRuleset  → ADMITTED_COMPENSATED
5. admissionRuleset     → ADMITTED
6. (no match)           → PENDING
```

The first match wins. This guarantees that an excluded student cannot be "saved" by an admission rule.

---

## 10. Integration with existing modules

### Reused modules

| Existing module | What it provides to the deliberation |
|----------------|-----------------------------------|
| `exports.repo` | `getPVData`, `getUEData` queries to fetch grades, exams, UEs |
| `exports.service` | `processPVData`, `resolveStudentGradesWithRetakes` for computing averages |
| `template-helper` | `getExportConfig`, `getAppreciation`, `formatNumber` |
| `student-facts.service` | `buildStudentFacts` to compute the StudentPromotionFacts |
| `student-credit-ledger` | `computeUeCredits` for the credits per UE |
| `promotion-rules` | After the deliberation, admitted students become eligible for promotions |
| `institutions` | `export_config` configuration (passing grade, appraisals, signatures) |

### New dependencies

```
deliberations.service
  ├── imports from exports.repo (getPVData, getUEData)
  ├── imports from exports.service (processPVData, resolveRetakes)
  ├── imports from student-facts.service (buildStudentFacts)
  ├── imports from student-credit-ledger (computeUeCredits)
  ├── imports from template-helper (getExportConfig)
  ├── imports from json-rules-engine (Engine)
  └── imports from exceljs (for the DIPLOMATION export)
```

### Impact on existing modules

| Module | Impact |
|--------|--------|
| `exports` | No modification. The existing PV exports keep working independently. The deliberation **consumes** the same data but adds the jury's decisions. |
| `promotions` | No modification. The promotion module can consult the deliberation results to check that a student was admitted before promoting them. |
| `grades` | No modification. The deliberation reads the grades but never modifies them. |
| `student-promotion-summaries` | No modification. The deliberation creates its own snapshots (evaluationData) independently of the existing summaries. |

---

## 11. Link with DIPLOMATION

The `exportForDiplomation` endpoint generates an Excel file from the results of a **signed** deliberation.

### Advantage over a "raw" export

When the export starts from a **signed deliberation** rather than from raw data:

| Data | Raw export (without deliberation) | Export from deliberation |
|--------|--------------------------------|---------------------------|
| Decision | Computed on the fly, not validated | **Official**, validated by the jury |
| Honor | Computed from the average | **Confirmed/overridden** by the jury |
| Average | Latest value in the database | **Frozen** at closing time |
| Credits | Computed dynamically | **Validated** by the jury (with compensations) |
| Rank | Not computed | **Official** |
| Audit | None | Who decided what, when, why |

### DIPLOMATION columns fed by the deliberation

#### Diploma — Additional columns filled thanks to the deliberation

| Column | Without deliberation | With deliberation |
|---------|-------------------|-------------------|
| `MENTION` | 🔶 Computed | ✅ Official honor from the jury |
| `GRADE` | 🔶 Computed | ✅ Official grade |
| `DATE JURY DELIBERATION` | ❌ EMPTY | ✅ `deliberations.sessionDate` |

#### Attestation — Additional columns

| Column | Without deliberation | With deliberation |
|---------|-------------------|-------------------|
| `MENTION` | 🔶 Computed | ✅ Official |
| `GRADE` | 🔶 Computed | ✅ Official |
| `DATE JURY` | ❌ EMPTY | ✅ `deliberations.sessionDate` |
| `TOTAL CREDIT` | ✅ From summaries | ✅ From results validated by the jury |

### Data still unavailable (even with a deliberation)

These columns remain empty even with the deliberation module:

- `TITRE DIPLOME FR / EN` — Official title of the diploma (institutional context)
- `DATE JURY ADMISSION` — Date of the initial admission jury
- `DOMAINE / DOMAINE_EN` — Field of study
- `FINALITE / FINALITE_EN` — Purpose (professional/research)
- `PARCOURS_EN / SPECIALITE_EN` — English translations
- `SESSION_EXAMEN` — Exam session (June/September)
- `LIEU_DELIVRANCE` — Place of issue
- `TITRE_ATTESTATION_FR / EN` — Custom titles

---

## 12. File structure

```
apps/server/src/modules/deliberations/
├── index.ts                            # Router export
├── deliberations.router.ts             # tRPC endpoints (section 4)
├── deliberations.service.ts            # Business logic (section 5)
├── deliberations.repo.ts               # DB queries (section 6)
├── deliberations.zod.ts                # Zod schemas (section 7)
├── deliberations.types.ts              # TypeScript types (section 3)
├── deliberation-facts.service.ts       # Computation of the DeliberationFacts
├── deliberation-rules.service.ts       # Evaluation of the json-rules-engine rules
├── deliberation-rules.router.ts        # Rules CRUD (sub-router)
├── deliberation-rules.repo.ts          # Queries for the rules
├── deliberation-rules.zod.ts           # Rule validation
├── deliberation-export.service.ts      # DIPLOMATION Excel generation
├── deliberation-pv.service.ts          # PDF/HTML PV generation
└── __tests__/
    ├── deliberations.caller.test.ts    # Lifecycle tests
    ├── deliberation-compute.test.ts    # Computation tests
    ├── deliberation-rules.test.ts      # Rule tests
    └── deliberation-export.test.ts     # Export tests
```

### Adding to the main router

```typescript
// apps/server/src/routers/index.ts
import { deliberationsRouter } from "../modules/deliberations";

export const appRouter = router({
  // ... existing routers
  deliberations: deliberationsRouter,
});
```

### Adding to the schema

```typescript
// apps/server/src/db/schema/app-schema.ts
// Add the 4 new tables:
// - deliberations
// - deliberationStudentResults
// - deliberationRules
// - deliberationLogs
```

---

## 13. Tests

### Lifecycle tests

```typescript
describe("deliberations lifecycle", () => {
  test("create → open → compute → close → sign");
  test("cannot open without jury");
  test("cannot close with PENDING students");
  test("cannot sign if not closed");
  test("reopen requires reason");
  test("signed deliberation is readonly");
  test("unique constraint on (class, semester, year, type)");
});
```

### Computation tests

```typescript
describe("deliberations compute", () => {
  test("calculates UE averages correctly");
  test("resolves retake grades with replace policy");
  test("resolves retake grades with best_of policy");
  test("applies compensation when allowed");
  test("does not compensate below minCompensableScore");
  test("respects maxCompensableUEs limit");
  test("ranks students by descending average");
  test("assigns correct grade from average");
  test("assigns correct mention from average");
  test("handles incomplete UEs (missing grades)");
});
```

### Decision tests

```typescript
describe("deliberation decisions", () => {
  test("ADMITTED when avg >= 10 and all UEs complete");
  test("ADMITTED_COMPENSATED with compensation rules");
  test("DEFERRED when avg between 8 and 10");
  test("REPEAT when avg < 8 or credits < 30%");
  test("EXCLUDED after 2 consecutive repeats");
  test("override changes decisionSource to manual");
  test("override is logged in deliberation_logs");
  test("reset restores auto decision");
});
```

### Export tests

```typescript
describe("deliberation export", () => {
  test("export requires signed deliberation");
  test("diploma export fills correct columns");
  test("attestation export fills correct columns");
  test("transcript export fills all columns");
  test("empty columns are present but blank");
  test("date format is DD/MM/YYYY");
  test("average is rounded to 2 decimals");
});
```

---

## Appendix A — Architectural comparison with Promotion Rules

| Aspect | Promotion Rules | Deliberations |
|--------|----------------|---------------|
| **Tables** | promotionRules, promotionExecutions, promotionExecutionResults | deliberationRules, deliberations, deliberationStudentResults, deliberationLogs |
| **Statuses** | No status (single execution) | draft → open → closed → signed |
| **Rules** | 1 single ruleset | 5 rulesets (admission, compensation, deferral, repeat, exclusion) |
| **Granularity** | Per student (promoted/not promoted) | Per UE + per student + honor + rank |
| **Override** | No (fully automatic) | Yes (the jury can override) |
| **Audit** | executionResults.evaluationData | deliberationLogs (full log) |
| **Output** | Enrollments moved | Official PV + DIPLOMATION export |
| **Reuse** | buildStudentFacts, json-rules-engine | Same + exports.repo, processPVData |
| **Authorization** | adminProcedure / protectedProcedure | Same |
| **Pattern** | evaluate → apply | create → open → compute → override → close → sign |

---

## Appendix B — Complexity estimate

| Component | Files | Estimate |
|-----------|----------|------------|
| DB schema (4 tables) | 1 file (addition to app-schema.ts) | ~ 200 lines |
| Types | deliberations.types.ts | ~ 150 lines |
| Zod | deliberations.zod.ts + deliberation-rules.zod.ts | ~ 200 lines |
| Repo | deliberations.repo.ts + deliberation-rules.repo.ts | ~ 400 lines |
| Service (computation) | deliberations.service.ts + deliberation-facts.service.ts | ~ 600 lines |
| Service (rules) | deliberation-rules.service.ts | ~ 200 lines |
| Service (export) | deliberation-export.service.ts | ~ 300 lines |
| Service (PV) | deliberation-pv.service.ts | ~ 200 lines |
| Router | deliberations.router.ts + deliberation-rules.router.ts | ~ 300 lines |
| Tests | 4 test files | ~ 500 lines |
| **Total** | **~15 files** | **~3050 lines** |
