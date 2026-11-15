import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { BulkAssignPreview } from "../types";

/** Students a bulk assignment would reach, and how many are skipped. */
export function BulkAssignPreviewPanel({
	preview,
}: {
	preview: Pick<BulkAssignPreview, "toAssign" | "alreadyAssignedCount">;
}) {
	const { t } = useTranslation();
	const hasNew = preview.toAssign.length > 0;
	const hasSkipped = preview.alreadyAssignedCount > 0;

	return (
		<div className="space-y-3">
			<div className="flex items-center gap-4 text-sm">
				<span className="flex items-center gap-1 text-emerald-700">
					<CheckCircle2 className="h-3.5 w-3.5" />
					<strong>{preview.toAssign.length}</strong>{" "}
					{t("feeClearance.bulkAssign.toAssign")}
				</span>
				{hasSkipped && (
					<span className="flex items-center gap-1 text-muted-foreground">
						<AlertCircle className="h-3.5 w-3.5" />
						{t("feeClearance.bulkAssign.alreadyAssigned", {
							count: preview.alreadyAssignedCount,
						})}
					</span>
				)}
			</div>

			{hasNew && (
				<div className="max-h-48 overflow-y-auto rounded border bg-background">
					<table className="w-full text-xs">
						<thead className="sticky top-0 bg-muted/80">
							<tr>
								<th className="px-2 py-1.5 text-left font-medium">
									{t("feeClearance.bulkAssign.col.student")}
								</th>
								<th className="px-2 py-1.5 text-left font-medium">
									{t("feeClearance.bulkAssign.col.registration")}
								</th>
								<th className="px-2 py-1.5 text-right font-medium">
									{t("feeClearance.bulkAssign.col.amount")}
								</th>
							</tr>
						</thead>
						<tbody>
							{preview.toAssign.map((s) => (
								<tr key={s.studentId} className="border-t">
									<td className="px-2 py-1">
										{s.firstName} {s.lastName}
									</td>
									<td className="px-2 py-1 text-muted-foreground">
										{s.registrationNumber}
									</td>
									<td className="px-2 py-1 text-right tabular-nums">
										{Number(s.amount).toLocaleString()} {s.currency}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{!hasNew && (
				<p className="text-muted-foreground text-sm">
					{t("feeClearance.bulkAssign.allAssigned")}
				</p>
			)}
		</div>
	);
}
