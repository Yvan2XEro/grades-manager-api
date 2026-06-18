# Academic Year Transition: Product, UX, and Implementation Plan

## 1. Executive Summary

TKAMS currently treats student promotion as a selective transfer operation:
evaluate students, select the eligible ones, choose a target class, and move
them. This model works for straightforward promotions but does not represent
the complete academic outcome of a class at the end of an academic year.

The most visible consequence is that students who must repeat a year are not
automatically enrolled in the equivalent class for the next academic year.
They remain outside the main workflow, even though repeating is an official
academic outcome that requires the same level of operational handling,
traceability, and communication as promotion.

This document proposes replacing the fragmented promotion experience with a
single **Academic Year Transition** workflow. The workflow must:

- account for every student in the selected scope;
- derive proposed outcomes from signed annual deliberations;
- automatically resolve promotion and repeat destinations;
- isolate only exceptional cases for human review;
- support immediate and scheduled execution through the same engine;
- persist the transition plan before execution;
- execute safely, idempotently, and with a complete audit trail;
- provide a dense, efficient interface for large student populations.

This is not a cosmetic redesign. It is a correction to the product and domain
model.

## 2. Problem Statement

### 2.1 Current mental model

The current experience answers this question:

> Which selected students should be moved from one class to another?

The real administrative question is:

> What is the official academic destination of every student at the end of
> this academic year?

Those questions lead to different product designs.

The first produces a transfer form. The second produces a controlled annual
transition process.

### 2.2 Current workflow limitations

The existing implementation exposes several independent paths:

- promotion rule evaluation and execution;
- direct promotion from a deliberation;
- manual bulk transfer from student management;
- scheduled promotion jobs.

These paths do not consistently apply the same rules, validations, destination
resolution, audit behavior, or execution guarantees.

The current UX also has the following structural issues:

- students are divided into "eligible" and "not eligible";
- "not eligible" is presented as an evaluation result, not an actionable
  academic destination;
- only eligible students are selected by default;
- repeaters, excluded students, graduates, and unresolved cases do not share a
  complete operational workflow;
- target classes may be manually selected without enough academic context;
- some execution screens depend on temporary browser navigation state;
- operators can lose the prepared selection after refresh or navigation;
- manual and scheduled operations do not clearly share the same execution
  model;
- destination and decision overrides are insufficiently visible;
- large cohorts require too much repetitive selection and verification.

### 2.3 Why adding a "Repeat" button is not enough

Adding another button would preserve the incorrect selection-first model. It
would also create another execution path and increase the risk of inconsistent
behavior.

A correct solution must guarantee that every source enrollment receives one
and only one transition outcome.

## 3. Product Principles

### 3.1 Exhaustive by default

Every student in the selected scope must appear in the plan. No student should
silently disappear because they are not eligible for promotion.

### 3.2 Exception-driven operation

The system should automatically resolve normal cases. Administrators should
spend their time on missing, conflicting, or exceptional cases rather than
manually processing every student.

### 3.3 Deliberation as the academic source of truth

For an annual transition, the signed annual deliberation and its student
results should be the primary decision source. Promotion rules may assist
before or during deliberation, but they must not silently contradict a signed
jury decision.

### 3.4 Annual enrollment, not permanent class mutation

The system should create the student's enrollment for the target academic
year. The student's current class reference may be updated as a derived
convenience, but the historical source enrollment must remain intact.

### 3.5 Safe defaults with explicit overrides

Normal outcomes should be automatic. Manual changes must require a reason,
identify the actor, and remain visible in the transition audit.

### 3.6 One engine for every execution mode

Immediate execution, scheduled execution, class-level execution, and
institution-wide execution must use the same planning and execution services.

### 3.7 Persistent before destructive

The transition plan must exist in the database before any enrollment is
changed. Browser state must never be the only record of a pending operation.

### 3.8 Progressive disclosure

The overview should show the operational situation immediately. Detailed
grades, credits, rules, and history should remain available in a side panel
without overloading the main table.

## 4. Academic Outcomes

Each transition item must have one proposed outcome and one final outcome.

