import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { ProgramDetailsFields } from "../../components/program-details-fields";
import { useProgramContext } from "../../hooks/use-program-context";
import { useProgramDetailsForm } from "../../hooks/use-program-details-form";

export default function ProgramDetailDetails() {
	const { t } = useTranslation();
	const { programId } = useParams<{ programId: string }>();
	const { program, refetch } = useProgramContext();
	const controller = useProgramDetailsForm(programId!, program, refetch);
	const { form, update } = controller;

	return (
		<Card>
			<CardContent className="pt-6">
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit((data) => update.mutate(data))}
						className="space-y-6"
					>
						<ProgramDetailsFields controller={controller} />
						<div className="flex justify-end pt-2">
							<Button type="submit" disabled={update.isPending}>
								{update.isPending
									? t("common.actions.saving", { defaultValue: "Saving..." })
									: t("common.actions.saveChanges")}
							</Button>
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}
