import { Landmark } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Spinner } from "@/components/ui/spinner";
import { AttendanceExcusePolicyCard } from "../components/attendance-excuse-policy-card";
import { DocumentParamsCard } from "../components/document-params-card";
import { InstitutionFormFields } from "../components/institution-form-fields";
import { InstitutionSystemSummary } from "../components/institution-system-fields";
import {
	type InstitutionFormValues,
	institutionDefaultValues,
	institutionToFormValues,
	useInstitutionForm,
} from "../hooks/use-institution-form";
import {
	useCurrentInstitution,
	useUpsertInstitution,
} from "../hooks/use-institution-settings";
import type {
	AttendanceExcusePolicy,
	DocumentParams,
	Institution,
} from "../types";

const defaultValues: InstitutionFormValues = {
	...institutionDefaultValues,
	type: "institution",
};

export default function InstitutionSettingsPage() {
	const { t } = useTranslation();
	const institutionQuery = useCurrentInstitution();
	const institution = institutionQuery.data;
	const { form, institutions } = useInstitutionForm({ defaultValues });
	const upsertMutation = useUpsertInstitution(institution?.id);

	useEffect(() => {
		if (institution) {
			form.reset(institutionToFormValues(institution as Institution));
		}
	}, [institution, form]);

	const metadata = (institution?.metadata ?? {}) as Record<string, unknown> & {
		document_params?: DocumentParams;
		attendance_excuse_policy?: AttendanceExcusePolicy;
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/8">
					<Landmark className="h-5 w-5 text-primary" />
				</div>
				<div>
					<h1 className="text-foreground">
						{t("admin.institution.title", {
							defaultValue: "Institution settings",
						})}
					</h1>
					<p className="text-muted-foreground text-xs">
						{t("admin.institution.subtitle", {
							defaultValue:
								"Configure the bilingual identity, branding, and official contacts for generated documents.",
						})}
					</p>
				</div>
			</div>

			{institutionQuery.isLoading ? (
				<div className="flex h-40 items-center justify-center">
					<Spinner className="h-8 w-8" />
				</div>
			) : (
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit((values) =>
							upsertMutation.mutate(values),
						)}
						className="space-y-6"
					>
						<InstitutionFormFields
							form={form}
							variant="page"
							institutions={institutions}
							currentId={institution?.id}
							system={<InstitutionSystemSummary />}
						/>

						{/* Save Bar */}
						<div className="sticky bottom-4 z-10 flex justify-end gap-3 rounded-lg border bg-card/95 px-6 py-4 shadow-lg backdrop-blur-sm">
							<Button
								type="button"
								variant="outline"
								onClick={() => form.reset(defaultValues)}
							>
								{t("common.actions.reset")}
							</Button>
							<Button type="submit" disabled={upsertMutation.isPending}>
								{upsertMutation.isPending && (
									<Spinner className="mr-2 h-4 w-4" />
								)}
								{t("admin.institution.actions.save")}
							</Button>
						</div>
					</form>
				</Form>
			)}

			{/* Document generation params — separate forms saved to metadata */}
			{!institutionQuery.isLoading && institution && (
				<>
					<DocumentParamsCard
						institutionId={institution.id}
						currentMetadata={metadata}
						initialParams={metadata.document_params ?? {}}
					/>
					<AttendanceExcusePolicyCard
						institutionId={institution.id}
						currentMetadata={metadata}
						initialPolicy={metadata.attendance_excuse_policy ?? {}}
					/>
				</>
			)}
		</div>
	);
}
