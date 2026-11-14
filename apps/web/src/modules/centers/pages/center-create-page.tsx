import { ArrowLeft, Save } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { CenterIdentityFields } from "../components/center-identity-fields";
import { useCenterForm } from "../hooks/use-center-form";

/** Creates a center from its identity; the other tabs open once it is saved. */
export default function CenterCreatePage() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { form, isSaving, onSubmit } = useCenterForm();

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-12">
				<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="text-foreground">
							{t("admin.centers.detail.title", {
								defaultValue: "Gestion des Centres",
							})}
						</h1>
					</div>
					<div className="flex gap-2">
						<Button
							type="button"
							variant="ghost"
							onClick={() => navigate("/centers")}
						>
							<ArrowLeft className="mr-2 h-4 w-4" />
							{t("admin.centers.detail.backToList", {
								defaultValue: "Retour à la liste",
							})}
						</Button>
						<Button type="submit" disabled={isSaving}>
							<Save className="mr-2 h-4 w-4" />
							{t("common.actions.save", { defaultValue: "Enregistrer" })}
						</Button>
					</div>
				</div>
				<CenterIdentityFields form={form} />
			</form>
		</Form>
	);
}
