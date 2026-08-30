# Fee-Clearance Form Gaps — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close all 11 form gaps identified in the fee-clearance audit — missing fields, missing dialogs, and missing mutation flows — without touching any backend code.

**Architecture:** Each task targets one file (or two tightly coupled files). All mutations already exist on the backend (`trpcClient.feeClearance.*`). The pattern throughout is: useState-based form state + useMutation + shadcn Dialog/AlertDialog. i18n keys for most strings already exist; Task 1 adds the handful that are missing.

**Tech Stack:** React 18, tRPC client (`trpcClient.feeClearance.*`), TanStack Query (`useMutation`, `useQuery`), shadcn/ui (Dialog, AlertDialog, Input, Textarea, Select, Label, Button, Checkbox), i18next, Zod (for RecordPaymentDialog's local schema).

## Global Constraints

- No backend changes — all zod schemas and router procedures already exist.
- No new files — all changes are additions/edits inside existing files.
- i18n: add new keys to BOTH `apps/web/src/i18n/locales/fr/translation.json` AND `apps/web/src/i18n/locales/en/translation.json` under the `feeClearance` namespace. Existing keys must not be renamed or removed.
- Code style: tabs (width 2), double quotes, semicolons required. Follow existing patterns in each file.
- No tests for UI changes (project rule: UI changes are not unit-tested).
- Imports follow the existing pattern in each file (`@/components/…`, `@/utils/trpc`, etc.).
- Run `bun check` from the workspace root after every commit to fix formatting.

---

## File Map

| File | Change |
|---|---|
| `apps/web/src/i18n/locales/fr/translation.json` | Add ~12 new keys under `feeClearance` |
| `apps/web/src/i18n/locales/en/translation.json` | Add same keys in English |
| `apps/web/src/pages/admin/fee-clearance/FeeStructureDetailsTab.tsx` | Add inline edit form for name, description, totalAmount |
| `apps/web/src/pages/admin/fee-clearance/FeeStructureInstallmentsTab.tsx` | Add EditInstallmentDialog + pencil button per row |
| `apps/web/src/pages/admin/fee-clearance/FeeAssignmentDetail.tsx` | Add UpdateDiscountDialog, ExemptWithNotesDialog, reference+notes to confirmOrder inline, reference+expiresAt to CreateOrderDialog, notes to RecordPaymentDialog |
| `apps/web/src/pages/admin/fee-clearance/FeeStructuresList.tsx` | Add programId + cycleLevelId selects to CreateStructureDialog |
| `apps/web/src/pages/admin/fee-clearance/FeeAssignmentsList.tsx` | Add AssignStudentDialog + "students" mode to BulkAssignDialog |
| `apps/web/src/pages/admin/fee-clearance/BankImportDialog.tsx` | Add notes field |

---

### Task 1: i18n — add missing keys

**Files:**
- Modify: `apps/web/src/i18n/locales/fr/translation.json`
- Modify: `apps/web/src/i18n/locales/en/translation.json`

**Interfaces:**
- Produces: translation keys consumed in Tasks 2–7

- [ ] **Step 1: Add French keys**

Open `apps/web/src/i18n/locales/fr/translation.json`. Locate the `feeClearance` object. Apply these additions (merge into existing structure — do NOT replace existing keys):

```json
// Inside feeClearance.structures.installments — add:
"edit": "Modifier la tranche",

// Inside feeClearance.structures.fields — add (cycleLevel already exists, skip if present):
"cycleLevel": "Niveau de cycle (optionnel)",
"studyCycle": "Cycle d'études",

// Inside feeClearance.assignments — add (assign already exists, check before adding):
"assignStudentTitle": "Affecter un étudiant",
"assignStudentSubmit": "Affecter",
"bulkAssignModeStudents": "Étudiants sélectionnés",
"discountLabel": "Montant de la remise",
"discountReasonLabel": "Motif (optionnel)",
"exemptNotes": "Motif d'exonération (optionnel)",
"exemptConfirmTitle": "Exonérer cet étudiant ?",
"exemptConfirmDescription": "L'étudiant sera marqué comme exonéré. Vous pouvez saisir un motif facultatif.",

// Inside feeClearance.orders.fields — add (expiresAt already exists, check):
"expiresAt": "Expire le (optionnel)",

// Inside feeClearance.bankImport — add:
"notes": "Note de batch (optionnelle)",
"notesPlaceholder": "Ex : virement du 15 juillet 2026"
```

- [ ] **Step 2: Add English keys**

Open `apps/web/src/i18n/locales/en/translation.json`. Apply the same keys in English:

```json
// Inside feeClearance.structures.installments — add:
"edit": "Edit installment",

// Inside feeClearance.structures.fields — add:
"studyCycle": "Study cycle",

// Inside feeClearance.assignments — add:
"assignStudentTitle": "Assign a student",
"assignStudentSubmit": "Assign",
"bulkAssignModeStudents": "Selected students",
"discountLabel": "Discount amount",
"discountReasonLabel": "Reason (optional)",
"exemptNotes": "Exemption reason (optional)",
"exemptConfirmTitle": "Mark student as exempt?",
"exemptConfirmDescription": "The student will be marked as exempt. You may enter an optional reason.",
"expiresAt": "Expires at (optional)",
"notes": "Batch note (optional)",
"notesPlaceholder": "E.g. bank transfer of July 15 2026"
```

- [ ] **Step 3: Verify JSON is valid**

```bash
cd apps/web && node -e "JSON.parse(require('fs').readFileSync('src/i18n/locales/fr/translation.json','utf8')); JSON.parse(require('fs').readFileSync('src/i18n/locales/en/translation.json','utf8')); console.log('OK')"
```
Expected output: `OK`

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/i18n/locales/fr/translation.json apps/web/src/i18n/locales/en/translation.json
git commit -m "i18n: add missing fee-clearance keys for form gap fixes"
```

---

### Task 2: FeeStructureDetailsTab — inline edit for name, description, totalAmount

**Files:**
- Modify: `apps/web/src/pages/admin/fee-clearance/FeeStructureDetailsTab.tsx`

**Interfaces:**
- Consumes: `trpcClient.feeClearance.updateStructure` — input `{ id, name?, description?, totalAmount? }`
- Consumes: `trpc.feeClearance.getStructure.queryKey({ id })` for invalidation

- [ ] **Step 1: Rewrite FeeStructureDetailsTab.tsx**

Replace the entire file content with:

```tsx
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, X, Check } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";

