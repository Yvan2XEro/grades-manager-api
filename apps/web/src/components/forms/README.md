# CodedEntitySelect Component

A reusable select component for entities with codes (faculties, programs, classes, courses, etc.), optimized for UX with debounced search, local/server filtering, and full i18n support.

## Features

- ✅ **Debounced search** (300ms by default)
- ✅ **Hybrid filtering** (local + server)
- ✅ **i18n support** (French/English)
- ✅ **Accessibility** (ARIA, keyboard navigation)
- ✅ **Customization** (icons, badges, subtitles)
- ✅ **React Hook Form integration**
- ✅ **Loading states**
- ✅ **Error handling**

## Installation

The component uses the following dependencies (already installed):
- `@radix-ui/react-popover` (via shadcn)
- `cmdk` (via shadcn Command)
- `lucide-react` (icons)
- `react-i18next` (i18n)

## Basic Usage

```tsx
import { CodedEntitySelect } from "@/components/forms/coded-entity-select";
import { trpc } from "@/lib/trpc";

function MyForm() {
  const [programCode, setProgramCode] = useState("");
  const { data: programs = [], isLoading } = trpc.programs.list.useQuery({ limit: 100 });

  return (
    <CodedEntitySelect
      items={programs}
      isLoading={isLoading}
      value={programCode}
      onChange={setProgramCode}
      label="Program"
      placeholder="Select a program..."
    />
  );
}
```

## Props

### Required Props

| Prop | Type | Description |
|------|------|-------------|
| `items` | `T[]` | Array of entities to display |
| `value` | `string \| null` | Code of the selected entity |
| `onChange` | `(code: string \| null) => void` | Selection change callback |

### Optional Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isLoading` | `boolean` | `false` | Loading state |
| `onSearch` | `(query: string) => void` | - | Callback for server search |
| `label` | `string` | - | Field label |
| `placeholder` | `string` | - | Placeholder text |
| `emptyMessage` | `string` | - | Message when no results |
| `searchPlaceholder` | `string` | - | Search input placeholder |
| `error` | `string` | - | Error message |
| `icon` | `React.ReactNode` | - | Trigger button icon |
| `getItemIcon` | `(item: T) => ReactNode` | - | Icon per item |
| `getItemSubtitle` | `(item: T) => string` | - | Subtitle per item |
| `getItemBadge` | `(item: T) => string` | - | Badge per item |
| `disabled` | `boolean` | `false` | Disable the select |
| `required` | `boolean` | `false` | Required field |
| `allowClear` | `boolean` | `true` | Allow clearing selection |
| `searchMode` | `'local' \| 'server' \| 'hybrid'` | `'hybrid'` | Search mode |
| `minSearchLength` | `number` | `1` | Min length to trigger search |
| `debounceMs` | `number` | `300` | Debounce delay (ms) |

## Search Modes

### Local (`searchMode="local"`)
Filters only already loaded items. Fast, no server requests.

```tsx
<CodedEntitySelect
  items={faculties}
  searchMode="local"
  // ... other props
/>
```

### Server (`searchMode="server"`)
All results come from the server. Allows searching the entire database.

```tsx
const [searchQuery, setSearchQuery] = useState("");
const { data: results } = trpc.programs.search.useQuery(
  { query: searchQuery },
  { enabled: searchQuery.length >= 2 }
);

<CodedEntitySelect
  items={results}
  onSearch={setSearchQuery}
  searchMode="server"
  // ... other props
/>
```

### Hybrid (`searchMode="hybrid"`) - **Recommended**
Filters locally AND queries the server. Best of both worlds.

```tsx
const [searchQuery, setSearchQuery] = useState("");
const { data: defaultItems } = trpc.programs.list.useQuery({ limit: 100 });
const { data: searchResults } = trpc.programs.search.useQuery(
  { query: searchQuery },
  { enabled: searchQuery.length >= 2 }
);

const items = searchQuery.length >= 2 ? searchResults : defaultItems;

<CodedEntitySelect
  items={items}
  onSearch={setSearchQuery}
  searchMode="hybrid"
  // ... other props
/>
```

## Display Customization

### With Icons

```tsx
import { GraduationCapIcon } from "lucide-react";

<CodedEntitySelect
  items={programs}
  icon={<GraduationCapIcon className="h-4 w-4" />}
  getItemIcon={(program) => <GraduationCapIcon className="h-4 w-4" />}
/>
```

