# Catalog Entity Hubs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace dialog-heavy flows for Programs and Classes with proper hub-and-tabs detail pages, following the existing `TeachingUnitDetail` / `ProfileHub` patterns.

**Architecture:** Each entity gets a hub layout component that fetches data, provides a React context, and renders `HubNav` (which already includes `<Outlet />` — do NOT add a second `<Outlet />` in the hub). Tab components are focused files that consume context. List pages gain `useNavigate` and route to the hub on row click.

**Tech Stack:** React Router v7, TanStack Query, tRPC (`trpc.X.queryOptions` for queries, `trpcClient.X.mutate` for mutations), react-hook-form + Zod, shadcn/ui, i18next

## Global Constraints

- **Include `<Outlet />`** in hub layout components below `<HubNav>` — this is the pattern used by `TeachingUnitDetail` (the reference implementation); HubNav only renders the nav links, not the tab content
- **`trpc` (options proxy) for queries**, **`trpcClient` for mutations** — import both from `@/utils/trpc`
- **All new files use tab indentation** (Biome enforced) — run `bun check` after each task
- **i18n keys** follow the pattern `programs.hub.tabs.*` and `classes.hub.tabs.*` — add to both `en/translation.json` and `fr/translation.json`
- **`RouterOutputs`** is exported from `@/utils/trpc` — use it for type inference
- **No Co-Authored-By trailers** in commit messages
- Spec: `docs/superpowers/specs/2026-07-13-catalog-entity-hubs-design.md`

---

## File Map

**New files — Programs hub:**
- `apps/web/src/pages/admin/programs/ProgramContext.tsx` — context + hook
- `apps/web/src/pages/admin/programs/ProgramDetail.tsx` — hub layout
- `apps/web/src/pages/admin/programs/ProgramDetailsTab.tsx` — program edit form
- `apps/web/src/pages/admin/programs/ProgramOptionsTab.tsx` — options CRUD
- `apps/web/src/pages/admin/programs/ProgramExportTemplatesTab.tsx` — export template assignments

**New files — Classes hub:**
- `apps/web/src/pages/admin/classes/ClassContext.tsx` — context + hook
- `apps/web/src/pages/admin/classes/ClassDetail.tsx` — hub layout
- `apps/web/src/pages/admin/classes/ClassDetailsTab.tsx` — class edit form
- `apps/web/src/pages/admin/classes/ClassStudentsTab.tsx` — enrolled students
- `apps/web/src/pages/admin/classes/ClassCoursesTab.tsx` — course assignments

**Modified files:**
- `apps/web/src/App.tsx` — add routes for both new hubs
- `apps/web/src/pages/teacher/ProgramManagement.tsx` — row click → navigate; slim create form; remove Options dialog
- `apps/web/src/pages/admin/ClassManagement.tsx` — row click → navigate; remove student roster dialog
- `apps/web/src/i18n/locales/en/translation.json` — add hub tab i18n keys
- `apps/web/src/i18n/locales/fr/translation.json` — add hub tab i18n keys

---

### Task 1: ProgramDetail hub — context, layout, routing, i18n

**Files:**
- Create: `apps/web/src/pages/admin/programs/ProgramContext.tsx`
- Create: `apps/web/src/pages/admin/programs/ProgramDetail.tsx`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/i18n/locales/en/translation.json`
- Modify: `apps/web/src/i18n/locales/fr/translation.json`

**Interfaces:**
- Produces: `ProgramContext` (imported by Tasks 2, 3, 4), `useProgramContext()` hook, `ProgramData` type
- Produces: Route `/admin/programs/:programId` → renders hub shell with 3 tab links

- [ ] **Step 1: Create ProgramContext**

```tsx
// apps/web/src/pages/admin/programs/ProgramContext.tsx
import { createContext, useContext } from "react";
import type { RouterOutputs } from "@/utils/trpc";

export type ProgramData = NonNullable<RouterOutputs["programs"]["getById"]>;

export interface ProgramContextValue {
	program: ProgramData;
	refetch: () => void;
}

export const ProgramContext = createContext<ProgramContextValue | null>(null);

export function useProgramContext(): ProgramContextValue {
	const ctx = useContext(ProgramContext);
	if (!ctx) throw new Error("useProgramContext must be used within ProgramDetail");
	return ctx;
}
```

- [ ] **Step 2: Create ProgramDetail hub layout**

```tsx
// apps/web/src/pages/admin/programs/ProgramDetail.tsx
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, Outlet, useParams } from "react-router";
import { HubNav } from "@/components/navigation/HubNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { trpc } from "@/utils/trpc";
import { ProgramContext } from "./ProgramContext";

const TABS = [
	{ path: "details", labelKey: "programs.hub.tabs.details" },
	{ path: "options", labelKey: "programs.hub.tabs.options" },
	{ path: "templates", labelKey: "programs.hub.tabs.templates" },
] as const;

export default function ProgramDetail() {
	const { programId } = useParams<{ programId: string }>();
	const { t } = useTranslation();

	const {
		data: program,
		isLoading,
		refetch,
	} = useQuery(trpc.programs.getById.queryOptions({ id: programId! }));

	if (isLoading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<Spinner className="h-8 w-8" />
			</div>
		);
	}

	if (!program) {
		return (
			<div className="py-12 text-center text-muted-foreground">
				{t("common.notFound")}
			</div>
		);
	}

	return (
		<ProgramContext.Provider value={{ program, refetch }}>
			<div className="space-y-6">
				<div className="flex items-start gap-4">
					<Button variant="ghost" size="icon" asChild>
						<Link to="/admin/programs/programs">
							<ArrowLeft className="h-4 w-4" />
						</Link>
					</Button>
					<div className="flex items-center gap-3">
						<GraduationCap className="h-5 w-5 text-primary" />
						<div>
							<h1 className="font-semibold text-xl">{program.name}</h1>
							<div className="flex items-center gap-2">
								<p className="text-muted-foreground text-sm">{program.code}</p>
								{program.abbreviation && (
									<Badge variant="outline">{program.abbreviation}</Badge>
								)}
							</div>
						</div>
					</div>
				</div>
				<HubNav
					tabs={TABS}
					basePath={`/admin/programs/${programId}`}
				/>
				<Outlet />
			</div>
		</ProgramContext.Provider>
	);
}
```

- [ ] **Step 3: Add routes in App.tsx**

In `App.tsx`, find the `{/* Programs hub */}` block (around line 349). Add an import at the top alongside the other admin imports:

```tsx
import ProgramDetail from "./pages/admin/programs/ProgramDetail";
import ProgramDetailsTab from "./pages/admin/programs/ProgramDetailsTab";
import ProgramOptionsTab from "./pages/admin/programs/ProgramOptionsTab";
import ProgramExportTemplatesTab from "./pages/admin/programs/ProgramExportTemplatesTab";
```

Inside the `<Route path="programs">` wrapper, after the closing `</Route>` for `TeachingUnitDetail`, add:

```tsx
<Route path=":programId" element={<ProgramDetail />}>
	<Route index element={<Navigate to="details" replace />} />
	<Route path="details" element={<ProgramDetailsTab />} />
	<Route path="options" element={<ProgramOptionsTab />} />
	<Route path="templates" element={<ProgramExportTemplatesTab />} />