type EditField = "name" | "description" | "totalAmount" | null;

export default function FeeStructureDetailsTab() {
	const { id } = useParams<{ id: string }>();
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [editField, setEditField] = useState<EditField>(null);
	const [editValue, setEditValue] = useState("");

	const { data: structure } = useQuery(
		trpc.feeClearance.getStructure.queryOptions({ id: id! }),
	);

	const mut = useMutation({
		mutationFn: (patch: { name?: string; description?: string; totalAmount?: number }) =>
			trpcClient.feeClearance.updateStructure.mutate({ id: id!, ...patch }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.feeClearance.getStructure.queryKey({ id: id! }),
			});
			toast.success(t("common.saved"));
			setEditField(null);
		},
		onError: (e) => toast.error(e.message),
	});

	if (!structure) return null;

	const formatAmount = (v: string | null) =>
		v ? `${Number(v).toLocaleString()} ${structure.currency}` : "—";

	function startEdit(field: EditField) {
		setEditField(field);
		if (field === "name") setEditValue(structure!.name);
		else if (field === "description") setEditValue(structure!.description ?? "");
		else if (field === "totalAmount")
			setEditValue(structure!.totalAmount ? String(Number(structure!.totalAmount)) : "");
	}

	function commitEdit() {
		if (!editField) return;
		if (editField === "name") {
			if (!editValue.trim()) return;
			mut.mutate({ name: editValue.trim() });
		} else if (editField === "description") {
			mut.mutate({ description: editValue || undefined });
		} else if (editField === "totalAmount") {
			const n = Number(editValue);
			if (Number.isNaN(n) || n < 0) return;
			mut.mutate({ totalAmount: n });
		}
	}

	function InlineEdit({
		field,
		displayValue,
		inputType = "text",
	}: {
		field: EditField;
		displayValue: React.ReactNode;
		inputType?: "text" | "number";
	}) {
		const isEditing = editField === field;
		return (
			<div className="flex items-center gap-1">
				{isEditing ? (
					<>
						<Input
							autoFocus
							type={inputType}
							min={inputType === "number" ? 0 : undefined}
							value={editValue}
							onChange={(e) => setEditValue(e.target.value)}
							className="h-7 text-sm"
							onKeyDown={(e) => {
								if (e.key === "Enter") commitEdit();
								if (e.key === "Escape") setEditField(null);
							}}
						/>
						<Button
							size="sm"
							variant="ghost"
							disabled={mut.isPending}
							onClick={commitEdit}
							className="h-7 w-7 p-0"
						>
							<Check className="h-3.5 w-3.5 text-green-600" />
						</Button>
						<Button
							size="sm"
							variant="ghost"
							onClick={() => setEditField(null)}
							className="h-7 w-7 p-0"
						>
							<X className="h-3.5 w-3.5" />
						</Button>
					</>
				) : (
					<>
						<span>{displayValue}</span>
						<Button
							size="sm"
							variant="ghost"
							onClick={() => startEdit(field)}
							className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
						>
							<Pencil className="h-3 w-3 text-muted-foreground" />
						</Button>
					</>
				)}
			</div>
		);
	}

	return (
		<div className="grid grid-cols-3 gap-4 rounded-lg border p-4 pt-6">
			<div className="group">
				<p className="text-muted-foreground text-xs">
					{t("feeClearance.structures.fields.totalAmount")}
				</p>
				<p className="font-bold text-2xl">
					<InlineEdit
						field="totalAmount"
						displayValue={formatAmount(structure.totalAmount)}
						inputType="number"
					/>
				</p>
			</div>
			<div className="group">
				<p className="text-muted-foreground text-xs">
					{t("feeClearance.structures.fields.name")}
				</p>
				<p className="font-medium">
					<InlineEdit field="name" displayValue={structure.name} />
				</p>
			</div>
			<div>
				<p className="text-muted-foreground text-xs">
					{t("feeClearance.structures.fields.isActive")}
				</p>
				<Badge variant={structure.isActive ? "default" : "secondary"}>
					{structure.isActive ? t("common.active") : t("common.inactive")}
				</Badge>
			</div>
			<div className="col-span-2 group">
				<p className="text-muted-foreground text-xs">
					{t("feeClearance.structures.fields.description")}
				</p>
				<p className="font-medium text-sm">
					<InlineEdit
						field="description"
						displayValue={structure.description ?? "—"}
					/>
				</p>
			</div>
			<div>
				<p className="text-muted-foreground text-xs">
					{t("feeClearance.structures.fields.program")}
				</p>
				<p className="font-medium">{structure.program?.shortName ?? "—"}</p>
			</div>
		</div>
	);
}
```

- [ ] **Step 2: Type-check**

```bash
cd apps/web && bun run tsc --noEmit 2>&1 | grep FeeStructureDetailsTab
```
Expected: no errors for this file.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/admin/fee-clearance/FeeStructureDetailsTab.tsx
git commit -m "feat(fee-clearance): add inline edit for structure name, description, totalAmount"
```

---

### Task 3: FeeStructureInstallmentsTab — add EditInstallmentDialog

**Files:**
- Modify: `apps/web/src/pages/admin/fee-clearance/FeeStructureInstallmentsTab.tsx`

