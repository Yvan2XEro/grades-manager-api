import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";

export type SubmitDocumentInput = {
	applicationId: string;
	requirementId: string;
	code: string;
	label: string;
	fileName: string;
	fileUrl: string;
};

/** Public status of an application by reference code, and its document submission. */
export function useApplicationStatus(normalizedRef: string) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const statusQuery = useQuery({
		...trpc.admissions.getStatus.queryOptions(
			{ referenceCode: normalizedRef },
			{ enabled: normalizedRef.length > 0 },
		),
	});

	const submitDocument = useMutation({
		mutationFn: (input: SubmitDocumentInput) =>
			trpcClient.admissions.submitDocument.mutate(input),
		onSuccess: () => {
			toast.success(t("admissions.status.documentSubmitted"));
			queryClient.invalidateQueries(
				trpc.admissions.getStatus.queryKey({ referenceCode: normalizedRef }),
			);
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const application = statusQuery.data?.application;
	const checklist = statusQuery.data?.checklist;

	const statusVariant = useMemo(():
		| "success"
		| "destructive"
		| "warning"
		| "info" => {
		switch (application?.status) {
			case "accepted":
				return "success";
			case "rejected":
				return "destructive";
			case "waitlisted":
				return "warning";
			default:
				return "info";
		}
	}, [application?.status]);

	return { statusQuery, application, checklist, statusVariant, submitDocument };
}
