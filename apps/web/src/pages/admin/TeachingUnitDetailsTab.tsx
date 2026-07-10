import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";

const buildUnitSchema = (
	t: (key: string, options?: Record<string, unknown>) => string,
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

export default function TeachingUnitDetailsTab() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { teachingUnitId } = useParams<{ teachingUnitId: string }>();

	const unitSchema = useMemo(() => buildUnitSchema(t), [t]);

	const { data: programs } = useQuery(trpc.programs.list.queryOptions({}));

	const { data: teachingUnit } = useQuery(
		trpc.teachingUnits.getById.queryOptions({ id: teachingUnitId! }),
	);

	const form = useForm<TeachingUnitFormData>({
		resolver: zodResolver(unitSchema),
		defaultValues,
	});

	const selectedProgramId = form.watch("programId");
	const _selectedProgram = useMemo(
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
		queryClient.invalidateQueries(
			trpc.teachingUnits.getById.queryOptions({ id: teachingUnitId! }),
		);
	};

	const updateMutation = useMutation({
		mutationFn: (payload: TeachingUnitFormData) =>
			trpcClient.teachingUnits.update.mutate({
				id: teachingUnitId!,
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
		updateMutation.mutate(values);
	};

	return (
		<Card>
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
										<Select onValueChange={field.onChange} value={field.value}>
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
													{program.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="flex justify-end gap-2 pt-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => navigate("/admin/programs/teaching-units")}
							>
								{t("common.actions.cancel")}
							</Button>
							<Button
								type="submit"
								disabled={
									form.formState.isSubmitting || updateMutation.isPending
								}
							>
								{form.formState.isSubmitting || updateMutation.isPending
									? t("common.actions.saving", {
											defaultValue: "Saving...",
										})
									: t("common.actions.saveChanges")}
							</Button>
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}
