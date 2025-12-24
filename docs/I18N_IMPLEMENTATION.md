# Internationalization Implementation for Promotion Rules

## ✅ Completed Tasks

1. **Moved pages to admin folder**: All promotion rules pages are now in `apps/web/src/pages/admin/promotion-rules/`
2. **Updated routes**: All routes in `App.tsx` now correctly point to `/admin/promotion-rules/*`
3. **Added comprehensive translations**: Both English and French translation files have complete promotion rules sections
4. **Implemented i18n in components**: Dashboard and StudentEvaluationCard are fully translated
5. **Fixed tRPC usage**: Converted all pages from tRPC hooks to React Query + trpcClient pattern (matching the rest of the codebase)

## 🔧 tRPC Usage Pattern

This codebase uses **React Query** directly with **trpcClient**, not tRPC hooks. The correct pattern is:

```typescript
// ❌ WRONG - Don't use this pattern
import { trpc } from "@/utils/trpc";
const { data } = trpc.promotionRules.list.useQuery({});

// ✅ CORRECT - Use this pattern
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";

// For queries
const { data } = useQuery({
  queryKey: ["promotionRules"],
  queryFn: async () => trpcClient.promotionRules.list.query({}),
});

// For mutations
const queryClient = useQueryClient();
const mutation = useMutation({
  mutationFn: async (data) => trpcClient.promotionRules.create.mutate(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["promotionRules"] });
  },
});
```

## 📝 Translation Structure

All translations are located under `admin.promotionRules` namespace:

```
admin.promotionRules
├── dashboard
│   ├── stats (activeRules, totalRules, etc.)
│   ├── actions (manageRules, evaluateExecute, etc.)
│   └── recentActivity
├── rulesList
│   ├── dialog (form labels)
│   └── toast (success/error messages)
├── evaluate
│   ├── form
│   ├── tabs
│   ├── actions
│   └── toast
├── execute
│   ├── form
│   ├── summary
│   ├── confirmation
│   └── process
├── history
│   ├── table
│   ├── details
│   └── stats
└── studentCard
    ├── metrics
    ├── progress
    ├── details
    └── actions
```

## 🎯 Pattern for Remaining Pages

To translate the remaining pages, follow this pattern:

### 1. Import useTranslation hook
```typescript
import { useTranslation } from "react-i18next";
```

### 2. Use the hook in component
```typescript
export function YourComponent() {
	const { t } = useTranslation();
	// ... rest of component
}
```

### 3. Replace hardcoded strings
```typescript
// Before
<h1>Promotion Rules</h1>

// After
<h1>{t("admin.promotionRules.dashboard.title")}</h1>
```

### 4. Use interpolation for dynamic values
```typescript
// Before
<p>{count} students promoted</p>

// After
<p>{t("admin.promotionRules.dashboard.recentActivity.studentsPromoted", { count })}</p>
```

## 📄 Files Completed

### Backend Integration Fixed
- ✅ `apps/web/src/pages/admin/promotion-rules/dashboard.tsx` - Converted to React Query + trpcClient
- ✅ `apps/web/src/pages/admin/promotion-rules/rules-list.tsx` - Converted to React Query + trpcClient
- ✅ `apps/web/src/pages/admin/promotion-rules/evaluate-promotion.tsx` - Converted to React Query + trpcClient
- ✅ `apps/web/src/pages/admin/promotion-rules/execute-promotion.tsx` - Converted to React Query + trpcClient
- ✅ `apps/web/src/pages/admin/promotion-rules/execution-history.tsx` - Converted to React Query + trpcClient

### i18n Completed
- ✅ `apps/web/src/pages/admin/promotion-rules/dashboard.tsx` - Fully translated
- ✅ `apps/web/src/components/promotion-rules/student-evaluation-card.tsx` - Fully translated
- ✅ `apps/web/src/i18n/locales/en/translation.json` (added promotionRules section)
- ✅ `apps/web/src/i18n/locales/fr/translation.json` (added promotionRules section)

### Routes Fixed
- ✅ `apps/web/src/App.tsx` - Updated all routes to `/admin/promotion-rules/*`
- ✅ All navigation links updated to use correct paths

### Components (No Changes Needed)
- ✅ `apps/web/src/components/promotion-rules/rule-card.tsx` - Uses props only, no tRPC

## 📄 Files Remaining (i18n)

The translation keys are already defined. Apply i18n to these pages:

- ⏳ `apps/web/src/pages/admin/promotion-rules/rules-list.tsx` - Add useTranslation() and t() calls
- ⏳ `apps/web/src/pages/admin/promotion-rules/evaluate-promotion.tsx` - Add useTranslation() and t() calls
- ⏳ `apps/web/src/pages/admin/promotion-rules/execute-promotion.tsx` - Add useTranslation() and t() calls
- ⏳ `apps/web/src/pages/admin/promotion-rules/execution-history.tsx` - Add useTranslation() and t() calls

## 🔑 Key Translation Sections

### Rules List Page
- `admin.promotionRules.rulesList.title`
- `admin.promotionRules.rulesList.subtitle`
- `admin.promotionRules.rulesList.actions.createRule`
- `admin.promotionRules.rulesList.dialog.*`
- `admin.promotionRules.rulesList.toast.*`

### Evaluate Page
- `admin.promotionRules.evaluate.title`
- `admin.promotionRules.evaluate.form.*`
- `admin.promotionRules.evaluate.tabs.*`
- `admin.promotionRules.evaluate.actions.*`

### Execute Page
- `admin.promotionRules.execute.title`
- `admin.promotionRules.execute.form.*`
- `admin.promotionRules.execute.summary.*`
- `admin.promotionRules.execute.confirmation.*`

### History Page
- `admin.promotionRules.history.title`
- `admin.promotionRules.history.table.*`
- `admin.promotionRules.history.details.*`

## 🌐 Language Switching

The application supports English and French. Users can switch languages using the language selector in the header.

## ✨ Benefits

1. **Bilingual Support**: Full French and English support
2. **Maintainability**: All text in one place (translation files)
3. **Consistency**: Shared terminology across the app
4. **Scalability**: Easy to add more languages

## 📚 Resources

- [react-i18next Documentation](https://react.i18next.com/)
- Translation files:
  - English: `apps/web/src/i18n/locales/en/translation.json`
  - French: `apps/web/src/i18n/locales/fr/translation.json`
