import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { trpc, trpcClient } from "@/utils/trpc";

/** Progress of the guided import (foundation steps and academic years). */
export function useImportOverview() {
	return useQuery(trpc.dataImport.overview.queryOptions());
}

/** Marks a step as not applicable to the institution, or applicable again. */
export function useSkipStep() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: { step: string; skipped: boolean }) =>
			trpcClient.dataImport.setStepSkipped.mutate(input),
		onSuccess: () =>
			queryClient.invalidateQueries(trpc.dataImport.overview.queryFilter()),
	});
}