| Outcome | Meaning | Target-year effect |
| --- | --- | --- |
| `PROMOTE` | Student advances to the next level | Create enrollment in the resolved next-level class |
| `REPEAT` | Student repeats the current level | Create enrollment in the equivalent target-year class |
| `GRADUATE` | Student completed the final program level | Close source enrollment and mark completion without a new class enrollment |
| `EXCLUDE` | Student is excluded from the program | Close source enrollment with the official reason |
| `TRANSFER` | Student leaves for another program or institution | Record the administrative destination when available |
| `SUSPEND` | Student temporarily interrupts studies | Close or suspend enrollment according to institutional policy |
| `REVIEW` | The system cannot safely decide | Block execution until the case is resolved |

### 4.1 Decision mapping

The institution must configure how deliberation decisions map to transition
outcomes.

Recommended default mapping:

| Deliberation decision | Default transition outcome |
| --- | --- |
| `ADMITTED` | `PROMOTE`, or `GRADUATE` at the final level |
| `ADMITTED_COMPENSATED` | `PROMOTE`, or `GRADUATE` at the final level |
| `REPEAT` | `REPEAT` |
| `EXCLUDED` | `EXCLUDE` |
| `PENDING` | `REVIEW` |
| `DEFERRED` | Institution-defined |

`DEFERRED` must not be hard-coded. Depending on the institution, it may mean:

- the student is waiting for a retake session;
- the annual result is not final;
- the student repeats the year;
- the student remains temporarily unassigned.

The configuration must therefore map `DEFERRED` to `REPEAT`, `REVIEW`, or a
dedicated institution-specific policy.

## 5. Information Architecture

### 5.1 Navigation

Replace the operational "Promotion" entry with:

**Academics > Academic Year Transition**

The module contains:

1. **Overview**
2. **New transition**
3. **Plans**
4. **History**
5. **Policies and mappings**

Promotion rules remain available under academic configuration. They should not
be the main entry point for annual rollover operations.

### 5.2 Roles

Recommended responsibilities:

| Role | Capabilities |
| --- | --- |
| Academic administrator | Create plans, resolve normal exceptions, submit for approval |
| Registrar | Review and approve institution-wide transitions |
| Institution administrator | Configure policies, class mappings, and permissions |
| Auditor | Read plans, overrides, execution results, and history |
| Teacher | View transition status for assigned classes; no bulk execution by default |
| Jury member | Produce and sign deliberation decisions, not execute enrollment changes |

Large or institution-wide transitions should support maker-checker approval:
the creator cannot be the final approver when this policy is enabled.

## 6. End-to-End User Journey

### Step 1: Start a transition

The user selects:

- source academic year;
- target academic year;
- scope;
- optional execution date.

Scope options:

- entire institution;
- faculty or department;
- program;
- study cycle;
- one or more classes.

The interface must show how many classes and students are included before the
user proceeds.

The target year must not be inferred only from the currently active academic
year. The operator must see and confirm both years.

### Step 2: Run readiness checks

Before generating the plan, TKAMS validates:

- the source and target years belong to the current institution;
- the target year is later than the source year;
- source enrollments exist;
- required annual deliberations exist;
- annual deliberations are signed;
- every promoted class has a valid next-level destination;
- every repeated class has an equivalent target-year destination;
- final-level classes are correctly identified;
- no target enrollment already exists for the same student and year;
- no conflicting transition plan is already active;
- required program and cycle mappings are complete.

Readiness results are grouped into:

- **Ready**: no action required;
- **Warning**: operation may proceed after acknowledgment;
- **Blocking**: plan cannot be approved or executed.

Example:

```text
Preparation

Ready
  24 of 24 annual deliberations are signed
  1,240 source enrollments were found
  31 target classes were resolved

Warnings
  6 students have approved administrative overrides

Blocking
  3 repeat destinations are missing                  Resolve
  2 students already have target-year enrollments    Review
```

### Step 3: Generate a persistent draft plan

TKAMS creates a draft transition and one item per source enrollment.

For each student, the planning engine:

