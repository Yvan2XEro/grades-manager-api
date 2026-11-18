import { useTranslation } from "react-i18next";
import { StatusStepper } from "@/components/ui/status-stepper";

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
