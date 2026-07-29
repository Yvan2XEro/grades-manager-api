import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
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
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	ContextMenuItem,
	ContextMenuSeparator,
} from "@/components/ui/context-menu";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useConfirm } from "@/hooks/useConfirm";
import { useRowSelection } from "@/hooks/useRowSelection";
import { toast } from "@/lib/toast";
import FormModal from "../../components/modals/FormModal";
import { trpc, trpcClient } from "../../utils/trpc";

const cycleSchema = z.object({
	code: z.string().min(1),
	name: z.string().min(1),
	nameEn: z.string().optional(),
	description: z.string().optional(),
	totalCreditsRequired: z.coerce.number().int().min(30),
	durationYears: z.coerce.number().int().min(1),
});

type CycleForm = z.infer<typeof cycleSchema>;

export default function StudyCycleManagement() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);

	const { data: cyclesData, isLoading: cyclesLoading } = useQuery(
		trpc.studyCycles.listPaged.queryOptions({ page, pageSize }),
	);

	const cycles = cyclesData?.items ?? [];
	const selection = useRowSelection(cycles);

	const { confirm, ConfirmDialog } = useConfirm();

	const form = useForm<CycleForm>({
		resolver: zodResolver(cycleSchema),
		defaultValues: {
			code: "",
			name: "",
			nameEn: "",
			description: "",
			totalCreditsRequired: 180,
			durationYears: 3,
		},
	});

	const watchedCode = form.watch("code");
	const watchedDuration = form.watch("durationYears");
	const watchedCredits = form.watch("totalCreditsRequired");
	const autoLevelsPreview = useMemo(() => {
		const duration = Number(watchedDuration);
		const credits = Number(watchedCredits);
		if (!duration || duration < 1 || duration > 20) return [];
		return Array.from({ length: duration }, (_, i) => ({
			code: watchedCode ? `${watchedCode}-L${i + 1}` : `L${i + 1}`,
			name: `Level ${i + 1}`,
			minCredits: credits ? Math.floor(credits / duration) : 0,
		}));
	}, [watchedCode, watchedDuration, watchedCredits]);

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
			queryClient.invalidateQueries(trpc.studyCycles.listPaged.queryKey());
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
			queryClient.invalidateQueries(trpc.studyCycles.listPaged.queryKey());
			setDeleteId(null);
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
			queryClient.invalidateQueries(trpc.studyCycles.listPaged.queryKey());
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

	const onSubmit = (data: CycleForm) => {
		createCycleMutation.mutate(editingId ? { ...data, id: editingId } : data);
	};

	return (
		<div className="space-y-5">
			<div className="flex justify-end">
				<Button
					type="button"
					onClick={() => {
						setEditingId(null);
						form.reset({
							code: "",
							name: "",
							nameEn: "",
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
					{cyclesLoading ? (
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
									onClick={() =>
										confirm({
											title: t("common.bulkActions.confirmDeleteTitle", {
												defaultValue: "Delete selected items?",
											}),
											message: t("common.bulkActions.confirmDelete", {
												defaultValue:
													"Are you sure you want to delete the selected items?",
											}),
											confirmText: t("common.actions.delete"),
											onConfirm: () =>
												bulkDeleteMutation.mutate([...selection.selectedIds]),
										})
									}
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
											onClick={() =>
												navigate(`/admin/institution/cycles/${cycle.id}/levels`)
											}
											className="cursor-pointer"
											actions={
												<>
													<ContextMenuItem
														onSelect={() => {
															setEditingId(cycle.id);
															form.reset({
																code: cycle.code,
																name: cycle.name,
																nameEn: cycle.nameEn ?? "",
																description: cycle.description ?? "",
																totalCreditsRequired:
																	cycle.totalCreditsRequired,
																durationYears: cycle.durationYears,
															});
															setIsFormOpen(true);
														}}
													>
														{t("common.actions.edit")}
													</ContextMenuItem>
													<ContextMenuSeparator />
													<ContextMenuItem
														className="text-destructive"
														onSelect={() => setDeleteId(cycle.id)}
													>
														{t("common.actions.delete")}
													</ContextMenuItem>
												</>
											}
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
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button
															variant="ghost"
															size="icon-sm"
															className="row-action-fade"
															onClick={(e) => e.stopPropagation()}
														>
															<MoreHorizontal className="h-4 w-4" />
															<span className="sr-only">
																{t("common.table.actions")}
															</span>
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														<DropdownMenuItem
															onClick={(e) => {
																e.stopPropagation();
																navigate(
																	`/admin/institution/cycles/${cycle.id}/levels`,
																);
															}}
														>
															<Pencil className="mr-2 h-4 w-4" />
															{t("admin.studyCycles.actions.manageLevels", {
																defaultValue: "Manage levels",
															})}
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={(e) => {
																e.stopPropagation();
																setEditingId(cycle.id);
																form.reset({
																	code: cycle.code,
																	name: cycle.name,
																	nameEn: cycle.nameEn ?? "",
																	description: cycle.description ?? "",
																	totalCreditsRequired:
																		cycle.totalCreditsRequired,
																	durationYears: cycle.durationYears,
																});
																setIsFormOpen(true);
															}}
														>
															<Pencil className="mr-2 h-4 w-4" />
															{t("common.actions.edit")}
														</DropdownMenuItem>
														<DropdownMenuSeparator />
														<DropdownMenuItem
															className="text-destructive focus:text-destructive"
															onClick={(e) => {
																e.stopPropagation();
																setDeleteId(cycle.id);
															}}
														>
															<Trash2 className="mr-2 h-4 w-4" />
															{t("common.actions.delete")}
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
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
							<TablePagination
								page={page}
								pageCount={cyclesData?.pageCount ?? 1}
								total={cyclesData?.total ?? 0}
								pageSize={pageSize}
								onPageChange={setPage}
								onPageSizeChange={(s) => {
									setPageSize(s);
									setPage(1);
								}}
							/>
						</>
					)}
				</CardContent>
			</Card>

			<FormModal
				isOpen={isFormOpen}
				onClose={() => setIsFormOpen(false)}
				title={
					editingId
						? t("admin.studyCycles.actions.update", {
								defaultValue: "Update cycle",
							})
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
						<div className="grid gap-4 sm:grid-cols-2">
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
						{!editingId && autoLevelsPreview.length > 0 && (
							<div className="rounded-lg border border-dashed bg-muted/40 p-3">
								<p className="mb-2 font-medium text-muted-foreground text-xs">
									{t("admin.studyCycles.form.autoLevelsPreview", {
										defaultValue: "Levels that will be auto-created:",
									})}
								</p>
								<div className="flex flex-wrap gap-1.5">
									{autoLevelsPreview.map((lvl) => (
										<span
											key={lvl.code}
											className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 font-medium text-primary text-xs"
										>
											{lvl.code} · {lvl.minCredits} cr
										</span>
									))}
								</div>
							</div>
						)}
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
			<ConfirmDialog />
		</div>
	);
}