### With Badges and Subtitles

```tsx
<CodedEntitySelect
  items={classes}
  getItemBadge={(cls) => cls.cycleLevel?.name} // Badge "L1", "L2", etc.
  getItemSubtitle={(cls) =>
    `${cls.program?.name} • ${cls.academicYear?.name}`
  }
/>
```

## React Hook Form Integration

```tsx
import { useForm } from "react-hook-form";

function MyForm() {
  const form = useForm({
    defaultValues: {
      programCode: "",
    },
  });

  return (
    <CodedEntitySelect
      items={programs}
      value={form.watch("programCode")}
      onChange={(code) => form.setValue("programCode", code)}
      error={form.formState.errors.programCode?.message}
      required
    />
  );
}
```

## Cascading Forms

```tsx
function CascadingForm() {
  const form = useForm({
    defaultValues: {
      facultyCode: "",
      programCode: "",
    },
  });

  const { data: faculties = [] } = trpc.faculties.list.useQuery({ limit: 100 });

  const { data: programs = [] } = trpc.programs.list.useQuery(
    { facultyId: form.watch("facultyCode") },
    { enabled: !!form.watch("facultyCode") } // Load only if faculty is selected
  );

  return (
    <>
      <CodedEntitySelect
        items={faculties}
        value={form.watch("facultyCode")}
        onChange={(code) => {
          form.setValue("facultyCode", code);
          form.setValue("programCode", ""); // Reset dependent field
        }}
        label="Faculty"
      />

      <CodedEntitySelect
        items={programs}
        value={form.watch("programCode")}
        onChange={(code) => form.setValue("programCode", code)}
        label="Program"
        disabled={!form.watch("facultyCode")} // Disabled until faculty is selected
      />
    </>
  );
}
```

## i18n Translations

Translations are in `apps/web/src/i18n/locales/{en,fr}/translation.json`:

```json
{
  "components": {
    "codedEntitySelect": {
      "placeholder": "Select an item",
      "searchPlaceholder": "Search by code or name...",
      "noResults": "No items found. Try a different search.",
      "resultsCount_one": "{{count}} result",
      "resultsCount_other": "{{count}} results",
      "loading": "Loading..."
    }
  }
}
```

To customize messages, pass the props:
- `placeholder`
- `searchPlaceholder`
- `emptyMessage`

## Required Backend (tRPC)

To use `hybrid` or `server` mode, your tRPC routers must expose:

### 1. `list` Procedure
```typescript
list: publicProcedure
  .input(z.object({
    limit: z.number().optional(),
    offset: z.number().optional(),
  }))
  .query(async ({ input }) => {
    // Return the N most recent entities
  }),
```

### 2. `search` Procedure
```typescript
search: publicProcedure
  .input(z.object({
    query: z.string(),
    limit: z.number().optional(),
  }))
  .query(async ({ input }) => {
    // Search by code OR name
    // return db.query.programs.findMany({
    //   where: or(
    //     ilike(programs.code, `%${input.query}%`),
    //     ilike(programs.name, `%${input.query}%`)
    //   )
    // })
  }),
```

### 3. `getByCode` Procedure (optional but recommended)
```typescript
getByCode: publicProcedure
  .input(z.object({ code: z.string() }))
  .query(async ({ input }) => {
    // Return entity by exact code
  }),
```

## Complete Examples

See `coded-entity-select.examples.tsx` for complete examples with:
- Program select (with faculty as subtitle)
- Class select (with cycle/level badges)
- Course select (with hours and teacher)
- Faculty select (simple)
- Disabled state
- Full form with validation

## Performance

- **Debounce**: Search is debounced at 300ms to avoid too many requests
- **React Query cache**: Results are automatically cached
- **Local filtering**: Fast for small lists (<100 items)
- **Lazy loading**: Only visible items are rendered

## Accessibility

- Full keyboard support (↑↓ Enter Esc)
- Appropriate ARIA labels
- Focus management
- Screen reader friendly

## Troubleshooting

### Search doesn't work
- Check that `onSearch` is passed
- Check that the tRPC router exposes a `search` procedure
- Check the console for errors

### Results don't appear
- Check that `items` contains an array
- Check that each item has `code` and `name` properties
- Use `isLoading` to display a loading state

### Debounce is too slow/fast
Adjust with `debounceMs`:
```tsx
<CodedEntitySelect
  debounceMs={500} // 500ms instead of 300ms
  // ...
/>
```
