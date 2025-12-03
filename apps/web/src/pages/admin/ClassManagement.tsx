import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import ConfirmModal from "../../components/modals/ConfirmModal";
import FormModal from "../../components/modals/FormModal";
import { Button } from "../../components/ui/button";
import { DialogFooter } from "../../components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "../../components/ui/form";
import { Input } from "../../components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../components/ui/select";
import { Spinner } from "../../components/ui/spinner";
import type { RouterOutputs } from "../../utils/trpc";
import { trpcClient } from "../../utils/trpc";

const buildClassSchema = (t: TFunction) =>
	z.object({
		programId: z.string({
			required_error: t("admin.classes.validation.program"),
		}),
		academicYearId: z.string({
			required_error: t("admin.classes.validation.academicYear"),
		}),
		cycleLevelId: z.string({
			required_error: t("admin.classes.validation.cycleLevel", {
				defaultValue: "Please select a cycle level",
			}),
		}),
		programOptionId: z.string({
			required_error: t("admin.classes.validation.programOption", {
				defaultValue: "Please select a program option",
			}),
		}),
		name: z.string().min(2, t("admin.classes.validation.name")),
	});

type ClassFormData = z.infer<ReturnType<typeof buildClassSchema>>;

interface Class {
	id: string;
	name: string;
	programId: string;
	academicYearId: string;
	cycleLevelId: string;
	programOptionId: string;
	program: { name: string; cycleName?: string | null; cycleCode?: string | null };
	academicYear: { name: string };
	cycle?: { id: string; name: string; code: string };
	cycleLevel?: { id: string; name: string; code: string };
	programOption?: { id: string; name: string; code: string };
	students: { id: string }[];
}

type CycleLevelOption =
	RouterOutputs["studyCycles"]["listLevels"][number] & {
		cycle: {
			id: string;
			name: string;
			code: string | null;
		};
	};

