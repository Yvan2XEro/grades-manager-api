import { Plus, Trash2 } from "lucide-react";
import { useFieldArray } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CenterInstanceFields } from "../../components/center-instance-fields";
import { CenterSaveButton } from "../../components/center-save-button";
import { useCenterContext } from "../../hooks/use-center-context";

export default function CenterDetailInstances() {
	const { t } = useTranslation();
	const { form } = useCenterContext();

	const instances = useFieldArray({
		control: form.control,
		name: "administrativeInstances",
	});

	return (
		<div className="space-y-6 pt-6 pb-12">
			<Card>
				<CardHeader className="flex-row items-center justify-between">
					<CardTitle className="text-sm">
						{t("admin.centers.sections.adminInstances", {
							defaultValue: "Instances Administratives",
						})}
					</CardTitle>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() =>
							instances.append({
								nameFr: "",
								nameEn: "",
								acronymFr: "",
								acronymEn: "",
								logoUrl: "",
								logoSvg: "",
								showOnTranscripts: true,
								showOnCertificates: true,
							})
						}
					>
						<Plus className="mr-1.5 h-3.5 w-3.5" />
						{t("admin.centers.actions.addInstance", {
							defaultValue: "Ajouter une instance",
						})}
					</Button>
				</CardHeader>
				<CardContent className="space-y-4">
					{instances.fields.length === 0 ? (
						<p className="rounded-md border border-dashed p-6 text-center text-muted-foreground text-sm">
							{t("admin.centers.adminInstances.empty", {
								defaultValue:
									"Aucune instance administrative — cliquez sur Ajouter pour en créer.",
							})}
						</p>
					) : (
						instances.fields.map((field, index) => (
							<div
								key={field.id}
								className="space-y-4 rounded-md border bg-muted/20 p-4"
							>
								<div className="flex items-center justify-between">
									<p className="font-medium text-sm">
										{t("admin.centers.adminInstances.itemTitle", {
											defaultValue: "Instance #{{n}}",
											n: index + 1,
										})}
									</p>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										onClick={() => instances.remove(index)}
									>
										<Trash2 className="h-4 w-4 text-destructive" />
									</Button>
								</div>
								<CenterInstanceFields form={form} index={index} />
							</div>
						))
					)}
				</CardContent>
			</Card>
			<CenterSaveButton />
		</div>
	);
}