</Route>
```

The final `<Route path="programs">` block must look like:

```tsx
{/* Programs hub */}
<Route path="programs">
	<Route element={<ProgramsHub />}>
		<Route index element={<Navigate to="programs" replace />} />
		<Route path="programs" element={<ProgramManagement />} />
		<Route
			path="teaching-units"
			element={<TeachingUnitManagement />}
		/>
		<Route path="courses" element={<CourseManagement />} />
	</Route>
	<Route
		path="teaching-units/:teachingUnitId"
		element={<TeachingUnitDetail />}
	>
		<Route index element={<Navigate to="details" replace />} />
		<Route path="details" element={<TeachingUnitDetailsTab />} />
		<Route path="courses" element={<TeachingUnitCoursesTab />} />
	</Route>
	<Route path=":programId" element={<ProgramDetail />}>
		<Route index element={<Navigate to="details" replace />} />
		<Route path="details" element={<ProgramDetailsTab />} />
		<Route path="options" element={<ProgramOptionsTab />} />
		<Route path="templates" element={<ProgramExportTemplatesTab />} />
	</Route>
</Route>
```

- [ ] **Step 4: Add i18n keys to English translation**

In `apps/web/src/i18n/locales/en/translation.json`, find the top-level `"programs"` key (or create it if it doesn't exist at root level). Add the `hub` section:

```json
"programs": {
  "hub": {
    "tabs": {
      "details": "Details",
      "options": "Options",
      "templates": "Export Templates"
    }
  }
}
```

- [ ] **Step 5: Add i18n keys to French translation**

In `apps/web/src/i18n/locales/fr/translation.json`, add the same structure:

```json
"programs": {
  "hub": {
    "tabs": {
      "details": "Détails",
      "options": "Options",
      "templates": "Modèles d'export"
    }
  }
}
```

- [ ] **Step 6: Verify type-check**

```bash
cd /home/yvan/Workspaces/Projects/sgn/grades-manager-api
bun check-types
```

Expected: no errors (ProgramDetailsTab, ProgramOptionsTab, ProgramExportTemplatesTab don't exist yet — their import in App.tsx will cause errors until Tasks 2–4 are done; comment out those 3 imports temporarily and stub the route elements with `{null}` for this task's type-check).

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/pages/admin/programs/ProgramContext.tsx \
        apps/web/src/pages/admin/programs/ProgramDetail.tsx \
        apps/web/src/App.tsx \
        apps/web/src/i18n/locales/en/translation.json \
        apps/web/src/i18n/locales/fr/translation.json
git commit -m "feat(programs): add ProgramDetail hub layout, context, routing, i18n"
```

---

### Task 2: ProgramDetailsTab

**Files:**
- Create: `apps/web/src/pages/admin/programs/ProgramDetailsTab.tsx`

**Interfaces:**
- Consumes: `useProgramContext()` from `./ProgramContext` — provides `program` (with `name`, `code`, `abbreviation`, `description`, `nameEn`, `domainFr`, `domainEn`, `specialiteFr`, `specialiteEn`, `diplomaTitleFr`, `diplomaTitleEn`, `attestationValidityFr`, `attestationValidityEn`, `cycleId`, `centerId`, `isCenterProgram`)
- Consumes: `trpcClient.programs.update.mutate({ id, ...fields })` — update accepts partial fields (all optional except `id`)
- Consumes: `trpcClient.studyCycles.listCycles.query({})` for cycle select
- Consumes: `trpcClient.centers.list.query({ limit: 200 })` for center select

- [ ] **Step 1: Create ProgramDetailsTab**

```tsx
// apps/web/src/pages/admin/programs/ProgramDetailsTab.tsx
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";
import { useProgramContext } from "./ProgramContext";

const schema = z.object({
	name: z.string().min(1, "Name is required"),
	nameEn: z.string().optional().nullable(),
	code: z.string().min(1, "Code is required"),
	abbreviation: z.string().optional().nullable(),
	description: z.string().optional().nullable(),
	domainFr: z.string().optional().nullable(),
	domainEn: z.string().optional().nullable(),
	specialiteFr: z.string().optional().nullable(),
	specialiteEn: z.string().optional().nullable(),
	diplomaTitleFr: z.string().optional().nullable(),
	diplomaTitleEn: z.string().optional().nullable(),
	attestationValidityFr: z.string().optional().nullable(),
	attestationValidityEn: z.string().optional().nullable(),
	cycleId: z.string().nullable().optional(),
	centerId: z.string().nullable().optional(),
	isCenterProgram: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

export default function ProgramDetailsTab() {
	const { t } = useTranslation();
	const { programId } = useParams<{ programId: string }>();
	const { program, refetch } = useProgramContext();
	const queryClient = useQueryClient();

	const { data: cycles } = useQuery({
		queryKey: ["study-cycles-select"],
		queryFn: () => trpcClient.studyCycles.listCycles.query({}),
	});

	const { data: centersData } = useQuery({
		queryKey: ["centers", "select"],
		queryFn: () => trpcClient.centers.list.query({ limit: 200 }),
	});
	const centers = centersData?.items ?? [];

	const form = useForm<FormData>({
		resolver: zodResolver(schema),
		defaultValues: {
			name: "",
			nameEn: "",
			code: "",
			abbreviation: "",
			description: "",
			domainFr: "",
			domainEn: "",
			specialiteFr: "",
			specialiteEn: "",
			diplomaTitleFr: "",
			diplomaTitleEn: "",
			attestationValidityFr: "",
			attestationValidityEn: "",
			cycleId: null,
			centerId: null,
			isCenterProgram: false,
		},
	});

	useEffect(() => {
		if (program) {
			form.reset({
				name: program.name ?? "",
				nameEn: program.nameEn ?? "",
				code: program.code ?? "",
				abbreviation: program.abbreviation ?? "",
				description: program.description ?? "",
				domainFr: program.domainFr ?? "",
				domainEn: program.domainEn ?? "",
				specialiteFr: program.specialiteFr ?? "",
				specialiteEn: program.specialiteEn ?? "",
				diplomaTitleFr: program.diplomaTitleFr ?? "",
				diplomaTitleEn: program.diplomaTitleEn ?? "",
				attestationValidityFr: program.attestationValidityFr ?? "",
				attestationValidityEn: program.attestationValidityEn ?? "",
				cycleId: program.cycleId ?? null,
				centerId: program.centerId ?? null,
				isCenterProgram: program.isCenterProgram ?? false,
			});
		}
	}, [program, form]);

	const updateMutation = useMutation({
		mutationFn: (data: FormData) =>
			trpcClient.programs.update.mutate({ id: programId!, ...data }),
		onSuccess: () => {
			toast.success(t("admin.programs.toast.updateSuccess", { defaultValue: "Program updated" }));
			queryClient.invalidateQueries(trpc.programs.getById.queryKey({ id: programId! }));
			refetch();
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const selectedCenterId = form.watch("centerId");

	return (
		<Card>
			<CardContent className="pt-6">
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit((data) => updateMutation.mutate(data))}
						className="space-y-6"
					>
						{/* Identity */}
						<div className="grid gap-4 md:grid-cols-2">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("admin.programs.fields.name", { defaultValue: "Name (FR)" })}</FormLabel>
										<FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="nameEn"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("admin.programs.fields.nameEn", { defaultValue: "Name (EN)" })}</FormLabel>
										<FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="code"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("admin.programs.fields.code", { defaultValue: "Code" })}</FormLabel>
										<FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="abbreviation"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("admin.programs.fields.abbreviation", { defaultValue: "Abbreviation" })}</FormLabel>
										<FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("admin.programs.fields.description", { defaultValue: "Description" })}</FormLabel>
									<FormControl><Textarea {...field} value={field.value ?? ""} rows={3} /></FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Academic */}
						<div className="grid gap-4 md:grid-cols-2">
							<FormField
								control={form.control}
								name="domainFr"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("admin.programs.fields.domainFr", { defaultValue: "Domain (FR)" })}</FormLabel>
										<FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="domainEn"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("admin.programs.fields.domainEn", { defaultValue: "Domain (EN)" })}</FormLabel>
										<FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="specialiteFr"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("admin.programs.fields.specialiteFr", { defaultValue: "Speciality (FR)" })}</FormLabel>
										<FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="specialiteEn"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("admin.programs.fields.specialiteEn", { defaultValue: "Speciality (EN)" })}</FormLabel>
										<FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="cycleId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("admin.programs.fields.cycle", { defaultValue: "Cycle" })}</FormLabel>
										<Select
											onValueChange={(v) => field.onChange(v === "none" ? null : v)}
											value={field.value ?? "none"}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder={t("common.none", { defaultValue: "None" })} />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="none">{t("common.none", { defaultValue: "None" })}</SelectItem>
												{(cycles?.items ?? []).map((c) => (
													<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="centerId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("admin.programs.fields.center", { defaultValue: "Center" })}</FormLabel>
										<Select
											onValueChange={(v) => field.onChange(v === "none" ? null : v)}
											value={field.value ?? "none"}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder={t("common.none", { defaultValue: "None" })} />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="none">{t("common.none", { defaultValue: "None" })}</SelectItem>
												{centers.map((c) => (
													<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						{selectedCenterId && (
							<FormField
								control={form.control}
								name="isCenterProgram"
								render={({ field }) => (
									<FormItem className="flex items-center gap-3">
										<FormControl>
											<Switch
												checked={field.value ?? false}
												onCheckedChange={field.onChange}
											/>
										</FormControl>
										<FormLabel className="mt-0">
											{t("admin.programs.fields.isCenterProgram", { defaultValue: "Center program" })}
										</FormLabel>
									</FormItem>
								)}
							/>
						)}

						{/* Document titles */}
						<div className="grid gap-4 md:grid-cols-2">
							<FormField
								control={form.control}
								name="diplomaTitleFr"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("admin.programs.fields.diplomaTitleFr", { defaultValue: "Diploma title (FR)" })}</FormLabel>
										<FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="diplomaTitleEn"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("admin.programs.fields.diplomaTitleEn", { defaultValue: "Diploma title (EN)" })}</FormLabel>
										<FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="attestationValidityFr"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("admin.programs.fields.attestationValidityFr", { defaultValue: "Attestation validity (FR)" })}</FormLabel>
										<FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="attestationValidityEn"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("admin.programs.fields.attestationValidityEn", { defaultValue: "Attestation validity (EN)" })}</FormLabel>
										<FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="flex justify-end pt-2">
							<Button type="submit" disabled={updateMutation.isPending}>
								{updateMutation.isPending
									? t("common.actions.saving", { defaultValue: "Saving..." })
									: t("common.actions.saveChanges")}
							</Button>
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}
```

