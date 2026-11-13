import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
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

export default function StudentFinancialHistory() {
	const { studentId } = useParams<{ studentId: string }>();
	const { t } = useTranslation();
	const navigate = useNavigate();

	const { data: history, isLoading } = useQuery(
		trpc.feeClearance.getStudentFinancialHistory.queryOptions({
			studentId: studentId!,
		}),
	);

	if (isLoading) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-8 w-64" />
				<Skeleton className="h-64 w-full" />
			</div>
		);
	}

	const totalDue = history?.reduce((s, a) => s + a.effectiveAmount, 0) ?? 0;
	const totalPaid = history?.reduce((s, a) => s + a.paidAmount, 0) ?? 0;
	const currency = history?.[0]?.currency ?? "XAF";
	const fmt = (v: number) => `${v.toLocaleString()} ${currency}`;

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<div>
					<h2 className="font-semibold text-xl">
						{t("feeClearance.history.title")}
					</h2>
					<p className="text-muted-foreground text-sm">
						{t("feeClearance.history.subtitle")}
					</p>
				</div>
			</div>

			{/* Summary strip */}
			<div className="grid grid-cols-3 gap-4 rounded-lg border p-4">
				<div>
					<p className="text-muted-foreground text-xs">
						{t("feeClearance.history.totalDue")}
					</p>
					<p className="font-bold">{fmt(totalDue)}</p>
				</div>
				<div>
					<p className="text-muted-foreground text-xs">
						{t("feeClearance.history.totalPaid")}
					</p>
					<p className="font-bold text-green-600">{fmt(totalPaid)}</p>
				</div>
				<div>
					<p className="text-muted-foreground text-xs">
						{t("feeClearance.history.balance")}
					</p>
					<p
						className={`font-bold ${totalDue - totalPaid > 0 ? "text-destructive" : "text-green-600"}`}
					>
						{fmt(totalDue - totalPaid)}
					</p>
				</div>
			</div>

			{/* Per-year breakdown */}
			{!history?.length ? (
				<p className="text-muted-foreground text-sm">
					{t("feeClearance.history.empty")}
				</p>
			) : (
				<div className="space-y-6">
					{history.map((a) => (
						<div key={a.id} className="rounded-lg border">
							<div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2">
								<div>
									<span className="font-semibold">
										{a.academicYear?.name ?? "—"}
									</span>
									<span className="ml-2 text-muted-foreground text-sm">
										{a.feeStructure?.name}
									</span>
								</div>
								<div className="flex items-center gap-2">
									<Badge variant={statusVariants[a.status]}>
										{t(`feeClearance.assignments.status.${a.status}`)}
									</Badge>
									<Button
										variant="outline"
										size="sm"
										onClick={() =>
											navigate(`/admin/fee-clearance/assignments/${a.id}`)
										}
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
												<TableHead>
													{t("feeClearance.orders.fields.amount")}
												</TableHead>
												<TableHead>
													{t("feeClearance.orders.fields.status")}
												</TableHead>
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
														<Badge
															variant={
																o.status === "confirmed"
																	? "default"
																	: o.status === "cancelled"
																		? "destructive"
																		: "outline"
															}
														>
															{t(`feeClearance.orders.status.${o.status}`)}
														</Badge>
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
														{t(
															`feeClearance.payments.methods.${p.paymentMethod}`,
														)}
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
					))}
				</div>
			)}
		</div>
	);
}
