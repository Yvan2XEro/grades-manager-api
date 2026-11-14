import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { trpc, trpcClient } from "@/utils/trpc";
import { DEFAULT_RANGES, hasDuplicateMin } from "../services/grade-scale";
import type { MentionRange } from "../types";

export const INSTITUTION_SCOPE = "__institution__";

/**
 * Grade scale of the institution or of one program (`scopeId`): thresholds
 * and mention ranges edited locally, then saved at once.
 */
export function useGradeScale() {
	const queryClient = useQueryClient();
	const [scopeId, setScopeId] = useState<string>(INSTITUTION_SCOPE);
	const programId = scopeId === INSTITUTION_SCOPE ? null : scopeId;

	const { data: programs } = useQuery(trpc.programs.list.queryOptions({}));
	const { data: scale, isLoading } = useQuery(
		trpc.gradeScales.get.queryOptions({ programId }),
	);

	const [passThreshold, setPassThreshold] = useState(10);
	const [compensationThreshold, setCompensationThreshold] = useState(8);
	const [ranges, setRanges] = useState<MentionRange[]>(DEFAULT_RANGES);

	useEffect(() => {
		if (scale) {
			setPassThreshold(Number(scale.passThreshold));
			setCompensationThreshold(Number(scale.compensationThreshold));
			if (scale.mentionRanges?.length) setRanges(scale.mentionRanges);
		} else {
			setPassThreshold(10);
			setCompensationThreshold(8);
			setRanges(DEFAULT_RANGES);
		}
	}, [scale, scopeId]);

	const saveMutation = useMutation({
		mutationFn: () =>
			trpcClient.gradeScales.upsert.mutate({
				programId,
				passThreshold,
				compensationThreshold,
				mentionRanges: ranges,
			}),
		onSuccess: () => {
			queryClient.invalidateQueries(
				trpc.gradeScales.get.queryKey({ programId }),
			);
		},
	});

	const rangeActions = {
		update: (
			index: number,
			field: keyof MentionRange,
			value: string | number,
		) =>
			setRanges((prev) =>
				prev.map((r, i) =>
					i === index
						? { ...r, [field]: field === "min" ? Number(value) : value }
						: r,
				),
			),
		add: () =>
			setRanges((prev) => [
				...prev,
				{
					key: `mention_${prev.length + 1}`,
					label: "",
					labelEn: "",
					gradeLetter: "",
					min: 0,
				},
			]),
		remove: (index: number) =>
			setRanges((prev) => prev.filter((_, i) => i !== index)),
	};

	const hasOverlap = useMemo(() => hasDuplicateMin(ranges), [ranges]);

	return {
		scopeId,
		setScopeId,
		programs: programs?.items ?? [],
		isLoading,
		isInherited: programId !== null && !scale,
		passThreshold,
		setPassThreshold,
		compensationThreshold,
		setCompensationThreshold,
		ranges,
		rangeActions,
		hasOverlap,
		saveMutation,
	};
}