1. finds the applicable signed annual deliberation result;
2. maps its decision to a proposed outcome;
3. resolves the target class when required;
4. checks for conflicting enrollments or previous execution;
5. records the decision source and calculation snapshot;
6. assigns a blocker code if the result is unsafe or incomplete.

The plan receives a revision number. It can be reopened later without relying
on React Router state, query cache, or local storage.

### Step 4: Review the plan

The review page is the central workspace.

Header:

```text
Academic Year Transition
2025-2026 -> 2026-2027

Institution-wide | Draft revision 3 | Generated 8 minutes ago

[Regenerate plan] [Submit for approval]
```

Summary:

```text
1,240 students   932 promoted   181 repeating
96 graduating    11 leaving     20 need attention
```

Readiness:

```text
24/24 deliberations signed
31/34 class mappings resolved
20 unresolved items
```

Class movement matrix:

```text
Source class         Outcome       Destination            Students
L1 Computer Science  Promote       L2 Computer Science       42
L1 Computer Science  Repeat        L1 Computer Science        8
L3 Computer Science  Graduate      Program completion        30
L2 Networks          Review        Missing target mapping      3
```

### Step 5: Resolve exceptions

The default tab should be **Needs attention**, not **All students**.

Exception categories:

- missing annual deliberation;
- unsigned deliberation;
- pending jury decision;
- missing next-level class;
- missing repeat class;
- multiple possible target classes;
- existing target-year enrollment;
- student already processed;
- source enrollment inconsistency;
- program completion not configured;
- stale plan after a decision or class mapping change.

The user may resolve an item by:

- selecting a valid destination;
- changing the final outcome;
- excluding the item from the current plan with a reason;
- returning to the source module to fix the underlying data;
- regenerating the affected items.

Bulk resolution is allowed only when all selected items have the same blocker
type and compatible destinations.

### Step 6: Review overrides

Overrides are displayed separately from automatically resolved cases.

Every override records:

- proposed outcome;
- final outcome;
- previous target;
- final target;
- reason;
- actor;
- timestamp.

The confirmation page must explicitly state the number of overrides.

### Step 7: Submit and approve

The creator submits a clean plan for approval.

Submission requirements:

- zero blocking items;
- no stale items;
- all required acknowledgments accepted;
- all overrides justified;
- source and target years still valid.

Approval freezes the plan revision. Any subsequent change creates a new draft
revision and invalidates the previous approval.

### Step 8: Execute now or schedule

The approved plan offers:

- **Execute now**
- **Schedule execution**

The scheduling dialog includes:

- execution date and time;
- timezone;
- notification recipients;
- optional pre-execution reminder;
- behavior if the plan becomes stale.

Recommended stale behavior: automatically block execution and notify the
creator and approver. The system must not silently execute outdated academic
decisions.

### Step 9: Monitor execution

The execution screen reports actual progress:

```text
Processing transition

Completed: 846 / 1,240
Promotions: 650 / 932
Repeats: 121 / 181
Graduations: 68 / 96
Errors: 7

[View errors] [Download current report]
```

The user can leave the page. Progress comes from persistent server state, not
from a browser-only request.

### Step 10: Review results

The final report shows:

- planned count;
- successful count;
- failed count;
- skipped count;
- outcome totals;
- created enrollment IDs;
- closed source enrollment IDs;
- students whose current class reference changed;
- individual error messages;
- execution actor and timestamps.

Failed items can be retried after correction without replaying successful
items.

## 7. Main Review Screen UX

### 7.1 Desktop layout

Use a full-height workspace rather than a collection of large cards.

```text
+--------------------------------------------------------------------------+
| Academic Year Transition                         Draft | Revision 3       |
| 2025-2026 -> 2026-2027                 Regenerate | Submit for approval |
+--------------------------------------------------------------------------+
| 1,240 total | 932 promoted | 181 repeat | 96 graduate | 20 attention    |
+--------------------------------------------------------------------------+
| Search students... | Outcome | Program | Source class | Destination     |
+--------------------------------------------------------------------------+
| Needs attention 20 | Promoted 932 | Repeating 181 | Graduating 96 | All |
+--------------------------------------------------------------------------+
| [ ] Student      Decision     Current class   Outcome   Destination  State|
| [ ] N. Kamga     REPEAT       L1 CS           Repeat    L1 CS 26/27  Ready|
| [ ] A. Fofana    ADMITTED     L2 CS           Promote   L3 CS 26/27  Ready|
| [ ] M. Abena     PENDING      L1 Law          Review    --           Block|
+--------------------------------------------------------------------------+
| 20 unresolved                                                     1-50  |
+--------------------------------------------------------------------------+
```

