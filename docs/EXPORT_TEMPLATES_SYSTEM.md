# Customizable Export Templates System

Date: 2025-12-22

## Overview

The export templates system makes it possible to fully customize the headers, columns and styles of the documents generated (PDF and Excel) for grade exports.

## Supported Template Types

1. **`pv`** - Minutes (Procès-Verbal) (PDF/HTML)
2. **`evaluation`** - Evaluation publication (PDF/HTML)
3. **`ue`** - Teaching unit (UE) publication (PDF/HTML)
4. **`excel_combined`** - Combined Excel export
5. **`excel_pv`** - Excel minutes (Procès-Verbal)
6. **`excel_individual`** - Individual Excel export per exam

## Template Structure

Each template contains:

### 1. Column Configuration (`columns`)

```typescript
{
  id: string;              // Unique column identifier
  key: string;             // Key used to access the data
  label: string;           // Default label
  labelFr?: string;        // Label in French
  labelEn?: string;        // Label in English
  width?: number;          // Column width (pixels or characters)
  visible: boolean;        // Column visibility
  order: number;           // Display order
  dataType?: "text" | "number" | "date" | "formula";
  formula?: string;        // Formula for computed columns (e.g. "CC * 0.4 + EXAM * 0.6")
  format?: string;         // Display format (e.g. "0.00", "DD/MM/YYYY")
  alignment?: "left" | "center" | "right";
}
```

### 2. Header Configuration (`headerConfig`)

```typescript
{
  showLogo?: boolean;
  logoPosition?: "left" | "center" | "right";
  title?: string;
  titleFr?: string;
  titleEn?: string;
  subtitle?: string;
  subtitleFr?: string;
  subtitleEn?: string;
  showInstitutionName?: boolean;
  showFacultyName?: boolean;
  showAcademicYear?: boolean;
  showSemester?: boolean;
  showClassName?: boolean;
  customFields?: Array<{
    key: string;
    label: string;
    labelFr?: string;
    labelEn?: string;
    value?: string;
    visible: boolean;
    order: number;
  }>;
}
```

### 3. Style Configuration (`styleConfig`)

```typescript
{
  // Font
  fontFamily?: string;
  fontSize?: number;
  headerFontSize?: number;

  // Colors
  primaryColor?: string;
  secondaryColor?: string;
  headerBackgroundColor?: string;
  headerTextColor?: string;

  // Table
  tableBorderColor?: string;
  tableBorderWidth?: number;
  alternateRowColor?: string;

  // Page
  pageSize?: "A4" | "A3" | "Letter";
  pageOrientation?: "portrait" | "landscape";
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };

  // Watermark
  watermark?: {
    enabled: boolean;
    text: string;
    opacity?: number;
    fontSize?: number;
    rotation?: number;
  };
}
```

## tRPC API

### 1. List Templates

```typescript
// All templates of the institution
const templates = await trpc.exportTemplates.list.query({});

// Templates of a specific type
const pvTemplates = await trpc.exportTemplates.list.query({
  type: "pv"
});

// Default templates only
const defaults = await trpc.exportTemplates.list.query({
  isDefault: true
});
```

### 2. Get a Specific Template

```typescript
const template = await trpc.exportTemplates.getById.query({
  id: "template-id"
});
```

### 3. Get the Default Template

```typescript
const defaultPVTemplate = await trpc.exportTemplates.getDefault.query({
  type: "pv"
});
```

### 4. Create a Template

```typescript
const newTemplate = await trpc.exportTemplates.create.mutate({
  name: "Mon Template PV Personnalisé",
  type: "pv",
  isDefault: false,
  columns: [
    {
      id: "col1",
      key: "rank",
      label: "Rang",
      labelFr: "Rang",
      labelEn: "Rank",
      width: 50,
      visible: true,
      order: 1,
      dataType: "number",
      alignment: "center"
    },
    {
      id: "col2",
      key: "studentName",
      label: "Nom Complet",
      labelFr: "Nom Complet",
      labelEn: "Full Name",
      width: 200,
      visible: true,
      order: 2,
      dataType: "text",
      alignment: "left"
    },
    // ... other columns
  ],
  headerConfig: {
    showLogo: true,
    logoPosition: "left",
    titleFr: "PROCÈS-VERBAL DE DÉLIBÉRATION",
    titleEn: "DELIBERATION MINUTES",
    showInstitutionName: true,
    showAcademicYear: true,
    showSemester: true,
    showClassName: true
  },
  styleConfig: {
    pageSize: "A4",
    pageOrientation: "landscape",
    fontFamily: "Arial",
    fontSize: 10,
    headerBackgroundColor: "#003366",
    headerTextColor: "#FFFFFF",
    watermark: {
      enabled: true,
      text: "ORIGINAL",
      opacity: 0.1
    }
  }
});
```

### 5. Update a Template

```typescript
const updated = await trpc.exportTemplates.update.mutate({
  id: "template-id",
  name: "Nouveau Nom",
  columns: [/* new columns */],
  headerConfig: {/* new config */}
});
```

### 6. Set a Default Template

