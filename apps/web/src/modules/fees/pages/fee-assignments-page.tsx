import { FileUp, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { DataTable } from "@/components/data-table";
import { ListLayout } from "@/components/layouts/ListLayout";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { PageHeader } from "@/components/ui/page-header";
import { AssignStudentDialog } from "../components/assign-student-dialog";
import { AssignmentStatusSummary } from "../components/assignment-status-summary";
import { BankImportDialog } from "../components/bank-import-dialog";
import { BulkAssignDialog } from "../components/bulk-assign-dialog";
import {
	FeeAssignmentsFilters,
	type FeeAssignmentsFilterValues,
} from "../components/fee-assignments-filters";
import {
	countByStatus,
	useFeeAssignments,
	useRefreshAssignments,
} from "../hooks/use-fee-assignments";
import { getFeeAssignmentsColumns } from "../table/fee-assignments-columns";

export default function FeeAssignmentsPage() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [filters, setFilters] = useState<FeeAssignmentsFilterValues>({
		search: "",
		yearId: "",
		classId: "",
		status: "",
	});
	const updateFilters = (patch: Partial<FeeAssignmentsFilterValues>) =>
		setFilters((current) => ({ ...current, ...patch }));

	const refreshAssignments = useRefreshAssignments();
	const { data, assignments, isLoading } = useFeeAssignments({
		academicYearId: filters.yearId,
		classId: filters.classId,
		status: filters.status,
		search: filters.search,
	});
	const columns = useMemo(() => getFeeAssignmentsColumns(t), [t]);

	return (
		<ListLayout
			header={
				<PageHeader
					title={t("feeClearance.assignments.title")}
					description={t("feeClearance.assignments.subtitle")}
					actions={
						<>
							<Button
								variant="outline"
								onClick={() =>
									BankImportDialog.call({ onSuccess: refreshAssignments })
								}
							>
								<FileUp className="mr-2 h-4 w-4" />
								{t("feeClearance.bankImport.button")}
							</Button>
							<Button
								variant="outline"
								onClick={() =>
									AssignStudentDialog.call({ onDone: refreshAssignments })
								}
							>
								{t("feeClearance.assignments.assignStudentTitle")}
							</Button>
							<Button
								variant="outline"
								onClick={() =>
									BulkAssignDialog.call({ onDone: refreshAssignments })
								}
							>
								<Users className="mr-2 h-4 w-4" />
								{t("feeClearance.assignments.bulkAssign")}
							</Button>
						</>
					}
				/>
			}
			toolbar={
				<>
					{data && (
						<AssignmentStatusSummary
							counts={countByStatus(assignments)}
							activeStatus={filters.status}
							onToggle={(status) => updateFilters({ status })}
						/>
					)}
					<FeeAssignmentsFilters value={filters} onChange={updateFilters} />
				</>
			}
			footer={
				data && (
					<p className="text-muted-foreground text-sm">
						{assignments.length} / {data.total}
					</p>
				)
			}
		>
			<DataTable
				columns={columns}
				data={assignments}
				isLoading={isLoading}
				onRowClick={(a) => navigate(`/fee-clearance/assignments/${a.id}`)}
				empty={
					<Empty>
						<EmptyMedia />
						<EmptyHeader>
							<EmptyTitle>
								{t("feeClearance.assignments.empty.title")}
							</EmptyTitle>
							<EmptyDescription>
								{t("feeClearance.assignments.empty.description")}
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				}
			/>
		</ListLayout>
	);
}
