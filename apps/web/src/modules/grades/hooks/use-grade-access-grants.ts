import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";
import type { GradeAccessGrantRow } from "../types";

/** Profiles allowed to edit grades of every exam. */
export function useGradeAccessGrants() {
	const query = useQuery({
		queryKey: ["gradeAccessGrants"],
		queryFn: () => trpcClient.gradeAccessGrants.list.query(),
	});
	return {
		...query,
		grants: (Array.isArray(query.data)
			? query.data
			: []) as unknown as GradeAccessGrantRow[],
	};
}

export function useRevokeGradeAccess() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) =>
			trpcClient.gradeAccessGrants.revoke.mutate({ id }),
		onSuccess: () => {
			toast.success(t("admin.gradeAccessGrants.toast.revoked"));
			queryClient.invalidateQueries({ queryKey: ["gradeAccessGrants"] });
		},
		onError: (err) => toast.error((err as Error).message),
	});
}
