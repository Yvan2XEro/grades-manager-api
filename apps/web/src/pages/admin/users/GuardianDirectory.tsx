import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	ChevronDown,
	ChevronRight,
	Copy,
	MoreHorizontal,
	Plus,
	Search,
	Settings,
	Trash2,
	UserMinus,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogBody,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";

const RELATIONSHIP_TYPES = [
	"mother",
	"father",
	"guardian",
	"uncle",
	"aunt",
	"other",
] as const;

const DEFAULT_PREFERENCES = {
	resultsPublished: true,
	attendanceThreshold: true,
	feeClearance: true,
	documentsAvailable: true,
};

type PreferencesType = typeof DEFAULT_PREFERENCES;

export default function GuardianDirectory() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);
	const [search, setSearch] = useState("");
	const debouncedSearch = useDebounce(search, 300);

	const [expandedId, setExpandedId] = useState<string | null>(null);
	const [showAdd, setShowAdd] = useState(false);
	const [prefTarget, setPrefTarget] = useState<{
		id: string;
		name: string;
		preferences: PreferencesType;
	} | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

	const { data, isLoading } = useQuery(
		trpc.guardians.listAll.queryOptions({
			page,
			pageSize,
			search: debouncedSearch || undefined,
		}),
	);

	const invalidate = () =>
		queryClient.invalidateQueries({
			queryKey: trpc.guardians.listAll.queryKey(),
		});

	const removeLinkMutation = useMutation({
		mutationFn: (input: { studentId: string; guardianId: string }) =>
			trpcClient.guardians.removeLink.mutate(input),
		onSuccess: () => {
			toast.success(t("common.done", { defaultValue: "Done" }));
			invalidate();
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => trpcClient.guardians.delete.mutate({ id }),
		onSuccess: () => {
			toast.success(t("common.deleted"));
			invalidate();
			setDeleteTarget(null);
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const prefMutation = useMutation({
		mutationFn: (input: { guardianId: string; preferences: PreferencesType }) =>
			trpcClient.guardians.updatePreferences.mutate(input),
		onSuccess: () => {
			toast.success(t("guardians.admin.toasts.preferencesSaved"));
			invalidate();
			setPrefTarget(null);
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const items = data?.items ?? [];

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h2 className="font-semibold text-xl">
						{t("guardians.admin.title")}
					</h2>
					<p className="text-muted-foreground text-sm">
						{t("guardians.admin.subtitle")}
					</p>
				</div>
				<Button onClick={() => setShowAdd(true)}>
					<Plus className="mr-2 h-4 w-4" />
					{t("guardians.admin.addGuardian", { defaultValue: "Add guardian" })}
				</Button>
			</div>

			<div className="relative max-w-sm">
				<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
				<Input
					className="pl-9"
					placeholder={t("guardians.admin.searchPlaceholder", {
						defaultValue: "Search by name or email…",
					})}
					value={search}
					onChange={(e) => {
						setSearch(e.target.value);
						setPage(1);
					}}
				/>
			</div>

			{isLoading ? (
				<TableSkeleton columns={6} rows={6} />
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-8" />
							<TableHead>{t("guardians.fields.firstName")}</TableHead>
							<TableHead>{t("guardians.fields.email")}</TableHead>
							<TableHead>
								{t("guardians.admin.linkedStudents", {
									defaultValue: "Linked to",
								})}
							</TableHead>
							<TableHead>{t("guardians.fields.relationshipType")}</TableHead>
							<TableHead className="w-10" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{items.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={6}
									className="py-12 text-center text-muted-foreground"
								>
									{t("guardians.admin.empty")}
								</TableCell>
							</TableRow>
						) : (
							items.flatMap((g) => {
								const expanded = expandedId === g.id;
								const relationships = [
									...new Set(g.studentLinks.map((l) => l.relationshipType)),
								];
								return [
									<TableRow
										key={g.id}
										className="cursor-pointer"
										onClick={() => setExpandedId(expanded ? null : g.id)}
									>
										<TableCell>
											{g.studentLinks.length > 0 ? (
												expanded ? (
													<ChevronDown className="h-4 w-4 text-muted-foreground" />
												) : (
													<ChevronRight className="h-4 w-4 text-muted-foreground" />
												)
											) : null}
										</TableCell>
										<TableCell className="font-medium">
											{g.firstName} {g.lastName}
										</TableCell>
										<TableCell className="text-muted-foreground text-sm">
											{g.email}
										</TableCell>
										<TableCell>
											{g.studentLinks.length === 0 ? (
												<span className="text-muted-foreground text-sm">—</span>
											) : (
												<Badge variant="secondary">
													{g.studentLinks.length}{" "}
													{g.studentLinks.length === 1
														? t("guardians.admin.student", {
																defaultValue: "student",
															})
														: t("guardians.admin.students")}
												</Badge>
											)}
										</TableCell>
										<TableCell>
											<div className="flex flex-wrap gap-1">
												{relationships.map((r) => (
													<Badge key={r} variant="outline">
														{t(`guardians.relationships.${r}`)}
													</Badge>
												))}
											</div>
										</TableCell>
										<TableCell onClick={(e) => e.stopPropagation()}>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button variant="ghost" size="icon-sm">
														<MoreHorizontal className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem
														onClick={() => {
															void navigator.clipboard.writeText(
																`${window.location.origin}/guardian/portal?token=${g.accessToken}`,
															);
															toast.success(
																t("guardians.admin.toasts.linkCopied"),
															);
														}}
													>
														<Copy className="mr-2 h-4 w-4" />
														{t("guardians.admin.copyPortalLink")}
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() =>
															setPrefTarget({
																id: g.id,
																name: `${g.firstName} ${g.lastName}`,
																preferences: {
																	...DEFAULT_PREFERENCES,
																	...(g.preferences as PreferencesType),
																},
															})
														}
													>
														<Settings className="mr-2 h-4 w-4" />
														{t("guardians.admin.editPreferences", {
															defaultValue: "Edit preferences",
														})}
													</DropdownMenuItem>
													{g.studentLinks.length > 0 && (
														<DropdownMenuSub>
															<DropdownMenuSubTrigger>
																<UserMinus className="mr-2 h-4 w-4" />
																{t("guardians.admin.removeFromStudent", {
																	defaultValue: "Remove from student",
																})}
															</DropdownMenuSubTrigger>
															<DropdownMenuSubContent>
																{g.studentLinks.map((link) => (
																	<DropdownMenuItem
																		key={link.id}
																		onClick={() =>
																			removeLinkMutation.mutate({
																				guardianId: g.id,
																				studentId: link.student.id,
																			})
																		}
																	>
																		{link.student.firstName}{" "}
																		{link.student.lastName}
																	</DropdownMenuItem>
																))}
															</DropdownMenuSubContent>
														</DropdownMenuSub>
													)}
													<DropdownMenuSeparator />
													<DropdownMenuItem
														className="text-destructive"
														onClick={() => setDeleteTarget(g.id)}
													>
														<Trash2 className="mr-2 h-4 w-4" />
														{t("common.actions.delete")}
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>,

									// Expanded student links row
									...(expanded
										? [
												<TableRow
													key={`${g.id}-expanded`}
													className="bg-muted/30"
												>
													<TableCell />
													<TableCell colSpan={5}>
														<div className="space-y-1 py-1">
															{g.studentLinks.map((link) => (
																<div
																	key={link.id}
																	className="flex items-center gap-3 text-sm"
																>
																	<span className="text-muted-foreground">
																		→
																	</span>
																	<span className="font-medium">
																		{link.student.firstName}{" "}
																		{link.student.lastName}
																	</span>
																	{link.student.registrationNumber && (
																		<span className="text-muted-foreground">
																			{link.student.registrationNumber}
																		</span>
																	)}
																	{link.isPrimary && (
																		<Badge
																			variant="default"
																			className="text-xs"
																		>
																			{t("guardians.fields.isPrimary")}
																		</Badge>
																	)}
																	{link.isEmergencyContact && (
																		<Badge
																			variant="outline"
																			className="text-xs"
																		>
																			{t("guardians.fields.isEmergencyContact")}
																		</Badge>
																	)}
																</div>
															))}
														</div>
													</TableCell>
												</TableRow>,
											]
										: []),
								];
							})
						)}
					</TableBody>
				</Table>
			)}

			<TablePagination
				page={page}
				pageCount={data?.pageCount ?? 1}
				total={data?.total ?? 0}
				pageSize={pageSize}
				onPageChange={setPage}
				onPageSizeChange={(s) => {
					setPageSize(s);
					setPage(1);
				}}
			/>

			{/* Add Guardian Dialog */}
			<AddGuardianDialog
				open={showAdd}
				onOpenChange={setShowAdd}
				onCreated={() => {
					invalidate();
					setShowAdd(false);
				}}
			/>

			{/* Edit Preferences Sheet */}
			<Sheet
				open={!!prefTarget}
				onOpenChange={(o) => !o && setPrefTarget(null)}
			>
				<SheetContent>
					<SheetHeader>
						<SheetTitle>
							{t("guardians.admin.editPreferences", {
								defaultValue: "Edit preferences",
							})}{" "}
							— {prefTarget?.name}
						</SheetTitle>
					</SheetHeader>
					{prefTarget && (
						<div className="space-y-4 px-1 pt-6">
							{Object.entries(DEFAULT_PREFERENCES).map(([key]) => {
								const checked =
									prefTarget.preferences[key as keyof PreferencesType] !==
									false;
								return (
									<label key={key} className="flex items-center gap-3 text-sm">
										<Checkbox
											checked={checked}
											onCheckedChange={(v) =>
												setPrefTarget((prev) =>
													prev
														? {
																...prev,
																preferences: {
																	...prev.preferences,
																	[key]: v === true,
																},
															}
														: null,
												)
											}
										/>
										{t(`guardians.preferences.${key}`)}
									</label>
								);
							})}
							<Button
								className="mt-4 w-full"
								disabled={prefMutation.isPending}
								onClick={() =>
									prefTarget &&
									prefMutation.mutate({
										guardianId: prefTarget.id,
										preferences: prefTarget.preferences,
									})
								}
							>
								{t("common.actions.saveChanges")}
							</Button>
						</div>
					)}
				</SheetContent>
			</Sheet>

			{/* Delete Confirm */}
			<AlertDialog
				open={!!deleteTarget}
				onOpenChange={(o) => !o && setDeleteTarget(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("common.confirmDelete")}</AlertDialogTitle>
						<AlertDialogDescription>
							{t("guardians.admin.deleteConfirm", {
								defaultValue:
									"This will permanently delete the guardian and all student links.",
							})}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
						<AlertDialogAction
							onClick={() =>
								deleteTarget && deleteMutation.mutate(deleteTarget)
							}
						>
							{t("common.delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

// ─── Add Guardian Dialog ──────────────────────────────────────────────────────

function AddGuardianDialog({
	open,
	onOpenChange,
	onCreated,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	onCreated: () => void;
}) {
	const { t } = useTranslation();
	const [form, setForm] = useState({
		firstName: "",
		lastName: "",
		email: "",
		phone: "",
		studentId: "",
		relationshipType: "guardian",
		isPrimary: false,
		isEmergencyContact: false,
	});

	const { data: students } = useQuery(
		trpc.students.list.queryOptions({ limit: 200 }),
	);

	const mut = useMutation({
		mutationFn: () =>
			trpcClient.guardians.create.mutate({
				studentId: form.studentId,
				firstName: form.firstName.trim(),
				lastName: form.lastName.trim(),
				email: form.email.trim(),
				phone: form.phone.trim() || undefined,
				relationshipType:
					form.relationshipType as (typeof RELATIONSHIP_TYPES)[number],
				isPrimary: form.isPrimary,
				isEmergencyContact: form.isEmergencyContact,
				preferences: DEFAULT_PREFERENCES,
			}),
		onSuccess: () => {
			toast.success(t("guardians.admin.toasts.saved"));
			onCreated();
			setForm({
				firstName: "",
				lastName: "",
				email: "",
				phone: "",
				studentId: "",
				relationshipType: "guardian",
				isPrimary: false,
				isEmergencyContact: false,
			});
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const isValid =
		form.firstName && form.lastName && form.email && form.studentId;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t("guardians.admin.createTitle")}</DialogTitle>
				</DialogHeader>
				<DialogBody className="grid gap-4 md:grid-cols-2">
					<div className="space-y-2">
						<Label>{t("guardians.fields.firstName")}</Label>
						<Input
							value={form.firstName}
							onChange={(e) =>
								setForm((f) => ({ ...f, firstName: e.target.value }))
							}
						/>
					</div>
					<div className="space-y-2">
						<Label>{t("guardians.fields.lastName")}</Label>
						<Input
							value={form.lastName}
							onChange={(e) =>
								setForm((f) => ({ ...f, lastName: e.target.value }))
							}
						/>
					</div>
					<div className="space-y-2">
						<Label>{t("guardians.fields.email")}</Label>
						<Input
							type="email"
							value={form.email}
							onChange={(e) =>
								setForm((f) => ({ ...f, email: e.target.value }))
							}
						/>
					</div>
					<div className="space-y-2">
						<Label>{t("guardians.fields.phone")}</Label>
						<Input
							value={form.phone}
							onChange={(e) =>
								setForm((f) => ({ ...f, phone: e.target.value }))
							}
						/>
					</div>
					<div className="space-y-2 md:col-span-2">
						<Label>
							{t("guardians.admin.students", {
								defaultValue: "Link to student",
							})}
						</Label>
						<Select
							value={form.studentId}
							onValueChange={(v) => setForm((f) => ({ ...f, studentId: v }))}
						>
							<SelectTrigger>
								<SelectValue
									placeholder={t("guardians.admin.selectStudent", {
										defaultValue: "Select student…",
									})}
								/>
							</SelectTrigger>
							<SelectContent>
								{(students?.items ?? []).map((s) => (
									<SelectItem key={s.id} value={s.id}>
										{s.profile?.firstName} {s.profile?.lastName}
										{s.registrationNumber ? ` — ${s.registrationNumber}` : ""}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<Label>{t("guardians.fields.relationshipType")}</Label>
						<Select
							value={form.relationshipType}
							onValueChange={(v) =>
								setForm((f) => ({ ...f, relationshipType: v }))
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{RELATIONSHIP_TYPES.map((r) => (
									<SelectItem key={r} value={r}>
										{t(`guardians.relationships.${r}`)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="flex flex-col justify-end gap-3">
						<label className="flex items-center gap-2 text-sm">
							<Checkbox
								checked={form.isPrimary}
								onCheckedChange={(v) =>
									setForm((f) => ({ ...f, isPrimary: v === true }))
								}
							/>
							{t("guardians.fields.isPrimary")}
						</label>
						<label className="flex items-center gap-2 text-sm">
							<Checkbox
								checked={form.isEmergencyContact}
								onCheckedChange={(v) =>
									setForm((f) => ({ ...f, isEmergencyContact: v === true }))
								}
							/>
							{t("guardians.fields.isEmergencyContact")}
						</label>
					</div>
				</DialogBody>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						{t("common.actions.cancel")}
					</Button>
					<Button
						disabled={!isValid || mut.isPending}
						onClick={() => mut.mutate()}
					>
						{t("guardians.admin.save")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
