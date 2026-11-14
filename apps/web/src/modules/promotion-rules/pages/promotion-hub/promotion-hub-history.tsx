import { ArrowLeft, Eye } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { DataTable, type RowAction } from "@/components/data-table";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import { ListLayout } from "@/components/layouts/ListLayout";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty";
import { Label } from "@/components/ui/label";
import { ExecutionDetailsDialog } from "../../components/execution-details-dialog";
import { usePromotionExecutions } from "../../hooks/use-promotion-executions";
import { getExecutionsColumns } from "../../table/executions-columns";
import type { PromotionExecutionItem } from "../../types";

export function ExecutionHistoryPage() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [filterYear, setFilterYear] = useState<string | null>(null);
	const { data: executionsData, isLoading } =
		usePromotionExecutions(filterYear);
	const columns = useMemo(() => getExecutionsColumns(t), [t]);

	const rowActions = (execution: PromotionExecutionItem): RowAction[] => [
		{
			label: t("admin.promotionRules.history.table.viewDetails"),
			icon: Eye,
			onSelect: () =>
				ExecutionDetailsDialog.call({ executionId: execution.id }),
		},
	];

	return (
		<ListLayout
			header={
				<div className="space-y-4">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => navigate("/promotion-legacy")}
						className="gap-2"
					>
						<ArrowLeft className="h-4 w-4" />
						{t("common.actions.back")}
					</Button>
					<div>
						<h1 className="text-foreground">
							{t("admin.promotionRules.history.title")}
						</h1>
						<p className="mt-1 text-muted-foreground">
							{t("admin.promotionRules.history.subtitle")}
						</p>
					</div>
				</div>
			}
			toolbar={
				<div className="flex flex-wrap items-end gap-4">
					<div className="w-56">
						<Label className="mb-1 block font-medium text-sm">
							{t("admin.classes.filters.academicYear", {
								defaultValue: "Academic Year",
							})}
						</Label>
						<AcademicYearSelect
							value={filterYear}
							onChange={(v) => setFilterYear(v)}
						/>
					</div>
				</div>
			}
		>
			<DataTable
				columns={columns}
				data={executionsData?.items ?? []}
				isLoading={isLoading}
				rowActions={rowActions}
				empty={
					<Empty className="m-4 border border-dashed">
						<EmptyHeader>
							<EmptyDescription>
								{t("admin.promotionRules.history.emptyState")}
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				}
			/>
		</ListLayout>
	);
}
