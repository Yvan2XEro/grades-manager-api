import type { ColumnDef } from "@tanstack/react-table";
import type { TFunction } from "i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ParticipationRow } from "../types";

export function getParticipationRosterColumns(
	t: TFunction,
	{
		isLocked,
		onOverride,
	}: { isLocked: boolean; onOverride: (row: ParticipationRow) => void },
): ColumnDef<ParticipationRow>[] {
	const columns: ColumnDef<ParticipationRow>[] = [
		{
			id: "student",
			header: t("admin.examParticipation.columns.student"),
			cell: ({ row: { original: row } }) => (
				<>
					{row.studentName ?? "—"}
					{row.exempted && (
						<Badge variant="outline" className="ml-2 text-[10px]">
							{t("admin.examParticipation.exempted")}
						</Badge>
					)}
				</>
			),
		},
		{
			id: "regNumber",
			header: t("admin.examParticipation.columns.regNumber"),
			cell: ({ row }) => (
				<span className="font-mono text-muted-foreground text-xs">
					{row.original.studentRegistrationNumber ?? "—"}
				</span>
			),
		},
		{
			id: "eligible",
			header: () => (
				<span className="block text-center">
					{t("admin.examParticipation.columns.eligible")}
				</span>
			),
			cell: ({ row }) => (
				<div className="text-center">
					{row.original.eligible ? (
						<Badge variant="default" className="text-xs">
							{t("admin.examParticipation.yes")}
						</Badge>
					) : (
						<Badge variant="destructive" className="text-xs">
							{t("admin.examParticipation.no")}
						</Badge>
					)}
				</div>
			),
		},
		{
			id: "reason",
			header: t("admin.examParticipation.columns.reason"),
			cell: ({ row }) => (
				<p className="max-w-xs truncate text-muted-foreground text-xs">
					{row.original.reason ?? "—"}
				</p>
			),
		},
	];
	if (!isLocked) {
		columns.push({
			id: "actions",
			header: () => (
				<span className="block text-right">
					{t("admin.examParticipation.columns.actions")}
				</span>
			),
			cell: ({ row }) => (
				<div className="text-right">
					<Button
						size="sm"
						variant="ghost"
						className="h-7 text-xs"
						onClick={() => onOverride(row.original)}
					>
						{t("admin.examParticipation.override")}
					</Button>
				</div>
			),
		});
	}
	return columns;
}
