import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Layers3, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
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
import { BulkActionBar } from "@/components/ui/bulk-action-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import FormModal from "../../components/modals/FormModal";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { Spinner } from "@/components/ui/spinner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import {
	ContextMenuItem,
	ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { Textarea } from "@/components/ui/textarea";
import { useCursorPagination } from "@/hooks/useCursorPagination";
import { useRowSelection } from "@/hooks/useRowSelection";
import { trpcClient } from "../../utils/trpc";

const cycleSchema = z.object({
	code: z.string().min(1),
	name: z.string().min(1),
	description: z.string().optional(),
	totalCreditsRequired: z.coerce.number().int().min(30),
	durationYears: z.coerce.number().int().min(1),
});

const levelSchema = z.object({
	name: z.string().min(1),
	code: z.string().min(1),
	minCredits: z.coerce.number().int().min(0),
});

type CycleForm = z.infer<typeof cycleSchema>;
type LevelForm = z.infer<typeof levelSchema>;

export default function StudyCycleManagement() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [activeCycleId, setActiveCycleId] = useState<string | null>(null);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [isLevelFormOpen, setIsLevelFormOpen] = useState(false);
	const [editingLevelId, setEditingLevelId] = useState<string | null>(null);
	const pagination = useCursorPagination({ pageSize: 20 });

	const cyclesQuery = useQuery({
		queryKey: ["studyCycles", pagination.cursor],
		queryFn: () =>
			trpcClient.studyCycles.listCycles.query({
				cursor: pagination.cursor,
				limit: pagination.pageSize,
			}),
	});

	const cycles = cyclesQuery.data?.items ?? [];
	const selection = useRowSelection(cycles);

	const activeCycle = useMemo(
		() => cycles.find((cycle) => cycle.id === activeCycleId) ?? null,
		[cycles, activeCycleId],
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
			code: "",
			name: "",
			description: "",
			totalCreditsRequired: 180,
			durationYears: 3,
		},
	});

	const levelForm = useForm<LevelForm>({
		resolver: zodResolver(levelSchema),
		defaultValues: {
			code: "",
			name: "",
			minCredits: 60,
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

	const bulkDeleteMutation = useMutation({
		mutationFn: async (ids: string[]) => {
			await Promise.all(
				ids.map((id) => trpcClient.studyCycles.deleteCycle.mutate({ id })),
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["studyCycles"] });
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

	const updateLevelMutation = useMutation({
		mutationFn: async (payload: LevelForm & { id?: string }) => {
			if (payload.id) {
				await trpcClient.studyCycles.updateLevel.mutate(payload);
				return "update";
			}
			if (activeCycle) {
				await trpcClient.studyCycles.createLevel.mutate({
					cycleId: activeCycle.id,
					...payload,
				});
			}
			return "create";
		},
		onSuccess: (mode) => {
			toast.success(
				mode === "update"
					? t("admin.studyCycles.toast.levelUpdate", {
							defaultValue: "Level updated",
						})
					: t("admin.studyCycles.toast.levelCreate", {
							defaultValue: "Level created",
						}),
			);
			queryClient.invalidateQueries({
				queryKey: ["cycleLevels", activeCycle?.id],
			});
			setIsLevelFormOpen(false);
			setEditingLevelId(null);
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

	const onLevelSubmit = (data: LevelForm) => {
		updateLevelMutation.mutate(
			editingLevelId ? { ...data, id: editingLevelId } : data,
		);
	};

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div>
					<h1 className="text-foreground">
						{t("admin.studyCycles.title", { defaultValue: "Study cycles" })}
					</h1>
					<p className="text-muted-foreground">
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
				<CardContent>
					{cyclesQuery.isLoading ? (
						<TableSkeleton columns={5} rows={8} />
					) : (
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
										<TableHead>
										{t("admin.studyCycles.table.name", {
												defaultValue: "Name",
											})}
										</TableHead>
										<TableHead className="w-20">
										{t("admin.studyCycles.table.credits", {
												defaultValue: "Credits",
											})}
										</TableHead>
										<TableHead className="w-28">
										{t("admin.studyCycles.table.duration", {
												defaultValue: "Duration",
											})}
										</TableHead>
										<TableHead className="w-[100px] text-right">
											{t("admin.studyCycles.table.actions", {
												defaultValue: "Actions",
											})}
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{cycles.map((cycle) => (
										<TableRow
											key={cycle.id}
											className={`${activeCycleId === cycle.id ? "bg-primary-50" : "cursor-pointer hover:bg-muted"}`}
											onClick={() => setActiveCycleId(cycle.id)}
										>
											<TableCell onClick={(e) => e.stopPropagation()}>
												<Checkbox
													checked={selection.isSelected(cycle.id)}
													onCheckedChange={() => selection.toggle(cycle.id)}
													aria-label={`Select ${cycle.name}`}
												/>
											</TableCell>
											<TableCell className="font-semibold text-foreground">
												{cycle.name}
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
									{!cycles.length && (
										<TableRow>
											<TableCell
												colSpan={5}
												className="py-6 text-center text-muted-foreground text-sm"
											>
												{t("admin.studyCycles.empty", {
													defaultValue: "No study cycles yet.",
												})}
											</TableCell>
										</TableRow>
									)}
								</TableBody>
							</Table>
							<PaginationBar
								hasPrev={pagination.hasPrev}
								hasNext={!!cyclesQuery.data?.nextCursor}
								onPrev={pagination.handlePrev}
								onNext={() =>
									pagination.handleNext(cyclesQuery.data?.nextCursor)
								}
								isLoading={cyclesQuery.isLoading}
							/>
						</>
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
								<p className="text-muted-foreground text-xs">
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
							onClick={() => {
								setEditingLevelId(null);
								const nextLevelNum = (levelsQuery.data?.length ?? 0) + 1;
								levelForm.reset({
									code: `${activeCycle?.code || "L"}-L${nextLevelNum}`,
									name: `Level ${nextLevelNum}`,
									minCredits: 60,
								});
								setIsLevelFormOpen(true);
							}}
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
									className="flex flex-wrap items-center justify-between rounded-lg border bg-card p-3 shadow-sm"
								>
									<div>
										<p className="font-semibold text-foreground">
											{level.name}
										</p>
										<p className="text-muted-foreground text-xs">
											{t("admin.studyCycles.levelCredits", {
												defaultValue: "Required credits: {{value}}",
												value: level.minCredits,
											})}
										</p>
									</div>
									<div className="flex gap-2">
										<Button
											type="button"
											variant="ghost"
											className="text-primary-700"
											onClick={() => {
												setEditingLevelId(level.id);
												levelForm.reset({
													code: level.code,
													name: level.name,
													minCredits: level.minCredits,
												});
												setIsLevelFormOpen(true);
											}}
										>
											<Pencil className="mr-2 h-4 w-4" />
											{t("common.actions.edit")}
										</Button>
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
								</div>
							))}
							{!levelsQuery.data?.length && (
								<p className="text-muted-foreground text-xs">
									{t("admin.studyCycles.levelsEmpty", {
										defaultValue: "No levels defined yet.",
									})}
								</p>
							)}
						</div>
					</CardContent>
				</Card>
			)}

			<FormModal
				isOpen={isFormOpen}
				onClose={() => setIsFormOpen(false)}
				title={
					editingId
						? t("admin.studyCycles.actions.update", { defaultValue: "Update cycle" })
						: t("admin.studyCycles.actions.add", { defaultValue: "Add cycle" })
				}
				maxWidth="sm:max-w-xl"
			>
				<Form {...form}>
						<form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
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
							</div>
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
			</FormModal>

			<FormModal
				isOpen={isLevelFormOpen}
				onClose={() => setIsLevelFormOpen(false)}
				title={
					editingLevelId
						? t("admin.studyCycles.actions.updateLevel", { defaultValue: "Update level" })
						: t("admin.studyCycles.actions.addLevel", { defaultValue: "Add level" })
				}
				maxWidth="sm:max-w-xl"
			>
				<Form {...levelForm}>
						<form
							className="space-y-4"
							onSubmit={levelForm.handleSubmit(onLevelSubmit)}
						>
							<div className="grid gap-4 sm:grid-cols-2">
								<FormField
									control={levelForm.control}
									name="name"
									render={({ field }) => (
										<FormItem>
											<FormLabel required>
												{t("admin.studyCycles.form.name", {
													defaultValue: "Name",
												})}
											</FormLabel>
											<FormControl>
												<Input {...field} placeholder="Level 1" />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={levelForm.control}
									name="code"
									render={({ field }) => (
										<FormItem>
											<FormLabel required>
												{t("admin.studyCycles.form.code", {
													defaultValue: "Code",
												})}
											</FormLabel>
											<FormControl>
												<Input {...field} placeholder="L1" />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<FormField
								control={levelForm.control}
								name="minCredits"
								render={({ field }) => (
									<FormItem>
										<FormLabel required>
											{t("admin.studyCycles.form.minCredits", {
												defaultValue: "Minimum credits",
											})}
										</FormLabel>
										<FormControl>
											<Input type="number" min={0} {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<Button
								type="submit"
								className="w-full"
								disabled={updateLevelMutation.isPending}
							>
								{t("common.actions.save")}
							</Button>
						</form>
					</Form>
			</FormModal>

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
