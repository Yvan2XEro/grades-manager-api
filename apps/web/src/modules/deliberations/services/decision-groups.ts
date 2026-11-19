/** Counts of the four groups the jury's final decisions split a class into. */
export interface DecisionGroups {
	/** Admitted or compensated: promoted, or graduated on the last level. */
	admitted: number;
	/** Repeating, deferred included (the jury page treats deferred as repeating). */
	repeat: number;
	/** Deferred students, part of `repeat`. */
	deferred: number;
	excluded: number;
	/** No final decision yet (pending, incomplete results). */
	undecided: number;
}

export function decisionGroups(
	results: ReadonlyArray<{ finalDecision?: string | null }>,
): DecisionGroups {
	const groups: DecisionGroups = {
		admitted: 0,
		repeat: 0,
		deferred: 0,
		excluded: 0,
		undecided: 0,
	};
	for (const { finalDecision } of results) {
		if (finalDecision === "admitted" || finalDecision === "compensated")
			groups.admitted += 1;
		else if (finalDecision === "repeat") groups.repeat += 1;
		else if (finalDecision === "deferred") {
			groups.repeat += 1;
			groups.deferred += 1;
		} else if (finalDecision === "excluded") groups.excluded += 1;
		else groups.undecided += 1;
	}
	return groups;
}
