import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";

/** Options (tracks) of a program. */
export function useProgramOptions(programId: string) {
	const query = useQuery(
		trpc.programOptions.list.queryOptions({ programId, limit: 100 }),
	);
	return { ...query, options: query.data?.items ?? [] };
}

/** Deletes a program option and refreshes the program's options. */
export function useDeleteProgramOption(programId: string) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => trpcClient.programOptions.delete.mutate({ id }),
		onSuccess: () => {
			toast.success(
				t("admin.programs.options.toast.delete", {
					defaultValue: "Option deleted",
				}),
			);
			queryClient.invalidateQueries(
				trpc.programOptions.list.queryKey({ programId, limit: 100 }),
			);
		},
		onError: (err: Error) => toast.error(err.message),
	});
}
