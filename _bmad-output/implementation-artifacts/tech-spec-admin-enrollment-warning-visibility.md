---
title: 'Admin Enrollment Warning Visibility'
slug: 'admin-enrollment-warning-visibility'
created: '2026-01-08T10:29:11+01:00'
status: 'ready-for-dev'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['React', 'TypeScript', 'React Query', 'tRPC', 'Shadcn UI primitives']
files_to_modify: ['apps/web/src/pages/admin/EnrollmentManagement.tsx']
code_patterns: ['useQuery/useMutation hooks drive TRPC enrollment flows with toast + dialog feedback', 'UI state managed via React hooks with shadcn AlertDialog/Dialog components']
test_patterns: ['Frontend verified manually today; repo leans on Bun + React Testing Library when UI tests exist']
---

# Tech-Spec: Admin Enrollment Warning Visibility

**Created:** 2026-01-08T10:29:11+01:00

## Overview

### Problem Statement

Enrollment mutations (single, bulk, auto) already emit FR6/FR7 prerequisite warnings, but the admin UI discards them, leaving registrars blind to mandatory vs recommended gaps after running an enrollment action.

### Solution

Tap into each enrollment mutation response, capture the returned `warnings`, and render contextual badge/alert notices inside the modal/panel tied to the just-run action so registrars see unmet mandatory/recommended/co-requisite prereqs immediately without blocking workflows.

### Scope

**In Scope:**

- Wire warning visibility into the existing admin enrollment flows for `studentCourseEnrollments.create`, `.bulkCreate`, and `.autoEnroll` mutations.
- UI-only changes using existing alert/badge primitives.
- Consume warnings directly from the mutation response payloads (no new backend endpoints).

**Out of Scope:**

- Persisting warnings or exposing them via list/read APIs.
- Adding indicators to the main enrollment table, dashboards, or student self-service views.
- Any redesign of the admin enrollment interface beyond wiring post-action notices.
- Analytics, batch jobs, or other system-wide work.

## Context for Development

### Codebase Patterns

- Admin enrollment UI is centralized in `apps/web/src/pages/admin/EnrollmentManagement.tsx`, orchestrating filters, tables, dialogs, and the roster modal in a single component.
- React Query + tRPC manage data/mutations; each mutation already wires toast feedback and cache invalidation hooks, so warnings should piggyback on those handlers.
- UI primitives (AlertDialog, Dialog, Badge, Button, ScrollArea) are the shadcn kit under `@/components/ui` with Tailwind utility styling.
- Local component state (via `useState` and `useMemo`) already tracks modal open/close and mutation results—warning data should follow this transient pattern rather than a global store.

### Files to Reference

| File | Purpose |
| ---- | ------- |
| apps/web/src/pages/admin/EnrollmentManagement.tsx | Main admin enrollment experience containing auto-enroll dialog, roster modal, and per-course actions where warning messaging must be injected |


### Technical Decisions

- No new API requests: warning state is sourced solely from mutation responses.
- Warnings stored transiently per action (local component state) to avoid polluting global stores.
- Visual treatment: amber `Badge` / info `Alert` for mandatory, muted badge for recommended, neutral badge for co-requisite.
- Each mutation (`autoEnroll`, single enroll/retake/reactivate, bulk flows) should capture `data.warnings` inside `onSuccess` and render contextual notices adjacent to the action result rather than global toasts.

## Implementation Plan

### Tasks

- [ ] Task 1: Introduce a local warning presenter helper
  - File: `apps/web/src/pages/admin/EnrollmentManagement.tsx`
  - Action: Define a `PrerequisiteWarning` type alias from the TRPC outputs and implement a small component/fragment that maps each warning to the proper Badge/Alert styling (mandatory → amber/info alert, recommended → muted badge, co-requisite → neutral).
  - Notes: Stay inside the same file; reuse `Badge`, `Alert`, existing typography, and `t` for localization with fallback strings.
- [ ] Task 2: Capture/render warnings for single-course enroll actions
  - File: `apps/web/src/pages/admin/EnrollmentManagement.tsx`
  - Action: Extend the `assignCourse` mutation’s `onSuccess` handler to consume `result.warnings`, store them in local state keyed by `classCourseId`, and render the helper inline beneath the corresponding course row inside the roster modal; clear that state when the modal closes or on subsequent enroll actions for the same course.
  - Notes: Preserve the existing toast + query invalidation behavior; reactivation/withdraw actions continue as-is since they don’t emit warnings.
- [ ] Task 3: Surface warnings after auto-enroll
  - File: `apps/web/src/pages/admin/EnrollmentManagement.tsx`
  - Action: Track `autoEnrollWarnings` state populated in `autoEnrollMutation.onSuccess(result)`, keep the dialog open post-success, and render the helper within `AlertDialogContent` so operators see warnings immediately; clear warnings whenever the dialog closes.
  - Notes: Do not block dismissing the dialog; simply avoid auto-closing so the warning list is visible.
- [ ] Task 4: Localize warning labels/copy
  - File: `apps/web/src/pages/admin/EnrollmentManagement.tsx`
  - Action: Introduce `t("admin.enrollments.warnings.*")` keys (with `defaultValue`) for phrases like “Mandatory gap”, “Recommended gap”, “Co-requisite in progress”, and “Prerequisite warning”.
  - Notes: Document the keys so localization can be updated; ensure defaults are meaningful in English until translation files are refreshed.

### Acceptance Criteria

- [ ] AC 1: Given a single-course enrollment returns a mandatory warning, when the roster modal rerenders, then the affected course row displays an inline warning area with an amber badge describing the unmet prerequisite.
- [ ] AC 2: Given an auto-enroll action returns warnings, when the mutation resolves, then the dialog remains open and shows the warning list directly under the confirmation text, and the user can dismiss the dialog without being blocked.
- [ ] AC 3: Given no warnings are returned from an enrollment action, when the UI updates, then no warning badges or alerts are rendered (behavior matches current production).
- [ ] AC 4: Given multiple warning categories are returned together, when rendered, then each warning shows the correct localized label (mandatory/recommended/co-requisite) with the expected color treatment.

## Additional Context

### Dependencies

- Existing TRPC enrollment mutations returning `{ record, warnings }` payloads.
- i18next translation bundles under `apps/web/public/locales/**` for any new warning strings.

### Testing Strategy

- Optional: Add a lightweight React Testing Library test mounting the roster modal fragment to assert warning rendering when mock `warnings` state is injected.
- Manual QA: Run through single-course enroll and auto-enroll flows using seeded data that produces warnings to confirm badges/alerts appear and clear appropriately.
- Regression pass: Trigger enrollments with no warnings to ensure no extraneous UI shows up and existing toasts/cache invalidations stay intact.

### Notes

- Bulk enroll UI isn’t present today; when/if added, reuse the same helper/state pattern.
- Work remains strictly UI-surface; no backend or persistence changes are required.
