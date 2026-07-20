import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
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
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import type { RouterOutputs } from "@/utils/trpc";
import { trpc, trpcClient } from "@/utils/trpc";
import { useProgramContext } from "./ProgramContext";

type ProgramOption = RouterOutputs["programOptions"]["list"]["items"][number];

const optionSchema = z.object({
	name: z.string().min(1, "Name is required"),
	code: z.string().min(1, "Code is required"),
	description: z.string().optional(),
});
type OptionFormData = z.infer<typeof optionSchema>;

export default function ProgramOptionsTab() {
	const { t } = useTranslation();
	const { program } = useProgramContext();
	const queryClient = useQueryClient();
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [editingOption, setEditingOption] = useState<ProgramOption | null>(
		null,
	);
	const [deleteId, setDeleteId] = useState<string | null>(null);

	const { data, isLoading } = useQuery(
		trpc.programOptions.list.queryOptions({
			programId: program.id,
			limit: 100,
		}),
	);
	const options = data?.items ?? [];

	const form = useForm<OptionFormData>({
		resolver: zodResolver(optionSchema),
		defaultValues: { name: "", code: "", description: "" },
	});

	const invalidate = () =>
		queryClient.invalidateQueries(
			trpc.programOptions.list.queryKey({ programId: program.id, limit: 100 }),
		);

	const openCreate = () => {
		setEditingOption(null);
		form.reset({ name: "", code: "", description: "" });
		setIsDialogOpen(true);
	};

	const openEdit = (opt: ProgramOption) => {
		setEditingOption(opt);
		form.reset({
			name: opt.name,
			code: opt.code,
			description: opt.description ?? "",
		});
		setIsDialogOpen(true);
	};

	const createMutation = useMutation({
		mutationFn: (data: OptionFormData) =>
			trpcClient.programOptions.create.mutate({
				...data,
				programId: program.id,
			}),
		onSuccess: () => {
			toast.success(
				t("admin.programs.options.toast.create", {
					defaultValue: "Option added",
				}),
			);
			invalidate();
			setIsDialogOpen(false);
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const updateMutation = useMutation({
		mutationFn: (data: OptionFormData) =>
			trpcClient.programOptions.update.mutate({
				id: editingOption!.id,
				programId: program.id,
				...data,
			}),
		onSuccess: () => {
			toast.success(
				t("admin.programs.options.toast.update", {
					defaultValue: "Option updated",
				}),
			);
			invalidate();
			setIsDialogOpen(false);
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => trpcClient.programOptions.delete.mutate({ id }),
		onSuccess: () => {
			toast.success(
				t("admin.programs.options.toast.delete", {
					defaultValue: "Option deleted",
				}),
			);
			invalidate();
			setDeleteId(null);
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const onSubmit = (data: OptionFormData) => {
		if (editingOption) {
			updateMutation.mutate(data);
		} else {
			createMutation.mutate(data);
		}
	};

	const isPending = createMutation.isPending || updateMutation.isPending;

	return (
		<>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle>
						{t("admin.programs.options.title", {
							defaultValue: "Program Options",
						})}
					</CardTitle>
					<Button size="sm" onClick={openCreate}>
						<Plus className="mr-2 h-4 w-4" />
						{t("admin.programs.options.add", { defaultValue: "Add Option" })}
					</Button>
				</CardHeader>
				<CardContent>
					{isLoading ? null : options.length === 0 ? (
						<Empty>
							<EmptyHeader>
								<EmptyMedia />
								<EmptyContent>
									<EmptyTitle>
										{t("admin.programs.options.empty.title", {
											defaultValue: "No options yet",
										})}
									</EmptyTitle>
									<EmptyDescription>
										{t("admin.programs.options.empty.description", {
											defaultValue:
												"Add specializations or tracks for this program.",
										})}
									</EmptyDescription>
								</EmptyContent>
							</EmptyHeader>
							<Button size="sm" onClick={openCreate}>
								<Plus className="mr-2 h-4 w-4" />
								{t("admin.programs.options.add", {
									defaultValue: "Add Option",
								})}
							</Button>
						</Empty>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>
										{t("admin.programs.options.fields.name", {
											defaultValue: "Name",
										})}
									</TableHead>
									<TableHead>
										{t("admin.programs.options.fields.code", {
											defaultValue: "Code",
										})}
									</TableHead>
									<TableHead>
										{t("admin.programs.options.fields.description", {
											defaultValue: "Description",
										})}
									</TableHead>
									<TableHead className="w-24" />
								</TableRow>
							</TableHeader>
							<TableBody>
								{options.map((opt) => (
									<TableRow key={opt.id}>
										<TableCell className="font-medium">{opt.name}</TableCell>
										<TableCell>{opt.code}</TableCell>
										<TableCell className="text-muted-foreground">
											{opt.description ?? "—"}
										</TableCell>
										<TableCell>
											<div className="flex items-center gap-1">
												<Button
													variant="ghost"
													size="icon"
													onClick={() => openEdit(opt)}
												>
													<Pencil className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													onClick={() => setDeleteId(opt.id)}
												>
													<Trash2 className="h-4 w-4 text-destructive" />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>

			{/* Create / Edit dialog */}
			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{editingOption
								? t("admin.programs.options.edit", {
										defaultValue: "Edit Option",
									})
								: t("admin.programs.options.add", {
										defaultValue: "Add Option",
									})}
						</DialogTitle>
					</DialogHeader>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("admin.programs.options.fields.name", {
												defaultValue: "Name",
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
											{t("admin.programs.options.fields.code", {
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
											{t("admin.programs.options.fields.description", {
												defaultValue: "Description",
											})}
										</FormLabel>
										<FormControl>
											<Textarea {...field} rows={2} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<DialogFooter>
								<Button
									type="button"
									variant="outline"
									onClick={() => setIsDialogOpen(false)}
								>
									{t("common.actions.cancel")}
								</Button>
								<Button type="submit" disabled={isPending}>
									{isPending
										? t("common.actions.saving", { defaultValue: "Saving..." })
										: editingOption
											? t("common.actions.saveChanges")
											: t("common.actions.create", { defaultValue: "Create" })}
								</Button>
							</DialogFooter>
						</form>
					</Form>
				</DialogContent>
			</Dialog>

			{/* Delete confirm */}
			<AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("admin.programs.options.deleteConfirm.title", {
								defaultValue: "Delete option?",
							})}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("admin.programs.options.deleteConfirm.description", {
								defaultValue: "This cannot be undone.",
							})}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("common.actions.cancel")}</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => deleteId && deleteMutation.mutate(deleteId)}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{t("common.actions.delete", { defaultValue: "Delete" })}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
