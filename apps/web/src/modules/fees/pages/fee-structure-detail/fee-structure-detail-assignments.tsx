import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { DataTable } from "@/components/data-table";
import { ListLayout } from "@/components/layouts/ListLayout";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { useFeeAssignments } from "../../hooks/use-fee-assignments";
import { getFeeAssignmentsColumns } from "../../table/fee-assignments-columns";

export default function FeeStructureDetailAssignments() {
	const { id } = useParams<{ id: string }>();
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { data, assignments, isLoading } = useFeeAssignments({
		feeStructureId: id!,
	});
	const columns = useMemo(
		() => getFeeAssignmentsColumns(t, { showYear: false }),
		[t],
	);

	return (
		<ListLayout
			footer={
				data && assignments.length > 0 ? (
					<p className="text-muted-foreground text-sm">
						{assignments.length} / {data.total}
					</p>
				) : undefined
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
