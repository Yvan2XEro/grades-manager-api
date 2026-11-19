import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Flag, Lock, Undo2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageLink } from "@/components/navigation/page-link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";
import { G, isPastYear } from "../services/import-steps";
import type { ImportYear } from "../types";

/**
 * Closing of an imported year: what will happen, then the report. Can be run
 * again after a correction (open deliberations are recomputed).
 */
export function YearClosePanel({
	year,
	onNext,
}: {
	year: ImportYear;
	onNext: () => void;
}) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const past = isPastYear(year);
	const close = useMutation({
		mutationFn: () =>
			trpcClient.dataImport.closeYear.mutate({ academicYearId: year.id }),
		onSuccess: () =>
			queryClient.invalidateQueries(trpc.dataImport.overview.queryFilter()),
		onError: (error) => toast.error(error.message),
	});
	const report = close.data;
	const missing = year.counts.grades === 0;

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-base">
					<Flag className="h-4 w-4" />
					{t(`${G}close.title`)}
				</CardTitle>
				<p className="text-muted-foreground text-sm">{t(`${G}close.text`)}</p>
			</CardHeader>
			<CardContent className="space-y-4">
				<ul className="space-y-2 text-sm">
					{past && (
						<li className="flex gap-2">
							<Lock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
							{t(`${G}close.lock`)}
						</li>
					)}
					<li className="flex gap-2">
						<CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
						{t(`${G}close.credits`)}
					</li>
					<li className="flex gap-2">
						<CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
						{t(`${G}close.deliberations`)}
					</li>
					<li className="flex gap-2 text-muted-foreground">
						<Undo2 className="mt-0.5 h-4 w-4 shrink-0" />
						{t(`${G}close.undoNote`)}
					</li>
				</ul>
				{missing && (
					<p className="rounded-md bg-amber-500/10 px-3 py-2 text-amber-700 text-sm dark:text-amber-400">
						{t(`${G}close.noGrades`)}
					</p>
				)}
				{report && (
					<div className="rounded-md border bg-emerald-500/5 p-3 text-sm">
						<p className="font-medium">{t(`${G}close.done`)}</p>
						<p className="text-muted-foreground">
							{t(`${G}close.report`, {
								locked: report.lockedExams,
								students: report.students,
								created: report.deliberations.created,
								recomputed: report.deliberations.recomputed,
								skipped: report.deliberations.skipped,
							})}
						</p>
					</div>
				)}
				<div className="flex flex-wrap gap-2">
					<Button onClick={() => close.mutate()} disabled={close.isPending}>
						{close.isPending && <Spinner className="mr-2 h-4 w-4" />}
						{year.counts.deliberations > 0
							? t(`${G}close.again`)
							: t(`${G}close.run`)}
					</Button>
					{(report || year.counts.deliberations > 0) && (
						<>
							<Button variant="outline" asChild>
								<PageLink to="/academic-results/deliberations">
									{t(`${G}close.review`)}
								</PageLink>
							</Button>
							<Button variant="outline" onClick={onNext}>
								{t(`${G}close.next`)}
							</Button>
						</>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
