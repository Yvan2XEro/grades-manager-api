import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { z } from "zod";
import ConfirmModal from "../../components/modals/ConfirmModal";
import FormModal from "../../components/modals/FormModal";
import { BulkActionBar } from "../../components/ui/bulk-action-bar";
import { Button } from "../../components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../components/ui/card";
import { Checkbox } from "../../components/ui/checkbox";
import { DialogFooter } from "../../components/ui/dialog";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "../../components/ui/empty";
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
import {
	ContextMenuItem,
	ContextMenuSeparator,
} from "../../components/ui/context-menu";
import { Spinner } from "../../components/ui/spinner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "../../components/ui/table";
import { TableSkeleton } from "../../components/ui/table-skeleton";
import { Textarea } from "../../components/ui/textarea";
import { useRowSelection } from "../../hooks/useRowSelection";
import { trpc, trpcClient } from "../../utils/trpc";

const NO_SELECTION = "__NONE__";

const institutionSchema = z.object({
	code: z.string().min(1),
	type: z.enum(["university", "institution", "faculty"]),
	shortName: z.string().optional(),
	nameFr: z.string().min(1),
	nameEn: z.string().min(1),
	legalNameFr: z.string().optional(),
	legalNameEn: z.string().optional(),
	sloganFr: z.string().optional(),
	sloganEn: z.string().optional(),
	descriptionFr: z.string().optional(),
	descriptionEn: z.string().optional(),
	addressFr: z.string().optional(),
	addressEn: z.string().optional(),
	contactEmail: z.string().email().optional().or(z.literal("")),
	contactPhone: z.string().optional(),
	fax: z.string().optional(),
	postalBox: z.string().optional(),
	website: z.string().url().optional().or(z.literal("")),
	logoUrl: z.string().url().optional().or(z.literal("")),
	coverImageUrl: z.string().url().optional().or(z.literal("")),
	parentInstitutionId: z.string().optional(),
	institutionId: z.string().optional(),
	defaultAcademicYearId: z.string().optional(),
	registrationFormatId: z.string().optional(),
	timezone: z.string().optional(),
});

type FormValues = z.infer<typeof institutionSchema>;

const defaultValues: FormValues = {
	code: "",
	type: "faculty",
	shortName: "",
	nameFr: "",
	nameEn: "",
	legalNameFr: "",
	legalNameEn: "",
	sloganFr: "",
	sloganEn: "",
	descriptionFr: "",
	descriptionEn: "",
	addressFr: "",
	addressEn: "",
	contactEmail: "",
	contactPhone: "",
	fax: "",
	postalBox: "",
	website: "",
	logoUrl: "",
	coverImageUrl: "",
	parentInstitutionId: undefined,
	institutionId: undefined,
	defaultAcademicYearId: undefined,
	registrationFormatId: undefined,
	timezone: "UTC",
};

type Institution = {
	id: string;
	code: string;
	nameFr: string;
	nameEn: string;
	shortName: string | null;
	type: string;
	legalNameFr: string | null;
	legalNameEn: string | null;
	sloganFr: string | null;
	sloganEn: string | null;
	descriptionFr: string | null;
	descriptionEn: string | null;
	addressFr: string | null;
	addressEn: string | null;
	contactEmail: string | null;
	contactPhone: string | null;
	fax: string | null;
	postalBox: string | null;
	website: string | null;
	logoUrl: string | null;
	coverImageUrl: string | null;
	parentInstitutionId: string | null;
	institutionId: string | null;
	defaultAcademicYearId: string | null;
	registrationFormatId: string | null;
	timezone: string | null;
};