Selecting a row opens a side panel. It must not navigate away from the plan.

### 7.2 Student detail side panel

The side panel contains:

- student identity and registration number;
- source enrollment;
- deliberation status and signed decision;
- annual average and earned credits;
- decision reason or jury observation;
- proposed transition outcome;
- resolved destination;
- previous annual enrollments;
- existing target-year conflicts;
- override controls, when permitted;
- audit trail for this transition item.

The panel should preserve the current filters and scroll position when closed.

### 7.3 Table behavior

The table must support:

- server-side pagination or virtualization;
- sticky header;
- visible vertical scrollbar;
- column sorting;
- search by name, registration number, or email;
- filters by outcome, decision, program, class, destination, blocker, and
  execution status;
- column visibility preferences;
- bulk actions for compatible exceptions;
- export of the filtered view;
- URL-backed filters so the workspace can be bookmarked and shared.

Avoid firing one request per row. The transition API should return the display
data needed by the table, and detail data should load only when the side panel
opens.

### 7.4 Visual hierarchy

Recommended visual rules:

- use neutral surfaces for normal data;
- reserve red for blockers and execution failures;
- use amber for warnings and overrides;
- use green only for completed or ready states;
- use blue for selected or informational states;
- do not encode outcomes by color alone;
- keep status labels short and text-based;
- keep summary cards compact;
- prioritize counts requiring action over decorative progress bars.

### 7.5 Responsive behavior

Desktop is the primary operational interface, but tablet support remains
important.

On narrow screens:

- summary metrics become a horizontally scrollable compact strip;
- filters open in a sheet;
- rows show student, outcome, destination, and state;
- secondary columns move into the side sheet;
- bulk execution remains restricted if the viewport cannot display the
  confirmation summary safely.

An institution-wide transition should not be optimized as a phone-first task.
Mobile access can focus on monitoring and reviewing individual exceptions.

## 8. Empty, Loading, and Error States

### 8.1 No source enrollments

```text
No enrollments were found for this scope in 2025-2026.

Check the selected classes or academic year before creating a transition.
```

### 8.2 Missing signed deliberations

```text
This transition cannot be prepared yet.

4 classes do not have a signed annual deliberation.
[View affected classes]
```

### 8.3 Missing target classes

```text
12 students cannot be assigned because the target-year class does not exist.

[Create or map target class]
```

### 8.4 Stale plan

```text
This plan is out of date.

Two deliberation decisions and one class mapping changed after revision 3 was
generated. Regenerate the affected items before approval.
```

### 8.5 Partial execution failure

```text
1,233 students were processed successfully. 7 require attention.

Successful items will not be processed again.
[Review failed items] [Download execution report]
```

Errors must identify the corrective action. Generic "Something went wrong"
messages are not acceptable for this workflow.

## 9. Notifications

Recommended operational notifications:

- plan generated with blockers;
- plan submitted for approval;
- plan approved or rejected;
- scheduled execution approaching;
- scheduled plan became stale;
- execution started;
- execution completed;
- execution completed with failures.

Student notifications should be a separate, institution-controlled step.
Completing a transition should not automatically publish results unless the
institution explicitly enables that policy.

## 10. Data Model

### 10.1 `academic_year_transitions`

Represents the persistent plan and execution lifecycle.

Suggested fields:

```text
id
institutionId
sourceAcademicYearId
targetAcademicYearId
scopeType
scopeDefinition
status
revision
policySnapshot
summarySnapshot
generatedAt
generatedBy
submittedAt
submittedBy
approvedAt
approvedBy
scheduledAt
startedAt
completedAt
cancelledAt
failureReason
createdAt
updatedAt
```

Suggested statuses:

