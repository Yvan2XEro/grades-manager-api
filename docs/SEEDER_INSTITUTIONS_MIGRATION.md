# Seeder Migration: Faculties → Institutions

Date: 2025-12-22

## Overview

The seeder has been updated to use a unified `institutions` structure instead of the deprecated `faculties` array. This provides a more flexible and consistent architecture.

## Migration Guide

### Old Structure (Deprecated)

```yaml
# ❌ OLD - Don't use this anymore
faculties:
  - code: SANTE
    name: Faculté des Sciences de la Santé
    description: Health sciences programs
  - code: COMMERCE
    name: Faculté Commerce et Gestion
    description: Business programs

institutions:
  - code: INSES
    shortName: INSES
    nameFr: Institut Supérieur de l'Espoir
    # ... other fields
```

### New Structure (Recommended)

```yaml
# ✅ NEW - Use this structure
institutions:
  # Main institution (type: main)
  - code: INSES
    type: main
    shortName: INSES
    nameFr: Institut Supérieur de l'Espoir
    nameEn: Hope Higher Institute
    # ... other institution details
    organizationSlug: inses-institution

  # Faculties as institutions (type: faculty)
  - code: SANTE
    type: faculty
    shortName: SANTE
    nameFr: Faculté des Sciences de la Santé
    nameEn: Faculty of Health Sciences
    descriptionFr: Programmes de formation en sciences de la santé
    descriptionEn: Health sciences training programs
    organizationSlug: inses-institution

  - code: COMMERCE
    type: faculty
    shortName: COMMERCE
    nameFr: Faculté Commerce et Gestion
    nameEn: Faculty of Commerce and Management
    descriptionFr: Programmes de formation en commerce et gestion
    descriptionEn: Commerce and management training programs
    organizationSlug: inses-institution
```

## Key Changes

### 1. Institution Types

Institutions now have a `type` field with these values:
- `main` - Main institution (e.g., INSES)
- `faculty` - Faculty/School within the institution
- `department` - Department within a faculty
- `other` - Other types of institutions (default)

### 2. Processing Order

The seeder processes institutions **before** studyCycles to ensure that:
1. Main institution is created first
2. Faculty-type institutions are created and registered in `state.faculties`
3. StudyCycles can reference faculty codes without errors

### 3. Backward Compatibility

The old `faculties` structure is still supported for backward compatibility, but is **deprecated**:
- Old seed files with `faculties` will continue to work
- Faculties are automatically converted to institutions with `type="faculty"`
- New seeds should use the `institutions` structure

## Benefits of the New Structure

1. **Unified Architecture**: Single structure for all institutional entities
2. **Hierarchical Support**: Can specify parent institutions via `parentInstitutionCode`
3. **Type Safety**: Clear distinction between main institutions and faculties
4. **Flexibility**: Easy to add departments, centers, and other organizational units
5. **Consistency**: Aligns with the database schema

## Required Fields for Faculty-Type Institutions

Minimum fields required:
```yaml
- code: FACULTY_CODE
  type: faculty
  shortName: SHORT_NAME
  nameFr: Nom français
  nameEn: English name
  organizationSlug: organization-slug
```

Optional but recommended:
- `descriptionFr` / `descriptionEn`
- `parentInstitutionCode` (for hierarchical structure)
- Contact information (email, phone, etc.)
- Address information

## How the Seeder Works

1. **Organizations** are processed first
2. **Institutions** are processed early (before studyCycles)
   - Main institution creates/updates the default institution
   - Faculty-type institutions populate `state.faculties` map
3. **StudyCycles** reference faculty codes via `facultyCode` field
4. **Programs** also reference faculty codes

This ensures that when studyCycles/programs are processed, the faculties already exist in the state map.

## Example: Complete YAML Structure

```yaml
meta:
  version: "2025.01"
  dataset: my-institution

organizations:
  - slug: my-institution
    name: My Institution

institutions:
  # 1. Main institution
  - code: MAIN
    type: main
    shortName: MAIN
    nameFr: Mon Institution
    nameEn: My Institution
    organizationSlug: my-institution
    timezone: Africa/Douala

  # 2. Faculties
  - code: ENGINEERING
    type: faculty
    shortName: ENG
    nameFr: Faculté d'Ingénierie
    nameEn: Faculty of Engineering
    organizationSlug: my-institution

  - code: BUSINESS
    type: faculty
    shortName: BUS
    nameFr: Faculté de Commerce
    nameEn: Faculty of Business
    organizationSlug: my-institution

studyCycles:
  - code: BSC-ENG
    name: Bachelor of Engineering
    facultyCode: ENGINEERING  # References the faculty
    totalCreditsRequired: 180
    durationYears: 3

  - code: BSC-BUS
    name: Bachelor of Business
    facultyCode: BUSINESS  # References the faculty
    totalCreditsRequired: 180
    durationYears: 3
```

## Migration Steps for Existing Seeds

If you have existing seed files with the old `faculties` structure:

1. **Copy** your `faculties` array entries
2. **Add** them to the `institutions` array with `type: "faculty"`
3. **Add** required fields: `nameEn`, `organizationSlug`
4. **Remove** the `faculties` array
5. **Test** with `bun run --filter server seed`

## Testing

After migration, verify:
```bash
# Generate scaffold to see the new structure
bun run --filter server seed:scaffold

# Run seeder
bun run --filter server seed

# Run tests
bun test src/seed/__tests__/seed-runner.test.ts
```

## Summary

- ✅ Use `institutions` array with `type` field
- ✅ Main institution has `type: "main"`
- ✅ Faculties have `type: "faculty"`
- ✅ All institutions need `organizationSlug`
- ❌ Don't use the deprecated `faculties` array in new seeds
- ✅ Old seeds with `faculties` still work (backward compatible)
