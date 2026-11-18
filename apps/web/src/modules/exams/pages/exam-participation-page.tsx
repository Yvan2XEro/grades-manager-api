import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { DataTable } from "@/components/data-table";
import { ListLayout } from "@/components/layouts/ListLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { ParticipationFilters } from "../components/participation-filters";
import { ParticipationOverrideDialog } from "../components/participation-override-dialog";
import {
	useExamRoster,
	useParticipationFilters,
} from "../hooks/use-exam-participation";
import { getParticipationRosterColumns } from "../table/participation-roster-columns";
import type { ParticipationRow } from "../types";

export default function ExamParticipationPage() {
	const { t } = useTranslation();
	const filters = useParticipationFilters();
	const { examId } = filters;
	const { rows, isLoading, isLocked, hasRoster, generate, lock } =
		useExamRoster(examId);

	const columns = useMemo(
		() =>
			getParticipationRosterColumns(t, {
				isLocked,
				onOverride: (row: ParticipationRow) => {
					if (!examId) return;
					ParticipationOverrideDialog.call({
						examId,
						studentId: row.studentId,
						studentName: row.studentName,
						currentEligible: row.eligible,
					});
				},
			}),
		[t, isLocked, examId],
	);

	const showRoster = Boolean(examId) && !isLoading;

	return (
		<ListLayout
			toolbar={
				<>
					<ParticipationFilters filters={filters} />
					{showRoster && (
						<div className="flex items-center gap-2">
							{isLocked ? (
								<Badge variant="secondary">
									{t("admin.examParticipation.locked")}
								</Badge>
							) : (
								<>
									<Button
										size="sm"
										variant="outline"
										onClick={() => generate.mutate()}
										disabled={generate.isPending}
									>
										{generate.isPending ? (
											<Spinner className="mr-2 h-3 w-3" />
										) : null}
										{t("admin.examParticipation.generate")}
									</Button>
									{hasRoster && (
										<Button
											size="sm"
											onClick={() => lock.mutate()}
											disabled={lock.isPending}
										>
											{lock.isPending ? (
												<Spinner className="mr-2 h-3 w-3" />
											) : null}
											{t("admin.examParticipation.lock")}
										</Button>
									)}
								</>
							)}
							{rows.length > 0 && (
								<span className="ml-auto text-muted-foreground text-xs">
									{rows.filter((r) => r.eligible).length}/{rows.length}{" "}
									{t("admin.examParticipation.eligible")}
								</span>
							)}
						</div>
					)}
				</>
			}
		>
			{!examId ? (
				<Empty>
					<EmptyHeader>
						<span className="text-3xl text-muted-foreground/40">📋</span>
					</EmptyHeader>
					<EmptyTitle>{t("admin.examParticipation.emptyTitle")}</EmptyTitle>
					<EmptyDescription>
						{t("admin.examParticipation.emptyDescription")}
					</EmptyDescription>
				</Empty>
			) : isLoading ? (
				<div className="flex justify-center py-8">
					<Spinner />
				</div>
			) : (
				<DataTable
					columns={columns}
					data={rows}
					empty={
						<Empty>
							<EmptyHeader>
								<span className="text-3xl text-muted-foreground/40">📭</span>
							</EmptyHeader>
							<EmptyTitle>
								{t("admin.examParticipation.noRosterTitle")}
							</EmptyTitle>
							<EmptyDescription>
								{t("admin.examParticipation.noRosterDescription")}
							</EmptyDescription>
						</Empty>
					}
				/>
			)}
		</ListLayout>
	);
}
