import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";
import type { ExportTemplateType } from "../types";

/** Document types a program can bind a template to, in display order. */
export const EXPORT_TEMPLATE_TYPES: ExportTemplateType[] = [
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

export const EXPORT_TEMPLATE_TYPE_LABELS: Record<ExportTemplateType, string> = {
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

/**
 * Template chosen per document type for a program (`"none"` = default), the
 * available templates and the save mutation.
 */
export function useProgramExportTemplates(
	programId: string,
	refetch: () => void,
) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	const { data: templatesData } = useQuery(
		trpc.exportTemplates.list.queryOptions({ limit: 100 }),
	);
	const { data: existingAssignments } = useQuery(
		trpc.programs.listExportTemplates.queryOptions({ programId }),
	);

	const [selections, setSelections] = useState<Record<string, string>>({});
	const initialized = useRef(false);

	useEffect(() => {
		if (existingAssignments && !initialized.current) {
			initialized.current = true;
			const map: Record<string, string> = {};
			for (const et of existingAssignments) {
				map[et.templateType] = et.templateId;
			}
			setSelections(map);
		}
	}, [existingAssignments]);

	const select = (type: ExportTemplateType, templateId: string) =>
		setSelections((prev) => ({ ...prev, [type]: templateId }));

	const save = useMutation({
		mutationFn: () =>
			trpcClient.programs.setExportTemplates.mutate({
				programId,
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
				trpc.programs.listExportTemplates.queryKey({ programId }),
			);
			refetch();
		},
		onError: (err: Error) => toast.error(err.message),
	});

	return {
		templates: templatesData?.items ?? [],
		selections,
		select,
		save,
	};
}