**Interfaces:**
- Consumes: `trpcClient.feeClearance.updateInstallment` — input `{ id, label?, amount?, dueDate? }`
- Consumes: `trpc.feeClearance.getStructure.queryKey({ id })` for invalidation

- [ ] **Step 1: Add Pencil import and editTarget state**

At the top of `FeeStructureInstallmentsTab.tsx`, change:

```tsx
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
```

to:

```tsx
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
```

- [ ] **Step 2: Add editTarget state and mutation in FeeStructureInstallmentsTab**

After the `deleteInstallmentMut` mutation block (around line 47), add:

```tsx
const [editTarget, setEditTarget] = useState<{
	id: string;
	label: string;
	amount: string;
	dueDate: string;
} | null>(null);
```

- [ ] **Step 3: Add pencil button in the table row actions**

Find this block in the TableCell for actions:

```tsx
<TableCell className="text-right">
	<Button
		variant="ghost"
		size="sm"
		onClick={() => deleteInstallmentMut.mutate(inst.id)}
	>
		<Trash2 className="h-4 w-4 text-destructive" />
	</Button>
</TableCell>
```

Replace with:

```tsx
<TableCell className="text-right">
	<Button
		variant="ghost"
		size="sm"
		onClick={() =>
			setEditTarget({
				id: inst.id,
				label: inst.label,
				amount: inst.amount ? String(Number(inst.amount)) : "",
				dueDate: inst.dueDate
					? new Date(inst.dueDate).toISOString().slice(0, 10)
					: "",
			})
		}
	>
		<Pencil className="h-4 w-4" />
	</Button>
	<Button
		variant="ghost"
		size="sm"
		onClick={() => deleteInstallmentMut.mutate(inst.id)}
	>
		<Trash2 className="h-4 w-4 text-destructive" />
	</Button>
</TableCell>
```

- [ ] **Step 4: Add EditInstallmentDialog usage after AddInstallmentDialog**

After `<AddInstallmentDialog … />` (end of FeeStructureInstallmentsTab return), add:

```tsx
{editTarget && (
	<EditInstallmentDialog
		open={!!editTarget}
		onOpenChange={(o) => !o && setEditTarget(null)}
		installment={editTarget}
		currency={structure.currency}
		onSaved={() => {
			queryClient.invalidateQueries({
				queryKey: trpc.feeClearance.getStructure.queryKey({ id: id! }),
			});
			setEditTarget(null);
		}}
	/>
)}
```

- [ ] **Step 5: Add EditInstallmentDialog component at the bottom of the file**

After the closing brace of `AddInstallmentDialog`, append:

```tsx
function EditInstallmentDialog({
	open,
	onOpenChange,
	installment,
	currency,
	onSaved,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	installment: { id: string; label: string; amount: string; dueDate: string };
	currency: string;
	onSaved: () => void;
}) {
	const { t } = useTranslation();
	const [form, setForm] = useState({
		label: installment.label,
		amount: installment.amount,
		dueDate: installment.dueDate,
	});

	const mut = useMutation({
		mutationFn: () =>
			trpcClient.feeClearance.updateInstallment.mutate({
				id: installment.id,
				label: form.label || undefined,
				amount: form.amount ? Number(form.amount) : undefined,
				dueDate: form.dueDate || null,
			}),
		onSuccess: () => {
			toast.success(t("common.saved"));
			onSaved();
		},
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{t("feeClearance.structures.installments.edit")}
					</DialogTitle>
				</DialogHeader>
				<DialogBody className="space-y-4">
					<div>
						<Label>{t("feeClearance.structures.installments.label")}</Label>
						<Input
							value={form.label}
							onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
						/>
					</div>
					<div>
						<Label>
							{t("feeClearance.structures.installments.amount")} ({currency})
						</Label>
						<Input
							type="number"
							min={0}
							value={form.amount}
							onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
						/>
					</div>
					<div>
						<Label>{t("feeClearance.structures.installments.dueDate")}</Label>
						<Input
							type="date"
							value={form.dueDate}
							onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
						/>
					</div>
				</DialogBody>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						{t("common.cancel")}
					</Button>
					<Button
						disabled={!form.label || !form.amount || mut.isPending}
						onClick={() => mut.mutate()}
					>
						{t("common.save")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
```

- [ ] **Step 6: Type-check**

