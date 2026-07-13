import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { Copy, Pencil, Plus, School, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { z } from "zod";
import FormModal from "@/components/modals/FormModal";
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
import { BulkActionBar } from "@/components/ui/bulk-action-bar";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ClipboardCopy } from "@/components/ui/clipboard-copy";
import {
	ContextMenuItem,
	ContextMenuSeparator,
} from "@/components/ui/context-menu";
import {
	Dialog,
	DialogBody,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
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
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useConfirm } from "@/hooks/useConfirm";
import { useRowSelection } from "@/hooks/useRowSelection";
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";

const buildProgramSchema = (t: TFunction) =>
	z.object({
		name: z.string().min(2, t("admin.programs.validation.name")),
		code: z.string().min(
			2,
			t("admin.programs.validation.code", {
				defaultValue: "Code is required",
			}),
		),
		cycleId: z.string().nullable().optional(),
	});

type ProgramFormData = z.infer<ReturnType<typeof buildProgramSchema>>;

type Program = {
	id: string;
	code: string;
	name: string;
	nameEn: string | null;
	abbreviation: string | null;
	description: string | null;
	domainFr: string | null;
	domainEn: string | null;
	specialiteFr: string | null;
	specialiteEn: string | null;
	diplomaTitleFr: string | null;
	diplomaTitleEn: string | null;
	attestationValidityFr: string | null;
	attestationValidityEn: string | null;
	cycleId: string | null;
	centerId: string | null;
	isCenterProgram: boolean;
	optionsCount: number;
};