export default function ClassManagement() {
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const [editingClass, setEditingClass] = useState<Class | null>(null);
	const [deleteId, setDeleteId] = useState<string | null>(null);

	const queryClient = useQueryClient();
	const { t } = useTranslation();
	const classSchema = useMemo(() => buildClassSchema(t), [t]);

	const { data: classes, isLoading } = useQuery({
		queryKey: ["classes"],
		queryFn: async () => {
			const { items } = await trpcClient.classes.list.query({});
			return Promise.all(
				items.map(async (cls) => {
					const students = await trpcClient.students.list.query({
						classId: cls.id,
					});
					return {
						id: cls.id,
						name: cls.name,
						programId: cls.program,
						academicYearId: cls.academicYear,
						cycleLevelId: cls.cycleLevelId,
						programOptionId: cls.programOptionId,
						program: {
							name: cls.programInfo?.name ?? "",
							cycleName: cls.cycle?.name,
							cycleCode: cls.cycle?.code,
						},
						academicYear: { name: cls.academicYearInfo?.name ?? "" },
						cycle: cls.cycle ?? undefined,
						cycleLevel: cls.cycleLevel ?? undefined,
						programOption: cls.programOption ?? undefined,
						students: students.items.map((s) => ({ id: s.id })),
					} as Class;
				}),
			);
		},
	});

	const { data: programs } = useQuery({
		queryKey: ["programs"],
		queryFn: async () => {
			const { items } = await trpcClient.programs.list.query({});
			return items;
		},
	});

	const { data: academicYears } = useQuery({
		queryKey: ["academicYears"],
		queryFn: async () => {
			const { items } = await trpcClient.academicYears.list.query({});
			return items;
		},
	});

	const form = useForm<ClassFormData>({
		resolver: zodResolver(classSchema),
		defaultValues: {
			programId: "",
			academicYearId: "",
			cycleLevelId: "",
			programOptionId: "",
			name: "",
		},
	});

	const { watch, setValue } = form;

	const selectedProgramId = watch("programId");
	const selectedAcademicYearId = watch("academicYearId");
	const selectedProgram = useMemo(
		() => programs?.find((p) => p.id === selectedProgramId),
		[programs, selectedProgramId],
	);

	const { data: cycleLevelsData } = useQuery({
		queryKey: ["cycleLevelsByFaculty", selectedProgram?.faculty],
		queryFn: async () => {
			if (!selectedProgram?.faculty) return [] as CycleLevelOption[];
			const { items: cycles } = await trpcClient.studyCycles.listCycles.query({
				facultyId: selectedProgram.faculty,
				limit: 100,
			});
			if (!cycles.length) return [];
			const levels = await Promise.all(
				cycles.map(async (cycle) => {
					const levelList = await trpcClient.studyCycles.listLevels.query({
						cycleId: cycle.id,
					});
					return levelList.map((level) => ({
						...level,
						cycle: {
							id: cycle.id,
							name: cycle.name,
							code: cycle.code,
						},
					}));
				}),
			);
			return levels.flat() as CycleLevelOption[];
		},
		enabled: Boolean(selectedProgram?.faculty),
	});
	const cycleLevels = cycleLevelsData ?? [];
	const cycleLevelId = watch("cycleLevelId");
	const selectedCycleLevel = useMemo(
		() => cycleLevels.find((level) => level.id === cycleLevelId),
		[cycleLevels, cycleLevelId],
	);

	useEffect(() => {
		if (!selectedProgram) {
			setValue("cycleLevelId", "");
		}
	}, [selectedProgram, setValue]);

	useEffect(() => {
		if (!cycleLevels.length) return;
		if (!cycleLevelId || !cycleLevels.some((level) => level.id === cycleLevelId)) {
			setValue("cycleLevelId", cycleLevels[0].id);
		}
	}, [cycleLevels, cycleLevelId, setValue]);

	const { data: programOptionsData } = useQuery({
		queryKey: ["programOptions", selectedProgram?.id],
		queryFn: async () => {
			if (!selectedProgram) return [];
			const { items } = await trpcClient.programOptions.list.query({
				programId: selectedProgram.id,
			});
			return items;
		},
		enabled: Boolean(selectedProgram?.id),
	});
	const programOptions = programOptionsData ?? [];
	const programOptionId = watch("programOptionId");
	const selectedProgramOption = useMemo(
		() => programOptions.find((option) => option.id === programOptionId),
		[programOptions, programOptionId],
	);

	useEffect(() => {
		if (!selectedProgram) {
			setValue("programOptionId", "");
		}
	}, [selectedProgram, setValue]);

	useEffect(() => {
		if (!programOptions.length) return;
		if (
			!programOptionId ||
			!programOptions.some((option) => option.id === programOptionId)
		) {
			setValue("programOptionId", programOptions[0].id);
		}
	}, [programOptions, programOptionId, setValue]);

	useEffect(() => {
		const year = academicYears?.find((y) => y.id === selectedAcademicYearId);
		if (selectedProgramOption && year) {
			const startYear = new Date(year.startDate).getFullYear();
			const endYear = new Date(year.endDate).getFullYear();
			setValue(
				"name",
				`${selectedProgramOption.name} (${startYear}-${endYear})`,
			);
		}
	}, [
		selectedProgramOption,
		selectedAcademicYearId,
		academicYears,
		setValue,
	]);

	const createMutation = useMutation({
		mutationFn: async (data: ClassFormData) => {
			await trpcClient.classes.create.mutate({
				name: data.name,
				program: data.programId,
				academicYear: data.academicYearId,
				cycleLevelId: data.cycleLevelId,
				programOptionId: data.programOptionId,
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["classes"] });
			toast.success(t("admin.classes.toast.createSuccess"));
			setIsFormOpen(false);
			form.reset();
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error && error.message
					? error.message
					: t("admin.classes.toast.createError");
			toast.error(message);
		},
	});

	const updateMutation = useMutation({
		mutationFn: async (data: ClassFormData & { id: string }) => {
			await trpcClient.classes.update.mutate({
				id: data.id,
				name: data.name,
				program: data.programId,
				academicYear: data.academicYearId,
				cycleLevelId: data.cycleLevelId,
				programOptionId: data.programOptionId,
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["classes"] });
			toast.success(t("admin.classes.toast.updateSuccess"));
			setIsFormOpen(false);
			setEditingClass(null);
			form.reset();
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error && error.message
					? error.message
					: t("admin.classes.toast.updateError");
			toast.error(message);
		},
	});

	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			await trpcClient.classes.delete.mutate({ id });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["classes"] });
			toast.success(t("admin.classes.toast.deleteSuccess"));
			setIsDeleteOpen(false);
			setDeleteId(null);
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error && error.message
					? error.message
					: t("admin.classes.toast.deleteError");
			toast.error(message);
		},
	});

	const onSubmit = async (data: ClassFormData) => {
		if (editingClass) {
			updateMutation.mutate({ ...data, id: editingClass.id });
		} else {
			createMutation.mutate(data);
		}
	};

	const openDeleteModal = (id: string) => {
		setDeleteId(id);
		setIsDeleteOpen(true);
	};

	const handleDelete = () => {
		if (deleteId) {
			deleteMutation.mutate(deleteId);
		}
	};

	if (isLoading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<span className="loading loading-spinner loading-lg" />
			</div>
		);
	}

	return (
		<div className="p-6">
			<div className="mb-6 flex items-center justify-between">
				<div>
					<h1 className="font-bold text-2xl">{t("admin.classes.title")}</h1>
					<p className="text-base-content/60">{t("admin.classes.subtitle")}</p>
				</div>
				<Button
					type="button"
					onClick={() => {
						setEditingClass(null);
						form.reset();
						setIsFormOpen(true);
					}}
					className="btn btn-primary"
				>
					<Plus className="mr-2 h-5 w-5" />
					{t("admin.classes.actions.add")}
				</Button>
			</div>

			<Card className="overflow-x-auto">
				{classes?.length === 0 ? (
					<div className="card-body items-center py-12 text-center">
						<Users className="mx-auto h-16 w-16 text-base-content/20" />
						<h2 className="card-title mt-4">
							{t("admin.classes.empty.title")}
						</h2>
						<p className="text-base-content/60">
							{t("admin.classes.empty.description")}
						</p>
						<Button
							type="button"
							onClick={() => {
								setEditingClass(null);
								form.reset();
								setIsFormOpen(true);
							}}
							className="btn btn-primary mt-4"
						>
							<Plus className="mr-2 h-4 w-4" />
							{t("admin.classes.actions.add")}
						</Button>
					</div>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>{t("admin.classes.table.name")}</TableHead>
								<TableHead>{t("admin.classes.table.program")}</TableHead>
								<TableHead>{t("admin.classes.table.academicYear")}</TableHead>
								<TableHead>
									{t("admin.classes.table.cycle", {
										defaultValue: "Cycle / level",
									})}
								</TableHead>
								<TableHead>
									{t("admin.classes.table.option", {
										defaultValue: "Option",
									})}
								</TableHead>
								<TableHead>{t("admin.classes.table.students")}</TableHead>
								<TableHead>{t("common.table.actions")}</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{classes?.map((cls) => (
								<TableRow key={cls.id}>
									<TableCell className="font-medium">{cls.name}</TableCell>
									<TableCell>{cls.program?.name}</TableCell>
									<TableCell>{cls.academicYear?.name}</TableCell>
									<TableCell>
										{cls.cycle ? (
											<div className="space-y-0.5">
												<p className="font-medium text-sm">{cls.cycle.name}</p>
												<p className="text-muted-foreground text-xs">
													{cls.cycleLevel?.name}
													{cls.cycleLevel?.code ? ` (${cls.cycleLevel.code})` : ""}
												</p>
											</div>
										) : (
											t("common.labels.notAvailable", { defaultValue: "N/A" })
										)}
										</TableCell>
									<TableCell>
										{cls.programOption ? (
											<div className="space-y-0.5">
												<p className="font-medium text-sm">
													{cls.programOption.name}
												</p>
												<p className="text-muted-foreground text-xs">
													{cls.programOption.code}
												</p>
											</div>
										) : (
											t("common.labels.notAvailable", {
												defaultValue: "N/A",
											})
										)}
									</TableCell>
									<TableCell>
										<div className="flex items-center gap-2">
											<Users className="h-4 w-4" />
											<span>{cls.students?.length || 0}</span>
										</div>
									</TableCell>
									<TableCell>
										<div className="flex gap-2">
											<Button
												type="button"
												size="icon"
												variant="ghost"
												onClick={() => {
													setEditingClass(cls);
													form.reset({
														name: cls.name,
														programId: cls.programId,
														academicYearId: cls.academicYearId,
														cycleLevelId: cls.cycleLevelId,
														programOptionId: cls.programOptionId,
													});
													setIsFormOpen(true);
												}}
												className="btn btn-square btn-sm btn-ghost"
											>
												<Pencil className="h-4 w-4" />
											</Button>
											<Button
												type="button"
												size="icon"
												variant="ghost"
												onClick={() => openDeleteModal(cls.id)}
												className="btn btn-square btn-sm btn-ghost text-error"
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</Card>

			<FormModal
				isOpen={isFormOpen}
				onClose={() => {
					setIsFormOpen(false);
					setEditingClass(null);
					form.reset();
				}}
				title={
					editingClass
						? t("admin.classes.form.editTitle")
						: t("admin.classes.form.createTitle")
				}
			>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="programId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("admin.classes.form.programLabel")}</FormLabel>
									<Select onValueChange={field.onChange} value={field.value}>
										<FormControl>
											<SelectTrigger>
												<SelectValue
													placeholder={t(
														"admin.classes.form.programPlaceholder",
													)}
												/>
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{programs?.map((program) => (
												<SelectItem key={program.id} value={program.id}>
													<div className="flex flex-col">
														<span>{program.name}</span>
														{program.facultyInfo?.name && (
															<span className="text-muted-foreground text-xs">
																{program.facultyInfo.name}
															</span>
														)}
													</div>
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									{selectedCycleLevel && (
										<p className="text-muted-foreground text-xs">
											{t("admin.classes.form.cycleSummary", {
												defaultValue: "Cycle: {{value}}",
												value: `${selectedCycleLevel.cycle.name}${selectedCycleLevel.cycle.code ? ` (${selectedCycleLevel.cycle.code})` : ""}`,
											})}
										</p>
									)}
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="academicYearId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t("admin.classes.form.academicYearLabel")}
									</FormLabel>
									<Select onValueChange={field.onChange} value={field.value}>
										<FormControl>
											<SelectTrigger>
												<SelectValue
													placeholder={t(
														"admin.classes.form.academicYearPlaceholder",
													)}
												/>
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{academicYears?.map((year) => (
												<SelectItem key={year.id} value={year.id}>
													{year.name}
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
							name="cycleLevelId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t("admin.classes.form.cycleLevelLabel", {
											defaultValue: "Cycle level",
										})}
									</FormLabel>
									<Select
										onValueChange={field.onChange}
										value={field.value}
										disabled={!selectedProgram || cycleLevels.length === 0}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue
													placeholder={t(
														"admin.classes.form.cycleLevelPlaceholder",
														{ defaultValue: "Select cycle level" },
													)}
												/>
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{cycleLevels.map((level) => (
												<SelectItem key={level.id} value={level.id}>
													{`${level.cycle.name}${level.cycle.code ? ` (${level.cycle.code})` : ""} • ${level.name}${level.code ? ` (${level.code})` : ""}`}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									{!selectedProgram && (
										<p className="text-muted-foreground text-xs">
											{t("admin.classes.form.selectProgramFirst", {
												defaultValue: "Select a program to load its cycle levels.",
											})}
										</p>
									)}
									{selectedProgram && cycleLevels.length === 0 && (
										<p className="text-muted-foreground text-xs">
											{t("admin.classes.form.emptyCycleLevels", {
												defaultValue:
													"No cycle levels available for the selected faculty.",
											})}
										</p>
									)}
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="programOptionId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t("admin.classes.form.programOptionLabel", {
											defaultValue: "Program option",
										})}
									</FormLabel>
									<Select
										onValueChange={field.onChange}
										value={field.value}
										disabled={
											!selectedProgram || programOptions.length === 0
										}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue
													placeholder={t(
														"admin.classes.form.programOptionPlaceholder",
														{ defaultValue: "Select option" },
													)}
												/>
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{programOptions.map((option) => (
												<SelectItem key={option.id} value={option.id}>
													{option.name} ({option.code})
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									{!selectedProgram && (
										<p className="text-muted-foreground text-xs">
											{t("admin.classes.form.selectProgramFirst", {
												defaultValue:
													"Select a program to load its cycle levels.",
											})}
										</p>
									)}
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("admin.classes.form.labelLabel")}</FormLabel>
									<FormControl>
										<Input {...field} readOnly />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<DialogFooter className="gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => {
									setIsFormOpen(false);
									setEditingClass(null);
									form.reset();
								}}
							>
								{t("common.actions.cancel")}
							</Button>
							<Button type="submit" disabled={form.formState.isSubmitting}>
								{form.formState.isSubmitting ? (
									<Spinner className="mr-2 h-4 w-4" />
								) : editingClass ? (
									t("common.actions.saveChanges")
								) : (
									t("admin.classes.form.createSubmit")
								)}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</FormModal>

			<ConfirmModal
				isOpen={isDeleteOpen}
				onClose={() => {
					setIsDeleteOpen(false);
					setDeleteId(null);
				}}
				onConfirm={handleDelete}
				title={t("admin.classes.delete.title")}
				message={t("admin.classes.delete.message")}
				confirmText={t("common.actions.delete")}
				isLoading={deleteMutation.isPending}
			/>
		</div>
	);
}