```typescript
await trpc.exportTemplates.setDefault.mutate({
  id: "template-id",
  type: "pv"
});
```

### 7. Delete a Template

```typescript
await trpc.exportTemplates.delete.mutate({
  id: "template-id"
});
```

## Predefined Column Examples

### For a PV (Minutes)

```typescript
const pvColumns = [
  { id: "rank", key: "rank", label: "Rang", visible: true, order: 1, dataType: "number" },
  { id: "regNum", key: "registrationNumber", label: "Matricule", visible: true, order: 2 },
  { id: "name", key: "fullName", label: "Nom et Prénom(s)", visible: true, order: 3 },
  { id: "cc", key: "cc", label: "CC", visible: true, order: 4, dataType: "number", format: "0.00" },
  { id: "exam", key: "exam", label: "Examen", visible: true, order: 5, dataType: "number", format: "0.00" },
  {
    id: "avg",
    key: "average",
    label: "Moyenne",
    visible: true,
    order: 6,
    dataType: "formula",
    formula: "cc * 0.4 + exam * 0.6",
    format: "0.00"
  },
  { id: "decision", key: "decision", label: "Décision", visible: true, order: 7 },
  { id: "credits", key: "creditsEarned", label: "Crédits", visible: true, order: 8, dataType: "number" }
];
```

### For an Individual Excel Export

```typescript
const excelColumns = [
  { id: "lastName", key: "lastName", label: "Nom", visible: true, order: 1, width: 150 },
  { id: "firstName", key: "firstName", label: "Prénom", visible: true, order: 2, width: 150 },
  { id: "regNum", key: "registrationNumber", label: "Matricule", visible: true, order: 3, width: 120 },
  { id: "birthDate", key: "birthDate", label: "Date de naissance", visible: true, order: 4, dataType: "date", format: "DD/MM/YYYY" },
  { id: "birthPlace", key: "birthPlace", label: "Lieu de naissance", visible: true, order: 5, width: 200 },
  { id: "gender", key: "gender", label: "Sexe", visible: true, order: 6, width: 60 }
];
```

## Use in the Export Service

The export service will automatically:

1. Fetch the default template for the requested export type
2. Apply the column configuration
3. Apply the header configuration
4. Apply the defined styles
5. Generate the document according to these settings

### Integration example

```typescript
// In exports.service.ts
export async function generatePV(input, ctx) {
  // 1. Fetch the template
  const template = await exportTemplatesService.getDefaultTemplate(
    ctx.db,
    institutionId,
    "pv"
  );

  // 2. Use the template configuration
  const columns = template?.columns || getDefaultPVColumns();
  const headerConfig = template?.headerConfig || getDefaultHeader();
  const styleConfig = template?.styleConfig || getDefaultStyles();

  // 3. Generate the document with these configurations
  const html = await renderTemplate({
    templatePath: "pv-template.html",
    data: processedData,
    columns,
    headerConfig,
    styleConfig
  });

  // 4. Convert to PDF if needed
  if (format === "pdf") {
    return await htmlToPdf(html, styleConfig.pageSize, styleConfig.pageOrientation);
  }

  return html;
}
```

## Migration from the Old System

The old system uses a static `export-config.json` file. To migrate:

1. **Create templates for each export type**
2. **Import the existing configurations** from `export-config.json`
3. **Set the templates as default**
4. **Test** each export type
5. **Gradually deprecate** `export-config.json`

## Required Permissions

- **List and view**: `canManageCatalog` (all administrators)
- **Create, edit, delete**: `adminProcedure` (administrators only)
- **Set default template**: `adminProcedure`

## Database

The `export_templates` table now stores only:

- `id`: Unique identifier
- `institution_id`: Owning institution
- `name`: Template name
- `type`: Export type (`pv`, `evaluation`, `ue`)
- `is_default`: Whether the template is the one used by default
- `template_body`: Full Handlebars content (.hbs) supplied by the user
- `created_at`, `updated_at`, `created_by`, `updated_by`: Audit

### Constraints

- **Uniqueness**: `(institution_id, name)` must be unique
- **Default**: Only one `isDefault=true` template per `(institution_id, type)`
- **Cascade**: Cascade delete if the institution is deleted

## System Benefits

1. **Full flexibility**: the user pastes their complete Handlebars template (headers, logos, styles)
2. **Fast rollout**: no complex graphical editor or column configuration
3. **Compatibility**: always rendered with the existing helpers (`formatNumber`, `getObservation`, etc.)
4. **Per-institution customization**: each institution can keep its own static PDFs
5. **Versioning**: Several template versions possible
6. **Audit**: Creation/modification tracking
7. **Reusability**: Templates shared between similar exports

## Next Steps

1. ✅ Create the database schema
2. ✅ Create the complete CRUD module
3. ⏳ Adapt the export service to use the templates
4. ⏳ Create the UI to manage templates
5. ⏳ Implement template import/export
6. ⏳ Create default templates for each type

## Support

For any question or issue, see:
- [tRPC API documentation](#trpc-api)
- [Template examples](#predefined-column-examples)
- Source code: `apps/server/src/modules/export-templates/`