```text
DRAFT
READY_FOR_REVIEW
PENDING_APPROVAL
APPROVED
SCHEDULED
RUNNING
COMPLETED
COMPLETED_WITH_ERRORS
FAILED
CANCELLED
STALE
```

### 10.2 `academic_year_transition_items`

Represents one source enrollment and its target-year result.

Suggested fields:

```text
id
institutionId
transitionId
studentId
sourceEnrollmentId
deliberationId
deliberationStudentResultId
decision
decisionSnapshot
proposedOutcome
finalOutcome
proposedTargetClassId
finalTargetClassId
resolutionSource
status
blockerCode
blockerDetails
isOverridden
overrideReason
overriddenBy
overriddenAt
targetEnrollmentId
processedAt
errorCode
errorMessage
createdAt
updatedAt
```

Suggested item statuses:

```text
READY
BLOCKED
EXCLUDED_FROM_PLAN
PENDING
PROCESSING
SUCCEEDED
FAILED
SKIPPED_ALREADY_PROCESSED
```

### 10.3 Optional class transition mappings

Automatic inference should use program, cycle, level, academic year, semester,
and class configuration. When inference is ambiguous, explicit mappings are
required.

Suggested table:

```text
academic_year_class_mappings

institutionId
sourceAcademicYearId
targetAcademicYearId
sourceClassId
promotionTargetClassId
repeatTargetClassId
createdBy
createdAt
updatedAt
```

Mappings may be generated automatically and confirmed by an administrator.

### 10.4 Constraints

Required constraints include:

- one active transition item per source enrollment and transition;
- one final target enrollment per student and academic year, according to the
  institution's enrollment uniqueness policy;
- tenant consistency across transition, enrollment, deliberation, student,
  and class;
- source and target academic years must differ;
- approved revision cannot be edited in place;
- successful items cannot be executed twice.

## 11. Service Architecture

Introduce a dedicated module:

```text
apps/server/src/modules/academic-year-transitions/
  academic-year-transitions.router.ts
  academic-year-transitions.service.ts
  academic-year-transitions.repo.ts
  academic-year-transitions.zod.ts
  academic-year-transitions.types.ts
  transition-planner.service.ts
  destination-resolver.service.ts
  transition-executor.service.ts
  transition-policy.service.ts
  __tests__/
```

### 11.1 Planner

Responsibilities:

- resolve the source population;
- load signed annual deliberation results in bulk;
- map decisions to proposed outcomes;
- resolve destinations;
- detect conflicts;
- create or revise transition items;
- calculate summaries and blocker counts.

### 11.2 Destination resolver

Responsibilities:

- identify final program levels;
- resolve the next level for promotions;
- resolve the same level for repeats;
- find compatible target-year classes;
- return an explicit ambiguity instead of selecting an arbitrary class;
- validate tenant, program, cycle, and academic year consistency.

### 11.3 Executor

Responsibilities:

- validate plan approval and freshness;
- process only ready, unprocessed items;
- close or complete source enrollments according to policy;
- create target-year enrollments;
- apply graduation, exclusion, suspension, or transfer outcomes;
- update derived current-class references;
- record per-item success and failure;
- support idempotent retry;
- update transition summaries.

### 11.4 Execution strategy

For small class-level transitions, a single database transaction may be
appropriate.

For institution-wide transitions:

- persist the approved plan;
- enqueue a batch job;
- process deterministic chunks;
- use a transaction per chunk or item group;
- mark each item idempotently;
- retry failed items without replaying successful items;
- expose progress from database state.

The executor must use the same domain functions in both synchronous and batch
execution.

## 12. API Design

Suggested procedures:

```text
academicYearTransitions.readiness
academicYearTransitions.createDraft
academicYearTransitions.regenerate
academicYearTransitions.getById
academicYearTransitions.list
academicYearTransitions.listItems
academicYearTransitions.getItem
academicYearTransitions.resolveItem
academicYearTransitions.bulkResolve
academicYearTransitions.submit
academicYearTransitions.approve
academicYearTransitions.reject
academicYearTransitions.schedule
academicYearTransitions.execute
academicYearTransitions.cancel
academicYearTransitions.retryFailed
academicYearTransitions.getProgress
academicYearTransitions.getReport
academicYearTransitions.listMappings
academicYearTransitions.upsertMapping
```

