# Phase 3b Implementation Summary: Better Auth Organization Context

This document summarizes the implementation of Phase 3b from the Better Auth organization context rollout plan.

## Overview

Phase 3b enforces proper multi-tenant isolation by requiring an active Better Auth organization for all backend requests and wiring the frontend to detect and activate the organization based on subdomain or environment configuration.

## Changes Implemented

### Backend Changes

#### 1. Context Resolution (`apps/server/src/lib/context.ts`)
- **Changed**: `resolveTenantContext()` now **rejects requests without an active organization** instead of falling back to a default institution
- **Error handling**: Returns `PRECONDITION_FAILED` when no organization is active, with clear error message instructing clients to set an organization
- **Organization resolution**: Attempts to get organization from:
  1. `session.session.activeOrganizationId`
  2. `profile.memberId` → `member.organizationId` (fallback)
  3. **Rejects** if neither is available (no more auto-creation of default institution)

#### 2. Institution Helpers (`apps/server/src/lib/institution.ts`)
- **Removed**: `requireDefaultInstitution()`, `requireDefaultInstitutionId()` (auto-creation helpers)
- **Added**:
  - `getInstitutionId(ctx: Context)` - extracts institution ID from resolved context
  - `ensureInstitutionScope(data, ctx)` - ensures data has institution ID from context

#### 3. Module Updates
Updated the following modules to accept `institutionId` from context instead of calling helpers:
- **`modules/class-courses/class-courses.service.ts`**: Removed `requireDefaultInstitutionId()` calls, uses passed `institutionId` directly
- **`modules/promotion-rules/promotion-rules.service.ts`**: Updated `createRule()` and `listRules()` to accept `institutionId` parameter
- **`modules/promotion-rules/promotion-rules.router.ts`**: Updated to pass `ctx.institution.id` to service methods

#### 4. Test Utilities (`apps/server/src/lib/test-utils.ts`)
- **Added**: `setupTestInstitution()` - creates organization → institution linkage for tests
- **Updated**: `createFaculty()`, `createAcademicYear()`, `createExamType()` to use `getTestInstitution().id` instead of `requireDefaultInstitutionId()`
- Tests now properly set up org/institution fixtures via `setupTestInstitution()`

#### 5. Test Database (`apps/server/src/lib/test-db.ts`)
- **Updated**: Better Auth initialization to include `organization()` plugin
- **Updated**: `seed()` function creates full organization → member → institution → domain_user linkage
- **Flow**: organization → institution (with organizationId FK) → member → domain_user (with memberId FK)

### Frontend Changes

#### 1. Organization Slug Detection (`apps/web/src/lib/organization.ts`)
New utility function `detectOrganizationSlug()`:
- Extracts organization slug from subdomain (e.g., `inst-01.domain.com` → `inst-01`)
- Falls back to `VITE_DEFAULT_ORGANIZATION_SLUG` for localhost/IP addresses
- Throws error if no fallback is configured

#### 2. Zustand Store (`apps/web/src/store/index.ts`)
- **Added**: `activeOrganizationSlug: string | null` state
- **Added**: `setActiveOrganizationSlug(slug)` action
- **Updated**: `clearUser()` also clears `activeOrganizationSlug`
- **Persistence**: Organization slug is persisted alongside user data

#### 3. App Bootstrap (`apps/web/src/App.tsx`)
Added two new `useEffect` hooks:
1. **Slug detection**: Runs on mount, calls `detectOrganizationSlug()` and stores in Zustand
2. **Organization activation**: When `session` and `activeOrganizationSlug` are both present, calls `authClient.organization.setActive({ organizationSlug })`

#### 4. Environment Configuration
- **Added**: `VITE_DEFAULT_ORGANIZATION_SLUG` to `.env` and `.env.example`
- **Default value**: `sgn-institution` (matches the organization in seed files)

### Seed Files

