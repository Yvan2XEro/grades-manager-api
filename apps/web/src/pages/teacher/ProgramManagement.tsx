import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { Copy, Pencil, Plus, School, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
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
import { Switch } from "@/components/ui/switch";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useConfirm } from "@/hooks/useConfirm";
import { useRowSelection } from "@/hooks/useRowSelection";
import { toast } from "@/lib/toast";
import type { RouterOutputs } from "@/utils/trpc";
import { trpcClient } from "@/utils/trpc";

const buildProgramSchema = (t: TFunction) =>
	z.object({
		name: z.string().min(2, t("admin.programs.validation.name")),
		nameEn: z.string().optional().nullable(),
		code: z.string().min(
			2,
			t("admin.programs.validation.code", {
				defaultValue: "Code is required",
			}),
		),
		abbreviation: z.string().optional().nullable(),
		description: z.string().optional(),
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
		exportTemplates: z
			.array(
				z.object({
					templateType: z.enum([
						"pv",
						"evaluation",
						"ue",
						"deliberation",
						"diploma",
						"transcript",
						"attestation",
						"student_list",
					]),
					templateId: z.string().min(1),
				}),
			)
			.optional(),
	});

type ProgramFormData = z.infer<ReturnType<typeof buildProgramSchema>>;
type ExportTemplateType =
	| "pv"
	| "evaluation"
	| "ue"
	| "deliberation"
	| "diploma"
	| "transcript"
	| "attestation"
	| "student_list";
const EXPORT_TEMPLATE_TYPES: ExportTemplateType[] = [
	"diploma",
	"transcript",
	"attestation",
	"student_list",
	"pv",
	"evaluation",
	"ue",
	"deliberation",
];
const EXPORT_TEMPLATE_TYPE_LABELS: Record<ExportTemplateType, string> = {
	diploma: "Diplôme",
	transcript: "Relevé de notes",
	attestation: "Attestation",
	student_list: "Liste d'étudiants",
	pv: "Procès-verbal",
	evaluation: "Publication d'évaluation",
	ue: "Publication d'UE",
	deliberation: "Délibération",
};
const programOptionSchema = z.object({
	name: z.string().min(1, "Name is required"),
	code: z.string().min(1, "Code is required"),
	description: z.string().optional(),
});
type ProgramOptionFormData = z.infer<typeof programOptionSchema>;

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

type ProgramOption = RouterOutputs["programOptions"]["list"]["items"][number];

