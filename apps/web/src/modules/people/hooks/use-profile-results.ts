import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { type RouterOutputs, trpcClient } from "@/utils/trpc";

export type ProfileResults = RouterOutputs["profiles"]["results"];
export type ProfileYearResults = NonNullable<ProfileResults["results"]>;

/**
 * A student's results for one academic year (the year's closed jury, else
 * the live marks). Without a year, the server picks the latest year with a
 * jury, else with marks.
 */
export function useProfileResults(profileId: string, academicYearId?: string) {
	return useQuery({
		queryKey: ["profiles", profileId, "results", academicYearId ?? null],
		queryFn: () =>
			trpcClient.profiles.results.query({ profileId, academicYearId }),
		placeholderData: keepPreviousData,
	});
}
