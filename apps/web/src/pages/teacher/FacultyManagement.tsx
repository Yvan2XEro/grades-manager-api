import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { Building2, Pencil, Plus, Trash2 } from "lucide-react";
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
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { trpcClient } from "@/utils/trpc";

const buildFacultySchema = (t: TFunction) =>
	z.object({
		name: z.string().min(2, t("admin.faculties.validation.name")),
		description: z.string().optional(),
	});

type FacultyFormData = z.infer<ReturnType<typeof buildFacultySchema>>;

interface Faculty {
	id: string;
	name: string;
	description: string | null;
}

export default function FacultyManagement() {
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);
	const [deleteId, setDeleteId] = useState<string | null>(null);

	const queryClient = useQueryClient();
	const { t } = useTranslation();
	const facultySchema = useMemo(() => buildFacultySchema(t), [t]);

	const { data: faculties, isLoading } = useQuery({
		queryKey: ["faculties"],
		queryFn: async () => {
			const { items } = await trpcClient.faculties.list.query({});
			return items as Faculty[];
		},
	});

	const form = useForm<FacultyFormData>({
		resolver: zodResolver(facultySchema),
		defaultValues: {
			name: "",
			description: "",
		},
	});

	const createMutation = useMutation({
		mutationFn: async (data: FacultyFormData) => {
			await trpcClient.faculties.create.mutate(data);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["faculties"] });
			toast.success(t("admin.faculties.toast.createSuccess"));
			handleCloseForm();
		},
		onError: (error: any) => {
			toast.error(error.message || t("admin.faculties.toast.createError"));
		},
	});

	const updateMutation = useMutation({
		mutationFn: async (data: FacultyFormData & { id: string }) => {
			const { id, ...updateData } = data;
			await trpcClient.faculties.update.mutate({ id, ...updateData });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["faculties"] });
			toast.success(t("admin.faculties.toast.updateSuccess"));
			handleCloseForm();
		},
		onError: (error: any) => {
			toast.error(error.message || t("admin.faculties.toast.updateError"));
		},
	});

	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			await trpcClient.faculties.delete.mutate({ id });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["faculties"] });
			toast.success(t("admin.faculties.toast.deleteSuccess"));
			setIsDeleteOpen(false);
			setDeleteId(null);
		},
		onError: (error: any) => {
			toast.error(error.message || t("admin.faculties.toast.deleteError"));
		},
	});

	const onSubmit = (data: FacultyFormData) => {
		if (editingFaculty) {
			updateMutation.mutate({ ...data, id: editingFaculty.id });
		} else {
			createMutation.mutate(data);
		}
	};

	const startCreate = () => {
		setEditingFaculty(null);
		form.reset({ name: "", description: "" });
		setIsFormOpen(true);
	};

	const startEdit = (faculty: Faculty) => {
		setEditingFaculty(faculty);
		form.reset({
			name: faculty.name,
			description: faculty.description ?? "",
		});
		setIsFormOpen(true);
	};

	const handleCloseForm = () => {
		setIsFormOpen(false);
		setEditingFaculty(null);
		form.reset({
			name: "",
			description: "",
		});
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
						{t("admin.faculties.title")}
					</h1>
					<p className="text-muted-foreground">
						{t("admin.faculties.subtitle")}
					</p>
				</div>
				<Button onClick={startCreate}>
					<Plus className="mr-2 h-4 w-4" />
					{t("admin.faculties.actions.add")}
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>{t("admin.faculties.title")}</CardTitle>
					<CardDescription>{t("admin.faculties.subtitle")}</CardDescription>
				</CardHeader>
				<CardContent>
					{faculties && faculties.length > 0 ? (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{t("admin.faculties.table.name")}</TableHead>
									<TableHead>
										{t("admin.faculties.table.description")}
									</TableHead>
									<TableHead className="text-right">
										{t("common.table.actions")}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{faculties.map((faculty) => (
									<TableRow key={faculty.id}>
										<TableCell className="font-medium">{faculty.name}</TableCell>
										<TableCell>
											{faculty.description || (
												<span className="text-muted-foreground italic">
													{t("admin.faculties.table.noDescription")}
												</span>
											)}
										</TableCell>
										<TableCell>
											<div className="flex justify-end gap-2">
												<Button
													variant="ghost"
													size="icon-sm"
													onClick={() => startEdit(faculty)}
													aria-label={t("admin.faculties.form.editTitle")}
												>
													<Pencil className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon-sm"
													className="text-destructive hover:text-destructive"
													onClick={() => confirmDelete(faculty.id)}
													aria-label={t("admin.faculties.delete.title")}
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
							<Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
							<p className="mt-4 font-medium">
								{t("admin.faculties.empty.title")}
							</p>
							<p className="text-muted-foreground text-sm">
								{t("admin.faculties.empty.description")}
							</p>
							<Button className="mt-4" onClick={startCreate}>
								<Plus className="mr-2 h-4 w-4" />
								{t("admin.faculties.actions.add")}
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
							{editingFaculty
								? t("admin.faculties.form.editTitle")
								: t("admin.faculties.form.createTitle")}
						</DialogTitle>
					</DialogHeader>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("admin.faculties.form.nameLabel")}</FormLabel>
										<FormControl>
											<Input
												placeholder={t(
													"admin.faculties.form.namePlaceholder",
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
								name="description"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("admin.faculties.form.descriptionLabel")}
										</FormLabel>
										<FormControl>
											<Textarea
												rows={4}
												placeholder={t(
													"admin.faculties.form.descriptionPlaceholder",
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
									) : editingFaculty ? (
										t("common.actions.saveChanges")
									) : (
										t("admin.faculties.form.submit")
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
							{t("admin.faculties.delete.title")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("admin.faculties.delete.message")}
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