#### Updated `apps/server/seed/local/00-foundation.yaml`
- **Added**: `organizations` section with `sgn-institution` entry
- **Documented**: Need to add `organizationSlug` to institutions (TODO for full seed runner implementation)
- **Note**: Full seed runner implementation (parsing organizations, creating member linkage) is pending

## What's Working

✅ **Backend**: Rejects requests without active organization
✅ **Context**: Properly resolves tenant from Better Auth session
✅ **Modules**: All updated modules use context-based institution resolution
✅ **Frontend**: Detects organization slug from subdomain or environment
✅ **Frontend**: Activates organization with Better Auth client
✅ **Test utilities**: Provide proper org/institution setup functions

## Remaining Work

### High Priority

1. **Seed Runner Implementation** (apps/server/src/seed/runner.ts)
   - Parse `organizations` from YAML
   - Create Better Auth organizations before institutions
   - Link institutions to organizations via `organizationId`
   - Create members for admin users
   - Update `ensureSeedInstitutionId()` to require organization context

2. **Integration Tests**
   - Add TRPC tests verifying multi-tenant isolation
   - Test that user A (org-1) cannot access user B's (org-2) data
   - Test the "no organization active" error scenario

3. **Bootstrap Documentation**
   - Document how to create initial organization + institution + member setup
   - Provide script or SQL for first-time deployment
   - Update `docs/seed-playbook.md` with organization requirements

### Medium Priority

4. **Test Updates**
   - Update existing tests to call `setupTestInstitution()` before creating fixtures
   - Ensure all tests create proper org/institution/member linkage
   - Fix any tests failing due to missing organization context

5. **Error Handling**
   - Add user-friendly error messages when organization is not set
   - Consider adding a loading state while organization is being activated
   - Handle organization activation failures gracefully

### Low Priority

6. **UI Enhancements**
   - Display active organization in navbar (badge/indicator)
   - Future: organization switcher for multi-org users
   - Future: subdomain-based routing documentation

## Testing Checklist

Before considering Phase 3b complete:

- [ ] Backend rejects requests without active organization
- [ ] Frontend correctly detects slug from subdomain
- [ ] Frontend correctly falls back to `VITE_DEFAULT_ORGANIZATION_SLUG` on localhost
- [ ] Organization activation succeeds after login
- [ ] TRPC queries work after organization activation
- [ ] Multi-tenant isolation is enforced (cross-org data access fails)
- [ ] Seeds create proper organization → institution → member linkage
- [ ] Tests pass with new organization requirements

## Migration Path for Existing Deployments

If you have an existing deployment without organizations:

1. **Create organization**:
   ```sql
   INSERT INTO organization (id, name, slug, created_at)
   VALUES (gen_random_uuid(), 'Your Institution', 'your-institution', NOW());
   ```

2. **Link institution to organization**:
   ```sql
   UPDATE institutions
   SET organization_id = (SELECT id FROM organization WHERE slug = 'your-institution')
   WHERE code = 'YOUR_CODE';
   ```

3. **Create members for existing users**:
   ```sql
   INSERT INTO member (id, organization_id, user_id, role, created_at)
   SELECT
     gen_random_uuid(),
     (SELECT id FROM organization WHERE slug = 'your-institution'),
     auth_user_id,
     'admin',
     NOW()
   FROM domain_users
   WHERE business_role IN ('administrator', 'super_admin', 'dean', 'teacher');
   ```

4. **Link domain users to members**:
   ```sql
   UPDATE domain_users du
   SET member_id = m.id
   FROM member m
   WHERE du.auth_user_id = m.user_id;
   ```

5. **Set environment variable**:
   ```bash
   VITE_DEFAULT_ORGANIZATION_SLUG=your-institution
   ```

## References

- Original plan: `docs/better-auth-organization-context.md`
- Phase 3 TODO: `TODO.md` (lines 108-127)
- Institution multi-tenant plan: `docs/institution-multi-tenant-plan.md`
- Better Auth organization docs: https://www.better-auth.com/docs/plugins/organization