- [ ] **Step 2: Restore App.tsx imports** (uncomment `ProgramDetailsTab` import added in Task 1 Step 3)

- [ ] **Step 3: Run type-check**

```bash
bun check-types
```

Expected: 0 errors (ProgramOptionsTab and ProgramExportTemplatesTab still stubbed).

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/pages/admin/programs/ProgramDetailsTab.tsx apps/web/src/App.tsx
git commit -m "feat(programs): add ProgramDetailsTab"
```

---

### Task 3: ProgramOptionsTab

**Files:**
- Create: `apps/web/src/pages/admin/programs/ProgramOptionsTab.tsx`

**Interfaces:**
- Consumes: `useProgramContext()` — provides `program.id`
- Consumes: `trpc.programOptions.list.queryOptions({ programId, limit: 100 })`
- Consumes: `trpcClient.programOptions.create.mutate({ programId, name, code, description })`
- Consumes: `trpcClient.programOptions.update.mutate({ id, programId, name, code, description })`
- Consumes: `trpcClient.programOptions.delete.mutate({ id })`
- Produces: Options CRUD table available at `/admin/programs/:programId/options`

- [ ] **Step 1: Create ProgramOptionsTab**

```tsx
// apps/web/src/pages/admin/programs/ProgramOptionsTab.tsx
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";
import type { RouterOutputs } from "@/utils/trpc";
import { useProgramContext } from "./ProgramContext";

type ProgramOption = RouterOutputs["programOptions"]["list"]["items"][number];

const optionSchema = z.object({
	name: z.string().min(1, "Name is required"),
	code: z.string().min(1, "Code is required"),
	description: z.string().optional(),
});
type OptionFormData = z.infer<typeof optionSchema>;

