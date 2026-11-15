import { useQuery, useQueryClient } from "@tanstack/react-query";
import { History, Undo2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Confirm } from "@/components/callable/confirm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";
import { G, stepLabel } from "../services/import-steps";

/**
 * Imports done for a year, latest first. Each one can be undone: what it
 * created is deleted and what it changed gets its former value back. The
 * server refuses while a later import depends on it.
 */
export function YearHistoryCard({
	academicYearId,
}: {
	academicYearId: string;
}) {
	const { t, i18n } = useTranslation();
	const queryClient = useQueryClient();
	const { data: imports = [] } = useQuery(
		trpc.dataImport.history.queryOptions({ academicYearId }),
	);
	if (!imports.length) return null;

	const undo = (job: (typeof imports)[number]) =>
		Confirm.call({
			title: t(`${G}history.undoTitle`, { step: stepLabel(job.step, t) }),
			description: t(`${G}history.undoText`, {
				created: job.created,
				updated: job.updated,
			}),
			confirmLabel: t(`${G}history.undo`),
			mutationFn: async (call) => {
				const result = await trpcClient.batchJobs.rollback.mutate({
					jobId: job.id,
				});
				if (result?.status !== "completed") {
					// The server refuses while later imports depend on this one
					toast.error(
						result?.error?.startsWith("Cannot undo")
							? t(`${G}history.blocked`)
							: t(`${G}history.undoFailed`),
					);
					return;
				}
				toast.success(t(`${G}history.undone`));
				await Promise.all([
					queryClient.invalidateQueries(trpc.dataImport.history.queryFilter()),
					queryClient.invalidateQueries(trpc.dataImport.overview.queryFilter()),
				]);
				call.end(true);
			},
		});

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-base">
					<History className="h-4 w-4" />
					{t(`${G}history.title`)}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<ul className="divide-y text-sm">
					{imports.map((job) => (
						<li key={job.id} className="flex flex-wrap items-center gap-3 py-2">
							<span className="min-w-40 font-medium">
								{stepLabel(job.step, t)}
							</span>
							<span className="text-muted-foreground text-xs">
								{job.completedAt &&
									new Date(job.completedAt).toLocaleString(i18n.language)}
								{job.by && ` · ${job.by}`}
							</span>
							<span className="text-xs">
								{t(`${G}history.counts`, {
									created: job.created,
									updated: job.updated,
								})}
							</span>
							<span className="ml-auto">
								{!job.undoable && job.status !== "rolled_back" ? (
									<span className="text-muted-foreground text-xs">
										{t(`${G}history.notUndoable`)}
									</span>
								) : job.status === "rolled_back" ? (
									<Badge variant="secondary">
										{t(`${G}history.undoneBadge`)}
									</Badge>
								) : (
									<Button size="sm" variant="ghost" onClick={() => undo(job)}>
										<Undo2 className="mr-1.5 h-4 w-4" />
										{t(`${G}history.undo`)}
									</Button>
								)}
							</span>
						</li>
					))}
				</ul>
			</CardContent>
		</Card>
	);
}
