import { useTranslation } from "react-i18next";
import { HubLayout } from "@/components/layouts/ListLayout";
import { HubNav } from "@/components/navigation/HubNav";
import { PageHeader } from "@/components/ui/page-header";

const tabs = [
	{ path: "structures", labelKey: "feeClearance.structures.title" },
	{ path: "assignments", labelKey: "feeClearance.assignments.title" },
	{ path: "gating", labelKey: "feeClearance.gating.title" },
] as const;

export default function FeeClearanceLayout() {
	const { t } = useTranslation();
	return (
		<HubLayout>
			<PageHeader
				title={t("feeClearance.title")}
				description={t("feeClearance.subtitle")}
			/>
			<HubNav tabs={tabs} basePath="/fee-clearance" />
		</HubLayout>
	);
}
