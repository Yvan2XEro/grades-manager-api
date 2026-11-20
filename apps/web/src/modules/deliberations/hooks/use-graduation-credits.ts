import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";

/**
 * Cycle credits of a last-level jury's admitted students against the
 * cycle's required credits (graduation check before promoting).
 */
export function useGraduationCredits(deliberationId: string, enabled: boolean) {
	return useQuery({
		...trpc.classes.graduationCredits.queryOptions({ deliberationId }),
		enabled,
	});
}
