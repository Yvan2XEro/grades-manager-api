import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { HubLayout } from "@/components/layouts/ListLayout";
import { HubNav } from "@/components/navigation/HubNav";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Spinner } from "@/components/ui/spinner";
import { CenterContext } from "../../hooks/use-center-context";
import { useCenterForm } from "../../hooks/use-center-form";
import { CENTERS_PATH } from "../../paths";

const TABS = [
	{ path: "identity", labelKey: "admin.centers.tabs.identity" },
	{ path: "logos", labelKey: "admin.centers.tabs.logos" },
	{ path: "instances", labelKey: "admin.centers.tabs.instances" },
	{ path: "authorization", labelKey: "admin.centers.tabs.authorization" },
	{ path: "contact", labelKey: "admin.centers.tabs.contact" },
] as const;

/** Edit page of a center: its tabs share one form through `CenterContext`. */
export default function CenterDetailLayout() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { centerId } = useParams<{ centerId: string }>();
	const { form, centerQuery, isSaving, onSubmit } = useCenterForm(centerId);

	if (centerQuery.isLoading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<Spinner />
			</div>
		);
	}

	return (
		<CenterContext.Provider value={{ form, isSaving, onSubmit }}>
			<Form {...form}>
				<HubLayout>
					<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<h1 className="text-foreground">
								{centerQuery.data?.name ?? ""}
							</h1>
							<p className="mt-0.5 text-muted-foreground text-xs">
								{t("admin.centers.detail.subtitle", {
									defaultValue:
										"Configurez les centres de formation professionnelle",
								})}
							</p>
						</div>
						<Button
							type="button"
							variant="ghost"
							onClick={() => navigate(CENTERS_PATH)}
						>
							<ArrowLeft className="mr-2 h-4 w-4" />
							{t("admin.centers.detail.backToList", {
								defaultValue: "Retour à la liste",
							})}
						</Button>
					</div>
					<HubNav tabs={TABS} basePath={`${CENTERS_PATH}/${centerId}`} />
				</HubLayout>
			</Form>
		</CenterContext.Provider>
	);
}