```bash
cd apps/web && bun run tsc --noEmit 2>&1 | grep FeeStructureInstallmentsTab
```
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/pages/admin/fee-clearance/FeeStructureInstallmentsTab.tsx
git commit -m "feat(fee-clearance): add edit dialog for installments"
```

---

### Task 4: FeeAssignmentDetail — 5 small fixes in one file

Fixes: UpdateDiscountDialog, ExemptWithNotes dialog, confirmOrder reference+notes, createOrder reference+expiresAt, recordPayment notes.

**Files:**
- Modify: `apps/web/src/pages/admin/fee-clearance/FeeAssignmentDetail.tsx`

**Interfaces:**
- Consumes: `trpcClient.feeClearance.updateDiscount` — input `{ assignmentId, discountAmount, discountReason? }`
- Consumes: `trpcClient.feeClearance.exemptStudent` — input `{ assignmentId, notes? }`
- Consumes: `trpcClient.feeClearance.confirmOrder` — existing, add `reference?` and `notes?`
- Consumes: `trpcClient.feeClearance.createOrder` — existing, add `reference?` and `expiresAt?`
- Consumes: `trpcClient.feeClearance.recordPayment` — existing, add `notes?`

- [ ] **Step 1: Add new state variables**

In `FeeAssignmentDetail`, after the existing state declarations (around line 88), add:

```tsx
const [showExempt, setShowExempt] = useState(false);
const [showUpdateDiscount, setShowUpdateDiscount] = useState(false);
const [confirmOrderReference, setConfirmOrderReference] = useState("");
const [confirmOrderNotes, setConfirmOrderNotes] = useState("");
```

- [ ] **Step 2: Change exemptMut to pass notes — replace exemptMut and its button**

Replace the `exemptMut` mutation:

```tsx
const exemptMut = useMutation({
	mutationFn: () =>
		trpcClient.feeClearance.exemptStudent.mutate({ assignmentId: id! }),
	onSuccess: () => {
		toast.success(t("common.saved"));
		invalidate();
	},
});
```

with:

```tsx
const exemptMut = useMutation({
	mutationFn: (notes?: string) =>
		trpcClient.feeClearance.exemptStudent.mutate({
			assignmentId: id!,
			notes: notes || undefined,
		}),
	onSuccess: () => {
		toast.success(t("common.saved"));
		invalidate();
		setShowExempt(false);
	},
});
```

- [ ] **Step 3: Replace bare exempt button with button that opens dialog**

Find:

```tsx
{assignment.status !== "exempt" && assignment.status !== "paid" && (
	<Button variant="outline" onClick={() => exemptMut.mutate()}>
		{t("feeClearance.assignments.exempt")}
	</Button>
)}
```

Replace with:

```tsx
{assignment.status !== "exempt" && assignment.status !== "paid" && (
	<Button variant="outline" onClick={() => setShowExempt(true)}>
		{t("feeClearance.assignments.exempt")}
	</Button>
)}
```

- [ ] **Step 4: Add "Update discount" button next to the discount display**

Find the discount block:

```tsx
{Number(assignment.discountAmount) > 0 && (
	<div className="rounded-lg border p-3 text-sm">
		<span className="font-medium">
			{t("feeClearance.assignments.fields.discount")}:
		</span>{" "}
		{formatAmount(Number(assignment.discountAmount))}
		{assignment.discountReason && ` — ${assignment.discountReason}`}
	</div>
)}
```

Replace with:

```tsx
<div className="flex items-center justify-between rounded-lg border p-3 text-sm">
	<div>
		<span className="font-medium">
			{t("feeClearance.assignments.fields.discount")}:
		</span>{" "}
		{Number(assignment.discountAmount) > 0
			? formatAmount(Number(assignment.discountAmount))
			: "—"}
		{assignment.discountReason && ` — ${assignment.discountReason}`}
	</div>
	{assignment.status !== "paid" && assignment.status !== "exempt" && (
		<Button
			variant="ghost"
			size="sm"
			onClick={() => setShowUpdateDiscount(true)}
		>
			<Pencil className="h-4 w-4" />
		</Button>
	)}
</div>
```

This block is shown unconditionally (discount may be 0, still editable). Remove the existing `{Number(assignment.discountAmount) > 0 && ...}` guard so discount is always shown.

- [ ] **Step 5: Add Pencil to the import from lucide-react**

Find:

```tsx
import {
	ArrowLeft,
	CheckCircle,
	ClipboardList,
	Download,
	FileText,
	Plus,
	Trash2,
	XCircle,
} from "lucide-react";
```

Replace with:

```tsx
import {
	ArrowLeft,
	CheckCircle,
	ClipboardList,
	Download,
	FileText,
	Pencil,
	Plus,
	Trash2,
	XCircle,
} from "lucide-react";
```

- [ ] **Step 6: Add reference and notes to confirmOrder inline form**

In the `<AlertDialog open={!!confirmOrderId} …>` content, after the payment method `<div className="grid gap-1">` block, add:

```tsx
<div className="grid gap-1">
	<label className="font-medium text-sm" htmlFor="confirm-reference">
		{t("feeClearance.orders.fields.reference")}
	</label>
	<input
		id="confirm-reference"
		type="text"
		className="rounded-md border px-3 py-1.5 text-sm"
		placeholder={t("common.optional")}
		value={confirmOrderReference}
		onChange={(e) => setConfirmOrderReference(e.target.value)}
	/>
</div>
<div className="grid gap-1">
	<label className="font-medium text-sm" htmlFor="confirm-notes">
		{t("feeClearance.orders.fields.notes")}
	</label>
	<input
		id="confirm-notes"
		type="text"
		className="rounded-md border px-3 py-1.5 text-sm"
		placeholder={t("common.optional")}
		value={confirmOrderNotes}
		onChange={(e) => setConfirmOrderNotes(e.target.value)}
	/>
</div>
```

- [ ] **Step 7: Pass reference and notes to confirmOrderMut**

Update `confirmOrderMut` mutationFn type and call:

```tsx
const confirmOrderMut = useMutation({
	mutationFn: ({
		orderId,
		paymentDate,
		paymentMethod,
		reference,
		notes,
	}: {
		orderId: string;
		paymentDate: string;
		paymentMethod: string;
		reference?: string;
		notes?: string;
	}) =>
		trpcClient.feeClearance.confirmOrder.mutate({
			orderId,
			paymentDate,
			paymentMethod: paymentMethod as
				| "cash"
				| "bank_transfer"
				| "mobile_money"
				| "check"
				| "other",
			reference: reference || undefined,
			notes: notes || undefined,
		}),
	onSuccess: () => {
		toast.success(t("feeClearance.orders.confirmed"));
		invalidate();
		setConfirmOrderId(null);
		setConfirmOrderReference("");
		setConfirmOrderNotes("");
	},
});
```

Update the `AlertDialogAction onClick` to pass the new fields:

```tsx
onClick={() =>
	confirmOrderId &&
	confirmOrderMut.mutate({
		orderId: confirmOrderId,
		paymentDate: confirmPaymentDate,
		paymentMethod: confirmPaymentMethod,
		reference: confirmOrderReference || undefined,
		notes: confirmOrderNotes || undefined,
	})
}
```

- [ ] **Step 8: Add reference and expiresAt to CreateOrderDialog**

In `CreateOrderDialog`, change the form state:

```tsx
const [form, setForm] = useState({
	amount: "",
	notes: "",
	reference: "",
	expiresAt: "",
	installmentIds: [] as string[],
});
```

In the `mutationFn`:

```tsx
trpcClient.feeClearance.createOrder.mutate({
	feeAssignmentId,
	amount: Number(form.amount),
	notes: form.notes || undefined,
	reference: form.reference || undefined,
	expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
	installmentIds: form.installmentIds.length ? form.installmentIds : undefined,
}),
```

In the reset inside `onSuccess`:

```tsx
setForm({ amount: "", notes: "", reference: "", expiresAt: "", installmentIds: [] });
```

In the `<DialogBody>`, after the existing notes `<div>`, add:

```tsx
<div>
	<Label>{t("feeClearance.orders.fields.reference")}</Label>
	<Input
		value={form.reference}
		placeholder={t("common.optional")}
		onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
	/>
