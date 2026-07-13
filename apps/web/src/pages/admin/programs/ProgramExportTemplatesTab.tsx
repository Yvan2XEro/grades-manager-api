import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";
import { useProgramContext } from "./ProgramContext";

type ExportTemplateType =
	| "pv"
	| "evaluation"
	| "ec"
	| "ue"
	| "deliberation"
	| "diploma"
	| "transcript"
	| "attestation"
	| "enrollment_certificate"
	| "student_list"
	| "payment_order"
	| "payment_receipt"
	| "financial_clearance";

const ALL_TYPES: ExportTemplateType[] = [
	"diploma",
	"transcript",
	"attestation",
	"enrollment_certificate",
	"student_list",
	"pv",
	"evaluation",
	"ec",
	"ue",
	"deliberation",
	"payment_order",
	"payment_receipt",
	"financial_clearance",
];

const TYPE_LABELS: Record<ExportTemplateType, string> = {
	diploma: "Diplôme",
	transcript: "Relevé de notes",
	attestation: "Attestation",
	enrollment_certificate: "Certificat de scolarité",
	student_list: "Liste d'étudiants",
	pv: "Procès-verbal",
	evaluation: "Publication d'évaluation",
	ec: "Publication d'EC",
	ue: "Publication d'UE",
	deliberation: "Délibération",
	payment_order: "Ordre de paiement",
	payment_receipt: "Reçu de paiement",
	financial_clearance: "Quitus financier",
};

export default function ProgramExportTemplatesTab() {
	const { t } = useTranslation();
	const { programId } = useParams<{ programId: string }>();
	const { refetch } = useProgramContext();
	const queryClient = useQueryClient();

	const { data: templatesData } = useQuery(
		trpc.exportTemplates.list.queryOptions({ limit: 100 }),
	);
	const availableTemplates = templatesData?.items ?? [];

	const { data: existingAssignments } = useQuery(
		trpc.programs.listExportTemplates.queryOptions({ programId: programId! }),
	);

	const [selections, setSelections] = useState<Record<string, string>>({});

	useEffect(() => {
		if (existingAssignments) {
			const map: Record<string, string> = {};
			for (const et of existingAssignments) {
				map[et.templateType] = et.templateId;
			}
			setSelections(map);
		}
	}, [existingAssignments]);

	const setMutation = useMutation({
		mutationFn: () =>
			trpcClient.programs.setExportTemplates.mutate({
				programId: programId!,
				templates: Object.entries(selections)
					.filter(([, templateId]) => templateId && templateId !== "none")
					.map(([templateType, templateId]) => ({
						templateType: templateType as ExportTemplateType,
						templateId,
					})),
			}),
		onSuccess: () => {
			toast.success(
				t("admin.programs.toast.updateSuccess", {
					defaultValue: "Templates saved",
				}),
			);
			queryClient.invalidateQueries(
				trpc.programs.listExportTemplates.queryKey({ programId: programId! }),
			);
			refetch();
		},
		onError: (err: Error) => toast.error(err.message),
	});

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle>
					{t("programs.hub.tabs.templates", {
						defaultValue: "Export Templates",
					})}
				</CardTitle>
				<Button
					onClick={() => setMutation.mutate()}
					disabled={setMutation.isPending}
				>
					{setMutation.isPending
						? t("common.actions.saving", { defaultValue: "Saving..." })
						: t("common.actions.saveChanges")}
				</Button>
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					{ALL_TYPES.map((type) => {
						const templatesForType = availableTemplates.filter(
							(tpl) => tpl.type === type,
						);
						return (
							<div
								key={type}
								className="flex items-center justify-between gap-4"
							>
								<span className="min-w-0 shrink-0 font-medium text-sm">
									{TYPE_LABELS[type]}
								</span>
								<Select
									value={selections[type] ?? "none"}
									onValueChange={(val) =>
										setSelections((prev) => ({ ...prev, [type]: val }))
									}
								>
									<SelectTrigger className="w-64">
										<SelectValue
											placeholder={t("common.none", {
												defaultValue: "None",
											})}
										/>
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="none">
											{t("common.none", { defaultValue: "None" })}
										</SelectItem>
										{templatesForType.map((tpl) => (
											<SelectItem key={tpl.id} value={tpl.id}>
												{tpl.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						);
					})}
				</div>
			</CardContent>
		</Card>
	);
}
