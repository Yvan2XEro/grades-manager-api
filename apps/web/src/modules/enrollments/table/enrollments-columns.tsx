import type { ColumnDef } from "@tanstack/react-table";
import type { TFunction } from "i18next";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/date-format";
import type { EnrollmentRow } from "../types";

export const enrollmentStudentName = (row: EnrollmentRow, t: TFunction) =>
	row.student
		? `${row.student.profile.firstName} ${row.student.profile.lastName}`
		: t("admin.enrollments.fields.unknownStudent");

export function getEnrollmentsColumns(
	t: TFunction,
	onOpenRoster: (row: EnrollmentRow) => void,
): ColumnDef<EnrollmentRow>[] {
	return [
		{
			id: "student",
			header: t("admin.enrollments.fields.student"),
			cell: ({ row: { original: enrollment } }) => (
				<div className="space-y-0.5">
					<p className="font-semibold text-foreground">
						{enrollmentStudentName(enrollment, t)}
					</p>
					<p className="text-muted-foreground text-xs">
						{enrollment.student?.registrationNumber ??
							t("admin.enrollments.fields.registrationFallback", {
								value: enrollment.studentId,
							})}
					</p>
				</div>
			),
		},
		{
			id: "status",
			header: t("admin.enrollments.fields.status"),
			cell: ({ row }) => (
				<span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 font-medium text-foreground text-xs">
					{t("admin.enrollments.fields.statusValue", {
						value: row.original.status,
					})}
				</span>
			),
		},
		{
			id: "dates",
			header: t("admin.enrollments.fields.dates"),
			cell: ({ row: { original: enrollment } }) => (
				<div className="text-muted-foreground text-sm">
					<p>
						{t("admin.enrollments.fields.enrolledAt", {
							value: enrollment.enrolledAt
								? formatDate(enrollment.enrolledAt)
								: t("common.labels.notAvailable"),
						})}
					</p>
					{enrollment.exitedAt && (
						<p>
							{t("admin.enrollments.fields.exitedAt", {
								value: formatDate(enrollment.exitedAt),
							})}
						</p>
					)}
				</div>
			),
		},
		{
			id: "actions",
			header: () => (
				<div className="text-right">
					{t("admin.enrollments.fields.actions")}
				</div>
			),
			cell: ({ row }) => (
				<div className="text-right">
					<Button
						type="button"
						size="sm"
						variant="secondary"
						onClick={() => onOpenRoster(row.original)}
					>
						{t("admin.enrollments.courseRoster.openModalBtn")}
					</Button>
				</div>
			),
		},
	];
}