The list endpoint should return table-ready rows without requiring
`students.getById`, `classes.getById`, or similar requests for every row.

All inputs must resolve `institutionId` from the authenticated context, not
from client-provided tenant identifiers.

## 13. Migration from Existing Promotion Flows

### Phase 1: Domain safety

- document the decision-to-outcome policy;
- enforce tenant validation on all source and target entities;
- require signed annual deliberations for official annual transitions;
- establish target enrollment uniqueness and idempotency rules;
- centralize enrollment creation and source enrollment closure.

### Phase 2: Persistent planning

- add transition and transition-item tables;
- implement readiness checks;
- implement destination resolution;
- generate read-only draft plans;
- compare generated plans with the results of current promotion flows.

No current execution endpoint should be removed during this phase.

### Phase 3: New review UI

- add the Academic Year Transition navigation entry;
- implement the overview and creation flow;
- implement the dense review table and side panel;
- add filters, exception queues, mapping resolution, and overrides;
- add a read-only execution impact summary.

### Phase 4: Unified execution

- implement approval, immediate execution, and scheduling;
- move scheduled jobs to the transition executor;
- add progress, retry, reports, and notifications;
- route direct deliberation actions into a preconfigured transition draft
  instead of executing enrollment changes directly.

### Phase 5: Deprecation

- remove direct annual rollover behavior from
  `deliberations.promoteAdmitted`;
- remove annual rollover behavior from `promotionRules.applyPromotion`;
- keep `classes.bulkTransfer` only for explicit administrative transfers that
  are not academic-year transitions;
- redirect old promotion pages to the new module;
- preserve historical promotion execution records as read-only history.

### Phase 6: Policy and reporting improvements

- add institution-level transition policies;
- add maker-checker approval;
- add student publication controls;
- add transition analytics by program, level, decision, and outcome;
- add guarded rollback or corrective-transition workflows.

## 14. Rollback and Correction Policy

Blind rollback is unsafe after students receive grades, course enrollments,
financial charges, or documents in the target year.

Recommended policy:

- allow cancellation before execution starts;
- allow automatic rollback only when no downstream target-year activity exists;
- otherwise create a corrective transition that records the reversal and new
  destination;
- never delete the original transition history;
- require a reason and elevated permission for every correction.

## 15. Accessibility and Internationalization

The interface must:

- use i18next for every user-facing string;
- support English and French terminology;
- provide text labels in addition to colors and icons;
- support keyboard navigation through filters, rows, and the side panel;
- preserve visible focus;
- announce asynchronous plan generation and execution progress;
- use accessible table headers and status descriptions;
- avoid relying on hover for essential information;
- meet WCAG AA contrast requirements.

Recommended terminology:

| English | French |
| --- | --- |
| Academic Year Transition | Passage d'annee / Transition academique |
| Promote | Promouvoir |
| Repeat | Reinscrire en redoublement |
| Graduate | Declarer diplome |
| Needs attention | A traiter |
| Source class | Classe d'origine |
| Target class | Classe de destination |
| Signed deliberation | Deliberation signee |

Final French terminology should be validated with academic administrators from
the target institutions.

## 16. Performance Requirements

The target experience should support institution-wide plans without generating
hundreds of individual frontend requests.

Requirements:

- bulk-load deliberations, students, enrollments, classes, and mappings;
- paginate transition items on the server;
- cache stable reference data;
- avoid per-row tRPC queries;
- debounce search;
- keep filters in the URL;
- use bounded polling or server events for execution progress;
- ensure plan generation can be moved to a batch job for very large cohorts;
- index transition status, outcome, blocker, class, student, and academic-year
  fields.

## 17. Security and Audit Requirements

- derive the institution from authenticated context;
- verify every referenced entity belongs to the same institution;
- limit plan creation, approval, execution, and override permissions
  independently;
