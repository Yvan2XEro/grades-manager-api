import { Save } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useCenterContext } from "../hooks/use-center-context";

/** Saves the whole center form from any tab of the detail page. */
export function CenterSaveButton() {
	const { t } = useTranslation();
	const { form, isSaving, onSubmit } = useCenterContext();
	return (
		<div className="flex justify-end">
			<Button
				type="button"
				disabled={isSaving}
				onClick={form.handleSubmit(onSubmit)}
			>
				<Save className="mr-2 h-4 w-4" />
				{t("common.actions.save", { defaultValue: "Enregistrer" })}
			</Button>
		</div>
	);
}
