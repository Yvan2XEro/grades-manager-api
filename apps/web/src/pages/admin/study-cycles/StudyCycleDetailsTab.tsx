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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";

const schema = z.object({
	code: z.string().min(1),
	name: z.string().min(1),
	nameEn: z.string().optional(),
	description: z.string().optional(),
	totalCreditsRequired: z.coerce.number().int().min(30),
	durationYears: z.coerce.number().int().min(1),
});

type FormData = z.infer<typeof schema>;

export default function StudyCycleDetailsTab() {
	const { cycleId } = useParams<{ cycleId: string }>();
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	const { data: cycle } = useQuery(
		trpc.studyCycles.getCycle.queryOptions({ id: cycleId! }),
	);

	const form = useForm<FormData>({
		resolver: zodResolver(schema),
		defaultValues: {
			code: "",
			name: "",
			nameEn: "",
			description: "",
			totalCreditsRequired: 180,
			durationYears: 3,
		},
	});

	useEffect(() => {
		if (cycle) {
			form.reset({
				code: cycle.code,
				name: cycle.name,
				nameEn: cycle.nameEn ?? "",
				description: cycle.description ?? "",
				totalCreditsRequired: cycle.totalCreditsRequired,
				durationYears: cycle.durationYears,
			});
		}
	}, [cycle, form]);

	const updateMutation = useMutation({
		mutationFn: (data: FormData) =>
			trpcClient.studyCycles.updateCycle.mutate({ id: cycleId!, ...data }),
		onSuccess: () => {
			toast.success(
				t("admin.studyCycles.toast.updateSuccess", {
					defaultValue: "Study cycle updated",
				}),
			);
			queryClient.invalidateQueries(
				trpc.studyCycles.getCycle.queryOptions({ id: cycleId! }),
			);
			queryClient.invalidateQueries(trpc.studyCycles.listPaged.queryKey());
		},
		onError: (err: Error) => toast.error(err.message),
	});

	return (
		<Card>
			<CardContent className="pt-6">
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit((data) => updateMutation.mutate(data))}
						className="space-y-4"
					>
						<div className="grid gap-4 sm:grid-cols-2">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel required>
											{t("admin.studyCycles.form.name", {
												defaultValue: "Name",
											})}
										</FormLabel>
										<FormControl>
											<Input {...field} placeholder="Licence" />
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
											{t("admin.studyCycles.form.nameEn", {
												defaultValue: "Name (English)",
											})}
										</FormLabel>
										<FormControl>
											<Input {...field} placeholder="Bachelor of Science" />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<FormField
							control={form.control}
							name="code"
							render={({ field }) => (
								<FormItem>
									<FormLabel required>
										{t("admin.studyCycles.form.code", {
											defaultValue: "Code",
										})}
									</FormLabel>
									<FormControl>
										<Input {...field} placeholder="BSC" />
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
										{t("admin.studyCycles.form.description", {
											defaultValue: "Description",
										})}
									</FormLabel>
									<FormControl>
										<Textarea {...field} rows={3} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="grid gap-4 sm:grid-cols-2">
							<FormField
								control={form.control}
								name="totalCreditsRequired"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("admin.studyCycles.form.credits", {
												defaultValue: "Credits",
											})}
										</FormLabel>
										<FormControl>
											<Input type="number" min={30} {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="durationYears"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("admin.studyCycles.form.duration", {
												defaultValue: "Years",
											})}
										</FormLabel>
										<FormControl>
											<Input type="number" min={1} {...field} />
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