- snapshot the source deliberation decision and relevant policy;
- record all overrides and approvals;
- require idempotency for execution requests;
- prevent simultaneous execution of the same plan;
- prevent overlapping active plans from processing the same source enrollment;
- expose immutable execution history to auditors;
- never trust a client-provided proposed outcome without server validation.

## 18. Testing Strategy

### 18.1 Domain tests

Cover at minimum:

- admitted student promoted to next level;
- admitted final-level student graduated;
- repeat student enrolled in the equivalent target-year class;
- excluded student receives no target enrollment;
- deferred decision follows institution policy;
- pending decision becomes blocked;
- missing signed deliberation becomes blocked;
- missing repeat destination becomes blocked;
- missing promotion destination becomes blocked;
- ambiguous destination becomes blocked;
- existing target-year enrollment is detected;
- cross-tenant source or target entity is rejected;
- stale plan cannot be approved or executed;
- successful item cannot be executed twice;
- failed item can be retried safely.

### 18.2 Workflow tests

- create, review, approve, and execute a class transition;
- schedule and execute an institution transition;
- reject and revise a submitted plan;
- change a deliberation after planning and verify stale detection;
- change a class mapping and regenerate affected items;
- execute a partial batch failure and retry only failed items;
- verify history after manual override.

### 18.3 UI tests

- filters and search update the item list;
- row selection opens the correct side panel;
- closing the side panel preserves table state;
- blocking items prevent submission;
- override requires a reason;
- stale plan presents the correct recovery action;
- progress survives page refresh;
- empty and partial failure states are understandable;
- keyboard-only navigation works;
- French and English interfaces contain no hard-coded strings.

## 19. Acceptance Criteria

The redesign is complete when:

1. A transition plan includes every source enrollment in its scope.
2. Repeaters are automatically assigned to the equivalent target-year class
   when a unique valid destination exists.
3. Promoted students are automatically assigned to the next-level target class.
4. Final-level admitted students are classified as graduates.
5. Excluded, suspended, transferred, and unresolved students remain visible.
6. No plan with unresolved blockers can be approved or executed.
7. Manual overrides require a reason and are fully audited.
8. Scheduled and immediate transitions use the same executor.
9. The plan and execution progress survive browser refresh and reconnection.
10. Successful items are idempotent and failed items can be retried separately.
11. No per-student frontend request fan-out is required to render the review
    table.
12. Existing promotion history remains readable after the migration.

## 20. Success Metrics

Product and operational metrics:

- percentage of students automatically resolved;
- number of unresolved cases per transition;
- time from plan creation to approval;
- time spent per 1,000 students;
- number of manual overrides;
- execution failure rate;
- number of duplicate or missing target-year enrollments;
- number of post-execution corrections;
- percentage of transitions completed without support intervention.

Initial target:

- at least 95% of students automatically resolved;
- zero silently unprocessed students;
- zero duplicate enrollments caused by retry;
- all overrides attributable to an actor and reason;
- institution-wide progress visible without keeping the browser request open.

## 21. Research Basis

The proposal follows patterns used in established education and enterprise
systems:

- annual or program enrollment is treated as a distinct operation rather than
  overwriting permanent student identity;
- bulk enrollment tools use an existing enrollment population and a target
  academic period;
- high-volume administrative tables prioritize search, filtering, batch
  actions, status visibility, and expandable details;
- exception-driven workflows reduce repetitive manual processing and make
  unresolved cases explicit.

References:

- Frappe Education: <https://docs.frappe.io/education>
- Frappe Program Enrollment Tool:
  <https://docs.frappe.io/education/program-enrollment-tool>
- IBM Carbon Design System, Data Table:
  <https://carbondesignsystem.com/components/data-table/usage/>

## 22. Final Recommendation

TKAMS should retire "promotion" as the primary operational concept and replace
it with a complete Academic Year Transition module.

Promotion remains one possible student outcome. It is not the whole process.

The new module should generate an exhaustive, persistent, reviewable plan for
all students; automatically handle promotions, repeats, and graduations; and
direct human attention only to genuine exceptions. This gives academic
administrators a faster interface while making the underlying enrollment
changes safer, auditable, and consistent with signed deliberation decisions.