export default function ProgramOptionsTab() {
	const { t } = useTranslation();
	const { program } = useProgramContext();
	const queryClient = useQueryClient();
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [editingOption, setEditingOption] = useState<ProgramOption | null>(null);
	const [deleteId, setDeleteId] = useState<string | null>(null);

	const { data, isLoading } = useQuery(
		trpc.programOptions.list.queryOptions({ programId: program.id, limit: 100 }),
	);
	const options = data?.items ?? [];

	const form = useForm<OptionFormData>({
		resolver: zodResolver(optionSchema),
		defaultValues: { name: "", code: "", description: "" },
	});

	const invalidate = () =>
		queryClient.invalidateQueries(
			trpc.programOptions.list.queryKey({ programId: program.id, limit: 100 }),
		);

	const openCreate = () => {
		setEditingOption(null);
		form.reset({ name: "", code: "", description: "" });
		setIsDialogOpen(true);
	};

	const openEdit = (opt: ProgramOption) => {
		setEditingOption(opt);
		form.reset({
			name: opt.name,
			code: opt.code,
			description: opt.description ?? "",
		});
		setIsDialogOpen(true);
	};

	const createMutation = useMutation({
		mutationFn: (data: OptionFormData) =>
			trpcClient.programOptions.create.mutate({
				...data,
				programId: program.id,
			}),
		onSuccess: () => {
			toast.success(t("admin.programs.options.toast.create", { defaultValue: "Option added" }));
			invalidate();
			setIsDialogOpen(false);
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const updateMutation = useMutation({
		mutationFn: (data: OptionFormData) =>
			trpcClient.programOptions.update.mutate({
				id: editingOption!.id,
				programId: program.id,
				...data,
			}),
		onSuccess: () => {
			toast.success(t("admin.programs.options.toast.update", { defaultValue: "Option updated" }));
			invalidate();
			setIsDialogOpen(false);
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => trpcClient.programOptions.delete.mutate({ id }),
		onSuccess: () => {
			toast.success(t("admin.programs.options.toast.delete", { defaultValue: "Option deleted" }));
			invalidate();
			setDeleteId(null);
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const onSubmit = (data: OptionFormData) => {
		if (editingOption) {
			updateMutation.mutate(data);
		} else {
			createMutation.mutate(data);
		}
	};

	const isPending = createMutation.isPending || updateMutation.isPending;

	return (
		<>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle>
						{t("admin.programs.options.title", { defaultValue: "Program Options" })}
					</CardTitle>
					<Button size="sm" onClick={openCreate}>
						<Plus className="mr-2 h-4 w-4" />
						{t("admin.programs.options.add", { defaultValue: "Add Option" })}
					</Button>
				</CardHeader>
				<CardContent>
					{isLoading ? null : options.length === 0 ? (
						<Empty>
							<EmptyHeader>
								<EmptyMedia />
								<EmptyContent>
									<EmptyTitle>
										{t("admin.programs.options.empty.title", { defaultValue: "No options yet" })}
									</EmptyTitle>
									<EmptyDescription>
										{t("admin.programs.options.empty.description", { defaultValue: "Add specializations or tracks for this program." })}
									</EmptyDescription>
								</EmptyContent>
							</EmptyHeader>
							<Button size="sm" onClick={openCreate}>
								<Plus className="mr-2 h-4 w-4" />
								{t("admin.programs.options.add", { defaultValue: "Add Option" })}
							</Button>
						</Empty>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{t("admin.programs.options.fields.name", { defaultValue: "Name" })}</TableHead>
									<TableHead>{t("admin.programs.options.fields.code", { defaultValue: "Code" })}</TableHead>
									<TableHead>{t("admin.programs.options.fields.description", { defaultValue: "Description" })}</TableHead>
									<TableHead className="w-24" />
								</TableRow>
							</TableHeader>
							<TableBody>
								{options.map((opt) => (
									<TableRow key={opt.id}>
										<TableCell className="font-medium">{opt.name}</TableCell>
										<TableCell>{opt.code}</TableCell>
										<TableCell className="text-muted-foreground">{opt.description ?? "—"}</TableCell>
										<TableCell>
											<div className="flex items-center gap-1">
												<Button
													variant="ghost"
													size="icon"
													onClick={() => openEdit(opt)}
												>
													<Pencil className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													onClick={() => setDeleteId(opt.id)}
												>
													<Trash2 className="h-4 w-4 text-destructive" />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>

			{/* Create / Edit dialog */}
			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{editingOption
								? t("admin.programs.options.edit", { defaultValue: "Edit Option" })
								: t("admin.programs.options.add", { defaultValue: "Add Option" })}
						</DialogTitle>
					</DialogHeader>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("admin.programs.options.fields.name", { defaultValue: "Name" })}</FormLabel>
										<FormControl><Input {...field} /></FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="code"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("admin.programs.options.fields.code", { defaultValue: "Code" })}</FormLabel>
										<FormControl><Input {...field} /></FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="description"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("admin.programs.options.fields.description", { defaultValue: "Description" })}</FormLabel>
										<FormControl><Textarea {...field} rows={2} /></FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<DialogFooter>
								<Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
									{t("common.actions.cancel")}
								</Button>
								<Button type="submit" disabled={isPending}>
									{isPending
										? t("common.actions.saving", { defaultValue: "Saving..." })
										: editingOption
											? t("common.actions.saveChanges")
											: t("common.actions.create", { defaultValue: "Create" })}
								</Button>
							</DialogFooter>
						</form>
					</Form>
				</DialogContent>
			</Dialog>

			{/* Delete confirm */}
			<AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("admin.programs.options.deleteConfirm.title", { defaultValue: "Delete option?" })}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("admin.programs.options.deleteConfirm.description", { defaultValue: "This cannot be undone." })}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("common.actions.cancel")}</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => deleteId && deleteMutation.mutate(deleteId)}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{t("common.actions.delete", { defaultValue: "Delete" })}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
```

- [ ] **Step 2: Restore App.tsx import** (uncomment `ProgramOptionsTab` import)

- [ ] **Step 3: Run type-check**

```bash
bun check-types
```

Expected: 0 errors (ProgramExportTemplatesTab still stubbed).

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/pages/admin/programs/ProgramOptionsTab.tsx apps/web/src/App.tsx
git commit -m "feat(programs): add ProgramOptionsTab with CRUD"
```

---

### Task 4: ProgramExportTemplatesTab

**Files:**
- Create: `apps/web/src/pages/admin/programs/ProgramExportTemplatesTab.tsx`

**Interfaces:**
- Consumes: `useProgramContext()` — provides `program.id` and `program.exportTemplates` (array of `{ templateType, templateId, templateName }`)
- Consumes: `trpc.exportTemplates.list.queryOptions({ limit: 100 })` to load available templates
- Consumes: `trpcClient.programs.setExportTemplates.mutate({ programId, templates: [{ templateType, templateId }] })`
- The 13 valid template types are: `"pv" | "evaluation" | "ec" | "ue" | "deliberation" | "diploma" | "transcript" | "attestation" | "enrollment_certificate" | "student_list" | "payment_order" | "payment_receipt" | "financial_clearance"`

- [ ] **Step 1: Create ProgramExportTemplatesTab**

```tsx
// apps/web/src/pages/admin/programs/ProgramExportTemplatesTab.tsx
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";
import { useProgramContext } from "./ProgramContext";

type ExportTemplateType =
	| "pv"
	| "evaluation"
	| "ec"
	| "ue"
	| "deliberation"
	| "diploma"
	| "transcript"
	| "attestation"
	| "enrollment_certificate"
	| "student_list"
	| "payment_order"
	| "payment_receipt"
	| "financial_clearance";

const ALL_TYPES: ExportTemplateType[] = [
	"diploma",
	"transcript",
	"attestation",
	"enrollment_certificate",
	"student_list",
	"pv",
	"evaluation",
	"ec",
	"ue",
	"deliberation",
	"payment_order",
	"payment_receipt",
	"financial_clearance",
];

const TYPE_LABELS: Record<ExportTemplateType, string> = {
	diploma: "Diplôme",
	transcript: "Relevé de notes",
	attestation: "Attestation",
	enrollment_certificate: "Certificat de scolarité",
	student_list: "Liste d'étudiants",
	pv: "Procès-verbal",
	evaluation: "Publication d'évaluation",
	ec: "Publication d'EC",
	ue: "Publication d'UE",
	deliberation: "Délibération",
	payment_order: "Ordre de paiement",
	payment_receipt: "Reçu de paiement",
	financial_clearance: "Quitus financier",
};

export default function ProgramExportTemplatesTab() {
	const { t } = useTranslation();
	const { programId } = useParams<{ programId: string }>();
	const { program, refetch } = useProgramContext();
	const queryClient = useQueryClient();

	const { data: templatesData } = useQuery(
		trpc.exportTemplates.list.queryOptions({ limit: 100 }),
	);
	const availableTemplates = templatesData?.items ?? [];

	// Build initial selection map from current program.exportTemplates
	const initialMap: Record<string, string> = {};
	for (const et of (program as any).exportTemplates ?? []) {
		initialMap[et.templateType as string] = et.templateId as string;
	}
	const [selections, setSelections] = useState<Record<string, string>>(initialMap);

	const setMutation = useMutation({
		mutationFn: () =>
			trpcClient.programs.setExportTemplates.mutate({
				programId: programId!,
				templates: Object.entries(selections)
					.filter(([, templateId]) => templateId && templateId !== "none")
					.map(([templateType, templateId]) => ({
						templateType: templateType as ExportTemplateType,
						templateId,
					})),
			}),
		onSuccess: () => {
			toast.success(t("admin.programs.toast.updateSuccess", { defaultValue: "Templates saved" }));
			queryClient.invalidateQueries(
				trpc.programs.getById.queryKey({ id: programId! }),
			);
			refetch();
		},
		onError: (err: Error) => toast.error(err.message),
	});

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle>
					{t("programs.hub.tabs.templates", { defaultValue: "Export Templates" })}
				</CardTitle>
				<Button onClick={() => setMutation.mutate()} disabled={setMutation.isPending}>
					{setMutation.isPending
						? t("common.actions.saving", { defaultValue: "Saving..." })
						: t("common.actions.saveChanges")}
				</Button>
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					{ALL_TYPES.map((type) => {
						const templatesForType = availableTemplates.filter(
							(tpl) => (tpl as any).type === type,
						);
						return (
							<div key={type} className="flex items-center justify-between gap-4">
								<span className="min-w-0 shrink-0 text-sm font-medium">
									{TYPE_LABELS[type]}
								</span>
								<Select
									value={selections[type] ?? "none"}
									onValueChange={(val) =>
										setSelections((prev) => ({ ...prev, [type]: val }))
									}
								>
									<SelectTrigger className="w-64">
										<SelectValue
											placeholder={t("common.none", { defaultValue: "None" })}
										/>
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="none">
											{t("common.none", { defaultValue: "None" })}
										</SelectItem>
										{templatesForType.map((tpl) => (
											<SelectItem key={tpl.id} value={tpl.id}>
												{tpl.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						);
					})}
				</div>
			</CardContent>
		</Card>
	);
}
```

- [ ] **Step 2: Restore App.tsx import** (uncomment `ProgramExportTemplatesTab`)

- [ ] **Step 3: Run type-check and linter**

```bash
bun check-types && bun check
```

Expected: 0 errors, auto-fixes applied (re-run `bun check` to confirm clean).

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/pages/admin/programs/ProgramExportTemplatesTab.tsx apps/web/src/App.tsx
git commit -m "feat(programs): add ProgramExportTemplatesTab"
```

---

### Task 5: ProgramManagement list changes

**Files:**
- Modify: `apps/web/src/pages/teacher/ProgramManagement.tsx`

**Goal:** Row click → navigate to hub. Remove Options dialog. Slim create form (name + code + cycleId only; after create navigate to hub).

- [ ] **Step 1: Add useNavigate and remove Options state**

At the top of `ProgramManagement()` function, add:

```tsx
const navigate = useNavigate();
```

Add `useNavigate` to the import from `"react-router"`.

Remove these state variables and all references to them:
- `optionProgram` / `setOptionProgram`
- `editingOption` / `setEditingOption`
- `isOptionModalOpen` / `setIsOptionModalOpen`
- `optionForm` (the react-hook-form for options)
- `resetOptionEditing()` function
- `optionList`, `optionsLoading`, `refetchOptions` (the options query)
- `createOptionMutation`, `deleteOptionMutation`, `updateOptionMutation`

- [ ] **Step 2: Change row click and context menu to navigate**

Find `startEdit` function (around line 611 in the original):

```ts
const startEdit = (program: Program) => {
	setEditingProgram(program);
	// ...
};
```

Replace with:

```ts
const openDetail = (program: Program) => {
	navigate(`/admin/programs/${program.id}/details`);
};
```

Find all calls to `startEdit(program)` and replace with `openDetail(program)`.

Find `onClick={() => { setOptionProgram(program); ... }}` in the row context menu — remove that `ContextMenuItem` entirely (Options are now on the hub).

- [ ] **Step 3: Slim the create form**

The create `FormModal` (opened by `setIsFormOpen(true)`) currently shows all program fields. Slim it to only: `name`, `code`, `cycleId`. 

After successful create, navigate to the new program's hub:

```ts
const createMutation = useMutation({
	mutationFn: async (data: ProgramFormData) => {
		return trpcClient.programs.create.mutate(data);
	},
	onSuccess: (newProgram) => {
		queryClient.invalidateQueries({ queryKey: ["programs"] });
		toast.success(t("admin.programs.toast.createSuccess"));
		setIsFormOpen(false);
		if (newProgram?.id) {
			navigate(`/admin/programs/${newProgram.id}/details`);
		}
	},
	onError: (error: unknown) => {
		toast.error((error as Error).message || t("admin.programs.toast.createError"));
	},
});
```

Remove `cloneFromProgramId`, `isDuplicateOpen`, `duplicateTargetCycleIds`, `duplicateCloneCurriculum` state and their associated UI (the duplicate dialog) if they were only used in the create flow. Keep if referenced elsewhere.

- [ ] **Step 4: Remove Options dialog JSX**

Remove the entire `<Dialog open={isOptionModalOpen}...>` block that renders the options management UI (typically at the bottom of the render, around line 1200+). Also remove `<FormModal open={isFormOpen}...>` fields for options (the dialog that listed options inside the form).

- [ ] **Step 5: Type-check and lint**

```bash
bun check-types && bun check
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/pages/teacher/ProgramManagement.tsx
git commit -m "feat(programs): wire list to ProgramDetail hub, remove Options dialog"
```

---

### Task 6: ClassDetail hub — context, layout, routing, i18n

**Files:**
- Create: `apps/web/src/pages/admin/classes/ClassContext.tsx`
- Create: `apps/web/src/pages/admin/classes/ClassDetail.tsx`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/i18n/locales/en/translation.json`
- Modify: `apps/web/src/i18n/locales/fr/translation.json`

**Interfaces:**
- Produces: `ClassContext` and `useClassContext()` hook (consumed by Tasks 7, 8, 9)
- Produces: Route `/admin/classes/:classId` → ClassDetail hub shell

- [ ] **Step 1: Create ClassContext**

```tsx
// apps/web/src/pages/admin/classes/ClassContext.tsx
import { createContext, useContext } from "react";
import type { RouterOutputs } from "@/utils/trpc";

export type ClassData = NonNullable<RouterOutputs["classes"]["getById"]>;

export interface ClassContextValue {
	cls: ClassData;
	refetch: () => void;
}

export const ClassContext = createContext<ClassContextValue | null>(null);

export function useClassContext(): ClassContextValue {
	const ctx = useContext(ClassContext);
	if (!ctx) throw new Error("useClassContext must be used within ClassDetail");
	return ctx;
}
```

- [ ] **Step 2: Create ClassDetail hub layout**

```tsx
// apps/web/src/pages/admin/classes/ClassDetail.tsx
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, Outlet, useParams } from "react-router";
import { HubNav } from "@/components/navigation/HubNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { trpc } from "@/utils/trpc";
import { ClassContext } from "./ClassContext";

const TABS = [
	{ path: "details", labelKey: "classes.hub.tabs.details" },
	{ path: "students", labelKey: "classes.hub.tabs.students" },
	{ path: "courses", labelKey: "classes.hub.tabs.courses" },
] as const;

export default function ClassDetail() {
	const { classId } = useParams<{ classId: string }>();
	const { t } = useTranslation();

	const {
		data: cls,
		isLoading,
		refetch,
	} = useQuery(trpc.classes.getById.queryOptions({ id: classId! }));

	if (isLoading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<Spinner className="h-8 w-8" />
			</div>
		);
	}

	if (!cls) {
		return (
			<div className="py-12 text-center text-muted-foreground">
				{t("common.notFound")}
			</div>
		);
	}

	return (
		<ClassContext.Provider value={{ cls, refetch }}>
			<div className="space-y-6">
				<div className="flex items-start gap-4">
					<Button variant="ghost" size="icon" asChild>
						<Link to="/admin/classes/classes">
							<ArrowLeft className="h-4 w-4" />
						</Link>
					</Button>
					<div className="flex items-center gap-3">
						<Users className="h-5 w-5 text-primary" />
						<div>
							<h1 className="font-semibold text-xl">{cls.code}</h1>
							<div className="flex items-center gap-2">
								<p className="text-muted-foreground text-sm">{cls.name}</p>
								{cls.academicYearInfo?.name && (
									<Badge variant="secondary">{cls.academicYearInfo.name}</Badge>
								)}
							</div>
						</div>
					</div>
				</div>
				<HubNav tabs={TABS} basePath={`/admin/classes/${classId}`} />
				<Outlet />
			</div>
		</ClassContext.Provider>
	);
}
```

- [ ] **Step 3: Add Classes hub routes in App.tsx**

Add imports at the top of App.tsx:

```tsx
import ClassDetail from "./pages/admin/classes/ClassDetail";
import ClassDetailsTab from "./pages/admin/classes/ClassDetailsTab";
import ClassStudentsTab from "./pages/admin/classes/ClassStudentsTab";
import ClassCoursesTab from "./pages/admin/classes/ClassCoursesTab";
```

Replace the current classes route block:

```tsx
{/* Classes hub */}
<Route path="classes" element={<ClassesHub />}>
	<Route index element={<Navigate to="classes" replace />} />
	<Route path="classes" element={<ClassManagement />} />
	<Route path="assignments" element={<ClassCourseManagement />} />
	<Route path="enrollments" element={<EnrollmentManagement />} />
</Route>
```

With a grouped structure that adds the detail hub alongside:

```tsx
{/* Classes hub */}
<Route path="classes">
	<Route element={<ClassesHub />}>
		<Route index element={<Navigate to="classes" replace />} />
		<Route path="classes" element={<ClassManagement />} />
		<Route path="assignments" element={<ClassCourseManagement />} />
		<Route path="enrollments" element={<EnrollmentManagement />} />
	</Route>
	<Route path=":classId" element={<ClassDetail />}>
		<Route index element={<Navigate to="details" replace />} />
		<Route path="details" element={<ClassDetailsTab />} />
		<Route path="students" element={<ClassStudentsTab />} />
		<Route path="courses" element={<ClassCoursesTab />} />
	</Route>
</Route>
```

- [ ] **Step 4: Add i18n keys — English**

In `apps/web/src/i18n/locales/en/translation.json`, add at the top level (or merge into existing `"classes"` key):

```json
"classes": {
  "hub": {
    "tabs": {
      "details": "Details",
      "students": "Students",
      "courses": "Courses"
    }
  }
}
```

- [ ] **Step 5: Add i18n keys — French**

```json
"classes": {
  "hub": {
    "tabs": {
      "details": "Détails",
      "students": "Étudiants",
      "courses": "Cours"
    }
  }
}
```

- [ ] **Step 6: Type-check (stub ClassDetailsTab, ClassStudentsTab, ClassCoursesTab if needed)**

```bash
bun check-types
```

Comment out the 3 tab imports and replace their route elements with `{null}` temporarily if they don't exist yet.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/pages/admin/classes/ClassContext.tsx \
        apps/web/src/pages/admin/classes/ClassDetail.tsx \
        apps/web/src/App.tsx \
        apps/web/src/i18n/locales/en/translation.json \
        apps/web/src/i18n/locales/fr/translation.json
git commit -m "feat(classes): add ClassDetail hub layout, context, routing, i18n"
```

---

### Task 7: ClassDetailsTab

**Files:**
- Create: `apps/web/src/pages/admin/classes/ClassDetailsTab.tsx`

**Interfaces:**
- Consumes: `useClassContext()` — provides `cls` with all class fields
- Consumes: `trpcClient.classes.update.mutate({ id, programId, cycleLevelId, programOptionId, semesterId, academicYearId, code, name, totalCredits })`
- Consumes: programs list, cycle levels list, program options list, academic years list, semesters list (same cascading pattern as ClassManagement's FormModal)

- [ ] **Step 1: Create ClassDetailsTab**

```tsx
// apps/web/src/pages/admin/classes/ClassDetailsTab.tsx
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { z } from "zod";
import { CodedEntitySelect } from "@/components/forms";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";
import { useClassContext } from "./ClassContext";

const schema = z.object({
	programId: z.string().min(1, "Program is required"),
	academicYearId: z.string().min(1, "Academic year is required"),
	cycleLevelId: z.string().min(1, "Cycle level is required"),
	programOptionId: z.string().min(1, "Program option is required"),
	semesterId: z.string().optional(),
	code: z.string().min(1, "Code is required"),
	name: z.string().min(1, "Name is required"),
	totalCredits: z.coerce.number().int().min(0).default(0),
});

type FormData = z.infer<typeof schema>;

export default function ClassDetailsTab() {
	const { t } = useTranslation();
	const { classId } = useParams<{ classId: string }>();
	const { cls, refetch } = useClassContext();
	const queryClient = useQueryClient();

	const { data: academicYearsData } = useQuery({
		queryKey: ["academicYears"],
		queryFn: () => trpcClient.academicYears.list.query({}),
	});
	const academicYears = academicYearsData?.items ?? [];

	const { data: cycleLevelsData } = useQuery({
		queryKey: ["cycleLevels"],
		queryFn: () => trpcClient.studyCycles.listLevels.query({}),
	});
	const cycleLevels = cycleLevelsData ?? [];

	const { data: programOptionsData } = useQuery({
		queryKey: ["programOptions", cls.programInfo?.id ?? ""],
		queryFn: () =>
			trpcClient.programOptions.list.query({
				programId: cls.programInfo?.id ?? cls.program,
				limit: 100,
			}),
		enabled: !!(cls.programInfo?.id ?? cls.program),
	});
	const programOptions = programOptionsData?.items ?? [];

	const { data: semestersData } = useQuery({
		queryKey: ["semesters"],
		queryFn: () => trpcClient.semesters.list.query({}),
	});
	const semesters = semestersData ?? [];

	const form = useForm<FormData>({
		resolver: zodResolver(schema),
		defaultValues: {
			programId: "",
			academicYearId: "",
			cycleLevelId: "",
			programOptionId: "",
			semesterId: "",
			code: "",
			name: "",
			totalCredits: 0,
		},
	});

	useEffect(() => {
		if (cls) {
			form.reset({
				programId: cls.program ?? "",
				academicYearId: cls.academicYear ?? "",
				cycleLevelId: cls.cycleLevelId ?? "",
				programOptionId: cls.programOptionId ?? "",
				semesterId: cls.semester?.id ?? "",
				code: cls.code ?? "",
				name: cls.name ?? "",
				totalCredits: (cls as any).totalCredits ?? 0,
			});
		}
	}, [cls, form]);

	const updateMutation = useMutation({
		mutationFn: (data: FormData) =>
			trpcClient.classes.update.mutate({ id: classId!, ...data }),
		onSuccess: () => {
			toast.success(t("admin.classes.toast.updateSuccess", { defaultValue: "Class updated" }));
			queryClient.invalidateQueries(trpc.classes.getById.queryKey({ id: classId! }));
			refetch();
		},
		onError: (err: Error) => toast.error(err.message),
	});

	return (
		<Card>
			<CardContent className="pt-6">
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit((data) => updateMutation.mutate(data))}
						className="space-y-4"
					>
						<div className="grid gap-4 md:grid-cols-2">
							<FormField
								control={form.control}
								name="code"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("admin.classes.fields.code", { defaultValue: "Code" })}</FormLabel>
										<FormControl><Input {...field} /></FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("admin.classes.fields.name", { defaultValue: "Name" })}</FormLabel>
										<FormControl><Input {...field} /></FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<FormField
							control={form.control}
							name="programId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("admin.classes.fields.program", { defaultValue: "Program" })}</FormLabel>
									<FormControl>
										<CodedEntitySelect
											value={field.value}
											onChange={field.onChange}
											endpoint="programs"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="cycleLevelId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("admin.classes.fields.cycleLevel", { defaultValue: "Cycle Level" })}</FormLabel>
									<Select onValueChange={field.onChange} value={field.value || undefined}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder={t("admin.classes.fields.cycleLevel", { defaultValue: "Cycle Level" })} />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{cycleLevels.map((lvl) => (
												<SelectItem key={lvl.id} value={lvl.id}>
													{lvl.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="programOptionId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("admin.classes.fields.programOption", { defaultValue: "Option" })}</FormLabel>
									<Select onValueChange={field.onChange} value={field.value || undefined}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder={t("admin.classes.fields.programOption", { defaultValue: "Option" })} />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{programOptions.map((opt) => (
												<SelectItem key={opt.id} value={opt.id}>
													{opt.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="grid gap-4 md:grid-cols-2">
							<FormField
								control={form.control}
								name="academicYearId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("admin.classes.fields.academicYear", { defaultValue: "Academic Year" })}</FormLabel>
										<Select onValueChange={field.onChange} value={field.value || undefined}>
											<FormControl>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{academicYears.map((yr) => (
													<SelectItem key={yr.id} value={yr.id}>
														{yr.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="semesterId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("admin.classes.fields.semester", { defaultValue: "Semester" })}</FormLabel>
										<Select
											onValueChange={(v) => field.onChange(v === "none" ? "" : v)}
											value={field.value || "none"}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="none">{t("common.none", { defaultValue: "None" })}</SelectItem>
												{semesters.map((sem) => (
													<SelectItem key={sem.id} value={sem.id}>
														{sem.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<FormField
							control={form.control}
							name="totalCredits"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("admin.classes.fields.totalCredits", { defaultValue: "Total Credits" })}</FormLabel>
									<FormControl>
										<Input
											type="number"
											value={field.value ?? ""}
											onChange={(e) =>
												field.onChange(
													e.target.value === "" ? 0 : Number(e.target.value),
												)
											}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="flex justify-end pt-2">
							<Button type="submit" disabled={updateMutation.isPending}>
								{updateMutation.isPending
									? t("common.actions.saving", { defaultValue: "Saving..." })
									: t("common.actions.saveChanges")}
							</Button>
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}
```

- [ ] **Step 2: Restore App.tsx ClassDetailsTab import**

- [ ] **Step 3: Type-check**

```bash
bun check-types
```

Expected: 0 errors (ClassStudentsTab, ClassCoursesTab still stubbed).

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/pages/admin/classes/ClassDetailsTab.tsx apps/web/src/App.tsx
git commit -m "feat(classes): add ClassDetailsTab"
```

---

### Task 8: ClassStudentsTab

**Files:**
- Create: `apps/web/src/pages/admin/classes/ClassStudentsTab.tsx`

**Interfaces:**
- Consumes: `useClassContext()` — provides `cls.id`
- Consumes: `trpcClient.students.list.query({ classId: cls.id, limit: 200 })` — returns `{ items: Array<{ id, registrationNumber, profile: { firstName, lastName, domainUserId }, ... }> }`
- Produces: read-only student list with link to ProfileHub at `/admin/profiles/:domainUserId`

- [ ] **Step 1: Create ClassStudentsTab**

```tsx
// apps/web/src/pages/admin/classes/ClassStudentsTab.tsx
import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { trpcClient } from "@/utils/trpc";
import { useClassContext } from "./ClassContext";

export default function ClassStudentsTab() {
	const { t } = useTranslation();
	const { cls } = useClassContext();

	const { data, isLoading } = useQuery({
		queryKey: ["students", "byClass", cls.id],
		queryFn: () => trpcClient.students.list.query({ classId: cls.id, limit: 200 }),
	});
	const students = data?.items ?? [];

	return (
		<Card>
			<CardHeader>
				<CardTitle>
					{t("classes.hub.tabs.students", { defaultValue: "Students" })}
					{students.length > 0 && (
						<span className="ml-2 font-normal text-muted-foreground text-sm">
							({students.length})
						</span>
					)}
				</CardTitle>
			</CardHeader>
			<CardContent>
				{isLoading ? null : students.length === 0 ? (
					<Empty>
						<EmptyHeader>
							<EmptyContent>
								<EmptyTitle>
									{t("admin.classes.students.empty.title", { defaultValue: "No students enrolled" })}
								</EmptyTitle>
								<EmptyDescription>
									{t("admin.classes.students.empty.description", {
										defaultValue: "Enroll students via the Enrollments tab.",
									})}
								</EmptyDescription>
							</EmptyContent>
						</EmptyHeader>
					</Empty>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>{t("admin.students.table.lastName", { defaultValue: "Last Name" })}</TableHead>
								<TableHead>{t("admin.students.table.firstName", { defaultValue: "First Name" })}</TableHead>
								<TableHead>{t("admin.students.table.registrationNumber", { defaultValue: "Reg. #" })}</TableHead>
								<TableHead className="w-16" />
							</TableRow>
						</TableHeader>
						<TableBody>
							{students.map((student) => (
								<TableRow key={student.id}>
									<TableCell className="font-medium">
										{student.profile?.lastName ?? "—"}
									</TableCell>
									<TableCell>{student.profile?.firstName ?? "—"}</TableCell>
									<TableCell className="font-mono text-sm">
										{student.registrationNumber ?? "—"}
									</TableCell>
									<TableCell>
										{student.profile?.domainUserId && (
											<Button variant="ghost" size="icon" asChild>
												<Link to={`/admin/profiles/${student.profile.domainUserId}`}>
													<ExternalLink className="h-4 w-4" />
												</Link>
											</Button>
										)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</CardContent>
		</Card>
	);
}
```

- [ ] **Step 2: Restore App.tsx ClassStudentsTab import**

- [ ] **Step 3: Type-check**

```bash
bun check-types
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/pages/admin/classes/ClassStudentsTab.tsx apps/web/src/App.tsx
git commit -m "feat(classes): add ClassStudentsTab"
```

---

### Task 9: ClassCoursesTab

**Files:**
- Create: `apps/web/src/pages/admin/classes/ClassCoursesTab.tsx`

**Interfaces:**
- Consumes: `useClassContext()` — provides `cls.id`
- Consumes: `trpcClient.classCourses.list.query({ classId: cls.id, limit: 200 })` — the existing list procedure already accepts `classId` as optional filter (confirmed in `class-courses.zod.ts` line 20)
- Consumes: `trpcClient.classCourses.create.mutate(...)`, `.update.mutate(...)`, `.delete.mutate(...)`

- [ ] **Step 1: Create ClassCoursesTab**

```tsx
// apps/web/src/pages/admin/classes/ClassCoursesTab.tsx
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { toast } from "@/lib/toast";
import type { RouterOutputs } from "@/utils/trpc";
import { trpcClient } from "@/utils/trpc";
import { useClassContext } from "./ClassContext";

type ClassCourse = RouterOutputs["classCourses"]["list"]["items"][number];

export default function ClassCoursesTab() {
	const { t } = useTranslation();
	const { cls } = useClassContext();
	const queryClient = useQueryClient();
	const [deleteId, setDeleteId] = useState<string | null>(null);

	const queryKey = ["classCourses", "byClass", cls.id];

	const { data, isLoading } = useQuery({
		queryKey,
		queryFn: () => trpcClient.classCourses.list.query({ classId: cls.id, limit: 200 }),
	});
	const courses = data?.items ?? [];

	const invalidate = () => queryClient.invalidateQueries({ queryKey });

	const deleteMutation = useMutation({
		mutationFn: (id: string) => trpcClient.classCourses.delete.mutate({ id }),
		onSuccess: () => {
			toast.success(t("admin.classCourses.toast.deleteSuccess", { defaultValue: "Course assignment removed" }));
			invalidate();
			setDeleteId(null);
		},
		onError: (err: Error) => toast.error(err.message),
	});

	return (
		<>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle>
						{t("classes.hub.tabs.courses", { defaultValue: "Courses" })}
					</CardTitle>
					<Button size="sm" asChild>
						<a href={`/admin/classes/assignments`}>
							{t("admin.classCourses.actions.manage", { defaultValue: "Manage All" })}
						</a>
					</Button>
				</CardHeader>
				<CardContent>
					{isLoading ? null : courses.length === 0 ? (
						<Empty>
							<EmptyHeader>
								<EmptyContent>
									<EmptyTitle>
										{t("admin.classCourses.empty.title", { defaultValue: "No course assignments" })}
									</EmptyTitle>
									<EmptyDescription>
										{t("admin.classCourses.empty.description", {
											defaultValue: "Assign courses to this class from the Assignments page.",
										})}
									</EmptyDescription>
								</EmptyContent>
							</EmptyHeader>
						</Empty>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{t("admin.classCourses.fields.code", { defaultValue: "Code" })}</TableHead>
									<TableHead>{t("admin.classCourses.fields.course", { defaultValue: "Course" })}</TableHead>
									<TableHead>{t("admin.classCourses.fields.teacher", { defaultValue: "Teacher" })}</TableHead>
									<TableHead className="w-16" />
								</TableRow>
							</TableHeader>
							<TableBody>
								{courses.map((cc) => (
									<TableRow key={cc.id}>
										<TableCell className="font-mono text-sm">{cc.code}</TableCell>
										<TableCell>{cc.courseName ?? cc.course}</TableCell>
										<TableCell className="text-muted-foreground">
											{(cc as any).teacherName ?? cc.teacher ?? "—"}
										</TableCell>
										<TableCell>
											<Button
												variant="ghost"
												size="icon"
												onClick={() => setDeleteId(cc.id)}
											>
												<Trash2 className="h-4 w-4 text-destructive" />
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>

			<AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("admin.classCourses.deleteConfirm.title", { defaultValue: "Remove course assignment?" })}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("admin.classCourses.deleteConfirm.description", { defaultValue: "This cannot be undone." })}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("common.actions.cancel")}</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => deleteId && deleteMutation.mutate(deleteId)}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{t("common.actions.delete", { defaultValue: "Delete" })}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
```

> **Note on ClassCoursesTab:** The tab shows existing assignments and provides a delete action + a link to the full `/admin/classes/assignments` page for create/edit (which already has a `classId` filter). Adding a full inline create form would duplicate `ClassCourseManagement`'s complex form. This simpler approach is intentional (YAGNI).

- [ ] **Step 2: Restore App.tsx ClassCoursesTab import**

- [ ] **Step 3: Type-check and lint**

```bash
bun check-types && bun check
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/pages/admin/classes/ClassCoursesTab.tsx apps/web/src/App.tsx
git commit -m "feat(classes): add ClassCoursesTab"
```

---

### Task 10: ClassManagement list changes

**Files:**
- Modify: `apps/web/src/pages/admin/ClassManagement.tsx`

**Goal:** Row click and context-menu "Edit" → navigate to `/admin/classes/:id/details`. Remove the student roster dialog (state + JSX). Create button keeps its dialog; after successful create navigate to new class hub.

- [ ] **Step 1: Add useNavigate**

Add `useNavigate` to the import from `"react-router"`:

```tsx
import { useNavigate } from "react-router";
```

At the top of `ClassManagement()`, add:

```tsx
const navigate = useNavigate();
```

- [ ] **Step 2: Remove roster dialog state**

Remove these state variables and all references:

```tsx
const [previewClass, setPreviewClass] = useState<Class | null>(null);
const [previewStudents, setPreviewStudents] = useState<any[]>([]);
const [previewLoading, setPreviewLoading] = useState(false);
const [studentSearch, setStudentSearch] = useState("");
```

Remove the `fetchStudentsForPreview` function (or whatever function sets `previewStudents`).

- [ ] **Step 3: Wire row click + context menu to navigate**

Find the context menu item that calls `setEditingClass(cls)` and replace it:

```tsx
// Before:
<ContextMenuItem onSelect={() => setEditingClass(cls)}>
	{t("common.actions.edit")}
</ContextMenuItem>

// After:
<ContextMenuItem onSelect={() => navigate(`/admin/classes/${cls.id}/details`)}>
	{t("common.actions.edit")}
</ContextMenuItem>
```

Find the context menu item for "View Roster" / `setPreviewClass(cls)` and remove it entirely.

- [ ] **Step 4: Navigate after create**

Find the create mutation's `onSuccess`:

```tsx
onSuccess: (newClass) => {
	// existing invalidation + toast
	setIsFormOpen(false);
	if (newClass?.id) {
		navigate(`/admin/classes/${newClass.id}/details`);
	}
},
```

- [ ] **Step 5: Remove roster dialog JSX**

Remove the `<Dialog open={!!previewClass}...>` block (the student roster preview dialog). It typically contains a `ScrollArea` with student rows.

- [ ] **Step 6: Remove editingClass state and FormModal**

Remove the `editingClass` state, the `handleOpenEdit` / `startEdit` function, and the `<FormModal open={isFormOpen || !!editingClass}...>` (the large class edit dialog). Keep only the create `<FormModal open={isFormOpen}...>` if they're separate; merge/simplify if not.

> **Note:** If create and edit share the same `FormModal` (controlled by `isFormOpen && !editingClass` vs `!!editingClass`), split: keep only the create path with `isFormOpen`. Edit now lives in `ClassDetailsTab`.

- [ ] **Step 7: Type-check and lint**

```bash
bun check-types && bun check
```

Expected: 0 errors.

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/pages/admin/ClassManagement.tsx
git commit -m "feat(classes): wire list to ClassDetail hub, remove roster dialog"
```

---

## Final Verification

After all 10 tasks are complete:

- [ ] **Full type-check:**

```bash
bun check-types
```

- [ ] **Lint:**

```bash
bun check
```

- [ ] **Manual smoke test paths:**
  1. `/admin/programs/programs` → click a program row → lands on `/admin/programs/:id/details` with program form pre-filled
  2. Click "Options" tab → options table shows → create/edit/delete works
  3. Click "Export Templates" tab → 13 type rows with selectors, save works
  4. Back to list → "Create" button opens slim dialog → after save lands on new program hub
  5. `/admin/classes/classes` → click a class row → lands on `/admin/classes/:id/details` with class form pre-filled
  6. Click "Students" tab → enrolled students listed with profile links
  7. Click "Courses" tab → course assignments listed with delete action
  8. Back to list → "Create" button still works → after save navigates to new class hub
