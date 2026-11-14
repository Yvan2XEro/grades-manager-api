import { format } from "date-fns";
import { CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { FinancialHistoryEntry } from "../types";
import { AssignmentStatusBadge, OrderStatusBadge } from "./status-badges";

/** One academic year of a student's financial history: orders and payments. */
export function FinancialHistoryCard({
	assignment: a,
}: {
	assignment: FinancialHistoryEntry;
}) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	return (
		<div className="rounded-lg border">
			<div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2">
				<div>
					<span className="font-semibold">{a.academicYear?.name ?? "—"}</span>
					<span className="ml-2 text-muted-foreground text-sm">
						{a.feeStructure?.name}
					</span>
				</div>
				<div className="flex items-center gap-2">
					<AssignmentStatusBadge status={a.status} />
					<Button
						variant="outline"
						size="sm"
						onClick={() => navigate(`/fee-clearance/assignments/${a.id}`)}
					>
						{t("feeClearance.history.viewDetail")}
					</Button>
				</div>
			</div>

			{/* Orders */}
			{a.orders.length > 0 && (
				<div className="border-b px-4 py-3">
					<p className="mb-2 font-medium text-sm">
						{t("feeClearance.orders.title")}
					</p>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>
									{t("feeClearance.orders.fields.reference")}
								</TableHead>
								<TableHead>{t("feeClearance.orders.fields.amount")}</TableHead>
								<TableHead>{t("feeClearance.orders.fields.status")}</TableHead>
								<TableHead>
									{t("feeClearance.orders.fields.createdAt")}
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{a.orders.map((o) => (
								<TableRow key={o.id}>
									<TableCell className="font-mono text-xs">
										{o.reference ?? "—"}
									</TableCell>
									<TableCell className="font-medium">
										{Number(o.amount).toLocaleString()} {a.currency}
									</TableCell>
									<TableCell>
										<OrderStatusBadge status={o.status} />
									</TableCell>
									<TableCell className="text-sm">
										{format(new Date(o.createdAt), "dd/MM/yyyy")}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}

			{/* Payments */}
			{a.payments.length > 0 && (
				<div className="px-4 py-3">
					<p className="mb-2 font-medium text-sm">
						{t("feeClearance.payments.title")}
					</p>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>
									{t("feeClearance.payments.fields.reference")}
								</TableHead>
								<TableHead>
									{t("feeClearance.payments.fields.amount")}
								</TableHead>
								<TableHead>
									{t("feeClearance.payments.fields.paymentMethod")}
								</TableHead>
								<TableHead>
									{t("feeClearance.payments.fields.paymentDate")}
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{a.payments.map((p) => (
								<TableRow key={p.id}>
									<TableCell className="font-mono text-xs">
										{p.reference ?? "—"}
									</TableCell>
									<TableCell className="font-medium text-green-600">
										{Number(p.amount).toLocaleString()} {a.currency}
									</TableCell>
									<TableCell>
										{t(`feeClearance.payments.methods.${p.paymentMethod}`)}
									</TableCell>
									<TableCell className="text-sm">
										{format(new Date(p.paymentDate), "dd/MM/yyyy")}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}

			{a.orders.length === 0 && a.payments.length === 0 && (
				<p className="px-4 py-3 text-muted-foreground text-sm">
					{t("feeClearance.history.noEvents")}
				</p>
			)}

			{/* Cleared timestamp */}
			{a.clearedAt && (
				<div className="flex items-center gap-1 border-t px-4 py-2 text-green-600 text-xs">
					<CheckCircle className="h-3 w-3" />
					{t("feeClearance.quitus.clearedOn", {
						date: format(new Date(a.clearedAt), "dd/MM/yyyy HH:mm"),
					})}
				</div>
			)}
		</div>
	);
}
