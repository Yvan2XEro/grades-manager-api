import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { TeachingUnitFormFields } from "../../components/teaching-unit-form-fields";
import { useTeachingUnitForm } from "../../hooks/use-teaching-unit-form";

export default function TeachingUnitDetailDetails() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { teachingUnitId } = useParams<{ teachingUnitId: string }>();
	const controller = useTeachingUnitForm(teachingUnitId!);
	const { form, isCreateMode, isPending, onSubmit } = controller;

	return (
		<Card>
			<CardContent>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<TeachingUnitFormFields controller={controller} />
						<div className="flex justify-end gap-2 pt-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => navigate("/programs/teaching-units")}
							>
								{t("common.actions.cancel")}
							</Button>
							<Button type="submit" disabled={isPending}>
								{isPending
									? t("common.actions.saving", { defaultValue: "Saving..." })
									: isCreateMode
										? t("common.actions.create", { defaultValue: "Create" })
										: t("common.actions.saveChanges")}
							</Button>
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}