export default function ProgramManagement() {
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const [editingProgram, setEditingProgram] = useState<Program | null>(null);
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const [cloneFromProgramId, setCloneFromProgramId] = useState<string>("");
	const [optionProgram, setOptionProgram] = useState<Program | null>(null);
	const [editingOption, setEditingOption] = useState<ProgramOption | null>(
		null,
	);
	const [isOptionModalOpen, setIsOptionModalOpen] = useState(false);
	const [isDuplicateOpen, setIsDuplicateOpen] = useState(false);
	const [duplicateTargetCycleIds, setDuplicateTargetCycleIds] = useState<
		string[]
	>([]);
	const [duplicateCloneCurriculum, setDuplicateCloneCurriculum] =
		useState(true);

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

	const { data: centersData } = useQuery({
		queryKey: ["centers", "select"],
		queryFn: async () => {
			const res = await trpcClient.centers.list.query({ limit: 200 });
			return res.items as Array<{ id: string; name: string; code: string }>;
		},
	});
	const centers = centersData ?? [];

	const {
		data: exportTemplatesData,
		isLoading: exportTemplatesLoading,
		error: exportTemplatesError,
	} = useQuery({
		queryKey: ["exportTemplates", "select"],
		queryFn: async () => {
			const res = await trpcClient.exportTemplates.list.query({ limit: 100 });
			return res.items as Array<{
				id: string;
				name: string;
				type: ExportTemplateType;
				variant?: "standard" | "center";
			}>;
		},
	});
	const exportTemplates = exportTemplatesData ?? [];

	const form = useForm<ProgramFormData>({
		resolver: zodResolver(programSchema),
		defaultValues: {
			name: "",
			nameEn: "",
			code: "",
			abbreviation: "",
			description: "",
			cycleId: null,
			centerId: null,
			isCenterProgram: false,
			exportTemplates: [],
			domainFr: "",
			domainEn: "",
			specialiteFr: "",
			specialiteEn: "",
			diplomaTitleFr: "",
			diplomaTitleEn: "",
			attestationValidityFr: "",
			attestationValidityEn: "",
		},
	});

	const optionForm = useForm<ProgramOptionFormData>({
		resolver: zodResolver(programOptionSchema),
		defaultValues: {
			name: "",
			code: "",
			description: "",
		},
	});

	const resetOptionEditing = () => {
		setEditingOption(null);
		optionForm.reset({
			name: "",
			code: "",
			description: "",
		});
	};

	const {
		data: optionList = [],
		isLoading: optionsLoading,
		refetch: refetchOptions,
	} = useQuery({
		queryKey: ["programOptions", optionProgram?.id],
		queryFn: async () => {
			if (!optionProgram) return [];
			const { items } = await trpcClient.programOptions.list.query({
				programId: optionProgram.id,
				limit: 100,
			});
			return items;
		},
		enabled: isOptionModalOpen && Boolean(optionProgram),
	});

	const createOptionMutation = useMutation({
		mutationFn: async (data: ProgramOptionFormData) => {
			if (!optionProgram) throw new Error("No program selected");
			await trpcClient.programOptions.create.mutate({
				...data,
				programId: optionProgram.id,
			});
		},
		onSuccess: () => {
			refetchOptions();
			resetOptionEditing();
			toast.success(
				t("admin.programs.options.toast.create", {
					defaultValue: "Option added",
				}),
			);
		},
		onError: (error: unknown) => {
			toast.error(
				(error as Error).message ||
					t("admin.programs.options.toast.createError", {
						defaultValue: "Could not add option",
					}),
			);
		},
	});

	const deleteOptionMutation = useMutation({
		mutationFn: async (id: string) => {
			await trpcClient.programOptions.delete.mutate({ id });
		},
		onSuccess: () => {
			refetchOptions();
			resetOptionEditing();
			toast.success(
				t("admin.programs.options.toast.delete", {
					defaultValue: "Option deleted",
				}),
			);
		},
		onError: (error: unknown) => {
			toast.error(
				(error as Error).message ||
					t("admin.programs.options.toast.deleteError", {
						defaultValue: "Could not delete option",
					}),
			);
		},
	});

	const updateOptionMutation = useMutation({
		mutationFn: async (
			input: ProgramOptionFormData & { id: string; programId: string },
		) => {
			await trpcClient.programOptions.update.mutate(input);
		},
		onSuccess: () => {
			refetchOptions();
			resetOptionEditing();
			toast.success(
				t("admin.programs.options.toast.update", {
					defaultValue: "Option updated",
				}),
			);
		},
		onError: (error: unknown) => {
			toast.error(
				error instanceof Error
					? error.message
					: t("admin.programs.options.toast.updateError", {
							defaultValue: "Could not update option",
						}),
			);
		},
	});

	const cloneCurriculumMutation = useMutation({
		mutationFn: ({
			targetProgramId,
			sourceProgramId,
		}: {
			targetProgramId: string;
			sourceProgramId: string;
		}) =>
			trpcClient.programs.cloneCurriculum.mutate({
				targetProgramId,
				sourceProgramId,
			}),
		onSuccess: (result) => {
			toast.success(
				t("admin.programs.toast.cloneSuccess", {
					defaultValue: "Curriculum cloné : {{units}} UE, {{courses}} EC",
					units: result.unitsCreated,
					courses: result.coursesCreated,
				}),
			);
		},
		onError: (err: unknown) =>
			toast.error(
				(err as Error).message ||
					t("admin.programs.toast.cloneError", {
						defaultValue: "Erreur lors du clonage",
					}),
			),
	});

	const createMutation = useMutation({
		mutationFn: async (data: ProgramFormData) => {
			return trpcClient.programs.create.mutate(data);
		},
		onSuccess: (newProgram) => {
			queryClient.invalidateQueries({ queryKey: ["programs"] });
			toast.success(t("admin.programs.toast.createSuccess"));
			if (cloneFromProgramId && newProgram?.id) {
				cloneCurriculumMutation.mutate({
					targetProgramId: newProgram.id,
					sourceProgramId: cloneFromProgramId,
				});
			}
			handleCloseForm();
		},
		onError: (error: unknown) => {
			toast.error(
				(error as Error).message || t("admin.programs.toast.createError"),
			);
		},
	});

	const updateMutation = useMutation({
		mutationFn: async (data: ProgramFormData & { id: string }) => {
			await trpcClient.programs.update.mutate(data);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["programs"] });
			toast.success(t("admin.programs.toast.updateSuccess"));
			handleCloseForm();
		},
		onError: (error: unknown) => {
			toast.error(
				(error as Error).message || t("admin.programs.toast.updateError"),
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
		if (editingProgram) {
			updateMutation.mutate({ ...data, id: editingProgram.id });
		} else {
			createMutation.mutate(data);
		}
	};

	const onSubmitOption = (data: ProgramOptionFormData) => {
		if (!optionProgram) return;
		if (editingOption) {
			updateOptionMutation.mutate({
				id: editingOption.id,
				programId: optionProgram.id,
				...data,
			});
		} else {
			createOptionMutation.mutate(data);
		}
	};

	const emptyProgramForm = {
		name: "",
		nameEn: "",
		code: "",
		abbreviation: "",
		description: "",
		cycleId: null as string | null,
		centerId: null as string | null,
		isCenterProgram: false,
		exportTemplates: [] as Array<{
			templateType: ExportTemplateType;
			templateId: string;
		}>,
		domainFr: "",
		domainEn: "",
		specialiteFr: "",
		specialiteEn: "",
		diplomaTitleFr: "",
		diplomaTitleEn: "",
		attestationValidityFr: "",
		attestationValidityEn: "",
	};

	const startCreate = () => {
		setEditingProgram(null);
		setCloneFromProgramId("");
		form.reset(emptyProgramForm);
		setIsFormOpen(true);
	};

	const startEdit = async (program: Program) => {
		setEditingProgram(program);
		form.reset({
			name: program.name,
			nameEn: program.nameEn ?? "",
			code: program.code,
			abbreviation: program.abbreviation ?? "",
			description: program.description ?? "",
			cycleId: program.cycleId ?? null,
			centerId: program.centerId ?? null,
			isCenterProgram: program.isCenterProgram ?? false,
			exportTemplates: [],
			domainFr: program.domainFr ?? "",
			domainEn: program.domainEn ?? "",
			specialiteFr: program.specialiteFr ?? "",
			specialiteEn: program.specialiteEn ?? "",
			diplomaTitleFr: program.diplomaTitleFr ?? "",
			diplomaTitleEn: program.diplomaTitleEn ?? "",
			attestationValidityFr: program.attestationValidityFr ?? "",
			attestationValidityEn: program.attestationValidityEn ?? "",
		});
		setIsFormOpen(true);
		try {
			const assignments = await trpcClient.programs.listExportTemplates.query({
				programId: program.id,
			});
			form.setValue(
				"exportTemplates",
				assignments.map((a) => ({
					templateType: a.templateType as ExportTemplateType,
					templateId: a.templateId,
				})),
			);
		} catch {
			// non-blocking
		}
	};

	const handleCloseForm = () => {
		setIsFormOpen(false);
		setEditingProgram(null);
		setCloneFromProgramId("");
		form.reset(emptyProgramForm);
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

	const openOptionsModal = (program: Program) => {
		setOptionProgram(program);
		resetOptionEditing();
		setIsOptionModalOpen(true);
	};

	const closeOptionsModal = () => {
		setIsOptionModalOpen(false);
		setOptionProgram(null);
		resetOptionEditing();
	};

	const handleDeleteOption = (optionId: string) => {
		deleteOptionMutation.mutate(optionId);
	};

	const handleEditOption = (option: ProgramOption) => {
		setEditingOption(option);
		optionForm.reset({
			name: option.name,
			code: option.code,
			description: option.description ?? "",
		});
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
										actions={
											<>
												<ContextMenuItem onSelect={() => startEdit(program)}>
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
										<TableCell className="w-10">
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
										<TableCell>
											<div className="flex justify-end gap-2">
												<Button
													variant="ghost"
													size="icon-sm"
													onClick={() => startEdit(program)}
													aria-label={t("admin.programs.form.editTitle")}
												>
													<Pencil className="h-4 w-4" />
												</Button>
												<Button
													variant="outline"
													size="sm"
													onClick={() => openOptionsModal(program)}
												>
													{t("admin.programs.options.manage", {
														defaultValue: "Manage options",
													})}
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
				title={
					editingProgram
						? t("admin.programs.form.editTitle")
						: t("admin.programs.form.createTitle")
				}
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
								name="nameEn"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("admin.programs.form.nameEnLabel", {
												defaultValue: "Name (English)",
											})}
										</FormLabel>
										<FormControl>
											<Input
												placeholder="Computer Science"
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
							<FormField
								control={form.control}
								name="abbreviation"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("admin.programs.form.abbreviationLabel", {
												defaultValue: "Abréviation",
											})}
										</FormLabel>
										<FormControl>
											<Input
												placeholder="INFO"
												{...field}
												value={field.value ?? ""}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<div className="grid gap-4 sm:grid-cols-2">
							<FormField
								control={form.control}
								name="domainFr"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("admin.programs.form.domainFrLabel", {
												defaultValue: "Domaine (FR)",
											})}
										</FormLabel>
										<FormControl>
											<Input
												placeholder="Sciences et Technologies"
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
								name="domainEn"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("admin.programs.form.domainEnLabel", {
												defaultValue: "Domain (EN)",
											})}
										</FormLabel>
										<FormControl>
											<Input
												placeholder="Science and Technology"
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
								name="specialiteFr"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("admin.programs.form.specialiteFrLabel", {
												defaultValue: "Spécialité (FR)",
											})}
										</FormLabel>
										<FormControl>
											<Input
												placeholder="Génie Logiciel"
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
								name="specialiteEn"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("admin.programs.form.specialiteEnLabel", {
												defaultValue: "Specialization (EN)",
											})}
										</FormLabel>
										<FormControl>
											<Input
												placeholder="Software Engineering"
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
								name="diplomaTitleFr"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("admin.programs.form.diplomaTitleFrLabel", {
												defaultValue: "Titre diplôme (FR)",
											})}
										</FormLabel>
										<FormControl>
											<Input
												placeholder="Licence en Informatique"
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
								name="diplomaTitleEn"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("admin.programs.form.diplomaTitleEnLabel", {
												defaultValue: "Diploma title (EN)",
											})}
										</FormLabel>
										<FormControl>
											<Input
												placeholder="Bachelor of Computer Science"
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
								name="attestationValidityFr"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("admin.programs.form.attestationValidityFrLabel", {
												defaultValue: "Validité attestation (FR)",
											})}
										</FormLabel>
										<FormControl>
											<Input
												placeholder="Six (06) mois"
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
								name="attestationValidityEn"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("admin.programs.form.attestationValidityEnLabel", {
												defaultValue: "Attestation validity (EN)",
											})}
										</FormLabel>
										<FormControl>
											<Input
												placeholder="Six (06) months"
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
						<div className="space-y-4">
							<FormField
								control={form.control}
								name="centerId"
								render={({ field }) => (
									<FormItem className="min-w-0">
										<FormLabel>
											{t("admin.programs.form.centerLabel", {
												defaultValue: "Centre",
											})}
										</FormLabel>
										<Select
											value={field.value ?? "__NONE__"}
											onValueChange={(v) => {
												const next = v === "__NONE__" ? null : v;
												field.onChange(next);
												form.setValue("isCenterProgram", Boolean(next));
											}}
										>
											<FormControl>
												<SelectTrigger className="w-full min-w-0">
													<SelectValue
														placeholder={t(
															"admin.programs.form.centerPlaceholder",
															{ defaultValue: "Aucun centre" },
														)}
														className="block truncate"
													/>
												</SelectTrigger>
											</FormControl>
											<SelectContent
												align="start"
												position="popper"
												className="w-[var(--radix-select-trigger-width)] max-w-[var(--radix-select-trigger-width)]"
											>
												<SelectItem value="__NONE__">
													{t("admin.programs.form.centerNone", {
														defaultValue: "Aucun (programme général)",
													})}
												</SelectItem>
												{centers.map((c) => (
													<SelectItem
														key={c.id}
														value={c.id}
														className="[&>span:last-child]:truncate"
													>
														{c.name}
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
								name="isCenterProgram"
								render={({ field }) => (
									<FormItem className="flex items-center justify-between rounded-md border p-3">
										<div className="space-y-0.5">
											<FormLabel className="text-sm">
												{t("admin.programs.form.isCenterProgramLabel", {
													defaultValue: "Programme de centre",
												})}
											</FormLabel>
											<p className="text-muted-foreground text-xs">
												{t("admin.programs.form.isCenterProgramHint", {
													defaultValue:
														"Marquez ce programme comme rattaché à un centre.",
												})}
											</p>
										</div>
										<FormControl>
											<Switch
												checked={Boolean(field.value)}
												onCheckedChange={field.onChange}
											/>
										</FormControl>
									</FormItem>
								)}
							/>
						</div>
						<FormField
							control={form.control}
							name="exportTemplates"
							render={({ field }) => {
								const currentByType = new Map(
									(field.value ?? []).map((a) => [
										a.templateType,
										a.templateId,
									]),
								);
								const updateAssignment = (
									type: ExportTemplateType,
									templateId: string | null,
								) => {
									const next = (field.value ?? []).filter(
										(a) => a.templateType !== type,
									);
									if (templateId) {
										next.push({ templateType: type, templateId });
									}
									field.onChange(next);
								};
								// Centre vs standard filtering: when the program is attached
								// to a center, prefer the "center" variants of system
								// templates. The 4 non-document types (pv/eval/ue/delib) only
								// have a "standard" variant — show it unconditionally.
								const isCenterProgram = Boolean(form.watch("centerId"));
								const variantNeeded: "standard" | "center" = isCenterProgram
									? "center"
									: "standard";
								return (
									<FormItem className="space-y-3 rounded-md border p-3">
										<div>
											<FormLabel className="text-sm">
												{t("admin.programs.form.exportTemplatesLabel", {
													defaultValue: "Modèles d'exportation",
												})}
											</FormLabel>
											<p className="text-muted-foreground text-xs">
												{isCenterProgram
													? `Programme rattaché à un centre — les modèles "Centre" sont prioritaires (en-tête institut + données du centre).`
													: t("admin.programs.form.exportTemplatesHint", {
															defaultValue:
																"Choisissez le modèle par défaut par type de document.",
														})}
											</p>
											{exportTemplatesError && (
												<p className="rounded bg-red-50 px-2 py-1 text-red-700 text-xs">
													Erreur lors du chargement des modèles :{" "}
													{exportTemplatesError instanceof Error
														? exportTemplatesError.message
														: String(exportTemplatesError)}
												</p>
											)}
											{!exportTemplatesLoading &&
												!exportTemplatesError &&
												exportTemplates.length === 0 && (
													<p className="rounded bg-amber-50 px-2 py-1 text-amber-800 text-xs">
														Aucun modèle disponible pour cette institution.{" "}
														Allez dans <strong>Modèles d'exportation</strong> et
														cliquez{" "}
														<strong>"Initialiser modèles officiels"</strong>{" "}
														pour seeder les modèles par défaut.
													</p>
												)}
											{!exportTemplatesLoading &&
												!exportTemplatesError &&
												exportTemplates.length > 0 && (
													<p className="text-muted-foreground text-xs">
														{exportTemplates.length} modèle(s) chargé(s) ·{" "}
														{
															exportTemplates.filter(
																(t) => (t.variant ?? "standard") === "center",
															).length
														}{" "}
														variante(s) Centre
													</p>
												)}
										</div>
										<div className="grid gap-3 md:grid-cols-2">
											{EXPORT_TEMPLATE_TYPES.map((type) => {
												const allOfType = exportTemplates.filter(
													(tpl) => tpl.type === type,
												);
												// Templates created before the variant column was
												// added have variant=null/undefined — treat them
												// as "standard" for back-compat.
												const variantOf = (tpl: {
													variant?: "standard" | "center";
												}): "standard" | "center" => tpl.variant ?? "standard";
												// Try the preferred variant first; if there's nothing
												// (e.g. pv/eval/ue/delib never have a center variant,
												// or the admin hasn't re-seeded after the 0005
												// migration yet), fall back to ALL templates of this
												// type so the dropdown is never empty when content
												// exists.
												const preferred = allOfType.filter(
													(tpl) => variantOf(tpl) === variantNeeded,
												);
												const options =
													preferred.length > 0 ? preferred : allOfType;
												const usedFallback =
													isCenterProgram &&
													preferred.length === 0 &&
													allOfType.length > 0;
												const value = currentByType.get(type) ?? "__NONE__";
												return (
													<div key={type} className="space-y-1.5">
														<Label className="text-xs">
															{EXPORT_TEMPLATE_TYPE_LABELS[type]}
															{isCenterProgram && preferred.length > 0 && (
																<span className="ml-1 text-muted-foreground">
																	(centre)
																</span>
															)}
															{usedFallback && (
																<span
																	className="ml-1 text-amber-600"
																	title="Aucun modèle Centre disponible — modèles standard listés"
																>
																	(standard)
																</span>
															)}
														</Label>
														<Select
															value={value}
															onValueChange={(v) =>
																updateAssignment(
																	type,
																	v === "__NONE__" ? null : v,
																)
															}
														>
															<SelectTrigger>
																<SelectValue
																	placeholder={t(
																		"admin.programs.form.exportTemplatePlaceholder",
																		{ defaultValue: "Aucun modèle" },
																	)}
																/>
															</SelectTrigger>
															<SelectContent>
																<SelectItem value="__NONE__">
																	{t("admin.programs.form.exportTemplateNone", {
																		defaultValue: "Aucun",
																	})}
																</SelectItem>
																{options.map((tpl) => {
																	const v = variantOf(tpl);
																	return (
																		<SelectItem key={tpl.id} value={tpl.id}>
																			<span className="flex items-center gap-2">
																				<span>{tpl.name}</span>
																				{v === "center" && (
																					<span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] text-emerald-800">
																						centre
																					</span>
																				)}
																			</span>
																		</SelectItem>
																	);
																})}
															</SelectContent>
														</Select>
														<ConfirmDialog />
													</div>
												);
											})}
										</div>
										<FormMessage />
									</FormItem>
								);
							}}
						/>
						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t("admin.programs.form.descriptionLabel")}
									</FormLabel>
									<FormControl>
										<Textarea
											rows={4}
											placeholder={t(
												"admin.programs.form.descriptionPlaceholder",
											)}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						{!editingProgram && (
							<div className="space-y-2 rounded-lg border border-dashed p-3">
								<div className="flex items-center gap-2">
									<Copy className="h-4 w-4 text-muted-foreground" />
									<span className="font-medium text-sm">
										{t("admin.programs.form.cloneFrom", {
											defaultValue: "Cloner le curriculum depuis (optionnel)",
										})}
									</span>
								</div>
								<Select
									value={cloneFromProgramId || "__NONE__"}
									onValueChange={(v) =>
										setCloneFromProgramId(v === "__NONE__" ? "" : v)
									}
								>
									<SelectTrigger>
										<SelectValue
											placeholder={t(
												"admin.programs.form.cloneFromPlaceholder",
												{ defaultValue: "Aucun - laisser vide" },
											)}
										/>
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="__NONE__">
											{t("admin.programs.form.cloneFromPlaceholder", {
												defaultValue: "Aucun - laisser vide",
											})}
										</SelectItem>
										{programs?.map((p) => (
											<SelectItem key={p.id} value={p.id}>
												{p.code} — {p.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{cloneFromProgramId && (
									<p className="text-muted-foreground text-xs">
										{t("admin.programs.form.cloneFromHint", {
											defaultValue:
												"Les UE et EC du programme source seront copies apres la creation.",
										})}
									</p>
								)}
							</div>
						)}

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
								) : editingProgram ? (
									t("common.actions.saveChanges")
								) : cloneFromProgramId ? (
									t("admin.programs.form.submitWithClone", {
										defaultValue: "Creer et cloner",
									})
								) : (
									t("admin.programs.form.submit")
								)}
							</Button>
						</div>
					</form>
				</Form>
			</FormModal>

			<FormModal
				isOpen={isOptionModalOpen}
				onClose={closeOptionsModal}
				title={t("admin.programs.options.title", {
					defaultValue: "Manage options for {{value}}",
					value: optionProgram?.name ?? "",
				})}
				maxWidth="sm:max-w-xl"
			>
				<div className="space-y-4">
					<div className="space-y-2">
						{optionsLoading ? (
							<div className="flex justify-center py-6">
								<Spinner className="h-6 w-6 text-primary" />
							</div>
						) : optionList.length ? (
							<div className="max-h-64 space-y-2 overflow-y-auto pr-2">
								{optionList.map((option) => (
									<div
										key={option.id}
										className="flex items-start justify-between rounded-lg border border-border p-3"
									>
										<div>
											<p className="font-medium text-sm">{option.name}</p>
											<p className="text-muted-foreground text-xs">
												{option.code}
											</p>
											{option.description && (
												<p className="text-muted-foreground text-xs">
													{option.description}
												</p>
											)}
										</div>
										<div className="flex gap-2">
											<Button
												variant="ghost"
												size="icon-sm"
												onClick={() => handleEditOption(option)}
												aria-label={t("admin.programs.options.edit", {
													defaultValue: "Edit option",
												})}
											>
												<Pencil className="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="icon-sm"
												disabled={
													optionList.length <= 1 ||
													deleteOptionMutation.isPending
												}
												onClick={() => handleDeleteOption(option.id)}
												aria-label={t("admin.programs.options.delete", {
													defaultValue: "Delete option",
												})}
											>
												<Trash2 className="h-4 w-4 text-destructive" />
											</Button>
										</div>
									</div>
								))}
							</div>
						) : (
							<p className="text-muted-foreground text-xs">
								{t("admin.programs.options.empty", {
									defaultValue: "No options yet. Add one below.",
								})}
							</p>
						)}
					</div>
					<Form {...optionForm}>
						<form
							onSubmit={optionForm.handleSubmit(onSubmitOption)}
							className="space-y-3 rounded-lg border border-border p-3"
						>
							{editingOption ? (
								<div className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm">
									<span>
										{t("admin.programs.options.editing", {
											defaultValue: "Editing option {{name}}",
											name: editingOption.name,
										})}
									</span>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={resetOptionEditing}
									>
										{t("admin.programs.options.cancelEdit", {
											defaultValue: "Cancel",
										})}
									</Button>
								</div>
							) : null}
							<div className="grid gap-3 sm:grid-cols-2">
								<FormField
									control={optionForm.control}
									name="name"
									render={({ field }) => (
										<FormItem>
											<FormLabel required>
												{t("admin.programs.options.form.name", {
													defaultValue: "Option name",
												})}
											</FormLabel>
											<FormControl>
												<Input {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={optionForm.control}
									name="code"
									render={({ field }) => (
										<FormItem>
											<FormLabel required>
												{t("admin.programs.options.form.code", {
													defaultValue: "Code",
												})}
											</FormLabel>
											<FormControl>
												<Input {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<FormField
								control={optionForm.control}
								name="description"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("admin.programs.options.form.description", {
												defaultValue: "Description",
											})}
										</FormLabel>
										<FormControl>
											<Textarea rows={2} {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<div className="flex justify-end">
								<Button
									type="submit"
									disabled={
										!optionProgram ||
										createOptionMutation.isPending ||
										updateOptionMutation.isPending
									}
								>
									{(createOptionMutation.isPending ||
										updateOptionMutation.isPending) && (
										<Spinner className="mr-2 h-4 w-4" />
									)}
									{editingOption
										? t("admin.programs.options.form.updateSubmit", {
												defaultValue: "Save changes",
											})
										: t("admin.programs.options.form.submit", {
												defaultValue: "Add option",
											})}
								</Button>
							</div>
						</form>
					</Form>
				</div>
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
		</div>
	);
}
