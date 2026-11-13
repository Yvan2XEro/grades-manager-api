import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";
import { ClassFormFields } from "../../components/class-form-fields";
import { useClassContext } from "../../hooks/use-class-context";
import {
	type ClassFormData,
	toClassPayload,
	useClassForm,
} from "../../hooks/use-class-form";
import type { ClassData } from "../../types";

const toFormValues = (cls: ClassData) => ({
	programId: cls.program ?? "",
	academicYearId: cls.academicYear ?? "",
	cycleLevelId: cls.cycleLevelId ?? "",
	programOptionId: cls.programOptionId ?? "",
	semesterId: cls.semesterId ?? "",
	code: cls.code ?? "",
	name: cls.name ?? "",
	totalCredits: cls.totalCredits ?? 0,
});

export default function ClassDetailDetails() {
	const { t } = useTranslation();
	const { cls, refetch } = useClassContext();
	const queryClient = useQueryClient();
	const controller = useClassForm({ mode: "edit", values: toFormValues(cls) });
	const { form } = controller;

	useEffect(() => {
		form.reset(toFormValues(cls));
	}, [cls, form]);

	const update = useMutation({
		mutationFn: (data: ClassFormData) =>
			trpcClient.classes.update.mutate({ id: cls.id, ...toClassPayload(data) }),
		onSuccess: () => {
			toast.success(
				t("admin.classes.toast.updateSuccess", {
					defaultValue: "Class updated",
				}),
			);
			queryClient.invalidateQueries(
				trpc.classes.getById.queryOptions({ id: cls.id }),
			);
			refetch();
		},
		onError: (err: Error) => toast.error(err.message),
	});

	return (
		<Card>
			<CardContent className="pt-6">
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit((data) => update.mutate(data))}
						className="space-y-4"
					>
						<ClassFormFields
							controller={controller}
							fallbackCodes={{
								program: cls.programInfo?.code,
								cycleLevel: cls.cycleLevel?.code,
								programOption: cls.programOption?.code,
							}}
						/>
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
