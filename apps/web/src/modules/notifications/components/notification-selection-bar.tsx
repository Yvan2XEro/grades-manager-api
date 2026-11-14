import { RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export function NotificationSelectionBar({
	selectedCount,
	onClear,
	onFlush,
	isFlushing,
}: {
	selectedCount: number;
	onClear: () => void;
	onFlush: () => void;
	isFlushing: boolean;
}) {
	const { t } = useTranslation();
	if (selectedCount === 0) return null;
	return (
		<div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-2.5">
			<span className="font-medium text-sm">
				{t("admin.notifications.selected", {
					count: selectedCount,
				})}
			</span>
			<div className="ml-auto flex items-center gap-2">
				<Button
					variant="ghost"
					size="sm"
					onClick={onClear}
					className="h-7 text-xs"
				>
					{t("admin.notifications.deselect")}
				</Button>
				<Button
					variant="outline"
					size="sm"
					onClick={onFlush}
					disabled={isFlushing}
					className="h-7 gap-1.5 text-xs"
				>
					<RefreshCw className="h-3.5 w-3.5" />
					{t("admin.notifications.actions.flush", {
						defaultValue: "Flush",
					})}
				</Button>
			</div>
		</div>
	);
}
