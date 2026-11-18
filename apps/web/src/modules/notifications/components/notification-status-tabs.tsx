import { Filter } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { STATUS_TAB_KEYS } from "../services/delivery-status";
import type { StatusFilter } from "../types";

export function NotificationStatusTabs({
	statusFilter,
	onChange,
	total,
}: {
	statusFilter: StatusFilter;
	onChange: (status: StatusFilter) => void;
	total: number;
}) {
	const { t } = useTranslation();
	return (
		<div className="flex items-center gap-1 border-b">
			{STATUS_TAB_KEYS.map((key) => (
				<button
					key={key}
					type="button"
					onClick={() => onChange(key)}
					className={cn(
						"relative px-4 py-2.5 font-medium text-sm transition-colors",
						statusFilter === key
							? "text-primary after:absolute after:right-0 after:bottom-0 after:left-0 after:h-0.5 after:rounded-full after:bg-primary"
							: "text-muted-foreground hover:text-foreground",
					)}
				>
					{key === "all"
						? t("common.all")
						: t(`admin.notifications.status.${key}`)}
				</button>
			))}

			<div className="ml-auto flex items-center gap-2 pb-1">
				<span className="flex items-center gap-1.5 text-muted-foreground text-xs">
					<Filter className="h-3.5 w-3.5" />
					{t("admin.notifications.results", { count: total })}
				</span>
			</div>
		</div>
	);
}