</div>
<div>
	<Label>{t("feeClearance.assignments.expiresAt")}</Label>
	<Input
		type="datetime-local"
		value={form.expiresAt}
		onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
	/>
</div>
```

- [ ] **Step 9: Add notes to RecordPaymentDialog**

In `paymentSchema`, add `notes`:

```tsx
const paymentSchema = z.object({
	amount: z.coerce.number({ invalid_type_error: "Required" }).positive(),
	paymentDate: z.string().min(1, "Required"),
	paymentMethod: z.enum(PAYMENT_METHODS),
	reference: z.string().optional(),
	notes: z.string().optional(),
	installmentId: z.string().optional(),
});
type PaymentForm = z.infer<typeof paymentSchema>;
```

In `form.defaultValues`, add `notes: ""`.

In the `mutationFn`:

```tsx
trpcClient.feeClearance.recordPayment.mutate({
	feeAssignmentId,
	amount: values.amount,
	currency: "XAF",
	paymentDate: values.paymentDate,
	paymentMethod: values.paymentMethod,
	reference: values.reference || undefined,
	notes: values.notes || undefined,
	installmentId: values.installmentId || undefined,
}),
```

In `RecordPaymentDialog`'s `<DialogBody>`, after the reference field, add:

```tsx
<div>
	<Label>{t("feeClearance.payments.fields.notes")}</Label>
	<Input
		{...form.register("notes")}
		placeholder={t("common.optional")}
	/>
</div>
```

- [ ] **Step 10: Add dialogs to JSX — UpdateDiscountDialog and ExemptWithNotesDialog**

At the end of `FeeAssignmentDetail`'s return JSX, before the closing `</div>`, add:

```tsx
<UpdateDiscountDialog
	open={showUpdateDiscount}
	onOpenChange={setShowUpdateDiscount}
	assignmentId={id!}
	currentDiscount={Number(assignment.discountAmount)}
	currentReason={assignment.discountReason ?? ""}
	onSaved={() => {
		invalidate();
		setShowUpdateDiscount(false);
	}}
/>

<ExemptWithNotesDialog
	open={showExempt}
	onOpenChange={setShowExempt}
	onConfirm={(notes) => exemptMut.mutate(notes)}
	isPending={exemptMut.isPending}
