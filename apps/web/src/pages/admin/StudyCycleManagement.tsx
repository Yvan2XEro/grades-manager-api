import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Layers3, Pencil, Plus, Trash2 } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { trpcClient } from "../../utils/trpc";

const cycleSchema = z.object({
	facultyId: z.string().min(1),
	code: z.string().min(1),
	name: z.string().min(1),
	description: z.string().optional(),
	totalCreditsRequired: z.coerce.number().int().min(30),
	durationYears: z.coerce.number().int().min(1),
});

type CycleForm = z.infer<typeof cycleSchema>;

export default function StudyCycleManagement() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [activeCycleId, setActiveCycleId] = useState<string | null>(null);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const [editingId, setEditingId] = useState<string | null>(null);

	const facultiesQuery = useQuery({
		queryKey: ["faculties"],
		queryFn: () => trpcClient.faculties.list.query({}),
	});

	const cyclesQuery = useQuery({
		queryKey: ["studyCycles"],
		queryFn: () => trpcClient.studyCycles.listCycles.query({ limit: 200 }),
	});

	const facultyMap = useMemo(() => {
		const map = new Map<string, string>();
		facultiesQuery.data?.items?.forEach((faculty) =>
			map.set(faculty.id, faculty.name ?? faculty.id),
		);
		return map;
	}, [facultiesQuery.data]);

	const activeCycle = useMemo(
		() =>
			cyclesQuery.data?.items.find((cycle) => cycle.id === activeCycleId) ??
			null,
		[cyclesQuery.data, activeCycleId],
	);

	const levelsQuery = useQuery({
		queryKey: ["cycleLevels", activeCycle?.id],
		queryFn: () =>
			activeCycle
				? trpcClient.studyCycles.listLevels.query({ cycleId: activeCycle.id })
				: [],
		enabled: Boolean(activeCycle?.id),
	});

	const form = useForm<CycleForm>({
		resolver: zodResolver(cycleSchema),
		defaultValues: {
			facultyId: "",
			code: "",
			name: "",
			description: "",
			totalCreditsRequired: 180,
			durationYears: 3,
		},
	});

	const createCycleMutation = useMutation({
		mutationFn: async (payload: CycleForm & { id?: string }) => {
			if (payload.id) {
				await trpcClient.studyCycles.updateCycle.mutate(payload);
				return "update";
			}
			await trpcClient.studyCycles.createCycle.mutate(payload);
			return "create";
		},
		onSuccess: (mode) => {
			toast.success(
				mode === "update"
					? t("admin.studyCycles.toast.updateSuccess", {
							defaultValue: "Study cycle updated",
						})
					: t("admin.studyCycles.toast.createSuccess", {
							defaultValue: "Study cycle created",
						}),
			);
			queryClient.invalidateQueries({ queryKey: ["studyCycles"] });
			setIsFormOpen(false);
			setEditingId(null);
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const deleteCycleMutation = useMutation({
		mutationFn: (id: string) =>
			trpcClient.studyCycles.deleteCycle.mutate({ id }),
		onSuccess: () => {
			toast.success(
				t("admin.studyCycles.toast.deleteSuccess", {
					defaultValue: "Study cycle deleted",
				}),
			);
			queryClient.invalidateQueries({ queryKey: ["studyCycles"] });
			setDeleteId(null);
			if (activeCycleId === deleteId) setActiveCycleId(null);
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const createLevelMutation = useMutation({
		mutationFn: () =>
			activeCycle
				? trpcClient.studyCycles.createLevel.mutate({
						cycleId: activeCycle.id,
						code: `LEVEL-${(levelsQuery.data?.length ?? 0) + 1}`,
						name: t("admin.studyCycles.levels.defaultName", {
							defaultValue: "Level {{value}}",
							value: (levelsQuery.data?.length ?? 0) + 1,
						}),
						minCredits: 60,
					})
				: Promise.resolve(null),
		onSuccess: () => {
			toast.success(
				t("admin.studyCycles.toast.levelCreate", {
					defaultValue: "Level added",
				}),
			);
			queryClient.invalidateQueries({
				queryKey: ["cycleLevels", activeCycle?.id],
			});
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const deleteLevelMutation = useMutation({
		mutationFn: (id: string) =>
			trpcClient.studyCycles.deleteLevel.mutate({ id }),
		onSuccess: () => {
			toast.success(
				t("admin.studyCycles.toast.levelDelete", {
					defaultValue: "Level removed",
				}),
			);
			queryClient.invalidateQueries({
				queryKey: ["cycleLevels", activeCycle?.id],
			});
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const onSubmit = (data: CycleForm) => {
		createCycleMutation.mutate(editingId ? { ...data, id: editingId } : data);
	};

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div>
					<h1 className="font-semibold text-2xl text-gray-900">
						{t("admin.studyCycles.title", { defaultValue: "Study cycles" })}
					</h1>
					<p className="text-gray-600">
						{t("admin.studyCycles.subtitle", {
							defaultValue:
								"Group programs by cycle and tune the credit flow across levels.",
						})}
					</p>
				</div>
				<Button
					type="button"
					onClick={() => {
						setEditingId(null);
						form.reset({
							facultyId: "",
							code: "",
							name: "",
							description: "",
							totalCreditsRequired: 180,
							durationYears: 3,
						});
						setIsFormOpen(true);
					}}
				>
					<Plus className="mr-2 h-4 w-4" />
					{t("admin.studyCycles.actions.add", { defaultValue: "Add cycle" })}
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>
						{t("admin.studyCycles.listTitle", { defaultValue: "Cycles" })}
					</CardTitle>
				</CardHeader>
				<CardContent>
					{cyclesQuery.isLoading ? (
						<div className="flex justify-center py-6">
							<Spinner />
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>
										{t("admin.studyCycles.table.name", {
											defaultValue: "Name",
										})}
									</TableHead>
									<TableHead>
										{t("admin.studyCycles.table.faculty", {
											defaultValue: "Faculty",
										})}
									</TableHead>
									<TableHead>
										{t("admin.studyCycles.table.credits", {
											defaultValue: "Credits",
										})}
									</TableHead>
									<TableHead>
										{t("admin.studyCycles.table.duration", {
											defaultValue: "Duration",
										})}
									</TableHead>
									<TableHead className="text-right">
										{t("admin.studyCycles.table.actions", {
											defaultValue: "Actions",
										})}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{cyclesQuery.data?.items?.map((cycle) => (
									<TableRow
										key={cycle.id}
										className={`${activeCycleId === cycle.id ? "bg-primary-50" : "cursor-pointer hover:bg-gray-50"}`}
										onClick={() => setActiveCycleId(cycle.id)}
									>
										<TableCell className="font-semibold text-gray-900">
											{cycle.name}
										</TableCell>
										<TableCell>
											{facultyMap.get(cycle.facultyId) ?? cycle.facultyId}
										</TableCell>
										<TableCell>{cycle.totalCreditsRequired}</TableCell>
										<TableCell>
											{t("admin.studyCycles.table.years", {
												defaultValue: "{{value}} years",
												value: cycle.durationYears,
											})}
										</TableCell>
										<TableCell className="text-right">
											<Button
												type="button"
												variant="ghost"
												className="text-primary-700"
												onClick={(event) => {
													event.stopPropagation();
													setEditingId(cycle.id);
													form.reset({
														facultyId: cycle.facultyId,
														code: cycle.code,
														name: cycle.name,
														description: cycle.description ?? "",
														totalCreditsRequired: cycle.totalCreditsRequired,
														durationYears: cycle.durationYears,
													});
													setIsFormOpen(true);
												}}
											>
												<Pencil className="mr-2 h-4 w-4" />
												{t("common.actions.edit")}
											</Button>
											<Button
												type="button"
												variant="ghost"
												className="text-primary-700"
												onClick={(event) => {
													event.stopPropagation();
													setDeleteId(cycle.id);
												}}
											>
												<Trash2 className="mr-2 h-4 w-4" />
												{t("common.actions.delete")}
											</Button>
										</TableCell>
									</TableRow>
								))}
								{!cyclesQuery.data?.items?.length && (
									<TableRow>
										<TableCell
											colSpan={5}
											className="py-6 text-center text-gray-500 text-sm"
										>
											{t("admin.studyCycles.empty", {
												defaultValue: "No study cycles yet.",
											})}
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>

			{activeCycle && (
				<Card>
					<CardHeader>
						<div className="flex items-center gap-3">
							<Layers3 className="h-5 w-5 text-primary-700" />
							<div>
								<CardTitle>
									{t("admin.studyCycles.levelsTitle", {
										defaultValue: "Cycle levels for {{cycle}}",
										cycle: activeCycle.name,
									})}
								</CardTitle>
								<p className="text-gray-600 text-sm">
									{t("admin.studyCycles.levelsSubtitle", {
										defaultValue: "Define how students move across years.",
									})}
								</p>
							</div>
						</div>
					</CardHeader>
					<CardContent className="space-y-3">
						<Button
							type="button"
							variant="outline"
							onClick={() => createLevelMutation.mutate()}
							disabled={createLevelMutation.isPending}
						>
							<Plus className="mr-2 h-4 w-4" />
							{t("admin.studyCycles.actions.addLevel", {
								defaultValue: "Add level",
							})}
						</Button>
						<div className="space-y-2">
							{levelsQuery.data?.map((level) => (
								<div
									key={level.id}
									className="flex flex-wrap items-center justify-between rounded-lg border bg-white p-3 shadow-sm"
								>
									<div>
										<p className="font-semibold text-gray-900">{level.name}</p>
										<p className="text-gray-600 text-sm">
											{t("admin.studyCycles.levelCredits", {
												defaultValue: "Required credits: {{value}}",
												value: level.minCredits,
											})}
										</p>
									</div>
									<Button
										type="button"
										variant="ghost"
										className="text-destructive"
										onClick={() => deleteLevelMutation.mutate(level.id)}
									>
										<Trash2 className="mr-2 h-4 w-4" />
										{t("common.actions.delete")}
									</Button>
								</div>
							))}
							{!levelsQuery.data?.length && (
								<p className="text-gray-500 text-sm">
									{t("admin.studyCycles.levelsEmpty", {
										defaultValue: "No levels defined yet.",
									})}
								</p>
							)}
						</div>
					</CardContent>
				</Card>
			)}

			<Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
				<DialogContent className="sm:max-w-xl">
					<DialogHeader>
						<DialogTitle>
							{editingId
								? t("admin.studyCycles.actions.update", {
										defaultValue: "Update cycle",
									})
								: t("admin.studyCycles.actions.add", {
										defaultValue: "Add cycle",
									})}
						</DialogTitle>
					</DialogHeader>
					<Form {...form}>
						<form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
							<FormField
								control={form.control}
								name="facultyId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("admin.studyCycles.form.faculty", {
												defaultValue: "Faculty",
											})}
										</FormLabel>
										<FormControl>
											<select
												className="w-full rounded-md border border-gray-200 bg-white p-2"
												{...field}
											>
												<option value="">
													{t("admin.studyCycles.form.selectFaculty", {
														defaultValue: "Select faculty",
													})}
												</option>
												{facultiesQuery.data?.items?.map((faculty) => (
													<option key={faculty.id} value={faculty.id}>
														{faculty.name}
													</option>
												))}
											</select>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("admin.studyCycles.form.name", {
												defaultValue: "Name",
											})}
										</FormLabel>
										<FormControl>
											<Input {...field} placeholder="Bachelor of Science" />
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
							<Button
								type="submit"
								className="w-full"
								disabled={createCycleMutation.isPending}
							>
								{t("common.actions.save")}
							</Button>
						</form>
					</Form>
				</DialogContent>
			</Dialog>

			<AlertDialog
				open={Boolean(deleteId)}
				onOpenChange={(open) => !open && setDeleteId(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("admin.studyCycles.delete.title", {
								defaultValue: "Delete study cycle",
							})}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("admin.studyCycles.delete.message", {
								defaultValue:
									"Deleting a cycle does not remove existing classes or programs, but they will require reassignment.",
							})}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("common.actions.cancel")}</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => deleteId && deleteCycleMutation.mutate(deleteId)}
							className="bg-destructive text-white hover:bg-destructive/90"
						>
							{t("common.actions.delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
