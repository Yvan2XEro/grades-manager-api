import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

/** "Select all" checkbox and bulk approval of the selected exams. */
export function ExamApprovalsSelectBar({
	allSelected,
	selectedCount,
	onToggleAll,
	onApprove,
	isApproving,
}: {
	allSelected: boolean;
	selectedCount: number;
	onToggleAll: (checked: boolean) => void;
	onApprove: () => void;
	isApproving: boolean;
}) {
	const { t } = useTranslation();
	return (
		<div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-2.5">
			<div className="flex items-center gap-2">
				<Checkbox
					checked={allSelected}
					onCheckedChange={(checked) => onToggleAll(Boolean(checked))}
				/>
				<span className="text-muted-foreground text-sm">
					{selectedCount > 0
						? t("common.selectedCount", { count: selectedCount })
						: t("common.selectAll")}
				</span>
			</div>
			{selectedCount > 0 && (
				<Button size="sm" onClick={onApprove} disabled={isApproving}>
					<Check className="mr-1 h-3.5 w-3.5" />
					{t("dean.approvals.approveSelection", {
						count: selectedCount,
					})}
				</Button>
			)}
		</div>
	);
}
