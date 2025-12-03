import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import { TeachingUnitCoursesTable } from "@/components/admin/TeachingUnitCoursesTable";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { trpc, trpcClient } from "../../utils/trpc";

type TeachingUnit = {
	id: string;
	name: string;
	code: string;
	description?: string | null;
	credits: number;
	semester: "fall" | "spring" | "annual";
	programId: string;
};

const buildUnitSchema = (
	t: (key: string, options?: Record<string, any>) => string,
) =>
	z.object({
		name: z.string().min(
			2,
			t("admin.teachingUnits.validation.name", {
				defaultValue: "Name is required",
			}),
		),
		code: z.string().min(
			2,
			t("admin.teachingUnits.validation.code", {
				defaultValue: "Code is required",
			}),
		),
		description: z.string().optional(),
		credits: z.number().nonnegative(
			t("admin.teachingUnits.validation.credits", {
				defaultValue: "Credits must be positive",
			}),
		),
		semester: z.enum(["fall", "spring", "annual"]),
		programId: z.string({
			required_error: t("admin.teachingUnits.validation.program", {
				defaultValue: "Select a program",
			}),
		}),
	});

type TeachingUnitFormData = z.infer<ReturnType<typeof buildUnitSchema>>;

const defaultValues: TeachingUnitFormData = {
	name: "",
	code: "",
	description: "",
	credits: 0,
	semester: "annual",
	programId: "",
};

