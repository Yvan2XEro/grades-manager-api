import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { createCallable } from "react-call";
import { useTranslation } from "react-i18next";
import { DIALOG_EXIT_MS } from "@/components/callable/callable-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";
import type { BulkEnrollResult } from "../types";

/**
 * Enrolls every student of the selected classes in all their courses for a
 * year; resolves with the per-class results.
 */
export const BulkEnrollClassesDialog = createCallable<
	{ academicYearId: string; classes: Array<{ id: string; name: string }> },
	BulkEnrollResult[] | undefined
>(({ call, academicYearId, classes }) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [bulkSelectedClassIds, setBulkSelectedClassIds] = useState<Set<string>>(
		new Set(),
	);
	const [bulkResults, setBulkResults] = useState<BulkEnrollResult[]>([]);

	const bulkEnrollMutation = useMutation({
		mutationFn: async () => {
			const results: BulkEnrollResult[] = [];
			for (const id of Array.from(bulkSelectedClassIds)) {
				const className =
					classes.find((c) => c.id === id)?.name ?? id.slice(0, 8);
				try {
					const res =
						await trpcClient.studentCourseEnrollments.autoEnrollClass.mutate({
							classId: id,
							academicYearId,
						});
					results.push({
						className,
						created: res.createdCount,
						skipped: res.skippedCount,
					});
				} catch (err) {
					results.push({
						className,
						created: 0,
						skipped: 0,
						error: (err as Error)?.message ?? String(err),
					});
				}
			}
			return results;
		},
		onSuccess: (results) => {
			setBulkResults(results);
			const totalCreated = results.reduce((s, r) => s + r.created, 0);
			const errCount = results.filter((r) => r.error).length;
			if (errCount === 0) {
				toast.success(
					t("admin.enrollments.bulkEnroll.success", {
						defaultValue: "{{count}} inscriptions créées sur {{n}} classe(s).",
						count: totalCreated,
						n: results.length,
					}),
				);
			} else {
				toast.error(
					t("admin.enrollments.bulkEnroll.partial", {
						defaultValue: "{{count}} inscriptions créées, {{err}} erreur(s).",
						count: totalCreated,
						err: errCount,
					}),
				);
			}
			queryClient.invalidateQueries({
				queryKey: trpc.studentCourseEnrollments.list.queryKey(),
			});
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const close = () => call.end(bulkResults.length ? bulkResults : undefined);

	return (
		<Dialog
			open={!call.ended}
			onOpenChange={(o) => !o && !bulkEnrollMutation.isPending && close()}
		>
			<DialogContent className="max-w-2xl p-6">
				<div className="space-y-5">
					<div>
						<h3 className="font-semibold text-lg">
							{t("admin.enrollments.bulkEnroll.title", {
								defaultValue: "Inscription de masse",
							})}
						</h3>
						<p className="mt-1 text-muted-foreground text-sm">
							{t("admin.enrollments.bulkEnroll.description", {
								defaultValue:
									"Sélectionnez une ou plusieurs classes. Tous les étudiants de chaque classe seront inscrits à tous ses cours (tous semestres confondus). Pour cibler un semestre précis, utilise le bouton « Enroll entire class » classe par classe.",
							})}
						</p>
					</div>

					{bulkResults.length === 0 ? (
						<>
							<div>
								<div className="mb-2 flex items-center justify-between">
									<label className="font-medium text-sm">
										{t("admin.enrollments.bulkEnroll.classesLabel", {
											defaultValue: "Classes ({{n}} sélectionnées)",
											n: bulkSelectedClassIds.size,
										})}
									</label>
									<div className="flex gap-2">
										<Button
											variant="ghost"
											size="sm"
											onClick={() =>
												setBulkSelectedClassIds(
													new Set(classes.map((c) => c.id)),
												)
											}
										>
											{t("common.actions.selectAll", {
												defaultValue: "Tout cocher",
											})}
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => setBulkSelectedClassIds(new Set())}
										>
											{t("common.actions.clear", {
												defaultValue: "Tout décocher",
											})}
										</Button>
									</div>
								</div>
								<ScrollArea className="h-64 rounded-md border">
									<div className="space-y-1 p-2">
										{classes.map((klass) => (
											<label
												key={klass.id}
												className="flex cursor-pointer items-center gap-2 rounded p-2 hover:bg-muted"
											>
												<Checkbox
													checked={bulkSelectedClassIds.has(klass.id)}
													onCheckedChange={(checked) => {
														setBulkSelectedClassIds((prev) => {
															const next = new Set(prev);
															if (checked) next.add(klass.id);
															else next.delete(klass.id);
															return next;
														});
													}}
												/>
												<span className="text-sm">{klass.name}</span>
											</label>
										))}
										{!classes.length && (
											<p className="p-4 text-center text-muted-foreground text-sm">
												{t("admin.enrollments.bulkEnroll.noClasses", {
													defaultValue: "Aucune classe pour cette année.",
												})}
											</p>
										)}
									</div>
								</ScrollArea>
							</div>

							<div className="flex justify-end gap-2">
								<Button
									variant="outline"
									onClick={close}
									disabled={bulkEnrollMutation.isPending}
								>
									{t("common.actions.cancel", {
										defaultValue: "Annuler",
									})}
								</Button>
								<Button
									onClick={() => bulkEnrollMutation.mutate()}
									disabled={
										bulkSelectedClassIds.size === 0 ||
										bulkEnrollMutation.isPending
									}
								>
									{bulkEnrollMutation.isPending && (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									)}
									{t("admin.enrollments.bulkEnroll.run", {
										defaultValue: "Lancer l'inscription",
									})}
								</Button>
							</div>
						</>
					) : (
						<>
							<div className="max-h-80 space-y-1 overflow-y-auto rounded-md border p-3">
								{bulkResults.map((r) => (
									<div
										key={r.className}
										className={`flex items-center justify-between border-b py-1.5 last:border-0 ${
											r.error ? "text-destructive" : ""
										}`}
									>
										<span className="font-medium text-sm">{r.className}</span>
										<span className="text-xs">
											{r.error
												? r.error
												: `${r.created} créées${r.skipped ? `, ${r.skipped} déjà existantes` : ""}`}
										</span>
									</div>
								))}
							</div>
							<div className="flex justify-end">
								<Button onClick={close}>
									{t("common.actions.close", {
										defaultValue: "Fermer",
									})}
								</Button>
							</div>
						</>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}, DIALOG_EXIT_MS);
