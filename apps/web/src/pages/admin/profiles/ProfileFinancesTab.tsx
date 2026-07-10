import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { trpcClient } from "@/utils/trpc";
import { useProfileContext } from "./ProfileContext";

const statusVariants: Record<
	string,
	"default" | "secondary" | "destructive" | "outline"
> = {
	paid: "default",
	partial: "secondary",
	unpaid: "destructive",
	waived: "outline",
};

export default function ProfileFinancesTab() {
	const { profileId } = useProfileContext();
	const { t } = useTranslation();

	const { data, isLoading } = useQuery({
		queryKey: ["profiles", profileId, "finances"],
		queryFn: () => trpcClient.profiles.finances.query({ profileId }),
	});

	if (isLoading) return <TableSkeleton columns={4} rows={3} />;

	const assignments = data ?? [];

	if (!assignments.length) {
		return (
			<div className="py-12 text-center text-muted-foreground">
				{t("profileHub.finances.empty")}
			</div>
		);
	}

	return (
		<div className="pt-6">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>{t("profileHub.finances.academicYear")}</TableHead>
						<TableHead className="text-right">
							{t("profileHub.finances.amount")}
						</TableHead>
						<TableHead className="text-right">
							{t("profileHub.finances.discount")}
						</TableHead>
						<TableHead>{t("profileHub.finances.status")}</TableHead>
						<TableHead>{t("profileHub.finances.clearedAt")}</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{assignments.map((assignment) => (
						<TableRow key={assignment.id}>
							<TableCell className="font-medium">
								{assignment.academicYearName}
							</TableCell>
							<TableCell className="text-right">
								{Number(assignment.effectiveAmount).toLocaleString()}{" "}
								{assignment.currency}
							</TableCell>
							<TableCell className="text-right">
								{Number(assignment.discountAmount) > 0
									? `${Number(assignment.discountAmount).toLocaleString()} ${assignment.currency}`
									: "—"}
							</TableCell>
							<TableCell>
								<Badge
									variant={statusVariants[assignment.status] ?? "secondary"}
								>
									{t(`feeClearance.assignmentStatus.${assignment.status}`, {
										defaultValue: assignment.status,
									})}
								</Badge>
							</TableCell>
							<TableCell>
								{assignment.clearedAt
									? new Date(assignment.clearedAt).toLocaleDateString()
									: "—"}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