export default function FacultyManagement() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingInstitution, setEditingInstitution] =
		useState<Institution | null>(null);
	const [deleteId, setDeleteId] = useState<string | null>(null);

	const form = useForm<FormValues>({
		resolver: zodResolver(institutionSchema),
		defaultValues,
	});

	const { data: allInstitutions, isLoading } = useQuery(
		trpc.institutions.list.queryOptions(),
	);

	const { data: academicYears } = useQuery(
		trpc.academicYears.list.queryOptions({ limit: 100 }),
	);

	const { data: registrationFormats } = useQuery(
		trpc.registrationNumbers.list.queryOptions({ includeInactive: true }),
	);

	const institutions = useMemo(
		() => (allInstitutions ?? []) as Institution[],
		[allInstitutions],
	);

	const selection = useRowSelection(institutions);

	const resetForm = () => form.reset(defaultValues);

	const watchedParentId = form.watch("parentInstitutionId");

	useEffect(() => {
		if (!watchedParentId) return;
		const parent = institutions.find((i) => i.id === watchedParentId);
		if (!parent) return;

		// Fields to inherit from the parent (only contact / location / config)
		const inherited: Partial<FormValues> = {
			addressFr: parent.addressFr ?? "",
			addressEn: parent.addressEn ?? "",
			contactEmail: parent.contactEmail ?? "",
			contactPhone: parent.contactPhone ?? "",
			fax: parent.fax ?? "",
			postalBox: parent.postalBox ?? "",
			website: parent.website ?? "",
			timezone: parent.timezone ?? "UTC",
			defaultAcademicYearId: parent.defaultAcademicYearId ?? undefined,
			registrationFormatId: parent.registrationFormatId ?? undefined,
		};

		for (const [key, value] of Object.entries(inherited)) {
			form.setValue(key as keyof FormValues, value as never, {
				shouldDirty: true,
			});
		}
	}, [watchedParentId, institutions, form]);

	const handleOpenCreate = () => {
		setEditingInstitution(null);
		resetForm();
		setIsModalOpen(true);
	};

	const handleOpenEdit = (inst: Institution) => {
		setEditingInstitution(inst);
		form.reset({
			code: inst.code,
			type: inst.type as "university" | "institution" | "faculty",
			shortName: inst.shortName ?? "",
			nameFr: inst.nameFr,
			nameEn: inst.nameEn,
			legalNameFr: inst.legalNameFr ?? "",
			legalNameEn: inst.legalNameEn ?? "",
			sloganFr: inst.sloganFr ?? "",
			sloganEn: inst.sloganEn ?? "",
			descriptionFr: inst.descriptionFr ?? "",
			descriptionEn: inst.descriptionEn ?? "",
			addressFr: inst.addressFr ?? "",
			addressEn: inst.addressEn ?? "",
			contactEmail: inst.contactEmail ?? "",
			contactPhone: inst.contactPhone ?? "",
			fax: inst.fax ?? "",
			postalBox: inst.postalBox ?? "",
			website: inst.website ?? "",
			logoUrl: inst.logoUrl ?? "",
			coverImageUrl: inst.coverImageUrl ?? "",
			parentInstitutionId: inst.parentInstitutionId ?? undefined,
			institutionId: inst.institutionId ?? undefined,
			defaultAcademicYearId: inst.defaultAcademicYearId ?? undefined,
			registrationFormatId: inst.registrationFormatId ?? undefined,
			timezone: inst.timezone ?? "UTC",
		});
		setIsModalOpen(true);
	};

	const handleCloseModal = () => {
		setIsModalOpen(false);
		setEditingInstitution(null);
		resetForm();
	};

	const invalidate = () =>
		queryClient.invalidateQueries({
			queryKey: trpc.institutions.list.queryKey(),
		});

	const createMutation = useMutation({
		mutationFn: (values: FormValues) =>
			trpcClient.institutions.create.mutate({
				...values,
				contactEmail: values.contactEmail || undefined,
				website: values.website || undefined,
				logoUrl: values.logoUrl || undefined,
				coverImageUrl: values.coverImageUrl || undefined,
				parentInstitutionId: values.parentInstitutionId || undefined,
				institutionId: values.institutionId || undefined,
				defaultAcademicYearId: values.defaultAcademicYearId || undefined,
				registrationFormatId: values.registrationFormatId || undefined,
			}),
		onSuccess: () => {
			toast.success(
				t("admin.institutions.toast.createSuccess", {
					defaultValue: "Institution created",
				}),
			);
			invalidate();
			handleCloseModal();
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const updateMutation = useMutation({
		mutationFn: ({ id, values }: { id: string; values: FormValues }) =>
			trpcClient.institutions.update.mutate({
				id,
				data: {
					...values,
					contactEmail: values.contactEmail || undefined,
					website: values.website || undefined,
					logoUrl: values.logoUrl || undefined,
					coverImageUrl: values.coverImageUrl || undefined,
					parentInstitutionId: values.parentInstitutionId || undefined,
				institutionId: values.institutionId || undefined,
					defaultAcademicYearId: values.defaultAcademicYearId || undefined,
					registrationFormatId: values.registrationFormatId || undefined,
				},
			}),
		onSuccess: () => {
			toast.success(
				t("admin.institutions.toast.updateSuccess", {
					defaultValue: "Institution updated",
				}),
			);
			invalidate();
			handleCloseModal();
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) =>
			trpcClient.institutions.delete.mutate({ id }),
		onSuccess: () => {
			toast.success(
				t("admin.institutions.toast.deleteSuccess", {
					defaultValue: "Institution deleted",
				}),
			);
			invalidate();
			setDeleteId(null);
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const bulkDeleteMutation = useMutation({
		mutationFn: (ids: string[]) =>
			Promise.all(ids.map((id) => trpcClient.institutions.delete.mutate({ id }))),
		onSuccess: () => {
			invalidate();
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

	const isSaving = createMutation.isPending || updateMutation.isPending;

	const onSubmit = (values: FormValues) => {
		if (editingInstitution) {
			updateMutation.mutate({ id: editingInstitution.id, values });
		} else {
			createMutation.mutate(values);
		}
	};

	const typeLabel = (type: string) => {
		switch (type) {
			case "university":
				return t("admin.institution.form.typeUniversity", {
					defaultValue: "University",
				});
			case "faculty":
				return t("admin.institution.form.typeFaculty", {
					defaultValue: "Faculty/School",
				});
			case "institution":
				return t("admin.institution.form.typeInstitution", {
					defaultValue: "Institution",
				});
			default:
				return type;
		}
	};

	const years = academicYears?.items ?? [];
	const formats = registrationFormats ?? [];

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-3">
					<div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/8">
						<Building2 className="h-4 w-4 text-primary" />
					</div>
					<div>
						<h1 className="text-foreground">
							{t("admin.institutions.title", { defaultValue: "Institutions" })}
						</h1>
						<p className="text-muted-foreground text-xs mt-0.5">
							{t("admin.institutions.subtitle", {
								defaultValue:
									"Manage universities, faculties and schools.",
							})}
						</p>
					</div>
				</div>
				<Button onClick={handleOpenCreate}>
					<Plus className="mr-2 h-4 w-4" />
					{t("admin.institutions.actions.add", {
						defaultValue: "Add institution",
					})}
				</Button>
			</div>

			<Card>
				<CardContent>
					{isLoading ? (
						<div className="flex items-center justify-center py-8">
							<Spinner />
						</div>
					) : institutions.length > 0 ? (
						<>
							<BulkActionBar
								selectedCount={selection.selectedCount}
								onClear={selection.clear}
							>
								<Button
									variant="destructive"
									size="sm"
									onClick={() => {
										if (
											window.confirm(
												t("common.bulkActions.confirmDelete", {
													defaultValue:
														"Are you sure you want to delete the selected items?",
												}),
											)
										) {
											bulkDeleteMutation.mutate([...selection.selectedIds]);
										}
									}}
									disabled={bulkDeleteMutation.isPending}
								>
									<Trash2 className="mr-1.5 h-3.5 w-3.5" />
									{t("common.actions.delete")}
								</Button>
							</BulkActionBar>
							{isLoading ? (
								<TableSkeleton columns={6} rows={8} />
							) : (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="w-10">
												<Checkbox
													checked={selection.isAllSelected}
													onCheckedChange={(checked) =>
														selection.toggleAll(!!checked)
													}
													aria-label="Select all"
												/>
											</TableHead>
											<TableHead className="w-24">
												{t("admin.institutions.table.code", {
													defaultValue: "Code",
												})}
											</TableHead>
											<TableHead className="w-28">
												{t("admin.institutions.table.type", {
													defaultValue: "Type",
												})}
											</TableHead>
											<TableHead>
												{t("admin.institutions.table.nameFr", {
													defaultValue: "Name (FR)",
												})}
											</TableHead>
											<TableHead>
												{t("admin.institutions.table.nameEn", {
													defaultValue: "Name (EN)",
												})}
											</TableHead>
											<TableHead className="w-28">
												{t("admin.institutions.table.shortName", {
													defaultValue: "Short name",
												})}
											</TableHead>
											<TableHead className="w-[100px] text-right">
												{t("common.table.actions")}
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{institutions.map((inst) => (
											<TableRow
												key={inst.id}
												actions={
													<>
														<ContextMenuItem
															onSelect={() => handleOpenEdit(inst)}
														>
															<Pencil className="h-4 w-4" />
															{t("common.actions.edit", {
																defaultValue: "Edit",
															})}
														</ContextMenuItem>
														<ContextMenuSeparator />
														<ContextMenuItem
															variant="destructive"
															onSelect={() => setDeleteId(inst.id)}
														>
															<Trash2 className="h-4 w-4" />
															{t("common.actions.delete")}
														</ContextMenuItem>
													</>
												}
											>
												<TableCell>
													<Checkbox
														checked={selection.isSelected(inst.id)}
														onCheckedChange={() => selection.toggle(inst.id)}
														aria-label={`Select ${inst.nameFr}`}
													/>
												</TableCell>
												<TableCell>
													<span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 font-mono text-xs">
														{inst.code}
													</span>
												</TableCell>
												<TableCell>
													<span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs">
														{typeLabel(inst.type)}
													</span>
												</TableCell>
												<TableCell className="font-medium">
													{inst.nameFr}
												</TableCell>
												<TableCell>{inst.nameEn}</TableCell>
												<TableCell>{inst.shortName || "\u2014"}</TableCell>
												<TableCell className="flex items-center justify-end gap-2">
													<Button
														variant="ghost"
														size="icon"
														onClick={() => handleOpenEdit(inst)}
													>
														<Pencil className="h-4 w-4" />
													</Button>
													<Button
														variant="ghost"
														size="icon"
														onClick={() => setDeleteId(inst.id)}
													>
														<Trash2 className="h-4 w-4 text-destructive" />
													</Button>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							)}
						</>
					) : (
						<Empty>
							<EmptyHeader>
								<Building2 className="mx-auto h-10 w-10 text-muted-foreground/50" />
								<EmptyTitle>
									{t("admin.institutions.empty.title", {
										defaultValue: "No institutions yet",
									})}
								</EmptyTitle>
								<EmptyDescription>
									{t("admin.institutions.empty.description", {
										defaultValue:
											"Create your first institution to start organizing your academic structure.",
									})}
								</EmptyDescription>
							</EmptyHeader>
							<EmptyContent>
								<Button onClick={handleOpenCreate} variant="outline">
									<Plus className="mr-2 h-4 w-4" />
									{t("admin.institutions.actions.add", {
										defaultValue: "Add institution",
									})}
								</Button>
							</EmptyContent>
						</Empty>
					)}
				</CardContent>
			</Card>

			<FormModal
				isOpen={isModalOpen}
				onClose={handleCloseModal}
				maxWidth="sm:max-w-5xl"
				contentClassName="max-h-[calc(90vh-8rem)]"
				title={
					editingInstitution
						? t("admin.institutions.form.editTitle", {
								defaultValue: "Edit institution",
							})
						: t("admin.institutions.form.createTitle", {
								defaultValue: "Create institution",
							})
				}
			>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-2">
						{/* Identity */}
						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-sm">
									{t("admin.institution.form.identity", {
										defaultValue: "Identity",
									})}
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid gap-4 sm:grid-cols-3">
									<FormField
										control={form.control}
										name="code"
										render={({ field }) => (
											<FormItem>
												<FormLabel required>
													{t("admin.institution.form.code", {
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
										control={form.control}
										name="shortName"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("admin.institution.form.shortName", {
														defaultValue: "Short name",
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
										control={form.control}
										name="type"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("admin.institution.form.type", {
														defaultValue: "Type",
													})}
												</FormLabel>
												<Select
													value={field.value}
													onValueChange={field.onChange}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														<SelectItem value="university">
															{t("admin.institution.form.typeUniversity", {
																defaultValue: "University",
															})}
														</SelectItem>
														<SelectItem value="faculty">
															{t("admin.institution.form.typeFaculty", {
																defaultValue: "Faculty/School",
															})}
														</SelectItem>
														<SelectItem value="institution">
															{t("admin.institution.form.typeInstitution", {
																defaultValue: "Institution/Institute",
															})}
														</SelectItem>
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
																<div className="grid gap-4 md:grid-cols-2">
									<FormField
										control={form.control}
										name="parentInstitutionId"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("admin.institution.form.parentInstitution", {
														defaultValue: "Parent Institution (University)",
													})}
												</FormLabel>
												<Select
													value={field.value ?? NO_SELECTION}
													onValueChange={(value) =>
														field.onChange(value === NO_SELECTION ? undefined : value)
													}
												>
													<FormControl>
														<SelectTrigger><SelectValue /></SelectTrigger>
													</FormControl>
													<SelectContent>
														<SelectItem value={NO_SELECTION}>
															{t("admin.institution.form.noParentInstitution", { defaultValue: "None (Top-level)" })}
														</SelectItem>
														{institutions.filter((inst) => inst.id !== editingInstitution?.id).map((inst) => (
															<SelectItem key={inst.id} value={inst.id}>
																{inst.nameFr} ({typeLabel(inst.type)})
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
										name="institutionId"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("admin.institution.form.supervisingFaculty", {
														defaultValue: "Supervising Faculty/School",
													})}
												</FormLabel>
												<Select
													value={field.value ?? NO_SELECTION}
													onValueChange={(value) =>
														field.onChange(value === NO_SELECTION ? undefined : value)
													}
												>
													<FormControl>
														<SelectTrigger><SelectValue /></SelectTrigger>
													</FormControl>
													<SelectContent>
														<SelectItem value={NO_SELECTION}>
															{t("admin.institution.form.noSupervisingFaculty", { defaultValue: "None" })}
														</SelectItem>
														{institutions.filter((inst) => inst.type === "faculty" && inst.id !== editingInstitution?.id).map((inst) => (
															<SelectItem key={inst.id} value={inst.id}>{inst.nameFr}</SelectItem>
														))}
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							</CardContent>
						</Card>

						{/* Names */}
						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-sm">
									{t("admin.institution.sections.names", {
										defaultValue: "Names & Legal Identity",
									})}
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid gap-4 md:grid-cols-2">
									<FormField
										control={form.control}
										name="nameFr"
										render={({ field }) => (
											<FormItem>
												<FormLabel required>
													{t("admin.institution.form.nameFr", {
														defaultValue: "Name (French)",
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
										control={form.control}
										name="nameEn"
										render={({ field }) => (
											<FormItem>
												<FormLabel required>
													{t("admin.institution.form.nameEn", {
														defaultValue: "Name (English)",
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
								<div className="grid gap-4 md:grid-cols-2">
									<FormField
										control={form.control}
										name="legalNameFr"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("admin.institution.form.legalNameFr", {
														defaultValue: "Legal name (French)",
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
										control={form.control}
										name="legalNameEn"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("admin.institution.form.legalNameEn", {
														defaultValue: "Legal name (English)",
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
								<div className="grid gap-4 md:grid-cols-2">
									<FormField
										control={form.control}
										name="sloganFr"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("admin.institution.form.sloganFr", {
														defaultValue: "Slogan (French)",
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
										control={form.control}
										name="sloganEn"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("admin.institution.form.sloganEn", {
														defaultValue: "Slogan (English)",
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
								<div className="grid gap-4 md:grid-cols-2">
									<FormField
										control={form.control}
										name="descriptionFr"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("admin.institution.form.descriptionFr", {
														defaultValue: "Description (French)",
													})}
												</FormLabel>
												<FormControl>
													<Textarea rows={3} {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="descriptionEn"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("admin.institution.form.descriptionEn", {
														defaultValue: "Description (English)",
													})}
												</FormLabel>
												<FormControl>
													<Textarea rows={3} {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							</CardContent>
						</Card>

						{/* Contact */}
						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-sm">
									{t("admin.institution.sections.contact", {
										defaultValue: "Contact & Location",
									})}
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid gap-4 md:grid-cols-2">
									<FormField
										control={form.control}
										name="addressFr"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("admin.institution.form.addressFr", {
														defaultValue: "Address (French)",
													})}
												</FormLabel>
												<FormControl>
													<Textarea rows={2} {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="addressEn"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("admin.institution.form.addressEn", {
														defaultValue: "Address (English)",
													})}
												</FormLabel>
												<FormControl>
													<Textarea rows={2} {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
								<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
									<FormField
										control={form.control}
										name="contactEmail"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("admin.institution.form.contactEmail", {
														defaultValue: "Email",
													})}
												</FormLabel>
												<FormControl>
													<Input type="email" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="contactPhone"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("admin.institution.form.contactPhone", {
														defaultValue: "Phone",
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
										control={form.control}
										name="fax"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("admin.institution.form.fax", {
														defaultValue: "Fax",
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
								<div className="grid gap-4 sm:grid-cols-3">
									<FormField
										control={form.control}
										name="postalBox"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("admin.institution.form.postalBox", {
														defaultValue: "Postal box",
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
										control={form.control}
										name="website"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("admin.institution.form.website", {
														defaultValue: "Website",
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
										control={form.control}
										name="timezone"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("admin.institution.form.timezone", {
														defaultValue: "Timezone",
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
							</CardContent>
						</Card>

						{/* Media */}
						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-sm">
									{t("admin.institution.sections.media", {
										defaultValue: "Media & Branding",
									})}
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid gap-4 md:grid-cols-2">
									<FormField
										control={form.control}
										name="logoUrl"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("admin.institution.form.logoUrl", {
														defaultValue: "Logo URL",
													})}
												</FormLabel>
												<FormControl>
													<Input
														{...field}
														placeholder="https://..."
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="coverImageUrl"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("admin.institution.form.coverImageUrl", {
														defaultValue: "Cover image URL",
													})}
												</FormLabel>
												<FormControl>
													<Input
														{...field}
														placeholder="https://..."
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							</CardContent>
						</Card>

						{/* System Configuration */}
						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-sm">
									{t("admin.institution.sections.system", {
										defaultValue: "System Configuration",
									})}
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid gap-4 md:grid-cols-2">
									<FormField
										control={form.control}
										name="defaultAcademicYearId"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("admin.institution.form.defaultAcademicYear", {
														defaultValue: "Default academic year",
													})}
												</FormLabel>
												<Select
													value={field.value ?? NO_SELECTION}
													onValueChange={(value) =>
														field.onChange(
															value === NO_SELECTION ? undefined : value,
														)
													}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														<SelectItem value={NO_SELECTION}>
															{t("admin.institution.form.noDefaultYear", {
																defaultValue: "None",
															})}
														</SelectItem>
														{years.map((year) => (
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
										name="registrationFormatId"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{t("admin.institution.form.registrationFormat", {
														defaultValue: "Registration format",
													})}
												</FormLabel>
												<Select
													value={field.value ?? NO_SELECTION}
													onValueChange={(value) =>
														field.onChange(
															value === NO_SELECTION ? undefined : value,
														)
													}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														<SelectItem value={NO_SELECTION}>
															{t("admin.institution.form.noRegistrationFormat", {
																defaultValue: "None",
															})}
														</SelectItem>
														{formats.map((fmt) => (
															<SelectItem key={fmt.id} value={fmt.id}>
																{fmt.name}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							</CardContent>
						</Card>

						<DialogFooter className="gap-2 sm:gap-0">
							<Button variant="ghost" type="button" onClick={handleCloseModal}>
								{t("common.actions.cancel")}
							</Button>
							<Button type="submit" disabled={isSaving}>
								{isSaving
									? t("common.actions.saving")
									: editingInstitution
										? t("common.actions.save")
										: t("admin.institutions.form.submit", {
												defaultValue: "Create",
											})}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</FormModal>

			<ConfirmModal
				isOpen={Boolean(deleteId)}
				onClose={() => setDeleteId(null)}
				onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
				title={t("admin.institutions.delete.title", {
					defaultValue: "Delete institution",
				})}
				message={t("admin.institutions.delete.message", {
					defaultValue:
						"Are you sure you want to delete this institution? This action cannot be undone.",
				})}
				isLoading={deleteMutation.isPending}
			/>
		</div>
	);
}
