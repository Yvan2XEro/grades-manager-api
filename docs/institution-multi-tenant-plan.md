# Institution & Organization Alignment Plan

This document summarizes the current architecture and the steps required to introduce a fully scoped “Institution ↔ Organization ↔ Member” model. It is intended for contributors who need to extend or finish the ongoing migration.

## Current State

### 1. Institutions
- A new `institutions` table stores bilingual metadata (name, slogan, addresses, branding).
- Only one institution is expected for now, but the design anticipates multi-tenant usage.
- Institution settings have a dedicated admin page (`/admin/institution`) with bilingual forms, and logos/banners can be uploaded through a simple upload endpoint.

### 2. Better Auth Organizations
- Better Auth already manages `user`, `organization`, `member`, and `invitation` tables (see `docs/organization.md`).
- Today, `domain_users` still references `auth_user_id`. Members are not yet linked.

### 3. Modules/Services
- Existing modules (faculties, programs, classes, exams, etc.) are tied to a single institution implicitly.
- There is no FK ensuring that academic years, exam types, or registration formats belong to an institution, which exposes the system to accidental cross-organization edits (e.g., activating an academic year impacts everyone).

## Goal

Align the backend so that:
1. Every business entity belongs to one institution.
2. `domain_users` can optionally link to a Better Auth `member`, enabling multi-tenant RBAC without forcing student accounts.
3. Canvas for future multi-institution setups is ready: each institution maps to a Better Auth organization.

## Backend Tasks

### 1. Adjust `domain_users`
- Add `member_id` (UUID, FK to `member.id`). **Keep it nullable** so students can be created without auth credentials. Add a unique index on non-null values.
- Preserve `auth_user_id` for the transition, but plan to remove it once `member_id` is widely used.

### 2. Link core tables to institutions
- Add `institution_id` to all entities that define an academic scope: `faculties`, `programs`, `program_options`, `classes`, `class_courses`, `students`, `enrollments`, `exams`, `exam_types`, `registration_number_formats`, `promotion_rules`, `academic_years`, etc.
- Backfill them with the current institution ID (single tenant).
- Add foreign keys and indexes: e.g. `faculties.institution_id -> institutions.id`. Apply composite unique constraints as needed (e.g., faculty code unique per institution).
- `semesters` can remain global (rarely change).

### 3. Institutions ↔ Better Auth organizations
- Add `organization_id` to `institutions` (FK to `auth.organization.id`).
- Seed the default organization (using the client’s branding info) and link the existing institution.
- Provide a script or seed step to ensure all staff `user`s are part of that organization (create `member` entries and link `domain_users.member_id` later if applicable).

### 4. Context & permissions
- Update `createContext` to load the currently active organization (Better Auth stores it in the session) and resolve the institution via `domain_users.member_id -> member.organization_id -> institutions`.
- Ensure every service/router filters data by `institution_id`. Introduce helpers like `requireInstitution(ctx)` to avoid repeated logic.

### 5. Seeds & tests
- Update `00-foundation.yaml` to include the institution + organization metadata.
- Update `20-users.yaml` so each user references an organization (slug).
- Add TRPC tests verifying that a user cannot list/update entities outside their institution.
- Document the seeding workflow (`docs/seed-playbook.md` should mention institutions/organizations).

## Frontend Tasks

1. **Institution settings** already exist. Ensure they use the storage endpoint for logos/banners.
2. Add `SERVER_PUBLIC_URL` in `.env` so uploaded URLs point to the backend origin.
3. Future: expose multi-organization selectors once the backend supports multiple institutions.
4. Ensure new UI flows (students, classes, program options) implicitly use the institution from context.

## Critical Considerations

1. **Institution-scoped toggles**: Entities like academic years, exam types, registration formats must have `institution_id`; otherwise, actions (e.g., activating an academic year) will leak across clients.
2. **Optional member linkage**: Forcing `member_id` immediately would break simple student creation. Keep it nullable and design a path to attach a Better Auth account later.
3. **Seeds & migrations**: The migration has to backfill all existing rows with the default institution. Missing this will result in `NOT NULL` violations or cross-tenant exposure.

## Next Steps

1. Add `organization_id` to `institutions`, `member_id` to `domain_users`.
2. Add `institution_id` FKs across core tables and backfill.
3. Update the server context to load institution info per request.
4. Adjust seeds and tests.
5. Once stable, remove legacy fields (`auth_user_id`).

This plan keeps the system usable while rolling out multi-tenant safety. Review the Better Auth documentation (`docs/organization.md`) when wiring the organization plugin and session guards.
