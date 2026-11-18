import { ArrowLeft, ClipboardList, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { getStudentName } from "../services/fee-format";
import type { FeeAssignment } from "../types";
import { CreateOrderDialog } from "./create-order-dialog";
import { ExemptWithNotesDialog } from "./exempt-with-notes-dialog";
import { RecordPaymentDialog } from "./record-payment-dialog";

/** Student name, structure and the actions available on an open assignment. */
export function AssignmentDetailHeader({
	assignment,
	balance,
	onChanged,
}: {
	assignment: FeeAssignment;
	balance: number;
	onChanged: () => void;
}) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const isOpen = assignment.status !== "paid" && assignment.status !== "exempt";
	const installments = assignment.feeStructure?.installments ?? [];
	const studentId = assignment.student?.id;

	return (
		<div className="flex items-center gap-3">
			<Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
				<ArrowLeft className="h-4 w-4" />
			</Button>
			<div>
				<h2 className="font-semibold text-xl">{getStudentName(assignment)}</h2>
				<p className="text-muted-foreground text-sm">
					{assignment.feeStructure?.name} — {assignment.academicYear?.name}
				</p>
			</div>
			<div className="ml-auto flex gap-2">
				{studentId && (
					<Button
						variant="ghost"
						size="sm"
						onClick={() =>
							navigate(`/fee-clearance/students/${studentId}/history`)
						}
					>
						{t("feeClearance.history.viewHistory")}
					</Button>
				)}
				{isOpen && (
					<>
						<Button
							variant="outline"
							onClick={() =>
								ExemptWithNotesDialog.call({
									assignmentId: assignment.id,
									onDone: onChanged,
								})
							}
						>
							{t("feeClearance.assignments.exempt")}
						</Button>
						<Button
							variant="outline"
							onClick={() =>
								CreateOrderDialog.call({
									feeAssignmentId: assignment.id,
									balance,
									currency: assignment.currency,
									installments,
									onCreated: onChanged,
								})
							}
						>
							<ClipboardList className="mr-2 h-4 w-4" />
							{t("feeClearance.orders.create")}
						</Button>
						<Button
							onClick={() =>
								RecordPaymentDialog.call({
									feeAssignmentId: assignment.id,
									installments,
									onRecorded: onChanged,
								})
							}
						>
							<Plus className="mr-2 h-4 w-4" />
							{t("feeClearance.payments.record")}
						</Button>
					</>
				)}
			</div>
		</div>
	);
}
