import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CenterLogoField } from "../../components/center-logo-field";
import { CenterSaveButton } from "../../components/center-save-button";
import { useCenterContext } from "../../hooks/use-center-context";

export default function CenterDetailLogos() {
	const { t } = useTranslation();
	const { form } = useCenterContext();

	return (
		<div className="space-y-6 pt-6 pb-12">
			<Card>
				<CardHeader>
					<CardTitle className="text-sm">
						{t("admin.centers.sections.logos")}
					</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-4 md:grid-cols-3">
					<CenterLogoField
						form={form}
						urlName="logoUrl"
						svgName="logoSvg"
						label={t("admin.centers.form.logoUrl")}
						description={t("admin.centers.form.logoUrlHint")}
						svgLabel={t("admin.centers.form.logoSvg")}
					/>
					<CenterLogoField
						form={form}
						urlName="adminInstanceLogoUrl"
						svgName="adminInstanceLogoSvg"
						label={t("admin.centers.form.adminInstanceLogoUrl")}
						description={t("admin.centers.form.adminInstanceLogoUrlHint")}
						svgLabel={t("admin.centers.form.adminInstanceLogoSvg")}
					/>
					<CenterLogoField
						form={form}
						urlName="watermarkLogoUrl"
						svgName="watermarkLogoSvg"
						label={t("admin.centers.form.watermarkLogoUrl")}
						description={t("admin.centers.form.watermarkLogoUrlHint")}
						svgLabel={t("admin.centers.form.watermarkLogoSvg")}
					/>
				</CardContent>
			</Card>
			<CenterSaveButton />
		</div>
	);
}