/>
```

- [ ] **Step 11: Add UpdateDiscountDialog and ExemptWithNotesDialog components**

At the bottom of the file, after the last component, add:

```tsx
function UpdateDiscountDialog({
	open,
	onOpenChange,
	assignmentId,
	currentDiscount,
	currentReason,
	onSaved,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	assignmentId: string;
	currentDiscount: number;
	currentReason: string;
	onSaved: () => void;
}) {
	const { t } = useTranslation();
	const [amount, setAmount] = useState(String(currentDiscount));
	const [reason, setReason] = useState(currentReason);

	const mut = useMutation({
		mutationFn: () =>
			trpcClient.feeClearance.updateDiscount.mutate({
				assignmentId,
				discountAmount: Number(amount),
				discountReason: reason || undefined,
			}),
		onSuccess: () => {
			toast.success(t("common.saved"));
			onSaved();
		},
		onError: (e) => toast.error(e.message),
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t("feeClearance.assignments.updateDiscount")}</DialogTitle>
				</DialogHeader>
				<DialogBody className="space-y-4">
					<div>
						<Label>{t("feeClearance.assignments.discountLabel")}</Label>
						<Input
							autoFocus
							type="number"
							min={0}
							value={amount}
							onChange={(e) => setAmount(e.target.value)}
						/>
					</div>
					<div>
						<Label>{t("feeClearance.assignments.discountReasonLabel")}</Label>
						<Input
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							placeholder={t("common.optional")}
						/>
					</div>
				</DialogBody>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						{t("common.cancel")}
					</Button>
					<Button disabled={mut.isPending} onClick={() => mut.mutate()}>
						{t("common.save")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function ExemptWithNotesDialog({
	open,
	onOpenChange,
	onConfirm,
	isPending,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	onConfirm: (notes?: string) => void;
	isPending: boolean;
}) {
	const { t } = useTranslation();
	const [notes, setNotes] = useState("");

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{t("feeClearance.assignments.exemptConfirmTitle")}
					</AlertDialogTitle>
					<AlertDialogDescription>
						{t("feeClearance.assignments.exemptConfirmDescription")}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<div className="px-1 py-2">
					<label className="font-medium text-sm">
						{t("feeClearance.assignments.exemptNotes")}
					</label>
					<input
						type="text"
						className="mt-1 w-full rounded-md border px-3 py-1.5 text-sm"
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
					/>
				</div>
				<AlertDialogFooter>
					<AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
					<AlertDialogAction
						disabled={isPending}
						onClick={() => onConfirm(notes || undefined)}
					>
						{t("feeClearance.assignments.exempt")}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
```

- [ ] **Step 12: Type-check**

```bash
cd apps/web && bun run tsc --noEmit 2>&1 | grep FeeAssignmentDetail
```
Expected: no errors.

- [ ] **Step 13: Commit**

```bash
git add apps/web/src/pages/admin/fee-clearance/FeeAssignmentDetail.tsx
git commit -m "feat(fee-clearance): updateDiscount dialog, exempt with notes, order reference/expiry, payment notes"
```

---

### Task 5: FeeStructuresList — add programId + cycleLevelId to CreateStructureDialog

**Files:**
- Modify: `apps/web/src/pages/admin/fee-clearance/FeeStructuresList.tsx`

**Interfaces:**
- Consumes: `trpc.programs.list.queryOptions({})` — returns `{ items: [{ id, name, shortName }] }`
- Consumes: `trpc.studyCycles.listCycles.queryOptions({ limit: 100 })` — or `listPaged`; check exact name. Check `trpcClient.studyCycles.listCycles.query()` in ClassManagement.tsx line 299.
- Consumes: `trpc.studyCycles.listLevels.queryOptions({ cycleId })` — returns `[{ id, code, name }]`
- Produces: `programId?` and `cycleLevelId?` sent to `createStructure`

- [ ] **Step 1: Add imports**

In `FeeStructuresList.tsx`, add to existing imports:

```tsx
import { useQuery } from "@tanstack/react-query";  // already imported
// Add these selects if not already present:
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
```

(Select components may already be imported — check and only add missing ones.)

- [ ] **Step 2: Update CreateStructureDialog form state and component**

In `CreateStructureDialog`, change the form state to include `programId`, `studyCycleId` (local UI only), and `cycleLevelId`:

```tsx
const [form, setForm] = useState({
	name: "",
	academicYearId: "",
	totalAmount: "",
	currency: "XAF",
	description: "",
	programId: "",
	studyCycleId: "",
	cycleLevelId: "",
});
```

Add inside the component (before return):

```tsx
const { data: programs } = useQuery(trpc.programs.list.queryOptions({}));

const { data: cycles } = useQuery(
	trpc.studyCycles.listPaged.queryOptions({ page: 1, pageSize: 100 }),
);

const { data: cyclelevels } = useQuery({
	...trpc.studyCycles.listLevels.queryOptions({ cycleId: form.studyCycleId }),
	enabled: !!form.studyCycleId,
});
```

Update the `mutationFn` to pass optional fields:

```tsx
trpcClient.feeClearance.createStructure.mutate({
	name: form.name,
	academicYearId: form.academicYearId,
	totalAmount: Number(form.totalAmount),
	currency: form.currency,
	description: form.description || undefined,
	programId: form.programId || undefined,
	cycleLevelId: form.cycleLevelId || undefined,
}),
```

Update the reset in `onSuccess`:

```tsx
setForm({
	name: "",
	academicYearId: "",
	totalAmount: "",
	currency: "XAF",
	description: "",
	programId: "",
	studyCycleId: "",
	cycleLevelId: "",
});
```

- [ ] **Step 3: Add program and cycle level selects to DialogBody**

After the description field in `<DialogBody>`, add:

```tsx
<div>
	<Label>{t("feeClearance.structures.fields.program")}</Label>
	<Select
		value={form.programId || "__none__"}
		onValueChange={(v) =>
			setForm((f) => ({ ...f, programId: v === "__none__" ? "" : v }))
		}
	>
		<SelectTrigger className="mt-1">
			<SelectValue placeholder={t("common.optional")} />
		</SelectTrigger>
		<SelectContent>
			<SelectItem value="__none__">{t("common.none")}</SelectItem>
			{programs?.items?.map((p) => (
				<SelectItem key={p.id} value={p.id}>
					{p.name}
				</SelectItem>
			))}
		</SelectContent>
	</Select>
</div>
<div>
	<Label>{t("feeClearance.structures.fields.studyCycle")}</Label>
	<Select
		value={form.studyCycleId || "__none__"}
		onValueChange={(v) =>
			setForm((f) => ({
				...f,
				studyCycleId: v === "__none__" ? "" : v,
				cycleLevelId: "",
			}))
		}
	>
		<SelectTrigger className="mt-1">
			<SelectValue placeholder={t("common.optional")} />
		</SelectTrigger>
		<SelectContent>
			<SelectItem value="__none__">{t("common.none")}</SelectItem>
			{cycles?.items?.map((c) => (
				<SelectItem key={c.id} value={c.id}>
					{c.name}
				</SelectItem>
			))}
		</SelectContent>
	</Select>
</div>
{form.studyCycleId && (
	<div>
		<Label>{t("feeClearance.structures.fields.cycleLevel")}</Label>
		<Select
			value={form.cycleLevelId || "__none__"}
			onValueChange={(v) =>
				setForm((f) => ({
					...f,
					cycleLevelId: v === "__none__" ? "" : v,
				}))
			}
		>
			<SelectTrigger className="mt-1">
				<SelectValue placeholder={t("common.optional")} />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="__none__">{t("common.none")}</SelectItem>
				{cyclelevels?.map((l) => (
					<SelectItem key={l.id} value={l.id}>
						{l.code} — {l.name}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	</div>
)}
```

- [ ] **Step 4: Type-check**

```bash
cd apps/web && bun run tsc --noEmit 2>&1 | grep FeeStructuresList
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/pages/admin/fee-clearance/FeeStructuresList.tsx
git commit -m "feat(fee-clearance): add program and cycle level selectors to create structure dialog"
```

---

### Task 6: FeeAssignmentsList — AssignStudentDialog + bulkAssignStudents mode

**Files:**
- Modify: `apps/web/src/pages/admin/fee-clearance/FeeAssignmentsList.tsx`

**Interfaces:**
- Consumes: `trpcClient.feeClearance.assignStudent` — input `{ studentId, academicYearId, feeStructureId, discountAmount?, discountReason?, notes? }`
- Consumes: `trpc.feeClearance.previewBulkAssignStudents.queryOptions({ studentIds, feeStructureId })` — returns `PreviewResult` shape (same as previewBulkAssign)
- Consumes: `trpcClient.feeClearance.bulkAssignStudents.mutate({ studentIds, feeStructureId, skipExisting: true })`
- Consumes: `trpc.students.list.queryOptions({ classId?, q?, limit: 100 })` — returns `{ items: [{ id, registrationNumber, profile: { firstName, lastName } }] }`

- [ ] **Step 1: Add showAssign state and "Assign student" button**

In `FeeAssignmentsList`, add state:

```tsx
const [showAssign, setShowAssign] = useState(false);
```

In the header button group, add a button before the bulk-assign button:

```tsx
<Button onClick={() => setShowAssign(true)}>
	<Plus className="mr-2 h-4 w-4" />
	{t("feeClearance.assignments.assign")}
</Button>
```

Add `Plus` to the lucide imports (it's already imported — verify).

- [ ] **Step 2: Add AssignStudentDialog usage**

After `<BulkAssignDialog …>`, add:

```tsx
<AssignStudentDialog
	open={showAssign}
	onOpenChange={setShowAssign}
	onDone={() => {
		queryClient.invalidateQueries({
			queryKey: trpc.feeClearance.listAssignments.queryKey(),
		});
		setShowAssign(false);
	}}
/>
```

- [ ] **Step 3: Add AssignStudentDialog component**

Add after the `BulkAssignDialog` function:

```tsx
function AssignStudentDialog({
	open,
	onOpenChange,
	onDone,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	onDone: () => void;
}) {
	const { t } = useTranslation();
	const [yearId, setYearId] = useState("");
	const [classId, setClassId] = useState("");
	const [studentId, setStudentId] = useState("");
	const [structureId, setStructureId] = useState("");
	const [discountAmount, setDiscountAmount] = useState("0");
	const [discountReason, setDiscountReason] = useState("");
	const [notes, setNotes] = useState("");

	const { data: structures } = useQuery(
		trpc.feeClearance.listStructures.queryOptions({
			academicYearId: yearId || undefined,
			isActive: true,
		}),
	);

	const { data: studentsData } = useQuery({
		...trpc.students.list.queryOptions({
			classId: classId || undefined,
			limit: 100,
		}),
		enabled: !!classId,
	});
	const students = studentsData?.items ?? studentsData ?? [];

	const mut = useMutation({
		mutationFn: () =>
			trpcClient.feeClearance.assignStudent.mutate({
				studentId,
				academicYearId: yearId,
				feeStructureId: structureId,
				discountAmount: Number(discountAmount) || 0,
				discountReason: discountReason || undefined,
				notes: notes || undefined,
			}),
		onSuccess: (result) => {
			toast.success(t("common.saved"));
			onDone();
		},
		onError: (e) => toast.error(e.message),
	});

	const canSubmit = !!studentId && !!yearId && !!structureId && !mut.isPending;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{t("feeClearance.assignments.assignStudentTitle")}</DialogTitle>
				</DialogHeader>
				<DialogBody className="space-y-4">
					<div>
						<Label>{t("feeClearance.structures.fields.academicYear")}</Label>
						<AcademicYearSelect
							value={yearId || null}
							onChange={(v) => {
								setYearId(v ?? "");
								setStructureId("");
							}}
							autoSelectActive
						/>
					</div>
					<div>
						<Label>{t("feeClearance.assignments.fields.class")}</Label>
						<ClassSelect
							academicYearId={yearId || null}
							value={classId || null}
							onChange={(v) => {
								setClassId(v ?? "");
								setStudentId("");
							}}
							disabled={!yearId}
						/>
					</div>
					<div>
						<Label>{t("feeClearance.assignments.fields.student")}</Label>
						<Select
							value={studentId}
							onValueChange={setStudentId}
							disabled={!classId}
						>
							<SelectTrigger className="mt-1">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{(Array.isArray(students) ? students : []).map((s: { id: string; registrationNumber?: string; profile?: { firstName: string; lastName: string } | null }) => (
									<SelectItem key={s.id} value={s.id}>
										{s.profile
											? `${s.profile.firstName} ${s.profile.lastName}`
											: s.registrationNumber ?? s.id}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div>
						<Label>{t("feeClearance.assignments.fields.structure")}</Label>
						<Select
							value={structureId}
							onValueChange={setStructureId}
							disabled={!yearId}
						>
							<SelectTrigger className="mt-1">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{structures?.map((s) => (
									<SelectItem key={s.id} value={s.id}>
										{s.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="flex gap-2">
						<div className="flex-1">
							<Label>{t("feeClearance.assignments.discountLabel")}</Label>
							<Input
								type="number"
								min={0}
								value={discountAmount}
								onChange={(e) => setDiscountAmount(e.target.value)}
							/>
						</div>
					</div>
					<div>
						<Label>{t("feeClearance.assignments.discountReasonLabel")}</Label>
						<Input
							value={discountReason}
							onChange={(e) => setDiscountReason(e.target.value)}
							placeholder={t("common.optional")}
						/>
					</div>
					<div>
						<Label>{t("feeClearance.assignments.fields.notes")}</Label>
						<Input
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							placeholder={t("common.optional")}
						/>
					</div>
				</DialogBody>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						{t("common.cancel")}
					</Button>
					<Button disabled={!canSubmit} onClick={() => mut.mutate()}>
						{t("feeClearance.assignments.assignStudentSubmit")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
```

- [ ] **Step 4: Add "students" mode to BulkAssignDialog**

Change `BulkMode` type:

```tsx
type BulkMode = "class" | "program" | "year" | "students";
```

In `BulkAssignDialog`, add state:

```tsx
const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
const [bulkStudentClassId, setBulkStudentClassId] = useState("");
```

Add to `canPreview`:

```tsx
const canPreview =
	!!structureId &&
	(mode === "class"
		? !!classId
		: mode === "program"
			? !!programId && !!yearId
			: mode === "students"
				? selectedStudentIds.size > 0
				: !!yearId);
```

Add to `reset()`:

```tsx
function reset() {
	setShowPreview(false);
	setStructureId("");
	setClassId("");
	setProgramId("");
	setSelectedStudentIds(new Set());
	setBulkStudentClassId("");
}
```

Add in the mode `<SelectContent>`:

```tsx
<SelectItem value="students">
	{t("feeClearance.assignments.bulkAssignModeStudents")}
</SelectItem>
```

Add students data query inside the component:

```tsx
const { data: bulkStudentsData } = useQuery({
	...trpc.students.list.queryOptions({
		classId: bulkStudentClassId || undefined,
		limit: 200,
	}),
	enabled: mode === "students" && !!bulkStudentClassId,
});
const bulkStudents = bulkStudentsData?.items ?? bulkStudentsData ?? [];
```

Add preview query for students:

```tsx
const previewStudents = useQuery({
	...trpc.feeClearance.previewBulkAssignStudents.queryOptions({
		studentIds: [...selectedStudentIds],
		feeStructureId: structureId,
	}),
	enabled: showPreview && mode === "students" && canPreview,
});
```

Update `activePreview` and `previewLoading`:

```tsx
const activePreview =
	mode === "class"
		? previewClass.data
		: mode === "program"
			? previewProgram.data
			: mode === "students"
				? previewStudents.data
				: previewYear.data;
const previewLoading =
	previewClass.isFetching ||
	previewProgram.isFetching ||
	previewYear.isFetching ||
	previewStudents.isFetching;
```

Add to `mut.mutationFn`:

```tsx
if (mode === "students")
	return trpcClient.feeClearance.bulkAssignStudents.mutate({
		studentIds: [...selectedStudentIds],
		feeStructureId: structureId,
		skipExisting: true,
	});
```

Add student-mode UI in the `<DialogBody>` after the year selector and before the structure selector:

```tsx
{mode === "students" && (
	<>
		<div>
			<Label>{t("admin.classes.title")}</Label>
			<ClassSelect
				academicYearId={yearId || null}
				value={bulkStudentClassId || null}
				onChange={(v) => {
					setBulkStudentClassId(v ?? "");
					setSelectedStudentIds(new Set());
					setShowPreview(false);
				}}
				disabled={!yearId}
			/>
		</div>
		{bulkStudentClassId && (
			<div className="max-h-48 overflow-y-auto rounded border p-2 space-y-1">
				{(Array.isArray(bulkStudents) ? bulkStudents : []).map((s: { id: string; registrationNumber?: string; profile?: { firstName: string; lastName: string } | null }) => {
					const checked = selectedStudentIds.has(s.id);
					return (
						<label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer">
							<input
								type="checkbox"
								className="h-4 w-4 rounded border"
								checked={checked}
								onChange={(e) => {
									setSelectedStudentIds((prev) => {
										const next = new Set(prev);
										if (e.target.checked) next.add(s.id);
										else next.delete(s.id);
										return next;
									});
									setShowPreview(false);
								}}
							/>
							{s.profile
								? `${s.profile.firstName} ${s.profile.lastName}`
								: s.registrationNumber ?? s.id}
						</label>
					);
				})}
			</div>
		)}
	</>
)}
```

- [ ] **Step 5: Type-check**

```bash
cd apps/web && bun run tsc --noEmit 2>&1 | grep FeeAssignmentsList
```
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/pages/admin/fee-clearance/FeeAssignmentsList.tsx
git commit -m "feat(fee-clearance): assign individual student dialog + bulk assign selected students mode"
```

---

### Task 7: BankImportDialog — add notes field

**Files:**
- Modify: `apps/web/src/pages/admin/fee-clearance/BankImportDialog.tsx`

**Interfaces:**
- Consumes: `trpcClient.feeClearance.applyBankImport` — add `notes?` to existing call

- [ ] **Step 1: Add notes state**

In `BankImportDialog`, add state:

```tsx
const [batchNotes, setBatchNotes] = useState("");
```

- [ ] **Step 2: Pass notes to applyMutation**

In `applyMutation.mutationFn`:

```tsx
trpcClient.feeClearance.applyBankImport.mutate({
	rows,
	paymentMethod: paymentMethod as never,
	forceMatchRefs: [...forceMatchRefs],
	notes: batchNotes || undefined,
}),
```

- [ ] **Step 3: Reset notes in handleClose**

In `handleClose()`:

```tsx
function handleClose() {
	setCsvText("");
	setParsedRows(null);
	setShowPreview(false);
	setForceMatchRefs(new Set());
	setBatchNotes("");
	onOpenChange(false);
}
```

- [ ] **Step 4: Add notes field to DialogBody**

In `<DialogBody>`, after the method `<div>` (the Select for paymentMethod), add:

```tsx
<div className="flex items-center gap-3">
	<Label className="shrink-0">
		{t("feeClearance.bankImport.notes")}
	</Label>
	<Input
		value={batchNotes}
		onChange={(e) => setBatchNotes(e.target.value)}
		placeholder={t("feeClearance.bankImport.notesPlaceholder")}
		className="flex-1"
	/>
</div>
```

Add `Input` to the import from `@/components/ui/input` (may already be imported — verify).

- [ ] **Step 5: Type-check**

```bash
cd apps/web && bun run tsc --noEmit 2>&1 | grep BankImportDialog
```
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/pages/admin/fee-clearance/BankImportDialog.tsx
git commit -m "feat(fee-clearance): add batch notes field to bank import dialog"
```

---

## Final step: type-check the whole workspace

- [ ] Run full type-check and fix any remaining errors:

```bash
bun check-types
```

Expected: zero errors in `apps/web`.

- [ ] Run Biome:

```bash
bun check
```

Expected: no formatting or lint errors.
