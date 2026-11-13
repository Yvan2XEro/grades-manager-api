import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Pencil, Plus, School, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { createCallable } from "react-call";
import { useMutationFlow } from "react-call/mutation-flow";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import {
	CallableDialog,
	DIALOG_EXIT_MS,
} from "@/components/callable/callable-dialog";
import { Confirm, confirmAction } from "@/components/callable/confirm";
import { QuickCreate } from "@/components/callable/quick-create";
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
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useRowSelection } from "@/hooks/useRowSelection";
import { upsertInList } from "@/lib/query-cache";
import { toast } from "@/lib/toast";
import { StudyCycleFormDialog } from "@/modules/institution/StudyCycleFormDialog";
import { type RouterOutputs, trpcClient } from "@/utils/trpc";
import {
	fetchStudyCyclesSelect,
	ProgramFormDialog,
	STUDY_CYCLES_SELECT_KEY,
	type StudyCyclesSelect,
} from "./ProgramFormDialog";

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
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { t } = useTranslation();

	const [searchInput, _setSearchInput] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	useEffect(() => {
		const timer = setTimeout(() => setSearchQuery(searchInput), 300);
		return () => clearTimeout(timer);
	}, [searchInput]);

	const { data: cycles } = useQuery({
		queryKey: STUDY_CYCLES_SELECT_KEY,
		queryFn: fetchStudyCyclesSelect,
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

	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			await trpcClient.programs.delete.mutate({ id });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["programs"] });
			toast.success(t("admin.programs.toast.deleteSuccess"));
		},
		onError: (error: unknown) => {
			toast.error(
				(error as Error).message || t("admin.programs.toast.deleteError"),
			);
		},
	});

	const selection = useRowSelection(programs ?? []);

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

	const startCreate = async () => {
		const program = await ProgramFormDialog.call({});
		if (program?.id) navigate(`/admin/programs/${program.id}/details`);
	};

	const startDuplicate = async () => {
		const result = await DuplicateProgramsDialog.call({
			sourceProgramIds: [...selection.selectedIds],
		});
		if (result) selection.clear();
	};

	const openDetail = (program: Program) => {
		navigate(`/admin/programs/${program.id}/details`);
	};

	const confirmDelete = (id: string) =>
		Confirm.call({
			title: t("admin.programs.delete.title"),
			description: t("admin.programs.delete.message"),
			confirmLabel: t("common.actions.delete"),
			mutationFn: async (call) => {
				try {
					await deleteMutation.mutateAsync(id);
					call.end(true);
				} catch {
					// toast already shown by the mutation
				}
			},
		});

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
				<Button variant="outline" size="sm" onClick={startDuplicate}>
					<Copy className="mr-1 h-3.5 w-3.5" />
					{t("admin.programs.duplicate.button", {
						defaultValue: "Dupliquer vers cycle…",
					})}
				</Button>
				<Button
					variant="destructive"
					size="sm"
					onClick={() =>
						confirmAction({
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
		</div>
	);
}

interface DuplicateProgramsProps {
	sourceProgramIds: string[];
}

/**
 * Duplicates programs into other study cycles; resolves with the result, or
 * `undefined` when dismissed. A missing target cycle can be created in place.
 */
export const DuplicateProgramsDialog = createCallable<
	DuplicateProgramsProps,
	RouterOutputs["programs"]["duplicateForCycles"] | undefined
>(({ call, sourceProgramIds }) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [targetCycleIds, setTargetCycleIds] = useState<string[]>([]);
	const [cloneCurriculum, setCloneCurriculum] = useState(true);

	const { data: cycles } = useQuery({
		queryKey: STUDY_CYCLES_SELECT_KEY,
		queryFn: fetchStudyCyclesSelect,
	});

	const createCycle = async () => {
		const cycle = await StudyCycleFormDialog.call({});
		if (!cycle) return;
		queryClient.setQueryData<StudyCyclesSelect>(
			STUDY_CYCLES_SELECT_KEY,
			(old) => upsertInList(old, cycle),
		);
		setTargetCycleIds((prev) => [...prev, cycle.id]);
	};

	const submit = useMutationFlow(call, async (call) => {
		try {
			const result = await trpcClient.programs.duplicateForCycles.mutate({
				sourceProgramIds,
				targetCycleIds,
				cloneCurriculum,
			});
			queryClient.invalidateQueries({ queryKey: ["programs"] });
			toast.success(
				t("admin.programs.duplicate.toast.success", {
					defaultValue:
						"{{created}} programme(s) créé(s){{skipped, plural, =0 {} other { ({{skipped}} ignoré(s))}}}",
					created: result.createdCount,
					skipped: result.skippedCount,
				}),
			);
			call.end(result);
		} catch (err) {
			toast.error(
				(err as Error).message ||
					t("admin.programs.duplicate.toast.error", {
						defaultValue: "Erreur lors de la duplication",
					}),
			);
		}
	});

	return (
		<CallableDialog
			call={call}
			dismissValue={undefined}
			preventDismiss={submit.pending}
			className="sm:max-w-lg"
			title={t("admin.programs.duplicate.title", {
				defaultValue: "Dupliquer vers un autre cycle",
			})}
			description={t("admin.programs.duplicate.description", {
				defaultValue:
					"{{count}} programme(s) seront copiés vers chaque cycle sélectionné. Le code et le nom seront préfixés par celui du cycle.",
				count: sourceProgramIds.length,
			})}
		>
			<div className="space-y-4">
				<div className="space-y-2">
					<div className="flex items-center justify-between gap-2">
						<Label>
							{t("admin.programs.duplicate.targetCycles", {
								defaultValue: "Cycles cibles",
							})}
						</Label>
						<QuickCreate
							onCreate={createCycle}
							label={t("admin.studyCycles.actions.add", {
								defaultValue: "Add cycle",
							})}
						/>
					</div>
					{cycles?.items?.length ? (
						<div className="max-h-56 space-y-2 overflow-y-auto rounded-md border p-3">
							{cycles.items.map((cycle) => {
								const checked = targetCycleIds.includes(cycle.id);
								return (
									<label
										key={cycle.id}
										className="flex cursor-pointer items-center gap-2 text-sm"
									>
										<Checkbox
											checked={checked}
											onCheckedChange={(value) => {
												setTargetCycleIds((prev) =>
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
						checked={cloneCurriculum}
						onCheckedChange={(v) => setCloneCurriculum(Boolean(v))}
					/>
					<span>
						{t("admin.programs.duplicate.cloneCurriculum", {
							defaultValue: "Cloner également les UE et EC",
						})}
					</span>
				</label>

				<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
					<Button
						variant="outline"
						onClick={() => call.end(undefined)}
						disabled={submit.pending}
					>
						{t("common.actions.cancel")}
					</Button>
					<Button
						onClick={() => submit()}
						disabled={
							targetCycleIds.length === 0 ||
							sourceProgramIds.length === 0 ||
							submit.pending
						}
					>
						{submit.pending && <Spinner className="mr-2 h-4 w-4" />}
						{t("admin.programs.duplicate.submit", {
							defaultValue: "Dupliquer",
						})}
					</Button>
				</div>
			</div>
		</CallableDialog>
	);
}, DIALOG_EXIT_MS);
