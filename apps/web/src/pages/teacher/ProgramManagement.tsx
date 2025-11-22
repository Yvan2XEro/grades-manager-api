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
import {
	Dialog,
	DialogContent,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { trpcClient } from "@/utils/trpc";

const buildProgramSchema = (t: TFunction) =>
	z.object({
		name: z.string().min(2, t("admin.programs.validation.name")),
		description: z.string().optional(),
		faculty: z.string({
			required_error: t("admin.programs.validation.faculty"),
		}),
	});

type ProgramFormData = z.infer<ReturnType<typeof buildProgramSchema>>;

interface Program {
	id: string;
	name: string;
	description: string | null;
	faculty_id: string;
	faculty: { name: string };
}

interface Faculty {
	id: string;
	name: string;
}

export default function ProgramManagement() {
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const [editingProgram, setEditingProgram] = useState<Program | null>(null);
	const [deleteId, setDeleteId] = useState<string | null>(null);

	const queryClient = useQueryClient();
	const { t } = useTranslation();
	const programSchema = useMemo(() => buildProgramSchema(t), [t]);

	const { data: programs, isLoading } = useQuery({
		queryKey: ["programs"],
		queryFn: async () => {
			const [programRes, facultyRes] = await Promise.all([
				trpcClient.programs.list.query({}),
				trpcClient.faculties.list.query({}),
			]);
			const facultyMap = new Map(facultyRes.items.map((f) => [f.id, f.name]));
			return programRes.items.map((p) => ({
				id: p.id,
				name: p.name,
				description: p.description ?? null,
				faculty_id: p.faculty,
				faculty: { name: facultyMap.get(p.faculty) ?? "" },
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
			description: "",
			faculty: "",
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

	const startCreate = () => {
		setEditingProgram(null);
		form.reset({ name: "", description: "", faculty: "" });
		setIsFormOpen(true);
	};

	const startEdit = (program: Program) => {
		setEditingProgram(program);
		form.reset({
			name: program.name,
			description: program.description ?? "",
			faculty: program.faculty_id,
		});
		setIsFormOpen(true);
	};

	const handleCloseForm = () => {
		setIsFormOpen(false);
		setEditingProgram(null);
		form.reset({ name: "", description: "", faculty: "" });
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
					<h1 className="text-2xl font-semibold">
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
									<TableHead>{t("admin.programs.table.name")}</TableHead>
									<TableHead>{t("admin.programs.table.faculty")}</TableHead>
									<TableHead>
										{t("admin.programs.table.description")}
									</TableHead>
									<TableHead className="text-right">
										{t("common.table.actions")}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{programs.map((program) => (
									<TableRow key={program.id}>
										<TableCell className="font-medium">{program.name}</TableCell>
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
												placeholder={t(
													"admin.programs.form.namePlaceholder",
												)}
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
										<FormLabel>{t("admin.programs.form.facultyLabel")}</FormLabel>
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