const TeachingUnitDetail = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const params = useParams<{ teachingUnitId: string }>();
	const teachingUnitId = params.teachingUnitId ?? "+";
	const isCreateMode = teachingUnitId === "+";

	const unitSchema = useMemo(() => buildUnitSchema(t), [t]);

	const { data: programs } = useQuery(trpc.programs.list.queryOptions({}));

	const { data: teachingUnit, isLoading } = useQuery({
		queryKey: ["teaching-unit", teachingUnitId],
		queryFn: async () => {
			const result = await trpcClient.teachingUnits.getById.query({
				id: teachingUnitId,
			});
			return result as TeachingUnit;
		},
		enabled: !isCreateMode,
	});

	const form = useForm<TeachingUnitFormData>({
		resolver: zodResolver(unitSchema),
		defaultValues,
	});
	const selectedProgramId = form.watch("programId");
	const selectedProgram = useMemo(
		() => programs?.items?.find((program) => program.id === selectedProgramId),
		[programs?.items, selectedProgramId],
	);

	useEffect(() => {
		if (teachingUnit) {
			form.reset({
				name: teachingUnit.name,
				code: teachingUnit.code,
				description: teachingUnit.description ?? "",
				credits: teachingUnit.credits,
				semester: teachingUnit.semester,
				programId: teachingUnit.programId,
			});
		}
	}, [teachingUnit, form]);

	const invalidateLists = () => {
		queryClient.invalidateQueries(trpc.teachingUnits.list.queryKey({}));
		if (!isCreateMode) {
			queryClient.invalidateQueries({
				queryKey: ["teaching-unit", teachingUnitId],
			});
		}
	};

	const createMutation = useMutation({
		mutationFn: (payload: TeachingUnitFormData) =>
			trpcClient.teachingUnits.create.mutate(payload),
		onSuccess: (unit: TeachingUnit) => {
			toast.success(
				t("admin.teachingUnits.toast.created", {
					defaultValue: "Teaching unit created",
				}),
			);
			invalidateLists();
			navigate(`/admin/teaching-units/${unit.id}`, { replace: true });
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const updateMutation = useMutation({
		mutationFn: (payload: TeachingUnitFormData) =>
			trpcClient.teachingUnits.update.mutate({
				id: teachingUnitId,
				...payload,
			}),
		onSuccess: () => {
			toast.success(
				t("admin.teachingUnits.toast.updated", {
					defaultValue: "Teaching unit updated",
				}),
			);
			invalidateLists();
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const onSubmit = (values: TeachingUnitFormData) => {
		if (isCreateMode) {
			createMutation.mutate(values);
		} else {
			updateMutation.mutate(values);
		}
	};

	if (!isCreateMode && (isLoading || !teachingUnit)) {
		return (
			<div className="flex h-64 items-center justify-center">
				<Spinner className="h-8 w-8" />
			</div>
		);
	}

	return (
		<div className="space-y-6 p-6">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div className="space-y-2">
					<button
						type="button"
						onClick={() => navigate("/admin/teaching-units")}
						className="flex items-center gap-2 text-muted-foreground text-sm hover:text-foreground"
					>
						<ArrowLeft className="h-4 w-4" />
						{t("common.actions.back", { defaultValue: "Back" })}
					</button>
					<div>
						<h1 className="font-semibold text-2xl">
							{isCreateMode
								? t("admin.teachingUnits.detail.createTitle", {
										defaultValue: "Create teaching unit",
									})
								: t("admin.teachingUnits.detail.editTitle", {
										name: teachingUnit?.name,
										defaultValue: "Edit {{name}}",
									})}
						</h1>
						<p className="text-muted-foreground">
							{t("admin.teachingUnits.detail.subtitle", {
								defaultValue:
									"Update metadata and manage constitutive elements.",
							})}
						</p>
					</div>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>
						{t("admin.teachingUnits.detail.formTitle", {
							defaultValue: "Teaching unit details",
						})}
					</CardTitle>
					<CardDescription>
						{t("admin.teachingUnits.detail.formSubtitle", {
							defaultValue: "Edit code, semester, and description.",
						})}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("admin.teachingUnits.fields.name", {
												defaultValue: "Unit name",
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
								name="code"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("admin.teachingUnits.fields.code", {
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
								name="description"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("admin.teachingUnits.fields.description", {
												defaultValue: "Description",
											})}
										</FormLabel>
										<FormControl>
											<Textarea {...field} rows={4} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className="grid gap-4 md:grid-cols-2">
								<FormField
									control={form.control}
									name="credits"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												{t("admin.teachingUnits.fields.credits", {
													defaultValue: "ECTS",
												})}
											</FormLabel>
											<FormControl>
												<Input
													type="number"
													value={field.value ?? ""}
													onChange={(event) =>
														field.onChange(
															event.target.value === ""
																? undefined
																: Number(event.target.value),
														)
													}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="semester"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												{t("admin.teachingUnits.semesters.annual", {
													defaultValue: "Semester",
												})}
											</FormLabel>
											<Select
												onValueChange={field.onChange}
												value={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="annual">
														{t("admin.teachingUnits.semesters.annual", {
															defaultValue: "Annual",
														})}
													</SelectItem>
													<SelectItem value="fall">
														{t("admin.teachingUnits.semesters.fall", {
															defaultValue: "Fall",
														})}
													</SelectItem>
													<SelectItem value="spring">
														{t("admin.teachingUnits.semesters.spring", {
															defaultValue: "Spring",
														})}
													</SelectItem>
												</SelectContent>
											</Select>
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
										<FormLabel>
											{t("admin.teachingUnits.selectProgram", {
												defaultValue: "Select program",
											})}
										</FormLabel>
										<Select
											onValueChange={field.onChange}
											value={field.value || undefined}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue
														placeholder={t("admin.teachingUnits.selectProgram")}
													/>
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{programs?.items?.map((program) => (
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
										{selectedProgram?.facultyInfo?.name && (
											<p className="text-muted-foreground text-xs">
												{t("admin.teachingUnits.programFacultySummary", {
													defaultValue: "Faculty: {{value}}",
													value: selectedProgram.facultyInfo.name,
												})}
											</p>
										)}
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className="flex justify-end gap-2 pt-2">
								<Button
									type="button"
									variant="outline"
									onClick={() => navigate("/admin/teaching-units")}
								>
									{t("common.actions.cancel")}
								</Button>
								<Button
									type="submit"
									disabled={
										form.formState.isSubmitting ||
										createMutation.isPending ||
										updateMutation.isPending
									}
								>
									{form.formState.isSubmitting ||
									createMutation.isPending ||
									updateMutation.isPending
										? t("common.actions.saving", { defaultValue: "Saving..." })
										: isCreateMode
											? t("admin.teachingUnits.actions.create", {
													defaultValue: "Create UE",
												})
											: t("common.actions.saveChanges")}
								</Button>
							</div>
						</form>
					</Form>
				</CardContent>
			</Card>

			{!isCreateMode && teachingUnit && (
				<TeachingUnitCoursesTable
					teachingUnitId={teachingUnit.id}
					programId={teachingUnit.programId}
					semesterCode={teachingUnit.semester}
				/>
			)}
		</div>
	);
};

export default TeachingUnitDetail;
