import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";

export interface ScopeOption {
	id: string;
	label: string;
}

/**
 * Programs and cycle levels a deliberation rule can be limited to, with a
 * label for each (levels are prefixed with their cycle: "Licence · L2").
 */
export function useRuleScopeOptions() {
	const programsQuery = useQuery({
		queryKey: ["deliberation-rule-scope", "programs"],
		queryFn: async () => {
			const { items } = await trpcClient.programs.list.query({ limit: 100 });
			return items
				.map((p): ScopeOption => ({ id: p.id, label: p.name }))
				.sort((a, b) => a.label.localeCompare(b.label));
		},
		staleTime: 5 * 60_000,
	});
	const levelsQuery = useQuery({
		queryKey: ["deliberation-rule-scope", "levels"],
		queryFn: async () => {
			const { items: cycles } = await trpcClient.studyCycles.listCycles.query({
				limit: 100,
			});
			const perCycle = await Promise.all(
				cycles.map(async (cycle) => {
					const levels = await trpcClient.studyCycles.listLevels.query({
						cycleId: cycle.id,
					});
					return levels.map(
						(level): ScopeOption => ({
							id: level.id,
							label: `${cycle.name} · ${level.name}`,
						}),
					);
				}),
			);
			return perCycle.flat();
		},
		staleTime: 5 * 60_000,
	});
	const programs = programsQuery.data ?? [];
	const levels = levelsQuery.data ?? [];
	return {
		programs,
		levels,
		programLabel: (id: string) => programs.find((p) => p.id === id)?.label,
		levelLabel: (id: string) => levels.find((l) => l.id === id)?.label,
	};
}
