# react-call modal migration — status & handoff

Goal: every modal in `apps/web` and `apps/secondary` is a
[react-call](https://react-call.desko.dev) **Callable** (`await XDialog.call(props)`),
and every select fed by a React Query query gets an aligned **"+"** that opens a
nested Callable form to create the missing entity. The result is inserted into
the query cache feeding the select (or the list is refetched when rows are
enriched server-side) and then selected. Nesting is recursive
(e.g. class → program → study cycle).

## Status

| App | State |
| --- | --- |
| `apps/secondary` | **Done**, committed in `9d63f76` (+ fix `b0e1ef4`), verified in the browser. |
| `apps/web` | **Migration complete (WIP commit)**. Build passes and type errors are not worse than baseline. The nested flow class → program → cycle was verified in the browser. |

## Architecture (web)

- `src/components/callable/callable-dialog.tsx`: `CallableDialog` shell (`call`, `dismissValue`, `title`, `description`, `preventDismiss`) and `DIALOG_EXIT_MS`.
- `src/components/callable/callable-host.tsx`: the **single place** where each Callable Root is mounted (rendered in `main.tsx`). **Every new Callable must be added here**, otherwise `call()` throws "No <Root> found".
- `src/components/callable/confirm.tsx`: `Confirm` Callable plus the `confirmAction({...})` helper. This replaces the deleted `hooks/useConfirm.tsx`.
- `src/components/callable/quick-create.tsx`: `<QuickCreate onCreate label>{select}</QuickCreate>` renders the select with an aligned "+" button.
- `src/components/forms/coded-entity-select.tsx`: `onCreate` / `createLabel` props. The consumer selects the created item itself (by id) inside `onCreate`.
- Entity form Callables (`ClassFormDialog`, `ProgramFormDialog`, …) live in their module (`src/modules/<module>/`) and resolve with the created entity (`undefined` when dismissed).
- `src/lib/query-cache.ts`: `upsertInList(old, item)` works for arrays and for `{ items, total }`.
- Pattern: `useMutationFlow(call, async (call, data) => { ...; call.end(result) })` keeps the dialog open on error.

Example (inside a form):

```tsx
const createProgram = async () => {
  const program = await ProgramFormDialog.call({});
  if (!program) return;
  queryClient.setQueryData(KEY, (old) => upsertInList(old, program));
  form.setValue("programId", program.id, { shouldValidate: true });
};
```

## Gotchas found

1. **Radix Select inside a `<form>`** emits `onValueChange("")` when the value is set before the new option is registered. This is fixed centrally in `components/ui/select.tsx`, which ignores `""`.
2. **Stale `onChange` in CodedEntitySelect after create**: it would map code → id against the old list and clear the value. It was removed; `onCreate` selects the item instead.
3. **Shared query keys**: never reuse a key (`["programs"]`, `["classes"]`, …) with a different `queryFn` shape. Use dedicated keys (`classFormKeys`, `CLASSES_KEY = ["class-options"]`, …).
4. **Invalidation** must use `trpc.x.queryKey()`; the bare-array form invalidates everything.
5. Radix sets `aria-hidden` on the parent of a nested dialog. In Playwright, use the `[role=dialog]` CSS locator, not `getByRole`.
6. The CI Docker build runs `bun run build` in `apps/web`. Run it before pushing.

## Remaining / to verify

- [ ] Click through the converted dialogs in the browser. Only the class → program → cycle chain was tested end to end in web. Priorities: exams, class-courses, timetable, fees, deliberations, transitions (`ResolveItemSheet`), avatar crop (Account settings), grade delegates (`AssignDelegateDialog`).
- [x] ~~Legacy pages `pages/teacher/{StudentManagement,ClassCourseManagement,ExamManagement,CourseManagement}.tsx`~~ — **deleted** (were never routed/imported). `components/modals/` directory also deleted (no remaining consumers). Build verified clean.
- [ ] `AdmissionsManagement` drawer stays a `Sheet` (it is a master-detail panel, not a value-returning modal). Only a class "+" was added to it.
- [ ] Web type checking: `bun check-types` does not really check `apps/web`, and a plain `tsc` crashes on `NotificationBell.tsx` (TypeScript bug). There are about 1,800 pre-existing type errors, none added by this work.
