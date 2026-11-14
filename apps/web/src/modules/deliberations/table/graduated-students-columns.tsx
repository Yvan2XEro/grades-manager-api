import type { ColumnDef } from "@tanstack/react-table";
import type { TFunction } from "i18next";
import { Badge } from "@/components/ui/badge";
import type { GraduatedStudentRow } from "../types";

function creditsProgress(earned: number, required: number) {
	const pct = Math.min(Math.round((earned / required) * 100), 100);
	return { pct, isFull: pct >= 100 };
}

function formatDate(date: Date | string | null | undefined) {
	if (!date) return "—";
	return new Intl.DateTimeFormat("fr", {
		year: "numeric",
		month: "short",
		day: "numeric",
	}).format(new Date(date));
}

function CreditsCell({ row }: { row: GraduatedStudentRow }) {
	const creditsEarned = row.creditLedger?.creditsEarned ?? 0;
	const requiredCredits =
		row.klass?.cycleLevel?.minCredits ?? row.klass?.totalCredits ?? 0;
	if (requiredCredits <= 0)
		return <span className="text-muted-foreground">—</span>;
	const { pct, isFull } = creditsProgress(creditsEarned, requiredCredits);
	return (
		<div className="flex flex-col items-center gap-1">
			<span
				className={
					isFull
						? "font-semibold text-emerald-600 text-sm dark:text-emerald-400"
						: "font-semibold text-amber-600 text-sm dark:text-amber-400"
				}
			>
				{creditsEarned}/{requiredCredits}
			</span>
			<div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
				<div
					className={`h-full rounded-full transition-all ${isFull ? "bg-emerald-500" : "bg-amber-500"}`}
					style={{ width: `${pct}%` }}
				/>
			</div>
		</div>
	);
}

export function getGraduatedStudentsColumns(
	t: TFunction,
): ColumnDef<GraduatedStudentRow>[] {
	return [
		{
			id: "student",
			header: t("admin.graduation.table.student"),
			cell: ({ row: { original } }) => (
				<span className="font-medium">
					{original.student?.profile?.lastName},{" "}
					{original.student?.profile?.firstName}
				</span>
			),
		},
		{
			id: "registration",
			header: t("admin.graduation.table.registration"),
			cell: ({ row }) => (
				<span className="font-mono text-muted-foreground text-xs">
					{row.original.student?.registrationNumber}
				</span>
			),
		},
		{
			id: "program",
			header: t("admin.graduation.table.program"),
			cell: ({ row }) => (
				<span className="text-sm">
					{row.original.klass?.programInfo?.name ?? "—"}
				</span>
			),
		},
		{
			id: "level",
			header: t("admin.graduation.table.level"),
			cell: ({ row }) =>
				row.original.klass?.cycleLevel?.code ? (
					<Badge variant="outline" className="font-mono text-xs">
						{row.original.klass.cycleLevel.code}
					</Badge>
				) : (
					<span className="text-muted-foreground">—</span>
				),
		},
		{
			id: "credits",
			header: () => (
				<div className="text-center">{t("admin.graduation.table.credits")}</div>
			),
			cell: ({ row }) => <CreditsCell row={row.original} />,
		},
		{
			id: "graduatedAt",
			header: t("admin.graduation.table.graduatedAt"),
			cell: ({ row }) => (
				<span className="text-muted-foreground text-sm">
					{formatDate(row.original.enrollment.exitedAt)}
				</span>
			),
		},
	];
}
