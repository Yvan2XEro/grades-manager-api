import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CenterIdentityFields } from "../../components/center-identity-fields";
import { CenterSaveButton } from "../../components/center-save-button";
import { useCenterContext } from "../../hooks/use-center-context";

export default function CenterDetailIdentity() {
	const { t } = useTranslation();
	const { form } = useCenterContext();

	return (
		<div className="space-y-6 pt-6 pb-12">
			<Card>
				<CardHeader>
					<CardTitle className="text-sm">
						{t("admin.centers.sections.identity", {
							defaultValue: "Informations Générales",
						})}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<CenterIdentityFields form={form} />
				</CardContent>
			</Card>
			<CenterSaveButton />
		</div>
	);
}
