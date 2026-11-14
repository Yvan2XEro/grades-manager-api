import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";
import { StudyCycleFormFields } from "../../components/study-cycle-form-fields";
import {
	type StudyCycleFormData,
	studyCycleToFormValues,
	useStudyCycleForm,
} from "../../hooks/use-study-cycle-form";
import { useStudyCycle } from "../../hooks/use-study-cycles";

export default function StudyCycleDetailDetails() {
	const { cycleId } = useParams<{ cycleId: string }>();
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const { data: cycle } = useStudyCycle(cycleId!);
	const { form } = useStudyCycleForm();

	useEffect(() => {
		if (cycle) form.reset(studyCycleToFormValues(cycle));
	}, [cycle, form]);

	const updateMutation = useMutation({
		mutationFn: (data: StudyCycleFormData) =>
			trpcClient.studyCycles.updateCycle.mutate({ id: cycleId!, ...data }),
		onSuccess: () => {
			toast.success(
				t("admin.studyCycles.toast.updateSuccess", {
					defaultValue: "Study cycle updated",
				}),
			);
			queryClient.invalidateQueries(
				trpc.studyCycles.getCycle.queryOptions({ id: cycleId! }),
			);
			queryClient.invalidateQueries(trpc.studyCycles.listPaged.queryKey());
		},
		onError: (err: Error) => toast.error(err.message),
	});

	return (
		<Card>
			<CardContent className="pt-6">
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit((data) => updateMutation.mutate(data))}
						className="space-y-4"
					>
						<StudyCycleFormFields form={form} />
						<div className="flex justify-end pt-2">
							<Button type="submit" disabled={updateMutation.isPending}>
								{updateMutation.isPending
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
