import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { z } from "zod";
import FormModal from "@/components/modals/FormModal";
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
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";

const levelSchema = z.object({
	name: z.string().min(1),
	code: z.string().min(1),
	minCredits: z.coerce.number().int().min(0),
});

type LevelForm = z.infer<typeof levelSchema>;

export default function StudyCycleLevelsTab() {
	const { cycleId } = useParams<{ cycleId: string }>();
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [editingLevelId, setEditingLevelId] = useState<string | null>(null);

	const { data: cycle } = useQuery(
		trpc.studyCycles.getCycle.queryOptions({ id: cycleId! }),
	);

	const levelsQuery = useQuery({
		queryKey: ["cycleLevels", cycleId],
		queryFn: () =>
			trpcClient.studyCycles.listLevels.query({ cycleId: cycleId! }),
		enabled: Boolean(cycleId),
	});

	const levelForm = useForm<LevelForm>({
		resolver: zodResolver(levelSchema),
		defaultValues: { code: "", name: "", minCredits: 60 },
	});

	const invalidateLevels = () => {
		queryClient.invalidateQueries({ queryKey: ["cycleLevels", cycleId] });
	};

	const saveMutation = useMutation({
		mutationFn: async (payload: LevelForm & { id?: string }) => {
			if (payload.id) {
				await trpcClient.studyCycles.updateLevel.mutate(payload);
				return "update";
			}
			await trpcClient.studyCycles.createLevel.mutate({
				cycleId: cycleId!,
				...payload,
			});
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
			invalidateLevels();
			setIsFormOpen(false);
			setEditingLevelId(null);
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) =>
			trpcClient.studyCycles.deleteLevel.mutate({ id }),
		onSuccess: () => {
			toast.success(
				t("admin.studyCycles.toast.levelDelete", {
					defaultValue: "Level removed",
				}),
			);
			invalidateLevels();
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const openCreate = () => {
		setEditingLevelId(null);
		const nextNum = (levelsQuery.data?.length ?? 0) + 1;
		levelForm.reset({
			code: `${cycle?.code ?? "L"}-L${nextNum}`,
			name: `Level ${nextNum}`,
			minCredits: 60,
		});
		setIsFormOpen(true);
	};

	const openEdit = (level: {
		id: string;
		code: string;
		name: string;
		minCredits: number;
	}) => {
		setEditingLevelId(level.id);
		levelForm.reset({
			code: level.code,
			name: level.name,
			minCredits: level.minCredits,
		});
		setIsFormOpen(true);
	};

	return (
		<>
			<Card>
				<CardContent className="space-y-3 pt-6">
					<Button type="button" variant="outline" onClick={openCreate}>
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
									<p className="font-semibold text-foreground">{level.name}</p>
									<p className="text-muted-foreground text-xs">
										{level.code} ·{" "}
										{t("admin.studyCycles.levelCredits", {
											defaultValue: "Required credits: {{value}}",
											value: level.minCredits,
										})}
									</p>
								</div>
								<div className="flex gap-1">
									<Button
										type="button"
										variant="ghost"
										size="icon-sm"
										onClick={() => openEdit(level)}
									>
										<Pencil className="h-4 w-4" />
										<span className="sr-only">{t("common.actions.edit")}</span>
									</Button>
									<Button
										type="button"
										variant="ghost"
										size="icon-sm"
										className="text-destructive hover:text-destructive"
										onClick={() => deleteMutation.mutate(level.id)}
										disabled={deleteMutation.isPending}
									>
										<Trash2 className="h-4 w-4" />
										<span className="sr-only">
											{t("common.actions.delete")}
										</span>
									</Button>
								</div>
							</div>
						))}
						{!levelsQuery.data?.length && (
							<p className="text-muted-foreground text-sm">
								{t("admin.studyCycles.levelsEmpty", {
									defaultValue: "No levels defined yet.",
								})}
							</p>
						)}
					</div>
				</CardContent>
			</Card>

			<FormModal
				isOpen={isFormOpen}
				onClose={() => setIsFormOpen(false)}
				title={
					editingLevelId
						? t("admin.studyCycles.actions.updateLevel", {
								defaultValue: "Update level",
							})
						: t("admin.studyCycles.actions.addLevel", {
								defaultValue: "Add level",
							})
				}
				maxWidth="sm:max-w-md"
			>
				<Form {...levelForm}>
					<form
						className="space-y-4"
						onSubmit={levelForm.handleSubmit((data) =>
							saveMutation.mutate(
								editingLevelId ? { ...data, id: editingLevelId } : data,
							),
						)}
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
							disabled={saveMutation.isPending}
						>
							{t("common.actions.save")}
						</Button>
					</form>
				</Form>
			</FormModal>
		</>
	);
}
