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
						{t("admin.centers.sections.logos", { defaultValue: "Logos" })}
					</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-4 md:grid-cols-3">
					<CenterLogoField
						form={form}
						urlName="logoUrl"
						svgName="logoSvg"
						label={t("admin.centers.form.logoUrl", {
							defaultValue: "Logo du centre",
						})}
						description={t("admin.centers.form.logoUrlHint", {
							defaultValue: "Affiché dans les en-têtes.",
						})}
						svgLabel={t("admin.centers.form.logoSvg", {
							defaultValue: "…ou code SVG (prioritaire)",
						})}
					/>
					<CenterLogoField
						form={form}
						urlName="adminInstanceLogoUrl"
						svgName="adminInstanceLogoSvg"
						label={t("admin.centers.form.adminInstanceLogoUrl", {
							defaultValue: "Logo de l'instance administrative (ex: MINEFOP)",
						})}
						description={t("admin.centers.form.adminInstanceLogoUrlHint", {
							defaultValue: "Logo principal de l'autorité de tutelle.",
						})}
						svgLabel={t("admin.centers.form.adminInstanceLogoSvg", {
							defaultValue: "…ou code SVG (prioritaire)",
						})}
					/>
					<CenterLogoField
						form={form}
						urlName="watermarkLogoUrl"
						svgName="watermarkLogoSvg"
						label={t("admin.centers.form.watermarkLogoUrl", {
							defaultValue: "Logo de fond (watermark)",
						})}
						description={t("admin.centers.form.watermarkLogoUrlHint", {
							defaultValue: "Logo affiché en filigrane sur les documents.",
						})}
						svgLabel={t("admin.centers.form.watermarkLogoSvg", {
							defaultValue: "…ou code SVG (prioritaire)",
						})}
					/>
				</CardContent>
			</Card>
			<CenterSaveButton />
		</div>
	);
}
