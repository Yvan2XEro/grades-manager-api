import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { Pencil, Plus, School, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
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
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { ClipboardCopy } from "@/components/ui/clipboard-copy";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
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
import { Spinner } from "@/components/ui/spinner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { RouterOutputs } from "@/utils/trpc";
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
		description: z.string().optional(),
		faculty: z.string({
			required_error: t("admin.programs.validation.faculty"),
		}),
	});

type ProgramFormData = z.infer<ReturnType<typeof buildProgramSchema>>;
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
	description: string | null;
	faculty_id: string;
	faculty: { name: string };
};

type Faculty = {
	id: string;
	name: string;
};

type ProgramOption = RouterOutputs["programOptions"]["list"]["items"][number];

export default function ProgramManagement() {
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const [editingProgram, setEditingProgram] = useState<Program | null>(null);
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const [optionProgram, setOptionProgram] = useState<Program | null>(null);
	const [editingOption, setEditingOption] = useState<ProgramOption | null>(
		null,
	);
	const [isOptionModalOpen, setIsOptionModalOpen] = useState(false);

	const queryClient = useQueryClient();
	const { t } = useTranslation();
	const programSchema = useMemo(() => buildProgramSchema(t), [t]);

	const { data: programs, isLoading } = useQuery({
		queryKey: ["programs"],
		queryFn: async () => {
			const programRes = await trpcClient.programs.list.query({});
			return programRes.items.map((p) => ({
				id: p.id,
				code: p.code,
				name: p.name,
				description: p.description ?? null,
				faculty_id: p.faculty,
				faculty: { name: p.facultyInfo?.name ?? "" },
			})) as Program[];
		},
	});

	const { data: faculties } = useQuery({
		queryKey: ["faculties"],
		queryFn: async () => {
			const { items } = await trpcClient.faculties.list.query({});
			return items as Faculty[];
		},
	});

	const form = useForm<ProgramFormData>({
		resolver: zodResolver(programSchema),
		defaultValues: {
			name: "",
			code: "",
			description: "",
			faculty: "",
		},
	});

	const selectedFacultyId = form.watch("faculty");

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

	const createMutation = useMutation({
		mutationFn: async (data: ProgramFormData) => {
			await trpcClient.programs.create.mutate(data);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["programs"] });
			toast.success(t("admin.programs.toast.createSuccess"));
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
			const { id, ...updateData } = data;
			await trpcClient.programs.update.mutate({ id, ...updateData });
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

	const startCreate = () => {
		setEditingProgram(null);
		form.reset({ name: "", code: "", description: "", faculty: "" });
		setIsFormOpen(true);
	};

	const startEdit = (program: Program) => {
		setEditingProgram(program);
		form.reset({
			name: program.name,
			code: program.code,
			description: program.description ?? "",
			faculty: program.faculty_id,
		});
		setIsFormOpen(true);
	};

	const handleCloseForm = () => {
		setIsFormOpen(false);
		setEditingProgram(null);
		form.reset({ name: "", code: "", description: "", faculty: "" });
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

	if (isLoading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<Spinner className="h-8 w-8" />
			</div>
		);
	}

	return (
		<div className="space-y-6 p-6">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div>
					<h1 className="font-semibold text-2xl">
						{t("admin.programs.title")}
					</h1>
					<p className="text-muted-foreground">
						{t("admin.programs.subtitle")}
					</p>
				</div>
				<Button onClick={startCreate}>
					<Plus className="mr-2 h-4 w-4" />
					{t("admin.programs.actions.add")}
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>{t("admin.programs.title")}</CardTitle>
					<CardDescription>{t("admin.programs.subtitle")}</CardDescription>
				</CardHeader>
				<CardContent>
					{programs && programs.length > 0 ? (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>
										{t("admin.programs.table.code", { defaultValue: "Code" })}
									</TableHead>
									<TableHead>{t("admin.programs.table.name")}</TableHead>
									<TableHead>{t("admin.programs.table.faculty")}</TableHead>
									<TableHead>{t("admin.programs.table.description")}</TableHead>
									<TableHead className="text-right">
										{t("common.table.actions")}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{programs.map((program) => (
									<TableRow key={program.id}>
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
										<TableCell>{program.faculty?.name}</TableCell>
										<TableCell>
											{program.description || (
												<span className="text-muted-foreground italic">
													{t("admin.programs.table.noDescription")}
												</span>
											)}
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
						<div className="py-12 text-center">
							<School className="mx-auto h-12 w-12 text-muted-foreground" />
							<p className="mt-4 font-medium">
								{t("admin.programs.empty.title")}
							</p>
							<p className="text-muted-foreground text-sm">
								{t("admin.programs.empty.description")}
							</p>
							<Button className="mt-4" onClick={startCreate}>
								<Plus className="mr-2 h-4 w-4" />
								{t("admin.programs.actions.add")}
							</Button>
						</div>
					)}
				</CardContent>
			</Card>

			<Dialog
				open={isFormOpen}
				onOpenChange={(open) => {
					setIsFormOpen(open);
					if (!open) handleCloseForm();
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{editingProgram
								? t("admin.programs.form.editTitle")
								: t("admin.programs.form.createTitle")}
						</DialogTitle>
					</DialogHeader>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("admin.programs.form.nameLabel")}</FormLabel>
										<FormControl>
											<Input
												placeholder={t("admin.programs.form.namePlaceholder")}
												{...field}
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
										<FormLabel>
											{t("admin.programs.form.codeLabel", {
												defaultValue: "Code",
											})}
										</FormLabel>
										<FormControl>
											<Input
												placeholder={t("admin.programs.form.codePlaceholder", {
													defaultValue: "INF-LIC",
												})}
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="faculty"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("admin.programs.form.facultyLabel")}
										</FormLabel>
										<Select
											onValueChange={field.onChange}
											value={field.value || undefined}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue
														placeholder={t(
															"admin.programs.form.facultyPlaceholder",
														)}
													/>
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{faculties?.map((faculty) => (
													<SelectItem key={faculty.id} value={faculty.id}>
														{faculty.name}
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
									) : (
										t("admin.programs.form.submit")
									)}
								</Button>
							</div>
						</form>
					</Form>
				</DialogContent>
			</Dialog>

			<Dialog
				open={isOptionModalOpen}
				onOpenChange={(open) => {
					if (!open) {
						closeOptionsModal();
					} else {
						setIsOptionModalOpen(true);
					}
				}}
			>
				<DialogContent className="max-w-xl">
					<DialogHeader>
						<DialogTitle>
							{t("admin.programs.options.title", {
								defaultValue: "Manage options for {{value}}",
								value: optionProgram?.name ?? "",
							})}
						</DialogTitle>
						<DialogDescription>
							{t("admin.programs.options.subtitle", {
								defaultValue:
									"Options represent specializations or tracks within a program.",
							})}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							{optionsLoading ? (
								<div className="flex justify-center py-6">
									<Spinner className="h-6 w-6" />
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
								<p className="text-muted-foreground text-sm">
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
								<FormField
									control={optionForm.control}
									name="name"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
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
											<FormLabel>
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
				</DialogContent>
			</Dialog>

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
		</div>
	);
}