export default function ProgramManagement() {
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const [isDuplicateOpen, setIsDuplicateOpen] = useState(false);
	const [duplicateTargetCycleIds, setDuplicateTargetCycleIds] = useState<
		string[]
	>([]);
	const [duplicateCloneCurriculum, setDuplicateCloneCurriculum] =
		useState(true);

	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { t } = useTranslation();
	const programSchema = useMemo(() => buildProgramSchema(t), [t]);

	const [searchInput, _setSearchInput] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	useEffect(() => {
		const timer = setTimeout(() => setSearchQuery(searchInput), 300);
		return () => clearTimeout(timer);
	}, [searchInput]);

	const { data: cycles } = useQuery({
		queryKey: ["study-cycles-select"],
		queryFn: () => trpcClient.studyCycles.listCycles.query({}),
	});
	const cycleMap = new Map((cycles?.items ?? []).map((c) => [c.id, c.name]));

	const { data: programs, isLoading } = useQuery({
		queryKey: ["programs", searchQuery],
		queryFn: async () => {
			const programRes = await trpcClient.programs.list.query({
				...(searchQuery ? { q: searchQuery } : {}),
				limit: 200,
			});
			return programRes.items.map((p) => ({
				id: p.id,
				code: p.code,
				name: p.name,
				nameEn: (p as any).nameEn ?? null,
				abbreviation: (p as any).abbreviation ?? null,
				description: p.description ?? null,
				domainFr: (p as any).domainFr ?? null,
				domainEn: (p as any).domainEn ?? null,
				specialiteFr: (p as any).specialiteFr ?? null,
				specialiteEn: (p as any).specialiteEn ?? null,
				diplomaTitleFr: (p as any).diplomaTitleFr ?? null,
				diplomaTitleEn: (p as any).diplomaTitleEn ?? null,
				attestationValidityFr: (p as any).attestationValidityFr ?? null,
				attestationValidityEn: (p as any).attestationValidityEn ?? null,
				cycleId: (p as any).cycleId ?? null,
				centerId: (p as any).centerId ?? null,
				isCenterProgram: Boolean((p as any).isCenterProgram),
				optionsCount: (p as any).optionsCount ?? 0,
			})) as Program[];
		},
	});

	const form = useForm<ProgramFormData>({
		resolver: zodResolver(programSchema),
		defaultValues: {
			name: "",
			code: "",
			cycleId: null,
		},
	});

	const createMutation = useMutation({
		mutationFn: async (data: ProgramFormData) => {
			return trpcClient.programs.create.mutate(data);
		},
		onSuccess: (newProgram) => {
			queryClient.invalidateQueries({ queryKey: ["programs"] });
			toast.success(t("admin.programs.toast.createSuccess"));
			handleCloseForm();
			if (newProgram?.id) {
				navigate(`/admin/programs/${newProgram.id}/details`);
			}
		},
		onError: (error: unknown) => {
			toast.error(
				(error as Error).message || t("admin.programs.toast.createError"),
			);
		},
	});

	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			await trpcClient.programs.delete.mutate({ id });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["programs"] });
			toast.success(t("admin.programs.toast.deleteSuccess"));
			setIsDeleteOpen(false);
			setDeleteId(null);
		},
		onError: (error: unknown) => {
			toast.error(
				(error as Error).message || t("admin.programs.toast.deleteError"),
			);
		},
	});

	const selection = useRowSelection(programs ?? []);

	const { confirm, ConfirmDialog } = useConfirm();

	const bulkDeleteMutation = useMutation({
		mutationFn: async (ids: string[]) => {
			await Promise.all(
				ids.map((id) => trpcClient.programs.delete.mutate({ id })),
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["programs"] });
			selection.clear();
			toast.success(
				t("common.bulkActions.deleteSuccess", {
					defaultValue: "Items deleted successfully",
				}),
			);
		},
		onError: () =>
			toast.error(
				t("common.bulkActions.deleteError", {
					defaultValue: "Failed to delete items",
				}),
			),
	});

	const duplicateForCyclesMutation = useMutation({
		mutationFn: (input: {
			sourceProgramIds: string[];
			targetCycleIds: string[];
			cloneCurriculum: boolean;
		}) => trpcClient.programs.duplicateForCycles.mutate(input),
		onSuccess: (result) => {
			queryClient.invalidateQueries({ queryKey: ["programs"] });
			selection.clear();
			setIsDuplicateOpen(false);
			setDuplicateTargetCycleIds([]);
			toast.success(
				t("admin.programs.duplicate.toast.success", {
					defaultValue:
						"{{created}} programme(s) créé(s){{skipped, plural, =0 {} other { ({{skipped}} ignoré(s))}}}",
					created: result.createdCount,
					skipped: result.skippedCount,
				}),
			);
		},
		onError: (err: unknown) =>
			toast.error(
				(err as Error).message ||
					t("admin.programs.duplicate.toast.error", {
						defaultValue: "Erreur lors de la duplication",
					}),
			),
	});

	const onSubmit = (data: ProgramFormData) => {
		createMutation.mutate(data);
	};

	const startCreate = () => {
		form.reset({ name: "", code: "", cycleId: null });
		setIsFormOpen(true);
	};

	const openDetail = (program: Program) => {
		navigate(`/admin/programs/${program.id}/details`);
	};

	const handleCloseForm = () => {
		setIsFormOpen(false);
		form.reset({ name: "", code: "", cycleId: null });
	};

	const confirmDelete = (id: string) => {
		setDeleteId(id);
		setIsDeleteOpen(true);
	};

	const handleDelete = () => {
		if (deleteId) {
			deleteMutation.mutate(deleteId);
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div>
					<h1 className="text-foreground">{t("admin.programs.title")}</h1>
					<p className="text-muted-foreground">
						{t("admin.programs.subtitle")}
					</p>
				</div>
				<Button onClick={startCreate}>
					<Plus className="mr-2 h-4 w-4" />
					{t("admin.programs.actions.add")}
				</Button>
			</div>

			<BulkActionBar
				selectedCount={selection.selectedCount}
				onClear={selection.clear}
			>
				<Button
					variant="outline"
					size="sm"
					onClick={() => {
						setDuplicateTargetCycleIds([]);
						setDuplicateCloneCurriculum(true);
						setIsDuplicateOpen(true);
					}}
				>
					<Copy className="mr-1 h-3.5 w-3.5" />
					{t("admin.programs.duplicate.button", {
						defaultValue: "Dupliquer vers cycle…",
					})}
				</Button>
				<Button
					variant="destructive"
					size="sm"
					onClick={() =>
						confirm({
							title: t("common.bulkActions.confirmDeleteTitle", {
								defaultValue: "Delete selected items?",
							}),
							message: t("common.bulkActions.confirmDelete", {
								defaultValue:
									"Are you sure you want to delete the selected items?",
							}),
							confirmText: t("common.actions.delete"),
							onConfirm: () =>
								bulkDeleteMutation.mutate([...selection.selectedIds]),
						})
					}
					disabled={bulkDeleteMutation.isPending}
				>
					<Trash2 className="mr-1 h-3.5 w-3.5" />
					{t("common.actions.delete")}
				</Button>
			</BulkActionBar>

			<Card>
				<CardHeader>
					<CardTitle>{t("admin.programs.title")}</CardTitle>
					<CardDescription>{t("admin.programs.subtitle")}</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="relative mb-4 w-full max-w-sm">
						<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder={t("admin.programs.search", {
								defaultValue: "Search programs...",
							})}
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-9"
						/>
					</div>
					{isLoading ? (
						<div className="flex h-40 items-center justify-center">
							<Spinner className="h-6 w-6 text-primary" />
						</div>
					) : programs && programs.length > 0 ? (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="w-10">
										<Checkbox
											checked={
												selection.isAllSelected
													? true
													: selection.isSomeSelected
														? "indeterminate"
														: false
											}
											onCheckedChange={(checked) =>
												selection.toggleAll(Boolean(checked))
											}
										/>
									</TableHead>
									<TableHead>
										{t("admin.programs.table.code", { defaultValue: "Code" })}
									</TableHead>
									<TableHead>{t("admin.programs.table.name")}</TableHead>
									<TableHead>
										{t("admin.programs.table.cycle", { defaultValue: "Cycle" })}
									</TableHead>
									<TableHead>{t("admin.programs.table.description")}</TableHead>
									<TableHead className="text-center">
										{t("admin.programs.table.options", {
											defaultValue: "Options",
										})}
									</TableHead>
									<TableHead className="text-right">
										{t("common.table.actions")}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{programs.map((program) => (
									<TableRow
										key={program.id}
										className="cursor-pointer"
										onClick={() => openDetail(program)}
										actions={
											<>
												<ContextMenuItem onSelect={() => openDetail(program)}>
													{t("common.actions.edit")}
												</ContextMenuItem>
												<ContextMenuSeparator />
												<ContextMenuItem
													className="text-destructive"
													onSelect={() => confirmDelete(program.id)}
												>
													{t("common.actions.delete")}
												</ContextMenuItem>
											</>
										}
									>
										<TableCell
											className="w-10"
											onClick={(e) => e.stopPropagation()}
										>
											<Checkbox
												checked={selection.isSelected(program.id)}
												onCheckedChange={() => selection.toggle(program.id)}
											/>
										</TableCell>
										<TableCell>
											<ClipboardCopy
												value={program.code}
												label={t("admin.programs.table.code", {
													defaultValue: "Code",
												})}
											/>
										</TableCell>
										<TableCell className="font-medium">
											{program.name}
										</TableCell>
										<TableCell className="text-muted-foreground text-sm">
											{program.cycleId ? cycleMap.get(program.cycleId) : "—"}
										</TableCell>
										<TableCell>
											{program.description || (
												<span className="text-muted-foreground italic">
													{t("admin.programs.table.noDescription")}
												</span>
											)}
										</TableCell>
										<TableCell className="text-center">
											{program.optionsCount}
										</TableCell>
										<TableCell onClick={(e) => e.stopPropagation()}>
											<div className="flex justify-end gap-2">
												<Button
													variant="ghost"
													size="icon-sm"
													onClick={() => openDetail(program)}
													aria-label={t("admin.programs.form.editTitle")}
												>
													<Pencil className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon-sm"
													className="text-destructive hover:text-destructive"
													onClick={() => confirmDelete(program.id)}
													aria-label={t("admin.programs.delete.title")}
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					) : (
						<Empty className="border border-dashed">
							<EmptyHeader>
								<EmptyMedia variant="icon">
									<School className="text-muted-foreground" />
								</EmptyMedia>
								<EmptyTitle>{t("admin.programs.empty.title")}</EmptyTitle>
								<EmptyDescription>
									{t("admin.programs.empty.description")}
								</EmptyDescription>
							</EmptyHeader>
							<EmptyContent>
								<Button onClick={startCreate}>
									<Plus className="mr-2 h-4 w-4" />
									{t("admin.programs.actions.add")}
								</Button>
							</EmptyContent>
						</Empty>
					)}
				</CardContent>
			</Card>

			<FormModal
				isOpen={isFormOpen}
				onClose={handleCloseForm}
				title={t("admin.programs.form.createTitle")}
			>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<div className="grid gap-4 sm:grid-cols-2">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel required>
											{t("admin.programs.form.nameLabel")}
										</FormLabel>
										<FormControl>
											<Input
												placeholder={t("admin.programs.form.namePlaceholder")}
												{...field}
												value={field.value ?? ""}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="code"
								render={({ field }) => (
									<FormItem>
										<FormLabel required>
											{t("admin.programs.form.codeLabel", {
												defaultValue: "Code",
											})}
										</FormLabel>
										<FormControl>
											<Input
												placeholder="INF-LIC"
												{...field}
												value={field.value ?? ""}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<FormField
							control={form.control}
							name="cycleId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t("admin.programs.form.cycleLabel", {
											defaultValue: "Cycle d'études",
										})}
									</FormLabel>
									<Select
										value={field.value ?? "__NONE__"}
										onValueChange={(v) =>
											field.onChange(v === "__NONE__" ? null : v)
										}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue
													placeholder={t(
														"admin.programs.form.cyclePlaceholder",
														{ defaultValue: "Sélectionner un cycle" },
													)}
												/>
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="__NONE__">
												{t("admin.programs.form.cloneFromNone", {
													defaultValue: "Aucun",
												})}
											</SelectItem>
											{(cycles?.items ?? []).map((cyc) => (
												<SelectItem key={cyc.id} value={cyc.id}>
													{cyc.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
							<Button
								type="button"
								variant="outline"
								onClick={handleCloseForm}
								disabled={form.formState.isSubmitting}
							>
								{t("common.actions.cancel")}
							</Button>
							<Button type="submit" disabled={form.formState.isSubmitting}>
								{form.formState.isSubmitting ? (
									<Spinner className="mr-2 h-4 w-4" />
								) : (
									t("admin.programs.form.submit")
								)}
							</Button>
						</div>
					</form>
				</Form>
			</FormModal>

			<AlertDialog
				open={isDeleteOpen}
				onOpenChange={(open) => {
					setIsDeleteOpen(open);
					if (!open) setDeleteId(null);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("admin.programs.delete.title")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("admin.programs.delete.message")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={deleteMutation.isPending}>
							{t("common.actions.cancel")}
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							disabled={deleteMutation.isPending}
						>
							{deleteMutation.isPending ? (
								<Spinner className="mr-2 h-4 w-4" />
							) : (
								<>
									<Trash2 className="mr-2 h-4 w-4" />
									{t("common.actions.delete")}
								</>
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<Dialog
				open={isDuplicateOpen}
				onOpenChange={(open) => {
					setIsDuplicateOpen(open);
					if (!open) {
						setDuplicateTargetCycleIds([]);
					}
				}}
			>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>
							{t("admin.programs.duplicate.title", {
								defaultValue: "Dupliquer vers un autre cycle",
							})}
						</DialogTitle>
						<DialogDescription>
							{t("admin.programs.duplicate.description", {
								defaultValue:
									"{{count}} programme(s) seront copiés vers chaque cycle sélectionné. Le code et le nom seront préfixés par celui du cycle.",
								count: selection.selectedCount,
							})}
						</DialogDescription>
					</DialogHeader>

					<DialogBody className="space-y-4">
						<div className="space-y-2">
							<Label>
								{t("admin.programs.duplicate.targetCycles", {
									defaultValue: "Cycles cibles",
								})}
							</Label>
							{cycles?.items?.length ? (
								<div className="max-h-56 space-y-2 overflow-y-auto rounded-md border p-3">
									{cycles.items.map((cycle) => {
										const checked = duplicateTargetCycleIds.includes(cycle.id);
										return (
											<label
												key={cycle.id}
												className="flex cursor-pointer items-center gap-2 text-sm"
											>
												<Checkbox
													checked={checked}
													onCheckedChange={(value) => {
														setDuplicateTargetCycleIds((prev) =>
															value
																? [...prev, cycle.id]
																: prev.filter((id) => id !== cycle.id),
														);
													}}
												/>
												<span className="font-medium">{cycle.name}</span>
												<span className="text-muted-foreground text-xs">
													({cycle.code})
												</span>
											</label>
										);
									})}
								</div>
							) : (
								<p className="text-muted-foreground text-sm">
									{t("admin.programs.duplicate.noCycles", {
										defaultValue: "Aucun cycle disponible",
									})}
								</p>
							)}
						</div>

						<label className="flex cursor-pointer items-center gap-2 text-sm">
							<Checkbox
								checked={duplicateCloneCurriculum}
								onCheckedChange={(v) => setDuplicateCloneCurriculum(Boolean(v))}
							/>
							<span>
								{t("admin.programs.duplicate.cloneCurriculum", {
									defaultValue: "Cloner également les UE et EC",
								})}
							</span>
						</label>
					</DialogBody>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsDuplicateOpen(false)}
							disabled={duplicateForCyclesMutation.isPending}
						>
							{t("common.actions.cancel")}
						</Button>
						<Button
							onClick={() =>
								duplicateForCyclesMutation.mutate({
									sourceProgramIds: [...selection.selectedIds],
									targetCycleIds: duplicateTargetCycleIds,
									cloneCurriculum: duplicateCloneCurriculum,
								})
							}
							disabled={
								duplicateTargetCycleIds.length === 0 ||
								selection.selectedCount === 0 ||
								duplicateForCyclesMutation.isPending
							}
						>
							{duplicateForCyclesMutation.isPending && (
								<Spinner className="mr-2 h-4 w-4" />
							)}
							{t("admin.programs.duplicate.submit", {
								defaultValue: "Dupliquer",
							})}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<ConfirmDialog />
		</div>
	);
}
