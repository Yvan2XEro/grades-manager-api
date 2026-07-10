import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { Badge } from "@/components/ui/badge";
import {
	Empty,
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
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { trpc } from "@/utils/trpc";

const statusVariants: Record<
	string,
	"default" | "secondary" | "destructive" | "outline"
> = {
	unpaid: "destructive",
	partial: "outline",
	paid: "default",
	exempt: "secondary",
};

const statusIcons: Record<string, React.ReactNode> = {
	paid: <CheckCircle2 className="mr-1 h-3 w-3" />,
	partial: <Clock className="mr-1 h-3 w-3" />,
	unpaid: <XCircle className="mr-1 h-3 w-3" />,
	exempt: <CheckCircle2 className="mr-1 h-3 w-3" />,
};

export default function FeeStructureAssignmentsTab() {
	const { id } = useParams<{ id: string }>();
	const { t } = useTranslation();
	const navigate = useNavigate();

	const { data, isLoading } = useQuery(
		trpc.feeClearance.listAssignments.queryOptions({
			feeStructureId: id!,
			limit: 200,
			offset: 0,
		}),
	);

	const formatAmount = (amount: string | null, currency: string) =>
		amount ? `${Number(amount).toLocaleString()} ${currency}` : "—";

	const getStudentName = (assignment: {
		student?: {
			profile?: { firstName: string; lastName: string } | null;
		} | null;
	}) => {
		const p = assignment.student?.profile;
		return p ? `${p.firstName} ${p.lastName}` : "—";
	};

	if (isLoading) {
		return <TableSkeleton columns={4} rows={5} />;
	}

	if (!data?.items?.length) {
		return (
			<Empty>
				<EmptyMedia />
				<EmptyHeader>
					<EmptyTitle>{t("feeClearance.assignments.empty.title")}</EmptyTitle>
					<EmptyDescription>
						{t("feeClearance.assignments.empty.description")}
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		);
	}

	return (
		<div className="space-y-3 pt-6">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>
							{t("feeClearance.assignments.fields.student")}
						</TableHead>
						<TableHead>
							{t("feeClearance.assignments.fields.effectiveAmount")}
						</TableHead>
						<TableHead>{t("feeClearance.assignments.fields.status")}</TableHead>
						<TableHead>
							{t("feeClearance.assignments.fields.clearedAt")}
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{data.items.map((a) => (
						<TableRow
							key={a.id}
							className="cursor-pointer"
							onClick={() =>
								navigate(`/admin/fee-clearance/assignments/${a.id}`)
							}
						>
							<TableCell className="font-medium">{getStudentName(a)}</TableCell>
							<TableCell>
								{formatAmount(a.effectiveAmount, a.currency)}
							</TableCell>
							<TableCell>
								<Badge variant={statusVariants[a.status]}>
									{statusIcons[a.status]}
									{t(`feeClearance.assignments.status.${a.status}`)}
								</Badge>
							</TableCell>
							<TableCell>
								{a.clearedAt
									? format(new Date(a.clearedAt), "dd/MM/yyyy")
									: "—"}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
			<p className="text-muted-foreground text-sm">
				{data.items.length} / {data.total}
			</p>
		</div>
	);
}
