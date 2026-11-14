import { FileSignature } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useSaveInstitutionMetadata } from "../hooks/use-institution-settings";
import type { DocumentParams } from "../types";

interface Props {
	institutionId: string;
	currentMetadata: Record<string, unknown>;
	initialParams: DocumentParams;
}

/** Signatory and city of generated documents, saved to the institution metadata. */
export function DocumentParamsCard({
	institutionId,
	currentMetadata,
	initialParams,
}: Props) {
	const { t } = useTranslation();
	const [params, setParams] = useState<DocumentParams>(initialParams);
	const saveMutation = useSaveInstitutionMetadata(
		institutionId,
		currentMetadata,
	);

	const update = (key: keyof DocumentParams, value: string) =>
		setParams((prev) => ({ ...prev, [key]: value }));

	const save = () =>
		saveMutation.mutate({
			document_params: {
				signatoryName: params.signatoryName || undefined,
				signatoryTitle: params.signatoryTitle || undefined,
				city: params.city || undefined,
			},
		});

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<FileSignature className="h-5 w-5" />
					{t("admin.institution.sections.documentParams", {
						defaultValue: "Document Generation",
					})}
				</CardTitle>
				<CardDescription>
					{t("admin.institution.sections.documentParamsHint", {
						defaultValue:
							"Signatory and city used on generated diplomas, attestations and transcripts. Automatically synced to Diplomation.",
					})}
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid gap-4 md:grid-cols-2">
					<div className="space-y-1.5">
						<label className="font-medium text-sm">
							{t("admin.institution.form.signatoryName", {
								defaultValue: "Signatory name",
							})}
						</label>
						<Input
							value={params.signatoryName ?? ""}
							onChange={(e) => update("signatoryName", e.target.value)}
							placeholder="Dr. Jean DUPONT"
						/>
					</div>
					<div className="space-y-1.5">
						<label className="font-medium text-sm">
							{t("admin.institution.form.signatoryTitle", {
								defaultValue: "Signatory title",
							})}
						</label>
						<Input
							value={params.signatoryTitle ?? ""}
							onChange={(e) => update("signatoryTitle", e.target.value)}
							placeholder="Directeur Général"
						/>
					</div>
				</div>
				<div className="max-w-sm space-y-1.5">
					<label className="font-medium text-sm">
						{t("admin.institution.form.city", {
							defaultValue: "City (for document date line)",
						})}
					</label>
					<Input
						value={params.city ?? ""}
						onChange={(e) => update("city", e.target.value)}
						placeholder="Yaoundé"
					/>
				</div>
				<div className="flex justify-end">
					<Button
						type="button"
						disabled={saveMutation.isPending}
						onClick={save}
					>
						{saveMutation.isPending && <Spinner className="mr-2 h-4 w-4" />}
						{t("common.actions.save")}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
