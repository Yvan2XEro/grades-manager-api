import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";
import {
	type InstitutionFormValues,
	toInstitutionPayload,
} from "./use-institution-form";

/** The institution of the current organization. */
export function useCurrentInstitution() {
	return useQuery(trpc.institutions.get.queryOptions());
}

/** Saves the settings page form (the two "system" ids are managed elsewhere). */
export function useUpsertInstitution(id: string | undefined) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			defaultAcademicYearId: _year,
			registrationFormatId: _format,
			...values
		}: InstitutionFormValues) =>
			trpcClient.institutions.upsert.mutate({
				...toInstitutionPayload(values),
				id,
			}),
		onSuccess: (savedInstitution) => {
			toast.success(
				t("admin.institution.toast.saved", {
					defaultValue: "Institution saved",
				}),
			);
			// Update the cache directly with the saved institution instead of
			// refetching — getFirst() could return the parent institution if it
			// was created earlier, overwriting the form with the wrong data.
			if (savedInstitution) {
				queryClient.setQueryData(
					trpc.institutions.get.queryKey(),
					savedInstitution,
				);
			}
		},
		onError: (error: Error) => toast.error(error.message),
	});
}

/** Saves one key of the institution `metadata` (document params, excuse policy…). */
export function useSaveInstitutionMetadata(
	institutionId: string,
	currentMetadata: Record<string, unknown>,
) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (patch: Record<string, unknown>) =>
			trpcClient.institutions.update.mutate({
				id: institutionId,
				data: { metadata: { ...currentMetadata, ...patch } },
			}),
		onSuccess: () => {
			toast.success(
				t("admin.institution.toast.saved", {
					defaultValue: "Institution saved",
				}),
			);
			queryClient.invalidateQueries({
				queryKey: trpc.institutions.get.queryKey(),
			});
		},
		onError: (error: Error) => toast.error(error.message),
	});
}
