import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";
import { useProgramContext } from "./ProgramContext";

const schema = z.object({
	name: z.string().min(1, "Name is required"),
	nameEn: z.string().optional().nullable(),
	code: z.string().min(1, "Code is required"),
	abbreviation: z.string().optional().nullable(),
	description: z.string().optional().nullable(),
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
});

type FormData = z.infer<typeof schema>;

export default function ProgramDetailsTab() {
	const { t } = useTranslation();
	const { programId } = useParams<{ programId: string }>();
	const { program, refetch } = useProgramContext();
	const queryClient = useQueryClient();

	const { data: cycles } = useQuery({
		queryKey: ["study-cycles-select"],
		queryFn: () => trpcClient.studyCycles.listCycles.query({}),
	});

	const { data: centersData } = useQuery({
		queryKey: ["centers", "select"],
		queryFn: () => trpcClient.centers.list.query({ limit: 200 }),
	});
	const centers = centersData?.items ?? [];

	const form = useForm<FormData>({
		resolver: zodResolver(schema),
		defaultValues: {
			name: "",
			nameEn: "",
			code: "",
			abbreviation: "",
			description: "",
			domainFr: "",
			domainEn: "",
			specialiteFr: "",
			specialiteEn: "",
			diplomaTitleFr: "",
			diplomaTitleEn: "",
			attestationValidityFr: "",
			attestationValidityEn: "",
			cycleId: null,
			centerId: null,
			isCenterProgram: false,
		},
	});

	useEffect(() => {
		if (program) {
			form.reset({
				name: program.name ?? "",
				nameEn: program.nameEn ?? "",
				code: program.code ?? "",
				abbreviation: program.abbreviation ?? "",
				description: program.description ?? "",
				domainFr: program.domainFr ?? "",
				domainEn: program.domainEn ?? "",
				specialiteFr: program.specialiteFr ?? "",
				specialiteEn: program.specialiteEn ?? "",
				diplomaTitleFr: program.diplomaTitleFr ?? "",
				diplomaTitleEn: program.diplomaTitleEn ?? "",
				attestationValidityFr: program.attestationValidityFr ?? "",
				attestationValidityEn: program.attestationValidityEn ?? "",
				cycleId: program.cycleId ?? null,
				centerId: program.centerId ?? null,
				isCenterProgram: program.isCenterProgram ?? false,
			});
		}
	}, [program, form]);

	const updateMutation = useMutation({
		mutationFn: (data: FormData) =>
			trpcClient.programs.update.mutate({ id: programId!, ...data }),
		onSuccess: () => {
			toast.success(
				t("admin.programs.toast.updateSuccess", {
					defaultValue: "Program updated",
				}),
			);
			queryClient.invalidateQueries(
				trpc.programs.getById.queryOptions({ id: programId! }),
			);
			refetch();
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const selectedCenterId = form.watch("centerId");

	return (
		<Card>
			<CardContent className="pt-6">
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit((data) => updateMutation.mutate(data))}
						className="space-y-6"
					>
						{/* Identity */}
						<div className="grid gap-4 md:grid-cols-2">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("admin.programs.fields.name", {
												defaultValue: "Name (FR)",
											})}
										</FormLabel>
										<FormControl>
											<Input {...field} value={field.value ?? ""} />
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
											{t("admin.programs.fields.nameEn", {
												defaultValue: "Name (EN)",
											})}
										</FormLabel>
										<FormControl>
											<Input {...field} value={field.value ?? ""} />
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
											{t("admin.programs.fields.code", {
												defaultValue: "Code",
											})}
										</FormLabel>
										<FormControl>
											<Input {...field} value={field.value ?? ""} />
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
											{t("admin.programs.fields.abbreviation", {
												defaultValue: "Abbreviation",
											})}
										</FormLabel>
										<FormControl>
											<Input {...field} value={field.value ?? ""} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t("admin.programs.fields.description", {
											defaultValue: "Description",
										})}
									</FormLabel>
									<FormControl>
										<Textarea {...field} value={field.value ?? ""} rows={3} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Academic */}
						<div className="grid gap-4 md:grid-cols-2">
							<FormField
								control={form.control}
								name="domainFr"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("admin.programs.fields.domainFr", {
												defaultValue: "Domain (FR)",
											})}
										</FormLabel>
										<FormControl>
											<Input {...field} value={field.value ?? ""} />
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
											{t("admin.programs.fields.domainEn", {
												defaultValue: "Domain (EN)",
											})}
										</FormLabel>
										<FormControl>
											<Input {...field} value={field.value ?? ""} />
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
											{t("admin.programs.fields.specialiteFr", {
												defaultValue: "Speciality (FR)",
											})}
										</FormLabel>
										<FormControl>
											<Input {...field} value={field.value ?? ""} />
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
											{t("admin.programs.fields.specialiteEn", {
												defaultValue: "Speciality (EN)",
											})}
										</FormLabel>
										<FormControl>
											<Input {...field} value={field.value ?? ""} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="cycleId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("admin.programs.fields.cycle", {
												defaultValue: "Cycle",
											})}
										</FormLabel>
										<Select
											onValueChange={(v) =>
												field.onChange(v === "none" ? null : v)
											}
											value={field.value ?? "none"}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue
														placeholder={t("common.none", {
															defaultValue: "None",
														})}
													/>
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="none">
													{t("common.none", { defaultValue: "None" })}
												</SelectItem>
												{(cycles?.items ?? []).map((c) => (
													<SelectItem key={c.id} value={c.id}>
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
								name="centerId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("admin.programs.fields.center", {
												defaultValue: "Center",
											})}
										</FormLabel>
										<Select
											onValueChange={(v) =>
												field.onChange(v === "none" ? null : v)
											}
											value={field.value ?? "none"}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue
														placeholder={t("common.none", {
															defaultValue: "None",
														})}
													/>
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="none">
													{t("common.none", { defaultValue: "None" })}
												</SelectItem>
												{centers.map((c) => (
													<SelectItem key={c.id} value={c.id}>
														{c.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						{selectedCenterId && (
							<FormField
								control={form.control}
								name="isCenterProgram"
								render={({ field }) => (
									<FormItem className="flex items-center gap-3">
										<FormControl>
											<Switch
												checked={field.value ?? false}
												onCheckedChange={field.onChange}
											/>
										</FormControl>
										<FormLabel className="mt-0">
											{t("admin.programs.fields.isCenterProgram", {
												defaultValue: "Center program",
											})}
										</FormLabel>
									</FormItem>
								)}
							/>
						)}

						{/* Document titles */}
						<div className="grid gap-4 md:grid-cols-2">
							<FormField
								control={form.control}
								name="diplomaTitleFr"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("admin.programs.fields.diplomaTitleFr", {
												defaultValue: "Diploma title (FR)",
											})}
										</FormLabel>
										<FormControl>
											<Input {...field} value={field.value ?? ""} />
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
											{t("admin.programs.fields.diplomaTitleEn", {
												defaultValue: "Diploma title (EN)",
											})}
										</FormLabel>
										<FormControl>
											<Input {...field} value={field.value ?? ""} />
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
											{t("admin.programs.fields.attestationValidityFr", {
												defaultValue: "Attestation validity (FR)",
											})}
										</FormLabel>
										<FormControl>
											<Input {...field} value={field.value ?? ""} />
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
											{t("admin.programs.fields.attestationValidityEn", {
												defaultValue: "Attestation validity (EN)",
											})}
										</FormLabel>
										<FormControl>
											<Input {...field} value={field.value ?? ""} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="flex justify-end pt-2">
							<Button type="submit" disabled={updateMutation.isPending}>
								{updateMutation.isPending
									? t("common.actions.saving", { defaultValue: "Saving..." })
									: t("common.actions.saveChanges")}
							</Button>
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}
