import type { ColumnDef } from "@tanstack/react-table";
import type { TFunction } from "i18next";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ClipboardCopy } from "@/components/ui/clipboard-copy";
import type { ClassRow } from "../types";

/** Name on the first line, muted detail below; both truncate with a tooltip. */
function TwoLines({ main, sub }: { main?: string; sub?: string }) {
	return (
		<div className="min-w-0 space-y-0.5">
			<p className="truncate font-medium text-sm" title={main}>
				{main}
			</p>
			{sub && (
				<p className="truncate text-muted-foreground text-xs" title={sub}>
					{sub}
				</p>
			)}
		</div>
	);
}

export function getClassesColumns(t: TFunction): ColumnDef<ClassRow>[] {
	const notAvailable = t("common.labels.notAvailable", { defaultValue: "N/A" });
	return [
		{
			id: "code",
			header: t("admin.classes.table.code", { defaultValue: "Code" }),
			meta: { className: "w-[13%]" },
			cell: ({ row }) => (
				<ClipboardCopy
					value={row.original.code}
					label={t("admin.classes.table.code", { defaultValue: "Code" })}
				/>
			),
		},
		{
			id: "name",
			header: t("admin.classes.table.classProgram", {
				defaultValue: "Class / Program",
			}),
			meta: { className: "w-[28%]" },
			cell: ({ row }) => (
				<TwoLines main={row.original.name} sub={row.original.program.name} />
			),
		},
		{
			id: "cycle",
			header: t("admin.classes.table.cycle", { defaultValue: "Cycle / level" }),
			meta: { className: "w-[20%]" },
			cell: ({ row: { original: cls } }) =>
				cls.cycle ? (
					<TwoLines
						main={cls.cycle.name}
						sub={
							cls.cycleLevel &&
							`${cls.cycleLevel.name}${cls.cycleLevel.code ? ` (${cls.cycleLevel.code})` : ""}`
						}
					/>
				) : (
					notAvailable
				),
		},
		{
			id: "option",
			header: t("admin.classes.table.optionSemester", {
				defaultValue: "Option / Semester",
			}),
			meta: { className: "w-[11%]" },
			cell: ({ row: { original: cls } }) =>
				cls.programOption ? (
					<TwoLines main={cls.programOption.name} sub={cls.semester?.name} />
				) : (
					<p className="text-muted-foreground text-xs">{notAvailable}</p>
				),
		},
		{
			id: "credits",
			header: t("admin.classes.table.credits", { defaultValue: "Credits" }),
			meta: { className: "w-[13%]" },
			cell: ({ row: { original: cls } }) => (
				<div className="flex items-center gap-1.5 whitespace-nowrap">
					<span className="font-medium text-sm">{cls.assignedCredits}</span>
					<span className="text-muted-foreground text-xs">
						/ {cls.totalCredits}
					</span>
					{cls.totalCredits > 0 && cls.assignedCredits < cls.totalCredits && (
						<Badge
							variant="outline"
							className="border-amber-500/50 bg-amber-500/10 px-1.5 py-0 text-[10px] text-amber-600 dark:text-amber-400"
						>
							-{cls.totalCredits - cls.assignedCredits}
						</Badge>
					)}
				</div>
			),
		},
		{
			id: "students",
			header: t("admin.classes.table.students"),
			meta: { className: "w-[11%]" },
			cell: ({ row }) => (
				<div className="flex items-center gap-2 whitespace-nowrap">
					<Users className="h-4 w-4" />
					<span>{row.original.studentCount}</span>
				</div>
			),
		},
	];
}
