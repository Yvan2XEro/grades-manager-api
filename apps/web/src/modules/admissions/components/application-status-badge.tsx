import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { APPLICATION_STATUS_COLORS } from "../services/application-status";

export function ApplicationStatusBadge({
	status,
	className,
}: {
	status: string;
	className?: string;
}) {
	const { t } = useTranslation();
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full px-2 py-0.5 font-medium text-xs",
				APPLICATION_STATUS_COLORS[status] ?? "bg-muted text-muted-foreground",
				className,
			)}
		>
			{t(`admissions.statuses.${status}`)}
		</span>
	);
}
