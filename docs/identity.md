# Identity & Access Model

The platform now separates **technical identity** (Better Auth) from **business identity** (academic roles) via the `domain_users` table. This is the foundation for the Auth ↔ Domain diagram and every Phase 1 deliverable.

## Tables & fields
- `auth.user` – still stores credentials, verification flags, and Better Auth roles required by the plugin.
- `domain_users` – holds the functional profile:
  - `auth_user_id` _(optional)_ – links the profile to Better Auth for SSO-enabled actors.
  - `business_role` – `super_admin`, `administrator`, `teacher`, `staff`, or `student`. RBAC derives from this field.
  - Personal data required by the institution: `first_name`, `last_name`, `primary_email`, `phone`, `gender`, `date_of_birth`, `place_of_birth`, `nationality`, plus `status`.
  - Timestamps for auditing.
- `students.domain_user_id` – replaces the old `firstName/lastName/email` columns, so every student now inherits their personal data from `domain_users`.

## Request context & RBAC
`apps/server/src/lib/context.ts` loads the Better Auth session, fetches the associated domain profile, then passes both into `modules/authz`. The module:
1. Evaluates the role hierarchy (`super_admin` > `administrator` > `teacher` > `staff` > `student`).
2. Computes a permission snapshot (`canManageCatalog`, `canManageStudents`, `canGrade`, `canAccessAnalytics`).
3. Powers `adminProcedure` / `superAdminProcedure` checks without depending on Better Auth `user.role`.

Every new router must use these helpers instead of rolling its own RBAC.

## Front-end alignment
`apps/web/src/store/index.ts` mirrors the permission snapshot and enumerates which roles can perform which actions. Guards in future layouts can therefore check `user.permissions` before rendering admin/teacher-only screens, keeping UI/UX aligned with the server.

## Data entry & validation
- Student creation (single or bulk) now requires personal info: first name, last name, email, **date of birth**, **place of birth**, and **gender**. Optional attributes (phone, nationality, auth user link) can be provided when available.
- `domain_users.primary_email` is globally unique; conflicts bubble up as `CONFLICT` errors.
- Bulk import deletes the temporary profile if the student insert fails, keeping tables consistent.

With this foundation the current app keeps running, yet every future feature (teachers, administrators, analytics) can build on the same profile + permission model without touching Better Auth internals.
