import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { confirmAction } from "@/components/callable/confirm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { toast } from "@/lib/toast";
import type { RouterOutputs } from "@/utils/trpc";
import { trpc, trpcClient } from "@/utils/trpc";
import { useProgramContext } from "./ProgramContext";
import { ProgramOptionFormDialog } from "./ProgramOptionFormDialog";

type ProgramOption = RouterOutputs["programOptions"]["list"]["items"][number];

export default function ProgramOptionsTab() {
	const { t } = useTranslation();
	const { program } = useProgramContext();
	const queryClient = useQueryClient();

	const { data, isLoading } = useQuery(
		trpc.programOptions.list.queryOptions({
			programId: program.id,
			limit: 100,
		}),
	);
	const options = data?.items ?? [];

	const invalidate = () =>
		queryClient.invalidateQueries(
			trpc.programOptions.list.queryKey({ programId: program.id, limit: 100 }),
		);

	const openCreate = () =>
		ProgramOptionFormDialog.call({ programId: program.id });

	const openEdit = (option: ProgramOption) =>
		ProgramOptionFormDialog.call({ programId: program.id, option });

	const deleteMutation = useMutation({
		mutationFn: (id: string) => trpcClient.programOptions.delete.mutate({ id }),
		onSuccess: () => {
			toast.success(
				t("admin.programs.options.toast.delete", {
					defaultValue: "Option deleted",
				}),
			);
			invalidate();
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const confirmDelete = (id: string) =>
		confirmAction({
			title: t("admin.programs.options.deleteConfirm.title", {
				defaultValue: "Delete option?",
			}),
			message: t("admin.programs.options.deleteConfirm.description", {
				defaultValue: "This cannot be undone.",
			}),
			confirmText: t("common.actions.delete", { defaultValue: "Delete" }),
			onConfirm: () => deleteMutation.mutateAsync(id),
		});

	return (
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
												onClick={() => confirmDelete(opt.id)}
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
	);
}
