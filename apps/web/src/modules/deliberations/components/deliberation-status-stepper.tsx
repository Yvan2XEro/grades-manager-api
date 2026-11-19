import { useTranslation } from "react-i18next";
import { StatusStepper } from "@/components/ui/status-stepper";
import { cn } from "@/lib/utils";

/** draft → open → closed → signed, with `currentStatus` highlighted. */
export function DeliberationStatusStepper({
	currentStatus,
}: {
	currentStatus: string;
}) {
	const { t } = useTranslation();
	return (
		<StatusStepper
			steps={[
				{ key: "draft", label: t("admin.deliberations.status.draft") },
				{ key: "open", label: t("admin.deliberations.status.open") },
				{ key: "closed", label: t("admin.deliberations.status.closed") },
				{ key: "signed", label: t("admin.deliberations.status.signed") },
			]}
			currentStatus={currentStatus}
		/>
	);
}

const STATUS_ORDER = ["draft", "open", "closed", "signed"] as const;

/**
 * Compact progress of one deliberation (list rows): four segments filled up
 * to its status, followed by the status label.
 */
export function DeliberationStatusProgress({ status }: { status: string }) {
	const { t } = useTranslation();
	const index = STATUS_ORDER.indexOf(status as (typeof STATUS_ORDER)[number]);
	const label = t(
		`admin.deliberations.status.${status as (typeof STATUS_ORDER)[number]}`,
	);
	return (
		<div
			className="flex items-center gap-2"
			title={t("admin.deliberations.statusProgress", {
				step: index + 1,
				total: STATUS_ORDER.length,
				status: label,
			})}
		>
			<div className="flex gap-0.5" aria-hidden="true">
				{STATUS_ORDER.map((s, i) => (
					<span
						key={s}
						className={cn(
							"h-1.5 w-4 rounded-full",
							i <= index
								? status === "signed"
									? "bg-emerald-500"
									: "bg-primary"
								: "bg-border",
						)}
					/>
				))}
			</div>
			<span className="font-medium text-xs">{label}</span>
		</div>
	);
}
