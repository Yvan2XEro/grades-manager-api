import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";

/** Query key of the study cycles list shared by the program forms. */
export const STUDY_CYCLES_SELECT_KEY = ["study-cycles-select"];

export type StudyCycleOption = { id: string; code: string; name: string };
export type StudyCyclesSelect = { items: StudyCycleOption[] };

export const fetchStudyCyclesSelect = (): Promise<StudyCyclesSelect> =>
	trpcClient.studyCycles.listCycles.query({});

/** Study cycles feeding the program selects (shared cache key). */
export function useStudyCycles() {
	return useQuery({
		queryKey: STUDY_CYCLES_SELECT_KEY,
		queryFn: fetchStudyCyclesSelect,
	});
}
